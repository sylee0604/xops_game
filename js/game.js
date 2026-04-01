'use strict';

// =====================================================================
// GAME
// =====================================================================

function initThree() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x4a5060);
    scene.fog = new THREE.FogExp2(0x4a5060, 0.018);

    camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.05, 120);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap; // PCFSoft보다 빠름
    renderer.autoClear = false;
    document.body.insertBefore(renderer.domElement, document.getElementById('overlay'));

    clock = new THREE.Clock();

    window.addEventListener('resize', () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        if (weaponCamera) {
            weaponCamera.aspect = innerWidth / innerHeight;
            weaponCamera.updateProjectionMatrix();
        }
        renderer.setSize(innerWidth, innerHeight);
    });
}


function gameLoop() {
    requestAnimationFrame(gameLoop);
    if (!gameStarted || gamePaused) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    missionTime = (Date.now() - missionStartTime) / 1000;
    updatePlayer(dt);
    if (enemiesEnabled) updateEnemies(dt);
    MAP_REGISTRY[currentMap]?.update?.(dt);
    updateBullets(dt);
    updateImpacts(dt);
    updatePickups();
    updateBursts(dt);
    updateHUD();
    drawDamageIndicators(dt);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.clearDepth();
    // 스코프 오버레이가 실제로 열렸을 때만 weapon scene 렌더 생략
    // (FOV 수렴 전에는 총기 모델이 화면에 남아 있어야 자연스러움)
    if (!player.adsInScope) renderer.render(weaponScene, weaponCamera);
}


function _resetToKnife() {
    player.weapons.forEach((w, i) => { if (i !== 2) { w.ammo = 0; w.reserve = 0; w.dropped = true; } });
    player.carrySlots = [null, null];
    player.currentWeapon = 2;
}

// 미션 성공 화면 (표준 맵 공통)
function _showMissionComplete() {
    setTimeout(() => {
        showMessage('\u2605 MISSION COMPLETE \u2605', 6000);
        setTimeout(() => {
            const sc    = calcMissionScore();
            const grade = getGrade(sc.total);
            document.getElementById('overlay').innerHTML = _resultHTML(
                'MISSION COMPLETE', '#0f0', 'ALL TARGETS ELIMINATED', sc, grade, true
            );
            document.getElementById('overlay').style.display = 'flex';
            document.exitPointerLock();
            gamePaused = true;
        }, 3000);
    }, 1000);
}

