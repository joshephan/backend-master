const started = Date.now();
fetch('http://localhost:4100/approve', { method: 'POST' })
  .then(r => console.log('응답', r.status))
  .catch(e => console.log(`실패 ${Math.round((Date.now() - started) / 1000)}초 뒤:`, e.cause?.code ?? e.message));
