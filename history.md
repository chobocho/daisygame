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

## 22. 단일 매치 점수 1 → 5 (퍼즐 목표 도달성)

피드백: "퍼즐 모드에서 꽃잎 한 쌍 없애면 점수가 1점이라 목표 점수 도달이 힘들어. 한 쌍에 5점은 줘."

### 변경 (`js/daisygame.js`)

`checkCollision`의 turn 당 점수 테이블을 `[0, 1, 10, 20, 50, 128, 256, …]` → `[0, 5, 10, 20, 50, 128, 256, …]`. 1쌍 매치만 5로 상향, 나머지 동시 매치 점수는 그대로.

영향:
- 퍼즐 L1 목표 50점이 1쌍 = 5점이라 10회 매치로 충분 (시간 안에 도달 가능)
- 아케이드 / 엔드리스 모드 모두 동일하게 적용 (코드 단순)
- 콤보 보너스(2쌍 = 10점, 3쌍 = 20점, …) 효과는 1쌍이 5로 상향되면서 약간 줄어듦. 그래도 4쌍 이상은 여전히 가파른 보상

### 테스트 (119건, +1)

- 단일 매치가 정확히 5점을 부여하는지 결정론적 케이스 (모든 잎 제거 후 한 쌍만 강제 배치, CW 회전 후 `_leafMap[0][0]`으로 매치)

## 23. 퍼즐 모드: 100 레벨 그리드 (잠금 / 별 / 베스트 한 화면)

피드백: "퍼즐 모드를 들어가면 1-100 단계 스테이지가 보이고, 아직 열리지 않은 레벨은 자물쇠로 잠겨있고, 해결한 레벨은 최고 점수와 3단계 별표 점수로 표시되어야 하고, 터치로 해결한 판을 다시 도전해서 별을 업데이트할 수 있어야 해."

### 23.1 UI 재설계 (`draw_engine.ts`)

이전엔 한 번에 한 레벨만 보여주는 패널 + ◀ Play ▶ 화살표였음. 100개를 한눈에 못 보고, 베스트 갱신을 위해 매번 화살표로 이동해야 했음.

신규: **10×10 그리드** (cell 36×40, 단일 페이지)
- 그리드 영역: y=100..500 (400px), x=20..380 (360px)
- 각 cell:
  - 잠긴 레벨 → 회색 배경 + 🔒
  - 1★ 이상 → 크림색 배경(`#FFEFA8`)
  - 3★ → 황금 배경(`#FFD56B`)
  - 0★ unlocked → 흰 배경
  - 셀 내용: 상단 레벨 번호(11px bold), 중앙 별 3개(반경 2.4px), 하단 베스트 점수(9px, > 0일 때만)
  - 현재 선택 레벨엔 빨간 ring 강조
- y=540: Main Menu 버튼

기존 `_drawLevelSelectPanel` (정보 패널 / 별 / 화살표 / Play 버튼 / 락 오버레이) 통째 제거.

### 23.2 터치 라우팅

- DrawEngine `_hitGridCell(x, y)`: 캔버스 좌표를 그리드 셀로 역변환, 1..100 레벨 번호 반환
- `_hitLevelSelect`가 그리드 hit → `LEVEL_TAP_BASE(1000) + level` 합성 코드 반환
- `main.js processKeyEvent`가 1001..1100 범위면 `daisyGame.selectAndPlayLevel(level)` 호출
- `DaisyGame.selectAndPlayLevel(level)`: LEVEL_SELECT 상태 + unlocked 레벨일 때만 `_puzzleLevel` 갱신 + `playPuzzleLevel` 호출. 잠긴 레벨 탭은 silent no-op

키보드 ←/→ 는 기존 `levelSelectPrev/Next` 그대로(현재 선택 레벨에 빨간 ring), Enter는 `levelSelectPlay`로 선택 레벨 시작 — 그리드와 병행.

### 23.3 테스트 (122건, +3)

- `selectAndPlayLevel(1)` → unlocked 레벨이면 PLAY 진입 + `puzzleLevel === 1`
- `selectAndPlayLevel(50)` → 잠금이면 LEVEL_SELECT 유지 + `puzzleLevel`은 50으로 안 바뀜
- `puzzleProgress._unlocked = 7` 강제 후 `selectAndPlayLevel(3)` → frontier 미만 임의 레벨도 정상 시작 (재도전 시나리오)

## 24. 퍼즐 PAUSE에서 Level Select로 가는 메뉴

피드백: "puzzle 모드에서는 pause할 때, 레벨 선택 화면으로 가는 메뉴가 필요해."

### 24.1 흐름

PAUSE → "Level Select" 탭 → 현재 라운드 점수 폐기 + resume 슬롯 삭제 + 100-레벨 그리드로 복귀. 사용자가 다른 레벨을 고르거나 같은 레벨을 신선한 상태로 다시 시작 가능.

### 24.2 변경

- `js/values.js`, `src/globals.d.ts` — `LEVEL_SELECT_KEY = 210` 추가
- `js/daisygame.js`:
  - `exitToLevelSelect()` — `init()`로 score/board 리셋, mode 강제 `MODE_PUZZLE`, `_puzzleLevel`을 unlocked frontier로, state를 `LEVEL_SELECT_STATE`로
- `js/game_engine.js`:
  - `gotoLevelSelect()` — `needToSaveScore`면 setScore, `clearResume`, `_game.exitToLevelSelect()` 호출
- `js/main.js` — `LEVEL_SELECT_KEY` 케이스를 `daisyGame.isPauseState()` 가드로 라우팅
- `src/draw_engine.ts`:
  - PAUSE 화면이 `mode === 1`(puzzle)이면 **3-버튼 레이아웃**: Resume(cy=120) / Level Select 🧩(cy=180) / Main Menu(cy=240). 일반 모드는 기존 2-버튼 그대로
  - PAUSE 히트박스도 모드별 분기 — Resume Y / Menu Y가 puzzle이면 다른 위치, 가운데에 Level Select 박스 추가

### 24.3 테스트 (125건, +3)

- `DaisyGame.exitToLevelSelect`: PAUSE에서 호출 시 LEVEL_SELECT 진입 + mode = puzzle 유지
- `DaisyGame.exitToLevelSelect`: 진행 중 누적된 score를 0으로 리셋(라운드 폐기 시멘틱)
- `GameEngine.gotoLevelSelect`: PAUSE 중 호출 → LEVEL_SELECT 전이 + resume 슬롯 삭제 + score 0
- 부수: 기존 "turnFlower scores when a forced color match" 테스트가 random direction 할당에 의존하던 flaky 케이스 → `flowers[0].set_direction(1)`로 결정론화

## 25. 무지개 꽃잎 (와일드카드 매치, 8점, grow+fade death)

피드백: "어떤 꽃잎과도 매칭이 되는 무지개 꽃잎을 넣어줘. 없앨 수 있는 꽃잎의 조합이 없거나 8~10초마다 빈 자리에 하나씩 생기게 해줘. 점수는 8점으로 해줘. 사라질때 이펙트는 꽃잎이 커지면서 사라지게 해줘."

### 25.1 데이터 모델

- `Leaf._color = 8` → **무지개**. 정상 색상 테이블(1..7)에는 절대 들어가지 않음 — `setRainbow()`로만 도달
- 새 API:
  - `setRainbow()` — color = 8, life = origin_life
  - `isRainbow()` — color === 8
  - `get_life_ratio()` / `get_birth_ratio()` — 렌더용 0..1 비율 (grow+fade death용)

### 25.2 매치 로직 (`checkCollision`)

```js
const colorMatch = (ll.color() === rl.color()) || ll.isRainbow() || rl.isRainbow();
```

