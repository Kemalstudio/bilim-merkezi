import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'colors.dart';

/// Display face (headings, numbers, buttons) and body face, both bundled: no network needed.
const displayFont = 'Manrope';
const bodyFont = 'Inter';

ThemeData buildTheme(Brightness brightness) {
  final c = brightness == Brightness.light ? BmColors.light : BmColors.dark;
  final scheme = ColorScheme(
    brightness: brightness,
    primary: brightness == Brightness.light ? c.brandStart : c.brand,
    onPrimary: brightness == Brightness.light ? Colors.white : const Color(0xFF04131D),
    secondary: c.accent,
    onSecondary: const Color(0xFF241400),
    error: c.rose,
    onError: Colors.white,
    surface: c.surface,
    onSurface: c.ink,
    surfaceContainerHighest: c.sunken,
    outline: c.border,
    outlineVariant: c.border,
  );

  TextStyle display(double size, FontWeight weight, {double spacing = -0.4, double height = 1.2}) => TextStyle(
        fontFamily: displayFont,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: spacing,
        height: height,
        color: c.ink,
      );
  TextStyle body(double size, FontWeight weight, {Color? color, double height = 1.45}) =>
      TextStyle(fontFamily: bodyFont, fontSize: size, fontWeight: weight, height: height, color: color ?? c.ink);

  final radius = BorderRadius.circular(16);
  OutlineInputBorder field(Color color, [double width = 1]) =>
      OutlineInputBorder(borderRadius: radius, borderSide: BorderSide(color: color, width: width));

  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: scheme,
    scaffoldBackgroundColor: c.background,
    fontFamily: bodyFont,
    extensions: [c],
    splashFactory: InkSparkle.splashFactory,
    textTheme: TextTheme(
      displaySmall: display(32, FontWeight.w800, spacing: -1.2, height: 1.1),
      headlineMedium: display(26, FontWeight.w800, spacing: -0.9, height: 1.15),
      headlineSmall: display(22, FontWeight.w800, spacing: -0.6),
      titleLarge: display(19, FontWeight.w700, spacing: -0.4),
      titleMedium: display(16, FontWeight.w700, spacing: -0.2),
      titleSmall: display(14, FontWeight.w700, spacing: -0.1),
      bodyLarge: body(16, FontWeight.w400),
      bodyMedium: body(14.5, FontWeight.w400, color: c.inkSoft),
      bodySmall: body(12.5, FontWeight.w500, color: c.muted),
      labelLarge: display(15, FontWeight.w700, spacing: 0),
      labelMedium: body(12.5, FontWeight.w600, color: c.muted),
      labelSmall: body(11, FontWeight.w700, color: c.muted),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: c.background,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      foregroundColor: c.ink,
      titleTextStyle: display(19, FontWeight.w800, spacing: -0.5),
      systemOverlayStyle: brightness == Brightness.light ? SystemUiOverlayStyle.dark : SystemUiOverlayStyle.light,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: c.surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      hintStyle: body(15, FontWeight.w400, color: c.muted),
      labelStyle: body(15, FontWeight.w500, color: c.muted),
      floatingLabelStyle: body(14, FontWeight.w600, color: c.brand),
      prefixIconColor: c.muted,
      border: field(c.border),
      enabledBorder: field(c.border),
      focusedBorder: field(c.brand, 1.6),
      errorBorder: field(c.rose),
      focusedErrorBorder: field(c.rose, 1.6),
      errorStyle: body(12.5, FontWeight.w500, color: c.rose),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(54),
        shape: RoundedRectangleBorder(borderRadius: radius),
        textStyle: display(15.5, FontWeight.w700, spacing: 0),
        backgroundColor: scheme.primary,
        foregroundColor: scheme.onPrimary,
        disabledBackgroundColor: c.sunken,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(54),
        shape: RoundedRectangleBorder(borderRadius: radius),
        side: BorderSide(color: c.border),
        foregroundColor: c.ink,
        textStyle: display(15.5, FontWeight.w700, spacing: 0),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: c.brandInk,
        textStyle: display(14, FontWeight.w700, spacing: 0),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: c.surface,
      selectedColor: scheme.primary,
      side: BorderSide(color: c.border),
      shape: const StadiumBorder(),
      labelStyle: body(13.5, FontWeight.w600),
      secondaryLabelStyle: body(13.5, FontWeight.w600, color: scheme.onPrimary),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      showCheckmark: false,
    ),
    dividerTheme: DividerThemeData(color: c.border, thickness: 1, space: 1),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: c.surface,
      surfaceTintColor: Colors.transparent,
      showDragHandle: true,
      dragHandleColor: c.border,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: c.surface,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      titleTextStyle: display(19, FontWeight.w800, spacing: -0.4),
      contentTextStyle: body(14.5, FontWeight.w400, color: c.inkSoft),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: c.panel,
      contentTextStyle: body(14, FontWeight.w500, color: Colors.white),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      insetPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
    ),
    progressIndicatorTheme: ProgressIndicatorThemeData(color: c.brand, linearTrackColor: c.sunken),
    pageTransitionsTheme: const PageTransitionsTheme(builders: {
      TargetPlatform.android: FadeForwardsPageTransitionsBuilder(),
      TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
    }),
  );
}
