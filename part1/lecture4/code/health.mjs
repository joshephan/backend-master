const t0 = performance.now();
const report = fetch('http://localhost:4004/report').then(r => r.text()).then(() =>
  console.log(`/report  done at ${(performance.now() - t0).toFixed(0)}ms`));
await new Promise(r => setTimeout(r, 100));
const h0 = performance.now();
await fetch('http://localhost:4004/health').then(r => r.text());
console.log(`/health  sent at ${(h0 - t0).toFixed(0)}ms, took ${(performance.now() - h0).toFixed(0)}ms`);
await report;
