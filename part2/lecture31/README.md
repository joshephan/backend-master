# 31강. 하이브리드 애플리케이션과 스탠드얼론 애플리케이션

제2부 NestJS 핵심 · 7장 수명주기와 플랫폼

[← 30강](../../part2/lecture30/) | [제2부 목록](../) | [32강 →](../../part2/lecture32/)

## 이번 강의 질문

같은 모듈과 서비스를 HTTP 말고 다른 입구로 쓰거나, 아예 입구 없이 한 번 돌리고 끝내야 할 때 Nest 앱을 어떻게 띄우나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |

## 실습 자료

### 준비

- Node 24(실행 환경은 Windows, Node v24.11.0). Docker는 필요 없다
- 30강 끝 코드([../../part2/lecture30/code/](../../part2/lecture30/code/))에서 시작해 `npm install @nestjs/microservices`를 더한다. 이 강의 [code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다
- `code/`에 `.env` 파일을 만든다. main.ts와 reminders.ts가 `process.loadEnvFile()`로 읽으므로 파일이 없으면 뜨지 않는다. 내용은 [20강](../../part2/lecture20/)과 같이 `PG_URL=http://localhost:5020`, `PG_TIMEOUT_MS=3000`
- 문자 발송사가 응답하지 않으면 부팅이 멈춘다. [29강](../../part2/lecture29/)의 가짜 외부 서버를 포트 5031에 먼저 띄운다. 결제사 점검 실험에서는 가짜 결제사가 토큰·결제 요청에 답하지 않게 띄운다
- `code/`에서 `npm install`, `npx nest build && npx nest build reminders`로 서버와 안내 문자 배치를 함께 빌드한다

하이브리드 앱(HTTP 4031, TCP 5131):

```bash
PORT=4031 TCP_PORT=5131 PG_URL=http://localhost:5031 SMS_URL=http://localhost:5031/sms node dist/apps/ticketing/main.js
curl -X POST localhost:4031/reservations -H 'content-type: application/json' \
  -d '{"seatId":"A-3-15","amount":50000,"buyer":"010-1111-2222"}'
TCP_PORT=5131 node scripts/ask-reservation.mjs 1
TCP_PORT=5131 node scripts/ask-reservation.mjs 99
netstat -ano -p tcp | grep -E ":(4031|5131) "
```

안내 문자 배치(스탠드얼론 앱):

```bash
SMS_URL=http://localhost:5031/sms PG_URL=http://localhost:5031 node dist/apps/reminders/reminders.js reminders.json
```

reminders.json:

```json
[
  { "buyer": "010-1111-2222", "seatId": "A-3-15", "startsAt": "19:00" },
  { "buyer": "010-3333-4444", "seatId": "A-3-16", "startsAt": "19:00" },
  { "buyer": "010-5555-6666", "seatId": "B-1-7", "startsAt": "19:00" }
]
```

### 코드

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/main.ts](code/apps/ticketing/src/main.ts) | `connectMicroservice`로 TCP 입구(127.0.0.1, `TCP_PORT`)를 붙이고 `inheritAppConfig: true`. `app.init()` 뒤에 `startAllMicroservices()`, 그다음 `listen` |
| [code/apps/ticketing/src/reservations/reservations.rpc.controller.ts](code/apps/ticketing/src/reservations/reservations.rpc.controller.ts) | `@MessagePattern('reservations.find')` 메시지 핸들러. 없는 예매는 `RpcException({ code: 'RESERVATION_NOT_FOUND', message })` |
| [code/apps/ticketing/src/reservations/reservations.module.ts](code/apps/ticketing/src/reservations/reservations.module.ts) | controllers에 ReservationsRpcController 추가 |
| [code/apps/ticketing/src/reservations/reservations.service.ts](code/apps/ticketing/src/reservations/reservations.service.ts) | Reservation 타입을 export(메시지 핸들러가 씀) |
| [code/apps/ticketing/src/common/timing.interceptor.ts](code/apps/ticketing/src/common/timing.interceptor.ts) | `context.getType()`으로 HTTP일 때만 요청 ID와 상태 코드를 읽음. TCP 메시지는 `rpc`와 `ok`로 기록 |
| [code/apps/ticketing/src/common/problem-details.filter.ts](code/apps/ticketing/src/common/problem-details.filter.ts) | HTTP가 아니면 BaseRpcExceptionFilter에 넘김 |
| [code/apps/ticketing/src/common/domain-error.filter.ts](code/apps/ticketing/src/common/domain-error.filter.ts) | 같은 줄 추가 |
| [code/apps/ticketing/src/reminders.ts](code/apps/ticketing/src/reminders.ts) | 안내 문자 배치. `createApplicationContext(NotificationsModule)`로 필요한 모듈만 띄우고 끝에 `app.close()` |
| [code/apps/ticketing/src/notifications/notifications.service.ts](code/apps/ticketing/src/notifications/notifications.service.ts) | sendReminder: 문자 채널로 "내일 19:00 공연, 좌석 A-3-15" |
| [code/nest-cli.json](code/nest-cli.json) | projects에 reminders 진입점 추가(소스는 예매 앱과 같은 폴더) |
| [code/package.json](code/package.json) | @nestjs/microservices 추가 |
| [code/scripts/ask-reservation.mjs](code/scripts/ask-reservation.mjs) | 다른 서비스를 흉내 낸 TCP 클라이언트. `reservations.find`에 예매 번호를 보냄 |

