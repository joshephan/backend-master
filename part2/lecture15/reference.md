# 15강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node.js | v24.11.0 | `node -v` | 2026-10-26 |
| NestJS | @nestjs/common·core 12.2.0 | `npm ls` | 2026-10-26 |
| Nest CLI | @nestjs/cli 12.0.10 | `npm ls` | 2026-10-26 |
| 빌더 | rspack 2.2.9 (모노레포 기본) | `nest build` 출력 | 2026-10-26 |
| TypeScript 설정 | `emitDecoratorMetadata: true` | `tsconfig.json` | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다. 스택의 줄 번호와 로그의 `+Nms`는 빌드 결과와 환경에 따라 다르다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| NestJS 패키지 | 실습 프로젝트 | 2026-10-26 |
| 빌더 | 빌드 출력 | 2026-10-26 |
| @Injectable 누락 시 동작 | 실행 출력, tsconfig emitDecoratorMetadata: true | 2026-10-26 |
| 500 응답 본문 | 실행 출력 | 2026-10-26 |

## 참고 자료

- NestJS 문서, Providers(`@Injectable`, 생성자 주입, 등록): https://docs.nestjs.com/providers
- NestJS 문서, Modules(exports와 imports): https://docs.nestjs.com/modules
- NestJS 문서, Common errors: https://docs.nestjs.com/faq/common-errors
- TypeScript 문서, Decorators(`emitDecoratorMetadata`): https://www.typescriptlang.org/docs/handbook/decorators.html
