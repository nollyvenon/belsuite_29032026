import { Injectable } from '@nestjs/common';
import { GoogleAuthService } from './google-auth.service';
import { GoogleCalendarEvent } from '../../types/integration.types';

const BASE = 'https://www.googleapis.com/calendar/v3';

@Injectable()
export class GoogleCalendarService {
  constructor(private readonly gauth: GoogleAuthService) {}

  async listEvents(
    organizationId: string,
    options?: {
      calendarId?: string;
      timeMin?: Date;
      timeMax?: Date;
      maxResults?: number;
      query?: string;
    },
  ): Promise<GoogleCalendarEvent[]> {
    const calId = options?.calendarId ?? 'primary';
    const params = new URLSearchParams({
      maxResults: String(options?.maxResults ?? 25),
      singleEvents: 'true',
      orderBy: 'startTime',
      ...(options?.timeMin ? { timeMin: options.timeMin.toISOString() } : {}),
      ...(options?.timeMax ? { timeMax: options.timeMax.toISOString() } : {}),
      ...(options?.query   ? { q: options.query } : {}),
    });

    const data = await this.gauth.apiFetch(
      organizationId,
      `${BASE}/calendars/${encodeURIComponent(calId)}/events?${params}`,
    );

    return (data.items ?? []).map(this.parseEvent);
  }

  async createEvent(
    organizationId: string,
    event:          GoogleCalendarEvent,
    calendarId = 'primary',
  ): Promise<GoogleCalendarEvent> {
    const body: any = {
      summary:     event.summary,
      description: event.description,
      location:    event.location,
      start: event.allDay
        ? { date:     event.startTime.toISOString().slice(0, 10) }
        : { dateTime: event.startTime.toISOString(), timeZone: 'UTC' },
      end: event.allDay
        ? { date:     (event.endTime ?? event.startTime).toISOString().slice(0, 10) }
        : { dateTime: (event.endTime ?? event.startTime).toISOString(), timeZone: 'UTC' },
      attendees:   event.attendees?.map(email => ({ email })),
      recurrence:  event.recurrence,
      conferenceData: event.meetLink
        ? undefined
        : { createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } } },
      reminders: event.reminders?.length
        ? { useDefault: false, overrides: event.reminders.map(r => ({ method: r.method, minutes: r.minutesBefore })) }
        : { useDefault: true },
    };

    const params = event.meetLink ? '' : '?conferenceDataVersion=1';
    const data = await this.gauth.apiFetch(
      organizationId,
      `${BASE}/calendars/${encodeURIComponent(calendarId)}/events${params}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    );

    return this.parseEvent(data);
  }

  async updateEvent(
    organizationId: string,
    eventId:        string,
    updates:        Partial<GoogleCalendarEvent>,
    calendarId = 'primary',
  ): Promise<GoogleCalendarEvent> {
    const existing = await this.gauth.apiFetch(
      organizationId,
      `${BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    );

    const merged = { ...existing, ...this.toGoogleEvent(updates) };
    const data = await this.gauth.apiFetch(
      organizationId,
      `${BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(merged) },
    );

    return this.parseEvent(data);
  }

  async deleteEvent(organizationId: string, eventId: string, calendarId = 'primary'): Promise<void> {
    await this.gauth.apiFetch(
      organizationId,
      `${BASE}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      { method: 'DELETE' },
    );
  }

  async listCalendars(organizationId: string) {
    const data = await this.gauth.apiFetch(organizationId, `${BASE}/users/me/calendarList`);
    return data.items ?? [];
  }

  private parseEvent(data: any): GoogleCalendarEvent {
    return {
      id:          data.id,
      summary:     data.summary ?? '',
      description: data.description,
      startTime:   new Date(data.start?.dateTime ?? data.start?.date),
      endTime:     new Date(data.end?.dateTime   ?? data.end?.date),
      allDay:      !!data.start?.date,
      location:    data.location,
      attendees:   (data.attendees ?? []).map((a: any) => a.email),
      meetLink:    data.conferenceData?.entryPoints?.[0]?.uri,
    };
  }

  private toGoogleEvent(event: Partial<GoogleCalendarEvent>): any {
    const out: any = {};
    if (event.summary)     out.summary     = event.summary;
    if (event.description) out.description = event.description;
    if (event.location)    out.location    = event.location;
    if (event.startTime)   out.start = { dateTime: event.startTime.toISOString() };
    if (event.endTime)     out.end   = { dateTime: event.endTime.toISOString() };
    return out;
  }
}
