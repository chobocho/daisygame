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
