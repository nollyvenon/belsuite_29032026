/**
 * Event Bus Service - Central event orchestration
 * Implements publish-subscribe pattern for cross-module communication
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DomainEvent, IEventHandler } from './event.types';

@Injectable()
export class EventBus implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventBus.name);

  /**
   * Map of event type → handlers
   * Multiple handlers can subscribe to same event
   */
  private handlers: Map<string, Set<IEventHandler>> = new Map();

  /**
   * Event history for debugging & replay
   * Stored in memory (consider persisting to Redis/DB in production)
   */
  private eventHistory: DomainEvent[] = [];

  /**
   * Maximum events to keep in history
   */
  private readonly maxHistorySize = 1000;

  /**
   * Flag to track if service is healthy
   */
  private isHealthy = true;

  onModuleInit(): void {
    this.logger.debug('EventBus initialized');
  }

  onModuleDestroy(): void {
    this.handlers.clear();
    this.eventHistory = [];
    this.logger.debug('EventBus destroyed');
  }

  /**
   * Publish a domain event to all subscribers
   * @param event The domain event to publish
   * @throws Error if event bus is unhealthy
   */
  async publish<T extends DomainEvent>(event: T): Promise<void> {
    if (!this.isHealthy) {
      this.logger.error('EventBus is unhealthy, rejecting publish');
      throw new Error('EventBus is currently unavailable');
    }

    try {
      // Log the event
      this.logger.debug(
        `Publishing event: ${event.type} (id: ${event.id}, tenant: ${event.tenantId})`,
      );

      // Store in history for debugging
      this.addToHistory(event);

      // Get handlers for this event type
      const eventHandlers = this.handlers.get(event.type) || new Set();

      if (eventHandlers.size === 0) {
        this.logger.warn(`No handlers registered for event: ${event.type}`);
        return;
      }

      // Execute all handlers in parallel (but track all completions)
      const handlerPromises = Array.from(eventHandlers).map((handler) =>
        this.executeHandler(handler, event),
      );

      const results = await Promise.allSettled(handlerPromises);

      // Log any handler failures
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          this.logger.error(
            `Handler #${index} failed for event ${event.type}: ${result.reason?.message || 'Unknown error'}`,
          );
        }
      });

      this.logger.debug(
        `Event ${event.type} published to ${eventHandlers.size} handlers`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish event ${event.type}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Subscribe to domain events
   * @param eventName The event type to listen for
   * @param handler The handler function
   */
  subscribe<T extends DomainEvent>(
    eventName: string,
    handler: IEventHandler<T>,
  ): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    this.handlers.get(eventName)!.add(handler);
    this.logger.debug(`Handler registered for event: ${eventName}`);
  }

  /**
   * Unsubscribe from domain events
   * @param eventName The event type to stop listening for
   * @param handler The handler to remove
   */
  unsubscribe<T extends DomainEvent>(
    eventName: string,
    handler: IEventHandler<T>,
  ): void {
    const eventHandlers = this.handlers.get(eventName);
    if (eventHandlers) {
      eventHandlers.delete(handler);
      this.logger.debug(`Handler unregistered for event: ${eventName}`);
    }
  }

  /**
   * Execute a single handler with error handling & timing
   */
  private async executeHandler(
    handler: IEventHandler,
    event: DomainEvent,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      await handler.handle(event);
      const duration = Date.now() - startTime;

      if (duration > 1000) {
        this.logger.warn(
          `Handler took ${duration}ms for event ${event.type} (possible performance issue)`,
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Handler failed after ${duration}ms: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Add event to history with size management
   */
  private addToHistory(event: DomainEvent): void {
    this.eventHistory.push(event);

    // Remove oldest events if history is too large
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get event history for debugging
   * @param limit Maximum number of events to return
   */
  getEventHistory(limit: number = 100): DomainEvent[] {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: string, limit: number = 100): DomainEvent[] {
    return this.eventHistory
      .filter((e) => e.type === eventType)
      .slice(-limit);
  }

  /**
   * Get events by tenant
   */
  getEventsByTenant(tenantId: string, limit: number = 100): DomainEvent[] {
    return this.eventHistory
      .filter((e) => e.tenantId === tenantId)
      .slice(-limit);
  }

  /**
   * Get events by correlation ID (for distributed tracing)
   */
  getEventsByCorrelationId(correlationId: string): DomainEvent[] {
    return this.eventHistory.filter((e) => e.correlationId === correlationId);
  }

  /**
   * Clear event history (use with caution)
   */
  clearHistory(): void {
    this.eventHistory = [];
    this.logger.warn('Event history cleared');
  }

  /**
   * Get handler count for an event
   */
  getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.size ?? 0;
  }

  /**
   * Get all registered event types
   */
  getAllEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Health check
   */
  isReady(): boolean {
    return this.isHealthy;
  }

  /**
   * Mark bus as unhealthy (e.g., for graceful shutdown)
   */
  markUnhealthy(): void {
    this.isHealthy = false;
    this.logger.warn('EventBus marked as unhealthy');
  }

  /**
   * Mark bus as healthy (e.g., after recovery)
   */
  markHealthy(): void {
    this.isHealthy = true;
    this.logger.debug('EventBus marked as healthy');
  }
}
