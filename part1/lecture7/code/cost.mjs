import { Worker } from 'node:worker_threads';
const url = new URL('./echo-worker.mjs', import.meta.url);
const mb = () => (process.memoryUsage().rss / 1024 / 1024).toFixed(0);
const times = [];
for (let i = 0; i < 10; i++) {
  const t = performance.now();
  const w = new Worker(url);
  await new Promise(r => { w.once('message', r); w.postMessage('ping'); });
  times.push(performance.now() - t);
  await w.terminate();
}
times.sort((a, b) => a - b);
console.log(`워커 생성부터 첫 답까지: 중앙값 ${times[5].toFixed(1)}ms`);
console.log(`워커 0개: RSS ${mb()}MB`);
const ws = [];
for (const n of [10, 50]) {
  while (ws.length < n) {
    const w = new Worker(url);
    await new Promise(r => { w.once('message', r); w.postMessage('ping'); });
    ws.push(w);
  }
  console.log(`워커 ${n}개: RSS ${mb()}MB`);
}
await Promise.all(ws.map(w => w.terminate()));
const w = new Worker(url);
await new Promise(r => { w.once('message', r); w.postMessage('ping'); });
for (const mode of ['복사', '이전(transfer)']) {
  const buf = new ArrayBuffer(100 * 1024 * 1024);
  const t = performance.now();
  await new Promise(r => { w.once('message', r); mode === '복사' ? w.postMessage(buf) : w.postMessage(buf, [buf]); });
  console.log(`100MB ${mode}: ${(performance.now() - t).toFixed(1)}ms, 보낸 뒤 메인 쪽 byteLength ${buf.byteLength}`);
}
await w.terminate();
