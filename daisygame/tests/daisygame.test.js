"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadGame } = require("./_bootstrap");

const { DaisyGame, Effects, MODE_ARCADE, MODE_PUZZLE, MODE_ENDLESS } = loadGame();

function fresh(highScore = 0) {
  const g = new DaisyGame(0, 0, highScore);
  g.init();
  return g;
}

test("DaisyGame: starts in IDLE state with 0 score", () => {
  const g = fresh();
  assert.equal(g.isIdleState(), true);
  assert.equal(g.score(), 0);
});

test("DaisyGame: highScore comes from the constructor argument", () => {
  const g = fresh(1234);
  assert.equal(g.highScore(), 1234);
});

test("DaisyGame: getFlowers returns 7 flowers", () => {
  const g = fresh();
  assert.equal(g.getFlowers().length, 7);
});

test("DaisyGame: start transitions IDLE -> PLAY", () => {
  const g = fresh();
  g.start();
  assert.equal(g.isPlayState(), true);
});

test("DaisyGame: pause is ignored outside PLAY state", () => {
  const g = fresh();
  g.pause();
  assert.equal(g.isIdleState(), true);
});

test("DaisyGame: pause from PLAY -> PAUSE, then start resumes to PLAY", () => {
  const g = fresh();
  g.start();
  g.pause();
  assert.equal(g.isPauseState(), true);
  g.start();
  assert.equal(g.isPlayState(), true);
});

test("DaisyGame: turning a flower outside PLAY state does not score", () => {
  const g = fresh();
  g.turnFlower(0); // still IDLE
  assert.equal(g.score(), 0);
});

test("DaisyGame: togglePlayMusic flips the music flag", () => {
  const g = fresh();
  const before = g.isPlayMusic();
  g.togglePlayMusic();
  assert.notEqual(g.isPlayMusic(), before);
  g.togglePlayMusic();
  assert.equal(g.isPlayMusic(), before);
});

test("DaisyGame: increaseTick is inert when not in PLAY state", () => {
  const g = fresh();
  g.increaseTick();
  // Still IDLE, no flowers consumed.
  assert.equal(g.isIdleState(), true);
});

test("DaisyGame: turnFlower in PLAY rotates that flower's leaves", () => {
  const g = fresh();
  g.start();
  const flowers = g.getFlowers();
  const before = flowers[0].leaf.map((l) => l.color());
  g.turnFlower(0);
  const after = flowers[0].leaf.map((l) => l.color());
  // turn() does unshift(pop()) -> at least one position changes unless all
  // leaves share the same color (extremely unlikely with random init).
  const changed = before.some((c, i) => c !== after[i]);
  assert.ok(changed, "expected at least one leaf position to change");
});

test("DaisyGame: init clears the Effects queue", () => {
  Effects.popScore(10, 10, 5);
  Effects.callout("x", "chain");
  Effects.burst(0, 0, "#fff", 3);
  assert.ok(Effects.popups.length + Effects.callouts.length + Effects.particles.length > 0);

  const g = new DaisyGame(0, 0, 0);
  g.init();
  assert.equal(Effects.popups.length, 0);
  assert.equal(Effects.callouts.length, 0);
  assert.equal(Effects.particles.length, 0);
});

test("DaisyGame: turnFlower scores when a forced color match is set up", () => {
  const g = fresh();
  g.start();
  const flowers = g.getFlowers();

  // _leafMap[0] includes [0, 13] -> flower 0 leaf 0 with flower 1 leaf 3.
  // turn() does unshift(pop()), so leaf 5 ends up at index 0 after the call.
  // Forcing flower 0 leaf 5 and flower 1 leaf 3 to the same alive color
  // creates a deterministic match the moment we tap flower 0.
  flowers[0].leaf[5]._color = 5;
  flowers[0].leaf[5]._life = 15;
  flowers[1].leaf[3]._color = 5;
  flowers[1].leaf[3]._life = 15;

  assert.equal(g.score(), 0);
  g.turnFlower(0);
  assert.ok(g.score() > 0, `expected score > 0 after match, got ${g.score()}`);
});

// ---------- Mode behavior ----------

test("DaisyGame: default mode is Endless before any start()", () => {
  const g = fresh();
  assert.equal(g.mode(), MODE_ENDLESS);
  assert.equal(g.timerSeconds(), 0);
});

