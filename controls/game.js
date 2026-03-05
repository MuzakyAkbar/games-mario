"use strict";
/* ═══════════════════════════════════════════════════════
   SUPER NUSA BROS — game.js
   Features:
   • 5 overworld levels + pipe sub-worlds per level
   • Enemies patrol back-and-forth with defined bounds
   • Mario enters pipes → underground sub-world
   • Sub-worlds have own theme, enemies, coins, exit pipe
   • Particles, float texts, mushroom power-ups
═══════════════════════════════════════════════════════ */

const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");
const W = 768, H = 400, T = 32;

/* ─────────────────────────────────────────
   PALETTE
───────────────────────────────────────── */
const P = {
  skyBlue:"#5C94FC", skyBlue2:"#92B4FF",
  skyNight:"#0C0840", skyNight2:"#1C1060",
  skySunset:"#FC9838", skySunset2:"#FC6020",
  skyForest:"#1A3A10", skyForest2:"#2A5A18",
  skyCastle:"#2A0A0A", skyCastle2:"#4A1010",
  // underground sub-world
  subBg1:"#000020", subBg2:"#001040",
  subBg1b:"#200010", subBg2b:"#400020",
  subBg1c:"#001020", subBg2c:"#002840",
  subBg1d:"#101008", subBg2d:"#283010",
  subBg1e:"#1a0000", subBg2e:"#3a0808",
  grassTop:"#52A820", groundSoil:"#C84B11", groundDark:"#8B3000",
  brick:"#C84B11", brickLine:"#8B3000",
  qBlock:"#E8B000", qShine:"#FFEC60", qDark:"#906000",
  pipeGreen:"#00A830", pipeLight:"#38D858", pipeDark:"#006818",
  coin:"#FFD700", coinShine:"#FFFF90",
  pRed:"#E82828", pFace:"#FFB870", pPants:"#1050C8", pShoe:"#502800",
  mushRed:"#E82828", mushSpot:"#FFF", mushStem:"#FFB870",
  gBrown:"#8B4513", gDark:"#5A2D00", gFace:"#FFB870",
  kShell:"#228B22", kLight:"#3CB83C", kFace:"#FFB870",
  flagPole:"#888", flagGreen:"#00A830",
  cloudW:"#FFF", cloudS:"#DDE",
  lava:"#FF4400", lavaBright:"#FF8800",
  stone:"#888", stoneDark:"#555", stoneLight:"#AAA",
  iceBlue:"#90D8F8", iceDark:"#5090C8", iceLight:"#C8F0FF",
};

/* ─────────────────────────────────────────
   PHYSICS
───────────────────────────────────────── */
const GR = 0.55, JF = -13.5, SPD = 4, CAM = 0.2;

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function row(x0,x1,y,t){ const a=[];for(let x=x0;x<x1;x++)a.push({x,y,t:t||"g"});return a; }
function ov(a,b){ return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y; }

/* ─────────────────────────────────────────
   SUB-WORLDS  (underground)
   Each has: w, tiles, freeCoins, enemies, exitPipe
   Reached via enterPipe index on overworld
───────────────────────────────────────── */
const SUB_WORLDS = [
  /* ── Sub 0: Basic underground (level 1) ── */
  {
    name:"Dunia Bawah Tanah",
    bg1:P.subBg1, bg2:P.subBg2,
    w:28,
    tiles:[
      ...row(0,28,12,"g"),
      // ceiling
      ...row(0,28,0,"stone"),
      ...row(0,28,1,"stone"),
      // platforms
      ...row(3,9,9,"b"),{x:5,y:9,t:"q",item:"coin"},
      ...row(12,18,7,"b"),{x:14,y:7,t:"q",item:"mush"},{x:15,y:7,t:"q",item:"coin"},
      ...row(20,26,9,"b"),{x:22,y:9,t:"q",item:"coin"},{x:23,y:9,t:"q",item:"coin"},
      // exit pipe
      {x:25,y:10,t:"p"},{x:26,y:10,t:"P"},
      {x:25,y:11,t:"ps"},{x:26,y:11,t:"Ps"},
    ],
    freeCoins:[
      {x:4,y:8},{x:6,y:8},{x:13,y:6},{x:15,y:6},{x:21,y:8},{x:23,y:8},
    ],
    enemies:[
      {x:6,y:11,t:"G",px0:3,px1:8},
      {x:14,y:11,t:"G",px0:11,px1:17},
      {x:21,y:11,t:"G",px0:19,px1:25},
    ],
    exitPipe:{x:25,y:10}, // tile coords of exit pipe left cap
  },
  /* ── Sub 1: Cave with lava theme (level 2) ── */
  {
    name:"Gua Berbahaya",
    bg1:P.subBg1b, bg2:P.subBg2b,
    w:32,
    tiles:[
      ...row(0,32,12,"g"),
      ...row(0,32,0,"stone"),...row(0,32,1,"stone"),
      ...row(3,8,9,"stone"),
      ...row(11,17,7,"stone"),{x:13,y:7,t:"q",item:"mush"},{x:14,y:7,t:"q",item:"coin"},
      ...row(19,25,9,"stone"),
      {x:5,y:9,t:"q",item:"coin"},{x:6,y:9,t:"q",item:"mush"},
      {x:21,y:9,t:"q",item:"coin"},{x:22,y:9,t:"q",item:"coin"},
      // lava pits (decoration tiles, not solid)
      {x:8,y:12,t:"lava"},{x:9,y:12,t:"lava"},{x:10,y:12,t:"lava"},
      {x:17,y:12,t:"lava"},{x:18,y:12,t:"lava"},
      // exit
      {x:29,y:10,t:"p"},{x:30,y:10,t:"P"},
      {x:29,y:11,t:"ps"},{x:30,y:11,t:"Ps"},
    ],
    freeCoins:[
      {x:4,y:8},{x:6,y:8},{x:12,y:6},{x:14,y:6},{x:20,y:8},{x:22,y:8},
    ],
    enemies:[
      {x:5,y:11,t:"G",px0:3,px1:7},
      {x:13,y:11,t:"K",px0:10,px1:16},
      {x:22,y:11,t:"G",px0:19,px1:24},
      {x:28,y:11,t:"K",px0:26,px1:31},
    ],
    exitPipe:{x:29,y:10},
  },
  /* ── Sub 2: Ice cave (level 3) ── */
  {
    name:"Gua Es",
    bg1:P.subBg1c, bg2:P.subBg2c,
    w:30,
    tiles:[
      ...row(0,30,12,"g"),
      ...row(0,30,0,"ice"),...row(0,30,1,"ice"),
      ...row(3,9,9,"ice"),{x:5,y:9,t:"q",item:"coin"},{x:6,y:9,t:"q",item:"mush"},
      ...row(12,18,7,"ice"),{x:13,y:7,t:"q",item:"coin"},{x:15,y:7,t:"q",item:"coin"},
      ...row(20,27,9,"ice"),{x:22,y:9,t:"q",item:"mush"},{x:23,y:9,t:"q",item:"coin"},
      {x:27,y:10,t:"p"},{x:28,y:10,t:"P"},
      {x:27,y:11,t:"ps"},{x:28,y:11,t:"Ps"},
    ],
    freeCoins:[
      {x:4,y:8},{x:7,y:8},{x:13,y:6},{x:15,y:6},{x:21,y:8},{x:23,y:8},{x:25,y:8},
    ],
    enemies:[
      {x:5,y:11,t:"G",px0:3,px1:8},
      {x:14,y:11,t:"K",px0:11,px1:17},
      {x:22,y:11,t:"G",px0:19,px1:26},
    ],
    exitPipe:{x:27,y:10},
  },
  /* ── Sub 3: Forest underground (level 4) ── */
  {
    name:"Terowongan Hutan",
    bg1:P.subBg1d, bg2:P.subBg2d,
    w:34,
    tiles:[
      ...row(0,34,12,"g"),
      ...row(0,34,0,"stone"),...row(0,34,1,"stone"),
      ...row(3,10,9,"b"),{x:5,y:9,t:"q",item:"mush"},{x:7,y:9,t:"q",item:"coin"},
      ...row(13,20,7,"b"),{x:14,y:7,t:"q",item:"coin"},{x:16,y:7,t:"q",item:"mush"},{x:18,y:7,t:"q",item:"coin"},
      ...row(22,30,9,"b"),{x:24,y:9,t:"q",item:"coin"},{x:26,y:9,t:"q",item:"mush"},{x:28,y:9,t:"q",item:"coin"},
      {x:31,y:10,t:"p"},{x:32,y:10,t:"P"},
      {x:31,y:11,t:"ps"},{x:32,y:11,t:"Ps"},
    ],
    freeCoins:[
      {x:4,y:8},{x:6,y:8},{x:8,y:8},{x:14,y:6},{x:16,y:6},{x:18,y:6},
      {x:23,y:8},{x:25,y:8},{x:27,y:8},
    ],
    enemies:[
      {x:5,y:11,t:"G",px0:3,px1:9},
      {x:15,y:11,t:"K",px0:12,px1:19},
      {x:23,y:11,t:"G",px0:21,px1:29},
      {x:30,y:11,t:"K",px0:28,px1:33},
    ],
    exitPipe:{x:31,y:10},
  },
  /* ── Sub 4: Castle dungeon (level 5) ── */
  {
    name:"Penjara Kastil",
    bg1:P.subBg1e, bg2:P.subBg2e,
    w:36,
    tiles:[
      ...row(0,36,12,"g"),
      ...row(0,36,0,"stone"),...row(0,36,1,"stone"),
      ...row(3,9,9,"stone"),{x:5,y:9,t:"q",item:"mush"},{x:6,y:9,t:"q",item:"coin"},
      ...row(11,17,7,"stone"),{x:12,y:7,t:"q",item:"coin"},{x:14,y:7,t:"q",item:"mush"},{x:15,y:7,t:"q",item:"coin"},
      ...row(19,26,9,"stone"),{x:20,y:9,t:"q",item:"coin"},{x:22,y:9,t:"q",item:"mush"},{x:24,y:9,t:"q",item:"coin"},
      ...row(28,34,7,"stone"),{x:29,y:7,t:"q",item:"coin"},{x:31,y:7,t:"q",item:"mush"},{x:32,y:7,t:"q",item:"coin"},
      {x:33,y:10,t:"p"},{x:34,y:10,t:"P"},
      {x:33,y:11,t:"ps"},{x:34,y:11,t:"Ps"},
    ],
    freeCoins:[
      {x:4,y:8},{x:6,y:8},{x:12,y:6},{x:14,y:6},{x:20,y:8},{x:22,y:8},
      {x:29,y:6},{x:31,y:6},{x:32,y:6},
    ],
    enemies:[
      {x:4,y:11,t:"G",px0:2,px1:8},
      {x:13,y:11,t:"K",px0:10,px1:16},
      {x:21,y:11,t:"G",px0:18,px1:25},
      {x:30,y:11,t:"K",px0:27,px1:33},
      {x:34,y:11,t:"G",px0:32,px1:35},
    ],
    exitPipe:{x:33,y:10},
  },
];

