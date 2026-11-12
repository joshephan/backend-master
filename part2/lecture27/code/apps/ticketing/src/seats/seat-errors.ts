import { DomainError } from '../common/domain-error.js';

export class SeatNotFoundError extends DomainError {
  readonly kind = 'not-found';
  readonly code = 'seat-not-found';
}

export class SeatUnavailableError extends DomainError {
  readonly kind = 'conflict';
  readonly code = 'seat-unavailable';
}
