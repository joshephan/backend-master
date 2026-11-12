# 15강. 프로바이더와 서비스

제2부 NestJS 핵심 · 4장 구성 요소

[← 14강](../../part2/lecture14/) | [제2부 목록](../) | [16강 →](../../part2/lecture16/)

## 이번 강의 질문

좌석을 붙잡는 규칙은 어디에 둬야 하고, 그 규칙을 가진 객체는 누가 몇 개 만들어서 쓰나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |
| [subtitles.vtt](subtitles.vtt) | 자막(WebVTT) |
| [subtitles.srt](subtitles.srt) | 자막(SRT) |

## 실습 자료

### 준비

Node.js 24가 필요하다. Docker는 쓰지 않는다. 14강 끝 코드([../../part2/lecture14/code/](../../part2/lecture14/code/))에서 시작한다.

[code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다. 좌석 모듈은 Nest CLI로 모듈, 서비스, 컨트롤러를 하나씩 만들었다. 좌석은 회차가 열릴 때 한 번에 생기고 이후 상태만 바뀌어서 CRUD 전체를 만드는 `resource`는 쓰지 않았다.

```bash
nest g module seats --project ticketing
nest g service seats --project ticketing --no-spec
nest g controller seats --project ticketing --no-spec
```

실행:

```bash
cd code
npm install
npx nest build
PORT=4015 node dist/apps/ticketing/main.js
```

공연 1개와 회차 1개를 등록한 뒤(14강과 같은 방법) 좌석을 열고 요청한다.

```bash
curl -X POST localhost:4015/performances/1/seats
curl -X POST localhost:4015/performances/1/seats/A-3-15/hold
curl -X POST localhost:4015/box-office/performances/1/seats/A-3-15/sell
curl -X POST localhost:4015/box-office/performances/1/seats/A-3-16/sell
curl -X POST localhost:4015/performances/7/seats
```

### 코드

이 강에서 새로 만들거나 고친 파일이다.

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/seats/entities/seat.entity.ts](code/apps/ticketing/src/seats/entities/seat.entity.ts) | `Seat`(id 'A-3-15', 회차, 구역·열·번호)와 상태 `AVAILABLE`·`HELD`·`SOLD` |
| [code/apps/ticketing/src/seats/seats.service.ts](code/apps/ticketing/src/seats/seats.service.ts) | `@Injectable()` 서비스. 생성자로 `PerformancesService`를 받아 회차를 확인하고 좌석 60개(A구역 1~3열, 열마다 1~20번)를 연다. 붙잡기 `hold`와 창구 판매 `sell`이 같은 `takeAvailable` 규칙(판매 가능한 좌석만)을 쓴다 |
| [code/apps/ticketing/src/seats/seats.controller.ts](code/apps/ticketing/src/seats/seats.controller.ts) | `POST·GET /performances/:performanceId/seats`, `POST /performances/:performanceId/seats/:seatId/hold` |
| [code/apps/ticketing/src/seats/box-office.controller.ts](code/apps/ticketing/src/seats/box-office.controller.ts) | 현장 판매 `POST /box-office/performances/:performanceId/seats/:seatId/sell` |
| [code/apps/ticketing/src/seats/seats.module.ts](code/apps/ticketing/src/seats/seats.module.ts) | `imports: [PerformancesModule]`, 컨트롤러 둘, `providers: [SeatsService]` |
| [code/apps/ticketing/src/performances/performances.module.ts](code/apps/ticketing/src/performances/performances.module.ts) | `exports: [PerformancesService]` |
| [code/apps/ticketing/src/concerts/concerts.module.ts](code/apps/ticketing/src/concerts/concerts.module.ts), [code/apps/ticketing/src/concerts/concerts.service.ts](code/apps/ticketing/src/concerts/concerts.service.ts) | 공연 모듈에 있던 임시 선점 껍데기(`holds.controller.ts`, 5만 석 좌석 지도, `hold`·`release`·`seats`) 삭제 |
| [code/apps/ticketing/src/app.module.ts](code/apps/ticketing/src/app.module.ts) | imports에 `SeatsModule` |

### 실행 결과

Nest CLI 출력.

```
$ nest g module seats --project ticketing
CREATE apps/ticketing/src/seats/seats.module.ts (86 bytes)
UPDATE apps/ticketing/src/app.module.ts (507 bytes)
$ nest g service seats --project ticketing --no-spec
CREATE apps/ticketing/src/seats/seats.service.ts (93 bytes)
UPDATE apps/ticketing/src/seats/seats.module.ts (166 bytes)
$ nest g controller seats --project ticketing --no-spec
CREATE apps/ticketing/src/seats/seats.controller.ts (103 bytes)
UPDATE apps/ticketing/src/seats/seats.module.ts (257 bytes)
```

컨트롤러마다 `new SeatsService()`로 만들었을 때. 생성 로그가 두 번 찍히고, 창구 쪽 서비스의 좌석표는 비어 있어 온라인에서 붙잡은 좌석을 찾지 못한다.

```
ConcertsService 생성
SeatsService 생성
SeatsService 생성

$ curl -X POST localhost:4015/performances/1/seats
{"performanceId":1,"count":60}
$ curl -X POST localhost:4015/performances/1/seats/A-3-15/hold
{"id":"A-3-15","performanceId":1,"zone":"A","row":3,"no":15,"status":"HELD"}
$ curl -X POST localhost:4015/performances/1/seats/A-3-15/hold
{"type":"about:blank","title":"Conflict","status":409,
 "detail":"A구역 3열 15번은 이미 팔렸거나 선택된 좌석입니다","instance":"/performances/1/seats/A-3-15/hold"}
$ curl -X POST localhost:4015/box-office/performances/1/seats/A-3-15/sell
{"type":"about:blank","title":"Not Found","status":404,
 "detail":"좌석 A-3-15이 없습니다","instance":"/box-office/performances/1/seats/A-3-15/sell"}
```

