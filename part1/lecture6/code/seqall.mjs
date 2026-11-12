const getSeat = (id) => new Promise(r => setTimeout(() => r({ id }), 20));
const ids = Array.from({ length: 50 }, (_, i) => i);

let t = performance.now();
for (const id of ids) await getSeat(id);
console.log(`for...of 안에서 await, 50번: ${(performance.now() - t).toFixed(0)}ms`);

t = performance.now();
await Promise.all(ids.map(getSeat));
console.log(`Promise.all, 50번: ${(performance.now() - t).toFixed(0)}ms`);
