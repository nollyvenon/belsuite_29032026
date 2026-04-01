/**
 * Core Event System Types
 * Event-driven architecture for cross-module communication
 */

export interface DomainEvent {
  /**
   * Unique event ID for tracking & replay
   */
  id: string;

  /**
   * Event type identifier
   */
  type: string;

  /**
   * Organization/Tenant ID (for multi-tenant isolation)
   */
  tenantId: string;

  /**
   * User who triggered the event
   */
  userId?: string;

  /**
   * Event payload (event-specific data)
   */
  data: Record<string, any>;

  /**
   * Timestamp when event occurred
   */
  timestamp: Date;

  /**
   * Request correlation ID (for distributed tracing)
   */
  correlationId: string;

  /**
   * Event version (for schema evolution)
   */
  version: number;

  /**
   * Metadata about the event
   */
  metadata: {
    environment: string;
    service: string;
    region?: string;
    userId?: string;
    ip?: string;
  };
}

/**
 * Async event handler interface
 */
export interface IEventHandler<T extends DomainEvent = DomainEvent> {
  handle(event: T): Promise<void>;
}

/**
 * Event bus interface for publishing/subscribing
 */
export interface IEventBus {
  publish<T extends DomainEvent>(event: T): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventName: string,
    handler: IEventHandler<T>,
  ): void;
  unsubscribe<T extends DomainEvent>(
    eventName: string,
    handler: IEventHandler<T>,
  ): void;
}

/**
 * Specific event types for each domain
 */

// Auth Events
export class UserCreatedEvent implements DomainEvent {
  id: string;
  type = 'user.created';
  tenantId: string;
  userId: string;
  data: {
    userId: string;
    email: string;
    organizationId: string;
    role: string;
  };
  timestamp: Date;
  correlationId: string;
  version = 1;
  metadata: {
    environment: string;
    service: string;
  };

  constructor(
    tenantId: string,
    userId: string,
    email: string,
    organizationId: string,
    role: string,
    correlationId: string,
  ) {
    this.id = `user-${userId}-${Date.now()}`;
    this.tenantId = tenantId;
    this.userId = userId;
    this.data = { userId, email, organizationId, role };
    this.timestamp = new Date();
    this.correlationId = correlationId;
    this.metadata = {
      environment: process.env['NODE_ENV'] || 'development',
      service: 'auth',
    };
  }
}

export class UserAuthenticatedEvent implements DomainEvent {
  id: string;
  type = 'user.authenticated';
  tenantId: string;
  userId: string;
  data: {
    userId: string;
    method: 'jwt' | 'oauth' | 'credentials';
    provider?: string;
  };
  timestamp: Date;
  correlationId: string;
  version = 1;
  metadata: {
    environment: string;
    service: string;
  };

  constructor(
    tenantId: string,
    userId: string,
    method: 'jwt' | 'oauth' | 'credentials',
    provider: string | undefined,
    correlationId: string,
  ) {
    this.id = `auth-${userId}-${Date.now()}`;
    this.tenantId = tenantId;
    this.userId = userId;
    this.data = { userId, method, provider };
    this.timestamp = new Date();
    this.correlationId = correlationId;
    this.metadata = {
      environment: process.env['NODE_ENV'] || 'development',
      service: 'auth',
    };
  }
}

// Organization Events
export class OrganizationCreatedEvent implements DomainEvent {
  id: string;
  type = 'organization.created';
  tenantId: string;
  userId: string;
  data: {
    organizationId: string;
    name: string;
    createdBy: string;
  };
  timestamp: Date;
  correlationId: string;
  version = 1;
  metadata: {
    environment: string;
    service: string;
  };

  constructor(
    tenantId: string,
    organizationId: string,
    name: string,
    createdBy: string,
    correlationId: string,
  ) {
    this.id = `org-${organizationId}-${Date.now()}`;
    this.tenantId = tenantId;
    this.userId = createdBy;
    this.data = { organizationId, name, createdBy };
    this.timestamp = new Date();
    this.correlationId = correlationId;
    this.metadata = {
      environment: process.env['NODE_ENV'] || 'development',
      service: 'organizations',
    };
  }
}

// Subscription Events
export class SubscriptionCreatedEvent implements DomainEvent {
  id: string;
  type = 'subscription.created';
  tenantId: string;
  data: {
    subscriptionId: string;
    organizationId: string;
    tier: string;
    status: string;
  };
  timestamp: Date;
  correlationId: string;
  version = 1;
  metadata: {
    environment: string;
    service: string;
  };

  constructor(
    tenantId: string,
    subscriptionId: string,
    organizationId: string,
    tier: string,
    status: string,
    correlationId: string,
  ) {
    this.id = `sub-${subscriptionId}-${Date.now()}`;
    this.tenantId = tenantId;
    this.data = { subscriptionId, organizationId, tier, status };
    this.timestamp = new Date();
    this.correlationId = correlationId;
    this.metadata = {
      environment: process.env['NODE_ENV'] || 'development',
      service: 'subscriptions',
    };
  }
}

export class SubscriptionUpgradedEvent implements DomainEvent {
  id: string;
  type = 'subscription.upgraded';
  tenantId: string;
  data: {
    subscriptionId: string;
    organizationId: string;
    fromTier: string;
    toTier: string;
  };
  timestamp: Date;
  correlationId: string;
  version = 1;
  metadata: {
    environment: string;
    service: string;
  };

