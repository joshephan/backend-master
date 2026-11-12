import { Injectable } from '@nestjs/common';
import { NotificationChannel, type ChannelSender } from './notification-channel.js';
import { SmsOutbox } from './sms-outbox.js';

@Injectable()
@NotificationChannel('sms')
export class SmsSender implements ChannelSender {
  constructor(private readonly outbox: SmsOutbox) {}

  send(to: string, text: string) {
    this.outbox.enqueue(to, text);
    return `[문자 → ${to}] ${text}`;
  }
}
