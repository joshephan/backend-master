# 16강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node.js | v24.11.0 | `node -v` | 2026-10-26 |
| NestJS | @nestjs/common·core 12.2.0, @nestjs/mapped-types 12.0.0 | `npm ls` | 2026-10-26 |
| TypeScript | 6.0.3, target ES2023 | `npx tsc -v`, `tsconfig.json` | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다. 응답의 `createdAt` 값은 실행 시각에 따라 다르다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| NestJS 패키지 | 실습 프로젝트 | 2026-10-26 |
| TypeScript | tsconfig target ES2023 | 2026-10-26 |
| GitHub 대량 할당 사건 | GitHub Blog, "Public Key Security Vulnerability and Mitigation" (2012-03-04) https://github.blog/news-insights/the-library/public-key-security-vulnerability-and-mitigation/ (확인 2026-10-26) | 2012-03-04 |
| OWASP API Security Top 10 | owasp.org/API-Security | 2023 |

## 참고 자료

- NestJS 문서, Controllers(요청 본문과 DTO): https://docs.nestjs.com/controllers
- NestJS 문서, Mapped types(`PartialType`): https://docs.nestjs.com/techniques/validation#mapped-types
- OWASP API Security Top 10 2023, API3:2023 Broken Object Property Level Authorization: https://owasp.org/API-Security/
- GitHub Blog, "Public Key Security Vulnerability and Mitigation"(2012-03-04): https://github.blog/news-insights/the-library/public-key-security-vulnerability-and-mitigation/
