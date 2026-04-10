import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/notifications/notification_service.dart';
import 'core/notifications/push_service.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';

class BelSuiteApp extends ConsumerStatefulWidget {
  const BelSuiteApp({super.key});

  @override
  ConsumerState<BelSuiteApp> createState() => _BelSuiteAppState();
}

class _BelSuiteAppState extends ConsumerState<BelSuiteApp> {
  @override
  void initState() {
    super.initState();
    NotificationService.instance.initialize();
    PushNotificationService.instance.initialize();
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(appRouterProvider);
    return MaterialApp.router(
      title: 'Belsuite Mobile',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.system,
      routerConfig: router,
    );
  }
}