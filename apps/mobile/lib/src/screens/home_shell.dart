import 'package:flutter/material.dart';

import '../store/app_session_store.dart';
import '../widgets/app_shell.dart';
import 'admin_screen.dart';
import 'analytics_screen.dart';
import 'dashboard_screen.dart';
import 'video_studio_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key, required this.sessionStore});

  final AppSessionStore sessionStore;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final screens = [
      DashboardScreen(sessionStore: widget.sessionStore),
      const AnalyticsScreen(),
      const VideoStudioScreen(),
      const AdminScreen(),
    ];

    const titles = ['BelSuite Dashboard', 'Analytics', 'Video Studio', 'Admin'];

    return MobileAppShell(
      title: titles[_currentIndex],
      body: screens[_currentIndex],
      currentIndex: _currentIndex,
      onTabSelected: (index) => setState(() => _currentIndex = index),
    );
  }
}