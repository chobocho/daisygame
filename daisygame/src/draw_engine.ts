interface PetalColor {
  base: string;
  light: string;
  dark: string;
  outline: string;
}

interface BeeState {
  active: boolean;
  x: number;
  baseY: number;
  vx: number;
  frame: number;
  cooldown: number;
}

class DrawEngine {
  private game: DaisyGameLike;
  private _image_res: LoadedImages;
  private background_image!: number;
  private background!: HTMLImageElement[];
  private _frame: number = 0;
  private _bee: BeeState = {
    active: false,
    x: -50,
    baseY: 120,
    vx: 1.4,
    frame: 0,
    cooldown: 90,
  };

  // Pastel petal palette indexed by Leaf.color() (1..6). Index 0 = empty.
  private static readonly PETAL_COLORS: ReadonlyArray<PetalColor | null> = [
    null,
    { base: "#FFFFFF", light: "#FFFFFF", dark: "#E8E0E8", outline: "rgba(120,90,110,0.35)" },
    { base: "#FFB6C1", light: "#FFD6DD", dark: "#E68A99", outline: "rgba(140,40,70,0.35)" },
    { base: "#B3B3FF", light: "#D6D6FF", dark: "#8A8AE6", outline: "rgba(60,40,140,0.35)" },
    { base: "#87CEEB", light: "#B6E2F2", dark: "#5FA9CC", outline: "rgba(30,80,140,0.35)" },
    { base: "#FFE94D", light: "#FFF6A8", dark: "#E6C200", outline: "rgba(140,100,0,0.35)" },
    { base: "#90EE90", light: "#C2F5C2", dark: "#5FCB5F", outline: "rgba(20,100,40,0.35)" },
  ];

  // Body font stacks shared across HUD/title.
  private static readonly UI_FONT = '"Trebuchet MS", "Segoe UI", Verdana, sans-serif';
  private static readonly TITLE_FONT = '"Brush Script MT", "Lucida Handwriting", "Comic Sans MS", cursive';

  constructor(game: DaisyGameLike, images: ImageLoaderLike) {
    this.game = game;
    this._image_res = images.images;
    this._InitValue();
    this._LoadImage();
  }

  private _InitValue(): void {
    this.background_image = 0;
  }

  private _LoadImage(): void {
    this.background = [this._image_res.background];
    printf("[DrawEngine]", "_LoadImage");
  }

