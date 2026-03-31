'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Loader2, X, ChevronDown } from 'lucide-react';
import type { VideoProject } from '@/hooks/useVideoProject';

const VOICE_OPTIONS = [
  { id: 'alloy',   label: 'Alloy',   desc: 'Neutral, balanced' },
  { id: 'echo',    label: 'Echo',    desc: 'Deep, authoritative' },
  { id: 'fable',   label: 'Fable',   desc: 'British, expressive' },
  { id: 'onyx',    label: 'Onyx',    desc: 'Deep, formal' },
  { id: 'nova',    label: 'Nova',    desc: 'Friendly, warm' },
  { id: 'shimmer', label: 'Shimmer', desc: 'Soft, pleasant' },
] as const;

const STYLE_OPTIONS = [
  { value: 'cinematic',  label: 'Cinematic' },
  { value: 'explainer',  label: 'Explainer' },
  { value: 'promo',      label: 'Promo' },
  { value: 'tutorial',   label: 'Tutorial' },
  { value: 'social',     label: 'Social Media' },
] as const;

export function ScriptGeneratorModal({
  project,
  generating,
  onClose,
  onGenerate,
}: {
  project: VideoProject;
  generating: boolean;
  onClose: () => void;
  onGenerate: (script: string, voiceId: string, aspectRatio: string) => Promise<void>;
}) {
  const [script, setScript]             = useState(project.description ?? '');
  const [voiceId, setVoiceId]           = useState<string>('nova');
  const [aspectRatio, setAspectRatio]   = useState('16:9');
  const [style, setStyle]               = useState('cinematic');
  const [showVoices, setShowVoices]     = useState(false);

  const selectedVoice = VOICE_OPTIONS.find((v) => v.id === voiceId) ?? VOICE_OPTIONS[4];

  const ratios = ['16:9', '9:16', '1:1'] as const;

  const handleSubmit = async () => {
    if (!script.trim() || generating) return;
    await onGenerate(script.trim(), voiceId, aspectRatio);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg glass rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Generate from Script</h2>
              <p className="text-xs text-zinc-500">AI will create scenes and voiceovers automatically</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Script textarea */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
              Script / Prompt
            </label>
            <textarea
              autoFocus
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={6}
              placeholder={`Paste your script here, or describe what you want…\n\nExample:\nScene 1: Introduce the product with bold text\nScene 2: Show key features with voiceover\nScene 3: Call to action`}
              className="w-full px-3.5 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 resize-none focus:outline-none focus:border-primary/50 transition-colors leading-relaxed"
            />
            <p className="text-[10px] text-zinc-600 mt-1">{script.length} characters</p>
          </div>

          {/* Options row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Voice */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Voice</label>
              <div className="relative">
                <button
                  onClick={() => setShowVoices(!showVoices)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors text-sm text-white"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{selectedVoice.label}</span>
                    <span className="text-xs text-zinc-500">{selectedVoice.desc}</span>
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${showVoices ? 'rotate-180' : ''}`} />
                </button>
                {showVoices && (
                  <div className="absolute top-full mt-1 left-0 right-0 z-50 glass rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                    {VOICE_OPTIONS.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => { setVoiceId(v.id); setShowVoices(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-white/10 ${
                          voiceId === v.id ? 'bg-primary/10 text-primary' : 'text-zinc-300'
                        }`}
                      >
                        <span className="font-medium">{v.label}</span>
                        <span className="text-xs text-zinc-500">{v.desc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Aspect ratio */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Format</label>
              <div className="flex gap-1.5">
                {ratios.map((r) => (
                  <button
                    key={r}
                    onClick={() => setAspectRatio(r)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                      aspectRatio === r
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Style */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1.5">Style</label>
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    style === s.value
                      ? 'border-primary/60 bg-primary/10 text-primary'
                      : 'border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!script.trim() || generating}
            onClick={handleSubmit}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate Scenes</>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
