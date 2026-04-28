"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadGame } = require("./_bootstrap");

const { DaisyGame, Effects } = loadGame();

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
