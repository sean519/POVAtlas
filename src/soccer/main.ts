import { teams } from "../data/teams";
import { flagUrl } from "../utils/flags";
import type { Team } from "../types";

/**
 * Arcade Soccer 热血足球 — a fast cartoon 4v4 match (subpage /soccer).
 *
 * Kunio-kun-inspired arcade soccer in pure canvas: you control the blue team's
 * player nearest the ball (auto-switch), dribble, pass, tackle by contact and
 * shoot — hold possession to fill the 🔥 meter and unleash a blazing super
 * shot. Keyboard (WASD/arrows + J/Space shoot + K pass) and touch (left-half
 * joystick + on-screen buttons). Bilingual, no React, no external assets
 * besides the flag CDN.
 *
 * Debug helpers (not linked in the UI): ?t=SECONDS match length, ?auto=1 lets
 * the AI play your team too.
 */

/* ---------------- Constants ---------------------------------------------- */

const VW = 1000;
const VH = 640;
const FIELD = { left: 50, right: 950, top: 70, bottom: 610 };
const MOUTH = { top: 270, bottom: 410 };
const GOAL_DEPTH = 26;
const CENTER = { x: 500, y: 340 };

const PLAYER_R = 15;
const BALL_R = 9;
const RUN_SPEED = 3.2;
const AI_SPEED = 2.9;
const KEEPER_SPEED = 2.6;
const SHOT_SPEED = 10.5;
const FIRE_SHOT_SPEED = 15;
const PASS_SPEED = 8.5;
const CAPTURE_R = 16;
const STEAL_R = 19;
const FIRE_FILL_MS = 2600;

const params = new URLSearchParams(location.search);
const MATCH_SECONDS = Math.max(10, Number(params.get("t")) || 120);
const AUTO_PLAY = params.get("auto") === "1";

/* ---------------- Types --------------------------------------------------- */

interface P {
  team: 0 | 1;               // 0 = you (attack right), 1 = opponent (attack left)
  keeper: boolean;
  x: number; y: number;
  vx: number; vy: number;
  faceX: number; faceY: number;
  anchorX: number; anchorY: number;
  skin: string;
  captureCd: number;         // can't capture the ball before this timestamp
  holdT0: number;            // when possession was gained (keeper punting)
  runPhase: number;
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  color: string; emoji?: string; born: number; life: number;
}

type Phase = "pick" | "kickoff" | "play" | "goal" | "end";

/* ---------------- State ---------------------------------------------------- */

const state = {
  phase: "pick" as Phase,
  myTeam: null as Team | null,
  oppTeam: null as Team | null,
  players: [] as P[],
  ball: { x: CENTER.x, y: CENTER.y, vx: 0, vy: 0, owner: null as P | null, fire: false, wobble: 0 },
  controlled: null as P | null,
  score: [0, 0] as [number, number],
  timeLeft: MATCH_SECONDS,
  fireMeter: 0,              // 0..1, fills while your controlled player carries
  banner: null as { text: string; color: string; t0: number } | null,
  kickoffT0: 0,
  goalT0: 0,
  particles: [] as Particle[],
  lastTick: 0,
};

/* ---------------- DOM ------------------------------------------------------ */

const stage = document.getElementById("gp-stage") as HTMLDivElement;
const canvas = document.getElementById("pitch") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const scoreEl = document.getElementById("gp-score") as HTMLDivElement;
const timeEl = document.getElementById("gp-time") as HTMLDivElement;
const teamsLineEl = document.getElementById("gp-teams-line") as HTMLDivElement;

function resize(): void {
  const pad = 16;
  const maxW = stage.clientWidth - pad;
  const maxH = stage.clientHeight - pad;
  const w = Math.min(maxW, (maxH * VW) / VH);
  const h = (w * VH) / VW;
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform((w / VW) * dpr, 0, 0, (w / VW) * dpr, 0, 0);
}
new ResizeObserver(resize).observe(stage);
resize();

/* ---------------- Input ---------------------------------------------------- */

