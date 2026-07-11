import { teams } from "../data/teams";
import { flagUrl } from "../utils/flags";
import type { Team } from "../types";

/**
 * Arcade Soccer — retro pixel-art 4v4 arcade match (subpage /soccer).
 *
 * 16-bit inspired, all assets original: the world simulates at a 640×400
 * internal resolution and the canvas upscales with `image-rendering:
 * pixelated`. Structured into Input / FX / Ball / Player / Game classes.
 *
 * Controls: WASD/arrows move · Shift sprint (stamina) · J pass, or a sliding
 * tackle when you don't have the ball (knocks the carrier down!) · K shoot —
 * holding possession fills the FIRE meter for a blazing super shot · P pause.
 * Touch: left-half joystick + SPRINT/PASS/SHOOT buttons.
 *
 * Debug helpers (not linked in the UI): ?t=SECONDS match length, ?auto=1 full
 * AI, window.__soccerTick(frames) fixed-step simulation for testing.
 */

/* ================= World constants (pixel units, 60 fps frames) ========== */

const W = 640;
const H = 400;
const FIELD = { left: 32, right: 608, top: 42, bottom: 394 };
const MOUTH = { top: 170, bottom: 266 };
const GOAL_DEPTH = 18;
const CENTER = { x: 320, y: 218 };

const P_R = 9;
const RUN_SPEED = 2.2;
const SPRINT_SPEED = 3.2;
const AI_SPEED = 2.0;
const KEEPER_SPEED = 1.7;
const SHOT_SPEED = 6.9;
const FIRE_SHOT_SPEED = 9.9;
const PASS_SPEED = 5.6;
const CAPTURE_R = 11;
const SLIDE_MS = 380;
const SLIDE_SPEED = 5.1;
const SLIDE_RECOVER_MS = 260;
const SLIDE_CD_MS = 1100;
const KNOCK_MS = 900;
const FIRE_FILL_MS = 2600;

const params = new URLSearchParams(location.search);
const MATCH_SECONDS = Math.max(10, Number(params.get("t")) || 120);
const AUTO_PLAY = params.get("auto") === "1";

const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(bx - ax, by - ay);

/* ================= Pixel sprites (11×17, facing right) ==================== */
/* H hair · S skin · E eye · J jersey · P shorts · W socks · B boots/dark    */

const RUN_A = [
  "...HHHH....",
  "..HHHHHH...",
  "..HSSSSH...",
  "..SSSSE....",
  "..SSSSSS...",
  "...SSSS....",
  "..JJJJJJ...",
  ".JJJJJJJJ..",
  "SJJJJJJJJS.",
  ".JJJJJJJJ..",
  "..JJJJJJ...",
  "..PPPPPP...",
  "..PP..PP...",
  "..B....B...",
  "..B....B...",
  ".WW....WW..",
  ".BB....BB..",
];
const RUN_B = [
  "...HHHH....",
  "..HHHHHH...",
  "..HSSSSH...",
  "..SSSSE....",
  "..SSSSSS...",
  "...SSSS....",
  "..JJJJJJ...",
  ".JJJJJJJJ..",
  "SJJJJJJJJS.",
  ".JJJJJJJJ..",
  "..JJJJJJ...",
  "..PPPPPP...",
  "..PP..PP...",
  "....BB.....",
  "....BB.....",
  "...WWW.....",
  "...BBB.....",
];
const KICK = [
  "...HHHH....",
  "..HHHHHH...",
  "..HSSSSH...",
  "..SSSSE....",
  "..SSSSSS...",
  "...SSSS....",
  "..JJJJJJ...",
  ".JJJJJJJJ..",
  "SJJJJJJJJS.",
  ".JJJJJJJJ..",
  "..JJJJJJ...",
  "..PPPPPP...",
  "..PP..PP...",
  "..B...BBBB.",
  "..B........",
  ".WW........",
  ".BB........",
];

const flipFrame = (f: string[]) => f.map((r) => [...r].reverse().join(""));
const RUN_A_L = flipFrame(RUN_A);
const RUN_B_L = flipFrame(RUN_B);
const KICK_L = flipFrame(KICK);

interface Pal { J: string; P: string; S: string; E: string; W: string; B: string; H: string }

const SKINS = ["#f7c8a0", "#e8a87c", "#c98d64", "#8d5b3f"];
const HAIRS = ["#2c2320", "#5b3a1e", "#171a24", "#8a5a2b", "#c9762b", "#4a4e57"];
function makePal(team: 0 | 1, keeper: boolean, skin: string, hair: string): Pal {
  return {
    J: keeper ? (team === 0 ? "#ffd23e" : "#9b4df3") : team === 0 ? "#2b6bf3" : "#f23a3a",
    P: "#f5f2ea",
    S: skin,
    E: "#14161f",
    W: "#e8e8e8",
    B: "#1b1e2b",
    H: hair,
  };
}

/* ================= Input ==================================================== */

class Input {
  private keys = new Set<string>();
  private passQ = false;
  private shootQ = false;
  private pauseQ = false;
  private sprintTouch = false;
  joy = { id: -1, ox: 0, oy: 0, dx: 0, dy: 0 };

