'use strict';

// =====================================================================
// CONSTANTS
// =====================================================================
const CELL = 3;
const WALL_H = 3.2;
const PLAYER_HEIGHT = 1.4;
const PLAYER_RADIUS = 0.38;
const GRAVITY = -18;
const JUMP_FORCE = 7;
const MOVE_SPEED = 5.5;
const CROUCH_SPEED = 2.2;
const CROUCH_HEIGHT = 0.85; // 앉았을 때 카메라 높이
const BHOP_MAX_SPEED = MOVE_SPEED * 1.8; // 버니합 최대 속도 상한

// Enemy state enums (performance: avoids string comparisons)
const STATE = { PATROL: 0, ALERT: 1, SCAN: 2, ATTACK: 3, DEAD: 4 };

// =====================================================================
// MAP  (0=floor, 1=wall)
// =====================================================================
const MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,1,1,0,1,1,1,0,0,0,0,0,0,1],
    [1,1,1,0,1,1,1,1,1,0,0,0,1,1,1,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,1,1,1,1,1,0,0,0,1,1,1,1,1,0,0,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
    [1,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,1,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,0,1,1,1,1,1,0,1,1,1,0,1,1,1,1,1,0,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const ENEMY_DATA = [
    { r:1,  c:18, wp:[{r:1,c:16},{r:3,c:18}] },
    { r:2,  c:10, wp:[{r:2,c:10},{r:4,c:11}] },
    { r:3,  c:16, wp:[{r:1,c:16},{r:4,c:19}] },
    { r:7,  c:2,  wp:[{r:7,c:2},{r:8,c:6}]   },
    { r:8,  c:19, wp:[{r:7,c:19},{r:8,c:16}] },
    { r:10, c:7,  wp:[{r:10,c:7},{r:11,c:9}] },
    { r:11, c:13, wp:[{r:11,c:13},{r:12,c:15}]},
    { r:14, c:3,  wp:[{r:14,c:3},{r:15,c:7}] },
    { r:15, c:10, wp:[{r:15,c:10},{r:14,c:14}]},
    { r:17, c:16, wp:[{r:17,c:16},{r:18,c:13}]},
];

const CRATE_POS = [
    {r:2,c:5},{r:4,c:6},{r:1,c:11},{r:3,c:15},
    {r:7,c:10},{r:8,c:13},{r:8,c:7},
    {r:11,c:8},{r:10,c:14},
    {r:14,c:8},{r:15,c:13},{r:17,c:5},{r:18,c:17},
];

// =====================================================================
// WEAPON REGISTRY — 모든 무기 속성을 한 곳에서 정의
// 새 무기 추가: 이 배열에 항목 하나 추가하면 됨
// =====================================================================
const WEAPON_DEFS = [
    // idx 0: Desert Eagle
    {
        id: 'desert_eagle', name: 'DESERT EAGLE',
        ammo: 12,  reserve: 48,  maxAmmo: 12,
        damage: 30, fireRate: 0.38, recoil: 0.025, spread: 0.018,
        bulletSpeed: 135, auto: false, reloadTime: 1.1,
        shotVar: [1.00, 10000,  60, 1.0],               // [playbackRate, lpfHz, hpfHz, gain]
        viewPos: [0.54, -0.22, -0.30],
        viewRot: [0.12,  0.35, -0.06],
    },
    // idx 1: AK-47
    {
        id: 'ak47', name: 'AK-47',
        ammo: 30,  reserve: 120, maxAmmo: 30,
        damage: 33, fireRate: 0.095, recoil: 0.014, spread: 0.038,
        bulletSpeed: 195, auto: true,  reloadTime: 1.8,
        shotVar: [0.91,  7000,  40, 1.1],
        viewPos: [0.48, -0.24, -0.34],
        viewRot: [0.08,  0.30, -0.04],
    },
    // idx 2: Knife
    {
        id: 'knife', name: 'KNIFE',
        ammo: 1,   reserve: 0,   maxAmmo: 1,
        damage: 50, fireRate: 0.5,  recoil: 0,    spread: 0,
        bulletSpeed: 0, auto: false, reloadTime: 0,
        melee: true, meleeRange: 2.0,
        shotVar: null,
        viewPos: [0.52, -0.24, -0.28],
        viewRot: [0.14,  0.32, -0.06],
    },
    // idx 3: AWP
    {
        id: 'awp', name: 'AWP',
        ammo: 5,   reserve: 20,  maxAmmo: 5,
        damage: 115, fireRate: 1.4, recoil: 0.056, spread: 0.001,
        bulletSpeed: 300, auto: false, reloadTime: 2.5, adsFov: 12,
        shotVar: [0.86,  7500,  50, 1.2],  // AWP — 낮고 깊되 너무 낮지 않게
        viewPos: [0.44, -0.22, -0.38],
        viewRot: [0.06,  0.28, -0.03],
    },
    // idx 4: M14 EBR
    {
        id: 'm14', name: 'M14 EBR',
        ammo: 10,  reserve: 40,  maxAmmo: 10,
        damage: 60, fireRate: 0.24, recoil: 0.032, spread: 0.005,
        bulletSpeed: 250, auto: false, reloadTime: 2.0, adsFov: 28,
        shotVar: [0.95,  8000,  50, 1.0],
        viewPos: [0.46, -0.23, -0.36],
        viewRot: [0.07,  0.29, -0.03],
    },
    // idx 5: MP5
    {
        id: 'mp5', name: 'MP5',
        ammo: 30,  reserve: 120, maxAmmo: 30,
        damage: 20, fireRate: 0.075, recoil: 0.010, spread: 0.024,
        bulletSpeed: 180, auto: true,  reloadTime: 1.4, adsFov: 55,
        shotVar: [1.22, 12000,  80, 0.75],  // 높고 가볍고 빠름
        viewPos: [0.50, -0.25, -0.32],
        viewRot: [0.10,  0.32, -0.05],
    },
    // idx 6: SPAS-12
    {
        id: 'spas12', name: 'SPAS-12',
        ammo: 8,   reserve: 32,  maxAmmo: 8,
        damage: 28, pellets: 7, fireRate: 0.75, recoil: 0.06, spread: 0.14,
        bulletSpeed: 120, auto: false, reloadTime: 2.0, adsFov: 60,
        shotVar: [0.80,  6000,  40, 1.3],  // SPAS-12 — 두껍되 적당한 높이
        viewPos: [0.50, -0.24, -0.32],
        viewRot: [0.09,  0.31, -0.04],
    },
    // idx 7: M249
    {
        id: 'm249', name: 'M249',
        ammo: 100, reserve: 200, maxAmmo: 100,
        damage: 28, fireRate: 0.088, recoil: 0.012, spread: 0.042,
        bulletSpeed: 220, auto: true,  reloadTime: 3.2, adsFov: 50,
        shotVar: [0.87,  6000,  35, 1.1],
        viewPos: [0.50, -0.22, -0.38],
        viewRot: [0.06,  0.28, -0.03],
    },
];

// WEAPON_DEFS에서 viewmodel 위치/회전 배열 파생
const weaponBasePos = WEAPON_DEFS.map(d => d.viewPos);
const weaponBaseRot = WEAPON_DEFS.map(d => d.viewRot);

// WEAPON_DEFS에서 총소리 변주 배열 파생
const USER_SHOT_VAR = WEAPON_DEFS.map(d => d.shotVar);

// WEAPON_DEFS에서 런타임 무기 상태 생성 (스탯은 WEAPON_DEFS에서, 상태값만 추가)
function makeWeapons() {
    return WEAPON_DEFS.map(d => {
        const w = {
            name: d.name,
            ammo: d.ammo, reserve: d.reserve, maxAmmo: d.maxAmmo,
            damage: d.damage, fireRate: d.fireRate, recoil: d.recoil, spread: d.spread,
            bulletSpeed: d.bulletSpeed, auto: d.auto, reloadTime: d.reloadTime,
            reloading: false, reloadProgress: 0, shootTimer: 0, dropped: false,
        };
        if (d.melee)    { w.melee = true; w.meleeRange = d.meleeRange; }
        if (d.adsFov)   { w.adsFov = d.adsFov; }
        if (d.pellets)  { w.pellets = d.pellets; }
        return w;
    });
}
