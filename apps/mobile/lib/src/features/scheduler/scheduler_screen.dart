import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';

class SchedulerScreen extends StatefulWidget {
  const SchedulerScreen({super.key});

  @override
  State<SchedulerScreen> createState() => _SchedulerScreenState();
}

class _SchedulerScreenState extends State<SchedulerScreen> {
  DateTime _focused = DateTime.now();
  DateTime? _selected;
  String _platform = 'Instagram';

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Content Scheduler', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 8),
        const Text('Schedule and publish campaigns with AI-recommended send windows.'),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: TableCalendar(
              firstDay: DateTime.now().subtract(const Duration(days: 365)),
              lastDay: DateTime.now().add(const Duration(days: 365)),
              focusedDay: _focused,
              selectedDayPredicate: (day) => isSameDay(day, _selected),
              onDaySelected: (selected, focused) {
                setState(() {
                  _selected = selected;
                  _focused = focused;
                });
              },
            ),
          ),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue: _platform,
          decoration: const InputDecoration(labelText: 'Platform'),
          items: const ['Instagram', 'Facebook', 'LinkedIn', 'TikTok']
              .map((p) => DropdownMenuItem(value: p, child: Text(p)))
              .toList(),
          onChanged: (v) => setState(() => _platform = v ?? 'Instagram'),
        ),
        const SizedBox(height: 10),
        const ListTile(
          leading: Icon(Icons.psychology_alt_outlined),
          title: Text('AI suggested time: 6:00 PM local time'),
          subtitle: Text('Based on recent engagement and conversion data.'),
        ),
        const SizedBox(height: 12),
        FilledButton.icon(
          onPressed: () {},
          icon: const Icon(Icons.schedule_send),
          label: const Text('Schedule Post'),
        ),
      ],
    );
  }
}
