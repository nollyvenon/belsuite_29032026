'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  Save,
  Image as ImageIcon,
} from 'lucide-react';
import { useAdGenerator } from '@/hooks/useMarketing';
import type { AdCreative } from '@/hooks/useMarketing';

const PLATFORMS = ['FACEBOOK', 'INSTAGRAM', 'GOOGLE_SEARCH', 'GOOGLE_DISPLAY', 'TIKTOK_ADS', 'LINKEDIN_ADS'] as const;
const FORMATS = ['SINGLE_IMAGE', 'CAROUSEL', 'VIDEO', 'STORY', 'RESPONSIVE_SEARCH', 'RESPONSIVE_DISPLAY'] as const;
const OBJECTIVES = ['AWARENESS', 'TRAFFIC', 'LEADS', 'CONVERSIONS', 'ENGAGEMENT', 'APP_INSTALLS'] as const;
const TONES = ['professional', 'casual', 'urgent', 'friendly', 'bold', 'luxury'] as const;

function scoreColor(score: number) {
  if (score >= 0.8) return 'text-emerald-400';
  if (score >= 0.6) return 'text-amber-400';
  return 'text-red-400';
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export function AdGeneratorPanel() {
  const { result, generating, error, generate, saveToCamera } = useAdGenerator();

  const [form, setForm] = useState({
    businessName: '',
    productOrService: '',
    targetAudience: '',
    keyBenefits: '',
    platform: 'FACEBOOK' as string,
    format: 'SINGLE_IMAGE' as string,
    objective: 'CONVERSIONS' as string,
    tone: 'professional' as string,
    budget: '',
    variantCount: 3,
  });
  const [campaignId, setCampaignId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [creativePrompts, setCreativePrompts] = useState<string[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(false);

  function setField(k: string, v: string | number) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    await generate({
      businessName: form.businessName,
      productOrService: form.productOrService,
      targetAudience: form.targetAudience,
      objective: form.objective as any,
      platform: form.platform as any,
      format: form.format as any,
      tone: form.tone,
      keyBenefits: form.keyBenefits.split(',').map((s) => s.trim()).filter(Boolean),
      budget: form.budget ? parseFloat(form.budget) : undefined,
      variantCount: form.variantCount,
    });
    setOpenIdx(0);
  }

  async function handleGetPrompts() {
    if (!result) return;
    setPromptsLoading(true);
    try {
      const res = await fetch('/api/marketing/ai/creative-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          platform: form.platform,
          format: form.format,
          objective: form.objective,
          adCreatives: result.variants,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreativePrompts(data.prompts ?? []);
      }
    } finally {
      setPromptsLoading(false);
    }
  }

  async function handleSave() {
    if (!result || !campaignId.trim()) return;
    setSaving(true);
    try {
      await saveToCamera(campaignId, result, {
        platform: form.platform,
        format: form.format,
        objective: form.objective,
      });
      setSaveSuccess(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Left: form */}
      <div className="bg-white/[0.03] border border-white/5 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">AI Ad Generator</h3>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <Field label="Business / Brand *">
              <input required value={form.businessName} onChange={(e) => setField('businessName', e.target.value)} placeholder="Acme Inc." className={inputCls} />
            </Field>
            <Field label="Product / Service *">
              <input required value={form.productOrService} onChange={(e) => setField('productOrService', e.target.value)} placeholder="Cloud accounting software" className={inputCls} />
            </Field>
            <Field label="Target Audience">
              <input value={form.targetAudience} onChange={(e) => setField('targetAudience', e.target.value)} placeholder="Small business owners, 30-55" className={inputCls} />
            </Field>
            <Field label="Key Benefits (comma-separated)">
              <input value={form.keyBenefits} onChange={(e) => setField('keyBenefits', e.target.value)} placeholder="Save time, reduce errors, easy setup" className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Platform">
              <select value={form.platform} onChange={(e) => setField('platform', e.target.value)} className={selectCls}>
                {PLATFORMS.map((p) => <option key={p} value={p} className="bg-[#111]">{p.replace(/_/g, ' ')}</option>)}
              </select>
            </Field>
            <Field label="Format">
              <select value={form.format} onChange={(e) => setField('format', e.target.value)} className={selectCls}>
                {FORMATS.map((f) => <option key={f} value={f} className="bg-[#111]">{f.replace(/_/g, ' ')}</option>)}
              </select>
            </Field>
            <Field label="Objective">
              <select value={form.objective} onChange={(e) => setField('objective', e.target.value)} className={selectCls}>
                {OBJECTIVES.map((o) => <option key={o} value={o} className="bg-[#111]">{o.replace(/_/g, ' ')}</option>)}
              </select>
            </Field>
            <Field label="Tone">
              <select value={form.tone} onChange={(e) => setField('tone', e.target.value)} className={selectCls}>
                {TONES.map((t) => <option key={t} value={t} className="bg-[#111]">{t}</option>)}
              </select>
            </Field>
            <Field label="Budget ($, optional)">
              <input type="number" min="0" step="any" value={form.budget} onChange={(e) => setField('budget', e.target.value)} placeholder="1000" className={inputCls} />
            </Field>
            <Field label="Variants">
              <input type="number" min={1} max={10} value={form.variantCount} onChange={(e) => setField('variantCount', parseInt(e.target.value) || 3)} className={inputCls} />
            </Field>
          </div>

          <button type="submit" disabled={generating} className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50">
            {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Ads</>}
          </button>
        </form>
      </div>

      {/* Right: results */}
      <div className="space-y-3">
        {error && <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-4 text-sm text-red-400">{error}</div>}

        {result && (
          <>
            {/* Suggested audience */}
            {result.suggestedAudience && (
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <p className="text-xs text-zinc-500 mb-2">Suggested Audience</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.suggestedAudience.interests?.map((i: string) => (
                    <span key={i} className="text-xs bg-violet-400/10 text-violet-400 px-2 py-0.5 rounded-full">{i}</span>
                  ))}
                  {result.suggestedAudience.behaviors?.map((b: string) => (
                    <span key={b} className="text-xs bg-sky-400/10 text-sky-400 px-2 py-0.5 rounded-full">{b}</span>
                  ))}
                </div>
                {result.suggestedAudience.ageRange && (
                  <p className="text-xs text-zinc-500 mt-1">Age: {result.suggestedAudience.ageRange.min}–{result.suggestedAudience.ageRange.max}</p>
                )}
              </div>
            )}

            {/* Budget suggestion */}
            {result.suggestedBudget && (
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500">Suggested Budget</p>
                  <p className="text-sm font-semibold text-white">${result.suggestedBudget.daily}/day</p>
                </div>
                <p className="text-xs text-zinc-500 max-w-[180px] text-right">{result.suggestedBudget.reasoning}</p>
              </div>
            )}

            {/* Ad variants */}
            <div className="space-y-2">
              {result.variants.map((ad: AdCreative, i: number) => (
                <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
                    onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  >
                    <div className="flex items-center gap-3 text-left min-w-0">
                      <div className="w-6 h-6 rounded bg-violet-400/10 flex items-center justify-center text-xs text-violet-400 font-bold shrink-0">{i + 1}</div>
                      <p className="text-sm text-white font-medium truncate">{ad.headline}</p>
                      <span className={`text-xs font-bold shrink-0 ${scoreColor(ad.aiScore)}`}>{Math.round(ad.aiScore * 100)}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform ${openIdx === i ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openIdx === i && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                          <Row label="Headline" value={ad.headline} />
                          <Row label="Body" value={ad.body} />
                          {ad.callToAction && <Row label="CTA" value={ad.callToAction} />}
                          {ad.rationale && (
                            <div>
                              <p className="text-xs text-zinc-600 mb-0.5">Rationale</p>
                              <p className="text-xs text-zinc-400 italic">{ad.rationale}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Platform tips */}
            {result.platformTips && result.platformTips.length > 0 && (
              <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4">
                <p className="text-xs text-amber-400 font-medium mb-2">Platform Tips</p>
                <ul className="space-y-1">
                  {result.platformTips.map((tip: string, i: number) => (
                    <li key={i} className="text-xs text-zinc-400 flex gap-2"><span className="text-amber-400 shrink-0">·</span>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Creative prompts */}
            <div className="flex gap-2">
          <button type="button" onClick={handleGetPrompts} disabled={promptsLoading} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
                {promptsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                Get Image Prompts
              </button>
            </div>

            {creativePrompts.length > 0 && (
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 space-y-2">
                <p className="text-xs text-zinc-500 font-medium">Creative Prompts (for DALL-E / Midjourney)</p>
                {creativePrompts.map((p, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <p className="text-xs text-zinc-400 flex-1">{p}</p>
                    <CopyButton text={p} />
                  </div>
                ))}
              </div>
            )}

            {/* Save to campaign */}
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 flex gap-2 items-center">
              <input value={campaignId} onChange={(e) => setCampaignId(e.target.value)} placeholder="Campaign ID to save ads to" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20" />
              <button type="button" onClick={handleSave} disabled={saving || !campaignId.trim()} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-50 shrink-0">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <><Check className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save</>}
              </button>
            </div>
          </>
        )}

        {!result && !generating && (
          <div className="bg-white/[0.03] border border-white/5 rounded-xl py-16 text-center">
            <Sparkles className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">Fill in the form and click Generate.</p>
          </div>
        )}

        {generating && (
          <div className="bg-white/[0.03] border border-white/5 rounded-xl py-16 text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400 mx-auto" />
            <p className="text-sm text-zinc-500">AI is crafting your ads...</p>
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-white/20';
const selectCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-zinc-500 mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <p className="text-xs text-zinc-600">{label}</p>
        <button onClick={handleCopy} className="p-1.5 rounded hover:bg-white/5 text-zinc-500 hover:text-white transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <p className="text-sm text-white">{value}</p>
    </div>
  );
}