  constructor(canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
      if (k === "j") { this.passQ = true; return; }
      if (k === "k" || k === " ") { this.shootQ = true; return; }
      if (k === "p" || k === "escape") { this.pauseQ = true; return; }
      this.keys.add(k);
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.key.toLowerCase()));

    canvas.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "touch") return;
      const r = canvas.getBoundingClientRect();
      if (e.clientX - r.left > r.width / 2 || this.joy.id !== -1) return;
      this.joy.id = e.pointerId;
      this.joy.ox = e.clientX; this.joy.oy = e.clientY; this.joy.dx = 0; this.joy.dy = 0;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (e.pointerId !== this.joy.id) return;
      const m = 48;
      this.joy.dx = Math.max(-m, Math.min(m, e.clientX - this.joy.ox)) / m;
      this.joy.dy = Math.max(-m, Math.min(m, e.clientY - this.joy.oy)) / m;
    });
    const endJoy = (e: PointerEvent) => {
      if (e.pointerId !== this.joy.id) return;
      this.joy.id = -1; this.joy.dx = 0; this.joy.dy = 0;
    };
    canvas.addEventListener("pointerup", endJoy);
    canvas.addEventListener("pointercancel", endJoy);

    const btn = (id: string) => document.getElementById(id)!;
    btn("btn-pass").addEventListener("pointerdown", (e) => { e.preventDefault(); this.passQ = true; });
    btn("btn-shoot").addEventListener("pointerdown", (e) => { e.preventDefault(); this.shootQ = true; });
    btn("btn-pause").addEventListener("click", () => { this.pauseQ = true; });
    const sprint = btn("btn-sprint");
    sprint.addEventListener("pointerdown", (e) => { e.preventDefault(); this.sprintTouch = true; });
    for (const ev of ["pointerup", "pointercancel", "pointerleave"]) {
      sprint.addEventListener(ev, () => { this.sprintTouch = false; });
    }
  }

  dir(): { x: number; y: number } {
    let x = 0, y = 0;
    if (this.keys.has("a") || this.keys.has("arrowleft")) x -= 1;
    if (this.keys.has("d") || this.keys.has("arrowright")) x += 1;
    if (this.keys.has("w") || this.keys.has("arrowup")) y -= 1;
    if (this.keys.has("s") || this.keys.has("arrowdown")) y += 1;
    if (this.joy.id !== -1 && (Math.abs(this.joy.dx) > 0.18 || Math.abs(this.joy.dy) > 0.18)) {
      x = this.joy.dx; y = this.joy.dy;
    }
    const len = Math.hypot(x, y);
    return len > 1 ? { x: x / len, y: y / len } : { x, y };
  }

  sprinting(): boolean { return this.keys.has("shift") || this.sprintTouch; }
  takePass(): boolean { const v = this.passQ; this.passQ = false; return v; }
  takeShoot(): boolean { const v = this.shootQ; this.shootQ = false; return v; }
  takePause(): boolean { const v = this.pauseQ; this.pauseQ = false; return v; }
}

/* ================= FX: particles, flashes, screen shake ==================== */

interface Particle {
  x: number; y: number; vx: number; vy: number;
  color: string; size: number; born: number; life: number; gravity: boolean;
}
interface Flash { x: number; y: number; born: number }

class FX {
  particles: Particle[] = [];
  flashes: Flash[] = [];
  shakeAmt = 0;

  trail(x: number, y: number, color: string, life = 300, size = 2): void {
    this.particles.push({ x, y, vx: 0, vy: 0, color, size, born: performance.now(), life, gravity: false });
  }
  burst(x: number, y: number, color: string, n: number, speed: number): void {
    const now = performance.now();
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = speed * (0.4 + Math.random() * 0.6);
      this.particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        color, size: 2, born: now, life: 500 + Math.random() * 300, gravity: false,
      });
    }
  }
  confetti(x: number, y: number): void {
    const now = performance.now();
    const colors = ["#ffd23e", "#f23a3a", "#2b6bf3", "#3ecf8e", "#ffffff"];
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.3 + Math.random() * 3.2;
      this.particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2.2,
        color: colors[i % colors.length], size: 3, born: now, life: 1000, gravity: true,
      });
    }
  }
  flash(x: number, y: number): void {
    this.flashes.push({ x, y, born: performance.now() });
    this.shake(3);
  }
  shake(n: number): void { this.shakeAmt = Math.min(8, this.shakeAmt + n); }

  update(now: number, dtF: number): void {
    this.particles = this.particles.filter((p) => now - p.born < p.life);
    for (const p of this.particles) {
      p.x += p.vx * dtF;
      p.y += p.vy * dtF;
      if (p.gravity) p.vy += 0.1 * dtF;
    }
    this.flashes = this.flashes.filter((f) => now - f.born < 220);
    this.shakeAmt = Math.max(0, this.shakeAmt - 0.25 * dtF);
  }

  draw(o: CanvasRenderingContext2D, now: number): void {
    for (const p of this.particles) {
      o.globalAlpha = Math.max(0, 1 - (now - p.born) / p.life);
      o.fillStyle = p.color;
      o.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    o.globalAlpha = 1;
    for (const f of this.flashes) {
      const t = (now - f.born) / 220;
      const r = 3 + t * 11;
      o.fillStyle = t < 0.5 ? "#ffffff" : "#ffd23e";
      o.fillRect(Math.round(f.x - r), Math.round(f.y), r * 2, 2);
      o.fillRect(Math.round(f.x), Math.round(f.y - r), 2, r * 2);
      o.fillRect(Math.round(f.x - r * 0.6), Math.round(f.y - r * 0.6), 2, 2);
      o.fillRect(Math.round(f.x + r * 0.6), Math.round(f.y - r * 0.6), 2, 2);
      o.fillRect(Math.round(f.x - r * 0.6), Math.round(f.y + r * 0.6), 2, 2);
      o.fillRect(Math.round(f.x + r * 0.6), Math.round(f.y + r * 0.6), 2, 2);
    }
  }
}

/* ================= Ball ===================================================== */

class Ball {
  x = CENTER.x; y = CENTER.y; vx = 0; vy = 0;
  owner: Player | null = null;
  fire = false;
  wobble = 0;

  reset(): void {
    this.x = CENTER.x; this.y = CENTER.y; this.vx = 0; this.vy = 0;
    this.owner = null; this.fire = false; this.wobble = 0;
  }

  speed(): number { return Math.hypot(this.vx, this.vy); }

