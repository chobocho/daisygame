"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadCore } = require("./_bootstrap");

const { LocalDB, _store, localStorage } = loadCore();

test.beforeEach(() => _store.clear());

test("LocalDB.getResume returns null when nothing is stored", () => {
  const db = new LocalDB();
  assert.equal(db.getResume(), null);
});

test("LocalDB.setResume + getResume round-trips a plain object", () => {
  const db = new LocalDB();
  const snapshot = { v: 1, mode: 0, score: { current: 42 } };
  db.setResume(snapshot);
  assert.deepEqual(db.getResume(), snapshot);
});

test("LocalDB.clearResume removes the stored snapshot", () => {
  const db = new LocalDB();
  db.setResume({ v: 1 });
  assert.notEqual(db.getResume(), null);
  db.clearResume();
  assert.equal(db.getResume(), null);
});

test("LocalDB.getResume returns null on corrupt JSON", () => {
  _store.set("DaisyResume", "{not json");
  const db = new LocalDB();
  assert.equal(db.getResume(), null);
});

test("LocalDB.getResume returns null when stored value is a primitive", () => {
  _store.set("DaisyResume", '"just a string"');
  const db = new LocalDB();
  assert.equal(db.getResume(), null);
});

test("LocalDB.setResume swallows storage exceptions (e.g. quota)", () => {
  const db = new LocalDB();
  const original = localStorage.setItem;
  localStorage.setItem = () => {
    throw new Error("quota exceeded");
  };
  try {
    assert.doesNotThrow(() => db.setResume({ v: 1, big: "x".repeat(10) }));
  } finally {
    localStorage.setItem = original;
  }
});

test("LocalDB.getResume swallows storage exceptions and returns null", () => {
  const db = new LocalDB();
  const original = localStorage.getItem;
  localStorage.getItem = () => {
    throw new Error("storage unavailable");
  };
  try {
    assert.equal(db.getResume(), null);
  } finally {
    localStorage.getItem = original;
  }
});

test("LocalDB.clearResume swallows storage exceptions", () => {
  const db = new LocalDB();
  const original = localStorage.removeItem;
  localStorage.removeItem = () => {
    throw new Error("nope");
  };
  try {
    assert.doesNotThrow(() => db.clearResume());
  } finally {
    localStorage.removeItem = original;
  }
});

test("LocalDB.getScore still works alongside the resume slot", () => {
  const db = new LocalDB();
  db.setScore(987);
  db.setResume({ v: 1 });
  assert.equal(Number(db.getScore()), 987);
  assert.notEqual(db.getResume(), null);
});