  constructor(
    tenantId: string,
    subscriptionId: string,
    organizationId: string,
    fromTier: string,
    toTier: string,
    correlationId: string,
  ) {
    this.id = `upgrade-${subscriptionId}-${Date.now()}`;
    this.tenantId = tenantId;
    this.data = { subscriptionId, organizationId, fromTier, toTier };
    this.timestamp = new Date();
    this.correlationId = correlationId;
    this.metadata = {
      environment: process.env['NODE_ENV'] || 'development',
      service: 'subscriptions',
    };
  }
}

// Content Events
export class ContentPublishedEvent implements DomainEvent {
  id: string;
  type = 'content.published';
  tenantId: string;
  userId: string;
  data: {
    contentId: string;
    organizationId: string;
    contentType: string;
    channels: string[];
  };
  timestamp: Date;
  correlationId: string;
  version = 1;
  metadata: {
    environment: string;
    service: string;
  };

  constructor(
    tenantId: string,
    userId: string,
    contentId: string,
    organizationId: string,
    contentType: string,
    channels: string[],
    correlationId: string,
  ) {
    this.id = `pub-${contentId}-${Date.now()}`;
    this.tenantId = tenantId;
    this.userId = userId;
    this.data = { contentId, organizationId, contentType, channels };
    this.timestamp = new Date();
    this.correlationId = correlationId;
    this.metadata = {
      environment: process.env['NODE_ENV'] || 'development',
      service: 'content',
    };
  }
}

// Analytics Events
export class AnalyticsEventEmittedEvent implements DomainEvent {
  id: string;
  type = 'analytics.event-emitted';
  tenantId: string;
  userId?: string;
  data: {
    eventName: string;
    organizationId: string;
    properties: Record<string, any>;
  };
  timestamp: Date;
  correlationId: string;
  version = 1;
  metadata: {
    environment: string;
    service: string;
  };

  constructor(
    tenantId: string,
    eventName: string,
    organizationId: string,
    properties: Record<string, any>,
    correlationId: string,
    userId?: string,
  ) {
    this.id = `evt-${eventName}-${Date.now()}`;
    this.tenantId = tenantId;
    this.userId = userId;
    this.data = { eventName, organizationId, properties };
    this.timestamp = new Date();
    this.correlationId = correlationId;
    this.metadata = {
      environment: process.env['NODE_ENV'] || 'development',
      service: 'analytics',
    };
  }
}

// Payment Events
export class PaymentProcessedEvent implements DomainEvent {
  id: string;
  type = 'payment.processed';
  tenantId: string;
  data: {
    paymentId: string;
    organizationId: string;
    amount: number;
    currency: string;
    status: 'succeeded' | 'failed' | 'pending';
  };
  timestamp: Date;
  correlationId: string;
  version = 1;
  metadata: {
    environment: string;
    service: string;
  };

  constructor(
    tenantId: string,
    paymentId: string,
    organizationId: string,
    amount: number,
    currency: string,
    status: 'succeeded' | 'failed' | 'pending',
    correlationId: string,
  ) {
    this.id = `pay-${paymentId}-${Date.now()}`;
    this.tenantId = tenantId;
    this.data = { paymentId, organizationId, amount, currency, status };
    this.timestamp = new Date();
    this.correlationId = correlationId;
    this.metadata = {
      environment: process.env['NODE_ENV'] || 'development',
      service: 'billing',
    };
  }
}

// Video Events
export class VideoUploadedEvent implements DomainEvent {
  id: string;
  type = 'video.uploaded';
  tenantId: string;
  userId: string;
  data: {
    videoId: string;
    organizationId: string;
    fileName: string;
    size: number;
    duration?: number;
  };
  timestamp: Date;
  correlationId: string;
  version = 1;
  metadata: {
    environment: string;
    service: string;
  };

  constructor(
    tenantId: string,
    userId: string,
    videoId: string,
    organizationId: string,
    fileName: string,
    size: number,
    correlationId: string,
    duration?: number,
  ) {
    this.id = `vid-${videoId}-${Date.now()}`;
    this.tenantId = tenantId;
    this.userId = userId;
    this.data = { videoId, organizationId, fileName, size, duration };
    this.timestamp = new Date();
    this.correlationId = correlationId;
    this.metadata = {
      environment: process.env['NODE_ENV'] || 'development',
      service: 'video',
    };
  }
}

export class VideoProcessedEvent implements DomainEvent {
  id: string;
  type = 'video.processed';
  tenantId: string;
  data: {
    videoId: string;
    organizationId: string;
    duration: number;
    resolutions: string[];
    thumbnailUrl: string;
  };
  timestamp: Date;
  correlationId: string;
  version = 1;
  metadata: {
    environment: string;
    service: string;
  };

  constructor(
    tenantId: string,
    videoId: string,
    organizationId: string,
    duration: number,
    resolutions: string[],
    thumbnailUrl: string,
    correlationId: string,
  ) {
    this.id = `vidproc-${videoId}-${Date.now()}`;
    this.tenantId = tenantId;
    this.data = { videoId, organizationId, duration, resolutions, thumbnailUrl };
    this.timestamp = new Date();
    this.correlationId = correlationId;
    this.metadata = {
      environment: process.env['NODE_ENV'] || 'development',
      service: 'video',
    };
  }
}
