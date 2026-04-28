"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadCore } = require("./_bootstrap");

const { Effects } = loadCore();

test.beforeEach(() => Effects.reset());

test("Effects: popScore enqueues a positive value with text prefix", () => {
  Effects.popScore(10, 20, 50);
  assert.equal(Effects.popups.length, 1);
  assert.equal(Effects.popups[0].text, "+50");
  assert.equal(Effects.popups[0].x, 10);
  assert.equal(Effects.popups[0].y, 20);
});

test("Effects: popScore ignores zero or negative values", () => {
  Effects.popScore(0, 0, 0);
  Effects.popScore(0, 0, -3);
  assert.equal(Effects.popups.length, 0);
});

test("Effects: popups are capped at MAX_POPUPS (oldest dropped)", () => {
  for (let i = 0; i < Effects.MAX_POPUPS + 4; i++) {
    Effects.popScore(0, 0, i + 1);
  }
  assert.equal(Effects.popups.length, Effects.MAX_POPUPS);
  assert.notEqual(Effects.popups[0].text, "+1");
});

test("Effects: callout enqueues with kind", () => {
  Effects.callout("Daisy Chain!", "chain");
  assert.equal(Effects.callouts.length, 1);
  assert.equal(Effects.callouts[0].kind, "chain");
  assert.equal(Effects.callouts[0].text, "Daisy Chain!");
});

test("Effects: burst pushes the requested number of particles", () => {
  Effects.burst(10, 20, "#fff", 5);
  assert.equal(Effects.particles.length, 5);
  for (const p of Effects.particles) {
    assert.equal(p.x, 10);
    assert.equal(p.y, 20);
    assert.equal(p.color, "#fff");
  }
});

test("Effects: burst is capped at MAX_PARTICLES", () => {
  Effects.burst(0, 0, "#fff", Effects.MAX_PARTICLES + 10);
  assert.equal(Effects.particles.length, Effects.MAX_PARTICLES);
});

test("Effects: tick decrements life and prunes expired entries", () => {
  Effects.popScore(0, 0, 1);
  const popup = Effects.popups[0];
  for (let i = 0; i < popup.maxLife; i++) Effects.tick();
  assert.equal(Effects.popups.length, 0);
});

test("Effects: tick moves popup upward (y decreases)", () => {
  Effects.popScore(100, 100, 5);
  const initialY = Effects.popups[0].y;
  Effects.tick();
  assert.ok(Effects.popups[0].y < initialY, "popup should drift upward");
});

test("Effects: tick decrements callout life and prunes when expired", () => {
  Effects.callout("Daisy Chain!", "chain");
  const c = Effects.callouts[0];
  const initialLife = c.life;
  Effects.tick();
  assert.equal(c.life, initialLife - 1);
  for (let i = 0; i < initialLife; i++) Effects.tick();
  assert.equal(Effects.callouts.length, 0);
});

test("Effects: tick advances particle position with gravity", () => {
  Effects.particles.push({
    x: 100,
    y: 100,
    vx: 1,
    vy: 0,
    life: 5,
    maxLife: 5,
    color: "#fff",
    size: 2,
  });
  Effects.tick();
  const p = Effects.particles[0];
  assert.ok(p.x > 100, "x advanced");
  assert.ok(p.vy > 0, "gravity applied");
  assert.equal(p.life, 4);
});

test("Effects: reset clears every queue", () => {
  Effects.popScore(0, 0, 1);
  Effects.callout("x", "chain");
  Effects.burst(0, 0, "#fff", 3);
  Effects.reset();
  assert.equal(Effects.popups.length, 0);
  assert.equal(Effects.callouts.length, 0);
  assert.equal(Effects.particles.length, 0);
});

test("Effects: colorFor returns a hex color for indices 1..6", () => {
  for (let i = 1; i <= 6; i++) {
    assert.match(Effects.colorFor(i), /^#[0-9A-F]{6}$/, `idx=${i}`);
  }
});

test("Effects: colorFor falls back to white for out-of-range indices", () => {
  assert.equal(Effects.colorFor(99), "#FFFFFF");
  assert.equal(Effects.colorFor(-1), "#FFFFFF");
});
