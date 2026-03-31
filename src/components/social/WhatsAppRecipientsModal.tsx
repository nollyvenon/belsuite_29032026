'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Loader2, Save, AlertCircle, CheckCircle2, Phone } from 'lucide-react';
import type { SocialAccount } from '@/hooks/useSocial';
import { useWhatsAppRecipients } from '@/hooks/useSocial';

interface Props {
  account: SocialAccount;
  onClose: () => void;
}

/** E.164 regex: + followed by 1–3 digit country code then 7–12 digits */
const E164_RE = /^\+[1-9]\d{7,14}$/;

export function WhatsAppRecipientsModal({ account, onClose }: Props) {
  const { recipients: saved, loading, saving, save } = useWhatsAppRecipients(account.id);

  const [draft, setDraft]     = useState<string[]>([]);
  const [input, setInput]     = useState('');
  const [inputError, setInputError] = useState('');
  const [saved2, setSaved2]   = useState(false);

  // Seed draft from fetched data once
  const [seeded, setSeeded]   = useState(false);
  if (!loading && !seeded) {
    setDraft(saved);
    setSeeded(true);
  }

  function addNumber() {
    const n = input.trim();
    if (!n) return;
    if (!E164_RE.test(n)) {
      setInputError('Must be E.164 format, e.g. +14155552671');
      return;
    }
    if (draft.includes(n)) {
      setInputError('Number already in list');
      return;
    }
    setInputError('');
    setDraft((d) => [...d, n]);
    setInput('');
  }

  function removeNumber(num: string) {
    setDraft((d) => d.filter((x) => x !== num));
  }

  async function handleSave() {
    await save(draft);
    setSaved2(true);
    setTimeout(() => setSaved2(false), 2500);
  }

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f0f13] p-6 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💬</span>
              <div>
                <h2 className="font-semibold text-white">WhatsApp Recipients</h2>
                <p className="text-xs text-gray-400">@{account.platformUsername ?? account.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-3 text-sm text-gray-400">
            Add phone numbers in <span className="font-mono text-gray-300">E.164</span> format
            (e.g.&nbsp;<span className="font-mono text-gray-300">+14155552671</span>). Scheduled
            posts will be broadcasted to all numbers in this list.
          </p>

          {/* Loading */}
          {loading ? (
            <div className="mt-6 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : (
            <>
              {/* Add number input */}
              <div className="mt-5">
                <label className="mb-1.5 block text-xs font-medium text-gray-300">
                  Add a number
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                      type="tel"
                      value={input}
                      onChange={(e) => { setInput(e.target.value); setInputError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && addNumber()}
                      placeholder="+14155552671"
                      className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                    />
                  </div>
                  <button
                    onClick={addNumber}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>
                {inputError && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-red-400">
                    <AlertCircle className="h-3 w-3" />
                    {inputError}
                  </p>
                )}
              </div>

              {/* Recipient list */}
              <div className="mt-4 max-h-56 space-y-1.5 overflow-y-auto pr-1">
                {draft.length === 0 ? (
                  <p className="text-center text-xs text-gray-600 py-6">
                    No recipients yet — add a number above.
                  </p>
                ) : (
                  draft.map((num) => (
                    <div
                      key={num}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2"
                    >
                      <span className="font-mono text-sm text-gray-200">{num}</span>
                      <button
                        onClick={() => removeNumber(num)}
                        className="text-gray-500 hover:text-red-400"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {draft.length} recipient{draft.length !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-3">
                  {saved2 && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                    </span>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
