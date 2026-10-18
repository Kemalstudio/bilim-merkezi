import 'dart:io';

import 'package:bootstrap_icons/bootstrap_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api/models.dart';
import '../../core/format.dart';
import '../../core/i18n/strings.dart';
import '../../core/state.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/theme.dart';
import '../../widgets/common.dart';
import '../children/child_form.dart';

/// Enrolling a child: who, their document, then promo code and payment. Each step checks what it
/// can before moving on; the server checks everything again.
class EnrollScreen extends ConsumerStatefulWidget {
  const EnrollScreen({super.key, required this.slug});
  final String slug;

  @override
  ConsumerState<EnrollScreen> createState() => _EnrollScreenState();
}

enum _Outcome { none, active, awaitingPayment }

class _EnrollScreenState extends ConsumerState<EnrollScreen> with WidgetsBindingObserver {
  int _step = 0;
  String? _childId;
  final _documentForm = GlobalKey<FormState>();
  final _documentNumber = TextEditingController();
  final _patronymic = TextEditingController();
  final _promo = TextEditingController();
  File? _photo;
  String? _documentKey;
  bool _uploading = false;
  PromoQuote? _quote;
  bool _checkingPromo = false;
  bool _busy = false;
  bool _documentMissing = false;

  _Outcome _outcome = _Outcome.none;
  EnrollStart? _started;
  bool _confirming = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _documentNumber.dispose();
    _patronymic.dispose();
    _promo.dispose();
    super.dispose();
  }

  /// Back from the payment page: ask the server at once.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _outcome == _Outcome.awaitingPayment) _confirm();
  }

  Future<void> _pickDocument(ImageSource source) async {
    final s = ref.read(stringsProvider);
    final picked = await ImagePicker().pickImage(source: source, maxWidth: 2200, imageQuality: 85);
    if (picked == null) return;
    setState(() {
      _photo = File(picked.path);
      _documentKey = null;
      _uploading = true;
      _documentMissing = false;
    });
    try {
      final key = await ref.read(apiProvider).uploadDocument(picked.path, picked.name);
      if (mounted) setState(() => _documentKey = key);
    } catch (error) {
      if (mounted) {
        setState(() => _photo = null);
        toast(context, errorText(error, s), error: true);
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _applyPromo(CourseDetail course) async {
    final s = ref.read(stringsProvider);
    final code = _promo.text.trim();
    if (code.isEmpty) return;
    FocusScope.of(context).unfocus();
    setState(() => _checkingPromo = true);
    try {
      final quote = await ref.read(apiProvider).checkPromo(course.card.id, code);
      if (!mounted) return;
      setState(() => _quote = quote);
      HapticFeedback.mediumImpact();
      toast(context, s.promoApplied);
    } catch (error) {
      if (mounted) {
        setState(() => _quote = null);
        toast(context, errorText(error, s), error: true);
      }
    } finally {
      if (mounted) setState(() => _checkingPromo = false);
    }
  }

  Future<void> _submit(CourseDetail course) async {
    final s = ref.read(stringsProvider);
    setState(() => _busy = true);
    try {
      final started = await ref.read(apiProvider).enroll({
        'courseId': course.card.id,
        'childId': _childId,
        'documentNumber': _documentNumber.text.trim(),
        'documentFile': _documentKey,
        if (_patronymic.text.trim().isNotEmpty) 'patronymic': _patronymic.text.trim(),
        if (_quote != null) 'promoCode': _quote!.code,
      });
      _started = started;
      refreshAccountData(ref);
      if (started.status == 'active') {
        HapticFeedback.heavyImpact();
        setState(() => _outcome = _Outcome.active);
      } else {
        setState(() => _outcome = _Outcome.awaitingPayment);
        await _openPayment();
      }
    } catch (error) {
      if (mounted) toast(context, errorText(error, s), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _openPayment() async {
    final url = _started?.url;
    if (url == null) return;
    await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }

  Future<void> _confirm() async {
    final id = _started?.enrollmentId;
    if (id == null || _confirming) return;
    setState(() => _confirming = true);
    try {
      final status = await ref.read(apiProvider).confirmPayment(id);
      if (status == 'ACTIVE' && mounted) {
        refreshAccountData(ref);
        HapticFeedback.heavyImpact();
        setState(() => _outcome = _Outcome.active);
      }
    } catch (_) {
      // Stays on "waiting"; the parent can check again.
    } finally {
      if (mounted) setState(() => _confirming = false);
    }
  }

  void _next(S s) {
    if (_step == 0 && _childId == null) return;
    if (_step == 1) {
      final valid = _documentForm.currentState!.validate();
      setState(() => _documentMissing = _documentKey == null);
      if (!valid || _documentKey == null) return;
    }
    FocusScope.of(context).unfocus();
    setState(() => _step++);
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final course = ref.watch(courseProvider(widget.slug));
    final children = ref.watch(childrenProvider);
    final enrollments = ref.watch(enrollmentsProvider);

    final detail = course.value;
    if (detail == null || children.value == null) {
      final error = course.error ?? children.error;
      return Scaffold(
        appBar: AppBar(title: Text(s.enrollTitle)),
        body: error != null
            ? ErrorState(
                error: error,
                s: s,
                onRetry: () {
                  ref.invalidate(courseProvider(widget.slug));
                  ref.invalidate(childrenProvider);
                },
              )
            : const Center(child: CircularProgressIndicator()),
      );
    }

    if (_outcome != _Outcome.none)
      return _ResultView(
        outcome: _outcome,
        s: s,
        course: detail,
        childName: _childName(children.value!),
        confirming: _confirming,
        onCheck: _confirm,
        onOpenPayment: _openPayment,
      );

    final enrolled = {
      for (final enrollment in enrollments.value ?? const <Enrollment>[])
        if (enrollment.courseId == detail.card.id && enrollment.status == 'ACTIVE' && enrollment.child != null) enrollment.child!.id,
    };

    return PopScope(
      canPop: _step == 0,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) setState(() => _step--);
      },
      child: Scaffold(
        appBar: AppBar(title: Text(s.enrollTitle)),
        body: Column(
          children: [
            _Stepper(step: _step, labels: [s.stepChild, s.stepDocument, s.stepPayment]),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                switchInCurve: Curves.easeOutCubic,
                switchOutCurve: Curves.easeInCubic,
                transitionBuilder: (child, animation) => FadeTransition(
                  opacity: animation,
                  child: SlideTransition(
                    position: Tween(begin: const Offset(0.06, 0), end: Offset.zero).animate(animation),
                    child: child,
                  ),
                ),
                child: KeyedSubtree(
                  key: ValueKey(_step),
                  child: switch (_step) {
                    0 => _childStep(s, children.value!, enrolled),
                    1 => _documentStep(s),
                    _ => _paymentStep(s, detail, children.value!),
                  },
                ),
              ),
            ),
            _BottomBar(
              child: _step < 2
                  ? FilledButton(onPressed: (_step == 0 && _childId == null) || _uploading ? null : () => _next(s), child: Text(s.next))
                  : BusyButton(
                      label: !detail.paymentsEnabled
                          ? s.confirmNoPayment
                          : (_quote?.price ?? detail.card.finalPrice) == 0
                          ? s.confirmFree
                          : s.toPayment,
                      busy: _busy,
                      onPressed: () => _submit(detail),
                      icon: !detail.paymentsEnabled || (_quote?.price ?? detail.card.finalPrice) == 0
                          ? BootstrapIcons.check2
                          : BootstrapIcons.credit_card,
                    ),
            ),
          ],
        ),
      ),
    );
  }

  String _childName(List<ChildSummary> children) =>
      children.where((child) => child.id == _childId).map((child) => child.firstName).firstOrNull ?? '';

  Widget _childStep(S s, List<ChildSummary> children, Set<String> enrolled) {
    final c = context.c;
    final theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.all(18),
      children: [
        Text(s.whoEnrolls, style: theme.textTheme.headlineSmall),
        const SizedBox(height: 6),
        Text(s.whoEnrollsText, style: theme.textTheme.bodyMedium),
        const SizedBox(height: 18),
        for (final (index, child) in children.indexed)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Pressable(
              onTap: enrolled.contains(child.id) ? null : () => setState(() => _childId = child.id),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 220),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: _childId == child.id ? c.brand.withValues(alpha: 0.08) : c.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: _childId == child.id ? c.brand : c.border, width: _childId == child.id ? 1.8 : 1),
                ),
                child: Opacity(
                  opacity: enrolled.contains(child.id) ? 0.5 : 1,
                  child: Row(
                    children: [
                      ChildAvatar(initials: child.initials, hue: child.avatarHue, size: 44),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(child.fullName, style: theme.textTheme.titleSmall),
                            const SizedBox(height: 2),
                            Text(
                              enrolled.contains(child.id)
                                  ? s.alreadyEnrolled
                                  : [
                                      s.count(child.age, s.years),
                                      if (child.grade != null) s.gradeN.f({'n': child.grade}),
                                    ].join(' · '),
                              style: theme.textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 200),
                        child: Icon(
                          _childId == child.id ? BootstrapIcons.check_circle_fill : BootstrapIcons.circle,
                          key: ValueKey(_childId == child.id),
                          color: _childId == child.id ? c.brand : c.border,
                          size: 22,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ).enter(index),
        const SizedBox(height: 6),
        OutlinedButton.icon(
          onPressed: () async {
            final id = await showChildForm(context, ref);
            if (id != null && mounted) setState(() => _childId = id);
          },
          icon: const Icon(BootstrapIcons.person_plus, size: 18),
          label: Text(s.addChild),
        ),
      ],
    );
  }

  Widget _documentStep(S s) {
    final c = context.c;
    final theme = Theme.of(context);
    return Form(
      key: _documentForm,
      child: ListView(
        padding: const EdgeInsets.all(18),
        children: [
          Text(s.documentTitle, style: theme.textTheme.headlineSmall),
          const SizedBox(height: 6),
          Text(s.documentText, style: theme.textTheme.bodyMedium),
          const SizedBox(height: 18),
          AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            height: 190,
            decoration: BoxDecoration(
              color: c.surface,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: _documentMissing ? c.rose : (_documentKey != null ? c.emerald : c.border), width: 1.5),
            ),
            clipBehavior: Clip.antiAlias,
            child: _photo == null
                ? Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      IconTile(BootstrapIcons.file_earmark_person, size: 56, color: _documentMissing ? c.rose : c.brand),
                      const SizedBox(height: 10),
                      Text(
                        _documentMissing ? s.vDocument : s.documentTitle,
                        style: theme.textTheme.titleSmall?.copyWith(color: _documentMissing ? c.rose : null),
                      ),
                    ],
                  )
                : Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.file(_photo!, fit: BoxFit.cover),
                      Container(color: Colors.black.withValues(alpha: _uploading ? 0.45 : 0.15)),
                      Center(
                        child: _uploading
                            ? Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const CircularProgressIndicator(color: Colors.white),
                                  const SizedBox(height: 10),
                                  Text(
                                    s.uploading,
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                                  ),
                                ],
                              )
                            : Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                decoration: BoxDecoration(color: c.emerald, borderRadius: BorderRadius.circular(99)),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(BootstrapIcons.check2, color: Colors.white, size: 16),
                                    const SizedBox(width: 6),
                                    Text(
                                      s.documentUploaded,
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                                    ),
                                  ],
                                ),
                              ).animate().scale(curve: Curves.easeOutBack, duration: 350.ms),
                      ),
                    ],
                  ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _uploading ? null : () => _pickDocument(ImageSource.camera),
                  icon: const Icon(BootstrapIcons.camera, size: 17),
                  label: Text(_photo == null ? s.takePhoto : s.replace),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _uploading ? null : () => _pickDocument(ImageSource.gallery),
                  icon: const Icon(BootstrapIcons.image, size: 17),
                  label: Text(s.fromGallery),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          TextFormField(
            controller: _documentNumber,
            textCapitalization: TextCapitalization.characters,
            decoration: InputDecoration(
              labelText: s.documentNumber,
              hintText: s.documentNumberHint,
              prefixIcon: const Icon(BootstrapIcons.hash, size: 18),
            ),
            validator: (value) => (value ?? '').trim().length < 3 ? s.vRequired : null,
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _patronymic,
            textCapitalization: TextCapitalization.words,
            decoration: InputDecoration(
              labelText: '${s.patronymic} (${s.optional})',
              prefixIcon: const Icon(BootstrapIcons.person, size: 18),
            ),
          ),
        ],
      ),
    );
  }

  Widget _paymentStep(S s, CourseDetail course, List<ChildSummary> children) {
    final c = context.c;
    final theme = Theme.of(context);
    final full = course.card.finalPrice;
    final total = _quote?.price ?? full;
    final child = children.firstWhere((child) => child.id == _childId);

    return ListView(
      padding: const EdgeInsets.all(18),
      children: [
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(course.card.title, style: theme.textTheme.titleMedium),
              const SizedBox(height: 14),
              Row(
                children: [
                  ChildAvatar(initials: child.initials, hue: child.avatarHue, size: 34),
                  const SizedBox(width: 10),
                  Expanded(child: Text(child.fullName, style: theme.textTheme.titleSmall)),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  IconTile(BootstrapIcons.file_earmark_check, color: c.emerald, size: 34),
                  const SizedBox(width: 10),
                  Expanded(child: Text('${s.documentNumber}: ${_documentNumber.text.trim()}', style: theme.textTheme.bodyMedium)),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (!course.paymentsEnabled)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: c.amber.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(16)),
            child: Row(
              children: [
                Icon(BootstrapIcons.cone_striped, size: 18, color: c.amber),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(s.paymentsOffNote, style: theme.textTheme.bodySmall?.copyWith(color: c.inkSoft)),
                ),
              ],
            ),
          )
        else
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: TextField(
                  controller: _promo,
                  textCapitalization: TextCapitalization.characters,
                  decoration: InputDecoration(labelText: s.promo, prefixIcon: const Icon(BootstrapIcons.ticket_perforated, size: 18)),
                  onSubmitted: (_) => _applyPromo(course),
                ),
              ),
              const SizedBox(width: 10),
              SizedBox(
                height: 56,
                child: OutlinedButton(
                  onPressed: _checkingPromo ? null : () => _applyPromo(course),
                  style: OutlinedButton.styleFrom(minimumSize: const Size(0, 56), padding: const EdgeInsets.symmetric(horizontal: 18)),
                  child: _checkingPromo
                      ? const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(s.apply),
                ),
              ),
            ],
          ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(gradient: c.heroGradient, borderRadius: BorderRadius.circular(22)),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      s.total,
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.75), fontWeight: FontWeight.w600),
                    ),
                    if (_quote != null && _quote!.price < full)
                      Text(
                        money(full, s),
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.6),
                          decoration: TextDecoration.lineThrough,
                          decorationColor: Colors.white60,
                        ),
                      ),
                  ],
                ),
              ),
              TweenAnimationBuilder<double>(
                tween: Tween(end: total),
                duration: const Duration(milliseconds: 500),
                curve: Curves.easeOutCubic,
                builder: (_, value, _) => Text(
                  money(value, s),
                  style: const TextStyle(fontFamily: displayFont, fontWeight: FontWeight.w800, fontSize: 26, color: Colors.white),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _Stepper extends StatelessWidget {
  const _Stepper({required this.step, required this.labels});
  final int step;
  final List<String> labels;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 4, 18, 8),
      child: Row(
        children: [
          for (var i = 0; i < labels.length; i++) ...[
            if (i > 0)
              Expanded(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  height: 3,
                  margin: const EdgeInsets.symmetric(horizontal: 6),
                  decoration: BoxDecoration(color: i <= step ? c.brand : c.border, borderRadius: BorderRadius.circular(3)),
                ),
              ),
            Column(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: 30,
                  height: 30,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(shape: BoxShape.circle, color: i < step ? c.emerald : (i == step ? c.brand : c.sunken)),
                  child: i < step
                      ? const Icon(BootstrapIcons.check2, size: 15, color: Colors.white)
                      : Text(
                          '${i + 1}',
                          style: TextStyle(
                            fontFamily: displayFont,
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                            color: i == step ? Colors.white : c.muted,
                          ),
                        ),
                ),
                const SizedBox(height: 4),
                Text(
                  labels[i],
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: i == step ? c.ink : c.muted),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _BottomBar extends StatelessWidget {
  const _BottomBar({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Container(
      padding: EdgeInsets.fromLTRB(18, 12, 18, 12 + MediaQuery.paddingOf(context).bottom),
      decoration: BoxDecoration(
        color: c.surface,
        border: Border(top: BorderSide(color: c.border)),
      ),
      child: child,
    );
  }
}

class _ResultView extends StatelessWidget {
  const _ResultView({
    required this.outcome,
    required this.s,
    required this.course,
    required this.childName,
    required this.confirming,
    required this.onCheck,
    required this.onOpenPayment,
  });
  final _Outcome outcome;
  final S s;
  final CourseDetail course;
  final String childName;
  final bool confirming;
  final VoidCallback onCheck;
  final VoidCallback onOpenPayment;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final theme = Theme.of(context);
    final done = outcome == _Outcome.active;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const Spacer(),
              Container(
                width: 108,
                height: 108,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: done ? LinearGradient(colors: [c.emerald, c.brandEnd]) : null,
                  color: done ? null : c.amber.withValues(alpha: 0.15),
                  boxShadow: done
                      ? [BoxShadow(color: c.emerald.withValues(alpha: 0.4), blurRadius: 30, spreadRadius: -6, offset: const Offset(0, 12))]
                      : null,
                ),
                child: done
                    ? const Icon(BootstrapIcons.check2, color: Colors.white, size: 52)
                    : (confirming
                          ? Padding(
                              padding: const EdgeInsets.all(34),
                              child: CircularProgressIndicator(color: c.amber),
                            )
                          : Icon(BootstrapIcons.credit_card, color: c.amber, size: 40)),
              ).animate(key: ValueKey(done)).scale(duration: 550.ms, curve: Curves.elasticOut, begin: const Offset(0.4, 0.4)),
              const SizedBox(height: 28),
              Text(
                done ? s.successTitle : (confirming ? s.checkingPayment : s.stepPayment),
                textAlign: TextAlign.center,
                style: theme.textTheme.headlineMedium,
              ),
              const SizedBox(height: 10),
              Text(
                done ? s.successText.f({'child': childName, 'course': course.card.title}) : '${s.paymentOpened}\n\n${s.paymentPending}',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium,
              ),
              const Spacer(),
              if (done)
                FilledButton(onPressed: () => context.go('/home'), child: Text(s.toHome))
              else ...[
                FilledButton.icon(
                  onPressed: confirming ? null : onCheck,
                  icon: const Icon(BootstrapIcons.arrow_clockwise, size: 17),
                  label: Text(s.checkAgain),
                ),
                const SizedBox(height: 10),
                OutlinedButton(onPressed: onOpenPayment, child: Text(s.openPaymentAgain)),
                TextButton(onPressed: () => context.go('/home'), child: Text(s.toHome)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
