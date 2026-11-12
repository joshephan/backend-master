const db = [];
const save = (seat) => new Promise(r => setTimeout(() => { db.push(seat); r(); }, 50));

async function reserveSeats(seats) {
  seats.forEach(async (seat) => { await save(seat); });
  return `저장 완료, DB에 ${db.length}건`;
}
console.log(await reserveSeats(['A-3-15', 'A-3-16', 'A-3-17']));
await new Promise(r => setTimeout(r, 100));
console.log(`100ms 뒤 DB에 ${db.length}건`);
