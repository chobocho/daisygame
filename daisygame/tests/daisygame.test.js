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

test("DaisyGame: a single matched pair awards 5 points", () => {
  const g = fresh();
  g.start();
  const flowers = g.getFlowers();
  // Kill every leaf so only our forced pair can match.
  for (let f = 0; f < flowers.length; f++) {
    for (let i = 0; i < 6; i++) {
      flowers[f].leaf[i]._color = 0;
      flowers[f].leaf[i]._life = 0;
    }
  }
  // Force flower 0 to CW so leaf 5 moves into slot 0 on turn.
  flowers[0].set_direction(1);
  // _leafMap[0] entry [0, 13] pairs flower 0 leaf 0 with flower 1 leaf 3.
  flowers[0].leaf[5]._color = 3;
  flowers[0].leaf[5]._life = 15;
  flowers[1].leaf[3]._color = 3;
  flowers[1].leaf[3]._life = 15;
  g.turnFlower(0);
  assert.equal(g.score(), 5, "single pair should award exactly 5 points");
});

test("DaisyGame: turnFlower scores when a forced color match is set up", () => {
  const g = fresh();
  g.start();
  const flowers = g.getFlowers();

  // _leafMap[0] includes [0, 13] -> flower 0 leaf 0 with flower 1 leaf 3.
  // Force CW so leaf 5 moves into slot 0 on turn (CCW would move slot 0 -> 5).
  flowers[0].set_direction(1);
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

test("DaisyGame: puzzle mode auto-refills cleared flowers (matches arcade/endless)", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  const flowers = g.getFlowers();
  for (let i = 0; i < 6; i++) flowers[0].remove(i);
  for (let i = 0; i < 30; i++) g.increaseTick();
  assert.ok(flowers[0].leaf_count() > 0,
    "puzzle should refill so the player can reach the target score");
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

// ---------- puzzle mode levels ----------

test("DaisyGame: start(MODE_PUZZLE) enters LEVEL_SELECT instead of PLAY", () => {
  const g = fresh();
  g.start(MODE_PUZZLE);
  assert.equal(g.isLevelSelectState(), true);
  assert.equal(g.isPlayState(), false);
});

test("DaisyGame: playPuzzleLevel(1) sets up 2 flowers, 4 colors, target 50", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  assert.equal(g.isPlayState(), true);
  assert.equal(g.puzzleLevel(), 1);
  assert.equal(g.getFlowers().length, 2);
  // Each leaf color must be in 1..4
  for (const f of g.getFlowers()) {
    for (const l of f.leaf) {
      assert.ok(l.color() >= 1 && l.color() <= 4, `color ${l.color()} out of 1..4`);
    }
  }
});

test("DaisyGame: playPuzzleLevel(100) sets up 7 flowers, 7 colors", () => {
  const g = fresh();
  g.playPuzzleLevel(100);
  assert.equal(g.getFlowers().length, 7);
  for (const f of g.getFlowers()) {
    for (const l of f.leaf) {
      assert.ok(l.color() >= 1 && l.color() <= 7, `color ${l.color()} out of 1..7`);
    }
  }
});

test("DaisyGame: puzzle level timer counts down each tick", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  const before = g._timerTicks;
  g.increaseTick();
  assert.equal(g._timerTicks, before - 1);
});

test("DaisyGame: puzzle timer expiry transitions to GAME_OVER", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  g._timerTicks = 1;
  g.increaseTick();
  assert.equal(g.isGameOverState(), true);
});

test("DaisyGame: puzzleLevel returns 0 outside puzzle mode", () => {
  const g = fresh();
  g.start(MODE_ENDLESS);
  assert.equal(g.puzzleLevel(), 0);
});

test("DaisyGame: levelSelectPlay transitions LEVEL_SELECT -> PLAY for unlocked level", () => {
  const g = fresh();
  g.start(MODE_PUZZLE);
  assert.equal(g.isLevelSelectState(), true);
  g.levelSelectPlay();
  assert.equal(g.isPlayState(), true, "expected PLAY state after levelSelectPlay");
  assert.equal(g.puzzleLevel(), 1);
});

test("DaisyGame: levelSelectPlay does nothing for a locked level", () => {
  const g = fresh();
  g.start(MODE_PUZZLE);
  // Force selection past the unlocked frontier (default unlocked=1).
  g._puzzleLevel = 5;
  g.levelSelectPlay();
  assert.equal(g.isLevelSelectState(), true, "must remain in LEVEL_SELECT");
});

test("DaisyGame: selectAndPlayLevel jumps to an unlocked level and starts it", () => {
  const g = fresh();
  g.start(MODE_PUZZLE);
  g.selectAndPlayLevel(1);
  assert.equal(g.isPlayState(), true);
  assert.equal(g.puzzleLevel(), 1);
});

test("DaisyGame: selectAndPlayLevel ignores locked levels", () => {
  const g = fresh();
  g.start(MODE_PUZZLE);
  g.selectAndPlayLevel(50); // not unlocked
  assert.equal(g.isLevelSelectState(), true);
  assert.notEqual(g.puzzleLevel(), 50);
});

