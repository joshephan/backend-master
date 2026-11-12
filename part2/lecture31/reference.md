# 31강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| 실행 환경 | Windows, Node v24.11.0 | node -v | 2026-10-26 |
| NestJS 패키지 | @nestjs/core·common·microservices 12.2.0 | npm ls | 2026-10-26 |
| 포트 | HTTP 4031, TCP 5131, 가짜 외부 서버 5031 | 실행 명령 | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| NestJS 패키지 | 실습 프로젝트 npm ls | 2026-10-26 |
| 시연 환경 | 실습 환경 | 2026-10-26 |
| 하이브리드 전역 설정 | node_modules/@nestjs/core/nest-application.js `connectMicroservice` | 2026-10-26 |
| 하이브리드의 init | 같은 파일, 시연 부팅 로그 | 2026-10-26 |
| 트랜스포트 종류 | docs.nestjs.com, Microservices | 2026-10-26 |
| 스탠드얼론 앱 | docs.nestjs.com, Standalone applications | 2026-10-26 |

## 참고 자료

- NestJS 공식 문서, Microservices: https://docs.nestjs.com/microservices/basics
- NestJS 공식 문서, Hybrid application: https://docs.nestjs.com/faq/hybrid-application
- NestJS 공식 문서, Standalone applications: https://docs.nestjs.com/standalone-applications
- NestJS 공식 문서, Microservices exception filters: https://docs.nestjs.com/microservices/exception-filters
- NestJS 공식 문서, Execution context: https://docs.nestjs.com/fundamentals/execution-context
