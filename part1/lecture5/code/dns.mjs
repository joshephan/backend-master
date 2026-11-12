import { pbkdf2 } from 'node:crypto';
import { lookup } from 'node:dns';
import { readFile } from 'node:fs';

const hashes = Number(process.argv[2] ?? 0);
for (let i = 0; i < hashes; i++)
  pbkdf2('password', 'salt', 2_000_000, 32, 'sha256', () => {});

const t0 = performance.now();
lookup('localhost', () => console.log(`dns.lookup: ${(performance.now() - t0).toFixed(0)}ms`));
readFile(import.meta.filename, () => console.log(`readFile: ${(performance.now() - t0).toFixed(0)}ms`));
