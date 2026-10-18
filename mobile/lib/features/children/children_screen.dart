import 'package:bootstrap_icons/bootstrap_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:skeletonizer/skeletonizer.dart';

import '../../core/api/models.dart';
import '../../core/state.dart';
import '../../widgets/common.dart';
import '../../widgets/page_header.dart';
import '../../widgets/tiles.dart';
import 'child_form.dart';

class ChildrenScreen extends ConsumerWidget {
  const ChildrenScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final children = ref.watch(childrenProvider);

    Widget list(List<ChildSummary> items, {bool loading = false}) => SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
          sliver: Skeletonizer.sliver(
            enabled: loading,
            child: SliverList.separated(
              itemCount: items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) => ChildCard(
                child: items[index],
                s: s,
                wide: true,
                onTap: loading ? null : () => context.push('/children/${items[index].id}'),
              ).enter(index),
            ),
          ),
        );

    return Scaffold(
      body: RefreshIndicator(
        edgeOffset: MediaQuery.paddingOf(context).top + 58,
        onRefresh: () => ref.refresh(childrenProvider.future),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          slivers: [
            PageHeader(
              title: s.myChildren,
              actions: [HeaderAction(icon: BootstrapIcons.plus_lg, tooltip: s.addChild, onTap: () => showChildForm(context, ref))],
            ),
            switch (children) {
              AsyncValue(:final value?) when value.isEmpty => SliverFillRemaining(
                  hasScrollBody: false,
                  child: EmptyState(
                    icon: BootstrapIcons.people,
                    title: s.noChildrenTitle,
                    text: s.noChildrenText,
                    action: s.addChild,
                    onAction: () => showChildForm(context, ref),
                  ),
                ),
              AsyncValue(:final value?) => list(value),
              AsyncValue(:final error?) when !children.isLoading => SliverFillRemaining(
                  hasScrollBody: false,
                  child: ErrorState(error: error, s: s, onRetry: () => ref.invalidate(childrenProvider)),
                ),
              _ => list(_placeholder, loading: true),
            },
          ],
        ),
      ),
    );
  }
}

final _placeholder = [
  for (var i = 0; i < 3; i++)
    ChildSummary(
      id: '$i',
      firstName: 'Aygul',
      lastName: 'Placeholder',
      birthDate: DateTime(2014),
      grade: 6,
      notes: null,
      avatarHue: 120,
      activeCourses: 1,
      latestExam: null,
      trend: null,
    ),
];
