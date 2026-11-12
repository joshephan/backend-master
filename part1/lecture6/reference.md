# 6강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node (Windows) | v24.11.0 | `node -v` | 2026-10-26 |
| Node (리눅스) | v22.22.0, WSL2 Ubuntu 24.04 | `node -v` | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다. `seqall.mjs`는 리눅스, 나머지는 Windows에서 실행했다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| Node (Windows) | 강사 PC | 2026-10-26 |
| Node (리눅스) | 같은 PC의 WSL | 2026-10-26 |
| 일곱 줄 퀴즈 CJS | Windows 실측 3회 | 2026-10-26 |
| 일곱 줄 퀴즈 ESM | Windows 실측 3회 | 2026-10-26 |
| ESM에서 nextTick 순서 | Node 공식 문서 process.nextTick() vs queueMicrotask() | 2026-10-26 |
| 서류 세 개 | Windows 실측 | 2026-10-26 |
| 마이크로태스크 500만 개 | Windows 실측 | 2026-10-26 |
| unhandled rejection 기본 동작 | Node 공식 문서 --unhandled-rejections https://nodejs.org/api/cli.html#--unhandled-rejectionsmode (v15.0.0: Changed default mode to throw) (확인 2026-10-26) | 2026-10-26 |
| 린트 규칙 | https://typescript-eslint.io/rules/no-floating-promises/ , https://typescript-eslint.io/rules/no-misused-promises/ (확인 2026-10-26) | 2026-10-26 |
| for...of 대 Promise.all | WSL 실측(윈도우는 타이머 해상도로 1,554ms 대 30ms) | 2026-10-26 |

## 참고 자료

- Node.js 문서, The Node.js Event Loop: https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick
- Node.js 문서, process `process.nextTick()`과 `queueMicrotask()` 비교: https://nodejs.org/api/process.html#when-to-use-queuemicrotask-vs-processnexttick
- Node.js 문서, CLI `--unhandled-rejections`: https://nodejs.org/api/cli.html#--unhandled-rejectionsmode
- MDN, Using promises: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
- MDN, `Promise.all()`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
- MDN, `Promise.allSettled()`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
- typescript-eslint, no-floating-promises: https://typescript-eslint.io/rules/no-floating-promises/
- typescript-eslint, no-misused-promises: https://typescript-eslint.io/rules/no-misused-promises/
