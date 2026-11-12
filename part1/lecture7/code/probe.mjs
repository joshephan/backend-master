const path = process.argv[2];
const t0 = performance.now();
const rep = fetch(`http://localhost:4007${path}`).then(r => r.text()).then(() =>
  console.log(`${path} 응답: ${(performance.now() - t0).toFixed(0)}ms`));
await new Promise(r => setTimeout(r, 100));
const lat = [];
for (let i = 0; i < 5; i++) {
  const h = performance.now();
  await fetch('http://localhost:4007/health').then(r => r.text());
  lat.push((performance.now() - h).toFixed(0));
  await new Promise(r => setTimeout(r, 200));
}
console.log(`그동안 /health 다섯 번: ${lat.join(', ')}ms`);
await rep;
