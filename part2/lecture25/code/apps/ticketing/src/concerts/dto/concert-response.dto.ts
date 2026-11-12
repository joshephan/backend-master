import { Concert } from '../entities/concert.entity.js';

export class ConcertResponseDto {
  id: number;
  title: string;
  venue: string;

  static from(concert: Concert): ConcertResponseDto {
    return { id: concert.id, title: concert.title, venue: concert.venue };
  }
}
