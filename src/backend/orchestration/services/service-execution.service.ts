import { Injectable } from '@nestjs/common';

@Injectable()
export class ServiceExecutionService {
  async execute(task: string, message: string, organizationId: string) {
    if (task === 'billing_lookup') {
      return { task, status: 'ok', summary: 'Billing support context prepared', organizationId };
    }
    if (task === 'support_ticket') {
      return { task, status: 'queued', ticketRef: `SUP-${Date.now()}` };
    }
    if (task === 'video_generation') {
      return { task, status: 'accepted', pipeline: 'video' };
    }
    if (task === 'image_generation') {
      return { task, status: 'accepted', pipeline: 'image' };
    }
    if (task === 'audio_generation') {
      return { task, status: 'accepted', pipeline: 'audio' };
    }
    return { task, status: 'ok', echo: message.slice(0, 500) };
  }
}