const keys = new Set<string>();
let shootQueued = false;
let passQueued = false;

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
  if (k === "j" || k === " ") { shootQueued = true; return; }
  if (k === "k" || k === "shift") { passQueued = true; return; }
  keys.add(k);
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

// Touch joystick on the left half of the canvas.
const joy = { id: -1, ox: 0, oy: 0, dx: 0, dy: 0 };
canvas.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "touch") return;
  const r = canvas.getBoundingClientRect();
  if (e.clientX - r.left > r.width / 2 || joy.id !== -1) return;
  joy.id = e.pointerId;
  joy.ox = e.clientX; joy.oy = e.clientY; joy.dx = 0; joy.dy = 0;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointermove", (e) => {
  if (e.pointerId !== joy.id) return;
  const m = 52;
  joy.dx = Math.max(-m, Math.min(m, e.clientX - joy.ox)) / m;
  joy.dy = Math.max(-m, Math.min(m, e.clientY - joy.oy)) / m;
});
const endJoy = (e: PointerEvent) => {
  if (e.pointerId !== joy.id) return;
  joy.id = -1; joy.dx = 0; joy.dy = 0;
};
canvas.addEventListener("pointerup", endJoy);
canvas.addEventListener("pointercancel", endJoy);

for (const [id, fn] of [["btn-shoot", () => (shootQueued = true)], ["btn-pass", () => (passQueued = true)]] as const) {
  const el = document.getElementById(id)!;
  el.addEventListener("pointerdown", (e) => { e.preventDefault(); fn(); });
}

function inputDir(): { x: number; y: number } {
  let x = 0, y = 0;
  if (keys.has("a") || keys.has("arrowleft")) x -= 1;
  if (keys.has("d") || keys.has("arrowright")) x += 1;
  if (keys.has("w") || keys.has("arrowup")) y -= 1;
  if (keys.has("s") || keys.has("arrowdown")) y += 1;
  if (joy.id !== -1 && (Math.abs(joy.dx) > 0.18 || Math.abs(joy.dy) > 0.18)) {
    x = joy.dx; y = joy.dy;
  }
  const len = Math.hypot(x, y);
  return len > 1 ? { x: x / len, y: y / len } : { x, y };
}

/* ---------------- Setup ----------------------------------------------------- */

const SKINS = ["#f7c8a0", "#e8a87c", "#c98d64", "#8d5b3f"];

function makeTeamPlayers(team: 0 | 1): P[] {
  // Formation anchors as fractions of field width (mirrored for team 1).
  const spots = [
    { fx: 0.06, fy: 0.5, keeper: true },
    { fx: 0.28, fy: 0.5, keeper: false },
    { fx: 0.46, fy: 0.24, keeper: false },
    { fx: 0.46, fy: 0.76, keeper: false },
  ];
  return spots.map((s, i) => {
    const fx = team === 0 ? s.fx : 1 - s.fx;
    const x = FIELD.left + fx * (FIELD.right - FIELD.left);
    const y = FIELD.top + s.fy * (FIELD.bottom - FIELD.top);
    return {
      team, keeper: s.keeper,
      x, y, vx: 0, vy: 0,
      faceX: team === 0 ? 1 : -1, faceY: 0,
      anchorX: x, anchorY: y,
      skin: SKINS[(i + team) % SKINS.length],
      captureCd: 0, holdT0: 0, runPhase: Math.random() * 10,
    };
  });
}

function startMatch(mine: Team): void {
  state.myTeam = mine;
  const others = teams.filter((t) => t.fifaCode !== mine.fifaCode);
  state.oppTeam = others[Math.floor(Math.random() * others.length)];
  state.players = [...makeTeamPlayers(0), ...makeTeamPlayers(1)];
  state.score = [0, 0];
  state.timeLeft = MATCH_SECONDS;
  state.fireMeter = 0;
  state.particles = [];
  removeOverlay();
  updateHud();
  kickoff();
}

