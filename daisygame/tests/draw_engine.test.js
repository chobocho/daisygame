"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadGame } = require("./_bootstrap");

const { DrawEngine } = loadGame();

test("DrawEngine.arrowColorFor: CW direction (1) returns red", () => {
  assert.equal(DrawEngine.arrowColorFor(1), "#D6303A");
  assert.equal(DrawEngine.arrowColorFor(1), DrawEngine.ARROW_COLOR_CW);
});

test("DrawEngine.arrowColorFor: CCW direction (-1) returns blue", () => {
  assert.equal(DrawEngine.arrowColorFor(-1), "#1F6FE0");
  assert.equal(DrawEngine.arrowColorFor(-1), DrawEngine.ARROW_COLOR_CCW);
});

test("DrawEngine.arrowColorFor: defaults to CW (red) for any non -1 input", () => {
  // Only the literal -1 means CCW; everything else maps to CW so unknown
  // values never produce a missing color.
  assert.equal(DrawEngine.arrowColorFor(0), DrawEngine.ARROW_COLOR_CW);
  assert.equal(DrawEngine.arrowColorFor(2), DrawEngine.ARROW_COLOR_CW);
  assert.equal(DrawEngine.arrowColorFor(NaN), DrawEngine.ARROW_COLOR_CW);
});

test("DrawEngine: CW and CCW colors are distinct", () => {
  assert.notEqual(DrawEngine.ARROW_COLOR_CW, DrawEngine.ARROW_COLOR_CCW);
});
