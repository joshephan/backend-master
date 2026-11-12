import {
  Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown, OnModuleInit,
} from '@nestjs/common';

interface Sms {
  from: string;
  to: string;
  text: string;
}

@Injectable()
export class SmsOutbox implements OnModuleInit, OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(SmsOutbox.name);
  private readonly baseUrl = process.env.SMS_URL ?? 'http://localhost:5029/sms';
  private readonly queue: Sms[] = [];
  private from: string;
  private timer: NodeJS.Timeout;

  async onModuleInit() {
    const res = await fetch(`${this.baseUrl}/sender`);
    ({ from: this.from } = await res.json());
    this.logger.log(`발신번호 ${this.from}`);
  }

  onApplicationBootstrap() {
    this.timer = setInterval(() => this.flush(), 10_000);
  }

  async onApplicationShutdown(signal?: string) {
    clearInterval(this.timer);
    await this.flush();
    this.logger.log(`onApplicationShutdown(${signal}): 남은 문자 보냄`);
  }

  enqueue(to: string, text: string) {
    this.queue.push({ from: this.from, to, text });
  }

  async flush() {
    if (this.queue.length === 0) return;
    const batch = this.queue.splice(0);
    try {
      const res = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        body: JSON.stringify(batch),
      });
      this.logger.log(`문자 ${batch.length}건 보냄: ${res.status}`);
    } catch (err) {
      this.queue.unshift(...batch);
      this.logger.error(`문자 ${batch.length}건 못 보냄: ${(err as Error).message}`);
    }
  }
}
