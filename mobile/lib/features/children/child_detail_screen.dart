import 'dart:async';
import 'dart:math' as math;

import 'package:bootstrap_icons/bootstrap_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api/models.dart';
import '../../core/format.dart';
import '../../core/i18n/strings.dart';
import '../../core/state.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/theme.dart';
import '../../widgets/common.dart';
import '../../widgets/tiles.dart';
import 'child_form.dart';

/// One child: scores and their trend, courses, upcoming lessons, notes.
class ChildDetailScreen extends ConsumerWidget {
  const ChildDetailScreen({super.key, required this.id});
  final String id;

  Future<void> _delete(BuildContext context, WidgetRef ref, ChildDetail child, S s) async {
    final sure = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(s.deleteProfileTitle.f({'name': child.firstName})),
        content: Text(s.deleteProfileText),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(s.cancel)),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: context.c.rose),
            child: Text(s.delete),
          ),
        ],
      ),
    );
    if (sure != true || !context.mounted) return;
    try {
      await ref.read(apiProvider).deleteChild(child.id);
      refreshAccountData(ref);
      if (!context.mounted) return;
      toast(context, s.profileDeleted);
      context.pop();
    } catch (error) {
      if (context.mounted) toast(context, errorText(error, s), error: true);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final detail = ref.watch(childProvider(id));

    return Scaffold(
      body: switch (detail) {
        AsyncValue(:final value?) => _Body(
            child: value,
            s: s,
            onEdit: () => showChildForm(context, ref, child: value),
            onDelete: () => _delete(context, ref, value, s),
            onRefresh: () => ref.refresh(childProvider(id).future),
          ),
        AsyncValue(:final error?) when !detail.isLoading => SafeArea(
            child: Column(children: [
              Align(alignment: Alignment.centerLeft, child: BackButton(onPressed: () => context.pop())),
              Expanded(child: ErrorState(error: error, s: s, onRetry: () => ref.invalidate(childProvider(id)))),
            ]),
          ),
        _ => const Center(child: CircularProgressIndicator()),
      },
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({required this.child, required this.s, required this.onEdit, required this.onDelete, required this.onRefresh});
  final ChildDetail child;
  final S s;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final theme = Theme.of(context);
    final top = MediaQuery.paddingOf(context).top;
    final color = c.childColor(child.avatarHue);
    var i = 0;

    return RefreshIndicator(
      onRefresh: onRefresh,
      edgeOffset: top,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        slivers: [
          SliverToBoxAdapter(
            child: Container(
              padding: EdgeInsets.fromLTRB(12, top + 6, 12, 26),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [HSLColor.fromColor(color).withLightness(0.32).toColor(), color],
                ),
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(32)),
              ),
              child: Column(children: [
                Row(children: [
                  _RoundButton(icon: BootstrapIcons.arrow_left, onTap: () => context.pop()),
                  const Spacer(),
                  _RoundButton(icon: BootstrapIcons.pencil, onTap: onEdit),
                ]),
                ChildAvatar(initials: child.initials, hue: child.avatarHue, size: 78)
                    .animate()
                    .scale(begin: const Offset(0.7, 0.7), duration: 450.ms, curve: Curves.easeOutBack),
                const SizedBox(height: 12),
                Text(child.fullName,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontFamily: displayFont, fontWeight: FontWeight.w800, fontSize: 25, letterSpacing: -0.8, color: Colors.white)),
                const SizedBox(height: 4),
                Text(
                  [
                    s.count(child.age, s.years),
                    if (child.grade != null) s.gradeN.f({'n': child.grade}),
                    fullDate(child.birthDate, s),
                  ].join(' · '),
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.78), fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 18),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Row(children: [
                    _HeroStat(label: s.average, value: child.averagePercent == null ? '—' : '${child.averagePercent}%'),
                    _HeroStat(label: s.best, value: child.bestPercent == null ? '—' : '${child.bestPercent}%'),
                    _HeroStat(label: s.exams, value: '${child.exams.length}'),
                    _HeroStat(label: s.childCourses, value: '${child.activeCourses}'),
                  ]),
                ),
              ]),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 40),
            sliver: SliverList.list(children: [
              FilledButton.icon(
                onPressed: () => context.go('/courses'),
                icon: const Icon(BootstrapIcons.plus_circle, size: 18),
                label: Text(s.enrollChild),
              ).enter(i++),
              const SizedBox(height: 20),
              SectionHeader(s.scoreDynamics).enter(i++),
              AppCard(
                child: child.exams.isEmpty
                    ? EmptyState(compact: true, icon: BootstrapIcons.graph_up_arrow, title: s.noScores, text: s.feedEmptyText)
                    : Column(children: [
                        SizedBox(height: 180, child: _ScoreChart(exams: child.exams)),
                        const SizedBox(height: 12),
                        for (final exam in child.exams.reversed.take(6)) _ExamRow(exam: exam, s: s),
                      ]),
              ).enter(i++),
              const SizedBox(height: 20),
              SectionHeader(s.childCourses).enter(i++),
              if (child.enrollments.isEmpty)
                AppCard(child: Text(s.noCoursesYet, style: theme.textTheme.bodyMedium)).enter(i++)
              else
                for (final enrollment in child.enrollments)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: AppCard(
                      onTap: () => context.push('/courses/${enrollment.courseSlug}'),
                      padding: const EdgeInsets.all(14),
                      child: Row(children: [
                        IconTile(BootstrapIcons.journal_bookmark, size: 42),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(enrollment.courseTitle, style: theme.textTheme.titleSmall),
                            const SizedBox(height: 6),
                            StatusPill(enrollment.status, s.status[enrollment.status] ?? enrollment.status),
                          ]),
                        ),
                        Icon(BootstrapIcons.chevron_right, size: 14, color: c.muted),
                      ]),
                    ),
                  ).enter(i++),
              if (child.upcoming.isNotEmpty) ...[
                const SizedBox(height: 20),
                SectionHeader(s.upcoming).enter(i++),
                for (final lesson in child.upcoming)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: AppCard(
                      padding: const EdgeInsets.all(14),
                      child: Row(children: [
                        IconTile(BootstrapIcons.clock, color: c.accentDeep, size: 42),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(lesson.title, style: theme.textTheme.titleSmall),
                            const SizedBox(height: 3),
                            Text('${dayAndTime(lesson.startsAt, s)} · ${lesson.courseTitle}',
                                maxLines: 2, overflow: TextOverflow.ellipsis, style: theme.textTheme.bodySmall),
                          ]),
                        ),
                      ]),
                    ),
                  ).enter(i++),
              ],
              if ((child.notes ?? '').isNotEmpty) ...[
                const SizedBox(height: 20),
                SectionHeader(s.notes).enter(i++),
                AppCard(child: Text(child.notes!, style: theme.textTheme.bodyMedium)).enter(i++),
              ],
              const SizedBox(height: 28),
              TextButton.icon(
                onPressed: onDelete,
                style: TextButton.styleFrom(foregroundColor: c.rose),
                icon: const Icon(BootstrapIcons.trash3, size: 16),
                label: Text(s.deleteProfile),
              ),
            ]),
          ),
        ],
      ),
    );
  }
}

