import { Worker, isMainThread, workerData } from 'node:worker_threads';

if (isMainThread) {
  for (const mode of ['counter[0]++', 'Atomics.add']) {
    const shared = new SharedArrayBuffer(4);
    const counter = new Int32Array(shared);
    await Promise.all(Array.from({ length: 4 }, () => new Promise(r =>
      new Worker(new URL(import.meta.url), { workerData: { shared, mode } }).once('exit', r))));
    console.log(`워커 4개 x 1,000만 번 ${mode}: ${counter[0].toLocaleString()} (기대값 40,000,000)`);
  }
} else {
  const counter = new Int32Array(workerData.shared);
  for (let i = 0; i < 10_000_000; i++) {
    if (workerData.mode === 'Atomics.add') Atomics.add(counter, 0, 1);
    else counter[0]++;
  }
}
