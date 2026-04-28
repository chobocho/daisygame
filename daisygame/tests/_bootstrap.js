"use strict";
// Bootstrap that loads the game's browser-style script files into a Node
// process by evaluating their concatenated source inside `new Function`.
// Each script's top-level class declaration becomes a lexical binding inside
// the wrapper, and the trailing `return` extracts the ones we want.
//
// We do NOT load audio.js (its huge base64 strings are irrelevant for unit
// tests) or image_loader.js (DOM dependency); for daisygame.js we inject
// minimal stubs in place of those.

const fs = require("node:fs");
const path = require("node:path");

const JS_DIR = path.join(__dirname, "..", "js");

function read(file) {
  return fs.readFileSync(path.join(JS_DIR, file), "utf8");
}

// Files that have no DOM dependency.
const CORE_FILES = ["util.js", "effects.js", "score.js", "leaf.js", "flower.js"];

// Source fragment that wires a Map-backed localStorage stub into the IIFE.
// Tests reach the underlying Map (`_store`) via the returned object so they
// can clear state between cases or simulate storage exceptions.
const STORAGE_STUB = `
  const _store = new Map();
  const localStorage = {
    getItem(k) { return _store.has(k) ? _store.get(k) : null; },
    setItem(k, v) { _store.set(k, String(v)); },
    removeItem(k) { _store.delete(k); },
    clear() { _store.clear(); },
  };
`;

function loadCore() {
  const body = `
    "use strict";
    const console = { log() {}, warn() {}, error() {} };
    ${STORAGE_STUB}
    ${CORE_FILES.map(read).join("\n\n")}
    return { Score, Leaf, Flower, Effects, LocalDB, _store, localStorage };
  `;
  return new Function(body)();
}

function loadGame() {
  const stubs = `
    const pop_sound = "";
    const clear_sound = "";
    class Audio {
      constructor() {}
      play() {}
    }
  `;
  // values.js declares mode IDs (MODE_ARCADE/PUZZLE/ENDLESS); load it so the
  // tests can reference the same constants the production code uses.
  const files = ["util.js", "effects.js", "score.js", "leaf.js", "flower.js", "values.js", "daisygame.js"];
  const body = `
    "use strict";
    const console = { log() {}, warn() {}, error() {} };
    ${STORAGE_STUB}
    ${stubs}
    ${files.map(read).join("\n\n")}
    return {
      Score, Leaf, Flower, Effects, DaisyGame, LocalDB,
      MODE_ARCADE, MODE_PUZZLE, MODE_ENDLESS,
      _store, localStorage,
    };
  `;
  return new Function(body)();
}

module.exports = { loadCore, loadGame };
