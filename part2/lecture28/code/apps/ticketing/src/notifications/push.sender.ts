import { Injectable } from '@nestjs/common';
import { NotificationChannel, type ChannelSender } from './notification-channel.js';

@Injectable()
@NotificationChannel('push')
export class PushSender implements ChannelSender {
  send(to: string, text: string) {
    return `[앱 푸시 → ${to}] ${text}`;
  }
}
