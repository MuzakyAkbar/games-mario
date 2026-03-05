/**
 * ═══════════════════════════════════════════════════════════
 *  SUPER NUSA BROS — game.js
 *  Full platformer engine: physics, pixel-art rendering,
 *  enemies, coins, power-ups, 3 levels, particles & HUD.
 * ═══════════════════════════════════════════════════════════
 */

"use strict";

/* ──────────────────────────────────────────────
   CANVAS SETUP
────────────────────────────────────────────── */
const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");
const W = 768, H = 384, T = 32; // W=width, H=height, T=tile size

/* ──────────────────────────────────────────────
   PIXEL-ART COLOR PALETTE
────────────────────────────────────────────── */
const PAL = {
  // Sky
  skyTop: "#5C94FC",
  skyBot: "#92B4FF",

  // Ground / terrain
  grassTop:  "#52A820",
  groundSoil:"#C84B11",
  groundDark:"#8B3000",

  // Brick
  brick:     "#C84B11",
  brickLine: "#8B3000",

  // Question block
  qBlock:    "#E8B000",
  qShine:    "#FFEC60",
  qDark:     "#906000",

  // Pipe
  pipeGreen: "#00A830",
  pipeLight: "#38D858",
  pipeDark:  "#006818",

  // Coin
  coin:      "#FFD700",
  coinShine: "#FFFF90",

  // Player
  playerRed:  "#E82828",
  playerDark: "#A81010",
  playerFace: "#FFB870",
  playerPants:"#1050C8",
  playerShoe: "#502800",
  playerHat:  "#E82828",

  // Mushroom
  mushRed:  "#E82828",
  mushSpot: "#FFFFFF",
  mushStem: "#FFB870",

  // Goomba
  goombaBrown: "#8B4513",
  goombaDark:  "#5A2D00",
  goombaFace:  "#FFB870",

  // Koopa
  koopaShell: "#228B22",
  koopaLight: "#3CB83C",
  koopaFace:  "#FFB870",

  // Flag
  flagPole:  "#888888",
  flagGreen: "#00A830",

  // Cloud
  cloudWhite:  "#FFFFFF",
  cloudShadow: "#DDEEFF",

  // Stair (end castle steps)
  stairSoil:  "#C84B11",
  stairDark:  "#8B3000",
  stairLight: "#52A820",
};

/* ──────────────────────────────────────────────
   PHYSICS CONSTANTS
────────────────────────────────────────────── */
const GRAVITY    = 0.55;
const JUMP_FORCE = -13.5;
const MOVE_SPEED = 4.0;
const CAM_LERP   = 0.20;

/* ──────────────────────────────────────────────
   HELPER — generate ground row
────────────────────────────────────────────── */
function groundRow(x0, x1, y) {
  const arr = [];
  for (let x = x0; x < x1; x++) arr.push({ x, y, t: "g" });
  return arr;
}

