import { readFile } from 'node:fs';

readFile(import.meta.filename, () => {
  setTimeout(() => console.log('setTimeout 0'), 0);
  setImmediate(() => console.log('setImmediate'));
});