// =====================================================================
// MAP REGISTRY — 맵 추가 시 이 객체에 항목 하나만 추가하면 됨
// setup()       : 맵 빌드 + 플레이어 초기 세팅
// update(dt)    : 매 프레임 호출 (없으면 생략)
// onAllDead()   : 'all_enemies_dead' 이벤트 수신 시 동작 (없으면 생략)
// kiaSubtitle() : 사망 화면 부제 (없으면 기본 'K.I.A.')
// msg / msgDur  : 시작 메시지
// =====================================================================
const MAP_REGISTRY = {
    combat: {
        setup() {
            buildMap(); buildLighting(); spawnEnemies(); spawnPickups();
            _resetToKnife();
            player.pos.set(CELL * 1.5, PLAYER_HEIGHT, CELL * 1.5);
            player.yaw = Math.PI;
        },
        msg: 'MISSION 1 — COMPOUND  ▶ 적을 모두 제거하라', msgDur: 2500,
        onAllDead: _showMissionComplete,
    },
    harbor: {
        setup() {
            buildHarborMap(); spawnHarborEnemies(); spawnHarborPickups();
            _resetToKnife();
            player.pos.set(28, PLAYER_HEIGHT, 1.5);
            player.yaw = Math.PI;
        },
        msg: 'MISSION 2 — HARBOR  ▶ 항구를 장악하라', msgDur: 2500,
        onAllDead: _showMissionComplete,
    },
    tunnel: {
        setup() {
            buildTunnelMap(); spawnTunnelZombies();
            player.currentWeapon = 7; // M249
            player.pos.set(5, PLAYER_HEIGHT, 1.5);
            player.yaw = Math.PI;
        },
        msg: 'MISSION 3 — TUNNEL  ▶ 좀비를 제거하라', msgDur: 2500,
        onAllDead: _showMissionComplete,
    },
    assault: {
        setup() {
            buildAssaultMap(); spawnAssaultEnemies(); spawnAssaultAllies(); spawnAssaultPickups();
            _resetToKnife();
            player.pos.set(19.5, PLAYER_HEIGHT, 2);
            player.yaw = Math.PI;
        },
        msg: 'MISSION 4 — ASSAULT  ▶ 아군과 함께 적을 섬멸하라', msgDur: 2500,
        update: (dt) => updateAllies(dt),
        onAllDead: _showMissionComplete,
    },
    survival: {
        setup() {
            buildSurvivalMap();
            TOTAL_ENEMIES = 0;
            player.currentWeapon = 1; // AK-47
            player.pos.set(20, PLAYER_HEIGHT, 20);
            player.yaw = Math.PI;
            document.getElementById('wave-display').style.display = 'block';
            document.getElementById('kill-counter').textContent = 'KILLS: 0';
        },
        msg: 'SURVIVAL — 웨이브 시작까지 대기...', msgDur: 3000,
        update: (dt) => updateSurvival(dt),
        onAllDead: onSurvivalWaveClear,
        kiaSubtitle: () => `K.I.A. — REACHED WAVE ${survivalWave}`,
    },
    rescue: {
        setup() {
            buildRescueMap(); spawnRescueEnemies();
            _resetToKnife();
            player.pos.set(15, PLAYER_HEIGHT, 2);
            player.yaw = Math.PI;
        },
        msg: 'MISSION 5 — RESCUE  ▶ 발각 시 인질 처형. 조용히 제압하라', msgDur: 3000,
        update: (dt) => updateRescue(dt),
        onAllDead: onRescueAllDead,
        kiaSubtitle: () => 'K.I.A. — RESCUE FAILED',
    },
    defuse: {
        setup() {
            buildDefuseMap(); spawnDefuseEnemies();
            _resetToKnife();
            player.pos.set(20, PLAYER_HEIGHT, 2);
            player.yaw = Math.PI;
        },
        msg: 'MISSION 6 — DEFUSE  ▶ 3개의 폭탄을 90초 안에 해제하라', msgDur: 3000,
        update: (dt) => updateDefuse(dt),
        // 적 전멸만으로는 승리 아님 — 폭탄 해제가 승리 조건
        onAllDead: null,
        kiaSubtitle: () => 'K.I.A. — DEFUSE FAILED',
    },
    training: {
        setup() {
            buildTrainingMap();
            enemiesEnabled = false;
            player.currentWeapon = 1; // AK
            player.pos.set(0, PLAYER_HEIGHT, 2);
            player.yaw = Math.PI;
        },
        msg: 'TRAINING RANGE — G 버리기 / F 적ON/OFF', msgDur: 3000,
    },
};

function startGame(mapType) {
    currentMap = mapType || 'combat';
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('hud').style.display = 'block';

    initThree();
    createWeaponModels();
    setupInput();
    getAudioCtx(); // 게임 시작 시 즉시 디코딩 시작 (첫 발사 전에 완료되도록)

    const mapDef = MAP_REGISTRY[currentMap] ?? MAP_REGISTRY.combat;
    mapDef.setup();

    // 'all_enemies_dead' 리스너를 맵 정의에서 등록
    GameEvents.off('all_enemies_dead');
    if (mapDef.onAllDead) GameEvents.on('all_enemies_dead', mapDef.onAllDead);

    showMessage(mapDef.msg, mapDef.msgDur);

    // 점수 초기화
    kills            = 0;
    missionStartTime = Date.now();
    missionTime      = 0;
    damageTaken      = 0;
    document.getElementById('score-display').textContent = 'SCORE: 0';

    updateWeaponViewModel(); // currentWeapon 세팅 후 즉시 올바른 모델 표시
    gameStarted = true;
    renderer.domElement.requestPointerLock();
    clock.start();
    gameLoop();
}