무지개는 와일드카드. 점수:
```js
const gained = scoreTable[removedLeaf] + 3 * rainbowPairs;
```
정상 단일 매치 5점은 그대로, 무지개 관여 매치마다 +3 (5+3=8). 동시 2쌍 모두 무지개 = 10+6=16, 단일 무지개 짝 = 8.

### 25.3 스폰 로직 (`increaseTick`)

- `_rainbowCooldown` 카운터, 시작 시 8~10초(270~333틱)에서 랜덤 초기화
- 매 틱 감쇠. 0 도달 시 또는 `!_isPlayable() && !_hasRainbow()` 시 스폰
- `_trySpawnRainbow()`: color=0인 빈 슬롯들 수집 → 랜덤 1개 선택 → `setRainbow()` + `playBirth()` + `_leaf_count` 증가
- 스폰 후 쿨다운 재초기화

### 25.4 데드락 회피 (`_isPlayable`)

```js
if (this._hasRainbow()) return true;
```

보드에 무지개가 있으면 회전 한 번이면 반드시 매치 가능 → 즉시 true. 기존 leaf_count<6 / 색 교집합 검사보다 빠른 출구.

### 25.5 렌더 (`_drawRainbowPetal`)

`_drawPetal`과 동일 베지어 path지만 무지개 7-stop linear gradient(빨강→주황→노랑→초록→청록→파랑→보라). 외곽선 + 흰색 sparkle 하이라이트. caller가 `alpha`를 넘김.

### 25.6 Grow-and-Fade Death

`_drawFlower`에서 무지개 잎 분기:

```ts
if (leaf.isRainbow()) {
  const lifeFrac = leaf.get_life_ratio();
  const birthFrac = leaf.get_birth_ratio();
  const dying = !leaf.isAlive() && lifeFrac > 0;
  const scale = dying
    ? birthFrac * (1 + (1 - lifeFrac) * 0.7)  // 1.0 → 1.7로 grow
    : lifeFrac * birthFrac;
  const alpha = dying ? lifeFrac : 1;          // 1.0 → 0 fade
  // ...
}
```

`Leaf.reduceSize`가 매 틱 life를 깎으면 무지개는 보통 잎처럼 줄어드는 게 아니라 **확대되며 투명해짐**.

### 25.7 테스트 (132건, +7)

Leaf:
- `setRainbow` → color 8, alive
- `get_life_ratio` / `get_birth_ratio` 정상 노출

DaisyGame:
- 무지개 + 정상 색 매치 → 8점
- 무지개 + 무지개 매치 → 8점 (단일쌍 보너스)
- `_trySpawnRainbow`가 빈 슬롯에 정확히 1개 무지개 배치
- `_trySpawnRainbow`는 빈 슬롯 없으면 false 반환
- `_isPlayable`이 보드에 무지개 있으면 즉시 true

## 26. 색상별 차등 점수 (2 + 1..7) + 콤보 보너스 제거

피드백: "꽃잎을 없애면 주는 점수는 2점으로 하고, 색상별 차등 점수를 줘. 1점부터 7점으로. 꽃잎은 최대 7가지 색상이야."

### 변경 (`checkCollision` in `js/daisygame.js`)

per-pair 공식:
- 정상 매치: `2 (base) + COLOR_BONUS[color]` — 색상 1: **3점**, 색상 7: **9점**
- 무지개 관여: 기존대로 **8점** 고정 (단일 매치 = 5+3 = 8과 동일)

기존 `scoreTable[removedLeaf]` (5/10/20/50/128/256) 콤보 룩업 제거. 콤보는 per-pair 점수의 합으로 자연스럽게 누적 (예: 색상 5 동시 2쌍 = 7+7 = 14).

| 조합 | 이전 | 이후 |
|---|---|---|
| 단일 색상 1 매치 | 5 | 3 |
| 단일 색상 5 매치 | 5 | 7 |
| 단일 색상 7 매치 | 5 | 9 |
| 단일 무지개 매치 | 8 | 8 (보존) |
| 색상 3 동시 2쌍 | 10 | 5+5 = 10 (우연 일치) |
| 색상 7 동시 4쌍 | 50 | 9×4 = 36 |
| 색상 7 동시 6쌍 | 256 | 9×6 = 54 |

대형 콤보의 폭발적 보너스가 사라지고 색상 다변성이 점수에 직접 기여. 고레벨(색상 6~7개)에서 평균 페어 점수가 자연스럽게 상승해 타겟 도달 패턴이 색상에 의존.

### 테스트 (135건, +3)

- 색상 1 매치 → 3점
- 색상 7 매치 → 9점
- 색상 1..7 전체 ramp 검증 (각각 `2 + c`)
- 기존 "single matched pair awards 5" — 색상 3 사용 → 2+3=5 그대로 통과
- 무지개 8점 / 무지개+무지개 8점 — 기존 동작 유지

## 27. 퍼즐 60초 고정 + 막힘 시 빈 슬롯 즉시 보충

피드백: "퍼즐 모드는 빠른 진행과 재미를 위해서 시간 제한이 있어야 해. 60초로 타임을 제한하고, 퍼즐 모드에서는 매칭할 색상의 꽃잎이 없으면 빈 자리에 꽃잎이 1초 안에 생성되게 해줘."

### 27.1 시간 제한 60초 고정 (`puzzle.js`)

`Puzzle.levelConfig.timeSeconds`: 90 - floor((L-1)*60/99) 곡선 → **flat 60** 고정. 모든 레벨 동일 시간, 난이도는 꽃 수(2→7) / 색상(4→7) / 타깃(50*L)으로만 차등.

### 27.2 막힘 시 즉시 보충 (`daisygame.js`)

새 `_fillEmptySlots()`:
- `color === 0`인 모든 슬롯에 직접 `reset()` + `playBirth()`
- `_leaf_count` 보정 (cap 6)
- 즉시 채움 → birth 애니메이션 8틱(약 240ms) → 1초 안에 시각 완성

`turnFlower`의 막힘 분기:
- 퍼즐: `_init_flower()` 보드 전체 리셋 X → `_fillEmptySlots()`만 호출 (생존 잎 색 보존)
- 그 외 모드: `_init_flower()` 그대로

이전엔 막힘 → 보드 리셋(생존 잎 색 다 잃음). 이제 막힘 → 빈 자리에만 새 색 할당. 살아있는 잎/색 사이클은 그대로 유지되니 플레이어의 진행 컨텍스트가 끊기지 않음.

### 27.3 테스트 (137건, +3)

- `Puzzle.levelConfig` 모든 레벨이 60초 (1, 25, 50, 75, 99, 100 샘플 검증)
- 기존 90/30 시간 검증 → 60으로 갱신
- 퍼즐 막힘 직후 빈 슬롯이 채워지고, 살아 있는 잎(fingerprint)은 보존 (보드 전체 리셋 안 일어남)

## 28. 퍼즐 모드 좌측 세로 꽃잎 스택 타이머

피드백 1차: "퍼즐모드에서도 아케이드 모드처럼 시간이 나와야함."

피드백 2차: "스코어랑 시간이 겹쳐 보여. 퍼즐 모드에서 시간은 좌측에 세로로 꽃잎을 쌓아두고 하나씩 떨어지는 효과로 하자. 좌측 하단에 숫자로도 작게 표시되고."

### 28.1 1차 시도와 한계

`_drawTimer()`는 `mode() !== 0`이면 즉시 return — 퍼즐에서 시간이 아예 안 그려지고 있었음. 우상단(`x=380, y=18/44`)에 `bold 22px` 타이머를 추가했더니 동일 영역의 `_drawScoreHud` "SCORE" 라벨/숫자와 정확히 겹쳤음.

### 28.2 시각 디자인: 세로 꽃잎 스택

