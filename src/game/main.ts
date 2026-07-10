import { teams } from "../data/teams";
import { flagUrl } from "../utils/flags";
import type { Team } from "../types";

/**
 * Cartoon Penalty — a small canvas penalty-shootout game (subpage /game).
 *
 * Pure vanilla TS + canvas: pick one of the 48 World Cup teams, take 5 shots
 * against a cartoon goalkeeper (a random other nation). Move to aim inside the
 * goal, click/tap to shoot; the keeper dives to a zone and saves anything
 * within reach. Bilingual (EN + 中文), kid-friendly cartoon look, works with
 * mouse and touch. No external assets besides the flag CDN already used by
 * the main app.
 */

/* ---------------- Virtual scene coordinates (scaled to canvas) ----------- */

const VW = 1000;
const VH = 640;
const GOAL = { left: 300, right: 700, top: 200, ground: 430 };
const AIM_INSET = { x: 22, top: 20, bottom: 14 };
const BALL_START = { x: 500, y: 566 };
const KEEPER_BASE = { x: 500, y: 386 };
const KEEPER_REACH = { rx: 86, ry: 70 };
const SHOTS_PER_GAME = 5;

type Phase = "pick" | "aim" | "fly" | "result" | "end";

interface Particle {
  x: number; y: number; vx: number; vy: number;
  rot: number; vr: number; color: string; emoji?: string; born: number;
}

interface GameState {
  phase: Phase;
  player: Team | null;
  keeperTeam: Team | null;
  shot: number;                    // 0-based index of current shot
  results: ("goal" | "save")[];
  aim: { x: number; y: number };
  shotTarget: { x: number; y: number } | null;
  divePoint: { x: number; y: number } | null;
  lastDiveZone: number;
  flightT0: number;                // ms timestamp when the shot started
  resultT0: number;
  outcome: "goal" | "save" | null;
  particles: Particle[];
  cheer: number;                   // crowd excitement 0..1 (decays)
}

const state: GameState = {
  phase: "pick",
  player: null,
  keeperTeam: null,
  shot: 0,
  results: [],
  aim: { x: 500, y: 320 },
  shotTarget: null,
  divePoint: null,
  lastDiveZone: -1,
  flightT0: 0,
  resultT0: 0,
  outcome: null,
  particles: [],
  cheer: 0,
};

/* ---------------- DOM setup ---------------------------------------------- */

const stage = document.getElementById("gp-stage") as HTMLDivElement;
const canvas = document.getElementById("pitch") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const scoreEl = document.getElementById("gp-score") as HTMLDivElement;
const teamsLineEl = document.getElementById("gp-teams-line") as HTMLDivElement;

let cssW = 0;
let cssH = 0;

function resize(): void {
  const pad = 20;
  const maxW = stage.clientWidth - pad;
  const maxH = stage.clientHeight - pad;
  cssW = Math.min(maxW, (maxH * VW) / VH);
  cssH = (cssW * VH) / VW;
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  ctx.setTransform((cssW / VW) * dpr, 0, 0, (cssW / VW) * dpr, 0, 0);
}
new ResizeObserver(resize).observe(stage);
resize();

/** Pointer position in virtual coords. */
function toVirtual(e: PointerEvent): { x: number; y: number } {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * VW, y: ((e.clientY - r.top) / r.height) * VH };
}

function clampAim(p: { x: number; y: number }): { x: number; y: number } {
  return {
    x: Math.min(GOAL.right - AIM_INSET.x, Math.max(GOAL.left + AIM_INSET.x, p.x)),
    y: Math.min(GOAL.ground - AIM_INSET.bottom, Math.max(GOAL.top + AIM_INSET.top, p.y)),
  };
}

canvas.addEventListener("pointermove", (e) => {
  if (state.phase !== "aim") return;
  state.aim = clampAim(toVirtual(e));
});

canvas.addEventListener("pointerdown", (e) => {
  if (state.phase !== "aim") return;
  state.aim = clampAim(toVirtual(e));
  shoot();
});

/* ---------------- Flags (drawn on canvas) -------------------------------- */

