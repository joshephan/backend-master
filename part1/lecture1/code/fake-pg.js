// 요청은 받지만 끝내 답하지 않는 가짜 결제사
const http = require('node:http');
http.createServer((req, res) => {
  console.log(new Date().toISOString(), req.method, req.url, '받음, 답하지 않음');
}).listen(4000, () => console.log('fake payment on 4000'));