12장의 꽃잎(`COLOR_CYCLE = [2, 5, 4, 6, 7, 3]`로 색상 순환)을 좌측 세로(`x=24, y=92~`)에 22px 간격으로 쌓고, 매 5초마다(`SEC_PER_PETAL = totalSec / 12`) 맨 위 한 장이 낙하. 낙하 단계는 자기 5초 윈도우 진입과 동시에 시작해 윈도우 종료 시 사라짐:

```ts
const dropY = topProg * topProg * 36;          // ease-in 추락
const driftX = Math.sin(topProg * 2.4) * 6;    // 좌우 흔들림
const rot = topProg * 0.7;                     // 살짝 회전
bufCtx.globalAlpha = Math.max(0, 1 - topProg * topProg);  // ease-out 페이드
```

기존 `_drawPetal(cx, cy, angleRad, length, width, palette)` 헬퍼를 그대로 재활용 — 게임 내 꽃잎과 동일한 베지어 패스 + 그라데이션 + 흰 sheen이라 보드의 꽃잎과 톤이 자연스럽게 이어짐.

`displayedCount = ceil(secF / SEC_PER_PETAL)` 으로 가시 개수를 결정하고, `topProg`만 fractional. 즉 12장 정적 + 1장 애니메이션이 아니라 (displayedCount-1)장 정적 + 1장이 자기 윈도우 안에서 진행률 0→1로 진행 — 정수 초마다 점프하지 않고 매 틱(30ms)마다 부드럽게 이동.

좌측 하단(`x=10, y=580`)에 작은 `bold 14px M:SS` 텍스트도 같이 표시. 10초 이하면 `#FF5050` 빨강.

### 28.3 fractional 시간 노출

기존 `timerSeconds()`는 `Math.ceil(_timerTicks * 30 / 1000)` — 정수 초로 스냅. 부드러운 낙하 애니메이션을 위해 `daisygame.js`에 천장 함수를 빼고 그대로 반환하는 `timerSecondsFloat()`을 추가, `globals.d.ts`의 `DaisyGameLike` 인터페이스도 확장.

```js
timerSecondsFloat() {
    if (this._mode === this.MODE_ARCADE) {
        return Math.max(0, this._timerTicks * 30 / 1000);
    }
    if (this._mode === this.MODE_PUZZLE && this.isPlayState()) {
        return Math.max(0, this._timerTicks * 30 / 1000);
    }
    return 0;
}
```

PAUSE 진입 시 `isPlayState() === false` → 0 반환 → 일시정지 중 꽃잎이 사라지지만, 어차피 PAUSE 오버레이가 화면 전체를 덮어 가시성 차이는 없음.

### 28.4 운영 사고: TypeScript 빌드 파이프라인 인지

`js/draw_engine.js`를 직접 편집한 변경이 두 차례 사라졌음. 원인은 `daisygame/src/draw_engine.ts` → `tsc -p daisygame/tsconfig.json` → `js/draw_engine.js` 자동 생성 파이프라인. CLAUDE.md에는 런타임 모델만 적혀 있고 빌드 단계는 #4에서만 언급. `.ts` 소스를 편집한 뒤 `npm run build`로 컴파일하는 것이 기본 흐름. (개인 메모리에 영구 저장.)

### 28.5 테스트 (142건, +5)

`tests/daisygame.test.js`에 `timerSecondsFloat` 검증 추가:

- `_timerTicks = 1234` → `37.02` (정확한 부동소수)
- 한 틱 진행 시 정확히 `0.03s` 감소 — 정수 초로 스냅하는 `timerSeconds`와 차별화
- ENDLESS 모드 / 퍼즐 LEVEL_SELECT 상태에서 0
- 퍼즐 PLAY 진입 후 양수 + `_timerTicks * 30 / 1000`과 일치
- PAUSE 중 0 → resume 후 다시 양수 (틱 보존)

## 29. 황금 꽃잎 이벤트 (9점, 2~5초)

피드백: "매 8초마다 2-5초간 잠시 나타났다가 사라지는 황금 꽃잎 이벤트를 만들어줘. 반드시 없앨수 있는 인접 두 꽃 사이에 생기고, 점수는 9점이야. 만약 꽃잎을 만들 자리가 없으면 기존 꽃잎 색상을 황금빛으로 바꾸고 시간내 못없애면 원래 색으로 바꿔주오. 황금 꽃잎은 사라질때 이펙트는 꽃잎이 커지면서 사라지게 해줘."

### 29.1 색상 9 = 황금 와일드카드

레인보우(8)와 같은 패턴 — `Leaf.setGolden() / isGolden()`. `_color === 9`. 와일드카드 동작도 동일하게 `checkCollision`이 `ll.isGolden() || rl.isGolden()`을 매치 조건에 추가. 점수는 페어당 **9점** 고정 (rainbow 8점, 일반 색상 2 + 1..7과 차별화).

레인보우와 황금이 동시에 페어 매치되면 황금 점수가 우선 (`isGolden ? 9 : isRainbow ? 8 : 2 + bonus`).

### 29.2 라이프사이클 (`daisygame.js`)

```js
this.GOLDEN_INTERVAL_TICKS = 267; // ≈ 8s
this.GOLDEN_LIFE_MIN_TICKS = 67;  // ≈ 2s
this.GOLDEN_LIFE_MAX_TICKS = 167; // ≈ 5s
this.GOLDEN_DYING_TICKS = 12;     // ≈ 360ms grow + fade tail
```

`increaseTick`에 레인보우 쿨다운 직후 추가:

```js
this._goldenCooldown--;
if (this._goldenCooldown <= 0 && this._activeGolden === null) {
    this._trySpawnGolden();
    this._goldenCooldown = this.GOLDEN_INTERVAL_TICKS;
}
if (this._activeGolden !== null) {
    this._activeGolden.ticksLeft--;
    if (this._activeGolden.ticksLeft <= 0) {
        this._expireGolden();
    }
}
```

활성 황금이 있으면 새로 스폰하지 않음 — 화면에 동시 1개만.

### 29.3 스폰 위치: `_leafMap` 경계 슬롯만

"반드시 없앨수 있는 인접 두 꽃 사이에" → `_collectGoldenBoundarySlots()`이 모든 `_leafMap` 페어를 순회해 양쪽 슬롯을 수집. 황금은 이 boundary 집합에서만 뽑힘 — 다른 꽃에 닿지 않는 슬롯엔 생기지 않음.

선택 우선순위:
1. **빈 슬롯(empties) 우선** — 새 꽃잎으로 채움. `wasEmpty=true`, `playBirth()` 호출, `_leaf_count++`.
2. **빈 슬롯 없으면 변환** — `isAlive() && !isRainbow() && !isGolden()`인 잎을 골라 `setGolden()`. 변환 직전 `{color, life, birth}` 스냅샷을 `_activeGolden.snapshot`에 저장.
3. 둘 다 없으면 `false` 반환 (이번 사이클은 이벤트 패스).

레인보우 잎은 보호 — 황금이 레인보우를 덮어쓰지 않음.

### 29.4 만료 처리

```js
_expireGolden() {
    const { flower, idx, wasEmpty, snapshot } = this._activeGolden;
    const l = this._flowerArr[flower].leaf[idx];
    if (l.isGolden()) {
        if (wasEmpty) {
            l._color = 0;
            l._life = 0;
            f._leaf_count = Math.max(0, f._leaf_count - 1);
        } else if (snapshot) {
            l._color = snapshot.color;
            l._life = snapshot.life;
            l._birth = snapshot.birth;
        }
    }
    this._activeGolden = null;
}
```

`isGolden()` 가드 — 만료 전에 매치되어 이미 라이프 카운트다운 중이면 건드리지 않음. 매치 시점에 `checkCollision`이 활성 황금 슬롯 매치를 감지하면 즉시 `_activeGolden = null`로 정리.

