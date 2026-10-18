import 'package:bootstrap_icons/bootstrap_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';

import '../../core/format.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/theme.dart';
import '../../widgets/brand.dart';

/// Shared frame of every sign-in screen: back arrow, logo, title, the form in a card.
class AuthScaffold extends StatelessWidget {
  const AuthScaffold({super.key, required this.title, required this.subtitle, required this.child, this.footer});
  final String title;
  final String subtitle;
  final Widget child;
  final Widget? footer;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final theme = Theme.of(context);
    return Scaffold(
      body: Stack(children: [
        // A soft brand glow behind the card, like the website's auth page.
        Positioned(
          top: -140,
          right: -100,
          child: Container(
            width: 320,
            height: 320,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(colors: [c.brandEnd.withValues(alpha: 0.22), c.brandEnd.withValues(alpha: 0)]),
            ),
          ),
        ),
        SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            children: [
              Row(children: [
                if (context.canPop())
                  IconButton(
                    onPressed: () => context.pop(),
                    icon: Icon(BootstrapIcons.arrow_left, color: c.ink, size: 20),
                    style: IconButton.styleFrom(backgroundColor: c.surface, fixedSize: const Size(44, 44)),
                  ),
                const Spacer(),
                const Logo(size: 34),
                const Spacer(),
                if (context.canPop()) const SizedBox(width: 44),
              ]),
              const SizedBox(height: 28),
              Text(title, textAlign: TextAlign.center, style: theme.textTheme.headlineMedium)
                  .animate()
                  .fadeIn(duration: 350.ms)
                  .slideY(begin: 0.2, end: 0, curve: Curves.easeOutCubic),
              const SizedBox(height: 8),
              Text(subtitle, textAlign: TextAlign.center, style: theme.textTheme.bodyMedium)
                  .animate()
                  .fadeIn(duration: 350.ms, delay: 60.ms),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: c.surface,
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(color: c.border.withValues(alpha: 0.7)),
                  boxShadow: c.glow(1.4),
                ),
                child: AnimatedSize(duration: const Duration(milliseconds: 260), curve: Curves.easeOutCubic, child: child),
              ).animate().fadeIn(duration: 400.ms, delay: 100.ms).slideY(begin: 0.06, end: 0, curve: Curves.easeOutCubic),
              if (footer != null) ...[const SizedBox(height: 20), footer!],
            ],
          ),
        ),
      ]),
    );
  }
}

/// "Нет аккаунта? Зарегистрироваться" under the card.
class AuthFooterLink extends StatelessWidget {
  const AuthFooterLink({super.key, required this.text, required this.action, required this.onTap});
  final String text;
  final String action;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Row(mainAxisAlignment: MainAxisAlignment.center, children: [
      Text(text, style: Theme.of(context).textTheme.bodyMedium),
      TextButton(onPressed: onTap, child: Text(action)),
    ]);
  }
}

/// Groups typed digits as "65 12 34 56" and stops at eight.
class _PhoneFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    var digits = newValue.text.replaceAll(RegExp(r'\D'), '');
    if (digits.startsWith('993') && digits.length > 8) digits = digits.substring(3);
    if (digits.length > 8) digits = digits.substring(0, 8);
    final buffer = StringBuffer();
    for (var i = 0; i < digits.length; i++) {
      if (i > 0 && i.isEven) buffer.write(' ');
      buffer.write(digits[i]);
    }
    final text = buffer.toString();
    return TextEditingValue(text: text, selection: TextSelection.collapsed(offset: text.length));
  }
}

/// Turkmen phone number with the fixed +993 prefix.
class PhoneField extends StatelessWidget {
  const PhoneField({super.key, required this.controller, required this.label, required this.invalidText, this.autofocus = false, this.onSubmitted});
  final TextEditingController controller;
  final String label;
  final String invalidText;
  final bool autofocus;
  final ValueChanged<String>? onSubmitted;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return TextFormField(
      controller: controller,
      autofocus: autofocus,
      keyboardType: TextInputType.phone,
      textInputAction: TextInputAction.done,
      autofillHints: const [AutofillHints.telephoneNumberNational],
      inputFormatters: [_PhoneFormatter()],
      style: TextStyle(fontFamily: displayFont, fontSize: 17, fontWeight: FontWeight.w700, letterSpacing: 0.6, color: c.ink),
      decoration: InputDecoration(
        labelText: label,
        hintText: '65 12 34 56',
        prefixIcon: Padding(
          padding: const EdgeInsets.only(left: 14, right: 10),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(BootstrapIcons.telephone, size: 17, color: c.muted),
            const SizedBox(width: 10),
            Text('+993', style: TextStyle(fontFamily: displayFont, fontSize: 17, fontWeight: FontWeight.w700, color: c.muted)),
          ]),
        ),
      ),
      validator: (value) => normalizePhone(value ?? '') == null ? invalidText : null,
      onFieldSubmitted: onSubmitted,
    );
  }
}

class PasswordField extends StatefulWidget {
  const PasswordField({
    super.key,
    required this.controller,
    required this.label,
    this.validator,
    this.newPassword = false,
    this.onSubmitted,
    this.textInputAction = TextInputAction.next,
  });
  final TextEditingController controller;
  final String label;
  final FormFieldValidator<String>? validator;
  final bool newPassword;
  final ValueChanged<String>? onSubmitted;
  final TextInputAction textInputAction;

  @override
  State<PasswordField> createState() => _PasswordFieldState();
}

class _PasswordFieldState extends State<PasswordField> {
  bool _hidden = true;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: widget.controller,
      obscureText: _hidden,
      textInputAction: widget.textInputAction,
      autofillHints: [widget.newPassword ? AutofillHints.newPassword : AutofillHints.password],
      decoration: InputDecoration(
        labelText: widget.label,
        prefixIcon: const Icon(BootstrapIcons.lock, size: 17),
        suffixIcon: IconButton(
          onPressed: () => setState(() => _hidden = !_hidden),
          icon: Icon(_hidden ? BootstrapIcons.eye : BootstrapIcons.eye_slash, size: 18),
        ),
      ),
      validator: widget.validator,
      onFieldSubmitted: widget.onSubmitted,
    );
  }
}

/// A one-line note with an icon: hints under forms.
class HintLine extends StatelessWidget {
  const HintLine(this.text, {super.key, this.icon = BootstrapIcons.info_circle});
  final String text;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: c.sunken, borderRadius: BorderRadius.circular(14)),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, size: 16, color: c.emerald),
        const SizedBox(width: 10),
        Expanded(child: Text(text, style: TextStyle(fontSize: 12.5, height: 1.45, color: c.inkSoft))),
      ]),
    );
  }
}
