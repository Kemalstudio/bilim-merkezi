import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/state.dart';
import 'features/auth/forgot_screen.dart';
import 'features/auth/login_screen.dart';
import 'features/auth/otp_screen.dart';
import 'features/auth/register_screen.dart';
import 'features/auth/welcome_screen.dart';
import 'features/children/child_detail_screen.dart';
import 'features/children/children_screen.dart';
import 'features/courses/course_detail_screen.dart';
import 'features/courses/courses_screen.dart';
import 'features/courses/enroll_screen.dart';
import 'features/home/feed_screen.dart';
import 'features/home/home_screen.dart';
import 'features/profile/enrollments_screen.dart';
import 'features/profile/profile_screen.dart';
import 'features/schedule/schedule_screen.dart';
import 'features/shell/main_shell.dart';
import 'widgets/splash.dart';

const _publicRoutes = {'/welcome', '/login', '/register', '/forgot', '/code'};

/// Rebuilds the router's redirect when the session changes (sign-in, sign-out, expiry).
class _SessionListenable extends ChangeNotifier {
  _SessionListenable(Ref ref) {
    ref.listen(sessionProvider.select((session) => session.status), (_, _) => notifyListeners());
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final rootKey = GlobalKey<NavigatorState>();
  final listenable = _SessionListenable(ref);
  ref.onDispose(listenable.dispose);

  return GoRouter(
    navigatorKey: rootKey,
    initialLocation: '/splash',
    refreshListenable: listenable,
    redirect: (context, state) {
      final status = ref.read(sessionProvider).status;
      final path = state.matchedLocation;
      if (status == SessionStatus.loading) return path == '/splash' ? null : '/splash';
      final public = _publicRoutes.contains(path);
      if (status == SessionStatus.signedOut) return public ? null : '/welcome';
      // Signed in: the sign-in screens and the splash lead home.
      if (public || path == '/splash') return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, _) => const SplashScreen()),
      GoRoute(path: '/welcome', builder: (_, _) => const WelcomeScreen()),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, _) => const RegisterScreen()),
      GoRoute(path: '/forgot', builder: (_, _) => const ForgotScreen()),
      GoRoute(path: '/code', builder: (_, state) => OtpScreen(args: state.extra! as OtpArgs)),
      StatefulShellRoute.indexedStack(
        builder: (_, _, shell) => MainShell(shell: shell),
        branches: [
          StatefulShellBranch(routes: [GoRoute(path: '/home', builder: (_, _) => const HomeScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/children', builder: (_, _) => const ChildrenScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/courses', builder: (_, _) => const CoursesScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/schedule', builder: (_, _) => const ScheduleScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/profile', builder: (_, _) => const ProfileScreen())]),
        ],
      ),
      // Detail screens cover the tab bar.
      GoRoute(
        parentNavigatorKey: rootKey,
        path: '/children/:id',
        builder: (_, state) => ChildDetailScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(
        parentNavigatorKey: rootKey,
        path: '/courses/:slug',
        builder: (_, state) => CourseDetailScreen(slug: state.pathParameters['slug']!),
        routes: [
          GoRoute(
            parentNavigatorKey: rootKey,
            path: 'enroll',
            builder: (_, state) => EnrollScreen(slug: state.pathParameters['slug']!),
          ),
        ],
      ),
      GoRoute(parentNavigatorKey: rootKey, path: '/feed', builder: (_, _) => const FeedScreen()),
      GoRoute(parentNavigatorKey: rootKey, path: '/enrollments', builder: (_, _) => const EnrollmentsScreen()),
    ],
  );
});
