import { Injectable } from '@nestjs/common';
import { NotificationChannel, type ChannelSender } from './notification-channel.js';

@Injectable()
@NotificationChannel('email')
export class EmailSender implements ChannelSender {
  send(to: string, text: string) {
    return `[메일 → ${to}] ${text}`;
  }
}
