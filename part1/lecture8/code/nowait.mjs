const coupons = new Map([['WELCOME-5000', { used: false }]]);
async function useCoupon(code) {
  await new Promise(r => setTimeout(r, 10));   // 요청 검증 같은 앞 작업
  const c = coupons.get(code);
  if (c.used) return '이미 사용한 쿠폰';
  c.used = true;                                // 확인 바로 다음 줄에서 기록
  return '5,000원 할인 적용';
}
console.log(await Promise.all([useCoupon('WELCOME-5000'), useCoupon('WELCOME-5000')]));
