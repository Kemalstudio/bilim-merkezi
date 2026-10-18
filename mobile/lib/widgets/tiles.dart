import 'dart:math' as math;

import 'package:bootstrap_icons/bootstrap_icons.dart';
import 'package:flutter/material.dart';

import '../core/api/models.dart';
import '../core/format.dart';
import '../core/i18n/strings.dart';
import '../core/theme/colors.dart';
import '../core/theme/theme.dart';
import 'common.dart';

/// Icon for a course category, matching the website (src/lib/course-visuals.ts).
IconData categoryIcon(String slug) => switch (slug) {
      'programming' => BootstrapIcons.code_slash,
      'design' => BootstrapIcons.palette,
      'marketing' => BootstrapIcons.megaphone,
      'languages' => BootstrapIcons.translate,
      'business' => BootstrapIcons.briefcase,
      'growth' => BootstrapIcons.stars,
      'math' => BootstrapIcons.calculator,
      'science' => BootstrapIcons.flask,
      'creative' => BootstrapIcons.puzzle,
      _ => BootstrapIcons.mortarboard,
    };

/// A category's own colour, so courses are told apart at a glance.
Color categoryColor(BmColors c, String slug) => switch (slug) {
      'programming' => c.brand,
      'design' => const Color(0xFFB25FD8),
      'marketing' => c.rose,
      'languages' => c.emerald,
      'business' => c.accentDeep,
      'growth' => c.amber,
      'math' => const Color(0xFF3D7BE0),
      'science' => const Color(0xFF14A1A8),
      'creative' => const Color(0xFFE0609A),
      _ => c.brand,
    };

/// Percent in an animated ring — exam scores.
class ScoreRing extends StatelessWidget {
  const ScoreRing({super.key, required this.percent, this.size = 54, this.stroke = 6, this.label});
  final int percent;
  final double size;
  final double stroke;
  final String? label;

  static Color colorFor(BmColors c, int percent) => percent >= 80 ? c.emerald : percent >= 60 ? c.amber : c.rose;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final color = colorFor(c, percent);
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: percent / 100),
      duration: const Duration(milliseconds: 900),
      curve: Curves.easeOutCubic,
      builder: (context, value, _) => SizedBox.square(
        dimension: size,
        child: CustomPaint(
          painter: _RingPainter(value, color, c.sunken, stroke),
          child: Center(
            child: Text(
              label ?? '${(value * 100).round()}%',
              style: TextStyle(fontFamily: displayFont, fontWeight: FontWeight.w800, fontSize: size * 0.24, color: c.ink),
            ),
          ),
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter(this.value, this.color, this.track, this.stroke);
  final double value;
  final Color color;
  final Color track;
  final double stroke;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final inner = rect.deflate(stroke / 2);
    canvas.drawArc(inner, 0, math.pi * 2, false, Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..color = track);
    canvas.drawArc(inner, -math.pi / 2, math.pi * 2 * value, false, Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round
      ..color = color);
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.value != value || old.color != color;
}

/// "▲ 6" / "▼ 3" next to a score.
class TrendBadge extends StatelessWidget {
  const TrendBadge(this.trend, {super.key});
  final int trend;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final up = trend >= 0;
    final color = up ? c.emerald : c.rose;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(up ? BootstrapIcons.arrow_up_right : BootstrapIcons.arrow_down_right, size: 11, color: color),
        const SizedBox(width: 3),
        Text('${trend.abs()}', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: color)),
      ]),
    );
  }
}

/// A child's card in the home screen carousel and the children list.
class ChildCard extends StatelessWidget {
  const ChildCard({super.key, required this.child, required this.s, this.onTap, this.wide = false});
  final ChildSummary child;
  final S s;
  final VoidCallback? onTap;
  final bool wide;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final theme = Theme.of(context);
    final exam = child.latestExam;
    final subtitle = [
      s.count(child.age, s.years),
      if (child.grade != null) s.gradeN.f({'n': child.grade}),
    ].join(' · ');

    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
        Row(children: [
          ChildAvatar(initials: child.initials, hue: child.avatarHue, size: 46),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(wide ? child.fullName : child.firstName,
                  maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.textTheme.titleMedium),
              const SizedBox(height: 2),
              Text(subtitle, maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.textTheme.bodySmall),
            ]),
          ),
          if (wide) Icon(BootstrapIcons.chevron_right, size: 14, color: c.muted),
        ]),
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: c.sunken.withValues(alpha: 0.7), borderRadius: BorderRadius.circular(16)),
          child: exam == null
              ? Row(children: [
                  Icon(BootstrapIcons.hourglass_split, size: 16, color: c.muted),
                  const SizedBox(width: 8),
                  Expanded(child: Text(s.noScores, style: theme.textTheme.bodySmall)),
                ])
              : Row(children: [
                  ScoreRing(percent: exam.percent, size: 42, stroke: 4.5),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(s.latestResult, style: theme.textTheme.labelSmall),
                      const SizedBox(height: 2),
                      Text(exam.examName, maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.textTheme.titleSmall),
                    ]),
                  ),
                  if (child.trend != null) TrendBadge(child.trend!),
                ]),
        ),
        const SizedBox(height: 10),
        Row(children: [
          Icon(BootstrapIcons.journal_bookmark, size: 13, color: c.brand),
          const SizedBox(width: 6),
          Text(child.activeCourses == 0 ? s.noCoursesYet : s.count(child.activeCourses, s.courses),
              style: theme.textTheme.bodySmall),
        ]),
      ]),
    );
  }
}

