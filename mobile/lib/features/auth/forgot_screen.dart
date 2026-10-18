import 'package:bootstrap_icons/bootstrap_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/format.dart';
import '../../core/i18n/strings.dart';
import '../../core/state.dart';
import '../../core/theme/colors.dart';
import '../../widgets/common.dart';
import 'auth_widgets.dart';
import 'otp_screen.dart';

/// Password recovery: by phone (SMS code, then the new password right in the app) or by email
/// (a link that opens the website's "new password" page).
class ForgotScreen extends ConsumerStatefulWidget {
  const ForgotScreen({super.key});

  @override
  ConsumerState<ForgotScreen> createState() => _ForgotScreenState();
}

class _ForgotScreenState extends ConsumerState<ForgotScreen> {
  int _method = 0;
  bool _busy = false;
  String? _sentTo;
  final _phoneForm = GlobalKey<FormState>();
  final _emailForm = GlobalKey<FormState>();
  final _phone = TextEditingController();
  final _email = TextEditingController();

  @override
  void dispose() {
    _phone.dispose();
    _email.dispose();
    super.dispose();
  }

  Future<void> _byPhone() async {
    if (!_phoneForm.currentState!.validate()) return;
    final s = ref.read(stringsProvider);
    setState(() => _busy = true);
    try {
      final sent = await ref.read(apiProvider).requestCode(normalizePhone(_phone.text)!, recovery: true);
      if (!mounted) return;
      if (sent.simulated) toast(context, s.smsSimulated);
      context.push('/code', extra: OtpArgs(sent: sent, mode: OtpMode.recovery));
    } catch (error) {
      if (mounted) toast(context, errorText(error, s), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _byEmail() async {
    if (!_emailForm.currentState!.validate()) return;
    final s = ref.read(stringsProvider);
    setState(() => _busy = true);
    try {
      final email = _email.text.trim();
      final simulated = await ref.read(apiProvider).requestResetEmail(email);
      if (!mounted) return;
      if (simulated) toast(context, s.mailSimulated);
      setState(() => _sentTo = email);
    } catch (error) {
      if (mounted) toast(context, errorText(error, s), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    return AuthScaffold(
      title: s.recoveryTitle,
      subtitle: _method == 0 ? s.recoveryPhoneText : s.recoveryEmailText,
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        SegmentSwitch(
          labels: [s.recoveryTabPhone, s.recoveryTabEmail],
          index: _method,
          onChanged: (i) => setState(() => _method = i),
        ),
        const SizedBox(height: 20),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 250),
          child: _method == 0 ? _phoneStep(s) : (_sentTo == null ? _emailStep(s) : _sent(s)),
        ),
      ]),
    );
  }

  Widget _phoneStep(S s) => Form(
        key: _phoneForm,
        child: Column(key: const ValueKey('phone'), crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          PhoneField(controller: _phone, label: s.phone, invalidText: s.vPhone, onSubmitted: (_) => _byPhone()),
          const SizedBox(height: 20),
          BusyButton(label: s.getCode, busy: _busy, onPressed: _byPhone, icon: BootstrapIcons.arrow_right),
        ]),
      );

  Widget _emailStep(S s) => Form(
        key: _emailForm,
        child: Column(key: const ValueKey('email'), crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          TextFormField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            decoration: InputDecoration(labelText: s.email, hintText: 'you@example.com', prefixIcon: const Icon(BootstrapIcons.envelope, size: 18)),
            validator: (value) => emailPattern.hasMatch((value ?? '').trim()) ? null : s.vEmail,
            onFieldSubmitted: (_) => _byEmail(),
          ),
          const SizedBox(height: 20),
          BusyButton(label: s.sendLink, busy: _busy, onPressed: _byEmail, icon: BootstrapIcons.send),
        ]),
      );

  Widget _sent(S s) {
    final c = context.c;
    return Column(key: const ValueKey('sent'), children: [
      Container(
        width: 72,
        height: 72,
        decoration: BoxDecoration(color: c.emerald.withValues(alpha: 0.14), shape: BoxShape.circle),
        child: Icon(BootstrapIcons.envelope_check, color: c.emerald, size: 30),
      ).animate().scale(duration: 450.ms, curve: Curves.easeOutBack),
      const SizedBox(height: 16),
      Text(s.linkSentTitle, style: Theme.of(context).textTheme.titleLarge),
      const SizedBox(height: 8),
      Text(s.linkSentText.f({'email': _sentTo}), textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyMedium),
      const SizedBox(height: 12),
      TextButton(onPressed: () => setState(() => _sentTo = null), child: Text(s.otherEmail)),
    ]);
  }
}
