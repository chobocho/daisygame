function printf(tag, log) {
  console.log(tag, log);
}

class LocalDB {
  constructor() {
    this.DB_NAME = 'DaisyHighScore';
  }

  getScore() {
    let score = localStorage.getItem(this.DB_NAME);
    if (score !== null) {
      return score;
    }
    return 0;
  }

  setScore(score) {
    localStorage.setItem(this.DB_NAME, score);
  }
}
