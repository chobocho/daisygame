function OnDraw() {
  gameEngine.increaseTick();
  drawEngine.OnDraw();
  //updateResolution();
  setTimeout(OnDraw, 30);
}

function processKeyEvent(code) {
  printf("[Main] processKeyEvent: ", code);
  switch (code) {
    case P_KEY:
      printf("[Main] processKeyEvent: ", "Pause");
      gameEngine.pause();
      break;
    case ENTER_KEY:
    case S_KEY:
      // Resume from pause; on idle/game-over default to Endless.
      if (daisyGame.isPauseState()) {
        gameEngine.start();
      } else {
        gameEngine.start(MODE_ENDLESS);
      }
      break;
    case 65: // 'A'
    case MODE_ARCADE_KEY:
      gameEngine.start(MODE_ARCADE);
      break;
    case 90: // 'Z' (P is taken by Pause)
    case MODE_PUZZLE_KEY:
      gameEngine.start(MODE_PUZZLE);
      break;
    case 69: // 'E'
    case MODE_ENDLESS_KEY:
      gameEngine.start(MODE_ENDLESS);
      break;
    case KEY_0:
      gameEngine.press(0);
      break;
    case KEY_1:
      gameEngine.press(1);
      break;
    case KEY_2:
      gameEngine.press(2);
      break;
    case KEY_3:
      gameEngine.press(3);
      break;
    case KEY_4:
      gameEngine.press(4);
      break;
    case KEY_5:
      gameEngine.press(5);
      break;
    case KEY_6:
      gameEngine.press(6);
      break;
    case M_KEY:
      gameEngine.togglePlayMusic();
      break
    default:
      break;
  }
}

function KeyPressEvent(e) {
  processKeyEvent(e.keyCode);
}

function getMousePosition(event) {
  let mx = event.pageX - canvas.offsetLeft;
  let my = event.pageY - canvas.offsetTop;
  return { x: mx, y: my };
}

function getTouchPosition(event) {
  let mx = event.changedTouches[0].pageX - canvas.offsetLeft;
  let my = event.changedTouches[0].pageY - canvas.offsetTop;
  return { x: mx, y: my };
}

function processMouseEvent(x, y) {
  let code = drawEngine.getEventCode(x, y);
  printf("[Main] processMouseEvent: ", "(" + x + ", " + y + ") -> " + code);
  processKeyEvent(code);
}

function processTouchEvent(x, y) {
  let code = drawEngine.getEventCode(x, y);
  printf("[Main] processTouchEvent: ", "(" + x + ", " + y + ") -> " + code);
  processKeyEvent(code);
}

function mouseListener(event) {
  switch (event.type) {
    case "mousedown":
      break;
    case "mousemove":
      break;
    case "mouseup":
      if (!isMobile) {
        let pos = getMousePosition(event)
        processMouseEvent(pos.x, pos.y);
      }
      break;
    case "mouseout":
      break;
  }
}

function touchListener(event) {
  switch (event.type) {
    case "touchstart":
      // Suppresses the synthetic mousedown/mouseup the browser would otherwise
      // emit after the touch sequence — without this, touch-capable desktops
      // (or DevTools touch emulation) get a double tap that rotates 120°.
      event.preventDefault();
      break;
    case "touchend":
      event.preventDefault();
      let pos = getTouchPosition(event);
      processTouchEvent(pos.x, pos.y);
      break;
    case "touchcancel":
      break;
    case "touchmove":
      event.preventDefault();
      break;
  }
}

function InitValue() {
  let imageLoader = new ImageLoader();
  imageLoader.load();

  scoreDB = new LocalDB();
  daisyGame = new DaisyGame(100, 200, scoreDB.getScore());
  daisyGame.init();
  gameEngine = new GameEngine(daisyGame, scoreDB);
  drawEngine = new DrawEngine(daisyGame, imageLoader);

  window.onkeydown = KeyPressEvent;

  canvas.addEventListener("mousedown", mouseListener);
  canvas.addEventListener("mousemove", mouseListener);
  canvas.addEventListener("mouseout", mouseListener);
  canvas.addEventListener("mouseup", mouseListener);

  canvas.addEventListener("touchstart", touchListener, { passive: false });
  canvas.addEventListener("touchend", touchListener, { passive: false });
  canvas.addEventListener("touchcancel", touchListener, { passive: false });
  canvas.addEventListener("touchmove", touchListener, { passive: false });

  window.addEventListener('resize', resizeCanvas, false);
}

function updateResolution() {
  if (isMobile) {
    return;
  }

  let log_msg = isMobile ? "[Mobile]" : "[PC] ";
  log_msg += "S: Start / SPACE, J, ↑: Jump / P: Pause / Jump: " + Math.floor(offset);
  //log_msg += "[" + canvas.width + "x" + canvas.height + "] jump: " + Math.floor(offset);
  //printf("[main] bufCtx", log_msg);
  document.getElementById("message").innerHTML = log_msg;
}

function resizeCanvas() {
  canvas = document.getElementById("canvas");

  let height = window.innerHeight;
  let width = window.innerWidth;

  if (height < 200 || width < 300) {
    printf("[main]", "Error: width == 0");
    width = 200;
    height = 300;
  }

  canvas.width = width;
  canvas.height = height;

  let log_msg = "Width: " + canvas.width + " Height: " + canvas.height;
  printf("[main] resizeCanvas: ", log_msg);

  DecisionBlockSize();
}

function InitCanvas() {
  resizeCanvas();
  cvs = canvas.getContext("2d");

  bufCanvas = document.createElement("canvas");
  bufCanvas.width = gScreenX;
  bufCanvas.height = gScreenY;
  bufCtx = bufCanvas.getContext("2d");
}

function DecisionBlockSize() {
  let screenX = Math.floor(canvas.width / 41);
  let screenY = Math.floor(canvas.height / 61);
  gBlockSize = screenX < screenY ? screenX : screenY;

  canvas.width = gBlockSize * 40;
  canvas.height = gBlockSize * 60;

  gStartX = (canvas.width - gBlockSize * 40) / 2;
  gScale = gBlockSize / 10;
  printf("[main] DecisionBlockSize", "gStartX:" + gStartX + ", scale: " + gScale);
}

const isMobileOS = () => {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) {
    return true;
  }
  else if ((/iPad|iPhone|iPod/.test(ua)) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return true;
  }
  return false;
}

const onLoadPage = function onLoadPageFnc() {
  InitCanvas();
  InitValue();
  //setInterval(OnDraw, 20);
  setTimeout(OnDraw, 100);
  isMobile = isMobileOS();
}

window.onload = onLoadPage;
