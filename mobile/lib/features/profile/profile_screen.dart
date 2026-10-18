import 'package:bootstrap_icons/bootstrap_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/config.dart';
import '../../core/i18n/strings.dart';
import '../../core/notifications.dart';
import '../../core/state.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/theme.dart';
import '../../widgets/common.dart';
import '../../widgets/page_header.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  Future<void> _open(String url) => launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);

  Future<void> _editName(BuildContext context, WidgetRef ref, S s, String current) async {
    final controller = TextEditingController(text: current);
    final name = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(s.editName),
        content: TextField(
          controller: controller,
          autofocus: true,
          textCapitalization: TextCapitalization.words,
          decoration: InputDecoration(labelText: s.yourName),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text(s.cancel)),
          TextButton(onPressed: () => Navigator.pop(context, controller.text.trim()), child: Text(s.save)),
        ],
      ),
    );
    controller.dispose();
    if (name == null || name == current || !context.mounted) return;
    if (name.length < 2) return toast(context, s.vName, error: true);
    try {
      final me = await ref.read(apiProvider).updateName(name);
      ref.read(sessionProvider.notifier).updateMe(me);
      ref.invalidate(dashboardProvider);
      if (context.mounted) toast(context, s.nameSaved);
    } catch (error) {
      if (context.mounted) toast(context, errorText(error, s), error: true);
    }
  }

  Future<void> _signOut(BuildContext context, WidgetRef ref, S s) async {
    final sure = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(s.signOutTitle),
        content: Text(s.signOutText),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(s.cancel)),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: context.c.rose),
            child: Text(s.signOut),
          ),
        ],
      ),
    );
    if (sure == true) await ref.read(sessionProvider.notifier).signOut();
  }

  void _chooseLanguage(BuildContext context, WidgetRef ref, String current) {
    showModalBottomSheet<void>(
      context: context,
      builder: (context) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          for (final entry in S.languages.entries)
            ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 24),
              title: Text(entry.value, style: Theme.of(context).textTheme.titleMedium),
              trailing: entry.key == current ? Icon(BootstrapIcons.check2, color: context.c.brand) : null,
              onTap: () {
                ref.read(preferencesProvider.notifier).setLocale(entry.key);
                refreshAccountData(ref);
                Navigator.pop(context);
              },
            ),
          const SizedBox(height: 12),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final prefs = ref.watch(preferencesProvider);
    final me = ref.watch(sessionProvider).me;
    final info = ref.watch(infoProvider).value;
    final c = context.c;
    final theme = Theme.of(context);
    final name = me?.name ?? '';
    final initials = name.trim().isEmpty
        ? '·'
        : name.trim().split(RegExp(r'\s+')).take(2).map((part) => part[0]).join().toUpperCase();
    var i = 0;

    return Scaffold(
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          PageHeader(title: s.profileTitle),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 120),
            sliver: SliverList.list(children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(gradient: c.heroGradient, borderRadius: BorderRadius.circular(26), boxShadow: c.glow(1.2)),
            child: Row(children: [
              Container(
                width: 60,
                height: 60,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
                ),
                child: Text(initials, style: const TextStyle(fontFamily: displayFont, fontWeight: FontWeight.w800, fontSize: 21, color: Colors.white)),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(name.isEmpty ? s.appName : name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontFamily: displayFont, fontWeight: FontWeight.w800, fontSize: 19, color: Colors.white)),
                  const SizedBox(height: 4),
                  Text(me?.email ?? s.noEmail, style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.75))),
                  Text(me?.phoneFormatted ?? s.noPhone, style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.75))),
                ]),
              ),
              IconButton(
                onPressed: () => _editName(context, ref, s, name),
                icon: const Icon(BootstrapIcons.pencil, size: 17, color: Colors.white),
                style: IconButton.styleFrom(backgroundColor: Colors.white.withValues(alpha: 0.14)),
              ),
            ]),
          ).enter(i++),
          const SizedBox(height: 20),
          _Group(title: s.account, children: [
            _Row(icon: BootstrapIcons.journal_bookmark, title: s.myEnrollments, onTap: () => context.push('/enrollments')),
            _Row(icon: BootstrapIcons.bell, title: s.events, onTap: () => context.push('/feed')),
            _Row(
              icon: BootstrapIcons.shield_lock,
              title: s.siteSettings,
              subtitle: s.siteSettingsText,
              external: true,
              onTap: () => _open('${AppConfig.siteUrl}/account/settings'),
            ),
          ]).enter(i++),
          const SizedBox(height: 16),
          _Group(title: s.notifTitle, children: [_NotificationSettings(s: s)]).enter(i++),
          const SizedBox(height: 16),
          _Group(title: s.language, children: [
            _Row(
              icon: BootstrapIcons.globe2,
              title: s.language,
              value: S.languages[prefs.locale],
              onTap: () => _chooseLanguage(context, ref, prefs.locale),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 6, 14, 14),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  IconTile(BootstrapIcons.circle_half, size: 36),
                  const SizedBox(width: 12),
                  Text(s.theme, style: theme.textTheme.titleSmall),
                ]),
                const SizedBox(height: 12),
                SegmentSwitch(
                  labels: [s.themeSystem, s.themeLight, s.themeDark],
                  index: ThemeMode.values.indexOf(prefs.themeMode),
                  onChanged: (index) => ref.read(preferencesProvider.notifier).setThemeMode(ThemeMode.values[index]),
                ),
              ]),
            ),
          ]).enter(i++),
          const SizedBox(height: 16),
          _Group(title: s.contactCenter, children: [
            if (info != null) ...[
              _Row(
                icon: BootstrapIcons.telephone,
                title: s.call,
                value: info.phone,
                onTap: () => _open('tel:${info.phone.replaceAll(RegExp(r'[^\d+]'), '')}'),
              ),
              _Row(icon: BootstrapIcons.envelope, title: s.writeEmail, value: info.email, onTap: () => _open('mailto:${info.email}')),
              _Row(icon: BootstrapIcons.geo_alt, title: info.address, subtitle: info.hours.isEmpty ? null : info.hours),
            ],
            _Row(icon: BootstrapIcons.box_arrow_up_right, title: s.website, external: true, onTap: () => _open(AppConfig.siteUrl)),
          ]).enter(i++),
          const SizedBox(height: 16),
          AppCard(
            padding: EdgeInsets.zero,
            child: _Row(icon: BootstrapIcons.box_arrow_right, title: s.signOut, danger: true, onTap: () => _signOut(context, ref, s)),
          ).enter(i++),
          const SizedBox(height: 22),
          Center(child: Text('Bilim Merkezi · 1.0.0', style: theme.textTheme.labelSmall)),
            ]),
          ),
        ],
      ),
    );
  }
}

