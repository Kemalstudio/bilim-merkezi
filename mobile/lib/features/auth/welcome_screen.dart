import 'dart:math' as math;

import 'package:bootstrap_icons/bootstrap_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/state.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/theme.dart';
import '../../widgets/brand.dart';

/// First screen for a signed-out parent: the three things the app does, then sign in / sign up.
class WelcomeScreen extends ConsumerStatefulWidget {
  const WelcomeScreen({super.key});

  @override
  ConsumerState<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends ConsumerState<WelcomeScreen> {
  final _pages = PageController();
  int _page = 0;

  @override
  void dispose() {
    _pages.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final c = context.c;
    const icons = [BootstrapIcons.graph_up_arrow, BootstrapIcons.calendar2_week, BootstrapIcons.lightning_charge];

    return Scaffold(
      backgroundColor: const Color(0xFF062434),
      body: Stack(children: [
        const Positioned.fill(child: _Constellation()),
        SafeArea(
          child: Column(children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
              child: Row(children: [
                const Logo(light: true, size: 38),
                const Spacer(),
                _LanguageButton(code: s.code),
              ]),
            ),
            Expanded(
              child: PageView.builder(
                controller: _pages,
                itemCount: 3,
                onPageChanged: (page) => setState(() => _page = page),
                itemBuilder: (context, index) => _Slide(
                  icon: icons[index],
                  eyebrow: s.welcomeEyebrow,
                  title: index == 0 ? s.welcomeTitle : s.onboardTitles[index],
                  text: index == 0 ? s.welcomeText : s.onboardTexts[index],
                  index: index,
                ),
              ),
            ),
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              for (var i = 0; i < 3; i++)
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOutCubic,
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: i == _page ? 26 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: i == _page ? c.accent : Colors.white.withValues(alpha: 0.25),
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
            ]),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 28, 24, 20),
              child: Column(children: [
                FilledButton(
                  onPressed: () => context.push('/register'),
                  style: FilledButton.styleFrom(backgroundColor: c.accent, foregroundColor: const Color(0xFF241400)),
                  child: Text(s.createAccount),
                ),
                const SizedBox(height: 12),
                OutlinedButton(
                  onPressed: () => context.push('/login'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: BorderSide(color: Colors.white.withValues(alpha: 0.3)),
                  ),
                  child: Text(s.signIn),
                ),
              ]),
            ).animate().fadeIn(duration: 500.ms, delay: 250.ms).slideY(begin: 0.2, end: 0, curve: Curves.easeOutCubic),
          ]),
        ),
      ]),
    );
  }
}

class _Slide extends StatelessWidget {
  const _Slide({required this.icon, required this.eyebrow, required this.title, required this.text, required this.index});
  final IconData icon;
  final String eyebrow;
  final String title;
  final String text;
  final int index;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.start, children: [
        _Showcase(icon: icon, index: index),
        const SizedBox(height: 40),
        Text(eyebrow.toUpperCase(),
            style: TextStyle(fontFamily: displayFont, fontWeight: FontWeight.w800, fontSize: 11.5, letterSpacing: 1.6, color: c.accent)),
        const SizedBox(height: 12),
        Text(title,
            style: const TextStyle(
                fontFamily: displayFont, fontWeight: FontWeight.w800, fontSize: 31, height: 1.08, letterSpacing: -1.2, color: Colors.white)),
        const SizedBox(height: 14),
        Text(text, style: TextStyle(fontSize: 15.5, height: 1.5, color: Colors.white.withValues(alpha: 0.68))),
      ]),
    );
  }
}