function kickoff(): void {
  const now = state.lastTick || performance.now();
  for (const p of state.players) {
    p.x = p.anchorX; p.y = p.anchorY; p.vx = 0; p.vy = 0;
    p.captureCd = 0;
  }
  Object.assign(state.ball, { x: CENTER.x, y: CENTER.y, vx: 0, vy: 0, owner: null, fire: false, wobble: 0 });
  state.controlled = null;
  state.banner = { text: "GO! 开球!", color: "#ffc857", t0: now };
  state.kickoffT0 = now;
  state.phase = "kickoff";
}

/* ---------------- HUD / overlays -------------------------------------------- */

function updateHud(): void {
  if (state.myTeam && state.oppTeam) {
    scoreEl.innerHTML =
      `<img src="${flagUrl(state.myTeam.iso2)}"> ${state.score[0]} : ${state.score[1]} <img src="${flagUrl(state.oppTeam.iso2)}">`;
    teamsLineEl.textContent = `${state.myTeam.teamName} vs ${state.oppTeam.teamName}`;
  }
  const m = Math.floor(state.timeLeft / 60);
  const s = Math.max(0, Math.floor(state.timeLeft % 60));
  timeEl.textContent = `${m}:${String(s).padStart(2, "0")}`;
}

function removeOverlay(): void {
  document.querySelectorAll(".gp-overlay").forEach((el) => el.remove());
}

function showTeamPicker(): void {
  removeOverlay();
  state.phase = "pick";
  const overlay = document.createElement("div");
  overlay.className = "gp-overlay";
  const card = document.createElement("div");
  card.className = "gp-card";
  card.innerHTML =
    `<h2>⚽ Pick your team · 选择你的球队</h2>` +
    `<p class="sub">4v4 arcade match — fill the 🔥 meter for a super shot! · 蓄满火焰放必杀!</p>`;
  const grid = document.createElement("div");
  grid.className = "team-grid";
  for (const t of teams) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "team-btn";
    btn.innerHTML =
      `<img src="${flagUrl(t.iso2)}" alt="${t.fifaCode}" loading="lazy">` +
      `<span>${t.teamName}</span><span class="zh">${t.nameZh}</span>`;
    btn.addEventListener("click", () => startMatch(t));
    grid.appendChild(btn);
  }
  card.appendChild(grid);
  overlay.appendChild(card);
  stage.appendChild(overlay);
}

function showEndOverlay(): void {
  state.phase = "end";
  const [a, b] = state.score;
  const [emoji, line] =
    a > b ? ["🏆", "You win! 你赢啦!"] :
    a === b ? ["🤝", "Draw! 平局!"] :
    ["💪", "So close — again! 差一点,再来!"];
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
  again.textContent = "Play again · 再来一局";
  again.addEventListener("click", () => startMatch(state.myTeam!));
  const change = document.createElement("a");
  change.className = "gp-link-btn";
  change.href = "#";
  change.textContent = "Change team · 换支球队";
  change.addEventListener("click", (e) => { e.preventDefault(); showTeamPicker(); });
  card.appendChild(again);
  card.appendChild(document.createElement("br"));
  card.appendChild(change);
  overlay.appendChild(card);
  stage.appendChild(overlay);
}

/* ---------------- Helpers ---------------------------------------------------- */

const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(bx - ax, by - ay);

function goalCenterX(team: 0 | 1): number {
  // The goal this team ATTACKS.
  return team === 0 ? FIELD.right : FIELD.left;
}

function outfield(team: 0 | 1): P[] {
  return state.players.filter((p) => p.team === team && !p.keeper);
}

function nearestOpponent(p: P): P | null {
  let best: P | null = null;
  let bd = Infinity;
  for (const q of state.players) {
    if (q.team === p.team) continue;
    const d = dist(p.x, p.y, q.x, q.y);
    if (d < bd) { bd = d; best = q; }
  }
  return best;
}

/* ---------------- Ball actions ------------------------------------------------ */

function gainPossession(p: P, now: number): void {
  state.ball.owner = p;
  state.ball.fire = false;
  p.holdT0 = now;
  if (p.team !== 0) state.fireMeter = 0;
}

