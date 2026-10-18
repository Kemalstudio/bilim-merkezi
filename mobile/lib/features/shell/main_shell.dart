import 'package:bootstrap_icons/bootstrap_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/state.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/theme.dart';

/// The five tabs with a floating bar; each tab keeps its own history and scroll position.
class MainShell extends ConsumerWidget {
  const MainShell({super.key, required this.shell});
  final StatefulNavigationShell shell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final items = [
      (BootstrapIcons.house_door, BootstrapIcons.house_door_fill, s.navHome),
      (BootstrapIcons.people, BootstrapIcons.people_fill, s.navChildren),
      (BootstrapIcons.journal_bookmark, BootstrapIcons.journal_bookmark_fill, s.navCourses),
      (BootstrapIcons.calendar_week, BootstrapIcons.calendar_week_fill, s.navSchedule),
      (BootstrapIcons.person, BootstrapIcons.person_fill, s.navProfile),
    ];

    return Scaffold(
      extendBody: true,
      body: shell,
      bottomNavigationBar: _NavBar(
        index: shell.currentIndex,
        items: items,
        onTap: (index) {
          HapticFeedback.selectionClick();
          // A second tap on the current tab returns it to its first screen.
          shell.goBranch(index, initialLocation: index == shell.currentIndex);
        },
      ),
    );
  }
}

class _NavBar extends StatelessWidget {
  const _NavBar({required this.index, required this.items, required this.onTap});
  final int index;
  final List<(IconData, IconData, String)> items;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final bottom = MediaQuery.paddingOf(context).bottom;
    // The bar floats; lists scrolling under it fade into the background instead of showing
    // through the gap beneath it.
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [c.background.withValues(alpha: 0), c.background.withValues(alpha: 0.92), c.background],
          stops: const [0, 0.45, 1],
        ),
      ),
      child: Padding(
        padding: EdgeInsets.fromLTRB(12, 14, 12, bottom > 0 ? bottom : 12),
        child: Container(
          height: 68,
          padding: const EdgeInsets.symmetric(horizontal: 6),
          decoration: BoxDecoration(
            color: c.surface,
            borderRadius: BorderRadius.circular(26),
            border: Border.all(color: c.border.withValues(alpha: 0.8)),
            boxShadow: [BoxShadow(color: c.shadow.withValues(alpha: 0.16), blurRadius: 30, offset: const Offset(0, 10), spreadRadius: -6)],
          ),
          child: Row(
            children: [
              for (var i = 0; i < items.length; i++)
                Expanded(
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () => onTap(i),
                    child: _NavItem(icon: items[i].$1, activeIcon: items[i].$2, label: items[i].$3, active: i == index),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({required this.icon, required this.activeIcon, required this.label, required this.active});
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final color = active ? c.brand : c.muted;
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 280),
          curve: Curves.easeOutCubic,
          width: active ? 52 : 36,
          height: 32,
          decoration: BoxDecoration(
            color: active ? c.brand.withValues(alpha: 0.12) : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
          ),
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            transitionBuilder: (child, animation) => ScaleTransition(scale: animation, child: child),
            child: Icon(active ? activeIcon : icon, key: ValueKey(active), size: 19, color: color),
          ),
        ),
        const SizedBox(height: 3),
        AnimatedDefaultTextStyle(
          duration: const Duration(milliseconds: 200),
          style: TextStyle(fontFamily: displayFont, fontSize: 10.5, fontWeight: active ? FontWeight.w800 : FontWeight.w600, color: color),
          child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis),
        ),
      ],
    );
  }
}
