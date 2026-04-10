import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../shared/belsuite_api.dart';

class VideoCreatorScreen extends ConsumerStatefulWidget {
  const VideoCreatorScreen({super.key});

  @override
  ConsumerState<VideoCreatorScreen> createState() => _VideoCreatorScreenState();
}

class _VideoCreatorScreenState extends ConsumerState<VideoCreatorScreen> {
  String? _sourcePath;
  String _cropPreset = '9:16';
  bool _autoCaption = true;
  bool _processing = false;
  String? _jobId;

  Future<void> _pickVideo() async {
    final result = await FilePicker.platform.pickFiles(type: FileType.video);
    if (result == null || result.files.single.path == null) return;
    setState(() => _sourcePath = result.files.single.path);
  }

  Future<void> _startProcessing() async {
    if (_sourcePath == null) return;
    setState(() => _processing = true);
    final res = await ref.read(belsuiteApiProvider).createVideoJob(
          sourcePath: _sourcePath!,
          autoCaption: _autoCaption,
          cropPreset: _cropPreset,
        );
    setState(() {
      _processing = false;
      _jobId = (res['jobId'] ?? res['id'] ?? 'queued').toString();
    });
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Video Creator', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 8),
        const Text('Upload or record video, then process captions and social crops asynchronously.'),
        const SizedBox(height: 16),
        OutlinedButton.icon(
          onPressed: _pickVideo,
          icon: const Icon(Icons.upload_file),
          label: Text(_sourcePath == null ? 'Upload Video' : 'Change Video'),
        ),
        if (_sourcePath != null) ...[
          const SizedBox(height: 10),
          Text(_sourcePath!, style: Theme.of(context).textTheme.bodySmall),
        ],
        const SizedBox(height: 16),
        SwitchListTile(
          value: _autoCaption,
          onChanged: (v) => setState(() => _autoCaption = v),
          title: const Text('Auto captions'),
        ),
        DropdownButtonFormField<String>(
          initialValue: _cropPreset,
          decoration: const InputDecoration(labelText: 'Auto crop preset'),
          items: const ['9:16', '1:1', '16:9'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
          onChanged: (v) => setState(() => _cropPreset = v ?? '9:16'),
        ),
        const SizedBox(height: 14),
        FilledButton.icon(
          onPressed: _processing ? null : _startProcessing,
          icon: _processing
              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(Icons.play_arrow),
          label: const Text('Process Video'),
        ),
        if (_jobId != null) ...[
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Text('Job queued: $_jobId\nYou will receive a notification when export is ready.'),
            ),
          ),
        ],
      ],
    );
  }
}
