# 6강. 콜백, 프로미스, async/await의 실행 순서

제1부 기반: 백엔드와 Node.js 런타임 · 2장 이벤트 루프와 비동기 I/O

[← 5강](../../part1/lecture5/) | [제1부 목록](../) | [7강 →](../../part1/lecture7/)

## 이번 강의 질문

비동기 코드는 어떤 순서로 실행되고, 그 순서를 잘못 믿으면 서버에서 무슨 일이 생기나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |

## 실습 자료

### 준비

- Node 22 이상. Node 내장 기능만 쓰므로 설치할 패키지가 없다
- [code/](code/)의 파일을 한 폴더에 두고 그 폴더에서 실행한다. 일곱 줄 퀴즈는 같은 내용을 확장자만 바꿔 `order.cjs`(CommonJS)와 `order.mjs`(ES 모듈) 두 파일로 두었다

```bash
node order.cjs; node order.cjs; node order.cjs
node order.mjs; node order.mjs; node order.mjs
node finish.cjs
node asyncorder.mjs
node starve.mjs
node foreach.mjs
node crash.mjs; echo "exit code $?"
node seqall.mjs
```

### 코드

| 파일 | 내용 |
|---|---|
| [code/order.cjs](code/order.cjs) | 일곱 줄 퀴즈: 동기 코드, `setTimeout 0`, `setImmediate`, `Promise.then`, `process.nextTick`, `queueMicrotask`의 순서(CommonJS) |
| [code/order.mjs](code/order.mjs) | 같은 일곱 줄(ES 모듈) |
| [code/finish.cjs](code/finish.cjs) | 300·100·200밀리초짜리 서류 세 개를 콜백으로 처리. 콜백이 끝난 순서대로 불린다 |
| [code/asyncorder.mjs](code/asyncorder.mjs) | async 함수 안의 `await` 앞뒤 줄이 실행되는 순서 |
| [code/starve.mjs](code/starve.mjs) | 마이크로태스크 500만 개가 이어지는 동안 `setTimeout 0`이 기다리는 시간 |
| [code/foreach.mjs](code/foreach.mjs) | `forEach(async ...)`가 저장을 기다리지 않고 먼저 반환하는 예 |
| [code/crash.mjs](code/crash.mjs) | `forEach(async ...)` 안의 거부를 try/catch가 잡지 못해 프로세스가 종료되는 예 |
| [code/seqall.mjs](code/seqall.mjs) | 20밀리초짜리 조회 50번을 `for...of` 안의 `await`와 `Promise.all`로 비교 |

### 실행 결과

`node order.cjs`. 세 번 중 한 번은 2와 3의 순서가 뒤바뀌었다.

```text
1 동기 코드
7 동기 코드
5 process.nextTick
4 Promise.then
6 queueMicrotask
2 setTimeout 0
3 setImmediate
```

`node order.mjs`. 세 번 모두 같았다. ES 모듈은 비동기로 실행되어 마이크로태스크가 nextTick보다 먼저 돈다.

```text
1 동기 코드
7 동기 코드
4 Promise.then
6 queueMicrotask
5 process.nextTick
3 setImmediate
2 setTimeout 0
```

`node finish.cjs`.

```text
접수 끝
110ms 서류 B (100ms) 완료
202ms 서류 C (200ms) 완료
311ms 서류 A (300ms) 완료
```

`node asyncorder.mjs`.

```text
1 호출 전
2 reserve 시작
3 호출 뒤
4 await 다음 줄
```

`node starve.mjs`.

```text
마이크로태스크 5000000개 끝: 867ms
setTimeout 0 실행: 924ms
```

`node foreach.mjs`.

```text
저장 완료, DB에 0건
100ms 뒤 DB에 3건
```

`node crash.mjs; echo "exit code $?"`. `저장 완료`를 돌려준 뒤 처리되지 않은 거부로 프로세스가 끝난다.

```text
저장 완료
서버는 아직 살아 있음
Error: 이미 팔린 좌석: A-3-16
Node.js v24.11.0
exit code 1
```

`node seqall.mjs`로 잰 시간(WSL2, Node v22.22.0).

| 방식 | 좌석 조회 50번 (각 20ms) |
|---|---|
| for...of 안에서 await | 1,008ms |
| Promise.all | 20ms |

### 해 볼 때 참고

- `foreach.mjs`의 `reserveSeats`를 아래처럼 `for...of`로 바꾸면 저장을 하나씩 기다린 뒤 반환하고, 출력이 `저장 완료, DB에 3건`이 된다

```js
async function reserveSeats(seats) {
  for (const seat of seats) await save(seat);
  return `저장 완료, DB에 ${db.length}건`;
}
```

- `crash.mjs`의 try/catch는 그 함수 안에서 `await`한 것만 잡는다. Node 15부터 처리되지 않은 프로미스 거부는 프로세스를 종료시키므로, 서버라면 다른 고객의 요청까지 끊긴다
- 이런 실수는 typescript-eslint의 `no-floating-promises`, `no-misused-promises` 규칙으로 미리 잡을 수 있다
- Windows에서는 타이머 해상도 때문에 `seqall.mjs`가 1,554ms 대 30ms로 나왔다
- `Promise.all`로 한꺼번에 보내는 쿼리도 커넥션 풀 앞에서는 줄을 선다. 서로 상관없는 일만 한꺼번에 보내고, 동시에 보낼 개수는 따로 제한한다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| Node (Windows) | v24.11.0 | 2026-10-26 |
| Node (리눅스) | v22.22.0, WSL2 Ubuntu 24.04 | 2026-10-26 |
| 일곱 줄 퀴즈 CJS | 1, 7, 5, 4, 6, 2, 3 (2와 3은 세 번 중 한 번 뒤바뀜) | 2026-10-26 |
| 일곱 줄 퀴즈 ESM | 1, 7, 4, 6, 5, 3, 2 (3회 동일) | 2026-10-26 |
| ESM에서 nextTick 순서 | ES 모듈은 비동기로 실행되어 마이크로태스크가 nextTick보다 먼저 | 2026-10-26 |
| 서류 세 개 | B 110ms, C 202ms, A 311ms | 2026-10-26 |
| 마이크로태스크 500만 개 | 867ms, setTimeout 0 924ms | 2026-10-26 |
| unhandled rejection 기본 동작 | 프로세스 종료(throw 모드, Node 15부터) | 2026-10-26 |
| 린트 규칙 | typescript-eslint no-floating-promises(처리 안 한 프로미스), no-misused-promises(checksVoidReturn: forEach(async ...) 같은 곳) | 2026-10-26 |
| for...of 대 Promise.all | 50번 × 20ms: 1,008ms 대 20ms | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| await 사이에 끼어드는 다른 요청과 경쟁 상태 | [8강](../../part1/lecture8/) |
| 동시에 보낼 개수 제한 | [8강](../../part1/lecture8/), 224강 |
| 커넥션 풀 크기 설정 | 70강 |
| 외부 API 호출의 타임아웃과 취소 | 210강 |
| NestJS 예외 필터에서 비동기 에러 처리 | [27강](../../part2/lecture27/) |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.