### 29.5 grow-and-fade 사라짐 이펙트

마지막 `GOLDEN_DYING_TICKS = 12` 틱 동안 꽃잎이 1.0 → 1.7배로 커지면서 alpha 1 → 0으로 페이드. 레인보우 죽음 애니메이션과 동일한 공식이지만 트리거가 다름:
- 레인보우: `!leaf.isAlive() && lifeFrac > 0` (실제 라이프 감소가 트리거)
- 황금: `activeGolden.ticksLeft <= dyingTicks` (별도 이벤트 타이머가 트리거 — 라이프는 풀로 유지)

`draw_engine.ts`에 `_drawGoldenPetal` 추가 — 베지어 path는 `_drawPetal`/`_drawRainbowPetal`과 동일, 그라데이션은 `#8B6508 → #FFC83C → #FFE56B → #FFF6A8` (인쪽 진한 호박색에서 바깥쪽 옅은 노랑). 외곽선 `rgba(120,80,0,0.65)` + 흰 sparkle 하이라이트로 광택감.

`DaisyGame.activeGolden()`이 `{flower, idx, ticksLeft, dyingTicks, wasEmpty}`를 노출 — 드로우 엔진이 매 프레임 읽어 dying 윈도우 진입 여부를 판정.

### 29.6 _isPlayable에 황금 단축 회로

```js
if (this._hasRainbow() || this._hasGolden()) return true;
```

레인보우와 마찬가지로 황금이 와일드카드라 보드에 한 장만 있어도 매칭 가능 → 막힘 판정에서 즉시 true 반환.

### 29.7 테스트 (158건, +16)

`tests/leaf.test.js`:
- `setGolden` → color 9, alive, isRainbow false

`tests/daisygame.test.js`:
- `_trySpawnGolden`이 항상 `_leafMap` boundary 슬롯에 스폰
- `activeGolden()`의 `ticksLeft`가 67..167 범위 (2~5초)
- 활성 중 추가 스폰 무시 (no-op)
- 빈 슬롯 우선 선택 (`wasEmpty=true`)
- 빈 슬롯 없으면 변환 + 스냅샷 저장
- 레인보우 잎은 보호
- `_expireGolden` — 빈 슬롯 경로: 슬롯 비움 + leaf_count 감소
- `_expireGolden` — 변환 경로: 스냅샷 색상/라이프 복구
- `increaseTick`에서 ticksLeft 감소
- 자동 만료 (ticksLeft → 0)
- 매치 시 9점
- 황금 vs 레인보우 매치도 9점 (황금 우선)
- 매치 시 `_activeGolden = null` 즉시 정리
- 모노크롬 보드여도 황금이 있으면 `_isPlayable() === true`
- `init` / `playPuzzleLevel`이 쿨다운/활성 상태 리셋

## 30. 황금 잎 페어 매칭 — gold↔gold/rainbow only

피드백: "황금색은 황금색 혹은 무지개색이랑 매칭 대어야해. 그래서 황금색은 생길때 마주하는 2개의 꽃에서 생겨야 해."

29번에서 도입한 황금 잎은 와일드카드 동작(어떤 색과도 매치) + 단일 잎 스폰이었음. 이제 두 가지를 동시에 변경:

### 30.1 매치 규칙 변경 (`checkCollision`)

```js
if (llIsGold || rlIsGold) {
    // Gold only matches another gold or a rainbow.
    colorMatch = (llIsGold || llIsRainbow) && (rlIsGold || rlIsRainbow);
} else {
    colorMatch = (ll.color() === rl.color()) || llIsRainbow || rlIsRainbow;
}
```

황금이 일반 색상과 매치되지 않음 → 황금 잎 한 장만 보드에 있으면 일반적으로 매치 불가. 그래서 "마주하는 2개의 꽃" 페어로 스폰해야 매치 가능.

레인보우 잎의 와일드카드 동작은 그대로 유지 (모든 색과 매치). 황금 vs 레인보우는 황금 점수(9) 우선.

### 30.2 페어 스폰 (`_trySpawnGolden`)

`_collectGoldenBoundarySlots()` (단일 슬롯 수집) 제거. 대신 `_leafMap`을 직접 순회하며 페어 후보 수집:

```js
for (const flower_pairs of this._leafMap) {
    for (const [aCode, bCode] of flower_pairs) {
        // 양쪽이 모두 빈 슬롯이거나 살아있는 일반 잎이어야 후보
        // (레인보우/황금/사망 진행 중 잎은 제외)
        candidates.push({ slotA, slotB, emptyCount });
    }
}
```

스폰 시 페어 양쪽 모두에 `setGolden(snapshot)` 호출 — 두 장 동시 생성. 우선순위: 양쪽 빈 슬롯 페어 → 한쪽 빈 + 한쪽 alive → 양쪽 alive 변환.

### 30.3 회전 안전한 스냅샷 — `Leaf`에 저장

29번에서는 `_activeGolden = {flower, idx, ..., snapshot}`이 슬롯 포지션을 들고 있었음. 페어 도입 후 잎이 회전으로 다른 슬롯에 옮겨가도 정확히 복구해야 하므로 스냅샷을 **잎 객체 자체**에 저장.

```js
// leaf.js
setGolden(snapshot) {
    this._color = 9;
    this._life = this._origin_life;
    this._goldSnapshot = snapshot || null;  // null = 빈 슬롯이었음
}

revertFromGolden() {
    if (this._color !== 9) return false;
    const snap = this._goldSnapshot;
    this._goldSnapshot = null;
    if (snap) {
        this._color = snap.color;
        this._life = snap.life;
        this._birth = snap.birth;
        return false;  // 다른 색으로 복구
    }
    this._color = 0;
    this._life = 0;
    return true;  // 슬롯이 비어졌음 → caller가 leaf_count 감소
}

clearGoldenState() {
    this._goldSnapshot = null;  // 매치되어 사라질 때 호출
}
```

`flower.turn()`이 잎 배열을 회전시켜도 잎 객체 자체가 이동하므로 `_goldSnapshot`이 같이 따라감. 만료 시 `_expireGolden`이 보드를 스캔해 모든 황금 잎을 revert.

### 30.4 `_activeGolden` 단순화

이제 슬롯 정보 없이 `{ticksLeft}`만:

```js
this._activeGolden = { ticksLeft: this._nextGoldenLifeTicks() };
```

`activeGolden()` API도 `{ticksLeft, dyingTicks}`로 축소. draw 엔진은 슬롯 매칭 검사 없이 모든 황금 잎에 dying 진행률을 일괄 적용.

### 30.5 매치된 황금의 시각 분기

황금 잎의 라이프 상태에 따라 세 갈래 렌더링:

```ts
if (matched) {
    // life < origin → 일반 잎과 같은 shrink 애니메이션
    scale = lifeFrac * birthFrac;
    alpha = 1;
} else if (ag && ag.ticksLeft <= ag.dyingTicks) {
    // 활성 + 마지막 12틱 → grow + fade 만료 이펙트
    const dyingProg = 1 - Math.max(0, ag.ticksLeft) / ag.dyingTicks;
    scale = birthFrac * (1 + dyingProg * 0.7);
    alpha = 1 - dyingProg;
} else {
    // 활성 + 풀 라이프 → 정상 크기
    scale = birthFrac;
    alpha = 1;
}
```

매치되어 사라지는 황금은 grow 안 함 — 일반 매치 잎과 동일한 shrink. 시간 만료로 사라지는 황금만 grow + fade.

### 30.6 serialize/restore 정리

`serialize()`가 활성 황금이 있으면 `_expireGolden`을 호출해 미리 정리 — 변환된 잎은 원래 색으로 돌아간 상태로 스냅샷됨. resume 시 transient 이벤트는 사라지고 cooldown은 새로 시작.