/* ──────────────────────────────────────────────
   LEVEL DEFINITIONS
   Tile types:
     g  = ground block
     b  = brick (breakable when big)
     q  = question block  (item: 'coin' | 'mush')
     s  = stair block (solid, castle style)
     p  = pipe left  cap
     P  = pipe right cap
     ps = pipe left  body
     Ps = pipe right body
────────────────────────────────────────────── */
const LEVELS = [
  /* ─── WORLD 1-1 ─── */
  {
    w: 50,
    bgTop: "#5C94FC", bgBot: "#9BB4FF",
    clouds: [[3,1.5],[10,1.0],[18,1.8],[28,1.2],[38,1.6],[46,1.0]],

    tiles: [
      ...groundRow(0, 50, 12),

      // Row of bricks & question blocks  y=8
      { x:13, y:8, t:"b" },
      { x:14, y:8, t:"q", item:"coin" },
      { x:15, y:8, t:"b" },
      { x:16, y:8, t:"q", item:"mush" },
      { x:17, y:8, t:"b" },

      // Floating bricks  y=6
      { x:20, y:6, t:"b" },
      { x:21, y:6, t:"b" },
      { x:22, y:6, t:"q", item:"coin" },
      { x:23, y:6, t:"b" },
      { x:24, y:6, t:"b" },

      // Pipes (x6, x9)
      { x:6,  y:10, t:"p"  }, { x:7,  y:10, t:"P"  },
      { x:6,  y:11, t:"ps" }, { x:7,  y:11, t:"Ps" },

      { x:9,  y:9,  t:"p"  }, { x:10, y:9,  t:"P"  },
      { x:9,  y:10, t:"ps" }, { x:10, y:10, t:"Ps" },
      { x:9,  y:11, t:"ps" }, { x:10, y:11, t:"Ps" },

      // Pipe x24 & x37
      { x:24, y:10, t:"p"  }, { x:25, y:10, t:"P"  },
      { x:24, y:11, t:"ps" }, { x:25, y:11, t:"Ps" },
      { x:37, y:10, t:"p"  }, { x:38, y:10, t:"P"  },
      { x:37, y:11, t:"ps" }, { x:38, y:11, t:"Ps" },

      // Bricks x27-31, y=9
      { x:27, y:9, t:"b" },
      { x:28, y:9, t:"q", item:"coin" },
      { x:29, y:9, t:"b" },
      { x:30, y:9, t:"q", item:"mush" },
      { x:31, y:9, t:"b" },

      // Bricks x33-36, y=7
      { x:33, y:7, t:"b" },
      { x:34, y:7, t:"b" },
      { x:35, y:7, t:"q", item:"coin" },
      { x:36, y:7, t:"b" },

      // Castle stairs at end
      { x:44, y:11, t:"s" },
      { x:45, y:10, t:"s" }, { x:45, y:11, t:"s" },
      { x:46, y:9,  t:"s" }, { x:46, y:10, t:"s" }, { x:46, y:11, t:"s" },
      { x:47, y:8,  t:"s" }, { x:47, y:9,  t:"s" }, { x:47, y:10, t:"s" }, { x:47, y:11, t:"s" },
    ],

    freeCoins: [
      { x:14, y:7 }, { x:21, y:5 }, { x:22, y:5 }, { x:23, y:5 },
      { x:28, y:8 }, { x:35, y:6 },
    ],

    enemies: [
      { x:8,  y:11, t:"G" }, { x:13, y:11, t:"G" },
      { x:20, y:11, t:"G" }, { x:26, y:11, t:"K" },
      { x:34, y:11, t:"G" }, { x:40, y:11, t:"K" },
    ],

    flagCol: 48,
  },

  /* ─── WORLD 1-2 ─── */
  {
    w: 55,
    bgTop: "#1C1060", bgBot: "#0C0840",
    clouds: [[2,0.8],[9,0.5],[18,1.2],[28,0.6],[38,1.0],[48,0.8]],

    tiles: [
      ...groundRow(0, 55, 12),

      // Long brick platform  y=9
      ...groundRow(2, 12, 9).map(d => ({ ...d, t:"b" })),
      { x:7, y:9, t:"q", item:"mush" },

      // y=7 platform
      ...groundRow(14, 22, 7).map(d => ({ ...d, t:"b" })),
      { x:16, y:7, t:"q", item:"coin" },
      { x:18, y:7, t:"q", item:"coin" },
      { x:20, y:7, t:"q", item:"coin" },

      // High platform  y=4
      { x:12, y:4, t:"b" }, { x:13, y:4, t:"b" },
      { x:14, y:4, t:"b" }, { x:15, y:4, t:"q", item:"mush" },
      { x:16, y:4, t:"b" },

      // Pipes
      { x:26, y:9,  t:"p"  }, { x:27, y:9,  t:"P"  },
      { x:26, y:10, t:"ps" }, { x:27, y:10, t:"Ps" },
      { x:26, y:11, t:"ps" }, { x:27, y:11, t:"Ps" },

      { x:30, y:10, t:"p"  }, { x:31, y:10, t:"P"  },
      { x:30, y:11, t:"ps" }, { x:31, y:11, t:"Ps" },

      // Mid-level bricks
      { x:35, y:8, t:"b" }, { x:36, y:8, t:"q", item:"mush" }, { x:37, y:8, t:"b" },
      { x:40, y:6, t:"b" }, { x:41, y:6, t:"q", item:"coin" },
      { x:42, y:6, t:"b" }, { x:43, y:6, t:"q", item:"coin" }, { x:44, y:6, t:"b" },

      // Stairs
      { x:48, y:11, t:"s" },
      { x:49, y:10, t:"s" }, { x:49, y:11, t:"s" },
      { x:50, y:9,  t:"s" }, { x:50, y:10, t:"s" }, { x:50, y:11, t:"s" },
      { x:51, y:8,  t:"s" }, { x:51, y:9,  t:"s" }, { x:51, y:10, t:"s" }, { x:51, y:11, t:"s" },
      { x:52, y:7,  t:"s" }, { x:52, y:8,  t:"s" }, { x:52, y:9,  t:"s" }, { x:52, y:10, t:"s" }, { x:52, y:11, t:"s" },
    ],

    freeCoins: [
      { x:4,  y:8 }, { x:6,  y:8 }, { x:8,  y:8 }, { x:10, y:8 },
      { x:15, y:6 }, { x:17, y:6 }, { x:19, y:6 }, { x:21, y:6 },
      { x:36, y:7 }, { x:41, y:5 }, { x:43, y:5 },
    ],

    enemies: [
      { x:5,  y:11, t:"G" }, { x:9,  y:11, t:"G" },
      { x:16, y:11, t:"K" }, { x:22, y:11, t:"G" },
      { x:29, y:11, t:"G" }, { x:36, y:11, t:"K" },
      { x:44, y:11, t:"G" },
    ],

    flagCol: 53,
  },

  /* ─── WORLD 1-3 (hardest) ─── */
  {
    w: 62,
    bgTop: "#FC9838", bgBot: "#FC6828",
    clouds: [[1,1.0],[7,0.7],[15,1.3],[23,0.5],[32,1.1],[42,0.8],[52,1.2]],

    tiles: [
      ...groundRow(0, 62, 12),

      { x:3, y:9, t:"b" }, { x:4, y:9, t:"q", item:"mush" }, { x:5, y:9, t:"b" },
      { x:8, y:7, t:"b" }, { x:9, y:7, t:"b" }, { x:10, y:7, t:"q", item:"mush" },
      { x:11, y:7, t:"b" }, { x:12, y:7, t:"b" },
      { x:10, y:5, t:"q", item:"coin" }, { x:11, y:5, t:"q", item:"coin" },
      { x:15, y:9, t:"b" }, { x:16, y:9, t:"b" }, { x:17, y:9, t:"b" },

      { x:20, y:10, t:"p"  }, { x:21, y:10, t:"P"  },
      { x:20, y:11, t:"ps" }, { x:21, y:11, t:"Ps" },
      { x:24, y:9,  t:"p"  }, { x:25, y:9,  t:"P"  },
      { x:24, y:10, t:"ps" }, { x:25, y:10, t:"Ps" },
      { x:24, y:11, t:"ps" }, { x:25, y:11, t:"Ps" },

      { x:28, y:8, t:"b" }, { x:29, y:8, t:"b" }, { x:30, y:8, t:"q", item:"mush" },
      { x:31, y:8, t:"b" }, { x:32, y:8, t:"b" },

      { x:35, y:6, t:"b" }, { x:36, y:6, t:"q", item:"coin" }, { x:37, y:6, t:"b" },
      { x:38, y:6, t:"q", item:"coin" }, { x:39, y:6, t:"b" },
      { x:36, y:9, t:"b" }, { x:37, y:9, t:"b" },

      { x:42, y:10, t:"p"  }, { x:43, y:10, t:"P"  },
      { x:42, y:11, t:"ps" }, { x:43, y:11, t:"Ps" },
      { x:46, y:9,  t:"p"  }, { x:47, y:9,  t:"P"  },
      { x:46, y:10, t:"ps" }, { x:47, y:10, t:"Ps" },
      { x:46, y:11, t:"ps" }, { x:47, y:11, t:"Ps" },

      // Grand staircase
      { x:51, y:11, t:"s" },
      { x:52, y:10, t:"s" }, { x:52, y:11, t:"s" },
      { x:53, y:9,  t:"s" }, { x:53, y:10, t:"s" }, { x:53, y:11, t:"s" },
      { x:54, y:8,  t:"s" }, { x:54, y:9,  t:"s" }, { x:54, y:10, t:"s" }, { x:54, y:11, t:"s" },
      { x:55, y:7,  t:"s" }, { x:55, y:8,  t:"s" }, { x:55, y:9,  t:"s" }, { x:55, y:10, t:"s" }, { x:55, y:11, t:"s" },
      { x:56, y:7,  t:"s" }, { x:56, y:8,  t:"s" }, { x:56, y:9,  t:"s" }, { x:56, y:10, t:"s" }, { x:56, y:11, t:"s" },
      { x:57, y:7,  t:"s" }, { x:57, y:8,  t:"s" }, { x:57, y:9,  t:"s" }, { x:57, y:10, t:"s" }, { x:57, y:11, t:"s" },
    ],

    freeCoins: [
      { x:4,  y:8 }, { x:9,  y:6 }, { x:10, y:6 },
      { x:16, y:8 }, { x:29, y:7 }, { x:31, y:7 },
      { x:36, y:5 }, { x:38, y:5 },
    ],

    enemies: [
      { x:4,  y:11, t:"G" }, { x:7,  y:11, t:"G" },
      { x:12, y:11, t:"K" }, { x:17, y:11, t:"G" },
      { x:22, y:11, t:"G" }, { x:27, y:11, t:"K" },
      { x:33, y:11, t:"G" }, { x:39, y:11, t:"K" },
      { x:44, y:11, t:"G" }, { x:48, y:11, t:"K" },
    ],

    flagCol: 59,
  },
];

