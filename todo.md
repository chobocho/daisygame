# Daisy Game 개선 TODO

코드베이스(`daisygame/`) 전반을 분석한 결과 정리한 개선 항목입니다. 우선순위 순으로 묶었습니다.

## 1. 버그 / 동작 오류 (High)

- [ ] **GAME_OVER_STATE는 어디에서도 set되지 않는 죽은 상태**: `daisygame.js`의 `_isPlayable()`이 false면 보드를 재구성만 할 뿐, 게임오버로 전이되지 않음. `start()`의 `GAME_OVER_STATE` 분기, `draw_engine._drawButton()`의 game-over 분기, `getEventCode`의 game-over 분기가 모두 dead code. 게임오버 조건(예: 일정 시간 안에 매치 실패, 보드 정체 N회 이상 등)을 정의하거나, 관련 분기를 제거.
- [ ] **`LocalDB.getScore()`가 문자열을 반환**: `localStorage.getItem`은 string을 돌려주는데 `parseInt` 없이 `Score`로 전달됨. `Score._updateHighScore`의 비교(`>`)는 강제 변환되어 동작하지만, 직렬화·비교 시 잠재적 버그. `Number(score) || 0`로 정규화.
- [ ] **`localStorage` 예외 처리 부재**: 프라이빗 모드/저장 차단 시 `getItem`/`setItem`이 throw할 수 있음. try/catch로 감싸고 fallback(in-memory) 제공.
- [ ] **`isMobile` 초기값 false로 인한 입력 중복**: `onLoadPage()`에서 `InitValue()`로 리스너 등록이 끝난 다음에 `isMobile`이 설정됨. 그 사이 사용자 입력은 mouseup 분기를 통과해버림. 또한 모바일에서 touchend → mouseup이 함께 발생할 수 있어 한 탭에 두 번 처리될 가능성. `touchListener`에서 `event.preventDefault()` 호출, 또는 입력 디스패처를 단일 경로로 통합.
- [ ] **꽃잎 색상 재배정 루프의 한계**: `daisygame._init_flower()`와 `flower.addLeaf()`의 `do { reset() } while (...)` 루프는 같은 `_colorTable`을 순환 갱신하는 구조. colorTable이 한 색만 남도록 편향된 경우 무한 반복 직전(`maxCount=100`)에 충돌이 그대로 남는 케이스 존재. Fisher-Yates 셔플로 교체하고, 충돌 회피를 "이웃에 없는 색 집합에서 무작위 선택"으로 바꾸는 것이 안전.
- [ ] **`Math.random() - 0.5` 셔플은 비균등**: `leaf.js`, `flower.js`, `daisygame.js`의 `_addLeafTable` 셔플 모두 동일 패턴. 유틸로 Fisher-Yates를 추출해 사용.
- [ ] **`Audio` 객체 단일 인스턴스 재생 문제**: 빠르게 연쇄 매치 시 `_pop_audio.play()`가 이전 재생을 덮어쓰며 일부 사운드가 누락됨. 풀링 또는 매번 `cloneNode()` 사용.
- [ ] **`KEY_5 = 53` 세미콜론 누락** (`values.js:8`).
- [ ] **`offset` 전역 미사용**: `main.js`에서 표시되지만 갱신되지 않음. 잔재이면 제거.

## 2. 아키텍처 / 코드 품질 (High)

