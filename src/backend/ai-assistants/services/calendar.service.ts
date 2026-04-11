/**
 * CalendarService — AI-powered scheduling & campaign timelines
 *
 * Handles:
 *   - Event creation with AI-suggested timing
 *   - Smart reminders
 *   - Campaign timeline generation
 *   - Conflict detection & rescheduling
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventBus } from '../../common/events/event.bus';
import { PrismaService }              from '../../database/prisma.service';
import { AIGatewayService }           from '../../ai-gateway/ai-gateway.service';
import { GatewayTask }                from '../../ai-gateway/types/gateway.types';
import type { ConversationMessage } from '../../ai-gateway/types/gateway.types';
import { ConversationMemoryService }  from '../memory/conversation-memory.service';
import { TaskExecutionEngine }        from '../engine/task-execution.engine';
import {
  ChatRequest, ChatResponse,
  EventSpec, CampaignTimeline, SubmittedTask,
} from '../types/assistant.types';

const CALENDAR_SYSTEM = `You are a scheduling and calendar AI for BelSuite.
You help marketing teams plan campaigns, content schedules, and deadlines.
You understand optimal posting times, campaign pacing, and deadline management.
When creating timelines, always work backwards from deadlines and include buffer time.
Be proactive about surfacing conflicts and suggesting alternatives.`;

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private readonly prisma:   PrismaService,
    private readonly gateway:  AIGatewayService,
    private readonly memory:   ConversationMemoryService,
    private readonly tasks:    TaskExecutionEngine,
    private readonly eventBus: EventBus,
  ) {}

  // ── Chat ───────────────────────────────────────────────────────────────

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const { organizationId, userId, message } = req;
    const conversationId = await this.memory.getOrCreateConversation(
      organizationId, 'CALENDAR', req.conversationId, userId,
    );
    await this.memory.addMessage(conversationId, 'user', message);
    const history = await this.memory.getHistory(conversationId);

    const upcomingEvents = await this.getUpcoming(organizationId, 14);
    const calendarContext = upcomingEvents.length
      ? `\n[Upcoming events]: ${upcomingEvents.slice(0, 5).map(e => `${e.title} on ${new Date(e.startAt).toDateString()}`).join(', ')}`
      : '';

    const conversationHistory: ConversationMessage[] = history
      .filter((m) => m.role === 'user' || m.role === 'assistant' || m.role === 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }));

    const response = await this.gateway.generate({
      organizationId, userId,
      task:    GatewayTask.BUSINESS_INSIGHTS,
      feature: 'calendar_chat',
      prompt:  message,
      systemPrompt: CALENDAR_SYSTEM + calendarContext,
      maxTokens: 1000,
      routing: { strategy: 'balanced' },
      conversationHistory,
    });

    const messageId = await this.memory.addMessage(
      conversationId, 'assistant', response.text,
      { model: response.model, costUsd: response.costUsd },
    );

    return {
      conversationId, messageId,
      reply: response.text, model: response.model,
      tokensUsed: response.tokens.total, costUsd: response.costUsd,
    };
  }

  // ── Events ─────────────────────────────────────────────────────────────

  async createEvent(organizationId: string, spec: EventSpec): Promise<any> {
    return this.prisma.aICalendarEvent.create({
      data: {
        organizationId,
        title:       spec.title,
        description: spec.description ?? null,
        eventType:   spec.eventType,
        startAt:     spec.startAt,
        endAt:       spec.endAt ?? null,
        allDay:      spec.allDay ?? false,
        timezone:    spec.timezone ?? 'UTC',
        reminders:   (spec.reminders as any) ?? null,
        recurrence:  (spec.recurrence as any) ?? null,
        campaignId:  spec.campaignId ?? null,
        isAIGenerated: true,
      },
    });
  }

  async updateEvent(
    organizationId: string,
    eventId: string,
    updates: Partial<EventSpec>,
  ): Promise<any> {
    const event = await this.prisma.aICalendarEvent.findFirst({
      where: { id: eventId, organizationId },
    });
    if (!event) throw new NotFoundException(`Event ${eventId} not found`);

    return this.prisma.aICalendarEvent.update({
      where: { id: eventId },
      data: updates as any,
    });
  }

  async deleteEvent(organizationId: string, eventId: string): Promise<void> {
    await this.prisma.aICalendarEvent.deleteMany({
      where: { id: eventId, organizationId },
    });
  }

  // ── Reminders ──────────────────────────────────────────────────────────

  async scheduleReminder(
    organizationId: string,
    userId: string | undefined,
    eventId: string,
    reminders: Array<{ minutesBefore: number; method: 'email' | 'push' | 'sms' }>,
  ): Promise<SubmittedTask[]> {
    const event = await this.prisma.aICalendarEvent.findFirst({
      where: { id: eventId, organizationId },
    });
    if (!event) throw new NotFoundException(`Event ${eventId} not found`);

    // Update event with reminders
    await this.prisma.aICalendarEvent.update({
      where: { id: eventId },
      data:  { reminders: reminders as any },
    });

    // Queue each reminder as a scheduled task
    const tasks: SubmittedTask[] = [];
    for (const reminder of reminders) {
      const fireAt = new Date(event.startAt.getTime() - reminder.minutesBefore * 60 * 1000);
      if (fireAt <= new Date()) continue; // skip past reminders

      const t = await this.tasks.submit({
        organizationId, userId,
        assistantType: 'CALENDAR',
        taskType:      'SEND_REMINDER',
        data:          { eventId, method: reminder.method, minutesBefore: reminder.minutesBefore },
      }, { scheduledAt: fireAt, priority: 2 });
      tasks.push(t);
    }

    return tasks;
  }

  // ── Campaign timeline ──────────────────────────────────────────────────

  async planCampaignTimeline(
    organizationId: string,
    userId: string | undefined,
    campaignId: string,
    campaignDetails: {
      name:       string;
      goal:       string;
      startDate:  Date;
      endDate:    Date;
      channels:   string[];
      budget?:    number;
    },
  ): Promise<CampaignTimeline> {
    const prompt = `Create a detailed campaign timeline with all key events and milestones.

Campaign: ${campaignDetails.name}
Goal: ${campaignDetails.goal}
Duration: ${campaignDetails.startDate.toDateString()} → ${campaignDetails.endDate.toDateString()}
Channels: ${campaignDetails.channels.join(', ')}
${campaignDetails.budget ? `Budget: $${campaignDetails.budget}` : ''}

Generate a complete campaign calendar. Return a JSON object (no markdown fences):
{
  "campaignId": "${campaignId}",
  "events": [{
    "title": string,
    "description": string,
    "eventType": "CAMPAIGN"|"CONTENT"|"MEETING"|"REMINDER"|"DEADLINE"|"REVIEW",
    "startAt": "ISO date string",
    "endAt": "ISO date string"|null,
    "allDay": boolean
  }],
  "milestones": [{ "name": string, "date": "ISO date", "description": string }]
}

Include: kickoff, content creation windows, review dates, launch day, daily posts, mid-campaign review, wrap-up.`;

    const raw = await this.gateway.generateText(
      organizationId,
      GatewayTask.BUSINESS_INSIGHTS,
      'calendar_campaign',
      prompt,
      { maxTokens: 3000, routing: { strategy: 'balanced' } },
    );

    const timeline = this.parseJSON<CampaignTimeline>(raw, {
      campaignId,
      events: [],
      milestones: [],
    });

    // Persist all events
    for (const event of timeline.events) {
      await this.createEvent(organizationId, {
        ...event,
        startAt:    new Date(event.startAt as any),
        endAt:      event.endAt ? new Date(event.endAt as any) : undefined,
        campaignId,
      });
    }

    return timeline;
  }

  // ── Calendar queries ───────────────────────────────────────────────────

  async getUpcoming(organizationId: string, days = 7): Promise<any[]> {
    const from = new Date();
    const to   = new Date(from.getTime() + days * 24 * 60 * 60 * 1000);

    return this.prisma.aICalendarEvent.findMany({
      where: {
        organizationId,
        startAt: { gte: from, lte: to },
      },
      orderBy: { startAt: 'asc' },
    });
  }

  async getByDateRange(organizationId: string, from: Date, to: Date): Promise<any[]> {
    return this.prisma.aICalendarEvent.findMany({
      where: {
        organizationId,
        startAt: { gte: from, lte: to },
      },
      orderBy: { startAt: 'asc' },
    });
  }

  async getCampaignEvents(organizationId: string, campaignId: string): Promise<any[]> {
    return this.prisma.aICalendarEvent.findMany({
      where:   { organizationId, campaignId },
      orderBy: { startAt: 'asc' },
    });
  }

  // ── AI conflict resolution ─────────────────────────────────────────────

  async detectAndResolveConflicts(
    organizationId: string,
    from:  Date,
    to:    Date,
  ): Promise<{ conflicts: any[]; suggestions: string[] }> {
    const events = await this.getByDateRange(organizationId, from, to);
    if (events.length < 2) return { conflicts: [], suggestions: [] };

    // Find same-day events on same channel
    const dayMap = new Map<string, any[]>();
    for (const e of events) {
      const key = `${e.startAt.toISOString().slice(0, 10)}_${e.eventType}`;
      if (!dayMap.has(key)) dayMap.set(key, []);
      dayMap.get(key)!.push(e);
    }

    const conflicts = [...dayMap.values()].filter(group => group.length > 2);

    if (conflicts.length === 0) return { conflicts: [], suggestions: [] };

    const conflictSummary = conflicts.flat()
      .map(e => `${e.title} (${new Date(e.startAt).toDateString()})`)
      .join(', ');

    const suggestions = await this.gateway.generateText(
      organizationId,
      GatewayTask.BUSINESS_INSIGHTS,
      'calendar_conflicts',
      `These events are scheduled too close together: ${conflictSummary}\n\nSuggest how to spread them out optimally in 3-5 bullet points.`,
      { maxTokens: 400, routing: { strategy: 'fastest' } },
    );

    return {
      conflicts: conflicts.flat(),
      suggestions: suggestions.split('\n').filter(Boolean),
    };
  }

  private parseJSON<T>(raw: string, fallback: T): T {
    try {
      return JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()) as T;
    } catch {
      this.logger.warn('Failed to parse Calendar JSON response');
      return fallback;
    }
  }
}
