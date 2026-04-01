import 'package:flutter/material.dart';

import 'screens/home_shell.dart';
import 'services/api_client.dart';
import 'store/app_session_store.dart';

void runBelSuiteMobile() {
  final sessionStore = AppSessionStore(
    apiClient: BelsuiteApiClient(baseUrl: const String.fromEnvironment('BELSUITE_API_URL', defaultValue: 'http://localhost:3001')),
  );

  runApp(BelSuiteMobileApp(sessionStore: sessionStore));
}

class BelSuiteMobileApp extends StatelessWidget {
  const BelSuiteMobileApp({super.key, required this.sessionStore});

  final AppSessionStore sessionStore;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BelSuite Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF05070D),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFFF6A00),
          secondary: Color(0xFF22D3EE),
          surface: Color(0xFF0C1421),
        ),
        useMaterial3: true,
      ),
      home: HomeShell(sessionStore: sessionStore),
    );
  }
}