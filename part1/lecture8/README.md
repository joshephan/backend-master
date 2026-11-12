# 8강. 싱글 스레드에도 경쟁 상태가 있다 [교정①]

제1부 기반: 백엔드와 Node.js 런타임 · 2장 이벤트 루프와 비동기 I/O

[← 7강](../../part1/lecture7/) | [제1부 목록](../) | [9강 →](../../part1/lecture9/)

## 이번 강의 질문

스레드가 하나인 Node에서 왜 쿠폰이 두 번 쓰이고, 무엇으로 막나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |

## 실습 자료

### 준비

- Node 22 이상. Node 내장 모듈만 쓰므로 설치할 패키지가 없다
- [code/](code/)의 파일을 한 폴더에 두고 그 폴더에서 실행한다. 서버 포트는 4008, 두 번째 서버는 5008이다

서버 한 대에서 동시 요청:

```bash
node coupon-server.mjs &
node fire.mjs "/coupons/use?code=WELCOME-5000" 2
node fire.mjs /seats/sell 100
curl -s localhost:4008/seats
```

프로세스 하나 안에서:

```bash
node nowait.mjs
node atomics.mjs
node fixes.mjs
```

서버 두 대(앞의 `coupon-server.mjs`를 먼저 끈다. 같은 4008번 포트를 쓴다):

```bash
node two-servers.mjs 4008 &
node two-servers.mjs 5008 &
node two-fire.mjs
```

### 코드

| 파일 | 내용 |
|---|---|
| [code/coupon-server.mjs](code/coupon-server.mjs) | 4008번 포트 서버. 쿠폰 사용(`/coupons/use`)과 좌석 판매(`/seats/sell`)가 읽기와 쓰기 사이에 `await`를 둔다. DB 읽기·쓰기는 각각 10밀리초 대기로 흉내 냈다 |
| [code/fire.mjs](code/fire.mjs) | 주어진 경로로 요청 n개를 동시에 보내고 응답별 개수를 센다 |
| [code/nowait.mjs](code/nowait.mjs) | 확인 바로 다음 줄에서 기록해 확인과 기록 사이에 `await`가 없는 쿠폰 사용 |
| [code/atomics.mjs](code/atomics.mjs) | 워커 4개가 `SharedArrayBuffer`의 같은 칸을 1,000만 번씩 더한다. `counter[0]++`와 `Atomics.add` 비교 |
| [code/sync.mjs](code/sync.mjs) | 프로미스로 만든 `Mutex`와 `Semaphore` |
| [code/fixes.mjs](code/fixes.mjs) | 뮤텍스 컨텐션(락 하나 대 쿠폰마다 락, 50건 × 20ms)과 세마포어(5개, 결제 50건 × 100ms) |
| [code/two-servers.mjs](code/two-servers.mjs) | 포트를 받아 뜨는 쿠폰 서버. 데이터는 4008번 프로세스 한 곳에만 있다. `/coupons/use`는 서버마다 뮤텍스, `/coupons/use-atomic`은 데이터 쪽에서 확인과 기록을 한 번에 한다 |
| [code/two-fire.mjs](code/two-fire.mjs) | 같은 쿠폰을 4008번과 5008번 서버에 동시에 보낸다(PC와 폰) |

### 실행 결과

`node fire.mjs "/coupons/use?code=WELCOME-5000" 2`. 같은 쿠폰이 두 번 할인된다.

```text
/coupons/use?code=WELCOME-5000 { '5,000원 할인 적용': 2 }
```

좌석 1,000석에 동시 100건. 100건 모두 성공했는데 남은 좌석은 하나만 줄었다.

```text
$ node fire.mjs "/seats/sell" 100
/seats/sell { ok: 100 }
$ curl -s localhost:4008/seats
999
```

`node nowait.mjs`. 확인과 기록 사이에 `await`가 없으면 한 번만 할인된다.

```text
[ '5,000원 할인 적용', '이미 사용한 쿠폰' ]
```

`node atomics.mjs`를 세 번 실행한 결과(기대값 40,000,000).

| 방식 | 1회차 | 2회차 | 3회차 |
|---|---|---|---|
| counter[0]++ | 18,341,078 | 12,882,442 | 21,134,216 |
| Atomics.add | 40,000,000 | 40,000,000 | 40,000,000 |

쿠폰 사용의 읽기와 쓰기를 뮤텍스로 감싼 결과. 감싼 코드는 아래와 같다.