  updateLoose(dtF: number, fx: FX): void {
    if (this.fire) {
      this.wobble += 0.35 * dtF;
      this.vy += Math.sin(this.wobble) * 0.14 * dtF;
    }
    if (this.speed() > 3.5) {
      fx.trail(this.x, this.y, this.fire ? "#ff9e4a" : "#ffffff", this.fire ? 340 : 220);
      if (this.fire) fx.trail(this.x + (Math.random() - 0.5) * 5, this.y + (Math.random() - 0.5) * 5, "#ffd23e", 260);
    }
    this.x += this.vx * dtF;
    this.y += this.vy * dtF;
    const fr = Math.pow(0.988, dtF);
    this.vx *= fr; this.vy *= fr;

    if (this.y < FIELD.top + 3) { this.y = FIELD.top + 3; this.vy *= -0.7; }
    if (this.y > FIELD.bottom - 3) { this.y = FIELD.bottom - 3; this.vy *= -0.7; }
    const inMouth = this.y > MOUTH.top && this.y < MOUTH.bottom;
    if (this.x < FIELD.left + 3 && !inMouth) { this.x = FIELD.left + 3; this.vx *= -0.7; }
    if (this.x > FIELD.right - 3 && !inMouth) { this.x = FIELD.right - 3; this.vx *= -0.7; }
    if (this.x < FIELD.left - GOAL_DEPTH) { this.x = FIELD.left - GOAL_DEPTH; this.vx *= -0.5; }
    if (this.x > FIELD.right + GOAL_DEPTH) { this.x = FIELD.right + GOAL_DEPTH; this.vx *= -0.5; }
  }

  draw(o: CanvasRenderingContext2D, now: number): void {
    const x = Math.round(this.x), y = Math.round(this.y);
    o.fillStyle = "rgba(0,0,0,0.25)";
    o.fillRect(x - 3, y + 5, 6, 2);
    o.fillStyle = this.fire ? "#ffb46a" : "#ffffff";
    o.fillRect(x - 2, y - 3, 4, 6);
    o.fillRect(x - 3, y - 2, 6, 4);
    o.fillStyle = this.fire ? "#f23a3a" : "#1b1e2b";
    o.fillRect(x - 1 + (Math.floor(now / 90) % 2), y - 1, 2, 2);
    o.fillRect(x - 2, y + 1, 1, 1);
    o.fillRect(x + 1, y - 2, 1, 1);
    if (this.fire) {
      o.fillStyle = "#ffd23e";
      o.fillRect(x - 5, y - 2 + (Math.floor(now / 60) % 4) - 1, 2, 2);
    }
  }
}

/* ================= Player =================================================== */

class Player {
  team: 0 | 1;
  keeper: boolean;
  x: number; y: number;
  vx = 0; vy = 0;
  faceX: number; faceY = 0;
  anchorX: number; anchorY: number;
  pal: Pal;
  runPhase = Math.random() * 10;
  captureCd = 0;
  holdT0 = 0;
  kickUntil = 0;
  knockedUntil = 0;
  stunnedUntil = 0;
  slideUntil = 0;
  slideCdUntil = 0;
  slideDx = 0; slideDy = 0;

  constructor(team: 0 | 1, keeper: boolean, x: number, y: number, skin: string, hair: string) {
    this.team = team;
    this.keeper = keeper;
    this.x = x; this.y = y;
    this.anchorX = x; this.anchorY = y;
    this.faceX = team === 0 ? 1 : -1;
    this.pal = makePal(team, keeper, skin, hair);
  }

  busy(now: number): boolean {
    return now < this.knockedUntil || now < this.slideUntil || now < this.stunnedUntil;
  }

  startSlide(now: number): void {
    if (now < this.slideCdUntil || this.busy(now)) return;
    this.slideUntil = now + SLIDE_MS;
    this.slideCdUntil = now + SLIDE_CD_MS;
    const len = Math.hypot(this.faceX, this.faceY) || 1;
    this.slideDx = this.faceX / len;
    this.slideDy = this.faceY / len;
  }

  move(dx: number, dy: number, speed: number, dtF: number, now: number): void {
    if (now < this.knockedUntil) { this.vx = 0; this.vy = 0; return; }
    if (now < this.slideUntil) {
      const t = 1 - (this.slideUntil - now) / SLIDE_MS;
      const sp = SLIDE_SPEED * (1 - t * 0.55);
      this.vx = this.slideDx * sp;
      this.vy = this.slideDy * sp;
    } else {
      const stunned = now < this.stunnedUntil;
      const len = Math.hypot(dx, dy);
      if (len > 0.01) {
        const sp = speed * (stunned ? 0.3 : 1);
        this.vx = (dx / len) * sp;
        this.vy = (dy / len) * sp;
        this.faceX = dx / len;
        this.faceY = dy / len;
        this.runPhase += 0.12 * sp * dtF;
      } else {
        this.vx = 0; this.vy = 0;
      }
    }
    this.x += this.vx * dtF;
    this.y += this.vy * dtF;
    if (this.keeper) {
      const homeX = this.team === 0 ? FIELD.left + 10 : FIELD.right - 10;
      this.x = Math.max(homeX - 14, Math.min(homeX + 26, this.x));
      this.y = Math.max(MOUTH.top - 19, Math.min(MOUTH.bottom + 19, this.y));
    } else {
      this.x = Math.max(FIELD.left + 6, Math.min(FIELD.right - 6, this.x));
      this.y = Math.max(FIELD.top + 6, Math.min(FIELD.bottom - 6, this.y));
    }
  }

