# 7강. CPU 바운드와 워커 스레드

제1부 기반: 백엔드와 Node.js 런타임 · 2장 이벤트 루프와 비동기 I/O

[← 6강](../../part1/lecture6/) | [제1부 목록](../) | [8강 →](../../part1/lecture8/)

## 이번 강의 질문

계산이 무거운 작업은 이벤트 루프 밖 어디로 보내고, 보낼 때 무엇을 치르나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |
| [subtitles.vtt](subtitles.vtt) | 자막(WebVTT) |
| [subtitles.srt](subtitles.srt) | 자막(SRT) |

## 실습 자료

### 준비

- Node 22 이상. Node 내장 모듈만 쓰므로 설치할 패키지가 없다
- [code/](code/)의 파일을 한 폴더에 두고 그 폴더에서 실행한다. 서버 포트는 4007이다

```bash
node server.mjs &
node probe.mjs /report
node probe.mjs /report-worker
node cost.mjs
```

리포트 건수는 환경 변수 `COUNT`로 바꿀 수 있다(기본 2천만 건, 예: `COUNT=10000000 node server.mjs`).

### 코드

| 파일 | 내용 |
|---|---|
| [code/report.mjs](code/report.mjs) | 예매 건을 구역별로 모아 합계와 상위 금액을 내는 `buildReport`. 같은 결과가 나오도록 난수 씨앗을 고정했다 |
| [code/report-worker.mjs](code/report-worker.mjs) | 받은 건수로 `buildReport`를 돌려 결과를 돌려주는 워커 |
| [code/server.mjs](code/server.mjs) | 4007번 포트 서버. `/report`는 메인 스레드에서, `/report-worker`는 워커에서 리포트를 만든다. `/health`는 바로 `ok` |
| [code/probe.mjs](code/probe.mjs) | 리포트 요청을 보내고 그동안 `/health`를 200밀리초 간격으로 다섯 번 보내 응답 시간을 잰다 |
| [code/cost.mjs](code/cost.mjs) | 워커 생성부터 첫 답까지 걸리는 시간(10회), 워커 0·10·50개일 때 RSS, 100MB `ArrayBuffer`의 복사와 transfer |
| [code/pool.mjs](code/pool.mjs) | 빈 워커가 없으면 작업을 줄 세우는 `WorkerPool` 클래스 |

`cost.mjs`는 같은 폴더의 `echo-worker.mjs`를 띄운다. 이 워커는 `'ping'`을 받으면 `'pong'`, 그 밖의 메시지에는 `'got'`으로 답하면 된다. 강의 자료에 이 파일의 코드는 따로 없으니 직접 만든다.

`pool.mjs`는 `WorkerPool` 클래스만 담았다(파일 맨 위 `Worker` import 한 줄만 더했다). 측정에 쓴 `close()`와 실행 코드(풀 4개에 1천만 건 리포트 8개)는 강의 자료에 없다. `new WorkerPool(new URL('./report-worker.mjs', import.meta.url), 4)`로 풀을 만들고 `run(10_000_000)`을 여덟 번 부르면 같은 상황을 만들 수 있다.

### 실행 결과

`buildReport(20_000_000)`을 메인 스레드에서 한 번 돌린 시간.

```text
buildReport 2천만 건 1375ms
```

`node probe.mjs /report`. 리포트를 만드는 동안 첫 `/health`가 1.4초 기다린다.

```text
/report 응답: 1585ms
그동안 /health 다섯 번: 1439, 2, 2, 3, 2ms
```

`node probe.mjs /report-worker`. 리포트를 워커로 옮기면 `/health`가 바로 답한다.

```text
그동안 /health 다섯 번: 12, 6, 2, 1, 1ms
/report-worker 응답: 1282ms
```

`process.cpuUsage`로 걸린 시간과 CPU 사용 시간을 비교한 결과. 잰 방법은 아래 코드와 같다.

```js
const c0 = process.cpuUsage(); const t0 = performance.now();
await fn();
const c = process.cpuUsage(c0);
// c.user + c.system: 마이크로초
```

