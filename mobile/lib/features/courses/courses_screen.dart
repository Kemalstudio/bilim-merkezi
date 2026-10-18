import 'package:bootstrap_icons/bootstrap_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:skeletonizer/skeletonizer.dart';

import '../../core/api/models.dart';
import '../../core/format.dart';
import '../../core/i18n/strings.dart';
import '../../core/state.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/theme.dart';
import '../../widgets/common.dart';
import '../../widgets/page_header.dart';
import '../../widgets/tiles.dart';

class CoursesScreen extends ConsumerStatefulWidget {
  const CoursesScreen({super.key});

  @override
  ConsumerState<CoursesScreen> createState() => _CoursesScreenState();
}

class _CoursesScreenState extends ConsumerState<CoursesScreen> {
  String _query = '';
  String? _category;

  List<CourseCard> _filter(List<CourseCard> courses) {
    final query = _query.trim().toLowerCase();
    return courses.where((course) {
      if (_category != null && course.category.slug != _category) return false;
      if (query.isEmpty) return true;
      return '${course.title} ${course.summary} ${course.instructorName} ${course.category.name}'.toLowerCase().contains(query);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final catalog = ref.watch(catalogProvider);
    final c = context.c;

    Widget content(Catalog data, {bool loading = false}) {
      final courses = _filter(data.courses);
      return CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        slivers: [
          PageHeader(title: s.catalogTitle, subtitle: s.catalogLead),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
              child: TextField(
                onChanged: (value) => setState(() => _query = value),
                textInputAction: TextInputAction.search,
                decoration: InputDecoration(
                  hintText: s.findCourse,
                  prefixIcon: const Icon(BootstrapIcons.search, size: 17),
                  contentPadding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: SizedBox(
              height: 44,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _CategoryChip(label: s.all, selected: _category == null, onTap: () => setState(() => _category = null)),
                  for (final category in data.categories)
                    _CategoryChip(
                      label: category.name,
                      icon: categoryIcon(category.slug),
                      color: categoryColor(c, category.slug),
                      selected: _category == category.slug,
                      onTap: () => setState(() => _category = _category == category.slug ? null : category.slug),
                    ),
                ],
              ),
            ),
          ),
          if (courses.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: EmptyState(icon: BootstrapIcons.search, title: s.nothingFound, text: s.nothingFoundText),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 120),
              sliver: Skeletonizer.sliver(
                enabled: loading,
                child: SliverList.separated(
                  itemCount: courses.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 14),
                  itemBuilder: (context, index) => CourseCardView(
                    course: courses[index],
                    s: s,
                    onTap: () => context.push('/courses/${courses[index].slug}'),
                  ).enter(index),
                ),
              ),
            ),
        ],
      );
    }

    return Scaffold(
      body: RefreshIndicator(
        edgeOffset: MediaQuery.paddingOf(context).top + 58,
        onRefresh: () => ref.refresh(catalogProvider.future),
        child: switch (catalog) {
          AsyncValue(:final value?) => content(value),
          AsyncValue(:final error?) when !catalog.isLoading => CustomScrollView(
            slivers: [
              PageHeader(title: s.catalogTitle),
              SliverFillRemaining(
                hasScrollBody: false,
                child: ErrorState(error: error, s: s, onRetry: () => ref.invalidate(catalogProvider)),
              ),
            ],
          ),
          _ => content(_placeholder, loading: true),
        },
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  const _CategoryChip({required this.label, required this.selected, required this.onTap, this.icon, this.color});
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final IconData? icon;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Pressable(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOutCubic,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: selected ? scheme.primary : c.surface,
            borderRadius: BorderRadius.circular(99),
            border: Border.all(color: selected ? scheme.primary : c.border),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[Icon(icon, size: 14, color: selected ? scheme.onPrimary : color), const SizedBox(width: 7)],
              Text(
                label,
                style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: selected ? scheme.onPrimary : c.inkSoft),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A course in the catalogue: a coloured banner by category, the essentials and the price.
class CourseCardView extends StatelessWidget {
  const CourseCardView({super.key, required this.course, required this.s, this.onTap});
  final CourseCard course;
  final S s;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final theme = Theme.of(context);
    final color = categoryColor(c, course.category.slug);

    return AppCard(
      onTap: onTap,
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CourseBanner(course: course, height: 104, s: s),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(course.title, style: theme.textTheme.titleMedium),
                const SizedBox(height: 6),
                Text(course.summary, maxLines: 2, overflow: TextOverflow.ellipsis, style: theme.textTheme.bodyMedium),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    MetaTag(BootstrapIcons.clock, s.hoursShort.f({'n': course.durationHours})),
                    if (course.lessonsPerWeek > 0) MetaTag(BootstrapIcons.calendar_week, s.perWeek.f({'n': course.lessonsPerWeek})),
                    if (course.ageMin != null && course.ageMax != null)
                      MetaTag(BootstrapIcons.people, s.ageRange.f({'a': course.ageMin, 'b': course.ageMax})),
                  ],
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Icon(BootstrapIcons.person_badge, size: 14, color: color),
                          const SizedBox(width: 6),
                          Flexible(
                            child: Text(
                              course.instructorName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.bodySmall,
                            ),
                          ),
                        ],
                      ),
                    ),
                    PriceTag(course: course, s: s),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class PriceTag extends StatelessWidget {
  const PriceTag({super.key, required this.course, required this.s, this.large = false});
  final CourseCard course;
  final S s;
  final bool large;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (course.hasDiscount)
          Text(
            money(course.price, s),
            style: TextStyle(fontSize: large ? 13 : 11.5, color: c.muted, decoration: TextDecoration.lineThrough, decorationColor: c.muted),
          ),
        Text(
          money(course.finalPrice, s),
          style: TextStyle(
            fontFamily: displayFont,
            fontWeight: FontWeight.w800,
            fontSize: large ? 22 : 17,
            letterSpacing: -0.4,
            color: c.ink,
          ),
        ),
      ],
    );
  }
}

