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
        // Rainbow leaf cooldown (ticks). 30ms tick rate, so 270..333 ≈ 8..10s.
        this.RAINBOW_MIN_TICKS = 270;
        this.RAINBOW_MAX_TICKS = 333;
        this._rainbowCooldown = this._nextRainbowInterval();

        // Golden leaf event: every ~8s a 9-point wildcard petal appears at a
        // _leafMap boundary slot for 2..5s. If no empty boundary slot exists
        // we transform an alive non-special leaf and revert it on expire.
        // Last GOLDEN_DYING_TICKS frames render the grow-and-fade animation.
        this.GOLDEN_INTERVAL_TICKS = 267; // ≈ 8s
        this.GOLDEN_LIFE_MIN_TICKS = 67;  // ≈ 2s
        this.GOLDEN_LIFE_MAX_TICKS = 167; // ≈ 5s
        this.GOLDEN_DYING_TICKS = 12;     // ≈ 360ms grow+fade tail
        this._goldenCooldown = this.GOLDEN_INTERVAL_TICKS;
        this._activeGolden = null;

        // Puzzle-mode chain combo: each match within COMBO_WINDOW_TICKS of
        // the previous one compounds a 1.2x multiplier on the per-pair score.
        // Flower-clear and monochrome bonuses stay unscaled — this is meant
        // to reward fast, sustained play, not turn lucky chains into runaway
        // jackpots.
        this.COMBO_WINDOW_TICKS = 33;     // ≈ 1s at 30ms/tick
        this.COMBO_STEP = 1.2;
        this._comboMultiplier = 1.0;
        this._comboCooldown = 0;

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
        this._goldenCooldown = this.GOLDEN_INTERVAL_TICKS;
        this._activeGolden = null;
        this._comboMultiplier = 1.0;
        this._comboCooldown = 0;
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
            if (this._mode === this.MODE_PUZZLE) {
                // Puzzle stays alive: just repopulate empty slots so a stuck
                // turn turns into matchable colors within ~1s (instant fill +
                // 8-tick birth animation = ≈240ms).
                this._fillEmptySlots();
            } else {
                this._init_flower();
            }
        }
    }

    _fillEmptySlots() {
        this._flowerArr.forEach(f => {
            for (let i = 0; i < 6; i++) {
                if (f.leaf[i].color() === 0) {
                    f.leaf[i].reset();
                    f.leaf[i].playBirth();
                    f._leaf_count = Math.min(6, f._leaf_count + 1);
                }
            }
        });
    }

    _isPlayable() {
        // A rainbow / golden leaf is a wildcard, so the board is playable
        // as long as either one is on the field.
        if (this._hasRainbow() || this._hasGolden()) return true;

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

        // Per-pair score = 2 (base) + color bonus 1..7. Rainbow pairs
        // award a flat 8; gold pairs award a flat 9. Rainbow is a wildcard
        // for any color; gold is narrower — it only matches gold or rainbow.
        const COLOR_BONUS = [0, 1, 2, 3, 4, 5, 6, 7];
        const RAINBOW_PAIR_SCORE = 8;
        const GOLDEN_PAIR_SCORE = 9;

        let removedLeaf = 0;
        let gained = 0;
        const matches = [];
        for (let leaf of this._leafMap[flower]) {
            let left_flower = Math.floor(leaf[0] / 10);
            let left_flower_leaf = leaf[0] % 10;
            let right_flower = Math.floor(leaf[1] / 10);
            let right_flower_leaf = leaf[1] % 10;

            const ll = this._flowerArr[left_flower].leaf[left_flower_leaf];
            const rl = this._flowerArr[right_flower].leaf[right_flower_leaf];

            const llIsGold = ll.isGolden();
            const rlIsGold = rl.isGolden();
            const llIsRainbow = ll.isRainbow();
            const rlIsRainbow = rl.isRainbow();

            let colorMatch;
            if (llIsGold || rlIsGold) {
                // Gold only matches another gold or a rainbow.
                colorMatch = (llIsGold || llIsRainbow) && (rlIsGold || rlIsRainbow);
            } else {
                // Same color, or rainbow as a generic wildcard.
                colorMatch = (ll.color() === rl.color()) || llIsRainbow || rlIsRainbow;
            }

            if (ll.isAlive() && rl.isAlive() && colorMatch) {
                const isGoldPair = llIsGold || rlIsGold;
                const isRainbow = !isGoldPair && (llIsRainbow || rlIsRainbow);
                const baseColor = (llIsRainbow || llIsGold) ? rl.color() : ll.color();
                gained += isGoldPair ? GOLDEN_PAIR_SCORE
                    : (isRainbow ? RAINBOW_PAIR_SCORE : (2 + (COLOR_BONUS[baseColor] || 0)));

                const lp = this._leafScreenPos(left_flower, left_flower_leaf);
                const rp = this._leafScreenPos(right_flower, right_flower_leaf);
                this._flowerArr[left_flower].remove(left_flower_leaf);
                this._flowerArr[right_flower].remove(right_flower_leaf);
                removedLeaf++;

                // Matched gold: the leaves are consumed — drop their snapshot
                // so a pending expire can't revert them, and end the event.
                if (llIsGold) ll.clearGoldenState();
                if (rlIsGold) rl.clearGoldenState();
                if (isGoldPair) this._activeGolden = null;

                matches.push({ x: (lp.x + rp.x) / 2, y: (lp.y + rp.y) / 2, colorIdx: baseColor });
            }
        }

        // Puzzle-mode chain combo. Each match within the 1s window compounds
        // a 1.2x multiplier on `gained`. We update the multiplier first so
        // its post-bump value is what scales THIS match (1st = 1.0x, 2nd =
        // 1.2x, 3rd = 1.44x, ...).
        let multiplier = 1.0;
        if (this._mode === this.MODE_PUZZLE && gained > 0) {
            if (this._comboCooldown > 0) {
                this._comboMultiplier *= this.COMBO_STEP;
            } else {
                this._comboMultiplier = 1.0;
            }
            multiplier = this._comboMultiplier;
            this._comboCooldown = this.COMBO_WINDOW_TICKS;
        }
        const scaledGained = (multiplier > 1.0) ? Math.floor(gained * multiplier) : gained;
        this.increaseScore(scaledGained);

        if (removedLeaf === 0) return;

        if (typeof Effects !== 'undefined') {
            const turnFlower = this._flowerArr[flower];
            const popColor = (multiplier > 1.0) ? "#E25E2A" : "#3a2a18";
            Effects.popScore(turnFlower.x, turnFlower.y - turnFlower.radius - 12, scaledGained, popColor);
            if (multiplier > 1.0) {
                // One decimal place is enough to read; clamp absurd values.
                const text = "x" + (multiplier >= 10 ? Math.round(multiplier) : multiplier.toFixed(2));
                Effects.callout(text, "combo");
            }
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
        this._goldenCooldown = this.GOLDEN_INTERVAL_TICKS;
        this._activeGolden = null;
        this._comboMultiplier = 1.0;
        this._comboCooldown = 0;
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

    selectAndPlayLevel(level) {
        // Direct grid tap. Unlocked levels start immediately; locked taps
        // are silently ignored so a misclick on a future level does nothing.
        if (this._state !== this.LEVEL_SELECT_STATE) return;
        if (this._puzzleProgress && !this._puzzleProgress.isUnlocked(level)) return;
        this._puzzleLevel = level;
        this.playPuzzleLevel(level);
    }

    exitToLevelSelect() {
        // Bail out of an in-progress (or paused) puzzle round and return to
        // the level grid. Score and timer reset; mode stays MODE_PUZZLE so
        // the grid renders. Caller (GameEngine.gotoLevelSelect) clears the
        // resume slot since the round is abandoned.
        this.init();
        this._mode = this.MODE_PUZZLE;
        if (this._puzzleProgress) {
            this._puzzleLevel = this._puzzleProgress.unlocked();
        } else {
            this._puzzleLevel = 1;
        }
        this._state = this.LEVEL_SELECT_STATE;
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

    // Same as timerSeconds() but fractional — used by the puzzle petal-stack
    // timer to drive a smooth fall animation between integer-second steps.
    timerSecondsFloat() {
        if (this._mode === this.MODE_ARCADE) {
            return Math.max(0, this._timerTicks * 30 / 1000);
        }
        if (this._mode === this.MODE_PUZZLE && this.isPlayState()) {
            return Math.max(0, this._timerTicks * 30 / 1000);
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

        // Rainbow leaf cooldown: every 8–10s, or any time the board is
        // truly stuck and has no rainbow yet, drop one into an empty slot.
        this._rainbowCooldown--;
        const stuck = !this._hasRainbow() && !this._isPlayable();
        if (this._rainbowCooldown <= 0 || stuck) {
            this._trySpawnRainbow();
            this._rainbowCooldown = this._nextRainbowInterval();
        }

        // Golden leaf event: spawn one ~every 8s, then count down its
        // 2..5s lifetime. Expire reverts a transformed leaf or clears a
        // filled empty slot.
        this._goldenCooldown--;
        if (this._goldenCooldown <= 0 && this._activeGolden === null) {
            this._trySpawnGolden();
            this._goldenCooldown = this.GOLDEN_INTERVAL_TICKS;
        }
        if (this._activeGolden !== null) {
            this._activeGolden.ticksLeft--;
            if (this._activeGolden.ticksLeft <= 0) {
                this._expireGolden();
            }
        }

        // Combo cooldown — when it lapses, the chain breaks and the next
        // match will start fresh at 1.0x.
        if (this._comboCooldown > 0) {
            this._comboCooldown--;
            if (this._comboCooldown === 0) {
                this._comboMultiplier = 1.0;
            }
        }

        // Arcade / Puzzle countdown: zero ticks -> game over.
        if (this._mode === this.MODE_ARCADE || this._mode === this.MODE_PUZZLE) {
            this._timerTicks--;
            if (this._timerTicks <= 0) {
                this._timerTicks = 0;
                this._enterGameOver();
            }
        }
    }

    _nextRainbowInterval() {
        return this.RAINBOW_MIN_TICKS +
            Math.floor(Math.random() * (this.RAINBOW_MAX_TICKS - this.RAINBOW_MIN_TICKS + 1));
    }

    _hasRainbow() {
        for (const f of this._flowerArr) {
            for (const l of f.leaf) {
                if (l.isRainbow()) return true;
            }
        }
        return false;
    }

    _trySpawnRainbow() {
        const candidates = [];
        for (const f of this._flowerArr) {
            for (let i = 0; i < 6; i++) {
                if (f.leaf[i].color() === 0) {
                    candidates.push({ flower: f, idx: i });
                }
            }
        }
        if (candidates.length === 0) return false;
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        pick.flower.leaf[pick.idx].setRainbow();
        pick.flower.leaf[pick.idx].playBirth();
        pick.flower._leaf_count = Math.min(6, pick.flower._leaf_count + 1);
        return true;
    }

    // ---------- Golden leaf event ----------

    _hasGolden() {
        for (const f of this._flowerArr) {
            for (const l of f.leaf) {
                if (l.isGolden()) return true;
            }
        }
        return false;
    }

    _nextGoldenLifeTicks() {
        return this.GOLDEN_LIFE_MIN_TICKS +
            Math.floor(Math.random() * (this.GOLDEN_LIFE_MAX_TICKS - this.GOLDEN_LIFE_MIN_TICKS + 1));
    }

    // Spawn a gold pair across two facing flowers. Each `_leafMap` pair
    // [a, b] is a candidate; place gold at both endpoints so the two
    // gold leaves can match each other (gold-only-matches-gold-or-rainbow).
    // Both endpoints must be empty, or alive non-special leaves we can
    // safely transform-and-revert.
    _trySpawnGolden() {
        if (this._activeGolden !== null) return false;

        const candidates = [];
        const seen = new Set();
        for (const flower_pairs of this._leafMap) {
            for (const [aCode, bCode] of flower_pairs) {
                const key = aCode < bCode ? (aCode + '-' + bCode) : (bCode + '-' + aCode);
                if (seen.has(key)) continue;
                seen.add(key);

                const fa = Math.floor(aCode / 10);
                const ia = aCode % 10;
                const fb = Math.floor(bCode / 10);
                const ib = bCode % 10;
                if (fa >= this._flowerArr.length || fb >= this._flowerArr.length) continue;

                const lA = this._flowerArr[fa].leaf[ia];
                const lB = this._flowerArr[fb].leaf[ib];
                if (lA.isRainbow() || lA.isGolden()) continue;
                if (lB.isRainbow() || lB.isGolden()) continue;
                // Skip mid-death leaves (color !== 0 yet life decaying) to
                // avoid stomping on the regular shrink animation.
                const aOK = lA.color() === 0 || lA.isAlive();
                const bOK = lB.color() === 0 || lB.isAlive();
                if (!aOK || !bOK) continue;

                candidates.push({
                    slotA: { flower: fa, idx: ia },
                    slotB: { flower: fb, idx: ib },
                    emptyCount: (lA.color() === 0 ? 1 : 0) + (lB.color() === 0 ? 1 : 0),
                });
            }
        }

        if (candidates.length === 0) return false;

        // Prefer pairs where more sides are already empty so we minimise the
        // need to transform and later revert.
        candidates.sort((x, y) => y.emptyCount - x.emptyCount);
        const topEmpty = candidates[0].emptyCount;
        const top = candidates.filter(c => c.emptyCount === topEmpty);
        const pick = top[Math.floor(Math.random() * top.length)];

        for (const s of [pick.slotA, pick.slotB]) {
            const f = this._flowerArr[s.flower];
            const l = f.leaf[s.idx];
            const wasEmpty = l.color() === 0;
            const snapshot = wasEmpty ? null : {
                color: l._color,
                life: l._life,
                birth: l._birth,
            };
            l.setGolden(snapshot);
            if (wasEmpty) {
                l.playBirth();
                f._leaf_count = Math.min(6, f._leaf_count + 1);
            }
        }

        this._activeGolden = { ticksLeft: this._nextGoldenLifeTicks() };
        return true;
    }

    // Expire = revert every still-gold leaf on the board. Each leaf carries
    // its own snapshot, so rotations during the event don't matter.
    _expireGolden() {
        if (!this._activeGolden) return;
        for (const f of this._flowerArr) {
            for (const l of f.leaf) {
                if (l.isGolden()) {
                    const becameEmpty = l.revertFromGolden();
                    if (becameEmpty) f._leaf_count = Math.max(0, f._leaf_count - 1);
                }
            }
        }
        this._activeGolden = null;
    }

    activeGolden() {
        if (!this._activeGolden) return null;
        return {
            ticksLeft: this._activeGolden.ticksLeft,
            dyingTicks: this.GOLDEN_DYING_TICKS,
        };
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
        // Resolve any in-flight gold event so the snapshot doesn't capture
        // half a transient state. Resume will simply not see it.
        if (this._activeGolden) this._expireGolden();
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

        // Resume starts with no gold event in flight; the cooldown re-arms
        // and the next 8s window will spawn a fresh pair.
        this._goldenCooldown = this.GOLDEN_INTERVAL_TICKS;
        this._activeGolden = null;
        this._comboMultiplier = 1.0;
        this._comboCooldown = 0;

        // Always come back paused so the player explicitly resumes.
        this._state = this.PAUSE_STATE;
        return true;
    }
}
