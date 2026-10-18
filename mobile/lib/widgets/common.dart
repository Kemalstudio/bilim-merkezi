import 'package:bootstrap_icons/bootstrap_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../core/api/api_client.dart';
import '../core/i18n/strings.dart';
import '../core/theme/colors.dart';
import '../core/theme/theme.dart';

/// Shrinks a little under the finger and springs back: every tappable card feels physical.
class Pressable extends StatefulWidget {
  const Pressable({super.key, required this.child, this.onTap, this.scale = 0.97});
  final Widget child;
  final VoidCallback? onTap;
  final double scale;

  @override
  State<Pressable> createState() => _PressableState();
}

class _PressableState extends State<Pressable> {
  bool _down = false;

  void _set(bool value) {
    if (widget.onTap != null && _down != value) setState(() => _down = value);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: (_) => _set(true),
      onTapUp: (_) => _set(false),
      onTapCancel: () => _set(false),
      onTap: widget.onTap == null
          ? null
          : () {
              HapticFeedback.selectionClick();
              widget.onTap!();
            },
      child: AnimatedScale(
        scale: _down ? widget.scale : 1,
        duration: const Duration(milliseconds: 140),
        curve: Curves.easeOutCubic,
        child: widget.child,
      ),
    );
  }
}

/// The white rounded card of the website, with its soft brand-tinted shadow.
class AppCard extends StatelessWidget {
  const AppCard({super.key, required this.child, this.onTap, this.padding = const EdgeInsets.all(18), this.color, this.radius = 24});
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry padding;
  final Color? color;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final card = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: color ?? c.surface,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: c.border.withValues(alpha: 0.7)),
        boxShadow: c.glow(),
      ),
      child: child,
    );
    return onTap == null ? card : Pressable(onTap: onTap, child: card);
  }
}

class SectionHeader extends StatelessWidget {
  const SectionHeader(this.title, {super.key, this.action, this.onAction});
  final String title;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 8, 0, 12),
      child: Row(
        children: [
          Expanded(child: Text(title, style: Theme.of(context).textTheme.titleLarge)),
          if (action != null)
            TextButton(
              onPressed: onAction,
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Text(action!),
                const SizedBox(width: 4),
                const Icon(BootstrapIcons.chevron_right, size: 13),
              ]),
            ),
        ],
      ),
    );
  }
}

/// A coloured icon in a soft rounded tile.
class IconTile extends StatelessWidget {
  const IconTile(this.icon, {super.key, this.color, this.size = 44});
  final IconData icon;
  final Color? color;
  final double size;

  @override
  Widget build(BuildContext context) {
    final tint = color ?? context.c.brand;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: tint.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(size * 0.32)),
      child: Icon(icon, color: tint, size: size * 0.45),
    );
  }
}

class ChildAvatar extends StatelessWidget {
  const ChildAvatar({super.key, required this.initials, required this.hue, this.size = 48});
  final String initials;
  final int hue;
  final double size;

  @override
  Widget build(BuildContext context) {
    final base = context.c.childColor(hue);
    final light = HSLColor.fromColor(base).withLightness(0.62).toColor();
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [light, base]),
        boxShadow: [BoxShadow(color: base.withValues(alpha: 0.35), blurRadius: 14, offset: const Offset(0, 6), spreadRadius: -4)],
      ),
      child: Text(
        initials,
        style: TextStyle(fontFamily: displayFont, fontWeight: FontWeight.w800, color: Colors.white, fontSize: size * 0.36),
      ),
    );
  }
}

/// Small pill for statuses: active, awaiting payment, cancelled.
class StatusPill extends StatelessWidget {
  const StatusPill(this.status, this.label, {super.key});
  final String status;
  final String label;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final color = switch (status) { 'ACTIVE' || 'SUCCEEDED' => c.emerald, 'PENDING' => c.amber, _ => c.rose };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.13), borderRadius: BorderRadius.circular(99)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 6, height: 6, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Text(label, style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: color)),
      ]),
    );
  }
}

/// A tag with an icon: "12 ч", "3 в неделю", "до 10 чел.".
class MetaTag extends StatelessWidget {
  const MetaTag(this.icon, this.label, {super.key});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: c.sunken, borderRadius: BorderRadius.circular(10)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 13, color: c.brand),
        const SizedBox(width: 6),
        Text(label, style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: c.inkSoft)),
      ]),
    );
  }
}

/// Friendly empty screen: an icon in a halo, a title, a sentence and an optional button.
class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.icon, required this.title, required this.text, this.action, this.onAction, this.compact = false});
  final IconData icon;
  final String title;
  final String text;
  final String? action;
  final VoidCallback? onAction;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final theme = Theme.of(context);
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 24, vertical: compact ? 20 : 48),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: compact ? 64 : 84,
            height: compact ? 64 : 84,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(colors: [c.brand.withValues(alpha: 0.18), c.brand.withValues(alpha: 0.04)]),
            ),
            child: Icon(icon, size: compact ? 26 : 34, color: c.brand),
          ).animate().scale(begin: const Offset(0.8, 0.8), duration: 400.ms, curve: Curves.easeOutBack),
          const SizedBox(height: 18),
          Text(title, textAlign: TextAlign.center, style: theme.textTheme.titleMedium),
          const SizedBox(height: 6),
          Text(text, textAlign: TextAlign.center, style: theme.textTheme.bodyMedium),
          if (action != null) ...[
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: onAction,
              icon: const Icon(BootstrapIcons.plus_lg, size: 18),
              label: Text(action!),
              style: FilledButton.styleFrom(minimumSize: const Size(0, 50), padding: const EdgeInsets.symmetric(horizontal: 22)),
            ),
          ],
        ],
      ),
    );
  }
}

