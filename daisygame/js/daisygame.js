class DaisyGame {
    constructor(startX, startY, highscore = 0, canvas_width, canvas_height) {
        this.IDLE_STATE = 0;
        this.PLAY_STATE = 1;
        this.PAUSE_STATE = 2;
        this.GAME_OVER_STATE = 3;

        this._startX = startX;
        this._startY = startY;
        this._x = startX;
        this._y = startY;
        this._canvas_width = canvas_width;
        this._canvas_height = canvas_height;

        this._level = 1;
        this._tick = 0;
        this._score = new Score(highscore);
        this._state = this.IDLE_STATE;
        this._isTurning = false;
        this._leafMap = [
            [[0, 13], [1, 24], [2, 35], [3, 40], [4, 51], [5, 62]],
            [[12, 25], [14, 61], [13, 0]],
            [[23, 30], [24, 1], [25, 12]],
            [[34, 41], [35, 2], [30, 23]],
            [[45, 52], [40, 3], [41, 34]],
            [[50, 63], [52, 45], [51, 4]],
            [[62, 5], [61, 14], [63, 50]],
        ];
        this._flowerArr = [];
        const pop_sound = "//vQxAAAKCmlGnW8gA6fxKWnPbAAAAILNOBdzY0cMRzCiYzg+M+NjLCAxgWMcHDMSsycdMRA1Y660y5a6jCB" +
            "Y9dTxlNUNaRhFGcgZxCBhec0lDQGVAremHAy5GaICzMMASDepfpFveyhpi0zCCLoQyu+FJUAAIIAY2YxAGIaA4bjvAkIkRCWGMQild22d" +
            "uXL9Q2w9U7B4KL2GAAkgFwTKKARjQHDdduCEhHx6Syhdh7Ibi8ALCNMVXMQYDELUkrlxeYfyWW8/3K3/ct378rp+3XDUDRXYO3AtmgDYP" +
            "L6d92tsPXepo4lWN0zAExHNBoJZAuw2j7s7futLLr+UUNuXD807EmYGXIRQdSPuW79+kliw5dcwxTFFBQbnq2JgQKsI2jxpforpFrrZ2s" +
            "Og4oI6lC7bluWw9Y6KiKiDiKigjEHcfx/HLd/MPDw8AAAAAAw8PDx4AACAAEgAAAQQFgWzDwQfOAV08wgh0zLCPTMV8O0wQx4TPHDzNQI" +
            "z4z0lgzTSTzMfwzMzg3qjCOCRMUAT4wMQATBQAAM6ISYwQgSzTPI2YzMhZDPyh9YBOfhTuDM2szHS0wdIM7BnWeyJmRkZmbGYEhBchMGF" +
            "wcAtLSucl22voggQVMwagIagN1JpsGEo4HGWnQNBh4DMRBGDIaIRuQTGBtAwYyZkxmgRABkKp5oaEZOCRpBC6plBiXvaZSyWKmADpmQyV" +
            "BgxsvAJmSmgGMWhGRiZggeYkKqqp0gUYbLB8NVY9hwHXpMLylWYqhpQNhA0DhkmF1oKxOSqsW+GRNVQBCUHymBoGjbdIxKm3gIQASpWrh" +
            "wMZEJGBiZgQGIAJTNqQcCwZBpblVWDnLg9VVWGDEVqaAozT0EbprkulzdjSzcsBqKAKF0VwYFIJ1wqog4XY2vtBcHDfixUzlnKRr4s4FQ" +
            "b2dJGs5BASCAdnL5P+/zTn/bO/jZ5K2VdrSPXfJpL///////////////////tV///2qf/+1VqrVv///////////6GM/9DR/Q0aoyJUnSM" +
            "EgBIDHRQ5UyAMr2MChHRDK9xogxnkYIMIVHWCwPkGN0AKhg/IxIaEu+bn9FGNZmNRB6ViCBgKQJoYNKBhGApP/70sQiA/OpkQId/gAGQr" +
            "Rfwf5pkA0p6UpGwimVlM5qUjHA5K0iaQHJjlzGwymZSKZlIpFgpmUimYlEvmJBKWBKYkEpiQSlYlLBpM0CUrEhiUSmJBKYkEpmgS+VlMr" +
            "KXmUin5lIplgpeVlIrHJpAcmORyY4SBpFIGkRx5jkcGkEiWBwY5HBUHBWFywFywF/LAWLAXKwsWAsWCUYWC5WSjCwXMLBcwuFzC4XLAWK" +
            "wsZIC5ksLlgLlgLeVhcwuFvMLBfzCwXMLBYwsSTC5KMLkowsFzCwWKwt5WF/LAX/zC4W/ywF/KwuYXCxhcLGFwv/lYlKxJ5YEnlgSGJBJ" +
            "5WJTEgkKxJ5YEpiQSmJBKWBIViQrEhYEpWJfKxIViQrEn//////lgS+ViQxIJCsSFgSlYk8sCT/KxL/+UE4xKJf//LA48rHH/5WOP8xyO" +
            "CwODHI4KxyY4HJjgcmORwWBwWBxzywOSwOfKxyY4HJWOPu+4xKgHUMCZFMCwHgmCvCeJg+Y7kYTQBmGAlj9hjSIh8YakKxGAsAhBpqxHu" +
            "aAwcTnSxHuZglwZAYJeDqmul0a7ahtWSFgZmMl2YYJ5mhPlpDGaEMnmgzQMjZMzZGANmOdPNkYNCgUaCow0IwKDTajTnT02AIZAhlAo9D" +
            "Mr0lgwBmQFMGZZlgwBsxmTBaU5zIDMgKzAphAs2TMsGAOfAzArMGYZmzMFc82ZgsGP/ywQ/ywRKyHlZEyOo3pAsPDekDGS0VAoMNu1Cg0" +
            "IMqNqcmNGBRCWBhYahUYiuo0iuFRgdGDgip1SqlDgqpiwDMEDKwRYBqlMGCEINUohBCAGWARkwapA4P4QaCqAINBQYFRgQa9FdFY0IwKo" +
            "EVlOAoNU5KxgQaMaMCowKDSwNCg1FZRosGU2f8rMlpvLToFpsFpDMGTMGQMzAplAstKmwWnTZAhn/TYTY9Nn0Cy0pacDMU2PLTlpy0ibC" +
            "BZYMlpQIYLNGZMAZkBmJaUrMgbMBmQFMeBDPpsJsoFf6BSbKBSBYFMAUxBAzogL5MHRBCjAHBokxAIMZMLcFPTF1RYgwogM/MIDCAjC4g" +
            "0owT4JXML5DWjL11Xk0TwO9MIzCMjBCgQsxkyNo8TaZ4//vSxCKCME2i+i/vLIaPNF5h7emAzMYO7TzhE8DhBkK8EN6nBkBqWIDggMzQK" +
            "6HtuKkmQqKwgghJIVJRVCQUVCwaZph77BU0KwqlVIaYZhBlgIrSNJIw0jjCOMI04zSSaoHTGmmYQRhpCFIQJnnGVhNVVO1YQBCANUjVCw" +
            "GHCGGmYSQdMHDiEJqpaUrZQKA84GwK2UCjZZLSoEgNggUBsCtgsMoFlp/MMI00hAmHSlYbVxAGqYrDauWAmqNWVMWAlSmGkHThwhhhIrq" +
            "cKNqNeit5WYWDAob5mmFZqKhmGhDCjQQypyFDQqao2ZhqKgVM9NlNhAtNgtKWkLSoFARkDYmwyWlLSgVgCsf5aVAstMWmLSoFlm02f9Ff" +
            "1GkV0VjMNPQ0rMKzEVVGywYFTDNNRVMw0IYCppwQhIAQ0ENorKcIrBIajf+pwpwo0pyo0iuENIrCRVBz0KkmRmLaaPSEBkulbmUELuYu5" +
            "oBjqh5GcwmuYPbXBrEFuGXGjEcMT8ZjcI8mEkNwYhISZwjQBLsrnj6XjlXza9DGNjQ3jQjTGtjlICsIYSUWAp71BqZYVvGgvlgaFBpWMM" +
            "ahKzAGZgZmWmMwzK9BsjIFMm1GorhBs2w0KSjGtzbIQgwY2WFZRacCGUCgMwAzAzBhAsrnAQwc9kBs5aQIhBRCbRCFRgUGGNGBUYo0FWy" +
            "jQUGBEAxowKNxCCEJI2YIwYIrBmCBmTBBwYODGjRKmMGiDoohJNVVN4FMlhkgWBTBaZAsDMi0gFMpsFZhNlNlAvwMwQKMwZTYLTgQyYQK" +
            "VhDCBSsIVhf8woQsBfLAQsBCwEMKFMIEMIp8rCFYQwgUwqkrlGEUlgKakIYQKVqDChDChfMIFLAQsBCwELAQwgUrClYUsBCxLMIEMKpMK" +
            "oMKELCkrUFYUrClgL5hFJhAqbCBZYMgRkWDJaYCGQMyAzBNhNlAssMi0pmTAGyoFJsJsGYMFpy0xYZoFFZkCmCswmwmyWlTYLSoFemwWl" +
            "AhgtOqNdk1MxfRCDA8QhMBA/MxwAnDDGEvMo9EMxGgdDF7W4Mz4D01Y44jDiTiNiEfYwexEzAvDGODXzFWsXBjM0I1IzEIEZlBhIiYYQG" +
            "GpRn/+9LEJoP1lbbsD29Mhgs/nkHcQzipoamWagIe9QYSWagIbJmc9mBGRmWRmTJsp5szBacrZmZZljQBz5mGRmTAQbNCgCDAQaNqMCow" +
            "5aA5YwsNAqMRWCDAUQhBkxgwxqA0Iw0I0sSjGoTQIAqhAzICmS0hmTHlpE2QKZArIsGS0hWzLSlbI2rQKDDGjDGDAjUFRqK3mMGqcBQai" +
            "oWGxYGoqBVCEGQNmLTJslpUCi0ybPgZgBTAEMFpUCvLSgQyZgx5aRAszJg1AUrCmFCGFCeWAphQhYCmFCGECmEC/5hQpYUlgIagKWApWE" +
            "NSFLCk1AUwigrClgIYQKYUIVqCwFLATywFMKo8rCGFCGEUlgKWApYClYU1IQwoU1IUwgUwgQwoUrClYQrCmEUeYUKVhCsKYQL5hAhhApW" +
            "EKwhYClgJ5hVJWFLAQsBSwEMKELAU1AQwoUwoQrUlYQwgU1KgwoUsKDUhPMIF//8woQrUlgL/////+WMR92jBtkIoCN0yKcEyyO8wFKIy" +
            "HnMyZCoxxIkyIpE3MNk7D9c1EM4rHAsAkY9gyYBgEMAeYNAYYNBSYpg0gTLAGtnMGhFEQGruAAGF9QEDICBgAg2YGhQIgoAINlkmyBgZB" +
            "cGQuDAXBksBUYDgMGBmp2bGF+za3wA0voWQXYbNlbF3FkWziJpfosiAsCNqBMRsAOl3uUoyDip6DRk9nJBxU9HJcuDk9iwJTtTwWMVmCx" +
            "1PKeTFU6THU8WDeGMU+mMGxLBiswY1MQzGU6TFTFTF9T6Y6YwY5MZMRTpT4XOGO9RFNsuUXLTbTaUQ8uT5Yl5ckuWm0XITbUQLkFyC5ab" +
            "XqIFyguZTxYMp71PpieWMKdJjep9MRMRMRTv1OlPpiqe8sGU8FzpjqdqfU6U79TvzOdTtMYLmTFU8VmU+mOWDqdJjGcwY4McmMmMmIGOC" +
            "5lOkxkxExPTHTHU+p5TyngNYGgMAYQiBEBiDEGARAi/BhwYAwgwwi4ReDEIgMIRQiwigaga1AAIEQDZdwjPRkzIYNzOhUzWQ4zEUUDNY0" +
            "TMVFjGBOTG0QzPJ4Tk5qzNQ0zLAQDJMAzIATjCMjzDQTjHiNacRhnIceoZyDGiGF8DXTf/70sQmAjPSEPEO5w+FasIbibw9eA9EjhKkEp" +
            "mQMApjRUChZZ5JoiMCByyAVDKiQkUHDFYRhAHKEsQhHFAgsiVAFhQwIQgjYBReCkTIVLAyWqPyNAGRSNJQnLLjGIqYydJIFFcUAmOIRN1" +
            "CBAJLDxIgYkRDUEERXNMRW7LChYKnxCBmalVEkOEdMpHbZ0kal6iwBnN0SjVa19dzW1IJdoiIPoGLrQ5NEQxTmCgVAVAELm6RdrqYzPA5" +
            "SxAE6j4oFbaCx5jiunCp1Bi5rWl1pEBxmxL7Ywo67rntQJBiwFNyQQcZUyaLAlvtWYWvxnqnSmQQKB0FY+0GA2m1ImncsIrUz6Ll/l87W" +
            "ahskNL6ibYOivZVqtSrFuv+spR1jVtFaox5gz4PPGKdeJgCuEGgcB6Uqo2/6cIGFi1te0seNXM0sCsIt9WGW95rGmWi9iqzLFJOQpJ2FY" +
            "p3P67wLqgstjDkAKiYY7kzwVCVNglwQ7Ggn5ogwDocDQJoJMZsnmKrwhUDFTMxIcNtTgwFvE6nNAEWh6qok6VBF5y+BMYtagKUWZGvhaa" +
            "xFXoUlnhAUgCFgIB0UEg0LQcIAHC7iFQVCgARzSgRqLWgkggWSHAbAjYjAqhSQwgTIKIKINWLQNYsJciUjCEVDvFsHmUpLicj6E9DaDuF" +
            "vJoYxkmkfpvGCZ50H2hKHH6ul8jBMCxjxIUSEzj/UCvV54kKHyVRfzgR00BbOkvx6n4j0azPnqeRKQQ9KIUnVKvL6IQ9GHEQUkRRG+fhz" +
            "nQgywj1DlKE3D/ORC0AZRBSRGcf6cQ9GIIySVExM05EPVC2sqI5S7Gcc6EJdGnUcpPihM80DzRqFHSX4kIuw0iVl4Ps4TqNEnxQmeaCrd" +
            "OT20GFI/dMytYlKpkik1Y5uL57CgySXmtnUZhUzc3wIbyPM+ewYEN47VKHG6iFhy0qTEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqq" +
            "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq" +
            "qqqqqqqqqqqqqqqqqqqqqqqqqqq";
        this._audio = new Audio("data:audio/mp3;base64," + pop_sound);
    }

    _init_flower() {
        for (let i = 0; i < 7; i++) {
            let f = new Flower();
            f.set_index(i);
            this._flowerArr.push(f);
        }

        let center_x = 200;
        let center_y = 300;
        let radius = 35;

        // 중앙 꽃 설정
        this._flowerArr[0].set_pos(center_x, center_y, radius);

        // 나머지 꽃들: 60도 간격으로 배치
        for (let i = 0; i < 6; i++) {
            let angle = 60 * i;
            let radians = angle * Math.PI / 180;
            let x = center_x + Math.floor(radius * 3.5 * Math.cos(radians));
            let y = center_y + Math.floor(radius * 3.5 * Math.sin(radians));
            this._flowerArr[i + 1].set_pos(x, y, radius);
        }
    }

    getFlowers() {
        return this._flowerArr;
    }

    init() {
        this._level = 1;
        this._tick = 0;
        this._x = this._startX;
        this._y = this._startY;

        this._init_flower();
        this._score.init();
        this._state = this.IDLE_STATE;
        this._isTurning = false;
    }

    turnFlower(flower) {
        if (this._state !== this.PLAY_STATE) {
            return;
        }
        this._flowerArr[flower].turn();
        this.checkCollision(flower)
    }

    isTurning() {
        if (this._state !== this.PLAY_STATE) return false;
        return this._isTurning;
    }

    // For the animation of Bird
    turn() {
        if (this._state !== this.PLAY_STATE) {
            return;
        }
    }

    checkCollision(flower) {
        if (this._state !== this.PLAY_STATE) {
            return;
        }

        for (let leaf of this._leafMap[flower]) {
            let left_flower = Math.floor(leaf[0] / 10);
            let left_flower_leaf = leaf[0] % 10;
            let right_flower = Math.floor(leaf[1] / 10);
            let right_flower_leaf = leaf[1] % 10;

            if (this._flowerArr[left_flower].leaf[left_flower_leaf].isAlive() &&
                this._flowerArr[left_flower].leaf[left_flower_leaf].color() === this._flowerArr[right_flower].leaf[right_flower_leaf].color()) {
                this._flowerArr[left_flower].remove(left_flower_leaf);
                this._flowerArr[right_flower].remove(right_flower_leaf);
                this.increaseScore(8);
                this._audio.play();
            }
        }
    }

    start() {
        console.log("[DaisyGame] Start()" + this._state);
        if (this._state === this.PLAY_STATE) {
            return;
        }

        if (this._state === this.PAUSE_STATE || this._state === this.IDLE_STATE) {
            this._state = this.PLAY_STATE;
        } else if (this._state === this.GAME_OVER_STATE) {
            this.init();
            this._state = this.PLAY_STATE;
        }
    }

    pause() {
        if (this._state !== this.PLAY_STATE) {
            return;
        }
        console.log("Pause");
        this._state = this.PAUSE_STATE;
    }

    score() {
        //printf("[FloppyBird]", this._score.score());
        return this._score.score();
    }

    increaseScore(score) {
        this._score.increase(score);
    }

    highScore() {
        return this._score.highScore();
    }

    increaseTick() {
        if (!this.isPlayState()) {
            return;
        }
        this._tick++;
        this._reduceLeaf();
        if (this._tick > 25) {
            this._tick = 0;
            this._makeLeaf();
        }
    }

    _reduceLeaf() {
        this._flowerArr.forEach(f => {
            f.leaf.forEach(l => {
                if (!l.isAlive()) {
                    l.reduceSize();
                }
            });
        });

    }

    _makeLeaf() {
        if (this._state !== this.PLAY_STATE) {
            return;
        }
        for (let i = 0; i < 7; i++) {
            this._flowerArr[i].makeLeaf();
        }
    }

    x() {
        return this._x;
    }

    y() {
        return this._y;
    }

    state() {
        return this._state;
    }

    isIdleState() {
        return this._state === this.IDLE_STATE;
    }

    isPlayState() {
        return this._state === this.PLAY_STATE;
    }

    isPauseState() {
        return this._state === this.PAUSE_STATE;
    }

    isGameOverState() {
        return this._state === this.GAME_OVER_STATE;
    }

    needToSaveScore() {
        return this._score.needToSave();
    }
}
