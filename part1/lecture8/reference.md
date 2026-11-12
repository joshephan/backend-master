# 8강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| Node (Windows) | v24.11.0, Windows 11, AMD Ryzen 7 9800X3D | `node -v` | 2026-10-26 |
| Node (리눅스) | v22.22.0, WSL2 Ubuntu 24.04 | `node -v` | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다. 뮤텍스 컨텐션과 세마포어는 리눅스, 나머지는 Windows에서 실행했다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| Node (Windows) | 강사 PC, Windows 11, AMD Ryzen 7 9800X3D | 2026-10-26 |
| Node (리눅스) | 같은 PC의 WSL | 2026-10-26 |
| 쿠폰 동시 2건 | Windows 실측 | 2026-10-26 |
| 좌석 1,000석에 동시 100건 | Windows 실측 | 2026-10-26 |
| await 없는 확인·기록 | Windows 실측 | 2026-10-26 |
| 워커 4개 × 1,000만 번 | Windows 실측. 100만 번씩일 때는 4,000,000과 3,701,772로 손실이 안 보일 때도 있음 | 2026-10-26 |
| 뮤텍스 컨텐션 | WSL 실측(윈도우 1,546ms 대 31ms) | 2026-10-26 |
| 세마포어 5, 결제 50건(각 100ms) | WSL 실측(윈도우 1,084ms) | 2026-10-26 |
| 서버 두 대(4008, 5008) | Windows 실측 | 2026-10-26 |

## 참고 자료

- Node.js 문서, Worker threads(`SharedArrayBuffer`와 `workerData`): https://nodejs.org/api/worker_threads.html
- MDN, `Atomics`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics
- MDN, `SharedArrayBuffer`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer
- NestJS 문서, Injection scopes(프로바이더는 기본으로 앱에 하나): https://docs.nestjs.com/fundamentals/injection-scopes
