# 25강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node.js | v24.11.0 | `node -v` | 2026-10-26 |
| NestJS 패키지 | @nestjs/common·core 12.2.0 | `npm ls` | 2026-10-26 |
| class-validator | 0.15.1 | `npm ls` | 2026-10-26 |
| class-transformer | 0.5.1 | `npm ls` | 2026-10-26 |
| @nestjs/mapped-types | 12.0.0 | `npm ls` | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| class-validator | npm ls | 2026-10-26 |
| class-transformer | npm ls | 2026-10-26 |
| @nestjs/mapped-types | npm ls | 2026-10-26 |
| ValidationPipe 기본값 | @nestjs/common 12.2.0 동작 실측 | 2026-10-26 |
| 검증 메시지 문구 | class-validator 0.15.1 출력 | 2026-10-26 |

## 참고 자료

- NestJS 공식 문서, Pipes: https://docs.nestjs.com/pipes
- NestJS 공식 문서, Validation: https://docs.nestjs.com/techniques/validation
- NestJS 공식 문서, Mapped types: https://docs.nestjs.com/techniques/validation#mapped-types
- class-validator README: https://github.com/typestack/class-validator
- class-transformer README: https://github.com/typestack/class-transformer
- ISO 8601-1:2019, Date and time representations for information interchange
