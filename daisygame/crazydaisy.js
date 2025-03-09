class LocalDB {
  constructor() {
    this.DB_NAME = 'DaisyScore';
  }

  getScore() {
    let score = localStorage.getItem(this.DB_NAME);
    if (score !== null) {
      return score;
    }
    return 0;
  }

  setScore(score) {
    localStorage.setItem(this.DB_NAME, score);
  }
}


class Flower {
    constructor() {
        this.color = "rgb(255,165,0)"; // 주황색
        this.radius = 0;
        this.x = 0;
        this.y = 0;
        this.leaf_count = 0;
        this.leaf = [];
        this.index = 0;
        this.init_leaf();
    }

    init_leaf() {
        this.leaf = [];
        for (let i = 0; i < 6; i++) {
            // 1부터 5까지의 정수 생성
            this.leaf.push(Math.floor(Math.random() * 5) + 1);
        }
        this.leaf_count = 6;
    }

    set_index(index) {
        this.index = index;
    }

    set_pos(center_x, center_y, radius) {
        this.x = center_x;
        this.y = center_y;
        this.radius = radius;
    }

    ring() {
        // 마지막 요소를 앞으로 이동
        this.leaf.unshift(this.leaf.pop());
    }

    is_inside(x, y) {
        return ((x - this.x) ** 2 + (y - this.y) ** 2 <= this.radius ** 2);
    }

    remove(i) {
        if (this.leaf[i] === 0) {
            return;
        }
        this.leaf[i] = 0;
        this.leaf_count--;
    }

    make_leaf() {
        if (this.leaf_count > 3) {
            return;
        }
        for (let i = 0; i < 6; i++) {
            if (this.leaf[i] === 0) {
                this.leaf[i] = Math.floor(Math.random() * 5) + 1;
                this.leaf_count++;
            }
            if (this.leaf_count === 5) {
                return;
            }
        }
    }
}

// 전역 변수 선언
let canvas, ctx, flowers;
let fps = 30;
let isSaveScore = false;
let scoreDB = new LocalDB();
let score = new Score(scoreDB.getScore());
let leafs = [
    [0, 13], [1, 24], [2, 35], [3, 40], [4, 51], [5, 62],
    [12, 25], [14, 61],
    [23, 30],
    [34, 41],
    [45, 52],
    [50, 63]
];
let buttonImage = {};

// 게임을 초기화하는 함수
function init_game() {
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");
    flowers = init_flower(400, 300, 50);
}

// Flower들을 초기화하는 함수
function init_flower(center_x, center_y, radius) {
    let flowersArr = [];
    for (let i = 0; i < 7; i++) {
        let f = new Flower();
        f.set_index(i);
        flowersArr.push(f);
    }
    // 중앙 꽃 설정
    flowersArr[0].set_pos(center_x, center_y, radius);

    // 나머지 꽃들: 60도 간격으로 배치
    for (let i = 0; i < 6; i++) {
        let angle = 60 * i;
        let radians = angle * Math.PI / 180;
        let x = center_x + Math.floor(radius * 3.5 * Math.cos(radians));
        let y = center_y + Math.floor(radius * 3.5 * Math.sin(radians));
        flowersArr[i + 1].set_pos(x, y, radius);
    }
    return flowersArr;
}

// 모든 Flower들을 그리는 함수
function draw_flowers() {
    // 배경을 검정색으로 채움
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 7; i++) {
        draw_flower(flowers[i]);
    }
    _drawScore();
    _drawHighScore();
}

function _drawScore()
{
    // printf("[DrawEngine] _drawScore()", this.game.score());
    let code = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let gameScore = score.score();
    let pos = 7;
    let blockSize = 30;
    let startX = 770 - (blockSize * 0.6 * pos);
    let startY = 10;

    ctx.drawImage(buttonImage[code[gameScore % 10]], startX + blockSize * 0.6 * pos, startY, blockSize * 0.6, blockSize);
    while (gameScore > 0) {
        ctx.drawImage(buttonImage[code[gameScore % 10]], startX + blockSize * 0.6 * pos, startY, blockSize * 0.6, blockSize);
        gameScore = Math.floor(gameScore / 10);
        pos--;
    }
}


function _drawHighScore() {
        // printf("[DrawEngine] _drawHighScore()", this.game.highScore());
        let code = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        let highScore = score.highScore();
        let pos = 8;
        let blockSize = 30;
        //let startX = (780-blockSize*pos)/2;
        let startX = (400 - blockSize * pos) / 2;
        let startY = 10;

        ctx.fillStyle = '#FFFF0022';
        ctx.fillRect(startX, startY, blockSize * pos, blockSize);
        pos--;
        ctx.drawImage(buttonImage[code[highScore % 10]], startX + blockSize * pos, startY, blockSize, blockSize);
        while (highScore > 0) {
            ctx.drawImage(buttonImage[code[highScore % 10]], startX + blockSize * pos, startY, blockSize, blockSize);
            highScore = Math.floor(highScore / 10);
            pos--;
        }
    }

