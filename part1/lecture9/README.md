# 9강. HTTP 메서드와 상태 코드

제1부 기반: 백엔드와 Node.js 런타임 · 3장 HTTP 기초

[← 8강](../../part1/lecture8/) | [제1부 목록](../) | [10강 →](../../part1/lecture10/)

## 이번 강의 질문

응답 첫 줄의 숫자 세 자리는 받는 쪽 프로그램에게 무엇을 알려 주고, 메서드와 숫자를 잘못 고르면 무엇이 깨지나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |
| [subtitles.vtt](subtitles.vtt) | 자막(WebVTT) |
| [subtitles.srt](subtitles.srt) | 자막(SRT) |

## 실습 자료

### 준비

Node.js 24가 필요하다. Docker는 쓰지 않는다. 3강 끝 코드([../../part1/lecture3/code/](../../part1/lecture3/code/))에서 시작한다.

[code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다(`ticketing` 모노레포). 데이터는 DB 없이 메모리에 둔다.

```bash
cd code
npm install
npx nest build
PORT=4009 node dist/apps/ticketing/main.js
```

다른 터미널에서 요청을 보낸다.

```bash
curl -i localhost:4009/concerts/1
curl -i localhost:4009/concerts/99
curl -i -X POST localhost:4009/performances/1/holds -H 'content-type: application/json' -d '{"seat":"A-3-15"}'
curl -i -X POST localhost:4009/performances/1/holds -H 'content-type: application/json' -d '{"seat":"A-3-15"}'
curl -i -X DELETE localhost:4009/performances/1/holds/1
curl -i localhost:4009/concerts/1/sales
curl -i -X PUT localhost:4009/concerts/1
curl -I localhost:4009/concerts/1
curl -i -X OPTIONS localhost:4009/concerts/1
```

undici의 재시도 기본 메서드는 설치된 소스에서 확인한다.

```bash
grep -n "methods ??" node_modules/undici/lib/handler/retry-handler.js
```

### 코드

이 강에서 새로 만들거나 고친 파일이다.

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/concerts/concerts.service.ts](code/apps/ticketing/src/concerts/concerts.service.ts) | 공연 목록(메모리), 없는 공연에 `NotFoundException`, 좌석 선점 `hold`(이미 잡힌 좌석이면 `ConflictException`)와 해제 `release`. 선점은 `회차:좌석` 키의 Map |
| [code/apps/ticketing/src/concerts/holds.controller.ts](code/apps/ticketing/src/concerts/holds.controller.ts) | `POST /performances/:performanceId/holds`(201), `DELETE /performances/:performanceId/holds/:holdId`(`@HttpCode(204)`) |
| [code/apps/ticketing/src/concerts/concerts.controller.ts](code/apps/ticketing/src/concerts/concerts.controller.ts) | 처리하지 못한 예외가 500이 되는 것을 보이는 `GET /concerts/:id/sales` |
| [code/apps/ticketing/src/concerts/concerts.module.ts](code/apps/ticketing/src/concerts/concerts.module.ts) | `HoldsController` 등록 |

회차 모듈은 아직 없다. 선점은 회차 번호를 확인하지 않고 Map 키로만 쓴다.

### 실행 결과

정상 조회, 없는 공연, 선점, 같은 좌석 재선점, 해제의 응답(첫 줄과 본문).

```
$ curl -i localhost:4009/concerts/1
HTTP/1.1 200 OK
{"id":1,"title":"10월 콘서트"}
$ curl -i localhost:4009/concerts/99
HTTP/1.1 404 Not Found
{"message":"공연 99번이 없습니다","error":"Not Found","statusCode":404}
$ curl -i -X POST localhost:4009/performances/1/holds -d '{"seat":"A-3-15"}' ...
HTTP/1.1 201 Created
{"holdId":1,"performanceId":1,"seat":"A-3-15"}
$ (같은 요청 한 번 더)
HTTP/1.1 409 Conflict
{"message":"Seat A-3-15 is already held","error":"Conflict","statusCode":409}
$ curl -i -X DELETE localhost:4009/performances/1/holds/1
HTTP/1.1 204 No Content
```

처리하지 못한 예외. 응답에는 일반 문장만 가고 원래 메시지와 스택은 서버 로그에만 남는다.

```
$ curl -i localhost:4009/concerts/1/sales
HTTP/1.1 500 Internal Server Error
{"statusCode":500,"message":"Internal server error"}

(서버 로그)
ERROR [ExceptionsHandler] Error: settlement server did not respond
    at ConcertsController.sales (.../main.js:227:15)
```

연결하지 않은 메서드, HEAD, OPTIONS. 주소는 있고 메서드만 없을 때 표준은 405지만 Express 라우터는 404를 준다. HEAD는 GET 라우트가 대신 처리해 본문 없이 길이만 온다.

```
$ curl -i -X PUT localhost:4009/concerts/1
HTTP/1.1 404 Not Found
{"message":"Cannot PUT /concerts/1","error":"Not Found","statusCode":404}

$ curl -I localhost:4009/concerts/1
HTTP/1.1 200 OK
Content-Length: 34

$ curl -i -X OPTIONS localhost:4009/concerts/1
HTTP/1.1 404 Not Found
```

undici 6.20.1의 재시도 기본 메서드. 멱등한 메서드만 들어 있고 POST·PATCH는 빠져 있다.

```js
// node_modules/undici/lib/handler/retry-handler.js
methods: methods ?? ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE', 'TRACE'],
```

### 해 볼 때 참고

- 선점 Map은 메모리에 있어서 서버를 다시 켜면 비고 `holdId`도 1부터 다시 센다
- 500 응답의 스택 줄 번호(`main.js:227:15`)는 빌드 결과에 따라 달라진다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| NestJS | @nestjs/common·core·platform-express 12.2.0 | 2026-10-26 |
| Express | 5.3.0 (@nestjs/platform-express 의존성) | 2026-10-26 |
| 없는 메서드 응답 | 404 "Cannot PUT /concerts/1" (405 아님) | 2026-10-26 |
| HEAD 자동 처리, OPTIONS 404 | 위와 같음 | 2026-10-26 |
| undici 재시도 기본 메서드 | GET, HEAD, OPTIONS, PUT, DELETE, TRACE | 2026-10-26 |
| 안전한·멱등한 메서드 정의 | RFC 9110 9.2.1, 9.2.2 | 2022-06 |
| GitHub 비공개 저장소 404 | 권한 없는 요청에 403 대신 404 | 2026-10-26 |
| Node | v24.11.0 | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| REST 리소스 설계, URL 모양 | 49강 |
| HTTP 캐시와 304 | 131강 |
| 401·403의 실제 구현(인증, 인가) | 137강 |
| CORS와 OPTIONS 사전 요청 | 157강 |
| 429와 속도 제한 | 219강 |
| 재시도 정책, 멱등성 키 | 211강, 214강 |
| 결제 결과를 모를 때의 처리 | 214강 |
| 로드 밸런서와 리버스 프록시 | 282~284강 |
| 예외 필터와 예외 계층 | [27강](../../part2/lecture27/) |
| 좌석 선점의 실제 설계 | 83강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.
