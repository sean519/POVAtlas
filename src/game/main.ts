import { teams } from "../data/teams";
import { flagUrl } from "../utils/flags";
import type { Team } from "../types";

/**
 * Cartoon Penalty v2 — a FULL penalty shootout (subpage /game).
 *
 * Real shootout rules: five rounds, you shoot first then GUARD YOUR GOAL as
 * the keeper, early finish when it's mathematically decided, sudden death if
 * level after five. Shooting has a timed POWER bar (stop it in the green
 * "sweet zone" for a perfect strike; two perfect goals in a row light the
 * next ball on FIRE). Saving is a mind-game: click a goal zone to dive while
 * the shooter runs up — watch for the tell arrow, but it lies 35% of the
 * time. Posts go CLANK, crowds bounce, confetti flies. English-only UI.
 *
 * Debug helpers (not linked in the UI): ?auto=1 self-plays, and
 * window.__penalty = { S, tick(frames), click(x, y) } drives the game with a
 * fixed timestep for deterministic testing (works in occluded tabs).
 */

/* ---------------- Scene constants (virtual 1000×640) ---------------------- */

const VW = 1000;
const VH = 640;
const GOAL = { left: 280, right: 720, top: 200, ground: 430 };
const AIM_INSET = { x: 22, top: 20, bottom: 14 };
const BALL_START = { x: 500, y: 566 };
const KEEPER_BASE = { x: 500, y: 386 };
const REACH = { rx: 86, ry: 70 };

const ZONE_X = [360, 500, 640];
const ZONE_Y = [268, 372];
const zoneCenter = (z: number) => ({ x: ZONE_X[z % 3], y: ZONE_Y[Math.floor(z / 3)] });

const POWER_CYCLE_MS = 1200;
const SWEET = { lo: 0.7, hi: 0.92 };
const MY_FLY_MS = 560;
const RESULT_MS = 1500;
const OPP_RUN_MS = 1300;
const OPP_FLY_MS = 480;

const AUTO_PLAY = new URLSearchParams(location.search).get("auto") === "1";

type Outcome = "goal" | "saved" | "miss";
type Phase =
  | "pick" | "aim" | "power" | "myFly" | "myResult"
  | "oppRun" | "oppFly" | "oppResult" | "end";

/* ---------------- State ---------------------------------------------------- */

interface Particle {
  x: number; y: number; vx: number; vy: number;
  color: string; emoji?: string; born: number; life: number;
}

const S = {
  phase: "pick" as Phase,
  myTeam: null as Team | null,
  oppTeam: null as Team | null,
  kicksMine: [] as Outcome[],
  kicksOpp: [] as Outcome[],
  aim: { x: 500, y: 320 },
  powerT0: 0,
  shot: { target: { x: 500, y: 320 }, fire: false, quality: "ok" as "perfect" | "ok" | "weak", t0: 0, flyMs: MY_FLY_MS },
  keeperDive: null as { x: number; y: number } | null,
  keeperT0: 0,
  lastDiveZone: -1,
  opp: { target: { x: 500, y: 320 }, zone: 4, t0: 0, tellSide: 1, willMiss: false },
  myDive: null as number | null,
  banner: null as { text: string; color: string; t0: number } | null,
  comment: null as { text: string; t0: number } | null,
  outcomeFace: null as "happy" | "sad" | null,
  particles: [] as Particle[],
  shake: 0,
  cheer: 0,
  streak: 0,
  resultT0: 0,
  autoT0: 0,
  lastTick: 0,
};

/* ---------------- DOM ------------------------------------------------------ */

const stage = document.getElementById("gp-stage") as HTMLDivElement;
const canvas = document.getElementById("pitch") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const scoreEl = document.getElementById("gp-score") as HTMLDivElement;
const teamsLineEl = document.getElementById("gp-teams-line") as HTMLDivElement;

function resize(): void {
  const pad = 20;
  const maxW = stage.clientWidth - pad;
  const maxH = stage.clientHeight - pad;
  const cssW = Math.min(maxW, (maxH * VW) / VH);
  const cssH = (cssW * VH) / VW;
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  ctx.setTransform((cssW / VW) * dpr, 0, 0, (cssW / VW) * dpr, 0, 0);
}
new ResizeObserver(resize).observe(stage);
resize();

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
  if (S.phase === "aim") S.aim = clampAim(toVirtual(e));
});
canvas.addEventListener("pointerdown", (e) => routeClick(toVirtual(e)));

function routeClick(p: { x: number; y: number }): void {
  const now = S.lastTick || performance.now();
  if (S.phase === "aim") {
    S.aim = clampAim(p);
    S.powerT0 = now;
    S.phase = "power";
  } else if (S.phase === "power") {
    lockPower(now);
  } else if (S.phase === "oppRun") {
    // Choose (or change) the dive zone: nearest zone to the click.
    let best = 0, bd = Infinity;
    for (let z = 0; z < 6; z++) {
      const c = zoneCenter(z);
      const d = Math.hypot(p.x - c.x, p.y - c.y);
      if (d < bd) { bd = d; best = z; }
    }
    S.myDive = best;
  }
}

/* ---------------- Flow ------------------------------------------------------ */

const COMMENTS: Record<string, string[]> = {
  myGoal: ["Top bins! 🎯", "Unstoppable!", "Cool as ice 🧊", "The net is still shaking!"],
  myGoalFire: ["FLAMING ROCKET! 🔥", "The keeper never saw it!"],
  mySaved: ["Kept out! What a keeper…", "Denied! 🧤", "Too close to the gloves."],
  myMiss: ["CLANG! Off the woodwork!", "Inches wide! 😅", "Over the bar!"],
  oppGoal: ["They bury it… 😖", "No chance on that one.", "Right in the corner."],
  mySave: ["WHAT A SAVE! 🧤", "You read it like a book!", "Fingertips to the rescue!"],
  oppMiss: ["Off the post — lucky you! 🍀", "They skied it! 😂"],
};
const pick = (k: string) => COMMENTS[k][Math.floor(Math.random() * COMMENTS[k].length)];

function startShootout(mine: Team): void {
  S.myTeam = mine;
  const others = teams.filter((t) => t.fifaCode !== mine.fifaCode);
  S.oppTeam = others[Math.floor(Math.random() * others.length)];
  S.kicksMine = [];
  S.kicksOpp = [];
  S.streak = 0;
  S.particles = [];
  S.banner = null;
  S.comment = null;
  removeOverlay();
  updateHud();
  beginMyKick();
}

function beginMyKick(): void {
  const now = S.lastTick || performance.now();
  S.phase = "aim";
  S.aim = { x: 500, y: 320 };
  S.keeperDive = null;
  S.outcomeFace = null;
  S.autoT0 = now;
}

function lockPower(now: number): void {
  const val = powerVal(now);
  const quality = val >= SWEET.lo && val <= SWEET.hi ? "perfect" : val < 0.4 ? "weak" : "ok";
  const fire = S.streak >= 2;
  const dev = quality === "perfect" ? 8 : quality === "ok" ? 30 : 55;
  const a = Math.random() * Math.PI * 2;
  const target = { x: S.aim.x + Math.cos(a) * dev * Math.random(), y: S.aim.y + Math.sin(a) * dev * Math.random() };
  S.shot = {
    target, fire, quality, t0: now,
    flyMs: fire ? 420 : quality === "weak" ? 720 : MY_FLY_MS,
  };
  // AI keeper picks a dive zone (weighted, avoids boring repeats).
  let zone = Math.floor(Math.random() * 6);
  if (zone === S.lastDiveZone && Math.random() < 0.7) zone = (zone + 1 + Math.floor(Math.random() * 4)) % 6;
  S.lastDiveZone = zone;
  const zc = zoneCenter(zone);
  S.keeperDive = { x: zc.x + (Math.random() - 0.5) * 30, y: zc.y + (Math.random() - 0.5) * 24 };
  S.keeperT0 = now;
  S.phase = "myFly";
}

function resolveMyShot(now: number): void {
  const t = S.shot.target;
  let outcome: Outcome;
  let bannerText = "";
  let color = "#34b187";
  let commentKey = "";

  const insideGoal =
    t.x > GOAL.left + 8 && t.x < GOAL.right - 8 && t.y > GOAL.top + 8 && t.y < GOAL.ground - 4;

  if (!insideGoal) {
    outcome = "miss";
    bannerText = "CLANK!";
    color = "#ffc857";
    commentKey = "myMiss";
    clank(t.x, t.y);
  } else {
    const d = S.keeperDive!;
    const factor = S.shot.fire ? 0.45 : S.shot.quality === "perfect" ? 0.7 : S.shot.quality === "weak" ? 1.45 : 1.0;
    const dx = (t.x - d.x) / (REACH.rx * factor);
    const dy = (t.y - d.y) / (REACH.ry * factor);
    if (dx * dx + dy * dy <= 1) {
      outcome = "saved";
      bannerText = "SAVED!";
      color = "#ff9e80";
      commentKey = "mySaved";
      S.outcomeFace = "happy";
    } else {
      outcome = "goal";
      bannerText = "GOAL!";
      commentKey = S.shot.fire ? "myGoalFire" : "myGoal";
      S.outcomeFace = "sad";
      S.cheer = 1;
      confetti(t.x, t.y);
      S.shake = Math.min(8, S.shake + (S.shot.fire ? 7 : 4));
    }
  }

  if (outcome === "goal" && S.shot.quality === "perfect" && !S.shot.fire) S.streak += 1;
  else S.streak = 0;

  S.kicksMine.push(outcome);
  S.banner = { text: bannerText, color, t0: now };
  S.comment = { text: pick(commentKey), t0: now };
  S.resultT0 = now;
  S.phase = "myResult";
  updateHud();
}