```js
async function useCoupon() {
  await m.lock();
  try {
    await sleep(10);                 // DB에서 읽기
    if (used) return '이미 사용한 쿠폰';
    await sleep(10);                 // DB에 쓰기
    used = true;
    return '5,000원 할인 적용';
  } finally { m.unlock(); }
}
```

```text
뮤텍스, 동시에 2번: [ '5,000원 할인 적용', '이미 사용한 쿠폰' ]
```

`node fixes.mjs`로 잰 뮤텍스 컨텐션(WSL2, Node v22.22.0).

| 락 | 서로 다른 쿠폰 50건 (임계 구역 20ms) |
|---|---|
| 서버 전체에 락 하나 | 1,012ms |
| 쿠폰 코드마다 락 | 21ms |

`node fixes.mjs`의 세마포어 결과(WSL2, Node v22.22.0).

```text
결제 50건, 세마포어 5: 최대 동시 호출 5, 전체 1003ms
```

`node two-fire.mjs`. 서버마다 뮤텍스를 걸어도 두 번 할인되고, 데이터 쪽에서 확인과 기록을 한 번에 하면 한 번만 할인된다.

```text
--- /coupons/use: PC는 4008번 서버, 폰은 5008번 서버
[4008] 5,000원 할인 적용
[5008] 5,000원 할인 적용
--- /coupons/use-atomic: PC는 4008번 서버, 폰은 5008번 서버
[4008] 5,000원 할인 적용
[5008] 이미 사용한 쿠폰
```

### 해 볼 때 참고

- `coupon-server.mjs`는 쿠폰과 좌석 상태를 메모리에 둔다. 다시 해 보려면 서버를 다시 띄운다
- Git Bash에서는 `/seats/sell` 같은 인자가 Windows 경로로 바뀐다. `export MSYS_NO_PATHCONV=1`을 먼저 실행한다
- 두 서버에 curl 두 개를 백그라운드로 띄우는 방식은 프로세스 시작 시간 차이 때문에 요청이 동시에 도착하지 않아 재현되지 않았다. 그래서 `two-fire.mjs`는 한 프로세스에서 fetch 두 개를 동시에 보낸다
- `atomics.mjs`의 반복을 100만 번으로 줄이면 `counter[0]++`도 4,000,000이 나와 손실이 안 보일 때가 있다
- `fixes.mjs`는 컨텐션과 세마포어만 잰다. 위 뮤텍스 적용 결과의 `useCoupon` 코드는 `fixes.mjs`에 들어 있지 않다
- Windows에서는 타이머 해상도 때문에 컨텐션이 1,546ms 대 31ms, 세마포어 전체가 1,084ms로 나왔다
- 뮤텍스는 그 프로세스 안의 요청만 막는다. NestJS에서는 서비스 필드에 하나 두며(서비스는 기본으로 앱에 하나), 요청마다 새로 만들면 막지 못한다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| Node (Windows) | v24.11.0 | 2026-10-26 |
| Node (리눅스) | v22.22.0, WSL2 Ubuntu 24.04 | 2026-10-26 |
| 쿠폰 동시 2건 | 할인 적용 2건 | 2026-10-26 |
| 좌석 1,000석에 동시 100건 | 100건 ok, 남은 좌석 999 | 2026-10-26 |
| await 없는 확인·기록 | 할인 1건, 이미 사용 1건 | 2026-10-26 |
| 워커 4개 × 1,000만 번 | counter[0]++ 18,341,078 / 12,882,442 / 21,134,216, Atomics.add 40,000,000 (3회) | 2026-10-26 |
| 뮤텍스 컨텐션 | 서로 다른 쿠폰 50건, 임계 구역 20ms: 락 하나 1,012ms, 쿠폰마다 21ms | 2026-10-26 |
| 세마포어 5, 결제 50건(각 100ms) | 최대 동시 5, 전체 1,003ms | 2026-10-26 |
| 서버 두 대(4008, 5008) | 각자 뮤텍스: 할인 2건(2회) / 데이터 쪽 조건부 변경: 할인 1건, 이미 사용 1건(2회) | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| DB에서 다시 보는 갱신 손실 | 74강 |
| 격리 수준이 막는 것과 못 막는 것 | 76강 |
| 비관적 락 | 81강 |
| 조건부 갱신과 낙관적 락 | 82강 |
| 좌석 선점 | 83강, 320강 |
| 분산 락 | 207강, 208강 |
| 멱등성 키 | 214강 |
| 동시성 리밋 설계 | 224강 |
| 같은 캐시 키의 동시 갱신 | 126강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.
