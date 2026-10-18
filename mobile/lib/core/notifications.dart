import 'dart:async';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/data/latest.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;
import 'package:workmanager/workmanager.dart';

import 'api/models.dart';
import 'config.dart';
import 'format.dart';
import 'i18n/strings.dart';

/*
 * Notifications without a push service: the app itself asks the server what is new.
 *
 *  • Updates (seat confirmed, payment awaited, new scores) come from the same /feed the bell
 *    shows. A background job checks it about every 15 minutes, even with the app closed, and
 *    whenever the app comes to the front; each feed item is announced once.
 *  • Lesson reminders need no server at all: the schedule is known, so the evening-before and
 *    hour-before reminders are set as alarms on the phone and fire even offline.
 *
 * Everything here also runs in the background isolate, so it reads its settings from
 * SharedPreferences and the token from the keystore rather than from Riverpod.
 */

const _syncTask = 'bilim-merkezi-sync';
const _tokenKey = 'session_token';

/// Which kinds of notifications the parent wants; all on by default.
enum NotifyKind {
  enrollments('notify_enrollments'),
  scores('notify_scores'),
  reminders('notify_reminders');

  const NotifyKind(this.key);
  final String key;

  bool enabledIn(SharedPreferences prefs) => prefs.getBool(key) ?? true;
}

/// The background job. Runs in its own isolate, started by Android's WorkManager.
@pragma('vm:entry-point')
void notificationsWorker() {
  Workmanager().executeTask((task, _) async {
    try {
      await AppNotifications.initPlugin();
      final token = await const FlutterSecureStorage().read(key: _tokenKey);
      if (token == null) return true;
      final prefs = await SharedPreferences.getInstance();
      await AppNotifications.sync(token: token, locale: prefs.getString('locale') ?? 'ru');
    } catch (error) {
      debugPrint('[notifications] background sync failed: $error');
    }
    // Never ask WorkManager to retry: the next periodic run comes soon anyway.
    return true;
  });
}

class AppNotifications {
  AppNotifications._();

  static final _plugin = FlutterLocalNotificationsPlugin();
  static bool _ready = false;

  /// Screens to open from tapped notifications ("/feed", "/schedule").
  static final taps = StreamController<String>.broadcast();

  /// The screen to open when the app was started by tapping a notification.
  static String? launchRoute;

  static AndroidFlutterLocalNotificationsPlugin? get _android =>
      _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();

  static Future<void> initPlugin() async {
    if (_ready) return;
    tz_data.initializeTimeZones();
    await _plugin.initialize(
      settings: const InitializationSettings(
        android: AndroidInitializationSettings('ic_notification'),
        iOS: DarwinInitializationSettings(
          requestAlertPermission: false,
          requestBadgePermission: false,
          requestSoundPermission: false,
        ),
      ),
      onDidReceiveNotificationResponse: (response) {
        final route = response.payload;
        if (route != null && route.isNotEmpty) taps.add(route);
      },
    );
    _ready = true;
  }

  /// Called once from main(): the plugin, the tap that started the app and the background job.
  static Future<void> init() async {
    await initPlugin();
    final launch = await _plugin.getNotificationAppLaunchDetails();
    if (launch?.didNotificationLaunchApp ?? false) launchRoute = launch!.notificationResponse?.payload;
    if (Platform.isAndroid) await Workmanager().initialize(notificationsWorker);
  }

  /// Starts (or keeps) the periodic check; called while a parent is signed in.
  static Future<void> startBackgroundSync() async {
    if (!Platform.isAndroid) return;
    await Workmanager().registerPeriodicTask(
      _syncTask,
      _syncTask,
      frequency: const Duration(minutes: 15),
      constraints: Constraints(networkType: NetworkType.connected),
      existingWorkPolicy: ExistingPeriodicWorkPolicy.keep,
    );
  }

  /// Signing out: nothing more for this account reaches the phone.
  static Future<void> reset() async {
    if (Platform.isAndroid) await Workmanager().cancelByUniqueName(_syncTask);
    await _plugin.cancelAll();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('notified_ids');
    await prefs.remove('notify_baseline');
    await prefs.remove('reminder_ids');
  }

