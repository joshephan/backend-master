import http from 'node:http';
import { Mutex } from './sync.mjs';

const PORT = Number(process.argv[2]);
const DB = 'http://localhost:4008/db';      // 데이터는 4008 프로세스 한 곳에만
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const table = new Map([['WELCOME-5000', { used: false }]]);
async function dbHandle(url, res) {
  await sleep(10);
  const c = table.get(url.searchParams.get('code'));
  if (url.pathname === '/db/find') return res.end(JSON.stringify(c));
  if (url.pathname === '/db/mark') { c.used = true; return res.end('{}'); }
  if (url.pathname === '/db/use-if-unused') {
    if (c.used) return res.end('{"changed":0}');
    c.used = true; return res.end('{"changed":1}');
  }
  if (url.pathname === '/db/reset') { c.used = false; return res.end('{}'); }
}

const mutex = new Mutex();
const call = (p, code) => fetch(`${DB}/${p}?code=${code}`).then(r => r.json());

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname.startsWith('/db/')) return dbHandle(url, res);
  const code = url.searchParams.get('code');
  if (url.pathname === '/coupons/use') {
    await mutex.lock();
    try {
      const c = await call('find', code);
      if (c.used) return res.end(`[${PORT}] 이미 사용한 쿠폰\n`);
      await call('mark', code);
      return res.end(`[${PORT}] 5,000원 할인 적용\n`);
    } finally { mutex.unlock(); }
  }
  if (url.pathname === '/coupons/use-atomic') {
    const { changed } = await call('use-if-unused', code);
    return res.end(changed ? `[${PORT}] 5,000원 할인 적용\n` : `[${PORT}] 이미 사용한 쿠폰\n`);
  }
}).listen(PORT, () => console.log('listening', PORT, 'pid', process.pid));
