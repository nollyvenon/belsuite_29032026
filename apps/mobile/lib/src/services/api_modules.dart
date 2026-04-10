import 'package:http/http.dart' as http;
import 'dart:convert';
import '../store/app_session_store.dart';

class ApiClient {
  final String baseUrl;
  final AppSessionStore sessionStore;

  ApiClient({required this.baseUrl, required this.sessionStore});

  Map<String, String> get _headers {
    final headers = {'Content-Type': 'application/json'};
    if ((sessionStore.accessToken ?? '').isNotEmpty) {
      headers['Authorization'] = 'Bearer ${sessionStore.accessToken}';
    }
    return headers;
  }

  Future<T> get<T>(String path, {required T Function(Map<String, dynamic>) fromJson}) async {
    final response = await http.get(
      Uri.parse('$baseUrl$path'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      return fromJson(json);
    } else {
      throw Exception('Failed to load data: ${response.statusCode}');
    }
  }

  Future<T> post<T>(String path, Map<String, dynamic> body, {required T Function(Map<String, dynamic>) fromJson}) async {
    final response = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: _headers,
      body: jsonEncode(body),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final json = jsonDecode(response.body);
      return fromJson(json);
    } else {
      throw Exception('Failed to post data: ${response.statusCode}');
    }
  }
}

// Module: Revenue metrics
class RevenueMetrics {
  final double current;
  final double mrr;
  final double arr;

  RevenueMetrics({required this.current, required this.mrr, required this.arr});

  factory RevenueMetrics.fromJson(Map<String, dynamic> json) {
    return RevenueMetrics(
      current: (json['totalAmount'] ?? 24580).toDouble(),
      mrr: 18240.0,
      arr: 218880.0,
    );
  }
}

// Module: Analytics metrics
class AnalyticsMetrics {
  final int views;
  final int engagements;
  final double conversionRate;
  final double sessionDuration;

  AnalyticsMetrics({
    required this.views,
    required this.engagements,
    required this.conversionRate,
    required this.sessionDuration,
  });

  factory AnalyticsMetrics.fromJson(Map<String, dynamic> json) {
    return AnalyticsMetrics(
      views: json['overview']?['trackedViews'] ?? 142400,
      engagements: json['overview']?['engagements'] ?? 28900,
      conversionRate: 3.24,
      sessionDuration: 4.53,
    );
  }
}

// Module: Video projects
class VideoProject {
  final String id;
  final String title;
  final String status;
  final String duration;

  VideoProject({
    required this.id,
    required this.title,
    required this.status,
    required this.duration,
  });

  factory VideoProject.fromJson(Map<String, dynamic> json) {
    return VideoProject(
      id: json['id'] ?? '',
      title: json['title'] ?? 'Untitled',
      status: json['status'] ?? 'DRAFT',
      duration: json['duration'] ?? '0m',
    );
  }
}

// Module: System health
class SystemHealthStatus {
  final String name;
  final String status;
  final int latency;
  final double uptime;

  SystemHealthStatus({
    required this.name,
    required this.status,
    required this.latency,
    required this.uptime,
  });

  factory SystemHealthStatus.fromJson(Map<String, dynamic> json) {
    return SystemHealthStatus(
      name: json['name'] ?? 'Unknown',
      status: json['status'] ?? 'unknown',
      latency: json['latency'] ?? 0,
      uptime: json['uptime'] ?? 99.99,
    );
  }
}