### 실행 결과

HTTP로 만든 예매를 TCP로 조회했을 때. 같은 프로세스의 같은 ReservationsService 인스턴스라 바로 보인다:

```text
$ curl -X POST localhost:4031/reservations ...
{"id":1,"seatId":"A-3-15","approvalId":"pg-50000","amount":50000,"message":"[문자 → 010-1111-2222] A-3-15 예매가 확정되었습니다"}
$ TCP_PORT=5131 node scripts/ask-reservation.mjs 1
{
  id: 1,
  seatId: 'A-3-15',
  buyer: '010-1111-2222',
  approvalId: 'pg-50000',
  userAgent: 'curl/8.16.0'
}
```

한 프로세스가 입구 두 개를 연다. HTTP 4031은 모든 주소, TCP 5131은 이 컴퓨터 안에서만 듣는다:

```text
  TCP    0.0.0.0:4031           0.0.0.0:0              LISTENING       <프로세스 번호>
  TCP    127.0.0.1:5131         0.0.0.0:0              LISTENING       <프로세스 번호>
```

`app.init()` 없이 `startAllMicroservices()`를 먼저 부르면 TCP 입구가 onModuleInit(발신번호, 알림 채널)보다 먼저 열린다:

```text
[InstanceLoader] ReservationsModule dependencies initialized +0ms
[NestMicroservice] Nest microservice successfully started +4ms
[SmsOutbox] 발신번호 1588-1234
알림 채널: email, push, sms
[NestApplication] Nest application successfully started +7ms
```

`await app.init()`을 먼저 부른 뒤:

```text
[SmsOutbox] 발신번호 1588-1234
알림 채널: email, push, sms
[NestApplication] Nest application successfully started +1ms
[NestMicroservice] Nest microservice successfully started +1ms
```

메시지 핸들러가 NotFoundException을 던질 때와 RpcException을 던질 때 부른 쪽이 받는 것:

```text
$ TCP_PORT=5131 node scripts/ask-reservation.mjs 99
에러: { status: 'error', message: 'Internal server error' }
```

```text
$ TCP_PORT=5131 node scripts/ask-reservation.mjs 99
에러: { code: 'RESERVATION_NOT_FOUND', message: '예매 99번이 없습니다' }
```

전역 설정을 물려받지 않는 기본 상태. TCP로 1번, 99번을 물어도 Timing 줄은 HTTP 요청에만 남는다(getHello는 띄운 뒤 응답을 확인한 요청):

