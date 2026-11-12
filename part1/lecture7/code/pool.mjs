import { Worker } from 'node:worker_threads';

export class WorkerPool {
  #idle = [];
  #waiting = [];   // 빈 워커를 기다리는 작업
  constructor(file, size) {
    for (let i = 0; i < size; i++) this.#idle.push(new Worker(file));
  }
  run(data) {
    return new Promise((resolve, reject) => {
      this.#waiting.push({ data, resolve, reject });
      this.#next();
    });
  }
  #next() {
    if (!this.#idle.length || !this.#waiting.length) return;
    const w = this.#idle.pop();
    const job = this.#waiting.shift();
    w.once('message', (r) => { this.#idle.push(w); job.resolve(r); this.#next(); });
    w.postMessage(job.data);
  }
}
