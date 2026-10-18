import 'package:bootstrap_icons/bootstrap_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:skeletonizer/skeletonizer.dart';

import '../../core/api/models.dart';
import '../../core/i18n/strings.dart';
import '../../core/notifications.dart';
import '../../core/state.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/theme.dart';
import '../../widgets/common.dart';
import '../../widgets/tiles.dart';
import '../children/child_form.dart';

/// The parent's dashboard: greeting and numbers, children, next lessons, updates, enrollments.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final dashboard = ref.watch(dashboardProvider);

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(dashboardProvider.future),
        edgeOffset: MediaQuery.paddingOf(context).top,
        child: switch (dashboard) {
          AsyncValue(:final value?) => _Body(data: value, s: s),
          AsyncValue(:final error?) when !dashboard.isLoading => ListView(
            children: [
              SizedBox(height: MediaQuery.sizeOf(context).height * 0.2),
              ErrorState(error: error, s: s, onRetry: () => ref.invalidate(dashboardProvider)),
            ],
          ),
          _ => Skeletonizer(
            child: _Body(data: _placeholder, s: s),
          ),
        },
      ),
    );
  }
}

class _Body extends ConsumerWidget {
  const _Body({required this.data, required this.s});
  final Dashboard data;
  final S s;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final seenAt = ref.watch(feedSeenProvider);
    final unread = data.feed.where((item) => item.at.isAfter(seenAt)).length;
    var i = 0;

    return CustomScrollView(
      physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
      slivers: [
        SliverToBoxAdapter(
          child: _Hero(data: data, s: s, unread: unread),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 120),
          sliver: SliverList.list(
            children: [
              _NotifyPrompt(s: s),
              if (data.children.isEmpty)
                AppCard(
                  child: EmptyState(
                    compact: true,
                    icon: BootstrapIcons.person_plus,
                    title: s.noChildrenTitle,
                    text: s.noChildrenText,
                    action: s.addChild,
                    onAction: () => showChildForm(context, ref),
                  ),
                ).enter(i++)
              else ...[
                SectionHeader(s.myChildren, action: s.seeAll, onAction: () => context.go('/children')).enter(i++),
                SizedBox(
                  height: 212,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    clipBehavior: Clip.none,
                    itemCount: data.children.length + 1,
                    separatorBuilder: (_, _) => const SizedBox(width: 12),
                    itemBuilder: (context, index) {
                      if (index == data.children.length) return _AddChildCard(s: s);
                      final child = data.children[index];
                      return SizedBox(
                        width: 236,
                        child: ChildCard(child: child, s: s, onTap: () => context.push('/children/${child.id}')),
                      );
                    },
                  ),
                ).enter(i++),
              ],
              const SizedBox(height: 18),
              SectionHeader(
                s.upcoming,
                action: data.upcoming.isEmpty ? null : s.seeAll,
                onAction: () => context.go('/schedule'),
              ).enter(i++),
              if (data.upcoming.isEmpty)
                AppCard(
                  child: EmptyState(compact: true, icon: BootstrapIcons.calendar2_week, title: s.noLessonsTitle, text: s.noLessonsText),
                ).enter(i++)
              else
                for (final lesson in data.upcoming.take(3))
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: LessonTile(lesson: lesson, s: s),
                  ).enter(i++),
              const SizedBox(height: 18),
              SectionHeader(s.events, action: data.feed.isEmpty ? null : s.seeAll, onAction: () => context.push('/feed')).enter(i++),
              if (data.feed.isEmpty)
                AppCard(
                  child: EmptyState(compact: true, icon: BootstrapIcons.bell, title: s.feedEmptyTitle, text: s.feedEmptyText),
                ).enter(i++)
              else
                for (final item in data.feed.take(3))
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: FeedTile(item: item, s: s, unread: item.at.isAfter(seenAt)),
                  ).enter(i++),
              if (data.enrollments.isNotEmpty) ...[
                const SizedBox(height: 18),
                SectionHeader(s.recentEnrollments, action: s.seeAll, onAction: () => context.push('/enrollments')).enter(i++),
                for (final enrollment in data.enrollments.take(3))
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: EnrollmentTile(enrollment: enrollment, s: s, onTap: () => context.push('/courses/${enrollment.courseSlug}')),
                  ).enter(i++),
              ],
              const SizedBox(height: 8),
              Text(s.homeLead, textAlign: TextAlign.center, style: theme.textTheme.bodySmall),
            ],
          ),
        ),
      ],
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero({required this.data, required this.s, required this.unread});
  final Dashboard data;
  final S s;
  final int unread;

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 5) return s.night;
    if (hour < 12) return s.morning;
    if (hour < 18) return s.day;
    return s.evening;
  }

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final top = MediaQuery.paddingOf(context).top;
    final name = data.me.firstName;

    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        gradient: c.heroGradient,
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(32)),
        boxShadow: [
          BoxShadow(color: const Color(0xFF073B52).withValues(alpha: 0.25), blurRadius: 30, offset: const Offset(0, 14), spreadRadius: -12),
        ],
      ),
      child: Stack(
        children: [
          // The website hero's warm glow and thin orbit rings, cut to the panel's rounded shape.
          Positioned(
            right: -80,
            top: -70,
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [c.accent.withValues(alpha: 0.30), c.accent.withValues(alpha: 0)]),
              ),
            ),
          ),
          for (final (size, alpha) in [(220.0, 0.10), (330.0, 0.06)])
            Positioned(
              right: -size / 2 + 30,
              top: -size / 2 + 40,
              child: Container(
                width: size,
                height: size,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white.withValues(alpha: alpha)),
                ),
              ),
            ),
          Padding(
            padding: EdgeInsets.fromLTRB(20, top + 14, 20, 22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _greeting(),
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white.withValues(alpha: 0.72)),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            name.isEmpty ? s.appName : name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontFamily: displayFont,
                              fontWeight: FontWeight.w800,
                              fontSize: 27,
                              letterSpacing: -0.9,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                    _Bell(unread: unread),
                  ],
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    _Stat(value: data.stats.children, label: s.statChildren, icon: BootstrapIcons.people),
                    const SizedBox(width: 10),
                    _Stat(value: data.stats.activeCourses, label: s.statCourses, icon: BootstrapIcons.journal_bookmark),
                    const SizedBox(width: 10),
                    _Stat(
                      value: data.stats.awaitingPayment,
                      label: s.statAwaiting,
                      icon: BootstrapIcons.hourglass_split,
                      highlight: data.stats.awaitingPayment > 0,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms);
  }
}