  // ── permission ────────────────────────────────────────────────────────────

  static Future<bool> permitted() async {
    if (Platform.isAndroid) return await _android?.areNotificationsEnabled() ?? false;
    final ios = _plugin.resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>();
    final options = await ios?.checkPermissions();
    return options?.isEnabled ?? false;
  }

  /// Shows the system question (Android 13+, iOS). False when the parent said no.
  static Future<bool> requestPermission() async {
    if (Platform.isAndroid) return await _android?.requestNotificationsPermission() ?? false;
    final ios = _plugin.resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>();
    return await ios?.requestPermissions(alert: true, badge: true, sound: true) ?? false;
  }

  // ── sync ──────────────────────────────────────────────────────────────────

  /// Fetches the feed and the schedule, announces what is new and re-plans the reminders.
  /// Returns how many updates were new, so the open app can refresh its screens.
  static Future<int> sync({required String token, required String locale}) async {
    final dio = Dio(BaseOptions(
      baseUrl: '${AppConfig.apiUrl}/api/mobile/v1',
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 20),
      headers: {'Authorization': 'Bearer $token', 'X-Locale': locale},
    ));
    final s = S.of(locale);
    final prefs = await SharedPreferences.getInstance();
    // Another isolate (the app or the background job) may have written meanwhile.
    await prefs.reload();

    final responses = await Future.wait([
      dio.get<List<dynamic>>('/feed'),
      dio.get<List<dynamic>>('/schedule', queryParameters: {'days': 14}),
    ]);
    final feed = responses[0].data!.map((item) => FeedItem.fromJson(item as Map<String, dynamic>)).toList();
    final lessons = responses[1].data!.map((item) => Lesson.fromJson(item as Map<String, dynamic>)).toList();

