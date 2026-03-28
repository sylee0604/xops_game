'use strict';

// =====================================================================
// THREE.JS RUNTIME VARS
// =====================================================================
let scene, camera, renderer, clock;

// =====================================================================
// GAME FLAGS
// =====================================================================
let gameStarted = false, gamePaused = false, gameOver = false;
let kills = 0;
let TOTAL_ENEMIES = ENEMY_DATA.length;
let currentMap = 'combat';
let enemiesEnabled = true;

const keys = {};
let pointerLocked = false;

// =====================================================================
// PLAYER
// =====================================================================
const player = {
    pos: new THREE.Vector3(CELL * 1.5, PLAYER_HEIGHT, CELL * 1.5),
    vel: new THREE.Vector3(),
    yaw: 0, pitch: 0,
    health: 100, maxHealth: 100,
    onGround: false,
    currentWeapon: 1,
    weapons: makeWeapons(),
    carrySlots: [null, null],  // combat 맵 전용: 슬롯1·슬롯2 보유 무기 인덱스
    recoilPitch: 0,
    adsLocked: false,
    currentSpread: 0,
    footstepTimer: 0,
};

// =====================================================================
// GAME ARRAYS
// =====================================================================
const walls = [];      // {box: THREE.Box3}
const wallMeshList = [];
const bullets = [];
const enemies = [];
const impacts = [];
const pickups = [];    // {mesh, pos, weaponIndex, ammo}

// ── 플랫폼 시스템 (올라갈 수 있는 표면) ──
const platforms = []; // { minX, maxX, minZ, maxZ, y } — 표면 Y좌표
const STEP_HEIGHT = 0.65; // 자동 스텝업 최대 높이 (계단 1단 = 0.25~0.35)

function addPlatform(minX, maxX, minZ, maxZ, surfaceY) {
    platforms.push({ minX, maxX, minZ, maxZ, y: surfaceY });
}

// 현재 발 위치에서 가장 높은 밟을 수 있는 표면 Y를 반환
function getFloorY(x, z, feetY) {
    // 항구맵 바다 구역(x < 2.0): 발판 없음 → 무한 낙하
    if (currentMap === 'harbor' && x < 2.0) return -9999;
    let best = 0;
    for (const p of platforms) {
        if (x > p.minX && x < p.maxX && z > p.minZ && z < p.maxZ) {
            // 발 위치보다 높지 않고, 스텝업 범위 안에 있는 표면만
            if (p.y > best && p.y <= feetY + STEP_HEIGHT) best = p.y;
        }
    }
    return best;
}

// =====================================================================
// TRANSIENT RENDER STATE
// =====================================================================
let muzzleLight = null;
let muzzleLightTimer = 0;
let knifeSwingTimer = 0;
let knifeSwingDir = 1;

let weaponScene, weaponCamera;
const weaponModels = [];

// =====================================================================
// TEMP VECTORS (reusable — avoid per-frame allocation)
// =====================================================================
const _tv1 = new THREE.Vector3();
const _tv2 = new THREE.Vector3();
const _tv3 = new THREE.Vector3();

// =====================================================================
// MOVEMENT STATE
// =====================================================================
let walkPhase = 0;
let bhopFlag = false;    // 공중에서 Shift 눌렀는지
let bhopWindow = 0;      // 착지 후 점프 유효 시간 (초)
