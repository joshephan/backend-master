const http = require('node:http');
http.createServer((req, res) => {
  res.end('ok\n');
}).listen(3000, () => console.log('listening on 3000'));
