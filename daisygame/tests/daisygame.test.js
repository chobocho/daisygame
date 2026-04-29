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

function planForcedMatch(g, color) {
  const flowers = g.getFlowers();
  for (let f = 0; f < flowers.length; f++) {
    for (let i = 0; i < 6; i++) {
      flowers[f].leaf[i]._color = 0;
      flowers[f].leaf[i]._life = 0;
    }
  }
  flowers[0].set_direction(1);
  flowers[0].leaf[5]._color = color;
  flowers[0].leaf[5]._life = 15;
  flowers[1].leaf[3]._color = color;
  flowers[1].leaf[3]._life = 15;
}

test("DaisyGame: color-1 pair awards 3 points (2 base + 1 bonus)", () => {
  const g = fresh();
  g.start();
  planForcedMatch(g, 1);
  g.turnFlower(0);
  assert.equal(g.score(), 3);
});

test("DaisyGame: color-7 pair awards 9 points (2 base + 7 bonus)", () => {
  const g = fresh();
  g.start();
  planForcedMatch(g, 7);
  g.turnFlower(0);
  assert.equal(g.score(), 9);
});

test("DaisyGame: color bonuses ramp 1..7 across colors", () => {
  for (let c = 1; c <= 7; c++) {
    const g = fresh();
    g.start();
    planForcedMatch(g, c);
    g.turnFlower(0);
    assert.equal(g.score(), 2 + c, `color ${c} should award ${2 + c} points`);
  }
});

test("DaisyGame: a rainbow-leaf match awards 8 points (5 + 3 bonus)", () => {
  const g = fresh();
  g.start();
  const flowers = g.getFlowers();
  for (let f = 0; f < flowers.length; f++) {
    for (let i = 0; i < 6; i++) {
      flowers[f].leaf[i]._color = 0;
      flowers[f].leaf[i]._life = 0;
    }
  }
  flowers[0].set_direction(1);
  // Rainbow on flower 0 leaf 5; any color on flower 1 leaf 3.
  flowers[0].leaf[5]._color = 8; // RAINBOW_COLOR
  flowers[0].leaf[5]._life = 15;
  flowers[1].leaf[3]._color = 4;
  flowers[1].leaf[3]._life = 15;
  g.turnFlower(0);
  assert.equal(g.score(), 8);
});

test("DaisyGame: rainbow-on-rainbow match also rewards the bonus", () => {
  const g = fresh();
  g.start();
  const flowers = g.getFlowers();
  for (let f = 0; f < flowers.length; f++) {
    for (let i = 0; i < 6; i++) {
      flowers[f].leaf[i]._color = 0;
      flowers[f].leaf[i]._life = 0;
    }
  }
  flowers[0].set_direction(1);
  flowers[0].leaf[5]._color = 8;
  flowers[0].leaf[5]._life = 15;
  flowers[1].leaf[3]._color = 8;
  flowers[1].leaf[3]._life = 15;
  g.turnFlower(0);
  assert.equal(g.score(), 8);
});

test("DaisyGame: _trySpawnRainbow places exactly one rainbow leaf", () => {
  const g = fresh();
  g.start();
  const flowers = g.getFlowers();
  for (let f = 0; f < flowers.length; f++) {
    for (let i = 0; i < 6; i++) {
      flowers[f].leaf[i]._color = 0;
      flowers[f].leaf[i]._life = 0;
    }
    flowers[f]._leaf_count = 0;
  }
  assert.equal(g._trySpawnRainbow(), true);
  let count = 0;
  for (const f of flowers) {
    for (const l of f.leaf) {
      if (l.isRainbow()) count++;
    }
  }
  assert.equal(count, 1);
});

test("DaisyGame: _trySpawnRainbow returns false when no empty slot", () => {
  const g = fresh();
  g.start();
  // All slots are alive after start; no empty slots.
  assert.equal(g._trySpawnRainbow(), false);
});

