for (const p of ['use', 'use-atomic']) {
  await fetch('http://localhost:4008/db/reset?code=WELCOME-5000');
  console.log(`--- /coupons/${p}: PC는 4008번 서버, 폰은 5008번 서버`);
  const out = await Promise.all([4008, 5008].map(port =>
    fetch(`http://localhost:${port}/coupons/${p}?code=WELCOME-5000`).then(r => r.text())));
  out.forEach(o => process.stdout.write(o));
}