```js
serialize() {
    if (this._activeGolden) this._expireGolden();
    return { ... };
}

restore(d) {
    // ...
    this._goldenCooldown = this.GOLDEN_INTERVAL_TICKS;
    this._activeGolden = null;
    this._state = this.PAUSE_STATE;
}
```

### 30.7 테스트 (160건, +2)

29번 테스트들을 새 의미체계로 다시 작성:
- `_trySpawnGolden`이 항상 정확히 2장 스폰, 두 잎이 다른 꽃에 위치
- 두 잎의 슬롯이 `_leafMap` 페어를 이룸
- 빈 보드 → 양쪽 모두 wasEmpty (snapshot null)
- 가득 찬 보드 → 양쪽 모두 변환 + 스냅샷 보유
- 레인보우 잎이 있는 슬롯은 페어 후보에서 제외
- 만료 시 양쪽 모두 빈 슬롯이면 둘 다 비움 + leaf_count 감소
- 만료 시 양쪽 모두 변환이면 둘 다 원래 색 복구
- 황금-황금 매치 → 9점
- 황금-레인보우 매치 → 9점 (황금 우선)
- **(새로) 황금 vs 일반색 → 매치 안 됨, 황금 그대로 살아있음**
- 매치 시 `_activeGolden = null` 즉시 정리
- `_isPlayable`이 황금 페어만으로도 true
- `init` / `playPuzzleLevel` 리셋
- **(새로) `serialize`가 활성 황금을 사전 만료 → 변환된 잎이 원래 색으로 복구된 상태로 직렬화**

기존 `clearBoard` 헬퍼는 `_leaf_count`를 0으로 리셋하지 않도록 수정 — 그러지 않으면 일곱 꽃이 모두 빈 상태로 보여 `_playEffectSound`의 monochrome 보너스(`scoreTable[7] = 1216`)가 발동해 단일 페어 점수 검증을 흐트림.

## 31. 퍼즐 모드 연쇄 콤보 (×1.2 누적)

피드백: "퍼즐 모드에서 1초 이내에서 계속 없애면 점수가 1.2배씩 증가하는 연쇄모드가 필요해. 사용자의 도파민을 위한 이벤트야."

### 31.1 메커니즘

퍼즐 모드 한정. 직전 매치 후 `COMBO_WINDOW_TICKS = 33` (약 1초) 안에 새로 매치하면 multiplier가 ×1.2 누적:

| Match # (chain alive) | Multiplier |
|---|---|
| 1 (체인 시작) | 1.0× |
| 2 (1초 내) | 1.2× |
| 3 (1초 내) | 1.44× |
| 4 | 1.728× |
| ... | ... |

윈도우가 만료(`_comboCooldown` 0 도달)되면 다음 매치는 다시 1.0×부터 시작. multiplier에는 캡 없음 — 60초 라운드의 자연 한계가 사실상 캡 역할.

스케일은 페어 점수(`gained`)에만 적용. 꽃 비움 보너스(`scoreTable[count]` 100..1216)와 모노크롬 보너스(88)는 그대로 유지 — "운으로 한 번에 큰 점수가 들어오는" 이벤트까지 폭발하면 기획 의도(빠른 연쇄 플레이 보상)가 흐려지므로.

### 31.2 구현 (`daisygame.js`)

```js
// constructor
this.COMBO_WINDOW_TICKS = 33;
this.COMBO_STEP = 1.2;
this._comboMultiplier = 1.0;
this._comboCooldown = 0;
```

`checkCollision`에서 점수 누적 직전:

```js
let multiplier = 1.0;
if (this._mode === this.MODE_PUZZLE && gained > 0) {
    if (this._comboCooldown > 0) {
        this._comboMultiplier *= this.COMBO_STEP;  // 체인 살아있음
    } else {
        this._comboMultiplier = 1.0;               // 끊김 — 리셋
    }
    multiplier = this._comboMultiplier;
    this._comboCooldown = this.COMBO_WINDOW_TICKS;
}
const scaledGained = (multiplier > 1.0) ? Math.floor(gained * multiplier) : gained;
this.increaseScore(scaledGained);
```

`increaseTick`에서 매 틱 cooldown 감소 + 만료 시 multiplier 1.0으로 리셋:

```js
if (this._comboCooldown > 0) {
    this._comboCooldown--;
    if (this._comboCooldown === 0) {
        this._comboMultiplier = 1.0;
    }
}
```

`init` / `playPuzzleLevel` / `restore`에서 모두 콤보 상태 리셋.

### 31.3 시각 피드백

도파민 이벤트인 만큼 시각 피드백을 분리:

- `Effects.popScore`에 `popColor` 인자 — multiplier > 1.0이면 따뜻한 #E25E2A (코랄/오렌지), 아니면 기존 #3a2a18 (다크 브라운).
- `Effects.callout(text, "combo")` — 새 kind. text는 `"x" + multiplier.toFixed(2)` (예: `x1.20`, `x1.44`, `x1.73`). multiplier가 10 이상이면 정수 반올림.
- 기존 "Daisy Chain!" / "Flower Power!" 콜아웃과 시각 충돌 방지를 위해 combo 콜아웃은 y=160(위쪽)에 배치, 기존 클리어 콜아웃은 y=200 (중앙). 동시 발생 시 두 줄로 보임.
- combo 콜아웃 그라데이션: `#FFE56B` (라이트 골드) → `#E25E2A` (웜 코랄). "hot streak" 느낌.

`effects.ts`의 `Callout.kind` 유니온 확장: `"chain" | "power" | "combo"`.

### 31.4 테스트 (168건, +8)

- 첫 매치 = 1.0× 베이스 점수
- 1초 내 두 번째 = ×1.2 (`floor(7 * 1.2) = 8`)
- 1초 내 세 번째 = ×1.44 (`floor(7 * 1.44) = 10`)
- 윈도우 만료 후 매치 = 1.0×로 리셋 + 점수도 베이스로 복귀
- `_comboCooldown` 매 틱 감소, 0에 도달하면 multiplier 자동 1.0 리셋
- 아케이드 모드: multiplier 미적용 (체인 북키핑도 건드리지 않음)
- 엔들리스 모드: multiplier 미적용
- `playPuzzleLevel(level)` 재진입 시 콤보 상태 리셋

`stagePuzzlePair(g, color)` 헬퍼 — `_leafMap[0]`의 `[0, 13]` 페어를 노리고 F0 leaf 5 + F1 leaf 3에 같은 색을 심어, CW turnFlower(0) 한 번이면 매치되도록 셋업.

## 32. 퍼즐 모드 자동 리필 (매 틱)

피드백: 매치 후 죽음 애니메이션이 끝난 슬롯이 다음 cadence(`_addLeaf`, ~1.8s) 까지 비어 있어 퍼즐의 빠른 연쇄 플레이감을 깎는다.

### 32.1 변경 (`daisygame.js`)

`increaseTick`이 `MODE_PUZZLE`일 때 매 틱 `_fillEmptySlots()`를 호출. 죽어 사라진 잎이 다음 프레임 안에 새 잎으로 대체되어 콤보 윈도(33틱)와 맞물린다.

`_fillEmptySlots`은 직접 `Leaf.reset(...)`이 아닌 `Flower.addLeaf(this._flowerArr)`를 호출 — `_init_flower`와 같은 매칭 색 회피 재시도 루프를 그대로 적용한다. 그래야 자동 리필이 우연히 `_leafMap` 인접 잎과 같은 색을 떨어뜨려 "공짜 즉시 매치"를 선물하는 일이 없다.

특수 잎(rainbow, gold)과 죽음 애니메이션 진행 중인 잎은 `color === 0` 게이트로 자연 보존.

