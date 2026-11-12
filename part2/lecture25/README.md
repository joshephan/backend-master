# 25강. 파이프: 변환과 검증

제2부 NestJS 핵심 · 6장 요청 파이프라인

[← 24강](../../part2/lecture24/) | [제2부 목록](../) | [26강 →](../../part2/lecture26/)

## 이번 강의 질문

핸들러가 받는 값이 "적어 둔 타입 그대로"라고 믿으려면 그 앞에서 누가 무엇을 해야 하나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |

## 실습 자료

### 준비

- Node.js 24. Docker는 필요 없다
- 시작 상태: 24강 끝 코드([../../part2/lecture24/code/](../../part2/lecture24/code/))
- [code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다. 좌석 번호 파이프 `SeatIdPipe`, 전역 `ValidationPipe`(`whitelist`, `forbidNonWhitelisted`, `transform` 켬), 요청 DTO 규칙이 들어 있다. 아래 명령은 bash 기준이다
- 이 강에서 `class-validator`, `class-transformer`를 더했다. code/의 package.json에 이미 들어 있어서 `npm install`이면 된다. 24강 끝 코드에서 직접 따라 할 때는 `npm install class-validator class-transformer`
- 서버는 code/ 안의 `.env`를 읽으므로 [20강 실습 자료](../../part2/lecture20/)와 같은 내용으로 만든다. 공연·회차·좌석 준비 요청은 [24강 실습 자료](../../part2/lecture24/)와 같다

```bash
cd code
npm install
npx nest build
PORT=4025 PAYMENT_MODE=fake node dist/apps/ticketing/main.js
```

공연·회차·좌석을 만든 뒤 아래 요청을 보낸다. `long.json`은 `title`에 300자를 넣은 UTF-8 JSON 파일이다.

```bash
curl -X POST localhost:4025/performances/1/seats/a-1-5/hold
curl -X POST localhost:4025/performances/1/seats/A15/hold
curl -X POST localhost:4025/concerts -H 'content-type: application/json' -d '{"title":12345,"venue":""}'
curl -X POST localhost:4025/reservations -H 'content-type: application/json' -d '{"seatId":"A-1-1","amount":"abc","buyer":"010-1234-5678"}'
curl "localhost:4025/performances/1/seats?row=3"
curl -X PATCH localhost:4025/concerts/1 -H 'content-type: application/json' --data-binary @long.json
curl -X PATCH localhost:4025/performances/1 -H 'content-type: application/json' -d '{"concertId":2}'
```

### 코드

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/common/seat-id.pipe.ts](code/apps/ticketing/src/common/seat-id.pipe.ts) | 좌석 번호를 대문자로 맞추고 `구역-열-번호` 형식을 검사하는 파이프. 틀리면 400 |
| [code/apps/ticketing/src/seats/seats.controller.ts](code/apps/ticketing/src/seats/seats.controller.ts) | 좌석 선점의 `seatId`에 `SeatIdPipe`, 좌석 목록에 `row`·`status` 쿼리 필터 |
| [code/apps/ticketing/src/seats/box-office.controller.ts](code/apps/ticketing/src/seats/box-office.controller.ts) | 매표소 판매의 `seatId`에 `SeatIdPipe` |
| [code/apps/ticketing/src/seats/dto/list-seats.query.ts](code/apps/ticketing/src/seats/dto/list-seats.query.ts) | 좌석 목록 쿼리 DTO. `@Type(() => Number)`로 `row`를 숫자로 바꾼다 |
| [code/apps/ticketing/src/concerts/dto/create-concert.dto.ts](code/apps/ticketing/src/concerts/dto/create-concert.dto.ts) | 공연 등록 규칙(문자열, 비어 있지 않음, 100자 이하) |
| [code/apps/ticketing/src/reservations/dto/create-reservation.dto.ts](code/apps/ticketing/src/reservations/dto/create-reservation.dto.ts) | 예매 본문 규칙(좌석 번호 형식, 1 이상의 정수 금액, 구매자, 선택 채널) |
| [code/apps/ticketing/src/reservations/reservations.controller.ts](code/apps/ticketing/src/reservations/reservations.controller.ts) | 예매 본문 타입을 인라인 타입에서 `CreateReservationDto`로 교체 |
| [code/apps/ticketing/src/performances/dto/create-performance.dto.ts](code/apps/ticketing/src/performances/dto/create-performance.dto.ts) | 회차 등록 규칙(공연 번호, ISO 8601 시작 시각) |
| [code/apps/ticketing/src/performances/dto/update-performance.dto.ts](code/apps/ticketing/src/performances/dto/update-performance.dto.ts) | `PartialType(OmitType(...))`로 공연 번호를 뺀 회차 수정 DTO |
| [code/apps/ticketing/src/performances/performances.service.ts](code/apps/ticketing/src/performances/performances.service.ts) | 회차 수정이 `startsAt`을 실제로 바꾸게 고침 |
| [code/apps/ticketing/src/main.ts](code/apps/ticketing/src/main.ts) | `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))` |
| [code/package.json](code/package.json) | `class-validator`, `class-transformer` 추가 |

