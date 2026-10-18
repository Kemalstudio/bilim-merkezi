import 'package:bootstrap_icons/bootstrap_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/models.dart';
import '../../core/format.dart';
import '../../core/state.dart';
import '../../core/theme/colors.dart';
import '../../widgets/common.dart';

/// Opens the add/edit form as a sheet; resolves to the child's id once saved.
Future<String?> showChildForm(BuildContext context, WidgetRef ref, {ChildSummary? child}) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (_) => _ChildForm(child: child),
  );
}

class _ChildForm extends ConsumerStatefulWidget {
  const _ChildForm({this.child});
  final ChildSummary? child;

  @override
  ConsumerState<_ChildForm> createState() => _ChildFormState();
}

class _ChildFormState extends ConsumerState<_ChildForm> {
  final _form = GlobalKey<FormState>();
  late final _first = TextEditingController(text: widget.child?.firstName);
  late final _last = TextEditingController(text: widget.child?.lastName);
  late final _notes = TextEditingController(text: widget.child?.notes);
  late DateTime? _birth = widget.child?.birthDate;
  late int? _grade = widget.child?.grade;
  bool _busy = false;
  bool _birthMissing = false;

  @override
  void dispose() {
    _first.dispose();
    _last.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _pickBirth() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _birth ?? DateTime(now.year - 10, now.month, now.day),
      firstDate: DateTime(now.year - 25),
      lastDate: now,
      initialEntryMode: DatePickerEntryMode.calendarOnly,
    );
    if (picked == null) return;
    setState(() {
      _birth = picked;
      _birthMissing = false;
    });
  }

  Future<void> _save() async {
    final s = ref.read(stringsProvider);
    final valid = _form.currentState!.validate();
    setState(() => _birthMissing = _birth == null);
    if (!valid || _birth == null) return;

    setState(() => _busy = true);
    final body = {
      'firstName': _first.text.trim(),
      'lastName': _last.text.trim(),
      'birthDate': isoDate(_birth!),
      'grade': _grade,
      'notes': _notes.text.trim().isEmpty ? null : _notes.text.trim(),
    };
    try {
      final api = ref.read(apiProvider);
      final String id;
      if (widget.child == null) {
        id = await api.createChild(body);
      } else {
        await api.updateChild(widget.child!.id, body);
        id = widget.child!.id;
      }
      refreshAccountData(ref);
      if (!mounted) return;
      toast(context, s.childSaved);
      Navigator.of(context).pop(id);
    } catch (error) {
      if (mounted) toast(context, errorText(error, s), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final c = context.c;
    final theme = Theme.of(context);

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: Form(
        key: _form,
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          children: [
            Text(widget.child == null ? s.newChild : s.editChild, style: theme.textTheme.headlineSmall),
            const SizedBox(height: 18),
            Row(children: [
              Expanded(
                child: TextFormField(
                  controller: _first,
                  textCapitalization: TextCapitalization.words,
                  textInputAction: TextInputAction.next,
                  decoration: InputDecoration(labelText: s.firstName),
                  validator: (value) => (value ?? '').trim().length < 2 ? s.vName : null,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextFormField(
                  controller: _last,
                  textCapitalization: TextCapitalization.words,
                  textInputAction: TextInputAction.done,
                  decoration: InputDecoration(labelText: s.lastName),
                  validator: (value) => (value ?? '').trim().length < 2 ? s.vName : null,
                ),
              ),
            ]),
            const SizedBox(height: 14),
            Pressable(
              onTap: _pickBirth,
              child: InputDecorator(
                decoration: InputDecoration(
                  labelText: s.birthDate,
                  prefixIcon: const Icon(BootstrapIcons.calendar_event, size: 18),
                  errorText: _birthMissing ? s.vRequired : null,
                ),
                isEmpty: _birth == null,
                child: Text(_birth == null ? '' : fullDate(_birth!, s), style: theme.textTheme.bodyLarge),
              ),
            ),
            const SizedBox(height: 18),
            Text(s.grade, style: theme.textTheme.titleSmall),
            const SizedBox(height: 10),
            SizedBox(
              height: 42,
              child: ListView(scrollDirection: Axis.horizontal, children: [
                for (final grade in [null, ...List.generate(12, (i) => i + 1)])
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(grade == null ? s.gradeNone : '$grade'),
                      selected: _grade == grade,
                      onSelected: (_) => setState(() => _grade = grade),
                      labelStyle: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: _grade == grade ? theme.colorScheme.onPrimary : c.inkSoft,
                      ),
                    ),
                  ),
              ]),
            ),
            const SizedBox(height: 18),
            TextFormField(
              controller: _notes,
              minLines: 2,
              maxLines: 4,
              maxLength: 500,
              decoration: InputDecoration(labelText: '${s.notes} (${s.optional})', hintText: s.notesHint, alignLabelWithHint: true),
            ),
            const SizedBox(height: 10),
            BusyButton(label: s.save, busy: _busy, onPressed: _save),
          ],
        ),
      ),
    );
  }
}