/* ──────────────────────────────────────────────
   GAME STATE VARIABLES
────────────────────────────────────────────── */
let gState   = "start";   // start | play | pause | over | clear | win
let lvIdx    = 0;
let score    = 0;
let coinsGot = 0;
let lives    = 3;
let timer    = 300;
let camX     = 0;
let frame    = 0;
let raf      = null;
let timerTick = null;

// Game objects
let player, tiles, enemies, freeCoins, powerups, particles, floatTexts;
let flagX = 0, flagCaught = false;

/* ──────────────────────────────────────────────
   INPUT STATE
────────────────────────────────────────────── */
const keys = { left: false, right: false };
let jumpConsumed = false;

/* ══════════════════════════════════════════════
   INIT / LOAD LEVEL
══════════════════════════════════════════════ */
function initLevel() {
  const L = LEVELS[lvIdx];
  camX = 0;
  frame = 0;
  flagCaught = false;
  timer = 300;

  // ── Player ──
  player = {
    x: 2 * T, y: 10 * T,
    w: 26, h: 30,
    vx: 0, vy: 0,
    onGround: false,
    dir: 1,           // 1=right, -1=left
    big: false,
    inv: 0,           // invincibility frames
    dead: false,
    deadT: 0,
    walkFrame: 0,
    walkTimer: 0,
  };

  // ── Tiles ──
  tiles = L.tiles.map(td => ({
    x:    td.x * T,
    y:    td.y * T,
    w:    T, h: T,
    t:    td.t,
    item: td.item || null,
    hit:  false,    // question block used
    bumpT: 0,       // bump animation counter
  }));

  // ── Enemies ──
  enemies = L.enemies.map(e => ({
    x: e.x * T,
    y: (e.y - 1) * T,    // spawn slightly above ground
    w: 26, h: 26,
    t: e.t,              // 'G'=Goomba, 'K'=Koopa
    vx: -1.1, vy: 0,
    onGround: false,
    dead: false,
    squish: false,        // stomped flat
    deadTimer: 0,
    walkFrame: 0,
    walkTimer: 0,
  }));

  // ── Free coins ──
  freeCoins = L.freeCoins.map(fc => ({
    x:    fc.x * T + T / 2 - 8,
    y:    fc.y * T,
    w:    16, h: 20,
    got:  false,
    anim: 0,
  }));

  // ── Powerups (spawned dynamically from Q-blocks) ──
  powerups = [];

  // ── Particles & floating texts ──
  particles  = [];
  floatTexts = [];

  // ── Flag ──
  flagX = L.flagCol * T;

  updateHUD();
}

/* ══════════════════════════════════════════════
   MAIN GAME LOOP
══════════════════════════════════════════════ */
function loop() {
  raf = requestAnimationFrame(loop);
  if (gState !== "play") { drawScene(); return; }
  frame++;
  update();
  drawScene();
}

