import 'package:flutter/material.dart';

class AdminScreen extends StatelessWidget {
  const AdminScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: const Color(0xFF0C1421),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0x22FFFFFF)),
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Admin control surface', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
              SizedBox(height: 8),
              Text('Tenant status, provider health, and email configuration can be surfaced here with the same `/api/tenants` and `/api/admin/email/*` endpoints used by the web panel.'),
            ],
          ),
        ),
        const SizedBox(height: 16),
        ...const [
          'Tenant roster',
          'Email provider health',
          'Failover policy',
          'Rate-limit controls',
        ].map(
          (item) => Card(
            color: Color(0xFF0C1421),
            child: ListTile(
              title: Text(item),
              subtitle: Text('Ready for API-backed implementation'),
            ),
          ),
        ),
      ],
    );
  }
}