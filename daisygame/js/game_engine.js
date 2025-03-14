class GameEngine{
  constructor(game, db) {
    this._game = game;
    this._scoreDB = db;
    this._reference_score = 20000;
    this._start_score = 19000;
  }

  increaseTick() {
    if (!this._game.isPlayState()) {
      return;
    }
    this._game.turn();
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
      printf("[Flower]", this._game.getFlowers()[key].leaf);
    }
  }
}