/* ─────────────────────────────────────────
   OVERWORLD LEVELS
───────────────────────────────────────── */
const LEVELS = [
/* ══ LEVEL 1 — Dunia Siang ══ */
{
  name:"Dunia 1-1", subWorldIdx:0,
  w:56, bg1:P.skyBlue, bg2:P.skyBlue2,
  clouds:[[2,1.2],[8,0.8],[15,1.5],[24,1],[33,1.3],[42,0.7],[50,1.1]],
  tiles:[
    ...row(0,56,12),
    // entry pipe (enter sub-world)
    {x:5,y:10,t:"pE"},{x:6,y:10,t:"PE"},
    {x:5,y:11,t:"ps"},{x:6,y:11,t:"Ps"},
    // bricks + Q blocks
    {x:10,y:8,t:"b"},{x:11,y:8,t:"q",item:"coin"},{x:12,y:8,t:"b"},{x:13,y:8,t:"q",item:"mush"},{x:14,y:8,t:"b"},
    {x:18,y:6,t:"b"},{x:19,y:6,t:"b"},{x:20,y:6,t:"q",item:"coin"},{x:21,y:6,t:"b"},{x:22,y:6,t:"b"},
    // second pipe (decoration)
    {x:16,y:10,t:"p"},{x:17,y:10,t:"P"},
    {x:16,y:11,t:"ps"},{x:17,y:11,t:"Ps"},
    {x:24,y:9,t:"p"},{x:25,y:9,t:"P"},
    {x:24,y:10,t:"ps"},{x:25,y:10,t:"Ps"},
    {x:24,y:11,t:"ps"},{x:25,y:11,t:"Ps"},
    // more bricks
    {x:28,y:9,t:"b"},{x:29,y:9,t:"q",item:"coin"},{x:30,y:9,t:"b"},{x:31,y:9,t:"q",item:"mush"},{x:32,y:9,t:"b"},
    {x:35,y:7,t:"b"},{x:36,y:7,t:"b"},{x:37,y:7,t:"q",item:"coin"},{x:38,y:7,t:"b"},
    // third pipe
    {x:40,y:10,t:"p"},{x:41,y:10,t:"P"},
    {x:40,y:11,t:"ps"},{x:41,y:11,t:"Ps"},
    {x:44,y:9,t:"b"},{x:45,y:9,t:"b"},{x:46,y:9,t:"q",item:"coin"},
    // stairs
    {x:49,y:11,t:"s"},{x:50,y:10,t:"s"},{x:50,y:11,t:"s"},
    {x:51,y:9,t:"s"},{x:51,y:10,t:"s"},{x:51,y:11,t:"s"},
    {x:52,y:8,t:"s"},{x:52,y:9,t:"s"},{x:52,y:10,t:"s"},{x:52,y:11,t:"s"},
    {x:53,y:8,t:"s"},{x:53,y:9,t:"s"},{x:53,y:10,t:"s"},{x:53,y:11,t:"s"},
  ],
  freeCoins:[
    {x:11,y:7},{x:13,y:7},{x:19,y:5},{x:20,y:5},{x:21,y:5},
    {x:29,y:8},{x:37,y:6},{x:45,y:8},{x:46,y:8},
  ],
  enemies:[
    {x:8,y:11,t:"G",px0:7,px1:12},
    {x:15,y:11,t:"G",px0:13,px1:19},
    {x:23,y:11,t:"K",px0:20,px1:27},
    {x:33,y:11,t:"G",px0:30,px1:36},
    {x:39,y:11,t:"G",px0:37,px1:43},
    {x:47,y:11,t:"K",px0:44,px1:50},
  ],
  entryPipes:[{x:5,y:10,subIdx:0}], // tile col of left pipe cap
  flagCol:54,
},
/* ══ LEVEL 2 — Dunia Malam ══ */
{
  name:"Dunia 1-2", subWorldIdx:1,
  w:60, bg1:P.skyNight, bg2:P.skyNight2,
  clouds:[[1,0.8],[7,0.5],[14,1.2],[22,0.6],[31,1],[40,0.8],[50,1.2]],
  tiles:[
    ...row(0,60,12),
    // long overhead ceiling platform
    ...row(2,14,4,"stone"),
    ...row(16,28,4,"stone"),
    {x:7,y:4,t:"q",item:"mush"},{x:9,y:4,t:"q",item:"coin"},{x:20,y:4,t:"q",item:"mush"},{x:22,y:4,t:"q",item:"coin"},
    // entry pipe
    {x:4,y:10,t:"pE"},{x:5,y:10,t:"PE"},
    {x:4,y:11,t:"ps"},{x:5,y:11,t:"Ps"},
    // mid platforms
    ...row(8,14,8,"b"),{x:10,y:8,t:"q",item:"coin"},{x:11,y:8,t:"q",item:"mush"},
    ...row(18,24,8,"b"),{x:19,y:8,t:"q",item:"coin"},{x:21,y:8,t:"q",item:"coin"},
    {x:16,y:9,t:"p"},{x:17,y:9,t:"P"},
    {x:16,y:10,t:"ps"},{x:17,y:10,t:"Ps"},
    {x:16,y:11,t:"ps"},{x:17,y:11,t:"Ps"},
    {x:26,y:10,t:"p"},{x:27,y:10,t:"P"},
    {x:26,y:11,t:"ps"},{x:27,y:11,t:"Ps"},
    ...row(30,36,7,"b"),{x:31,y:7,t:"q",item:"mush"},{x:33,y:7,t:"q",item:"coin"},
    ...row(38,44,9,"b"),{x:39,y:9,t:"q",item:"coin"},{x:41,y:9,t:"q",item:"coin"},{x:43,y:9,t:"q",item:"mush"},
    {x:36,y:9,t:"p"},{x:37,y:9,t:"P"},
    {x:36,y:10,t:"ps"},{x:37,y:10,t:"Ps"},
    {x:36,y:11,t:"ps"},{x:37,y:11,t:"Ps"},
    {x:46,y:10,t:"p"},{x:47,y:10,t:"P"},
    {x:46,y:11,t:"ps"},{x:47,y:11,t:"Ps"},
    // stairs
    {x:51,y:11,t:"s"},{x:52,y:10,t:"s"},{x:52,y:11,t:"s"},
    {x:53,y:9,t:"s"},{x:53,y:10,t:"s"},{x:53,y:11,t:"s"},
    {x:54,y:8,t:"s"},{x:54,y:9,t:"s"},{x:54,y:10,t:"s"},{x:54,y:11,t:"s"},
    {x:55,y:8,t:"s"},{x:55,y:9,t:"s"},{x:55,y:10,t:"s"},{x:55,y:11,t:"s"},
    {x:56,y:8,t:"s"},{x:56,y:9,t:"s"},{x:56,y:10,t:"s"},{x:56,y:11,t:"s"},
  ],
  freeCoins:[
    {x:9,y:7},{x:11,y:7},{x:19,y:7},{x:21,y:7},
    {x:31,y:6},{x:33,y:6},{x:39,y:8},{x:41,y:8},{x:43,y:8},
    {x:7,y:3},{x:9,y:3},{x:20,y:3},{x:22,y:3},
  ],
  enemies:[
    {x:6,y:11,t:"G",px0:4,px1:10},
    {x:11,y:11,t:"G",px0:8,px1:15},
    {x:20,y:11,t:"K",px0:17,px1:25},
    {x:28,y:11,t:"G",px0:26,px1:34},
    {x:35,y:11,t:"K",px0:32,px1:39},
    {x:43,y:11,t:"G",px0:40,px1:48},
    {x:49,y:11,t:"K",px0:46,px1:52},
  ],
  entryPipes:[{x:4,y:10,subIdx:1}],
  flagCol:57,
},
/* ══ LEVEL 3 — Hutan Senja ══ */
{
  name:"Dunia 1-3", subWorldIdx:2,
  w:62, bg1:P.skySunset, bg2:P.skySunset2,
  clouds:[[2,1],[9,0.7],[17,1.4],[26,0.9],[35,1.2],[44,0.8],[53,1]],
  tiles:[
    ...row(0,62,12),
    // entry pipe
    {x:3,y:10,t:"pE"},{x:4,y:10,t:"PE"},
    {x:3,y:11,t:"ps"},{x:4,y:11,t:"Ps"},
    {x:7,y:9,t:"b"},{x:8,y:9,t:"q",item:"mush"},{x:9,y:9,t:"b"},
    {x:12,y:7,t:"b"},{x:13,y:7,t:"b"},{x:14,y:7,t:"q",item:"coin"},{x:15,y:7,t:"b"},{x:16,y:7,t:"b"},
    {x:13,y:5,t:"q",item:"coin"},{x:14,y:5,t:"q",item:"mush"},{x:15,y:5,t:"q",item:"coin"},
    {x:19,y:10,t:"p"},{x:20,y:10,t:"P"},
    {x:19,y:11,t:"ps"},{x:20,y:11,t:"Ps"},
    {x:23,y:9,t:"p"},{x:24,y:9,t:"P"},
    {x:23,y:10,t:"ps"},{x:24,y:10,t:"Ps"},
    {x:23,y:11,t:"ps"},{x:24,y:11,t:"Ps"},
    {x:27,y:8,t:"b"},{x:28,y:8,t:"b"},{x:29,y:8,t:"q",item:"coin"},{x:30,y:8,t:"b"},{x:31,y:8,t:"b"},
    {x:34,y:6,t:"b"},{x:35,y:6,t:"q",item:"mush"},{x:36,y:6,t:"b"},{x:37,y:6,t:"q",item:"coin"},{x:38,y:6,t:"b"},
    {x:35,y:9,t:"b"},{x:36,y:9,t:"b"},
    {x:40,y:10,t:"p"},{x:41,y:10,t:"P"},
    {x:40,y:11,t:"ps"},{x:41,y:11,t:"Ps"},
    {x:44,y:9,t:"p"},{x:45,y:9,t:"P"},
    {x:44,y:10,t:"ps"},{x:45,y:10,t:"Ps"},
    {x:44,y:11,t:"ps"},{x:45,y:11,t:"Ps"},
    {x:48,y:8,t:"b"},{x:49,y:8,t:"q",item:"coin"},{x:50,y:8,t:"b"},
    // stairs
    {x:53,y:11,t:"s"},{x:54,y:10,t:"s"},{x:54,y:11,t:"s"},
    {x:55,y:9,t:"s"},{x:55,y:10,t:"s"},{x:55,y:11,t:"s"},
    {x:56,y:8,t:"s"},{x:56,y:9,t:"s"},{x:56,y:10,t:"s"},{x:56,y:11,t:"s"},
    {x:57,y:7,t:"s"},{x:57,y:8,t:"s"},{x:57,y:9,t:"s"},{x:57,y:10,t:"s"},{x:57,y:11,t:"s"},
    {x:58,y:7,t:"s"},{x:58,y:8,t:"s"},{x:58,y:9,t:"s"},{x:58,y:10,t:"s"},{x:58,y:11,t:"s"},
  ],
  freeCoins:[
    {x:8,y:8},{x:13,y:6},{x:14,y:6},{x:15,y:6},
    {x:29,y:7},{x:35,y:5},{x:37,y:5},{x:49,y:7},
  ],
  enemies:[
    {x:5,y:11,t:"G",px0:3,px1:8},
    {x:10,y:11,t:"G",px0:8,px1:14},
    {x:17,y:11,t:"K",px0:14,px1:22},
    {x:25,y:11,t:"G",px0:23,px1:30},
    {x:32,y:11,t:"G",px0:30,px1:38},
    {x:42,y:11,t:"K",px0:39,px1:47},
    {x:48,y:11,t:"G",px0:46,px1:52},
    {x:51,y:11,t:"K",px0:49,px1:54},
  ],
  entryPipes:[{x:3,y:10,subIdx:2}],
  flagCol:59,
},
/* ══ LEVEL 4 — Hutan Hijau ══ */
{
  name:"Dunia 1-4", subWorldIdx:3,
  w:65, bg1:P.skyForest, bg2:P.skyForest2,
  clouds:[[1,1],[6,0.6],[13,1.3],[21,0.9],[30,1.1],[40,0.7],[50,1.2],[58,0.8]],
  tiles:[
    ...row(0,65,12),
    // entry pipe
    {x:3,y:10,t:"pE"},{x:4,y:10,t:"PE"},
    {x:3,y:11,t:"ps"},{x:4,y:11,t:"Ps"},
    {x:7,y:9,t:"b"},{x:8,y:9,t:"q",item:"mush"},{x:9,y:9,t:"b"},
    {x:7,y:7,t:"b"},{x:8,y:7,t:"q",item:"coin"},{x:9,y:7,t:"b"},
    {x:12,y:10,t:"p"},{x:13,y:10,t:"P"},
    {x:12,y:11,t:"ps"},{x:13,y:11,t:"Ps"},
    {x:15,y:8,t:"b"},{x:16,y:8,t:"q",item:"coin"},{x:17,y:8,t:"b"},{x:18,y:8,t:"q",item:"mush"},{x:19,y:8,t:"b"},
    {x:16,y:6,t:"q",item:"coin"},{x:17,y:6,t:"q",item:"coin"},{x:18,y:6,t:"q",item:"coin"},
    {x:22,y:10,t:"p"},{x:23,y:10,t:"P"},
    {x:22,y:11,t:"ps"},{x:23,y:11,t:"Ps"},
    {x:26,y:9,t:"b"},{x:27,y:9,t:"b"},{x:28,y:9,t:"q",item:"coin"},{x:29,y:9,t:"b"},{x:30,y:9,t:"b"},
    {x:33,y:7,t:"b"},{x:34,y:7,t:"q",item:"mush"},{x:35,y:7,t:"b"},{x:36,y:7,t:"q",item:"coin"},{x:37,y:7,t:"b"},
    {x:34,y:5,t:"q",item:"coin"},{x:35,y:5,t:"q",item:"mush"},{x:36,y:5,t:"q",item:"coin"},
    {x:31,y:10,t:"p"},{x:32,y:10,t:"P"},
    {x:31,y:11,t:"ps"},{x:32,y:11,t:"Ps"},
    {x:40,y:10,t:"p"},{x:41,y:10,t:"P"},
    {x:40,y:11,t:"ps"},{x:41,y:11,t:"Ps"},
    {x:43,y:8,t:"b"},{x:44,y:8,t:"q",item:"coin"},{x:45,y:8,t:"b"},{x:46,y:8,t:"q",item:"mush"},{x:47,y:8,t:"b"},
    {x:50,y:9,t:"b"},{x:51,y:9,t:"q",item:"coin"},{x:52,y:9,t:"b"},
    {x:50,y:7,t:"q",item:"mush"},{x:51,y:7,t:"q",item:"coin"},{x:52,y:7,t:"q",item:"coin"},
    {x:54,y:10,t:"p"},{x:55,y:10,t:"P"},
    {x:54,y:11,t:"ps"},{x:55,y:11,t:"Ps"},
    // stairs
    {x:58,y:11,t:"s"},{x:59,y:10,t:"s"},{x:59,y:11,t:"s"},
    {x:60,y:9,t:"s"},{x:60,y:10,t:"s"},{x:60,y:11,t:"s"},
    {x:61,y:8,t:"s"},{x:61,y:9,t:"s"},{x:61,y:10,t:"s"},{x:61,y:11,t:"s"},
    {x:62,y:8,t:"s"},{x:62,y:9,t:"s"},{x:62,y:10,t:"s"},{x:62,y:11,t:"s"},
  ],
  freeCoins:[
    {x:8,y:8},{x:8,y:6},{x:16,y:7},{x:17,y:7},{x:18,y:7},
    {x:28,y:8},{x:34,y:6},{x:36,y:6},{x:44,y:7},{x:51,y:8},
  ],
  enemies:[
    {x:5,y:11,t:"G",px0:3,px1:8},
    {x:11,y:11,t:"G",px0:9,px1:14},
    {x:20,y:11,t:"K",px0:17,px1:25},
    {x:25,y:11,t:"G",px0:23,px1:30},
    {x:33,y:11,t:"K",px0:30,px1:37},
    {x:38,y:11,t:"G",px0:36,px1:42},
    {x:45,y:11,t:"K",px0:43,px1:50},
    {x:52,y:11,t:"G",px0:49,px1:56},
    {x:56,y:11,t:"K",px0:54,px1:60},
  ],
  entryPipes:[{x:3,y:10,subIdx:3}],
  flagCol:63,
},
/* ══ LEVEL 5 — Kastil ══ */
{
  name:"Dunia 1-5", subWorldIdx:4,
  w:70, bg1:P.skyCastle, bg2:P.skyCastle2,
  clouds:[[1,1.2],[8,0.6],[16,1.4],[25,0.8],[35,1.1],[45,0.7],[55,1.3],[64,0.9]],
  tiles:[
    ...row(0,70,12),
    // entry pipe
    {x:3,y:10,t:"pE"},{x:4,y:10,t:"PE"},
    {x:3,y:11,t:"ps"},{x:4,y:11,t:"Ps"},
    {x:7,y:9,t:"stone"},{x:8,y:9,t:"q",item:"mush"},{x:9,y:9,t:"stone"},
    {x:7,y:7,t:"stone"},{x:8,y:7,t:"q",item:"coin"},{x:9,y:7,t:"stone"},
    {x:12,y:10,t:"p"},{x:13,y:10,t:"P"},
    {x:12,y:11,t:"ps"},{x:13,y:11,t:"Ps"},
    {x:15,y:8,t:"stone"},{x:16,y:8,t:"q",item:"coin"},{x:17,y:8,t:"stone"},{x:18,y:8,t:"q",item:"mush"},{x:19,y:8,t:"stone"},
    {x:22,y:10,t:"p"},{x:23,y:10,t:"P"},
    {x:22,y:11,t:"ps"},{x:23,y:11,t:"Ps"},
    {x:25,y:9,t:"stone"},{x:26,y:9,t:"stone"},{x:27,y:9,t:"q",item:"coin"},{x:28,y:9,t:"stone"},{x:29,y:9,t:"stone"},
    {x:32,y:7,t:"stone"},{x:33,y:7,t:"q",item:"mush"},{x:34,y:7,t:"stone"},{x:35,y:7,t:"q",item:"coin"},{x:36,y:7,t:"stone"},
    {x:33,y:5,t:"q",item:"coin"},{x:34,y:5,t:"q",item:"mush"},{x:35,y:5,t:"q",item:"coin"},
    {x:30,y:10,t:"p"},{x:31,y:10,t:"P"},
    {x:30,y:11,t:"ps"},{x:31,y:11,t:"Ps"},
    {x:39,y:10,t:"p"},{x:40,y:10,t:"P"},
    {x:39,y:11,t:"ps"},{x:40,y:11,t:"Ps"},
    {x:43,y:8,t:"stone"},{x:44,y:8,t:"q",item:"coin"},{x:45,y:8,t:"stone"},{x:46,y:8,t:"q",item:"mush"},{x:47,y:8,t:"stone"},
    {x:43,y:6,t:"q",item:"coin"},{x:44,y:6,t:"q",item:"mush"},{x:45,y:6,t:"q",item:"coin"},
    {x:50,y:10,t:"p"},{x:51,y:10,t:"P"},
    {x:50,y:11,t:"ps"},{x:51,y:11,t:"Ps"},
    {x:53,y:9,t:"stone"},{x:54,y:9,t:"stone"},{x:55,y:9,t:"q",item:"coin"},{x:56,y:9,t:"stone"},
    {x:58,y:7,t:"stone"},{x:59,y:7,t:"q",item:"mush"},{x:60,y:7,t:"stone"},{x:61,y:7,t:"q",item:"coin"},{x:62,y:7,t:"stone"},
    {x:59,y:5,t:"q",item:"coin"},{x:60,y:5,t:"q",item:"mush"},{x:61,y:5,t:"q",item:"coin"},
    // grand staircase
    {x:63,y:11,t:"s"},{x:64,y:10,t:"s"},{x:64,y:11,t:"s"},
    {x:65,y:9,t:"s"},{x:65,y:10,t:"s"},{x:65,y:11,t:"s"},
    {x:66,y:8,t:"s"},{x:66,y:9,t:"s"},{x:66,y:10,t:"s"},{x:66,y:11,t:"s"},
    {x:67,y:7,t:"s"},{x:67,y:8,t:"s"},{x:67,y:9,t:"s"},{x:67,y:10,t:"s"},{x:67,y:11,t:"s"},
    {x:68,y:7,t:"s"},{x:68,y:8,t:"s"},{x:68,y:9,t:"s"},{x:68,y:10,t:"s"},{x:68,y:11,t:"s"},
  ],
  freeCoins:[
    {x:8,y:8},{x:8,y:6},{x:27,y:8},{x:33,y:6},{x:35,y:6},
    {x:44,y:7},{x:55,y:8},{x:59,y:6},{x:61,y:6},
  ],
  enemies:[
    {x:5,y:11,t:"G",px0:3,px1:9},
    {x:10,y:11,t:"G",px0:8,px1:14},
    {x:20,y:11,t:"K",px0:17,px1:24},
    {x:26,y:11,t:"G",px0:24,px1:31},
    {x:33,y:11,t:"K",px0:30,px1:38},
    {x:37,y:11,t:"G",px0:35,px1:42},
    {x:44,y:11,t:"K",px0:41,px1:50},
    {x:49,y:11,t:"G",px0:47,px1:54},
    {x:54,y:11,t:"K",px0:52,px1:58},
    {x:60,y:11,t:"G",px0:57,px1:64},
    {x:63,y:11,t:"K",px0:61,px1:66},
  ],
  entryPipes:[{x:3,y:10,subIdx:4}],
  flagCol:68,
},
];

