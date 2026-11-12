# 19강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node.js | v24.11.0 | `node -v` | 2026-10-26 |
| NestJS 패키지 | @nestjs/common·core 12.2.0 | `npm ls` | 2026-10-26 |
| 처리량 측정 조건 | 동시 100개, 3만 요청, 측정 전 3천 요청으로 데우기, 생성 로그 제거한 빌드 | bench.mjs | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| NestJS 패키지 | npm ls | 2026-10-26 |
| 공식 문서 문장 | docs.nestjs.com/fundamentals/injection-scopes | 2026-10-26 |
| 처리량 측정 | 실습 PC, Node v24.11.0, bench.mjs(실습 자료) 동시 100개 3만 요청, 측정 전 3천 요청으로 데우기, 생성 로그 제거한 빌드 | 2026-10-26 |

## 참고 자료

- NestJS 공식 문서, Injection scopes: https://docs.nestjs.com/fundamentals/injection-scopes
- NestJS 공식 문서, Providers: https://docs.nestjs.com/providers
- Node.js 문서, Event loop, timers, and process.nextTick(): https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick
