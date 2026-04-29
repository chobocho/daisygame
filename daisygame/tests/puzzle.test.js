"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadCore } = require("./_bootstrap");

const { Puzzle, PuzzleProgress, _store } = loadCore();

test.beforeEach(() => _store.clear());

// ---------- levelConfig ----------

test("Puzzle.levelConfig: level 1 has 2 flowers, 4 colors, 60s, target 50", () => {
  const c = Puzzle.levelConfig(1);
  assert.equal(c.level, 1);
  assert.equal(c.flowers, 2);
  assert.equal(c.colors, 4);
  assert.equal(c.timeSeconds, 60);
  assert.equal(c.target, 50);
});

test("Puzzle.levelConfig: level 100 has 7 flowers, 7 colors, 60s, target 3515", () => {
  const c = Puzzle.levelConfig(100);
  assert.equal(c.level, 100);
  assert.equal(c.flowers, 7);
  assert.equal(c.colors, 7);
  assert.equal(c.timeSeconds, 60);
  // 50 + 35*99 = 3515.
  assert.equal(c.target, 3515);
});

test("Puzzle.levelConfig: target ramps linearly at +35/level from a base of 50", () => {
  // Sample the curve so a future tweak (e.g. swapping the slope) is loud.
  assert.equal(Puzzle.levelConfig(1).target, 50);
  assert.equal(Puzzle.levelConfig(2).target, 85);
  assert.equal(Puzzle.levelConfig(10).target, 365);
  assert.equal(Puzzle.levelConfig(50).target, 1765);
});

test("Puzzle.levelConfig: time limit is flat 60 seconds across all levels", () => {
  for (const lv of [1, 25, 50, 75, 99, 100]) {
    assert.equal(Puzzle.levelConfig(lv).timeSeconds, 60, `level ${lv}`);
  }
});

test("Puzzle.levelConfig: flower count steps up every 17 levels", () => {
  assert.equal(Puzzle.levelConfig(17).flowers, 2);
  assert.equal(Puzzle.levelConfig(18).flowers, 3);
  assert.equal(Puzzle.levelConfig(34).flowers, 3);
  assert.equal(Puzzle.levelConfig(35).flowers, 4);
  assert.equal(Puzzle.levelConfig(85).flowers, 6);
  assert.equal(Puzzle.levelConfig(86).flowers, 7);
});

test("Puzzle.levelConfig: color count steps up every 33 levels", () => {
  assert.equal(Puzzle.levelConfig(33).colors, 4);
  assert.equal(Puzzle.levelConfig(34).colors, 5);
  assert.equal(Puzzle.levelConfig(66).colors, 5);
  assert.equal(Puzzle.levelConfig(67).colors, 6);
  assert.equal(Puzzle.levelConfig(99).colors, 6);
  assert.equal(Puzzle.levelConfig(100).colors, 7);
});

test("Puzzle.levelConfig: out-of-range levels are clamped to [1, 100]", () => {
  assert.equal(Puzzle.levelConfig(0).level, 1);
  assert.equal(Puzzle.levelConfig(-99).level, 1);
  assert.equal(Puzzle.levelConfig(101).level, 100);
  assert.equal(Puzzle.levelConfig(99999).level, 100);
});

// ---------- starRating ----------

test("Puzzle.starRating: below target = 0 stars (failed)", () => {
  assert.equal(Puzzle.starRating(49, 50), 0);
  assert.equal(Puzzle.starRating(0, 50), 0);
});

test("Puzzle.starRating: at target = 1 star", () => {
  assert.equal(Puzzle.starRating(50, 50), 1);
  assert.equal(Puzzle.starRating(74, 50), 1);
});

test("Puzzle.starRating: at 1.5x target = 2 stars", () => {
  assert.equal(Puzzle.starRating(75, 50), 2);
  assert.equal(Puzzle.starRating(99, 50), 2);
});

test("Puzzle.starRating: at 2x target = 3 stars", () => {
  assert.equal(Puzzle.starRating(100, 50), 3);
  assert.equal(Puzzle.starRating(9999, 50), 3);
});

// ---------- PuzzleProgress ----------

test("PuzzleProgress: fresh state starts with only level 1 unlocked", () => {
  const p = new PuzzleProgress();
  assert.equal(p.unlocked(), 1);
  assert.equal(p.bestScore(1), 0);
  assert.equal(p.isUnlocked(1), true);
  assert.equal(p.isUnlocked(2), false);
});

