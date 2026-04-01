import 'package:flutter/foundation.dart';

import '../services/api_client.dart';

class AppSessionStore extends ChangeNotifier {
  AppSessionStore({required this.apiClient});

  final BelsuiteApiClient apiClient;

  String? _accessToken;

  String? get accessToken => _accessToken;
  bool get isAuthenticated => _accessToken != null && _accessToken!.isNotEmpty;

  void setAccessToken(String token) {
    _accessToken = token;
    apiClient.accessToken = token;
    notifyListeners();
  }

  void clear() {
    _accessToken = null;
    apiClient.accessToken = null;
    notifyListeners();
  }
}