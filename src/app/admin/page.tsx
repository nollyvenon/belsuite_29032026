'use client';

import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { AppShell } from '@/components/system/AppShell';
import { PageHeader } from '@/components/system/PageHeader';
import { SectionPanel } from '@/components/system/SectionPanel';
import { MetricCard } from '@/components/system/MetricCard';
import { EmailSettingsPanel } from '@/components/admin/EmailSettingsPanel';
import { SystemHealthPanel } from '@/components/admin/SystemHealthPanel';
import { SmsSettingsPanel } from '@/components/admin/SmsSettingsPanel';
import { CampaignChannelsPanel } from '@/components/admin/CampaignChannelsPanel';
import { IntegrationsPanel } from '@/components/admin/IntegrationsPanel';
import { WebhookSettingsPanel } from '@/components/admin/WebhookSettingsPanel';
import { RetryPolicyPanel } from '@/components/admin/RetryPolicyPanel';
import { TenantManagementPanel } from '@/components/admin/TenantManagementPanel';
import { AutopilotSchedulePanel } from '@/components/admin/AutopilotSchedulePanel';
import { useAdminPanel } from '@/hooks/useAdminPanel';
import { useAutopilotSchedules } from '@/hooks/useAutopilotSchedules';
import Link from 'next/link';

export default function AdminPage() {
  const {
    tenants,
    settings,
    providers,
    health,
    smsSettings,
    smsProviders,
    smsHealth,
    campaignChannelRoutes,
    integrations,
    integrationEvents,
    webhooks,
    retryPolicy,
    loading,
    saving,
    error,
    reload,
    saveSettings,
    saveSmsSettings,
    saveCampaignChannelRoute,
    removeCampaignChannelRoute,
    sendSlackAlert,
    triggerZapier,
    saveWebhookConfig,
    saveRetryPolicy,
    saveTenant,
  } = useAdminPanel();
  const {
    presets,
    schedules,
    liveJobs,
    loading: scheduleLoading,
    upsertSchedule,
    deleteSchedule,
  } = useAutopilotSchedules();

  return (
    <AppShell activeRoute="admin">
      <PageHeader
        eyebrow="Admin Panel"
        title="Tenant controls, provider configuration, and operating visibility from one place."
        description="The admin surface is wired to the existing multi-tenant and email configuration APIs so operations can manage organizations without leaving the frontend system."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/control-center"
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100 hover:bg-amber-300/20"
            >
              Open Control Center
            </Link>
            <button onClick={reload} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-white/10">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
        }
      />

      {loading && !settings ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Tenants" value={String(tenants.length)} detail="loaded from the multi-tenant service" accent="sky" />
            <MetricCard label="Primary email provider" value={settings?.primaryProvider ?? 'sendgrid'} detail={settings?.emailFrom ?? 'noreply@belsuite.com'} accent="amber" />
            <MetricCard label="Failover" value={settings?.enableFailover ? 'Enabled' : 'Disabled'} detail={`${settings?.fallbackProviders?.length ?? 0} fallback providers`} accent="emerald" />
            <MetricCard label="Rate policy" value={`${settings?.rateLimitPerMinute ?? 0}/min`} detail={`${settings?.rateLimitPerHour ?? 0}/hour`} accent="violet" />
            <MetricCard label="SMS provider" value={smsSettings?.provider ?? 'TWILIO'} detail={smsSettings?.enabled ? 'enabled' : 'disabled'} accent="sky" />
          </div>

          <SectionPanel title="Tenant management" subtitle="Update organization display names and subscription tiers against the tenant service.">
            <TenantManagementPanel tenants={tenants} saving={saving} onSave={saveTenant} />
          </SectionPanel>

          <SectionPanel title="Email configuration" subtitle="Primary delivery settings with failover, limits, and feature flags.">
            <EmailSettingsPanel settings={settings} providers={providers} saving={saving} onSave={saveSettings} />
          </SectionPanel>

          <SectionPanel title="Provider health" subtitle="Provider catalog and the raw backend health payload for operational review.">
            <SystemHealthPanel providers={providers} health={health} />
          </SectionPanel>

          <SectionPanel title="SMS configuration" subtitle="Manage Twilio, Vonage, and AWS SNS credentials and runtime selection from admin.">
            <SmsSettingsPanel settings={smsSettings} providers={smsProviders} saving={saving} onSave={saveSmsSettings} />
            {smsHealth && (
              <pre className="mt-4 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-slate-300">
                {JSON.stringify(smsHealth, null, 2)}
              </pre>
            )}
          </SectionPanel>

          <SectionPanel
            title="Campaign channels"
            subtitle="Set default channel + provider routing per campaign objective (awareness, engagement, conversion, retention)."
          >
            <CampaignChannelsPanel
              routes={campaignChannelRoutes}
              saving={saving}
              onSave={saveCampaignChannelRoute}
              onDelete={removeCampaignChannelRoute}
            />
          </SectionPanel>

          <SectionPanel title="Real integrations" subtitle="Send Slack alerts, trigger Zapier-style connectors, and monitor integration activity.">
            <IntegrationsPanel
              integrations={integrations}
              events={integrationEvents}
              saving={saving}
              onSendSlack={sendSlackAlert}
              onTriggerZapier={triggerZapier}
              onFireEvent={fireIntegrationEvent}
            />
          </SectionPanel>

          <SectionPanel title="Webhook routes" subtitle="Register outbound webhook targets and control delivery endpoints for triggers and alerts.">
            <WebhookSettingsPanel
              webhooks={webhooks}
              saving={saving}
              onSave={saveWebhookConfig}
            />
          </SectionPanel>

          <SectionPanel title="Retry policy" subtitle="Control automatic retry behavior for failed deliveries and listener events.">
            <RetryPolicyPanel policy={retryPolicy} saving={saving} onSave={saveRetryPolicy} />
          </SectionPanel>

          <SectionPanel
            title="AI Autopilot Schedules"
            subtitle="Configure recurring autopilot cycles per tenant. Choose from preset intervals or define a custom cron expression."
          >
            <AutopilotSchedulePanel
              presets={presets}
              schedules={schedules}
              liveJobs={liveJobs}
              saving={scheduleLoading}
              onUpsert={upsertSchedule}
              onDelete={deleteSchedule}
            />
          </SectionPanel>
        </div>
      )}
    </AppShell>
  );
}