import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/notifications.dart';
import 'core/state.dart';
import 'core/storage.dart';
import 'core/theme/theme.dart';
import 'router.dart';
import 'widgets/common.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    systemNavigationBarColor: Colors.transparent,
    statusBarColor: Colors.transparent,
  ));
  final (storage, _) = await (AppStorage.open(), AppNotifications.init().catchError((Object _) {})).wait;
  runApp(ProviderScope(
    overrides: [storageProvider.overrideWithValue(storage)],
    // A failed request shows its error with a "try again" button instead of retrying silently.
    retry: (_, _) => null,
    child: const BilimApp(),
  ));
}

class BilimApp extends ConsumerStatefulWidget {
  const BilimApp({super.key, this.notifications = true});

  /// Off in screen tests, where there is no phone to notify.
  final bool notifications;

  @override
  ConsumerState<BilimApp> createState() => _BilimAppState();
}

class _BilimAppState extends ConsumerState<BilimApp> {
  AppLifecycleListener? _lifecycle;
  StreamSubscription<String>? _taps;
  DateTime _lastSync = DateTime.fromMillisecondsSinceEpoch(0);

  @override
  void initState() {
    super.initState();
    if (!widget.notifications) return;
    _lifecycle = AppLifecycleListener(onResume: () {
      // The parent may have allowed notifications in the phone settings meanwhile.
      ref.invalidate(notifyPermissionProvider);
      _sync();
    });
    _taps = AppNotifications.taps.stream.listen(_open);

    ref.listenManual(sessionProvider.select((session) => session.status), (_, status) {
      if (status != SessionStatus.signedIn) return;
      AppNotifications.startBackgroundSync().catchError((Object _) {});
      _sync(force: true);
      final route = AppNotifications.launchRoute;
      if (route != null) {
        AppNotifications.launchRoute = null;
        // After the splash has handed over to the home screen.
        Future.delayed(const Duration(milliseconds: 400), () => _open(route));
      }
    }, fireImmediately: true);
  }

  @override
  void dispose() {
    _lifecycle?.dispose();
    _taps?.cancel();
    super.dispose();
  }

  /// Checks for news while the app is open, at most once a minute.
  Future<void> _sync({bool force = false}) async {
    final token = ref.read(sessionProvider).token;
    if (token == null) return;
    if (!force && DateTime.now().difference(_lastSync) < const Duration(minutes: 1)) return;
    _lastSync = DateTime.now();
    try {
      final fresh = await AppNotifications.sync(token: token, locale: ref.read(preferencesProvider).locale);
      if (fresh > 0) {
        ref.invalidate(dashboardProvider);
        ref.invalidate(feedProvider);
      }
    } catch (_) {
      // Offline or the server is away: the background job will try again.
    }
  }

  /// A tapped notification: reminders open the schedule tab, updates the feed.
  void _open(String route) {
    if (ref.read(sessionProvider).status != SessionStatus.signedIn) return;
    final router = ref.read(routerProvider);
    if (route == '/schedule' || route == '/home') {
      router.go(route);
    } else {
      router.push(route);
    }
  }

  @override
  Widget build(BuildContext context) {
    final prefs = ref.watch(preferencesProvider);
    final router = ref.watch(routerProvider);

    // A session ended by the server (password reset, signed out elsewhere) says so once.
    ref.listen(sessionProvider, (previous, next) {
      if (next.expired && previous?.expired != true) {
        final context = router.routerDelegate.navigatorKey.currentContext;
        if (context != null) toast(context, ref.read(stringsProvider).sessionEnded, error: true);
      }
    });

    return MaterialApp.router(
      title: 'Bilim Merkezi',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(Brightness.light),
      darkTheme: buildTheme(Brightness.dark),
      themeMode: prefs.themeMode,
      themeAnimationDuration: const Duration(milliseconds: 350),
      // Material has no Turkmen texts (date picker, buttons); Russian is the closest familiar one.
      locale: Locale(prefs.locale == 'tm' ? 'ru' : prefs.locale),
      supportedLocales: const [Locale('ru'), Locale('en')],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      routerConfig: router,
    );
  }
}
