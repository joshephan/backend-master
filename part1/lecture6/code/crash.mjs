const save = (seat) => new Promise((resolve, reject) => setTimeout(() =>
  seat === 'A-3-16' ? reject(new Error(`이미 팔린 좌석: ${seat}`)) : resolve(), 50));

async function reserveSeats(seats) {
  try {
    seats.forEach(async (seat) => { await save(seat); });
    return '저장 완료';
  } catch (e) {
    return `실패: ${e.message}`;
  }
}
console.log(await reserveSeats(['A-3-15', 'A-3-16', 'A-3-17']));
setInterval(() => console.log('서버는 아직 살아 있음'), 30);
