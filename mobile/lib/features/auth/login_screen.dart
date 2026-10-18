import 'package:bootstrap_icons/bootstrap_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/format.dart';
import '../../core/i18n/strings.dart';
import '../../core/state.dart';
import '../../widgets/common.dart';
import 'auth_widgets.dart';
import 'otp_screen.dart';

/// Sign in by SMS code (most parents, no password) or by email/phone and password.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  int _method = 0;
  bool _busy = false;
  final _smsForm = GlobalKey<FormState>();
  final _passwordForm = GlobalKey<FormState>();
  final _phone = TextEditingController();
  final _login = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _phone.dispose();
    _login.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _requestCode() async {
    if (!_smsForm.currentState!.validate()) return;
    final s = ref.read(stringsProvider);
    setState(() => _busy = true);
    try {
      final sent = await ref.read(apiProvider).requestCode(normalizePhone(_phone.text)!);
      if (!mounted) return;
      if (sent.simulated) toast(context, s.smsSimulated);
      context.push('/code', extra: OtpArgs(sent: sent, mode: OtpMode.login));
    } catch (error) {
      if (mounted) toast(context, errorText(error, s), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _signIn() async {
    if (!_passwordForm.currentState!.validate()) return;
    final s = ref.read(stringsProvider);
    setState(() => _busy = true);
    try {
      final login = _login.text.trim();
      final result = await ref.read(apiProvider).login(login.contains('@') ? login : (normalizePhone(login) ?? login), _password.text);
      await ref.read(sessionProvider.notifier).signedIn(result);
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
      title: s.loginTitle,
      subtitle: s.loginSubtitle,
      footer: AuthFooterLink(text: s.noAccount, action: s.register, onTap: () => context.pushReplacement('/register')),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        SegmentSwitch(labels: [s.tabSms, s.tabPassword], index: _method, onChanged: (i) => setState(() => _method = i)),
        const SizedBox(height: 20),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 250),
          switchInCurve: Curves.easeOutCubic,
          transitionBuilder: (child, animation) => FadeTransition(
            opacity: animation,
            child: SlideTransition(position: Tween(begin: const Offset(0.04, 0), end: Offset.zero).animate(animation), child: child),
          ),
          child: _method == 0 ? _buildSms(s) : _buildPassword(s),
        ),
      ]),
    );
  }

  Widget _buildSms(S s) => Form(
        key: _smsForm,
        child: Column(key: const ValueKey('sms'), crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          PhoneField(controller: _phone, label: s.phone, invalidText: s.vPhone, onSubmitted: (_) => _requestCode()),
          const SizedBox(height: 14),
          HintLine(s.sendCodeHint, icon: BootstrapIcons.shield_check),
          const SizedBox(height: 20),
          BusyButton(label: s.getCode, busy: _busy, onPressed: _requestCode, icon: BootstrapIcons.arrow_right),
        ]),
      );

  Widget _buildPassword(S s) => AutofillGroup(
        child: Form(
          key: _passwordForm,
          child: Column(key: const ValueKey('password'), crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            TextFormField(
              controller: _login,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              autofillHints: const [AutofillHints.username],
              decoration: InputDecoration(labelText: s.loginField, hintText: s.loginHint, prefixIcon: const Icon(BootstrapIcons.person, size: 18)),
              validator: (value) {
                final text = value?.trim() ?? '';
                if (text.contains('@')) return emailPattern.hasMatch(text) ? null : s.vEmail;
                return normalizePhone(text) == null ? s.vLogin : null;
              },
            ),
            const SizedBox(height: 14),
            PasswordField(
              controller: _password,
              label: s.password,
              textInputAction: TextInputAction.done,
              validator: (value) => (value ?? '').isEmpty ? s.vPassword : null,
              onSubmitted: (_) => _signIn(),
            ),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(onPressed: () => context.push('/forgot'), child: Text(s.forgot)),
            ),
            const SizedBox(height: 4),
            BusyButton(label: s.signIn, busy: _busy, onPressed: _signIn),
          ]),
        ),
      );
}
