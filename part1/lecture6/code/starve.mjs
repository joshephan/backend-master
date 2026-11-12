const t0 = performance.now();
setTimeout(() => console.log(`setTimeout 0 실행: ${(performance.now() - t0).toFixed(0)}ms`), 0);
let n = 0;
function loop() {
  if (++n < 5_000_000) return Promise.resolve().then(loop);
  console.log(`마이크로태스크 ${n}개 끝: ${(performance.now() - t0).toFixed(0)}ms`);
}
loop();
