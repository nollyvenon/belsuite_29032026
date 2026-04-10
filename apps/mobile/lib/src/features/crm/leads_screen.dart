import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../shared/belsuite_api.dart';

class LeadsScreen extends ConsumerWidget {
  const LeadsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: ref.read(belsuiteApiProvider).getLeads(),
      builder: (context, snapshot) {
        final leads = snapshot.data ?? const [];
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text('Leads & CRM', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            const Text('Update pipeline status and contact leads quickly.'),
            const SizedBox(height: 12),
            if (snapshot.connectionState == ConnectionState.waiting)
              const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()))
            else if (leads.isEmpty)
              const Card(child: Padding(padding: EdgeInsets.all(14), child: Text('No leads yet.')))
            else
              ...leads.map((lead) => Card(
                    child: ListTile(
                      title: Text((lead['fullName'] ?? lead['name'] ?? 'Lead').toString()),
                      subtitle: Text((lead['email'] ?? 'No email').toString()),
                      trailing: PopupMenuButton<String>(
                        onSelected: (_) {},
                        itemBuilder: (_) => const [
                          PopupMenuItem(value: 'call', child: Text('Call')),
                          PopupMenuItem(value: 'email', child: Text('Email')),
                          PopupMenuItem(value: 'message', child: Text('Message')),
                        ],
                      ),
                    ),
                  )),
          ],
        );
      },
    );
  }
}