### 실행 결과

아래 출력은 이 강의 코드를 차례로 더해 가며 찍은 것이다. 출력 앞에 그 시점을 적었다. "배열 N개"는 응답 배열의 길이를 세어 적은 값이다.

`SeatIdPipe`를 건 뒤의 좌석 선점. 소문자는 대문자로 바뀌고, 형식이 틀리면 400이다.

```text
$ curl -X POST localhost:4025/performances/1/seats/a-1-5/hold
{"id":"A-1-5","label":"A구역 1열 5번","status":"HELD"} [201]

$ curl -X POST localhost:4025/performances/1/seats/A15/hold
{"type":"about:blank","title":"Bad Request","status":400,
 "detail":"seatId 형식이 아닙니다: A15 (예: A-3-15)", …} [400]
```

전역 `ValidationPipe`와 공연 등록 규칙을 켠 뒤. 걸린 규칙이 한 번에 `errors` 배열로 나온다.

```text
$ curl -X POST localhost:4025/concerts -d '{"title":12345,"venue":""}'
{"type":"about:blank","title":"Bad Request","status":400,
 "errors":["title must be shorter than or equal to 100 characters",
           "title must be a string",
           "venue should not be empty"],
 "instance":"/concerts"} [400]
```

예매 본문을 `CreateReservationDto`로 바꾼 뒤.

```text
$ curl -X POST localhost:4025/reservations \
    -d '{"seatId":"A-1-1","amount":"abc","buyer":"010-1234-5678"}'
{"type":"about:blank","title":"Bad Request","status":400,
 "errors":["amount must not be less than 1","amount must be an integer number"], …}

$ curl -X POST localhost:4025/reservations \
    -d '{"seatId":"A-1-1","amount":110000,"buyer":"010-1234-5678"}'
{"id":1,"seatId":"A-1-1","approvalId":"fake-110000","amount":110000, …} [201]
```

`transform: true`를 켠 뒤의 좌석 목록 필터.

```text
$ curl "localhost:4025/performances/1/seats?row=3"
배열 20개
$ curl "localhost:4025/performances/1/seats?row=3&status=AVAILABLE"
배열 20개
```

`whitelist`, `forbidNonWhitelisted`를 켠 뒤. 규칙이 없는 필드가 오면 400이다.

```text
$ curl -X POST localhost:4025/concerts -d '{"title":"Winter","venue":"Hall","settlementRate":0}'
{"type":"about:blank","title":"Bad Request","status":400,
 "errors":["property settlementRate should not exist"], …}

$ curl -X POST localhost:4025/reservations -d '{…,"discount":100}'
{"…","status":400,"errors":["property discount should not exist"], …}
```

`PartialType`으로 만든 공연 수정 DTO는 등록 DTO의 규칙을 그대로 가져온다.

```text
$ curl -X PATCH localhost:4025/concerts/1 -d '{"title":"가가가…(300자)"}'
{"type":"about:blank","title":"Bad Request","status":400,
 "errors":["title must be shorter than or equal to 100 characters"], …}
```

회차 수정 DTO는 공연 번호를 받지 않는다.

```text
$ curl -X PATCH localhost:4025/performances/1 -d '{"concertId":2}'
{"…","status":400,"errors":["property concertId should not exist"], …}
$ curl -X PATCH localhost:4025/performances/1 -d '{"startsAt":"2026-11-21T19:00:00+09:00"}'
{"id":1,"concertId":1,"startsAt":"2026-11-21T19:00:00+09:00"} [200]
$ curl -X PATCH localhost:4025/performances/1 -d '{"startsAt":"11월 21일"}'
{"…","status":400,"errors":["startsAt must be a valid ISO 8601 date string"], …}
```

### 해 볼 때 참고

**검증이 없을 때.** 24강 끝 코드에서는 숫자 제목이 그대로 저장되고(201), 소문자 좌석 번호는 없는 좌석(404)이 된다. TypeScript 타입은 빌드에서 지워져 실행 때 검사하지 않는다.

```text
$ curl -X POST localhost:4025/concerts -d '{"title":12345,"venue":"x"}'
{"id":2,"title":12345,"venue":"x"} [201]

$ curl -X POST localhost:4025/performances/1/seats/a-1-5/hold
{"type":"about:blank","title":"Not Found","status":404,
 "detail":"좌석 a-1-5이 없습니다", …} [404]
```

**인라인 타입의 본문.** 전역 `ValidationPipe`를 켜도 예매 컨트롤러가 `@Body() body: { seatId: string; amount: number; ... }`처럼 객체 리터럴 타입을 쓰면, 실행 때 인자 타입이 `Object`라서 검사 없이 통과한다. 금액 `"abc"`가 결제사 호출까지 간다.

```text
$ curl -X POST localhost:4025/reservations \
    -d '{"seatId":"A-1-1","amount":"abc","buyer":"010-1234-5678"}'
{"id":1,"seatId":"A-1-1","approvalId":"fake-abc","amount":"abc",
 "message":"[문자 → 010-1234-5678] A-1-1 예매가 확정되었습니다"} [201]

[예매] A-1-1 결제 완료
```

**transform을 끄면.** main.ts에서 `transform: true`를 빼면 쿼리 검사는 통과하지만 핸들러가 받는 `query.row`는 문자열 `"3"`이라 필터 결과가 0개다.

```text
$ curl "localhost:4025/performances/1/seats?row=3"
배열 0개

$ curl "localhost:4025/performances/1/seats?row=abc"
{"type":"about:blank","title":"Bad Request","status":400,
 "errors":["row must not be greater than 40","row must not be less than 1",
           "row must be an integer number"], …}
```

**암묵 변환.** `transformOptions: { enableImplicitConversion: true }`를 켜고 `ListSeatsQuery`에 `@IsOptional() @IsBoolean() aisle?: boolean;`을 더한 뒤, 좌석 목록 핸들러에 `console.log('query', query)`를 넣으면 문자열 `"false"`가 `true`로 바뀐다(`Boolean("false")`).

```ts
new ValidationPipe({ transform: true, transformOptions: { enableImplicitConversion: true } })
```

```text
$ curl "localhost:4025/performances/1/seats?row=3&aisle=false"
query ListSeatsQuery { row: 3, aisle: true, status: undefined }
```

검증 메시지는 class-validator의 영어 기본 문구다. 고객 앱 화면에 띄우려면 `CreateReservationDto`의 `seatId` 규칙처럼 `message` 옵션으로 문구를 정한다.

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| class-validator | 0.15.1 | 2026-10-26 |
| class-transformer | 0.5.1 | 2026-10-26 |
| @nestjs/mapped-types | 12.0.0 | 2026-10-26 |
| ValidationPipe 기본값 | transform false, whitelist false, forbidNonWhitelisted false | 2026-10-26 |
| 검증 메시지 문구 | "must be an integer number", "should not exist" 등 영어 기본 문구 | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 응답에서 필드 감추기(ClassSerializerInterceptor, @Exclude) | [28강](../../part2/lecture28/) |
| 중첩 객체 검증(@ValidateNested) | 49강 |
| 검증 메시지 한국어화와 에러 코드 | 49강 |
| 입력 검증의 보안 관점(인젝션, 크기 제한) | 153강 |
| 좌석이 남았는지의 동시성 | 83강 |
| 파이프 단위 테스트 | [32강](../../part2/lecture32/) |
| 배포 순서와 하위 호환 | 260강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.
