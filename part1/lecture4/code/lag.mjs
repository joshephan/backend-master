import { monitorEventLoopDelay } from 'node:perf_hooks';

const h = monitorEventLoopDelay({ resolution: 1 });
h.enable();
function busy(ms) { const end = Date.now() + ms; while (Date.now() < end) {} }
function report(label) {
  console.log(`${label}: p50 ${(h.percentile(50) / 1e6).toFixed(1)}ms, p99 ${(h.percentile(99) / 1e6).toFixed(1)}ms, max ${(h.max / 1e6).toFixed(1)}ms`);
  h.reset();
}
await new Promise(r => setTimeout(r, 3000));
report('한가할 때');
for (let i = 0; i < 6; i++) {
  await new Promise(r => setTimeout(r, 200));
  busy(300);
}
report('300ms 동기 작업이 섞일 때');