/// One lesson: a date block, the title, course, time and place, and whose lesson it is.
class LessonTile extends StatelessWidget {
  const LessonTile({super.key, required this.lesson, required this.s, this.onTap, this.showDate = true});
  final Lesson lesson;
  final S s;
  final VoidCallback? onTap;
  final bool showDate;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final theme = Theme.of(context);
    final color = categoryColor(c, lesson.categorySlug);
    final isToday = sameDay(lesson.startsAt, DateTime.now());
    final end = lesson.endsAt;

    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.all(14),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 58,
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            gradient: isToday ? c.heroGradient : null,
            color: isToday ? null : color.withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(children: [
            Text(time(lesson.startsAt),
                style: TextStyle(fontFamily: displayFont, fontWeight: FontWeight.w800, fontSize: 15, color: isToday ? Colors.white : c.ink)),
            const SizedBox(height: 2),
            Text(
              showDate ? (isToday ? s.today : '${lesson.startsAt.day} ${s.months[lesson.startsAt.month - 1].substring(0, 3)}') : (end == null ? '' : time(end)),
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: isToday ? Colors.white70 : c.muted),
            ),
          ]),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(lesson.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: theme.textTheme.titleSmall),
            const SizedBox(height: 4),
            Row(children: [
              Icon(categoryIcon(lesson.categorySlug), size: 12, color: color),
              const SizedBox(width: 6),
              Expanded(child: Text(lesson.courseTitle, maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.textTheme.bodySmall)),
            ]),
            if (lesson.location != null) ...[
              const SizedBox(height: 3),
              Row(children: [
                Icon(BootstrapIcons.geo_alt, size: 12, color: c.muted),
                const SizedBox(width: 6),
                Expanded(child: Text(lesson.location!, maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.textTheme.bodySmall)),
              ]),
            ],
            if (lesson.children.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(spacing: 6, runSpacing: 6, children: [
                for (final child in lesson.children)
                  Container(
                    padding: const EdgeInsets.fromLTRB(3, 3, 9, 3),
                    decoration: BoxDecoration(color: c.sunken, borderRadius: BorderRadius.circular(99)),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      ChildAvatar(initials: child.firstName[0], hue: child.avatarHue, size: 18),
                      const SizedBox(width: 5),
                      Text(child.firstName, style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: c.inkSoft)),
                    ]),
                  ),
              ]),
            ],
          ]),
        ),
      ]),
    );
  }
}

/// One update in the feed, worded in the parent's language from the server's data.
class FeedTile extends StatelessWidget {
  const FeedTile({super.key, required this.item, required this.s, this.unread = false});
  final FeedItem item;
  final S s;
  final bool unread;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final theme = Theme.of(context);
    final (icon, color, title, body) = switch (item.type) {
      'enrollment_active' => (BootstrapIcons.patch_check, c.emerald, s.feedEnrollmentActive, _who()),
      'awaiting_payment' => (BootstrapIcons.hourglass_split, c.amber, s.feedAwaitingPayment, _who()),
      'exam_result' => (
          BootstrapIcons.trophy,
          c.brand,
          '${s.feedExamResult}${item.childName == null ? '' : ': ${item.childName}'}',
          s.feedExamBody.f({'exam': item.examName, 'score': item.score, 'max': item.maxScore}),
        ),
      _ => (
          BootstrapIcons.bell,
          c.accentDeep,
          s.feedLessonSoon,
          '${item.courseTitle ?? item.lessonTitle ?? ''} · ${item.startsAt == null ? '' : dayAndTime(item.startsAt!, s)}',
        ),
    };

    return AppCard(
      padding: const EdgeInsets.all(14),
      child: Row(children: [
        IconTile(icon, color: color, size: 42),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.textTheme.titleSmall),
            const SizedBox(height: 3),
            Text(body, maxLines: 2, overflow: TextOverflow.ellipsis, style: theme.textTheme.bodySmall),
          ]),
        ),
        const SizedBox(width: 8),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(feedStamp(item.at, s), style: theme.textTheme.labelSmall),
          if (unread) ...[
            const SizedBox(height: 6),
            Container(width: 8, height: 8, decoration: BoxDecoration(color: c.accent, shape: BoxShape.circle)),
          ],
        ]),
      ]),
    );
  }

  String _who() => [item.childName, item.courseTitle].whereType<String>().join(' · ');
}

/// One enrollment: course, child and status.
class EnrollmentTile extends StatelessWidget {
  const EnrollmentTile({super.key, required this.enrollment, required this.s, this.onTap});
  final Enrollment enrollment;
  final S s;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final theme = Theme.of(context);
    final color = categoryColor(c, enrollment.category.slug);
    final child = enrollment.child;
    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.all(14),
      child: Row(children: [
        IconTile(categoryIcon(enrollment.category.slug), color: color, size: 44),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(enrollment.courseTitle, maxLines: 2, overflow: TextOverflow.ellipsis, style: theme.textTheme.titleSmall),
            const SizedBox(height: 6),
            Row(children: [
              StatusPill(enrollment.status, s.status[enrollment.status] ?? enrollment.status),
              if (child != null) ...[
                const SizedBox(width: 8),
                Flexible(
                  child: Text(child.firstName, maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.textTheme.bodySmall),
                ),
              ],
            ]),
          ]),
        ),
        if (enrollment.amount != null && enrollment.amount! > 0)
          Text(money(enrollment.amount!, s), style: theme.textTheme.titleSmall?.copyWith(color: c.inkSoft)),
      ]),
    );
  }
}