function shoot(p: P, now: number): void {
  const b = state.ball;
  const gx = goalCenterX(p.team) + (p.team === 0 ? GOAL_DEPTH / 2 : -GOAL_DEPTH / 2);
  // Aim: bias by the shooter's vertical facing, clamped inside the mouth.
  let gy = (MOUTH.top + MOUTH.bottom) / 2 + p.faceY * 130;
  gy = Math.max(MOUTH.top + 14, Math.min(MOUTH.bottom - 14, gy + (Math.random() - 0.5) * 50));
  const fire = p.team === 0 && !p.keeper && state.fireMeter >= 1;
  const speed = fire ? FIRE_SHOT_SPEED : SHOT_SPEED;
  const d = dist(p.x, p.y, gx, gy) || 1;
  b.owner = null;
  b.vx = ((gx - p.x) / d) * speed;
  b.vy = ((gy - p.y) / d) * speed;
  b.fire = fire;
  b.wobble = 0;
  p.captureCd = now + 600;
  if (p.team === 0) state.fireMeter = 0;
}

function pass(p: P, now: number): void {
  const mates = outfield(p.team).filter((q) => q !== p);
  if (mates.length === 0) return;
  // Prefer the most advanced open teammate.
  const attackDir = p.team === 0 ? 1 : -1;
  let best = mates[0];
  let bestScore = -Infinity;
  for (const m of mates) {
    const adv = m.x * attackDir;
    const opp = nearestOpponent(m);
    const open = opp ? Math.min(120, dist(m.x, m.y, opp.x, opp.y)) : 120;
    const score = adv + open * 0.8;
    if (score > bestScore) { bestScore = score; best = m; }
  }
  const b = state.ball;
  const lead = 26 * attackDir;
  const d = dist(p.x, p.y, best.x + lead, best.y) || 1;
  b.owner = null;
  b.fire = false;
  b.vx = ((best.x + lead - p.x) / d) * PASS_SPEED;
  b.vy = ((best.y - p.y) / d) * PASS_SPEED;
  p.captureCd = now + 400;
}

/* ---------------- Update ------------------------------------------------------ */

function pickControlled(): void {
  if (AUTO_PLAY) { state.controlled = null; return; }
  const b = state.ball;
  const mine = outfield(0);
  let best = state.controlled && !state.controlled.keeper ? state.controlled : mine[0];
  let bd = state.controlled ? dist(state.controlled.x, state.controlled.y, b.x, b.y) - 24 : Infinity;
  for (const p of mine) {
    const d = dist(p.x, p.y, b.x, b.y);
    if (d < bd) { bd = d; best = p; }
  }
  state.controlled = best;
}

function movePlayer(p: P, dx: number, dy: number, speed: number, dt: number): void {
  const len = Math.hypot(dx, dy);
  if (len > 0.01) {
    p.vx = (dx / len) * speed;
    p.vy = (dy / len) * speed;
    p.faceX = dx / len;
    p.faceY = dy / len;
    p.runPhase += dt * 0.02 * speed;
  } else {
    p.vx = 0; p.vy = 0;
  }
  p.x += p.vx * dt * 0.06;
  p.y += p.vy * dt * 0.06;
  if (p.keeper) {
    const homeX = p.team === 0 ? FIELD.left + 14 : FIELD.right - 14;
    p.x = Math.max(homeX - 22, Math.min(homeX + 40, p.x));
    p.y = Math.max(MOUTH.top - 30, Math.min(MOUTH.bottom + 30, p.y));
  } else {
    p.x = Math.max(FIELD.left + 8, Math.min(FIELD.right - 8, p.x));
    p.y = Math.max(FIELD.top + 8, Math.min(FIELD.bottom - 8, p.y));
  }
}