class _RoundButton extends StatelessWidget {
  const _RoundButton({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Pressable(
        onTap: onTap,
        child: Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.16), borderRadius: BorderRadius.circular(14)),
          child: Icon(icon, size: 18, color: Colors.white),
        ),
      );
}

class _HeroStat extends StatelessWidget {
  const _HeroStat({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Expanded(
        child: Column(children: [
          Text(value, style: const TextStyle(fontFamily: displayFont, fontWeight: FontWeight.w800, fontSize: 20, color: Colors.white)),
          const SizedBox(height: 2),
          Text(label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: Colors.white.withValues(alpha: 0.72))),
        ]),
      );
}

class _ExamRow extends StatelessWidget {
  const _ExamRow({required this.exam, required this.s});
  final ExamPoint exam;
  final S s;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final theme = Theme.of(context);
    final color = ScoreRing.colorFor(c, exam.percent);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(children: [
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(exam.examName, maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.textTheme.titleSmall),
            const SizedBox(height: 2),
            Text([dayMonth(exam.examDate, s), if (exam.courseTitle != null) exam.courseTitle].join(' · '),
                maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.textTheme.bodySmall),
          ]),
        ),
        const SizedBox(width: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
          child: Text('${exam.score}/${exam.maxScore}',
              style: TextStyle(fontFamily: displayFont, fontWeight: FontWeight.w800, fontSize: 13.5, color: color)),
        ),
      ]),
    );
  }
}

