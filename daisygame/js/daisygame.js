class DaisyGame {
    constructor(startX, startY, highscore = 0, canvas_width, canvas_height) {
        this.IDLE_STATE = 0;
        this.PLAY_STATE = 1;
        this.PAUSE_STATE = 2;
        this.GAME_OVER_STATE = 3;

        this._startX = startX;
        this._startY = startY;
        this._x = startX;
        this._y = startY;

        this._tick = 0;
        this._score = new Score(highscore);
        this._state = this.IDLE_STATE;
        this._leafMap = [
            [[0, 13], [1, 24], [2, 35], [3, 40], [4, 51], [5, 62]],
            [[12, 25], [14, 61], [13, 0]],
            [[23, 30], [24, 1], [25, 12]],
            [[34, 41], [35, 2], [30, 23]],
            [[45, 52], [40, 3], [41, 34]],
            [[50, 63], [52, 45], [51, 4]],
            [[62, 5], [61, 14], [63, 50]],
        ];
        this._flowerArr = [];
        this._pop_audio = new Audio("data:audio/mp3;base64," + pop_sound);
        this._clear_audio = new Audio("data:audio/mp3;base64," + clear_sound);
        this._addLeafTable = [0, 1, 2, 3, 4, 5, 6, 0, 1, 2, 3, 4, 5, 6];
        this._addLeafTable.sort(() => Math.random() - 0.5);
        this._addLeafIndex = 0;
        this._isPlayMusic = true;
    }

    _init_flower() {
        this._flowerArr = [];

        for (let i = 0; i < 7; i++) {
            let f = new Flower(i);
            f.set_index(i);
            this._flowerArr.push(f);
        }

        let center_x = 200;
        let center_y = 300;
        let radius = 30;

        // 중앙 꽃 설정
        this._flowerArr[0].set_pos(center_x, center_y, radius);

        // 나머지 꽃들
        for (let i = 0; i < 6; i++) {
            let angle = 60 * i;
            let radians = angle * Math.PI / 180;
            let x = center_x + Math.floor(radius * 3.5 * Math.cos(radians));
            let y = center_y + Math.floor(radius * 3.5 * Math.sin(radians));
            this._flowerArr[i + 1].set_pos(x, y, radius);
        }

        // 같은 색상 꽃잎 변경
        for (let i = 0; i < 7; i++) {
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
            this._init_flower();
        }
    }

    _isPlayable() {
        // 꽃잎 색상의 저장소
        let leaf_color = Array.from({ length: 7 }, () => new Set());

        // 모든 꽃을 순회
        for (let flower of this._flowerArr) {
            // 각 꽃에 있는 꽃잎의 개수 확인
            if (flower.leaf_count() < 6) {
                return true; // 꽃잎이 부족하면 플레이 가능
            }
            // 꽃잎의 색상을 저장
            for (let leaf of flower.leaf) {
                leaf_color[flower.index].add(leaf.color());
            }
        }

        // 이웃한 꽃들 간의 색상 비교
        for (let i = 1; i < 7; i++) {
            // 중앙 꽃 (index 0)과 나머지 꽃 비교
            for (let color of leaf_color[i]) {
                if (leaf_color[0].has(color)) {
                    return true; // 동일한 색상이 있으면 플레이 가능
                }
            }
        }

        // 인접한 두 꽃 사이 (i-1, i) 체크
        for (let i = 2; i < 7; i++) {
            for (let color of leaf_color[i]) {
                if (leaf_color[i - 1].has(color)) {
                    return true; // 동일한 색상이 있으면 플레이 가능
                }
            }
        }

        for (let color of leaf_color[1]) {
            if (leaf_color[6].has(color)) {
                return true; // 동일한 색상이 있으면 플레이 가능
            }
        }

        return false; // 모든 조건을 통과하지 못하면 플레이 불가
    }


    checkCollision(flower) {
        if (this._state !== this.PLAY_STATE) {
            return;
        }

        let removedLeaf = 0;
        for (let leaf of this._leafMap[flower]) {
            let left_flower = Math.floor(leaf[0] / 10);
            let left_flower_leaf = leaf[0] % 10;
            let right_flower = Math.floor(leaf[1] / 10);
            let right_flower_leaf = leaf[1] % 10;

            if (this._flowerArr[left_flower].leaf[left_flower_leaf].isAlive() &&
                this._flowerArr[right_flower].leaf[right_flower_leaf].isAlive() &&
                this._flowerArr[left_flower].leaf[left_flower_leaf].color() === this._flowerArr[right_flower].leaf[right_flower_leaf].color()) {
                this._flowerArr[left_flower].remove(left_flower_leaf);
                this._flowerArr[right_flower].remove(right_flower_leaf);
                removedLeaf++;
            }
        }

        const scoreTable = [0, 1, 10, 20, 50, 128, 256, 0, 0, 0, 0, 0, 0, 0];
        this.increaseScore(scoreTable[removedLeaf]);

        if (removedLeaf === 0) return;
        this._playEffectSound();
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

        if (this.isPlayMusic()) {
            if (needToPlayClearSound) {
                this._clear_audio.play();
            } else {
                this._pop_audio.play();
            }
        }
    }

    start() {
        console.log("[DaisyGame] Start()" + this._state);
        if (this._state === this.PLAY_STATE) {
            return;
        }

        if (this._state === this.PAUSE_STATE || this._state === this.IDLE_STATE) {
            this._state = this.PLAY_STATE;
        } else if (this._state === this.GAME_OVER_STATE) {
            this.init();
            this._state = this.PLAY_STATE;
        }
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

        let leaf_count = 0;
        this._flowerArr.forEach(f => {
            if (f.leaf_count() == 0) {
                for (let i = 0; i < 6; i++) {
                    f.addLeaf(this._flowerArr);
                }
            }
            leaf_count += f.leaf_count();
        });

        if (this._tick > 60 || leaf_count < 21) {
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

    }

    resetTick() {
        this._tick = 0;
    }

    _reduceLeaf() {
        this._flowerArr.forEach(f => {
            f.leaf.forEach(l => {
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
}
