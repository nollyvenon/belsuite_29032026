/**
 * Email Service Usage Example & Initialization
 * Demonstrates how to set up and use the email system
 */

import { EmailServiceOrchestrator } from './email-service-orchestrator';
import { EmailTemplateService } from './email-template.service';
import { EmailProvider } from './email-provider.service';
import { EmailQueueService } from './email-queue.service';
import { EmailAnalyticsService } from './email-analytics.service';
import { SendgridProvider } from './providers/sendgrid-provider';
import { ResendProvider } from './providers/resend-provider';
import { EmailCategory, EmailRequest } from '../types/email.types';

/**
 * Initialize the email service
 * Run this once during application startup
 */
export async function initializeEmailService(prisma: any): Promise<EmailServiceOrchestrator> {
  // Initialize services
  const templateService = new EmailTemplateService(prisma);
  const queueService = new EmailQueueService(prisma);
  const analyticsService = new EmailAnalyticsService(prisma);
  const subscriptionService = new SubscriptionService(prisma); // From your app

  // Create orchestrator with configuration
  const orchestrator = new EmailServiceOrchestrator(
    templateService,
    queueService,
    analyticsService,
    subscriptionService,
    {
      primaryProvider: 'sendgrid',
      fallbackProviders: ['resend'],
      maxRetries: 3,
      retryDelay: 5000,
      enableAggregation: true,
      aggregationWindow: 60000, // 1 minute
      rateLimit: 100,
      dailyCap: 10000,
      trackingEnabled: true,
      trackingPixelUrl: `${process.env.APP_URL}/api/email/track`,
    },
  );

  // Register providers
  const sendgridProvider = new SendgridProvider({
    apiKey: process.env.SENDGRID_API_KEY as string,
    fromEmail: process.env.EMAIL_FROM as string,
    fromName: 'Belsuite Team',
  });

  const resendProvider = new ResendProvider({
    apiKey: process.env.RESEND_API_KEY as string,
    fromEmail: process.env.EMAIL_FROM as string,
  });

  orchestrator.registerProvider('sendgrid', sendgridProvider);
  orchestrator.registerProvider('resend', resendProvider);

  // Load default templates into database
  await templateService.seedDefaults();

  console.log('Email service initialized successfully');
  return orchestrator;
}

/**
 * Example: Send welcome email
 */
export async function sendWelcomeEmailExample(
  orchestrator: EmailServiceOrchestrator,
  userId: string,
  userEmail: string,
  organizationId: string,
) {
  const request: EmailRequest = {
    to: userEmail,
    templateName: 'welcome',
    category: EmailCategory.AUTH,
    organizationId,
    userId,
    variables: {
      firstName: 'John',
      organizationName: 'Acme Corp',
      dashboardUrl: `${process.env.APP_URL}/dashboard`,
    },
    tags: ['onboarding', 'welcome'],
    priority: 'high',
  };

  const result = await orchestrator.send(request);
  console.log('Welcome email sent:', result);
  return result;
}

/**
 * Example: Send payment notification
 */
export async function sendPaymentEmailExample(
  orchestrator: EmailServiceOrchestrator,
  userId: string,
  userEmail: string,
  organizationId: string,
) {
  const request: EmailRequest = {
    to: userEmail,
    templateName: 'payment_received',
    category: EmailCategory.PAYMENT,
    organizationId,
    userId,
    variables: {
      firstName: 'John',
      amount: '99.99',
      currency: 'USD',
      invoiceUrl: `${process.env.APP_URL}/invoices/inv_12345`,
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toDateString(),
    },
    tags: ['payment', 'billing'],
    priority: 'high',
    metadata: {
      invoiceId: 'inv_12345',
      amount: 99.99,
    },
  };

  const result = await orchestrator.send(request);
  console.log('Payment email sent:', result);
  return result;
}

/**
 * Example: Send batch notifications
 */
