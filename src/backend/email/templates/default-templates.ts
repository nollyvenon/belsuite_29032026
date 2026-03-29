/**
 * Default Email Templates for Belsuite
 * System templates that are pre-loaded
 */

import { EmailCategory } from '../types/email.types';

export const DEFAULT_EMAIL_TEMPLATES = {
  welcome: {
    name: 'welcome',
    subject: 'Welcome to Belsuite! 🎉',
    category: EmailCategory.AUTH,
    variables: ['firstName', 'organizationName', 'dashboardUrl'],
    htmlTemplate: `
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Welcome to Belsuite, {{firstName}}! 🎉</h1>
      <p>We're thrilled to have you on board. Your organization <strong>{{organizationName}}</strong> is ready to go.</p>
      
      <p><a href="{{dashboardUrl}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Get Started</a></p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p>Questions? Check out our <a href="https://docs.belsuite.com">documentation</a> or reply to this email.</p>
      <p>Best regards,<br>The Belsuite Team</p>
    </div>
  </body>
</html>
    `,
    textTemplate: `Welcome to Belsuite, {{firstName}}!\n\nWe're thrilled to have you on board. Your organization {{organizationName}} is ready to go.\n\nGet started here: {{dashboardUrl}}\n\nBest regards,\nThe Belsuite Team`,
  },

  paymentReceived: {
    name: 'payment_received',
    subject: 'Payment Received ✓ - {{amount}} {{currency}}',
    category: EmailCategory.PAYMENT,
    variables: ['firstName', 'amount', 'currency', 'invoiceUrl', 'nextBillingDate'],
    htmlTemplate: `
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Payment Received ✓</h1>
      <p>Hi {{firstName}},</p>
      <p>We've successfully received your payment of <strong>{{amount}} {{currency}}</strong>.</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Payment Details:</strong></p>
        <p>Amount: {{amount}} {{currency}}</p>
        <p>Next billing date: {{nextBillingDate}}</p>
      </div>
      
      <p><a href="{{invoiceUrl}}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Invoice</a></p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p>Thank you for your business!<br>The Belsuite Team</p>
    </div>
  </body>
</html>
    `,
    textTemplate: `Payment Received ✓\n\nHi {{firstName}},\n\nWe've successfully received your payment of {{amount}} {{currency}}.\n\nNext billing date: {{nextBillingDate}}\n\nView invoice: {{invoiceUrl}}\n\nThank you for your business!\nThe Belsuite Team`,
  },

  paymentFailed: {
    name: 'payment_failed',
    subject: 'Payment Failed - Action Required',
    category: EmailCategory.PAYMENT,
    variables: ['firstName', 'reason', 'retryUrl', 'supportEmail'],
    htmlTemplate: `
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #dc3545;">Payment Failed ⚠️</h1>
      <p>Hi {{firstName}},</p>
      <p>We had trouble processing your payment:</p>
      <p><strong>{{reason}}</strong></p>
      
      <p><a href="{{retryUrl}}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Retry Payment</a></p>
      
      <p>If you continue to experience issues, please <a href="mailto:{{supportEmail}}">contact our support team</a>.</p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p>Best regards,<br>The Belsuite Team</p>
    </div>
  </body>
</html>
    `,
    textTemplate: `Payment Failed ⚠️\n\nHi {{firstName}},\n\nWe had trouble processing your payment:\n{{reason}}\n\nRetry payment: {{retryUrl}}\n\nContact support: {{supportEmail}}\n\nBest regards,\nThe Belsuite Team`,
  },

  subscriptionCreated: {
    name: 'subscription_created',
    subject: 'Subscription Activated - {{planName}}',
    category: EmailCategory.NOTIFICATION,
    variables: ['firstName', 'planName', 'price', 'currency', 'billingCycle', 'dashboardUrl'],
    htmlTemplate: `
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Subscription Activated 🎊</h1>
      <p>Hi {{firstName}},</p>
      <p>Your {{planName}} subscription is now active!</p>
      
      <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
        <p><strong>Plan Details:</strong></p>
        <p>Plan: {{planName}}</p>
        <p>Price: {{price}} {{currency}} / {{billingCycle}}</p>
      </div>
      
      <p><a href="{{dashboardUrl}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to Dashboard</a></p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p>Thank you for upgrading!<br>The Belsuite Team</p>
    </div>
  </body>
</html>
    `,
    textTemplate: `Subscription Activated 🎊\n\nHi {{firstName}},\n\nYour {{planName}} subscription is now active!\n\nPlan: {{planName}}\nPrice: {{price}} {{currency}} / {{billingCycle}}\n\nGo to Dashboard: {{dashboardUrl}}\n\nThank you for upgrading!\nThe Belsuite Team`,
  },

  subscriptionCancelled: {
    name: 'subscription_cancelled',
    subject: 'Subscription Cancelled',
    category: EmailCategory.NOTIFICATION,
    variables: ['firstName', 'planName', 'cancellationDate', 'contactUrl'],
    htmlTemplate: `
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Subscription Cancelled</h1>
      <p>Hi {{firstName}},</p>
      <p>Your {{planName}} subscription has been cancelled.</p>
      
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <p>Cancellation Date: {{cancellationDate}}</p>
        <p>You'll retain access until the end of your billing period.</p>
      </div>
      
      <p>We'd love to hear why you left. <a href="{{contactUrl}}">Please share your feedback</a>.</p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p>Best regards,<br>The Belsuite Team</p>
    </div>
  </body>
</html>
    `,
    textTemplate: `Subscription Cancelled\n\nHi {{firstName}},\n\nYour {{planName}} subscription has been cancelled.\n\nCancellation Date: {{cancellationDate}}\nYou'll retain access until the end of your billing period.\n\nShare feedback: {{contactUrl}}\n\nBest regards,\nThe Belsuite Team`,
  },

  contentPublished: {
    name: 'content_published',
    subject: 'Your Content Was Published ✓',
    category: EmailCategory.NOTIFICATION,
    variables: ['firstName', 'contentTitle', 'contentUrl', 'viewCount'],
    htmlTemplate: `
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Content Published ✓</h1>
      <p>Hi {{firstName}},</p>
      <p>Your content "<strong>{{contentTitle}}</strong>" has been published!</p>
      
      <p><a href="{{contentUrl}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Content</a></p>
      
      <p>Views so far: <strong>{{viewCount}}</strong></p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p>Keep creating great content!<br>The Belsuite Team</p>
    </div>
  </body>
</html>
    `,
    textTemplate: `Content Published ✓\n\nHi {{firstName}},\n\nYour content "{{contentTitle}}" has been published!\n\nView content: {{contentUrl}}\n\nViews so far: {{viewCount}}\n\nKeep creating great content!\nThe Belsuite Team`,
  },

  invitationReceived: {
    name: 'invitation_received',
    subject: 'You\'ve Been Invited to {{organizationName}}',
    category: EmailCategory.NOTIFICATION,
    variables: ['invitedName', 'organizationName', 'invitedByName', 'acceptUrl', 'expiresIn'],
    htmlTemplate: `
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>You've Been Invited!</h1>
      <p>Hi {{invitedName}},</p>
      <p><strong>{{invitedByName}}</strong> has invited you to join <strong>{{organizationName}}</strong> on Belsuite.</p>
      
      <p><a href="{{acceptUrl}}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a></p>
      
      <p style="font-size: 14px; color: #666;">This invitation expires in {{expiresIn}}.</p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p>Best regards,<br>The Belsuite Team</p>
    </div>
  </body>
</html>
    `,
    textTemplate: `You've Been Invited!\n\nHi {{invitedName}},\n\n{{invitedByName}} has invited you to join {{organizationName}} on Belsuite.\n\nAccept invitation: {{acceptUrl}}\n\nThis invitation expires in {{expiresIn}}.\n\nBest regards,\nThe Belsuite Team`,
  },

  passwordReset: {
    name: 'password_reset',
    subject: 'Reset Your Password',
    category: EmailCategory.AUTH,
    variables: ['firstName', 'resetUrl', 'expiresIn'],
    htmlTemplate: `
<html>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Reset Your Password</h1>
      <p>Hi {{firstName}},</p>
      <p>We received a request to reset your password. Click the link below to create a new password:</p>
      
      <p><a href="{{resetUrl}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
      
      <p style="font-size: 14px; color: #666;">This link expires in {{expiresIn}}. If you didn't request this, you can ignore this email.</p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p>Best regards,<br>The Belsuite Team</p>
    </div>
  </body>
</html>
    `,
    textTemplate: `Reset Your Password\n\nHi {{firstName}},\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n{{resetUrl}}\n\nThis link expires in {{expiresIn}}. If you didn't request this, you can ignore this email.\n\nBest regards,\nThe Belsuite Team`,
  },
};

/**
 * Get template by name
 */
export function getDefaultTemplate(name: string) {
  return DEFAULT_EMAIL_TEMPLATES[name as keyof typeof DEFAULT_EMAIL_TEMPLATES];
}

/**
 * Get all default templates
 */
export function getAllDefaultTemplates() {
  return Object.values(DEFAULT_EMAIL_TEMPLATES);
}
