import 'package:flutter/material.dart';

/// The website's palette (src/app/globals.css), light and dark, as a theme extension:
/// `context.c.brand`, `context.c.ink`… so every screen reads one source of truth.
@immutable
class BmColors extends ThemeExtension<BmColors> {
  const BmColors({
    required this.ink,
    required this.inkSoft,
    required this.muted,
    required this.border,
    required this.surface,
    required this.sunken,
    required this.background,
    required this.panel,
    required this.brandStart,
    required this.brandMid,
    required this.brandEnd,
    required this.brand,
    required this.brandInk,
    required this.accent,
    required this.accentSoft,
    required this.accentDeep,
    required this.amber,
    required this.emerald,
    required this.rose,
    required this.shadow,
  });

  final Color ink;
  final Color inkSoft;
  final Color muted;
  final Color border;
  final Color surface;
  final Color sunken;
  final Color background;
  final Color panel;
  final Color brandStart;
  final Color brandMid;
  final Color brandEnd;
  final Color brand;
  final Color brandInk;
  final Color accent;
  final Color accentSoft;
  final Color accentDeep;
  final Color amber;
  final Color emerald;
  final Color rose;
  final Color shadow;

  static const light = BmColors(
    ink: Color(0xFF0B2233),
    inkSoft: Color(0xFF2F4D63),
    muted: Color(0xFF6A8299),
    border: Color(0xFFCFDDE9),
    surface: Color(0xFFFFFFFF),
    sunken: Color(0xFFE2EBF2),
    background: Color(0xFFEEF3F7),
    panel: Color(0xFF062434),
    brandStart: Color(0xFF073B52),
    brandMid: Color(0xFF0B6A8F),
    brandEnd: Color(0xFF12A3B8),
    brand: Color(0xFF0B6A8F),
    brandInk: Color(0xFF064A67),
    accent: Color(0xFFF4A83A),
    accentSoft: Color(0xFFFFD08A),
    accentDeep: Color(0xFFB8701A),
    amber: Color(0xFFE08A1E),
    emerald: Color(0xFF0E9E8A),
    rose: Color(0xFFE2604F),
    shadow: Color(0xFF1C3A4F),
  );

  static const dark = BmColors(
    ink: Color(0xFFEAF4FA),
    inkSoft: Color(0xFFB9D2E2),
    muted: Color(0xFF7E9DB2),
    border: Color(0xFF1D4257),
    surface: Color(0xFF0A2233),
    sunken: Color(0xFF071A27),
    background: Color(0xFF04131D),
    panel: Color(0xFF0D3448),
    brandStart: Color(0xFF3FB6D6),
    brandMid: Color(0xFF56C8DD),
    brandEnd: Color(0xFF7FDFD6),
    brand: Color(0xFF4FC2D8),
    brandInk: Color(0xFF8FDCEE),
    accent: Color(0xFFF4A83A),
    accentSoft: Color(0xFFFFD08A),
    accentDeep: Color(0xFFC98A2C),
    amber: Color(0xFFF0B968),
    emerald: Color(0xFF4FD3BD),
    rose: Color(0xFFFF8A78),
    shadow: Color(0xFF000306),
  );

  /// The signature gradient of buttons and hero panels (always the deep brand blues, so white
  /// text stays readable in both themes).
  LinearGradient get heroGradient => const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF073B52), Color(0xFF0B6A8F), Color(0xFF12A3B8)],
        stops: [0, 0.6, 1],
      );

  /// A soft shadow tinted with the brand, like the website's `shadow-glow-*`.
  List<BoxShadow> glow([double strength = 1]) => [
        BoxShadow(
          color: shadow.withValues(alpha: 0.10 * strength),
          blurRadius: 30 * strength,
          offset: Offset(0, 12 * strength),
          spreadRadius: -10,
        ),
      ];

  /// A colour for a child's avatar from its stored hue, matching the website's cards.
  Color childColor(int hue) => HSLColor.fromAHSL(1, (hue % 360).toDouble(), 0.55, 0.45).toColor();

  @override
  BmColors copyWith() => this;

  @override
  BmColors lerp(ThemeExtension<BmColors>? other, double t) {
    if (other is! BmColors) return this;
    Color l(Color a, Color b) => Color.lerp(a, b, t)!;
    return BmColors(
      ink: l(ink, other.ink),
      inkSoft: l(inkSoft, other.inkSoft),
      muted: l(muted, other.muted),
      border: l(border, other.border),
      surface: l(surface, other.surface),
      sunken: l(sunken, other.sunken),
      background: l(background, other.background),
      panel: l(panel, other.panel),
      brandStart: l(brandStart, other.brandStart),
      brandMid: l(brandMid, other.brandMid),
      brandEnd: l(brandEnd, other.brandEnd),
      brand: l(brand, other.brand),
      brandInk: l(brandInk, other.brandInk),
      accent: l(accent, other.accent),
      accentSoft: l(accentSoft, other.accentSoft),
      accentDeep: l(accentDeep, other.accentDeep),
      amber: l(amber, other.amber),
      emerald: l(emerald, other.emerald),
      rose: l(rose, other.rose),
      shadow: l(shadow, other.shadow),
    );
  }
}

extension BmColorsContext on BuildContext {
  BmColors get c => Theme.of(this).extension<BmColors>()!;
}
