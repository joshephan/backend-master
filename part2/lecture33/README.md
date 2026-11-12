# 33강. 테스트 모듈과 프로바이더 오버라이드

제2부 NestJS 핵심 · 8장 테스트 기초

[← 32강](../../part2/lecture32/) | [제2부 목록](../) | [34강 →](../../part2/lecture34/)

## 이번 강의 질문

Nest가 실제로 조립하는 방식 그대로 시험하면서, 진짜로 부르면 안 되는 것만 어떻게 바꿔 끼우나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |

## 실습 자료

### 준비

- Node 24(실행 환경은 v24.11.0). Docker는 필요 없다. 서버를 띄우지 않고 테스트만 돌린다
- 32강 끝 코드([../../part2/lecture32/code/](../../part2/lecture32/code/))에서 시작한다. 이 강의 [code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다
- `code/`에서 `npm install` 뒤 `npx vitest run`과 `npm run test:types`. vitest는 타입을 지우고 실행하므로 타입 검사는 따로 돌린다

### 코드

| 파일 | 내용 |
|---|---|
| [code/tsconfig.spec.json](code/tsconfig.spec.json) | 테스트 파일까지 포함해 타입만 검사하는 설정(앱 빌드 설정은 테스트 파일을 뺀다) |
| [code/package.json](code/package.json) | 스크립트 `"test:types": "tsc -p tsconfig.spec.json"` |
| [code/apps/ticketing/src/reservations/reservations.module.spec.ts](code/apps/ticketing/src/reservations/reservations.module.spec.ts) | AppModule을 통째로 가져오고 PaymentGateway는 FakePaymentGateway로, SmsOutbox는 목 객체로 오버라이드. 테스트마다 `init()`, 끝나면 `close()`. 확정 문자가 발송함에 들어가는지, 환불 쪽 별칭이 같은 페이크를 받는지 확인 |
| [code/apps/ticketing/src/seats/seats.module.spec.ts](code/apps/ticketing/src/seats/seats.module.spec.ts) | SeatsModule을 가져오고 PerformancesService만 스텁으로 오버라이드. `beforeEach`로 테스트마다 새 모듈 |

### 실행 결과

결제사 하나만 받던 시절에 쓴 예매 서비스 테스트(`new ReservationsService(fakeGateway)`)를 지금 생성자(결제사, 로거, 알림 서비스)에 돌렸을 때:

```text
   × 결제사를 실제로 부르지 않고 예매를 시험한다 2ms
TypeError: Cannot read properties of undefined (reading 'setTag')
 ❯ new ReservationsService apps/ticketing/src/reservations/reservations.service.ts:24:17
```

같은 테스트의 타입 검사. 앱 빌드 설정은 `**/*spec.ts`를 빼서 통과하고, `test:types`에서 잡힌다:

```text
$ npx tsc --noEmit -p apps/ticketing/tsconfig.app.json
(출력 없음, exit 0)     ← exclude에 **/*spec.ts

$ npm run test:types      ← tsc -p tsconfig.spec.json
reservations.service.spec.ts(9,19): error TS2554: Expected 3 arguments, but got 1.
reservations.service.spec.ts(11,24): error TS2554: Expected 3-5 arguments, but got 2.
```

테스트 모듈 providers에 예매 서비스와 결제사만 적었을 때. compile 단계에서 빠진 프로바이더의 이름과 위치가 나온다:

```text
Error: Nest can't resolve dependencies of the ReservationsService (PaymentGateway, ?, NotificationsService).
Please make sure that the argument TaggedLogger at index [1] is available in the RootTestModule module.
```

로거는 진짜, 결제사·알림 서비스는 `useValue`로 가짜를 적었을 때:

```text
TaggedLogger #1 생성
[예매] A-3-15 결제 완료 (unknown)
 ✓ 목록에 가짜를 적어서 예매 서비스를 만든다 314ms
```

`imports: [AppModule]`만으로 예매를 시험했을 때. 테스트는 main.ts를 거치지 않아 `.env`가 읽히지 않고, 결제 모듈 팩토리가 compile 중에 결제사로 토큰을 요청한다:

```text
결제 설정: {"mode":"http","timeoutMs":3000}
   × 앱 모듈을 통째로 가져와 예매한다 13ms
TypeError: Failed to parse URL from undefined/token
```

| 환경 | 결과 | 출력 |
|---|---|---|
| PG_URL 없음 | compile 실패 | Failed to parse URL from undefined/token |
| 결제사 꺼짐 | compile 실패 | fetch failed, connect ECONNREFUSED ::1:5032 |
| 결제사 켜짐 | 진짜 결제 | expected 'pg-110000' to be 'fake-110000' |

`overrideProvider(PaymentGateway).useClass(FakePaymentGateway)`를 더한 뒤. 원래 결제 모듈 팩토리를 부르지 않아 "결제 설정" 로그도 토큰 요청도 없고, 나머지는 앱과 같은 순서로 만들어진다:

```text
FakePaymentGateway #1 생성
ConcertsService 생성
TaggedLogger #1 생성
TaggedLogger #2 생성
SeatsService 생성
[예매] A-3-15 결제 완료 (unknown)
 ✓ 결제사만 페이크로 바꾸고 앱 모듈을 통째로 가져온다 146ms
```

compile 뒤에 한 번 예매하고 `init()`을 불렀을 때. compile만 하면 문자 채널이 모이지 않았고, init에서 SmsOutbox가 문자 발송사에 발신번호를 요청하다 실패한다:

```text
compile 뒤: {"id":1,"seatId":"A-3-15","approvalId":"fake-110000","amount":110000,"message":"지원하지 않는 채널: sms"}
 × 결제사만 페이크로 바꾸고 앱 모듈을 통째로 가져온다 178ms
   → fetch failed
 ❯ SmsOutbox.onModuleInit apps/ticketing/src/notifications/sms-outbox.ts:20:17
     20|     const res = await fetch(`${this.baseUrl}/sender`);
```

SmsOutbox도 `useValue({ enqueue: vi.fn() })`로 바꾼 뒤:

```text
compile 뒤: {"id":1,"seatId":"A-3-15","approvalId":"fake-110000","amount":110000,"message":"지원하지 않는 채널: sms"}
알림 채널: email, push, sms
init 뒤: {"id":2,"seatId":"A-3-16","approvalId":"fake-110000","amount":110000,"message":"[문자 → 이지은] A-3-16 예매가 확정되었습니다"}
발송함: [["이지은","A-3-16 예매가 확정되었습니다"]]
```

TRANSIENT 프로바이더(TaggedLogger)를 `moduleRef.get()`으로 꺼냈을 때. `await moduleRef.resolve(TaggedLogger)`를 써야 한다:

```text
TaggedLogger is marked as a scoped provider. Request and transient-scoped providers can't be used in combination with "get()" method. Please, use "resolve()" instead.
```

좌석 모듈 테스트를 `beforeAll`로 한 번만 조립했을 때. 같이 돌리면 앞 테스트가 붙잡은 좌석 때문에 창구 판매가 실패하고("A구역 3열 15번은 이미 팔렸거나 선택된 좌석입니다"), 혼자 돌리면 통과한다:

```text
$ npx vitest run apps/ticketing/src/seats/seats.module
 ✓ SeatsModule > 온라인에서 A-3-15를 붙잡는다 1ms
 × SeatsModule > 현장 창구에서 A-3-15를 판다 2ms

$ npx vitest run apps/ticketing/src/seats/seats.module -t "현장 창구"
 ✓ SeatsModule > 현장 창구에서 A-3-15를 판다 1ms
      Tests  1 passed | 1 skipped (2)
```

`beforeEach`로 바꾼 뒤:

```text
 ✓ SeatsModule > 온라인에서 A-3-15를 붙잡는다 135ms
 ✓ SeatsModule > 현장 창구에서 A-3-15를 판다 2ms
```

이 강의 [code/](code/)에서 `npx vitest run`(전체 실행 시간 1.92s). `npm run test:types`도 에러가 없다:

```text
$ npx vitest run
 ✓ seats.module.spec.ts > SeatsModule > 온라인에서 A-3-15를 붙잡는다 318ms
 ✓ seats.module.spec.ts > SeatsModule > 현장 창구에서 A-3-15를 판다 3ms
 ✓ reservations.module.spec.ts > 예매 모듈 조립 > 결제사와 문자 발송함만 바꾸고 예매하면 확정 문자가 발송함에 들어간다 155ms
 ✓ reservations.module.spec.ts > 예매 모듈 조립 > 환불 쪽 별칭도 같은 페이크를 받는다 4ms
 (… 유닛 테스트 13개)
 Test Files  10 passed (10)
      Tests  17 passed (17)
```

### 해 볼 때 참고

- 낡은 테스트: [31강 끝 코드의 reservations.service.spec.ts](../../part2/lecture31/code/apps/ticketing/src/reservations/reservations.service.spec.ts)를 같은 자리에 덮어쓰고 `npx vitest run`과 `npm run test:types`를 돌린다. 확인 뒤 되돌린다
- AppModule 통째 세 결과: 아래 테스트를 임시 파일로 두고 환경을 바꿔 돌린다. 가짜 결제사 서버 `fake-pg.mjs`는 [18강](../../part2/lecture18/)의 것이다

```ts
it('앱 모듈을 통째로 가져와 예매한다', async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const service = moduleRef.get(ReservationsService);

  const result = await service.reserve('A-3-15', 110000, '김민수');
  expect(result.approvalId).toBe('fake-110000');
});
```

```bash
npx vitest run <임시 파일>                                  # PG_URL 없음
PG_URL=http://localhost:5032 npx vitest run <임시 파일>     # 결제사 꺼짐
PORT=5032 node fake-pg.mjs &                                # 결제사 켬
PG_URL=http://localhost:5032 npx vitest run <임시 파일>
```

- 결제사가 켜진 상태의 셋째 결과는 테스트를 돌릴 때마다 결제사에 실제 결제 요청이 나간다는 뜻이다. 밖으로 나가는 것(결제사, 문자 발송함, 외부 API)은 초기화 훅 안의 호출까지 오버라이드한다
- compile·init 비교, 발송함 오버라이드 전후, TRANSIENT `get()`은 임시 테스트 파일로 확인하고 지운다
- 좌석 모듈 테스트의 `beforeEach`를 `beforeAll`로 바꾸면 같이 돌릴 때만 실패하는 결과가 나온다. 싱글톤 프로바이더의 필드(좌석표)를 같은 테스트 모듈의 모든 테스트가 공유하기 때문이다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| 테스트 패키지 | @nestjs/testing 12.2.0, vitest 4.1.12 | 2026-10-26 |
| TRANSIENT get() 에러 문구 | "... can't be used in combination with "get()" method. Please, use "resolve()" instead." | 2026-10-26 |
| 테스트 모듈 실행 시간 | 파일 첫 테스트 150~320ms, 같은 파일 다음 테스트 2~4ms | 2026-10-26 |
| 전체 실행 | 10 files, 17 passed, Duration 1.92s | 2026-10-26 |
| 오버라이드 API | overrideProvider().useClass/useValue/useFactory, overrideModule().useModule | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 진짜 DB를 붙인 테스트 | [34강](../../part2/lecture34/) |
| HTTP 요청으로 앱 전체를 시험하기 | [35강](../../part2/lecture35/) |
| main.ts의 설정과 테스트 앱 | [35강](../../part2/lecture35/) |
| 결제사와의 약속 확인(컨트랙트 테스트) | 241강 |
| 종료 훅의 순서와 시그널 | 249강 |
| 설정 관리(@nestjs/config) | 244강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.
