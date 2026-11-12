import { pbkdf2 } from 'node:crypto';

const n = Number(process.argv[2] ?? 8);
const t0 = performance.now();
let left = n;
for (let i = 1; i <= n; i++) {
  pbkdf2('password', 'salt', 2_000_000, 32, 'sha256', () => {
    console.log(`해시 #${i} 끝: ${(performance.now() - t0).toFixed(0)}ms`);
    if (--left === 0) console.log(`전체: ${(performance.now() - t0).toFixed(0)}ms`);
  });
}