```text
[Timing] 0d0e1920-e516-4a82-940d-8af0483f30e8 AppController.getHello 200 0.4ms
[Timing] 9d7c6779-069a-4ecf-bfd6-556a91b22a92 ReservationsController.reserve 201 19.0ms
```

`inheritAppConfig: true`만 켰을 때. 핸들러는 1번을 찾지만 인터셉터가 시간을 찍는 줄에서 TypeError가 나고, 같이 물려받은 ProblemDetailsFilter가 HTTP 응답을 만들다 깨진다:

```text
$ TCP_PORT=5131 node scripts/ask-reservation.mjs 1
에러: {}
$ TCP_PORT=5131 node scripts/ask-reservation.mjs 99
에러: {}
```

```text
ERROR [ProblemDetails] TypeError: Cannot read properties of undefined (reading 'x-request-id')
    at done (.../dist/apps/ticketing/main.js)
    at Object.next (.../dist/apps/ticketing/main.js)
```

TimingInterceptor를 getType으로 나눈 뒤. 1번은 돌아오지만, 99번은 모든 예외를 받는 ProblemDetailsFilter가 RpcException까지 받아 여전히 빈 에러다:

```text
$ TCP_PORT=5131 node scripts/ask-reservation.mjs 1
{
  id: 1,
  seatId: 'A-3-15',
  buyer: '010-1111-2222',
  approvalId: 'pg-50000',
  userAgent: 'curl/8.16.0'
}
$ TCP_PORT=5131 node scripts/ask-reservation.mjs 99
에러: {}
```

```text
[Timing] rpc ReservationsRpcController.find ok 0.3ms
[Timing] rpc ReservationsRpcController.find 실패(RpcException) 0.4ms
```

두 필터도 getType으로 나눈 뒤(이 강의 [code/](code/)):

```text
$ TCP_PORT=5131 node scripts/ask-reservation.mjs 99
에러: { code: 'RESERVATION_NOT_FOUND', message: '예매 99번이 없습니다' }
[Timing] rpc ReservationsRpcController.find 실패(RpcException) 0.3ms
```

안내 문자 배치. HTTP 포트 없이 수명주기 훅은 그대로 돌고, `close`로 끝내서 onApplicationShutdown의 signal은 undefined다. 배치 출력과 가짜 외부 서버 기록:

```text
15:07:23.739 $ node dist/apps/reminders/reminders.js reminders.json
[InstanceLoader] DiscoveryModule dependencies initialized +15ms
[InstanceLoader] NotificationsModule dependencies initialized +0ms
[SmsOutbox] 발신번호 1588-1234
알림 채널: email, push, sms
안내 문자 3건 접수
[SmsOutbox] 문자 3건 보냄: 200
[SmsOutbox] onApplicationShutdown(undefined): 남은 문자 보냄
15:07:24.950 종료
```

```text
15:07:24.881 [문자] 발송 3건
    1588-1234 → 010-1111-2222 "내일 19:00 공연, 좌석 A-3-15"
    1588-1234 → 010-3333-4444 "내일 19:00 공연, 좌석 A-3-16"
    1588-1234 → 010-5555-6666 "내일 19:00 공연, 좌석 B-1-7"
```

배치를 AppModule로 띄우고, 가짜 결제사가 토큰 요청에 답하지 않게(점검 흉내) 했을 때. 결제 모듈이 부팅 때 토큰을 받다 3초 제한에 걸려 문자는 한 건도 나가지 않는다:

```text
15:08:00.301 $ node dist/apps/reminders/reminders.js reminders.json
결제 설정: {"mode":"http","baseUrl":"http://localhost:5031","timeoutMs":3000}
[Nest] 오후 3:08:01  LOG [InstanceLoader] SeatsModule dependencies initialized +9ms
[Nest] 오후 3:08:04  ERROR [ExceptionHandler] DOMException [TimeoutError]: The operation was aborted due to timeout
15:08:04.141 종료
```

같은 배치에서 서버가 만든 예매 1번을 꺼내 보면 없다. 스탠드얼론 앱은 서버와 다른 프로세스, 다른 메모리다:

