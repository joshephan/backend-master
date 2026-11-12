# 17강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node.js | v24.11.0 | `node -v` | 2026-10-26 |
| NestJS 패키지 | @nestjs/common·core 12.2.0 | `npm ls` | 2026-10-26 |
| Nest CLI | 12.0.10 | `npm ls` | 2026-10-26 |
| 빌더 | rspack 2.2.9(builtin swc-loader) | nest-cli.json | 2026-10-26 |
| TypeScript | 6.0.3 | `npm ls` | 2026-10-26 |
| vitest | 4.1.12 | `npx vitest run` 출력 | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| NestJS 패키지 | npm ls | 2026-10-26 |
| 빌더 | nest-cli.json, dist/apps/ticketing/main.js | 2026-10-26 |
| TypeScript | tsconfig.json | 2026-10-26 |
| vitest | 실습 프로젝트 실측, Node v24.11.0 | 2026-10-26 |
| import type 부팅 에러의 안내 문구 | @nestjs/core 12.2.0 출력 | 2026-10-26 |
| Prisma 커넥션 풀 | prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-management | 2026-10-26 |

## 참고 자료

- NestJS 공식 문서, Providers: https://docs.nestjs.com/providers
- NestJS 공식 문서, Modules: https://docs.nestjs.com/modules
- NestJS 공식 문서, Custom providers: https://docs.nestjs.com/fundamentals/custom-providers
- TypeScript tsconfig, emitDecoratorMetadata: https://www.typescriptlang.org/tsconfig/#emitDecoratorMetadata
- TypeScript tsconfig, experimentalDecorators: https://www.typescriptlang.org/tsconfig/#experimentalDecorators
- TypeScript 3.8 릴리스 노트(Type-Only Imports and Export): https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html
- Prisma 문서, Connection management: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-management
- Vitest 공식 문서: https://vitest.dev/guide/