/// Percent per exam over time, drawn in once as the card appears.
class _ScoreChart extends StatefulWidget {
  const _ScoreChart({required this.exams});
  final List<ExamPoint> exams;

  @override
  State<_ScoreChart> createState() => _ScoreChartState();
}

/// Scores over time as a smooth line that draws itself in, with a tap-to-read tooltip.
class _ScoreChartState extends State<_ScoreChart> {
  int? _touched;
  Timer? _hide;

  static const _left = 34.0;
  static const _pad = 10.0;

  @override
  void dispose() {
    _hide?.cancel();
    super.dispose();
  }

  int _nearest(double dx, double width) {
    final count = widget.exams.length;
    if (count < 2) return 0;
    final step = (width - _left - _pad * 2) / (count - 1);
    return ((dx - _left - _pad) / step).round().clamp(0, count - 1);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return LayoutBuilder(builder: (context, constraints) {
      final width = constraints.maxWidth;
      void touch(Offset position) {
        _hide?.cancel();
        final index = _nearest(position.dx, width);
        if (index != _touched) {
          HapticFeedback.selectionClick();
          setState(() => _touched = index);
        }
      }

      void release() {
        _hide?.cancel();
        _hide = Timer(const Duration(seconds: 2), () {
          if (mounted) setState(() => _touched = null);
        });
      }

      return GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: (details) => touch(details.localPosition),
        onTapUp: (_) => release(),
        onHorizontalDragUpdate: (details) => touch(details.localPosition),
        onHorizontalDragEnd: (_) => release(),
        child: TweenAnimationBuilder<double>(
          tween: Tween(begin: 0, end: 1),
          duration: const Duration(milliseconds: 1100),
          curve: Curves.easeOutCubic,
          builder: (context, progress, _) => CustomPaint(
            size: Size(width, constraints.maxHeight),
            painter: _ChartPainter(
              values: [for (final exam in widget.exams) exam.percent.toDouble()],
              labels: [for (final exam in widget.exams) exam.examName],
              progress: progress,
              touched: _touched,
              c: c,
              left: _left,
              pad: _pad,
            ),
          ),
        ),
      );
    });
  }
}

class _ChartPainter extends CustomPainter {
  _ChartPainter({
    required this.values,
    required this.labels,
    required this.progress,
    required this.touched,
    required this.c,
    required this.left,
    required this.pad,
  });

  final List<double> values;
  final List<String> labels;
  final double progress;
  final int? touched;
  final BmColors c;
  final double left;
  final double pad;

