function printf(tag, log) {
  console.log(tag, log);
}

class LocalDB {
  constructor() {
    this.DB_NAME = 'DaisyHighScore';
    this.RESUME_KEY = 'DaisyResume';
    this.RESUME_SCHEMA_VERSION = 1;
  }

  getScore() {
    try {
      let score = localStorage.getItem(this.DB_NAME);
      if (score !== null) {
        return score;
      }
    } catch (e) {
      // localStorage unavailable (e.g. Safari private mode); fall through.
    }
    return 0;
  }

  setScore(score) {
    try {
      localStorage.setItem(this.DB_NAME, score);
    } catch (e) {
      // Quota exceeded or storage disabled — high score persistence is best-effort.
    }
  }

  getResume() {
    let raw;
    try {
      raw = localStorage.getItem(this.RESUME_KEY);
    } catch (e) {
      return null;
    }
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  setResume(snapshot) {
    try {
      localStorage.setItem(this.RESUME_KEY, JSON.stringify(snapshot));
    } catch (e) {
      // Quota / storage disabled — resume save is best-effort.
    }
  }

  clearResume() {
    try {
      localStorage.removeItem(this.RESUME_KEY);
    } catch (e) {
      // ignore
    }
  }
}
