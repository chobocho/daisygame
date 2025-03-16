class Leaf {
    constructor(radius) {
        this._color = this._color = Math.floor(Math.random() * 7) + 1;
        this._size = radius;
        this._origin_life = 15;
        this._life = 15;
    }

    reset() {
        this._color = Math.floor(Math.random() * 7) + 1;
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