# 7강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node | v24.11.0 | `node -v` | 2026-10-26 |
| 운영체제와 CPU | Windows 11, AMD Ryzen 7 9800X3D | 시스템 정보 | 2026-10-26 |
| availableParallelism | 16 | `os.availableParallelism()` | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| Node | 강사 PC, Windows 11, AMD Ryzen 7 9800X3D | 2026-10-26 |
| buildReport 2천만 건 | 실측 | 2026-10-26 |
| bcrypt 패키지 비동기 함수 | https://github.com/kelektiv/node.bcrypt.js (README "The async version uses a thread pool", src/bcrypt_node.cc) (확인 2026-10-26) | 2026-10-26 |
| /report 중 /health | 실측 | 2026-10-26 |
| /report-worker 중 /health | 실측 | 2026-10-26 |
| cpuUsage | 실측 | 2026-10-26 |
| 워커 생성부터 첫 답 | 실측 | 2026-10-26 |
| 워커 수와 RSS | 실측 | 2026-10-26 |
| 100MB postMessage | 실측 | 2026-10-26 |
| 워커 풀 4개, 리포트(1천만 건) 8개 | 실측 | 2026-10-26 |
| 워커 풀 라이브러리 예 | npm | 2026-10-26 |

## 참고 자료

- Node.js 문서, Worker threads: https://nodejs.org/api/worker_threads.html
- Node.js 문서, `process.cpuUsage()`: https://nodejs.org/api/process.html#processcpuusagepreviousvalue
- Node.js 문서, `os.availableParallelism()`: https://nodejs.org/api/os.html#osavailableparallelism
- Node.js 문서, Don't Block the Event Loop (or the Worker Pool): https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop
- MDN, Structured clone algorithm: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
- piscina(워커 풀 라이브러리): https://github.com/piscinajs/piscina
