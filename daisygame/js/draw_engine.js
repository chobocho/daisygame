class DrawEngine {
    constructor(game, images) {
        this.game = game;
        this._image_res = images.images;
        this._InitValue();
        this._LoadImage();
    }

    _InitValue() {
        this.background_image = 0;
    }

    _LoadImage() {
        this.background = [];
        this.background[0] = this._image_res.background;

        this.buttonImage = {};
        this.buttonImage['score'] = this._image_res.score;
        this.buttonImage['0'] = this._image_res.n0;
        this.buttonImage['1'] = this._image_res.n1;
        this.buttonImage['2'] = this._image_res.n2;
        this.buttonImage['3'] = this._image_res.n3;
        this.buttonImage['4'] = this._image_res.n4;
        this.buttonImage['5'] = this._image_res.n5;
        this.buttonImage['6'] = this._image_res.n6;
        this.buttonImage['7'] = this._image_res.n7;
        this.buttonImage['8'] = this._image_res.n8;
        this.buttonImage['9'] = this._image_res.n9;
        this.buttonImage['start'] = this._image_res.start;
        this.buttonImage['resume'] = this._image_res.resume;
        this.buttonImage['pause'] = this._image_res.pause;
        this.buttonImage['music'] = this._image_res.music;
        this.buttonImage['mute'] = this._image_res.mute;
        this.buttonImage['circle'] = this._image_res.circle;
        printf("[DrawEngine]", "_LoadImage");
    }

    OnDraw() {
        bufCtx.clearRect(0, 0, canvas.width, canvas.height);
        bufCtx.beginPath();
        this._drawBoard();
        this._drawScore();
        this._drawFlowers();
        this._drawButton();
        bufCtx.closePath();

        cvs.clearRect(0, 0, canvas.width, canvas.height);
        cvs.drawImage(bufCanvas, gStartX, 0, gBlockSize * 40, gBlockSize * 60);
        // printf("[DrawEngine]", "OnDraw()");
    }

    _drawButton() {
        // printf("[DrawEngine] _drawButton() ", this.game.state());
        if (this.game.isIdleState()) {
            bufCtx.drawImage(this.buttonImage['start'], 250 - (250 - 95), 100, 300 * 0.7, 163 * 0.7);
            this._drawHighScore();
        } else if (this.game.isPauseState()) {
            bufCtx.drawImage(this.buttonImage['resume'], 300 - 200, 100, 200, 100);
            this._drawHighScore();
        } else if (this.game.isGameOverState()) {
            bufCtx.drawImage(this.buttonImage['start'], 250 - (250 - 95), 100, 300 * 0.7, 163 * 0.7);
            this._drawHighScore();
        } else if (this.game.isPlayState()) {
            bufCtx.drawImage(this.buttonImage['pause'], 10, 10, 60, 60);
            if (this.game.isPlayMusic()) {
                bufCtx.drawImage(this.buttonImage['music'], 330, 530, 60, 60);
            } else {
                bufCtx.drawImage(this.buttonImage['mute'], 330, 530, 60, 60);
            }

        }
    }

    _drawScore() {
        // printf("[DrawEngine] _drawScore()", this.game.score());
        let code = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        let score = this.game.score();
        let pos = 7;
        let blockSize = 30;
        let startX = 770 - (blockSize * 0.6 * pos) - 400;
        let startY = 10;

        bufCtx.drawImage(this.buttonImage[code[score % 10]], startX + blockSize * 0.6 * pos, startY, blockSize * 0.6, blockSize);
        while (score > 0) {
            bufCtx.drawImage(this.buttonImage[code[score % 10]], startX + blockSize * 0.6 * pos, startY, blockSize * 0.6, blockSize);
            score = Math.floor(score / 10);
            pos--;
        }
    }

    _drawHighScore() {
        // printf("[DrawEngine] _drawHighScore()", this.game.highScore());
        let code = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        let highScore = this.game.highScore();
        let pos = 8;
        let blockSize = 40;
        //let startX = (780-blockSize*pos)/2;
        let startX = (400 - blockSize * pos) / 2;
        let startY = 300;

        bufCtx.fillStyle = '#FFFF0022';
        bufCtx.fillRect(startX, startY, blockSize * pos, blockSize);
        pos--;
        bufCtx.drawImage(this.buttonImage[code[highScore % 10]], startX + blockSize * pos, startY, blockSize, blockSize);
        while (highScore > 0) {
            bufCtx.drawImage(this.buttonImage[code[highScore % 10]], startX + blockSize * pos, startY, blockSize, blockSize);
            highScore = Math.floor(highScore / 10);
            pos--;
        }
    }

    _drawBoard() {
        // printf("[DrawEngine] _drawBoard()", this.background_image);
        this._drawBackground();
    }

    _drawBackground() {
        bufCtx.drawImage(this.background[this.background_image], 0, 0, gScreenX, gScreenY);
    }

    getEventCode(x, y) {
        printf("[DrawEngine] getEventCode() ", this.game.state() + " (" + x + ", " + y + ")");
        if (this.game.isIdleState()) {
            let bx1 = gStartX + 95 * gScale;
            let bx2 = gStartX + (95 + 210) * gScale;
            let by1 = 100 * gScale;
            let by2 = (100 + 163 * 0.7) * gScale;

            if (x > bx1 && x < bx2 && y > by1 && y < by2) {
                return S_KEY;
            }
        } else if (this.game.isPauseState()) {
            let bx1 = gStartX + 100 * gScale;
            let bx2 = gStartX + 300 * gScale;
            let by1 = 100 * gScale;
            let by2 = 200 * gScale;

            if (x > bx1 && x < bx2 && y > by1 && y < by2) {
                return S_KEY;
            }
        } else if (this.game.isGameOverState()) {
            let bx1 = gStartX + 95 * gScale;
            let bx2 = gStartX + (95 + 210) * gScale;
            let by1 = 100 * gScale;
            let by2 = (100 + 163 * 0.7) * gScale;
            if (x > bx1 && x < bx2 && y > by1 && y < by2) {
                return S_KEY;
            }
        } else if (this.game.isPlayState()) {

            let bx1 = gStartX + 10 * gScale;
            let bx2 = gStartX + 70 * gScale;
            let by1 = 10 * gScale;
            let by2 = 70 * gScale;

            if (x > bx1 && x < bx2 && y > by1 && y < by2) {
                return P_KEY;
            }

            if (this._isClickMusicButton(x, y)) {
                return M_KEY;
            };
        }

        let flowers = this.game.getFlowers();
        for (let i = 0; i < 7; i++) {
            if (flowers[i].is_inside(x, y, gStartX, gScale)) {
                return i + KEY_0;
            }
        }

        return 0;
    }

    _isClickMusicButton(x, y) {
        let bx1 = gStartX + 330 * gScale;
        let bx2 = gStartX + 390 * gScale;
        let by1 = 530 * gScale;
        let by2 = 590 * gScale;
        if (x > bx1 && x < bx2 && y > by1 && y < by2) {
            return true;
        }
        return false;
    }

    _drawFlowers() {
        let flowers = this.game.getFlowers();
        for (let i = 0; i < 7; i++) {
            this._drawFlower(flowers[i]);
        }
    }

    _drawFlower(flower) {
        // 중심 원 그리기
        let cx = flower.x - flower.radius;
        let cy = flower.y - flower.radius;
        let size = flower.radius * 2;
        bufCtx.drawImage(this.buttonImage['circle'], cx, cy, size, size);

        const small_circle_radius = flower.small_radius();

        // 색상 테이블
        const COLOR_TABLE = [
            "rgb(0,0,0)",           // 0 검정
            "rgb(255,255,255)",     // 1 흰색
            "rgb(255,182,193)",     // 2 분홍
            "rgb(179,179,255)",     // 3 보라
            "rgb(135,206,235)",     // 4 하늘
            "rgb(255,255,0)",       // 5 노랑
            "rgb(144,238,144)",     // 6 연두색
            "rgb(255,165,0)"        // 7 주황
        ];

        // 잎(leaf)들을 그리기
        for (let i = 0; i < 6; i++) {
            if (flower.leaf[i].size() === 0) continue;

            let angle = 60 * i;
            let radians = angle * Math.PI / 180;
            let x = flower.x + Math.floor((flower.radius + small_circle_radius) * Math.cos(radians));
            let y = flower.y + Math.floor((flower.radius + small_circle_radius) * Math.sin(radians));
            bufCtx.beginPath();
            bufCtx.arc(x, y, flower.leaf[i].size(), 0, 2 * Math.PI);
            bufCtx.fillStyle = COLOR_TABLE[flower.leaf[i].color()];
            bufCtx.fill();
            bufCtx.closePath();
        }
    }
}
