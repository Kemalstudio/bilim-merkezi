import 'package:bootstrap_icons/bootstrap_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/models.dart';
import '../../core/format.dart';
import '../../core/i18n/strings.dart';
import '../../core/state.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/theme.dart';
import '../../widgets/common.dart';
import '../../widgets/page_header.dart';
import '../../widgets/tiles.dart';

/// Every child's lessons for the coming weeks: a strip of days on top, the lessons grouped by day.
class ScheduleScreen extends ConsumerStatefulWidget {
  const ScheduleScreen({super.key});

  @override
  ConsumerState<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends ConsumerState<ScheduleScreen> {
  DateTime? _selected;

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final schedule = ref.watch(scheduleProvider);

    final header = PageHeader(title: s.scheduleTitle, subtitle: s.scheduleLead);

    return Scaffold(
      body: RefreshIndicator(
        edgeOffset: MediaQuery.paddingOf(context).top + 58,
        onRefresh: () => ref.refresh(scheduleProvider.future),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          slivers: [
            header,
            ...switch (schedule) {
              AsyncValue(:final value?) => _content(value, s),
              AsyncValue(:final error?) when !schedule.isLoading => [
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: ErrorState(error: error, s: s, onRetry: () => ref.invalidate(scheduleProvider)),
                  ),
                ],
              _ => [
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                    sliver: SliverList.list(children: [
                      for (var i = 0; i < 4; i++)
                        const Padding(padding: EdgeInsets.only(bottom: 10), child: SkeletonBox(height: 96, radius: 24)),
                    ]),
                  ),
                ],
            },
          ],
        ),
      ),
    );
  }

  List<Widget> _content(List<Lesson> lessons, S s) {
    final today = DateTime.now();
    final days = List.generate(21, (i) => DateTime(today.year, today.month, today.day + i));
    final busy = {for (final lesson in lessons) DateTime(lesson.startsAt.year, lesson.startsAt.month, lesson.startsAt.day)};
    final visible = _selected == null ? lessons : lessons.where((lesson) => sameDay(lesson.startsAt, _selected!)).toList();

    final groups = <DateTime, List<Lesson>>{};
    for (final lesson in visible) {
      groups.putIfAbsent(DateTime(lesson.startsAt.year, lesson.startsAt.month, lesson.startsAt.day), () => []).add(lesson);
    }

    var i = 0;
    return [
        SliverToBoxAdapter(
          child: SizedBox(
            height: 92,
            child: ListView.separated(
              physics: const BouncingScrollPhysics(),
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
              itemCount: days.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final day = days[index];
                return _DayChip(
                  day: day,
                  s: s,
                  selected: _selected != null && sameDay(_selected!, day),
                  hasLessons: busy.contains(day),
                  onTap: () => setState(() => _selected = _selected != null && sameDay(_selected!, day) ? null : day),
                );
              },
            ),
          ),
        ),
        if (groups.isEmpty)
          SliverFillRemaining(
            hasScrollBody: false,
            child: EmptyState(
              icon: BootstrapIcons.calendar2_week,
              title: s.scheduleEmptyTitle,
              text: s.scheduleEmptyText,
              action: lessons.isEmpty ? s.findCourse : null,
              onAction: () => context.go('/courses'),
            ),
          )
        else
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
            sliver: SliverList.list(children: [
              for (final entry in groups.entries) ...[
                Padding(
                  padding: const EdgeInsets.fromLTRB(4, 14, 4, 10),
                  child: Text(relativeDay(entry.key, s), style: Theme.of(context).textTheme.titleMedium),
                ).enter(i++),
                for (final lesson in entry.value)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: LessonTile(
                      lesson: lesson,
                      s: s,
                      showDate: false,
                      onTap: () => context.push('/courses/${lesson.courseSlug}'),
                    ),
                  ).enter(i++),
              ],
            ]),
          ),
    ];
  }
}

class _DayChip extends StatelessWidget {
  const _DayChip({required this.day, required this.s, required this.selected, required this.hasLessons, required this.onTap});
  final DateTime day;
  final S s;
  final bool selected;
  final bool hasLessons;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final isToday = sameDay(day, DateTime.now());
    return Pressable(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        width: 56,
        decoration: BoxDecoration(
          gradient: selected ? c.heroGradient : null,
          color: selected ? null : c.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: selected ? Colors.transparent : (isToday ? c.brand : c.border)),
        ),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Text(s.weekdaysShort[day.weekday - 1],
              style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: selected ? Colors.white70 : c.muted)),
          const SizedBox(height: 4),
          Text('${day.day}',
              style: TextStyle(fontFamily: displayFont, fontWeight: FontWeight.w800, fontSize: 19, color: selected ? Colors.white : c.ink)),
          const SizedBox(height: 5),
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: hasLessons ? (selected ? c.accent : c.brand) : Colors.transparent,
            ),
          ),
        ]),
      ),
    );
  }
}
