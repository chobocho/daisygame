"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadCore } = require("./_bootstrap");

const { Score } = loadCore();

test("Score: starts at 0 with default high score 0", () => {
  const s = new Score();
  assert.equal(s.score(), 0);
  assert.equal(s.highScore(), 0);
});

test("Score: increase adds to current and tracks new high", () => {
  const s = new Score(50);
  s.increase(10);
  assert.equal(s.score(), 10);
  assert.equal(s.highScore(), 50);
  s.increase(50);
  assert.equal(s.score(), 60);
  assert.equal(s.highScore(), 60);
});

test("Score: needToSave is false until current high beats initial high", () => {
  const s = new Score(100);
  assert.equal(s.needToSave(), false);
  s.increase(50);
  assert.equal(s.needToSave(), false);
  s.increase(60); // total 110 > 100
  assert.equal(s.needToSave(), true);
});

test("Score: init resets current and locks in high score", () => {
  const s = new Score(0);
  s.increase(80);
  s.init();
  assert.equal(s.score(), 0);
  assert.equal(s.highScore(), 80);
});

test("Score: increase below initial high keeps the initial high", () => {
  const s = new Score(200);
  s.increase(100);
  assert.equal(s.score(), 100);
  assert.equal(s.highScore(), 200);
});

test("Score: serialize -> restore round-trips current/high/prev", () => {
  const a = new Score(100);
  a.increase(150); // current=150, high=150, prev=100 -> needToSave=true
  const snapshot = a.serialize();

  const b = new Score(0);
  b.restore(snapshot);
  assert.equal(b.score(), 150);
  assert.equal(b.highScore(), 150);
  assert.equal(b.needToSave(), true);
});
