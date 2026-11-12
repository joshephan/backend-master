# 29강. 수명주기 훅

제2부 NestJS 핵심 · 7장 수명주기와 플랫폼

[← 28강](../../part2/lecture28/) | [제2부 목록](../) | [30강 →](../../part2/lecture30/)

## 이번 강의 질문

앱이 뜰 때와 내려갈 때 Nest는 무엇을 어떤 순서로 부르고, 내려가는 그 순간에 처리 중이던 예매는 어떻게 되나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |
| [subtitles.vtt](subtitles.vtt) | 자막(WebVTT) |
| [subtitles.srt](subtitles.srt) | 자막(SRT) |

## 실습 자료

### 준비

- 28강 끝 코드([../../part2/lecture28/code/](../../part2/lecture28/code/))에서 시작한다. 이 강의 [code/](code/)는 이 강이 끝난 시점의 프로젝트 전체다
- 종료 신호 실험은 리눅스 셸에서 한다. Windows에서는 SIGTERM을 보낼 수 없다. 실행 환경은 WSL2 Ubuntu, Node v22.22.0이고, 빌드는 Windows에서 `npx nest build`로 했다
- `code/`에 `.env` 파일을 만든다. main.ts가 `process.loadEnvFile()`로 읽으므로 파일이 없으면 서버가 뜨지 않는다. 내용은 [20강](../../part2/lecture20/)과 같이 `PG_URL=http://localhost:5020`, `PG_TIMEOUT_MS=3000`
- 이 강부터 서버가 뜰 때 SmsOutbox가 문자 발송사에서 발신번호를 받아 온다. 발송사 주소는 `SMS_URL`(기본 `http://localhost:5029/sms`)이고, 응답하는 서버가 없으면 부팅이 멈춘다. 실험에 쓴 가짜 외부 서버는 결제사와 문자 발송사를 한 프로세스(포트 5029)로 흉내 내며 아래처럼 답한다. 같은 동작을 하는 작은 HTTP 서버를 직접 만들어 띄운다

| 요청 | 응답 |
|---|---|
| `POST /token` | `{"accessToken":"tok-123"}` |
| `POST /charge` | `PG_DELAY_MS`만큼 기다린 뒤 `[결제사] 승인 pg-<금액>` 로그, `{"approvalId":"pg-<금액>"}` |
| `GET /sms/sender` | `SENDER_DELAY_MS`(기본 1500)만큼 기다린 뒤 `{"from":"1588-1234"}` |
| `POST /sms/send` | from이 빈 문자가 있으면 400 `발신번호 없음`, 아니면 `[문자] 발송 N건` 로그와 문자마다 한 줄 |

배포 순간 실험의 순서. 가짜 외부 서버를 `PG_DELAY_MS=2500`(결제사 응답 2.5초)으로 띄운다. 앱이 응답하기 시작하면 2초 뒤 R1, 다시 2초 뒤 R2, 다시 2초 뒤 SIGTERM을 보낸다(마지막 두 실험은 SIGTERM 0.3초 뒤 R3도 보낸다). R2는 좌석 A-3-16, 금액 60000, 구매자 010-3333-4444로 보낸다:

```bash
PORT=4029 PG_URL=http://localhost:5029 node dist/apps/ticketing/main.js > app.log 2>&1 & AP=$!
curl -sS -X POST localhost:4029/reservations -H 'content-type: application/json' \
  -d '{"seatId":"A-3-15","amount":50000,"buyer":"010-1111-2222"}' -w '\n[%{http_code}]'
kill -TERM $AP
```

`npm run start`로 띄우면 신호가 npm 프로세스로 가므로, 빌드한 `main.js`를 node로 직접 띄운다.

### 코드

