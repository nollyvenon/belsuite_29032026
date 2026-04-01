import 'dart:convert';

import 'package:http/http.dart' as http;

class BelsuiteApiClient {
  BelsuiteApiClient({required this.baseUrl});

  final String baseUrl;
  String? accessToken;

  Uri _uri(String path, [Map<String, dynamic>? query]) {
    final normalized = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$baseUrl$normalized').replace(
      queryParameters: query?.map((key, value) => MapEntry(key, '$value')),
    );
  }

  Map<String, String> _headers() {
    return {
      'Content-Type': 'application/json',
      if (accessToken != null) 'Authorization': 'Bearer $accessToken',
    };
  }

  Future<Map<String, dynamic>> getJson(String path, {Map<String, dynamic>? query}) async {
    final response = await http.get(_uri(path, query), headers: _headers());
    return _decode(response);
  }

  Future<Map<String, dynamic>> postJson(String path, Map<String, dynamic> body) async {
    final response = await http.post(_uri(path), headers: _headers(), body: jsonEncode(body));
    return _decode(response);
  }

  Map<String, dynamic> _decode(http.Response response) {
    final payload = response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(payload['message'] ?? 'Request failed');
    }
    return payload;
  }
}