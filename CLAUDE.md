# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Daisy Game은 순수 JavaScript와 HTML5 Canvas API로 만든 브라우저 퍼즐 게임입니다. 빌드 시스템, 패키지 매니저, 테스트 프레임워크가 전혀 없습니다 — 게임 전체가 정적 파일 그대로 제공됩니다.

게임 소스는 모두 저장소 루트 아래의 `daisygame/` 디렉터리에 있습니다. 루트에는 `LICENSE`, `README.md`, 그리고 그 하위 디렉터리만 있습니다.

## 게임 실행 방법

`daisygame/` 디렉터리를 HTTP로 서빙한 뒤 `index.html`을 엽니다. 간단한 로컬 서버면 충분합니다:

```
cd daisygame && python3 -m http.server 8000
# http://localhost:8000 접속
```

`file://`로 직접 열어도 동작할 수 있지만, `ImageLoader`가 `./img` 경로를 해석하는 방식과 `localStorage`의 origin 분리 정책 때문에 안정적이지 않습니다.

## 임베드된 오디오 갱신

`daisygame/js/audio.js` 안에는 거대한 base64 인코딩 MP3 문자열 두 개(`clear_sound`, `pop_sound`)가 들어 있습니다. 이 값들은 `daisygame/util/audio2b64.py`로 생성됩니다. 이 스크립트는 실행한 디렉터리의 `*.mp3` 파일을 모두 읽어 `const <이름>_audio = "<base64>";` 형태로 출력합니다. 사운드를 교체하려면 새 `.mp3`를 스크립트와 같은 폴더에 두고 `python3 audio2b64.py`를 실행한 뒤, 그 출력을 `audio.js`에 붙여 넣으세요. base64 문자열을 직접 손으로 수정하지 마세요.

## 아키텍처

### 스크립트 로드 순서가 중요합니다

`index.html`은 모든 `js/*.js` 파일을 평범한 `<script>` 태그로 불러옵니다 — 모듈도, 번들러도 없고 모든 클래스/함수가 전역입니다. `index.html`의 나열 순서가 곧 의존성 순서이므로, 새 파일을 추가할 때는 자신이 참조하는 파일들 뒤에, 자신을 참조하는 파일들 앞에 두어야 합니다.

`values.js`는 공유 전역(`canvas`, `cvs`, `bufCanvas`, `bufCtx`, `daisyGame`, `gameEngine`, `drawEngine`, `scoreDB`, `gBlockSize`, `gScale`, `gStartX`, 키 코드 상수들)을 선언합니다. 다른 파일들은 이 값들을 직접 읽고 씁니다.

### `main.js`에서 객체 그래프를 구성

`main.js`의 `InitValue()`가 객체 그래프를 만듭니다:

```
ImageLoader  ──►  DrawEngine
LocalDB (scoreDB) ──►  GameEngine ──► DaisyGame
                                       └─►  Score, Flower[7], Leaf[6 per flower]
```

- `DaisyGame` (`js/daisygame.js`) — 모델/규칙 레이어. 7개의 꽃, 상태 머신(`IDLE_STATE` / `PLAY_STATE` / `PAUSE_STATE` / `GAME_OVER_STATE`), 점수, 틱 카운터, 오디오 객체를 소유합니다.
- `GameEngine` (`js/game_engine.js`) — 얇은 컨트롤러. 입력을 `DaisyGame`에 전달하고, 일시정지·게임오버 시 `scoreDB`로 최고 점수를 저장합니다.
- `DrawEngine` (`js/draw_engine.js`) — 매 프레임 `DaisyGame` 상태를 읽어 렌더링합니다. 또 `getEventCode(x, y)`로 마우스/터치 좌표를 키 코드로 변환해 키보드 입력과 같은 경로(`processKeyEvent`)로 흘려 보냅니다.
- `Flower` / `Leaf` (`js/flower.js`, `js/leaf.js`) — 순수 데이터 + 기하. 한 꽃은 0–5번 인덱스의 잎 6장을 가지며, 각 잎은 색상(1–6, 0은 "죽음/없음")과 제거 후 줄어드는 애니메이션을 만드는 life 카운터를 가집니다.

### 게임 루프

`OnDraw` 내부에서 자기 자신을 `setTimeout(OnDraw, 30)`으로 다시 예약합니다. 매 틱마다 `gameEngine.increaseTick()`이 모델을 진행시키고 `drawEngine.OnDraw()`가 그립니다. `requestAnimationFrame`도, 고정 타임스텝도, update/draw 분리도 없습니다.

