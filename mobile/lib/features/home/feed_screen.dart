import 'package:bootstrap_icons/bootstrap_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/models.dart';
import '../../core/i18n/strings.dart';
import '../../core/state.dart';
import '../../widgets/common.dart';
import '../../widgets/page_header.dart';
import '../../widgets/tiles.dart';

/// Every recent update. Opening it marks them read, so the bell's dot goes out.
class FeedScreen extends ConsumerStatefulWidget {
  const FeedScreen({super.key});

  @override
  ConsumerState<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends ConsumerState<FeedScreen> {
  late final DateTime _seenBefore = ref.read(feedSeenProvider);

  @override
  void initState() {
    super.initState();
    // Highlights stay for this visit; next time they count as read.
    WidgetsBinding.instance.addPostFrameCallback((_) => ref.read(feedSeenProvider.notifier).markSeen());
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final feed = ref.watch(feedProvider);

    return Scaffold(
      body: RefreshIndicator(
        edgeOffset: MediaQuery.paddingOf(context).top + 58,
        onRefresh: () => ref.refresh(feedProvider.future),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          slivers: [
            PageHeader(title: s.events, back: true),
            switch (feed) {
              AsyncValue(:final value?) when value.isEmpty => SliverFillRemaining(
                  hasScrollBody: false,
                  child: EmptyState(icon: BootstrapIcons.bell, title: s.feedEmptyTitle, text: s.feedEmptyText),
                ),
              AsyncValue(:final value?) => SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 40),
                  sliver: SliverList.list(children: _grouped(value, s)),
                ),
              AsyncValue(:final error?) when !feed.isLoading => SliverFillRemaining(
                  hasScrollBody: false,
                  child: ErrorState(error: error, s: s, onRetry: () => ref.invalidate(feedProvider)),
                ),
              _ => SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                  sliver: SliverList.list(children: [
                    for (var i = 0; i < 5; i++)
                      const Padding(padding: EdgeInsets.only(bottom: 10), child: SkeletonBox(height: 72, radius: 24)),
                  ]),
                ),
            },
          ],
        ),
      ),
    );
  }

  /// "Today" first, then everything earlier, each under a small heading.
  List<Widget> _grouped(List<FeedItem> items, S s) {
    final now = DateTime.now();
    final startOfDay = DateTime(now.year, now.month, now.day);
    final today = items.where((item) => !item.at.isBefore(startOfDay)).toList();
    final earlier = items.where((item) => item.at.isBefore(startOfDay)).toList();
    var index = 0;
    Widget tile(FeedItem item) => Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: FeedTile(item: item, s: s, unread: item.at.isAfter(_seenBefore)),
        ).enter(index++);
    return [
      if (today.isNotEmpty) ...[SectionHeader(s.feedToday).enter(index++), ...today.map(tile)],
      if (earlier.isNotEmpty) ...[
        if (today.isNotEmpty) const SizedBox(height: 8),
        SectionHeader(s.feedEarlier).enter(index++),
        ...earlier.map(tile),
      ],
    ];
  }
}