/* ══════════════════════════════════════════════
   UPDATE — all game logic
══════════════════════════════════════════════ */
function update() {
  // ── Player death animation ──
  if (player.dead) {
    player.deadT--;
    player.vy += 0.45;
    player.y  += player.vy;
    if (player.deadT <= 0) {
      lives--;
      if (lives <= 0) { endGame("over"); return; }
      initLevel();
      flashLevel();
    }
    return;
  }

  // Invincibility countdown
  if (player.inv > 0) player.inv--;

  // ── Horizontal movement ──
  if (keys.left) {
    player.vx = Math.max(player.vx - 1, -MOVE_SPEED);
    player.dir = -1;
  } else if (keys.right) {
    player.vx = Math.min(player.vx + 1, MOVE_SPEED);
    player.dir = 1;
  } else {
    player.vx *= 0.78;   // friction
  }

  // Walk animation
  player.walkTimer++;
  if (Math.abs(player.vx) > 0.5 && player.onGround) {
    if (player.walkTimer > 7) {
      player.walkTimer = 0;
      player.walkFrame = (player.walkFrame + 1) % 3;
    }
  } else {
    player.walkFrame = 0;
  }

  // ── Gravity & movement ──
  player.vy = Math.min(player.vy + GRAVITY, 16);
  player.x += player.vx;

  const L = LEVELS[lvIdx];
  player.x = Math.max(0, Math.min(player.x, L.w * T - player.w));
  resolveAxisX(player);

  player.y += player.vy;
  player.onGround = false;
  resolveAxisY(player, true);

  // Fell into pit
  if (player.y > H + 80) killPlayer();

  // ── Camera ──
  const targetCam = Math.max(0, Math.min(player.x - W * 0.33, L.w * T - W));
  camX += (targetCam - camX) * CAM_LERP;

  // ── Free coins ──
  for (const fc of freeCoins) {
    if (fc.got) continue;
    fc.anim += 0.1;
    if (overlaps(player, { x: fc.x, y: fc.y, w: fc.w, h: fc.h })) {
      fc.got = true;
      coinsGot++;
      score += 200;
      spawnFloatText(fc.x, fc.y, "+200", PAL.coin);
      spawnParticles(fc.x + 8, fc.y, PAL.coin, 5);
    }
  }

  // ── Powerups (mushroom) ──
  for (const pu of powerups) {
    if (!pu.active) continue;
    pu.vy = Math.min(pu.vy + GRAVITY, 14);
    pu.x += pu.vx;
    resolveAxisX(pu);
    if (pu.hitWall) pu.vx *= -1;
    pu.y += pu.vy;
    resolveAxisY(pu, false);
    if (pu.y > H + 80) { pu.active = false; continue; }

    if (overlaps(player, pu)) {
      pu.active = false;
      if (!player.big) {
        player.big = true;
        player.h   = 48;
        player.y  -= 18;
      }
      score += 1000;
      spawnFloatText(pu.x, pu.y, "+1000", "#f84");
      spawnParticles(pu.x, pu.y, PAL.mushRed, 8);
    }
  }

  // ── Enemies ──
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.squish) {
      e.deadTimer--;
      if (e.deadTimer <= 0) e.dead = true;
      continue;
    }

    e.vy = Math.min(e.vy + GRAVITY, 14);
    e.x += e.vx;
    resolveAxisX(e);
    if (e.hitWall) e.vx *= -1;
    e.y += e.vy;
    e.onGround = false;
    resolveAxisY(e, false);
    if (e.y > H + 60) { e.dead = true; continue; }

    // Walk animation
    e.walkTimer++;
    if (e.walkTimer > 10) { e.walkTimer = 0; e.walkFrame = (e.walkFrame + 1) % 2; }

    // ── Player vs Enemy collision ──
    if (!player.inv && overlaps(player, { x: e.x, y: e.y, w: e.w, h: e.h })) {
      const playerBottom = player.y + player.h;
      const enemyMidY    = e.y + e.h / 2;

      if (playerBottom < enemyMidY + 12 && player.vy > 0) {
        // Stomp from above
        e.squish    = true;
        e.deadTimer = 45;
        e.h  = 10;
        e.y += 16;
        player.vy = -9;
        score += 100;
        spawnFloatText(e.x + e.w / 2, e.y, "+100", "#fff");
        spawnParticles(e.x + e.w / 2, e.y, PAL.goombaBrown, 6);
      } else {
        // Side / bottom hit
        if (player.big) {
          player.big = false;
          player.h   = 30;
          player.inv = 100;
        } else {
          killPlayer();
        }
      }
    }
  }

  // ── Tile bump from below (player head hits block) ──
  for (const tl of tiles) {
    if (tl.t !== "b" && tl.t !== "q") continue;
    if (tl.bumpT > 0) tl.bumpT--;
    if (tl.hit) continue;

    const underHit =
      player.x < tl.x + tl.w &&
      player.x + player.w > tl.x &&
      Math.abs(player.y - (tl.y + tl.h)) < 6 &&
      player.vy < 0;

    if (underHit) {
      tl.bumpT = 8;

      if (tl.t === "q") {
        tl.hit = true;
        if (tl.item === "coin") {
          coinsGot++;
          score += 200;
          spawnFloatText(tl.x + T / 2, tl.y, "+200", PAL.coin);
          spawnParticles(tl.x + T / 2, tl.y, PAL.coin, 5);
        } else if (tl.item === "mush") {
          // Spawn mushroom
          powerups.push({
            x:       tl.x,
            y:       tl.y - T,
            w: 26, h: 26,
            t:       "mush",
            active:  true,
            vx:      1.2,
            vy:      -5,
            onGround: false,
            hitWall: false,
          });
        }
      } else if (tl.t === "b" && player.big) {
        // Break brick when big
        tl.t = "broken";
        spawnParticles(tl.x + T / 2, tl.y + T / 2, PAL.brick, 8);
        score += 50;
      }
    }
  }

  // ── Flag ──
  if (!flagCaught) {
    const poleRect = { x: flagX, y: 3 * T, w: 8, h: 9 * T };
    if (overlaps(player, poleRect)) {
      flagCaught = true;
      score += 1000;
      spawnFloatText(flagX, 3 * T, "+1000", PAL.coin);
      setTimeout(() => {
        if (lvIdx >= LEVELS.length - 1) endGame("win");
        else                             endGame("clear");
      }, 1000);
    }
  }

  // ── Particles ──
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x  += p.vx;
    p.y  += p.vy;
    p.vy += 0.28;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // ── Floating texts ──
  for (let i = floatTexts.length - 1; i >= 0; i--) {
    const ft = floatTexts[i];
    ft.y -= 0.9;
    ft.life--;
    if (ft.life <= 0) floatTexts.splice(i, 1);
  }

  updateHUD();
}

/* ══════════════════════════════════════════════
   COLLISION HELPERS
══════════════════════════════════════════════ */

/**
 * Returns tiles that are solid (not broken, not flag).
 */
