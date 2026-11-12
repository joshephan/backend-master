export function buildReport(count) {
  const zones = new Map();
  let seed = 42;
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = 0; i < count; i++) {
    const zone = 'ABCDEFGH'[Math.floor(rand() * 8)];
    const price = 50000 + Math.floor(rand() * 15) * 10000;
    const z = zones.get(zone) ?? { zone, sold: 0, amount: 0, prices: [] };
    z.sold++; z.amount += price;
    if (i % 10 === 0) z.prices.push(price);
    zones.set(zone, z);
  }
  return [...zones.values()].map(z => ({
    zone: z.zone, sold: z.sold, amount: z.amount,
    top: z.prices.sort((a, b) => b - a).slice(0, 3),
  }));
}