    final fresh = await _announce(feed, prefs, s);
    await scheduleReminders(lessons, s, prefs);
    return fresh;
  }

  static NotifyKind? _kindOf(FeedItem item) => switch (item.type) {
        'enrollment_active' || 'awaiting_payment' => NotifyKind.enrollments,
        'exam_result' => NotifyKind.scores,
        // "Lesson soon" is covered by the reminders, timed to the minute.
        _ => null,
      };

  static Future<int> _announce(List<FeedItem> feed, SharedPreferences prefs, S s) async {
    final notified = (prefs.getStringList('notified_ids') ?? const <String>[]).toSet();
    final announceable = feed.where((item) => _kindOf(item) != null).toList();

    // The first check after signing in only remembers what is already there: a parent who
    // installs the app should not get a burst of old news.
    if (!(prefs.getBool('notify_baseline') ?? false)) {
      await prefs.setStringList('notified_ids', announceable.map((item) => item.id).toList());
      await prefs.setBool('notify_baseline', true);
      return 0;
    }

    final fresh = announceable.where((item) => !notified.contains(item.id)).toList();
    if (fresh.isEmpty) return 0;

    final wanted = fresh.where((item) => _kindOf(item)!.enabledIn(prefs)).toList();
    if (wanted.length > 3) {
      await _show(_stableId('summary-${DateTime.now().millisecondsSinceEpoch ~/ 60000}'), s.notifMany,
          s.notifManyBody.f({'n': wanted.length}), '/feed', reminder: false);
    } else {
      for (final item in wanted) {
        final (title, body) = _texts(item, s);
        await _show(_stableId(item.id), title, body, '/feed', reminder: false);
      }
    }

    // Remember the newest 200 ids: the feed itself never holds more than 30.
    final all = [...fresh.map((item) => item.id), ...notified];
    await prefs.setStringList('notified_ids', all.take(200).toList());
    return fresh.length;
  }

  static (String, String) _texts(FeedItem item, S s) {
    final who = [item.childName, item.courseTitle].whereType<String>().where((part) => part.isNotEmpty).join(' · ');
    return switch (item.type) {
      'exam_result' => (
          item.childName == null ? s.feedExamResult : s.notifNewScoresFor.f({'name': item.childName}),
          [
            s.feedExamBody.f({'exam': item.examName, 'score': item.score, 'max': item.maxScore}),
            if (item.courseTitle != null) item.courseTitle!,
          ].join(' · '),
        ),
      'awaiting_payment' => (s.feedAwaitingPayment, who),
      _ => (s.feedEnrollmentActive, who),
    };
  }

  // ── lesson reminders ──────────────────────────────────────────────────────

  /// Replaces the planned reminders with ones for these lessons: at 19:00 the evening before
  /// and an hour before the start. Also called by the schedule screens with fresh data.
  static Future<void> scheduleReminders(List<Lesson> lessons, S s, [SharedPreferences? preferences]) async {
    final prefs = preferences ?? await SharedPreferences.getInstance();
    for (final id in prefs.getStringList('reminder_ids') ?? const <String>[]) {
      await _plugin.cancel(id: int.parse(id));
    }
    if (!NotifyKind.reminders.enabledIn(prefs)) {
      await prefs.setStringList('reminder_ids', const []);
      return;
    }

    final exact = Platform.isAndroid && (await _android?.canScheduleExactNotifications() ?? false);
    final now = DateTime.now();
    final planned = <String>[];
    final upcoming = lessons.where((lesson) => lesson.startsAt.isAfter(now)).toList()
      ..sort((a, b) => a.startsAt.compareTo(b.startsAt));

    for (final lesson in upcoming.take(30)) {
      final start = lesson.startsAt;
      final body = [
        lesson.title,
        if (lesson.children.isNotEmpty) lesson.children.map((child) => child.firstName).join(', '),
        if (lesson.location != null) lesson.location!,
      ].join(' · ');

      final evening = DateTime(start.year, start.month, start.day - 1, 19);
      if (evening.isAfter(now) && start.difference(evening) > const Duration(hours: 3)) {
        final id = _stableId('${lesson.id}:evening');
        await _schedule(id, s.remindTomorrow.f({'time': time(start), 'course': lesson.courseTitle}), body, evening, exact);
        planned.add('$id');
      }
      final hourBefore = start.subtract(const Duration(hours: 1));
      if (hourBefore.isAfter(now)) {
        final id = _stableId('${lesson.id}:hour');
        await _schedule(id, s.remindSoon.f({'course': lesson.courseTitle}), body, hourBefore, exact);
        planned.add('$id');
      }
    }
    await prefs.setStringList('reminder_ids', planned);
  }

  // ── plumbing ──────────────────────────────────────────────────────────────

  static const _brand = Color(0xFF0B6A8F);

  static NotificationDetails _details(String body, {required bool reminder}) => NotificationDetails(
        android: AndroidNotificationDetails(
          reminder ? 'lesson_reminders' : 'updates',
          reminder ? S.ru.notifReminders : S.ru.notifTitle,
          channelDescription: reminder ? S.ru.notifRemindersHint : '${S.ru.notifEnrollments}, ${S.ru.notifScores.toLowerCase()}',
          importance: Importance.high,
          priority: Priority.high,
          color: _brand,
          category: reminder ? AndroidNotificationCategory.reminder : AndroidNotificationCategory.status,
          styleInformation: BigTextStyleInformation(body),
        ),
        iOS: const DarwinNotificationDetails(presentAlert: true, presentBadge: true, presentSound: true),
      );

  static Future<void> _show(int id, String title, String body, String route, {required bool reminder}) =>
      _plugin.show(id: id, title: title, body: body, notificationDetails: _details(body, reminder: reminder), payload: route);

  static Future<void> _schedule(int id, String title, String body, DateTime when, bool exact) => _plugin.zonedSchedule(
        id: id,
        title: title,
        body: body,
        scheduledDate: tz.TZDateTime.from(when, tz.UTC),
        notificationDetails: _details(body, reminder: true),
        androidScheduleMode: exact ? AndroidScheduleMode.exactAllowWhileIdle : AndroidScheduleMode.inexactAllowWhileIdle,
        payload: '/schedule',
      );

  /// The same id for the same item on every run (String.hashCode is not stable across runs).
  static int _stableId(String key) {
    var hash = 0x811c9dc5;
    for (final unit in key.codeUnits) {
      hash = ((hash ^ unit) * 0x01000193) & 0x7fffffff;
    }
    return hash;
  }
}
