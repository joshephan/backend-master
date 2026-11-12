import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class TaggedLogger {
  static created = 0;
  private tag = '';

  constructor() {
    console.log(`TaggedLogger #${++TaggedLogger.created} 생성`);
  }

  setTag(tag: string) {
    this.tag = tag;
  }

  log(message: string) {
    console.log(`[${this.tag}] ${message}`);
  }
}