  @override
  void paint(Canvas canvas, Size size) {
    const top = 12.0;
    const bottom = 10.0;
    final chart = Rect.fromLTRB(left + pad, top, size.width - pad, size.height - bottom);
    double y(double value) => chart.bottom - chart.height * value / 100;

    // Grid: dashed lines at 0, 25, 50, 75 and 100 with their labels.
    final grid = Paint()
      ..color = c.border.withValues(alpha: 0.7)
      ..strokeWidth = 1;
    for (var mark = 0; mark <= 100; mark += 25) {
      final dy = y(mark.toDouble());
      for (var dx = left; dx < size.width; dx += 8) {
        canvas.drawLine(Offset(dx, dy), Offset(math.min(dx + 4, size.width), dy), grid);
      }
      final label = TextPainter(
        text: TextSpan(text: '$mark', style: TextStyle(fontSize: 11, color: c.muted, fontFamily: bodyFont)),
        textDirection: TextDirection.ltr,
      )..layout();
      label.paint(canvas, Offset(left - label.width - 10, dy - label.height / 2));
    }
    if (values.isEmpty) return;

    final step = values.length < 2 ? 0.0 : chart.width / (values.length - 1);
    final points = [
      for (var i = 0; i < values.length; i++)
        Offset(values.length < 2 ? chart.center.dx : chart.left + step * i, y(values[i] * progress)),
    ];

    // A smooth line through the points (Catmull-Rom as cubic Béziers), kept inside the chart.
    final line = Path()..moveTo(points.first.dx, points.first.dy);
    for (var i = 0; i < points.length - 1; i++) {
      final p0 = points[math.max(i - 1, 0)];
      final p1 = points[i];
      final p2 = points[i + 1];
      final p3 = points[math.min(i + 2, points.length - 1)];
      final c1 = Offset(p1.dx + (p2.dx - p0.dx) / 6, (p1.dy + (p2.dy - p0.dy) / 6).clamp(chart.top, chart.bottom));
      final c2 = Offset(p2.dx - (p3.dx - p1.dx) / 6, (p2.dy - (p3.dy - p1.dy) / 6).clamp(chart.top, chart.bottom));
      line.cubicTo(c1.dx, c1.dy, c2.dx, c2.dy, p2.dx, p2.dy);
    }

    final area = Path.from(line)
      ..lineTo(points.last.dx, chart.bottom)
      ..lineTo(points.first.dx, chart.bottom)
      ..close();
    canvas.drawPath(
      area,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [c.brandEnd.withValues(alpha: 0.30), c.brandEnd.withValues(alpha: 0)],
        ).createShader(chart),
    );
    canvas.drawPath(
      line,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3.5
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round
        ..shader = LinearGradient(colors: [c.brandMid, c.brandEnd]).createShader(chart),
    );

    final selected = touched;
    if (selected != null) {
      final x = points[selected].dx;
      canvas.drawLine(
        Offset(x, chart.top),
        Offset(x, chart.bottom),
        Paint()
          ..color = c.brand.withValues(alpha: 0.35)
          ..strokeWidth = 1.5,
      );
    }

    for (var i = 0; i < points.length; i++) {
      final radius = i == selected ? 6.5 : 4.5;
      canvas.drawCircle(points[i], radius + 1.5, Paint()..color = ScoreRing.colorFor(c, values[i].round()));
      canvas.drawCircle(points[i], radius - 1.5, Paint()..color = c.surface);
    }

    if (selected != null) {
      _tooltip(canvas, size, points[selected], '${labels[selected]}\n${values[selected].round()}%');
    }
  }

  void _tooltip(Canvas canvas, Size size, Offset at, String text) {
    final painter = TextPainter(
      text: TextSpan(
        text: text,
        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12, height: 1.35, fontFamily: bodyFont),
      ),
      textDirection: TextDirection.ltr,
      textAlign: TextAlign.center,
      maxLines: 3,
      ellipsis: '…',
    )..layout(maxWidth: 170);
    final box = Size(painter.width + 20, painter.height + 14);
    final dx = (at.dx - box.width / 2).clamp(0.0, size.width - box.width);
    final above = at.dy - box.height - 12;
    final dy = above >= 0 ? above : at.dy + 12;
    final rect = RRect.fromRectAndRadius(Offset(dx, dy) & box, const Radius.circular(12));
    canvas.drawRRect(rect.shift(const Offset(0, 3)), Paint()..color = Colors.black.withValues(alpha: 0.12));
    canvas.drawRRect(rect, Paint()..color = c.panel);
    painter.paint(canvas, Offset(dx + 10, dy + 7));
  }

  @override
  bool shouldRepaint(_ChartPainter old) =>
      old.progress != progress || old.touched != touched || old.values != values || old.c != c;
}
