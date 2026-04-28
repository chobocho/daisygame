class Leaf {
    constructor(radius, colorCount = 6) {
        const c = Math.max(1, Math.min(7, colorCount | 0));
        this._colorTable = [];
        for (let i = 1; i <= c; i++) this._colorTable.push(i);
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

    serialize() {
        return {
            color: this._color,
            colorTable: this._colorTable.slice(),
            colorIdx: this._colorIdx,
            life: this._life,
            originLife: this._origin_life,
            size: this._size,
        };
    }

    restore(d) {
        if (!d || typeof d !== 'object') return false;
        if (typeof d.color !== 'number' || typeof d.life !== 'number') return false;
        this._color = d.color;
        if (Array.isArray(d.colorTable) && d.colorTable.length > 0) {
            this._colorTable = d.colorTable.slice();
        }
        if (typeof d.colorIdx === 'number') this._colorIdx = d.colorIdx;
        this._life = d.life;
        if (typeof d.originLife === 'number' && d.originLife > 0) this._origin_life = d.originLife;
        if (typeof d.size === 'number') this._size = d.size;
        return true;
    }
}