# 작업 이력

세션 기간 동안 Crazy Daisy 클론에 가한 시각·구조 개선 작업의 시간 순 기록.

## 0. 출발점

- 순수 JS + Canvas, 빌드 시스템·패키지 매니저·테스트 없음 (CLAUDE.md 기준)
- `daisygame/index.html`이 `js/*.js`를 평범한 `<script>` 태그로 차례 로드
- 잎 = 단색 원, 꽃 중심 = `circle.png`, 점수 = 픽셀 숫자 PNG, 버튼 = PNG

## 1. 1차 시도와 롤백

요청: "이모지로 화려하게."

- `draw_engine.js`에 잎=하트 이모지, 중심=꽃 이모지, 배경에 ✨ 데코, 타이틀에 흔들리는 이모지 텍스트를 추가.
- 이모지 도배가 원작 톤(여름 정원, 차분한 카툰)과 어긋난다고 사용자 판단 → 변경 전부 `git checkout --`로 롤백.

## 2. 원작 리서치

대상: Astraware **Crazy Daisy** (Pocket PC, 2005).

- Software Informer / MobyGames / PalmDB / PocketPC 4 YOU 리뷰 페이지 조사
- 핵심 인상:
  - "Summer's day in the garden" 분위기, 파스텔 톤
  - 같은 데이지 7송이가 꽃잎 색만 다르게 배치
  - 곤충 보이스 효과 → 정원 마스코트(벌·나비)가 분위기를 담당
  - "Daisy Chain" / "Flower Power" 콤보 콜아웃이 게임 손맛의 핵심

이 톤을 표방하는 새 디자인 방향성 수립.

## 3. 디자인 계획 및 태스크 분할