/* ─────────────────────────────────────────
   GAME STATE
───────────────────────────────────────── */
let gState="start";       // start|play|pause|over|clear|win|pipeEnter|pipeExit|sub
let lvIdx=0, score=0, coinsGot=0, lives=3, timer=300;
let camX=0, frame=0, raf=null, timerTick=null;
let inSub=false;          // currently in sub-world
let subIdx=0;             // which sub-world
let exitPipeTarget=null;  // where to exit in overworld

let player, tiles, enemies, freeCoins, powerups, particles, floatTexts;
let flagX=0, flagCaught=false;
let pipeTransitionCb=null;

const keys={l:false,r:false,u:false,d:false};
let jumpUsed=false;

/* ─────────────────────────────────────────
   INIT LEVEL
───────────────────────────────────────── */
function initLevel(enterX, enterY){
  const L = inSub ? SUB_WORLDS[subIdx] : LEVELS[lvIdx];
  camX=0; frame=0; flagCaught=false; timer=inSub?150:300;

  const startX = enterX != null ? enterX : 2*T;
  const startY = enterY != null ? enterY : 10*T;

  player={
    x:startX, y:startY, w:26, h:30,
    vx:0, vy:0, onGround:false,
    dir:1, big:false, inv:0,
    dead:false, deadT:0, wf:0, wt:0,
  };

  tiles = L.tiles.map(td=>({
    x:td.x*T, y:td.y*T, w:T, h:T,
    t:td.t, item:td.item||null, hit:false, bumpT:0,
    // solid based on tile type
    solid: !["lava"].includes(td.t),
  }));

  enemies = L.enemies.map(e=>({
    x:e.x*T, y:(e.y-1)*T, w:26, h:26,
    t:e.t, vx:-1.1, vy:0, onGround:false,
    dead:false, squish:false, dt:0, wf:0, wt:0,
    // patrol bounds in pixel coords
    px0:e.px0*T, px1:e.px1*T,
  }));

  freeCoins = L.freeCoins.map(fc=>({
    x:fc.x*T+T/2-8, y:fc.y*T, w:16, h:20, got:false, anim:0,
  }));

  powerups=[];
  particles=[];
  floatTexts=[];

  if(!inSub){
    flagX = LEVELS[lvIdx].flagCol * T;
  } else {
    flagX = 0;
  }

  updateHUD();
}

