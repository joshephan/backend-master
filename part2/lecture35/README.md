# 35강. 엔드투엔드 테스트

제2부 NestJS 핵심 · 8장 테스트 기초

[← 34강](../../part2/lecture34/) | [제2부 목록](../)

## 이번 강의 질문

고객이 실제로 지나가는 길(라우팅, 서비스, DB, 응답)을 처음부터 끝까지 한 번에 확인하려면 테스트를 어떻게 세우나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |

## 실습 자료

### 준비

- Node 24(실행 환경은 Windows 11, Node v24.11.0), Docker. e2e 테스트의 예매 흐름은 PostgreSQL 컨테이너를 띄운다
- 34강 끝 코드([../../part2/lecture34/code/](../../part2/lecture34/code/))에서 시작한다. 이 강의 [code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다
- `code/`에서 `npm install` 뒤 `npm run test:e2e`. 결제사와 문자 발송함은 테스트 안에서 대역으로 바꾸므로 가짜 외부 서버도 `.env`도 필요 없다
- 예매 흐름 테스트 코드는 컨테이너에 고정 이름을 붙인다(`withName`). 같은 이름의 컨테이너가 남아 있으면 시작에 실패한다

### 코드

| 파일 | 내용 |
|---|---|
| [code/package.json](code/package.json) | `"test:e2e": "vitest run --config ./vitest.config.e2e.ts"`로 고침 |
| [code/apps/ticketing/src/setup-app.ts](code/apps/ticketing/src/setup-app.ts) | main.ts와 e2e 테스트가 같이 부르는 앱 설정. 요청 ID·로그 미들웨어, 압축, 전역 검증 파이프 |
| [code/apps/ticketing/src/main.ts](code/apps/ticketing/src/main.ts) | 미들웨어·압축·검증 파이프 자리를 `setupApp(app)` 한 줄로. keepAliveTimeout, TCP 연결, 종료 훅은 main.ts에 남김 |
| [code/apps/ticketing/test/app.e2e-spec.ts](code/apps/ticketing/test/app.e2e-spec.ts) | 결제사는 FakePaymentGateway, SmsOutbox는 빈 객체로 오버라이드, `setupApp(app)`, 기댓값 `'예매 API: A구역 3열 15번'`. supertest import를 `supertest/types.js`로 |
| [code/apps/ticketing/test/booking.e2e-spec.ts](code/apps/ticketing/test/booking.e2e-spec.ts) | 고객 한 명의 흐름(공연 등록부터 영수증까지), 없는 회차 404, 붙잡지 않은 좌석 예매는 `it.todo`. PostgreSQL 컨테이너, 끝나면 `app.close()` 뒤 컨테이너 정지 |
| [code/apps/notifier/test/app.e2e-spec.ts](code/apps/notifier/test/app.e2e-spec.ts) | 기댓값 `'알림: A구역 3열 15번 예매 확정'`, 같은 import 수정 |
| [code/tsconfig.spec.json](code/tsconfig.spec.json) | include에 `apps/*/test/**/*.ts` 추가 |

### 실행 결과

시작 코드의 `npm run test:e2e`. 앱을 둘로 나눌 때 CLI가 경로를 바꾸며 `vitest` 안의 `test`까지 치환해 명령을 찾지 못한다. Windows는 "'viapps'은(는) 내부 또는 외부 명령, 실행할 수 있는 프로그램, 또는 배치 파일이 아닙니다."를 출력한다:

```text
$ npm run test:e2e

> ticketing@0.0.1 test:e2e
> viapps/ticketing/test run --config ./vitest.config.e2e.ts
```

스크립트만 고치고 돌렸을 때. 알림 앱은 낡은 기댓값으로, 예매 앱은 결제사 주소 없이 토큰을 요청하다 실패하고 afterEach의 close도 실패한다:

```text
 × apps/notifier/test/app.e2e-spec.ts > NotifierController (e2e) > / (GET) 355ms
   → expected 'Hello World!' response body, got '알림: A구역 3열 15번 예매 확정'
결제 설정: {"mode":"http","timeoutMs":3000}
 × apps/ticketing/test/app.e2e-spec.ts > AppController (e2e) > / (GET) 45ms
   → Failed to parse URL from undefined/token
   → Cannot read properties of undefined (reading 'close')
 Test Files  2 failed (2)
```

결제사와 문자 발송함을 오버라이드하고 기댓값을 고친 뒤:

```text
 ✓ apps/notifier/test/app.e2e-spec.ts > NotifierController (e2e) > / (GET) 289ms
 ✓ apps/ticketing/test/app.e2e-spec.ts > AppController (e2e) > / (GET) 155ms
```

예매 본문에 없는 필드 coupon을 섞은 `POST /reservations`. e2e 테스트는 main.ts를 실행하지 않으므로 `setupApp`을 부르지 않으면 전역 검증 파이프가 걸리지 않는다. 400 본문이 Problem Details인 것은 APP_FILTER로 등록한 필터가 e2e 앱에도 걸리기 때문이다:

```text
예매 본문에 없는 필드 coupon을 섞은 POST /reservations
setupApp 없는 e2e 앱  201 {"id":1,"seatId":"A-3-15","approvalId":"fake-110000",...}
setupApp 부른 e2e 앱  400 {"type":"about:blank","title":"Bad Request","status":400,"errors":["property coupon should not exist"],...}
```

이 강의 [code/](code/)에서 `npm run test:e2e`(컨테이너 준비를 포함한 전체 5.87s). 흐름 테스트 1초 남짓의 대부분은 영수증 모듈을 처음 불러오는 0.8초다:

```text
$ npm run test:e2e
 ✓ app.e2e-spec.ts > NotifierController (e2e) > / (GET) 289ms
 ✓ app.e2e-spec.ts > AppController (e2e) > / (GET) 155ms
영수증 모듈 코드 불러옴 (0.8초)
 ✓ booking.e2e-spec.ts > 예매 흐름 (e2e) > 공연 등록부터 영수증까지 1107ms
 ✓ booking.e2e-spec.ts > 예매 흐름 (e2e) > 없는 회차에는 좌석을 열 수 없다 4ms
 Test Files  3 passed (3)
      Tests  4 passed | 1 todo (5)
```

붙잡지 않은 좌석(열린 적도 없는 Z-9-99)으로 예매하는 테스트. 결제와 예매 확정까지 진행되어 201이 나온다. 좌석 테스트와 예매 테스트는 각각 통과하지만 둘 사이가 연결되어 있지 않다:

```text
[예매] Z-9-99 결제 완료 (unknown)
 × 예매 흐름 (e2e) > 붙잡지 않은 좌석으로 예매하면 409 4ms
   → expected 409 "Conflict", got 201 "Created"
```

이 빈틈은 `it.todo`로 남겨 실행하지 않고 목록에만 둔다:

```text
      Tests  4 passed | 1 todo (5)
```

afterAll에서 `app.close()`를 빼고 컨테이너만 멈췄을 때. 테스트는 전부 통과하지만 그 뒤에 처리 안 된 에러가 난다:

```text
 ✓ 예매 흐름 (e2e) > 공연 등록부터 영수증까지 1060ms
 ✓ 예매 흐름 (e2e) > 없는 회차에는 좌석을 열 수 없다 4ms
⎯⎯⎯⎯⎯⎯ Unhandled Errors ⎯⎯⎯⎯⎯⎯
Vitest caught 1 unhandled error during the test run.
This might cause false positive tests. Resolve unhandled errors to make sure your tests are not affected.
⎯⎯⎯⎯⎯ Uncaught Exception ⎯⎯⎯⎯⎯
error: terminating connection due to administrator command
```

### 해 볼 때 참고

아래 실험은 임시 테스트 파일이나 잠시 바꾼 코드로 하고 되돌린다.

- setupApp 유무 비교: e2e 테스트에서 `setupApp(app);` 줄을 빼고, 예매 본문에 `coupon` 필드를 섞어 보낸다
- 붙잡지 않은 좌석: [code/apps/ticketing/test/booking.e2e-spec.ts](code/apps/ticketing/test/booking.e2e-spec.ts)의 `it.todo`를 아래 테스트로 바꾼다

```ts
  it('붙잡지 않은 좌석으로 예매하면 409', async () => {
    await request(app.getHttpServer())
      .post('/reservations')
      .send({ seatId: 'Z-9-99', amount: 110000, buyer: '이지은' })
      .expect(409);
  });
```

- close 누락: booking.e2e-spec.ts의 afterAll에서 `await app.close();`를 주석 처리한다. `app.close()`가 종료 훅을 돌려 PgSeatsRepository의 Pool을 닫으므로, 앱을 먼저 닫고 컨테이너를 내려야 한다. 순서를 바꾸면 열린 연결이 남은 채 DB가 내려가 연결 끊김 에러가 난다
- 처리 안 된 에러는 다른 테스트 도중에 터지면 멀쩡한 테스트를 실패로 보이게 하거나 진짜 실패를 묻는다. 테스트가 전부 초록이어도 실패로 취급한다
- e2e 앱에는 main.ts의 `.env` 읽기, TCP 마이크로서비스 연결, 종료 훅이 없다. TCP 메시지(`reservations.find`)는 e2e로 확인할 수 없다

테스트 명령 네 개:

| 명령 | 도는 파일 | 필요한 것 |
|---|---|---|
| npm test | `apps/*/src/**/*.spec.ts` (유닛, 모듈 조립) | Node |
| npm run test:types | 테스트 파일 포함 타입 검사 | Node |
| npm run test:int | `*.int-spec.ts` (통합) | Node + Docker |
| npm run test:e2e | `apps/*/test/*.e2e-spec.ts` (엔드투엔드) | Node + Docker |

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| supertest | 7.3.1, @types/supertest 7.2.1 | 2026-10-26 |
| e2e 실행 | 3 files, 4 passed, 1 todo, Duration 5.87s (컨테이너 준비 포함) | 2026-10-26 |
| 흐름 테스트 시간 | 1,057~1,107ms (영수증 모듈 첫 로딩 0.8초 포함) | 2026-10-26 |
| test:e2e 스크립트 치환 | "vitest run" → "viapps/ticketing/test run" | 2026-10-25 |
| Windows 명령 없음 메시지 | 'viapps'은(는) 내부 또는 외부 명령, 실행할 수 있는 프로그램, 또는 배치 파일이 아닙니다. | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 예매가 좌석 상태를 확인하는 규칙(좌석 애그리거트와 불변식) | 46강 |
| TCP 마이크로서비스 쪽 테스트 | 240강 |
| 시그널과 우아한 종료 | 249강 |
| CI에서 테스트 단계 나누기 | 257강 |
| 컨트랙트 테스트 | 241강 |
| 부하 테스트 | 278강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.