class _Group extends StatelessWidget {
  const _Group({required this.title, required this.children});
  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(6, 0, 6, 8),
        child: Text(title.toUpperCase(), style: Theme.of(context).textTheme.labelSmall?.copyWith(letterSpacing: 1)),
      ),
      AppCard(padding: const EdgeInsets.symmetric(vertical: 4), child: Column(children: children)),
    ]);
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.icon, required this.title, this.subtitle, this.value, this.onTap, this.external = false, this.danger = false});
  final IconData icon;
  final String title;
  final String? subtitle;
  final String? value;
  final VoidCallback? onTap;
  final bool external;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final theme = Theme.of(context);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(children: [
          IconTile(icon, size: 36, color: danger ? c.rose : null),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: theme.textTheme.titleSmall?.copyWith(color: danger ? c.rose : null)),
              if (subtitle != null) ...[
                const SizedBox(height: 2),
                Text(subtitle!, style: theme.textTheme.bodySmall),
              ],
            ]),
          ),
          if (value != null)
            Flexible(
              child: Text(value!,
                  maxLines: 1, overflow: TextOverflow.ellipsis, textAlign: TextAlign.end, style: theme.textTheme.bodySmall),
            ),
          if (onTap != null) ...[
            const SizedBox(width: 6),
            Icon(external ? BootstrapIcons.box_arrow_up_right : BootstrapIcons.chevron_right, size: 13, color: c.muted),
          ],
        ]),
      ),
    );
  }
}

/// The three kinds of notifications, and a way back when the phone blocks them all.
class _NotificationSettings extends ConsumerWidget {
  const _NotificationSettings({required this.s});
  final S s;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final c = context.c;
    final theme = Theme.of(context);
    final prefs = ref.watch(notifyPrefsProvider);
    final permitted = ref.watch(notifyPermissionProvider).value ?? true;
    final rows = [
      (NotifyKind.enrollments, BootstrapIcons.patch_check, c.emerald, s.notifEnrollments, s.notifEnrollmentsHint),
      (NotifyKind.scores, BootstrapIcons.trophy, c.brand, s.notifScores, s.notifScoresHint),
      (NotifyKind.reminders, BootstrapIcons.alarm, c.accentDeep, s.notifReminders, s.notifRemindersHint),
    ];

    return Column(children: [
      AnimatedSize(
        duration: const Duration(milliseconds: 260),
        curve: Curves.easeOutCubic,
        child: permitted
            ? const SizedBox(width: double.infinity)
            : Container(
                margin: const EdgeInsets.fromLTRB(10, 8, 10, 4),
                padding: const EdgeInsets.fromLTRB(14, 12, 8, 12),
                decoration: BoxDecoration(color: c.amber.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(16)),
                child: Row(children: [
                  Icon(BootstrapIcons.bell_slash, size: 18, color: c.amber),
                  const SizedBox(width: 10),
                  Expanded(child: Text(s.notifBlocked, style: theme.textTheme.bodySmall?.copyWith(color: c.inkSoft))),
                  TextButton(
                    onPressed: () async {
                      await AppNotifications.requestPermission();
                      ref.invalidate(notifyPermissionProvider);
                    },
                    child: Text(s.notifAllow),
                  ),
                ]),
              ),
      ),
      for (final (kind, icon, color, title, hint) in rows)
        InkWell(
          onTap: () => ref.read(notifyPrefsProvider.notifier).set(kind, !(prefs[kind] ?? true)),
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 8, 10),
            child: Row(children: [
              IconTile(icon, size: 36, color: color),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(title, style: theme.textTheme.titleSmall),
                  const SizedBox(height: 2),
                  Text(hint, style: theme.textTheme.bodySmall),
                ]),
              ),
              Switch(
                value: prefs[kind] ?? true,
                onChanged: (value) => ref.read(notifyPrefsProvider.notifier).set(kind, value),
              ),
            ]),
          ),
        ),
    ]);
  }
}
