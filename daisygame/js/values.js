const ENTER_KEY = 13;

const KEY_0 = 48;
const KEY_1 = 49;
const KEY_2 = 50;
const KEY_3 = 51;
const KEY_4 = 52;
const KEY_5 = 53
const KEY_6 = 54;

const M_KEY = 77;
const P_KEY = 80;
const S_KEY = 83;

// Mode IDs (must mirror DaisyGame.MODE_*).
const MODE_ARCADE = 0;
const MODE_PUZZLE = 1;
const MODE_ENDLESS = 2;

// Synthetic codes returned by DrawEngine.getEventCode for the mode buttons
// on the idle / game-over screens. Out of keyboard range to avoid collision.
const MODE_ARCADE_KEY = 201;
const MODE_PUZZLE_KEY = 202;
const MODE_ENDLESS_KEY = 203;
const MENU_KEY = 204;
const NAV_PREV_KEY = 205;
const NAV_NEXT_KEY = 206;
const NEXT_LEVEL_KEY = 207;
const LEVEL_SELECT_KEY = 210;

let gStartX = 0;
let gBlockSize = 60;
let gScale = 1.0;
let gScreenX = 400;
let gScreenY = 600;

let cvs;
let canvas;

let bufCanvas;
let bufCtx;

let daisyGame;
let drawEngine;
let gameEngine;
let scoreDB;

let offset = 0;
let isMobile = false;

let LoadImage = function (image_name) {
  let load_image = new Image();
  load_image.src = image_name;
  return load_image;
}