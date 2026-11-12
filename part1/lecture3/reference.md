# 3강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node | v24.11.0 | `node -v` | 2026-10-25 |
| Nest CLI | 12.0.10 | `nest -v` | 2026-10-25 |
| @nestjs/common·core·platform-express | 12.2.0 | `npm ls` | 2026-10-25 |
| @nestjs/mapped-types, @nestjs/schematics | 12.0.0 | `npm ls` | 2026-10-25 |
| TypeScript | 6.0.3 | `npm ls typescript` | 2026-10-25 |
| vitest, oxlint, prettier | 4.1.12, 1.89.0, 3.9.10 | `npm ls` | 2026-10-25 |
| @swc/cli, @swc/core | 0.8.1, 1.16.20 | `npm ls` | 2026-10-25 |
| @rspack/core | 2.2.9 | 빌드 출력 | 2026-10-25 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| Nest CLI | npm @nestjs/cli 설치본 | 2026-10-25 |
| NestJS 패키지 | npm ls | 2026-10-25 |
| 새 프로젝트 기본 도구 | nest new 결과 | 2026-10-25 |
| SWC | npm ls | 2026-10-25 |
| rspack | 빌드 출력 | 2026-10-25 |
| 컴파일 시간 | 강사 PC, Node v24.11.0 | 2026-10-25 |
| nest build 명령 전체 시간 | 같은 환경, CLI 시작 포함 | 2026-10-25 |
| 모노레포 전환 시 builder | Nest CLI 12.0.10 | 2026-10-25 |
| test:e2e 스크립트 치환 오류 | Nest CLI 12.0.10 generate app | 2026-10-25 |
| 라이브러리 경로와 tsc | Nest CLI 12.0.10, moduleResolution nodenext | 2026-10-25 |

## 참고 자료

- NestJS 문서, First steps: https://docs.nestjs.com/first-steps
- NestJS 문서, CLI Overview: https://docs.nestjs.com/cli/overview
- NestJS 문서, CLI Workspaces(모노레포): https://docs.nestjs.com/cli/monorepo
- NestJS 문서, CLI Libraries: https://docs.nestjs.com/cli/libraries
- NestJS 문서, SWC: https://docs.nestjs.com/recipes/swc
- NestJS 문서, CRUD generator: https://docs.nestjs.com/recipes/crud-generator
- TypeScript 문서, Modules Reference(모듈 해석): https://www.typescriptlang.org/docs/handbook/modules/reference.html
