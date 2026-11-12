// 주문 API: 결제사 호출 뒤 응답 대기
const http = require('node:http');
let pending = 0;
http.createServer(async (req, res) => {
  pending++;
  const started = Date.now();
  console.log(`주문 받음, 결제 대기 중인 요청 ${pending}개`);
  const r = await fetch('http://localhost:4000/approve', { method: 'POST' });
  pending--;
  res.end(`결제 응답 ${r.status}, ${Date.now() - started}ms\n`);
}).listen(3001, () => console.log('order api on 3001'));
setInterval(() => console.log(`[${new Date().toISOString().slice(11,19)}] 결제 대기 중 ${pending}개`), 5000).unref();