  draw(o: CanvasRenderingContext2D, now: number, controlled: boolean, hasBallFire: boolean): void {
    const x = Math.round(this.x), y = Math.round(this.y);
    // Shadow
    o.fillStyle = "rgba(0,0,0,0.22)";
    o.fillRect(x - 4, y + 8, 9, 2);

    if (controlled) {
      o.fillStyle = "#ffd23e";
      o.fillRect(x - 5, y + 11, 11, 2);
      o.fillRect(x - 1, y - 14 + (Math.floor(now / 220) % 2), 3, 2);
    }

    const knocked = now < this.knockedUntil;
    const sliding = now < this.slideUntil;
    const kicking = now < this.kickUntil;
    const moving = Math.abs(this.vx) + Math.abs(this.vy) > 0.3;
    const right = this.faceX >= 0;
    let frame: string[];
    if (kicking) frame = right ? KICK : KICK_L;
    else if (moving && Math.floor(this.runPhase) % 2 === 0) frame = right ? RUN_A : RUN_A_L;
    else frame = right ? RUN_B : RUN_B_L;

    o.save();
    o.translate(x, y);
    if (knocked) o.rotate(right ? Math.PI / 2 : -Math.PI / 2);
    else if (sliding) o.rotate((right ? 1 : -1) * 0.62);
    // sprite is 11×17, anchored near its center (5, 8)
    for (let r = 0; r < frame.length; r++) {
      const row = frame[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c] as keyof Pal | ".";
        if (ch === ".") continue;
        o.fillStyle = this.pal[ch];
        o.fillRect(c - 5, r - 8, 1, 1);
      }
    }
    // Keeper gloves on the arm tips
    if (this.keeper) {
      o.fillStyle = "#ffffff";
      o.fillRect(-5, 0, 1, 1);
      o.fillRect(4, 0, 1, 1);
    }
    o.restore();

    if (knocked) {
      o.fillStyle = "#ffd23e";
      const ph = Math.floor(now / 150) % 3;
      o.fillRect(x - 6 + ph * 5, y - 14, 2, 2);
    }
    if (hasBallFire) {
      o.fillStyle = Math.floor(now / 100) % 2 ? "#ff9e4a" : "#ffd23e";
      o.fillRect(x + 7, y - 13 + (Math.floor(now / 120) % 2), 3, 3);
    }
  }
}

/* ================= Game ===================================================== */

type Phase = "pick" | "kickoff" | "play" | "goal" | "pause" | "end";

class Game {
  phase: Phase = "pick";
  resumePhase: Phase = "play";
  myTeam: Team | null = null;
  oppTeam: Team | null = null;
  players: Player[] = [];
  ball = new Ball();
  fx = new FX();
  controlled: Player | null = null;
  score: [number, number] = [0, 0];
  timeLeft = MATCH_SECONDS;
  fireMeter = 0;
  stamina = 1;
  banner: { text: string; color: string; t0: number } | null = null;
  kickoffT0 = 0;
  goalT0 = 0;
  lastTick = 0;
  private hudCache = "";

  constructor(private input: Input, private o: CanvasRenderingContext2D) {}

  /* ---- setup ---- */

  makeSide(team: 0 | 1): Player[] {
    const spots = [
      { fx: 0.03, fy: 0.5, keeper: true },
      { fx: 0.24, fy: 0.5, keeper: false },
      { fx: 0.44, fy: 0.22, keeper: false },
      { fx: 0.44, fy: 0.78, keeper: false },
    ];
    return spots.map((s, i) => {
      const fx = team === 0 ? s.fx : 1 - s.fx;
      const x = FIELD.left + fx * (FIELD.right - FIELD.left);
      const y = FIELD.top + s.fy * (FIELD.bottom - FIELD.top);
      return new Player(team, s.keeper, x, y, SKINS[(i + team * 2) % SKINS.length], HAIRS[(i * 2 + team * 3) % HAIRS.length]);
    });
  }

  start(mine: Team): void {
    this.myTeam = mine;
    const others = teams.filter((t) => t.fifaCode !== mine.fifaCode);
    this.oppTeam = others[Math.floor(Math.random() * others.length)];
    this.players = [...this.makeSide(0), ...this.makeSide(1)];
    this.score = [0, 0];
    this.timeLeft = MATCH_SECONDS;
    this.fireMeter = 0;
    this.stamina = 1;
    this.fx = new FX();
    removeOverlay();
    this.hudCache = "";
    this.updateHud();
    this.kickoff();
  }

  kickoff(): void {
    const now = this.lastTick || performance.now();
    for (const p of this.players) {
      p.x = p.anchorX; p.y = p.anchorY; p.vx = 0; p.vy = 0;
      p.captureCd = 0; p.knockedUntil = 0; p.stunnedUntil = 0; p.slideUntil = 0;
    }
    this.ball.reset();
    this.controlled = null;
    this.banner = { text: "GO!", color: "#ffd23e", t0: now };
    this.kickoffT0 = now;
    this.phase = "kickoff";
  }

  /* ---- actions ---- */

  shoot(p: Player, now: number): void {
    const b = this.ball;
    const gx = (p.team === 0 ? FIELD.right : FIELD.left) + (p.team === 0 ? GOAL_DEPTH / 2 : -GOAL_DEPTH / 2);
    let gy = (MOUTH.top + MOUTH.bottom) / 2 + p.faceY * 74;
    gy = Math.max(MOUTH.top + 10, Math.min(MOUTH.bottom - 10, gy + (Math.random() - 0.5) * 29));
    const fire = p.team === 0 && !p.keeper && this.fireMeter >= 1;
    const speed = fire ? FIRE_SHOT_SPEED : SHOT_SPEED;
    const d = dist(p.x, p.y, gx, gy) || 1;
    b.owner = null;
    b.vx = ((gx - p.x) / d) * speed;
    b.vy = ((gy - p.y) / d) * speed;
    b.fire = fire;
    b.wobble = 0;
    p.captureCd = now + 600;
    p.kickUntil = now + 220;
    if (fire) { this.fx.shake(5); this.fx.burst(p.x, p.y, "#ff9e4a", 12, 2.6); }
    if (p.team === 0) this.fireMeter = 0;
  }