| 파일 | 내용 |
|---|---|
| [code/apps/ticketing/src/notifications/sms-outbox.ts](code/apps/ticketing/src/notifications/sms-outbox.ts) | 확정 문자를 모아 10초마다 한 번에 보내는 SmsOutbox. onModuleInit에서 발신번호 받기, onApplicationBootstrap에서 타이머 시작, onApplicationShutdown에서 타이머를 끄고 남은 문자 보내기. 보내기에 실패한 묶음은 큐 앞에 되돌림 |
| [code/apps/ticketing/src/notifications/sms.sender.ts](code/apps/ticketing/src/notifications/sms.sender.ts) | 문장을 돌려주면서 SmsOutbox 큐에 넣음 |
| [code/apps/ticketing/src/notifications/notifications.module.ts](code/apps/ticketing/src/notifications/notifications.module.ts) | providers에 SmsOutbox 추가 |
| [code/apps/ticketing/src/main.ts](code/apps/ticketing/src/main.ts) | `app.enableShutdownHooks()` |

### 실행 결과

생성자에서 발신번호를 받고 타이머를 거는 처음 코드로 배포 순간을 흉내 냈을 때. R1은 201을 받았지만 큐에 넣은 문자는 발송되지 않았고, R2는 연결이 끊긴 뒤 결제사 승인만 남았다:

```text
14:48:48.627 R1 요청 보냄
14:48:50.629 R2 요청 보냄
14:48:51.325 R1 끝 [201]
  {"id":1,"seatId":"A-3-15",...,"message":"[문자 → 010-1111-2222] A-3-15 예매가 확정되었습니다"}
14:48:52.632 kill -TERM 앱
14:48:52.650 R2 끝
  curl: (52) Empty reply from server
```

가짜 외부 서버 쪽 기록:

```text
14:48:51.313 [결제사] 승인 pg-50000
14:48:53.137 [결제사] 승인 pg-60000
```

AppModule, ReservationsModule, NotificationsModule에 훅마다 로그를 찍는 프로바이더를 넣고, main.ts의 listen 앞뒤에 로그를 찍었을 때의 부팅 순서:

```text
ConcertsService 생성
SeatsService 생성
[InstanceLoader] ... dependencies initialized
listen 호출
NotificationsModule onModuleInit
[SmsOutbox] 발신번호 1588-1234
알림 채널: email, push, sms
ReservationsModule onModuleInit
AppModule onModuleInit
NotificationsModule onApplicationBootstrap
ReservationsModule onApplicationBootstrap
AppModule onApplicationBootstrap
[NestApplication] Nest application successfully started
listen 끝
```

`enableShutdownHooks()`를 켜고 SIGTERM을 보냈을 때의 종료 순서. 모듈 순서는 부팅의 반대다:

```text
$ kill -TERM <앱 프로세스>
AppModule onModuleDestroy
ReservationsModule onModuleDestroy
NotificationsModule onModuleDestroy
AppModule beforeApplicationShutdown(SIGTERM)
ReservationsModule beforeApplicationShutdown(SIGTERM)
NotificationsModule beforeApplicationShutdown(SIGTERM)
AppModule onApplicationShutdown(SIGTERM)
ReservationsModule onApplicationShutdown(SIGTERM)
NotificationsModule onApplicationShutdown(SIGTERM)
```

`enableShutdownHooks()` 없이 SIGTERM을 보냈을 때. 종료 쪽 훅이 하나도 불리지 않는다:

```text
AppModule onApplicationBootstrap
[Nest]  LOG [NestApplication] Nest application successfully started
listen 끝
14:54:51.697 kill -TERM 앱
14:54:51.703 앱 종료
```

생성자에서 발신번호를 받아 올 때(발신번호 응답 1.5초). 발신번호를 받기 전에 들어온 예매의 문자가 from 없이 큐에 들어가 거절된다:

```text
14:50:17.541 앱 응답 시작
14:50:17.542 R1 요청 보냄  → 201
[Nest] 2:50:17 PM  LOG [NestApplication] Nest application successfully started
[Nest] 2:50:18 PM  LOG [SmsOutbox] 발신번호 1588-1234
[Nest] 2:50:27 PM  LOG [SmsOutbox] 문자 1건 보냄: 400
14:50:27.285 [문자] 거절 1건: 발신번호 없음
```

