# 28강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| NestJS | @nestjs/common·core 12.2.0 | npm ls | 2026-10-26 |
| class-transformer | 0.5.1 | npm ls | 2026-10-26 |
| 빌더 | rspack 2.2.9, ES 모듈 출력 | nest-cli.json | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| NestJS | npm ls | 2026-10-26 |
| class-transformer | npm ls | 2026-10-26 |
| @Header를 클래스에 붙였을 때 | @nestjs/common 12.2.0 실측 | 2026-10-26 |
| 빌더 | nest-cli.json | 2026-10-26 |

## 참고 자료

- NestJS 공식 문서, Custom decorators: https://docs.nestjs.com/custom-decorators
- NestJS 공식 문서, Guards(Setting roles per handler): https://docs.nestjs.com/guards
- NestJS 공식 문서, Execution context(Reflection and metadata): https://docs.nestjs.com/fundamentals/execution-context
- NestJS 공식 문서, Serialization: https://docs.nestjs.com/techniques/serialization
- class-transformer: https://github.com/typestack/class-transformer
- Node.js 공식 문서, `process.loadEnvFile()`: https://nodejs.org/api/process.html
