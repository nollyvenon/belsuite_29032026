import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';

class BelsuiteApi {
  BelsuiteApi(this._dio);
  final Dio _dio;

  Future<List<Map<String, dynamic>>> getLeads() async {
    final res = await _dio.get('/api/crm-engine/leads');
    return ((res.data as Map<String, dynamic>)['leads'] as List? ?? const []).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> getAnalyticsOverview() async {
    final res = await _dio.get('/api/analytics/insights');
    return {'insights': res.data};
  }

  Future<Map<String, dynamic>> generateContent(String prompt) async {
    final res = await _dio.post('/api/ai-gateway/generate', data: {'task': 'content_generation', 'input': prompt});
    return (res.data as Map).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>> createVideoJob({
    required String sourcePath,
    required bool autoCaption,
    required String cropPreset,
  }) async {
    final res = await _dio.post('/api/video/process', data: {
      'sourcePath': sourcePath,
      'autoCaption': autoCaption,
      'cropPreset': cropPreset,
    });
    return (res.data as Map).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>> assistantChat({
    required String message,
    List<Map<String, String>> history = const [],
  }) async {
    final res = await _dio.post('/api/ai-gateway/chat', data: {'message': message, 'history': history});
    return (res.data as Map).cast<String, dynamic>();
  }
}

final belsuiteApiProvider = Provider<BelsuiteApi>((ref) {
  return BelsuiteApi(ref.watch(apiClientProvider));
});