test("DaisyGame: _isPlayable returns true if a rainbow exists on board", () => {
  const g = fresh();
  g.start();
  const flowers = g.getFlowers();
  // Construct a deadlock: every flower has 6 leaves of one isolated color.
  // Then drop a rainbow into one slot to verify the early-return.
  flowers[0].leaf[0]._color = 8;
  flowers[0].leaf[0]._life = 15;
  // Even if other heuristics would say not playable, rainbow saves us.
  assert.equal(g._isPlayable(), true);
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

// ---------- timerSecondsFloat (drives the puzzle petal-stack animation) ----------

test("DaisyGame: timerSecondsFloat is fractional and matches _timerTicks", () => {
  const g = fresh();
  g.start(MODE_ARCADE);
  g._timerTicks = 1234;
  // 1234 ticks * 30ms = 37020ms = 37.02s exactly.
  assert.equal(g.timerSecondsFloat(), 37.02);
});

test("DaisyGame: timerSecondsFloat decrements smoothly between integer seconds", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  // After playPuzzleLevel(1) the timer is 60s ≈ 2000 ticks.
  const before = g.timerSecondsFloat();
  g.increaseTick();
  const after = g.timerSecondsFloat();
  // Each tick is 30ms, so float time should drop by 0.03s — finer-grained
  // than timerSeconds (which would still read 60 here).
  assert.ok(Math.abs((before - after) - 0.03) < 1e-9,
    `expected 0.03s drop, got ${before - after}`);
  assert.equal(g.timerSeconds(), 60, "ceil-based timerSeconds still reads 60");
});

test("DaisyGame: timerSecondsFloat returns 0 outside arcade/puzzle play", () => {
  const g = fresh();
  // Endless: no countdown.
  g.start(MODE_ENDLESS);
  assert.equal(g.timerSecondsFloat(), 0);
  // Puzzle in LEVEL_SELECT (not yet playing): also 0.
  g.init();
  g.start(MODE_PUZZLE);
  assert.equal(g.timerSecondsFloat(), 0);
});

test("DaisyGame: timerSecondsFloat is positive once a puzzle level is started", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  assert.ok(g.timerSecondsFloat() > 0);
  // And it equals the float reading of _timerTicks (no ceiling).
  assert.equal(g.timerSecondsFloat(), g._timerTicks * 30 / 1000);
});

test("DaisyGame: timerSecondsFloat freezes during pause", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  g.pause();
  // Out of PLAY state, the puzzle branch returns 0.
  assert.equal(g.timerSecondsFloat(), 0);
  g.start(); // resume
  // Back in PLAY, ticks unchanged so fractional reading is the original 60s.
  assert.ok(g.timerSecondsFloat() > 0);
});

// ---------- Golden leaf event ----------

// Wipes leaf colour/life so only forced fixtures match. Mirrors the
// inline clears in older tests — _leaf_count is intentionally left at its
// init value (6) so the monochrome empty-board bonus in _playEffectSound
// doesn't accidentally fire and obscure per-pair score assertions.
function clearBoard(g) {
  for (const f of g.getFlowers()) {
    for (let i = 0; i < 6; i++) {
      f.leaf[i]._color = 0;
      f.leaf[i]._life = 0;
      f.leaf[i]._goldSnapshot = null;
    }
  }
}

function findAllGold(g) {
  const out = [];
  const flowers = g.getFlowers();
  for (let f = 0; f < flowers.length; f++) {
    for (let i = 0; i < 6; i++) {
      if (flowers[f].leaf[i].isGolden()) out.push({ flower: f, idx: i });
    }
  }
  return out;
}

function isLeafMapPair(g, slotA, slotB) {
  const cA = slotA.flower * 10 + slotA.idx;
  const cB = slotB.flower * 10 + slotB.idx;
  for (const pairs of g._leafMap) {
    for (const [a, b] of pairs) {
      if ((a === cA && b === cB) || (a === cB && b === cA)) return true;
    }
  }
  return false;
}

test("DaisyGame: _trySpawnGolden places exactly two gold leaves at a _leafMap pair", () => {
  const g = fresh();
  g.start();
  clearBoard(g);
  assert.equal(g._trySpawnGolden(), true);
  const golds = findAllGold(g);
  assert.equal(golds.length, 2, "gold spawn must produce a pair");
  assert.notEqual(golds[0].flower, golds[1].flower, "the two gold leaves must be on facing flowers");
  assert.ok(isLeafMapPair(g, golds[0], golds[1]),
    `gold positions ${JSON.stringify(golds)} not a _leafMap pair`);
});

