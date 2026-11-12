# 11강. 에러 응답 규격과 Problem Details

제1부 기반: 백엔드와 Node.js 런타임 · 3장 HTTP 기초

[← 10강](../../part1/lecture10/) | [제1부 목록](../) | [12강 →](../../part1/lecture12/)

## 이번 강의 질문

에러 응답의 본문은 어떤 모양이어야 클라이언트가 문장을 해석하지 않고도 다음 행동을 정할 수 있나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |
| [subtitles.vtt](subtitles.vtt) | 자막(WebVTT) |
| [subtitles.srt](subtitles.srt) | 자막(SRT) |

## 실습 자료

### 준비

Node.js 24가 필요하다. Docker는 쓰지 않는다. 10강 끝 코드([../../part1/lecture10/code/](../../part1/lecture10/code/))에서 시작한다.

[code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다.

```bash
cd code
npm install
npx nest build
PORT=4011 node dist/apps/ticketing/main.js
```

```bash
curl -i localhost:4011/concerts/99
curl -i -X POST localhost:4011/performances/1/holds -H 'content-type: application/json' -d '{"seat":"A-3-15"}'
curl -i -X POST localhost:4011/performances/1/holds -H 'content-type: application/json' -d '{"seat":"A-3-15"}'
curl -i -X PUT localhost:4011/concerts/1
curl -i localhost:4011/concerts/1/sales
```

### 코드

이 강에서 새로 만들거나 고친 파일이다.

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/common/problem.exception.ts](code/apps/ticketing/src/common/problem.exception.ts) | `type`·`title`·확장 필드를 싣는 `ProblemException`과 그 하위 `SeatAlreadyHeldException`(409, `seat-already-held`) |
| [code/apps/ticketing/src/common/problem-details.filter.ts](code/apps/ticketing/src/common/problem-details.filter.ts) | 모든 예외를 받는 `@Catch()` 필터. `ProblemException`은 그대로, 다른 `HttpException`은 `about:blank`로, 그 밖의 예외는 로그에만 남기고 일반 문장으로. 응답 Content-Type은 `application/problem+json` |
| [code/apps/ticketing/src/main.ts](code/apps/ticketing/src/main.ts) | `app.useGlobalFilters(new ProblemDetailsFilter())` |
| [code/apps/ticketing/src/concerts/concerts.service.ts](code/apps/ticketing/src/concerts/concerts.service.ts) | 이미 선점된 좌석에 `ConflictException` 대신 `SeatAlreadyHeldException` |

### 실행 결과

필터를 붙이기 전 Nest 기본 에러 본문 세 가지. 검증 실패는 아래 "해 볼 때 참고"의 `ValidationPipe`를 붙였을 때의 응답이다.

```
(없는 공연, 404)
{"message":"공연 99번이 없습니다","error":"Not Found","statusCode":404}

(검증 실패, 400, ValidationPipe)
{"message":["seat must be a string","count must not be less than 1",
 "count must be an integer number"],"error":"Bad Request","statusCode":400}

(처리하지 못한 예외, 500)
{"statusCode":500,"message":"Internal server error"}
```

필터를 붙인 뒤 같은 좌석을 두 번 선점한 응답.

```
HTTP/1.1 409 Conflict
Content-Type: application/problem+json; charset=utf-8

{
  "type": "https://api.ticketing.example/problems/seat-already-held",
  "title": "이미 선점된 좌석",
  "status": 409,
  "detail": "A-3-15 좌석은 다른 손님이 선점했습니다.",
  "seat": "A-3-15",
  "instance": "/performances/1/holds"
}
```

필터를 붙인 뒤 404, 검증 실패, 연결하지 않은 메서드의 응답.

