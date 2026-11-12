const path = process.argv[2];
const n = Number(process.argv[3] ?? 10);
const t0 = performance.now();
await Promise.all(
  Array.from({ length: n }, async (_, i) => {
    const r = await fetch(`http://localhost:4004${path}`);
    await r.text();
    console.log(`#${i + 1} done ${(performance.now() - t0).toFixed(0)}ms`);
  }),
);
console.log(`${n} requests to ${path}: ${(performance.now() - t0).toFixed(0)}ms`);
