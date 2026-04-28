class Score {
  constructor(highScore=0) {
    this._score = 0;
    this._highScore = highScore;
    this._prev_high_score = highScore;
  }

  init() {
    this._highScore = this._highScore > this._score ? this._highScore : this._score;
    this._score = 0;
  }

  score() {
    return this._score;
  }

  highScore() {
    return this._highScore;
  }

  increase(additional_score) {
    this._score += additional_score;
    this._updateHighScore();
  }

  _updateHighScore() {
    this._highScore = this._highScore > this._score ? this._highScore : this._score;
  }

  needToSave() {
    return this._prev_high_score < this._highScore;
  }

  serialize() {
    return {
      score: this._score,
      high: this._highScore,
      prevHigh: this._prev_high_score,
    };
  }

  restore(d) {
    if (!d || typeof d !== 'object') return false;
    if (typeof d.score !== 'number' || typeof d.high !== 'number') return false;
    this._score = d.score;
    this._highScore = d.high;
    this._prev_high_score = typeof d.prevHigh === 'number' ? d.prevHigh : d.high;
    return true;
  }
}