function beginOppKick(now: number): void {
  S.phase = "oppRun";
  S.myDive = null;
  S.keeperDive = null;
  S.outcomeFace = null;
  // Opponent picks a corner-loving target.
  const r = Math.random();
  const zone = r < 0.3 ? 3 : r < 0.6 ? 5 : r < 0.75 ? 0 : r < 0.9 ? 2 : r < 0.96 ? 4 : 1;
  const zc = zoneCenter(zone);
  const target = { x: zc.x + (Math.random() - 0.5) * 56, y: zc.y + (Math.random() - 0.5) * 40 };
  const willMiss = Math.random() < 0.12;
  if (willMiss) {
    target.x = Math.random() < 0.5 ? GOAL.left - 14 : GOAL.right + 14;
    target.y = GOAL.top + Math.random() * 80;
  }
  const trueSide = target.x < 470 ? -1 : target.x > 530 ? 1 : Math.random() < 0.5 ? -1 : 1;
  S.opp = {
    target, zone, t0: now,
    tellSide: Math.random() < 0.65 ? trueSide : -trueSide as -1 | 1,
    willMiss,
  };
  S.autoT0 = now;
}

function resolveOppShot(now: number): void {
  const shotZone = nearestZone(S.opp.target);
  let outcome: Outcome;
  let bannerText: string;
  let color: string;
  let commentKey: string;

  if (S.opp.willMiss) {
    outcome = "miss";
    bannerText = "OFF TARGET!";
    color = "#ffc857";
    commentKey = "oppMiss";
    clank(S.opp.target.x, S.opp.target.y);
  } else if (S.myDive !== null && diveSaves(S.myDive, shotZone)) {
    outcome = "saved";
    bannerText = "WHAT A SAVE!";
    color = "#34b187";
    commentKey = "mySave";
    S.outcomeFace = "happy";
    S.cheer = 1;
    confetti(zoneCenter(S.myDive).x, zoneCenter(S.myDive).y);
    S.shake = Math.min(8, S.shake + 5);
  } else if (S.myDive === null && Math.random() < 0.12) {
    outcome = "saved";
    bannerText = "LUCKY FEET!";
    color = "#34b187";
    commentKey = "mySave";
    S.outcomeFace = "happy";
  } else {
    outcome = "goal";
    bannerText = "THEY SCORE…";
    color = "#ff9e80";
    commentKey = "oppGoal";
    S.outcomeFace = "sad";
  }

  S.kicksOpp.push(outcome);
  S.banner = { text: bannerText, color, t0: now };
  S.comment = { text: pick(commentKey), t0: now };
  S.resultT0 = now;
  S.phase = "oppResult";
  updateHud();
}

function nearestZone(p: { x: number; y: number }): number {
  let best = 0, bd = Infinity;
  for (let z = 0; z < 6; z++) {
    const c = zoneCenter(z);
    const d = Math.hypot(p.x - c.x, p.y - c.y);
    if (d < bd) { bd = d; best = z; }
  }
  return best;
}

/** Same zone = save; adjacent (sharing an edge) = 30% chance. */
function diveSaves(dive: number, shot: number): boolean {
  if (dive === shot) return true;
  const dr = Math.abs(Math.floor(dive / 3) - Math.floor(shot / 3));
  const dc = Math.abs((dive % 3) - (shot % 3));
  if (dr + dc === 1) return Math.random() < 0.3;
  return false;
}

const goals = (arr: Outcome[]) => arr.filter((o) => o === "goal").length;

/** null = keep playing, otherwise the shootout is over. */
function decision(): "win" | "lose" | null {
  const gm = goals(S.kicksMine);
  const go = goals(S.kicksOpp);
  const km = S.kicksMine.length;
  const ko = S.kicksOpp.length;
  if (km <= 5 && ko <= 5 && (km < 5 || ko < 5)) {
    if (gm > go + (5 - ko)) return "win";
    if (go > gm + (5 - km)) return "lose";
    return null;
  }
  // From round five onward: equal kicks taken decides.
  if (km === ko) {
    if (gm > go) return "win";
    if (go > gm) return "lose";
  }
  return null;
}

