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
        // Birth animation: a freshly placed leaf grows from 0 to full size
        // over _birthMax ticks. Constructor leaves start fully grown so
        // existing code paths and tests don't see a transient zero size.
        this._birthMax = 8;
        this._birth = this._birthMax;
    }

    playBirth() {
        // Trigger the grow-in animation. Caller (Flower.addLeaf or
        // DaisyGame._init_flower) decides when to play it.
        this._birth = 0;
    }

    advanceBirth() {
        if (this._birth < this._birthMax) this._birth++;
    }

    // Rainbow leaf: matches any color in checkCollision. Color 8 is reserved
    // for this and never appears in the regular _colorTable.
    setRainbow() {
        this._color = 8;
        this._life = this._origin_life;
    }

    isRainbow() {
        return this._color === 8;
    }

    // Golden leaf: a temporary 9-point wildcard event. Color 9 is reserved.
    // The 2..5s lifetime and grow-and-fade revert/clear are driven from
    // DaisyGame._activeGolden — the leaf itself just owns the color flag.
    setGolden() {
        this._color = 9;
        this._life = this._origin_life;
    }

    isGolden() {
        return this._color === 9;
    }

    // Render-side helpers — exposed so the draw engine can play different
    // animations for rainbow leaves (grow + fade) without re-deriving from
    // size().
    get_life_ratio() {
        return this._life / this._origin_life;
    }

    get_birth_ratio() {
        return this._birth / this._birthMax;
    }

    reset() {
        this._colorIdx = (this._colorIdx + 1) % this._colorTable.length;
        this._color = this._colorTable[this._colorIdx];
        this._life = this._origin_life;
    }

    size() {
        const lifeScale = this._life / this._origin_life;
        const birthScale = this._birth / this._birthMax;
        return Math.floor(this._size * lifeScale * birthScale);
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
            birth: this._birth,
            birthMax: this._birthMax,
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
        if (typeof d.birthMax === 'number' && d.birthMax > 0) this._birthMax = d.birthMax;
        if (typeof d.birth === 'number') {
            this._birth = Math.max(0, Math.min(this._birthMax, d.birth));
        }
        return true;
    }
}