/* ─────────────────────────────────────────
   MAIN LOOP
───────────────────────────────────────── */
function loop(){
  raf=requestAnimationFrame(loop);
  if(gState==="play"||gState==="sub"){ frame++; update(); }
  drawScene();
}

/* ─────────────────────────────────────────
   UPDATE
───────────────────────────────────────── */
function update(){
  // Death anim
  if(player.dead){
    player.deadT--;
    player.vy+=0.45; player.y+=player.vy;
    if(player.deadT<=0){
      lives--;
      if(lives<=0){ endGame("over"); return; }
      if(inSub){ inSub=false; gState="play"; }
      initLevel(); flashLevel();
    }
    return;
  }
  if(player.inv>0) player.inv--;

  // Horizontal
  if(keys.l){ player.vx=Math.max(player.vx-1,-SPD); player.dir=-1; }
  else if(keys.r){ player.vx=Math.min(player.vx+1,SPD); player.dir=1; }
  else player.vx*=0.78;

  // Walk anim
  player.wt++;
  if(Math.abs(player.vx)>0.5&&player.onGround){
    if(player.wt>7){player.wt=0;player.wf=(player.wf+1)%3;}
  } else player.wf=0;

  // Gravity & movement
  player.vy=Math.min(player.vy+GR,16);
  player.x+=player.vx;

  const L=inSub?SUB_WORLDS[subIdx]:LEVELS[lvIdx];
  player.x=Math.max(0,Math.min(player.x,L.w*T-player.w));
  axisX(player);
  player.y+=player.vy;
  player.onGround=false;
  axisY(player,true);

  if(player.y>H+80) killPlayer();

  // Camera
  const tgt=Math.max(0,Math.min(player.x-W*0.33,L.w*T-W));
  camX+=(tgt-camX)*CAM;

  // ── Pipe detection (overworld only) ──
  if(!inSub && keys.d && player.onGround){
    const ep=LEVELS[lvIdx].entryPipes||[];
    for(const ep_ of ep){
      const pipeWorldX=ep_.x*T, pipeWorldY=ep_.y*T;
      // player center must be over the pipe top
      const pCx=player.x+player.w/2;
      if(pCx>pipeWorldX && pCx<pipeWorldX+T*2 &&
         Math.abs((player.y+player.h)-pipeWorldY)<20){
        enterPipe(ep_.subIdx, pipeWorldX, pipeWorldY);
        return;
      }
    }
  }

  // ── Sub-world exit pipe ──
  if(inSub && keys.d && player.onGround){
    const sw=SUB_WORLDS[subIdx];
    const ep=sw.exitPipe;
    const pipeWorldX=ep.x*T, pipeWorldY=ep.y*T;
    const pCx=player.x+player.w/2;
    if(pCx>pipeWorldX && pCx<pipeWorldX+T*2 &&
       Math.abs((player.y+player.h)-pipeWorldY)<20){
      exitPipe();
      return;
    }
  }

  // Coins
  for(const fc of freeCoins){
    if(fc.got) continue;
    fc.anim+=0.1;
    if(ov(player,{x:fc.x,y:fc.y,w:fc.w,h:fc.h})){
      fc.got=true; coinsGot++; score+=200;
      ft(fc.x,fc.y,"+200",P.coin); sp(fc.x+8,fc.y,P.coin,5);
    }
  }

  // Powerups
  for(const pu of powerups){
    if(!pu.active) continue;
    pu.vy=Math.min(pu.vy+GR,14);
    pu.x+=pu.vx; axisX(pu); if(pu.hitWall) pu.vx*=-1;
    pu.y+=pu.vy; axisY(pu,false);
    if(pu.y>H+80){pu.active=false;continue;}
    if(ov(player,pu)){
      pu.active=false;
      if(!player.big){player.big=true;player.h=48;player.y-=18;}
      score+=1000; ft(pu.x,pu.y,"+1000","#f84"); sp(pu.x,pu.y,P.mushRed,8);
    }
  }

  // Enemies  (patrol)
  for(const e of enemies){
    if(e.dead) continue;
    if(e.squish){e.dt--;if(e.dt<=0)e.dead=true;continue;}
    e.vy=Math.min(e.vy+GR,14);
    e.x+=e.vx;
    // patrol turnaround
    if(e.x<=e.px0){e.x=e.px0;e.vx=Math.abs(e.vx);}
    else if(e.x+e.w>=e.px1){e.x=e.px1-e.w;e.vx=-Math.abs(e.vx);}
    axisX(e); if(e.hitWall) e.vx*=-1;
    e.y+=e.vy; e.onGround=false; axisY(e,false);
    if(e.y>H+60){e.dead=true;continue;}
    e.wt++;if(e.wt>10){e.wt=0;e.wf=(e.wf+1)%2;}

    if(!player.inv&&ov(player,{x:e.x,y:e.y,w:e.w,h:e.h})){
      const pBot=player.y+player.h, eMid=e.y+e.h/2;
      if(pBot<eMid+12&&player.vy>0){
        e.squish=true;e.dt=45;e.h=10;e.y+=16;
        player.vy=-9;score+=100;
        ft(e.x+e.w/2,e.y,"+100","#fff"); sp(e.x+e.w/2,e.y,P.gBrown,6);
      } else {
        if(player.big){player.big=false;player.h=30;player.inv=100;}
        else killPlayer();
      }
    }
  }

  // Tile bumps
  for(const tl of tiles){
    if(tl.t!=="b"&&tl.t!=="q") continue;
    if(tl.bumpT>0) tl.bumpT--;
    if(tl.hit) continue;
    const under=player.x<tl.x+tl.w&&player.x+player.w>tl.x&&
      Math.abs(player.y-(tl.y+tl.h))<6&&player.vy<0;
    if(under){
      tl.bumpT=8;
      if(tl.t==="q"){
        tl.hit=true;
        if(tl.item==="coin"){coinsGot++;score+=200;ft(tl.x+T/2,tl.y,"+200",P.coin);sp(tl.x+T/2,tl.y,P.coin,5);}
        else if(tl.item==="mush"){
          powerups.push({x:tl.x,y:tl.y-T,w:26,h:26,t:"mush",active:true,vx:1.2,vy:-5,onGround:false,hitWall:false});
        }
      } else if(tl.t==="b"&&player.big){
        tl.t="broken";sp(tl.x+T/2,tl.y+T/2,P.brick,8);score+=50;
      }
    }
  }

  // Flag (overworld only)
  if(!inSub&&!flagCaught){
    const pr={x:flagX,y:3*T,w:8,h:9*T};
    if(ov(player,pr)){
      flagCaught=true;score+=1000;
      ft(flagX,3*T,"+1000",P.coin);
      setTimeout(()=>{
        if(lvIdx>=LEVELS.length-1) endGame("win");
        else endGame("clear");
      },900);
    }
  }

  // Particles
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=0.28;p.life--;
    if(p.life<=0)particles.splice(i,1);
  }
  for(let i=floatTexts.length-1;i>=0;i--){
    const f=floatTexts[i];f.y-=0.9;f.life--;
    if(f.life<=0)floatTexts.splice(i,1);
  }

  updateHUD();
}

