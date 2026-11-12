# 33강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node.js | v24.11.0 | node -v | 2026-10-26 |
| 테스트 패키지 | @nestjs/testing 12.2.0, vitest 4.1.12 | npm ls | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| 테스트 패키지 | 실습 프로젝트 npm ls | 2026-10-26 |
| TRANSIENT get() 에러 문구 | @nestjs/core 12.2.0 실측 | 2026-10-26 |
| 테스트 모듈 실행 시간 | 실습 환경 실측, Node v24.11.0 | 2026-10-26 |
| 전체 실행 | 실습 환경 실측 | 2026-10-26 |
| 오버라이드 API | docs.nestjs.com/fundamentals/testing | 2026-10-26 |

## 참고 자료

- NestJS 공식 문서, Testing(Testing utilities, overrideProvider, overrideModule): https://docs.nestjs.com/fundamentals/testing
- NestJS 공식 문서, Injection scopes: https://docs.nestjs.com/fundamentals/injection-scopes
- NestJS 공식 문서, Lifecycle events: https://docs.nestjs.com/fundamentals/lifecycle-events
- Vitest 문서, Vi API: https://vitest.dev/api/vi
- TypeScript 문서, tsconfig 레퍼런스: https://www.typescriptlang.org/tsconfig
