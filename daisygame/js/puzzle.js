// 100-level puzzle progression. Pure config + a tiny localStorage-backed
// progress tracker. Loaded before daisygame.js / game_engine.js.

class Puzzle {
    static MAX_LEVEL = 100;
    static STORAGE_KEY = 'DaisyPuzzle';

    // Returns the deterministic config for a level (clamped to [1, 100]).
    //   flowers: 2 → 7 in steps of 17 levels
    //   colors:  4 → 7 in steps of 33 levels
    //   time:    flat 60s for every level (snappy round, predictable pacing)
    //   target:  50 * level (L1 = 50, L100 = 5000)
    static levelConfig(level) {
        const L = Math.max(1, Math.min(Puzzle.MAX_LEVEL, level | 0));
        return {
            level: L,
            flowers: Math.min(7, 2 + Math.floor((L - 1) / 17)),
            colors:  Math.min(7, 4 + Math.floor((L - 1) / 33)),
            timeSeconds: 60,
            target: 50 * L,
        };
    }

    // 0..3 stars based on score / target ratio. 0 = failed.
    static starRating(score, target) {
        if (score < target) return 0;
        if (score < target * 1.5) return 1;
        if (score < target * 2) return 2;
        return 3;
    }
}

class PuzzleProgress {
    constructor() {
        this._unlocked = 1;
        this._best = {};
        this._load();
    }

    _load() {
        let raw;
        try { raw = localStorage.getItem(Puzzle.STORAGE_KEY); }
        catch (e) { return; }
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object' || parsed.v !== 1) return;
            if (typeof parsed.unlocked === 'number') {
                this._unlocked = Math.max(1, Math.min(Puzzle.MAX_LEVEL, parsed.unlocked | 0));
            }
            if (parsed.best && typeof parsed.best === 'object') {
                for (const k of Object.keys(parsed.best)) {
                    const lv = +k;
                    const score = +parsed.best[k];
                    if (Number.isFinite(lv) && lv >= 1 && lv <= Puzzle.MAX_LEVEL && Number.isFinite(score)) {
                        this._best[lv] = score | 0;
                    }
                }
            }
        } catch (e) {
            // corrupt JSON — keep fresh defaults
        }
    }

    _persist() {
        try {
            localStorage.setItem(Puzzle.STORAGE_KEY, JSON.stringify({
                v: 1,
                unlocked: this._unlocked,
                best: this._best,
            }));
        } catch (e) {
            // best-effort
        }
    }

    unlocked() { return this._unlocked; }
    isUnlocked(level) { return level >= 1 && level <= this._unlocked; }
    bestScore(level) { return this._best[level] | 0; }
    stars(level) {
        const target = Puzzle.levelConfig(level).target;
        return Puzzle.starRating(this.bestScore(level), target);
    }

    recordResult(level, score) {
        if (level < 1 || level > Puzzle.MAX_LEVEL) return;
        const s = score | 0;
        const target = Puzzle.levelConfig(level).target;
        const cleared = s >= target;

        if (s > (this._best[level] | 0)) {
            this._best[level] = s;
        }
        if (cleared && level === this._unlocked && level < Puzzle.MAX_LEVEL) {
            this._unlocked = level + 1;
        }
        this._persist();
    }
}
