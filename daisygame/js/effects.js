"use strict";
class Effects {
    static colorFor(idx) {
        return Effects.PARTICLE_COLOR[idx] ?? "#FFFFFF";
    }
    static popScore(x, y, value, color = "#3a2a18") {
        if (value <= 0)
            return;
        if (Effects.popups.length >= Effects.MAX_POPUPS)
            Effects.popups.shift();
        Effects.popups.push({
            x,
            y,
            text: "+" + value,
            life: 32,
            maxLife: 32,
            color,
        });
    }
    static callout(text, kind) {
        if (Effects.callouts.length >= Effects.MAX_CALLOUTS)
            Effects.callouts.shift();
        Effects.callouts.push({
            text,
            kind,
            life: 60,
            maxLife: 60,
        });
    }
    static burst(x, y, color, count = 7) {
        for (let i = 0; i < count; i++) {
            if (Effects.particles.length >= Effects.MAX_PARTICLES)
                Effects.particles.shift();
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
    static tick() {
        for (let i = Effects.popups.length - 1; i >= 0; i--) {
            const p = Effects.popups[i];
            p.y -= 0.9;
            p.life--;
            if (p.life <= 0)
                Effects.popups.splice(i, 1);
        }
        for (let i = Effects.callouts.length - 1; i >= 0; i--) {
            const c = Effects.callouts[i];
            c.life--;
            if (c.life <= 0)
                Effects.callouts.splice(i, 1);
        }
        for (let i = Effects.particles.length - 1; i >= 0; i--) {
            const p = Effects.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.18;
            p.vx *= 0.97;
            p.life--;
            if (p.life <= 0)
                Effects.particles.splice(i, 1);
        }
    }
    static reset() {
        Effects.popups = [];
        Effects.callouts = [];
        Effects.particles = [];
    }
}
Effects.popups = [];
Effects.callouts = [];
Effects.particles = [];
Effects.MAX_POPUPS = 8;
Effects.MAX_PARTICLES = 80;
Effects.MAX_CALLOUTS = 3;
// Pastel particle colors keyed by Leaf.color() index 1..7.
Effects.PARTICLE_COLOR = [
    "#FFFFFF", // 0 unused
    "#FFFFFF", // 1 white
    "#FFB6C1", // 2 pink
    "#B3B3FF", // 3 purple
    "#87CEEB", // 4 sky
    "#FFE94D", // 5 yellow
    "#90EE90", // 6 green
    "#FFA559", // 7 orange (used at high puzzle levels)
];
