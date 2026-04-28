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

## 10. 후속 후보

- 남은 JS 파일들도 점진적으로 .ts로 이식 (현재는 ambient 선언으로 우회 중)
- `flower.js` / `leaf.js` 인덱스 0–6 / 1–6 매핑을 자료구조로 분리해 가독성 정리
- 콜아웃 텍스트 / 보너스 점수 테이블의 매직 넘버를 상수화
- 모바일 터치 제스처(스와이프로 회전 등) 검토
