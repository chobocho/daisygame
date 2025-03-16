class Flower {
    constructor() {
        this.color = "rgb(255,165,0)"; // 주황색
        this.radius = 0;
        this.x = 0;
        this.y = 0;
        this.leaf_count = 0;
        this.leaf = [];
        this.index = 0;
        this._small_radius = 10;
        this.init_leaf();
    }

    init_leaf() {
        this.leaf = [];
        for (let i = 0; i < 6; i++) {
            // 1부터 5까지의 정수 생성
            this.leaf.push(new Leaf(this._small_radius));
        }
        this.leaf_count = 6;
    }

    small_radius() {
        return this._small_radius;
    }

    set_index(index) {
        this.index = index;
    }

    set_pos(center_x, center_y, radius) {
        this.x = center_x;
        this.y = center_y;
        this.radius = radius;
    }

    turn() {
        // 마지막 요소를 앞으로 이동
        this.leaf.unshift(this.leaf.pop());
    }

    is_inside(x, y, gStartX, gScale) {
        let fx = gStartX  + this.x * gScale;
        let fy = this.y * gScale;
        let r = this.radius * gScale;
        return ((x - fx) ** 2 + (y - fy) ** 2 <= r ** 2);
    }

    remove(i) {
        if (!this.leaf[i].isAlive()) {
            return;
        }
        this.leaf[i].remove();
        this.leaf_count--;
    }

    makeLeaf() {
        if (this.leaf_count > 3) {
            return;
        }
        for (let i = 0; i < 6; i++) {
            if (this.leaf[i].color() === 0) {
                this.leaf[i].reset();
                this.leaf_count++;
            }
            if (this.leaf_count === 5) {
                return;
            }
        }
    }
}