  pass(p: Player, now: number): void {
    const mates = this.players.filter((q) => q.team === p.team && !q.keeper && q !== p);
    if (mates.length === 0) return;
    const attackDir = p.team === 0 ? 1 : -1;
    let best = mates[0];
    let bestScore = -Infinity;
    for (const m of mates) {
      const opp = this.nearestOpponent(m);
      const open = opp ? Math.min(77, dist(m.x, m.y, opp.x, opp.y)) : 77;
      const score = m.x * attackDir + open * 0.8;
      if (score > bestScore) { bestScore = score; best = m; }
    }
    const b = this.ball;
    const lead = 16 * attackDir;
    const d = dist(p.x, p.y, best.x + lead, best.y) || 1;
    b.owner = null;
    b.fire = false;
    b.vx = ((best.x + lead - p.x) / d) * PASS_SPEED;
    b.vy = ((best.y - p.y) / d) * PASS_SPEED;
    p.captureCd = now + 400;
    p.kickUntil = now + 200;
  }

  /* ---- helpers ---- */

  nearestOpponent(p: Player): Player | null {
    let best: Player | null = null;
    let bd = Infinity;
    for (const q of this.players) {
      if (q.team === p.team) continue;
      const d = dist(p.x, p.y, q.x, q.y);
      if (d < bd) { bd = d; best = q; }
    }
    return best;
  }

  gain(p: Player, now: number): void {
    this.ball.owner = p;
    this.ball.fire = false;
    p.holdT0 = now;
    if (p.team !== 0) this.fireMeter = 0;
  }

  pickControlled(now: number): void {
    if (AUTO_PLAY) { this.controlled = null; return; }
    if (this.controlled && (now < this.controlled.slideUntil || now < this.controlled.knockedUntil)) return;
    const mine = this.players.filter((p) => p.team === 0 && !p.keeper);
    let best = this.controlled && !this.controlled.keeper ? this.controlled : mine[0];
    let bd = this.controlled ? dist(this.controlled.x, this.controlled.y, this.ball.x, this.ball.y) - 16 : Infinity;
    for (const p of mine) {
      const d = dist(p.x, p.y, this.ball.x, this.ball.y);
      if (d < bd) { bd = d; best = p; }
    }
    this.controlled = best;
  }

  /* ---- AI ---- */

  aiFor(p: Player, now: number): { x: number; y: number; speed: number } {
    const b = this.ball;
    const attackDir = p.team === 0 ? 1 : -1;

    if (p.keeper) {
      const ty = Math.max(MOUTH.top + 8, Math.min(MOUTH.bottom - 8, b.y));
      return { x: (p.team === 0 ? FIELD.left + 10 : FIELD.right - 10) - p.x, y: ty - p.y, speed: KEEPER_SPEED };
    }

    if (b.owner === p) {
      const gx = p.team === 0 ? FIELD.right : FIELD.left;
      const gy = (MOUTH.top + MOUTH.bottom) / 2 + Math.sin(now / 700 + p.runPhase) * 38;
      const inRange = Math.abs(gx - p.x) < 210;
      const opp = this.nearestOpponent(p);
      const pressured = opp && dist(p.x, p.y, opp.x, opp.y) < 35;
      if (inRange && Math.random() < 0.025) this.shoot(p, now);
      else if (pressured && Math.random() < 0.04) this.pass(p, now);
      return { x: gx - p.x, y: gy - p.y, speed: AI_SPEED };
    }

    // Defenders may slide-tackle an enemy carrier.
    if (b.owner && b.owner.team !== p.team && !b.owner.keeper) {
      const d = dist(p.x, p.y, b.owner.x, b.owner.y);
      if (d < 21 && now - b.owner.holdT0 > 500 && Math.random() < 0.02) {
        p.faceX = (b.owner.x - p.x) / (d || 1);
        p.faceY = (b.owner.y - p.y) / (d || 1);
        p.startSlide(now);
      }
    }

    const squad = this.players.filter((q) => q.team === p.team && !q.keeper);
    let nearest = squad[0];
    let bd = Infinity;
    for (const q of squad) {
      const d = dist(q.x, q.y, b.x, b.y);
      if (d < bd) { bd = d; nearest = q; }
    }
    if (nearest === p && (!b.owner || b.owner.team !== p.team)) {
      const tx = b.owner ? b.owner.x : b.x;
      const ty = b.owner ? b.owner.y : b.y;
      return { x: tx - p.x, y: ty - p.y, speed: AI_SPEED };
    }
    const shift = (b.x - CENTER.x) * 0.3 + attackDir * (b.owner && b.owner.team === p.team ? 58 : 0);
    const tx = Math.max(FIELD.left + 19, Math.min(FIELD.right - 19, p.anchorX + shift));
    return { x: tx - p.x, y: p.anchorY + (b.y - CENTER.y) * 0.18 - p.y, speed: AI_SPEED * 0.9 };
  }

  /* ---- update ---- */

  update(now: number, dt: number): void {
    const dtF = dt / 16.7;
    const b = this.ball;

    if (this.input.takePause()) {
      if (this.phase === "play" || this.phase === "kickoff") { this.resumePhase = this.phase; this.showPause(); return; }
    }
    if (this.phase === "pause") return;
    if (this.phase === "kickoff" && now - this.kickoffT0 > 800) this.phase = "play";
    if (this.phase === "goal" && now - this.goalT0 > 1500) this.kickoff();
    if (this.phase !== "play" && this.phase !== "kickoff") { this.fx.update(now, dtF); return; }

    if (this.phase === "play") {
      this.timeLeft -= dt / 1000;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.updateHud();
        this.showEnd();
        return;
      }
    }

    this.pickControlled(now);

    // Movement + sprint stamina
    const sprinting = this.controlled && this.input.sprinting() && this.stamina > 0.05;
    for (const p of this.players) {
      if (p === this.controlled && this.phase === "play") {
        const d = this.input.dir();
        const moving = Math.abs(d.x) + Math.abs(d.y) > 0.01;
        const speed = sprinting && moving ? SPRINT_SPEED : RUN_SPEED;
        p.move(d.x, d.y, speed, dtF, now);
        if (sprinting && moving) {
          this.stamina = Math.max(0, this.stamina - dt / 1500);
          if (Math.floor(now / 40) % 2 === 0) this.fx.trail(p.x - p.faceX * 8, p.y + 5, "#dff1ff", 240);
        } else {
          this.stamina = Math.min(1, this.stamina + dt / 2600);
        }
      } else {
        const a = this.aiFor(p, now);
        p.move(a.x, a.y, a.speed, dtF, now);
      }
    }
    if (!this.controlled || !this.input.sprinting()) {
      this.stamina = Math.min(1, this.stamina + dt / 5200);
    }

