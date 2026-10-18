// Renders the real screens with real fonts to PNG files, for reviewing the design without a
// phone. Skipped unless PREVIEW_DIR points at a folder with API responses saved as JSON
// (dashboard.json, children.json, child.json, courses.json, course.json, schedule.json,
// feed.json, enrollments.json, me.json, info.json); the pictures are written to PREVIEW_DIR/shots.
//
//   PREVIEW_DIR=/path/to/fixtures flutter test test/screens_preview_test.dart
import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:bilim_merkezi/core/api/models.dart';
import 'package:bilim_merkezi/core/state.dart';
import 'package:bilim_merkezi/core/storage.dart';
import 'package:bilim_merkezi/main.dart';
import 'package:bilim_merkezi/router.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

final _dir = Platform.environment['PREVIEW_DIR'];

dynamic _json(String name) => jsonDecode(File('$_dir/$name.json').readAsStringSync());
Map<String, dynamic> _map(String name) => _json(name) as Map<String, dynamic>;
List<T> _list<T>(String name, T Function(Map<String, dynamic>) parse) =>
    (_json(name) as List).map((item) => parse(item as Map<String, dynamic>)).toList();

class _SignedIn extends SessionNotifier {
  @override
  Session build() => Session(SessionStatus.signedIn, token: 'preview', me: Me.fromJson(_map('me')));
}

class _SignedOut extends SessionNotifier {
  @override
  Session build() => const Session(SessionStatus.signedOut);
}

Future<void> _loadFonts() async {
  Future<void> family(String name, List<String> assets) async {
    final loader = FontLoader(name);
    for (final asset in assets) {
      loader.addFont(rootBundle.load(asset));
    }
    await loader.load();
  }

  await family('Manrope', [for (final w in [500, 600, 700, 800]) 'assets/fonts/Manrope-$w.ttf']);
  await family('Inter', [for (final w in [400, 500, 600, 700]) 'assets/fonts/Inter-$w.ttf']);
  await family('packages/bootstrap_icons/BootstrapIcons', ['packages/bootstrap_icons/fonts/BootstrapIcons.ttf']);
}

void main() {
  final boundary = GlobalKey();

  // Course and teacher photos go through an on-disk cache; give it a folder.
  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      const MethodChannel('plugins.flutter.io/path_provider'),
      (_) async => Directory.systemTemp.path,
    );
  });

  Future<void> shoot(WidgetTester tester, String name) async {
    // Entrance animations and counters finish; endless ones (shimmer, bell) keep going.
    for (var i = 0; i < 12; i++) {
      await tester.pump(const Duration(milliseconds: 150));
    }
    final render = boundary.currentContext!.findRenderObject()! as RenderRepaintBoundary;
    await tester.runAsync(() async {
      final image = await render.toImage(pixelRatio: tester.view.devicePixelRatio);
      final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
      final file = File('$_dir/shots/$name.png')..createSync(recursive: true);
      file.writeAsBytesSync(bytes!.buffer.asUint8List());
    });
  }

  Future<ProviderContainer> launch(WidgetTester tester, {bool signedIn = true, ThemeMode theme = ThemeMode.light}) async {
    tester.view.physicalSize = const Size(1080, 2340);
    tester.view.devicePixelRatio = 2.75;
    tester.view.padding = const FakeViewPadding(top: 66, bottom: 44);
    tester.view.viewPadding = const FakeViewPadding(top: 66, bottom: 44);
    addTearDown(tester.view.reset);

    SharedPreferences.setMockInitialValues({'locale': 'ru', 'theme': theme.name, 'notify_baseline': true});
    final storage = await tester.runAsync(AppStorage.open);
    final container = ProviderContainer(
      overrides: [
        storageProvider.overrideWithValue(storage!),
        sessionProvider.overrideWith(signedIn ? _SignedIn.new : _SignedOut.new),
        dashboardProvider.overrideWith((ref) async => Dashboard.fromJson(_map('dashboard'))),
        childrenProvider.overrideWith((ref) async => _list('children', ChildSummary.fromJson)),
        childProvider.overrideWith((ref, id) async => ChildDetail.fromJson(_map('child'))),
        catalogProvider.overrideWith((ref) async => Catalog.fromJson(_map('courses'))),
        courseProvider.overrideWith((ref, slug) async => CourseDetail.fromJson(_map('course'))),
        scheduleProvider.overrideWith((ref) async => _list('schedule', Lesson.fromJson)),
        feedProvider.overrideWith((ref) async => _list('feed', FeedItem.fromJson)),
        enrollmentsProvider.overrideWith((ref) async => _list('enrollments', Enrollment.fromJson)),
        infoProvider.overrideWith((ref) async => CenterInfo.fromJson(_map('info'))),
        notifyPermissionProvider.overrideWith((ref) async => false),
      ],
      retry: (_, _) => null,
    );
    addTearDown(container.dispose);

    await tester.pumpWidget(UncontrolledProviderScope(
      container: container,
      child: RepaintBoundary(key: boundary, child: const BilimApp(notifications: false)),
    ));
    await tester.pump(const Duration(milliseconds: 500));
    return container;
  }

  testWidgets('screens', (tester) async {
    await tester.runAsync(_loadFonts);
    final app = await launch(tester);
    final router = app.read(routerProvider);

    await shoot(tester, '01-home');
    await tester.drag(find.byType(CustomScrollView).first, const Offset(0, -700));
    await shoot(tester, '02-home-scrolled');
    router.go('/children');
    await shoot(tester, '03-children');
    router.push('/children/${_list('children', ChildSummary.fromJson).first.id}');
    await shoot(tester, '04-child');
    router.pop();
    router.go('/courses');
    await shoot(tester, '05-courses');
    router.push('/courses/${Catalog.fromJson(_map('courses')).courses.first.slug}');
    await shoot(tester, '06-course');
    router.pop();
    router.go('/schedule');
    await shoot(tester, '07-schedule');
    router.go('/profile');
    await shoot(tester, '08-profile');
    await tester.drag(find.byType(CustomScrollView).first, const Offset(0, -500));
    await shoot(tester, '09-profile-scrolled');
    router.push('/feed');
    await shoot(tester, '10-feed');
    await _drain(tester);
  }, skip: _dir == null);

  testWidgets('dark home', (tester) async {
    await tester.runAsync(_loadFonts);
    await launch(tester, theme: ThemeMode.dark);
    await shoot(tester, '11-home-dark');
    await _drain(tester);
  }, skip: _dir == null);

  testWidgets('welcome', (tester) async {
    await tester.runAsync(_loadFonts);
    final app = await launch(tester, signedIn: false);
    await shoot(tester, '12-welcome');
    app.read(routerProvider).push('/login');
    await shoot(tester, '13-login');
    await _drain(tester);
  }, skip: _dir == null);
}

/// Lets delayed work (tooltips hiding, debounces) finish before the test ends.
Future<void> _drain(WidgetTester tester) async {
  await tester.pumpWidget(const SizedBox());
  await tester.pump(const Duration(seconds: 5));
}