/// The coloured header of a course: its category icon large and faint, level and rating on top.
class CourseBanner extends StatelessWidget {
  const CourseBanner({super.key, required this.course, required this.s, this.height = 120, this.radius = 24, this.showIcon = true});
  final CourseCard course;
  final S s;
  final double height;
  final double radius;

  /// Off on the course page, where the back button takes that corner.
  final bool showIcon;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final color = categoryColor(c, course.category.slug);
    final deep = HSLColor.fromColor(color).withLightness(0.28).toColor();
    final icon = categoryIcon(course.category.slug);

    return ClipRRect(
      borderRadius: BorderRadius.vertical(top: Radius.circular(radius)),
      child: Container(
        height: height,
        decoration: BoxDecoration(
          gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [deep, color]),
        ),
        child: Stack(
          children: [
            Positioned(
              right: -18,
              bottom: -26,
              child: Icon(icon, size: height * 1.1, color: Colors.white.withValues(alpha: 0.10)),
            ),
            if (showIcon)
              Positioned(
                left: 16,
                top: 16,
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(13)),
                  child: Icon(icon, color: Colors.white, size: 19),
                ),
              ),
            Positioned(
              left: 16,
              bottom: 14,
              right: 16,
              child: Row(
                children: [
                  _BannerPill(course.category.name),
                  const SizedBox(width: 6),
                  _BannerPill(course.levelCode ?? s.levels[course.level] ?? course.level),
                  const Spacer(),
                  if (course.rating.count > 0)
                    _BannerPill('★ ${course.rating.average.toStringAsFixed(1)}')
                  else if (course.featured)
                    const Icon(BootstrapIcons.star_fill, color: Color(0xFFFFD08A), size: 16),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BannerPill extends StatelessWidget {
  const _BannerPill(this.label);
  final String label;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(99)),
    child: Text(
      label,
      style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: Colors.white),
    ),
  );
}

final _placeholder = Catalog(
  [Category(slug: 'a', name: 'Category'), Category(slug: 'b', name: 'Category')],
  [
    for (var i = 0; i < 3; i++)
      CourseCard(
        id: '$i',
        slug: '$i',
        title: 'Course title placeholder text',
        summary: 'A short summary of the course that spans two lines in the card',
        level: 'BEGINNER',
        levelCode: null,
        price: 1500,
        discountPrice: null,
        durationHours: 48,
        lessonsPerWeek: 3,
        startDate: null,
        ageMin: 10,
        ageMax: 14,
        groupSize: 10,
        coverImage: null,
        instructorName: 'Teacher Name',
        instructorAvatar: null,
        featured: false,
        category: Category(slug: 'math', name: 'Category'),
        rating: Rating(0, 0),
      ),
  ],
);
