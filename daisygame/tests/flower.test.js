"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadCore } = require("./_bootstrap");

const { Flower } = loadCore();

test("Flower: initializes with 6 leaves", () => {
  const f = new Flower(0);
  assert.equal(f.leaf_count(), 6);
  assert.equal(f.leaf.length, 6);
});

test("Flower: turn rotates leaves cyclically (last -> first)", () => {
  const f = new Flower(0);
  const before = f.leaf.map((l) => l.color());
  f.turn();
  const after = f.leaf.map((l) => l.color());
  // After unshift(pop()): after[i] === before[(i - 1 + 6) % 6]
  for (let i = 0; i < 6; i++) {
    assert.equal(after[i], before[(i - 1 + 6) % 6]);
  }
});

test("Flower: six turns return to the original arrangement", () => {
  const f = new Flower(0);
  const before = f.leaf.map((l) => l.color());
  for (let i = 0; i < 6; i++) f.turn();
  const after = f.leaf.map((l) => l.color());
  assert.deepEqual(after, before);
});

test("Flower: remove decrements leaf_count once per index", () => {
  const f = new Flower(0);
  f.remove(0);
  assert.equal(f.leaf_count(), 5);
  f.remove(0); // already removed -> idempotent
  assert.equal(f.leaf_count(), 5);
});

test("Flower: small_radius matches the constructor radius", () => {
  const f = new Flower(0);
  assert.equal(f.small_radius(), 10);
});

test("Flower: is_inside hits points within the radius", () => {
  const f = new Flower(0);
  f.set_pos(100, 100, 30);
  // Default gStartX=0, gScale=1
  assert.equal(f.is_inside(100, 100, 0, 1), true, "dead center");
  assert.equal(f.is_inside(125, 100, 0, 1), true, "inside radius");
  assert.equal(f.is_inside(140, 100, 0, 1), false, "outside radius");
});

test("Flower: serialize -> restore round-trips position and leaves", () => {
  const a = new Flower(3);
  a.set_pos(150, 250, 30);
  a.remove(0);
  a.remove(2);
  const snapshot = a.serialize();

  const b = new Flower(0);
  b.restore(snapshot);
  assert.equal(b.index, 3);
  assert.equal(b.x, 150);
  assert.equal(b.y, 250);
  assert.equal(b.radius, 30);
  assert.equal(b.leaf_count(), a.leaf_count());
  for (let i = 0; i < 6; i++) {
    assert.equal(b.leaf[i].color(), a.leaf[i].color(), `leaf ${i} color`);
    assert.equal(b.leaf[i].isAlive(), a.leaf[i].isAlive(), `leaf ${i} alive`);
  }
});

test("Flower: is_inside scales with gScale and gStartX", () => {
  const f = new Flower(0);
  f.set_pos(100, 100, 30);
  // Logical center (100, 100) maps to (gStartX + 100*gScale, 100*gScale).
  const gStartX = 50;
  const gScale = 2;
  const cx = gStartX + 100 * gScale; // 250
  const cy = 100 * gScale;            // 200
  assert.equal(f.is_inside(cx, cy, gStartX, gScale), true);
  // 30 logical * gScale=2 -> radius 60 in screen coords.
  assert.equal(f.is_inside(cx + 55, cy, gStartX, gScale), true);
  assert.equal(f.is_inside(cx + 65, cy, gStartX, gScale), false);
});
