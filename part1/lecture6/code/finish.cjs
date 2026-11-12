const t0 = Date.now();
function process(name, ms, cb) { setTimeout(() => cb(null, `${name} 완료`), ms); }
process('서류 A (300ms)', 300, (err, msg) => console.log(`${Date.now() - t0}ms ${msg}`));
process('서류 B (100ms)', 100, (err, msg) => console.log(`${Date.now() - t0}ms ${msg}`));
process('서류 C (200ms)', 200, (err, msg) => console.log(`${Date.now() - t0}ms ${msg}`));
console.log('접수 끝');
