import { Mutex, Semaphore } from './sync.mjs';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
{
  const global = new Mutex();
  const perKey = new Map();
  const lockFor = (k) => perKey.get(k) ?? perKey.set(k, new Mutex()).get(k);
  async function work(m) { await m.lock(); try { await sleep(20); } finally { m.unlock(); } }
  let t = performance.now();
  await Promise.all(Array.from({ length: 50 }, () => work(global)));
  console.log(`서로 다른 쿠폰 50개, 락 하나: ${(performance.now() - t).toFixed(0)}ms`);
  t = performance.now();
  await Promise.all(Array.from({ length: 50 }, (_, i) => work(lockFor(`coupon-${i}`))));
  console.log(`서로 다른 쿠폰 50개, 쿠폰마다 락: ${(performance.now() - t).toFixed(0)}ms`);
}
{
  const s = new Semaphore(5);
  let now = 0, peak = 0;
  async function callPg() {
    await s.acquire();
    try { now++; peak = Math.max(peak, now); await sleep(100); now--; } finally { s.release(); }
  }
  const t = performance.now();
  await Promise.all(Array.from({ length: 50 }, callPg));
  console.log(`결제 50건, 세마포어 5: 최대 동시 호출 ${peak}, 전체 ${(performance.now() - t).toFixed(0)}ms`);
}
