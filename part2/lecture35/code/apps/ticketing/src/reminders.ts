import { NestFactory } from '@nestjs/core';
import { readFile } from 'node:fs/promises';
import { NotificationsModule } from './notifications/notifications.module.js';
import { NotificationsService } from './notifications/notifications.service.js';

process.loadEnvFile();

const app = await NestFactory.createApplicationContext(NotificationsModule);
const notifications = app.get(NotificationsService);
const list = JSON.parse(await readFile(process.argv[2], 'utf8'));
for (const r of list) notifications.sendReminder(r.buyer, r.seatId, r.startsAt);
console.log(`안내 문자 ${list.length}건 접수`);
await app.close();
