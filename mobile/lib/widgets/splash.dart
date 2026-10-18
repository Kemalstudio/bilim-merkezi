import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import 'brand.dart';

/// Shown for the moment the saved session is read from the keystore.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF062434),
      body: Center(
        child: const BrandMark(size: 84)
            .animate(onPlay: (controller) => controller.repeat(reverse: true))
            .scaleXY(begin: 0.94, end: 1.04, duration: 900.ms, curve: Curves.easeInOut),
      ),
    );
  }
}
