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
    }
  }

  pause() {
    this._game.pause();
    if (this._game.isPauseState()) {
      if (this._game.needToSaveScore()) {
        printf("[GameEngine]", "SaveScore");
        this._scoreDB.setScore(this._game.highScore());
      }
    }
  }

  start() {
    this._game.start();
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
}