test("DaisyGame: selectAndPlayLevel works for any level up to the unlocked frontier", () => {
  const g = fresh();
  g.start(MODE_PUZZLE);
  g.puzzleProgress()._unlocked = 7;
  g.selectAndPlayLevel(3);
  assert.equal(g.isPlayState(), true);
  assert.equal(g.puzzleLevel(), 3);
});

test("DaisyGame: exitToLevelSelect from PAUSE returns to LEVEL_SELECT", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  g.pause();
  assert.equal(g.isPauseState(), true);
  g.exitToLevelSelect();
  assert.equal(g.isLevelSelectState(), true);
  assert.equal(g.mode(), MODE_PUZZLE);
});

test("DaisyGame: exitToLevelSelect resets score (round abandoned)", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  g.increaseScore(120);
  g.pause();
  g.exitToLevelSelect();
  assert.equal(g.score(), 0);
});

// ---------- mixed rotation directions ----------

test("DaisyGame: _init_flower assigns at least 2 CW and 2 CCW directions", () => {
  // Repeat enough times to catch any pathological RNG slot.
  for (let trial = 0; trial < 50; trial++) {
    const g = fresh();
    const flowers = g.getFlowers();
    let cw = 0;
    let ccw = 0;
    for (const f of flowers) {
      if (f.direction() === 1) cw++;
      else if (f.direction() === -1) ccw++;
    }
    assert.equal(cw + ccw, 7, `trial ${trial}: total != 7`);
    assert.ok(cw >= 2, `trial ${trial}: cw=${cw} (need >= 2)`);
    assert.ok(ccw >= 2, `trial ${trial}: ccw=${ccw} (need >= 2)`);
  }
});

test("DaisyGame: turnFlower respects per-flower direction", () => {
  const g = fresh();
  g.start();
  const flowers = g.getFlowers();

  // Force flower 0 to CCW and verify rotation matches push(shift()).
  flowers[0].set_direction(-1);
  const before = flowers[0].leaf.map((l) => l.color());
  g.turnFlower(0);
  const after = flowers[0].leaf.map((l) => l.color());
  for (let i = 0; i < 6; i++) {
    assert.equal(after[i], before[(i + 1) % 6]);
  }
});

// ---------- serialize / restore (resume) ----------

test("DaisyGame: serialize -> restore round-trips score, mode, timer, flowers", () => {
  const a = fresh();
  a.start(MODE_ARCADE);
  a._timerTicks = 1500;
  a.increaseScore(77);

  const snapshot = a.serialize();
  assert.equal(snapshot.v, 1, "snapshot has schema version");

  const b = new DaisyGame(0, 0, 0);
  b.init();
  assert.equal(b.restore(snapshot), true);

  assert.equal(b.mode(), MODE_ARCADE);
  assert.equal(b._timerTicks, 1500);
  assert.equal(b.score(), 77);
  assert.equal(b.isPauseState(), true, "restored game enters PAUSE");
  for (let i = 0; i < 7; i++) {
    const af = a.getFlowers()[i];
    const bf = b.getFlowers()[i];
    for (let j = 0; j < 6; j++) {
      assert.equal(bf.leaf[j].color(), af.leaf[j].color());
    }
  }
});

test("DaisyGame.restore: graceful failure on null/undefined", () => {
  const g = fresh();
  const before = g.score();
  assert.equal(g.restore(null), false);
  assert.equal(g.restore(undefined), false);
  assert.equal(g.score(), before);
});

test("DaisyGame.restore: graceful failure on schema version mismatch", () => {
  const g = fresh();
  assert.equal(g.restore({ v: 999 }), false);
  assert.equal(g.isIdleState(), true);
});

test("DaisyGame.restore: graceful failure when flowers array is wrong length", () => {
  const g = fresh();
  // Now valid sizes are 1..7 (puzzle level 1 has 2 flowers). 0 and 8+ should fail.
  assert.equal(g.restore({ v: 1, mode: 0, flowers: [] }), false);
  assert.equal(g.restore({ v: 1, mode: 0, flowers: new Array(8).fill({}) }), false);
});

test("DaisyGame.restore: graceful failure when mode is non-numeric", () => {
  const g = fresh();
  const broken = { v: 1, mode: "arcade", flowers: new Array(7).fill({}) };
  assert.equal(g.restore(broken), false);
});

test("DaisyGame: puzzle stays in PLAY when momentarily non-playable (board re-seeds)", () => {
  // The original game-over-on-stuck branch was wrong because puzzle now
  // refills leaves; deadlocks should reset the board, not end the game.
  const g = fresh();
  g.playPuzzleLevel(1);
  g._isPlayable = () => false;
  const flowers = g.getFlowers();
  flowers[0].leaf[0]._color = 1;
  flowers[0].leaf[0]._life = 15;
  g.turnFlower(0);
  assert.equal(g.isPlayState(), true);
});
