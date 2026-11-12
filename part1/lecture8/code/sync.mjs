export class Mutex {
  #locked = false;
  #waiters = [];
  async lock() {
    if (!this.#locked) { this.#locked = true; return; }
    await new Promise(r => this.#waiters.push(r));   // 풀릴 때까지 대기 줄로
  }
  unlock() {
    const next = this.#waiters.shift();
    if (next) next(); else this.#locked = false;     // 다음 대기자에게 바로 넘김
  }
}

export class Semaphore {
  #free;
  #waiters = [];
  constructor(n) { this.#free = n; }
  async acquire() {
    if (this.#free > 0) { this.#free--; return; }
    await new Promise(r => this.#waiters.push(r));
  }
  release() {
    const next = this.#waiters.shift();
    if (next) next(); else this.#free++;
  }
}
