import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { NotificationsService } from './notifications.service.js';
import { SmsSender } from './sms.sender.js';
import { EmailSender } from './email.sender.js';
import { PushSender } from './push.sender.js';

@Module({
  imports: [DiscoveryModule],
  providers: [NotificationsService, SmsSender, EmailSender, PushSender],
  exports: [NotificationsService],
})
export class NotificationsModule {}
