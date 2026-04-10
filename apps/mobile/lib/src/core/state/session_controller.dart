import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/secure_token_store.dart';

class SessionState {
  const SessionState({
    this.accessToken,
    this.refreshToken,
    this.workspaceId,
    this.userName,
  });

  final String? accessToken;
  final String? refreshToken;
  final String? workspaceId;
  final String? userName;

  bool get isAuthenticated => (accessToken ?? '').isNotEmpty;

  SessionState copyWith({
    String? accessToken,
    String? refreshToken,
    String? workspaceId,
    String? userName,
  }) {
    return SessionState(
      accessToken: accessToken ?? this.accessToken,
      refreshToken: refreshToken ?? this.refreshToken,
      workspaceId: workspaceId ?? this.workspaceId,
      userName: userName ?? this.userName,
    );
  }
}

class SessionController extends StateNotifier<SessionState> {
  SessionController() : super(const SessionState()) {
    restore();
  }

  Future<void> restore() async {
    final access = await SecureTokenStore.instance.readAccessToken();
    final refresh = await SecureTokenStore.instance.readRefreshToken();
    if ((access ?? '').isNotEmpty) {
      state = state.copyWith(accessToken: access, refreshToken: refresh);
    }
  }

  Future<void> setTokens({
    required String accessToken,
    required String refreshToken,
    String? workspaceId,
    String? userName,
  }) async {
    await SecureTokenStore.instance.saveTokens(accessToken: accessToken, refreshToken: refreshToken);
    state = state.copyWith(
      accessToken: accessToken,
      refreshToken: refreshToken,
      workspaceId: workspaceId,
      userName: userName,
    );
  }

  Future<void> logout() async {
    await SecureTokenStore.instance.clear();
    state = const SessionState();
  }
}

final sessionControllerProvider = StateNotifierProvider<SessionController, SessionState>((ref) {
  return SessionController();
});
