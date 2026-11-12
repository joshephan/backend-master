import http from 'node:http';
import { Worker } from 'node:worker_threads';
import { buildReport } from './report.mjs';

const COUNT = Number(process.env.COUNT ?? 20_000_000);

function inWorker(count) {
  return new Promise((resolve, reject) => {
    const w = new Worker(new URL('./report-worker.mjs', import.meta.url));
    w.once('message', (r) => { resolve(r); w.terminate(); });
    w.once('error', reject);
    w.postMessage(count);
  });
}

http.createServer(async (req, res) => {
  if (req.url === '/health') return res.end('ok\n');
  if (req.url === '/report') return res.end(JSON.stringify(buildReport(COUNT)).slice(0, 60) + '\n');
  if (req.url === '/report-worker') return res.end(JSON.stringify(await inWorker(COUNT)).slice(0, 60) + '\n');
  res.statusCode = 404; res.end();
}).listen(4007, () => console.log('listening 4007 pid', process.pid));
