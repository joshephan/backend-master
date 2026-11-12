# 27강. 예외 필터와 예외 계층

제2부 NestJS 핵심 · 6장 요청 파이프라인

[← 26강](../../part2/lecture26/) | [제2부 목록](../) | [28강 →](../../part2/lecture28/)

## 이번 강의 질문

서비스가 던진 실패는 어떤 경로로 HTTP 응답이 되고, 어떤 실패가 그 경로를 벗어나나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |

## 실습 자료

### 준비

- Node 24(실행 환경은 v24.11.0). Docker는 필요 없다
- 26강 끝 코드([../../part2/lecture26/code/](../../part2/lecture26/code/))에서 시작한다. 이 강의 [code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다
- `code/`에 `.env` 파일을 만든다. main.ts가 `process.loadEnvFile()`로 읽으므로 파일이 없으면 서버가 뜨지 않는다. 내용은 [20강](../../part2/lecture20/)과 같이 `PG_URL=http://localhost:5020`, `PG_TIMEOUT_MS=3000`
- `code/`에서 `npm install` 뒤 `PORT=4027 PAYMENT_MODE=fake npm run start`로 서버를 띄운다
- 공연·회차·좌석 준비는 [26강](../../part2/lecture26/)과 같다(포트만 4027)

### 코드

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/common/domain-error.ts](code/apps/ticketing/src/common/domain-error.ts) | DomainError. HTTP를 모르는 업무 규칙 실패 예외. kind(`not-found`·`conflict`·`rejected`), code, details |
| [code/apps/ticketing/src/seats/seat-errors.ts](code/apps/ticketing/src/seats/seat-errors.ts) | SeatNotFoundError, SeatUnavailableError |
| [code/apps/ticketing/src/common/domain-error.filter.ts](code/apps/ticketing/src/common/domain-error.filter.ts) | DomainErrorFilter. kind를 404·409·422로 바꾸고, code로 type URL을 만든다. 확장 필드를 먼저 펼쳐 표준 칸을 덮지 못하게 함 |
| [code/apps/ticketing/src/common/problem-details.filter.ts](code/apps/ticketing/src/common/problem-details.filter.ts) | body parser 같은 Express 미들웨어가 던진 4xx 에러(http-errors 모양)는 상태 코드를 그대로 쓰는 갈래 추가 |
| [code/apps/ticketing/src/seats/seats.service.ts](code/apps/ticketing/src/seats/seats.service.ts) | ConflictException·NotFoundException 대신 좌석 도메인 에러를 던짐 |
| [code/apps/ticketing/src/app.module.ts](code/apps/ticketing/src/app.module.ts) | APP_FILTER로 ProblemDetailsFilter, DomainErrorFilter 순서로 등록 |
| [code/apps/ticketing/src/main.ts](code/apps/ticketing/src/main.ts) | `useGlobalFilters` 삭제 |

### 실행 결과

좌석 서비스가 일반 `Error`를 던지게 바꾸고 같은 좌석을 두 번 붙잡았을 때(두 번째 요청). 응답은 500이고 원래 메시지는 에러 로그에만 남는다:

```text
$ curl -X POST localhost:4027/performances/1/seats/A-1-1/hold   (두 번째)
{"type":"about:blank","title":"Internal Server Error","status":500,
 "detail":"요청을 처리하지 못했습니다.", …} [500]

[Timing] 49a7d856-… SeatsController.hold 실패(Error) 0.3ms
```

본문 크기 한도를 넘는 264,515바이트 파일(layout.json)을 보냈을 때. 413을 되찾은 뒤의 응답:

```text
$ curl -X POST localhost:4027/concerts --data-binary @layout.json
{"type":"about:blank","title":"Payload Too Large","status":413,
 "detail":"request entity too large","instance":"/concerts"} [413]
```

도메인 에러로 바꾼 뒤. 처음에는 확장 필드를 뒤에 펼치고 세부 정보에 `status: seat.status`를 넣어서 본문의 status가 덮였다. 확장 필드를 먼저 펼치고 이름을 seatStatus로 바꾼 뒤의 응답이 아래 둘째·셋째다:

```text
(확장 필드를 뒤에 펼친 코드, 세부 정보에 status: seat.status)
{"type":"https://api.ticketing.example/problems/seat-unavailable",
 "title":"SeatUnavailableError","status":"HELD", …} [409]

(고친 코드: 확장 필드를 먼저 펼치고 이름을 seatStatus로)
{"seatId":"A-1-1","seatStatus":"HELD",
 "type":"https://api.ticketing.example/problems/seat-unavailable",
 "title":"SeatUnavailableError","status":409,
 "detail":"A구역 1열 1번은 이미 팔렸거나 선택된 좌석입니다", …} [409]

{"seatId":"A-9-9","type":"https://api.ticketing.example/problems/seat-not-found",
 "title":"SeatNotFoundError","status":404,"detail":"좌석 A-9-9이 없습니다", …} [404]
```

전역 필터 두 개를 등록하는 다섯 가지 방법과, 이미 팔린 좌석을 다시 붙잡았을 때의 상태 코드:

| 등록 | 이미 팔린 좌석 |
|---|---|
| APP_FILTER(DomainErrorFilter) + main.ts useGlobalFilters(ProblemDetailsFilter) | 500 |
| useGlobalFilters(ProblemDetailsFilter, DomainErrorFilter) | 409 |
| useGlobalFilters(DomainErrorFilter, ProblemDetailsFilter) | 500 |
| APP_FILTER [ProblemDetailsFilter, DomainErrorFilter] | 409 |
| APP_FILTER [DomainErrorFilter, ProblemDetailsFilter] | 500 |