test("DaisyGame: _trySpawnGolden records active state with a 2..5s lifetime", () => {
  const g = fresh();
  g.start();
  clearBoard(g);
  g._trySpawnGolden();
  const ag = g.activeGolden();
  assert.ok(ag);
  assert.ok(ag.ticksLeft >= 67 && ag.ticksLeft <= 167,
    `ticksLeft ${ag.ticksLeft} not in [67, 167]`);
  assert.equal(ag.dyingTicks, 12);
});

test("DaisyGame: a second _trySpawnGolden while active is a no-op", () => {
  const g = fresh();
  g.start();
  clearBoard(g);
  assert.equal(g._trySpawnGolden(), true);
  const before = findAllGold(g);
  assert.equal(g._trySpawnGolden(), false);
  const after = findAllGold(g);
  assert.equal(after.length, before.length);
});

test("DaisyGame: empty board → both gold leaves are wasEmpty (no snapshot)", () => {
  const g = fresh();
  g.start();
  clearBoard(g);
  g._trySpawnGolden();
  const flowers = g.getFlowers();
  let goldCount = 0;
  let allEmpty = true;
  for (const f of flowers) {
    for (const l of f.leaf) {
      if (l.isGolden()) {
        goldCount++;
        if (l._goldSnapshot !== null) allEmpty = false;
      }
    }
  }
  assert.equal(goldCount, 2);
  assert.equal(allEmpty, true,
    "both gold leaves on an empty board should have null snapshots");
});

test("DaisyGame: full board → both gold leaves carry a non-null color snapshot", () => {
  const g = fresh();
  g.start();
  // Full board after start() → no empties → transform path on both sides.
  g._trySpawnGolden();
  const golds = findAllGold(g);
  assert.equal(golds.length, 2);
  for (const s of golds) {
    const l = g.getFlowers()[s.flower].leaf[s.idx];
    assert.ok(l._goldSnapshot, "transformed gold must carry a snapshot");
    assert.ok(l._goldSnapshot.color >= 1 && l._goldSnapshot.color <= 7,
      `snapshot.color ${l._goldSnapshot.color} not a normal color`);
  }
});

test("DaisyGame: gold pair never overlaps a rainbow leaf", () => {
  const g = fresh();
  g.start();
  // Drop a rainbow at every center boundary so any pair containing a center
  // slot is forced to skip — the gold pair must be on ring-only slots.
  // Simpler: just stamp one rainbow and confirm gold doesn't land on it.
  g.getFlowers()[0].leaf[0].setRainbow();
  g._trySpawnGolden();
  const golds = findAllGold(g);
  assert.equal(golds.length, 2);
  for (const s of golds) {
    assert.ok(!(s.flower === 0 && s.idx === 0),
      "gold pair must not include the rainbow slot");
  }
});

test("DaisyGame: gold expiry on empty-fill clears both slots", () => {
  const g = fresh();
  g.start();
  clearBoard(g);
  g._trySpawnGolden();
  const golds = findAllGold(g);
  assert.equal(golds.length, 2);
  const counts = golds.map(s => g.getFlowers()[s.flower]._leaf_count);
  g._expireGolden();
  assert.equal(g.activeGolden(), null);
  for (let i = 0; i < golds.length; i++) {
    const f = g.getFlowers()[golds[i].flower];
    assert.equal(f.leaf[golds[i].idx].color(), 0);
    assert.equal(f._leaf_count, counts[i] - 1,
      "leaf_count should decrement when an empty-fill gold expires");
  }
});

