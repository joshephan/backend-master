# 30강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| 실행 환경 | Windows, Node v24.11.0 | node -v | 2026-10-26 |
| NestJS 패키지 | @nestjs/core·platform-express 12.2.0, @nestjs/platform-fastify 12.2.0 | 실습 프로젝트 node_modules | 2026-10-26 |
| Express | express 5.3.0(platform-express가 고정) | 패키지의 package.json | 2026-10-26 |
| Fastify | fastify 5.12.7, @fastify/middie 9.3.5(platform-fastify가 고정) | 패키지의 package.json | 2026-10-26 |
| autocannon | 8.0.0 | 실행 출력 | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| NestJS 패키지 | 실습 프로젝트 node_modules | 2026-10-26 |
| Express·Fastify | 각 패키지의 package.json | 2026-10-26 |
| 시연 환경 | 실습 환경 | 2026-10-26 |
| Fastify 미들웨어 | docs.nestjs.com, Techniques > Performance (Fastify) | 2026-10-26 |
| 어댑터와 상관없는 예외 필터 | docs.nestjs.com, Exception filters | 2026-10-26 |
| Fastify 기본 듣는 주소 | docs.nestjs.com, Techniques > Performance (Fastify) https://docs.nestjs.com/techniques/performance , Fastify 문서 Server > listen https://fastify.dev/docs/latest/Reference/Server/ , 시연 netstat (확인 2026-10-26) | 2026-10-26 |
| Fastify 공개 벤치마크 | https://github.com/fastify/benchmarks (확인 2026-10-26) | 2026-10-26 |
| 본문 기본 상한 | 시연 출력(200KB 413 대 400), Fastify 문서 Server > bodyLimit | 2026-10-26 |
| Keep-Alive | 시연 응답 헤더 | 2026-10-26 |
| autocannon | 시연 출력 | 2026-10-26 |
| 처리량 실측 | 시연 출력 | 2026-10-26 |
| Fastify용 패키지 | docs.nestjs.com, Techniques > Compression·File upload, Security > Helmet | 2026-10-26 |

## 참고 자료

- NestJS 공식 문서, Performance (Fastify): https://docs.nestjs.com/techniques/performance
- NestJS 공식 문서, Exception filters: https://docs.nestjs.com/exception-filters
- NestJS 공식 문서, File upload: https://docs.nestjs.com/techniques/file-upload
- NestJS 공식 문서, Compression: https://docs.nestjs.com/techniques/compression
- NestJS 공식 문서, Helmet: https://docs.nestjs.com/security/helmet
- Fastify 문서, Server(listen, bodyLimit): https://fastify.dev/docs/latest/Reference/Server/
- Fastify 공개 벤치마크: https://github.com/fastify/benchmarks
- Express 문서: https://expressjs.com/
- autocannon: https://github.com/mcollina/autocannon
