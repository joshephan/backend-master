# 32강. 유닛 테스트와 테스트 더블

제2부 NestJS 핵심 · 8장 테스트 기초

[← 31강](../../part2/lecture31/) | [제2부 목록](../) | [33강 →](../../part2/lecture33/)

## 이번 강의 질문

결제사, 시계, 문자 발송처럼 내 마음대로 안 되는 것에 기대는 코드를, 어떻게 빠르고 매번 같은 결과로 시험하나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |

## 실습 자료

### 준비

- Node 24(실행 환경은 v24.11.0). Docker는 필요 없다. 서버를 띄우지 않고 테스트만 돌린다
- 31강 끝 코드([../../part2/lecture31/code/](../../part2/lecture31/code/))에서 시작한다. 이 상태에서 `npx vitest run`을 돌리면 3개가 실패한다. 이 강의 [code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다
- `code/`에서 `npm install` 뒤 `npx vitest run`

### 코드

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/seats/seats.service.spec.ts](code/apps/ticketing/src/seats/seats.service.spec.ts) | 좌석 서비스 유닛 테스트. 회차 서비스 자리에 findOne 스텁, 없는 회차는 NotFoundException을 던지는 스텁. 좌석 충돌은 SeatUnavailableError로 확인 |
| [code/apps/ticketing/src/reservations/reservations.service.spec.ts](code/apps/ticketing/src/reservations/reservations.service.spec.ts) | 예매 서비스 유닛 테스트. 결제사·확정 문자는 `vi.fn()` 목, 로거는 더미. 결제 성공이면 확정 문자 한 번, 실패면 0번. FakePaymentGateway와 `vi.spyOn`으로 승인 번호 확인 |
| [code/apps/ticketing/src/performances/performances.service.spec.ts](code/apps/ticketing/src/performances/performances.service.spec.ts) | 다가오는 회차 테스트. `vi.useFakeTimers({ toFake: ['Date'] })`와 `vi.setSystemTime`으로 지금 시각 고정 |
| [code/apps/ticketing/src/app.controller.spec.ts](code/apps/ticketing/src/app.controller.spec.ts) | 테스트 이름과 기댓값을 지금 첫 화면 문구(`'예매 API: A구역 3열 15번'`)로 |
| [code/apps/notifier/src/notifier.controller.spec.ts](code/apps/notifier/src/notifier.controller.spec.ts) | 같은 이름, 기댓값 `'알림: A구역 3열 15번 예매 확정'` |

### 실행 결과

시작 코드의 `npx vitest run`. 첫 화면 문구가 바뀐 테스트 둘과, 생성자 인자가 늘어난 예매 서비스 테스트가 실패한다:

```text
$ npx vitest run
 × reservations.service.spec.ts > 결제사를 실제로 부르지 않고 예매를 시험한다 3ms
 × notifier.controller.spec.ts > NotifierController > root > should return "Hello World!" 216ms
 × app.controller.spec.ts > AppController > root > should return "Hello World!" 217ms

AssertionError: expected '예매 API: A구역 3열 15번' to be 'Hello World!'
AssertionError: expected '알림: A구역 3열 15번 예매 확정' to be 'Hello World!'
TypeError: Cannot read properties of undefined (reading 'setTag')

 Test Files  3 failed | 3 passed (6)
      Tests  3 failed | 3 passed (6)
```

좌석 서비스 테스트만 돌렸을 때. 서버도 Nest도 띄우지 않는다:

```text
$ npx vitest run apps/ticketing/src/seats
 Test Files  1 passed (1)
      Tests  3 passed (3)
   Duration  440ms (transform 65ms, setup 0ms, import 290ms, tests 3ms, environment 0ms)
```

예매 서비스에서 확정 문자 발송 줄을 결제 위로 옮겼을 때. 결제 실패 테스트가 잡아낸다:

```text
 ✓ ReservationsService > 결제가 되면 확정 문자를 한 번 보낸다 3ms
 × ReservationsService > 결제가 실패하면 확정 문자를 보내지 않는다 5ms
   → expected "vi.fn()" to not be called at all, but actually been called 1 times
  1st vi.fn() call:
    Array [ "sms", "김민수", "A-3-15" ]
```

시계를 고정하지 않은 다가오는 회차 테스트를, 시계를 2026-12-25로 옮겨 돌렸을 때. 코드는 그대로이고 날짜만 바뀌어 실패한다:

```text
 × PerformancesService > 지금보다 뒤에 시작하는 회차만 나온다 8ms
   → expected [] to deeply equal [ '2026-12-24T19:00' ]

- Expected
+ Received

- [
-   "2026-12-24T19:00",
- ]
+ []
```

진짜 결제사 클라이언트(HttpPaymentGateway)로 로컬 가짜 결제사 서버(5032)를 부르는 테스트. 상대 서버 상태만 다르고 코드는 같다:

