import 'package:flutter/material.dart';
import '../store/app_session_store.dart';

class AnalyticsScreenEnhanced extends StatelessWidget {
  const AnalyticsScreenEnhanced({
    Key? key,
    required this.sessionStore,
  }) : super(key: key);

  final AppSessionStore sessionStore;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(28),
              gradient: const LinearGradient(
                colors: [Color(0x22FF6A00), Color(0x1122D3EE)],
              ),
              border: Border.all(color: const Color(0x22FFFFFF)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Analytics',
                  style: TextStyle(fontSize: 12, color: Color(0xFFB0BEC5)),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Real-time insights across all modules',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                Text(
                  'Last updated: 2 minutes ago',
                  style: const TextStyle(color: Color(0xFF90A4AE)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Key Metrics
          Text(
            'Key Metrics',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            children: [
              _MetricCard(label: 'Tracked Views', value: '142.4K', change: '+12.5%'),
              _MetricCard(label: 'Engagements', value: '28.9K', change: '+8.3%'),
              _MetricCard(label: 'Conversion Rate', value: '3.24%', change: '+0.4%'),
              _MetricCard(label: 'Avg Session', value: '4m 32s', change: '+15s'),
            ],
          ),
          const SizedBox(height: 24),

          // Module Breakdown
          Text(
            'Module Performance',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          ..._buildModuleMetrics(),
        ],
      ),
    );
  }

  List<Widget> _buildModuleMetrics() {
    final modules = [
      {'name': 'Marketing', 'value': '₦12.4M', 'change': '+28%', 'color': Color(0xFF60a5fa)},
      {'name': 'Social', 'value': '₦8.2M', 'change': '+15%', 'color': Color(0xFF34d399)},
      {'name': 'Video', 'value': '₦5.8M', 'change': '+42%', 'color': Color(0xFFc084fc)},
      {'name': 'UGC', 'value': '₦3.1M', 'change': '+7%', 'color': Color(0xFFf87171)},
    ];

    return modules
        .map(
          (module) => Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white12),
              color: Colors.black26,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        module['name'] as String,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        module['value'] as String,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  module['change'] as String,
                  style: const TextStyle(
                    color: Colors.green,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        )
        .toList();
  }
}

class _MetricCard extends StatelessWidget {
  final String label;
  final String value;
  final String change;

  const _MetricCard({
    required this.label,
    required this.value,
    required this.change,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
        color: Colors.black26,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 11)),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
          Text(change, style: const TextStyle(color: Colors.green, fontSize: 10)),
        ],
      ),
    );
  }
}