    // Player actions (edge-triggered)
    if (this.controlled && this.phase === "play" && !this.controlled.busy(now)) {
      if (this.input.takeShoot()) {
        if (b.owner === this.controlled) this.shoot(this.controlled, now);
      } else if (this.input.takePass()) {
        if (b.owner === this.controlled) this.pass(this.controlled, now);
        else this.controlled.startSlide(now);
      }
    } else {
      this.input.takeShoot();
      this.input.takePass();
    }

    this.resolveSlides(now);
    this.resolveBodies(now);

    // Ball
    if (b.owner) {
      const o = b.owner;
      if (now < o.knockedUntil) {
        b.owner = null;
        b.vx = (Math.random() - 0.5) * 3.2;
        b.vy = (Math.random() - 0.5) * 3.2;
      } else {
        b.x = o.x + o.faceX * 11;
        b.y = o.y + o.faceY * 11 + 5;
        b.vx = 0; b.vy = 0;
        if (o.team === 0 && !o.keeper) this.fireMeter = Math.min(1, this.fireMeter + dt / FIRE_FILL_MS);
        if (o.keeper && now - o.holdT0 > 550) {
          const attackDir = o.team === 0 ? 1 : -1;
          b.owner = null;
          b.vx = attackDir * 5.4;
          b.vy = (Math.random() - 0.5) * 3.2;
          o.captureCd = now + 800;
          o.kickUntil = now + 200;
        }
      }
    } else {
      b.updateLoose(dtF, this.fx);

      if (this.phase === "play") {
        const inMouth = b.y > MOUTH.top && b.y < MOUTH.bottom;
        if (b.x < FIELD.left - GOAL_DEPTH * 0.55 && inMouth) return this.goal(1, now);
        if (b.x > FIELD.right + GOAL_DEPTH * 0.55 && inMouth) return this.goal(0, now);
      }

      const speed = b.speed();
      for (const p of this.players) {
        if (now < p.captureCd || now < p.knockedUntil) continue;
        const d = dist(p.x, p.y, b.x, b.y);
        if (p.keeper && speed > 3.8) {
          const towardOwnGoal = p.team === 0 ? b.vx < 0 : b.vx > 0;
          if (towardOwnGoal && d < 21) {
            const catchProb = b.fire ? 0.3 : 0.75;
            if (Math.random() < catchProb) { this.gain(p, now); break; }
            b.vx *= -0.4;
            b.vy = (Math.random() - 0.5) * 4.8;
            b.fire = false;
            this.fx.flash(p.x, p.y);
            p.captureCd = now + 400;
            break;
          }
        }
        if (d < CAPTURE_R && speed < 6.1) { this.gain(p, now); break; }
        if (now < p.slideUntil && d < CAPTURE_R + 3 && speed < 8) { this.gain(p, now); break; }
      }
    }

