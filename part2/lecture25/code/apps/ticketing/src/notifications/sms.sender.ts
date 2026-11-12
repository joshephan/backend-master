import { Injectable } from '@nestjs/common';
import { NotificationChannel, type ChannelSender } from './notification-channel.js';

@Injectable()
@NotificationChannel('sms')
export class SmsSender implements ChannelSender {
  send(to: string, text: string) {
    return `[문자 → ${to}] ${text}`;
  }
}
