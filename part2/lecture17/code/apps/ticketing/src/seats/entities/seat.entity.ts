export type SeatStatus = 'AVAILABLE' | 'HELD' | 'SOLD';

export class Seat {
  id: string;
  performanceId: number;
  zone: string;
  row: number;
  no: number;
  status: SeatStatus;
}