function aiFor(p: P, now: number): { x: number; y: number; speed: number } {
  const b = state.ball;
  const attackDir = p.team === 0 ? 1 : -1;

  if (p.keeper) {
    const ty = Math.max(MOUTH.top + 10, Math.min(MOUTH.bottom - 10, b.y));
    return { x: (p.team === 0 ? FIELD.left + 14 : FIELD.right - 14) - p.x, y: ty - p.y, speed: KEEPER_SPEED };
  }

  if (b.owner === p) {
    // Carrier: run at the goal, drift toward its vertical center.
    const gx = goalCenterX(p.team);
    const gy = (MOUTH.top + MOUTH.bottom) / 2 + Math.sin(now / 700 + p.runPhase) * 60;
    // Shoot when in range; pass when pressured.
    const inRange = Math.abs(gx - p.x) < 320;
    const opp = nearestOpponent(p);
    const pressured = opp && dist(p.x, p.y, opp.x, opp.y) < 55;
    if (inRange && Math.random() < 0.025) { shoot(p, now); }
    else if (pressured && Math.random() < 0.04) { pass(p, now); }
    return { x: gx - p.x, y: gy - p.y, speed: AI_SPEED };
  }

  // Nearest to the ball chases; others hold a formation shifted with the ball.
  const squad = outfield(p.team);
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
  const shift = (b.x - CENTER.x) * 0.3 + attackDir * (b.owner && b.owner.team === p.team ? 90 : 0);
  const tx = Math.max(FIELD.left + 30, Math.min(FIELD.right - 30, p.anchorX + shift));
  return { x: tx - p.x, y: p.anchorY + (b.y - CENTER.y) * 0.18 - p.y, speed: AI_SPEED * 0.9 };
}