```text
결제사 정상
 ✓ 진짜 결제사 클라이언트로 결제한다 43ms

결제사 무응답 (MODE=hang)
 × 진짜 결제사 클라이언트로 결제한다 3017ms
   → The operation was aborted due to timeout
```

이 강의 [code/](code/)에서 `npx vitest run`(전체 실행 시간 1.13s):

```text
$ npx vitest run
 ✓ performances.service.spec.ts > 지금보다 뒤에 시작하는 회차만 나온다 5ms
 ✓ performances.service.spec.ts > 시작 시각이 지난 회차는 빠진다 2ms
 ✓ seats.service.spec.ts > 빈 좌석을 붙잡으면 HELD가 된다 2ms
 ✓ seats.service.spec.ts > 이미 붙잡힌 좌석을 또 붙잡으면 409 1ms
 ✓ seats.service.spec.ts > 없는 회차에는 좌석을 열 수 없다 1ms
 ✓ reservations.service.spec.ts > 결제가 되면 확정 문자를 한 번 보낸다 2ms
 ✓ reservations.service.spec.ts > 결제가 실패하면 확정 문자를 보내지 않는다 1ms
 ✓ reservations.service.spec.ts > 페이크 결제사로 예매하면 fake 승인 번호가 붙는다 2ms
 ✓ app.controller.spec.ts > 첫 화면 문구에 좌석 표기가 들어간다 214ms
 ✓ notifier.controller.spec.ts > 첫 화면 문구에 좌석 표기가 들어간다 199ms
 (… CLI가 만든 should be defined 3개)
 Test Files  8 passed (8)
      Tests  13 passed (13)
```

### 해 볼 때 참고

- 순서를 바꾼 코드: `reservations.service.ts`의 reserve에서 `const message = this.notifications.sendConfirmed(channel, buyer, seatId);` 줄을 `charge` 위로 옮기고 `npx vitest run apps/ticketing/src/reservations --reporter=verbose`. 확인 뒤 되돌린다
- 12월 25일: 시계를 고정하지 않은 테스트 파일 복사본 맨 위에 `vi.useFakeTimers(); vi.setSystemTime(new Date('2026-12-25T10:00:00+09:00'));`를 넣고 돌린다
- 진짜 결제사 클라이언트 테스트: 아래 테스트를 `apps/ticketing/src/reservations/` 아래 임시 파일(이름에 `tmp-real`)로 두고, [18강](../../part2/lecture18/)의 가짜 결제사 서버 `fake-pg.mjs`를 띄워 돌린다. 확인 뒤 임시 파일을 지우고, 띄운 가짜 결제사 프로세스만 끈다

```ts
it('진짜 결제사 클라이언트로 결제한다', async () => {
  const gateway = new HttpPaymentGateway(
    { mode: 'http', baseUrl: 'http://localhost:5032', timeoutMs: 3000 },
    'tok-123',
  );

  const payment = await gateway.charge(110000);

  expect(payment.approvalId).toBe('pg-110000');
});
```

```bash
PORT=5032 node fake-pg.mjs &              # 정상 모드
npx vitest run apps/ticketing/src/reservations/tmp-real
PORT=5032 MODE=hang node fake-pg.mjs &    # 무응답 모드
npx vitest run apps/ticketing/src/reservations/tmp-real
```

- 남의 서버를 부르는 테스트는 결제사가 무응답인 날 테스트 하나가 3초씩 걸리고 결과가 매번 달라진다. 결제사와 맞는지는 결제사 클라이언트만 따로 붙여 보는 테스트로 나눈다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| 테스트 도구 | vitest 4.1.12 (Nest CLI 12 새 프로젝트 기본) | 2026-10-26 |
| 좌석 유닛 테스트 | 3 passed, Duration 440ms, tests 3ms | 2026-10-26 |
| 진짜 결제사 클라이언트 테스트 | 정상 43ms, 무응답 3,017ms (timeoutMs 3000) | 2026-10-26 |
| 전체 유닛 테스트 | 8 files, 13 passed, Duration 1.13s | 2026-10-26 |
| 가짜 타이머 API | `vi.useFakeTimers({ toFake: ['Date'] })`, `vi.setSystemTime`, `vi.useRealTimers` | 2026-10-26 |
| 테스트 더블 다섯 가지 이름 | 더미, 스텁, 스파이, 목, 페이크 | 2007 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| Nest 테스트 모듈로 조립해서 시험하기 | [33강](../../part2/lecture33/) |
| 진짜 DB와 붙여 보는 테스트 | [34강](../../part2/lecture34/) |
| 결제사 클라이언트와 결제사의 약속 확인(컨트랙트 테스트) | 241강 |
| 시각과 시간대 | 64강 |
| 결제 실패와 재시도 | 211강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.