/* ─────────────────────────────────────────
   PIPE TRANSITIONS
───────────────────────────────────────── */
function enterPipe(sIdx, pipeX, pipeY){
  if(gState==="pipeEnter") return;
  gState="pipeEnter";
  subIdx=sIdx;

  // Animate Mario sliding into pipe
  const overlay=document.getElementById("pipeOverlay");
  overlay.style.transition="opacity .4s ease";
  overlay.classList.add("active");

  // Slide player down into pipe during fade
  const slideInterval=setInterval(()=>{
    player.y+=3; player.vx=0;
  },16);

  setTimeout(()=>{
    clearInterval(slideInterval);
    // Switch to sub-world
    inSub=true;
    gState="sub";
    const sw=SUB_WORLDS[sIdx];
    // Enter from left side of sub
    initLevel(2*T, 9*T);

    // Show sub-world label
    const lbl=document.getElementById("subLabel");
    const ltxt=document.getElementById("subLabelText");
    ltxt.textContent="🌑 "+sw.name+"!";
    lbl.classList.remove("hide");

    setTimeout(()=>{
      lbl.classList.add("hide");
      overlay.classList.remove("active");
    },1600);
  },500);
}

function exitPipe(){
  if(gState==="pipeExit") return;
  gState="pipeExit";

  const overlay=document.getElementById("pipeOverlay");
  overlay.classList.add("active");

  const slideInterval=setInterval(()=>{
    player.y+=3; player.vx=0;
  },16);

  setTimeout(()=>{
    clearInterval(slideInterval);
    inSub=false;
    gState="play";

    // Find the entry pipe position in overworld and spawn above it
    const L=LEVELS[lvIdx];
    const ep=L.entryPipes&&L.entryPipes[0];
    const spawnX = ep ? ep.x*T+T/2-player.w/2 : 4*T;
    const spawnY = ep ? ep.y*T-player.h-4 : 9*T;

    initLevel(spawnX, spawnY);

    // Show "Kembali!" label
    const lbl=document.getElementById("subLabel");
    const ltxt=document.getElementById("subLabelText");
    ltxt.textContent="⬆ Kembali ke "+LEVELS[lvIdx].name+"!";
    lbl.classList.remove("hide");

    setTimeout(()=>{
      lbl.classList.add("hide");
      overlay.classList.remove("active");
    },1500);
  },500);
}