function update(now: number, dt: number): void {
  const b = state.ball;

  if (state.phase === "kickoff" && now - state.kickoffT0 > 800) state.phase = "play";
  if (state.phase === "goal" && now - state.goalT0 > 1500) kickoff();
  if (state.phase !== "play" && state.phase !== "kickoff") return;

  if (state.phase === "play") {
    state.timeLeft -= dt / 1000;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      updateHud();
      showEndOverlay();
      return;
    }
  }

  pickControlled();

  // Move everyone.
  for (const p of state.players) {
    if (p === state.controlled && state.phase === "play") {
      const d = inputDir();
      movePlayer(p, d.x, d.y, RUN_SPEED, dt);
    } else {
      const a = aiFor(p, now);
      movePlayer(p, a.x, a.y, a.speed, dt);
    }
  }

  // Player actions (edge-triggered).
  if (state.controlled && b.owner === state.controlled && state.phase === "play") {
    if (shootQueued) shoot(state.controlled, now);
    else if (passQueued) pass(state.controlled, now);
  }
  shootQueued = false;
  passQueued = false;

  if (b.owner) {
    const o = b.owner;
    b.x = o.x + o.faceX * 20;
    b.y = o.y + o.faceY * 20 + 6;
    b.vx = 0; b.vy = 0;

    // Fire meter fills while YOUR player carries the ball.
    if (o.team === 0 && !o.keeper) {
      state.fireMeter = Math.min(1, state.fireMeter + dt / FIRE_FILL_MS);
    }

    // Keeper punts after a short hold.
    if (o.keeper && now - o.holdT0 > 550) {
      const attackDir = o.team === 0 ? 1 : -1;
      b.owner = null;
      b.vx = attackDir * 8;
      b.vy = (Math.random() - 0.5) * 5;
      o.captureCd = now + 800;
    }

    // Tackles: an opponent close enough knocks the ball loose.
    if (now - o.holdT0 > 500) {
      for (const q of state.players) {
        if (q.team === o.team || q.keeper) continue;
        if (dist(q.x, q.y, o.x, o.y) < STEAL_R + PLAYER_R) {
          const away = Math.atan2(o.y - q.y, o.x - q.x) + (Math.random() - 0.5);
          b.owner = null;
          b.vx = Math.cos(away) * 4.5;
          b.vy = Math.sin(away) * 4.5;
          o.captureCd = now + 350;
          q.captureCd = now + 150;
          break;
        }
      }
    }
  } else {
    // Loose ball physics.
    if (b.fire) {
      b.wobble += dt * 0.02;
      b.vy += Math.sin(b.wobble) * 0.25;
      state.particles.push({
        x: b.x, y: b.y,
        vx: -b.vx * 0.1 + (Math.random() - 0.5), vy: -b.vy * 0.1 + (Math.random() - 0.5),
        color: Math.random() < 0.5 ? "#ff9e80" : "#ffc857", born: now, life: 380,
      });
    }
    b.x += b.vx * dt * 0.06;
    b.y += b.vy * dt * 0.06;
    b.vx *= Math.pow(0.988, dt * 0.06);
    b.vy *= Math.pow(0.988, dt * 0.06);

    // Bounce off pitch bounds (except the goal mouths).
    if (b.y < FIELD.top + BALL_R) { b.y = FIELD.top + BALL_R; b.vy *= -0.7; }
    if (b.y > FIELD.bottom - BALL_R) { b.y = FIELD.bottom - BALL_R; b.vy *= -0.7; }
    const inMouth = b.y > MOUTH.top && b.y < MOUTH.bottom;
    if (b.x < FIELD.left + BALL_R && !inMouth) { b.x = FIELD.left + BALL_R; b.vx *= -0.7; }
    if (b.x > FIELD.right - BALL_R && !inMouth) { b.x = FIELD.right - BALL_R; b.vx *= -0.7; }

    // GOAL! (past the line inside a mouth)
    if (state.phase === "play") {
      if (b.x < FIELD.left - GOAL_DEPTH * 0.6 && inMouth) return scoreGoal(1, now);
      if (b.x > FIELD.right + GOAL_DEPTH * 0.6 && inMouth) return scoreGoal(0, now);
    }
    if (b.x < FIELD.left - GOAL_DEPTH) { b.x = FIELD.left - GOAL_DEPTH; b.vx *= -0.5; }
    if (b.x > FIELD.right + GOAL_DEPTH) { b.x = FIELD.right + GOAL_DEPTH; b.vx *= -0.5; }

    // Keeper save: fast incoming ball near the keeper may be caught.
    const speed = Math.hypot(b.vx, b.vy);
    for (const p of state.players) {
      if (now < p.captureCd) continue;
      const d = dist(p.x, p.y, b.x, b.y);
      if (p.keeper && speed > 5.5) {
        const towardOwnGoal = p.team === 0 ? b.vx < 0 : b.vx > 0;
        if (towardOwnGoal && d < 30) {
          const catchProb = b.fire ? 0.32 : 0.78;
          if (Math.random() < catchProb) { gainPossession(p, now); break; }
          // Deflect!
          b.vx *= -0.4;
          b.vy = (Math.random() - 0.5) * 7;
          b.fire = false;
          p.captureCd = now + 400;
          break;
        }
      }
      if (d < CAPTURE_R && speed < 9) { gainPossession(p, now); break; }
    }
  }

  updateHud();
}

function scoreGoal(team: 0 | 1, now: number): void {
  state.score[team] += 1;
  state.phase = "goal";
  state.goalT0 = now;
  state.banner = {
    text: team === 0 ? "GOAL! 进球啦!" : "OH NO! 丢球了!",
    color: team === 0 ? "#34b187" : "#ff9e80",
    t0: now,
  };
  const gx = team === 0 ? FIELD.right : FIELD.left;
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 2 + Math.random() * 5;
    state.particles.push({
      x: gx, y: state.ball.y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3,
      color: ["#ffc857", "#ff9e80", "#5b86e5", "#5ec9a0", "#b8a6f0"][i % 5],
      emoji: i % 8 === 0 ? "🎉" : undefined,
      born: now, life: 1100,
    });
  }
  Object.assign(state.ball, { vx: 0, vy: 0, owner: null, fire: false });
  updateHud();
}

/* ---------------- Rendering ---------------------------------------------------- */

