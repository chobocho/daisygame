class GameEngine{
  constructor(game, db) {
    this._game = game;
    this._scoreDB = db;
  }

  increaseTick() {
    if (!this._game.isPlayState()) {
      return;
    }

    this._game.increaseTick();

    if (this._game.isGameOverState()) {
       if (this._game.needToSaveScore()) {
          printf("[GameEngine]", "SaveScore");
          this._scoreDB.setScore(this._game.highScore());
       }
       // The board is finished — drop any resume snapshot so the next launch
       // starts fresh on the mode-select screen.
       this._scoreDB.clearResume();
    }
  }

  pause() {
    this._game.pause();
    if (this._game.isPauseState()) {
      if (this._game.needToSaveScore()) {
        printf("[GameEngine]", "SaveScore");
        this._scoreDB.setScore(this._game.highScore());
      }
      this._scoreDB.setResume(this._game.serialize());
    }
  }

  start(mode) {
    // Picking a mode on idle / game-over is a fresh start — discard any
    // pending resume snapshot. Resuming from pause omits `mode`, so the
    // snapshot is preserved until the next pause overwrites it.
    if (mode !== undefined) {
      this._scoreDB.clearResume();
    }
    this._game.start(mode);
  }

  press(key) {
    if (key >= 0 && key <= 6) {
      this._game.turnFlower(key);
      this._game.resetTick();
      printf("[Flower]", this._game.getFlowers()[key].leaf);
    }
  }

  togglePlayMusic() {
    this._game.togglePlayMusic();
  }

  gotoMenu() {
    if (this._game.needToSaveScore()) {
      this._scoreDB.setScore(this._game.highScore());
    }
    this._scoreDB.clearResume();
    this._game.init();
  }

  retryPuzzleLevel() {
    const lvl = this._game.puzzleLevel();
    if (lvl > 0) {
      this._scoreDB.clearResume();
      this._game.playPuzzleLevel(lvl);
    }
  }

  nextPuzzleLevel() {
    const lvl = this._game.puzzleLevel();
    if (lvl > 0 && lvl < Puzzle.MAX_LEVEL) {
      const prog = this._game.puzzleProgress();
      const target = lvl + 1;
      if (!prog || prog.isUnlocked(target)) {
        this._scoreDB.clearResume();
        this._game.playPuzzleLevel(target);
      }
    }
  }
}