프로바이더로 등록하고 생성자로 받은 뒤(이 강 끝 코드). 서비스가 하나라 창구도 같은 좌석표를 본다.

```
ConcertsService 생성
SeatsService 생성

$ curl -X POST localhost:4015/performances/1/seats
{"performanceId":1,"count":60}
$ curl -X POST localhost:4015/performances/1/seats/A-3-15/hold
{"id":"A-3-15","performanceId":1,"zone":"A","row":3,"no":15,"status":"HELD"}
$ curl -X POST localhost:4015/box-office/performances/1/seats/A-3-15/sell
{"type":"about:blank","title":"Conflict","status":409,
 "detail":"A구역 3열 15번은 이미 팔렸거나 선택된 좌석입니다","instance":"/box-office/performances/1/seats/A-3-15/sell"}
$ curl -X POST localhost:4015/box-office/performances/1/seats/A-3-16/sell
{"id":"A-3-16","performanceId":1,"zone":"A","row":3,"no":16,"status":"SOLD"}
```

없는 회차의 좌석을 열 때.

```
$ curl -X POST localhost:4015/performances/7/seats
{"type":"about:blank","title":"Not Found","status":404,"detail":"회차 7번이 없습니다","instance":"/performances/7/seats"}
```

`SeatsService`에서 `@Injectable()` 한 줄만 지웠을 때. 빌드, 타입 검사, 부팅이 모두 통과한다.

```
$ nest build
Rspack 2.2.9 compiled successfully in 25 ms
$ npx tsc --noEmit -p apps/ticketing/tsconfig.app.json
(출력 없음, 종료 코드 0)
$ node dist/apps/ticketing/main.js
ConcertsService 생성
SeatsService 생성
LOG [InstanceLoader] SeatsModule dependencies initialized +0ms
LOG [NestApplication] Nest application successfully started +0ms
```

첫 요청에서 생성자로 받은 필드가 `undefined`라 500이 된다.

```
$ curl -X POST localhost:4015/performances/1/seats
{"type":"about:blank","title":"Internal Server Error","status":500,
 "detail":"요청을 처리하지 못했습니다.","instance":"/performances/1/seats"}

ERROR [ProblemDetails] TypeError: Cannot read properties of undefined (reading 'findOne')
    at SeatsService.open (.../dist/apps/ticketing/main.js:1276:34)
    at SeatsController.open (.../dist/apps/ticketing/main.js:1155:34)
```

이 강 끝의 좌석 라우트.

```
Mapped {/performances/:performanceId/seats, POST} route
Mapped {/performances/:performanceId/seats, GET} route
Mapped {/performances/:performanceId/seats/:seatId/hold, POST} route
Mapped {/box-office/performances/:performanceId/seats/:seatId/sell, POST} route
```

### 해 볼 때 참고

- 규칙을 컨트롤러마다 복사한 나쁜 예는 실행하지 않고 말로만 본다. 온라인 붙잡기는 `AVAILABLE`이 아니면 409를 주고, 창구 판매에 복사한 규칙은 `SOLD`만 거절한다. 그러면 온라인에서 결제 중인(`HELD`) 좌석을 창구가 팔아 버린다
- `new` 버전 재현: `SeatsService`에서 `@Injectable()`과 생성자 인자(`PerformancesService`)를 빼고, 두 컨트롤러에 `private readonly seatsService = new SeatsService();`를 두고, `SeatsModule`에는 controllers만 남긴다
- `@Injectable()` 누락 재현: `seats.service.ts`의 `@Injectable()` 한 줄만 지우고 빌드한다. 생성자 인자 타입은 `emitDecoratorMetadata` 설정이 켜져 있고 데코레이터가 붙은 클래스일 때만 실행 코드에 남는다. 확인이 끝나면 되돌린다
- 좌석표는 서비스 안의 Map이라 서버를 다시 켜면 사라지고, 서버가 두 대면 좌석표도 두 개다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| NestJS 패키지 | @nestjs/common·core 12.2.0, @nestjs/cli 12.0.10 | 2026-10-26 |
| 빌더 | rspack 2.2.9 (모노레포 기본) | 2026-10-26 |
| @Injectable 누락 시 동작 | 부팅 성공, tsc 통과, 첫 요청 TypeError(500) | 2026-10-26 |
| 500 응답 본문 | {"type":"about:blank","title":"Internal Server Error","status":500,"detail":"요청을 처리하지 못했습니다.", ...} (전역 Problem Details 필터) | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 의존성 주입과 제어의 역전의 원리 | [17강](../../part2/lecture17/) |
| 클래스 말고 값·팩토리를 프로바이더로 | [18강](../../part2/lecture18/) |
| 요청마다 새로 만드는 스코프 | [19강](../../part2/lecture19/) |
| 좌석 붙잡기의 제한 시간 | 83강 |
| 동시에 같은 좌석을 붙잡을 때 | 83강 |
| 서비스 테스트와 프로바이더 바꿔 끼우기 | [32강](../../part2/lecture32/), [33강](../../part2/lecture33/) |
| 서버 여러 대와 상태 | 281강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.