function draw(now: number): void {
  ctx.clearRect(0, 0, VW, VH);

  // Grass + stripes
  ctx.fillStyle = "#4fbf95";
  ctx.fillRect(0, 0, VW, VH);
  ctx.fillStyle = "rgba(52,177,135,0.55)";
  for (let i = 0; i < 8; i++) ctx.fillRect(FIELD.left + i * 112.5, 0, 56, VH);

  // Lines
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 4;
  ctx.strokeRect(FIELD.left, FIELD.top, FIELD.right - FIELD.left, FIELD.bottom - FIELD.top);
  ctx.beginPath();
  ctx.moveTo(CENTER.x, FIELD.top);
  ctx.lineTo(CENTER.x, FIELD.bottom);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(CENTER.x, CENTER.y, 70, 0, Math.PI * 2);
  ctx.stroke();
  for (const side of [0, 1] as const) {
    const x = side === 0 ? FIELD.left : FIELD.right - 130;
    ctx.strokeRect(x, MOUTH.top - 60, 130, MOUTH.bottom - MOUTH.top + 120);
  }

  // Goals (net boxes outside the lines)
  for (const side of [0, 1] as const) {
    const gx = side === 0 ? FIELD.left - GOAL_DEPTH : FIELD.right;
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(gx, MOUTH.top, GOAL_DEPTH, MOUTH.bottom - MOUTH.top);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1.2;
    for (let y = MOUTH.top; y <= MOUTH.bottom; y += 14) {
      ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + GOAL_DEPTH, y); ctx.stroke();
    }
    for (let x = gx; x <= gx + GOAL_DEPTH; x += 9) {
      ctx.beginPath(); ctx.moveTo(x, MOUTH.top); ctx.lineTo(x, MOUTH.bottom); ctx.stroke();
    }
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 6;
    ctx.strokeRect(gx, MOUTH.top, GOAL_DEPTH, MOUTH.bottom - MOUTH.top);
  }

  // Particles under players
  state.particles = state.particles.filter((p) => now - p.born < p.life);
  for (const p of state.particles) {
    p.x += p.vx; p.y += p.vy; p.vy += 0.12;
    const life = 1 - (now - p.born) / p.life;
    ctx.globalAlpha = Math.max(0, life);
    if (p.emoji) { ctx.font = "16px sans-serif"; ctx.fillText(p.emoji, p.x - 8, p.y + 5); }
    else { ctx.fillStyle = p.color; ctx.fillRect(p.x - 4, p.y - 2.5, 8, 5); }
    ctx.globalAlpha = 1;
  }

  // Players (draw lower ones on top)
  const sorted = [...state.players].sort((a, b2) => a.y - b2.y);
  for (const p of sorted) drawPlayer(p, now);

  drawBall(now);
  drawMeter();

  // Joystick visual
  if (joy.id !== -1) {
    const r = canvas.getBoundingClientRect();
    const sx = ((joy.ox - r.left) / r.width) * VW;
    const sy = ((joy.oy - r.top) / r.height) * VH;
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(sx, sy, 40, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath(); ctx.arc(sx + joy.dx * 40, sy + joy.dy * 40, 16, 0, Math.PI * 2); ctx.fill();
  }

  // Banner
  if (state.banner && now - state.banner.t0 < 1400) {
    const t = Math.min(1, (now - state.banner.t0) / 220);
    ctx.save();
    ctx.translate(CENTER.x, 150);
    ctx.scale(0.6 + t * 0.4, 0.6 + t * 0.4);
    ctx.font = "800 54px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 10;
    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    ctx.fillStyle = state.banner.color;
    ctx.strokeText(state.banner.text, 0, 0);
    ctx.fillText(state.banner.text, 0, 0);
    ctx.restore();
    ctx.textAlign = "left";
  }
}