/// A glassy illustration card per slide, made from the app's own pieces.
class _Showcase extends StatelessWidget {
  const _Showcase({required this.icon, required this.index});
  final IconData icon;
  final int index;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    Widget glass(Widget child) => Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.07),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
          ),
          child: child,
        );

    final rows = switch (index) {
      0 => [('∑', 0.86, c.emerald), ('Aa', 0.72, c.accent), ('π', 0.64, c.brandEnd)],
      1 => [('09:00', 0.0, c.accent), ('15:30', 0.0, c.brandEnd), ('17:00', 0.0, c.emerald)],
      _ => [('1', 1.0, c.emerald), ('2', 1.0, c.emerald), ('3', 0.5, c.accent)],
    };

    return glass(Column(children: [
      Row(children: [
        Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(gradient: c.heroGradient, borderRadius: BorderRadius.circular(15)),
          child: Icon(icon, color: Colors.white, size: 22),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(height: 10, width: 120, decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.5), borderRadius: BorderRadius.circular(6))),
            const SizedBox(height: 8),
            Container(height: 8, width: 80, decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(6))),
          ]),
        ),
      ]),
      const SizedBox(height: 18),
      for (final (i, row) in rows.indexed)
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Row(children: [
            SizedBox(
              width: index == 0 ? 44 : 72,
              child: Text(row.$1,
                  style: TextStyle(fontFamily: displayFont, fontWeight: FontWeight.w700, color: Colors.white.withValues(alpha: 0.85))),
            ),
            Expanded(
              child: index == 0
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        value: row.$2,
                        minHeight: 8,
                        color: row.$3,
                        backgroundColor: Colors.white.withValues(alpha: 0.1),
                      ),
                    )
                  : Container(
                      height: 30,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      alignment: Alignment.centerLeft,
                      decoration: BoxDecoration(color: row.$3.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(10)),
                      child: Row(children: [
                        Icon(index == 2 && row.$2 == 1 ? BootstrapIcons.check2 : BootstrapIcons.dot, size: 16, color: row.$3),
                        const SizedBox(width: 6),
                        Container(height: 7, width: 60.0 + i * 24, decoration: BoxDecoration(color: row.$3.withValues(alpha: 0.5), borderRadius: BorderRadius.circular(5))),
                      ]),
                    ),
            ),
          ]),
        ).animate().fadeIn(delay: (150 + i * 120).ms, duration: 400.ms).slideX(begin: 0.1, end: 0, curve: Curves.easeOutCubic),
    ]));
  }
}

class _LanguageButton extends ConsumerWidget {
  const _LanguageButton({required this.code});
  final String code;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return PopupMenuButton<String>(
      initialValue: code,
      onSelected: (value) => ref.read(preferencesProvider.notifier).setLocale(value),
      color: context.c.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      itemBuilder: (_) => [for (final entry in [...{'ru': 'Русский', 'tm': 'Türkmençe', 'en': 'English'}.entries]) PopupMenuItem(value: entry.key, child: Text(entry.value))],
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(99)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          const Icon(BootstrapIcons.globe2, size: 14, color: Colors.white),
          const SizedBox(width: 6),
          Text(code.toUpperCase(), style: const TextStyle(fontFamily: displayFont, fontWeight: FontWeight.w800, fontSize: 12.5, color: Colors.white)),
        ]),
      ),
    );
  }
}

/// Slowly drifting dots and lines behind the welcome screen — the website's constellation motif.
class _Constellation extends StatefulWidget {
  const _Constellation();

  @override
  State<_Constellation> createState() => _ConstellationState();
}

class _ConstellationState extends State<_Constellation> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(vsync: this, duration: const Duration(seconds: 24))..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) => CustomPaint(painter: _ConstellationPainter(_controller.value, context.c.accent)),
      ),
    );
  }
}

class _ConstellationPainter extends CustomPainter {
  _ConstellationPainter(this.t, this.accent);
  final double t;
  final Color accent;

  static final _seeds = List.generate(18, (i) {
    final random = math.Random(i * 7919);
    return (random.nextDouble(), random.nextDouble(), random.nextDouble() * math.pi * 2, 0.6 + random.nextDouble());
  });

  @override
  void paint(Canvas canvas, Size size) {
    final glow = Paint()
      ..shader = RadialGradient(colors: [const Color(0xFF12A3B8).withValues(alpha: 0.35), const Color(0x0012A3B8)])
          .createShader(Rect.fromCircle(center: Offset(size.width * 0.9, size.height * 0.12), radius: size.width * 0.8));
    canvas.drawRect(Offset.zero & size, glow);

    final points = [
      for (final (x, y, phase, speed) in _seeds)
        Offset(
          size.width * x + math.sin(t * math.pi * 2 * speed + phase) * 14,
          size.height * y * 0.62 + math.cos(t * math.pi * 2 * speed + phase) * 10,
        ),
    ];
    final line = Paint()
      ..color = accent.withValues(alpha: 0.10)
      ..strokeWidth = 1;
    for (var i = 0; i < points.length; i++) {
      for (var j = i + 1; j < points.length; j++) {
        if ((points[i] - points[j]).distance < 110) canvas.drawLine(points[i], points[j], line);
      }
    }
    final dot = Paint()..color = accent.withValues(alpha: 0.45);
    for (final point in points) {
      canvas.drawCircle(point, 2, dot);
    }
  }

  @override
  bool shouldRepaint(_ConstellationPainter old) => old.t != t;
}