  OnDraw(): void {
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

  private _drawBackground(): void {
    bufCtx.drawImage(this.background[this.background_image], 0, 0, gScreenX, gScreenY);
    this._drawClouds();
    this._drawGrass();
  }

  private _drawClouds(): void {
    bufCtx.save();
    bufCtx.globalAlpha = 0.55;
    bufCtx.fillStyle = "#FFFFFF";
    const t = this._frame * 0.05;
    const clouds: ReadonlyArray<{ x: number; y: number; r: number }> = [
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

  private _drawGrass(): void {
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

  private _drawButton(): void {
    if (this.game.isIdleState()) {
      this._drawWordmark("Crazy Daisy");
      this._drawPlayButton(200, 134, 105, 34);
      this._drawHint("Tap a daisy to spin its petals");
      this._drawHighScore();
    } else if (this.game.isPauseState()) {
      this._drawWordmark("Paused");
      this._drawPlayButton(200, 150, 100, 32, "Resume");
      this._drawHint("Tap Resume to continue");
      this._drawHighScore();
    } else if (this.game.isGameOverState()) {
      this._drawWordmark("Game Over");
      this._drawPlayButton(200, 134, 105, 34, "Play");
      this._drawHint("Try again?");
      this._drawHighScore();
    } else if (this.game.isPlayState()) {
      this._drawIconButton(40, 40, 26, "pause");
      this._drawIconButton(360, 560, 26, this.game.isPlayMusic() ? "music" : "mute");
    }
  }

  // Painted rounded-rect "Play / Resume" button with glyph (#10).
  // Hit box (kept to match getEventCode):
  //   idle/gameover: x=95..305, y=100..214  (so center≈200, width=210, height=114)
  //   pause:         x=100..300, y=100..200 (so center≈200, width=200, height=100)
  private _drawPlayButton(cx: number, cy: number, halfW: number, halfH: number, label: string = "Play"): void {
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

    // Triangle play glyph.
    bufCtx.fillStyle = "#5b2f0a";
    bufCtx.beginPath();
    const tx = cx - 22;
    bufCtx.moveTo(tx, cy - 12);
    bufCtx.lineTo(tx + 18, cy);
    bufCtx.lineTo(tx, cy + 12);
    bufCtx.closePath();
    bufCtx.fill();

    // Label.
    bufCtx.font = "bold 22px " + DrawEngine.UI_FONT;
    bufCtx.textAlign = "left";
    bufCtx.textBaseline = "middle";
    bufCtx.fillStyle = "#5b2f0a";
    bufCtx.fillText(label, cx - 2, cy + 1);

    bufCtx.restore();
  }

  // Painted circular icon button used for pause/music/mute (#10).
  // Hit box stays at the original 60x60 region centered on (cx, cy).
  private _drawIconButton(cx: number, cy: number, radius: number, kind: "pause" | "music" | "mute"): void {
    bufCtx.save();
    bufCtx.fillStyle = "rgba(0,0,0,0.18)";
    bufCtx.beginPath();
    bufCtx.arc(cx + 1.5, cy + 2.5, radius, 0, Math.PI * 2);
    bufCtx.fill();

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

    bufCtx.fillStyle = "#5b2f0a";
    bufCtx.lineWidth = 3;
    bufCtx.strokeStyle = "#5b2f0a";
    if (kind === "pause") {
      bufCtx.fillRect(cx - 9, cy - 10, 6, 20);
      bufCtx.fillRect(cx + 3, cy - 10, 6, 20);
    } else if (kind === "music") {
      // Note head + stem.
      bufCtx.beginPath();
      bufCtx.ellipse(cx - 4, cy + 7, 5, 4, -0.3, 0, Math.PI * 2);
      bufCtx.fill();
      bufCtx.beginPath();
      bufCtx.moveTo(cx + 1, cy + 6);
      bufCtx.lineTo(cx + 1, cy - 11);
      bufCtx.lineTo(cx + 10, cy - 8);
      bufCtx.stroke();
    } else {
      // Speaker + slash for mute.
      bufCtx.beginPath();
      bufCtx.moveTo(cx - 9, cy - 4);
      bufCtx.lineTo(cx - 3, cy - 4);
      bufCtx.lineTo(cx + 4, cy - 10);
      bufCtx.lineTo(cx + 4, cy + 10);
      bufCtx.lineTo(cx - 3, cy + 4);
      bufCtx.lineTo(cx - 9, cy + 4);
      bufCtx.closePath();
      bufCtx.fill();
      bufCtx.lineWidth = 2.5;
      bufCtx.beginPath();
      bufCtx.moveTo(cx + 8, cy - 7);
      bufCtx.lineTo(cx + 14, cy + 7);
      bufCtx.stroke();
    }

    bufCtx.restore();
  }

  // ---------- Title / hint / high-score (#7, #6) ----------

  private _drawWordmark(text: string): void {
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

  private _drawHint(text: string): void {
    bufCtx.save();
    bufCtx.font = "italic 16px " + DrawEngine.UI_FONT;
    bufCtx.textAlign = "center";
    bufCtx.textBaseline = "middle";
    bufCtx.fillStyle = "rgba(255,255,255,0.92)";
    bufCtx.lineWidth = 3;
    bufCtx.strokeStyle = "rgba(0,0,0,0.45)";
    bufCtx.strokeText(text, 200, 230);
    bufCtx.fillText(text, 200, 230);
    bufCtx.restore();
  }

  // Decorative small daisy used by the wordmark.
  private _drawTinyDaisy(cx: number, cy: number, r: number, centerColor: string, petalColor: string): void {
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

  private _drawScoreHud(): void {
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

  private _drawHighScore(): void {
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

  getEventCode(x: number, y: number): number {
    printf("[DrawEngine] getEventCode() ", this.game.state() + " (" + x + ", " + y + ")");
    if (this.game.isIdleState()) {
      const bx1 = gStartX + 95 * gScale;
      const bx2 = gStartX + (95 + 210) * gScale;
      const by1 = 100 * gScale;
      const by2 = (100 + 163 * 0.7) * gScale;
      if (x > bx1 && x < bx2 && y > by1 && y < by2) return S_KEY;
    } else if (this.game.isPauseState()) {
      const bx1 = gStartX + 100 * gScale;
      const bx2 = gStartX + 300 * gScale;
      const by1 = 100 * gScale;
      const by2 = 200 * gScale;
      if (x > bx1 && x < bx2 && y > by1 && y < by2) return S_KEY;
    } else if (this.game.isGameOverState()) {
      const bx1 = gStartX + 95 * gScale;
      const bx2 = gStartX + (95 + 210) * gScale;
      const by1 = 100 * gScale;
      const by2 = (100 + 163 * 0.7) * gScale;
      if (x > bx1 && x < bx2 && y > by1 && y < by2) return S_KEY;
    } else if (this.game.isPlayState()) {
      const bx1 = gStartX + 10 * gScale;
      const bx2 = gStartX + 70 * gScale;
      const by1 = 10 * gScale;
      const by2 = 70 * gScale;
      if (x > bx1 && x < bx2 && y > by1 && y < by2) return P_KEY;
      if (this._isClickMusicButton(x, y)) return M_KEY;
    }

    const flowers = this.game.getFlowers();
    for (let i = 0; i < 7; i++) {
      if (flowers[i].is_inside(x, y, gStartX, gScale)) {
        return i + KEY_0;
      }
    }
    return 0;
  }

  private _isClickMusicButton(x: number, y: number): boolean {
    const bx1 = gStartX + 330 * gScale;
    const bx2 = gStartX + 390 * gScale;
    const by1 = 530 * gScale;
    const by2 = 590 * gScale;
    return x > bx1 && x < bx2 && y > by1 && y < by2;
  }

  // ---------- Flowers (#1 + #2) ----------

  private _drawFlowers(): void {
    const flowers = this.game.getFlowers();
    for (let i = 0; i < 7; i++) {
      this._drawFlower(flowers[i]);
    }
  }

  private _drawFlower(flower: FlowerLike): void {
    const small_radius = flower.small_radius();

    // Petals first so they tuck behind the disc.
    for (let i = 0; i < 6; i++) {
      const leaf = flower.leaf[i];
      const leafSize = leaf.size();
      if (leafSize === 0) continue;

      const palette = DrawEngine.PETAL_COLORS[leaf.color()];
      if (!palette) continue;

      const lifeRatio = leafSize / small_radius;
      const length = small_radius * 2.4 * lifeRatio;
      const width = small_radius * 1.5 * lifeRatio;

      const angleDeg = 60 * i;
      const radians = (angleDeg * Math.PI) / 180;
      const distance = flower.radius + small_radius;
      const px = flower.x + Math.cos(radians) * distance;
      const py = flower.y + Math.sin(radians) * distance;

      this._drawPetal(px, py, radians, length, width, palette);
    }

    // Yellow daisy disc (#2).
    this._drawDaisyCenter(flower.x, flower.y, flower.radius);
  }

  private _drawPetal(
    cx: number,
    cy: number,
    angleRad: number,
    length: number,
    width: number,
    palette: PetalColor,
  ): void {
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

  // Painted daisy center — yellow/orange radial gradient + freckle texture (#2).
  private _drawDaisyCenter(cx: number, cy: number, r: number): void {
    bufCtx.save();
    // White cushion ring behind the disc to lift it off the petals.
    bufCtx.fillStyle = "rgba(255,255,255,0.85)";
    bufCtx.beginPath();
    bufCtx.arc(cx, cy, r * 1.05, 0, Math.PI * 2);
    bufCtx.fill();

    const grad = bufCtx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
    grad.addColorStop(0.0, "#FFF1A8");
    grad.addColorStop(0.55, "#FFC83C");
    grad.addColorStop(1.0, "#D67B0E");
    bufCtx.fillStyle = grad;
    bufCtx.beginPath();
    bufCtx.arc(cx, cy, r * 0.95, 0, Math.PI * 2);
    bufCtx.fill();

    // Outline for definition.
    bufCtx.lineWidth = 1.2;
    bufCtx.strokeStyle = "rgba(120,70,0,0.55)";
    bufCtx.stroke();

    // Freckle texture (deterministic per center using a tiny LCG).
    let seed = (Math.floor(cx) * 73856093) ^ (Math.floor(cy) * 19349663);
    const next = () => {
      seed = (seed * 1664525 + 1013904223) | 0;
      return ((seed >>> 0) % 10000) / 10000;
    };
    bufCtx.fillStyle = "rgba(140,80,10,0.55)";
    const freckles = 14;
    for (let i = 0; i < freckles; i++) {
      const a = next() * Math.PI * 2;
      const rr = next() * r * 0.7;
      const fx = cx + Math.cos(a) * rr;
      const fy = cy + Math.sin(a) * rr;
      const sz = 0.7 + next() * 0.9;
      bufCtx.beginPath();
      bufCtx.arc(fx, fy, sz, 0, Math.PI * 2);
      bufCtx.fill();
    }

    // Sheen.
    bufCtx.fillStyle = "rgba(255,255,255,0.45)";
    bufCtx.beginPath();
    bufCtx.ellipse(cx - r * 0.35, cy - r * 0.4, r * 0.3, r * 0.18, -0.4, 0, Math.PI * 2);
    bufCtx.fill();

    bufCtx.restore();
  }

  // ---------- Effects rendering (#3, #4, #5) ----------

  private _drawParticles(): void {
    if (Effects.particles.length === 0) return;
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

  private _drawPopups(): void {
    if (Effects.popups.length === 0) return;
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

  private _drawCallouts(): void {
    if (Effects.callouts.length === 0) return;
    bufCtx.save();
    bufCtx.textAlign = "center";
    bufCtx.textBaseline = "middle";
    for (const c of Effects.callouts) {
      const t = c.life / c.maxLife; // 1 -> 0
      const easeIn = 1 - Math.pow(1 - (1 - t), 3);
      // Scale: pop in (0.7→1.1), settle, then shrink out slightly.
      let scale: number;
      if (1 - t < 0.25) {
        scale = 0.7 + (1 - t) * 1.6; // 0.7 → 1.1
      } else if (t < 0.25) {
        scale = 1.0 + t * 0.4;
      } else {
        scale = 1.05;
      }
      const alpha = t < 0.25 ? t * 4 : 1;
      const cx = gScreenX / 2;
      const cy = 200;

      bufCtx.globalAlpha = alpha;
      bufCtx.translate(cx, cy);
      bufCtx.scale(scale, scale);

      const isPower = c.kind === "power";
      const fontSize = isPower ? 38 : 30;
      bufCtx.font = "bold " + fontSize + "px " + DrawEngine.TITLE_FONT;

      const grad = bufCtx.createLinearGradient(0, -fontSize / 2, 0, fontSize / 2);
      if (isPower) {
        grad.addColorStop(0, "#FFD86F");
        grad.addColorStop(1, "#E84393");
      } else {
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

  private _updateMascot(): void {
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

  private _drawMascot(): void {
    if (!this._bee.active) return;
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

  private _roundRectPath(x: number, y: number, w: number, h: number, r: number): void {
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
