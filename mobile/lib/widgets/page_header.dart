import 'dart:math' as math;
import 'dart:ui';

import 'package:bootstrap_icons/bootstrap_icons.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/theme/colors.dart';
import '../core/theme/theme.dart';

/// The header of every main screen: a large Manrope title with a short line under it that,
/// as the list scrolls, folds into a compact frosted bar — like the website's sticky header.
///
/// Use as the first sliver of a [CustomScrollView].
class PageHeader extends StatelessWidget {
  const PageHeader({super.key, required this.title, this.subtitle, this.actions = const [], this.back = false});
  final String title;
  final String? subtitle;
  final List<Widget> actions;

  /// Shows a back button (detail screens opened over the tabs).
  final bool back;

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;
    final scaler = MediaQuery.textScalerOf(context);
    // Open height: title block plus the subtitle as it actually wraps (up to two lines).
    var subtitleHeight = 0.0;
    if (subtitle != null) {
      final painter = TextPainter(
        text: TextSpan(text: subtitle, style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.35)),
        textDirection: Directionality.of(context),
        textScaler: scaler,
        maxLines: 2,
      )..layout(maxWidth: MediaQuery.sizeOf(context).width - 40);
      subtitleHeight = painter.height + 5;
    }
    return SliverPersistentHeader(
      pinned: true,
      delegate: _HeaderDelegate(
        top: top,
        title: title,
        subtitle: subtitle,
        actions: actions,
        back: back,
        expanded: 54 + scaler.scale(30) * 1.15 + subtitleHeight + 16,
      ),
    );
  }
}

class _HeaderDelegate extends SliverPersistentHeaderDelegate {
  _HeaderDelegate({
    required this.top,
    required this.title,
    required this.subtitle,
    required this.actions,
    required this.back,
    required this.expanded,
  });

  final double top;
  final String title;
  final String? subtitle;
  final List<Widget> actions;
  final bool back;
  final double expanded;

  static const _collapsed = 58.0;

  @override
  double get minExtent => top + _collapsed;

  @override
  double get maxExtent => top + math.max(expanded, _collapsed);

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    final c = context.c;
    final range = maxExtent - minExtent;
    // 0 → fully open, 1 → folded into the bar.
    final t = range <= 0 ? 1.0 : (shrinkOffset / range).clamp(0.0, 1.0);
    final eased = Curves.easeOut.transform(t);
    final scrolledUnder = shrinkOffset > range - 2 || overlapsContent;
    final leading = back ? 52.0 : 20.0;

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: scrolledUnder ? 18 : 0, sigmaY: scrolledUnder ? 18 : 0),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            color: c.background.withValues(alpha: scrolledUnder ? 0.82 : 1),
            border: Border(bottom: BorderSide(color: c.border.withValues(alpha: scrolledUnder ? 0.7 : 0))),
          ),
          child: Stack(children: [
            // The large title slides up and shrinks into the bar.
            Positioned(
              left: lerpDouble(20, leading, eased),
              right: 20 + actions.length * 46.0 * eased,
              top: top + lerpDouble(_collapsed - 4, 15, eased)!,
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontFamily: displayFont,
                    fontWeight: FontWeight.w800,
                    fontSize: lerpDouble(30, 19, eased),
                    letterSpacing: lerpDouble(-1.1, -0.5, eased),
                    height: 1.15,
                    color: c.ink,
                  ),
                ),
                if (subtitle != null)
                  Opacity(
                    opacity: (1 - t * 2.2).clamp(0.0, 1.0),
                    child: Padding(
                      padding: const EdgeInsets.only(top: 5),
                      child: Text(
                        subtitle!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.35),
                      ),
                    ),
                  ),
              ]),
            ),
            if (back)
              Positioned(
                left: 6,
                top: top + 5,
                child: IconButton(
                  onPressed: () => context.canPop() ? context.pop() : context.go('/home'),
                  icon: Icon(BootstrapIcons.arrow_left, size: 20, color: c.ink),
                ),
              ),
            if (actions.isNotEmpty)
              Positioned(
                right: 10,
                top: top + 6,
                child: Row(mainAxisSize: MainAxisSize.min, children: actions),
              ),
          ]),
        ),
      ),
    );
  }

  @override
  bool shouldRebuild(_HeaderDelegate old) =>
      old.title != title || old.subtitle != subtitle || old.top != top || old.actions != actions || old.expanded != expanded;
}

/// A round icon button for the header's right side.
class HeaderAction extends StatelessWidget {
  const HeaderAction({super.key, required this.icon, required this.onTap, this.badge = 0, this.tooltip});
  final IconData icon;
  final VoidCallback onTap;
  final int badge;
  final String? tooltip;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Padding(
      padding: const EdgeInsets.only(left: 6),
      child: Stack(clipBehavior: Clip.none, children: [
        IconButton(
          tooltip: tooltip,
          onPressed: onTap,
          icon: Icon(icon, size: 18, color: c.ink),
          style: IconButton.styleFrom(
            backgroundColor: c.surface,
            side: BorderSide(color: c.border.withValues(alpha: 0.8)),
            fixedSize: const Size(42, 42),
          ),
        ),
        if (badge > 0)
          Positioned(
            right: 2,
            top: 2,
            child: Container(
              constraints: const BoxConstraints(minWidth: 17),
              height: 17,
              padding: const EdgeInsets.symmetric(horizontal: 4),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: c.accent,
                borderRadius: BorderRadius.circular(9),
                border: Border.all(color: c.background, width: 2),
              ),
              child: Text('$badge', style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, color: Color(0xFF241400))),
            ),
          ),
      ]),
    );
  }
}