function solidTiles() {
  return tiles.filter(t => t.t !== "broken");
}

/** AABB overlap test */
function overlaps(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/** Resolve horizontal collision */
function resolveAxisX(obj) {
  obj.hitWall = false;
  for (const tl of solidTiles()) {
    if (!overlaps(obj, tl)) continue;
    if (obj.vx > 0) { obj.x = tl.x - obj.w; obj.hitWall = true; }
    else            { obj.x = tl.x + tl.w;  obj.hitWall = true; }
    obj.vx = 0;
  }
}

/** Resolve vertical collision */
function resolveAxisY(obj, isPlayer) {
  for (const tl of solidTiles()) {
    if (!overlaps(obj, tl)) continue;
    if (obj.vy > 0) {
      obj.y = tl.y - obj.h;
      obj.vy = 0;
      obj.onGround = true;
      if (isPlayer) player.onGround = true;
    } else if (obj.vy < 0) {
      obj.y = tl.y + tl.h;
      obj.vy = 0;
    }
  }
}

/* ══════════════════════════════════════════════
   KILL PLAYER
══════════════════════════════════════════════ */
function killPlayer() {
  if (player.dead || player.inv > 0) return;
  player.dead  = true;
  player.deadT = 80;
  player.vy    = JUMP_FORCE * 0.9;
}

/* ══════════════════════════════════════════════
   PARTICLES & FLOAT TEXTS
══════════════════════════════════════════════ */
function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx:    (Math.random() - 0.5) * 5,
      vy:    -2 - Math.random() * 3,
      life:  20 + Math.random() * 12,
      color,
      r:     3 + Math.random() * 3,
    });
  }
}

function spawnFloatText(worldX, worldY, text, color) {
  floatTexts.push({
    screenX: worldX - camX,
    y:       worldY,
    text, color,
    life: 50,
  });
}

/* ══════════════════════════════════════════════
   DRAW SCENE
══════════════════════════════════════════════ */
function drawScene() {
  const L = LEVELS[lvIdx];

  // ── Sky gradient ──
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, L.bgTop);
  skyGrad.addColorStop(1, L.bgBot);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // ── Clouds (parallax layer) ──
  for (const [gx, gy] of L.clouds) {
    const sx = gx * T - camX * 0.38;
    if (sx < -120 || sx > W + 120) continue;
    drawCloud(sx, gy * T + 12);
  }

  // ── World-space objects (shift by camera) ──
  ctx.save();
  ctx.translate(-Math.floor(camX), 0);

  for (const tl of tiles)   drawTile(tl);
  for (const fc of freeCoins)  if (!fc.got) drawFreeCoin(fc);
  for (const pu of powerups)   if (pu.active) drawMushroom(pu.x, pu.y);
  for (const e  of enemies)    if (!e.dead)   drawEnemy(e);

  drawFlag();

  // Player (blink when invincible)
  if (!player.dead || Math.floor(player.deadT / 5) % 2 === 0) {
    drawPlayer();
  }

  // Particles
  for (const p of particles) {
    ctx.globalAlpha = p.life / 30;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  // ── Float texts (screen space) ──
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  for (const ft of floatTexts) {
    ctx.globalAlpha = ft.life / 50;
    ctx.fillStyle   = ft.color;
    ctx.font        = 'bold 9px "Press Start 2P", monospace';
    ctx.fillText(ft.text, ft.screenX, ft.y);
    ctx.globalAlpha = 1;
  }
  ctx.textAlign    = "left";
  ctx.textBaseline = "alphabetic";
}

/* ══════════════════════════════════════════════
   DRAW — CLOUD
══════════════════════════════════════════════ */
function drawCloud(x, y) {
  ctx.fillStyle = PAL.cloudWhite;
  ctx.beginPath();
  ctx.arc(x + 20, y + 4,  14, 0, Math.PI * 2);
  ctx.arc(x + 36, y - 4,  18, 0, Math.PI * 2);
  ctx.arc(x + 54, y + 4,  14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + 6, y + 4, 62, 14);
  ctx.fillStyle = PAL.cloudShadow;
  ctx.fillRect(x + 6, y + 16, 62, 3);
}