```text
$ curl -X POST localhost:4031/reservations ...
{"id":1,"seatId":"A-3-15",...}
15:08:06.188 $ node dist/apps/reminders/reminders.js reminders.json
예매 1번: undefined
안내 문자 3건 접수
```

마지막 줄 `await app.close()`를 지운 배치를 `timeout 15`로 돌렸을 때. 문자는 10초 타이머가 보내고, 타이머가 살아 있어 프로세스가 끝나지 않는다:

```text
15:07:30.541 $ node dist/apps/reminders/reminders.js reminders.json
[SmsOutbox] 발신번호 1588-1234
안내 문자 3건 접수
[Nest] 오후 3:07:41  LOG [SmsOutbox] 문자 3건 보냄: 200
15:07:45.675 종료 (timeout 15초가 끊음)
```

| | close 없음 | close 있음 |
|---|---|---|
| 끝나는 시각 | 15초 뒤 외부에서 끊음 | 1.2초 |
| 문자 발송 | 10초 타이머 | onApplicationShutdown |
| 타이머 | 살아 있음 | clearInterval |

### 해 볼 때 참고

아래 실험 코드는 [code/](code/)에 없다. 직접 바꿔 보고 되돌린다.

- 훅보다 먼저 열린 TCP 입구: main.ts에서 `await app.init();` 줄을 지운다
- HTTP 예외: 메시지 핸들러의 RpcException을 ``throw new NotFoundException(`예매 ${id}번이 없습니다`)``로 바꾼다
- 전역 설정: `connectMicroservice`의 두 번째 인자 `{ inheritAppConfig: true }`를 빼면 Timing 줄이 TCP 메시지에 남지 않는다. 다시 켜고 TimingInterceptor와 두 필터를 `getType()`으로 나누기 전 코드로 돌리면 위의 `에러: {}`가 나온다
- AppModule로 띄운 배치: reminders.ts를 아래처럼 바꾸고 `npx nest build reminders`로 다시 빌드한다

```ts
const app = await NestFactory.createApplicationContext(AppModule);
console.log('예매 1번:', app.get(ReservationsService).findOne(1));
const notifications = app.get(NotificationsService);
```

- close 없는 배치: reminders.ts의 마지막 줄 `await app.close()`를 지우고 `timeout 15 node dist/apps/reminders/reminders.js reminders.json`으로 돌린다. 중간에 에러가 나도 close가 불리게 하려면 try finally로 감싼다(예: 깨진 예매 목록 파일의 JSON.parse 에러)
- `--os` 같은 npm 설정을 바꿔 둔 PC라면 `npm install @nestjs/microservices`에도 지금 운영체제를 적는다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| NestJS 패키지 | @nestjs/core·common·microservices 12.2.0 | 2026-10-26 |
| 시연 환경 | Windows, Node v24.11.0, HTTP 4031, TCP 5131, 가짜 외부 서버 5031 | 2026-10-26 |
| 하이브리드 전역 설정 | `connectMicroservice(options, { inheritAppConfig })`, 기본은 새 ApplicationConfig | 2026-10-26 |
| 하이브리드의 init | connectMicroservice가 마이크로서비스 쪽 init을 끝난 것으로 표시, 훅은 앱의 init(listen 안)에서 | 2026-10-26 |
| 트랜스포트 종류 | TCP, Redis, NATS, MQTT, gRPC, RabbitMQ, Kafka | 2026-10-26 |
| 스탠드얼론 앱 | `NestFactory.createApplicationContext`, `app.get`, `app.close` | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 트랜스포트 비교, ClientsModule로 다른 서비스 부르기 | 240강 |
| 정해진 시각에 배치 돌리기(크론, 크론잡) | 177강, 250강 |
| 서비스를 나누는 기준 | 234강 |
| 서버 여러 대와 프로세스 메모리 | 281강 |
| 서버리스와 콜드 스타트 | 255강 |
| 문자 발송 설계 | 178강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.
