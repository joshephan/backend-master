# 1강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node | v24.11.0 | `node -v` | 2026-10-25 |
| curl | 8.16.0 | `curl --version` | 2026-10-25 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| example.com 구간 시간(첫 요청) | 강사 PC, 집 와이파이, curl 8.16.0 실측 | 2026-10-25 |
| example.com 구간 시간(바로 다음 요청) | 같은 환경 실측 | 2026-10-25 |
| localhost 구간 시간 | Node v24.11.0 http 서버 실측 | 2026-10-25 |
| Node 내장 fetch 응답 헤더 기본 대기 | Node v24.11.0, 내장 fetch(undici)의 headersTimeout 기본값 | 2026-10-25 |
| 커넥션 풀 10개, 쿼리 20밀리초, 결제사 0.5초 | 강의용 가정 | - |

## 참고 자료

- Node.js 문서, HTTP: https://nodejs.org/api/http.html
- Node.js 문서, 전역 fetch: https://nodejs.org/api/globals.html#fetch
- undici 문서, `headersTimeout` 옵션(Client): https://undici.nodejs.org/#/docs/api/Client
- curl 매뉴얼, `-w`(`--write-out`): https://curl.se/docs/manpage.html
- NestJS 문서, 요청 생명주기(Request lifecycle): https://docs.nestjs.com/faq/request-lifecycle
