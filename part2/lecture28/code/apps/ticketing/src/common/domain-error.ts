// 업무 규칙 실패 예외, HTTP를 모름
export type DomainErrorKind = 'not-found' | 'conflict' | 'rejected';

export abstract class DomainError extends Error {
  abstract readonly kind: DomainErrorKind;
  abstract readonly code: string;

  constructor(message: string, readonly details: Record<string, unknown> = {}) {
    super(message);
    this.name = new.target.name;
  }
}
