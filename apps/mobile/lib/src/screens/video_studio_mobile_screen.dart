import 'package:flutter/material.dart';
import '../store/app_session_store.dart';

class VideoStudioMobileScreen extends StatefulWidget {
  const VideoStudioMobileScreen({
    Key? key,
    required this.sessionStore,
  }) : super(key: key);

  final AppSessionStore sessionStore;

  @override
  State<VideoStudioMobileScreen> createState() => _VideoStudioMobileScreenState();
}

class _VideoStudioMobileScreenState extends State<VideoStudioMobileScreen> {
  int _selectedTab = 0;

  @override
  Widget build(BuildContext context) {
    return Column(
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
                'Video Studio',
                style: TextStyle(fontSize: 12, color: Color(0xFFB0BEC5)),
              ),
              const SizedBox(height: 12),
              const Text(
                'Create and manage video projects',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 8),
              const Text(
                '248 projects • 42 in progress',
                style: TextStyle(color: Color(0xFF90A4AE)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Tabs
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.white12),
            borderRadius: BorderRadius.circular(12),
            color: Colors.black26,
          ),
          child: Row(
            children: [
              _TabButton(
                title: 'Recent',
                selected: _selectedTab == 0,
                onTap: () => setState(() => _selectedTab = 0),
              ),
              _TabButton(
                title: 'In Progress',
                selected: _selectedTab == 1,
                onTap: () => setState(() => _selectedTab = 1),
              ),
              _TabButton(
                title: 'Templates',
                selected: _selectedTab == 2,
                onTap: () => setState(() => _selectedTab = 2),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Content
        Expanded(
          child: _selectedTab == 0
              ? _buildRecentProjects()
              : _selectedTab == 1
                  ? _buildInProgressProjects()
                  : _buildTemplates(),
        ),
      ],
    );
  }

  Widget _buildRecentProjects() {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        _ProjectCard(
          title: 'Product Demo 2024',
          duration: '2m 14s',
          date: '2 hours ago',
          status: 'Ready',
          statusColor: Colors.green,
        ),
        _ProjectCard(
          title: 'Tutorial Series Pt. 5',
          duration: '4m 32s',
          date: '1 day ago',
          status: 'Published',
          statusColor: Colors.blue,
        ),
        _ProjectCard(
          title: 'Customer Testimonial',
          duration: '1m 45s',
          date: '3 days ago',
          status: 'Draft',
          statusColor: Colors.orange,
        ),
      ],
    );
  }

  Widget _buildInProgressProjects() {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        _ProjectCard(
          title: 'Q1 Campaign Video',
          duration: '—',
          date: 'Processing...',
          status: 'In Progress',
          statusColor: Colors.amber,
          progress: 0.65,
        ),
        _ProjectCard(
          title: 'Behind the Scenes',
          duration: '—',
          date: 'Rendering...',
          status: 'In Progress',
          statusColor: Colors.amber,
          progress: 0.42,
        ),
      ],
    );
  }

  Widget _buildTemplates() {
    return GridView.count(
      crossAxisCount: 2,
      padding: const EdgeInsets.all(16),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      children: [
        _TemplateCard(name: 'Product Showcase'),
        _TemplateCard(name: 'Tutorial'),
        _TemplateCard(name: 'Testimonial'),
        _TemplateCard(name: 'Intro'),
      ],
    );
  }
}

class _TabButton extends StatelessWidget {
  final String title;
  final bool selected;
  final VoidCallback onTap;

  const _TabButton({
    required this.title,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(
                  color: selected ? Colors.white : Colors.transparent,
                  width: 2,
                ),
              ),
            ),
            child: Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: selected ? Colors.white : Colors.grey,
                fontWeight: selected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ProjectCard extends StatelessWidget {
  final String title;
  final String duration;
  final String date;
  final String status;
  final Color statusColor;
  final double? progress;

  const _ProjectCard({
    required this.title,
    required this.duration,
    required this.date,
    required this.status,
    required this.statusColor,
    this.progress,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
        color: Colors.black26,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text(date, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(status, style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          if (progress != null) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: progress,
                minHeight: 4,
                backgroundColor: Colors.white12,
                valueColor: AlwaysStoppedAnimation(statusColor),
              ),
            ),
          ],
          const SizedBox(height: 8),
          Text(duration, style: const TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

class _TemplateCard extends StatelessWidget {
  final String name;

  const _TemplateCard({required this.name});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
        color: Colors.black26,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {},
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.video_library, color: Colors.white.withOpacity(0.7), size: 40),
              const SizedBox(height: 8),
              Text(name, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }
}