- [ ] **전역 변수 남발**: `gStartX, gBlockSize, gScale, gScreenX, gScreenY, cvs, canvas, bufCanvas, bufCtx, daisyGame, drawEngine, gameEngine, scoreDB, offset, isMobile` 모두 전역. 단일 `Game`/`AppContext` 객체로 캡슐화하거나 ES Modules로 전환.
- [ ] **`_leafMap` 인접관계 데이터 중복**: `daisygame.js`와 `flower.js`에 동일한 7×N 배열이 두 벌 존재. 단일 상수 모듈(`adjacency.js` 등)로 추출.
- [ ] **점수 테이블 매직 넘버**: `daisygame.js`의 `[0,1,10,20,50,128,256,…]`, `[0,100,256,512,600,800,1024,1216,…]`, `88` 보너스 등 의미 없는 숫자. 명명 상수화 + 한 곳에 모음.
- [ ] **`DaisyGame` 생성자의 미사용 인자 정리**: `startY`, `canvas_width`, `canvas_height`는 받기만 하고 사용되지 않음. 제거 또는 활용.
- [ ] **`set_index`는 생성자 인자와 중복**: `Flower` 생성자가 이미 index를 받으므로 `flower.set_index(i)` 호출(`daisygame.js:39`)은 불필요.
- [ ] **`GameEngine.increaseTick()`이 재진입 가드를 중복 보유**: `DaisyGame.increaseTick`도 같은 가드를 가짐. 단일화하거나 한 쪽으로 일원화.
- [ ] **상태 관리 패턴**: `IDLE/PLAY/PAUSE/GAME_OVER`을 정수 상수로 다루고 곳곳에서 `is...State` 헬퍼 호출. `state` enum + `transition(target)` 형태로 정리하면 흐름이 명확해짐.
- [ ] **`updateResolution()`은 OnDraw에서 주석처리됨**: 미사용이면 제거, 필요하면 호출 복원.
- [ ] **`Flower.addLeaf`의 `leafMap` 매 호출 재할당**: 함수 본문에서 매번 새 배열 리터럴을 만듦. 외부 모듈 상수로 빼기.
- [ ] **레이어드 아키텍처 정돈**: 현재 `DrawEngine`이 게임 좌표(400×600)를 직접 알고 있고, `DaisyGame`도 좌표를 보유. 좌표/그리기/입력 매핑을 한 모듈로 모아 화면 해상도 변경 시 한 곳만 고치도록.

## 3. 렌더링 / 성능 (Medium)

- [ ] **`requestAnimationFrame`으로 교체**: 현재 `setTimeout(OnDraw, 30)` 고정. 모바일 가변 fps와 탭 비활성화 시 CPU 낭비를 피하기 위해 rAF 권장. 게임 로직 tick은 누적 dt 기반으로 분리.
- [ ] **이미지 로딩 race**: `ImageLoader.load()`는 `Image()`만 만들고 `onload`를 기다리지 않음. 첫 프레임에 이미지가 미준비 상태일 수 있음. `Promise.all`로 `onload` 완료 후 게임 시작.
- [ ] **`bufCtx.beginPath()/closePath()`는 `drawImage` 시 불필요**: `OnDraw()` 도입부의 path API 호출 제거.
- [ ] **루프 내 임시 객체 재생성**: `_drawScore`/`_drawHighScore`의 `code` 배열, `_drawFlower`의 `COLOR_TABLE`, `Flower.addLeaf`의 `leafMap`/`arr` 등 매 호출 재할당. 모듈 스코프 상수로.
- [ ] **이중 캔버스 클리어**: `cvs.clearRect`, `bufCtx.clearRect`를 매 프레임 모두 호출. 백버퍼만 그리고 cvs는 drawImage 한 번이면 충분 (clearRect 일부 생략 가능).
- [ ] **오디오 base64 인라인(73 KB JS)**: `audio.js`가 mp3 두 개를 base64로 보유 → 초기 파싱/메모리 비용 큼. 정적 `.mp3` 파일로 빼고 `<audio>` 또는 `fetch + WebAudio` 사용.

## 4. UI / UX (Medium)

- [ ] **게임 시작 UI에 조작법 표시**: PC는 `S/숫자0~6/M/P`, 모바일은 탭 안내가 없음. 첫 진입 시 도움말 오버레이.
- [ ] **게임오버 화면 분기 후 별도 그래픽**: 현재 idle과 동일한 `start.png`만 노출. "Game Over" 표시와 최종 점수 강조.
- [ ] **하이스코어 리셋 옵션**: 기록 초기화 버튼/롱프레스 제스처.
- [ ] **음악 토글이 세션마다 초기화**: `localStorage`로 사용자 선호 보존.
- [ ] **반응형 폰트/UI 스케일링 점검**: 너무 작은 폰/디바이스에서는 200×300으로 폴백되지만 버튼 hit area가 어긋날 수 있음. 좌표를 모두 가상 400×600 기준으로 통일.
- [ ] **`viewport` 메타가 user-scalable=no**: 접근성 가이드 위반. zoom 허용 또는 `interactive-widget=resizes-content`로 변경 검토.
- [ ] **버튼 hit area를 명시 상수화**: `getEventCode`의 좌표 산식이 `_drawButton`의 좌표와 분리되어 동기화 부담. 한 객체에서 위치/크기를 정의해 그리기·히트테스트가 같은 소스를 참조.
- [ ] **터치 피드백 부재**: 꽃 클릭/탭 시 짧은 시각 효과(파티클/플래시) 추가.