/* ─────────────────────────────────────────
   COLLISION
───────────────────────────────────────── */
function solidT(){ return tiles.filter(t=>t.solid&&t.t!=="broken"); }

function axisX(obj){
  obj.hitWall=false;
  for(const tl of solidT()){
    if(!ov(obj,tl)) continue;
    if(obj.vx>0){obj.x=tl.x-obj.w;obj.hitWall=true;}
    else{obj.x=tl.x+tl.w;obj.hitWall=true;}
    obj.vx=0;
  }
}
function axisY(obj,isP){
  for(const tl of solidT()){
    if(!ov(obj,tl)) continue;
    if(obj.vy>0){obj.y=tl.y-obj.h;obj.vy=0;obj.onGround=true;if(isP)player.onGround=true;}
    else{obj.y=tl.y+tl.h;obj.vy=0;}
  }
}

function killPlayer(){
  if(player.dead||player.inv>0) return;
  player.dead=true;player.deadT=80;player.vy=JF*0.9;
}

/* ─────────────────────────────────────────
   PARTICLES & FLOAT TEXTS
───────────────────────────────────────── */
function sp(x,y,color,n){
  for(let i=0;i<n;i++) particles.push({x,y,vx:(Math.random()-.5)*5,vy:-2-Math.random()*3,life:20+Math.random()*12,color,r:3+Math.random()*3});
}
function ft(wx,wy,text,color){
  floatTexts.push({sx:wx-camX,y:wy,text,color,life:50});
}

/* ─────────────────────────────────────────
   DRAW
───────────────────────────────────────── */
function drawScene(){
  const L=inSub?SUB_WORLDS[subIdx]:LEVELS[lvIdx];

  // Sky
  const sky=ctx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,L.bg1); sky.addColorStop(1,L.bg2);
  ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);

  // Stars for dark sub-worlds
  if(inSub){ drawStars(); }
  else {
    for(const [gx,gy] of (L.clouds||[])){
      const sx=gx*T-camX*0.38;
      if(sx<-120||sx>W+120) continue;
      drawCloud(sx,gy*T+10);
    }
  }

  ctx.save();
  ctx.translate(-Math.floor(camX),0);

  for(const tl of tiles) drawTile(tl);
  for(const fc of freeCoins) if(!fc.got) drawCoin(fc);
  for(const pu of powerups) if(pu.active) drawMush(pu.x,pu.y);
  for(const e of enemies) if(!e.dead) drawEnemy(e);

  if(!inSub) drawFlag();

  // player
  if(!player.dead||Math.floor(player.deadT/5)%2===0) drawPlayer();

  // particles
  for(const p of particles){
    ctx.globalAlpha=p.life/30; ctx.fillStyle=p.color;
    ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;
  }
  ctx.restore();

  // Float texts
  ctx.textAlign="center";ctx.textBaseline="middle";
  for(const f of floatTexts){
    ctx.globalAlpha=f.life/50;ctx.fillStyle=f.color;
    ctx.font='bold 9px "Press Start 2P",monospace';
    ctx.fillText(f.text,f.sx,f.y);ctx.globalAlpha=1;
  }
  ctx.textAlign="left";ctx.textBaseline="alphabetic";

  // Sub-world border overlay (dark vignette)
  if(inSub){
    const vg=ctx.createRadialGradient(W/2,H/2,H*0.2,W/2,H/2,H*0.9);
    vg.addColorStop(0,"transparent");
    vg.addColorStop(1,"rgba(0,0,0,0.5)");
    ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
  }
}

/* ── Stars for underground ── */
function drawStars(){
  ctx.fillStyle="rgba(255,255,255,0.6)";
  // pseudo-random but stable
  for(let i=0;i<40;i++){
    const x=(i*137+73)%W, y=(i*97+41)%(H*0.6);
    const r=(frame*0.02+i)%1;
    ctx.globalAlpha=0.3+Math.abs(Math.sin(r*Math.PI))*0.5;
    ctx.fillRect(x,y,1+(i%2),1+(i%3));
  }
  ctx.globalAlpha=1;
}

/* ── Cloud ── */
function drawCloud(x,y){
  ctx.fillStyle=P.cloudW;
  ctx.beginPath();
  ctx.arc(x+20,y+4,14,0,Math.PI*2);ctx.arc(x+36,y-4,18,0,Math.PI*2);ctx.arc(x+54,y+4,14,0,Math.PI*2);
  ctx.fill();ctx.fillRect(x+6,y+4,62,14);
  ctx.fillStyle=P.cloudS;ctx.fillRect(x+6,y+16,62,3);
}

