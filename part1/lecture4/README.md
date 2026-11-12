# 4강. 이벤트 루프와 논블로킹 I/O

제1부 기반: 백엔드와 Node.js 런타임 · 2장 이벤트 루프와 비동기 I/O

[← 3강](../../part1/lecture3/) | [제1부 목록](../) | [5강 →](../../part1/lecture5/)

## 이번 강의 질문

스레드 하나짜리 Node 서버는 어떻게 요청 수천 개를 받고, 무엇을 하면 한꺼번에 멈추나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |
| [subtitles.vtt](subtitles.vtt) | 자막(WebVTT) |
| [subtitles.srt](subtitles.srt) | 자막(SRT) |

## 실습 자료

### 준비

- Node 22 이상(`import.meta.filename`을 쓴다). Node 내장 모듈만 쓰므로 설치할 패키지가 없다
- [code/](code/)의 파일을 한 폴더에 두고 그 폴더에서 실행한다. 서버 포트는 4004다

```bash
node server.mjs &
node client.mjs /wait 10
node client.mjs /block 10
node health.mjs
node blockers.mjs
node phases.mjs
node lag.mjs        # 리눅스에서 실행
```

### 코드

| 파일 | 내용 |
|---|---|
| [code/server.mjs](code/server.mjs) | 4004번 포트 서버. `/wait`는 타이머로 1초 대기, `/block`은 1초 동안 CPU 계산, `/report`는 2초 계산, `/health`는 바로 `ok` |
| [code/client.mjs](code/client.mjs) | 주어진 경로로 요청 n개를 동시에 보내고 각각 끝난 시각과 전체 시간을 찍는다 |
| [code/health.mjs](code/health.mjs) | `/report`를 보내고 100밀리초 뒤 `/health`를 보내서, 헬스 체크가 얼마나 기다리는지 잰다 |
| [code/blockers.mjs](code/blockers.mjs) | 요청 경로에 흔히 들어가는 동기 코드(JSON 20만 건, pbkdf2Sync, readFileSync, 되돌아가는 정규식)의 시간을 잰다. 실행하면 `big.json`을 만든다 |
| [code/phases.mjs](code/phases.mjs) | I/O 콜백 안에서 건 `setTimeout 0`과 `setImmediate`의 실행 순서 |
| [code/lag.mjs](code/lag.mjs) | `monitorEventLoopDelay`로 한가할 때와 300밀리초 동기 작업이 섞일 때의 루프 지연을 잰다 |

### 실행 결과

`node client.mjs /wait 10`. 열 개가 거의 동시에 끝난다.

```text
#2 done 1060ms
#1 done 1071ms
#3 done 1075ms
...
#8 done 1089ms
#10 done 1090ms
10 requests to /wait: 1090ms
```

`node client.mjs /block 10`. 1초 간격으로 하나씩 끝난다.

```text
#2 done 1040ms
#1 done 2035ms
#4 done 3035ms
#3 done 4036ms
...
#8 done 9036ms
#10 done 10036ms
10 requests to /block: 10036ms
```

`node phases.mjs`.

```text
setImmediate
setTimeout 0
```

`node health.mjs`를 두 번 실행한 결과. `/health`가 정산 계산이 끝날 때까지 약 1.9초 기다린다.

```text
/health  sent at 135ms, took 1901ms
/report  done at 2035ms

/health  sent at 139ms, took 1910ms
/report  done at 2047ms
```

`node blockers.mjs`로 잰 시간(Node v24.11.0, 1회).

| 코드 | 입력 | 걸린 시간 |
|---|---|---|
| JSON.stringify | 예매 내역 20만 건 (18.3MB) | 52ms |
| JSON.parse | 같은 문자열 | 80ms |
| pbkdf2Sync | 반복 60만 회 | 76ms |
| readFileSync | 같은 18.3MB 파일 | 5ms |
| /^(a+)+$/ | a 20개 + ! | 33ms |
| /^(a+)+$/ | a 24개 + ! | 69ms |
| /^(a+)+$/ | a 26개 + ! | 291ms |
| /^(a+)+$/ | a 28개 + ! | 911ms |

`node lag.mjs`로 잰 루프 지연(WSL2 Ubuntu 24.04, Node v22.22.0).

| 상태 | p50 | p99 | max |
|---|---|---|---|
| 3초 동안 한가함 | 1.0ms | 1.3ms | 2.6ms |
| 300ms 동기 작업 6번 섞임 | 1.0ms | 1.7ms | 303.0ms |

### 해 볼 때 참고

- Git Bash에서 `node client.mjs /wait`를 치면 `/wait`가 Windows 경로로 바뀐다. `export MSYS_NO_PATHCONV=1`을 먼저 실행한다
- `lag.mjs`는 리눅스에서 돌린다. Windows에서는 타이머 해상도 때문에 한가할 때도 p50이 15밀리초 안팎으로 나온다
- 루프 지연은 짧은 간격으로 수천 번 재므로 잠깐의 멈춤은 p99에 잘 잡히지 않는다. max를 함께 본다
- 시간은 CPU와 Node 버전에 따라 다르다. 정규식은 a가 두 개 늘 때마다 약 세 배씩 느려지는 경향을 보면 된다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| Node (Windows) | v24.11.0 | 2026-10-26 |
| Node (리눅스) | v22.22.0, WSL2 Ubuntu 24.04, 커널 6.6.87.2 | 2026-10-26 |
| /wait 동시 10개 | 전체 1,090ms (개별 1,060~1,090ms) | 2026-10-26 |
| /block 동시 10개 | 전체 10,036ms (1초 간격 완료) | 2026-10-26 |
| /report 중 /health | 1,901ms, 1,910ms (2회) | 2026-10-26 |
| 동기 코드 | JSON.stringify 20만 건 52ms, JSON.parse 80ms, pbkdf2Sync 60만 회 76ms, readFileSync 18.3MB 5ms | 2026-10-26 |
| 정규식 /^(a+)+$/ | a 20개 33ms, 24개 69ms, 26개 291ms, 28개 911ms | 2026-10-26 |
| monitorEventLoopDelay(resolution 1) | 한가: p50 1.0, p99 1.3, max 2.6ms / 300ms 작업 6회: p50 1.0, p99 1.7, max 303.0ms | 2026-10-26 |
| 요청 본문 크기 기본 제한 | 100kb (Express body-parser의 json limit 기본값) | 2026-10-26 |
| Windows에서 같은 측정 | 한가할 때도 p50 약 15.5ms (Windows 타이머 해상도 영향) | 2026-10-26 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 맡긴 I/O를 실제로 기다리는 쪽 | [5강](../../part1/lecture5/) |
| 마이크로태스크와 nextTick 순서 | [6강](../../part1/lecture6/) |
| 무거운 계산을 루프 밖으로 | [7강](../../part1/lecture7/) |
| 헬스 체크와 프로브 설정 | 251강 |
| 이벤트 루프 지연을 메트릭으로 수집 | 264강, 265강 |
| 정규식 되돌아가기 사고 부검 | 329강 |
| CPU 프로파일링으로 범인 찾기 | 270강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.
