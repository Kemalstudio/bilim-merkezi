import 'package:bootstrap_icons/bootstrap_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/models.dart';
import '../../core/config.dart';
import '../../core/format.dart';
import '../../core/i18n/strings.dart';
import '../../core/state.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/theme.dart';
import '../../widgets/common.dart';
import '../../widgets/page_header.dart';
import 'courses_screen.dart';

class CourseDetailScreen extends ConsumerWidget {
  const CourseDetailScreen({super.key, required this.slug});
  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final course = ref.watch(courseProvider(slug));

    return switch (course) {
      AsyncValue(:final value?) => _Body(course: value, s: s),
      AsyncValue(:final error?) when !course.isLoading => Scaffold(
        body: CustomScrollView(
          slivers: [
            const PageHeader(title: '', back: true),
            SliverFillRemaining(
              hasScrollBody: false,
              child: ErrorState(error: error, s: s, onRetry: () => ref.invalidate(courseProvider(slug))),
            ),
          ],
        ),
      ),
      _ => Scaffold(
        body: Column(
          children: [
            SkeletonBox(height: 210 + MediaQuery.paddingOf(context).top, radius: 0),
            const Padding(
              padding: EdgeInsets.fromLTRB(18, 22, 18, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SkeletonBox(height: 28, width: 240, radius: 10),
                  SizedBox(height: 12),
                  SkeletonBox(height: 54, radius: 12),
                  SizedBox(height: 18),
                  SkeletonBox(height: 120, radius: 24),
                ],
              ),
            ),
          ],
        ),
      ),
    };
  }
}

class _Body extends StatelessWidget {
  const _Body({required this.course, required this.s});
  final CourseDetail course;
  final S s;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final theme = Theme.of(context);
    final card = course.card;
    final top = MediaQuery.paddingOf(context).top;
    var i = 0;

    final facts = <(IconData, String)>[
      (BootstrapIcons.clock, s.hoursShort.f({'n': card.durationHours})),
      if (card.lessonsPerWeek > 0) (BootstrapIcons.calendar_week, s.perWeek.f({'n': card.lessonsPerWeek})),
      if (course.weeklyHoursMin > 0)
        (BootstrapIcons.hourglass_split, s.weeklyHours.f({'a': course.weeklyHoursMin, 'b': course.weeklyHoursMax})),
      if (card.ageMin != null && card.ageMax != null) (BootstrapIcons.people, s.ageRange.f({'a': card.ageMin, 'b': card.ageMax})),
      if (card.groupSize != null) (BootstrapIcons.grid, s.groupUpTo.f({'n': card.groupSize})),
      if (course.teachingLanguage != null) (BootstrapIcons.translate, course.teachingLanguage!),
      if (card.startDate != null) (BootstrapIcons.calendar_event, s.startsOn.f({'date': dayMonth(card.startDate!, s)})),
      if (course.certificate) (BootstrapIcons.award, s.certificate),
    ];

