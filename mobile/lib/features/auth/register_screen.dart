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

/// Sign-up two ways, like the website: by SMS code (the number is confirmed first) or by email
/// and password with no code at all.
class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  int _method = 0;
  bool _busy = false;
  final _smsForm = GlobalKey<FormState>();
  final _emailForm = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();

  @override
  void dispose() {
    for (final controller in [_name, _phone, _email, _password, _confirm]) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _run(Future<void> Function() action) async {
    final s = ref.read(stringsProvider);
    setState(() => _busy = true);
    try {
      await action();
    } catch (error) {
      if (mounted) toast(context, errorText(error, s), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _bySms() {
    if (!_smsForm.currentState!.validate()) return;
    final s = ref.read(stringsProvider);
    _run(() async {
      final sent = await ref.read(apiProvider).requestCode(normalizePhone(_phone.text)!);
      if (!mounted) return;
      if (sent.simulated) toast(context, s.smsSimulated);
      context.push('/code', extra: OtpArgs(sent: sent, mode: OtpMode.register, name: _name.text.trim()));
    });
  }

  void _byEmail() {
    if (!_emailForm.currentState!.validate()) return;
    _run(() async {
      final result = await ref.read(apiProvider).register(
            name: _name.text.trim(),
            email: _email.text.trim(),
            password: _password.text,
            confirm: _confirm.text,
          );
      await ref.read(sessionProvider.notifier).signedIn(result);
    });
  }

  Widget _nameField(S s) => TextFormField(
        controller: _name,
        textCapitalization: TextCapitalization.words,
        textInputAction: TextInputAction.next,
        autofillHints: const [AutofillHints.name],
        decoration: InputDecoration(labelText: s.yourName, hintText: s.nameHint, prefixIcon: const Icon(BootstrapIcons.person, size: 18)),
        validator: (value) => (value ?? '').trim().length < 2 ? s.vName : null,
      );

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    return AuthScaffold(
      title: s.registerTitle,
      subtitle: s.registerSubtitle,
      footer: AuthFooterLink(text: s.haveAccount, action: s.signIn, onTap: () => context.pushReplacement('/login')),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        SegmentSwitch(labels: [s.registerTabSms, s.registerTabEmail], index: _method, onChanged: (i) => setState(() => _method = i)),
        const SizedBox(height: 20),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 250),
          switchInCurve: Curves.easeOutCubic,
          transitionBuilder: (child, animation) => FadeTransition(
            opacity: animation,
            child: SlideTransition(position: Tween(begin: const Offset(0.04, 0), end: Offset.zero).animate(animation), child: child),
          ),
          child: _method == 0
              ? Form(
                  key: _smsForm,
                  child: Column(key: const ValueKey('sms'), crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                    _nameField(s),
                    const SizedBox(height: 14),
                    PhoneField(controller: _phone, label: s.phone, invalidText: s.vPhone, onSubmitted: (_) => _bySms()),
                    const SizedBox(height: 14),
                    HintLine(s.registerSmsHint, icon: BootstrapIcons.shield_check),
                    const SizedBox(height: 20),
                    BusyButton(label: s.getCode, busy: _busy, onPressed: _bySms, icon: BootstrapIcons.arrow_right),
                  ]),
                )
              : AutofillGroup(
                  child: Form(
                    key: _emailForm,
                    child: Column(key: const ValueKey('email'), crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                      _nameField(s),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _email,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        autofillHints: const [AutofillHints.email],
                        decoration: InputDecoration(labelText: s.email, hintText: 'you@example.com', prefixIcon: const Icon(BootstrapIcons.envelope, size: 18)),
                        validator: (value) => emailPattern.hasMatch((value ?? '').trim()) ? null : s.vEmail,
                      ),
                      const SizedBox(height: 14),
                      PasswordField(
                        controller: _password,
                        label: s.password,
                        newPassword: true,
                        validator: (value) => (value ?? '').length < 8 ? s.vPasswordShort : null,
                      ),
                      const SizedBox(height: 14),
                      PasswordField(
                        controller: _confirm,
                        label: s.repeatPassword,
                        newPassword: true,
                        textInputAction: TextInputAction.done,
                        validator: (value) => value != _password.text ? s.vMismatch : null,
                        onSubmitted: (_) => _byEmail(),
                      ),
                      const SizedBox(height: 14),
                      HintLine(s.registerEmailHint, icon: BootstrapIcons.lightning_charge),
                      const SizedBox(height: 20),
                      BusyButton(label: s.createAccount, busy: _busy, onPressed: _byEmail),
                    ]),
                  ),
                ),
        ),
      ]),
    );
  }
}