/// What a failed load shows: the reason in the parent's words and a retry button.
class ErrorState extends StatelessWidget {
  const ErrorState({super.key, required this.error, required this.onRetry, required this.s});
  final Object error;
  final VoidCallback onRetry;
  final S s;

  @override
  Widget build(BuildContext context) {
    final offline = error is ApiException && (error as ApiException).offline;
    final message = error is ApiException ? (error as ApiException).message : s.offline;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          IconTile(offline ? BootstrapIcons.wifi_off : BootstrapIcons.exclamation_triangle, color: context.c.rose, size: 64),
          const SizedBox(height: 16),
          Text(s.loadFailed, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 6),
          Text(message, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 18),
          OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(BootstrapIcons.arrow_clockwise, size: 16),
            label: Text(s.retry),
            style: OutlinedButton.styleFrom(minimumSize: const Size(0, 46), padding: const EdgeInsets.symmetric(horizontal: 20)),
          ),
        ]),
      ),
    );
  }
}

/// A short message at the bottom of the screen; red for errors.
void toast(BuildContext context, String message, {bool error = false}) {
  final c = context.c;
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(
      backgroundColor: error ? c.rose : c.panel,
      content: Row(children: [
        Icon(error ? BootstrapIcons.exclamation_circle : BootstrapIcons.check2_circle, color: Colors.white, size: 18),
        const SizedBox(width: 10),
        Expanded(child: Text(message)),
      ]),
    ));
}

String errorText(Object error, S s) => error is ApiException ? error.message : s.offline;

/// Primary button with a spinner while its action runs.
class BusyButton extends StatelessWidget {
  const BusyButton({super.key, required this.label, required this.busy, required this.onPressed, this.icon});
  final String label;
  final bool busy;
  final VoidCallback? onPressed;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final onPrimary = Theme.of(context).colorScheme.onPrimary;
    return FilledButton(
      onPressed: busy ? null : onPressed,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 200),
        child: busy
            ? SizedBox.square(
                key: const ValueKey('busy'),
                dimension: 22,
                child: CircularProgressIndicator(strokeWidth: 2.4, color: context.c.brand),
              )
            : Row(key: const ValueKey('idle'), mainAxisSize: MainAxisSize.min, children: [
                Text(label),
                if (icon != null) ...[const SizedBox(width: 8), Icon(icon, size: 18, color: onPrimary)],
              ]),
      ),
    );
  }
}

/// Segmented switch between two ways of doing something (SMS / password…).
class SegmentSwitch extends StatelessWidget {
  const SegmentSwitch({super.key, required this.labels, required this.index, required this.onChanged});
  final List<String> labels;
  final int index;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Container(
      height: 50,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(color: c.sunken, borderRadius: BorderRadius.circular(16)),
      child: LayoutBuilder(builder: (context, constraints) {
        final width = constraints.maxWidth / labels.length;
        return Stack(children: [
          AnimatedPositioned(
            duration: const Duration(milliseconds: 260),
            curve: Curves.easeOutCubic,
            left: width * index,
            top: 0,
            bottom: 0,
            width: width,
            child: Container(
              decoration: BoxDecoration(
                color: c.surface,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [BoxShadow(color: c.shadow.withValues(alpha: 0.12), blurRadius: 10, offset: const Offset(0, 3))],
              ),
            ),
          ),
          Row(
            children: [
              for (var i = 0; i < labels.length; i++)
                Expanded(
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () {
                      HapticFeedback.selectionClick();
                      onChanged(i);
                    },
                    child: Center(
                      child: AnimatedDefaultTextStyle(
                        duration: const Duration(milliseconds: 200),
                        style: TextStyle(
                          fontFamily: displayFont,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                          color: i == index ? c.ink : c.muted,
                        ),
                        child: Text(labels[i], maxLines: 1, overflow: TextOverflow.ellipsis),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ]);
      }),
    );
  }
}

/// Fades and lifts list items in one after another as a screen opens.
extension Entrance on Widget {
  Widget enter(int index) => animate()
      .fadeIn(duration: 380.ms, delay: (40 * index).clamp(0, 400).ms, curve: Curves.easeOutCubic)
      .slideY(begin: 0.08, end: 0, duration: 380.ms, delay: (40 * index).clamp(0, 400).ms, curve: Curves.easeOutCubic);
}

/// A placeholder block with a soft moving shine, for lists still loading.
class SkeletonBox extends StatelessWidget {
  const SkeletonBox({super.key, this.height = 80, this.width = double.infinity, this.radius = 20});
  final double height;
  final double width;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Container(
      height: height,
      width: width,
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: c.border.withValues(alpha: 0.6)),
      ),
    )
        .animate(onPlay: (controller) => controller.repeat())
        .shimmer(duration: 1300.ms, color: c.sunken.withValues(alpha: 0.9), angle: 0.4);
  }
}