```
$ curl -i localhost:4011/concerts/99
HTTP/1.1 404 Not Found
Content-Type: application/problem+json; charset=utf-8
{"type":"about:blank","title":"Not Found","status":404,
 "detail":"공연 99번이 없습니다","instance":"/concerts/99"}

(검증 실패)
HTTP/1.1 400 Bad Request
{"type":"about:blank","title":"Bad Request","status":400,
 "errors":["seat must be a string","count must not be less than 1",
 "count must be an integer number"],"instance":"/performances/1/holds"}

$ curl -X PUT localhost:4011/concerts/1
{"type":"about:blank","title":"Not Found","status":404,
 "detail":"Cannot PUT /concerts/1","instance":"/concerts/1"}
```

처리하지 못한 예외. 고객에게는 일반 문장만 가고, 원래 메시지와 스택은 서버 로그에 남는다.

```
$ curl -i localhost:4011/concerts/1/sales
HTTP/1.1 500 Internal Server Error
Content-Type: application/problem+json; charset=utf-8
{"type":"about:blank","title":"Internal Server Error","status":500,
 "detail":"요청을 처리하지 못했습니다.","instance":"/concerts/1/sales"}

(서버 로그)
ERROR [ProblemDetails] Error: settlement server did not respond
    at ConcertsController.sales (.../main.js:367:15)
```

앞단이 HTML 에러 페이지를 돌려줬을 때 `JSON.parse`가 내는 문구(Node v24.11.0).

```
$ node -e "try{JSON.parse('<html>\r\n<head><title>502 Bad Gateway</title></head>')}catch(e){console.log(e.message)}"
Unexpected token '<', "<html>
<h"... is not valid JSON
```

### 해 볼 때 참고

- 검증 실패 응답은 프로젝트 코드에 넣지 않고 따로 확인했다. `class-validator`, `class-transformer`를 저장하지 않고 설치(`npm install --no-save class-validator class-transformer`)한 뒤, 아래 DTO와 `ValidationPipe`를 선점 라우트에 붙이고 `seat`에 숫자를 보낸다.

```ts
// dto/hold-seat.dto.ts
export class HoldSeatDto {
  @IsString() seat: string;
  @IsInt() @Min(1) count: number;
}
// 컨트롤러
hold(@Param('performanceId') performanceId: string, @Body(new ValidationPipe()) dto: HoldSeatDto)
```

```bash
curl -i -X POST localhost:4011/performances/1/holds -H 'content-type: application/json' -d '{"seat":15}'
```

- 필터의 그 밖의 예외 분기에서 `exception.message`를 `detail`에 그대로 실으면 DB 에러 메시지(테이블·컬럼 이름), 스택의 파일 경로, 외부 서비스의 원문 응답이 고객에게 나간다. 응답에는 고객이 할 수 있는 일과 찾아볼 단서(`instance`)만 싣는다
- 앱 쪽에서는 본문을 읽기 전에 `Content-Type`이 `application/problem+json`인지 먼저 본다. 아니면(앞단의 HTML 에러 페이지 등) 상태 코드만으로 처리한다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| NestJS | 12.2.0 | 2026-10-26 |
| class-validator, class-transformer | 검증 실패 시연에만 설치(--no-save) | 2026-10-26 |
| Nest 기본 에러 본문 | 404·400·500 세 가지 모양(실습 자료의 실행 결과 참고) | 2026-10-26 |
| Problem Details 표준 | RFC 9457 (2023-07), RFC 7807(2016-03) 대체 | 2026-10-26 |
| JSON.parse 오류 문구 | Unexpected token '<', "<html>\r\n<h"... is not valid JSON | 2026-10-26 |
| Express 어댑터의 +json 처리 | application/problem+json을 JSON 응답으로 인정 | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 예외 필터와 예외 계층 자세히 | [27강](../../part2/lecture27/) |
| 입력 검증(ValidationPipe, class-validator) | [25강](../../part2/lecture25/) |
| 요청 ID, 상관 ID | 263강 |
| 에러 응답의 API 명세(OpenAPI) | 53강 |
| 매진 처리와 좌석 재고 | 83강 |
| 에러 메시지로 인한 정보 노출 | 153강 |
| 로드 밸런서의 에러 페이지 설정 | 284강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.
