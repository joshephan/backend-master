# 3강. Nest CLI와 프로젝트 구조

제1부 기반: 백엔드와 Node.js 런타임 · 1장 오리엔테이션

[← 2강](../../part1/lecture2/) | [제1부 목록](../) | [4강 →](../../part1/lecture4/)

## 이번 강의 질문

`nest new`가 만들어 준 파일들은 각각 무슨 일을 하고, 프로젝트가 커지면 구조를 어떻게 나누나.

## 강의 자료

| 파일 | 내용 |
|---|---|
| [slides.pdf](slides.pdf) | 강의 슬라이드 |

## 실습 자료

### 준비

- Node 24, npm, Nest CLI 12(`npm i -g @nestjs/cli`)
- [code/](code/)는 이 강의가 끝난 시점의 프로젝트 전체다(`apps/ticketing`, `apps/notifier`, `libs/common` 모노레포). 받은 뒤 아래처럼 실행한다

```bash
cd code
npm install
npm run start                 # 예매 API, 3000번 포트
npx nest start notifier       # 알림 앱, 3001번 포트(다른 터미널)
curl localhost:3000
curl localhost:3001
```

처음부터 따라 만들려면 빈 폴더에서 시작한다.

```bash
nest new ticketing --package-manager npm
cd ticketing
git init && git add -A && git commit -m init

# 스키매틱
nest g resource concerts --type rest --crud --dry-run
nest g resource concerts --type rest --crud
git diff
npm run start
curl localhost:3000/concerts

# SWC
npm i -D @swc/cli @swc/core
npx tsc -p tsconfig.build.json --extendedDiagnostics   # Total time 확인
nest build -b swc

# 모노레포
nest generate app notifier
git diff nest-cli.json package.json tsconfig.json
npm i -D @rspack/core webpack-node-externals tsconfig-paths-webpack-plugin
nest g library common     # prefix 질문에 @app
```

- `apps/notifier/src/main.ts`의 `process.env.port ?? 3000`을 `process.env.PORT ?? 3001`로 고친다. 생성된 코드는 소문자 `port`이고 포트도 3000으로 같아서 두 앱을 함께 띄울 수 없다
- `libs/common/src/seat-label.ts`를 만들고 `libs/common/src/index.ts`에 `export * from './seat-label.js';`를 더한다
- 앱마다 타입 검사가 돌도록 아래처럼 설정을 고친다(Nest CLI 12.0.10이 만든 설정 기준)

```diff
 // tsconfig.json
-      "@app/common": ["./libs/common/src"],
+      "@app/common": ["./libs/common/src/index.ts"],

 // apps/ticketing/tsconfig.app.json, apps/notifier/tsconfig.app.json
-    "rootDir": "./src",
+    "rootDir": "../..",
-  "include": ["src/**/*"],
+  "include": ["src/**/*", "../../libs/**/*"],
```

```bash
npx tsc --noEmit -p apps/ticketing/tsconfig.app.json
npx tsc --noEmit -p apps/notifier/tsconfig.app.json
```

moduleResolution이 nodenext라 디렉터리 경로가 `index.ts`로 풀리지 않고, 앱의 rootDir 밖에 있는 libs 파일을 프로젝트가 포함하지 않기 때문이다.

### 코드

`nest new`가 만든 파일에서 이 강의가 새로 만들거나 고친 파일이다.

