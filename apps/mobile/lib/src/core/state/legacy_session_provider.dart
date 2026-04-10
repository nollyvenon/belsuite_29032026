import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/api_client.dart';
import '../../store/app_session_store.dart';

final legacySessionStoreProvider = Provider<AppSessionStore>((ref) {
  final client = BelsuiteApiClient(
    baseUrl: const String.fromEnvironment(
      'BELSUITE_API_URL',
      defaultValue: 'http://localhost:3001',
    ),
  );
  return AppSessionStore(apiClient: client);
});
