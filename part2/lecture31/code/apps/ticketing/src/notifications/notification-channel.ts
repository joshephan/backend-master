import { DiscoveryService } from '@nestjs/core';

export const NotificationChannel = DiscoveryService.createDecorator<string>();

export interface ChannelSender {
  send(to: string, text: string): string;
}
