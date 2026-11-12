import { parentPort } from 'node:worker_threads';
import { buildReport } from './report.mjs';
parentPort.on('message', (count) => parentPort.postMessage(buildReport(count)));
