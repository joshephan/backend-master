# 14강. 컨트롤러와 라우팅

제2부 NestJS 핵심 · 4장 구성 요소

[← 13강](../../part2/lecture13/) | [제2부 목록](../) | [15강 →](../../part2/lecture15/)

## 이번 강의 질문

요청 주소 하나가 어느 메서드에 닿을지는 무엇이 정하고, 그 길목에서 흔히 무엇이 어긋나나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |

## 실습 자료

### 준비

Node.js 24가 필요하다. Docker는 쓰지 않는다. 13강 끝 코드([../../part2/lecture13/code/](../../part2/lecture13/code/))에서 시작한다.

[code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다. 고친 뒤의 컨트롤러가 들어 있다.

```bash
cd code
npm install
npx nest build
PORT=4014 node dist/apps/ticketing/main.js
```

공연 1개와 회차 2개를 등록한 뒤 요청한다. Windows Git Bash에서는 한글 본문이 깨질 수 있어서 본문을 파일로 보낸다.

```bash
printf '{"title":"가을 콘서트"}' > concert.json
printf '{"concertId":1,"startsAt":"2026-11-14T19:00"}' > perf1.json
printf '{"concertId":1,"startsAt":"2026-11-15T18:00"}' > perf2.json
curl -X POST localhost:4014/concerts -H 'Content-Type: application/json' --data-binary @concert.json
curl -X POST localhost:4014/performances -H 'Content-Type: application/json' --data-binary @perf1.json
curl -X POST localhost:4014/performances -H 'Content-Type: application/json' --data-binary @perf2.json
curl -i localhost:4014/performances/upcoming
curl localhost:4014/performances?concertId=1
curl localhost:4014/performances/abc
curl localhost:4014/performances/99
curl -i -X DELETE localhost:4014/performances/2
curl -i localhost:4014/performances/1/ics
```

### 코드

이 강에서 고친 파일이다.

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/performances/performances.controller.ts](code/apps/ticketing/src/performances/performances.controller.ts) | `upcoming`을 `:id`보다 위에 선언, `ParseIntPipe`(쿼리 `concertId`는 `optional`), 삭제에 `@HttpCode(204)`, 캘린더 파일 `GET /performances/:id/ics`에 `@Header('Content-Type', 'text/calendar')` |
| [code/apps/ticketing/src/performances/performances.service.ts](code/apps/ticketing/src/performances/performances.service.ts) | 공연별 `findAll(concertId?)`, 다가오는 회차 `findUpcoming()`, 없는 회차에 `NotFoundException`, `.ics` 본문을 만드는 `toIcs()`, 실제로 지우는 `remove()` |

`startsAt`은 `'YYYY-MM-DDTHH:mm'` 문자열이라 `findUpcoming()`은 ISO 문자열과 사전순으로 비교해 앞뒤를 가린다. 단순화한 방식이다.

### 실행 결과

부팅 로그의 라우트 표(고치기 전, 스키매틱 그대로).

```
LOG [RoutesResolver] PerformancesController {/performances}:
LOG [RouterExplorer] Mapped {/performances, POST} route
LOG [RouterExplorer] Mapped {/performances, GET} route
LOG [RouterExplorer] Mapped {/performances/:id, GET} route
LOG [RouterExplorer] Mapped {/performances/:id, PATCH} route
LOG [RouterExplorer] Mapped {/performances/:id, DELETE} route
```

반환값의 종류에 따른 응답. 문자열은 그대로 `text/html`로, 객체·배열은 JSON으로 나간다. POST의 기본 상태 코드는 201이다.

```
$ curl -i localhost:4014/
Content-Type: text/html; charset=utf-8
예매 API: A구역 3열 15번

$ curl -i localhost:4014/performances
Content-Type: application/json; charset=utf-8
[]

$ curl -s -o /dev/null -w '%{http_code}' -X POST localhost:4014/performances -d '...'
201
```

`upcoming`을 `:id` 아래에 선언했을 때. 라우트 표에서 `:id`가 위에 있어 `upcoming`이 id로 잡히고, `findOne(NaN)`이 `undefined`를 돌려 본문 없는 200이 된다.

```
Mapped {/performances, POST} route
Mapped {/performances, GET} route
Mapped {/performances/:id, GET} route
Mapped {/performances/upcoming, GET} route
Mapped {/performances/:id, PATCH} route
Mapped {/performances/:id, DELETE} route
```

```
$ curl -i localhost:4014/performances/upcoming
HTTP/1.1 200 OK
X-Powered-By: Express
Connection: keep-alive
Keep-Alive: timeout=65
Transfer-Encoding: chunked

```

고정 경로를 위로 옮긴 뒤.

```
Mapped {/performances/upcoming, GET} route
Mapped {/performances/:id, GET} route

$ curl localhost:4014/performances/upcoming
[{"id":1,"concertId":1,"startsAt":"2026-11-14T19:00"},{"id":2,"concertId":1,"startsAt":"2026-11-15T18:00"}]
```