// 단일 Flower를 그리는 함수
function draw_flower(flower) {
    // 중심 원 그리기
    ctx.beginPath();
    ctx.arc(flower.x, flower.y, flower.radius, 0, 2 * Math.PI);
    ctx.fillStyle = flower.color;
    ctx.fill();
    ctx.closePath();

    let small_circle_radius = 15;

    // 색상 테이블
    let COLOR_TABLE = [
        "rgb(0,0,0)",           // 0 검정
        "rgb(255,255,255)",     // 1 흰색
        "rgb(255,182,193)",     // 2 분홍
        "rgb(150,123,220)",     // 3 보라
        "rgb(135,206,235)",     // 4 하늘
        "rgb(255,255,0)",       // 5 노랑
        "rgb(255,165,0)"        // 6 주황
    ];

    // 잎(leaf)들을 그리기
    for (let i = 0; i < 6; i++) {
        let angle = 60 * i;
        let radians = angle * Math.PI / 180;
        let x = flower.x + Math.floor((flower.radius + small_circle_radius) * Math.cos(radians));
        let y = flower.y + Math.floor((flower.radius + small_circle_radius) * Math.sin(radians));
        ctx.beginPath();
        ctx.arc(x, y, small_circle_radius, 0, 2 * Math.PI);
        ctx.fillStyle = COLOR_TABLE[flower.leaf[i]];
        ctx.fill();
        ctx.closePath();
    }
}

// 마우스 클릭 이벤트 핸들러
function onMouseDown(event) {
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;

    for (let i = 0; i < 7; i++) {
        if (flowers[i].is_inside(x, y)) {
            console.log(`flower ${i} is changed to ${flowers[i].leaf}`);
            flowers[i].ring();
            for (let leaf of leafs) {
                let left_flower = Math.floor(leaf[0] / 10);
                let left_flower_leaf = leaf[0] % 10;
                let right_flower = Math.floor(leaf[1] / 10);
                let right_flower_leaf = leaf[1] % 10;

                if (flowers[left_flower].leaf[left_flower_leaf] > 0 &&
                    flowers[left_flower].leaf[left_flower_leaf] === flowers[right_flower].leaf[right_flower_leaf]) {
                        flowers[left_flower].remove(left_flower_leaf);
                        flowers[right_flower].remove(right_flower_leaf);
                        score.increase(8);
                        if (score.needToSave()) {
                            if (!isSaveScore) {
                                scoreDB.setScore(score.score());
                                isSaveScore = true;
                                printf("[SaveEngine] scoreDB.setScore()", scoreDB.getScore());
                            } else {
                                if (score.score() > scoreDB.getScore() + 100) {
                                    scoreDB.setScore(score.score());
                                }
                            }
                        }
                }
            }
        } else {
            flowers[i].make_leaf();
        }
    }
}

// 키보드 이벤트 핸들러 (추가 동작은 필요에 따라 구현)
function onKeyDown(event) {
    if (event.code === "Space" || event.key === "j") {
        // 스페이스바 또는 j키 입력 시 추가 동작 구현...
    } else if (event.key === "p") {
        // p키 입력 시 추가 동작 구현...
    } else if (event.key === "s") {
        // s키 입력 시 추가 동작 구현...
    }
}

// 메인 게임 루프
function gameLoop() {
    draw_flowers();
    // 일정 FPS로 게임 화면 업데이트
    setTimeout(gameLoop, 1000 / fps);
}

let LoadImage = function (image_name) {
  let load_image = new Image();
  load_image.src = image_name;
  return load_image;
}

function printf(tag, log) {
  console.log(tag, log);
}

function loadImage()
{
    let root = "./img";

    buttonImage['score'] = LoadImage(root + "/score.png");
    buttonImage['0'] = LoadImage(root + "/sn00.png");
    buttonImage['1'] = LoadImage(root + "/sn01.png");
    buttonImage['2'] = LoadImage(root + "/sn02.png");
    buttonImage['3'] = LoadImage(root + "/sn03.png");
    buttonImage['4'] = LoadImage(root + "/sn04.png");
    buttonImage['5'] = LoadImage(root + "/sn05.png");
    buttonImage['6'] = LoadImage(root + "/sn06.png");
    buttonImage['7'] = LoadImage(root + "/sn07.png");
    buttonImage['8'] = LoadImage(root + "/sn08.png");
    buttonImage['9'] = LoadImage(root + "/sn09.png");
}

// window가 로드된 후 게임 초기화 및 이벤트 등록
window.onload = function() {
    loadImage();
    init_game();
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
    document.title = "CrazyDaisy ver V0.1";
    gameLoop();
};
