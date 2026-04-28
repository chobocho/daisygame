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

function loadCore() {
  const body = `
    "use strict";
    const console = { log() {}, warn() {}, error() {} };
    ${CORE_FILES.map(read).join("\n\n")}
    return { Score, Leaf, Flower, Effects, LocalDB };
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
  const files = [...CORE_FILES, "daisygame.js"];
  const body = `
    "use strict";
    const console = { log() {}, warn() {}, error() {} };
    ${stubs}
    ${files.map(read).join("\n\n")}
    return { Score, Leaf, Flower, Effects, DaisyGame };
  `;
  return new Function(body)();
}

module.exports = { loadCore, loadGame };