    this.fx.update(now, dtF);
    this.updateHud();
  }

  /** Slide tackles: knock down opponents you slide into; loose the ball. */
  resolveSlides(now: number): void {
    for (const s of this.players) {
      if (now >= s.slideUntil) continue;
      for (const v of this.players) {
        if (v.team === s.team || v.keeper || now < v.knockedUntil) continue;
        if (dist(s.x, s.y, v.x, v.y) < P_R * 2 - 2) {
          v.knockedUntil = now + KNOCK_MS;
          v.stunnedUntil = now + KNOCK_MS + 200;
          this.fx.flash((s.x + v.x) / 2, (s.y + v.y) / 2);
          this.fx.burst(v.x, v.y, "#ffffff", 8, 2);
          if (this.ball.owner === v) {
            this.ball.owner = null;
            this.ball.vx = s.slideDx * 2.6 + (Math.random() - 0.5) * 1.6;
            this.ball.vy = s.slideDy * 2.6 + (Math.random() - 0.5) * 1.6;
            v.captureCd = now + 800;
          }
        }
      }
      if (s.slideUntil - now < 30) s.stunnedUntil = Math.max(s.stunnedUntil, s.slideUntil + SLIDE_RECOVER_MS);
    }
  }

  /** Exaggerated body collisions: shove apart, flash on hard hits. */
  resolveBodies(now: number): void {
    for (let i = 0; i < this.players.length; i++) {
      for (let j = i + 1; j < this.players.length; j++) {
        const a = this.players[i], c = this.players[j];
        if (now < a.slideUntil || now < c.slideUntil) continue;
        const d = dist(a.x, a.y, c.x, c.y);
        if (d > P_R * 1.9 || d === 0) continue;
        const nx = (c.x - a.x) / d, ny = (c.y - a.y) / d;
        const push = (P_R * 1.9 - d) / 2;
        a.x -= nx * push; a.y -= ny * push;
        c.x += nx * push; c.y += ny * push;
        const rel = Math.hypot(a.vx - c.vx, a.vy - c.vy);
        if (rel > 3.8 && a.team !== c.team) {
          this.fx.flash((a.x + c.x) / 2, (a.y + c.y) / 2);
          a.stunnedUntil = Math.max(a.stunnedUntil, now + 160);
          c.stunnedUntil = Math.max(c.stunnedUntil, now + 160);
        }
      }
    }
  }

  goal(team: 0 | 1, now: number): void {
    this.score[team] += 1;
    this.phase = "goal";
    this.goalT0 = now;
    this.banner = {
      text: team === 0 ? "GOAL!" : "OH NO!",
      color: team === 0 ? "#3ecf8e" : "#f23a3a",
      t0: now,
    };
    this.fx.confetti(team === 0 ? FIELD.right : FIELD.left, this.ball.y);
    this.fx.shake(5);
    Object.assign(this.ball, { vx: 0, vy: 0, owner: null, fire: false });
    this.updateHud();
  }

  /* ---- HUD + overlays ---- */

  updateHud(): void {
    if (!this.myTeam || !this.oppTeam) return;
    const m = Math.floor(this.timeLeft / 60);
    const s = Math.max(0, Math.floor(this.timeLeft % 60));
    const key = `${this.score[0]}:${this.score[1]}|${m}:${s}`;
    if (key === this.hudCache) return;
    this.hudCache = key;
    scoreEl.innerHTML =
      `<img src="${flagUrl(this.myTeam.iso2)}"> ${this.score[0]} : ${this.score[1]} <img src="${flagUrl(this.oppTeam.iso2)}">`;
    timeEl.textContent = `${m}:${String(s).padStart(2, "0")}`;
    teamsLineEl.textContent = `${this.myTeam.teamName} vs ${this.oppTeam.teamName}`;
  }

  showPause(): void {
    this.phase = "pause";
    const overlay = document.createElement("div");
    overlay.className = "gp-overlay";
    const card = document.createElement("div");
    card.className = "gp-card";
    card.innerHTML =
      `<div class="end-emoji">⏸️</div><h2>PAUSED</h2>` +
      `<p class="sub">WASD/Arrows move · Shift sprint · J pass/slide · K shoot</p>`;
    const resume = document.createElement("button");
    resume.className = "gp-big-btn";
    resume.textContent = "Resume";
    resume.addEventListener("click", () => {
      removeOverlay();
      this.phase = this.resumePhase;
    });
    const restart = document.createElement("a");
    restart.className = "gp-link-btn";
    restart.href = "#";
    restart.textContent = "Restart match";
    restart.addEventListener("click", (e) => { e.preventDefault(); this.start(this.myTeam!); });
    card.appendChild(resume);
    card.appendChild(document.createElement("br"));
    card.appendChild(restart);
    overlay.appendChild(card);
    stage.appendChild(overlay);
  }

  showEnd(): void {
    this.phase = "end";
    const [a, b] = this.score;
    const [emoji, line] =
      a > b ? ["🏆", "You win!"] :
      a === b ? ["🤝", "Draw!"] :
      ["💪", "So close — go again!"];
    const overlay = document.createElement("div");
    overlay.className = "gp-overlay";
    const card = document.createElement("div");
    card.className = "gp-card";
    card.innerHTML =
      `<div class="end-emoji">${emoji}</div>` +
      `<div class="end-score">${a} : ${b}</div>` +
      `<p class="sub">${line}</p>`;
    const again = document.createElement("button");
    again.className = "gp-big-btn";
    again.textContent = "Play again";
    again.addEventListener("click", () => this.start(this.myTeam!));
    const change = document.createElement("a");
    change.className = "gp-link-btn";
    change.href = "#";
    change.textContent = "Change team";
    change.addEventListener("click", (e) => { e.preventDefault(); showTeamPicker(); });
    card.appendChild(again);
    card.appendChild(document.createElement("br"));
    card.appendChild(change);
    overlay.appendChild(card);
    stage.appendChild(overlay);
  }

  /* ---- draw ---- */

  draw(now: number): void {
    const o = this.o;
    o.save();
    if (this.fx.shakeAmt > 0.3) {
      o.translate(
        Math.round((Math.random() - 0.5) * this.fx.shakeAmt),
        Math.round((Math.random() - 0.5) * this.fx.shakeAmt)
      );
    }

    // Pitch
    o.fillStyle = "#2e9e64";
    o.fillRect(-6, -6, W + 12, H + 12);
    o.fillStyle = "#27905a";
    for (let i = 0; i < 8; i++) o.fillRect(FIELD.left + i * 72, 0, 36, H);

    // Lines
    o.fillStyle = "#e8f5ec";
    o.fillRect(FIELD.left, FIELD.top, FIELD.right - FIELD.left, 2);
    o.fillRect(FIELD.left, FIELD.bottom, FIELD.right - FIELD.left, 2);
    o.fillRect(FIELD.left, FIELD.top, 2, FIELD.bottom - FIELD.top);
    o.fillRect(FIELD.right, FIELD.top, 2, FIELD.bottom - FIELD.top + 2);
    o.fillRect(CENTER.x, FIELD.top, 2, FIELD.bottom - FIELD.top);
    for (let a = 0; a < 96; a++) {
      const ang = (a / 96) * Math.PI * 2;
      o.fillRect(Math.round(CENTER.x + Math.cos(ang) * 42), Math.round(CENTER.y + Math.sin(ang) * 42), 2, 2);
    }
    for (const side of [0, 1] as const) {
      const x = side === 0 ? FIELD.left : FIELD.right - 74;
      o.fillRect(x, MOUTH.top - 35, 74, 2);
      o.fillRect(x, MOUTH.bottom + 35, 74, 2);
      o.fillRect(side === 0 ? x + 74 : x, MOUTH.top - 35, 2, MOUTH.bottom - MOUTH.top + 72);
    }

    // Goals
    for (const side of [0, 1] as const) {
      const gx = side === 0 ? FIELD.left - GOAL_DEPTH : FIELD.right;
      o.fillStyle = "rgba(232,245,236,0.28)";
      o.fillRect(gx, MOUTH.top, GOAL_DEPTH, MOUTH.bottom - MOUTH.top);
      o.fillStyle = "rgba(232,245,236,0.55)";
      for (let y = MOUTH.top; y <= MOUTH.bottom; y += 5) o.fillRect(gx, y, GOAL_DEPTH, 1);
      for (let x = gx; x <= gx + GOAL_DEPTH; x += 5) o.fillRect(x, MOUTH.top, 1, MOUTH.bottom - MOUTH.top);
      o.fillStyle = "#ffffff";
      o.fillRect(gx, MOUTH.top - 2, GOAL_DEPTH + 2, 3);
      o.fillRect(gx, MOUTH.bottom, GOAL_DEPTH + 2, 3);
      o.fillRect(side === 0 ? gx : gx + GOAL_DEPTH - 1, MOUTH.top, 3, MOUTH.bottom - MOUTH.top + 2);
    }

    this.fx.draw(o, now);

    const sorted = [...this.players].sort((a, b) => a.y - b.y);
    for (const p of sorted) {
      p.draw(o, now, p === this.controlled, this.ball.owner === p && p.team === 0 && this.fireMeter >= 1);
    }
    this.ball.draw(o, now);

    // Meters (fire + stamina)
    if (this.phase !== "pick") {
      this.drawBar(o, W / 2 - 50, 8, 100, 7, this.fireMeter, "#ff9e4a", "#ffd23e");
      this.drawBar(o, W / 2 - 50, 19, 100, 4, this.stamina, "#5b86e5", "#9fd0ff");
      o.font = "9px monospace";
      o.fillStyle = "#ffffff";
      o.fillText("FIRE", W / 2 - 88, 15);
      o.fillText("RUN", W / 2 - 82, 24);
      if (this.fireMeter >= 1 && Math.floor(now / 250) % 2 === 0) {
        o.fillStyle = "#ffd23e";
        o.font = "800 10px monospace";
        o.fillText("SUPER SHOT READY!", W / 2 + 58, 16);
      }
    }

    // Banner
    if (this.banner && now - this.banner.t0 < 1400) {
      const t = Math.min(1, (now - this.banner.t0) / 200);
      o.font = `800 ${Math.round(22 + t * 12)}px monospace`;
      o.textAlign = "center";
      o.lineWidth = 4;
      o.strokeStyle = "#ffffff";
      o.fillStyle = this.banner.color;
      o.strokeText(this.banner.text, CENTER.x, 100);
      o.fillText(this.banner.text, CENTER.x, 100);
      o.textAlign = "left";
    }

    // Joystick ghost
    if (this.input.joy.id !== -1) {
      const r = canvas.getBoundingClientRect();
      const sx = ((this.input.joy.ox - r.left) / r.width) * W;
      const sy = ((this.input.joy.oy - r.top) / r.height) * H;
      o.strokeStyle = "rgba(255,255,255,0.5)";
      o.lineWidth = 2;
      o.strokeRect(Math.round(sx - 15), Math.round(sy - 15), 30, 30);
      o.fillStyle = "rgba(255,255,255,0.7)";
      o.fillRect(Math.round(sx + this.input.joy.dx * 12 - 4), Math.round(sy + this.input.joy.dy * 12 - 4), 8, 8);
    }

    o.restore();
  }

  drawBar(o: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, v: number, c1: string, c2: string): void {
    o.fillStyle = "rgba(0,0,0,0.4)";
    o.fillRect(x - 1, y - 1, w + 2, h + 2);
    o.fillStyle = c1;
    o.fillRect(x, y, Math.round(w * v), h);
    o.fillStyle = c2;
    o.fillRect(x, y, Math.round(w * v), 1);
  }
}

