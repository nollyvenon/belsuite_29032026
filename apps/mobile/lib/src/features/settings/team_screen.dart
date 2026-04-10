import 'package:flutter/material.dart';
import 'package:local_auth/local_auth.dart';

class TeamScreen extends StatefulWidget {
  const TeamScreen({super.key});

  @override
  State<TeamScreen> createState() => _TeamScreenState();
}

class _TeamScreenState extends State<TeamScreen> {
  final _auth = LocalAuthentication();
  String _workspace = 'Belsuite HQ';
  bool _biometricEnabled = false;

  Future<void> _enableBiometric() async {
    final canCheck = await _auth.canCheckBiometrics;
    if (!canCheck) return;
    final ok = await _auth.authenticate(localizedReason: 'Enable biometric login');
    if (ok && mounted) setState(() => _biometricEnabled = true);
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('User & Team', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 8),
        const Text('Manage profile, workspace, and team visibility.'),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue: _workspace,
          decoration: const InputDecoration(labelText: 'Workspace'),
          items: const ['Belsuite HQ', 'Acme Growth', 'Demo Workspace']
              .map((w) => DropdownMenuItem(value: w, child: Text(w)))
              .toList(),
          onChanged: (v) => setState(() => _workspace = v ?? _workspace),
        ),
        const SizedBox(height: 12),
        SwitchListTile(
          value: _biometricEnabled,
          onChanged: (_) => _enableBiometric(),
          title: const Text('Biometric login'),
          subtitle: const Text('Face ID / Fingerprint for secure unlock'),
        ),
        const SizedBox(height: 12),
        const Card(
          child: Padding(
            padding: EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Team Members', style: TextStyle(fontWeight: FontWeight.w700)),
                SizedBox(height: 8),
                ListTile(title: Text('Alice Johnson'), subtitle: Text('Admin')),
                ListTile(title: Text('David Mensah'), subtitle: Text('Editor')),
                ListTile(title: Text('Grace Kim'), subtitle: Text('Viewer')),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