/* ══════════════════════════════════════════════
   DRAW — TILE
══════════════════════════════════════════════ */
function drawTile(tl) {
  if (tl.t === "broken") return;

  const bumpOffset = tl.bumpT > 0 ? -tl.bumpT * 0.6 : 0;
  const tx = Math.floor(tl.x);
  const ty = Math.floor(tl.y + bumpOffset);

  switch (tl.t) {

    case "g": // Ground
      ctx.fillStyle = PAL.grassTop;
      ctx.fillRect(tx, ty, T, 5);
      ctx.fillStyle = PAL.groundSoil;
      ctx.fillRect(tx, ty + 5, T, T - 5);
      ctx.fillStyle = PAL.groundDark;
      ctx.fillRect(tx + 2,  ty + 7,  5, 4);
      ctx.fillRect(tx + 12, ty + 10, 4, 3);
      ctx.fillRect(tx + 22, ty + 7,  5, 4);
      break;

    case "b": // Brick
      ctx.fillStyle = PAL.brick;
      ctx.fillRect(tx, ty, T, T);
      ctx.fillStyle = PAL.brickLine;
      ctx.fillRect(tx,          ty + T / 2 - 1, T,    2);
      ctx.fillRect(tx + T / 2 - 1, ty,          2,    T / 2);
      ctx.fillRect(tx + T * 0.25,  ty + T / 2 + 1, 2, T / 2 - 1);
      ctx.fillRect(tx + T * 0.75,  ty + T / 2 + 1, 2, T / 2 - 1);
      ctx.fillStyle = "rgba(255,255,255,.15)";
      ctx.fillRect(tx, ty, T, 3);
      ctx.fillStyle = "rgba(0,0,0,.2)";
      ctx.fillRect(tx, ty + T - 3, T, 3);
      break;

    case "q": // Question block
      if (tl.hit) {
        // Used / empty block
        ctx.fillStyle = PAL.qDark;
        ctx.fillRect(tx, ty, T, T);
        ctx.fillStyle = "rgba(0,0,0,.3)";
        ctx.fillRect(tx, ty + T - 3, T, 3);
      } else {
        ctx.fillStyle = PAL.qBlock;
        ctx.fillRect(tx, ty, T, T);
        ctx.fillStyle = PAL.qShine;
        ctx.fillRect(tx + 2, ty + 2, T - 4, 5);
        ctx.fillRect(tx + 2, ty + 2, 5, T - 4);
        ctx.fillStyle = PAL.qDark;
        ctx.fillRect(tx, ty + T - 3, T,     3);
        ctx.fillRect(tx + T - 3, ty, 3,     T);
        // "?" character
        ctx.fillStyle    = "#fff";
        ctx.font         = 'bold 16px "Press Start 2P", monospace';
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", tx + T / 2, ty + T / 2 + 1);
        ctx.textAlign    = "left";
        ctx.textBaseline = "alphabetic";
      }
      break;

    case "s": // Stair
      ctx.fillStyle = PAL.groundSoil;
      ctx.fillRect(tx, ty, T, T);
      ctx.fillStyle = PAL.groundDark;
      ctx.fillRect(tx, ty, T, 4);
      ctx.fillRect(tx + T - 4, ty, 4, T);
      ctx.fillStyle = PAL.grassTop;
      ctx.fillRect(tx, ty, T, 3);
      break;

    case "p": // Pipe left cap
      ctx.fillStyle = PAL.pipeDark;
      ctx.fillRect(tx, ty, T, T);
      ctx.fillStyle = PAL.pipeGreen;
      ctx.fillRect(tx, ty, T - 4, T);
      ctx.fillStyle = PAL.pipeLight;
      ctx.fillRect(tx + 3, ty, 4, T);
      // Cap overhang
      ctx.fillStyle = PAL.pipeDark;
      ctx.fillRect(tx - 4, ty, T + 4, 8);
      ctx.fillStyle = PAL.pipeGreen;
      ctx.fillRect(tx - 4, ty, T, 8);
      ctx.fillStyle = PAL.pipeLight;
      ctx.fillRect(tx - 1, ty + 1, 4, 6);
      break;

    case "P": // Pipe right cap
      ctx.fillStyle = PAL.pipeDark;
      ctx.fillRect(tx, ty, T, T);
      ctx.fillStyle = PAL.pipeGreen;
      ctx.fillRect(tx + 4, ty, T - 4, T);
      ctx.fillStyle = PAL.pipeLight;
      ctx.fillRect(tx + T - 7, ty, 4, T);
      ctx.fillStyle = PAL.pipeDark;
      ctx.fillRect(tx, ty, T + 4, 8);
      ctx.fillStyle = PAL.pipeLight;
      ctx.fillRect(tx + T - 3, ty + 1, 4, 6);
      break;

    case "ps": // Pipe left body
      ctx.fillStyle = PAL.pipeDark;
      ctx.fillRect(tx, ty, T, T);
      ctx.fillStyle = PAL.pipeGreen;
      ctx.fillRect(tx, ty, T - 4, T);
      ctx.fillStyle = PAL.pipeLight;
      ctx.fillRect(tx + 3, ty, 4, T);
      break;

    case "Ps": // Pipe right body
      ctx.fillStyle = PAL.pipeDark;
      ctx.fillRect(tx, ty, T, T);
      ctx.fillStyle = PAL.pipeGreen;
      ctx.fillRect(tx + 4, ty, T - 4, T);
      ctx.fillStyle = PAL.pipeLight;
      ctx.fillRect(tx + T - 7, ty, 4, T);
      break;
  }
}

/* ══════════════════════════════════════════════
   DRAW — FREE COIN (animated squish)
══════════════════════════════════════════════ */
function drawFreeCoin(fc) {
  const pulse = Math.sin(fc.anim) * 0.28 + 0.72;
  const fw    = Math.max(4, Math.floor(fc.w * pulse));
  const fx    = Math.floor(fc.x + (fc.w - fw) / 2);
  const fy    = Math.floor(fc.y);

  ctx.fillStyle = PAL.coin;
  ctx.fillRect(fx, fy, fw, fc.h);
  ctx.fillStyle = PAL.coinShine;
  ctx.fillRect(fx + 2, fy + 2, Math.max(2, fw - 6), 8);
}

/* ══════════════════════════════════════════════
   DRAW — MUSHROOM POWERUP
══════════════════════════════════════════════ */
function drawMushroom(mx, my) {
  const px = Math.floor(mx), py = Math.floor(my);
  // Stem
  ctx.fillStyle = PAL.mushStem;
  ctx.fillRect(px + 4, py + 14, 18, 12);
  // Cap
  ctx.fillStyle = PAL.mushRed;
  ctx.fillRect(px, py, 26, 16);
  // White spots
  ctx.fillStyle = PAL.mushSpot;
  ctx.fillRect(px + 3,  py + 2, 7, 7);
  ctx.fillRect(px + 15, py + 2, 7, 7);
  ctx.fillRect(px + 9,  py + 7, 5, 5);
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,.18)";
  ctx.fillRect(px, py + 14, 26, 2);
}

