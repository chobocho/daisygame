"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadCore } = require("./_bootstrap");

const { Leaf } = loadCore();

test("Leaf: initial color is in 1..6", () => {
  const l = new Leaf(10);
  assert.ok(l.color() >= 1 && l.color() <= 6, `color=${l.color()}`);
});

test("Leaf: full life size equals provided radius", () => {
  const l = new Leaf(10);
  assert.equal(l.size(), 10);
  assert.equal(l.isAlive(), true);
});

test("Leaf: remove makes the leaf no longer alive", () => {
  const l = new Leaf(10);
  l.remove();
  assert.equal(l.isAlive(), false);
});

test("Leaf: remove on a dead leaf is a no-op", () => {
  const l = new Leaf(10);
  l.remove();
  const sizeAfterFirst = l.size();
  l.remove();
  assert.equal(l.size(), sizeAfterFirst);
});

test("Leaf: reduceSize eventually clears color and size to 0", () => {
  const l = new Leaf(10);
  l.remove();
  for (let i = 0; i < 30; i++) l.reduceSize();
  assert.equal(l.size(), 0);
  assert.equal(l.color(), 0);
});

test("Leaf: reset rotates to next color and restores life", () => {
  const l = new Leaf(10);
  const before = l.color();
  l.remove();
  l.reduceSize();
  l.reset();
  assert.equal(l.isAlive(), true);
  assert.equal(l.size(), 10);
  assert.notEqual(l.color(), before);
});

test("Leaf: size shrinks proportionally to remaining life", () => {
  const l = new Leaf(10);
  l.remove(); // life 15 -> 14
  for (let i = 0; i < 7; i++) l.reduceSize(); // life -> 7
  // Math.floor(10 * 7 / 15) === 4
  assert.equal(l.size(), 4);
});

// ---------- Birth (creation) animation ----------

test("Leaf: constructor leaf is fully grown (no birth animation)", () => {
  const l = new Leaf(10);
  assert.equal(l.size(), 10);
});

test("Leaf: playBirth shrinks size to start the birth animation", () => {
  const l = new Leaf(10);
  l.playBirth();
  assert.ok(l.size() < 10, "size should shrink while the birth animation plays");
});

test("Leaf: advanceBirth grows the leaf back to full size", () => {
  const l = new Leaf(10);
  l.playBirth();
  const sizes = [];
  for (let i = 0; i < 12; i++) {
    sizes.push(l.size());
    l.advanceBirth();
  }
  // Monotonic non-decreasing during birth animation.
  for (let i = 1; i < sizes.length; i++) {
    assert.ok(sizes[i] >= sizes[i - 1], `size went backwards at step ${i}`);
  }
  assert.equal(l.size(), 10);
});

test("Leaf: reset alone does not retrigger birth (size stays full)", () => {
  const l = new Leaf(10);
  l.remove();
  l.reduceSize();
  l.reset();
  assert.equal(l.isAlive(), true);
  // Birth state unchanged by reset; the caller (Flower.addLeaf) decides.
  assert.equal(l.size(), 10);
});

test("Leaf: serialize -> restore preserves the birth animation phase", () => {
  const a = new Leaf(10);
  a.playBirth();
  a.advanceBirth();
  a.advanceBirth();
  const snap = a.serialize();
  const b = new Leaf(10);
  b.restore(snap);
  assert.equal(b.size(), a.size());
});

test("Leaf: setRainbow marks the leaf as rainbow and alive", () => {
  const l = new Leaf(10);
  l.setRainbow();
  assert.equal(l.isRainbow(), true);
  assert.equal(l.isAlive(), true);
  assert.equal(l.color(), 8);
});

test("Leaf: setGolden marks the leaf as gold (color 9) and alive", () => {
  const l = new Leaf(10);
  l.setGolden();
  assert.equal(l.isGolden(), true);
  assert.equal(l.isAlive(), true);
  assert.equal(l.color(), 9);
  assert.equal(l.isRainbow(), false);
});

test("Leaf: get_life_ratio and get_birth_ratio expose the render fractions", () => {
  const l = new Leaf(10);
  assert.equal(l.get_life_ratio(), 1);
  assert.equal(l.get_birth_ratio(), 1);
  l.remove();
  assert.ok(l.get_life_ratio() < 1);
  l.playBirth();
  assert.ok(l.get_birth_ratio() < 1);
});

test("Leaf: serialize -> restore round-trips color, life, and color cycle", () => {
  const a = new Leaf(10);
  a.remove();
  a.reduceSize();
  a.reduceSize();
  const snapshot = a.serialize();

  const b = new Leaf(10);
  b.restore(snapshot);
  assert.equal(b.color(), a.color());
  assert.equal(b.size(), a.size());
  assert.equal(b.isAlive(), a.isAlive());

  // Reset on the restored leaf should advance through the cloned colorTable
  // exactly as the original would.
  a.reset();
  b.reset();
  assert.equal(b.color(), a.color());
});