### 32.2 모드 게이트

아케이드 / 엔들리스는 기존 cadence 유지 — 빠른 자동 리필은 퍼즐의 단기 목표 달성형 플레이에서만 의미가 있고, 다른 모드에선 플레이어 스킬을 희석한다.

## 33. 즉시 리필 게이트 — `_isPlayable === false`로 좁힘

32에서 도입한 매 틱 `_fillEmptySlots`이 너무 공격적이었음을 확인. 매치 직후 cadence가 숨 쉴 틈도 없이 보드를 다시 채워 텐션이 사라졌다.

리필을 "회전으로 매치를 만들 수 없는 진짜 stuck 상태"에만 발동하도록 게이트:

```js
if (this._mode === this.MODE_PUZZLE && !this._isPlayable()) {
    this._fillEmptySlots();
}
```

`_isPlayable`은 빈 슬롯이 하나라도 있는 보드를 항상 playable로 본다 → 부분적으로 빈 보드에선 cadence 경로(`_addLeaf`)가 다시 책임지고, 퍼즐의 cadence가 아케이드 / 엔들리스와 같은 호흡으로 돌아왔다.

## 34. 퍼즐 구제(rescue) — `_hasMatchablePair`와 `_spawnMatchableLeaf`

33의 게이트가 너무 좁다는 후속 발견:

- `_isPlayable === false`는 보드가 **가득 찬** 막힘 케이스에서만 true. 그 시점엔 `_fillEmptySlots`가 어차피 no-op (빈 슬롯이 없으니까).
- cadence 경로(`Flower.addLeaf`)는 매칭 색을 **회피**하므로, 운 나쁜 리필 연속이면 슬롯이 비어 있어도 어떤 인접 페어도 같은 색이 안 되는 "non-matchable" 상태에 빠질 수 있다. 게이트는 이를 잡지 못함.

### 34.1 더 엄격한 판정: `_hasMatchablePair`

`_isPlayable`보다 좁은 정의:

- 와일드카드(rainbow / gold)가 보드에 있으면 즉시 true (구제 불필요).
- 아니면 각 꽃의 살아있는 일반 색 집합을 만들고, `_leafMap` 페어들을 순회해 **두 꽃 색 집합의 교집합이 비지 않는 페어**가 하나라도 있으면 true.
- 빈 슬롯이 있어도 매칭 색이 없으면 false — 33의 게이트와 다른 지점.

### 34.2 구제 스폰: `_spawnMatchableLeaf`

`_hasMatchablePair === false`일 때 `_leafMap` 경계 슬롯 중 "한쪽이 비고 다른 쪽이 살아있는 일반 색(1..7)"인 슬롯을 찾아 **상대 잎의 색을 그대로 복사**해 한 장만 심는다. CW/CCW 회전 한 번에 매칭이 성립하도록 보장.

- rainbow / gold가 걸린 페어는 스킵 — 와일드카드 이벤트를 흩뜨리지 않기 위해.
- `_placeMatchableLeaf`은 `color`, `_life`, `playBirth()`, `_leaf_count` 증가까지 한 번에 처리.

### 34.3 게이트 위치

`turnFlower`의 deadlock 분기는 그대로 `_fillEmptySlots`을 호출(턴 직후 회복 시나리오 — 이건 다른 문제). 새 구제 호출은 `increaseTick`에서, cadence 리필이 끝난 뒤에:

```js
if (this._mode === this.MODE_PUZZLE && !this._hasMatchablePair()) {
    this._spawnMatchableLeaf();
}
```

### 34.4 테스트

- 부분적으로 빈 보드 + 공유 색 존재 → 구제 스폰 안 됨 (cadence가 책임)
- 부분적으로 빈 보드 + 공유 색 없음 → 구제 스폰이 상대 색을 정확히 복사
- 엔들리스 모드 → 같은 셋업이라도 절대 발동 안 함
- rainbow가 보드에 있으면 구제 스킵
- 죽음 애니메이션 중인 잎(life > 0, color === 0이 아님)은 덮어쓰지 않음
- 가득 찬 stuck 보드 → 구제는 no-op (빈 슬롯이 없음)

## 35. 퍼즐 타이머 꽃잎 트라이컬러 그라데이션

피드백: 단일 코랄 hue로 채운 12-슬롯 타이머 스택이 시간 진행 신호로는 약하다.

### 35.1 팔레트

`DrawEngine.PUZZLE_TIMER_PALETTES`(이전엔 단일 톤)를 슬롯별 다른 hue로 사전 계산:

| 슬롯 | t | 색 | 의미 |
|---|---|---|---|
| 0 (바닥) | 0.0 | `rgb(196, 43, 43)` 깊은 빨강 | 마지막까지 남는 꽃잎 — "시간 거의 끝" |
| 5–6 (중간) | ≈0.5 | 거의 흰색 | 평온한 중반 |
| 11 (꼭대기) | 1.0 | `rgb(43, 79, 196)` 깊은 파랑 | 가장 먼저 떨어지는 꽃잎 — "시간 많음" |

3-stop 보간(`RED → WHITE → BLUE`). 위에서부터 떨어지므로 라운드가 진행될수록 차분한 파랑이 사라지고 빨강만 남아 자연스럽게 "calm → urgent" 컬러 시프트가 된다.

각 슬롯은 단일 base RGB에서 light(50% 흰색 측), dark(60% 검정 측), outline(반투명 검정)을 동일 레시피로 파생. 클래스 로드 시점에 IIFE로 한 번 계산하므로 draw loop은 인덱싱만.

### 35.2 테스트 (`draw_engine.test.js`)

`PUZZLE_TIMER_PALETTES`가 컴파일된 JS에서 `DrawEngine.PUZZLE_TIMER_PALETTES`로 노출되는 점을 활용:

- 길이 12, 각 슬롯에 base/light/dark/outline 모두 존재
- 슬롯 0 base = `rgb(196, 43, 43)`, 슬롯 11 base = `rgb(43, 79, 196)`
- 중간 슬롯(5, 6)이 near-white(모든 채널 ≥ 220)
- 바닥은 warm-leaning(red > blue), 꼭대기는 cool-leaning(blue > red) — RGB 채널은 흰색 정점에서 비단조라 hue lean으로 검증
- dark variant가 base의 60% (정확)

## 36. 페어 점수 재밸런스 — 색별 ramp

문제: 이전 점수표 `2 + (color..7).reverse()` (= 9, 8, 7, 6, 5, 4, 3 per pair, 색 1이 9 / 색 7이 3)는 퍼즐 후반의 고색(색 4–7) 매치가 너무 인색해 50-레벨대 타깃을 정시 안에 도달하기 어려웠다. 또 직관(원작이 "보기 드문 색일수록 가치가 높다"는 제스처를 보냈음)과도 어긋남.

### 36.1 새 표 (`daisygame.js`)

| color | 1 | 2 | 3 | 4 | 5 | 6 | 7 | rainbow | gold |
|---|---|---|---|---|---|---|---|---|---|
| per pair | 1 | 2 | 4 | 6 | 8 | 10 | 12 | 7 (flat) | 16 (flat) |

- 색 4 이후 ramp가 가팔라짐 → 퍼즐 후반 페이오프가 실제로 의미 있게 달라짐.
- 색 1은 1점으로 떨어뜨려 "흔한 색을 마구 회전" 전략 억제.
- rainbow / gold는 평탄(flat) — 와일드카드는 색 가치가 아니라 "페어 만들기 기회"가 핵심이라.
- gold 우선 규칙은 유지: gold-vs-rainbow가 만나면 gold 16점.

### 36.2 콤보와의 상호작용

페어 점수에만 multiplier 적용(꽃 비움 보너스 / monochrome 보너스는 그대로). 새 표 위에서:

