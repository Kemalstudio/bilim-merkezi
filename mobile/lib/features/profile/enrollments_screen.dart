import 'package:bootstrap_icons/bootstrap_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/state.dart';
import '../../widgets/common.dart';
import '../../widgets/page_header.dart';
import '../../widgets/tiles.dart';

class EnrollmentsScreen extends ConsumerWidget {
  const EnrollmentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final enrollments = ref.watch(enrollmentsProvider);

    return Scaffold(
      body: RefreshIndicator(
        edgeOffset: MediaQuery.paddingOf(context).top + 58,
        onRefresh: () => ref.refresh(enrollmentsProvider.future),
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          slivers: [
            PageHeader(title: s.myEnrollments, back: true),
            switch (enrollments) {
              AsyncValue(:final value?) when value.isEmpty => SliverFillRemaining(
                  hasScrollBody: false,
                  child: EmptyState(
                    icon: BootstrapIcons.journal_bookmark,
                    title: s.noEnrollments,
                    text: s.catalogLead,
                    action: s.findCourse,
                    onAction: () => context.go('/courses'),
                  ),
                ),
              AsyncValue(:final value?) => SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
                  sliver: SliverList.separated(
                    itemCount: value.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 10),
                    itemBuilder: (context, index) => EnrollmentTile(
                      enrollment: value[index],
                      s: s,
                      onTap: () => context.push('/courses/${value[index].courseSlug}'),
                    ).enter(index),
                  ),
                ),
              AsyncValue(:final error?) when !enrollments.isLoading => SliverFillRemaining(
                  hasScrollBody: false,
                  child: ErrorState(error: error, s: s, onRetry: () => ref.invalidate(enrollmentsProvider)),
                ),
              _ => SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                  sliver: SliverList.list(children: [
                    for (var i = 0; i < 4; i++)
                      const Padding(padding: EdgeInsets.only(bottom: 10), child: SkeletonBox(height: 76, radius: 24)),
                  ]),
                ),
            },
          ],
        ),
      ),
    );
  }
}