10개 태스크로 분할(의존성: #2←#1, #4·#5←#3):

| ID | 내용 |
|---|---|
| #1 | 잎을 데이지 꽃잎 path로 |
| #2 | 꽃 중심 노란 디스크 + 점 텍스처 |
| #3 | 매치 시 점수 팝업 |
| #4 | Daisy Chain / Flower Power 콜아웃 |
| #5 | 매치 순간 파티클 버스트 |
| #6 | 점수/최고점 캔버스 텍스트화 |
| #7 | 타이틀 워드마크 + 서브카피 |
| #8 | 배경 풀잎/구름 띠 |
| #9 | 곤충 마스코트(벌) |
| #10 | 버튼 스타일 정돈 |

## 4. TypeScript 빌드 파이프라인 (옵션 A 채택)

목표: CLAUDE.md의 "정적 호스팅" 모델 유지하면서 최소 도입.

- `package.json` — `typescript` devDep + `npm run build` / `watch` 스크립트
- `daisygame/tsconfig.json` — `module: "none"`, `outDir: ./js`, `rootDir: ./src`, `strict: true`
- `daisygame/src/globals.d.ts` — JS로 남은 파일들의 전역(`bufCtx`, `gStartX`, `Flower`/`Leaf` 인터페이스 등) ambient 선언
- `.gitignore` — `node_modules/`, `*.tsbuildinfo`
- 출력은 모듈 래퍼 없는 평범한 스크립트 → `index.html` 로드 순서 / 전역 클래스 모델 그대로 유지

## 5. Phase 1-1 (#1) — 데이지 꽃잎 path

- `daisygame/js/draw_engine.js` 삭제 후 `daisygame/src/draw_engine.ts`로 이식
- 단색 원 → 베지어 물방울 path (안쪽 뾰족, 바깥쪽 둥근 데이지 꽃잎)
- 색상별 4톤 팔레트(base/light/dark/outline) + 길이 방향 선형 그라데이션
- 바깥쪽 위에 흰 타원 sheen으로 입체감
- `Leaf.life` 기반 축소 애니메이션 그대로 유지
- 위치 공식 동일 → `flower.is_inside` 히트박스와 시각이 어긋나지 않음

## 6. Phase 1-2 ~ Phase 4-2 (#2 ~ #10) — 일괄 적용

### 신규 / 수정 파일

- `daisygame/src/effects.ts` (신규) — 점수 팝업·콤보 콜아웃·파티클 큐 (`Effects` 전역)
  - `popScore(x, y, value)` / `callout(text, kind)` / `burst(x, y, color, n=7)` / `tick()` / `reset()`
- `daisygame/src/draw_engine.ts` — 렌더 전반 재구성
- `daisygame/src/globals.d.ts` — `pop_sound` / `clear_sound` ambient 보강
- `daisygame/js/daisygame.js` — 매치/콤보 시점에 효과 푸시
  - `checkCollision`: 제거된 잎쌍 좌표 중점에 `Effects.burst`, 누른 꽃 위쪽에 `Effects.popScore(gained)`
  - `_playEffectSound`: 비워진 꽃 수에 따라 "Daisy Chain!" / "Flower Power!" 콜아웃
  - `init()`에서 `Effects.reset()`
- `daisygame/index.html` — `effects.js` 스크립트 태그 추가 (`util`과 `score` 사이)

### 시각 결과

- **#2** 꽃 중심: `circle.png` 제거 → 흰 쿠션 링 + 노랑→주황 radial gradient + 결정론적 freckle 점 텍스처 + 시히
- **#3** 점수 팝업: 매치 시 누른 꽃 위로 떠오르며 페이드되는 `+값` 텍스트
- **#4** 콜아웃: 한 송이 비움 → "Daisy Chain!", 두 송이 이상 → "Flower Power!" (스크립트 폰트 + 그라데이션, 팝-인 → 정착 → 페이드)
- **#5** 파티클: 매치 위치마다 잎 색 점 7개 튀어 중력 + 페이드
- **#6** HUD: 픽셀 숫자 이미지 사용 중단, 우측 상단 `SCORE` 캔버스 텍스트(흰/검정 outline)
- **#7** 타이틀 워드마크: "Crazy Daisy" 핑크→마젠타 그라데이션 + 양옆 미니 데이지 데코, 서브카피 "Tap a daisy to spin its petals"
- **#8** 배경: 상단 흰 구름 3개(살짝 흔들림) + 하단 풀잎 28장 실루엣 + 그린 그라데이션 띠
- **#9** 마스코트 벌: PLAY 상태일 때만 가끔 화면을 가로질러 날갯짓 (캔버스 도형, 외부 자산 0)
- **#10** 버튼: Play/Resume = 호박색 그라데이션 둥근사각 + 삼각 글리프 + 라벨 / Pause·Music·Mute = 둥근 아이콘 버튼. 히트박스 좌표 그대로 유지

`getEventCode` / `Flower.is_inside`는 변경 없음 → 입력 동작 동일.

## 7. 단일 파일 릴리스 빌드 (`build.sh`)

- 위치: 저장소 루트 `build.sh`
- 동작:
  1. `npm run build`로 TS 컴파일
  2. `daisygame/img/*` 모두 base64 data URI로 인코딩, sed 프로그램으로 `image_loader.js`의 `root + "/<filename>"` 표현 일괄 치환
  3. CSS + 패치된 image_loader + 나머지 JS 12개를 `release/index.html`에 인라인 (`</script>` 이스케이프 적용)
- 첫 결과: **477 KiB**, 외부 리소스 0개

## 8. 미사용 자산 정리

검사 결과 `daisygame/img/`의 19개 이미지 중 실제로 그리는 것은 `background01.jpg` 한 개뿐. `buttonImage` 맵의 17개 할당은 dead code.

### 삭제 (21개 파일 + 1개 디렉터리)

- `daisygame/img/`의 PNG 19개: `blank`, `circle`, `circle2`, `music`, `mute`, `pause`, `resume`, `score`, `start`, `sn00`–`sn09`
- `daisygame/favicon.ico` (참조 없음)
- `daisygame/css/main.css` (빈 파일) + 빈 `css/` 디렉터리

### 소스 슬림화

- `image_loader.js`: 28줄 → 9줄 (background만 로드)
- `globals.d.ts`: `LoadedImages` 인터페이스를 `{ background }` 1키로 축소
- `draw_engine.ts`: `ButtonImageMap` 타입과 `buttonImage` 멤버, 17개 dead 할당 제거. `_LoadImage`는 한 줄짜리.
- `daisygame/index.html`: 빈 `css/main.css` 링크 제거, 외부 favicon 링크 제거

### 결과

- 번들 크기: **477 KiB → 216 KiB** (약 55% 축소)
- 번들 내 data URI: 18개 → **1개** (배경 JPG만)
- TS 컴파일 / `node --check` 모두 통과

## 9. 현재 트리 (정리 후)

```
/root/github/daisygame/
├── build.sh                  # 단일 파일 릴리스 빌드
├── package.json              # tsc devDep + build/watch 스크립트
├── .gitignore
├── CLAUDE.md
├── README.md
├── LICENSE
├── history.md                # ← 이 파일
├── release/
│   └── index.html            # 216 KiB, 자가완결
└── daisygame/
    ├── index.html            # 개발용 (스크립트 태그 분리)
    ├── tsconfig.json
    ├── doc/DaisyGame.pdf
    ├── util/audio2b64.py     # 오디오 base64 갱신 도구
    ├── img/background01.jpg  # 유일하게 사용되는 이미지
    ├── src/
    │   ├── globals.d.ts
    │   ├── effects.ts
    │   └── draw_engine.ts
    ├── tests/                # node:test 단위 테스트 (44건)
    │   ├── _bootstrap.js
    │   ├── score.test.js
    │   ├── leaf.test.js
    │   ├── flower.test.js
    │   ├── effects.test.js
    │   └── daisygame.test.js
    └── js/                   # tsc 산출물 + 아직 JS인 파일들
        ├── audio.js
        ├── daisygame.js
        ├── draw_engine.js    # ← src/draw_engine.ts 컴파일 산출
        ├── effects.js        # ← src/effects.ts 컴파일 산출
        ├── flower.js
        ├── game_engine.js
        ├── image_loader.js
        ├── leaf.js
        ├── main.js
        ├── score.js
        ├── util.js
        └── values.js
```

## 10. 사용자 피드백 반영

세션 후반부 시각 / 입력 다듬기.

### 10.1 꽃 중심 점 → 시계방향 회전 화살표

- `_drawDaisyCenter`의 freckle 14개 점 텍스처가 어색하다는 피드백 → freckle 코드 + LCG 시드 모두 제거
- 새 `_drawRotationArrow(cx, cy, r)` 추가 — `Flower.turn()`이 `unshift(pop())`이라 잎이 시계방향으로 한 칸 이동하는 것을 시각화
- 흰 후광 stroke + 어두운 갈색(`#5b2f0a`) 본체로 노란 디스크 위 가독성 확보

### 10.2 화살표 크기 축소 (180° 반원)

- 처음엔 ~300° 호로 그렸지만 디스크를 가득 채워 시각적으로 무거움 → **180° 반원**으로 축소
- 위치: 9시 → 12시 → 3시 (윗쪽 반원), 화살촉이 3시 끝에서 시계방향으로 살짝 내려감
- 본체 굵기·화살촉 크기·흰 후광 굵기를 모두 축소

### 10.3 터치 더블파이어 수정 (60° 회전 보장)

- 한 번 탭에 60° 대신 **120° 회전**한다는 보고
- 원인: 터치 가능한 비-모바일 환경(데스크톱 터치스크린, Chrome DevTools 터치 에뮬레이션)에서 `touchend` + 합성 `mouseup`이 둘 다 발화 → `turnFlower`가 두 번 호출
- 수정 (`daisygame/js/main.js`):
  - `touchListener`에서 `touchstart` / `touchend` / `touchmove`에 `event.preventDefault()` 추가
  - `addEventListener` 옵션을 `false` → `{ passive: false }`로 변경 (passive 리스너에서는 `preventDefault`가 무시됨)
  - MDN 명세상 첫 `touchstart`에서 `preventDefault`를 호출해야 후속 합성 마우스 이벤트가 억제됨
- 부수 효과: 음악 토글 버튼이 두 번 토글되어 결과가 안 바뀌던 현상도 해소

### 10.4 음악 / 뮤트: 캔버스 도형 → 이모지 글리프 (외곽 디스크 제거)

- 캔버스 path로 그린 스피커·음표 도형이 어색하다는 피드백 → **🔊 / 🔇** 이모지로 교체 (`EMOJI_FONT` 폴백 체인 도입)
- 후속 피드백으로 **둥근 버튼 배경(드롭섀도 + 그라데이션 + 외곽선)도 제거** → 글리프 단독 + 부드러운 검정 드롭섀도(`shadowBlur 6`, `shadowOffsetY 2`)만으로 풀밭 위 가독성 유지
- pause(좌상단)는 그대로 — 호박색 둥근 버튼 + 두 막대
- 히트박스(60×60) 좌표 변경 없음 → 입력 동작 영향 없음

## 11. 테스트 보완

추가된 케이스 (`daisygame/tests/`):

- `effects.test.js` (+2)
  - `tick`이 popup을 위로 이동(y 감소)
  - `tick`이 callout life를 감쇠 + 만료 시 큐에서 제거
- `daisygame.test.js` (+2)
  - `init()` 호출 시 Effects 큐(`popups` / `callouts` / `particles`)가 모두 비워짐
  - 강제 색 매치(`Leaf._color` / `_life` private 필드 직접 조작) 후 `turnFlower`가 점수를 올림 — `_leafMap[0]`의 `[0, 13]` 페어를 활용한 결정론적 매치

총 테스트 수: 40 → **44건**. 의존성 0의 Node 빌트인 `node:test` 그대로.

## 12. 3개 게임 모드 도입 (Arcade / Puzzle / Endless)

원작 Astraware Crazy Daisy의 3-mode 구조를 이식. MobyGames 스크린샷과 리뷰 기반으로 각 모드의 규칙 추론.

### 12.1 모드별 동작

| 모드 | 동작 |
|---|---|
| **Endless** (기본) | 기존 행동 — 잎 자동 보충, 단색 보너스, `_isPlayable` false 시 `_init_flower()`로 보드 리셋. 게임오버 없음 |
| **Arcade** | 90초(=3000틱) 카운트다운. 잎 보충 / 보너스는 endless와 동일. 타이머 0 → `GAME_OVER_STATE` |
| **Puzzle** | 잎 자동 보충 / 단색 보너스 비활성화. `_isPlayable` false 시 보드 리셋 대신 `GAME_OVER_STATE`. 시간 압박 없음 |

### 12.2 데이터/로직 변경

- `daisygame/js/daisygame.js`
  - `MODE_ARCADE`/`MODE_PUZZLE`/`MODE_ENDLESS` 상수 + `ARCADE_TICKS = 3000`
  - `_mode` / `_timerTicks` 멤버
  - `start(mode)` — IDLE/GAME_OVER에서 모드 지정 + 타이머 무장 (PAUSE는 모드/타이머 보존하며 resume)
  - `mode()` / `timerSeconds()` 게터
  - `turnFlower`의 `_isPlayable` false 분기에서 puzzle은 `GAME_OVER_STATE`, 그 외는 기존 보드 리셋
  - `increaseTick`에서 puzzle 모드는 잎 보충 / 단색 보너스 블록 통째 스킵, arcade 모드는 마지막에 `_timerTicks--` + 0 도달 시 GAME_OVER
- `daisygame/js/values.js` — `MODE_*` ID + `MODE_*_KEY` 합성 코드(201–203, 키보드 범위 밖)
- `daisygame/js/game_engine.js` — `start(mode)`로 인자 전달
- `daisygame/js/main.js` — `processKeyEvent`에서 A/Z/E 키와 `MODE_*_KEY`를 모두 매핑. ENTER/S 키는 PAUSE면 resume, 그 외엔 endless 기본
- `daisygame/src/globals.d.ts` — 모드 상수, `mode()` / `timerSeconds()` 선언

### 12.3 UI 변경 (`draw_engine.ts`)

- IDLE / GAME_OVER 화면: 단일 Play 버튼 → **3개 모드 버튼**
  - Arcade: ⏱️ + 주황 그라데이션 (`#FFB179` → `#E25E2A`)
  - Puzzle: 🧩 + 파랑 그라데이션 (`#A6BFF7` → `#5C7DD6`)
  - Endless: ♾️ + 녹색 그라데이션 (`#A6E0A6` → `#3F9E5C`)
  - 가운데 cy = 128 / 180 / 232, halfW=110, halfH=24
- GAME_OVER 워드마크가 모드별 — `Time's Up!` (arcade) / `Stuck!` (puzzle) / `Game Over` (기타)
- PLAY 상태 상단 중앙에 `m:ss` 타이머 (arcade 한정, 잔여 ≤ 10초 빨강)
- `_hitModeButton(x, y)` 헬퍼 — IDLE/GAME_OVER 클릭이 `MODE_*_KEY` 합성 코드로 라우팅
- PAUSE 화면은 그대로 (단일 Resume 버튼)

### 12.4 테스트 보완 (54건, +10)

`daisygame/tests/_bootstrap.js`의 `loadGame()`이 이제 `values.js`도 같이 평가 → `MODE_ARCADE`/`MODE_PUZZLE`/`MODE_ENDLESS` 상수를 테스트로 노출.

추가된 케이스:
- 기본 모드는 Endless (`mode()` / `timerSeconds()` 0)
- `start(MODE_ARCADE)` 모드 + 타이머 무장
- `timerSeconds`는 비-arcade에서 0
- arcade 타이머 만료 시 GAME_OVER로 전이 (`_timerTicks=1` 후 한 틱)
- 매 PLAY 틱마다 `_timerTicks` 1씩 감쇠
- PAUSE 동안 타이머 정지
- PAUSE → `start()` 재개 시 모드/타이머 보존
- puzzle 모드 빈 꽃이 자동 보충되지 않음 (30틱)
- endless 모드 빈 꽃은 보충됨 (대조군)
- `_isPlayable` false 시 puzzle은 GAME_OVER 분기

## 13. 모드 화면 힌트 텍스트 겹침 수정

3개 모드 버튼 도입 후, IDLE / GAME_OVER 화면의 힌트 텍스트(y=230)가 Endless 버튼(cy=232, halfH=24 → y=208..256)과 정중앙에서 겹쳐 보이는 보고.

수정 (`draw_engine.ts`):
- `_drawHint(text, y = 230)` — y 파라미터 추가
- **IDLE** — 키보드 단축키 힌트("Pick a mode — A / Z / E") 제거. `Arcade` / `Puzzle` / `Endless` 라벨이 자체 설명이라 별도 힌트 불필요
- **GAME_OVER** — 힌트를 y=230 → **y=380** (BEST 배너 y=290..360 아래)으로 이동
- **PAUSE** — 그대로 (Resume 버튼 y=100..200, 힌트 y=230이라 원래 비겹침)

## 14. 게임 진행 상태 저장 / 이어하기

기존 영속화는 최고 점수 1개만 `localStorage`에 저장. 게임 도중 탭을 닫으면 모드/점수/꽃잎 상태가 모두 소실되었음.

요청: "현 상태 그대로 복원, DB 로딩 실패해도 게임이 실행." TDD 식으로 plan → tests → dev 순서로 진행.

### 14.1 영속화 모델

- 저장소: `localStorage` (작은 JSON, IndexedDB 과함)
- 키: 기존 `DaisyHighScore`에 더해 `DaisyResume` 신설
- 스키마 v=1, 변경 시 버전 다르면 무시 → 신규 게임 시작
- 항상 `PAUSE_STATE`로 정규화 — 사용자가 명시적 Resume 누르도록

### 14.2 직렬화 대상

- `DaisyGame`: `_mode` / `_tick` / `_timerTicks` / `_addLeafIndex` / `_addLeafTable`
- `Score`: `_score` / `_highScore` / `_prev_high_score` (`needToSave` 보존)
- 7×`Flower`: `index` / 위치(`x`, `y`, `radius`) / `_small_radius` / `_leaf_count` / leaves[6]
- 6×`Leaf`/꽃: `_color` / `_colorTable` / `_colorIdx` / `_life` / `_origin_life` / `_size`

각 클래스에 `serialize()`(plain object 반환) / `restore(data)`(self mutation, 검증 실패 시 false) 메서드.

### 14.3 트리거

- 저장: `pause()` 시 + `window.beforeunload` 시 (PLAY 또는 PAUSE 상태)
- 복원: `InitValue()` 부팅 직후, `try/catch`로 감싸 어떤 실패라도 IDLE 모드 선택 화면으로 이어짐
- 삭제: 게임오버 도달(아케이드 타이머 만료, 퍼즐 막힘) + `start(mode)`로 새 모드 시작 (`mode` 인자 미지정 = pause 재개라 보존)

### 14.4 실패 안전 (모든 경로 try/catch)

- `localStorage` 접근 자체가 throw (Safari 시크릿) → `getScore`/`getResume` null·0 반환
- JSON 파싱 실패 → `getResume` null
- 저장된 값이 객체 아님 (배열/원시) → null
- 스키마 버전 불일치 (`v !== 1`) → `restore` false
- 필드 손상 (`flowers.length !== 7`, `mode` 비-숫자 등) → `restore` false
- `setResume` / `clearResume`이 quota/disabled로 throw → 흡수, 게임 영향 없음

### 14.5 테스트 (71건, +17)

부트스트랩: `tests/_bootstrap.js`에 Map 기반 `localStorage` 스텁 + `LocalDB` / `_store` / `localStorage`를 노출 (스텁을 테스트에서 직접 조작 가능).

신규 `localdb.test.js` (9건):
- `getResume`은 미저장 시 null
- `setResume` → `getResume` round-trip
- `clearResume` 후 `getResume` null
- 손상 JSON / 원시값 저장 시 null
- `setItem`/`getItem`/`removeItem`이 throw해도 `setResume` / `getResume` / `clearResume` 모두 throw 흡수
- `getScore` / `getResume` 키 분리 동작

기존 테스트에 round-trip 추가 (4건):
- `Score`: `serialize` → `restore` → 점수/고점/needToSave 보존
- `Leaf`: 색·생명·`colorTable` 사이클 보존, restored leaf의 후속 `reset()`도 원본과 동일
- `Flower`: 위치·인덱스·`leaf_count`·잎 색/생사 모두 일치
- `DaisyGame`: 점수·모드·`_timerTicks`·꽃 잎 색 모두 일치, `restore` 후 `isPauseState()`

`DaisyGame.restore` graceful 실패 (4건): null/undefined/버전 불일치/배열 길이 오류/모드 비-숫자

## 15. PAUSE 화면에 Main Menu 버튼 추가

피드백: "pause 시 나오는 메뉴에 main 메뉴로 가는 방법이 없어." 모드 선택 화면(IDLE)으로 복귀하는 명시적 버튼이 필요.

### 15.1 동작

- **버튼**: PAUSE 화면 Resume 아래에 회색 그라데이션의 "🏠 Main Menu" 버튼
- **클릭** → `gameEngine.gotoMenu()`:
  1. `needToSaveScore()`면 `setScore`로 최고점 영속화
  2. `clearResume()`로 진행 중 스냅샷 삭제 (사용자가 명시적으로 게임 포기)
  3. `daisyGame.init()` → IDLE 상태(모드 선택 화면)로 복귀
- **키보드**: `Esc` (PAUSE 상태에서만 작동, 그 외엔 no-op)
- 신규 합성 키 `MENU_KEY = 204`

### 15.2 변경

- `js/values.js` — `MENU_KEY = 204`
- `js/main.js` — `case 27`(Esc) / `case MENU_KEY` 라우팅
- `js/game_engine.js` — `gotoMenu()` 메서드
- `src/globals.d.ts` — `MENU_KEY` 선언
- `src/draw_engine.ts`
  - PAUSE 화면 레이아웃 재배치: Resume를 cy=140으로 약간 줄여 두 번째 버튼 자리 확보, Main Menu 버튼은 cy=210
  - 신규 `_drawMenuButton(cx, cy, halfW, halfH)` — 회색 그라데이션 + 🏠 글리프 + 흰 라벨, 시각적으로 secondary
  - PAUSE 상태 `getEventCode` 분기에 두 번째 히트박스 추가
  - 기존 "Tap Resume to continue" 힌트 제거 (Main Menu 버튼이 들어가면서 y=230 힌트 위치와 겹쳐서)

### 15.3 테스트 (77건, +6)

신규 `game_engine.test.js` — 부트스트랩 `loadGame()`이 이제 `game_engine.js`도 평가, `GameEngine`을 노출:

- PAUSE → `gotoMenu` → IDLE 상태 전환
- `gotoMenu`가 resume 슬롯 삭제
- `gotoMenu`가 변경된 최고점을 `setScore`로 영속화
- IDLE에서 `gotoMenu` 호출은 no-op (안전)
- `start(mode)`는 resume 슬롯 삭제 (새 게임 = fresh start 시멘틱)
- `start()` 인자 없이는 resume 슬롯 보존 (PAUSE → resume 시멘틱)

## 16. CW / CCW 두 종류의 데이지 (원작 대응)

원작 Crazy Daisy는 시계방향 / 반시계방향 두 종류 꽃이 함께 나옴. 우리 구현은 모두 시계방향만이었음.

### 16.1 동작

- 각 `Flower`에 `_direction` 필드(`1`=CW / `-1`=CCW)
- `Flower.turn()`이 방향 분기:
  - CW: `unshift(pop())` (기존)
  - CCW: `push(shift())`
- `_init_flower`에서 게임 시작 시 7개 방향 분배 — `[CW, CW, CCW, CCW, ?, ?, ?]`(랜덤 3개)을 `Math.random()` 셔플 → **CW ≥ 2, CCW ≥ 2 보장**, 매 게임 다른 배치

### 16.2 변경

- `js/flower.js`
  - 생성자에 `_direction = 1`
  - `direction()` / `set_direction(d)` 게터·세터 (입력 정규화: `-1`만 CCW, 그 외엔 CW)
  - `turn()` 분기
  - `serialize`/`restore`에 `direction` 포함 (없으면 CW 폴백)
- `js/daisygame.js` `_init_flower` — 색상 충돌 해소 직전에 방향 분배 블록 삽입
- `src/globals.d.ts` `FlowerLike`에 `direction()` 추가
- `src/draw_engine.ts`
  - `_drawDaisyCenter(cx, cy, r, direction = 1)` — direction 인자 받음
  - `_drawRotationArrow(cx, cy, r, direction = 1)` — `direction === -1`이면 `bufCtx.scale(-1, 1)`로 수평 미러 → 동일 코드로 두 방향 모두 렌더
  - `_drawFlower`가 `flower.direction()`을 전달

### 16.3 테스트 (83건, +6)

- `Flower` 신규: 기본 방향이 CW(1), CCW에서 `turn()`이 `push(shift())` 시멘틱, CCW 6회 회전 후 원상복귀, `serialize`/`restore`에서 direction 보존
- `DaisyGame` 신규: `_init_flower`가 50회 시행 모두 `cw + ccw === 7`이며 `cw ≥ 2 && ccw ≥ 2`, `turnFlower(0)` 후 CCW로 강제된 꽃이 push/shift 시멘틱 따름

## 17. 회전 화살표 색상 코딩 (가독성)

피드백: 두 방향 꽃을 한눈에 구분하기 어렵다 → 화살표 색을 방향별로 다르게.

`draw_engine.ts`:
- **CW**: 빨강 `#D6303A`
- **CCW**: 파랑 `#1F6FE0`
- 흰색 후광 stroke은 그대로 (노란 디스크 위 가독성)
- 본체 굵기·호 형태 동일

색 결정 로직은 정적 헬퍼로 추출해 테스트 가능하게:

```ts
static readonly ARROW_COLOR_CW = "#D6303A";
static readonly ARROW_COLOR_CCW = "#1F6FE0";
static arrowColorFor(direction: number): string {
  return direction === -1 ? DrawEngine.ARROW_COLOR_CCW : DrawEngine.ARROW_COLOR_CW;
}
```

### 17.1 테스트 (87건, +4)

부트스트랩 `loadGame()`이 이제 `draw_engine.js`도 평가, `DrawEngine`을 노출 (클래스 본체에 DOM 접근이 없어 `new Function` 평가에 안전).

신규 `draw_engine.test.js`:
- CW(1) → `#D6303A` (= `ARROW_COLOR_CW`)
- CCW(−1) → `#1F6FE0` (= `ARROW_COLOR_CCW`)
- −1 외의 모든 입력(0, 2, NaN) → CW로 폴백
- CW 색과 CCW 색이 서로 다름 (식별 가능 보장)

## 18. 퍼즐 모드 — 100 레벨 / 별 등급 / 타임 어택 / 진행 영속화

피드백: "퍼즐모드가 부실해" — 100가지 레벨, 레벨별 목표 점수 + 타임 어택, 별 3개 등급, 단계별 잠금, 이전 레벨 재도전, 레벨별 최고 점수 DB 영속화.

### 18.1 레벨 설계 (deterministic)

```js
flowers(L) = clamp(2 + Math.floor((L-1) / 17), 2, 7)
  L1-17:2 / L18-34:3 / L35-51:4 / L52-68:5 / L69-85:6 / L86-100:7
colors(L)  = clamp(4 + Math.floor((L-1) / 33), 4, 7)
  L1-33:4 / L34-66:5 / L67-99:6 / L100:7
time(L)    = 90 - Math.floor((L-1) * 60 / 99) seconds   // 90s → 30s
target(L)  = 50 * L                                      // L1:50, L100:5000
```

별 등급: `score < target` → 0★(실패) / `< 1.5×` → 1★ / `< 2×` → 2★ / 그 외 → 3★

### 18.2 신규 모듈 `js/puzzle.js`

- `Puzzle.levelConfig(L)` — 위 식 그대로, [1,100] 범위 클램프
- `Puzzle.starRating(score, target)` — 0–3 별
- `PuzzleProgress` 클래스 — `localStorage` 키 `DaisyPuzzle`에 `{ v, unlocked, best }` JSON 영속화. 손상/없음 시 신규 상태로 폴백
  - `unlocked()`, `isUnlocked(L)`, `bestScore(L)`, `stars(L)`
  - `recordResult(L, score)` — best 갱신 + 클리어이면서 frontier일 때만 unlock+1, MAX_LEVEL에서 정지

### 18.3 가변 N (꽃 수) / 가변 색 수

- `Leaf(radius, colorCount=6)` — `_colorTable = [1..colorCount]`
- `Flower(index, colorCount=6)` — Leaf로 전달
- `DaisyGame._flowerCount` / `_colorCount` 멤버, `_init_flower`가 N개 꽃 생성·기존 hex 슬롯 첫 N개 사용·`FULL_LEAF_MAP`을 N에 맞게 필터·동색 충돌 해소·CW/CCW 분배(N≥4면 ≥2 보장)
- `_isPlayable` 일반화 — leafMap에서 인접 꽃 쌍 도출 후 색 교집합 검사 (모든 N에 작동)
- 색상 7번(`#FFA559`) 추가: `Effects.PARTICLE_COLOR`, `DrawEngine.PETAL_COLORS`

### 18.4 상태머신 + 퍼즐 흐름

- 새 상태 `LEVEL_SELECT_STATE = 4` + `isLevelSelectState()`
- `start(MODE_PUZZLE)` → IDLE에서 LEVEL_SELECT로 진입 (PLAY 직접 안 감)
- `playPuzzleLevel(L)` — 보드 N/색/타이머/스코어 리셋 → PLAY로
- `levelSelectPrev/Next/Play` — 좌/우 화살표·Play 버튼 동작
- 퍼즐 PLAY 타이머는 arcade와 같은 카운트다운; 0 도달 시 `_enterGameOver()`
- `_enterGameOver`가 퍼즐 모드면 `puzzleProgress.recordResult(L, score)` 호출
- `puzzleLevel()` / `puzzleProgress()` 게터 (FlowerLike-style 인터페이스)

### 18.5 GameEngine 확장

- `retryPuzzleLevel()` — 같은 레벨 다시 (resume 슬롯 삭제 후 `playPuzzleLevel`)
- `nextPuzzleLevel()` — frontier가 다음 레벨까지 unlock된 경우만 진행

### 18.6 키 라우팅 (`main.js` + `values.js`)

- 신규 키 코드: `NAV_PREV_KEY=205`, `NAV_NEXT_KEY=206`, `NEXT_LEVEL_KEY=207`
- 키보드: ←/→ 로 레벨 탐색, ENTER/S = 컨텍스트(PAUSE→resume, LEVEL_SELECT→play, PUZZLE GAME_OVER→retry, 그 외→endless)

### 18.7 UI (`draw_engine.ts`)

- **Level Select 화면**:
  - 정보 패널 (호박 외곽선 + 크림 배경): "Level X" / "Target T · Time Ts" / "Flowers F · Colors C" / "Best B"
  - 별 ★★☆ (반경 14px, 18 채움/공)
  - ◀ 둥근 버튼 (cx=70) · Play 버튼 (cx=200) · ▶ 둥근 버튼 (cx=330) — 잠긴 레벨엔 Play 위에 🔒
  - 하단 "Main Menu" 버튼
- **퍼즐 PLAY HUD**: 좌상단 `Lv X · Target T` 텍스트 (기존 우상단 SCORE + 상단 중앙 타이머에 추가)
- **퍼즐 GAME_OVER**:
  - 워드마크 "Cleared!" / "Failed"
  - 별 ★★★ (반경 18px)
  - "Score X / Target T" + "Best B"
  - 클리어 시: Next Level (녹색) + Retry (주황) — 실패 시: Retry만
  - 하단 "Main Menu"
- 추가 헬퍼: `_drawStars`, `_drawStar` (path 기반 5각 별), `_drawArrowButton`

### 18.8 Resume 통합

- DaisyGame.serialize에 `puzzleLevel` / `flowerCount` / `colorCount` 추가
- restore — 1..7 꽃을 받아 동적으로 flower array 재생성 + leafMap 서브셋 재구성
- 퍼즐 진행 중 일시정지/이탈 → 같은 레벨로 복귀

### 18.9 테스트 (111건, +24)

- `puzzle.test.js` (신규): levelConfig 경계/단계 (5건), starRating (4건), PuzzleProgress 신규/클리어/실패/베스트/영속화/손상/캡/regress방지/stars (9건)
- `daisygame.test.js`: `start(MODE_PUZZLE)` → LEVEL_SELECT, `playPuzzleLevel(1)` 2송이 4색, `playPuzzleLevel(100)` 7송이 7색, 퍼즐 타이머 카운트다운 + 만료 GAME_OVER, `puzzleLevel()` 비-퍼즐 0 (6건)

총 87 → **111건**.

## 19. Level Select Play 버튼 클릭 안 되던 문제 (회귀)

피드백: "puzzle mode에서 play 버튼 클릭 불가."

### 원인
1. `_drawFlowers`가 모든 상태에서 호출돼 LEVEL_SELECT 화면에서도 이전 세션의 7개 꽃이 패널 뒤에 그려짐. 그 중 중앙 꽃(200, 300, r=30)이 Play 버튼 위치(200, 305)와 거의 겹침.
2. 상태와 무관하게 `getEventCode`가 마지막에 꽃 hit-test를 돌려서, Play hit 영역 밖(예: 시각상 둥근 화살표와 Play 버튼 사이 32px 갭)을 클릭하면 뒤의 꽃이 잡혀 `KEY_X` → `turnFlower`로 라우팅. 그러나 LEVEL_SELECT 상태에선 `turnFlower`가 즉시 return → "클릭이 무반응"으로 보임.
3. `_drawFlowers`도 `for (i = 0; i < 7; i++)` 하드코딩 — 퍼즐 N=2 레벨에서는 `flowers[2..6]`이 undefined라 잠재적 크래시.

### 수정 (`src/draw_engine.ts`)

- `_drawFlowers`: LEVEL_SELECT 상태에선 조기 return, 그 외에도 `flowers.length`로 루프 (가변 N 안전)
- `getEventCode`의 꽃 hit-test 루프를 `isPlayState()`로 가드 (다른 상태에서는 어차피 `turnFlower`가 no-op이므로 정리)
- Play 버튼 hit 영역을 시각 130–270 → **95–305로 확장** (시각은 그대로, Prev / Next 사이 데드존을 모두 흡수). y는 281–329 그대로

### 테스트 추가 (113건, +2)

- `levelSelectPlay`가 unlocked 레벨에서 LEVEL_SELECT → PLAY 전이
- locked 레벨로 강제 설정 후 `levelSelectPlay`는 LEVEL_SELECT 유지 (no-op)

## 20. 퍼즐 모드에서 잎이 보충되지 않아 점수 누적 불가

피드백: "퍼즐 모드에서 꽃잎이 추가 생성이 안되서 게임 점수를 못채워."

### 원인

§18에서 퍼즐을 "보드 고정 + 막히면 GAME_OVER"로 구현했었는데, 그러면 초기 잎(2~7 꽃 × 6장)을 모두 매치하면 보드가 마르고 더 이상 점수를 올릴 수 없음. L1 타깃 50점은 N=2/색 4개로는 사실상 도달 불가능.

원작 퍼즐 모드 설명 ("take your time, plan your moves and maximize your score")도 시간 안에 매치를 쌓는 방식이지 보드 고갈 방식 아님.

### 수정 (`js/daisygame.js`)

- `increaseTick`에서 퍼즐 가드(`if (this._mode !== this.MODE_PUZZLE)`) 제거 — 잎 보충, cadence 보충, 단색 보너스 모두 모든 모드에서 작동
- 보충 임계치(`leaf_count < 21`)를 N에 맞춰 가변화: `Math.min(21, N * 3)` — N=2면 6, N=7이면 21
- `turnFlower`의 `_isPlayable === false` 분기 단순화: 모든 모드에서 `_init_flower()` 재시드 (퍼즐 GAME_OVER 분기 제거). 퍼즐은 **타이머 만료시에만** GAME_OVER

### 부수 수정 (`js/flower.js`)

- `Flower.addLeaf`가 하드코딩된 7-flower leafMap을 사용 → N<7 환경에서 `flowerArr[right_flower]`가 undefined일 때 크래시. `if (!flowerArr[right_flower]) continue;` 가드 추가

### 테스트 갱신 (113건 유지)

- 기존 "puzzle does not auto-refill" → "puzzle auto-refills cleared flowers" (정반대로 검증)
- 기존 "puzzle going non-playable → GAME_OVER" → "puzzle stays in PLAY when momentarily non-playable (board re-seeds)"

## 21. 데이지 비주얼 비례 보강 + 잎 생성 애니메이션

피드백: "꽃잎이 좀더 커지고 가운데 원이 좀 작아져야 더 데이지 꽃 같아 보임. 꽃잎 생성 애니메이션도 보강해."

### 21.1 비례 (`draw_engine.ts`)

| 항목 | 이전 | 이후 |
|---|---|---|
| 꽃잎 길이 | `small_radius * 2.4` (≈24) | `small_radius * 3.4` (≈34) |
| 꽃잎 너비 | `small_radius * 1.5` (≈15) | `small_radius * 1.9` (≈19) |
| 꽃잎 중심 거리 | `flower.radius + small_radius` (≈40) | `flower.radius` (≈30) |
| 디스크 반경 (시각) | `r * 0.95` (≈28.5) | `r * 0.6` (≈18) |
| 쿠션 링 반경 | `r * 1.05` (≈31.5) | `discR * 1.08` (≈19.4) |
| 회전 화살표 기준 | `r` 전체 | `discR` (작아진 디스크) |

꽃잎의 inner tip이 디스크 안쪽으로 밀려들어가 시각적으로 "디스크 밑에 꽂혀 있는" 진짜 데이지 느낌. 히트박스(`flower.radius`)는 그대로.

### 21.2 잎 생성 애니메이션 (`Leaf` + 호출부)

- `Leaf`에 `_birth` (0..`_birthMax=8`) 카운터 추가
  - 생성자: `_birth = _birthMax` (즉시 풀 사이즈, 기존 코드 호환)
  - `playBirth()` — 0으로 초기화하여 grow-in 애니메이션 시작
  - `advanceBirth()` — 매 호출 시 1 증가 (cap)
  - `size()`가 `lifeScale × birthScale`로 계산 → birth 단계엔 작게, 자라면서 풀 사이즈
- `Flower.addLeaf` — 새 잎에 `reset()` 직후 `playBirth()` 호출
- `DaisyGame._init_flower` 끝에 모든 잎 `playBirth()` → 레벨 시작 시 일제히 펴지는 인트로
- `DaisyGame._reduceLeaf` 매 틱 모든 잎 `advanceBirth()` 호출
- `Leaf.serialize/restore`에 `birth` / `birthMax` 포함 → resume 시 애니메이션 단계 보존

### 21.3 테스트 (118건, +5)

Leaf 신규:
- 생성자 직후 size = radius (애니메이션 없음, 기존 동작 보존)
- `playBirth()` 직후 size < radius
- `advanceBirth()` 반복 시 size가 단조 증가 + 최종 풀 사이즈 도달
- `reset()` 단독으로는 birth 미트리거 (size 그대로)
- `serialize → restore`가 birth 단계 보존

기존 통과 케이스(예: "Leaf reset rotates color and restores life")도 그대로 통과.

## 22. 후속 후보

- 남은 JS 파일들도 점진적으로 .ts로 이식 (현재는 ambient 선언으로 우회 중)
- `flower.js` / `leaf.js` 인덱스 0–6 / 1–6 매핑을 자료구조로 분리해 가독성 정리
- 콜아웃 텍스트 / 보너스 점수 테이블의 매직 넘버를 상수화
- 모바일 터치 제스처(스와이프로 회전 등) 검토
