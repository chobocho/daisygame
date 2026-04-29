"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadGame } = require("./_bootstrap");

const {
  DrawEngine, DaisyGame, Puzzle,
  MODE_PUZZLE,
  S_KEY, MENU_KEY, LEVEL_SELECT_KEY, NEXT_LEVEL_KEY,
} = loadGame();

// Build a DrawEngine wired to a DaisyGame parked in the puzzle GAME_OVER
// state at the given level + score. Hit tests in tests below run against
// the default canvas globals (gStartX=0, gScale=1.0) so logical coords map
// 1:1 onto the (x, y) passed to getEventCode.
function buildPuzzleGameOver(level, score) {
  const g = new DaisyGame(0, 0, 0);
  g.init();
  g.playPuzzleLevel(level);
  if (score > 0) g.increaseScore(score);
  g._enterGameOver();
  const stubImages = { images: { background: {} } };
  return new DrawEngine(g, stubImages);
}

test("DrawEngine.arrowColorFor: CW direction (1) returns red", () => {
  assert.equal(DrawEngine.arrowColorFor(1), "#D6303A");
  assert.equal(DrawEngine.arrowColorFor(1), DrawEngine.ARROW_COLOR_CW);
});

test("DrawEngine.arrowColorFor: CCW direction (-1) returns blue", () => {
  assert.equal(DrawEngine.arrowColorFor(-1), "#1F6FE0");
  assert.equal(DrawEngine.arrowColorFor(-1), DrawEngine.ARROW_COLOR_CCW);
});

test("DrawEngine.arrowColorFor: defaults to CW (red) for any non -1 input", () => {
  // Only the literal -1 means CCW; everything else maps to CW so unknown
  // values never produce a missing color.
  assert.equal(DrawEngine.arrowColorFor(0), DrawEngine.ARROW_COLOR_CW);
  assert.equal(DrawEngine.arrowColorFor(2), DrawEngine.ARROW_COLOR_CW);
  assert.equal(DrawEngine.arrowColorFor(NaN), DrawEngine.ARROW_COLOR_CW);
});

test("DrawEngine: CW and CCW colors are distinct", () => {
  assert.notEqual(DrawEngine.ARROW_COLOR_CW, DrawEngine.ARROW_COLOR_CCW);
});

// ---------- Puzzle timer petal palette (tricolor red→white→blue) ----------

test("DrawEngine.PUZZLE_TIMER_PALETTES: precomputed 12-slot stack", () => {
  const palettes = DrawEngine.PUZZLE_TIMER_PALETTES;
  assert.equal(palettes.length, 12, "stack has 12 slots, one per timer petal");
  for (const p of palettes) {
    assert.ok(p.base && p.light && p.dark && p.outline,
      "each slot exposes base/light/dark/outline");
  }
});

test("DrawEngine.PUZZLE_TIMER_PALETTES: slot 0 base is deep red (last-to-fall)", () => {
  // bottom-of-stack → time nearly out → urgent red
  assert.equal(DrawEngine.PUZZLE_TIMER_PALETTES[0].base, "rgb(196, 43, 43)");
});

test("DrawEngine.PUZZLE_TIMER_PALETTES: slot 11 base is deep blue (first-to-fall)", () => {
  // top-of-stack → lots of time left → calm blue
  assert.equal(DrawEngine.PUZZLE_TIMER_PALETTES[11].base, "rgb(43, 79, 196)");
});

test("DrawEngine.PUZZLE_TIMER_PALETTES: midpoint reaches pure white", () => {
  // The 3-stop interpolation passes through WHITE at t=0.5. With N=12 the
  // exact midpoint t=0.5 lands between slots 5 (t≈0.4545) and 6 (t≈0.5454).
  // Both should be near-white; neither side stays purely red or blue.
  const parseRgb = (s) => s.match(/\d+/g).map(Number);
  const mid5 = parseRgb(DrawEngine.PUZZLE_TIMER_PALETTES[5].base);
  const mid6 = parseRgb(DrawEngine.PUZZLE_TIMER_PALETTES[6].base);
  for (const [r, g, b] of [mid5, mid6]) {
    assert.ok(r >= 220 && g >= 220 && b >= 220,
      `mid-stack slot should be near-white, got rgb(${r}, ${g}, ${b})`);
  }
});

