import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../api/models.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/formatters.dart';
import '../auth/auth_controller.dart';
import 'meals_controller.dart';

/// Screen 3 — create a meal session (edit reuses this later).
class MealSetupScreen extends ConsumerStatefulWidget {
  const MealSetupScreen({super.key});

  @override
  ConsumerState<MealSetupScreen> createState() => _MealSetupScreenState();
}

class _MealSetupScreenState extends ConsumerState<MealSetupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _title = TextEditingController();
  final _restaurant = TextEditingController();
  final _menuUrl = TextEditingController();
  final _seat = TextEditingController();
  final _organizerName = TextEditingController();
  final _organizerContact = TextEditingController();

  String? _mealType;
  bool _farewell = false;
  bool _reminder = true;
  DateTime? _dateTime;
  DateTime? _remindAt;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final auth = ref.read(authProvider);
    final user = auth is AsyncData<AppUser?> ? auth.value : null;
    _organizerName.text = user?.displayName ?? '';
    _organizerContact.text = user?.mobileNumber ?? '';
  }

  @override
  void dispose() {
    for (final c in [_title, _restaurant, _menuUrl, _seat, _organizerName, _organizerContact]) {
      c.dispose();
    }
    super.dispose();
  }

  String _isoWithOffset(DateTime d) {
    String two(int n) => n.toString().padLeft(2, '0');
    return '${d.year}-${two(d.month)}-${two(d.day)}T${two(d.hour)}:${two(d.minute)}:00+08:00';
  }

  Future<void> _pickDateTime() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: _dateTime ?? now,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 2),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(_dateTime ?? now));
    if (time == null || !mounted) return;
    final picked = DateTime(date.year, date.month, date.day, time.hour, time.minute);
    setState(() {
      _dateTime = picked;
      // Pre-fill a sensible reminder (2h before the meal, editable). Also reset
      // it if the new meal time leaves the chosen reminder not before the meal.
      if (_reminder && (_remindAt == null || !_remindAt!.isBefore(picked))) {
        final twoHoursBefore = picked.subtract(const Duration(hours: 2));
        _remindAt = twoHoursBefore.isAfter(DateTime.now()) ? twoHoursBefore : null;
      }
    });
  }

  /// Pick the reminder date & time. Must be in the future and, when a meal time
  /// is set, earlier than it.
  Future<void> _pickRemindAt() async {
    final l = AppLocalizations.of(context);
    final now = DateTime.now();
    final meal = _dateTime; // upper bound: reminder must be before the meal
    if (meal != null && !meal.isAfter(now)) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l.reminderBeforeMeal)));
      return;
    }
    final initial = _remindAt ?? (meal != null ? meal.subtract(const Duration(hours: 2)) : now);
    final date = await showDatePicker(
      context: context,
      initialDate: initial.isBefore(now) ? now : initial,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: meal ?? DateTime(now.year + 2),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(initial));
    if (time == null || !mounted) return;
    final picked = DateTime(date.year, date.month, date.day, time.hour, time.minute);
    if (!picked.isAfter(now)) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l.reminderTimePast)));
      return;
    }
    if (meal != null && !picked.isBefore(meal)) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l.reminderBeforeMeal)));
      return;
    }
    setState(() => _remindAt = picked);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_reminder && _remindAt == null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(AppLocalizations.of(context).reminderTimeRequired)));
      return;
    }
    setState(() => _saving = true);
    final body = <String, dynamic>{
      'title': _title.text.trim(),
      'restaurantName': _restaurant.text.trim(),
      if (_mealType != null) 'mealType': _mealType,
      'farewellEnabled': _farewell,
      if (_menuUrl.text.trim().isNotEmpty) 'menuUrl': _menuUrl.text.trim(),
      if (_seat.text.trim().isNotEmpty) 'seatDetails': _seat.text.trim(),
      if (_organizerName.text.trim().isNotEmpty) 'organizerName': _organizerName.text.trim(),
      if (_organizerContact.text.trim().isNotEmpty) 'organizerContact': _organizerContact.text.trim(),
      if (_dateTime != null) 'mealDateTime': _isoWithOffset(_dateTime!),
      'reminderEnabled': _reminder,
      if (_reminder && _remindAt != null) 'remindAt': _isoWithOffset(_remindAt!),
    };
    try {
      final meal = await ref.read(mealsProvider.notifier).create(body);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(AppLocalizations.of(context).mealCreated)));
      context.go('/meals/${meal.id}');
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      setState(() => _saving = false);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(l.mealSetup)),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 560),
          child: Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                TextFormField(
                  controller: _title,
                  decoration: InputDecoration(labelText: l.mealTitle),
                  textInputAction: TextInputAction.next,
                  validator: (v) => (v == null || v.trim().isEmpty) ? l.required : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _restaurant,
                  decoration: InputDecoration(labelText: l.restaurantName),
                  validator: (v) => (v == null || v.trim().isEmpty) ? l.required : null,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String?>(
                  initialValue: _mealType,
                  decoration: InputDecoration(labelText: l.mealType),
                  items: [
                    DropdownMenuItem(value: null, child: Text(l.notSet)),
                    for (final t in ['breakfast', 'lunch', 'dinner', 'supper', 'custom'])
                      DropdownMenuItem(value: t, child: Text(mealTypeLabel(l, t))),
                  ],
                  onChanged: (v) => setState(() => _mealType = v),
                ),
                const SizedBox(height: 12),
                TextFormField(controller: _menuUrl, decoration: InputDecoration(labelText: l.menuUrl)),
                const SizedBox(height: 12),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(l.mealDateTime),
                  subtitle: Text(_dateTime == null ? l.notSet : formatDateTime(_isoWithOffset(_dateTime!))),
                  trailing: const Icon(Icons.event),
                  onTap: _pickDateTime,
                ),
                TextFormField(controller: _seat, decoration: InputDecoration(labelText: l.seatDetails)),
                const SizedBox(height: 12),
                TextFormField(controller: _organizerName, decoration: InputDecoration(labelText: l.organizerName)),
                const SizedBox(height: 12),
                TextFormField(controller: _organizerContact, decoration: InputDecoration(labelText: l.organizerContact)),
                const SizedBox(height: 8),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: _farewell,
                  onChanged: (v) => setState(() => _farewell = v),
                  title: Text(l.farewellMeal),
                  subtitle: Text(l.farewellMealHint),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: _reminder,
                  onChanged: (v) => setState(() {
                    _reminder = v;
                    // Pre-fill 2h before the meal when enabling, if a meal time is set.
                    if (v && _remindAt == null && _dateTime != null) {
                      final d = _dateTime!.subtract(const Duration(hours: 2));
                      if (d.isAfter(DateTime.now())) _remindAt = d;
                    }
                  }),
                  title: Text(l.orderReminder),
                ),
                if (_reminder)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(l.reminderTime),
                    subtitle: Text(_remindAt == null ? l.notSet : formatDateTime(_isoWithOffset(_remindAt!))),
                    trailing: const Icon(Icons.notifications_active),
                    onTap: _pickRemindAt,
                  ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _saving ? null : _submit,
                  child: _saving
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(l.create),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