같은 코드에서 발송사가 꺼져 있을 때(가짜 외부 서버 없이 `PAYMENT_MODE=fake`로 띄움). "started" 다음 줄에서 프로세스가 끝난다. 요청을 처리하는 중이 아닌 곳의 실패라 예외 필터도 받지 않는다:

```text
[Nest]  LOG [InstanceLoader] SeatsModule dependencies initialized
알림 채널: email, push, sms
[Nest]  LOG [NestApplication] Nest application successfully started
TypeError: fetch failed
    at async SmsOutbox.loadSender (...)
  [cause]: Error: connect ECONNREFUSED 127.0.0.1:5029
Node.js v22.22.0
```

onModuleInit으로 옮긴 뒤. 발송사가 켜져 있으면 Nest가 발신번호를 기다린 뒤 부팅을 마치고, 꺼져 있으면 "started" 없이 부팅이 멈추고 포트가 열리지 않는다:

```text
[Nest] 3:11:54 PM  LOG [InstanceLoader] SeatsModule dependencies initialized
[Nest] 3:11:58 PM  LOG [SmsOutbox] 발신번호 1588-1234
[Nest] 3:11:58 PM  LOG [NestApplication] Nest application successfully started
15:12:10.281 [문자] 발송 1건
    1588-1234 → 010-1111-2222 "A-3-15 예매가 확정되었습니다"
```

```text
[Nest]  LOG [InstanceLoader] SeatsModule dependencies initialized
TypeError: fetch failed
    at async SmsOutbox.onModuleInit (...)
    at async NestApplication.init (...)
    at async NestApplication.listen (...)
  [cause]: Error: connect ECONNREFUSED 127.0.0.1:5029
```

남은 문자를 onModuleDestroy에서 보냈을 때. 처리 중이던 R2는 201과 확정 메시지를 받았지만, 그 문자는 큐를 비운 뒤에 들어가 발송되지 않았다. 요청 쪽 출력, 앱 로그, 가짜 외부 서버 기록 순서다:

```text
15:12:53.005 R1 요청 보냄
15:12:55.007 R2 요청 보냄
15:12:55.768 R1 끝 [201]
15:12:57.009 kill -TERM 앱
15:12:57.347 R3 끝  curl: (7) Failed to connect to localhost port 4029
15:12:57.543 R2 끝 [201]
  {"id":2,"seatId":"A-3-16",...,"message":"[문자 → 010-3333-4444] A-3-16 예매가 확정되었습니다"}
```

```text
[SmsOutbox] 문자 1건 보냄: 200
[SmsOutbox] onModuleDestroy: 남은 문자 보냄
[예매] A-3-16 결제 완료
```

```text
15:12:57.011 [문자] 발송 1건
    1588-1234 → 010-1111-2222 "A-3-15 예매가 확정되었습니다"
```

onApplicationShutdown으로 옮긴 뒤(이 강의 [code/](code/)). 새 연결(R3)은 거절되고, 처리 중이던 R2까지 끝난 뒤 두 건이 함께 발송된다:

```text
15:13:38.153 R1 요청 보냄
15:13:40.072 R2 요청 보냄
15:13:40.816 R1 끝 [201]
15:13:42.075 kill -TERM 앱
15:13:42.406 R3 끝  curl: (7) Failed to connect to localhost port 4029
15:13:42.589 R2 끝 [201]
```

```text
[예매] A-3-15 결제 완료
[예매] A-3-16 결제 완료
[SmsOutbox] 문자 2건 보냄: 200
[SmsOutbox] onApplicationShutdown(SIGTERM): 남은 문자 보냄
```

```text
15:13:42.583 [결제사] 승인 pg-60000
15:13:42.587 [문자] 발송 2건
    1588-1234 → 010-1111-2222 "A-3-15 예매가 확정되었습니다"
    1588-1234 → 010-3333-4444 "A-3-16 예매가 확정되었습니다"
```