| 파일 | 내용 |
|---|---|
| [code/nest-cli.json](code/nest-cli.json) | 모노레포 설정. builder rspack, projects에 ticketing, notifier, common |
| [code/package.json](code/package.json) | `@nestjs/mapped-types`(리소스 생성), SWC·rspack 개발 의존성 |
| [code/tsconfig.json](code/tsconfig.json) | `@app/common` 경로를 `index.ts`로 지정 |
| [code/apps/ticketing/tsconfig.app.json](code/apps/ticketing/tsconfig.app.json) | rootDir `../..`, include에 libs 추가 |
| [code/apps/notifier/tsconfig.app.json](code/apps/notifier/tsconfig.app.json) | 같은 수정 |
| [code/apps/ticketing/src/concerts/](code/apps/ticketing/src/concerts/) | `nest g resource concerts`가 만든 모듈, 컨트롤러, 서비스, DTO, 엔티티 |
| [code/apps/ticketing/src/app.module.ts](code/apps/ticketing/src/app.module.ts) | `ConcertsModule` 등록 |
| [code/apps/ticketing/src/app.service.ts](code/apps/ticketing/src/app.service.ts) | `seatLabel`로 `예매 API: A구역 3열 15번` 반환 |
| [code/apps/notifier/src/main.ts](code/apps/notifier/src/main.ts) | `process.env.PORT ?? 3001` |
| [code/apps/notifier/src/notifier.service.ts](code/apps/notifier/src/notifier.service.ts) | `seatLabel`로 `알림: A구역 3열 15번 예매 확정` 반환 |
| [code/libs/common/src/seat-label.ts](code/libs/common/src/seat-label.ts) | 두 앱이 함께 쓰는 좌석 표기 함수 |
| [code/libs/common/src/index.ts](code/libs/common/src/index.ts) | `seat-label.js` 내보내기 추가 |

### 실행 결과

`npm run start`와 `curl localhost:3000`(리소스 생성 전).

```text
LOG [NestFactory] Starting Nest application...
LOG [InstanceLoader] AppModule dependencies initialized +3ms
LOG [RoutesResolver] AppController {/}: +25ms
LOG [RouterExplorer] Mapped {/, GET} route +8ms
LOG [NestApplication] Nest application successfully started +8ms

$ curl localhost:3000
Hello World!
```

`nest g resource concerts --dry-run`의 출력.

```text
CREATE src/concerts/concerts.controller.ts (1000 bytes)
CREATE src/concerts/concerts.controller.spec.ts (622 bytes)
CREATE src/concerts/concerts.module.ts (284 bytes)
CREATE src/concerts/concerts.service.ts (683 bytes)
CREATE src/concerts/concerts.service.spec.ts (495 bytes)
CREATE src/concerts/dto/create-concert.dto.ts (34 bytes)
CREATE src/concerts/dto/update-concert.dto.ts (188 bytes)
CREATE src/concerts/entities/concert.entity.ts (25 bytes)
UPDATE package.json (1461 bytes)
UPDATE src/app.module.ts (343 bytes)
Dry run enabled. No files written to disk.
```

리소스를 만든 뒤 서버 시작 로그와 `curl localhost:3000/concerts`.

```text
LOG [RouterExplorer] Mapped {/, GET} route
LOG [RouterExplorer] Mapped {/concerts, POST} route
LOG [RouterExplorer] Mapped {/concerts, GET} route
LOG [RouterExplorer] Mapped {/concerts/:id, GET} route
LOG [RouterExplorer] Mapped {/concerts/:id, PATCH} route
LOG [RouterExplorer] Mapped {/concerts/:id, DELETE} route

$ curl localhost:3000/concerts
This action returns all concerts
```

`app.service.ts`의 `getHello` 안에 `const seats: number = '50000';`을 넣고 빌드했을 때. tsc는 실패하고 SWC는 통과한다.

```text
$ nest build
src/app.service.ts:6:11 - error TS2322: Type 'string' is not assignable to type 'number'.
Found 1 error(s).

$ nest build -b swc
>  SWC  Running...
Successfully compiled: 10 files with swc (56.64ms)

$ nest build -b swc --type-check
✖  TSC  Initializing type checker...
 Error  Found 1 type error(s) during compilation.
```

`main.ts`의 `'./app.module.js'`를 `'./app.module'`로 바꿨을 때. SWC 빌드는 통과하지만 실행에서 실패한다.

```text
$ nest build
src/main.ts:2:27 - error TS2307: Cannot find module './app.module' or its corresponding type declarations.

$ nest build -b swc
Successfully compiled: 10 files with swc (58.78ms)
$ node dist/main.js
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../dist/app.module' imported from .../dist/main.js
```

`nest generate app notifier`가 `package.json`의 `test:e2e` 스크립트를 잘못 바꾼 부분.

```diff
-    "test:e2e": "vitest run --config ./vitest.config.e2e.ts"
+    "test:e2e": "viapps/ticketing/test run --config ./vitest.config.e2e.ts"
```

모노레포에서 두 앱을 빌드하고 띄운 결과.