- 색 7 페어 2번째 매치: `floor(12 × 1.2) = 14`
- 색 7 페어 3번째 매치: `floor(12 × 1.44) = 17`
- 콤보 중 gold 페어: `floor(16 × 1.2) = 19`

도파민 곡선이 표 가팔라짐과 자연 합산.

### 36.3 테스트

기존 페어 / 콤보 / rainbow / gold 테스트를 새 ramp에 맞춰 갱신:

- 색 1..7 ramp 배열 상수화 `[0, 1, 2, 4, 6, 8, 10, 12]` 후 한 번에 검증
- 색-1 = 1점, 색-7 = 12점 단독 케이스
- 색-3 단일 페어 = 4점
- rainbow flat = 7점, gold flat = 16점 케이스
- 콤보 수학: 색-3 base 4 → ×1.2 = `floor(4.8) = 4` (다음 단계까지는 차이가 없을 수 있음을 확인)
- 색-5 base 8, gold base 16에서의 콤보 누적

## 37. 황금잎 외톨이 버그 수정

증상 보고: "황금잎은 시간이 지나면 원래 색으로 돌아 와야 하는데 유지 되는거 같아".

### 37.1 원인

황금 페어는 항상 인접한 두 슬롯에 동시 스폰되지만, 이벤트 진행 중 플레이어 회전으로 두 잎은 보드 다른 곳으로 흩어질 수 있다. `checkCollision`은 페어가 매치되면 (gold-gold든 gold-rainbow든) 즉시 `_activeGolden = null`로 이벤트를 종료시켰는데:

- gold-gold 매치는 두 황금잎을 모두 소비 → 외톨이 없음, 정상.
- **gold-rainbow 매치는 한쪽 황금잎만 소비** → 짝꿍 황금잎이 보드에 남음.

`_activeGolden = null` 이후로는 `_expireGolden()`이 첫 줄(`if (!this._activeGolden) return;`)에서 조기 반환되므로, 외톨이 황금잎의 만료 타이머는 영영 발동하지 않는다. 다음 황금 이벤트가 만료될 때까지(즉 8–13초 뒤) 그대로 황금색으로 남아 사용자에게는 "안 돌아옴"으로 보인다.

### 37.2 수정 (`daisygame.js`)

1. `checkCollision`에서 매치 직후 `_activeGolden = null`을 직접 쓰는 대신 `goldMatched` 플래그를 세우고 루프가 끝난 뒤 `_expireGolden()`을 호출한다. 외톨이 잎을 스냅샷 색으로 되돌리고 `_activeGolden`도 같은 함수가 닫는다.
2. `_expireGolden`은 `isGolden() && isAlive()` 조건으로 좁힌다. 이미 매치되어 죽기 애니메이션 중인 잎(`isAlive() === false`)을 건너뛰지 않으면 `revertFromGolden`이 즉시 `_color = 0, _life = 0`으로 만들어 shrink 애니메이션이 한 프레임 만에 사라진다.

이 두 변경의 조합으로 매치된 황금잎의 죽는 애니메이션은 기존 그대로, 매치되지 않은 외톨이만 즉시 원색으로 복귀한다.

### 37.3 테스트

`daisygame.test.js`에 "gold-vs-rainbow match reverts the orphaned partner gold leaf" 회귀 테스트 추가:

- 보드를 비우고 F1 leaf 3에 스냅샷 색 5의 황금잎, F6 leaf 1에 무지개잎을 배치(`_leafMap[1]`의 [14, 61] 페어가 CW 회전 후 정렬되도록).
- 회전과 무관한 F3 leaf 2에 스냅샷 색 7의 외톨이 황금잎을 배치.
- `g.turnFlower(1)` 호출 후 `activeGolden() === null`, 외톨이가 `isGolden() === false` 그리고 `color() === 7`인 것을 확인.

기존 황금 관련 테스트(매치된 페어가 `_activeGolden`을 즉시 비움, 콤보 카운트, 자연 만료, transformed/empty-fill 만료)는 모두 그대로 통과 — 매치된 잎은 `isAlive() === false`이므로 새 `_expireGolden` 가드에 걸려 건드려지지 않는다.

## 38. 빈 꽃 풀 리필 (6장 보장)

요청: "모든 잎사귀를 없애서 잎사귀를 채울때 6장 모두 채우도록 개선해 주세요."

### 38.1 원인

기존 `increaseTick`의 리필 트리거는 단순한 한-틱 검사였다:

```js
if (f.leaf_count() == 0) {
    for (let i = 0; i < 6; i++) f.addLeaf(this._flowerArr);
}
```

`addLeaf`는 `color() === 0`인 슬롯만 채운다. 매치 후 잎은 `_life`만 줄어들 뿐 `_color`는 즉시 0이 되지 않고 `_origin_life=15` 틱 동안 shrink 애니메이션을 거친다. 매치가 여러 회전에 걸쳐 일어나는 실제 플레이에서는:

1. 처음 3장 매치 → 3장 shrink 시작.
2. 8틱쯤 뒤 나머지 3장 매치 → leaf_count=0, 하지만 처음 3장은 거의 다 줄어들었고 나머지 3장은 막 줄어들기 시작한 상태.
3. leaf_count==0 트리거가 발동, addLeaf 6번 호출 → 모든 슬롯이 color>0 (shrink 중) 이라 전부 no-op.
4. 5틱쯤 뒤 처음 3장이 color=0에 도달, leaf_count는 여전히 0. 이번 틱의 검사가 발동해 그 3장만 채워짐. leaf_count=3.
5. 그 후 나머지 3장이 shrink 끝나도 leaf_count=0 트리거가 더 이상 발동하지 않음(이미 leaf_count=3).
6. 결과: 슬롯 3–5가 빈 채로 남고, 느린 cadence(`_addLeaf`, ~60틱마다 한 장)만 천천히 채움.

### 38.2 수정 (`flower.js`, `daisygame.js`)

`Flower`에 `_pendingRefill` 플래그를 추가. `increaseTick`에서:

```js
if (f.leaf_count() === 0) f._pendingRefill = true;
if (f._pendingRefill) {
    for (let i = 0; i < 6; i++) f.addLeaf(this._flowerArr);
    if (f.leaf_count() === 6) f._pendingRefill = false;
}
```

플래그는 leaf_count가 0에 닿는 순간 켜지고, 6에 도달할 때까지 매 틱 빈 슬롯을 채운다. shrink 중인 슬롯은 자연히 시간이 지나며 비워지고, 비워지자마자 다음 틱에 즉시 채워진다.

### 38.3 직렬화

`Flower.serialize` / `restore`에 `pendingRefill` 필드 추가. 게임 일시정지 후 재개 시 진행 중이던 리필이 끊기지 않도록.

### 38.4 테스트

- `flower.test.js`: `_pendingRefill` 기본값이 false인지, serialize 라운드트립이 true/false 모두 보존하는지.
- `daisygame.test.js`:
  - 일괄 매치 — 6장 동시 제거 후 30틱 뒤 leaf_count=6, 모든 슬롯이 색상 보유.
  - 시차 매치 — 3장 제거 → 8틱 → 3장 제거 시나리오에서 30틱 뒤 leaf_count=6.
  - 부분 매치 — 4장만 제거하면 `_pendingRefill`이 켜지지 않음(slow cadence가 처리).

## 39. 퍼즐 게임오버 메인 메뉴 버튼이 클릭되지 않던 버그

요청: "퍼즐 모드에서 실패시 나오는 메뉴에서 메인 메뉴로 버튼 클릭 안됨."

### 39.1 원인

`_drawPuzzleGameOver`는 (200, 380)에 메인 메뉴 버튼을 그리고, `_hitPuzzleGameOver`도 동일 좌표를 히트 테스트해 `MENU_KEY`를 반환하고 있었다. 그러나 `main.js`의 `MENU_KEY` 처리는 다음과 같았다:

```js
case MENU_KEY:
  if (daisyGame.isPauseState() || daisyGame.isLevelSelectState()) {
    gameEngine.gotoMenu();
  }
  break;
```

게임오버 상태가 가드에 빠져 있어, 퍼즐 게임오버 화면에서만 버튼이 묵묵부답인 무반응 버튼이 되었다. 아케이드/엔드리스 게임오버는 mode 버튼 영역을 먼저 매칭하므로 영향 없었다.

### 39.2 수정 (`main.js`)

가드에 `daisyGame.isGameOverState()`를 추가. `gameEngine.gotoMenu()`는 상태 무관하게 동작(모든 분기에서 `init()` 호출)하므로 부수효과 없음.

## 40. 퍼즐 게임오버에 Level Select 버튼 추가

요청: "퍼즐 모드에서 실패시 나오는 메뉴에서 레벨 선택 화면으로 가는 버튼도 있어야 함."

### 40.1 레이아웃 (`src/draw_engine.ts`)

기존 `_drawPuzzleGameOver`는 cleared면 Next/Retry/Menu 3버튼, 실패면 Retry/Menu 2버튼을 그렸다. 일시정지 화면이 이미 사용하는 🧩 Level Select 버튼 스타일을 그대로 재사용:

- **Cleared (4버튼)**: Next 250 / Retry 305 / Level Select 360 / Main Menu 415
- **Failed (3버튼)**: Retry 280 / Level Select 335 / Main Menu 390

세로 간격 55px는 기존 cleared 레이아웃의 컨벤션.

### 40.2 히트 테스트 정리 (`_hitPuzzleGameOver`)

기존 분기마다 좌표를 중복 작성하던 부분을 정리하면서 Level Select 영역을 추가. 두 분기 끝에서 공통으로 Level Select(`LEVEL_SELECT_KEY`)와 Main Menu(`MENU_KEY`)를 차례로 검사.

### 40.3 라우팅 (`main.js`)

`LEVEL_SELECT_KEY` 핸들러가 PAUSE만 통과시키던 가드를 확장:

```js
case LEVEL_SELECT_KEY:
  if (daisyGame.isPauseState() || daisyGame.isGameOverState()) {
    gameEngine.gotoLevelSelect();
  }
  break;
```

`gameEngine.gotoLevelSelect()` → `daisyGame.exitToLevelSelect()`는 점수와 타이머를 리셋하고 LEVEL_SELECT_STATE로 진입. resume snapshot도 함께 비움.

## 41. 퍼즐 난이도 재밸런스 — 저색상 + 타겟 곡선

요청: "퍼즐 모드에서 점수가 너무 안올라서 난이도가 너무 증가했어."

### 41.1 진단

직전 36장 리밸런스(`978e4de`)는 엔드게임 페이오프를 살리려고 색상별 페어 점수를 `[0,1,2,4,6,8,10,12]`로 잡았다. 하지만:

- 초·중반은 4~5색 보드라 평균 페어 점수가 오히려 **떨어짐** (L1~33 4색 평균 4.5 → 3.25)
- 타겟은 `50 * level` 선형이라 L100 = 5000, 60초 안에는 사실상 도달 불가능

### 41.2 수정

**페어 점수 테이블 (`daisygame.js`)** — 저색상만 끌어올리고 고색상은 유지:

```js
const COLOR_PAIR_SCORE = [0, 3, 4, 5, 6, 8, 10, 12];
```

색1~3: 1·2·4 → 3·4·5 (초반 그라인딩 해소). 색4: 6 그대로. 색5~7: 8·10·12 그대로 (엔드게임 페이오프 보존).

**타겟 곡선 (`puzzle.js`)** — 기울기 50 → 35 완화:

```js
target: 50 + 35 * (L - 1),
```

| Level | 이전 | 신규 |
|-------|------|------|
| 1     | 50   | 50   |
| 10    | 500  | 365  |
| 50    | 2500 | 1765 |
| 100   | 5000 | 3515 |

### 41.3 테스트 / 빌드 영향

- `daisygame.test.js`: 색별 ramp 상수, 색-1 단독, 색-3 단독, 콤보(색3·5 베이스), arcade/endless 콤보 스킵 — 모두 새 값으로 갱신.
- 회귀 가드 신규: "색1~3는 항상 ≥3", "색5~7는 8/10/12 고정".
- `puzzle.test.js`: L100 target 5000 → 3515 단언 갱신, "타겟 +35/level 선형" 샘플 테스트 추가.
- `PuzzleProgress` 회귀 가드 신규: L2 84점은 잠금 유지 / 85점은 L3 해금, L100 starRating 경계.
- `release/index.html` 재빌드 (build.sh).

## 42. 회귀 테스트 보강 (39·40·41 영향 영역)

이번 세션의 세 변경(MENU_KEY 게임오버 누락, Level Select 버튼 신설, 점수/타겟 재밸런스)을 향후 리팩터로부터 보호하기 위한 테스트 묶음.

### 42.1 `_bootstrap.js` 확장

테스트가 키 코드를 매직 넘버로 쓰지 않도록 `S_KEY`, `MENU_KEY`, `LEVEL_SELECT_KEY`, `NEXT_LEVEL_KEY`, `MODE_*_KEY` export 추가.

### 42.2 `draw_engine.test.js` — `getEventCode` 인스턴스 테스트

기존 파일은 정적 메서드만 다루고 있어 히트 테스트 공백이 컸다. 헬퍼 `buildPuzzleGameOver(level, score)`로 게임을 puzzle GAME_OVER에 박아두고 `getEventCode(x, y)`로 직접 코드를 끌어내 검증. 8개 케이스:

- 실패 레이아웃: Retry(280) → `S_KEY`, Level Select(335) → `LEVEL_SELECT_KEY`, Main Menu(390) → `MENU_KEY`, 빈 공간(308) → 0
- 성공 레이아웃: Next(250) → `NEXT_LEVEL_KEY`, Retry/Level Select/Menu(305/360/415)
- 최종 레벨(100) cleared는 Next 없이 실패 레이아웃 사용 (`y=250`에서 0)
- 버튼 열 바깥(x=80, x=320) → 0

### 42.3 `game_engine.test.js` — 게임오버 → 메뉴/레벨선택 전환

39·40장의 회귀 가드. `game.playPuzzleLevel(1) → game.increaseScore → eng.pause → game._enterGameOver`로 GAME_OVER 상태를 만든 뒤:

- `eng.gotoMenu()`가 IDLE로 복귀하고 resume snapshot을 비우는지
- `eng.gotoLevelSelect()`가 LEVEL_SELECT로 복귀하고 점수가 리셋되는지

### 42.4 결과

199개 → 215개. 누락 영역 보완 + 41장 리밸런스의 모든 정점에 핀 박음.

## 43. 후속 후보

- 남은 JS 파일들도 점진적으로 .ts로 이식 (현재는 ambient 선언으로 우회 중)
- `flower.js` / `leaf.js` 인덱스 0–6 / 1–6 매핑을 자료구조로 분리해 가독성 정리
- 콜아웃 텍스트 / 보너스 점수 테이블의 매직 넘버를 상수화
- 모바일 터치 제스처(스와이프로 회전 등) 검토
- 황금 꽃잎이 매치되어 사라질 때 별도의 sparkle / coin-pop 이펙트
- 퍼즐 구제 스폰에 시각 큐(잎이 들어올 때 작은 sparkle 등)로 "도움이 들어왔다" 신호
- 41장 재밸런스 후 실제 플레이 검증 (특히 L30~70 구간 클리어 가능 여부) 및 필요 시 시간/콤보 보정