### 해 볼 때 참고

- 생성자에서 받아 오기: SmsOutbox 생성자에서 발신번호를 fetch하는 `this.loadSender()`와 `setInterval(() => this.flush(), 10_000)`을 부르고, onModuleInit·onApplicationBootstrap·onApplicationShutdown을 지운다. main.ts의 `app.enableShutdownHooks()`도 지우면 첫 결과가 나온다
- onModuleDestroy 실험: onApplicationShutdown 대신 onModuleDestroy에서 타이머를 끄고 `flush()`를 부른다. onModuleDestroy는 HTTP 서버를 닫기 전에 불리므로 그 뒤에 끝난 요청의 문자는 남는다
- 훅 로그: 아래 함수가 돌려주는 클래스를 AppModule, ReservationsModule, NotificationsModule의 providers에 하나씩 넣는다(`hookLogger('AppModule')` 등). 확인이 끝나면 지운다

```ts
export function hookLogger(name: string) {
  @Injectable()
  class HookLogger implements OnModuleInit, OnApplicationBootstrap,
    OnModuleDestroy, BeforeApplicationShutdown, OnApplicationShutdown {
    onModuleInit() { console.log(`${name} onModuleInit`); }
    onApplicationBootstrap() { console.log(`${name} onApplicationBootstrap`); }
    onModuleDestroy() { console.log(`${name} onModuleDestroy`); }
    beforeApplicationShutdown(signal?: string) { console.log(`${name} beforeApplicationShutdown(${signal})`); }
    onApplicationShutdown(signal?: string) { console.log(`${name} onApplicationShutdown(${signal})`); }
  }
  return HookLogger;
}
```

- 요청 로그가 켜져 있어서 앱 로그에는 `[HTTP]`·`[Timing]` 줄이 위 결과보다 더 찍힌다
- 종료를 기다리는 시간에도 상한이 있다. docker stop은 리눅스 컨테이너 기본 10초, 쿠버네티스는 기본 30초 뒤 SIGKILL을 보낸다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| NestJS 패키지 | @nestjs/common·core·platform-express 12.2.0 | 2026-10-26 |
| 종료 실험 환경 | WSL2 Ubuntu, Node v22.22.0 (빌드는 Windows에서 nest build, rspack) | 2026-10-26 |
| 종료 순서(코드) | prepareClose → onModuleDestroy → beforeApplicationShutdown → dispose(HTTP 서버 close) → onApplicationShutdown | 2026-10-26 |
| enableShutdownHooks가 기본으로 꺼진 이유, Windows 제약 | 리스너 메모리, 한 프로세스에 앱 여럿이면 경고 / Windows에서 SIGTERM 불가, SIGINT·SIGBREAK 동작 | 2026-10-26 |
| docker stop 유예 시간 | 리눅스 컨테이너 기본 10초 뒤 SIGKILL(Windows 컨테이너 30초), `-t`·`--timeout`으로 변경 | 2026-10-26 |
| 쿠버네티스 유예 시간 | terminationGracePeriodSeconds 기본 30초 | 2026-10-26 |
| 발신번호 사전 등록 | 인터넷으로 보내는 문자는 문자 사업자에 등록한 발신번호로만 발송 (발신번호 거짓표시 방지). 법 조문(제84조의2)에는 '사전 등록'이라는 말이 없고, 그 제6항에 따른 고시에 들어 있음 | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 컨테이너 종료 시그널, 유예 시간과 SIGKILL, 연결 드레인, 재시작 정책 | 249강 |
| 레디니스 프로브로 종료 전 트래픽 빼기 | 251강 |
| 테스트 모듈의 init과 close | [33강](../../part2/lecture33/), [35강](../../part2/lecture35/) |
| 문자 발송 설계 | 178강 |
| 프로세스가 죽어도 문자를 잃지 않기(아웃박스) | 188강 |
| 결제 결과를 모를 때, 멱등성 키 | 214강 |
| 외부 호출 타임아웃 설계 | 210강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.