const flagCache = new Map<string, HTMLImageElement>();
function flagImg(team: Team | null): HTMLImageElement | null {
  if (!team) return null;
  let img = flagCache.get(team.iso2);
  if (!img) {
    img = new Image();
    img.src = flagUrl(team.iso2);
    flagCache.set(team.iso2, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

/* ---------------- Game flow ---------------------------------------------- */

function startGame(player: Team): void {
  state.player = player;
  const others = teams.filter((t) => t.fifaCode !== player.fifaCode);
  state.keeperTeam = others[Math.floor(Math.random() * others.length)];
  state.shot = 0;
  state.results = [];
  state.outcome = null;
  state.shotTarget = null;
  state.divePoint = null;
  state.lastDiveZone = -1;
  state.particles = [];
  state.phase = "aim";
  updateHud();
  removeOverlay();
  flagImg(player); // warm the cache
  flagImg(state.keeperTeam);
}

function shoot(): void {
  // Small natural deviation so perfect corner shots still feel earned.
  const dev = () => (Math.random() - 0.5) * 26;
  state.shotTarget = clampAim({ x: state.aim.x + dev(), y: state.aim.y + dev() });
  state.divePoint = pickDive();
  state.flightT0 = performance.now();
  state.phase = "fly";
}

/** Keeper picks one of 6 zones (3 cols × 2 rows), avoiding boring repeats. */
function pickDive(): { x: number; y: number } {
  const cols = [GOAL.left + 78, 500, GOAL.right - 78];
  const rows = [GOAL.top + 68, GOAL.ground - 66];
  let zone = Math.floor(Math.random() * 6);
  if (zone === state.lastDiveZone && Math.random() < 0.7) {
    zone = (zone + 1 + Math.floor(Math.random() * 4)) % 6;
  }
  state.lastDiveZone = zone;
  const x = cols[zone % 3] + (Math.random() - 0.5) * 30;
  const y = rows[Math.floor(zone / 3)] + (Math.random() - 0.5) * 24;
  return { x, y };
}

const FLIGHT_MS = 560;
const RESULT_MS = 1250;

function settleShot(): void {
  const t = state.shotTarget!;
  const d = state.divePoint!;
  const dx = (t.x - d.x) / KEEPER_REACH.rx;
  const dy = (t.y - d.y) / KEEPER_REACH.ry;
  const saved = dx * dx + dy * dy <= 1;
  state.outcome = saved ? "save" : "goal";
  state.results.push(state.outcome);
  state.resultT0 = performance.now();
  state.phase = "result";
  if (!saved) {
    state.cheer = 1;
    spawnConfetti(t.x, t.y);
  }
  updateHud();
}

function nextShot(): void {
  state.shot += 1;
  state.outcome = null;
  state.shotTarget = null;
  state.divePoint = null;
  if (state.shot >= SHOTS_PER_GAME) {
    state.phase = "end";
    showEndOverlay();
  } else {
    state.phase = "aim";
  }
}

/* ---------------- HUD + overlays ----------------------------------------- */

function updateHud(): void {
  const slots: string[] = [];
  for (let i = 0; i < SHOTS_PER_GAME; i++) {
    slots.push(state.results[i] === "goal" ? "⚽" : state.results[i] === "save" ? "🧤" : "–");
  }
  scoreEl.textContent = slots.join(" ");
  if (state.player && state.keeperTeam) {
    teamsLineEl.innerHTML =
      `<img src="${flagUrl(state.player.iso2)}" style="width:18px;height:12px;border-radius:2px;vertical-align:-1px"> ` +
      `${state.player.teamName} vs ${state.keeperTeam.teamName} ` +
      `<img src="${flagUrl(state.keeperTeam.iso2)}" style="width:18px;height:12px;border-radius:2px;vertical-align:-1px"> 🧤`;
  }
}

function removeOverlay(): void {
  document.querySelectorAll(".gp-overlay").forEach((el) => el.remove());
}

function showTeamPicker(): void {
  removeOverlay();
  const overlay = document.createElement("div");
  overlay.className = "gp-overlay";
  const card = document.createElement("div");
  card.className = "gp-card";
  card.innerHTML =
    `<h2>⚽ Pick your team · 选择你的球队</h2>` +
    `<p class="sub">5 penalty shots against a cartoon keeper — good luck! · 五轮点球,祝你好运!</p>`;
  const grid = document.createElement("div");
  grid.className = "team-grid";
  for (const t of teams) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "team-btn";
    btn.innerHTML =
      `<img src="${flagUrl(t.iso2)}" alt="${t.fifaCode}" loading="lazy">` +
      `<span>${t.teamName}</span><span class="zh">${t.nameZh}</span>`;
    btn.addEventListener("click", () => startGame(t));
    grid.appendChild(btn);
  }
  card.appendChild(grid);
  overlay.appendChild(card);
  stage.appendChild(overlay);
}

function showEndOverlay(): void {
  const goals = state.results.filter((r) => r === "goal").length;
  const rating =
    goals === 5 ? ["🏆", "World class! 世界级表现!"] :
    goals === 4 ? ["🌟", "Superstar! 巨星水准!"] :
    goals === 3 ? ["👍", "Nice shooting! 射术不错!"] :
    goals === 2 ? ["🙂", "Keep going! 继续加油!"] :
    ["💪", "Practice makes perfect! 多多练习!"];
  const overlay = document.createElement("div");
  overlay.className = "gp-overlay";
  const card = document.createElement("div");
  card.className = "gp-card";
  card.innerHTML =
    `<div class="end-emoji">${rating[0]}</div>` +
    `<div class="end-score">${goals} / ${SHOTS_PER_GAME}</div>` +
    `<p class="sub">${rating[1]}</p>`;
  const again = document.createElement("button");
  again.className = "gp-big-btn";
  again.textContent = "Play again · 再来一局";
  again.addEventListener("click", () => startGame(state.player!));
  const change = document.createElement("a");
  change.className = "gp-link-btn";
  change.href = "#";
  change.textContent = "Change team · 换支球队";
  change.addEventListener("click", (e) => {
    e.preventDefault();
    state.phase = "pick";
    showTeamPicker();
  });
  card.appendChild(again);
  card.appendChild(document.createElement("br"));
  card.appendChild(change);
  overlay.appendChild(card);
  stage.appendChild(overlay);
}

/* ---------------- Confetti ------------------------------------------------ */

const CONFETTI_COLORS = ["#ffc857", "#ff9e80", "#5b86e5", "#5ec9a0", "#b8a6f0"];

function spawnConfetti(x: number, y: number): void {
  const now = performance.now();
  for (let i = 0; i < 42; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 2 + Math.random() * 5;
    state.particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 3.5,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      emoji: i % 7 === 0 ? "⚽" : i % 9 === 0 ? "🎉" : undefined,
      born: now,
    });
  }
}