## 5. 빌드 / 도구 / 인프라 (Medium)

- [ ] **`package.json` 추가**: 의존성/스크립트 관리.
- [ ] **린터/포매터 설정**: ESLint + Prettier(또는 Biome). 현재 따옴표/세미콜론/이름 컨벤션이 일관되지 않음(예: `_init_flower` snake_case vs `init_leaf` vs `OnDraw`).
- [ ] **테스트 도구 도입**: Vitest/Jest. `Score`, 색 충돌 검사(`_isPlayable`), 인접 매치(`checkCollision`) 등 순수 로직 단위 테스트.
- [ ] **번들러/모듈화**: Vite 등으로 ES Modules 전환 + 정적 자산 처리. 현재 10개+ `<script>`태그를 순서대로 로드.
- [ ] **CI 파이프라인**: GitHub Actions로 lint + test + build.
- [ ] **PWA 지원**: 오프라인 플레이 가능하도록 service worker + manifest.
- [ ] **유틸 스크립트(`util/audio2b64.py`)는 base64 인라인 폐기 시 함께 제거**.

## 6. 코드 컨벤션 / 가독성 (Low)

- [ ] **메소드 명명 통일**: `init_leaf`/`leaf_count`/`set_pos`(snake_case)와 `OnDraw`/`getFlowers`/`isPlayState`(camelCase/PascalCase)가 혼재. JS 컨벤션(camelCase)으로 통일.
- [ ] **`printf` 디버그 로그 제거 또는 레벨 분리**: `util.js`의 `printf`가 모든 모듈에서 호출되어 콘솔이 시끄러움. `DEBUG` 플래그 또는 `console.debug`.
- [ ] **불필요한 한국어 주석/영문 혼재 정리**: 동일 클래스 안에서 톤 통일.
- [ ] **`Leaf`의 `_origin_life` 같은 매직 상수**: `LIFE_TICKS` 등 상수화.
- [ ] **`_drawScore`의 첫 자리 그리기 + 루프 패턴 단순화**: `score.toString()` 후 자리수만큼 루프하면 0 케이스 분기가 사라짐.

## 7. 문서화 (Low)

- [ ] **`README.md`가 사실상 비어 있음**: 게임 개요, 조작법(PC/모바일), 스크린샷, 실행/배포 방법, 라이선스, 기여 가이드 추가.
- [ ] **`doc/DaisyGame.pdf` 외에 마크다운 룰 설명 추가**: 인접 꽃잎 색 매칭 규칙·점수 보너스 정리.
- [ ] **JSDoc 주석**: 핵심 클래스(`DaisyGame`, `Flower`, `Leaf`, `DrawEngine`) 시그니처에 타입 정보 추가. 추후 TS 마이그레이션의 발판.

## 8. 보안 / 메타 (Low)

- [ ] **`og:url`이 http**: https로 변경.
- [ ] **메타 태그의 버전(`V0.3`)을 빌드에서 자동 주입**: 수동 갱신 누락 방지.
- [ ] **`tap-highlight-color`을 인라인 `<style>` 대신 `main.css`로 이동**: `main.css`는 현재 비어 있음.
- [ ] **CSP 메타/헤더 추가**: 인라인 스크립트 최소화 후 적용.

## 9. 향후 기능 아이디어 (Backlog)

- [ ] 난이도 선택(꽃 수, 색 수, 틱 속도).
- [ ] 콤보 시스템 및 시각 이펙트.
- [ ] 일일 챌린지 / 시드 모드.
- [ ] 통계: 플레이타임, 최대 콤보, 매치 수 등.
- [ ] 다국어 지원(i18n).
- [ ] 키보드 접근성: 포커스 표시, 스크린리더 친화 라벨.
