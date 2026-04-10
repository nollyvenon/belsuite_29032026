import 'package:flutter/material.dart';
import '../store/app_session_store.dart';
import '../services/api_modules.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key, required this.sessionStore});

  final AppSessionStore sessionStore;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  late ApiClient apiClient;
  RevenueMetrics? revenueMetrics;
  AnalyticsMetrics? analyticsMetrics;
  List<VideoProject> recentProjects = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    apiClient = ApiClient(
      baseUrl: 'http://localhost:3000/api',
      sessionStore: widget.sessionStore,
    );
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() => loading = true);
    try {
      final revenue = await apiClient.get<RevenueMetrics>(
        '/v1/billing/overview',
        fromJson: RevenueMetrics.fromJson,
      );
      final analytics = await apiClient.get<AnalyticsMetrics>(
        '/analytics/dashboard',
        fromJson: AnalyticsMetrics.fromJson,
      );
      setState(() {
        revenueMetrics = revenue;
        analyticsMetrics = analytics;
      });
    } catch (e) {
      debugPrint('Error loading dashboard data: $e');
    } finally {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return loading
        ? Scaffold(
            appBar: AppBar(
              title: const Text('Dashboard'),
              backgroundColor: const Color(0xFF05070d),
              elevation: 0,
            ),
            body: Container(
              color: const Color(0xFF05070d),
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            ),
          )
        : Scaffold(
            appBar: AppBar(
              title: const Text('Dashboard'),
              backgroundColor: const Color(0xFF05070d),
              elevation: 0,
            ),
            body: Container(
              color: const Color(0xFF05070d),
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header
                    Text(
                      'Welcome to BelSuite',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Professional content and analytics platform',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey[400],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Revenue Stats
                    if (revenueMetrics != null) ...[
                      Text(
                        'Revenue Overview',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      GridView.count(
                        crossAxisCount: 3,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        children: [
                          _buildSmallStatCard(
                            context,
                            title: 'Revenue (30d)',
                            value: '\$${(revenueMetrics!.current / 1000).toStringAsFixed(1)}K',
                          ),
                          _buildSmallStatCard(
                            context,
                            title: 'MRR',
                            value: '\$${(revenueMetrics!.mrr / 1000).toStringAsFixed(1)}K',
                          ),
                          _buildSmallStatCard(
                            context,
                            title: 'ARR',
                            value: '\$${(revenueMetrics!.arr / 1000).toStringAsFixed(0)}K',
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                    ],

                    // Analytics Stats
                    if (analyticsMetrics != null) ...[
                      Text(
                        'Analytics Snapshot',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: Colors.white,
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
                          _buildStatCard(
                            context,
                            title: 'Tracked Views',
                            value: '${(analyticsMetrics!.views / 1000).toStringAsFixed(1)}K',
                            icon: Icons.visibility,
                          ),
                          _buildStatCard(
                            context,
                            title: 'Engagements',
                            value: '${(analyticsMetrics!.engagements / 1000).toStringAsFixed(1)}K',
                            icon: Icons.favorite,
                          ),
                          _buildStatCard(
                            context,
                            title: 'Conversion Rate',
                            value: '${analyticsMetrics!.conversionRate.toStringAsFixed(2)}%',
                            icon: Icons.trending_up,
                          ),
                          _buildStatCard(
                            context,
                            title: 'Avg Session',
                            value: '${analyticsMetrics!.sessionDuration.toStringAsFixed(1)}m',
                            icon: Icons.timer,
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                    ],

                    // Quick Actions
                    Text(
                      'Quick Actions',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Colors.white,
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
                        _buildActionButton(context, 'Create Video', Icons.add_circle),
                        _buildActionButton(context, 'View Analytics', Icons.analytics),
                        _buildActionButton(context, 'Manage Team', Icons.group),
                        _buildActionButton(context, 'Settings', Icons.settings),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
  }

  Widget _buildSmallStatCard(BuildContext context, {required String title, required String value}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
        color: Colors.black26,
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(title, style: const TextStyle(color: Colors.grey, fontSize: 10)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildStatCard(BuildContext context, {required String title, required String value, required IconData icon}) {
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
          Icon(icon, color: Colors.grey, size: 20),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(title, style: const TextStyle(color: Colors.grey, fontSize: 11)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(BuildContext context, String label, IconData icon) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: Colors.white12),
        borderRadius: BorderRadius.circular(12),
        color: Colors.black26,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {},
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: Colors.white, size: 32),
              const SizedBox(height: 8),
              Text(
                label,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white, fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }
}