test("DaisyGame: start(MODE_ARCADE) sets mode and arms the timer", () => {
  const g = fresh();
  g.start(MODE_ARCADE);
  assert.equal(g.mode(), MODE_ARCADE);
  assert.ok(g.timerSeconds() > 0, "expected non-zero countdown");
});

test("DaisyGame: timerSeconds returns 0 for non-arcade modes", () => {
  const g = fresh();
  g.start(MODE_PUZZLE);
  assert.equal(g.timerSeconds(), 0);
  g.init();
  g.start(MODE_ENDLESS);
  assert.equal(g.timerSeconds(), 0);
});

test("DaisyGame: arcade timer expiry transitions to GAME_OVER", () => {
  const g = fresh();
  g.start(MODE_ARCADE);
  g._timerTicks = 1;
  g.increaseTick();
  assert.equal(g.isGameOverState(), true);
});

test("DaisyGame: arcade timer counts down on each play tick", () => {
  const g = fresh();
  g.start(MODE_ARCADE);
  const before = g._timerTicks;
  g.increaseTick();
  assert.equal(g._timerTicks, before - 1);
});

test("DaisyGame: pause freezes the arcade timer", () => {
  const g = fresh();
  g.start(MODE_ARCADE);
  const before = g._timerTicks;
  g.pause();
  for (let i = 0; i < 50; i++) g.increaseTick();
  assert.equal(g._timerTicks, before, "pause must not advance the countdown");
});

test("DaisyGame: pausing then starting (no arg) resumes same mode without resetting timer", () => {
  const g = fresh();
  g.start(MODE_ARCADE);
  g._timerTicks = 1234;
  g.pause();
  g.start(); // resume, no mode arg
  assert.equal(g.mode(), MODE_ARCADE);
  assert.equal(g._timerTicks, 1234);
  assert.equal(g.isPlayState(), true);
});

test("DaisyGame: puzzle mode does not auto-refill cleared flowers", () => {
  const g = fresh();
  g.start(MODE_PUZZLE);
  const flowers = g.getFlowers();
  for (let i = 0; i < 6; i++) flowers[0].remove(i);
  assert.equal(flowers[0].leaf_count(), 0);
  for (let i = 0; i < 30; i++) g.increaseTick();
  assert.equal(flowers[0].leaf_count(), 0, "puzzle must keep cleared flower empty");
});

test("DaisyGame: endless mode does refill cleared flowers", () => {
  const g = fresh();
  g.start(MODE_ENDLESS);
  const flowers = g.getFlowers();
  for (let i = 0; i < 6; i++) flowers[0].remove(i);
  // Wait for life animation to drain plus one refill tick.
  for (let i = 0; i < 30; i++) g.increaseTick();
  assert.ok(flowers[0].leaf_count() > 0, "endless must refill an empty flower");
});

test("DaisyGame: puzzle going non-playable transitions to GAME_OVER on next tap", () => {
  const g = fresh();
  g.start(MODE_PUZZLE);
  // Force an unwinnable state: every leaf gets the same isolated color and
  // _isPlayable's neighbor-color check fails after the turn.
  // Easiest path: clear every leaf so there are zero matches possible.
  for (const f of g.getFlowers()) {
    for (let i = 0; i < 6; i++) f.remove(i);
  }
  // Drain the life so leaves are fully gone (size 0).
  for (let i = 0; i < 20; i++) g.increaseTick();
  // _isPlayable returns true when leaf_count < 6, but with all-empty flowers
  // there are no neighbor colors to match. Force a turn to trigger the check.
  // The puzzle game-over check fires inside turnFlower.
  // Setup matching pair, then trigger turn that clears it, leaving the
  // board in a state where _isPlayable might still say playable due to
  // <6 leaves. Simpler: directly force _state to verify the wiring:
  // we already cover the wiring by checking that turnFlower in a
  // non-playable puzzle state goes to GAME_OVER. Construct that:
  const flowers = g.getFlowers();
  // Give each flower a single leaf so _isPlayable's "leaf_count < 6" still
  // returns true. To make truly non-playable, fill all flowers and ensure
  // no neighbor colors match. Skip this and test the simpler invariant:
  // that the puzzle branch calls GAME_OVER instead of resetting the board.
  // Stub _isPlayable to return false.
  g._isPlayable = () => false;
  flowers[0].leaf[0]._color = 1;
  flowers[0].leaf[0]._life = 15;
  g.turnFlower(0);
  assert.equal(g.isGameOverState(), true);
});
