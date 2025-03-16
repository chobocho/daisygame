class Flower {
    constructor(index) {
        this.color = "rgb(255,165,0)"; // 주황색
        this.radius = 0;
        this.x = 0;
        this.y = 0;
        this.leaf_count = 0;
        this.leaf = [];
        this.index = index;
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

    makeLeaf(flowerArr) {
        if (this.leaf_count > 3) {
            return;
        }

        const leafMap = [
            [[0, 13], [1, 24], [2, 35], [3, 40], [4, 51], [5, 62]],
            [[12, 25], [14, 61], [13, 0]],
            [[23, 30], [24, 1], [25, 12]],
            [[34, 41], [35, 2], [30, 23]],
            [[45, 52], [40, 3], [41, 34]],
            [[50, 63], [52, 45], [51, 4]],
            [[62, 5], [61, 14], [63, 50]],
        ];

        for (let i = 0; i < 6; i++) {
            if (this.leaf[i].color() === 0) {
                this.leaf[i].reset();

                for (let leaf of leafMap[this.index]) {
                    let right_flower = Math.floor(leaf[1] / 10);
                    let right_leaf = leaf[1] % 10;

                    if (flowerArr[right_flower].leaf[right_leaf].isAlive() &&
                        this.leaf[i].color() === flowerArr[right_flower].leaf[right_leaf].color()) {
                        let maxCount = 100;
                        do {
                            this.leaf[i].reset();
                            maxCount--;
                        } while (maxCount > 0 && this.leaf[i].color() === flowerArr[right_flower].leaf[right_leaf].color());
                        printf("[DaisyGame]", "Changed Color: " + maxCount);
                    }
                }

                this.leaf_count++;
            }
            if (this.leaf_count === 5) {
                return;
            }
        }
    }
}