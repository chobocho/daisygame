class DaisyGame {
    constructor(startX, startY, highscore = 0, canvas_width, canvas_height) {
        this.IDLE_STATE = 0;
        this.PLAY_STATE = 1;
        this.PAUSE_STATE = 2;
        this.GAME_OVER_STATE = 3;
        this.LEVEL_SELECT_STATE = 4;

        this.MODE_ARCADE = 0;
        this.MODE_PUZZLE = 1;
        this.MODE_ENDLESS = 2;
        this._mode = this.MODE_ENDLESS;
        // Tick rate is ~30ms, so 90 sec = 3000 ticks.
        this.ARCADE_TICKS = 3000;
        this._timerTicks = 0;
        this._flowerCount = 7;
        this._colorCount = 6;
        this._puzzleLevel = 0;
        this._puzzleProgress = (typeof PuzzleProgress !== 'undefined') ? new PuzzleProgress() : null;

        this._startX = startX;
        this._startY = startY;
        this._x = startX;
        this._y = startY;

        this._tick = 0;
        this._score = new Score(highscore);
        this._state = this.IDLE_STATE;
        // Static 7-flower hex adjacency. _init_flower(N) filters this down.
        this.FULL_LEAF_MAP = [
            [[0, 13], [1, 24], [2, 35], [3, 40], [4, 51], [5, 62]],
            [[12, 25], [14, 61], [13, 0]],
            [[23, 30], [24, 1], [25, 12]],
            [[34, 41], [35, 2], [30, 23]],
            [[45, 52], [40, 3], [41, 34]],
            [[50, 63], [52, 45], [51, 4]],
            [[62, 5], [61, 14], [63, 50]],
        ];
        this._leafMap = this.FULL_LEAF_MAP;
        this._flowerArr = [];
        this._pop_audio = new Audio("data:audio/mp3;base64," + pop_sound);
        this._clear_audio = new Audio("data:audio/mp3;base64," + clear_sound);
        this._addLeafTable = [0, 1, 2, 3, 4, 5, 6, 0, 1, 2, 3, 4, 5, 6];
        this._addLeafTable.sort(() => Math.random() - 0.5);
        this._addLeafIndex = 0;
        this._isPlayMusic = true;
    }

    _init_flower() {
        const N = Math.max(2, Math.min(7, this._flowerCount | 0 || 7));
        const C = Math.max(1, Math.min(7, this._colorCount | 0 || 6));
        this._flowerCount = N;
        this._colorCount = C;

        this._flowerArr = [];
        for (let i = 0; i < N; i++) {
            let f = new Flower(i, C);
            f.set_index(i);
            this._flowerArr.push(f);
        }

        let center_x = 200;
        let center_y = 300;
        let radius = 30;
        // Same hex slots as the original 7-flower layout; for N < 7 we just
        // populate the first N slots (center + first N-1 ring positions).
        if (N >= 1) this._flowerArr[0].set_pos(center_x, center_y, radius);
        for (let i = 1; i < N; i++) {
            let angle = 60 * (i - 1);
            let radians = angle * Math.PI / 180;
            let x = center_x + Math.floor(radius * 3.5 * Math.cos(radians));
            let y = center_y + Math.floor(radius * 3.5 * Math.sin(radians));
            this._flowerArr[i].set_pos(x, y, radius);
        }

        // Subset of FULL_LEAF_MAP with both endpoints below N.
        this._leafMap = [];
        for (let i = 0; i < N; i++) {
            this._leafMap[i] = this.FULL_LEAF_MAP[i].filter(([a, b]) =>
                Math.floor(a / 10) < N && Math.floor(b / 10) < N);
        }

        // Direction distribution: at least 2 CW + 2 CCW for N >= 4, else random.
        let dirs;
        if (N >= 4) {
            dirs = [1, 1, -1, -1];
            for (let i = 0; i < N - 4; i++) dirs.push(Math.random() < 0.5 ? 1 : -1);
        } else {
            dirs = [];
            for (let i = 0; i < N; i++) dirs.push(Math.random() < 0.5 ? 1 : -1);
        }
        dirs.sort(() => Math.random() - 0.5);
        for (let i = 0; i < N; i++) {
            this._flowerArr[i].set_direction(dirs[i]);
        }

        // 같은 색상 꽃잎 변경
        for (let i = 0; i < N; i++) {
            for (let leaf of this._leafMap[i]) {
                let left_flower = Math.floor(leaf[0] / 10);
                let left_leaf = leaf[0] % 10;
                let right_flower = Math.floor(leaf[1] / 10);
                let right_leaf = leaf[1] % 10;

                if (this._flowerArr[left_flower].leaf[left_leaf].color() === this._flowerArr[right_flower].leaf[right_leaf].color()) {
                    let maxCount = 100;
                    do {
                        this._flowerArr[left_flower].leaf[left_leaf].reset();
                        maxCount--;
                    } while (maxCount > 0 && this._flowerArr[left_flower].leaf[left_leaf].color() === this._flowerArr[right_flower].leaf[right_leaf].color());
                    printf("[DaisyGame]", "Changed Color: " + maxCount);
                }
            }
        }

        // Rebuild addLeafTable to match active flower count.
        this._addLeafTable = [];
        for (let i = 0; i < N; i++) this._addLeafTable.push(i, i);
        this._addLeafTable.sort(() => Math.random() - 0.5);
        this._addLeafIndex = 0;

        // Play the birth animation on every initial leaf so the level
        // starts with daisies blooming in instead of popping in fully grown.
        this._flowerArr.forEach(f => {
            f.leaf.forEach(l => l.playBirth());
        });
    }

    getFlowers() {
        return this._flowerArr;
    }

    init() {
        this._tick = 0;
        this._x = this._startX;
        this._y = this._startY;

        this._init_flower();
        this._score.init();
        this._state = this.IDLE_STATE;
        if (typeof Effects !== 'undefined') Effects.reset();
    }

    isPlayMusic() {
        return this._isPlayMusic;
    }

    togglePlayMusic() {
        this._isPlayMusic = !this._isPlayMusic;
    }

    turnFlower(flower) {
        if (this._state !== this.PLAY_STATE) {
            return;
        }
        this._flowerArr[flower].turn();
        this.checkCollision(flower);
        if (!this._isPlayable()) {
            // Re-seed the board in every mode. Puzzle ends only when the
            // per-level timer hits 0, not when a momentary deadlock occurs.
            this._init_flower();
        }
    }

    _isPlayable() {
        const N = this._flowerArr.length;
        const leaf_color = Array.from({ length: N }, () => new Set());

        for (let flower of this._flowerArr) {
            if (flower.leaf_count() < 6) {
                return true;
            }
            for (let leaf of flower.leaf) {
                leaf_color[flower.index].add(leaf.color());
            }
        }

        // Derive flower-pair adjacency from the active leaf map and check
        // for shared colors. Works for any N because _leafMap is already
        // filtered to active flowers in _init_flower.
        const seen = new Set();
        for (const pairs of this._leafMap) {
            for (const [a, b] of pairs) {
                const fa = Math.floor(a / 10);
                const fb = Math.floor(b / 10);
                if (fa === fb) continue;
                const key = fa < fb ? (fa * 10 + fb) : (fb * 10 + fa);
                if (seen.has(key)) continue;
                seen.add(key);
                for (const c of leaf_color[fa]) {
                    if (leaf_color[fb].has(c)) return true;
                }
            }
        }
        return false;
    }


    checkCollision(flower) {
        if (this._state !== this.PLAY_STATE) {
            return;
        }

        let removedLeaf = 0;
        const matches = [];
        for (let leaf of this._leafMap[flower]) {
            let left_flower = Math.floor(leaf[0] / 10);
            let left_flower_leaf = leaf[0] % 10;
            let right_flower = Math.floor(leaf[1] / 10);
            let right_flower_leaf = leaf[1] % 10;

            if (this._flowerArr[left_flower].leaf[left_flower_leaf].isAlive() &&
                this._flowerArr[right_flower].leaf[right_flower_leaf].isAlive() &&
                this._flowerArr[left_flower].leaf[left_flower_leaf].color() === this._flowerArr[right_flower].leaf[right_flower_leaf].color()) {
                const colorIdx = this._flowerArr[left_flower].leaf[left_flower_leaf].color();
                const lp = this._leafScreenPos(left_flower, left_flower_leaf);
                const rp = this._leafScreenPos(right_flower, right_flower_leaf);
                this._flowerArr[left_flower].remove(left_flower_leaf);
                this._flowerArr[right_flower].remove(right_flower_leaf);
                removedLeaf++;
                matches.push({ x: (lp.x + rp.x) / 2, y: (lp.y + rp.y) / 2, colorIdx });
            }
        }

        // Per-turn score by simultaneous-pair count. Index 1 is intentionally
        // generous (5, not 1) so the puzzle target stays reachable in the
        // shorter time budgets at higher levels.
        const scoreTable = [0, 5, 10, 20, 50, 128, 256, 0, 0, 0, 0, 0, 0, 0];
        const gained = scoreTable[removedLeaf];
        this.increaseScore(gained);

        if (removedLeaf === 0) return;

        if (typeof Effects !== 'undefined') {
            const turnFlower = this._flowerArr[flower];
            Effects.popScore(turnFlower.x, turnFlower.y - turnFlower.radius - 12, gained);
            for (const m of matches) {
                Effects.burst(m.x, m.y, Effects.colorFor(m.colorIdx));
            }
        }

        this._playEffectSound();
    }

    _leafScreenPos(flowerIdx, leafIdx) {
        const f = this._flowerArr[flowerIdx];
        const radians = (60 * leafIdx) * Math.PI / 180;
        const dist = f.radius + f.small_radius();
        return { x: f.x + Math.cos(radians) * dist, y: f.y + Math.sin(radians) * dist };
    }

    _playEffectSound() {
        let needToPlayClearSound = false;
        const scoreTable = [0, 100, 256, 512, 600, 800, 1024, 1216, 0, 0, 0, 0, 0, 0];
        let count = 0;
        for (let leaf of this._flowerArr){
            if (leaf.leaf_count() === 0) {
                count++;
                needToPlayClearSound = true;
            }
        }

        this.increaseScore(scoreTable[count]);

        if (count >= 1 && typeof Effects !== 'undefined') {
            if (count >= 2) {
                Effects.callout("Flower Power!", "power");
            } else {
                Effects.callout("Daisy Chain!", "chain");
            }
        }

        if (this.isPlayMusic()) {
            if (needToPlayClearSound) {
                this._clear_audio.play();
            } else {
                this._pop_audio.play();
            }
        }
    }

    start(mode) {
        console.log("[DaisyGame] Start()" + this._state + " mode=" + mode);
        if (this._state === this.PLAY_STATE) {
            return;
        }

        // Resuming from pause keeps the active mode and remaining timer.
        if (this._state === this.PAUSE_STATE) {
            this._state = this.PLAY_STATE;
            return;
        }

        if (this._state === this.GAME_OVER_STATE) {
            this.init();
        }

        if (mode !== undefined) {
            this._mode = mode;
        }

        // Puzzle mode opens the level-select screen instead of starting play.
        // The level-select UI then calls playPuzzleLevel(L) to begin a level.
        if (this._mode === this.MODE_PUZZLE) {
            if (this._puzzleProgress) {
                this._puzzleLevel = this._puzzleProgress.unlocked();
            } else {
                this._puzzleLevel = 1;
            }
            this._state = this.LEVEL_SELECT_STATE;
            return;
        }

        this._timerTicks = (this._mode === this.MODE_ARCADE) ? this.ARCADE_TICKS : 0;
        this._flowerCount = 7;
        this._colorCount = 6;
        // Reinit flowers for non-puzzle modes so a previous puzzle session
        // doesn't leave a 2-flower board behind.
        this._init_flower();
        this._state = this.PLAY_STATE;
    }

    playPuzzleLevel(level) {
        const cfg = Puzzle.levelConfig(level);
        this._mode = this.MODE_PUZZLE;
        this._puzzleLevel = cfg.level;
        this._flowerCount = cfg.flowers;
        this._colorCount = cfg.colors;
        this._timerTicks = Math.round(cfg.timeSeconds * 1000 / 30);
        this._tick = 0;
        this._init_flower();
        this._score.init();
        this._state = this.PLAY_STATE;
        if (typeof Effects !== 'undefined') Effects.reset();
    }

    levelSelectPrev() {
        if (this._state !== this.LEVEL_SELECT_STATE) return;
        if (this._puzzleLevel > 1) this._puzzleLevel--;
    }

    levelSelectNext() {
        if (this._state !== this.LEVEL_SELECT_STATE) return;
        if (!this._puzzleProgress) return;
        if (this._puzzleLevel < this._puzzleProgress.unlocked()) {
            this._puzzleLevel++;
        }
    }

    levelSelectPlay() {
        if (this._state !== this.LEVEL_SELECT_STATE) return;
        if (!this._puzzleProgress || this._puzzleProgress.isUnlocked(this._puzzleLevel)) {
            this.playPuzzleLevel(this._puzzleLevel);
        }
    }

    mode() {
        return this._mode;
    }

    puzzleLevel() {
        return (this._mode === this.MODE_PUZZLE) ? this._puzzleLevel : 0;
    }

    puzzleProgress() {
        return this._puzzleProgress;
    }

    isLevelSelectState() {
        return this._state === this.LEVEL_SELECT_STATE;
    }

    timerSeconds() {
        if (this._mode === this.MODE_ARCADE) {
            return Math.max(0, Math.ceil(this._timerTicks * 30 / 1000));
        }
        if (this._mode === this.MODE_PUZZLE && this.isPlayState()) {
            return Math.max(0, Math.ceil(this._timerTicks * 30 / 1000));
        }
        return 0;
    }

    pause() {
        if (this._state !== this.PLAY_STATE) {
            return;
        }
        console.log("Pause");
        this._state = this.PAUSE_STATE;
    }

    score() {
        //printf("[FloppyBird]", this._score.score());
        return this._score.score();
    }

    increaseScore(score) {
        this._score.increase(score);
    }

    highScore() {
        return this._score.highScore();
    }

    increaseTick() {
        if (!this.isPlayState()) {
            return;
        }
        this._tick++;
        this._reduceLeaf();

        // Leaf refill + cadenced new leaves + monochrome bonus run in every
        // mode (including puzzle, which would otherwise dry up before the
        // player could reach the target). Puzzle ends purely by timer.
        let leaf_count = 0;
        // Cap per-tick refill at 21 (3.5 flowers' worth) so puzzle levels
        // with N >= 4 don't exceed the board's headroom every frame.
        const refillThreshold = Math.min(21, this._flowerArr.length * 3);
        this._flowerArr.forEach(f => {
            if (f.leaf_count() == 0) {
                for (let i = 0; i < 6; i++) {
                    f.addLeaf(this._flowerArr);
                }
            }
            leaf_count += f.leaf_count();
        });

        if (this._tick > 60 || leaf_count < refillThreshold) {
            this._tick = 0;
            this._addLeaf();
        }

        this._flowerArr.forEach(f => {
            if (f.leaf_count() == 6) {
                let count = 0;
                for (let i = 1; i < 6; i++) {
                    count += f.leaf[i].color() === f.leaf[0].color() ? 1 : 0;
                }
                if (count == 5) {
                    for (let i = 1; i < 6; i++) {
                        f.remove(i);
                        f.addLeaf(this._flowerArr);
                    }
                    this.increaseScore(88);
                }
            }
        });

        // Arcade / Puzzle countdown: zero ticks -> game over.
        if (this._mode === this.MODE_ARCADE || this._mode === this.MODE_PUZZLE) {
            this._timerTicks--;
            if (this._timerTicks <= 0) {
                this._timerTicks = 0;
                this._enterGameOver();
            }
        }
    }

    _enterGameOver() {
        if (this._mode === this.MODE_PUZZLE && this._puzzleProgress && this._puzzleLevel > 0) {
            this._puzzleProgress.recordResult(this._puzzleLevel, this._score.score());
        }
        this._state = this.GAME_OVER_STATE;
    }

    resetTick() {
        this._tick = 0;
    }

    _reduceLeaf() {
        this._flowerArr.forEach(f => {
            f.leaf.forEach(l => {
                l.advanceBirth();
                if (!l.isAlive()) {
                    l.reduceSize();
                }
            });
        });
    }

    _addLeaf() {
        if (this._state !== this.PLAY_STATE) {
            return;
        }
        const flower = this._addLeafTable[this._addLeafIndex];
        this._addLeafIndex = (this._addLeafIndex + 1) % this._addLeafTable.length;
        this._flowerArr[flower].addLeaf(this._flowerArr);
    }

    x() {
        return this._x;
    }

    y() {
        return this._y;
    }

    state() {
        return this._state;
    }

    isIdleState() {
        return this._state === this.IDLE_STATE;
    }

    isPlayState() {
        return this._state === this.PLAY_STATE;
    }

    isPauseState() {
        return this._state === this.PAUSE_STATE;
    }

    isGameOverState() {
        return this._state === this.GAME_OVER_STATE;
    }

    needToSaveScore() {
        return this._score.needToSave();
    }

    serialize() {
        return {
            v: 1,
            mode: this._mode,
            tick: this._tick,
            timerTicks: this._timerTicks,
            puzzleLevel: this._puzzleLevel,
            flowerCount: this._flowerCount,
            colorCount: this._colorCount,
            addLeafIndex: this._addLeafIndex,
            addLeafTable: this._addLeafTable.slice(),
            score: this._score.serialize(),
            flowers: this._flowerArr.map(f => f.serialize()),
        };
    }

    restore(d) {
        if (!d || typeof d !== 'object') return false;
        if (d.v !== 1) return false;
        if (typeof d.mode !== 'number') return false;
        if (!Array.isArray(d.flowers) || d.flowers.length < 1 || d.flowers.length > 7) return false;

        const N = d.flowers.length;
        const C = (typeof d.colorCount === 'number') ? Math.max(1, Math.min(7, d.colorCount | 0)) : 6;

        this._mode = d.mode;
        this._tick = (typeof d.tick === 'number') ? d.tick : 0;
        this._timerTicks = (typeof d.timerTicks === 'number') ? d.timerTicks : 0;
        this._puzzleLevel = (typeof d.puzzleLevel === 'number') ? d.puzzleLevel : 0;
        this._flowerCount = (typeof d.flowerCount === 'number') ? d.flowerCount : N;
        this._colorCount = C;
        this._addLeafIndex = (typeof d.addLeafIndex === 'number') ? d.addLeafIndex : 0;
        if (Array.isArray(d.addLeafTable) && d.addLeafTable.length > 0) {
            this._addLeafTable = d.addLeafTable.slice();
        }
        if (d.score) this._score.restore(d.score);

        // Rebuild flower array to match the saved size, then restore each.
        this._flowerArr = [];
        for (let i = 0; i < N; i++) {
            const f = new Flower(i, C);
            f.set_index(i);
            this._flowerArr.push(f);
        }
        for (let i = 0; i < N; i++) {
            this._flowerArr[i].restore(d.flowers[i]);
            this._flowerArr[i].set_index(i);
        }

        // Rebuild active leafMap subset from FULL_LEAF_MAP.
        this._leafMap = [];
        for (let i = 0; i < N; i++) {
            this._leafMap[i] = this.FULL_LEAF_MAP[i].filter(([a, b]) =>
                Math.floor(a / 10) < N && Math.floor(b / 10) < N);
        }

        // Always come back paused so the player explicitly resumes.
        this._state = this.PAUSE_STATE;
        return true;
    }
}
