class ImageLoader {
    constructor() {
        this.images = {};
    }

    load() {
        let root = "./img";
        this.images.background = LoadImage(root + "/background01.jpg");
        console.log("[ImageLoader] load images!");
    }
}