/* ── Tile ── */
function drawTile(tl){
  if(tl.t==="broken") return;
  const bo=tl.bumpT>0?-tl.bumpT*0.6:0;
  const tx=Math.floor(tl.x), ty=Math.floor(tl.y+bo);

  switch(tl.t){
    case"g":
      ctx.fillStyle=P.grassTop;ctx.fillRect(tx,ty,T,5);
      ctx.fillStyle=P.groundSoil;ctx.fillRect(tx,ty+5,T,T-5);
      ctx.fillStyle=P.groundDark;
      ctx.fillRect(tx+2,ty+7,5,4);ctx.fillRect(tx+12,ty+10,4,3);ctx.fillRect(tx+22,ty+7,5,4);
      break;
    case"b":
      ctx.fillStyle=P.brick;ctx.fillRect(tx,ty,T,T);
      ctx.fillStyle=P.brickLine;
      ctx.fillRect(tx,ty+T/2-1,T,2);ctx.fillRect(tx+T/2-1,ty,2,T/2);
      ctx.fillRect(tx+T*.25,ty+T/2+1,2,T/2-1);ctx.fillRect(tx+T*.75,ty+T/2+1,2,T/2-1);
      ctx.fillStyle="rgba(255,255,255,.15)";ctx.fillRect(tx,ty,T,3);
      ctx.fillStyle="rgba(0,0,0,.2)";ctx.fillRect(tx,ty+T-3,T,3);
      break;
    case"q":
      if(tl.hit){
        ctx.fillStyle=P.qDark;ctx.fillRect(tx,ty,T,T);
        ctx.fillStyle="rgba(0,0,0,.3)";ctx.fillRect(tx,ty+T-3,T,3);
      } else {
        ctx.fillStyle=P.qBlock;ctx.fillRect(tx,ty,T,T);
        ctx.fillStyle=P.qShine;ctx.fillRect(tx+2,ty+2,T-4,5);ctx.fillRect(tx+2,ty+2,5,T-4);
        ctx.fillStyle=P.qDark;ctx.fillRect(tx,ty+T-3,T,3);ctx.fillRect(tx+T-3,ty,3,T);
        ctx.fillStyle="#fff";ctx.font='bold 16px "Press Start 2P",monospace';
        ctx.textAlign="center";ctx.textBaseline="middle";
        ctx.fillText("?",tx+T/2,ty+T/2+1);
        ctx.textAlign="left";ctx.textBaseline="alphabetic";
      }
      break;
    case"s":
      ctx.fillStyle=P.groundSoil;ctx.fillRect(tx,ty,T,T);
      ctx.fillStyle=P.groundDark;ctx.fillRect(tx,ty,T,4);ctx.fillRect(tx+T-4,ty,4,T);
      ctx.fillStyle=P.grassTop;ctx.fillRect(tx,ty,T,3);
      break;
    case"stone":
      ctx.fillStyle=P.stone;ctx.fillRect(tx,ty,T,T);
      ctx.fillStyle=P.stoneLight;ctx.fillRect(tx+2,ty+2,T-4,4);ctx.fillRect(tx+2,ty+2,4,T-4);
      ctx.fillStyle=P.stoneDark;ctx.fillRect(tx,ty+T-3,T,3);ctx.fillRect(tx+T-3,ty,3,T);
      break;
    case"ice":
      ctx.fillStyle=P.iceBlue;ctx.fillRect(tx,ty,T,T);
      ctx.fillStyle=P.iceLight;ctx.fillRect(tx+2,ty+2,T-4,5);ctx.fillRect(tx+2,ty+2,5,T-4);
      ctx.fillStyle=P.iceDark;ctx.fillRect(tx,ty+T-3,T,3);ctx.fillRect(tx+T-3,ty,3,T);
      // ice shine
      ctx.fillStyle="rgba(255,255,255,.3)";ctx.fillRect(tx+4,ty+4,8,2);
      break;
    case"lava":
      // animated lava
      ctx.fillStyle=P.lava;ctx.fillRect(tx,ty,T,T);
      ctx.fillStyle=P.lavaBright;
      const lt=(frame*.05)%1;
      ctx.fillRect(tx+2,ty+4+Math.sin(lt*Math.PI*2+tx*.3)*3,6,4);
      ctx.fillRect(tx+14,ty+4+Math.sin(lt*Math.PI*2+tx*.5)*3,6,4);
      ctx.fillRect(tx+24,ty+4+Math.sin(lt*Math.PI*2+tx*.4)*3,6,4);
      break;
    case"p": case"pE": // pipe left cap (pE = enterable)
      ctx.fillStyle=P.pipeDark;ctx.fillRect(tx,ty,T,T);
      ctx.fillStyle=P.pipeGreen;ctx.fillRect(tx,ty,T-4,T);
      ctx.fillStyle=P.pipeLight;ctx.fillRect(tx+3,ty,4,T);
      ctx.fillStyle=P.pipeDark;ctx.fillRect(tx-4,ty,T+4,8);
      ctx.fillStyle=P.pipeGreen;ctx.fillRect(tx-4,ty,T,8);
      ctx.fillStyle=P.pipeLight;ctx.fillRect(tx-1,ty+1,4,6);
      // arrow indicator for enterable pipe
      if(tl.t==="pE"){
        ctx.fillStyle="rgba(255,255,0,0.8)";
        const arr=Math.floor(frame*.05)%3;
        ctx.fillRect(tx+8,ty-6-arr*2,8,3);
        ctx.fillRect(tx+10,ty-10-arr*2,4,4);
      }
      break;
    case"P": case"PE":
      ctx.fillStyle=P.pipeDark;ctx.fillRect(tx,ty,T,T);
      ctx.fillStyle=P.pipeGreen;ctx.fillRect(tx+4,ty,T-4,T);
      ctx.fillStyle=P.pipeLight;ctx.fillRect(tx+T-7,ty,4,T);
      ctx.fillStyle=P.pipeDark;ctx.fillRect(tx,ty,T+4,8);
      ctx.fillStyle=P.pipeLight;ctx.fillRect(tx+T-3,ty+1,4,6);
      break;
    case"ps":
      ctx.fillStyle=P.pipeDark;ctx.fillRect(tx,ty,T,T);
      ctx.fillStyle=P.pipeGreen;ctx.fillRect(tx,ty,T-4,T);
      ctx.fillStyle=P.pipeLight;ctx.fillRect(tx+3,ty,4,T);
      break;
    case"Ps":
      ctx.fillStyle=P.pipeDark;ctx.fillRect(tx,ty,T,T);
      ctx.fillStyle=P.pipeGreen;ctx.fillRect(tx+4,ty,T-4,T);
      ctx.fillStyle=P.pipeLight;ctx.fillRect(tx+T-7,ty,4,T);
      break;
  }
}

/* ── Coin ── */
function drawCoin(fc){
  const pulse=Math.sin(fc.anim)*.28+.72;
  const fw=Math.max(4,Math.floor(fc.w*pulse));
  const fx=Math.floor(fc.x+(fc.w-fw)/2), fy=Math.floor(fc.y);
  ctx.fillStyle=P.coin;ctx.fillRect(fx,fy,fw,fc.h);
  ctx.fillStyle=P.coinShine;ctx.fillRect(fx+2,fy+2,Math.max(2,fw-6),8);
}

/* ── Mushroom ── */
function drawMush(mx,my){
  const px=Math.floor(mx),py=Math.floor(my);
  ctx.fillStyle=P.mushStem;ctx.fillRect(px+4,py+14,18,12);
  ctx.fillStyle=P.mushRed;ctx.fillRect(px,py,26,16);
  ctx.fillStyle=P.mushSpot;
  ctx.fillRect(px+3,py+2,7,7);ctx.fillRect(px+15,py+2,7,7);ctx.fillRect(px+9,py+7,5,5);
  ctx.fillStyle="rgba(0,0,0,.18)";ctx.fillRect(px,py+14,26,2);
}

/* ── Player ── */
function drawPlayer(){
  const px=Math.floor(player.x), py=Math.floor(player.y);
  const big=player.big, w=player.w, h=player.h;
  ctx.save();
  if(player.dir===-1){ctx.translate(px+w,py);ctx.scale(-1,1);}
  else ctx.translate(px,py);
  if(player.inv>0&&Math.floor(player.inv/5)%2===1) ctx.globalAlpha=0.45;

  ctx.fillStyle=P.pRed;ctx.fillRect(5,0,w-10,big?10:7);
  ctx.fillRect(2,big?8:5,w-4,3);
  ctx.fillStyle=P.pFace;ctx.fillRect(2,big?9:7,w-4,big?12:10);
  ctx.fillStyle="#000";
  ctx.fillRect(big?9:6,big?12:10,3,3);ctx.fillRect(big?16:13,big?12:10,3,3);
  ctx.fillRect(big?6:4,big?17:14,big?14:10,2);
  ctx.fillStyle=P.pRed;ctx.fillRect(1,big?21:17,w-2,big?14:9);
  ctx.fillStyle=P.pPants;ctx.fillRect(0,big?35:26,w,big?10:7);
  ctx.fillStyle=P.pFace;ctx.fillRect(5,big?37:28,4,4);ctx.fillRect(w-9,big?37:28,4,4);
  ctx.fillStyle=P.pShoe;
  ctx.fillRect(0,big?45:33,13,big?5:4);ctx.fillRect(w-13,big?45:33,13,big?5:4);

  ctx.globalAlpha=1;ctx.restore();
}

