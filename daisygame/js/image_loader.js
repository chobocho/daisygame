class ImageLoader {
    constructor() {
        this.images = {};
    }

    load() {
        let root = "./img";
        this.images.background = LoadImage(root + "/background01.jpg");

        this.images.score = LoadImage(root + "/score.png");
        this.images.n0 = LoadImage(root + "/sn00.png");
        this.images.n1 = LoadImage(root + "/sn01.png");
        this.images.n2 = LoadImage(root + "/sn02.png");
        this.images.n3 = LoadImage(root + "/sn03.png");
        this.images.n4 = LoadImage(root + "/sn04.png");
        this.images.n5 = LoadImage(root + "/sn05.png");
        this.images.n6 = LoadImage(root + "/sn06.png");
        this.images.n7 = LoadImage(root + "/sn07.png");
        this.images.n8 = LoadImage(root + "/sn08.png");
        this.images.n9 = LoadImage(root + "/sn09.png");
        this.images.start = LoadImage(root + "/start.png");
        this.images.resume = LoadImage(root + "/resume.png");
        this.images.pause = LoadImage(root + "/pause.png");
        this.images.circle = LoadImage(root + "/circle.png");
        console.log("[ImageLoader] load images!");
    }
}