/* ---------------- Crowd (pre-generated) ---------------------------------- */

const crowd: { x: number; y: number; c: string; ph: number }[] = [];
{
  const crowdColors = ["#f7c8a0", "#e8a87c", "#c98d64", "#8d5b3f", "#f4e1c1"];
  for (let i = 0; i < 260; i++) {
    crowd.push({
      x: 8 + Math.random() * (VW - 16),
      y: 78 + Math.random() * 96,
      c: crowdColors[i % crowdColors.length],
      ph: Math.random() * Math.PI * 2,
    });
  }
}

/* ---------------- Rendering ---------------------------------------------- */

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function draw(now: number): void {
  ctx.clearRect(0, 0, VW, VH);

  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, 240);
  sky.addColorStop(0, "#8ecdf2");
  sky.addColorStop(1, "#cfe9fa");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VW, 240);

  // Sun + clouds
  ctx.fillStyle = "#ffe9a8";
  ctx.beginPath();
  ctx.arc(90, 54, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  for (const [cx, cy, s] of [[240, 46, 1], [660, 34, 0.8], [880, 60, 1.15]] as const) {
    const dx = ((now / 90) % (VW + 200)) * 0.18;
    const x = ((cx + dx) % (VW + 120)) - 60;
    ctx.beginPath();
    ctx.arc(x, cy, 18 * s, 0, Math.PI * 2);
    ctx.arc(x + 20 * s, cy - 8 * s, 14 * s, 0, Math.PI * 2);
    ctx.arc(x + 40 * s, cy, 16 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stadium stand + crowd
  ctx.fillStyle = "#5b86e5";
  ctx.fillRect(0, 64, VW, 118);
  ctx.fillStyle = "#3a4a73";
  ctx.fillRect(0, 64, VW, 10);
  for (const p of crowd) {
    const bounce = Math.sin(now / 260 + p.ph) * (1.4 + state.cheer * 5);
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.arc(p.x, p.y + bounce, 4.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Grass with mow stripes
  ctx.fillStyle = "#5ec9a0";
  ctx.fillRect(0, 182, VW, VH - 182);
  ctx.fillStyle = "rgba(52,177,135,0.5)";
  for (let i = 0; i < 6; i++) ctx.fillRect(0, 210 + i * 76, VW, 38);

  // Penalty box hint
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 3;
  ctx.strokeRect(180, GOAL.ground + 4, 640, 176);

  // Goal (net, posts)
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 1.4;
  const netBulge = state.phase === "result" && state.outcome === "goal"
    ? Math.max(0, 1 - (now - state.resultT0) / 500) * 10
    : 0;
  for (let x = GOAL.left; x <= GOAL.right; x += 25) {
    ctx.beginPath();
    ctx.moveTo(x, GOAL.top);
    ctx.lineTo(x, GOAL.ground + netBulge * 0.4);
    ctx.stroke();
  }
  for (let y = GOAL.top; y <= GOAL.ground; y += 24) {
    ctx.beginPath();
    ctx.moveTo(GOAL.left, y);
    ctx.quadraticCurveTo(500, y + netBulge, GOAL.right, y);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(GOAL.left, GOAL.ground);
  ctx.lineTo(GOAL.left, GOAL.top);
  ctx.lineTo(GOAL.right, GOAL.top);
  ctx.lineTo(GOAL.right, GOAL.ground);
  ctx.stroke();

  drawKeeper(now);

  // Aim reticle
  if (state.phase === "aim") {
    const { x, y } = state.aim;
    const pulse = 1 + Math.sin(now / 180) * 0.08;
    ctx.strokeStyle = "#ff9e80";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(x, y, 20 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#ff9e80";
    ctx.fill();
  }

  drawBall(now);
  drawParticles(now);

  // Shot counter bottom-left + player flag chip
  const img = flagImg(state.player);
  if (img) ctx.drawImage(img, 24, VH - 54, 42, 28);
  ctx.fillStyle = "#3a4a73";
  ctx.font = "700 20px Inter, sans-serif";
  if (state.phase !== "pick") {
    ctx.fillText(`Shot ${Math.min(state.shot + 1, SHOTS_PER_GAME)} / ${SHOTS_PER_GAME}`, 78, VH - 33);
  }

  // Result banner
  if (state.phase === "result" && state.outcome) {
    const t = Math.min(1, (now - state.resultT0) / 240);
    const scale = 0.6 + easeOutCubic(t) * 0.4;
    ctx.save();
    ctx.translate(500, 130);
    ctx.scale(scale, scale);
    ctx.font = "800 58px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 10;
    if (state.outcome === "goal") {
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.fillStyle = "#34b187";
      ctx.strokeText("GOAL! 进球啦!", 0, 0);
      ctx.fillText("GOAL! 进球啦!", 0, 0);
    } else {
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.fillStyle = "#ff9e80";
      ctx.strokeText("SAVED! 被扑出!", 0, 0);
      ctx.fillText("SAVED! 被扑出!", 0, 0);
    }
    ctx.restore();
    ctx.textAlign = "left";
  }

  // State transitions driven by time
  if (state.phase === "fly" && now - state.flightT0 >= FLIGHT_MS) settleShot();
  if (state.phase === "result" && now - state.resultT0 >= RESULT_MS) nextShot();

  state.cheer = Math.max(0, state.cheer - 0.008);
}

function drawKeeper(now: number): void {
  let kx = KEEPER_BASE.x;
  let ky = KEEPER_BASE.y;
  let lean = Math.sin(now / 420) * 0.06; // idle sway
  let stretch = 0;

  if ((state.phase === "fly" || state.phase === "result") && state.divePoint) {
    const t = Math.min(1, (now - state.flightT0) / FLIGHT_MS);
    const e = easeOutCubic(t);
    kx = KEEPER_BASE.x + (state.divePoint.x - KEEPER_BASE.x) * e;
    ky = KEEPER_BASE.y + (state.divePoint.y - KEEPER_BASE.y) * e * 0.9;
    lean = ((state.divePoint.x - KEEPER_BASE.x) / (GOAL.right - GOAL.left)) * 1.5 * e;
    stretch = e;
  }

  ctx.save();
  ctx.translate(kx, ky);
  ctx.rotate(lean);

  // Body (jersey)
  ctx.fillStyle = "#ff9e80";
  ctx.strokeStyle = "#3a4a73";
  ctx.lineWidth = 3;
  roundRect(-20, -26, 40, 52, 12);
  ctx.fill();
  ctx.stroke();

  // Arms — spread wide when diving
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#ff9e80";
  const armY = -14;
  const spread = 26 + stretch * 26;
  const raise = 10 + stretch * 26;
  ctx.beginPath();
  ctx.moveTo(-14, armY);
  ctx.lineTo(-spread, armY - raise);
  ctx.moveTo(14, armY);
  ctx.lineTo(spread, armY - raise);
  ctx.stroke();
  // Gloves
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#3a4a73";
  ctx.lineWidth = 2;
  for (const gx of [-spread, spread]) {
    ctx.beginPath();
    ctx.arc(gx, armY - raise, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Legs
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#3a4a73";
  ctx.beginPath();
  ctx.moveTo(-9, 26);
  ctx.lineTo(-12, 44);
  ctx.moveTo(9, 26);
  ctx.lineTo(12, 44);
  ctx.stroke();

  // Head + face
  ctx.fillStyle = "#f7c8a0";
  ctx.strokeStyle = "#3a4a73";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -44, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#3a4a73";
  const happy = state.phase === "result" && state.outcome === "save";
  ctx.beginPath();
  ctx.arc(-6, -47, 2.2, 0, Math.PI * 2);
  ctx.arc(6, -47, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  if (happy) ctx.arc(0, -41, 6, 0.15 * Math.PI, 0.85 * Math.PI);
  else ctx.arc(0, -36, 5, 1.15 * Math.PI, 1.85 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

function drawBall(now: number): void {
  let bx = BALL_START.x;
  let by = BALL_START.y;
  let r = 15;

  if (state.phase === "fly" && state.shotTarget) {
    const t = Math.min(1, (now - state.flightT0) / FLIGHT_MS);
    const e = easeOutCubic(t);
    bx = BALL_START.x + (state.shotTarget.x - BALL_START.x) * e;
    by = BALL_START.y + (state.shotTarget.y - BALL_START.y) * e - Math.sin(t * Math.PI) * 40;
    r = 15 - 6 * e;
  } else if (state.phase === "result" && state.shotTarget) {
    bx = state.shotTarget.x;
    by = state.shotTarget.y;
    r = 9;
    if (state.outcome === "save" && state.divePoint) {
      bx = state.divePoint.x;
      by = state.divePoint.y - 26;
    }
  }

  // Shadow (only while on/near the ground)
  if (state.phase === "aim" || state.phase === "pick") {
    ctx.fillStyle = "rgba(58,74,115,0.18)";
    ctx.beginPath();
    ctx.ellipse(bx, by + 16, 18, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const spin = now / 140;
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(state.phase === "fly" ? spin : 0);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#3a4a73";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#3a4a73";
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawParticles(now: number): void {
  state.particles = state.particles.filter((p) => now - p.born < 1100);
  for (const p of state.particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.16;
    p.rot += p.vr;
    const life = 1 - (now - p.born) / 1100;
    ctx.save();
    ctx.globalAlpha = Math.max(0, life);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    if (p.emoji) {
      ctx.font = "18px sans-serif";
      ctx.fillText(p.emoji, -9, 6);
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(-5, -3, 10, 6);
    }
    ctx.restore();
  }
}

function roundRect(x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ---------------- Boot ---------------------------------------------------- */

function loop(now: number): void {
  draw(now);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
showTeamPicker();
