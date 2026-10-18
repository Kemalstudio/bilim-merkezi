import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'api/api_client.dart';
import 'api/models.dart';
import 'i18n/strings.dart';
import 'notifications.dart';
import 'storage.dart';

/// Opened in main() before the first frame and injected with an override.
final storageProvider = Provider<AppStorage>((ref) => throw UnimplementedError('storageProvider is overridden in main'));

// ── preferences ─────────────────────────────────────────────────────────────

class Preferences {
  const Preferences({required this.locale, required this.themeMode});
  final String locale;
  final ThemeMode themeMode;
}

class PreferencesNotifier extends Notifier<Preferences> {
  @override
  Preferences build() {
    final storage = ref.read(storageProvider);
    final system = WidgetsBinding.instance.platformDispatcher.locale.languageCode;
    return Preferences(
      // First launch follows the phone: Turkmen or English phones get their language, others Russian.
      locale: storage.locale ?? (S.languages.containsKey(system) ? system : 'ru'),
      themeMode: switch (storage.themeMode) { 'light' => ThemeMode.light, 'dark' => ThemeMode.dark, _ => ThemeMode.system },
    );
  }

  Future<void> setLocale(String code) async {
    state = Preferences(locale: code, themeMode: state.themeMode);
    await ref.read(storageProvider).setLocale(code);
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = Preferences(locale: state.locale, themeMode: mode);
    await ref.read(storageProvider).setThemeMode(mode.name);
  }
}

final preferencesProvider = NotifierProvider<PreferencesNotifier, Preferences>(PreferencesNotifier.new);

/// The interface texts in the chosen language.
final stringsProvider = Provider<S>((ref) => S.of(ref.watch(preferencesProvider).locale));

// ── session ─────────────────────────────────────────────────────────────────

enum SessionStatus { loading, signedOut, signedIn }

class Session {
  const Session(this.status, {this.token, this.me, this.expired = false});
  final SessionStatus status;
  final String? token;
  final Me? me;

  /// Signed out by the server (password reset, sign-out elsewhere), not by the parent.
  final bool expired;
}

class SessionNotifier extends Notifier<Session> {
  @override
  Session build() {
    _restore();
    return const Session(SessionStatus.loading);
  }

  Future<void> _restore() async {
    final token = await ref.read(storageProvider).readToken();
    if (token == null) {
      state = const Session(SessionStatus.signedOut);
      return;
    }
    state = Session(SessionStatus.signedIn, token: token);
    // The profile catches up in the background; a dead token signs out through onUnauthorized.
    try {
      updateMe(await ref.read(apiProvider).me());
    } catch (_) {}
  }

  Future<void> signedIn(AuthResult result) async {
    await ref.read(storageProvider).writeToken(result.token);
    state = Session(SessionStatus.signedIn, token: result.token, me: result.me);
  }

  void updateMe(Me me) => state = Session(state.status, token: state.token, me: me);

  Future<void> signOut() async {
    if (state.token != null) {
      // Best effort: the phone forgets the token either way.
      try {
        await ref.read(apiProvider).logout();
      } catch (_) {}
    }
    await ref.read(storageProvider).clearToken();
    await AppNotifications.reset();
    state = const Session(SessionStatus.signedOut);
  }

  Future<void> expire() async {
    if (state.status != SessionStatus.signedIn) return;
    await ref.read(storageProvider).clearToken();
    await AppNotifications.reset();
    state = const Session(SessionStatus.signedOut, expired: true);
  }
}

final sessionProvider = NotifierProvider<SessionNotifier, Session>(SessionNotifier.new);

final apiProvider = Provider<ApiClient>((ref) {
  return ApiClient(
    token: () => ref.read(sessionProvider).token,
    locale: () => ref.read(preferencesProvider).locale,
    onUnauthorized: () => ref.read(sessionProvider.notifier).expire(),
    offlineText: () => ref.read(stringsProvider).offline,
  );
});

// ── data ────────────────────────────────────────────────────────────────────

final dashboardProvider = FutureProvider.autoDispose<Dashboard>((ref) async {
  final dashboard = await ref.watch(apiProvider).dashboard();
  ref.read(sessionProvider.notifier).updateMe(dashboard.me);
  return dashboard;
});

final childrenProvider = FutureProvider.autoDispose<List<ChildSummary>>((ref) => ref.watch(apiProvider).children());

final childProvider =
    FutureProvider.autoDispose.family<ChildDetail, String>((ref, id) => ref.watch(apiProvider).child(id));

final infoProvider = FutureProvider<CenterInfo>((ref) => ref.watch(apiProvider).info());

final catalogProvider = FutureProvider<Catalog>((ref) => ref.watch(apiProvider).catalog());

final courseProvider =
    FutureProvider.autoDispose.family<CourseDetail, String>((ref, slug) => ref.watch(apiProvider).course(slug));

final enrollmentsProvider = FutureProvider.autoDispose<List<Enrollment>>((ref) => ref.watch(apiProvider).enrollments());

final scheduleProvider = FutureProvider.autoDispose<List<Lesson>>((ref) => ref.watch(apiProvider).schedule(days: 45));

final feedProvider = FutureProvider.autoDispose<List<FeedItem>>((ref) => ref.watch(apiProvider).feed());

/// When the parent last opened the feed; newer items show a dot on the bell.
class FeedSeenNotifier extends Notifier<DateTime> {
  @override
  DateTime build() => ref.read(storageProvider).feedSeenAt;

  Future<void> markSeen() async {
    state = DateTime.now();
    await ref.read(storageProvider).setFeedSeenAt(state);
  }
}

final feedSeenProvider = NotifierProvider<FeedSeenNotifier, DateTime>(FeedSeenNotifier.new);

// ── notifications ───────────────────────────────────────────────────────────

/// Which notifications the parent wants (all on until switched off).
class NotifyPrefsNotifier extends Notifier<Map<NotifyKind, bool>> {
  @override
  Map<NotifyKind, bool> build() {
    final storage = ref.read(storageProvider);
    return {for (final kind in NotifyKind.values) kind: storage.notify(kind)};
  }

  Future<void> set(NotifyKind kind, bool value) async {
    state = {...state, kind: value};
    await ref.read(storageProvider).setNotify(kind, value);
    // Reminders switched on or off take effect at once, not at the next background check.
    if (kind == NotifyKind.reminders) {
      final lessons = await ref.read(apiProvider).schedule(days: 14).catchError((_) => <Lesson>[]);
      await AppNotifications.scheduleReminders(lessons, ref.read(stringsProvider));
    }
  }
}

final notifyPrefsProvider = NotifierProvider<NotifyPrefsNotifier, Map<NotifyKind, bool>>(NotifyPrefsNotifier.new);

/// Whether the phone lets the app show notifications; re-read when the app comes back.
final notifyPermissionProvider = FutureProvider<bool>((ref) => AppNotifications.permitted());

/// After a change, everything that shows children, courses or lessons reloads.
void refreshAccountData(WidgetRef ref) {
  ref.invalidate(dashboardProvider);
  ref.invalidate(childrenProvider);
  ref.invalidate(childProvider);
  ref.invalidate(enrollmentsProvider);
  ref.invalidate(scheduleProvider);
  ref.invalidate(feedProvider);
}