    return Scaffold(
      body: Stack(
        children: [
          CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Stack(
                  children: [
                    CourseBanner(course: card, s: s, height: 210 + top, radius: 0, showIcon: false),
                    Positioned(
                      top: top + 8,
                      left: 12,
                      child: Pressable(
                        onTap: () => context.pop(),
                        child: Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.22)),
                          ),
                          child: const Icon(BootstrapIcons.arrow_left, color: Colors.white, size: 18),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              SliverToBoxAdapter(
                child: Transform.translate(
                  offset: const Offset(0, -22),
                  child: Container(
                    decoration: BoxDecoration(
                      color: c.background,
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                    ),
                    padding: const EdgeInsets.fromLTRB(18, 22, 18, 130),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(card.title, style: theme.textTheme.headlineSmall).enter(i++),
                        const SizedBox(height: 8),
                        Text(card.summary, style: theme.textTheme.bodyMedium).enter(i++),
                        const SizedBox(height: 16),
                        Wrap(spacing: 8, runSpacing: 8, children: [for (final fact in facts) MetaTag(fact.$1, fact.$2)]).enter(i++),
                        if (course.description.trim().isNotEmpty) ...[
                          const SizedBox(height: 22),
                          SectionHeader(s.aboutCourse),
                          _Expandable(text: course.description),
                        ],
                        if (course.outcomes.isNotEmpty) ...[
                          const SizedBox(height: 22),
                          SectionHeader(s.outcomes),
                          AppCard(
                            child: _Checklist(items: course.outcomes, color: c.emerald),
                          ),
                        ],
                        if (course.skills.isNotEmpty) ...[
                          const SizedBox(height: 22),
                          SectionHeader(s.skills),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              for (final skill in course.skills)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: c.surface,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: c.border),
                                  ),
                                  child: Text(
                                    skill,
                                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: c.inkSoft),
                                  ),
                                ),
                            ],
                          ),
                        ],
                        if (course.modules.isNotEmpty) ...[
                          const SizedBox(height: 22),
                          SectionHeader('${s.program} · ${s.count(course.lessonCount, s.lessons)}'),
                          for (final (index, module) in course.modules.indexed) _ModuleTile(module: module, index: index, s: s),
                        ],
                        const SizedBox(height: 22),
                        SectionHeader(s.instructor),
                        _Instructor(course: course),
                        if (course.upcoming.isNotEmpty) ...[
                          const SizedBox(height: 22),
                          SectionHeader(s.courseLessons),
                          for (final event in course.upcoming)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 10),
                              child: AppCard(
                                padding: const EdgeInsets.all(14),
                                child: Row(
                                  children: [
                                    IconTile(BootstrapIcons.calendar_check, size: 42),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(event.title, style: theme.textTheme.titleSmall),
                                          const SizedBox(height: 3),
                                          Text(
                                            [dayAndTime(event.startsAt, s), if (event.location != null) event.location].join(' · '),
                                            style: theme.textTheme.bodySmall,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                        ],
                        if (course.audience.isNotEmpty) ...[
                          const SizedBox(height: 22),
                          SectionHeader(s.audience),
                          AppCard(
                            child: _Checklist(items: course.audience, color: c.brand, icon: BootstrapIcons.person_check),
                          ),
                        ],
                        if (course.requirements.isNotEmpty) ...[
                          const SizedBox(height: 22),
                          SectionHeader(s.requirements),
                          AppCard(
                            child: _Checklist(items: course.requirements, color: c.amber, icon: BootstrapIcons.info_circle),
                          ),
                        ],
                        if (course.reviews.isNotEmpty) ...[
                          const SizedBox(height: 22),
                          SectionHeader(s.reviews),
                          for (final review in course.reviews) _ReviewCard(review: review, s: s),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _EnrollBar(course: card, s: s),
          ),
        ],
      ),
    );
  }
}

class _EnrollBar extends StatelessWidget {
  const _EnrollBar({required this.course, required this.s});
  final CourseCard course;
  final S s;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Container(
      padding: EdgeInsets.fromLTRB(18, 14, 18, 14 + MediaQuery.paddingOf(context).bottom),
      decoration: BoxDecoration(
        color: c.surface,
        border: Border(top: BorderSide(color: c.border)),
        boxShadow: [BoxShadow(color: c.shadow.withValues(alpha: 0.12), blurRadius: 24, offset: const Offset(0, -6))],
      ),
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(s.price, style: Theme.of(context).textTheme.labelMedium),
              PriceTag(course: course, s: s, large: true),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: FilledButton(onPressed: () => context.push('/courses/${course.slug}/enroll'), child: Text(s.enrollCta)),
          ),
        ],
      ),
    ).animate().slideY(begin: 1, end: 0, duration: 450.ms, curve: Curves.easeOutCubic);
  }
}

class _Expandable extends StatefulWidget {
  const _Expandable({required this.text});
  final String text;

  @override
  State<_Expandable> createState() => _ExpandableState();
}

class _ExpandableState extends State<_Expandable> {
  bool _open = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final long = widget.text.length > 280;
    return AppCard(
      onTap: long ? () => setState(() => _open = !_open) : null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AnimatedSize(
            duration: const Duration(milliseconds: 280),
            curve: Curves.easeOutCubic,
            alignment: Alignment.topCenter,
            child: Text(
              widget.text,
              maxLines: _open || !long ? null : 5,
              overflow: _open ? null : TextOverflow.fade,
              style: theme.textTheme.bodyMedium,
            ),
          ),
          if (long)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Icon(_open ? BootstrapIcons.chevron_up : BootstrapIcons.chevron_down, size: 16, color: context.c.brand),
            ),
        ],
      ),
    );
  }
}

