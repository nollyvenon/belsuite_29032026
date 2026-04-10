import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../shared/belsuite_api.dart';

class AssistantScreen extends ConsumerStatefulWidget {
  const AssistantScreen({super.key});

  @override
  ConsumerState<AssistantScreen> createState() => _AssistantScreenState();
}

class _AssistantScreenState extends ConsumerState<AssistantScreen> {
  final _controller = TextEditingController();
  final List<Map<String, String>> _messages = [
    {'role': 'assistant', 'text': 'Hi, I am your Belsuite AI assistant. Ask me to create a campaign, review performance, or optimize content.'},
  ];
  bool _loading = false;

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _messages.add({'role': 'user', 'text': text});
      _controller.clear();
      _loading = true;
    });
    final res = await ref.read(belsuiteApiProvider).assistantChat(
      message: text,
      history: _messages.map((m) => {'role': m['role']!, 'text': m['text']!}).toList(),
    );
    setState(() {
      _messages.add({'role': 'assistant', 'text': (res['message'] ?? res['output'] ?? 'Done.').toString()});
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _messages.length,
            itemBuilder: (_, i) {
              final m = _messages[i];
              final isUser = m['role'] == 'user';
              return Align(
                alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  constraints: const BoxConstraints(maxWidth: 340),
                  decoration: BoxDecoration(
                    color: isUser ? const Color(0xFFFF6A00) : Theme.of(context).cardTheme.color,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Text(m['text']!, style: TextStyle(color: isUser ? Colors.white : null)),
                ),
              );
            },
          ),
        ),
        if (_loading) const Padding(padding: EdgeInsets.only(bottom: 8), child: CircularProgressIndicator()),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: const InputDecoration(hintText: 'Ask AI assistant...'),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton(onPressed: _loading ? null : _send, child: const Icon(Icons.send)),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
