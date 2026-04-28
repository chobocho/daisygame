interface ScorePopup {
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
  color: string;
}

interface Callout {
  text: string;
  kind: "chain" | "power";
  life: number;
  maxLife: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

class Effects {
  static popups: ScorePopup[] = [];
  static callouts: Callout[] = [];
  static particles: Particle[] = [];

  static readonly MAX_POPUPS = 8;
  static readonly MAX_PARTICLES = 80;
  static readonly MAX_CALLOUTS = 3;

  // Pastel particle colors keyed by Leaf.color() index 1..7.
  private static readonly PARTICLE_COLOR: ReadonlyArray<string> = [
    "#FFFFFF", // 0 unused
    "#FFFFFF", // 1 white
    "#FFB6C1", // 2 pink
    "#B3B3FF", // 3 purple
    "#87CEEB", // 4 sky
    "#FFE94D", // 5 yellow
    "#90EE90", // 6 green
    "#FFA559", // 7 orange (used at high puzzle levels)
  ];

  static colorFor(idx: number): string {
    return Effects.PARTICLE_COLOR[idx] ?? "#FFFFFF";
  }

  static popScore(x: number, y: number, value: number, color: string = "#3a2a18"): void {
    if (value <= 0) return;
    if (Effects.popups.length >= Effects.MAX_POPUPS) Effects.popups.shift();
    Effects.popups.push({
      x,
      y,
      text: "+" + value,
      life: 32,
      maxLife: 32,
      color,
    });
  }

  static callout(text: string, kind: "chain" | "power"): void {
    if (Effects.callouts.length >= Effects.MAX_CALLOUTS) Effects.callouts.shift();
    Effects.callouts.push({
      text,
      kind,
      life: 60,
      maxLife: 60,
    });
  }

  static burst(x: number, y: number, color: string, count: number = 7): void {
    for (let i = 0; i < count; i++) {
      if (Effects.particles.length >= Effects.MAX_PARTICLES) Effects.particles.shift();
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2.5;
      Effects.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.6,
        life: 18,
        maxLife: 18,
        color,
        size: 2 + Math.random() * 2,
      });
    }
  }

  static tick(): void {
    for (let i = Effects.popups.length - 1; i >= 0; i--) {
      const p = Effects.popups[i];
      p.y -= 0.9;
      p.life--;
      if (p.life <= 0) Effects.popups.splice(i, 1);
    }
    for (let i = Effects.callouts.length - 1; i >= 0; i--) {
      const c = Effects.callouts[i];
      c.life--;
      if (c.life <= 0) Effects.callouts.splice(i, 1);
    }
    for (let i = Effects.particles.length - 1; i >= 0; i--) {
      const p = Effects.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18;
      p.vx *= 0.97;
      p.life--;
      if (p.life <= 0) Effects.particles.splice(i, 1);
    }
  }

  static reset(): void {
    Effects.popups = [];
    Effects.callouts = [];
    Effects.particles = [];
  }
}
