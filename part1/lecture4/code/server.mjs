import http from 'node:http';

function busy(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {}
}

const server = http.createServer((req, res) => {
  if (req.url === '/wait') {
    setTimeout(() => res.end('wait done\n'), 1000);
  } else if (req.url === '/block') {
    busy(1000);
    res.end('block done\n');
  } else if (req.url === '/health') {
    res.end('ok\n');
  } else if (req.url === '/report') {
    busy(2000);
    res.end('report done\n');
  } else {
    res.statusCode = 404;
    res.end();
  }
});
server.listen(4004, () => console.log('listening on 4004, pid', process.pid));