BoxOfficeController에만 `@UseFilters(LegacyHttpFilter)`를 걸었을 때. HttpException은 `{ code, msg }` 모양으로, 도메인 에러는 DomainErrorFilter의 모양으로 나간다:

```text
키 없음      {"code":401,"msg":"직원 키가 없거나 맞지 않습니다"} [401]
좌석 형식    {"code":400,"msg":"seatId 형식이 아닙니다: A15 (예: A-3-15)"} [400]
이미 팔림    {"seatId":"A-1-1","seatStatus":"SOLD","type":"…/seat-unavailable", …} [409]
```

감사 기록을 기다리지 않고 던져 두고 `AUDIT_FAIL=on`으로 실행했을 때. 201 응답 뒤 서버 프로세스가 꺼진다:

```text
$ curl -X POST localhost:4027/reservations -d '{"seatId":"A-1-1","amount":110000,…}'
{"id":1,"seatId":"A-1-1","approvalId":"fake-110000", …} [201]

[예매] A-1-1 결제 완료
LOG [HTTP] a85ecc8a-… POST /reservations 201 2.5ms
Error: 감사 저장소 응답 없음: reserve A-1-1
Node.js v24.11.0
(서버 프로세스 종료 코드 1)

$ curl -m 2 localhost:4027/concerts
 [000]
```

`.catch()`를 붙인 뒤. 실패는 로그로 남고 서버는 계속 응답한다:

```text
{"id":1,"seatId":"A-1-1", …} [201]
[예매] A-1-1 결제 완료
[예매] 감사 기록 실패: 감사 저장소 응답 없음: reserve A-1-1
$ curl localhost:4027/concerts
[{"id":1,"title":"가을 콘서트","venue":"올림픽홀"}] [200]
```

### 해 볼 때 참고

아래 실험 코드는 [code/](code/)에 없다. 직접 바꿔 보고 되돌린다.

- 500 재현: SeatsService에서 이미 팔린 좌석일 때 던지는 에러를 `new Error(...)`로 바꾼다
- 전역 필터 순서: AppModule의 APP_FILTER 두 줄 순서를 바꾸거나, main.ts의 `app.useGlobalFilters(...)`와 섞어 위 표의 다섯 가지를 만든다. 나중에 등록된 전역 필터가 먼저 고르고, `@Catch()`가 빈 필터가 먼저 고르면 나머지 필터는 기회가 없다
- 컨트롤러 필터: `seats/legacy-http.filter.ts`에 아래 클래스를 두고 BoxOfficeController에 `@UseFilters(LegacyHttpFilter)`를 붙인다

```ts
@Catch(HttpException)
export class LegacyHttpFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    res.status(exception.getStatus()).json({ code: exception.getStatus(), msg: exception.message });
  }
}
```

- 기다리지 않은 Promise: `reservations/audit.service.ts`에 아래 `write`를 가진 AuditService를 두고 ReservationsModule providers에 넣은 뒤 ReservationsService 생성자로 받는다. 결제 완료 로그 다음 줄에서 `void this.audit.write(...)`로 부르고 `AUDIT_FAIL=on`으로 서버를 띄운다

```ts
// 예매 감사 기록 저장 (외부 저장소 흉내). AUDIT_FAIL=on이면 실패
async write(event: string) {
  await new Promise((r) => setTimeout(r, 100));
  if (process.env.AUDIT_FAIL === 'on') throw new Error(`감사 저장소 응답 없음: ${event}`);
}
```

```ts
// 고친 코드: 실패를 받을 곳을 직접 붙인다
this.audit.write(`reserve ${seatId}`).catch((err) => this.logger.log(`감사 기록 실패: ${err.message}`));
```

- 예외 필터는 미들웨어, 가드, 인터셉터, 파이프, 핸들러에서 던진 예외와 핸들러가 돌려준 Promise의 실패만 받는다. `void`로 던져 둔 Promise, `setTimeout`·이벤트 콜백 안의 예외는 받지 못한다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| NestJS | @nestjs/common·core 12.2.0 | 2026-10-26 |
| 전역 필터 고르는 순서 | 나중에 등록된 필터가 먼저, APP_FILTER와 useGlobalFilters를 섞으면 useGlobalFilters 쪽이 먼저 고름 | 2026-10-26 |
| http-errors 413 | PayloadTooLargeError, status 413, expose true | 2026-10-26 |
| 처리 안 된 Promise 실패 | 프로세스 종료, 종료 코드 1 | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 필터에서 쓰는 표시(메타데이터) | [28강](../../part2/lecture28/) |
| 잃으면 안 되는 비동기 작업(아웃박스) | 189강 |
| 메시지 큐로 작업 넘기기 | 174강 |
| 프로세스가 꺼졌을 때 재시작, 우아한 종료 | [29강](../../part2/lecture29/), 249강 |
| 에러 코드 체계와 API 문서화 | 49강, 51강 |
| 하이브리드 앱의 rpc 예외 필터 | [31강](../../part2/lecture31/) |
| 필터 테스트 | [32강](../../part2/lecture32/) |
| 에러 로그 모으기와 알림 | 264강, 267강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.
