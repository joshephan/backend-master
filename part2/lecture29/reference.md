# 29강 출처

## 도구와 실행 환경

| 항목 | 값 | 확인 방법 | 기준일 |
|---|---|---|---|
| NestJS 패키지 | @nestjs/common·core·platform-express 12.2.0 | npm ls | 2026-10-26 |
| 종료 실험 환경 | WSL2 Ubuntu, Node v22.22.0 | node -v | 2026-10-26 |
| 빌드 | Windows에서 nest build(rspack) | nest-cli.json | 2026-10-26 |

부록의 실행 결과는 위 환경에서 직접 실행한 출력이다.

## 데이터 출처

| 항목 | 출처 | 기준일 |
|---|---|---|
| NestJS 패키지 | 실습 프로젝트 npm ls | 2026-10-26 |
| 종료 실험 환경 | 실습 환경 | 2026-10-26 |
| 종료 순서(코드) | node_modules/@nestjs/core/nest-application-context.js `runShutdownSequence` | 2026-10-26 |
| enableShutdownHooks가 기본으로 꺼진 이유, Windows 제약 | docs.nestjs.com, Fundamentals > Lifecycle events https://docs.nestjs.com/fundamentals/lifecycle-events#application-shutdown (확인 2026-10-26) | 2026-10-26 |
| docker stop 유예 시간 | Docker 문서, docker container stop https://docs.docker.com/reference/cli/docker/container/stop/ (확인 2026-10-26) | 2026-10-26 |
| 쿠버네티스 유예 시간 | Kubernetes 문서, Pod Lifecycle > Termination of Pods https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination (확인 2026-10-26) | 2026-10-26 |
| 발신번호 사전 등록 | 전기통신사업법 제84조의2 https://www.law.go.kr/법령/전기통신사업법/제84조의2 , 「거짓으로 표시된 전화번호로 인한 이용자의 피해 예방 등에 관한 고시」 제정판(2015-04-16) 제9조 https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2200000032162 (확인 2026-10-26. 현행 고시의 조 번호는 확인 못 함) | 2026-10-26 |

## 참고 자료

- NestJS 공식 문서, Lifecycle events: https://docs.nestjs.com/fundamentals/lifecycle-events
- Node.js 공식 문서, Signal events: https://nodejs.org/api/process.html#signal-events
- Docker 문서, docker container stop: https://docs.docker.com/reference/cli/docker/container/stop/
- Kubernetes 문서, Pod Lifecycle(Termination of Pods): https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination
