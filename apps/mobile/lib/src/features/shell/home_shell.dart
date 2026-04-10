import 'package:flutter/material.dart';
import '../analytics/analytics_screen.dart';
import '../assistant/assistant_screen.dart';
import '../content_studio/content_studio_screen.dart';
import '../crm/leads_screen.dart';
import '../scheduler/scheduler_screen.dart';
import '../settings/team_screen.dart';
import '../video_creator/video_creator_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  final _screens = const [
    ContentStudioScreen(),
    VideoCreatorScreen(),
    SchedulerScreen(),
    AnalyticsScreen(),
    LeadsScreen(),
    AssistantScreen(),
    TeamScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(child: _screens[_index]),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => setState(() => _index = 0),
        label: const Text('Generate'),
        icon: const Icon(Icons.auto_awesome),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.edit_note), label: 'Studio'),
          NavigationDestination(icon: Icon(Icons.movie_creation_outlined), label: 'Video'),
          NavigationDestination(icon: Icon(Icons.calendar_month), label: 'Schedule'),
          NavigationDestination(icon: Icon(Icons.bar_chart), label: 'Analytics'),
          NavigationDestination(icon: Icon(Icons.groups), label: 'Leads'),
          NavigationDestination(icon: Icon(Icons.chat_bubble_outline), label: 'AI Chat'),
          NavigationDestination(icon: Icon(Icons.settings), label: 'Team'),
        ],
        onDestinationSelected: (value) => setState(() => _index = value),
      ),
    );
  }
}