/* ── Enemy ── */
function drawEnemy(e){
  const px=Math.floor(e.x),py=Math.floor(e.y);
  ctx.save();ctx.translate(px,py);
  if(e.squish){
    ctx.fillStyle=P.gBrown;ctx.fillRect(0,e.h-6,e.w,6);
    ctx.restore();return;
  }
  if(e.t==="G"){
    ctx.fillStyle=P.gDark;ctx.fillRect(0,e.h-7,9,7);ctx.fillRect(e.w-9,e.h-7,9,7);
    ctx.fillStyle=P.gBrown;ctx.fillRect(2,6,e.w-4,e.h-9);ctx.fillRect(0,0,e.w,10);
    ctx.fillStyle=P.gFace;ctx.fillRect(3,7,7,8);ctx.fillRect(e.w-10,7,7,8);
    ctx.fillStyle="#000";
    ctx.fillRect(5,10,3,3);ctx.fillRect(e.w-8,10,3,3);
    ctx.fillRect(3,5,8,2);ctx.fillRect(e.w-11,5,8,2);
  } else {
    ctx.fillStyle=P.kShell;ctx.fillRect(4,8,e.w-8,e.h-8);
    ctx.fillStyle=P.kLight;ctx.fillRect(6,10,e.w-12,e.h-14);
    ctx.fillStyle="rgba(0,80,0,.25)";
    ctx.fillRect(9,13,4,4);ctx.fillRect(14,16,4,4);ctx.fillRect(9,19,4,4);
    const hx=e.vx<0?0:e.w-10;
    ctx.fillStyle=P.kFace;ctx.fillRect(hx,1,10,10);
    ctx.fillStyle="#000";ctx.fillRect(hx+(e.vx<0?2:5),4,3,3);
    ctx.fillStyle="#fff";
    ctx.fillRect(hx+(e.vx<0?1:3),10,4,4);ctx.fillRect(hx+(e.vx<0?6:8),10,3,4);
    ctx.fillStyle=P.kShell;ctx.fillRect(0,e.h-6,9,6);ctx.fillRect(e.w-9,e.h-6,9,6);
  }
  ctx.restore();
}

/* ── Flag ── */
function drawFlag(){
  if(!flagX) return;
  const poleTop=3*T, fx=Math.floor(flagX);
  ctx.fillStyle=P.flagPole;ctx.fillRect(fx,poleTop,6,9*T);
  ctx.fillStyle=P.flagGreen;ctx.fillRect(fx+6,poleTop,24,16);
  ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(fx+3,poleTop,5,0,Math.PI*2);ctx.fill();
}

/* ─────────────────────────────────────────
   HUD
───────────────────────────────────────── */
function updateHUD(){
  document.getElementById("hSkor").textContent=String(score).padStart(6,"0");
  document.getElementById("hKoin").textContent="🪙 "+String(coinsGot).padStart(2,"0");
  const wName=inSub?"Sub":"Dunia";
  document.getElementById("hDunia").textContent=(inSub?"🌑":"🌍")+" "+(lvIdx+1);
  document.getElementById("hWaktu").textContent=timer;
  document.getElementById("hNyawa").textContent="🍄×"+lives;
  const tw=document.getElementById("hWaktu");
  timer<=100?tw.classList.add("danger"):tw.classList.remove("danger");
}

function startTimer(){
  clearInterval(timerTick);
  timerTick=setInterval(()=>{
    if(gState!=="play"&&gState!=="sub") return;
    timer--;if(timer<=0){timer=0;killPlayer();}
    updateHUD();
  },1000);
}

function flashLevel(){
  const el=document.getElementById("hDunia");
  el.style.color="#f84";
  setTimeout(()=>el.style.color="",1800);
}

/* ─────────────────────────────────────────
   SCREEN MANAGEMENT
───────────────────────────────────────── */
const SCREENS=["ovStart","ovPause","ovOver","ovClear","ovWin"];
function hideAll(){ SCREENS.forEach(id=>document.getElementById(id).classList.add("hide")); }
function showOv(id){ hideAll();document.getElementById(id).classList.remove("hide"); }

function endGame(type){
  gState=type;clearInterval(timerTick);
  if(type==="over"){document.getElementById("goScore").textContent="SKOR: "+score;showOv("ovOver");}
  else if(type==="clear"){document.getElementById("lcScore").textContent="SKOR: "+score;showOv("ovClear");}
  else if(type==="win"){document.getElementById("winScore").textContent="SKOR TOTAL: "+score;showOv("ovWin");}
}

/* ─────────────────────────────────────────
   GAME ACTIONS
───────────────────────────────────────── */
function startGame(){
  score=0;coinsGot=0;lives=3;lvIdx=0;inSub=false;
  hideAll();initLevel();gState="play";updateHUD();startTimer();flashLevel();
  if(!raf) loop();
}
function restartGame(){
  score=0;coinsGot=0;lives=3;lvIdx=0;inSub=false;
  hideAll();initLevel();gState="play";updateHUD();startTimer();flashLevel();
}
function nextLevel(){
  lvIdx++;inSub=false;
  hideAll();initLevel();gState="play";updateHUD();startTimer();flashLevel();
}
function togglePause(){
  if(gState==="play"||gState==="sub"){
    gState="pause";showOv("ovPause");clearInterval(timerTick);
  } else if(gState==="pause"){
    gState=inSub?"sub":"play";hideAll();startTimer();
  }
}
function doJump(){
  if((gState!=="play"&&gState!=="sub")||!player||player.dead) return;
  if(player.onGround){player.vy=JF;player.onGround=false;}
}

/* ─────────────────────────────────────────
   KEYBOARD
───────────────────────────────────────── */
const STOP=new Set(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Space","KeyZ","KeyW","KeyA","KeyD"]);
document.addEventListener("keydown",e=>{
  if(STOP.has(e.code)) e.preventDefault();
  switch(e.code){
    case"ArrowLeft":case"KeyA":keys.l=true;break;
    case"ArrowRight":case"KeyD":keys.r=true;break;
    case"ArrowDown":case"KeyS":keys.d=true;break;
    case"ArrowUp":case"KeyW":case"Space":case"KeyZ":
      if(!jumpUsed){jumpUsed=true;doJump();}break;
    case"Escape":case"KeyP":togglePause();break;
  }
});
document.addEventListener("keyup",e=>{
  switch(e.code){
    case"ArrowLeft":case"KeyA":keys.l=false;break;
    case"ArrowRight":case"KeyD":keys.r=false;break;
    case"ArrowDown":case"KeyS":keys.d=false;break;
    case"ArrowUp":case"KeyW":case"Space":case"KeyZ":jumpUsed=false;break;
  }
});

/* ─────────────────────────────────────────
   MOBILE
───────────────────────────────────────── */
function mb(id,k){
  const el=document.getElementById(id);
  if(!el) return;
  el.addEventListener("touchstart",e=>{e.preventDefault();keys[k]=true;el.classList.add("on");},{passive:false});
  el.addEventListener("touchend",e=>{e.preventDefault();keys[k]=false;el.classList.remove("on");},{passive:false});
  el.addEventListener("touchcancel",()=>{keys[k]=false;el.classList.remove("on");});
}
mb("cL","l"); mb("cR","r"); mb("cD","d");

const jBtn=document.getElementById("cJ");
jBtn.addEventListener("touchstart",e=>{e.preventDefault();jBtn.classList.add("on");doJump();},{passive:false});
jBtn.addEventListener("touchend",e=>{e.preventDefault();jBtn.classList.remove("on");},{passive:false});

const pBtn=document.getElementById("cP");
pBtn.addEventListener("touchstart",e=>{e.preventDefault();togglePause();},{passive:false});

/* ─────────────────────────────────────────
   BUTTON WIRING
───────────────────────────────────────── */
document.getElementById("btnStart").addEventListener("click",startGame);
document.getElementById("btnResume").addEventListener("click",togglePause);
document.getElementById("btnRestart1").addEventListener("click",restartGame);
document.getElementById("btnRestart2").addEventListener("click",restartGame);
document.getElementById("btnRestart3").addEventListener("click",restartGame);
document.getElementById("btnNext").addEventListener("click",nextLevel);

/* ─────────────────────────────────────────
   KICK OFF
───────────────────────────────────────── */
loop();
