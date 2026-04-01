import 'package:flutter/material.dart';

class VideoStudioScreen extends StatelessWidget {
  const VideoStudioScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            color: const Color(0xFF0C1421),
            border: Border.all(color: const Color(0x22FFFFFF)),
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Desktop parity focus', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
              SizedBox(height: 10),
              Text('The mobile client mirrors video queue visibility, export progress, and recent project access while the desktop app owns full editing ergonomics.'),
            ],
          ),
        ),
        const SizedBox(height: 16),
        ...const [
          'Render queue monitoring',
          'Recent projects',
          'Subtitle generation status',
          'Asset upload handoff',
        ].map(
          (item) => ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(item),
            subtitle: Text('Shared API contract with the web video editor'),
            trailing: Icon(Icons.chevron_right),
          ),
        ),
      ],
    );
  }
}