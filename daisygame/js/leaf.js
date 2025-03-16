class Leaf {
    constructor(radius) {
        this._colorTable = [1, 2, 3, 4, 5, 6];
        this._colorTable.sort(() => Math.random() - 0.5);
        this._colorIdx = 0;
        this._color = this._colorTable[this._colorIdx];
        this._size = radius;
        this._origin_life = 15;
        this._life = 15;
    }

    reset() {
        this._colorIdx = (this._colorIdx + 1) % this._colorTable.length;
        this._color = this._colorTable[this._colorIdx];
        this._life = this._origin_life;
    }

    size() {
        return Math.floor(this._size * this._life / this._origin_life);
    }

    color() {
        return this._color;
    }

    isAlive() {
        return this._life === this._origin_life;
    }

    remove() {
        if (this.isAlive()) {
            this._life--;
        }
    }

    reduceSize() {
        this._life--;
        if (this._life <= 0) {
            this._color = 0;
            this._life = 0;
        }
    }
}