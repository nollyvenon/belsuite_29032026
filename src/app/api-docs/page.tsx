'use client';

import Link from 'next/link';
import { AppShell } from '@/components/system/AppShell';
import { PageHeader } from '@/components/system/PageHeader';

const MODULES = [
  {
    id: 'm0',
    title: 'Authentication',
    anchor: '#authentication',
  },
  {
    id: 'm1',
    title: 'Lead Engine',
    anchor: '#lead-engine',
  },
  {
    id: 'm2',
    title: 'SEO Engine',
    anchor: '#seo-engine',
  },
  {
    id: 'm3',
    title: 'CRM Engine',
    anchor: '#crm-engine',
  },
  {
    id: 'm4',
    title: 'Marketing Automation',
    anchor: '#marketing-automation',
  },
  {
    id: 'm5',
    title: 'AI Calling & Voice Agents',
    anchor: '#module-5--ai-calling--voice-agents',
  },
];

type Endpoint = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  auth: boolean;
};

const M5_ENDPOINTS: Endpoint[] = [
  { method: 'POST', path: '/api/ai-calling/agents', description: 'Create a voice agent persona', auth: true },
  { method: 'GET', path: '/api/ai-calling/agents', description: 'List all voice agents', auth: true },
  { method: 'POST', path: '/api/ai-calling/calls/start', description: 'Queue an outbound AI call', auth: true },
  { method: 'GET', path: '/api/ai-calling/calls', description: 'List calls with pagination and filters', auth: true },
  { method: 'GET', path: '/api/ai-calling/calls/:callId', description: 'Get call detail + conversation memory', auth: true },
  { method: 'POST', path: '/api/ai-calling/calls/:callId/turn', description: 'Submit customer speech, receive AI reply + qualification', auth: true },
  { method: 'POST', path: '/api/ai-calling/calls/book-appointment', description: 'Book an appointment from a call', auth: true },
  { method: 'GET', path: '/api/ai-calling/stats', description: 'Calling stats for a given period', auth: true },
  { method: 'POST', path: '/api/ai-calling/webhooks/twilio/voice', description: 'Twilio voice status callback (public, HMAC-signed)', auth: false },
  { method: 'POST', path: '/api/ai-calling/webhooks/twilio/recording', description: 'Twilio recording available callback (public, HMAC-signed)', auth: false },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-sky-500/15 text-sky-300',
  POST: 'bg-emerald-500/15 text-emerald-300',
  PUT: 'bg-amber-500/15 text-amber-300',
  PATCH: 'bg-orange-500/15 text-orange-300',
  DELETE: 'bg-red-500/15 text-red-300',
};

