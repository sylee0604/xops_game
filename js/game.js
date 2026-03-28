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
    updatePlayer(dt);
    if (enemiesEnabled) updateEnemies(dt);
    updateBullets(dt);
    updateImpacts(dt);
    updatePickups();
    updateHUD();
    renderer.clear();
    renderer.render(scene, camera);
    renderer.clearDepth();
    renderer.render(weaponScene, weaponCamera);
}


function startGame(mapType) {
    currentMap = mapType || 'combat';
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('hud').style.display = 'block';

    initThree();
    createWeaponModels();
    setupInput();
    getAudioCtx(); // 게임 시작 시 즉시 디코딩 시작 (첫 발사 전에 완료되도록)

    if (currentMap === 'training') {
        buildTrainingMap();
        enemiesEnabled = false;
        player.currentWeapon = 1; // AK
        player.pos.set(0, PLAYER_HEIGHT, 2);
        player.yaw = Math.PI;
        showMessage('TRAINING RANGE — G 버리기 / F 적ON/OFF', 3000);
    } else if (currentMap === 'harbor') {
        buildHarborMap();
        spawnHarborEnemies();
        spawnHarborPickups();
        for (let i = 0; i < player.weapons.length; i++) {
            if (i !== 2) {
                player.weapons[i].ammo = 0;
                player.weapons[i].reserve = 0;
                player.weapons[i].dropped = true;
            }
        }
        player.carrySlots = [null, null];
        player.currentWeapon = 2; // knife
        player.pos.set(28, PLAYER_HEIGHT, 1.5);
        player.yaw = Math.PI;
        showMessage('MISSION 2 — HARBOR  ▶ 항구를 장악하라', 2500);
    } else if (currentMap === 'tunnel') {
        buildTunnelMap();
        spawnTunnelZombies();
        player.currentWeapon = 7; // M249
        // 터널 입구 — 첫 좀비(z=20)까지 17유닛, 음성감지 8유닛 밖
        player.pos.set(5, PLAYER_HEIGHT, 1.5);
        player.yaw = Math.PI;
        showMessage('MISSION 3 — TUNNEL  ▶ 좀비를 제거하라', 2500);
    } else {
        buildMap();
        buildLighting();
        spawnEnemies();
        spawnPickups();
        // compound: 칼만 지급, 나머지는 전부 빈 상태
        for (let i = 0; i < player.weapons.length; i++) {
            if (i !== 2) {
                player.weapons[i].ammo = 0;
                player.weapons[i].reserve = 0;
                player.weapons[i].dropped = true;
            }
        }
        player.carrySlots = [null, null];
        player.currentWeapon = 2; // knife
        player.pos.set(CELL * 1.5, PLAYER_HEIGHT, CELL * 1.5);
        player.yaw = Math.PI;
        showMessage('MISSION 1 — COMPOUND  ▶ 적을 모두 제거하라', 2500);
    }

    updateWeaponViewModel(); // currentWeapon 세팅 후 즉시 올바른 모델 표시
    gameStarted = true;
    renderer.domElement.requestPointerLock();
    clock.start();
    gameLoop();
}
