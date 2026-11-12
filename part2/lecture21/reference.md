# 21강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node.js | v24.11.0 | `node -v` | 2026-10-26 |
| NestJS 패키지 | @nestjs/common·core 12.2.0 | `npm ls` | 2026-10-26 |
| 빌더 | rspack 2.2.9 | nest-cli.json, dist 목록 | 2026-10-26 |
| 기동 시간 측정 | startup.mjs, 방식마다 3회, 영수증 모듈은 0.8초 지연 흉내 | startup.mjs | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| NestJS 패키지 | npm ls | 2026-10-26 |
| 빌더 | dist 목록 | 2026-10-26 |
| 공식 문서(순환 의존) | docs.nestjs.com/fundamentals/circular-dependency | 2026-10-26 |
| 공식 문서(SWC 절) | docs.nestjs.com/recipes/swc | 2026-10-26 |
| 공식 문서(지연 로딩) | docs.nestjs.com/fundamentals/lazy-loading-modules | 2026-10-26 |
| 기동 시간 실측 | 실습 PC, Node v24.11.0, startup.mjs(실습 자료), 영수증 모듈은 0.8초 지연 흉내 | 2026-10-26 |

## 참고 자료

- NestJS 공식 문서, Circular dependency: https://docs.nestjs.com/fundamentals/circular-dependency
- NestJS 공식 문서, Module reference: https://docs.nestjs.com/fundamentals/module-ref
- NestJS 공식 문서, Lazy loading modules: https://docs.nestjs.com/fundamentals/lazy-loading-modules
- NestJS 공식 문서, Discovery service: https://docs.nestjs.com/fundamentals/discovery-service
- NestJS 공식 문서, Lifecycle events: https://docs.nestjs.com/fundamentals/lifecycle-events
- NestJS 공식 문서, SWC(Common pitfalls): https://docs.nestjs.com/recipes/swc
- Node.js 문서, ECMAScript modules: https://nodejs.org/api/esm.html
