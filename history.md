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

## 18. 후속 후보

- 남은 JS 파일들도 점진적으로 .ts로 이식 (현재는 ambient 선언으로 우회 중)
- `flower.js` / `leaf.js` 인덱스 0–6 / 1–6 매핑을 자료구조로 분리해 가독성 정리
- 콜아웃 텍스트 / 보너스 점수 테이블의 매직 넘버를 상수화
- 모바일 터치 제스처(스와이프로 회전 등) 검토
