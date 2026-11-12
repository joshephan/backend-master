import { pbkdf2 } from 'node:crypto';
import { openSync, read } from 'node:fs';
const fd = openSync('/tmp/u3-data', 'r');
for (let i = 0; i < 4; i++) pbkdf2('password', 'salt', 2_000_000, 32, 'sha256', () => {});
const t0 = performance.now();
read(fd, Buffer.alloc(100), 0, 100, 0, () => console.log(`해시 4개 도는 중 fs.read: ${(performance.now() - t0).toFixed(0)}ms`));
