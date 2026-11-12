# 22강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| 운영체제 | Windows | | 2026-10-26 |
| Node.js | v24.11.0 | `node -v` | 2026-10-26 |
| NestJS 패키지 | @nestjs/common·core·platform-express 12.2.0 | `npm ls` | 2026-10-26 |
| Express | 5.3.0 | node_modules/express/package.json | 2026-10-26 |
| 빌더 | rspack 2.2.9 | nest-cli.json | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| NestJS 패키지 | npm ls | 2026-10-26 |
| Express | node_modules/express/package.json | 2026-10-26 |
| 공식 문서 Overview 목차 | docs.nestjs.com | 2026-10-26 |
| 실행 환경 | 실습 PC | 2026-10-26 |

## 참고 자료

- NestJS 공식 문서, Request lifecycle: https://docs.nestjs.com/faq/request-lifecycle
- NestJS 공식 문서, Middleware: https://docs.nestjs.com/middleware
- NestJS 공식 문서, Guards: https://docs.nestjs.com/guards
- NestJS 공식 문서, Interceptors: https://docs.nestjs.com/interceptors
- NestJS 공식 문서, Pipes: https://docs.nestjs.com/pipes
- NestJS 공식 문서, Exception filters: https://docs.nestjs.com/exception-filters
- RFC 9457, Problem Details for HTTP APIs: https://www.rfc-editor.org/rfc/rfc9457