test("DaisyGame: gold expiry on transformed pair restores both original colors", () => {
  const g = fresh();
  g.start();
  // Full board → both sides transform. Capture snapshots BEFORE expire.
  g._trySpawnGolden();
  const golds = findAllGold(g);
  assert.equal(golds.length, 2);
  const expected = golds.map(s => {
    const snap = g.getFlowers()[s.flower].leaf[s.idx]._goldSnapshot;
    return { slot: s, color: snap.color, life: snap.life };
  });
  g._expireGolden();
  assert.equal(g.activeGolden(), null);
  for (const e of expected) {
    const l = g.getFlowers()[e.slot.flower].leaf[e.slot.idx];
    assert.equal(l.color(), e.color, "transformed gold must revert to its snapshot color");
    assert.equal(l._life, e.life);
  }
});

test("DaisyGame: gold lifecycle ticks down inside increaseTick", () => {
  const g = fresh();
  g.start();
  clearBoard(g);
  g._goldenCooldown = 0;
  g.increaseTick();
  const before = g.activeGolden();
  assert.ok(before, "increaseTick should have spawned the gold event");
  g.increaseTick();
  const after = g.activeGolden();
  assert.equal(after.ticksLeft, before.ticksLeft - 1);
});

test("DaisyGame: gold expires automatically when ticksLeft hits zero", () => {
  const g = fresh();
  g.start();
  clearBoard(g);
  g._trySpawnGolden();
  const golds = findAllGold(g);
  assert.equal(golds.length, 2);
  g._activeGolden.ticksLeft = 1;
  g.increaseTick();
  assert.equal(g.activeGolden(), null);
  for (const s of golds) {
    assert.equal(g.getFlowers()[s.flower].leaf[s.idx].isGolden(), false);
  }
});

test("DaisyGame: a matched gold-gold pair scores 9 points", () => {
  const g = fresh();
  g.start();
  clearBoard(g);
  const flowers = g.getFlowers();
  flowers[0].set_direction(1);
  // _leafMap[0] entry [0, 13]: F0 leaf 0 ↔ F1 leaf 3. Stage gold at F0 leaf 5
  // so a single CW turn rotates it into slot 0, lining up with F1 leaf 3.
  flowers[0].leaf[5].setGolden(null);
  flowers[0].leaf[5]._life = 15;
  flowers[1].leaf[3].setGolden(null);
  flowers[1].leaf[3]._life = 15;
  g._activeGolden = { ticksLeft: 100 };
  g.turnFlower(0);
  assert.equal(g.score(), 9);
});

test("DaisyGame: gold-vs-rainbow match still scores 9 (gold wins over rainbow)", () => {
  const g = fresh();
  g.start();
  clearBoard(g);
  const flowers = g.getFlowers();
  flowers[0].set_direction(1);
  flowers[0].leaf[5].setGolden(null);
  flowers[0].leaf[5]._life = 15;
  flowers[1].leaf[3].setRainbow();
  g._activeGolden = { ticksLeft: 100 };
  g.turnFlower(0);
  assert.equal(g.score(), 9);
});

test("DaisyGame: gold does NOT match a normal color (no score, gold survives)", () => {
  const g = fresh();
  g.start();
  clearBoard(g);
  const flowers = g.getFlowers();
  flowers[0].set_direction(1);
  flowers[0].leaf[5].setGolden(null);
  flowers[0].leaf[5]._life = 15;
  flowers[1].leaf[3]._color = 4;  // a normal color
  flowers[1].leaf[3]._life = 15;
  g._activeGolden = { ticksLeft: 100 };
  g.turnFlower(0);
  assert.equal(g.score(), 0, "gold must not match a normal color");
  // After CW turn, gold landed at flower 0 slot 0 and is still alive.
  assert.equal(flowers[0].leaf[0].isGolden(), true);
  assert.equal(flowers[0].leaf[0].isAlive(), true);
});

test("DaisyGame: matching a gold pair clears _activeGolden immediately", () => {
  const g = fresh();
  g.start();
  clearBoard(g);
  const flowers = g.getFlowers();
  flowers[0].set_direction(1);
  flowers[0].leaf[5].setGolden(null);
  flowers[0].leaf[5]._life = 15;
  flowers[1].leaf[3].setGolden(null);
  flowers[1].leaf[3]._life = 15;
  g._activeGolden = { ticksLeft: 100 };
  g.turnFlower(0);
  assert.equal(g.activeGolden(), null);
});

