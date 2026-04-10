import { Injectable } from '@nestjs/common';

@Injectable()
export class IntentRecognitionService {
  recognize(message: string) {
    const text = message.toLowerCase();
    if (text.includes('price') || text.includes('cost') || text.includes('billing')) return 'billing.inquiry';
    if (text.includes('help') || text.includes('support')) return 'support.request';
    if (text.includes('video')) return 'video.request';
    if (text.includes('image') || text.includes('design')) return 'image.request';
    if (text.includes('call') || text.includes('audio') || text.includes('voice')) return 'audio.request';
    return 'general.chat';
  }
}