```text
DB 응답 200ms 기다리기: 걸린 시간 214ms, CPU 사용 0ms
비밀번호 해시 (pbkdf2Sync 200만 회): 걸린 시간 203ms, CPU 사용 203ms
```

`node cost.mjs`의 워커 생성 시간과 100MB 전달.

```text
워커 생성부터 첫 답까지: 중앙값 20.4ms (10회, 최소 16.9, 최대 30.8)
100MB 복사: 28.7ms, 보낸 뒤 메인 쪽 byteLength 104857600
100MB 이전(transfer): 1.2ms, 보낸 뒤 메인 쪽 byteLength 0
```

`node cost.mjs`로 잰 워커 수별 프로세스 메모리.

| 띄워 둔 워커 | 프로세스 메모리(RSS) |
|---|---|
| 0개 | 66MB |
| 10개 | 174MB |
| 50개 | 625MB |

워커 풀 4개에 1천만 건 리포트 8개를 넣은 결과. 넷씩 나뉘어 끝난다.

```text
이 PC의 availableParallelism(): 16
리포트 #2 끝: 789ms
리포트 #3 끝: 835ms
리포트 #4 끝: 835ms
리포트 #1 끝: 901ms
리포트 #5 끝: 1630ms
리포트 #7 끝: 1638ms
리포트 #6 끝: 1648ms
리포트 #8 끝: 1706ms
RSS 187MB
```

### 해 볼 때 참고

- `server.mjs`의 `inWorker`는 요청마다 워커를 새로 만든다. 워커 하나에 약 11MB가 들므로 리포트 요청이 동시에 50개 오면 워커도 50개가 된다. 풀로 개수를 묶는 이유다
- `pool.mjs`는 에러 처리가 없다. 실제로 쓸 때는 워커의 `'error'`, `'exit'` 이벤트에서 그 작업의 reject를 부르고, 죽은 워커 대신 새 워커를 만들어 `#idle`에 넣는다. 작업마다 시간 제한을 두고 넘으면 그 워커를 terminate한다. 운영에서는 piscina 같은 워커 풀 라이브러리를 쓰는 방법도 있다
- `postMessage`는 값을 복사한다. 큰 데이터는 넘기지 말고 조건(공연 ID, 기간 등)만 넘겨 워커가 직접 조회하게 한다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| Node | v24.11.0, availableParallelism 16 | 2026-10-26 |
| buildReport 2천만 건 | 1,375ms | 2026-10-26 |
| bcrypt 패키지 비동기 함수 | 스레드 풀에서 계산(Napi::AsyncWorker) | 2026-10-26 |
| /report 중 /health | 1,439, 2, 2, 3, 2ms (/report 1,585ms) | 2026-10-26 |
| /report-worker 중 /health | 12, 6, 2, 1, 1ms (/report-worker 1,282ms) | 2026-10-26 |
| cpuUsage | 200ms 대기: 걸린 214ms, CPU 0ms / pbkdf2Sync 200만 회: 203ms, 203ms | 2026-10-26 |
| 워커 생성부터 첫 답 | 중앙값 20.4ms (10회, 16.9~30.8ms) | 2026-10-26 |
| 워커 수와 RSS | 0개 66MB, 10개 174MB, 50개 625MB | 2026-10-26 |
| 100MB postMessage | 복사 28.7ms, transfer 1.2ms | 2026-10-26 |
| 워커 풀 4개, 리포트(1천만 건) 8개 | 첫 넷 789~901ms, 다음 넷 1,630~1,706ms, RSS 187MB | 2026-10-26 |
| 워커 풀 라이브러리 예 | piscina | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 공유 메모리와 Atomics | [8강](../../part1/lecture8/) |
| 빈 워커를 기다리는 줄의 일반형(조건 변수) | [8강](../../part1/lecture8/) |
| 작업 큐와 작업 프로세스 | 174강, 177강 |
| 비밀번호 해시 설계 | 138강 |
| 컨테이너 메모리 한도와 OOM | 273강 |
| CPU 프로파일링 | 270강 |
| 프로세스 여러 개로 늘리기 | 281강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.