function drawPlayer(p: P, now: number): void {
  const jersey = p.keeper ? (p.team === 0 ? "#3a4a73" : "#8a4b32") : p.team === 0 ? "#5b86e5" : "#ff9e80";
  const moving = Math.abs(p.vx) + Math.abs(p.vy) > 0.3;

  // Shadow
  ctx.fillStyle = "rgba(11,31,58,0.18)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 18, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Controlled indicator
  if (p === state.controlled) {
    ctx.strokeStyle = "#ffc857";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y + 8, 20, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Legs (simple run cycle)
  const swing = moving ? Math.sin(p.runPhase) * 6 : 0;
  ctx.strokeStyle = "#3a4a73";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(p.x - 5, p.y + 6);
  ctx.lineTo(p.x - 5 + swing, p.y + 17);
  ctx.moveTo(p.x + 5, p.y + 6);
  ctx.lineTo(p.x + 5 - swing, p.y + 17);
  ctx.stroke();

  // Body
  ctx.fillStyle = jersey;
  ctx.strokeStyle = "#3a4a73";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(p.x - 11, p.y - 12, 22, 22, 7);
  ctx.fill();
  ctx.stroke();

  // Keeper gloves
  if (p.keeper) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(p.x - 13, p.y - 2, 4.5, 0, Math.PI * 2);
    ctx.arc(p.x + 13, p.y - 2, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head
  ctx.fillStyle = p.skin;
  ctx.strokeStyle = "#3a4a73";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(p.x, p.y - 21, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Eyes look toward facing
  ctx.fillStyle = "#3a4a73";
  ctx.beginPath();
  ctx.arc(p.x - 3 + p.faceX * 2, p.y - 22, 1.4, 0, Math.PI * 2);
  ctx.arc(p.x + 3 + p.faceX * 2, p.y - 22, 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Fire aura on your carrier when the meter is full
  if (state.ball.owner === p && p.team === 0 && state.fireMeter >= 1) {
    ctx.font = "16px sans-serif";
    ctx.fillText("🔥", p.x + 12, p.y - 24 + Math.sin(now / 120) * 2);
  }
}

function drawBall(now: number): void {
  const b = state.ball;
  ctx.fillStyle = "rgba(11,31,58,0.18)";
  ctx.beginPath();
  ctx.ellipse(b.x, b.y + 10, 10, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate((b.x + b.y) / 30);
  ctx.fillStyle = b.fire ? "#fff3e0" : "#ffffff";
  ctx.strokeStyle = b.fire ? "#e5644a" : "#3a4a73";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, 0, BALL_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = b.fire ? "#e5644a" : "#3a4a73";
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * BALL_R * 0.5, Math.sin(a) * BALL_R * 0.5, BALL_R * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  void now;
}

function drawMeter(): void {
  if (state.phase === "pick" || state.phase === "end") return;
  const w = 220, h = 14, x = CENTER.x - w / 2, y = 18;
  ctx.fillStyle = "rgba(58,74,115,0.35)";
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 7);
  ctx.fill();
  const grad = ctx.createLinearGradient(x, 0, x + w, 0);
  grad.addColorStop(0, "#ffc857");
  grad.addColorStop(1, "#e5644a");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x, y, w * state.fireMeter, h, 7);
  ctx.fill();
  ctx.font = "700 13px Inter, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(state.fireMeter >= 1 ? "🔥 SUPER SHOT READY! 必杀已就绪!" : "🔥 Super shot 蓄力", x + w + 10, y + 12);
}

/* ---------------- Boot ---------------------------------------------------------- */

function loop(now: number): void {
  const dt = Math.min(50, state.lastTick ? now - state.lastTick : 16);
  state.lastTick = now;
  if (state.phase !== "pick" && state.phase !== "end") update(now, dt);
  draw(now);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
showTeamPicker();

// Debug handles for automated testing (harmless in production). __soccerTick
// advances the simulation with a fixed timestep independent of rAF, so the
// engine can be exercised even when the tab is occluded (rAF frozen).
const dbg = window as unknown as {
  __soccer: typeof state;
  __soccerTick: (frames: number) => void;
};
dbg.__soccer = state;
dbg.__soccerTick = (frames: number) => {
  for (let i = 0; i < frames; i++) {
    const now = (state.lastTick || performance.now()) + 16.7;
    state.lastTick = now;
    if (state.phase !== "pick" && state.phase !== "end") update(now, 16.7);
  }
};
