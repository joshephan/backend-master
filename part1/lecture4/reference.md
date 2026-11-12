# 4강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node (Windows) | v24.11.0, Windows 11, AMD Ryzen 7 9800X3D | `node -v` | 2026-10-26 |
| Node (리눅스) | v22.22.0, WSL2 Ubuntu 24.04, 커널 6.6.87.2 | `node -v`, `uname -r` | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다. 루프 지연(`lag.mjs`)은 리눅스, 나머지는 Windows에서 쟀다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| Node (Windows) | 강사 PC, Windows 11, AMD Ryzen 7 9800X3D | 2026-10-26 |
| Node (리눅스) | 같은 PC의 WSL | 2026-10-26 |
| /wait 동시 10개 | 실측 | 2026-10-26 |
| /block 동시 10개 | 실측 | 2026-10-26 |
| /report 중 /health | 실측 | 2026-10-26 |
| 동기 코드 | 실측 1회 | 2026-10-26 |
| 정규식 /^(a+)+$/ | 실측 1회 | 2026-10-26 |
| monitorEventLoopDelay(resolution 1) | WSL 실측 | 2026-10-26 |
| 요청 본문 크기 기본 제한 | body-parser README https://github.com/expressjs/body-parser#limit , 설치본 body-parser/lib/utils.js `102400 // 100kb default` (확인 2026-10-26) | 2026-10-26 |
| Windows에서 같은 측정 | 실측. 강의에는 리눅스 값 사용 | 2026-10-26 |

## 참고 자료

- Node.js 문서, The Node.js Event Loop: https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick
- Node.js 문서, Don't Block the Event Loop (or the Worker Pool): https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop
- Node.js 문서, Overview of Blocking vs Non-Blocking: https://nodejs.org/en/learn/asynchronous-work/overview-of-blocking-vs-non-blocking
- Node.js 문서, perf_hooks `monitorEventLoopDelay`: https://nodejs.org/api/perf_hooks.html#perf_hooksmonitoreventloopdelayoptions
- Node.js 문서, Timers(`setTimeout`, `setImmediate`): https://nodejs.org/api/timers.html
- body-parser README, `limit` 옵션: https://github.com/expressjs/body-parser#limit