class _Bell extends StatelessWidget {
  const _Bell({required this.unread});
  final int unread;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Pressable(
      onTap: () => context.push('/feed'),
      child: Container(
        width: 46,
        height: 46,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.13),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withValues(alpha: 0.16)),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            const Icon(BootstrapIcons.bell, color: Colors.white, size: 19),
            if (unread > 0)
              Positioned(
                top: 8,
                right: 8,
                child: Container(
                  constraints: const BoxConstraints(minWidth: 16),
                  height: 16,
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: c.accent, borderRadius: BorderRadius.circular(8)),
                  child: Text(
                    '$unread',
                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF241400)),
                  ),
                ).animate(onPlay: (controller) => controller.repeat(reverse: true)).scaleXY(begin: 1, end: 1.12, duration: 900.ms),
              ),
          ],
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label, required this.icon, this.highlight = false});
  final int value;
  final String label;
  final IconData icon;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Expanded(
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 12, 10, 12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: highlight ? 0.18 : 0.10),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: highlight ? c.accent.withValues(alpha: 0.6) : Colors.white.withValues(alpha: 0.12)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 15, color: highlight ? c.accentSoft : Colors.white70),
            const SizedBox(height: 8),
            TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: value.toDouble()),
              duration: const Duration(milliseconds: 700),
              curve: Curves.easeOutCubic,
              builder: (_, v, _) => Text(
                '${v.round()}',
                style: const TextStyle(fontFamily: displayFont, fontWeight: FontWeight.w800, fontSize: 22, height: 1, color: Colors.white),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 11, height: 1.2, fontWeight: FontWeight.w600, color: Colors.white.withValues(alpha: 0.72)),
            ),
          ],
        ),
      ),
    );
  }
}

