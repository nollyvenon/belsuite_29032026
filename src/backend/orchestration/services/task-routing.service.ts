import { Injectable } from '@nestjs/common';

@Injectable()
export class OrchestrationTaskRoutingService {
  route(intent: string) {
    switch (intent) {
      case 'billing.inquiry':
        return 'billing_lookup';
      case 'support.request':
        return 'support_ticket';
      case 'video.request':
        return 'video_generation';
      case 'image.request':
        return 'image_generation';
      case 'audio.request':
        return 'audio_generation';
      default:
        return 'general_assistant';
    }
  }
}
