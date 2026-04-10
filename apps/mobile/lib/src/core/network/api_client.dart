import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';
import '../state/session_controller.dart';

final apiClientProvider = Provider<Dio>((ref) {
  final session = ref.watch(sessionControllerProvider);
  final dio = Dio(
    BaseOptions(
      baseUrl: const String.fromEnvironment('BELSUITE_API_URL', defaultValue: 'http://localhost:3001'),
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 20),
      sendTimeout: const Duration(seconds: 20),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        if ((session.accessToken ?? '').isNotEmpty) {
          options.headers['Authorization'] = 'Bearer ${session.accessToken}';
        }
        handler.next(options);
      },
    ),
  );

  dio.interceptors.add(
    PrettyDioLogger(
      requestBody: true,
      requestHeader: true,
      responseBody: true,
      error: true,
      compact: true,
      maxWidth: 120,
    ),
  );
  return dio;
});
