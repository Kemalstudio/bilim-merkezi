import 'package:flutter/material.dart';

import '../core/theme/colors.dart';
import '../core/theme/theme.dart';

/// The website's mark (public/brand/bilim-mark.svg), drawn in code so it stays sharp at any size.
class BrandMark extends StatelessWidget {
  const BrandMark({super.key, this.size = 44});
  final double size;

  @override
  Widget build(BuildContext context) => SizedBox.square(dimension: size, child: CustomPaint(painter: _MarkPainter()));
}

class _MarkPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    canvas.scale(size.width / 48);
    final tile = RRect.fromRectAndRadius(const Rect.fromLTWH(0, 0, 48, 48), const Radius.circular(14));
    canvas.drawRRect(
      tile,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment(-0.83, -0.92),
          end: Alignment(0.83, 0.92),
          colors: [Color(0xFF1FB5AD), Color(0xFF0C6D8F), Color(0xFF073047)],
          stops: [0, 0.5, 1],
        ).createShader(const Rect.fromLTWH(0, 0, 48, 48)),
    );
    canvas.save();
    canvas.clipRRect(tile);
    canvas.drawRect(
      const Rect.fromLTWH(0, 0, 48, 24),
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Colors.white.withValues(alpha: 0.22), Colors.white.withValues(alpha: 0)],
        ).createShader(const Rect.fromLTWH(0, 0, 48, 24)),
    );
    canvas.restore();
    canvas.drawRRect(
      RRect.fromRectAndRadius(const Rect.fromLTWH(0.75, 0.75, 46.5, 46.5), const Radius.circular(13.25)),
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5
        ..color = Colors.white.withValues(alpha: 0.16),
    );

    final letter = Path()
      ..moveTo(15.5, 35)
      ..lineTo(15.5, 13)
      ..lineTo(23.75, 13)
      ..arcToPoint(const Offset(23.75, 24), radius: const Radius.circular(5.5))
      ..lineTo(15.5, 24)
      ..moveTo(15.5, 24)
      ..lineTo(25.25, 24)
      ..arcToPoint(const Offset(25.25, 35), radius: const Radius.circular(5.5))
      ..lineTo(15.5, 35);
    canvas.drawPath(
      letter,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 4.5
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round
        ..color = Colors.white,
    );

    final sparkle = Path()
      ..moveTo(37, 6.5)
      ..relativeCubicTo(0.55, 3.1, 1.4, 3.95, 4.5, 4.5)
      ..relativeCubicTo(-3.1, 0.55, -3.95, 1.4, -4.5, 4.5)
      ..relativeCubicTo(-0.55, -3.1, -1.4, -3.95, -4.5, -4.5)
      ..relativeCubicTo(3.1, -0.55, 3.95, -1.4, 4.5, -4.5)
      ..close();
    canvas.drawPath(sparkle, Paint()..color = const Color(0xFFF4A83A));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Mark plus the "BILIM / MERKEZI" wordmark, as in the website header.
class Logo extends StatelessWidget {
  const Logo({super.key, this.light = false, this.size = 40});
  final bool light;
  final double size;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        BrandMark(size: size),
        SizedBox(width: size * 0.3),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'BILIM',
              style: TextStyle(
                fontFamily: displayFont,
                fontWeight: FontWeight.w800,
                fontSize: size * 0.42,
                height: 1,
                letterSpacing: 0.6,
                color: light ? Colors.white : c.ink,
              ),
            ),
            SizedBox(height: size * 0.06),
            Text(
              'MERKEZI',
              style: TextStyle(
                fontFamily: displayFont,
                fontWeight: FontWeight.w700,
                fontSize: size * 0.24,
                height: 1,
                letterSpacing: size * 0.08,
                color: light ? c.accentSoft : c.muted,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