/* ══════════════════════════════════════════════
   DRAW — PLAYER (pixel art, flippable)
══════════════════════════════════════════════ */
function drawPlayer() {
  const px = Math.floor(player.x);
  const py = Math.floor(player.y);
  const big = player.big;
  const w = player.w, h = player.h;

  ctx.save();
  // Flip horizontally if facing left
  if (player.dir === -1) {
    ctx.translate(px + w, py);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(px, py);
  }

  // Blink during invincibility
  if (player.inv > 0 && Math.floor(player.inv / 5) % 2 === 1) {
    ctx.globalAlpha = 0.45;
  }

  // ── Hat ──
  ctx.fillStyle = PAL.playerHat;
  ctx.fillRect(5, 0,       w - 10, big ? 10 : 7);
  ctx.fillRect(2, big ? 8 : 5, w - 4,  3);

  // ── Head/face ──
  ctx.fillStyle = PAL.playerFace;
  ctx.fillRect(2, big ? 9 : 7, w - 4, big ? 12 : 10);

  // Eyes & mustache
  ctx.fillStyle = "#000";
  ctx.fillRect(big ?  9 :  6, big ? 12 : 10, 3, 3);
  ctx.fillRect(big ? 16 : 13, big ? 12 : 10, 3, 3);
  ctx.fillRect(big ?  6 :  4, big ? 17 : 14, big ? 14 : 10, 2);

  // ── Overalls body ──
  ctx.fillStyle = PAL.playerRed;
  ctx.fillRect(1, big ? 21 : 17, w - 2, big ? 14 : 9);

  ctx.fillStyle = PAL.playerPants;
  ctx.fillRect(0, big ? 35 : 26, w, big ? 10 : 7);

  // Bib buttons
  ctx.fillStyle = PAL.playerFace;
  ctx.fillRect(5,     big ? 37 : 28, 4, 4);
  ctx.fillRect(w - 9, big ? 37 : 28, 4, 4);

  // ── Shoes ──
  ctx.fillStyle = PAL.playerShoe;
  ctx.fillRect(0,     big ? 45 : 33, 13, big ? 5 : 4);
  ctx.fillRect(w - 13, big ? 45 : 33, 13, big ? 5 : 4);

  ctx.globalAlpha = 1;
  ctx.restore();
}

/* ══════════════════════════════════════════════
   DRAW — ENEMY
══════════════════════════════════════════════ */
function drawEnemy(e) {
  const px = Math.floor(e.x), py = Math.floor(e.y);
  ctx.save();
  ctx.translate(px, py);

  // Squished flat
  if (e.squish) {
    ctx.fillStyle = PAL.goombaBrown;
    ctx.fillRect(0, e.h - 6, e.w, 6);
    ctx.restore();
    return;
  }

  if (e.t === "G") {
    /* ── GOOMBA ── */
    // Feet
    ctx.fillStyle = PAL.goombaDark;
    ctx.fillRect(0,       e.h - 7, 9, 7);
    ctx.fillRect(e.w - 9, e.h - 7, 9, 7);
    // Body
    ctx.fillStyle = PAL.goombaBrown;
    ctx.fillRect(2, 6, e.w - 4, e.h - 9);
    // Head
    ctx.fillRect(0, 0, e.w, 10);
    // Face
    ctx.fillStyle = PAL.goombaFace;
    ctx.fillRect(3,       7, 7, 8);
    ctx.fillRect(e.w - 10, 7, 7, 8);
    // Eyes
    ctx.fillStyle = "#000";
    ctx.fillRect(5,       10, 3, 3);
    ctx.fillRect(e.w - 8, 10, 3, 3);
    // Angry brows
    ctx.fillRect(3,       5, 8, 2);
    ctx.fillRect(e.w - 11, 5, 8, 2);

  } else {
    /* ── KOOPA ── */
    // Shell
    ctx.fillStyle = PAL.koopaShell;
    ctx.fillRect(4, 8, e.w - 8, e.h - 8);
    ctx.fillStyle = PAL.koopaLight;
    ctx.fillRect(6, 10, e.w - 12, e.h - 14);
    // Shell hex pattern
    ctx.fillStyle = "rgba(0,80,0,.25)";
    ctx.fillRect(9,  13, 4, 4);
    ctx.fillRect(14, 16, 4, 4);
    ctx.fillRect(9,  19, 4, 4);
    // Head (faces direction of movement)
    const headX = e.vx < 0 ? 0 : e.w - 10;
    ctx.fillStyle = PAL.koopaFace;
    ctx.fillRect(headX, 1, 10, 10);
    // Eye
    ctx.fillStyle = "#000";
    ctx.fillRect(headX + (e.vx < 0 ? 2 : 5), 4, 3, 3);
    // Teeth
    ctx.fillStyle = "#fff";
    ctx.fillRect(headX + (e.vx < 0 ? 1 : 3), 10, 4, 4);
    ctx.fillRect(headX + (e.vx < 0 ? 6 : 8), 10, 3, 4);
    // Feet
    ctx.fillStyle = PAL.koopaShell;
    ctx.fillRect(0,       e.h - 6, 9, 6);
    ctx.fillRect(e.w - 9, e.h - 6, 9, 6);
  }

  ctx.restore();
}

/* ══════════════════════════════════════════════
   DRAW — FLAG & POLE
══════════════════════════════════════════════ */
function drawFlag() {
  if (!flagX) return;
  const poleTop = 3 * T;
  const fx      = Math.floor(flagX);

  // Pole
  ctx.fillStyle = PAL.flagPole;
  ctx.fillRect(fx, poleTop, 6, 9 * T);

  // Flag triangle
  ctx.fillStyle = PAL.flagGreen;
  ctx.fillRect(fx + 6, poleTop, 24, 16);

  // Ball on top
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(fx + 3, poleTop, 5, 0, Math.PI * 2);
  ctx.fill();
}

/* ══════════════════════════════════════════════
   HUD UPDATE
══════════════════════════════════════════════ */
function updateHUD() {
  document.getElementById("hSkor").textContent  = String(score).padStart(6, "0");
  document.getElementById("hKoin").textContent  = "🪙 " + String(coinsGot).padStart(2, "0");
  document.getElementById("hDunia").textContent = (lvIdx + 1) + "‑1";
  document.getElementById("hWaktu").textContent = timer;
  document.getElementById("hNyawa").textContent = "🍄 × " + lives;

  // Color danger when time low
  const timeEl = document.getElementById("hWaktu");
  if (timer <= 100) {
    timeEl.classList.add("danger");
  } else {
    timeEl.classList.remove("danger");
  }
}

