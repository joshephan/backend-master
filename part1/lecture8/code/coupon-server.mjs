import http from 'node:http';

const table = new Map([['WELCOME-5000', { used: false }]]);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const db = {
  async find(code) { await sleep(10); return { ...table.get(code) }; },
  async markUsed(code) { await sleep(10); table.get(code).used = true; },
};

let seats = 1000;
const seatDb = {
  async read() { await sleep(10); return seats; },
  async write(v) { await sleep(10); seats = v; },
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/coupons/use') {
    const code = url.searchParams.get('code');
    const coupon = await db.find(code);
    if (coupon.used) return res.end('이미 사용한 쿠폰\n');
    await db.markUsed(code);
    return res.end('5,000원 할인 적용\n');
  }
  if (url.pathname === '/seats/sell') {
    const left = await seatDb.read();
    await seatDb.write(left - 1);
    return res.end('ok\n');
  }
  if (url.pathname === '/seats') return res.end(`${seats}\n`);
  res.statusCode = 404; res.end();
}).listen(4008, () => console.log('listening 4008 pid', process.pid));