test("DaisyGame: _isPlayable returns true while a gold pair is on the board", () => {
  const g = fresh();
  g.start();
  clearBoard(g);
  // Stage just the gold pair — no other matchable normal pairs.
  const flowers = g.getFlowers();
  flowers[0].leaf[0].setGolden(null);
  flowers[0].leaf[0]._life = 15;
  flowers[1].leaf[3].setGolden(null);
  flowers[1].leaf[3]._life = 15;
  assert.equal(g._isPlayable(), true);
});

test("DaisyGame: init/playPuzzleLevel reset the gold cooldown and active record", () => {
  const g = fresh();
  g.start();
  clearBoard(g);
  g._trySpawnGolden();
  assert.ok(g.activeGolden());
  g.init();
  assert.equal(g.activeGolden(), null);
  assert.equal(g._goldenCooldown, g.GOLDEN_INTERVAL_TICKS);

  g.playPuzzleLevel(1);
  clearBoard(g);
  g._trySpawnGolden();
  assert.ok(g.activeGolden());
  g.playPuzzleLevel(1);
  assert.equal(g.activeGolden(), null);
});

// ---------- Puzzle chain combo ----------

// Stages a single matchable color-3 pair: F0 leaf 5 + F1 leaf 3, both alive.
// One CW turn of F0 lands the F0 leaf at slot 0, completing the [0, 13]
// pair from _leafMap.
function stagePuzzlePair(g, color) {
  const flowers = g.getFlowers();
  for (const f of flowers) {
    for (let i = 0; i < 6; i++) {
      f.leaf[i]._color = 0;
      f.leaf[i]._life = 0;
    }
  }
  flowers[0].set_direction(1);
  flowers[0].leaf[5]._color = color;
  flowers[0].leaf[5]._life = 15;
  flowers[1].leaf[3]._color = color;
  flowers[1].leaf[3]._life = 15;
}

test("DaisyGame: puzzle combo: first match scores at 1.0x", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  stagePuzzlePair(g, 3);
  const before = g.score();
  g.turnFlower(0);
  // Color-3 pair: 2 + 3 = 5 base. First match is unboosted.
  assert.equal(g.score() - before, 5);
  assert.equal(g._comboMultiplier, 1.0);
  assert.equal(g._comboCooldown > 0, true, "match arms the chain window");
});

test("DaisyGame: puzzle combo: second match within 1s scales by 1.2", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  // Pretend the chain window is open from a prior match.
  g._comboCooldown = 33;
  g._comboMultiplier = 1.0;
  stagePuzzlePair(g, 5); // base = 2 + 5 = 7
  const before = g.score();
  g.turnFlower(0);
  // multiplier *= 1.2 → 1.2; floor(7 * 1.2) = 8.
  assert.equal(g._comboMultiplier, 1.2);
  assert.equal(g.score() - before, 8);
});

test("DaisyGame: puzzle combo: third match compounds to 1.44x", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  // Two prior chain hits → multiplier already 1.2, window still open.
  g._comboCooldown = 33;
  g._comboMultiplier = 1.2;
  stagePuzzlePair(g, 5); // base = 7
  const before = g.score();
  g.turnFlower(0);
  // multiplier *= 1.2 → 1.44; floor(7 * 1.44) = 10.
  assert.ok(Math.abs(g._comboMultiplier - 1.44) < 1e-9);
  assert.equal(g.score() - before, 10);
});

test("DaisyGame: puzzle combo: chain breaks once the cooldown expires", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  // Window already lapsed; the prior multiplier is stale and must reset.
  g._comboCooldown = 0;
  g._comboMultiplier = 2.0;
  stagePuzzlePair(g, 3);
  const before = g.score();
  g.turnFlower(0);
  assert.equal(g._comboMultiplier, 1.0, "expired window must reset to 1.0x");
  assert.equal(g.score() - before, 5, "score reverts to the base value");
});

test("DaisyGame: combo cooldown decrements per tick and expires the multiplier", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  g._comboCooldown = 5;
  g._comboMultiplier = 1.5;
  for (let i = 0; i < 5; i++) g.increaseTick();
  assert.equal(g._comboCooldown, 0);
  assert.equal(g._comboMultiplier, 1.0);
});