### 꽃 인접 맵(`_leafMap`)

보드는 가운데 꽃(index 0) 하나와 그 주위에 60° 간격으로 배치된 6개 꽃(index 1–6)으로 구성됩니다. `DaisyGame._init_flower`의 `_leafMap` 테이블은 어떤 꽃의 어떤 잎이 이웃 꽃의 어떤 잎과 맞닿는지를 인코딩합니다. 각 항목 `[a, b]`에서 `a = 꽃*10 + 잎`입니다(`25`는 꽃 2의 잎 5).

게임 규칙: 플레이어가 꽃을 누르면 해당 꽃의 잎이 회전합니다(`Flower.turn()` = `unshift(pop())`). 회전 후 `checkCollision(flower)`이 `_leafMap[flower]`를 순회하며 같은 색이 된 인접 잎 쌍을 제거합니다. `[0, 1, 10, 20, 50, 128, 256, ...]` 점수 테이블은 한 번 누름으로 제거된 쌍의 수를, 별도 테이블은 꽃 한 송이 전체를 비웠을 때의 보너스를 인덱싱합니다.

같은 맵을 `Flower.addLeaf()`와 `_init_flower()`에서 역방향으로 사용해, 새로 생성하는 잎이 이웃과 색이 겹치지 않도록 색을 다시 뽑는 재시도 루프(`maxCount = 100`)를 돌립니다.

`_isPlayable()`은 현재 보드에 합법적인 움직임이 남아 있는지 판정하며, 없으면 `_init_flower()`로 보드를 새로 시드합니다.

### 좌표계와 스케일링

게임 로직과 `DrawEngine`은 고정된 400×600 논리 공간(`gScreenX`, `gScreenY`)에서 동작합니다. 매 프레임은 그 크기의 오프스크린 `bufCanvas`에 그려진 뒤, `cvs.drawImage`로 실제 캔버스의 `gBlockSize * 40` × `gBlockSize * 60` 영역에 비트블릿 됩니다. `main.js`의 `DecisionBlockSize()`가 윈도 리사이즈 시점마다 `window.innerWidth/Height`에서 `gBlockSize`, `gScale`, `gStartX`를 다시 계산합니다. `DrawEngine.getEventCode()`와 `Flower.is_inside()`의 히트 테스트는 논리 좌표에 `gScale`을 곱하고 `gStartX`를 더해서 비교합니다 — 새 클릭 영역을 추가할 때도 이 패턴을 그대로 따르세요.

### 입력 처리

모든 입력은 `main.js`의 `processKeyEvent(code)`로 모입니다. 키보드 핸들러는 `e.keyCode`를 그대로 넘기고, 마우스/터치 핸들러는 `drawEngine.getEventCode(x, y)`에 좌표를 던져 같은 키 코드 어휘(`KEY_0`..`KEY_6` = 일곱 꽃, `S_KEY` = 시작, `P_KEY` = 일시정지, `M_KEY` = 음악 토글)로 변환합니다. 새 컨트롤을 추가할 때는 클릭을 따로 처리하지 말고 `getEventCode`를 확장해 기존(또는 새) 키 코드를 반환하도록 하세요.

### 영속화

`js/util.js`의 `LocalDB`는 `'DaisyHighScore'` 단일 키로 `localStorage`를 감쌉니다. `Score.needToSave()`는 세션 동안 실제로 최고 점수가 갱신되었을 때만 true를 반환하며, `GameEngine`은 일시정지/게임오버 시점에만 기록하므로 스토리지 쓰기는 드물게 발생합니다.

## 컨벤션

- 로깅은 `js/util.js`의 `printf(tag, log)`를 사용하세요 (`console.log`의 얇은 래퍼). 기존처럼 `[ClassName]` 형태의 태그 스타일을 유지합니다.
- 일부 주석과 로그 문자열은 한국어입니다 — 주변 코드를 수정할 때 그대로 보존하세요.
- 언더스코어 접두 멤버(`_score`, `_flowerArr`, `_init_flower`)는 private로 취급합니다. 다른 클래스에서 직접 읽지 말고 게터를 통해 노출하세요.

## 브랜치 정책

이 작업은 `claude/add-claude-documentation-qpyYY` 브랜치에서 진행되며, 푸시도 동일 브랜치로만 합니다.