export async function sendBatchNotificationsExample(
  orchestrator: EmailServiceOrchestrator,
  recipients: Array<{ email: string; userId: string; organizationId: string; contentTitle: string }>,
) {
  const requests: EmailRequest[] = recipients.map((recipient) => ({
    to: recipient.email,
    templateName: 'content_published',
    category: EmailCategory.NOTIFICATION,
    organizationId: recipient.organizationId,
    userId: recipient.userId,
    variables: {
      firstName: 'User',
      contentTitle: recipient.contentTitle,
      contentUrl: `${process.env.APP_URL}/content/123`,
      viewCount: '42',
    },
    tags: ['notification', 'content'],
    priority: 'normal',
  }));

  const results = await orchestrator.sendBatch(requests);
  console.log(`Batch sent ${results.filter((r) => r.success).length}/${requests.length} emails`);
  return results;
}

/**
 * Example: Send with custom inline template
 */
export async function sendCustomEmailExample(
  orchestrator: EmailServiceOrchestrator,
  userEmail: string,
  organizationId: string,
) {
  const request: EmailRequest = {
    to: userEmail,
    organizationId,
    inlineTemplate: {
      name: 'custom_announcement',
      subject: 'Important Update from {{companyName}}',
      category: EmailCategory.NOTIFICATION,
      variables: ['companyName', 'message', 'actionUrl'],
      htmlTemplate: `
        <h1>{{companyName}} Announcement</h1>
        <p>{{message}}</p>
        <a href="{{actionUrl}}">Learn More</a>
      `,
      textTemplate: 'From {{companyName}}: {{message}}\n\n{{actionUrl}}',
    },
    variables: {
      companyName: 'Belsuite',
      message: 'We are launching a new feature next week!',
      actionUrl: `${process.env.APP_URL}/features/new`,
    },
    tags: ['announcement'],
    priority: 'normal',
  };

  const result = await orchestrator.send(request);
  console.log('Custom email sent:', result);
  return result;
}

/**
 * Example: Get aggregation recommendations
 */
export async function getAggregationRecommendationsExample(
  orchestrator: EmailServiceOrchestrator,
  userEmail: string,
) {
  const recommendations = await orchestrator.getAggregationRecommendations(userEmail);
  console.log('Recommended categories to aggregate:', recommendations);
  return recommendations;
}

/**
 * Example: Send aggregated digest
 */
export async function sendAggregatedDigestExample(
  orchestrator: EmailServiceOrchestrator,
  userEmail: string,
  organizationId: string,
) {
  // This would gather pending emails for this user in the aggregation queue
  // and send them as a digest

  const request: EmailRequest = {
    to: userEmail,
    organizationId,
    inlineTemplate: {
      name: 'daily_digest',
      subject: 'Your Daily Digest - {{count}} Updates',
      category: EmailCategory.NOTIFICATION,
      variables: ['count', 'items', 'digestUrl'],
      htmlTemplate: `
        <h1>Your Daily Digest</h1>
        <p>You have {{count}} updates:</p>
        <ul>{{items}}</ul>
        <a href="{{digestUrl}}">View Full Details</a>
      `,
      textTemplate: 'Daily Digest: {{count}} updates\n\n{{items}}\n\n{{digestUrl}}',
    },
    variables: {
      count: '5',
      items: '• New comment on your post\n• Payment received\n• New feature available',
      digestUrl: `${process.env.APP_URL}/digest`,
    },
    tags: ['digest', 'aggregated'],
    priority: 'normal',
  };

  const result = await orchestrator.send(request);
  console.log('Digest email sent:', result);
  return result;
}

/**
 * Example: Error handling with fallback
 */
export async function sendWithErrorHandlingExample(
  orchestrator: EmailServiceOrchestrator,
  userEmail: string,
  organizationId: string,
) {
  try {
    const request: EmailRequest = {
      to: userEmail,
      templateName: 'welcome',
      category: EmailCategory.AUTH,
      organizationId,
      variables: {
        firstName: 'John',
        organizationName: 'Acme Corp',
        dashboardUrl: `${process.env.APP_URL}/dashboard`,
      },
    };

    const result = await orchestrator.send(request);

    if (!result.success) {
      console.error('Email failed to send:', result.error);
      // Could trigger retry, alert, or fallback notification
    } else {
      console.log('Email sent successfully via:', result.provider);
    }

    return result;
  } catch (error) {
    console.error('Email sending error:', error);
    // Email will be added to retry queue automatically
    // You could also send an SMS or in-app notification as fallback
  }
}

// Export for use in your API routes
export { EmailServiceOrchestrator, EmailTemplateService, EmailQueueService, EmailAnalyticsService };