function advance(now: number): void {
  const verdict = decision();
  if (verdict) { showEnd(verdict); return; }
  if (S.kicksMine.length > S.kicksOpp.length) beginOppKick(now);
  else beginMyKick();
}

/* ---------------- FX -------------------------------------------------------- */

function confetti(x: number, y: number): void {
  const now = S.lastTick || performance.now();
  const colors = ["#ffc857", "#ff9e80", "#5b86e5", "#5ec9a0", "#b8a6f0"];
  for (let i = 0; i < 42; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 2 + Math.random() * 5;
    S.particles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3.5,
      color: colors[i % colors.length],
      emoji: i % 7 === 0 ? "⚽" : i % 9 === 0 ? "🎉" : undefined,
      born: now, life: 1100,
    });
  }
}

function clank(x: number, y: number): void {
  const now = S.lastTick || performance.now();
  S.shake = Math.min(8, S.shake + 5);
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2;
    S.particles.push({
      x, y, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4 - 1,
      color: "#ffffff", born: now, life: 450,
    });
  }
}

/* ---------------- HUD / overlays -------------------------------------------- */

function updateHud(): void {
  if (!S.myTeam || !S.oppTeam) return;
  scoreEl.innerHTML =
    `<img src="${flagUrl(S.myTeam.iso2)}" style="width:18px;height:12px;border-radius:2px;vertical-align:-1px"> ` +
    `${goals(S.kicksMine)} : ${goals(S.kicksOpp)} ` +
    `<img src="${flagUrl(S.oppTeam.iso2)}" style="width:18px;height:12px;border-radius:2px;vertical-align:-1px">`;
  teamsLineEl.textContent = `${S.myTeam.teamName} vs ${S.oppTeam.teamName} — best of 5`;
}

function removeOverlay(): void {
  document.querySelectorAll(".gp-overlay").forEach((el) => el.remove());
}

function showTeamPicker(): void {
  removeOverlay();
  S.phase = "pick";
  const overlay = document.createElement("div");
  overlay.className = "gp-overlay";
  const card = document.createElement("div");
  card.className = "gp-card";
  card.innerHTML =
    `<h2>🎯 CARTOON PENALTY</h2>` +
    `<p class="sub">A full shootout — shoot AND save. Best of five, sudden death if level. Pick your team!</p>`;
  const grid = document.createElement("div");
  grid.className = "team-grid";
  for (const t of teams) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "team-btn";
    btn.innerHTML =
      `<img src="${flagUrl(t.iso2)}" alt="${t.fifaCode}" loading="lazy">` +
      `<span>${t.teamName}</span>`;
    btn.addEventListener("click", () => startShootout(t));
    grid.appendChild(btn);
  }
  card.appendChild(grid);
  overlay.appendChild(card);
  stage.appendChild(overlay);
}

