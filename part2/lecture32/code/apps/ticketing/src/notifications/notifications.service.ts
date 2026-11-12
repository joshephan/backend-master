import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { NotificationChannel, type ChannelSender } from './notification-channel.js';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly channels = new Map<string, ChannelSender>();

  constructor(private readonly discovery: DiscoveryService) {}

  onModuleInit() {
    const wrappers = this.discovery.getProviders({ metadataKey: NotificationChannel.KEY });
    for (const wrapper of wrappers) {
      const name = this.discovery.getMetadataByDecorator(NotificationChannel, wrapper)!;
      this.channels.set(name, wrapper.instance);
    }
    console.log(`알림 채널: ${[...this.channels.keys()].join(', ')}`);
  }

  sendConfirmed(channel: string, to: string, seatId: string) {
    const sender = this.channels.get(channel);
    if (!sender) return `지원하지 않는 채널: ${channel}`;
    return sender.send(to, `${seatId} 예매가 확정되었습니다`);
  }

  sendReminder(to: string, seatId: string, startsAt: string) {
    return this.channels.get('sms')!.send(to, `내일 ${startsAt} 공연, 좌석 ${seatId}`);
  }
}
