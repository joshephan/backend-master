const [path, n] = [process.argv[2], Number(process.argv[3] ?? 2)];
const out = await Promise.all(Array.from({ length: n }, () => fetch(`http://localhost:4008${path}`).then(r => r.text())));
const counts = {};
for (const o of out) counts[o.trim()] = (counts[o.trim()] ?? 0) + 1;
console.log(path, counts);
