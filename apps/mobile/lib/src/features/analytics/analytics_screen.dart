import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

class AnalyticsScreen extends StatelessWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Analytics Dashboard', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 8),
        const Text('Track engagement, reach, leads, and revenue in real time.'),
        const SizedBox(height: 14),
        const _MetricsRow(),
        const SizedBox(height: 14),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: SizedBox(
              height: 220,
              child: LineChart(
                LineChartData(
                  titlesData: const FlTitlesData(show: false),
                  gridData: const FlGridData(show: false),
                  borderData: FlBorderData(show: false),
                  lineBarsData: [
                    LineChartBarData(
                      spots: const [FlSpot(0, 2), FlSpot(1, 4), FlSpot(2, 3), FlSpot(3, 5), FlSpot(4, 7), FlSpot(5, 6)],
                      isCurved: true,
                      barWidth: 3,
                      color: const Color(0xFFFF6A00),
                      dotData: const FlDotData(show: false),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 14),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('AI Insights', style: TextStyle(fontWeight: FontWeight.w700)),
                SizedBox(height: 8),
                Text('• Your best posting time is 6 PM.'),
                Text('• Video content is currently outperforming static creatives.'),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _MetricsRow extends StatelessWidget {
  const _MetricsRow();
  @override
  Widget build(BuildContext context) {
    final cards = const [
      ('Engagement', '8.2%'),
      ('Reach', '184K'),
      ('Leads', '1,286'),
      ('Revenue', '\$24.3K'),
    ];
    return GridView.builder(
      shrinkWrap: true,
      itemCount: cards.length,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, mainAxisSpacing: 8, crossAxisSpacing: 8, childAspectRatio: 2.1),
      itemBuilder: (_, i) => Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
            Text(cards[i].$1, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 4),
            Text(cards[i].$2, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
          ]),
        ),
      ),
    );
  }
}