test("PuzzleProgress: clearing a level unlocks the next", () => {
  const p = new PuzzleProgress();
  p.recordResult(1, 60); // L1 target 50, cleared
  assert.equal(p.unlocked(), 2);
  assert.equal(p.bestScore(1), 60);
  assert.equal(p.isUnlocked(2), true);
});

test("PuzzleProgress: failing a level keeps it locked but records best", () => {
  const p = new PuzzleProgress();
  p.recordResult(1, 30); // below target
  assert.equal(p.unlocked(), 1);
  assert.equal(p.bestScore(1), 30);
});

test("PuzzleProgress: best score only improves", () => {
  const p = new PuzzleProgress();
  p.recordResult(1, 80);
  p.recordResult(1, 60);
  assert.equal(p.bestScore(1), 80);
  p.recordResult(1, 200);
  assert.equal(p.bestScore(1), 200);
});

test("PuzzleProgress: persistence across instances", () => {
  const a = new PuzzleProgress();
  a.recordResult(1, 80);
  a.recordResult(2, 110); // L2 target 85, cleared
  const b = new PuzzleProgress();
  assert.equal(b.unlocked(), 3);
  assert.equal(b.bestScore(1), 80);
  assert.equal(b.bestScore(2), 110);
});

test("PuzzleProgress: corrupted storage falls back to fresh state", () => {
  _store.set("DaisyPuzzle", "{not json");
  const p = new PuzzleProgress();
  assert.equal(p.unlocked(), 1);
  assert.equal(p.bestScore(1), 0);
});

test("PuzzleProgress: unlocking caps at MAX_LEVEL", () => {
  const p = new PuzzleProgress();
  p._unlocked = 100; // simulate having reached the final level
  p.recordResult(100, 99999);
  assert.equal(p.unlocked(), 100); // not 101
});

test("PuzzleProgress: clearing a non-current-frontier level does not regress unlocked", () => {
  const p = new PuzzleProgress();
  p.recordResult(1, 80); // unlock 2
  assert.equal(p.unlocked(), 2);
  p.recordResult(1, 90); // re-clear L1, no regression
  assert.equal(p.unlocked(), 2);
});

test("PuzzleProgress: stars(level) reflects best vs target", () => {
  const p = new PuzzleProgress();
  assert.equal(p.stars(1), 0); // no record
  p.recordResult(1, 60);
  assert.equal(p.stars(1), 1); // 50 ≤ 60 < 75
  p.recordResult(1, 80);
  assert.equal(p.stars(1), 2); // 75 ≤ 80 < 100
  p.recordResult(1, 200);
  assert.equal(p.stars(1), 3); // ≥ 100
});

// ---------- New target curve regression guards ----------
//
// L2 sat at target 100 under the old 50*level ramp; the rebalance dropped
// it to 85. A score of 84 must remain failed (no unlock), 85 must clear.
// If a future tweak silently slides the slope back toward 50/level these
// will fail loudly.
test("PuzzleProgress: L2 score 84 stays locked under the new target (85)", () => {
  const p = new PuzzleProgress();
  p.recordResult(1, 100); // unlock L2
  p.recordResult(2, 84);
  assert.equal(p.unlocked(), 2, "L3 must NOT unlock — 84 < 85 target");
  assert.equal(p.bestScore(2), 84);
  assert.equal(p.stars(2), 0, "below target = 0 stars");
});

test("PuzzleProgress: L2 score 85 unlocks L3 (target = 50 + 35*1)", () => {
  const p = new PuzzleProgress();
  p.recordResult(1, 100);
  p.recordResult(2, 85);
  assert.equal(p.unlocked(), 3);
  assert.equal(p.stars(2), 1);
});

test("Puzzle.starRating: L100 boundary uses new target 3515, not 5000", () => {
  // At L100 score 3514 must still read failed (0 stars); 3515 = 1 star.
  // Catches a regression where someone restores the old 50*level slope
  // but forgets to re-tune starRating, or vice-versa.
  const cfg = Puzzle.levelConfig(100);
  assert.equal(Puzzle.starRating(3514, cfg.target), 0);
  assert.equal(Puzzle.starRating(3515, cfg.target), 1);
});