export default function ApiDocsPage() {
  return (
    <AppShell activeRoute="api-docs">
      <PageHeader
        eyebrow="API Reference"
        title="Module endpoints, event contracts, and webhook integrations."
        description="All requests (except public Twilio callbacks) require an Authorization: Bearer <jwt> header. Obtain a token via POST /api/v1/auth/login."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Table of contents */}
        <nav className="hidden lg:block">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Modules</p>
          <ul className="space-y-1">
            {MODULES.map((m) => (
              <li key={m.id}>
                <a
                  href={m.anchor}
                  className="block rounded-xl px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
                >
                  {m.title}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-white/10 pt-4">
            <a
              href="/API_DOCUMENTATION.md"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl px-3 py-2 text-xs text-slate-500 hover:text-slate-300"
            >
              Full Markdown Spec ↗
            </a>
          </div>
        </nav>

        {/* Main content */}
        <div className="space-y-14 pb-24">
          {/* --- Base URL --- */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">Base URL</h2>
            <CodeBlock code={'Development: http://localhost:3001\nProduction:  https://api.belsuite.com'} />
          </section>

          {/* --- Module 5 --- */}
          <section id="module-5--ai-calling--voice-agents">
            <SectionTitle badge="Module 5">AI Calling & Voice Agents</SectionTitle>
            <p className="mb-6 text-sm text-slate-400">
              Cold outbound AI calls, multi-turn conversation with memory, lead qualification scoring, appointment booking,
              Twilio Voice integration, and Whisper recording transcription.
            </p>

            <div className="mb-8 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-widest text-slate-500">
                    <th className="px-4 py-3 text-left">Method</th>
                    <th className="px-4 py-3 text-left">Path</th>
                    <th className="px-4 py-3 text-left">Description</th>
                    <th className="px-4 py-3 text-left">Auth</th>
                  </tr>
                </thead>
                <tbody>
                  {M5_ENDPOINTS.map((ep) => (
                    <tr key={ep.path + ep.method} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3">
                        <span className={`rounded px-2 py-1 text-xs font-mono font-semibold ${METHOD_COLORS[ep.method]}`}>
                          {ep.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-300">{ep.path}</td>
                      <td className="px-4 py-3 text-slate-400">{ep.description}</td>
                      <td className="px-4 py-3 text-xs">
                        {ep.auth ? (
                          <span className="text-sky-400">JWT</span>
                        ) : (
                          <span className="text-amber-400">HMAC</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-6">
              <EndpointBlock
                method="POST"
                path="/api/ai-calling/agents"
                description="Create a voice agent persona with objection playbooks and qualification questions."
                request={`{
  "name": "BelSuite Outbound SDR",
  "objective": "book_appointments",
  "industry": "SaaS",
  "style": "consultative",
  "objectionPlaybook": ["Not interested right now"],
  "qualificationQuestions": ["What growth target matters most?"]
}`}
                response={`{
  "id": "evt_abc123",
  "name": "BelSuite Outbound SDR",
  "style": "consultative",
  "createdAt": "2026-04-01T12:00:00.000Z"
}`}
                statusCodes={['201 Created', '400 Validation error']}
              />

              <EndpointBlock
                method="POST"
                path="/api/ai-calling/calls/start"
                description="Queue an outbound call. AI generates the opening script via GPT-4 Turbo before dispatching to Twilio."
                request={`{
  "voiceAgentId": "evt_abc123",
  "lead": {
    "fullName": "Jane Smith",
    "companyName": "Acme Corp",
    "phone": "+12025551234"
  },
  "objective": "book a growth strategy call"
}`}
                response={`{
  "callId": "evt_call456",
  "status": "queued",
  "openingScript": "Hi Jane, this is BelSuite..."
}`}
                statusCodes={['201 Created', '404 Voice agent not found']}
              />

              <EndpointBlock
                method="POST"
                path="/api/ai-calling/calls/:callId/turn"
                description="Submit customer speech transcript. Returns AI reply and lead qualification signal."
                request={`{
  "transcript": "Pricing is our main concern right now.",
  "intentHint": "pricing_objection"
}`}
                response={`{
  "callId": "evt_call456",
  "agentReply": "That makes sense. What growth target are you working toward?",
  "qualification": {
    "score": 72,
    "intent": "high",
    "budgetSignal": "concerned",
    "timelineSignal": "unknown",
    "authoritySignal": "likely",
    "summary": "Pricing objection raised but intent is high."
  }
}`}
                statusCodes={['200 OK', '400 Missing transcript', '404 Call not found']}
              />

              <EndpointBlock
                method="POST"
                path="/api/ai-calling/calls/book-appointment"
                description="Book an appointment from an AI call."
                request={`{
  "callId": "evt_call456",
  "appointmentAt": "2026-04-03T14:00:00.000Z",
  "timezone": "America/New_York",
  "notes": "Interested in growth automation"
}`}
                response={`{
  "callId": "evt_call456",
  "status": "booked",
  "appointmentAt": "2026-04-03T14:00:00.000Z"
}`}
                statusCodes={['200 OK', '404 Call not found']}
              />

              <EndpointBlock
                method="GET"
                path="/api/ai-calling/stats?days=30"
                description="Aggregate stats: total calls, booked appointments, booking rate, and provider status breakdown."
                response={`{
  "periodDays": 30,
  "totals": {
    "calls": 142,
    "booked": 31,
    "bookingRate": 21.83,
    "transcribed": 98
  },
  "byProviderStatus": [
    { "status": "completed", "count": 87 },
    { "status": "no-answer", "count": 34 }
  ]
}`}
                statusCodes={['200 OK']}
              />

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 text-sm text-amber-200">
                <p className="mb-1 font-semibold">Twilio Webhook Callbacks (public routes)</p>
                <p className="text-amber-300/70">
                  <code className="font-mono">POST /api/ai-calling/webhooks/twilio/voice</code> and{' '}
                  <code className="font-mono">POST /api/ai-calling/webhooks/twilio/recording</code> are publicly
                  accessible but validated against the Twilio HMAC-SHA1 signature using{' '}
                  <code className="font-mono">TWILIO_AUTH_TOKEN</code>. All requests from unknown origins are accepted
                  but flagged with <code className="font-mono">&quot;signatureValid&quot;: false</code>.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <p className="mb-3 text-sm font-semibold text-slate-300">Event Types (Audit Log)</p>
              <div className="overflow-hidden rounded-2xl border border-white/10 text-sm">
                {[
                  ['ai.voice_agent.created', 'Voice agent persona created'],
                  ['ai.call.created', 'Call record created and script generated'],
                  ['ai.call.dispatched', 'Call dispatched to Twilio'],
                  ['ai.call.provider.status', 'Twilio status callback received'],
                  ['ai.call.turn.customer', 'Customer speech stored'],
                  ['ai.call.turn.agent', 'AI agent reply stored'],
                  ['ai.call.appointment.booked', 'Appointment booked from call'],
                  ['ai.call.recording.available', 'Recording URL received from Twilio'],
                  ['ai.call.recording.transcribed', 'Whisper transcription completed'],
                ].map(([event, desc]) => (
                  <div key={event} className="flex gap-4 border-b border-white/5 px-4 py-2.5 last:border-0">
                    <code className="shrink-0 font-mono text-xs text-slate-300">{event}</code>
                    <span className="text-xs text-slate-500">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* --- Other modules note --- */}
          <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-slate-400">
            <p className="mb-1 font-semibold text-slate-200">Modules 1–4 and platform docs</p>
            <p>
              Full endpoint reference for Lead Engine, SEO Engine, CRM Engine, and Marketing Automation
              is available in{' '}
              <Link href="/API_DOCUMENTATION.md" className="text-sky-400 hover:underline" target="_blank">
                API_DOCUMENTATION.md
              </Link>
              . This page will be expanded as modules are added.
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function SectionTitle({ badge, children }: { badge?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      {badge && (
        <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-300">
          {badge}
        </span>
      )}
      <h2 className="text-xl font-semibold text-white">{children}</h2>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30 px-5 py-4 font-mono text-xs text-slate-300">
      {code}
    </pre>
  );
}

function EndpointBlock({
  method,
  path,
  description,
  request,
  response,
  statusCodes,
}: {
  method: string;
  path: string;
  description: string;
  request?: string;
  response?: string;
  statusCodes: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <span className={`rounded px-2 py-1 text-xs font-mono font-semibold ${METHOD_COLORS[method]}`}>
          {method}
        </span>
        <code className="text-sm text-slate-200">{path}</code>
      </div>
      <div className="px-4 py-4 space-y-4">
        <p className="text-sm text-slate-400">{description}</p>
        {request && (
          <div>
            <p className="mb-2 text-xs text-slate-500 uppercase tracking-widest">Request Body</p>
            <CodeBlock code={request} />
          </div>
        )}
        {response && (
          <div>
            <p className="mb-2 text-xs text-slate-500 uppercase tracking-widest">Response</p>
            <CodeBlock code={response} />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {statusCodes.map((s) => (
            <span key={s} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