class _Checklist extends StatelessWidget {
  const _Checklist({required this.items, required this.color, this.icon = BootstrapIcons.check2_circle});
  final List<String> items;
  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (final (index, item) in items.indexed)
          Padding(
            padding: EdgeInsets.only(bottom: index == items.length - 1 ? 0 : 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(icon, size: 17, color: color),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(item, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: context.c.ink)),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _ModuleTile extends StatelessWidget {
  const _ModuleTile({required this.module, required this.index, required this.s});
  final CourseModule module;
  final int index;
  final S s;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Container(
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: c.border.withValues(alpha: 0.7)),
        ),
        child: Theme(
          data: theme.copyWith(dividerColor: Colors.transparent),
          child: ExpansionTile(
            shape: const RoundedRectangleBorder(),
            collapsedShape: const RoundedRectangleBorder(),
            tilePadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
            iconColor: c.brand,
            collapsedIconColor: c.muted,
            leading: Container(
              width: 38,
              height: 38,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: c.brand.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
              child: Text(
                '${index + 1}',
                style: TextStyle(fontFamily: displayFont, fontWeight: FontWeight.w800, color: c.brand),
              ),
            ),
            title: Text(module.title, style: theme.textTheme.titleSmall),
            subtitle: Text(
              '${s.weekN.f({'n': index + 1})} · ${s.count(module.lessons.length, s.lessons)}',
              style: theme.textTheme.bodySmall,
            ),
            children: [
              if (module.goal != null && module.goal!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Text(module.goal!, style: theme.textTheme.bodyMedium),
                ),
              for (final lesson in module.lessons)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    children: [
                      Icon(BootstrapIcons.play_circle, size: 15, color: c.muted),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(lesson.title, style: theme.textTheme.bodyMedium?.copyWith(color: c.ink)),
                      ),
                      Text(s.minutesShort.f({'n': lesson.durationMin}), style: theme.textTheme.bodySmall),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Instructor extends StatelessWidget {
  const _Instructor({required this.course});
  final CourseDetail course;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final theme = Theme.of(context);
    final avatar = AppConfig.media(course.card.instructorAvatar);
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(18),
                child: SizedBox.square(
                  dimension: 60,
                  child: avatar == null
                      ? Container(
                          color: c.sunken,
                          child: Icon(BootstrapIcons.person, color: c.muted),
                        )
                      : CachedNetworkImage(
                          imageUrl: avatar,
                          fit: BoxFit.cover,
                          fadeInDuration: const Duration(milliseconds: 250),
                          placeholder: (_, _) => Container(color: c.sunken),
                          errorWidget: (_, _, _) => Container(
                            color: c.sunken,
                            child: Icon(BootstrapIcons.person, color: c.muted),
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(course.card.instructorName, style: theme.textTheme.titleMedium),
                    if (course.instructorTitle != null) ...[
                      const SizedBox(height: 3),
                      Text(course.instructorTitle!, style: theme.textTheme.bodySmall),
                    ],
                  ],
                ),
              ),
            ],
          ),
          if ((course.instructorBio ?? '').isNotEmpty) ...[
            const SizedBox(height: 14),
            Text(course.instructorBio!, style: theme.textTheme.bodyMedium),
          ],
        ],
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  const _ReviewCard({required this.review, required this.s});
  final Review review;
  final S s;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                for (var i = 0; i < 5; i++)
                  Icon(i < review.rating ? BootstrapIcons.star_fill : BootstrapIcons.star, size: 14, color: c.accent),
                const Spacer(),
                Text(dayMonth(review.createdAt, s), style: theme.textTheme.labelSmall),
              ],
            ),
            if ((review.comment ?? '').isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(review.comment!, style: theme.textTheme.bodyMedium?.copyWith(color: c.ink)),
            ],
            if (review.author != null) ...[const SizedBox(height: 10), Text('— ${review.author}', style: theme.textTheme.labelMedium)],
          ],
        ),
      ),
    );
  }
}
