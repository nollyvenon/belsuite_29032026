import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import 'package:speech_to_text/speech_to_text.dart';
import '../shared/belsuite_api.dart';

class ContentStudioScreen extends ConsumerStatefulWidget {
  const ContentStudioScreen({super.key});

  @override
  ConsumerState<ContentStudioScreen> createState() => _ContentStudioScreenState();
}

class _ContentStudioScreenState extends ConsumerState<ContentStudioScreen> {
  final _controller = TextEditingController();
  final _speech = SpeechToText();
  String _output = '';
  bool _loading = false;

  Future<void> _generate() async {
    setState(() => _loading = true);
    final res = await ref.read(belsuiteApiProvider).generateContent(_controller.text.trim());
    final text = (res['output'] ?? res['text'] ?? 'No content generated').toString();
    setState(() {
      _output = '';
      _loading = false;
    });
    for (final rune in text.runes) {
      await Future<void>.delayed(const Duration(milliseconds: 8));
      if (!mounted) return;
      setState(() => _output += String.fromCharCode(rune));
    }
  }

  Future<void> _listen() async {
    final available = await _speech.initialize();
    if (!available) return;
    await _speech.listen(onResult: (result) {
      _controller.text = result.recognizedWords;
      _controller.selection = TextSelection.fromPosition(TextPosition(offset: _controller.text.length));
    });
  }

  @override
  Widget build(BuildContext context) {
    final templates = ['Product launch post', 'Story ad copy', 'Short CTA caption', 'Email hook'];
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('AI Content Studio', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 6),
        const Text('Generate posts, ads, and captions instantly.'),
        const SizedBox(height: 16),
        TextField(
          controller: _controller,
          minLines: 3,
          maxLines: 6,
          decoration: InputDecoration(
            labelText: 'Prompt',
            hintText: 'Write a high-converting Instagram ad for our AI CRM...',
            suffixIcon: IconButton(onPressed: _listen, icon: const Icon(Icons.mic)),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: templates
              .map((t) => ActionChip(
                    label: Text(t),
                    onPressed: () => _controller.text = t,
                  ))
              .toList(),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: FilledButton.icon(
                onPressed: _loading ? null : _generate,
                icon: _loading
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.auto_awesome),
                label: Text(_loading ? 'Generating...' : 'Generate'),
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              onPressed: _output.isEmpty ? null : _generate,
              icon: const Icon(Icons.refresh),
              tooltip: 'Regenerate',
            ),
            IconButton(
              onPressed: _output.isEmpty ? null : () => Share.share(_output),
              icon: const Icon(Icons.share),
              tooltip: 'Share',
            ),
          ],
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: SelectableText(_output.isEmpty ? 'Generated output appears here.' : _output),
          ),
        ),
      ],
    );
  }
}
