'use strict';

// =====================================================================
// SURVIVAL MAP — Endless Wave Mode
// 40×40 유닛 아레나, 웨이브마다 적 +2명 / 속도 +10%
// =====================================================================

const _SV_W = 40; // 아레나 폭 (X)
const _SV_D = 40; // 아레나 깊이 (Z)

let survivalWave    = 0;
let _svWaveActive   = false;
let _svNextWaveIn   = 3.5;  // 첫 웨이브까지 대기(초)

// enemies.js의 killEnemy에서 alive === 0 시 호출됨
function onSurvivalWaveClear() {
    _svWaveActive = false;
    _svNextWaveIn = 5.0;
    document.getElementById('wave-display').textContent =
        `WAVE ${survivalWave} CLEAR!`;
    showMessage(`\u2713 WAVE ${survivalWave} CLEAR`, 3000);
}

function updateSurvival(dt) {
    if (!_svWaveActive) {
        _svNextWaveIn -= dt;
        if (_svNextWaveIn > 0) {
            document.getElementById('wave-display').textContent =
                survivalWave === 0
                    ? `WAVE 1 START IN ${Math.ceil(_svNextWaveIn)}...`
                    : `NEXT WAVE IN ${Math.ceil(_svNextWaveIn)}...`;
        } else {
            _spawnSurvivalWave();
        }
    }
    // 킬 카운터를 서바이벌 전용으로 표시
    document.getElementById('kill-counter').textContent = `KILLS: ${kills}`;
}

function _spawnSurvivalWave() {
    survivalWave++;

    // 이전 웨이브에서 남은 시체 즉시 정리
    // instanceIdx를 -1로 먼저 무효화해야 killEnemy 3s 타이머의 free() 호출이
    // reset() 이후 새로 할당된 인스턴스를 잘못 해제하지 않음
    for (const e of enemies) e.instanceIdx = -1;
    EnemyRenderer.reset();
    enemies.length = 0;

    const count     = 3 + survivalWave * 2;  // w1=5, w2=7, w3=9, ...
    const speedMult = 1 + (survivalWave - 1) * 0.10;
    TOTAL_ENEMIES  += count; // 누적 스폰 수 (결과 화면 표시용)

    for (let i = 0; i < count; i++) {
        const { sx, sz } = _svSpawnPoint();
        // 아레나 중앙 쪽 임의 순찰 경로 (2개 waypoint)
        const w1 = new THREE.Vector3(7 + Math.random() * 26, 0,  7 + Math.random() * 26);
        const w2 = new THREE.Vector3(7 + Math.random() * 26, 0,  7 + Math.random() * 26);
        spawnEnemyAt(sx, sz, [w1, w2], false, 0);
        enemies[enemies.length - 1].speed *= speedMult;
    }

    _svWaveActive = true;
    document.getElementById('wave-display').textContent = `WAVE ${survivalWave}`;
    showMessage(`\u25c6 WAVE ${survivalWave} \u25c6`, 2000);
}

function _svSpawnPoint() {
    const side = Math.floor(Math.random() * 4);
    if (side === 0) return { sx: 2 + Math.random() * (_SV_W - 4), sz: 1.5 };              // 북
    if (side === 1) return { sx: 2 + Math.random() * (_SV_W - 4), sz: _SV_D - 1.5 };     // 남
    if (side === 2) return { sx: 1.5,           sz: 2 + Math.random() * (_SV_D - 4) };   // 서
    return               { sx: _SV_W - 1.5, sz: 2 + Math.random() * (_SV_D - 4) };      // 동
}

function buildSurvivalMap() {
    // 재시작 시 웨이브 상태 초기화
    survivalWave  = 0;
    _svWaveActive = false;
    _svNextWaveIn = 3.5;

    scene.background = new THREE.Color(0x0d1117);
    scene.fog = new THREE.FogExp2(0x0d1117, 0.007);

    // 조명 — 4개 산업용 포인트 라이트 + 약한 앰비언트
    scene.add(new THREE.AmbientLight(0x2a3a55, 1.2));
    for (const [lx, lz] of [[10, 10], [30, 10], [10, 30], [30, 30]]) {
        const pl = new THREE.PointLight(0xffa050, 1.4, 26);
        pl.position.set(lx, 9, lz);
        scene.add(pl);
    }
    muzzleLight = new THREE.PointLight(0xffcc44, 0, 6);
    scene.add(muzzleLight);

    const W = _SV_W, D = _SV_D;

    // 바닥
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x484848, map: makeFloorTex('floor', (W + 8) / 2, (D + 8) / 2) });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W + 8, D + 8), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(W / 2, 0, D / 2);
    floor.receiveShadow = true;
    scene.add(floor);
    addPlatform(-4, W + 4, -4, D + 4, 0);

    // 외벽 (가시 + 충돌)
    const outerMat = new THREE.MeshLambertMaterial({ color: 0x585858, map: makeTex('metal') });
    const wallH = 6;
    for (const [cx, cz, ww, wd] of [
        [W / 2, -0.6,  W + 3, 1.2],  // 북
        [W / 2, D + 0.6, W + 3, 1.2],  // 남
        [-0.6,  D / 2, 1.2,   D + 3],  // 서
        [W + 0.6, D / 2, 1.2, D + 3],  // 동
    ]) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(ww, wallH, wd), outerMat);
        m.position.set(cx, wallH / 2, cz);
        m.receiveShadow = true;
        scene.add(m);
        const box = new THREE.Box3(
            new THREE.Vector3(cx - ww / 2, 0, cz - wd / 2),
            new THREE.Vector3(cx + ww / 2, wallH, cz + wd / 2)
        );
        walls.push({ box });
        wallMeshList.push(m);
    }

    // 엄폐물 블록 배치
    const cvrMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
    function addCover(cx, cz, ww, wd) {
        const h = 1.3;
        const m = new THREE.Mesh(new THREE.BoxGeometry(ww, h, wd), cvrMat);
        m.position.set(cx, h / 2, cz);
        m.castShadow = true;
        m.receiveShadow = true;
        scene.add(m);
        const box = new THREE.Box3(
            new THREE.Vector3(cx - ww / 2, 0, cz - wd / 2),
            new THREE.Vector3(cx + ww / 2, h, cz + wd / 2)
        );
        walls.push({ box });
        wallMeshList.push(m);
    }

    // 4개 모서리 L자형 엄폐물
    // NW (9, 9)
    addCover(9.5,  9.0,  3.5, 0.8);
    addCover(8.2,  10.5, 0.8, 2.2);
    // NE (31, 9)
    addCover(30.5, 9.0,  3.5, 0.8);
    addCover(31.8, 10.5, 0.8, 2.2);
    // SW (9, 31)
    addCover(9.5,  31.0, 3.5, 0.8);
    addCover(8.2,  29.5, 0.8, 2.2);
    // SE (31, 31)
    addCover(30.5, 31.0, 3.5, 0.8);
    addCover(31.8, 29.5, 0.8, 2.2);

    // 중앙 십자형 엄폐물 (4방향 단독)
    addCover(20.0, 16.5, 1.2, 3.5);
    addCover(20.0, 23.5, 1.2, 3.5);
    addCover(16.5, 20.0, 3.5, 1.2);
    addCover(23.5, 20.0, 3.5, 1.2);
}