test("DrawEngine.PUZZLE_TIMER_PALETTES: bottom half leans warm, top half leans cool", () => {
  // The gradient is RED→WHITE→BLUE, so individual channels are not monotonic
  // (red peaks at the white midpoint, blue does too). The right invariant is
  // hue lean: bottom-of-stack must be redder than blue, top-of-stack must be
  // bluer than red. A future swap that flips the stack will break this.
  const parseRgb = (s) => s.match(/\d+/g).map(Number);
  const palettes = DrawEngine.PUZZLE_TIMER_PALETTES;
  const [r0, , b0] = parseRgb(palettes[0].base);
  const [rN, , bN] = parseRgb(palettes[palettes.length - 1].base);
  assert.ok(r0 > b0, `bottom slot should lean red, got rgb r=${r0} b=${b0}`);
  assert.ok(bN > rN, `top slot should lean blue, got rgb r=${rN} b=${bN}`);
});

test("DrawEngine.PUZZLE_TIMER_PALETTES: dark variant is 60% of base toward black", () => {
  const parseRgb = (s) => s.match(/\d+/g).map(Number);
  const slot = DrawEngine.PUZZLE_TIMER_PALETTES[0];
  const [br, bg, bb] = parseRgb(slot.base);
  const [dr, dg, db] = parseRgb(slot.dark);
  assert.equal(dr, Math.round(br * 0.6));
  assert.equal(dg, Math.round(bg * 0.6));
  assert.equal(db, Math.round(bb * 0.6));
});

// ---------- Puzzle GAME_OVER button hit testing ----------
//
// The cleared and failed variants of the puzzle game-over screen lay out
// different button stacks. getEventCode dispatches via _hitPuzzleGameOver,
// returning the key code that main.js routes (Retry, Next, Level Select,
// Main Menu). Coordinates here mirror the literals in
// src/draw_engine.ts._drawPuzzleGameOver — drift between draw and hit will
// surface as a missed click in production.

test("DrawEngine.getEventCode: puzzle FAILED Retry button at (200, 280) → S_KEY", () => {
  const de = buildPuzzleGameOver(1, 0); // score 0 < target 50 → failed
  assert.equal(de.getEventCode(200, 280), S_KEY);
});

test("DrawEngine.getEventCode: puzzle FAILED Level Select button at (200, 335) → LEVEL_SELECT_KEY", () => {
  const de = buildPuzzleGameOver(1, 0);
  assert.equal(de.getEventCode(200, 335), LEVEL_SELECT_KEY);
});

test("DrawEngine.getEventCode: puzzle FAILED Main Menu button at (200, 390) → MENU_KEY", () => {
  const de = buildPuzzleGameOver(1, 0);
  assert.equal(de.getEventCode(200, 390), MENU_KEY);
});

test("DrawEngine.getEventCode: puzzle FAILED screen — click in empty space returns 0", () => {
  const de = buildPuzzleGameOver(1, 0);
  // Above the Retry button (y=240) and to the side of the column (x=50).
  assert.equal(de.getEventCode(50, 240), 0);
  // Between Retry (280±22) and Level Select (335±22): rows 303–312 are
  // outside both buttons.
  assert.equal(de.getEventCode(200, 308), 0);
});

test("DrawEngine.getEventCode: puzzle CLEARED Next Level button at (200, 250) → NEXT_LEVEL_KEY", () => {
  // L1 target = 50; score 100 ≥ target → cleared with room for Next Level.
  const de = buildPuzzleGameOver(1, 100);
  assert.equal(de.getEventCode(200, 250), NEXT_LEVEL_KEY);
});

test("DrawEngine.getEventCode: puzzle CLEARED Retry at 305, Level Select at 360, Main Menu at 415", () => {
  const de = buildPuzzleGameOver(1, 100);
  assert.equal(de.getEventCode(200, 305), S_KEY);
  assert.equal(de.getEventCode(200, 360), LEVEL_SELECT_KEY);
  assert.equal(de.getEventCode(200, 415), MENU_KEY);
});

test("DrawEngine.getEventCode: puzzle CLEARED final level (100) uses failed layout — no Next button", () => {
  // The cleared-with-Next layout only fires when lvl < MAX_LEVEL. At 100,
  // hit testing falls into the 3-button branch so y=250 is dead space.
  const de = buildPuzzleGameOver(100, 100000);
  assert.equal(de.getEventCode(200, 250), 0, "no Next Level on final cleared level");
  assert.equal(de.getEventCode(200, 280), S_KEY, "Retry sits at failed-layout y");
  assert.equal(de.getEventCode(200, 335), LEVEL_SELECT_KEY);
  assert.equal(de.getEventCode(200, 390), MENU_KEY);
});

test("DrawEngine.getEventCode: puzzle game-over — clicks outside the button column return 0", () => {
  const de = buildPuzzleGameOver(1, 100);
  // Buttons span x ≈ 105..295 (halfW=95); x=80 and x=320 must miss.
  assert.equal(de.getEventCode(80, 305), 0);
  assert.equal(de.getEventCode(320, 305), 0);
});