```text
$ nest build
Rspack 2.2.9 compiled successfully in 25 ms
$ nest build notifier
Rspack 2.2.9 compiled successfully in 25 ms
$ find dist -name "*.js"
dist/apps/notifier/main.js
dist/apps/ticketing/main.js

$ curl localhost:3000
예매 API: A구역 3열 15번
$ curl localhost:3001
알림: A구역 3열 15번 예매 확정
```

`seatLabel`을 인자 넷으로 바꾸고 호출은 그대로 둔 경우. rspack 빌드는 통과하고 tsc 타입 검사만 잡는다.

```text
$ nest build
Rspack 2.2.9 compiled successfully in 34 ms

$ npx tsc --noEmit -p apps/ticketing/tsconfig.app.json
apps/ticketing/src/app.service.ts(7,23): error TS2554: Expected 4 arguments, but got 3.
```

### 해 볼 때 참고

- 빌드가 통과했다고 타입이 맞는 것은 아니다. SWC와 rspack은 타입 검사를 하지 않으므로 `nest build -b swc --type-check`나 `npx tsc --noEmit`을 따로 돌린다
- 이 코드의 `test:e2e` 스크립트는 `nest generate app`이 바꾼 그대로 깨져 있다(`viapps/ticketing/test run`). 쓰려면 `vitest run`으로 되돌린다
- SWC와 rspack은 운영체제별 네이티브 바이너리 패키지를 함께 설치한다. npm 설정에 `os` 값이 따로 들어 있으면 내 운영체제용 바이너리가 빠질 수 있으니 `npm config get os`로 확인하고, 필요하면 `npm i --os=win32`처럼 운영체제를 지정한다
- [code/package.json](code/package.json)의 devDependencies에는 Windows용 `@swc/core-win32-x64-msvc`가 들어 있다. 다른 운영체제에서 설치가 막히면 이 줄을 지우고 설치한다

## 시효성 데이터

기준일의 값이다. 시간이 지나면 바뀔 수 있다.

| 항목 | 값 | 기준일 |
|---|---|---|
| Nest CLI | 12.0.10 | 2026-10-25 |
| NestJS 패키지 | @nestjs/common·core·platform-express 12.2.0, @nestjs/mapped-types 12.0.0, @nestjs/schematics 12.0.0 | 2026-10-25 |
| 새 프로젝트 기본 도구 | ES 모듈("type": "module"), TypeScript 6.0.3, vitest 4.1.12, oxlint 1.89.0, prettier 3.9.10 | 2026-10-25 |
| SWC | @swc/cli 0.8.1, @swc/core 1.16.20 | 2026-10-25 |
| rspack | @rspack/core 2.2.9 | 2026-10-25 |
| 컴파일 시간 | tsc 1.30~1.78초(3회), SWC 54~82밀리초(5회), 파일 10개 | 2026-10-25 |
| nest build 명령 전체 시간 | tsc 4.0~5.4초, SWC 2.7~3.7초(3회씩) | 2026-10-25 |
| 모노레포 전환 시 builder | rspack | 2026-10-25 |
| test:e2e 스크립트 치환 오류 | "vitest run" → "viapps/ticketing/test run" | 2026-10-25 |
| 라이브러리 경로와 tsc | 생성 설정 그대로는 tsc가 '@app/common'을 못 찾음(TS2307) | 2026-10-25 |

## 이어지는 주제

| 주제 | 다루는 강 |
|---|---|
| 모듈의 경계와 exports | [13강](../../part2/lecture13/) |
| 컨트롤러와 라우팅 | [14강](../../part2/lecture14/) |
| 프로바이더와 의존성 주입 | [15강](../../part2/lecture15/), [17강](../../part2/lecture17/), [18강](../../part2/lecture18/), [19강](../../part2/lecture19/), [20강](../../part2/lecture20/), [21강](../../part2/lecture21/) |
| DTO와 PartialType | [16강](../../part2/lecture16/), [25강](../../part2/lecture25/) |
| 테스트 파일과 테스트 도구 | [32강](../../part2/lecture32/), [33강](../../part2/lecture33/), [34강](../../part2/lecture34/), [35강](../../part2/lecture35/) |
| 컨테이너 이미지 빌드 | 247강 |
| CI의 타입 검사 단계 | 257강 |

출처와 참고 자료는 [reference.md](reference.md)에 모았습니다.
