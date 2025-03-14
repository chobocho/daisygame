class DaisyGame {
    constructor(startX, startY, highscore=0, canvas_width, canvas_height) {
        this.IDLE_STATE = 0;
        this.PLAY_STATE = 1;
        this.PAUSE_STATE = 2;
        this.GAME_OVER_STATE = 3;

        this._startX = startX;
        this._startY = startY;
        this._x = startX;
        this._y = startY;
        this._canvas_width = canvas_width;
        this._canvas_height = canvas_height;

        this._level = 1;
        this._tick = 0;
        this._score = new Score(highscore);
        this._state = this.IDLE_STATE;
        this._isTurning = false;
        this._leafMap = [
            [0, 13], [1, 24], [2, 35], [3, 40], [4, 51], [5, 62],
            [12, 25], [14, 61],
            [23, 30],
            [34, 41],
            [45, 52],
            [50, 63]
        ];
        this._flowerArr = [];
    }

    _init_flower() {
        for (let i = 0; i < 7; i++) {
            let f = new Flower();
            f.set_index(i);
            this._flowerArr.push(f);
        }

        let center_x = 200;
        let center_y = 300;
        let radius = 35;

        // 중앙 꽃 설정
        this._flowerArr[0].set_pos(center_x, center_y, radius);

        // 나머지 꽃들: 60도 간격으로 배치
        for (let i = 0; i < 6; i++) {
            let angle = 60 * i;
            let radians = angle * Math.PI / 180;
            let x = center_x + Math.floor(radius * 3.5 * Math.cos(radians));
            let y = center_y + Math.floor(radius * 3.5 * Math.sin(radians));
            this._flowerArr[i + 1].set_pos(x, y, radius);
        }
    }

    getFlowers() {
        return this._flowerArr;
    }

    init() {
        this._level = 1;
        this._tick = 0;
        this._x = this._startX;
        this._y = this._startY;

        this._init_flower();
        this._score.init();
        this._state = this.IDLE_STATE;
        this._isTurning = false;
    }

    turnFlower(flower) {
        if (this._state !== this.PLAY_STATE) {
            return;
        }
        this._flowerArr[flower].turn();
        this.checkCollision()
    }

    isTurning() {
        if (this._state !== this.PLAY_STATE) return false;
        return this._isTurning;
    }

    // For the animation of Bird
    turn() {
        if (this._state !== this.PLAY_STATE) {
            return;
        }
    }

    checkCollision() {
        if (this._state !== this.PLAY_STATE) {
            return;
        }

        for (let leaf of this._leafMap) {
            let left_flower = Math.floor(leaf[0] / 10);
            let left_flower_leaf = leaf[0] % 10;
            let right_flower = Math.floor(leaf[1] / 10);
            let right_flower_leaf = leaf[1] % 10;

            if (this._flowerArr[left_flower].leaf[left_flower_leaf] > 0 &&
                this._flowerArr[left_flower].leaf[left_flower_leaf] === this._flowerArr[right_flower].leaf[right_flower_leaf]) {
                this._flowerArr[left_flower].remove(left_flower_leaf);
                this._flowerArr[right_flower].remove(right_flower_leaf);
                this.increaseScore(8);
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
        if (this._tick > 25) {
            this._tick = 0;
            this._makeLeaf();
        }
    }

    _makeLeaf() {
        if (this._state !== this.PLAY_STATE) {
            return;
        }
        for (let i = 0 ; i < 7 ; i++) {
            this._flowerArr[i].makeLeaf();
        }
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
