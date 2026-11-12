# 34강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node.js | v24.11.0 | node -v | 2026-10-26 |
| 패키지 | pg 8.23.1, @types/pg 8.23.1, @testcontainers/postgresql 12.2.1(testcontainers 12.2.1) | npm ls | 2026-10-26 |
| DB 이미지 | postgres:17-alpine (PostgreSQL 17.11) | 이미지 안 `postgres --version` | 2026-10-26 |
| Docker | Docker Desktop 4.49.0, Engine 28.5.1 | `docker version` | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| 패키지 | 실습 프로젝트 npm ls | 2026-10-26 |
| DB 이미지 | Docker Hub, 이미지 안 `postgres --version` | 2026-10-26 |
| Docker | `docker version` | 2026-10-26 |
| 컨테이너 준비 시간 | 실습 환경 실측 | 2026-10-26 |
| count(*) 결과 타입 | PostgreSQL 문서(Aggregate Functions), node-postgres 문서(pg-types) | 2026-10-26 |
| vitest hookTimeout 기본값 | vitest 4 문서 | 2026-10-26 |

## 참고 자료

- Testcontainers for Node.js 문서: https://node.testcontainers.org/
- Testcontainers for Node.js, PostgreSQL 모듈: https://node.testcontainers.org/modules/postgresql/
- node-postgres 문서: https://node-postgres.com/
- pg-types(node-postgres의 타입 변환): https://github.com/brianc/node-pg-types
- PostgreSQL 문서, Aggregate Functions: https://www.postgresql.org/docs/17/functions-aggregate.html
- Vitest 문서, 설정(hookTimeout): https://vitest.dev/config/
- NestJS 공식 문서, Custom providers(useFactory): https://docs.nestjs.com/fundamentals/custom-providers