function showEnd(verdict: "win" | "lose"): void {
  S.phase = "end";
  const gm = goals(S.kicksMine);
  const go = goals(S.kicksOpp);
  const saves = S.kicksOpp.filter((o) => o === "saved").length;
  const overlay = document.createElement("div");
  overlay.className = "gp-overlay";
  const card = document.createElement("div");
  card.className = "gp-card";
  const sub =
    verdict === "win"
      ? saves >= 2
        ? "Your keeper wall was unbeatable! 🧤🧱"
        : "Nerves of steel from the spot!"
      : "So close — one more try, you've got this!";
  card.innerHTML =
    `<div class="end-emoji">${verdict === "win" ? "🏆" : "😭"}</div>` +
    `<div class="end-score">${gm} : ${go}</div>` +
    `<p class="sub">${verdict === "win" ? "YOU WIN THE SHOOTOUT!" : "Heartbreak at the spot…"} ${sub}</p>`;
  const again = document.createElement("button");
  again.className = "gp-big-btn";
  again.textContent = "Play again";
  again.addEventListener("click", () => startShootout(S.myTeam!));
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

/* ---------------- Update ----------------------------------------------------- */

function powerVal(now: number): number {
  const ph = ((now - S.powerT0) % POWER_CYCLE_MS) / POWER_CYCLE_MS * 2;
  return ph < 1 ? ph : 2 - ph;
}

function update(now: number): void {
  if (S.phase === "myFly" && now - S.shot.t0 >= S.shot.flyMs) resolveMyShot(now);
  if (S.phase === "oppRun" && now - S.opp.t0 >= OPP_RUN_MS) { S.opp.t0 = now; S.phase = "oppFly"; }
  else if (S.phase === "oppFly" && now - S.opp.t0 >= OPP_FLY_MS) resolveOppShot(now);
  if ((S.phase === "myResult" || S.phase === "oppResult") && now - S.resultT0 >= RESULT_MS) advance(now);

  if (AUTO_PLAY) {
    if (S.phase === "aim" && now - S.autoT0 > 260) {
      routeClick({ x: GOAL.left + 40 + Math.random() * (GOAL.right - GOAL.left - 80), y: GOAL.top + 30 + Math.random() * 180 });
    } else if (S.phase === "power" && powerVal(now) > 0.55 && Math.random() < 0.2) {
      lockPower(now);
    } else if (S.phase === "oppRun" && S.myDive === null && now - S.autoT0 > 600) {
      S.myDive = Math.floor(Math.random() * 6);
    }
  }

  S.cheer = Math.max(0, S.cheer - 0.008);
  S.shake = Math.max(0, S.shake - 0.2);
  const cutoff = now;
  S.particles = S.particles.filter((p) => cutoff - p.born < p.life);
  for (const p of S.particles) {
    p.x += p.vx; p.y += p.vy; p.vy += 0.16;
  }
}

/* ---------------- Drawing ---------------------------------------------------- */

const crowd: { x: number; y: number; c: string; ph: number }[] = [];
{
  const cs = ["#f7c8a0", "#e8a87c", "#c98d64", "#8d5b3f", "#f4e1c1"];
  for (let i = 0; i < 260; i++) {
    crowd.push({ x: 8 + Math.random() * (VW - 16), y: 78 + Math.random() * 96, c: cs[i % cs.length], ph: Math.random() * Math.PI * 2 });
  }
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function draw(now: number): void {
  ctx.save();
  if (S.shake > 0.3) ctx.translate((Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake);
  ctx.clearRect(-10, -10, VW + 20, VH + 20);

  // Sky, sun, clouds
  const sky = ctx.createLinearGradient(0, 0, 0, 240);
  sky.addColorStop(0, "#8ecdf2");
  sky.addColorStop(1, "#cfe9fa");
  ctx.fillStyle = sky;
  ctx.fillRect(-10, -10, VW + 20, 250);
  ctx.fillStyle = "#ffe9a8";
  ctx.beginPath(); ctx.arc(90, 54, 30, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  for (const [cx, cy, s] of [[240, 46, 1], [660, 34, 0.8], [880, 60, 1.15]] as const) {
    const x = ((cx + (now / 90) * 0.18) % (VW + 120)) - 60;
    ctx.beginPath();
    ctx.arc(x, cy, 18 * s, 0, Math.PI * 2);
    ctx.arc(x + 20 * s, cy - 8 * s, 14 * s, 0, Math.PI * 2);
    ctx.arc(x + 40 * s, cy, 16 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stand + crowd
  ctx.fillStyle = "#5b86e5"; ctx.fillRect(-10, 64, VW + 20, 118);
  ctx.fillStyle = "#3a4a73"; ctx.fillRect(-10, 64, VW + 20, 10);
  for (const p of crowd) {
    const b = Math.sin(now / 260 + p.ph) * (1.4 + S.cheer * 5);
    ctx.fillStyle = p.c;
    ctx.beginPath(); ctx.arc(p.x, p.y + b, 4.4, 0, Math.PI * 2); ctx.fill();
  }

  // Grass
  ctx.fillStyle = "#5ec9a0"; ctx.fillRect(-10, 182, VW + 20, VH - 172);
  ctx.fillStyle = "rgba(52,177,135,0.5)";
  for (let i = 0; i < 6; i++) ctx.fillRect(-10, 210 + i * 76, VW + 20, 38);
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 3;
  ctx.strokeRect(180, GOAL.ground + 4, 640, 176);

  // Goal net (+ bulge on goals)
  const isGoalResult =
    (S.phase === "myResult" && S.kicksMine[S.kicksMine.length - 1] === "goal") ||
    (S.phase === "oppResult" && S.kicksOpp[S.kicksOpp.length - 1] === "goal");
  const bulge = isGoalResult ? Math.max(0, 1 - (now - S.resultT0) / 500) * 10 : 0;
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 1.4;
  for (let x = GOAL.left; x <= GOAL.right; x += 25) {
    ctx.beginPath(); ctx.moveTo(x, GOAL.top); ctx.lineTo(x, GOAL.ground + bulge * 0.4); ctx.stroke();
  }
  for (let y = GOAL.top; y <= GOAL.ground; y += 24) {
    ctx.beginPath(); ctx.moveTo(GOAL.left, y); ctx.quadraticCurveTo(500, y + bulge, GOAL.right, y); ctx.stroke();
  }
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(GOAL.left, GOAL.ground);
  ctx.lineTo(GOAL.left, GOAL.top);
  ctx.lineTo(GOAL.right, GOAL.top);
  ctx.lineTo(GOAL.right, GOAL.ground);
  ctx.stroke();

  // Dive-zone grid while the opponent runs up
  if (S.phase === "oppRun") {
    for (let z = 0; z < 6; z++) {
      const c = zoneCenter(z);
      const w = 132, h = 100;
      ctx.fillStyle = S.myDive === z ? "rgba(255,200,87,0.3)" : "rgba(255,255,255,0.07)";
      ctx.fillRect(c.x - w / 2, c.y - h / 2, w, h);
      ctx.strokeStyle = S.myDive === z ? "#ffc857" : "rgba(255,255,255,0.4)";
      ctx.lineWidth = S.myDive === z ? 4 : 1.5;
      ctx.strokeRect(c.x - w / 2, c.y - h / 2, w, h);
    }
    if (S.myDive === null) {
      ctx.font = "800 26px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "rgba(58,74,115,0.8)";
      ctx.lineWidth = 5;
      ctx.strokeText("CLICK A ZONE TO DIVE! 🧤", 500, 175);
      ctx.fillText("CLICK A ZONE TO DIVE! 🧤", 500, 175);
      ctx.textAlign = "left";
    }
  }

  drawKeeper(now);
  if (S.phase === "oppRun" || S.phase === "oppFly") drawShooter(now);

  // Aim reticle
  if (S.phase === "aim" || S.phase === "power") {
    const { x, y } = S.aim;
    const pulse = 1 + Math.sin(now / 180) * 0.08;
    ctx.strokeStyle = "#ff9e80";
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(x, y, 20 * pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fillStyle = "#ff9e80"; ctx.fill();
  }

  drawBall(now);
  drawParticles(now);
  if (S.phase === "power") drawPowerBar(now);
  drawPips();
  drawFireHint();

  // Banner + commentary
  if (S.banner && now - S.banner.t0 < 1400) {
    const t = Math.min(1, (now - S.banner.t0) / 240);
    ctx.save();
    ctx.translate(500, 130);
    ctx.scale(0.6 + easeOut(t) * 0.4, 0.6 + easeOut(t) * 0.4);
    ctx.font = "800 58px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 10;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.fillStyle = S.banner.color;
    ctx.strokeText(S.banner.text, 0, 0);
    ctx.fillText(S.banner.text, 0, 0);
    ctx.restore();
    ctx.textAlign = "left";
  }
  if (S.comment && now - S.comment.t0 < 1500) {
    ctx.font = "700 24px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#3a4a73";
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 6;
    ctx.strokeText(S.comment.text, 500, 168);
    ctx.fillText(S.comment.text, 500, 168);
    ctx.textAlign = "left";
  }

  ctx.restore();
}

function drawKeeper(now: number): void {
  // Whose keeper? Opponent guards when I shoot; MY keeper guards opp kicks.
  const myKick = ["aim", "power", "myFly", "myResult"].includes(S.phase);
  const jersey = myKick ? "#ff9e80" : "#5b86e5";
  let kx = KEEPER_BASE.x, ky = KEEPER_BASE.y;
  let lean = Math.sin(now / 420) * 0.06;
  let stretch = 0;

  let dive: { x: number; y: number } | null = null;
  let t = 0;
  if (myKick && S.keeperDive && (S.phase === "myFly" || S.phase === "myResult")) {
    dive = S.keeperDive;
    t = Math.min(1, (now - S.shot.t0) / S.shot.flyMs);
  } else if (!myKick && S.phase === "oppFly" && S.myDive !== null) {
    dive = zoneCenter(S.myDive);
    t = Math.min(1, (now - S.opp.t0) / OPP_FLY_MS);
  } else if (!myKick && S.phase === "oppResult" && S.myDive !== null) {
    dive = zoneCenter(S.myDive);
    t = 1;
  }
  if (dive) {
    const e = easeOut(t);
    kx = KEEPER_BASE.x + (dive.x - KEEPER_BASE.x) * e;
    ky = KEEPER_BASE.y + (dive.y - KEEPER_BASE.y) * e * 0.9;
    lean = ((dive.x - KEEPER_BASE.x) / (GOAL.right - GOAL.left)) * 1.5 * e;
    stretch = e;
  }

  ctx.save();
  ctx.translate(kx, ky);
  ctx.rotate(lean);
  ctx.fillStyle = jersey;
  ctx.strokeStyle = "#3a4a73";
  ctx.lineWidth = 3;
  roundRect(-20, -26, 40, 52, 12);
  ctx.fill(); ctx.stroke();
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.strokeStyle = jersey;
  const armY = -14;
  const spread = 26 + stretch * 26;
  const raise = 10 + stretch * 26;
  ctx.beginPath();
  ctx.moveTo(-14, armY); ctx.lineTo(-spread, armY - raise);
  ctx.moveTo(14, armY); ctx.lineTo(spread, armY - raise);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#3a4a73";
  ctx.lineWidth = 2;
  for (const gx of [-spread, spread]) {
    ctx.beginPath(); ctx.arc(gx, armY - raise, 7.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.lineWidth = 8;
  ctx.strokeStyle = "#3a4a73";
  ctx.beginPath();
  ctx.moveTo(-9, 26); ctx.lineTo(-12, 44);
  ctx.moveTo(9, 26); ctx.lineTo(12, 44);
  ctx.stroke();
  ctx.fillStyle = "#f7c8a0";
  ctx.strokeStyle = "#3a4a73";
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, -44, 17, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#3a4a73";
  ctx.beginPath();
  ctx.arc(-6, -47, 2.2, 0, Math.PI * 2);
  ctx.arc(6, -47, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  if (S.outcomeFace === "happy") ctx.arc(0, -41, 6, 0.15 * Math.PI, 0.85 * Math.PI);
  else if (S.outcomeFace === "sad") ctx.arc(0, -36, 5, 1.15 * Math.PI, 1.85 * Math.PI);
  else ctx.arc(0, -38, 4, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

function drawShooter(now: number): void {
  // Opponent striker approaching the spot.
  const t = S.phase === "oppRun" ? Math.min(1, (now - S.opp.t0) / OPP_RUN_MS) : 1;
  const sx = 590 - easeOut(t) * 62;
  const sy = 610 - easeOut(t) * 28;
  const lean = S.phase === "oppFly" ? -0.35 : Math.sin(now / 200) * 0.05 - t * 0.15;

  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(lean);
  ctx.fillStyle = "#f23a3a";
  ctx.strokeStyle = "#3a4a73";
  ctx.lineWidth = 2.6;
  roundRect(-15, -20, 30, 40, 10);
  ctx.fill(); ctx.stroke();
  ctx.lineWidth = 7;
  ctx.strokeStyle = "#3a4a73";
  ctx.beginPath();
  ctx.moveTo(-7, 20); ctx.lineTo(-14, 36);
  ctx.moveTo(7, 20); ctx.lineTo(S.phase === "oppFly" ? 22 : 10, S.phase === "oppFly" ? 26 : 36);
  ctx.stroke();
  ctx.fillStyle = "#e8a87c";
  ctx.strokeStyle = "#3a4a73";
  ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.arc(0, -34, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();

  // The tell: a hint arrow late in the run-up… but it lies sometimes.
  if (S.phase === "oppRun" && now - S.opp.t0 > OPP_RUN_MS - 450) {
    const ax = 500 + S.opp.tellSide * 60;
    ctx.fillStyle = "#ffc857";
    ctx.font = "800 34px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(S.opp.tellSide < 0 ? "⬅️" : "➡️", ax, 560);
    ctx.textAlign = "left";
  }
}

function drawBall(now: number): void {
  let bx = BALL_START.x, by = BALL_START.y, r = 15;
  let flying = false;

  if (S.phase === "myFly") {
    const t = Math.min(1, (now - S.shot.t0) / S.shot.flyMs);
    const e = easeOut(t);
    bx = BALL_START.x + (S.shot.target.x - BALL_START.x) * e;
    by = BALL_START.y + (S.shot.target.y - BALL_START.y) * e - Math.sin(t * Math.PI) * 40;
    r = 15 - 6 * e;
    flying = true;
    if (S.shot.fire) {
      S.particles.push({
        x: bx + (Math.random() - 0.5) * 6, y: by + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5,
        color: Math.random() < 0.5 ? "#ff9e4a" : "#ffc857", born: now, life: 320,
      });
    }
  } else if (S.phase === "myResult") {
    const o = S.kicksMine[S.kicksMine.length - 1];
    r = 9;
    if (o === "saved" && S.keeperDive) { bx = S.keeperDive.x; by = S.keeperDive.y - 26; }
    else { bx = S.shot.target.x; by = S.shot.target.y; }
  } else if (S.phase === "oppFly") {
    const t = Math.min(1, (now - S.opp.t0) / OPP_FLY_MS);
    const e = easeOut(t);
    bx = BALL_START.x + (S.opp.target.x - BALL_START.x) * e;
    by = BALL_START.y + (S.opp.target.y - BALL_START.y) * e - Math.sin(t * Math.PI) * 36;
    r = 15 - 6 * e;
    flying = true;
  } else if (S.phase === "oppResult") {
    const o = S.kicksOpp[S.kicksOpp.length - 1];
    r = 9;
    if (o === "saved" && S.myDive !== null) { const c = zoneCenter(S.myDive); bx = c.x; by = c.y - 26; }
    else { bx = S.opp.target.x; by = S.opp.target.y; }
  }

  if (!flying && (S.phase === "aim" || S.phase === "power" || S.phase === "oppRun")) {
    ctx.fillStyle = "rgba(58,74,115,0.18)";
    ctx.beginPath(); ctx.ellipse(bx, by + 16, 18, 5.5, 0, 0, Math.PI * 2); ctx.fill();
  }

  ctx.save();
  ctx.translate(bx, by);
  if (flying) ctx.rotate(now / 140);
  ctx.fillStyle = S.shot.fire && (S.phase === "myFly") ? "#fff3e0" : "#ffffff";
  ctx.strokeStyle = S.shot.fire && (S.phase === "myFly") ? "#e5644a" : "#3a4a73";
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = S.shot.fire && (S.phase === "myFly") ? "#e5644a" : "#3a4a73";
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPowerBar(now: number): void {
  const val = powerVal(now);
  const x = 350, y = 598, w = 300, h = 20;
  ctx.fillStyle = "rgba(58,74,115,0.75)";
  roundRect(x - 4, y - 4, w + 8, h + 8, 8);
  ctx.fill();
  // Sweet zone
  ctx.fillStyle = "rgba(94,201,160,0.9)";
  ctx.fillRect(x + w * SWEET.lo, y, w * (SWEET.hi - SWEET.lo), h);
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(x, y, w * val, h);
  // Needle
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + w * val - 2.5, y - 6, 5, h + 12);
  ctx.font = "800 17px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("CLICK TO SHOOT — HIT THE GREEN!", 500, y - 14);
  ctx.textAlign = "left";
}

function drawPips(): void {
  if (S.phase === "pick" || !S.myTeam || !S.oppTeam) return;
  const n = Math.max(5, S.kicksMine.length, S.kicksOpp.length);
  const pip = (o: Outcome | undefined) => (o === "goal" ? "⚽" : o === "saved" ? "🧤" : o === "miss" ? "❌" : "·");
  ctx.font = "700 22px Inter, sans-serif";
  ctx.fillStyle = "#3a4a73";
  let mine = "", opp = "";
  for (let i = 0; i < n; i++) { mine += pip(S.kicksMine[i]) + " "; opp += pip(S.kicksOpp[i]) + " "; }
  ctx.fillText(`YOU  ${mine}`, 26, 40);
  ctx.fillText(`${S.oppTeam.fifaCode}  ${opp}`, 26, 70);
  if (S.kicksMine.length > 5 || S.kicksOpp.length > 5 || (S.kicksMine.length === 5 && S.kicksOpp.length === 5 && goals(S.kicksMine) === goals(S.kicksOpp) && S.phase !== "end")) {
    ctx.fillStyle = "#e5644a";
    ctx.font = "800 20px Inter, sans-serif";
    ctx.fillText("SUDDEN DEATH!", 26, 100);
  }
}

function drawFireHint(): void {
  if (S.phase !== "aim" && S.phase !== "power") return;
  if (S.streak >= 2) {
    ctx.font = "800 24px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#e5644a";
    ctx.fillText("🔥 FIRE BALL LOADED! 🔥", 500, 555);
    ctx.textAlign = "left";
  } else if (S.streak === 1) {
    ctx.font = "700 18px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#3a4a73";
    ctx.fillText("One more PERFECT goal for a fire ball…", 500, 555);
    ctx.textAlign = "left";
  }
}

function drawParticles(now: number): void {
  for (const p of S.particles) {
    const life = 1 - (now - p.born) / p.life;
    ctx.save();
    ctx.globalAlpha = Math.max(0, life);
    if (p.emoji) {
      ctx.font = "18px sans-serif";
      ctx.fillText(p.emoji, p.x - 9, p.y + 6);
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 5, p.y - 3, 10, 6);
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
  S.lastTick = now;
  if (S.phase !== "pick" && S.phase !== "end") update(now);
  draw(now);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
showTeamPicker();

// Debug handles for deterministic testing (harmless in production).
const dbg = window as unknown as {
  __penalty: { S: typeof S; tick: (frames: number) => void; click: (x: number, y: number) => void };
};
dbg.__penalty = {
  S,
  tick: (frames: number) => {
    for (let i = 0; i < frames; i++) {
      const now = (S.lastTick || performance.now()) + 16.7;
      S.lastTick = now;
      if (S.phase !== "pick" && S.phase !== "end") update(now);
    }
  },
  click: (x: number, y: number) => routeClick({ x, y }),
};
