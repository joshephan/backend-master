# 26강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| rxjs | 7.8.x (package.json ^7.8.1) | package.json | 2026-10-26 |
| NestJS | @nestjs/common·core 12.2.0 | npm ls | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| rxjs | package.json | 2026-10-26 |
| NestJS | npm ls | 2026-10-26 |
| Timing·HTTP 로그 시간 | 실습 환경 실측 | 2026-10-26 |
| 타임아웃 시연 | 실습 환경 실측, FAKE_PG_DELAY_MS=5000 | 2026-10-26 |

## 참고 자료

- NestJS 공식 문서, Interceptors: https://docs.nestjs.com/interceptors
- NestJS 공식 문서, Request lifecycle: https://docs.nestjs.com/faq/request-lifecycle
- RxJS 공식 문서, Operators: https://rxjs.dev/guide/operators
- RxJS API, timeout: https://rxjs.dev/api/operators/timeout
- Node.js 공식 문서, Performance measurement APIs(`performance.now()`): https://nodejs.org/api/perf_hooks.html