test("DaisyGame: arcade mode skips the combo multiplier", () => {
  const g = fresh();
  g.start(MODE_ARCADE);
  // Even with chain window pre-armed, arcade plays at flat scoring.
  g._comboCooldown = 33;
  g._comboMultiplier = 2.0;
  stagePuzzlePair(g, 3);
  const before = g.score();
  g.turnFlower(0);
  assert.equal(g.score() - before, 5);
  assert.equal(g._comboMultiplier, 2.0,
    "arcade match must not bump the chain bookkeeping either");
});

test("DaisyGame: endless mode skips the combo multiplier", () => {
  const g = fresh();
  g.start(MODE_ENDLESS);
  g._comboCooldown = 33;
  g._comboMultiplier = 2.0;
  stagePuzzlePair(g, 3);
  const before = g.score();
  g.turnFlower(0);
  assert.equal(g.score() - before, 5);
});

test("DaisyGame: playPuzzleLevel resets the combo state", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  g._comboCooldown = 30;
  g._comboMultiplier = 3.0;
  g.playPuzzleLevel(2);
  assert.equal(g._comboCooldown, 0);
  assert.equal(g._comboMultiplier, 1.0);
});

test("DaisyGame: init resets the combo state", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  g._comboCooldown = 30;
  g._comboMultiplier = 2.5;
  g.init();
  assert.equal(g._comboCooldown, 0);
  assert.equal(g._comboMultiplier, 1.0);
});

test("DaisyGame: restore resets the combo state on the destination game", () => {
  const a = fresh();
  a.playPuzzleLevel(1);
  const snap = a.serialize();
  const b = fresh();
  // Pre-pollute with a stale chain — restore must reset it.
  b._comboCooldown = 99;
  b._comboMultiplier = 99;
  assert.equal(b.restore(snap), true);
  assert.equal(b._comboCooldown, 0);
  assert.equal(b._comboMultiplier, 1.0);
});

test("DaisyGame: a non-matching turn doesn't bump the combo multiplier", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  g._comboCooldown = 33;
  g._comboMultiplier = 1.2;
  // Empty board → turnFlower yields no match (and triggers _fillEmptySlots,
  // which doesn't touch combo state).
  for (const f of g.getFlowers()) {
    for (let i = 0; i < 6; i++) {
      f.leaf[i]._color = 0;
      f.leaf[i]._life = 0;
    }
  }
  g.turnFlower(0);
  assert.equal(g._comboMultiplier, 1.2, "no-match turn must not compound the multiplier");
  assert.equal(g._comboCooldown, 33, "no-match turn must not refresh the cooldown");
});

test("DaisyGame: combo cooldown freezes during pause", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  g._comboCooldown = 20;
  g._comboMultiplier = 1.5;
  g.pause();
  // increaseTick is a no-op outside PLAY state.
  for (let i = 0; i < 50; i++) g.increaseTick();
  assert.equal(g._comboCooldown, 20);
  assert.equal(g._comboMultiplier, 1.5);
});

test("DaisyGame: a boosted match emits a 'combo' callout", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  g._comboCooldown = 33;
  g._comboMultiplier = 1.0;
  Effects.reset();
  stagePuzzlePair(g, 3);
  g.turnFlower(0);
  const combo = Effects.callouts.find(c => c.kind === "combo");
  assert.ok(combo, "boosted combo must produce a combo callout");
  assert.equal(combo.text, "x1.20");
});

test("DaisyGame: an unboosted (1.0x) match emits no combo callout", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  Effects.reset();
  stagePuzzlePair(g, 3);
  g.turnFlower(0);
  const combo = Effects.callouts.find(c => c.kind === "combo");
  assert.equal(combo, undefined, "1.0x first match must not emit a combo callout");
});

test("DaisyGame: a boosted score popup uses a coral color", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  g._comboCooldown = 33;
  g._comboMultiplier = 1.0;
  Effects.reset();
  stagePuzzlePair(g, 3);
  g.turnFlower(0);
  const popup = Effects.popups[Effects.popups.length - 1];
  assert.ok(popup, "match must produce a score popup");
  assert.equal(popup.color, "#E25E2A",
    "boosted popup must use the coral combo color");
});

