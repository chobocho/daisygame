"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadGame } = require("./_bootstrap");

const {
  GameEngine, DaisyGame, LocalDB,
  MODE_ARCADE, MODE_ENDLESS,
  _store,
} = loadGame();

function build() {
  _store.clear();
  const db = new LocalDB();
  const game = new DaisyGame(0, 0, 0);
  game.init();
  const eng = new GameEngine(game, db);
  return { db, game, eng };
}

test("GameEngine.gotoMenu: from PAUSE returns to IDLE state", () => {
  const { game, eng } = build();
  eng.start(MODE_ARCADE);
  eng.pause();
  assert.equal(game.isPauseState(), true);
  eng.gotoMenu();
  assert.equal(game.isIdleState(), true);
});

test("GameEngine.gotoMenu: clears the resume snapshot", () => {
  const { db, eng } = build();
  eng.start(MODE_ARCADE);
  eng.pause();
  assert.notEqual(db.getResume(), null, "pause must have written a snapshot");
  eng.gotoMenu();
  assert.equal(db.getResume(), null);
});

test("GameEngine.gotoMenu: persists the high score when it improved", () => {
  _store.clear();
  const db = new LocalDB();
  db.setScore(50);
  const game = new DaisyGame(0, 0, Number(db.getScore()));
  game.init();
  const eng = new GameEngine(game, db);
  eng.start(MODE_ENDLESS);
  game.increaseScore(120); // current=120, high=120 > prev 50
  eng.pause();
  eng.gotoMenu();
  assert.equal(Number(db.getScore()), 120);
});

test("GameEngine.gotoMenu: safe to call from IDLE state (no-op)", () => {
  const { game, eng } = build();
  // Already IDLE. Should not throw and should remain IDLE.
  assert.doesNotThrow(() => eng.gotoMenu());
  assert.equal(game.isIdleState(), true);
});

test("GameEngine.start(mode) clears any pending resume snapshot", () => {
  const { db, eng } = build();
  eng.start(MODE_ARCADE);
  eng.pause();
  assert.notEqual(db.getResume(), null);
  eng.start(MODE_ENDLESS); // fresh game with new mode
  assert.equal(db.getResume(), null);
});

test("GameEngine.start() (no arg) does not clear the resume snapshot", () => {
  const { db, eng } = build();
  eng.start(MODE_ARCADE);
  eng.pause();
  assert.notEqual(db.getResume(), null);
  eng.start(); // resume from pause
  assert.notEqual(db.getResume(), null, "resuming preserves the snapshot");
});