class _AddChildCard extends ConsumerWidget {
  const _AddChildCard({required this.s});
  final S s;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.c;
    return Pressable(
      onTap: () => showChildForm(context, ref),
      child: Container(
        width: 120,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: c.brand.withValues(alpha: 0.35), width: 1.5),
          color: c.brand.withValues(alpha: 0.05),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            IconTile(BootstrapIcons.plus_lg, size: 46),
            const SizedBox(height: 10),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10),
              child: Text(
                s.addChild,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(color: c.brandInk),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Shape-alike data for the loading skeleton.
final _placeholder = Dashboard(
  me: Me(
    id: '',
    name: 'Bilim Merkezi',
    email: null,
    phone: null,
    phoneFormatted: null,
    hasPassword: true,
    image: null,
    createdAt: DateTime(2026),
  ),
  children: [
    for (var i = 0; i < 2; i++)
      ChildSummary(
        id: '$i',
        firstName: 'Aygul',
        lastName: 'Merkezi',
        birthDate: DateTime(2014),
        grade: 6,
        notes: null,
        avatarHue: 190,
        activeCourses: 2,
        latestExam: null,
        trend: null,
      ),
  ],
  upcoming: [
    for (var i = 0; i < 2; i++)
      Lesson(
        id: '$i',
        title: 'Lesson title placeholder',
        startsAt: DateTime.now().add(const Duration(days: 1)),
        endsAt: null,
        location: 'Ashgabat',
        courseId: '',
        courseSlug: '',
        courseTitle: 'Course title placeholder',
        categorySlug: 'math',
        children: const [],
      ),
  ],
  enrollments: const [],
  feed: const [],
  stats: DashboardStats(children: 0, activeCourses: 0, awaitingPayment: 0),
);

/// Asks for notifications in the app's own words first; the system question follows a tap on
/// "Allow", when the parent already knows why.
class _NotifyPrompt extends ConsumerStatefulWidget {
  const _NotifyPrompt({required this.s});
  final S s;

  @override
  ConsumerState<_NotifyPrompt> createState() => _NotifyPromptState();
}

class _NotifyPromptState extends ConsumerState<_NotifyPrompt> {
  late bool _dismissed = ref.read(storageProvider).notifyPromptDismissed;

  Future<void> _allow() async {
    await AppNotifications.requestPermission();
    ref.invalidate(notifyPermissionProvider);
  }

  Future<void> _close() async {
    setState(() => _dismissed = true);
    await ref.read(storageProvider).dismissNotifyPrompt();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final s = widget.s;
    final theme = Theme.of(context);
    final permitted = ref.watch(notifyPermissionProvider).value ?? true;
    final show = !permitted && !_dismissed;

    return AnimatedSize(
      duration: const Duration(milliseconds: 320),
      curve: Curves.easeOutCubic,
      child: !show
          ? const SizedBox(width: double.infinity)
          : Padding(
              padding: const EdgeInsets.only(bottom: 18),
              child: AppCard(
                padding: const EdgeInsets.fromLTRB(16, 16, 10, 16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                          width: 46,
                          height: 46,
                          decoration: BoxDecoration(gradient: c.heroGradient, borderRadius: BorderRadius.circular(15)),
                          child: const Icon(BootstrapIcons.bell_fill, color: Colors.white, size: 19),
                        )
                        .animate(onPlay: (controller) => controller.repeat(reverse: true))
                        .rotate(begin: -0.02, end: 0.02, duration: 700.ms, curve: Curves.easeInOut),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(s.notifPromptTitle, style: theme.textTheme.titleMedium),
                          const SizedBox(height: 4),
                          Text(s.notifPromptText, style: theme.textTheme.bodySmall?.copyWith(color: c.inkSoft, height: 1.4)),
                          const SizedBox(height: 12),
                          FilledButton.icon(
                            onPressed: _allow,
                            icon: const Icon(BootstrapIcons.bell, size: 15),
                            label: Text(s.notifAllow),
                            style: FilledButton.styleFrom(
                              minimumSize: const Size(0, 42),
                              padding: const EdgeInsets.symmetric(horizontal: 18),
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: _close,
                      visualDensity: VisualDensity.compact,
                      icon: Icon(BootstrapIcons.x_lg, size: 14, color: c.muted),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
