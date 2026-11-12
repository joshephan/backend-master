import { pbkdf2Sync } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

function time(label, fn) {
  const t = performance.now();
  fn();
  console.log(`${label}: ${(performance.now() - t).toFixed(0)}ms`);
}
const rows = Array.from({ length: 200_000 }, (_, i) => ({
  id: i, concertId: 7, seat: `A구역 ${i % 30}열 ${i % 40}번`, status: 'PAID', paidAt: '2026-10-26T10:00:00Z',
}));
let json;
time('JSON.stringify 20만 건', () => { json = JSON.stringify(rows); });
time('JSON.parse 20만 건', () => JSON.parse(json));
writeFileSync('big.json', json);
time('readFileSync 큰 파일', () => readFileSync('big.json'));
time('pbkdf2Sync 60만 회', () => pbkdf2Sync('password', 'salt', 600_000, 32, 'sha256'));
const re = /^(a+)+$/;
for (const n of [20, 24, 26, 28]) {
  time(`/^(a+)+$/ 'a'x${n}+'!'`, () => re.test('a'.repeat(n) + '!'));
}