쿼리 값을 `number`로 표시만 하고 바꾸지 않았을 때. 실제 값은 문자열 `'1'`이라 `1 === '1'`이 거짓이 된다.

```
$ curl localhost:4014/performances
[{"id":1,"concertId":1,...},{"id":2,"concertId":1,...}]
$ curl localhost:4014/performances?concertId=1
[]
```

`ParseIntPipe`를 붙인 뒤.

```
$ curl localhost:4014/performances?concertId=1
[{"id":1,"concertId":1,...},{"id":2,"concertId":1,...}]
$ curl localhost:4014/performances/abc
{"type":"about:blank","title":"Bad Request","status":400,
 "detail":"Validation failed (numeric string is expected)","instance":"/performances/abc"}
```

본문의 `concertId`를 문자열로 보내면 공연을 못 찾는다. 본문 JSON은 숫자와 문자열을 그대로 둔다.

```
$ curl -X POST localhost:4014/performances -d '{"concertId":"1","startsAt":"2026-11-14T19:00"}'
{"type":"about:blank","title":"Not Found","status":404,"detail":"공연 1번이 없습니다","instance":"/performances"}
```

없는 회차. 고치기 전에는 본문 없는 200, `NotFoundException`을 던진 뒤에는 404.

```
$ curl -i localhost:4014/performances/99
HTTP/1.1 200 OK
X-Powered-By: Express
Transfer-Encoding: chunked

```

```
$ curl localhost:4014/performances/99
{"type":"about:blank","title":"Not Found","status":404,"detail":"회차 99번이 없습니다","instance":"/performances/99"}
```

삭제.

```
$ curl -i -X DELETE localhost:4014/performances/2
HTTP/1.1 204 No Content
```

`@Res()`로 응답 객체를 받고 값을 return만 했을 때. 응답을 보내는 코드가 없어 curl이 3초 뒤 포기한다.

```
$ curl -sS -m 3 localhost:4014/performances/1/ics
curl: (28) Operation timed out after 3006 milliseconds with 0 bytes received
```

`@Header`로 바꾼 뒤(`@Res({ passthrough: true })`로 받아도 같은 응답).

```
$ curl -i localhost:4014/performances/1/ics
HTTP/1.1 200 OK
Content-Type: text/calendar; charset=utf-8

BEGIN:VEVENT
DTSTART:20261114T190000
END:VEVENT
```

이 강 끝의 회차 라우트.

```
Mapped {/performances, POST} route
Mapped {/performances, GET} route
Mapped {/performances/upcoming, GET} route
Mapped {/performances/:id, GET} route
Mapped {/performances/:id/ics, GET} route
Mapped {/performances/:id, PATCH} route
Mapped {/performances/:id, DELETE} route
```

### 해 볼 때 참고

나쁜 예는 [code/apps/ticketing/src/performances/performances.controller.ts](code/apps/ticketing/src/performances/performances.controller.ts)만 바꿔 재현한다.

- 선언 순서: `@Get('upcoming')` 메서드를 `@Get(':id')` 메서드 아래로 옮기고, `findOne`을 `@Param('id') id: string`과 `+id`로 되돌린다
- 쿼리 문자열: `findAll(@Query('concertId') concertId: number)`처럼 파이프 없이 받는다
- 없는 회차의 200: 서비스 `findOne`에서 `NotFoundException`을 던지는 `if` 블록을 지운다
- `@Res()` 멈춤: `downloadIcs`에서 `@Header`를 빼고 `@Res() res: Response`를 받아 `res.setHeader('Content-Type', 'text/calendar')`를 부른 뒤 `toIcs(id)`를 return한다. 옵션 없는 `@Res()`를 받으면 Nest는 return 값을 응답으로 보내지 않는다. 응답 객체가 꼭 필요하면 `@Res({ passthrough: true })`로 받는다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| NestJS 패키지 | @nestjs/common·core·platform-express 12.2.0 | 2026-10-26 |
| HTTP 어댑터 | Express (X-Powered-By: Express) | 2026-10-26 |
| ParseIntPipe 메시지 | "Validation failed (numeric string is expected)" | 2026-10-26 |
| ParseIntPipe optional 옵션 | `new ParseIntPipe({ optional: true })` 사용 가능 | 2026-10-26 |
| 응답 헤더 | Keep-Alive: timeout=65 | 2026-10-26 |
| 빈 200의 헤더 | Content-Length 없이 Transfer-Encoding: chunked, 본문 0바이트 | 2026-10-26 |
| curl 타임아웃 문구 | "Operation timed out after 3006 milliseconds with 0 bytes received" | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 파이프의 동작과 직접 만드는 파이프 | [25강](../../part2/lecture25/) |
| 예외 필터와 예외 계층 | [27강](../../part2/lecture27/) |
| 요청 본문 검증 | [25강](../../part2/lecture25/) |
| 서비스로 업무 규칙 옮기기 | [15강](../../part2/lecture15/) |
| Express와 Fastify의 응답 객체 차이 | [30강](../../part2/lecture30/) |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.
