import 'dart:async';

import 'package:bootstrap_icons/bootstrap_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pinput/pinput.dart';

import '../../core/api/models.dart';
import '../../core/i18n/strings.dart';
import '../../core/state.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/theme.dart';
import '../../widgets/common.dart';
import 'auth_widgets.dart';

enum OtpMode { login, register, recovery }

class OtpArgs {
  const OtpArgs({required this.sent, required this.mode, this.name});
  final OtpSent sent;
  final OtpMode mode;

  /// Typed on the sign-up form; a new account asked here instead when it is missing.
  final String? name;
}

/// The code from the SMS. Signing in (and signing up) completes on the sixth digit; recovery
/// also asks for the new password.
class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({super.key, required this.args});
  final OtpArgs args;

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final _form = GlobalKey<FormState>();
  final _code = TextEditingController();
  final _name = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  late OtpSent _sent = widget.args.sent;
  bool _busy = false;
  bool _wrong = false;
  int _cooldown = 60;
  Timer? _timer;

  bool get _recovery => widget.args.mode == OtpMode.recovery;
  bool get _askName => !_recovery && _sent.isNew && (widget.args.name ?? '').trim().isEmpty;

  @override
  void initState() {
    super.initState();
    _startCooldown();
  }

  void _startCooldown() {
    _timer?.cancel();
    setState(() => _cooldown = 60);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return timer.cancel();
      setState(() => _cooldown--);
      if (_cooldown <= 0) timer.cancel();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _code.dispose();
    _name.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _resend(S s) async {
    try {
      _sent = await ref.read(apiProvider).requestCode(_sent.phone, recovery: _recovery);
      if (!mounted) return;
      _startCooldown();
      toast(context, s.codeSentTo.f({'phone': _sent.maskedPhone}));
    } catch (error) {
      if (mounted) toast(context, errorText(error, s), error: true);
    }
  }

  Future<void> _submit() async {
    final s = ref.read(stringsProvider);
    if (!_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _wrong = false;
    });
    try {
      final api = ref.read(apiProvider);
      final result = _recovery
          ? await api.resetBySms(phone: _sent.phone, code: _code.text, password: _password.text, confirm: _confirm.text)
          : await api.verifyCode(_sent.phone, _code.text,
              name: _askName ? _name.text.trim() : (widget.args.name?.trim().isEmpty ?? true ? null : widget.args.name!.trim()));
      HapticFeedback.mediumImpact();
      // The router sends a signed-in parent home.
      await ref.read(sessionProvider.notifier).signedIn(result);
    } catch (error) {
      HapticFeedback.heavyImpact();
      if (mounted) {
        setState(() => _wrong = true);
        toast(context, errorText(error, s), error: true);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final c = context.c;

    // Six cells and their gaps always fit the card, from small phones to tablets.
    final cell = ((MediaQuery.sizeOf(context).width - 80 - 5 * 8) / 6).clamp(38.0, 56.0);
    final base = PinTheme(
      width: cell,
      height: cell * 1.16,
      textStyle: TextStyle(fontFamily: displayFont, fontSize: 22, fontWeight: FontWeight.w800, color: c.ink),
      decoration: BoxDecoration(color: c.sunken, borderRadius: BorderRadius.circular(16), border: Border.all(color: c.sunken)),
    );

    return AuthScaffold(
      title: s.codeTitle,
      subtitle: s.codeSentTo.f({'phone': _sent.maskedPhone}),
      child: Form(
        key: _form,
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          if (_askName) ...[
            HintLine(s.newAccountNote, icon: BootstrapIcons.stars),
            const SizedBox(height: 14),
            TextFormField(
              controller: _name,
              textCapitalization: TextCapitalization.words,
              textInputAction: TextInputAction.next,
              decoration: InputDecoration(labelText: s.yourName, hintText: s.nameHint, prefixIcon: const Icon(BootstrapIcons.person, size: 18)),
              validator: (value) => (value ?? '').trim().length < 2 ? s.vName : null,
            ),
            const SizedBox(height: 18),
          ],
          Center(
            child: Pinput(
              length: 6,
              controller: _code,
              autofocus: !_askName,
              forceErrorState: _wrong,
              defaultPinTheme: base,
              focusedPinTheme: base.copyDecorationWith(border: Border.all(color: c.brand, width: 1.8), color: c.surface),
              submittedPinTheme: base.copyDecorationWith(color: c.surface, border: Border.all(color: c.border)),
              errorPinTheme: base.copyDecorationWith(border: Border.all(color: c.rose, width: 1.6)),
              hapticFeedbackType: HapticFeedbackType.lightImpact,
              keyboardType: TextInputType.number,
              separatorBuilder: (_) => const SizedBox(width: 8),
              validator: (value) => (value ?? '').length == 6 ? null : s.vCode,
              onChanged: (_) {
                if (_wrong) setState(() => _wrong = false);
              },
              onCompleted: (_) {
                if (!_recovery && (!_askName || _name.text.trim().length >= 2)) _submit();
              },
            ),
          ),
          if (_recovery) ...[
            const SizedBox(height: 20),
            PasswordField(
              controller: _password,
              label: s.newPassword,
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
              onSubmitted: (_) => _submit(),
            ),
          ],
          const SizedBox(height: 22),
          BusyButton(label: _recovery ? s.saveNewPassword : s.confirm, busy: _busy, onPressed: _submit),
          const SizedBox(height: 8),
          TextButton(
            onPressed: _cooldown > 0 ? null : () => _resend(s),
            child: Text(_cooldown > 0 ? s.resendIn.f({'s': _cooldown}) : s.resend),
          ),
        ]),
      ),
    );
  }
}