/* ══════════════════════════════════════════════
   TIMER
══════════════════════════════════════════════ */
function startTimer() {
  clearInterval(timerTick);
  timerTick = setInterval(() => {
    if (gState !== "play") return;
    timer--;
    if (timer <= 0) { timer = 0; killPlayer(); }
    updateHUD();
  }, 1000);
}

/* ══════════════════════════════════════════════
   LEVEL FLASH (HUD world indicator)
══════════════════════════════════════════════ */
function flashLevel() {
  const el   = document.getElementById("hDunia");
  const orig = el.textContent;
  el.style.color = "#f84";
  el.textContent = "DUNIA " + (lvIdx + 1);
  setTimeout(() => {
    el.style.color = "";
    el.textContent = orig;
  }, 1800);
}

/* ══════════════════════════════════════════════
   SCREEN MANAGEMENT
══════════════════════════════════════════════ */
const SCREEN_IDS = ["ovStart", "ovPause", "ovOver", "ovClear", "ovWin"];

function hideAllScreens() {
  SCREEN_IDS.forEach(id => document.getElementById(id).classList.add("hide"));
}

function showScreen(id) {
  hideAllScreens();
  document.getElementById(id).classList.remove("hide");
}

function endGame(type) {
  gState = type;
  clearInterval(timerTick);

  if (type === "over") {
    document.getElementById("goScore").textContent = "SKOR: " + score;
    showScreen("ovOver");
  } else if (type === "clear") {
    document.getElementById("lcScore").textContent = "SKOR: " + score;
    showScreen("ovClear");
  } else if (type === "win") {
    document.getElementById("winScore").textContent = "SKOR TOTAL: " + score;
    showScreen("ovWin");
  }
}

/* ══════════════════════════════════════════════
   GAME ACTIONS
══════════════════════════════════════════════ */
function startGame() {
  score    = 0;
  coinsGot = 0;
  lives    = 3;
  lvIdx    = 0;
  hideAllScreens();
  initLevel();
  gState = "play";
  updateHUD();
  startTimer();
  flashLevel();
  if (!raf) loop();
}

function restartGame() {
  score    = 0;
  coinsGot = 0;
  lives    = 3;
  lvIdx    = 0;
  hideAllScreens();
  initLevel();
  gState = "play";
  updateHUD();
  startTimer();
  flashLevel();
}

function nextLevel() {
  lvIdx++;
  hideAllScreens();
  initLevel();
  gState = "play";
  updateHUD();
  startTimer();
  flashLevel();
}

function togglePause() {
  if (gState === "play") {
    gState = "pause";
    showScreen("ovPause");
    clearInterval(timerTick);
  } else if (gState === "pause") {
    gState = "play";
    hideAllScreens();
    startTimer();
  }
}

function doJump() {
  if (gState !== "play" || !player || player.dead) return;
  if (player.onGround) {
    player.vy       = JUMP_FORCE;
    player.onGround = false;
  }
}

/* ══════════════════════════════════════════════
   KEYBOARD INPUT
══════════════════════════════════════════════ */
const PREVENT_KEYS = new Set([
  "ArrowLeft","ArrowRight","ArrowUp","ArrowDown",
  "Space","KeyZ","KeyW","KeyA","KeyD",
]);

document.addEventListener("keydown", e => {
  if (PREVENT_KEYS.has(e.code)) e.preventDefault();

  switch (e.code) {
    case "ArrowLeft":  case "KeyA": keys.left  = true;  break;
    case "ArrowRight": case "KeyD": keys.right = true;  break;
    case "ArrowUp":
    case "KeyW":
    case "Space":
    case "KeyZ":
      if (!jumpConsumed) { jumpConsumed = true; doJump(); }
      break;
    case "Escape":
    case "KeyP":
      togglePause();
      break;
  }
});

document.addEventListener("keyup", e => {
  switch (e.code) {
    case "ArrowLeft":  case "KeyA": keys.left  = false; break;
    case "ArrowRight": case "KeyD": keys.right = false; break;
    case "ArrowUp":
    case "KeyW":
    case "Space":
    case "KeyZ":
      jumpConsumed = false;
      break;
  }
});

/* ══════════════════════════════════════════════
   MOBILE TOUCH INPUT
══════════════════════════════════════════════ */
function mobileBind(id, pressKey) {
  const el = document.getElementById(id);
  el.addEventListener("touchstart", e => {
    e.preventDefault();
    if (pressKey) keys[pressKey] = true;
    el.classList.add("on");
  }, { passive: false });
  el.addEventListener("touchend", e => {
    e.preventDefault();
    if (pressKey) keys[pressKey] = false;
    el.classList.remove("on");
  }, { passive: false });
  el.addEventListener("touchcancel", () => {
    if (pressKey) keys[pressKey] = false;
    el.classList.remove("on");
  });
}

mobileBind("cLeft",  "left");
mobileBind("cRight", "right");

const jumpBtn = document.getElementById("cJump");
jumpBtn.addEventListener("touchstart", e => {
  e.preventDefault();
  jumpBtn.classList.add("on");
  doJump();
}, { passive: false });
jumpBtn.addEventListener("touchend", e => {
  e.preventDefault();
  jumpBtn.classList.remove("on");
}, { passive: false });

const pauseBtn = document.getElementById("cPause");
pauseBtn.addEventListener("touchstart", e => {
  e.preventDefault();
  togglePause();
}, { passive: false });

/* ══════════════════════════════════════════════
   BUTTON WIRING
══════════════════════════════════════════════ */
document.getElementById("btnStart").addEventListener("click",    startGame);
document.getElementById("btnResume").addEventListener("click",   togglePause);
document.getElementById("btnRestart1").addEventListener("click", restartGame);
document.getElementById("btnRestart2").addEventListener("click", restartGame);
document.getElementById("btnRestart3").addEventListener("click", restartGame);
document.getElementById("btnNext").addEventListener("click",     nextLevel);

/* ══════════════════════════════════════════════
   START RENDER LOOP
══════════════════════════════════════════════ */
loop();
