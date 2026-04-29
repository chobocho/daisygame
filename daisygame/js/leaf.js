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
        // Filled by setGolden when this leaf transforms from a normal color.
        // null while the leaf isn't gold (or was an empty-slot fill).
        this._goldSnapshot = null;
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

    // Golden leaf (color 9): a paired 9-point match event that only matches
    // another gold or a rainbow. Snapshot is stored on the leaf so it follows
    // the leaf object through rotations — DaisyGame can revert correctly even
    // after the leaf shifts to a different slot index.
    //   snapshot === null  → slot was empty before; revert clears it.
    //   snapshot !== null  → slot held an alive leaf; revert restores it.
    setGolden(snapshot) {
        this._color = 9;
        this._life = this._origin_life;
        this._goldSnapshot = snapshot || null;
    }

    isGolden() {
        return this._color === 9;
    }

    // Returns true iff the slot becomes empty (caller decrements leaf_count).
    revertFromGolden() {
        if (this._color !== 9) return false;
        const snap = this._goldSnapshot;
        this._goldSnapshot = null;
        if (snap) {
            this._color = snap.color;
            this._life = snap.life;
            this._birth = snap.birth;
            return false;
        }
        this._color = 0;
        this._life = 0;
        return true;
    }

    // Called on match-removal so a later expire won't try to revert the leaf.
    clearGoldenState() {
        this._goldSnapshot = null;
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