test("DaisyGame: a non-boosted score popup keeps the default dark color", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  Effects.reset();
  stagePuzzlePair(g, 3);
  g.turnFlower(0);
  const popup = Effects.popups[Effects.popups.length - 1];
  assert.ok(popup);
  assert.equal(popup.color, "#3a2a18");
});

test("DaisyGame: matching a gold pair counts as a combo step", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  // Pre-arm the chain so the gold match scores at 1.2x.
  g._comboCooldown = 33;
  g._comboMultiplier = 1.0;
  const flowers = g.getFlowers();
  for (const f of flowers) {
    for (let i = 0; i < 6; i++) {
      f.leaf[i]._color = 0;
      f.leaf[i]._life = 0;
    }
  }
  flowers[0].set_direction(1);
  flowers[0].leaf[5].setGolden(null);
  flowers[0].leaf[5]._life = 15;
  flowers[1].leaf[3].setGolden(null);
  flowers[1].leaf[3]._life = 15;
  g._activeGolden = { ticksLeft: 100 };
  const before = g.score();
  g.turnFlower(0);
  // Gold pair = 9 base; 1.2x → floor(9 * 1.2) = 10.
  assert.equal(g._comboMultiplier, 1.2);
  assert.equal(g.score() - before, 10);
});

test("DaisyGame: serialize pre-expires an active gold pair (transformed → reverted)", () => {
  const g = fresh();
  g.start();
  // Full board → transform path. Capture original colors first.
  g._trySpawnGolden();
  const golds = findAllGold(g);
  assert.equal(golds.length, 2);
  const expected = golds.map(s => ({
    slot: s,
    color: g.getFlowers()[s.flower].leaf[s.idx]._goldSnapshot.color,
  }));
  const snap = g.serialize();
  // After serialize the active record is gone and both leaves are reverted.
  assert.equal(g.activeGolden(), null);
  for (const e of expected) {
    const l = g.getFlowers()[e.slot.flower].leaf[e.slot.idx];
    assert.equal(l.color(), e.color);
    assert.equal(l.isGolden(), false);
  }
  // Restoring the snapshot has no lingering gold either.
  const h = fresh();
  assert.equal(h.restore(snap), true);
  for (const f of h.getFlowers()) {
    for (const l of f.leaf) assert.equal(l.isGolden(), false);
  }
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

test("DaisyGame: puzzle stays in PLAY when momentarily non-playable", () => {
  // The original game-over-on-stuck branch was wrong because puzzle now
  // refills leaves; deadlocks should keep playing.
  const g = fresh();
  g.playPuzzleLevel(1);
  g._isPlayable = () => false;
  const flowers = g.getFlowers();
  flowers[0].leaf[0]._color = 1;
  flowers[0].leaf[0]._life = 15;
  g.turnFlower(0);
  assert.equal(g.isPlayState(), true);
});

test("DaisyGame: puzzle deadlock fills empty slots instead of full board reset", () => {
  const g = fresh();
  g.playPuzzleLevel(1);
  const flowers = g.getFlowers();

  // Empty a slot we can verify gets refilled.
  flowers[1].leaf[2]._color = 0;
  flowers[1].leaf[2]._life = 0;
  flowers[1]._leaf_count = 5;

  // Place a fingerprint on flower 1 leaf 0 — flower 1 isn't rotated when
  // we tap flower 0, and leaf 0 isn't touched by checkCollision's
  // _leafMap[0] entry (which only inspects flower 1 leaf 3 for N=2).
  flowers[1].leaf[0]._color = 6;
  flowers[1].leaf[0]._life = 15;

  g._isPlayable = () => false;
  g.turnFlower(0);

  // Empty slot got refilled.
  assert.notEqual(flowers[1].leaf[2].color(), 0);
  // Fingerprint preserved (no full _init_flower reset).
  assert.equal(flowers[1].leaf[0].color(), 6);
});
