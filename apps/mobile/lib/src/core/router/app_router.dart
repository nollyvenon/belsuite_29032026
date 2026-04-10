import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/state/legacy_session_provider.dart';
import '../../features/shell/home_shell.dart' as modern;
import '../../screens/home_shell.dart' as legacy;

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        builder: (_, __) => legacy.HomeShell(
          sessionStore: ref.read(legacySessionStoreProvider),
        ),
      ),
      GoRoute(
        path: '/v2',
        builder: (_, __) => const modern.HomeShell(),
      ),
    ],
  );
});
