// Ambient declarations for globals defined in the still-JS files.
// These map onto values.js, util.js, leaf.js, flower.js, daisygame.js, image_loader.js.

declare const ENTER_KEY: number;
declare const KEY_0: number;
declare const KEY_1: number;
declare const KEY_2: number;
declare const KEY_3: number;
declare const KEY_4: number;
declare const KEY_5: number;
declare const KEY_6: number;
declare const M_KEY: number;
declare const P_KEY: number;
declare const S_KEY: number;

declare const MODE_ARCADE: number;
declare const MODE_PUZZLE: number;
declare const MODE_ENDLESS: number;

declare const MODE_ARCADE_KEY: number;
declare const MODE_PUZZLE_KEY: number;
declare const MODE_ENDLESS_KEY: number;
declare const MENU_KEY: number;
declare const NAV_PREV_KEY: number;
declare const NAV_NEXT_KEY: number;
declare const NEXT_LEVEL_KEY: number;
declare const LEVEL_SELECT_KEY: number;

declare let gStartX: number;
declare let gBlockSize: number;
declare let gScale: number;
declare let gScreenX: number;
declare let gScreenY: number;

declare let cvs: CanvasRenderingContext2D;
declare let canvas: HTMLCanvasElement;
declare let bufCanvas: HTMLCanvasElement;
declare let bufCtx: CanvasRenderingContext2D;

declare function printf(tag: string, log: string | number): void;

interface LeafLike {
  size(): number;
  color(): number;
  isAlive(): boolean;
  isRainbow(): boolean;
  get_life_ratio(): number;
  get_birth_ratio(): number;
}

interface FlowerLike {
  x: number;
  y: number;
  radius: number;
  index: number;
  leaf: LeafLike[];
  small_radius(): number;
  is_inside(x: number, y: number, gStartX: number, gScale: number): boolean;
  direction(): number;
}

interface PuzzleProgressLike {
  unlocked(): number;
  isUnlocked(level: number): boolean;
  bestScore(level: number): number;
  stars(level: number): number;
}

interface DaisyGameLike {
  state(): number;
  score(): number;
  highScore(): number;
  isIdleState(): boolean;
  isPlayState(): boolean;
  isPauseState(): boolean;
  isGameOverState(): boolean;
  isLevelSelectState(): boolean;
  isPlayMusic(): boolean;
  getFlowers(): FlowerLike[];
  mode(): number;
  timerSeconds(): number;
  timerSecondsFloat(): number;
  puzzleLevel(): number;
  puzzleProgress(): PuzzleProgressLike | null;
}

declare class Puzzle {
  static MAX_LEVEL: number;
  static levelConfig(level: number): {
    level: number;
    flowers: number;
    colors: number;
    timeSeconds: number;
    target: number;
  };
  static starRating(score: number, target: number): number;
}

interface LoadedImages {
  background: HTMLImageElement;
}

interface ImageLoaderLike {
  images: LoadedImages;
}

// Audio used inside DaisyGame and triggered indirectly from effect events.
declare const pop_sound: string;
declare const clear_sound: string;
