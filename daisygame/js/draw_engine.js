"use strict";
class DrawEngine {
    static arrowColorFor(direction) {
        return direction === -1 ? DrawEngine.ARROW_COLOR_CCW : DrawEngine.ARROW_COLOR_CW;
    }
    constructor(game, images) {
        this._frame = 0;
        this._bee = {
            active: false,
            x: -50,
            baseY: 120,
            vx: 1.4,
            frame: 0,
            cooldown: 90,
        };
        this.game = game;
        this._image_res = images.images;
        this._InitValue();
        this._LoadImage();
    }
    _InitValue() {
        this.background_image = 0;
    }
    _LoadImage() {
        this.background = [this._image_res.background];
        printf("[DrawEngine]", "_LoadImage");
    }
    OnDraw() {
        this._frame++;
        Effects.tick();
        this._updateMascot();
        bufCtx.clearRect(0, 0, canvas.width, canvas.height);
        this._drawBackground();
        this._drawFlowers();
        this._drawParticles();
        this._drawMascot();
        this._drawScoreHud();
        this._drawButton();
        this._drawPopups();
        this._drawCallouts();
        cvs.clearRect(0, 0, canvas.width, canvas.height);
        cvs.drawImage(bufCanvas, gStartX, 0, gBlockSize * 40, gBlockSize * 60);
    }
    // ---------- Background (#8) ----------
    _drawBackground() {
        bufCtx.drawImage(this.background[this.background_image], 0, 0, gScreenX, gScreenY);
        // The level-select grid has 100 small cells; cloud + grass overlays just
        // add visual noise behind them.
        if (this.game.isLevelSelectState())
            return;
        this._drawClouds();
        this._drawGrass();
    }
    _drawClouds() {
        bufCtx.save();
        bufCtx.globalAlpha = 0.55;
        bufCtx.fillStyle = "#FFFFFF";
        const t = this._frame * 0.05;
        const clouds = [
            { x: 60 + Math.sin(t) * 6, y: 32, r: 18 },
            { x: 200, y: 22, r: 22 },
            { x: 320 + Math.cos(t) * 6, y: 40, r: 16 },
        ];
        for (const c of clouds) {
            bufCtx.beginPath();
            bufCtx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
            bufCtx.arc(c.x + c.r * 0.8, c.y + 4, c.r * 0.8, 0, Math.PI * 2);
            bufCtx.arc(c.x - c.r * 0.8, c.y + 5, c.r * 0.7, 0, Math.PI * 2);
            bufCtx.arc(c.x + c.r * 0.3, c.y - c.r * 0.5, c.r * 0.7, 0, Math.PI * 2);
            bufCtx.fill();
        }
        bufCtx.restore();
    }
    _drawGrass() {
        const baseY = gScreenY - 6;
        bufCtx.save();
        // Soft grass strip background.
        const grad = bufCtx.createLinearGradient(0, gScreenY - 24, 0, gScreenY);
        grad.addColorStop(0, "rgba(46, 110, 50, 0.0)");
        grad.addColorStop(1, "rgba(46, 110, 50, 0.55)");
        bufCtx.fillStyle = grad;
        bufCtx.fillRect(0, gScreenY - 24, gScreenX, 24);
        // Grass blades (deterministic positions).
        bufCtx.fillStyle = "#3a7a3a";
        for (let i = 0; i < 28; i++) {
            const x = 8 + i * (gScreenX / 28) + ((i * 13) % 7);
            const tilt = ((i * 17) % 5) - 2;
            const h = 10 + ((i * 7) % 8);
            bufCtx.beginPath();
            bufCtx.moveTo(x, baseY);
            bufCtx.quadraticCurveTo(x + tilt, baseY - h * 0.6, x + tilt * 1.4, baseY - h);
            bufCtx.lineTo(x + tilt * 1.4 + 1.6, baseY - h + 0.4);
            bufCtx.quadraticCurveTo(x + tilt * 0.8 + 1.6, baseY - h * 0.55, x + 2.2, baseY);
            bufCtx.closePath();
            bufCtx.fill();
        }
        bufCtx.restore();
    }
    // ---------- Buttons / overlays ----------
    _drawButton() {
        if (this.game.isIdleState()) {
            this._drawWordmark("Crazy Daisy");
            this._drawModeButtons();
            this._drawHighScore();
        }
        else if (this.game.isLevelSelectState()) {
            this._drawWordmark("Puzzle");
            this._drawLevelSelectPanel();
        }
        else if (this.game.isPauseState()) {
            this._drawWordmark("Paused");
            if (this.game.mode() === 1) {
                // Puzzle: three options — Resume / Level Select / Main Menu.
                this._drawPlayButton(200, 120, 100, 24, "Resume");
                this._drawModeButton(200, 180, 95, 22, "Level Select", "\u{1F9E9}", "#A6BFF7", "#5C7DD6"); // 🧩
                this._drawMenuButton(200, 240, 85, 22);
            }
            else {
                // Arcade / Endless: existing two-button layout.
                this._drawPlayButton(200, 140, 100, 28, "Resume");
                this._drawMenuButton(200, 210, 85, 22);
            }
            this._drawHighScore();
        }
        else if (this.game.isGameOverState()) {
            if (this.game.mode() === 1) {
                this._drawPuzzleGameOver();
            }
            else {
                const m = this.game.mode();
                const title = m === 0 ? "Time's Up!" : "Game Over";
                this._drawWordmark(title);
                this._drawModeButtons();
                this._drawHighScore();
                this._drawHint("Pick a mode to play again", 380);
            }
        }
        else if (this.game.isPlayState()) {
            this._drawIconButton(40, 40, 26, "pause");
            this._drawIconButton(360, 560, 26, this.game.isPlayMusic() ? "music" : "mute");
            this._drawTimer();
            if (this.game.mode() === 1)
                this._drawPuzzleHud();
        }
    }
    _drawLevelSelectPanel() {
        // Cream backdrop behind the grid — gives every cell the same neutral
        // base, so locked / unstarred cells don't pick up the green garden
        // background and read fuzzy.
        bufCtx.save();
        bufCtx.fillStyle = "rgba(255, 247, 230, 0.95)";
        this._roundRectPath(12, 92, 376, 416, 14);
        bufCtx.fill();
        bufCtx.lineWidth = 2;
        bufCtx.strokeStyle = "rgba(140, 90, 30, 0.6)";
        bufCtx.stroke();
        bufCtx.restore();
        this._drawLevelGrid();
        this._drawMenuButton(200, 540, 85, 22);
    }
    _drawLevelGrid() {
        const prog = this.game.puzzleProgress();
        const unlocked = prog ? prog.unlocked() : 1;
        const selected = this.game.puzzleLevel();
        for (let lv = 1; lv <= Puzzle.MAX_LEVEL; lv++) {
            const idx = lv - 1;
            const col = idx % DrawEngine.GRID_COLS;
            const row = Math.floor(idx / DrawEngine.GRID_COLS);
            const cx = DrawEngine.GRID_X + col * DrawEngine.GRID_CELL_W + DrawEngine.GRID_CELL_W / 2;
            const cy = DrawEngine.GRID_Y + row * DrawEngine.GRID_CELL_H + DrawEngine.GRID_CELL_H / 2;
            this._drawLevelCell(cx, cy, lv, prog, lv <= unlocked, lv === selected);
        }
    }
    _drawLevelCell(cx, cy, level, prog, isUnlocked, isSelected) {
        const w = DrawEngine.GRID_CELL_W - 3;
        const h = DrawEngine.GRID_CELL_H - 3;
        const stars = prog ? prog.stars(level) : 0;
        const best = prog ? prog.bestScore(level) : 0;
        bufCtx.save();
        // Opaque tint so the cell reads cleanly on top of the cream panel.
        if (!isUnlocked) {
            bufCtx.fillStyle = "#B8B5AE";
        }
        else if (stars >= 3) {
            bufCtx.fillStyle = "#FFD56B";
        }
        else if (stars >= 1) {
            bufCtx.fillStyle = "#FFEFA8";
        }
        else {
            bufCtx.fillStyle = "#FFFFFF";
        }
        this._roundRectPath(cx - w / 2, cy - h / 2, w, h, 5);
        bufCtx.fill();
        // Border (selected gets a red ring matching the CW arrow accent).
        if (isSelected) {
            bufCtx.lineWidth = 2.2;
            bufCtx.strokeStyle = "#D6303A";
        }
        else {
            bufCtx.lineWidth = 1;
            bufCtx.strokeStyle = "rgba(120,70,0,0.5)";
        }
        bufCtx.stroke();
        if (!isUnlocked) {
            bufCtx.font = "16px " + DrawEngine.EMOJI_FONT;
            bufCtx.textAlign = "center";
            bufCtx.textBaseline = "middle";
            bufCtx.fillStyle = "#000";
            bufCtx.fillText("\u{1F512}", cx, cy);
            bufCtx.restore();
            return;
        }
        // Level number on top.
        bufCtx.font = "bold 12px " + DrawEngine.UI_FONT;
        bufCtx.textAlign = "center";
        bufCtx.textBaseline = "middle";
        bufCtx.fillStyle = "#3a2a18";
        bufCtx.fillText(String(level), cx, cy - 11);
        // Three small stars in the middle.
        for (let i = 0; i < 3; i++) {
            this._drawStar(cx - 7 + i * 7, cy + 1, 2.4, i < stars);
        }
        // Best score on bottom (only after the player has scored at least once).
        if (best > 0) {
            bufCtx.font = "9px " + DrawEngine.UI_FONT;
            bufCtx.fillStyle = "#7a3010";
            bufCtx.fillText(String(best), cx, cy + h / 2 - 6);
        }
        bufCtx.restore();
    }
    _drawStars(cx, cy, filled, size) {
        const spacing = size * 2.4;
        const startX = cx - spacing;
        bufCtx.save();
        for (let i = 0; i < 3; i++) {
            this._drawStar(startX + i * spacing, cy, size, i < filled);
        }
        bufCtx.restore();
    }
    _drawStar(cx, cy, r, filled) {
        bufCtx.save();
        bufCtx.translate(cx, cy);
        bufCtx.beginPath();
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
            const radius = (i % 2 === 0) ? r : r * 0.45;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0)
                bufCtx.moveTo(x, y);
            else
                bufCtx.lineTo(x, y);
        }
        bufCtx.closePath();
        if (filled) {
            bufCtx.fillStyle = "#FFD23F";
            bufCtx.fill();
            bufCtx.lineWidth = 1.5;
            bufCtx.strokeStyle = "#a87b00";
            bufCtx.stroke();
        }
        else {
            bufCtx.fillStyle = "rgba(255,255,255,0.25)";
            bufCtx.fill();
            bufCtx.lineWidth = 1.5;
            bufCtx.strokeStyle = "rgba(120,90,30,0.45)";
            bufCtx.stroke();
        }
        bufCtx.restore();
    }
    // ---------- Puzzle in-game HUD ----------
    _drawPuzzleHud() {
        const lvl = this.game.puzzleLevel();
        if (lvl <= 0)
            return;
        const cfg = Puzzle.levelConfig(lvl);
        const prog = this.game.puzzleProgress();
        const best = prog ? prog.bestScore(lvl) : 0;
        // Star thresholds mirror Puzzle.starRating: T, ceil(T * 1.5), T * 2.
        const t1 = cfg.target;
        const t2 = Math.ceil(cfg.target * 1.5);
        const t3 = cfg.target * 2;
        bufCtx.save();
        bufCtx.textAlign = "left";
        bufCtx.textBaseline = "middle";
        bufCtx.lineWidth = 3;
        bufCtx.strokeStyle = "rgba(0,0,0,0.6)";
        // Line 1 — level + best (sits to the right of the pause button).
        bufCtx.font = "bold 14px " + DrawEngine.UI_FONT;
        bufCtx.fillStyle = "#FFFFFF";
        const line1 = "Lv " + lvl + "    Best " + best;
        bufCtx.strokeText(line1, 78, 18);
        bufCtx.fillText(line1, 78, 18);
        // Line 2 — per-star target points.
        bufCtx.font = "12px " + DrawEngine.UI_FONT;
        bufCtx.fillStyle = "#FFEFA8";
        const line2 = "\u2605 " + t1 + "   \u2605\u2605 " + t2 + "   \u2605\u2605\u2605 " + t3;
        bufCtx.strokeText(line2, 78, 38);
        bufCtx.fillText(line2, 78, 38);
        bufCtx.restore();
        // Vertical petal-stack timer on the left edge. The arcade timer would
        // collide with the score readout at top-right, so puzzle mode shows time
        // as a stack of petals that drop one-by-one as the clock runs down, plus
        // a small numeric M:SS in the bottom-left corner.
        this._drawPuzzlePetalTimer(cfg.timeSeconds);
    }
    _drawPuzzlePetalTimer(totalSec) {
        if (totalSec <= 0)
            return;
        const PETAL_COUNT = 12;
        const SEC_PER_PETAL = totalSec / PETAL_COUNT;
        const STACK_X = 24;
        const STACK_TOP_Y = 92;
        const SPACING = 22;
        const PETAL_LEN = 22;
        const PETAL_WID = 12;
        const secF = this.game.timerSecondsFloat();
        const displayedCount = Math.min(PETAL_COUNT, Math.ceil(secF / SEC_PER_PETAL));
        if (displayedCount > 0) {
            // Top-of-stack petal is mid-fall; its progress goes 0 (just attached)
            // → 1 (about to drop off the bottom of its 5-sec window).
            const topElapsed = displayedCount * SEC_PER_PETAL - secF;
            const topProg = Math.max(0, Math.min(1, topElapsed / SEC_PER_PETAL));
            for (let i = 0; i < displayedCount; i++) {
                const slotFromBottom = i;
                const py = STACK_TOP_Y + (PETAL_COUNT - 1 - slotFromBottom) * SPACING;
                // Slot 0 = bottom = darkest; slot 11 = top = palest.
                const palette = DrawEngine.PUZZLE_TIMER_PALETTES[i];
                if (!palette)
                    continue;
                const isTop = i === displayedCount - 1;
                if (isTop && topProg > 0.001) {
                    // Falling animation: ease-in drop with a slight horizontal drift,
                    // gentle rotation, and ease-out fade.
                    bufCtx.save();
                    const dropY = topProg * topProg * 36;
                    const driftX = Math.sin(topProg * 2.4) * 6;
                    const rot = topProg * 0.7;
                    bufCtx.globalAlpha = Math.max(0, 1 - topProg * topProg);
                    this._drawPetal(STACK_X + driftX, py + dropY, rot, PETAL_LEN, PETAL_WID, palette);
                    bufCtx.restore();
                }
                else {
                    this._drawPetal(STACK_X, py, 0, PETAL_LEN, PETAL_WID, palette);
                }
            }
        }
        // Small numeric M:SS in the bottom-left, mirroring the music button on
        // the bottom-right.
        const sec = Math.max(0, Math.ceil(secF));
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        const text = m + ":" + (s < 10 ? "0" + s : "" + s);
        bufCtx.save();
        bufCtx.font = "bold 14px " + DrawEngine.UI_FONT;
        bufCtx.textAlign = "left";
        bufCtx.textBaseline = "middle";
        bufCtx.lineWidth = 3;
        bufCtx.strokeStyle = "rgba(0,0,0,0.65)";
        bufCtx.fillStyle = sec <= 10 ? "#FF5050" : "#FFFFFF";
        bufCtx.strokeText(text, 10, 580);
        bufCtx.fillText(text, 10, 580);
        bufCtx.restore();
    }
    // ---------- Puzzle game-over screen ----------
    _drawPuzzleGameOver() {
        const lvl = this.game.puzzleLevel();
        const cfg = Puzzle.levelConfig(lvl);
        const score = this.game.score();
        const stars = Puzzle.starRating(score, cfg.target);
        const cleared = score >= cfg.target;
        const prog = this.game.puzzleProgress();
        const best = prog ? prog.bestScore(lvl) : score;
        this._drawWordmark(cleared ? "Cleared!" : "Failed");
        // Stars.
        this._drawStars(200, 130, stars, 18);
        // Score / target / best lines.
        bufCtx.save();
        bufCtx.font = "bold 18px " + DrawEngine.UI_FONT;
        bufCtx.textAlign = "center";
        bufCtx.textBaseline = "middle";
        bufCtx.fillStyle = "#FFFFFF";
        bufCtx.lineWidth = 3;
        bufCtx.strokeStyle = "rgba(0,0,0,0.55)";
        const line1 = "Score " + score + "  /  Target " + cfg.target;
        bufCtx.strokeText(line1, 200, 175);
        bufCtx.fillText(line1, 200, 175);
        const line2 = "Best  " + best;
        bufCtx.strokeText(line2, 200, 200);
        bufCtx.fillText(line2, 200, 200);
        bufCtx.restore();
        // Buttons: Next (if cleared) / Retry / Main Menu.
        if (cleared && lvl < Puzzle.MAX_LEVEL) {
            this._drawModeButton(200, 250, 95, 22, "Next Level", "\u23ED\uFE0F", "#A6E0A6", "#3F9E5C"); // ⏭️
            this._drawModeButton(200, 305, 95, 22, "Retry", "\u{1F501}", "#FFB179", "#E25E2A"); // 🔁
        }
        else {
            this._drawModeButton(200, 280, 95, 22, "Retry", "\u{1F501}", "#FFB179", "#E25E2A");
        }
        this._drawMenuButton(200, 380, 85, 22);
    }
    _drawModeButtons() {
        for (const m of DrawEngine.MODE_BUTTONS) {
            this._drawModeButton(gScreenX / 2, m.cy, DrawEngine.MODE_BTN_HALF_W, DrawEngine.MODE_BTN_HALF_H, m.label, m.glyph, m.top, m.bot);
        }
    }
    _drawModeButton(cx, cy, halfW, halfH, label, glyph, top, bot) {
        bufCtx.save();
        // Drop shadow.
        bufCtx.fillStyle = "rgba(0,0,0,0.20)";
        this._roundRectPath(cx - halfW + 2, cy - halfH + 4, halfW * 2, halfH * 2, 14);
        bufCtx.fill();
        // Body.
        const grad = bufCtx.createLinearGradient(0, cy - halfH, 0, cy + halfH);
        grad.addColorStop(0, top);
        grad.addColorStop(1, bot);
        bufCtx.fillStyle = grad;
        this._roundRectPath(cx - halfW, cy - halfH, halfW * 2, halfH * 2, 14);
        bufCtx.fill();
        bufCtx.lineWidth = 2;
        bufCtx.strokeStyle = "#3a2a18";
        bufCtx.stroke();
        // Emoji glyph (left side of button).
        bufCtx.font = "26px " + DrawEngine.EMOJI_FONT;
        bufCtx.textAlign = "center";
        bufCtx.textBaseline = "middle";
        bufCtx.fillStyle = "#000";
        bufCtx.fillText(glyph, cx - halfW + 30, cy);
        // Label.
        bufCtx.font = "bold 22px " + DrawEngine.UI_FONT;
        bufCtx.textAlign = "center";
        bufCtx.lineWidth = 3;
        bufCtx.strokeStyle = "rgba(0,0,0,0.55)";
        bufCtx.fillStyle = "#FFFFFF";
        bufCtx.strokeText(label, cx + 16, cy + 1);
        bufCtx.fillText(label, cx + 16, cy + 1);
        bufCtx.restore();
    }
    // Secondary, neutral button — shown on the pause screen so the player can
    // abandon the current game and go back to the mode-select (IDLE) screen.
    _drawMenuButton(cx, cy, halfW, halfH) {
        bufCtx.save();
        // Drop shadow.
        bufCtx.fillStyle = "rgba(0,0,0,0.18)";
        this._roundRectPath(cx - halfW + 2, cy - halfH + 3, halfW * 2, halfH * 2, 12);
        bufCtx.fill();
        // Body — muted grey gradient.
        const grad = bufCtx.createLinearGradient(0, cy - halfH, 0, cy + halfH);
        grad.addColorStop(0, "#E0E5EA");
        grad.addColorStop(1, "#7A8086");
        bufCtx.fillStyle = grad;
        this._roundRectPath(cx - halfW, cy - halfH, halfW * 2, halfH * 2, 12);
        bufCtx.fill();
        bufCtx.lineWidth = 2;
        bufCtx.strokeStyle = "#3a2a18";
        bufCtx.stroke();
        // Home glyph on the left.
        bufCtx.font = "18px " + DrawEngine.EMOJI_FONT;
        bufCtx.textAlign = "center";
        bufCtx.textBaseline = "middle";
        bufCtx.fillStyle = "#000";
        bufCtx.fillText("\u{1F3E0}", cx - halfW + 18, cy);
        // Label.
        bufCtx.font = "bold 16px " + DrawEngine.UI_FONT;
        bufCtx.textAlign = "center";
        bufCtx.lineWidth = 2.5;
        bufCtx.strokeStyle = "rgba(0,0,0,0.55)";
        bufCtx.fillStyle = "#FFFFFF";
        bufCtx.strokeText("Main Menu", cx + 10, cy + 1);
        bufCtx.fillText("Main Menu", cx + 10, cy + 1);
        bufCtx.restore();
    }
    _drawTimer() {
        if (this.game.mode() !== 0)
            return;
        const sec = this.game.timerSeconds();
        bufCtx.save();
        bufCtx.font = "bold 28px " + DrawEngine.UI_FONT;
        bufCtx.textAlign = "center";
        bufCtx.textBaseline = "middle";
        bufCtx.lineWidth = 4;
        bufCtx.strokeStyle = "rgba(0,0,0,0.6)";
        bufCtx.fillStyle = sec <= 10 ? "#FF5050" : "#FFFFFF";
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        const text = m + ":" + (s < 10 ? "0" + s : "" + s);
        bufCtx.strokeText(text, gScreenX / 2, 32);
        bufCtx.fillText(text, gScreenX / 2, 32);
        bufCtx.restore();
    }
    // Painted rounded-rect "Play / Resume" button with glyph (#10).
    // Hit box (kept to match getEventCode):
    //   idle/gameover: x=95..305, y=100..214  (so center≈200, width=210, height=114)
    //   pause:         x=100..300, y=100..200 (so center≈200, width=200, height=100)
    _drawPlayButton(cx, cy, halfW, halfH, label = "Play") {
        bufCtx.save();
        // Drop shadow.
        bufCtx.fillStyle = "rgba(0,0,0,0.18)";
        this._roundRectPath(cx - halfW + 3, cy - halfH + 5, halfW * 2, halfH * 2, 18);
        bufCtx.fill();
        // Body gradient.
        const grad = bufCtx.createLinearGradient(0, cy - halfH, 0, cy + halfH);
        grad.addColorStop(0, "#FFE49A");
        grad.addColorStop(1, "#F4A95E");
        bufCtx.fillStyle = grad;
        this._roundRectPath(cx - halfW, cy - halfH, halfW * 2, halfH * 2, 18);
        bufCtx.fill();
        bufCtx.lineWidth = 2;
        bufCtx.strokeStyle = "#a35a1d";
        bufCtx.stroke();
        // Center triangle + label as a single group so longer labels (e.g.
        // "Resume") don't drift right of center.
        bufCtx.font = "bold 22px " + DrawEngine.UI_FONT;
        bufCtx.textBaseline = "middle";
        const triangleW = 18;
        const gap = 6;
        const labelWidth = bufCtx.measureText(label).width;
        const groupW = triangleW + gap + labelWidth;
        const triLeft = cx - groupW / 2;
        const triRight = triLeft + triangleW;
        // Triangle play glyph.
        bufCtx.fillStyle = "#5b2f0a";
        bufCtx.beginPath();
        bufCtx.moveTo(triLeft, cy - 12);
        bufCtx.lineTo(triRight, cy);
        bufCtx.lineTo(triLeft, cy + 12);
        bufCtx.closePath();
        bufCtx.fill();
        // Label.
        bufCtx.textAlign = "left";
        bufCtx.fillStyle = "#5b2f0a";
        bufCtx.fillText(label, triRight + gap, cy + 1);
        bufCtx.restore();
    }
    // Pause uses the painted button (#10). Music/mute drop the disc and render
    // the emoji glyph alone — the circular frame felt heavy for the corner icon.
    // Hit box stays at the original 60x60 region centered on (cx, cy).
    _drawIconButton(cx, cy, radius, kind) {
        bufCtx.save();
        if (kind === "pause") {
            // Drop shadow disc.
            bufCtx.fillStyle = "rgba(0,0,0,0.18)";
            bufCtx.beginPath();
            bufCtx.arc(cx + 1.5, cy + 2.5, radius, 0, Math.PI * 2);
            bufCtx.fill();
            // Body.
            const grad = bufCtx.createRadialGradient(cx - 6, cy - 8, 4, cx, cy, radius);
            grad.addColorStop(0, "#FFFCE4");
            grad.addColorStop(1, "#F4C56F");
            bufCtx.fillStyle = grad;
            bufCtx.beginPath();
            bufCtx.arc(cx, cy, radius, 0, Math.PI * 2);
            bufCtx.fill();
            bufCtx.lineWidth = 2;
            bufCtx.strokeStyle = "#a35a1d";
            bufCtx.stroke();
            // Pause bars.
            bufCtx.fillStyle = "#5b2f0a";
            bufCtx.fillRect(cx - 9, cy - 10, 6, 20);
            bufCtx.fillRect(cx + 3, cy - 10, 6, 20);
        }
        else {
            const glyph = kind === "music" ? "\u{1F50A}" : "\u{1F507}"; // 🔊 / 🔇
            bufCtx.font = Math.round(radius * 1.8) + "px " + DrawEngine.EMOJI_FONT;
            bufCtx.textAlign = "center";
            bufCtx.textBaseline = "middle";
            bufCtx.shadowColor = "rgba(0,0,0,0.45)";
            bufCtx.shadowBlur = 6;
            bufCtx.shadowOffsetY = 2;
            bufCtx.fillStyle = "#000";
            bufCtx.fillText(glyph, cx, cy + 1);
        }
        bufCtx.restore();
    }
    // ---------- Title / hint / high-score (#7, #6) ----------
    _drawWordmark(text) {
        bufCtx.save();
        bufCtx.textAlign = "center";
        bufCtx.textBaseline = "middle";
        // Decorative side daisies.
        this._drawTinyDaisy(70, 56, 14, "#FFE94D", "#FFFFFF");
        this._drawTinyDaisy(330, 56, 14, "#FFE94D", "#FFB6C1");
        // Word body — large playful font with gradient fill + thick outline.
        bufCtx.font = "bold 46px " + DrawEngine.TITLE_FONT;
        const grad = bufCtx.createLinearGradient(0, 30, 0, 86);
        grad.addColorStop(0, "#FFB6E1");
        grad.addColorStop(0.55, "#E94B95");
        grad.addColorStop(1, "#A7286E");
        bufCtx.lineWidth = 5;
        bufCtx.strokeStyle = "#FFFFFF";
        bufCtx.strokeText(text, 200, 58);
        bufCtx.fillStyle = grad;
        bufCtx.fillText(text, 200, 58);
        bufCtx.restore();
    }
    _drawHint(text, y = 230) {
        bufCtx.save();
        bufCtx.font = "italic 16px " + DrawEngine.UI_FONT;
        bufCtx.textAlign = "center";
        bufCtx.textBaseline = "middle";
        bufCtx.fillStyle = "rgba(255,255,255,0.92)";
        bufCtx.lineWidth = 3;
        bufCtx.strokeStyle = "rgba(0,0,0,0.45)";
        bufCtx.strokeText(text, 200, y);
        bufCtx.fillText(text, 200, y);
        bufCtx.restore();
    }
    // Decorative small daisy used by the wordmark.
    _drawTinyDaisy(cx, cy, r, centerColor, petalColor) {
        bufCtx.save();
        bufCtx.translate(cx, cy);
        for (let i = 0; i < 8; i++) {
            const a = (Math.PI * 2 * i) / 8;
            bufCtx.save();
            bufCtx.rotate(a);
            bufCtx.fillStyle = petalColor;
            bufCtx.strokeStyle = "rgba(80,40,60,0.35)";
            bufCtx.lineWidth = 1;
            bufCtx.beginPath();
            bufCtx.ellipse(r * 0.8, 0, r * 0.65, r * 0.35, 0, 0, Math.PI * 2);
            bufCtx.fill();
            bufCtx.stroke();
            bufCtx.restore();
        }
        bufCtx.fillStyle = centerColor;
        bufCtx.beginPath();
        bufCtx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
        bufCtx.fill();
        bufCtx.strokeStyle = "rgba(140,100,0,0.5)";
        bufCtx.stroke();
        bufCtx.restore();
    }
    // ---------- HUD score (#6) ----------
    _drawScoreHud() {
        const score = this.game.score();
        bufCtx.save();
        bufCtx.textBaseline = "middle";
        // Right-aligned "Score" pill at top-right.
        bufCtx.font = "bold 14px " + DrawEngine.UI_FONT;
        bufCtx.fillStyle = "rgba(255,255,255,0.85)";
        bufCtx.textAlign = "right";
        bufCtx.lineWidth = 3;
        bufCtx.strokeStyle = "rgba(0,0,0,0.45)";
        bufCtx.strokeText("SCORE", 380, 18);
        bufCtx.fillText("SCORE", 380, 18);
        bufCtx.font = "bold 32px " + DrawEngine.UI_FONT;
        bufCtx.fillStyle = "#FFFFFF";
        bufCtx.lineWidth = 4;
        bufCtx.strokeStyle = "#3a2a18";
        bufCtx.strokeText(String(score), 380, 44);
        bufCtx.fillText(String(score), 380, 44);
        bufCtx.restore();
    }
    _drawHighScore() {
        const hi = this.game.highScore();
        bufCtx.save();
        bufCtx.textAlign = "center";
        bufCtx.textBaseline = "middle";
        // Banner background.
        const w = 240;
        const h = 70;
        const x = (gScreenX - w) / 2;
        const y = 290;
        bufCtx.fillStyle = "rgba(255, 247, 178, 0.88)";
        this._roundRectPath(x, y, w, h, 14);
        bufCtx.fill();
        bufCtx.lineWidth = 2;
        bufCtx.strokeStyle = "#c9a23a";
        bufCtx.stroke();
        bufCtx.font = "bold 13px " + DrawEngine.UI_FONT;
        bufCtx.fillStyle = "#7a5a10";
        bufCtx.fillText("BEST", gScreenX / 2, y + 16);
        bufCtx.font = "bold 36px " + DrawEngine.UI_FONT;
        bufCtx.fillStyle = "#7a3010";
        bufCtx.lineWidth = 3;
        bufCtx.strokeStyle = "#fff8c8";
        bufCtx.strokeText(String(hi), gScreenX / 2, y + 44);
        bufCtx.fillText(String(hi), gScreenX / 2, y + 44);
        bufCtx.restore();
    }
    // ---------- Hit testing (unchanged) ----------
    getEventCode(x, y) {
        printf("[DrawEngine] getEventCode() ", this.game.state() + " (" + x + ", " + y + ")");
        if (this.game.isIdleState()) {
            const code = this._hitModeButton(x, y);
            if (code !== 0)
                return code;
        }
        else if (this.game.isLevelSelectState()) {
            const code = this._hitLevelSelect(x, y);
            if (code !== 0)
                return code;
        }
        else if (this.game.isGameOverState()) {
            if (this.game.mode() === 1) {
                const code = this._hitPuzzleGameOver(x, y);
                if (code !== 0)
                    return code;
            }
            else {
                const code = this._hitModeButton(x, y);
                if (code !== 0)
                    return code;
            }
        }
        else if (this.game.isPauseState()) {
            const isPuzzle = this.game.mode() === 1;
            const resumeY = isPuzzle ? 120 : 140;
            const resumeHalfH = isPuzzle ? 28 : 32;
            const rbx1 = gStartX + 100 * gScale;
            const rbx2 = gStartX + 300 * gScale;
            const rby1 = (resumeY - resumeHalfH) * gScale;
            const rby2 = (resumeY + resumeHalfH) * gScale;
            if (x > rbx1 && x < rbx2 && y > rby1 && y < rby2)
                return S_KEY;
            if (isPuzzle) {
                // Level Select at (200, 180) ± (95, 22)
                const lbx1 = gStartX + (200 - 95) * gScale;
                const lbx2 = gStartX + (200 + 95) * gScale;
                const lby1 = (180 - 22) * gScale;
                const lby2 = (180 + 22) * gScale;
                if (x > lbx1 && x < lbx2 && y > lby1 && y < lby2)
                    return LEVEL_SELECT_KEY;
            }
            const menuY = isPuzzle ? 240 : 210;
            const mbx1 = gStartX + (200 - 85) * gScale;
            const mbx2 = gStartX + (200 + 85) * gScale;
            const mby1 = (menuY - 22) * gScale;
            const mby2 = (menuY + 22) * gScale;
            if (x > mbx1 && x < mbx2 && y > mby1 && y < mby2)
                return MENU_KEY;
        }
        else if (this.game.isPlayState()) {
            const bx1 = gStartX + 10 * gScale;
            const bx2 = gStartX + 70 * gScale;
            const by1 = 10 * gScale;
            const by2 = 70 * gScale;
            if (x > bx1 && x < bx2 && y > by1 && y < by2)
                return P_KEY;
            if (this._isClickMusicButton(x, y))
                return M_KEY;
        }
        // Flower taps only matter while playing. In other states the previous
        // session's daisies could sit behind menu panels and silently swallow
        // clicks because turnFlower is a no-op outside PLAY.
        if (this.game.isPlayState()) {
            const flowers = this.game.getFlowers();
            for (let i = 0; i < flowers.length; i++) {
                if (flowers[i].is_inside(x, y, gStartX, gScale)) {
                    return i + KEY_0;
                }
            }
        }
        return 0;
    }
    _hitLevelSelect(x, y) {
        // Grid cell hit: emit a synthetic code in the 1001..1100 range encoding
        // the tapped level. main.js routes that to selectAndPlayLevel(level).
        const tapped = this._hitGridCell(x, y);
        if (tapped > 0)
            return DrawEngine.LEVEL_TAP_BASE + tapped;
        // Main Menu at (200, 540) halfW=85 halfH=22
        const mbx1 = gStartX + (200 - 85) * gScale;
        const mbx2 = gStartX + (200 + 85) * gScale;
        const mby1 = (540 - 22) * gScale;
        const mby2 = (540 + 22) * gScale;
        if (x > mbx1 && x < mbx2 && y > mby1 && y < mby2)
            return MENU_KEY;
        return 0;
    }
    // Locate which grid cell contains the (canvas-coord) point. Returns the
    // 1-based level number, or 0 if the click is outside the grid.
    _hitGridCell(x, y) {
        const localX = (x - gStartX) / gScale - DrawEngine.GRID_X;
        const localY = y / gScale - DrawEngine.GRID_Y;
        if (localX < 0 || localY < 0)
            return 0;
        const col = Math.floor(localX / DrawEngine.GRID_CELL_W);
        const row = Math.floor(localY / DrawEngine.GRID_CELL_H);
        if (col < 0 || col >= DrawEngine.GRID_COLS)
            return 0;
        if (row < 0 || row >= DrawEngine.GRID_ROWS)
            return 0;
        return row * DrawEngine.GRID_COLS + col + 1;
    }
    _hitPuzzleGameOver(x, y) {
        const lvl = this.game.puzzleLevel();
        const cfg = Puzzle.levelConfig(lvl);
        const cleared = this.game.score() >= cfg.target;
        const halfW = 95;
        const halfH = 22;
        if (cleared && lvl < Puzzle.MAX_LEVEL) {
            // Next at (200, 250)
            let bx1 = gStartX + (200 - halfW) * gScale;
            let bx2 = gStartX + (200 + halfW) * gScale;
            let by1 = (250 - halfH) * gScale;
            let by2 = (250 + halfH) * gScale;
            if (x > bx1 && x < bx2 && y > by1 && y < by2)
                return NEXT_LEVEL_KEY;
            // Retry at (200, 305)
            by1 = (305 - halfH) * gScale;
            by2 = (305 + halfH) * gScale;
            if (x > bx1 && x < bx2 && y > by1 && y < by2)
                return S_KEY;
        }
        else {
            // Retry at (200, 280)
            const bx1 = gStartX + (200 - halfW) * gScale;
            const bx2 = gStartX + (200 + halfW) * gScale;
            const by1 = (280 - halfH) * gScale;
            const by2 = (280 + halfH) * gScale;
            if (x > bx1 && x < bx2 && y > by1 && y < by2)
                return S_KEY;
        }
        // Main Menu at (200, 380) halfW=85 halfH=22
        const mbx1 = gStartX + (200 - 85) * gScale;
        const mbx2 = gStartX + (200 + 85) * gScale;
        const mby1 = (380 - 22) * gScale;
        const mby2 = (380 + 22) * gScale;
        if (x > mbx1 && x < mbx2 && y > mby1 && y < mby2)
            return MENU_KEY;
        return 0;
    }
    _hitModeButton(x, y) {
        const cx = gScreenX / 2;
        const halfW = DrawEngine.MODE_BTN_HALF_W;
        const halfH = DrawEngine.MODE_BTN_HALF_H;
        for (const m of DrawEngine.MODE_BUTTONS) {
            const bx1 = gStartX + (cx - halfW) * gScale;
            const bx2 = gStartX + (cx + halfW) * gScale;
            const by1 = (m.cy - halfH) * gScale;
            const by2 = (m.cy + halfH) * gScale;
            if (x > bx1 && x < bx2 && y > by1 && y < by2) {
                if (m.mode === 0)
                    return MODE_ARCADE_KEY;
                if (m.mode === 1)
                    return MODE_PUZZLE_KEY;
                return MODE_ENDLESS_KEY;
            }
        }
        return 0;
    }
    _isClickMusicButton(x, y) {
        const bx1 = gStartX + 330 * gScale;
        const bx2 = gStartX + 390 * gScale;
        const by1 = 530 * gScale;
        const by2 = 590 * gScale;
        return x > bx1 && x < bx2 && y > by1 && y < by2;
    }
    // ---------- Flowers (#1 + #2) ----------
    _drawFlowers() {
        // Skip on the level-select screen so the previous session's daisies
        // don't sit behind the panel and intercept clicks aimed at the Play
        // / arrow / Main Menu buttons.
        if (this.game.isLevelSelectState())
            return;
        const flowers = this.game.getFlowers();
        for (let i = 0; i < flowers.length; i++) {
            this._drawFlower(flowers[i]);
        }
    }
    _drawFlower(flower) {
        const small_radius = flower.small_radius();
        // Petals first so they tuck behind the disc.
        for (let i = 0; i < 6; i++) {
            const leaf = flower.leaf[i];
            if (leaf.color() === 0)
                continue;
            const angleDeg = 60 * i;
            const radians = (angleDeg * Math.PI) / 180;
            const distance = flower.radius;
            const px = flower.x + Math.cos(radians) * distance;
            const py = flower.y + Math.sin(radians) * distance;
            if (leaf.isRainbow()) {
                // Rainbow leaves use a grow + fade death animation, so we drive
                // length / width / alpha from life and birth fractions directly.
                const lifeFrac = leaf.get_life_ratio();
                const birthFrac = leaf.get_birth_ratio();
                const dying = !leaf.isAlive() && lifeFrac > 0;
                const scale = dying
                    ? birthFrac * (1 + (1 - lifeFrac) * 0.7)
                    : lifeFrac * birthFrac;
                const alpha = dying ? lifeFrac : 1;
                if (scale <= 0 || alpha <= 0)
                    continue;
                const length = small_radius * 3.4 * scale;
                const width = small_radius * 1.9 * scale;
                this._drawRainbowPetal(px, py, radians, length, width, alpha);
                continue;
            }
            if (leaf.isGolden()) {
                // Gold petal — three render states, all driven from leaf life +
                // the (event-wide) activeGolden tick window:
                //   matched (life < origin)        → regular shrink animation
                //   active in last GOLDEN_DYING_TICKS → grow + fade expiry
                //   active otherwise               → full-size petal
                const ag = this.game.activeGolden();
                const lifeFrac = leaf.get_life_ratio();
                const birthFrac = leaf.get_birth_ratio();
                const matched = !leaf.isAlive() && lifeFrac > 0;
                let scale;
                let alpha;
                if (matched) {
                    scale = lifeFrac * birthFrac;
                    alpha = 1;
                }
                else if (ag && ag.dyingTicks > 0 && ag.ticksLeft <= ag.dyingTicks) {
                    const dyingProg = 1 - Math.max(0, ag.ticksLeft) / ag.dyingTicks;
                    scale = birthFrac * (1 + dyingProg * 0.7);
                    alpha = 1 - dyingProg;
                }
                else {
                    scale = birthFrac;
                    alpha = 1;
                }
                if (scale <= 0 || alpha <= 0)
                    continue;
                const length = small_radius * 3.4 * scale;
                const width = small_radius * 1.9 * scale;
                this._drawGoldenPetal(px, py, radians, length, width, alpha);
                continue;
            }
            const leafSize = leaf.size();
            if (leafSize === 0)
                continue;
            const palette = DrawEngine.PETAL_COLORS[leaf.color()];
            if (!palette)
                continue;
            const lifeRatio = leafSize / small_radius;
            // Bigger petals + position closer to the center so the inner tip tucks
            // under the (now smaller) yellow disc — that's how a real daisy reads.
            const length = small_radius * 3.4 * lifeRatio;
            const width = small_radius * 1.9 * lifeRatio;
            this._drawPetal(px, py, radians, length, width, palette);
        }
        // Smaller yellow daisy disc on top of the petal inner tips.
        this._drawDaisyCenter(flower.x, flower.y, flower.radius, flower.direction());
    }
    _drawPetal(cx, cy, angleRad, length, width, palette) {
        bufCtx.save();
        bufCtx.translate(cx, cy);
        bufCtx.rotate(angleRad);
        const halfL = length / 2;
        const halfW = width / 2;
        const grad = bufCtx.createLinearGradient(-halfL, 0, halfL, 0);
        grad.addColorStop(0.0, palette.dark);
        grad.addColorStop(0.55, palette.base);
        grad.addColorStop(1.0, palette.light);
        bufCtx.beginPath();
        bufCtx.moveTo(-halfL, 0);
        bufCtx.bezierCurveTo(-halfL * 0.4, -halfW * 1.05, halfL * 0.55, -halfW, halfL, 0);
        bufCtx.bezierCurveTo(halfL * 0.55, halfW, -halfL * 0.4, halfW * 1.05, -halfL, 0);
        bufCtx.closePath();
        bufCtx.fillStyle = grad;
        bufCtx.fill();
        bufCtx.lineWidth = 1;
        bufCtx.strokeStyle = palette.outline;
        bufCtx.stroke();
        // Highlight near outer tip.
        bufCtx.beginPath();
        bufCtx.ellipse(halfL * 0.45, -halfW * 0.35, halfL * 0.22, halfW * 0.22, 0, 0, Math.PI * 2);
        bufCtx.fillStyle = "rgba(255,255,255,0.35)";
        bufCtx.fill();
        bufCtx.restore();
    }
    // Rainbow petal: same teardrop path as _drawPetal but filled with a
    // multi-stop spectrum gradient. Caller controls overall alpha for the
    // grow-and-fade death animation.
    _drawRainbowPetal(cx, cy, angleRad, length, width, alpha) {
        bufCtx.save();
        bufCtx.globalAlpha = Math.max(0, Math.min(1, alpha));
        bufCtx.translate(cx, cy);
        bufCtx.rotate(angleRad);
        const halfL = length / 2;
        const halfW = width / 2;
        const grad = bufCtx.createLinearGradient(-halfL, 0, halfL, 0);
        grad.addColorStop(0.00, "#FF6B6B"); // red
        grad.addColorStop(0.20, "#FFA45C"); // orange
        grad.addColorStop(0.38, "#FFD23F"); // yellow
        grad.addColorStop(0.55, "#7DD3A0"); // green
        grad.addColorStop(0.72, "#5BD2F2"); // cyan
        grad.addColorStop(0.86, "#5B7BF2"); // blue
        grad.addColorStop(1.00, "#C18BF7"); // purple
        bufCtx.beginPath();
        bufCtx.moveTo(-halfL, 0);
        bufCtx.bezierCurveTo(-halfL * 0.4, -halfW * 1.05, halfL * 0.55, -halfW, halfL, 0);
        bufCtx.bezierCurveTo(halfL * 0.55, halfW, -halfL * 0.4, halfW * 1.05, -halfL, 0);
        bufCtx.closePath();
        bufCtx.fillStyle = grad;
        bufCtx.fill();
        bufCtx.lineWidth = 1;
        bufCtx.strokeStyle = "rgba(120, 60, 130, 0.45)";
        bufCtx.stroke();
        // Sparkle highlight near the outer tip.
        bufCtx.beginPath();
        bufCtx.ellipse(halfL * 0.45, -halfW * 0.35, halfL * 0.22, halfW * 0.22, 0, 0, Math.PI * 2);
        bufCtx.fillStyle = "rgba(255, 255, 255, 0.55)";
        bufCtx.fill();
        bufCtx.restore();
    }
    // Golden petal — rich amber gradient with a sparkle highlight, used for
    // the timed 9-point bonus event. Caller controls overall alpha for the
    // grow-and-fade expiry animation.
    _drawGoldenPetal(cx, cy, angleRad, length, width, alpha) {
        bufCtx.save();
        bufCtx.globalAlpha = Math.max(0, Math.min(1, alpha));
        bufCtx.translate(cx, cy);
        bufCtx.rotate(angleRad);
        const halfL = length / 2;
        const halfW = width / 2;
        const grad = bufCtx.createLinearGradient(-halfL, 0, halfL, 0);
        grad.addColorStop(0.0, "#8B6508"); // deep amber at the inner tip
        grad.addColorStop(0.45, "#FFC83C");
        grad.addColorStop(0.75, "#FFE56B");
        grad.addColorStop(1.0, "#FFF6A8"); // pale-yellow at the outer tip
        bufCtx.beginPath();
        bufCtx.moveTo(-halfL, 0);
        bufCtx.bezierCurveTo(-halfL * 0.4, -halfW * 1.05, halfL * 0.55, -halfW, halfL, 0);
        bufCtx.bezierCurveTo(halfL * 0.55, halfW, -halfL * 0.4, halfW * 1.05, -halfL, 0);
        bufCtx.closePath();
        bufCtx.fillStyle = grad;
        bufCtx.fill();
        bufCtx.lineWidth = 1.2;
        bufCtx.strokeStyle = "rgba(120, 80, 0, 0.65)";
        bufCtx.stroke();
        // Sparkle highlight near the outer tip.
        bufCtx.beginPath();
        bufCtx.ellipse(halfL * 0.45, -halfW * 0.35, halfL * 0.24, halfW * 0.22, 0, 0, Math.PI * 2);
        bufCtx.fillStyle = "rgba(255, 255, 255, 0.65)";
        bufCtx.fill();
        bufCtx.restore();
    }
    // Painted daisy center — yellow/orange radial gradient + rotation arrow.
    // The disc renders smaller than the flower's hit radius so petals dominate
    // the visual mass (more like a real daisy).
    _drawDaisyCenter(cx, cy, r, direction = 1) {
        const discR = r * 0.6;
        bufCtx.save();
        // White cushion ring behind the disc to lift it off the petals.
        bufCtx.fillStyle = "rgba(255,255,255,0.85)";
        bufCtx.beginPath();
        bufCtx.arc(cx, cy, discR * 1.08, 0, Math.PI * 2);
        bufCtx.fill();
        const grad = bufCtx.createRadialGradient(cx - discR * 0.3, cy - discR * 0.35, discR * 0.1, cx, cy, discR);
        grad.addColorStop(0.0, "#FFF1A8");
        grad.addColorStop(0.55, "#FFC83C");
        grad.addColorStop(1.0, "#D67B0E");
        bufCtx.fillStyle = grad;
        bufCtx.beginPath();
        bufCtx.arc(cx, cy, discR, 0, Math.PI * 2);
        bufCtx.fill();
        // Outline for definition.
        bufCtx.lineWidth = 1.2;
        bufCtx.strokeStyle = "rgba(120,70,0,0.55)";
        bufCtx.stroke();
        // Sheen.
        bufCtx.fillStyle = "rgba(255,255,255,0.45)";
        bufCtx.beginPath();
        bufCtx.ellipse(cx - discR * 0.35, cy - discR * 0.4, discR * 0.32, discR * 0.18, -0.4, 0, Math.PI * 2);
        bufCtx.fill();
        bufCtx.restore();
        // Rotation arrow scaled to the smaller disc.
        this._drawRotationArrow(cx, cy, discR, direction);
    }
    // Rotation indicator drawn inside the daisy center disc.
    // CW: ~180° arc across the top half (9 o'clock → 12 → 3), arrow tip
    // descending past 3 o'clock to show the CW direction.
    // CCW: same shape mirrored horizontally — arrow tip descends past
    // 9 o'clock instead.
    _drawRotationArrow(cx, cy, discRadius, direction = 1) {
        bufCtx.save();
        bufCtx.translate(cx, cy);
        if (direction === -1)
            bufCtx.scale(-1, 1);
        const r = discRadius * 0.5;
        const startAng = Math.PI; // 180° canvas = 9 o'clock
        const endAng = 0; // 0° canvas   = 3 o'clock
        const headSize = discRadius * 0.32;
        const tipAng = endAng + 0.5;
        const tipX = Math.cos(tipAng) * r;
        const tipY = Math.sin(tipAng) * r;
        const baseInX = Math.cos(endAng) * (r - headSize / 2);
        const baseInY = Math.sin(endAng) * (r - headSize / 2);
        const baseOutX = Math.cos(endAng) * (r + headSize / 2);
        const baseOutY = Math.sin(endAng) * (r + headSize / 2);
        bufCtx.lineCap = "round";
        bufCtx.lineJoin = "round";
        // White halo for contrast over the yellow disc.
        bufCtx.strokeStyle = "rgba(255,255,255,0.9)";
        bufCtx.fillStyle = "rgba(255,255,255,0.9)";
        bufCtx.lineWidth = Math.max(2.6, discRadius * 0.18);
        bufCtx.beginPath();
        bufCtx.arc(0, 0, r, startAng, endAng, false);
        bufCtx.stroke();
        bufCtx.beginPath();
        bufCtx.moveTo(tipX, tipY);
        bufCtx.lineTo(baseInX, baseInY);
        bufCtx.lineTo(baseOutX, baseOutY);
        bufCtx.closePath();
        bufCtx.stroke();
        bufCtx.fill();
        // Color-coded arrow on top — red for CW, blue for CCW so the player can
        // tell the two flower types apart at a glance.
        const arrowColor = DrawEngine.arrowColorFor(direction);
        bufCtx.strokeStyle = arrowColor;
        bufCtx.fillStyle = arrowColor;
        bufCtx.lineWidth = Math.max(1.4, discRadius * 0.09);
        bufCtx.beginPath();
        bufCtx.arc(0, 0, r, startAng, endAng, false);
        bufCtx.stroke();
        bufCtx.beginPath();
        bufCtx.moveTo(tipX, tipY);
        bufCtx.lineTo(baseInX, baseInY);
        bufCtx.lineTo(baseOutX, baseOutY);
        bufCtx.closePath();
        bufCtx.fill();
        bufCtx.restore();
    }
    // ---------- Effects rendering (#3, #4, #5) ----------
    _drawParticles() {
        if (Effects.particles.length === 0)
            return;
        bufCtx.save();
        for (const p of Effects.particles) {
            const t = p.life / p.maxLife;
            bufCtx.globalAlpha = Math.max(0, t);
            bufCtx.fillStyle = p.color;
            bufCtx.beginPath();
            bufCtx.arc(p.x, p.y, p.size * (0.6 + t * 0.6), 0, Math.PI * 2);
            bufCtx.fill();
        }
        bufCtx.restore();
    }
    _drawPopups() {
        if (Effects.popups.length === 0)
            return;
        bufCtx.save();
        bufCtx.textAlign = "center";
        bufCtx.textBaseline = "middle";
        bufCtx.font = "bold 22px " + DrawEngine.UI_FONT;
        for (const p of Effects.popups) {
            const t = p.life / p.maxLife;
            bufCtx.globalAlpha = Math.max(0, Math.min(1, t * 1.3));
            bufCtx.lineWidth = 3;
            bufCtx.strokeStyle = "rgba(0,0,0,0.55)";
            bufCtx.strokeText(p.text, p.x, p.y);
            bufCtx.fillStyle = "#FFF6A8";
            bufCtx.fillText(p.text, p.x, p.y);
        }
        bufCtx.restore();
    }
    _drawCallouts() {
        if (Effects.callouts.length === 0)
            return;
        bufCtx.save();
        bufCtx.textAlign = "center";
        bufCtx.textBaseline = "middle";
        for (const c of Effects.callouts) {
            const t = c.life / c.maxLife; // 1 -> 0
            const easeIn = 1 - Math.pow(1 - (1 - t), 3);
            // Scale: pop in (0.7→1.1), settle, then shrink out slightly.
            let scale;
            if (1 - t < 0.25) {
                scale = 0.7 + (1 - t) * 1.6; // 0.7 → 1.1
            }
            else if (t < 0.25) {
                scale = 1.0 + t * 0.4;
            }
            else {
                scale = 1.05;
            }
            const alpha = t < 0.25 ? t * 4 : 1;
            const cx = gScreenX / 2;
            // Combo callouts ride above the regular "Daisy Chain!" banner so a
            // chain that simultaneously empties a flower can show both cleanly.
            const isPower = c.kind === "power";
            const isCombo = c.kind === "combo";
            const cy = isCombo ? 160 : 200;
            bufCtx.globalAlpha = alpha;
            bufCtx.translate(cx, cy);
            bufCtx.scale(scale, scale);
            const fontSize = isPower ? 38 : isCombo ? 36 : 30;
            bufCtx.font = "bold " + fontSize + "px " + DrawEngine.TITLE_FONT;
            const grad = bufCtx.createLinearGradient(0, -fontSize / 2, 0, fontSize / 2);
            if (isPower) {
                grad.addColorStop(0, "#FFD86F");
                grad.addColorStop(1, "#E84393");
            }
            else if (isCombo) {
                // Warm gold → coral so the multiplier reads as a "hot streak"
                // dopamine hit, distinct from the pink/white flower-clear banner.
                grad.addColorStop(0, "#FFE56B");
                grad.addColorStop(1, "#E25E2A");
            }
            else {
                grad.addColorStop(0, "#FFFFFF");
                grad.addColorStop(1, "#FFB6C1");
            }
            bufCtx.lineWidth = 6;
            bufCtx.strokeStyle = "rgba(80,30,60,0.85)";
            bufCtx.strokeText(c.text, 0, 0);
            bufCtx.fillStyle = grad;
            bufCtx.fillText(c.text, 0, 0);
            bufCtx.setTransform(1, 0, 0, 1, 0, 0);
            // Re-apply translate/scale resets so next callout starts clean.
            void easeIn; // currently unused but kept for future easing.
        }
        bufCtx.restore();
    }
    // ---------- Mascot bee (#9) ----------
    _updateMascot() {
        if (!this.game.isPlayState()) {
            this._bee.active = false;
            this._bee.cooldown = 120;
            return;
        }
        if (!this._bee.active) {
            this._bee.cooldown--;
            if (this._bee.cooldown <= 0) {
                this._bee.active = true;
                this._bee.x = -40;
                this._bee.baseY = 70 + Math.random() * 160;
                this._bee.vx = 1.0 + Math.random() * 1.2;
                this._bee.frame = 0;
            }
            return;
        }
        this._bee.x += this._bee.vx;
        this._bee.frame++;
        if (this._bee.x > gScreenX + 40) {
            this._bee.active = false;
            this._bee.cooldown = 240 + Math.floor(Math.random() * 360);
        }
    }
    _drawMascot() {
        if (!this._bee.active)
            return;
        const x = this._bee.x;
        const y = this._bee.baseY + Math.sin(this._bee.frame * 0.18) * 8;
        bufCtx.save();
        bufCtx.translate(x, y);
        // Wings (flap).
        const flap = Math.abs(Math.sin(this._bee.frame * 0.7));
        bufCtx.fillStyle = "rgba(255,255,255,0.7)";
        bufCtx.strokeStyle = "rgba(120,120,140,0.7)";
        bufCtx.lineWidth = 1;
        bufCtx.beginPath();
        bufCtx.ellipse(-2, -8, 6, 9 + flap * 3, -0.3, 0, Math.PI * 2);
        bufCtx.fill();
        bufCtx.stroke();
        bufCtx.beginPath();
        bufCtx.ellipse(5, -8, 6, 9 + flap * 3, 0.3, 0, Math.PI * 2);
        bufCtx.fill();
        bufCtx.stroke();
        // Body.
        const body = bufCtx.createLinearGradient(0, -6, 0, 6);
        body.addColorStop(0, "#FFE066");
        body.addColorStop(1, "#E0A415");
        bufCtx.fillStyle = body;
        bufCtx.beginPath();
        bufCtx.ellipse(0, 0, 13, 8, 0, 0, Math.PI * 2);
        bufCtx.fill();
        bufCtx.lineWidth = 1.2;
        bufCtx.strokeStyle = "#7a4a00";
        bufCtx.stroke();
        // Stripes.
        bufCtx.fillStyle = "#2a2a2a";
        bufCtx.beginPath();
        bufCtx.ellipse(-3, 0, 1.6, 6, 0, 0, Math.PI * 2);
        bufCtx.fill();
        bufCtx.beginPath();
        bufCtx.ellipse(3, 0, 1.6, 6, 0, 0, Math.PI * 2);
        bufCtx.fill();
        // Eye + smile.
        bufCtx.fillStyle = "#000";
        bufCtx.beginPath();
        bufCtx.arc(8, -1, 1.5, 0, Math.PI * 2);
        bufCtx.fill();
        bufCtx.strokeStyle = "#000";
        bufCtx.lineWidth = 1;
        bufCtx.beginPath();
        bufCtx.arc(9, 2, 2, 0.1, Math.PI - 0.1);
        bufCtx.stroke();
        // Antennae.
        bufCtx.beginPath();
        bufCtx.moveTo(7, -5);
        bufCtx.quadraticCurveTo(11, -10, 13, -11);
        bufCtx.moveTo(9, -5);
        bufCtx.quadraticCurveTo(13, -8, 16, -8);
        bufCtx.stroke();
        bufCtx.restore();
    }
    // ---------- Shape helpers ----------
    _roundRectPath(x, y, w, h, r) {
        const radius = Math.min(r, w / 2, h / 2);
        bufCtx.beginPath();
        bufCtx.moveTo(x + radius, y);
        bufCtx.lineTo(x + w - radius, y);
        bufCtx.quadraticCurveTo(x + w, y, x + w, y + radius);
        bufCtx.lineTo(x + w, y + h - radius);
        bufCtx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        bufCtx.lineTo(x + radius, y + h);
        bufCtx.quadraticCurveTo(x, y + h, x, y + h - radius);
        bufCtx.lineTo(x, y + radius);
        bufCtx.quadraticCurveTo(x, y, x + radius, y);
        bufCtx.closePath();
    }
}
// Pastel petal palette indexed by Leaf.color() (1..7). Index 0 = empty.
DrawEngine.PETAL_COLORS = [
    null,
    { base: "#FFFFFF", light: "#FFFFFF", dark: "#E8E0E8", outline: "rgba(120,90,110,0.35)" },
    { base: "#FFB6C1", light: "#FFD6DD", dark: "#E68A99", outline: "rgba(140,40,70,0.35)" },
    { base: "#B3B3FF", light: "#D6D6FF", dark: "#8A8AE6", outline: "rgba(60,40,140,0.35)" },
    { base: "#87CEEB", light: "#B6E2F2", dark: "#5FA9CC", outline: "rgba(30,80,140,0.35)" },
    { base: "#FFE94D", light: "#FFF6A8", dark: "#E6C200", outline: "rgba(140,100,0,0.35)" },
    { base: "#90EE90", light: "#C2F5C2", dark: "#5FCB5F", outline: "rgba(20,100,40,0.35)" },
    { base: "#FFA559", light: "#FFC993", dark: "#E07F1F", outline: "rgba(140,60,0,0.35)" },
];
// Per-slot palettes for the puzzle timer petal stack (12 slots, slot 0 =
// bottom). Single warm coral hue, lightened toward white at higher slots
// so the stack reads top-pale → bottom-deep. Pre-computed once at class
// load so the draw loop just indexes — no per-frame string allocation.
DrawEngine.PUZZLE_TIMER_PALETTES = (() => {
    const N = 12;
    const MAX_LIGHTEN = 0.7;
    const baseRGB = [220, 79, 44]; // #DC4F2C
    const lightRGB = [255, 171, 133]; // #FFAB85
    const darkRGB = [142, 42, 20]; // #8E2A14
    const lerp = (c, t) => {
        const r = Math.round(c[0] + (255 - c[0]) * t);
        const g = Math.round(c[1] + (255 - c[1]) * t);
        const b = Math.round(c[2] + (255 - c[2]) * t);
        return `rgb(${r}, ${g}, ${b})`;
    };
    const out = [];
    for (let i = 0; i < N; i++) {
        // i=0 (bottom) → t=0 (full saturation). i=N-1 (top) → t=MAX_LIGHTEN.
        const t = (i / (N - 1)) * MAX_LIGHTEN;
        out.push({
            base: lerp(baseRGB, t),
            light: lerp(lightRGB, t),
            dark: lerp(darkRGB, t),
            outline: "rgba(120, 40, 20, 0.55)",
        });
    }
    return out;
})();
// Body font stacks shared across HUD/title.
DrawEngine.UI_FONT = '"Trebuchet MS", "Segoe UI", Verdana, sans-serif';
DrawEngine.TITLE_FONT = '"Brush Script MT", "Lucida Handwriting", "Comic Sans MS", cursive';
DrawEngine.EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","EmojiOne Color","Twemoji Mozilla",sans-serif';
// Mode-select buttons drawn on idle / game-over screens.
// (mode IDs mirror values.js: arcade=0, puzzle=1, endless=2.)
DrawEngine.MODE_BUTTONS = [
    { mode: 0, label: "Arcade", glyph: "\u23F1\uFE0F", top: "#FFB179", bot: "#E25E2A", cy: 128 }, // ⏱️
    { mode: 1, label: "Puzzle", glyph: "\u{1F9E9}", top: "#A6BFF7", bot: "#5C7DD6", cy: 180 }, // 🧩
    { mode: 2, label: "Endless", glyph: "\u267E\uFE0F", top: "#A6E0A6", bot: "#3F9E5C", cy: 232 }, // ♾️
];
DrawEngine.MODE_BTN_HALF_W = 110;
DrawEngine.MODE_BTN_HALF_H = 24;
// Rotation arrow palette. Pulled out of _drawRotationArrow so unit tests
// can pin the color contract without exercising the canvas pipeline.
DrawEngine.ARROW_COLOR_CW = "#D6303A";
DrawEngine.ARROW_COLOR_CCW = "#1F6FE0";
// ---------- Level select grid (10 × 10) ----------
// Grid layout in logical coords (400 × 600 buffer).
DrawEngine.GRID_X = 20;
DrawEngine.GRID_Y = 100;
DrawEngine.GRID_COLS = 10;
DrawEngine.GRID_ROWS = 10;
DrawEngine.GRID_CELL_W = 36;
DrawEngine.GRID_CELL_H = 40;
DrawEngine.LEVEL_TAP_BASE = 1000;