/* ================= DOM + boot =============================================== */

const stage = document.getElementById("gp-stage") as HTMLDivElement;
const canvas = document.getElementById("pitch") as HTMLCanvasElement;
const scoreEl = document.getElementById("gp-score") as HTMLDivElement;
const timeEl = document.getElementById("gp-time") as HTMLDivElement;
const teamsLineEl = document.getElementById("gp-teams-line") as HTMLDivElement;

canvas.width = W;
canvas.height = H;
const octx = canvas.getContext("2d")!;
octx.imageSmoothingEnabled = false;

function resize(): void {
  const pad = 16;
  const maxW = stage.clientWidth - pad;
  const maxH = stage.clientHeight - pad;
  const w = Math.min(maxW, (maxH * W) / H);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${(w * H) / W}px`;
}
new ResizeObserver(resize).observe(stage);
resize();

const input = new Input(canvas);
const game = new Game(input, octx);

function removeOverlay(): void {
  document.querySelectorAll(".gp-overlay").forEach((el) => el.remove());
}

function showTeamPicker(): void {
  removeOverlay();
  game.phase = "pick";
  const overlay = document.createElement("div");
  overlay.className = "gp-overlay";
  const card = document.createElement("div");
  card.className = "gp-card";
  card.innerHTML =
    `<h2>🕹️ ARCADE SOCCER</h2>` +
    `<p class="sub">Retro 4v4 pixel match — sprint, slide tackles &amp; flaming super shots. Pick your team!</p>`;
  const grid = document.createElement("div");
  grid.className = "team-grid";
  for (const t of teams) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "team-btn";
    btn.innerHTML =
      `<img src="${flagUrl(t.iso2)}" alt="${t.fifaCode}" loading="lazy">` +
      `<span>${t.teamName}</span>`;
    btn.addEventListener("click", () => game.start(t));
    grid.appendChild(btn);
  }
  card.appendChild(grid);
  overlay.appendChild(card);
  stage.appendChild(overlay);
}

function loop(now: number): void {
  const dt = Math.min(50, game.lastTick ? now - game.lastTick : 16);
  game.lastTick = now;
  if (game.phase !== "pick" && game.phase !== "end") game.update(now, dt);
  game.draw(now);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
showTeamPicker();

// Debug handles for automated testing (harmless in production). __soccerTick
// advances the simulation with a fixed timestep independent of rAF, so the
// engine can be exercised even when the tab is occluded (rAF frozen).
const dbg = window as unknown as {
  __soccer: Game;
  __soccerTick: (frames: number) => void;
};
dbg.__soccer = game;
dbg.__soccerTick = (frames: number) => {
  for (let i = 0; i < frames; i++) {
    const now = (game.lastTick || performance.now()) + 16.7;
    game.lastTick = now;
    if (game.phase !== "pick" && game.phase !== "end") game.update(now, 16.7);
  }
};
