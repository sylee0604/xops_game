'use strict';

// =====================================================================
// MAP — ESCORT  (Mission 7)
// VIP NPC를 출구까지 호위하라
// VIP는 자동으로 이동, HP 보유 (100)
// 적이 VIP를 우선 공격, VIP 사망 시 미션 실패
// VIP가 출구(z≥47) 도달 시 미션 성공
// =====================================================================

let _escortVip      = null;   // allies[0] 포인터
let _escortFailed   = false;
let _escortWon      = false;
const _EXIT_Z       = 47;     // VIP가 이 z에 도달하면 성공
const _VIP_PAUSE_ENEMY_DIST = 9;   // 이 거리 내 생존 적이 있으면 VIP 정지
const _VIP_PAUSE_PLAYER_DIST = 26; // 플레이어가 이것보다 멀면 VIP 정지(기다림)

// VIP 체력바 DOM (wave-display 재활용)
function _vipHUD() {
    const el = document.getElementById('wave-display');
    if (!_escortVip || _escortVip.state === STATE.DEAD) {
        el.textContent = 'VIP: K.I.A.';
        el.style.color = '#f44';
    } else if (_escortWon) {
        el.textContent = 'VIP: SECURED';
        el.style.color = '#4f4';
    } else {
        const pct = Math.max(0, Math.round(_escortVip.health));
        el.textContent = `VIP HP: ${pct}`;
        el.style.color = pct > 50 ? '#4fc' : pct > 25 ? '#fa0' : '#f44';
    }
    document.getElementById('kill-counter').textContent =
        `KILLS: ${kills} / ${TOTAL_ENEMIES}`;
}

// ─────────────────────────────────────────────────────────────────────
// buildEscortMap
// 도심 검문소: 20×50 유닛 직선 루트, 양측 건물군
// ─────────────────────────────────────────────────────────────────────
function buildEscortMap() {
    _escortVip    = null;
    _escortFailed = false;
    _escortWon    = false;

    scene.background = new THREE.Color(0x6a7080);
    scene.fog = new THREE.FogExp2(0x8090a8, 0.010);

    scene.add(new THREE.AmbientLight(0xd0dff0, 1.0));
    const sun = new THREE.DirectionalLight(0xfff4d0, 1.8);
    sun.position.set(10, 30, 20);
    sun.castShadow = true;
    scene.add(sun);
    muzzleLight = new THREE.PointLight(0xffcc44, 0, 6);
    scene.add(muzzleLight);

    const W = 20, D = 52;

    // 아스팔트 바닥
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3c, map: makeFloorTex('floor', W/2, D/2) });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(W, D), roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(W/2, 0, D/2);
    road.receiveShadow = true;
    scene.add(road);
    addPlatform(0, W, 0, D, 0);

    // 인도 (양쪽)
    const paveMat = new THREE.MeshLambertMaterial({ color: 0x888898, map: makeTex('concrete') });
    for (const [cx, cz, ww, wd] of [
        [-2.5, D/2, 5, D], [W+2.5, D/2, 5, D]
    ]) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(ww, wd), paveMat);
        m.rotation.x = -Math.PI / 2;
        m.position.set(cx, 0.01, cz);
        scene.add(m);
    }

    const wallMat  = new THREE.MeshLambertMaterial({ color: 0x707078, map: makeTex('concrete') });
    const WH = WALL_H;

    function addWall(cx, cz, ww, wd) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(ww, WH, wd), wallMat);
        m.position.set(cx, WH/2, cz);
        m.castShadow = true; m.receiveShadow = true;
        scene.add(m);
        walls.push({ box: new THREE.Box3().setFromObject(m) });
        wallMeshList.push(m);
    }

    // ── 외벽 ──
    // 서쪽 (x=-1): 전 구간 벽
    addWall(-0.5, D/2, 1, D+2);
    // 동쪽 (x=21): 전 구간 벽
    addWall(W+0.5, D/2, 1, D+2);
    // 북쪽 (z=52): 출구 문 (x=7~13 열림)
    addWall(3.5,  D+0.5, 7, 1);   // x=0~7
    addWall(16.5, D+0.5, 7, 1);   // x=13~20

    // ── 서쪽 건물 (x=-5~0) — 외벽이므로 시각 장식용 ──
    // ── 동쪽 건물 (x=20~25) ──
    const bldMat = new THREE.MeshLambertMaterial({ color: 0x808070 });
    function addBuilding(cx, cz, ww, wd, h) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(ww, h, wd), bldMat);
        m.position.set(cx, h/2, cz);
        m.castShadow = true; scene.add(m);
        walls.push({ box: new THREE.Box3().setFromObject(m) });
        wallMeshList.push(m);
    }

    // 1구역: 남쪽 입구 양측 건물 (z=4~14)
    addBuilding(-3.5, 9, 5, 10, 5);   // 서쪽
    addBuilding(23.5, 9, 5, 10, 5);   // 동쪽

    // 2구역: 첫 번째 매복 지점 (z=16~26)
    addBuilding(-3.5, 21, 5, 10, 5);
    addBuilding(23.5, 21, 5, 10, 5);

    // 3구역: 두 번째 매복 (z=28~38)
    addBuilding(-3.5, 33, 5, 10, 5);
    addBuilding(23.5, 33, 5, 10, 5);

    // 4구역: 출구 근처 (z=40~48)
    addBuilding(-3.5, 44, 5, 8, 5);
    addBuilding(23.5, 44, 5, 8, 5);

    // ── 도로 내 엄폐물 ──
    const cvrMat = new THREE.MeshLambertMaterial({ color: 0x505055, map: makeTex('metal') });
    function addCover(cx, cz, ww, wd) {
        const h = 1.2;
        const m = new THREE.Mesh(new THREE.BoxGeometry(ww, h, wd), cvrMat);
        m.position.set(cx, h/2, cz);
        m.castShadow = true; m.receiveShadow = true;
        scene.add(m);
        walls.push({ box: new THREE.Box3().setFromObject(m) });
        wallMeshList.push(m);
    }

    // 1구역 엄폐물 (z≈16)
    addCover(5, 16, 3, 0.8);
    addCover(15, 16, 3, 0.8);

    // 2구역 (z≈26)
    addCover(4, 26, 2, 0.8);
    addCover(10, 27, 2, 0.8);
    addCover(16, 26, 2, 0.8);

    // 3구역 (z≈36)
    addCover(5, 36, 3, 0.8);
    addCover(15, 36, 3, 0.8);

    // ── 출구 마커 — 파란 빛 기둥 2개 ──
    const exitMat = new THREE.MeshBasicMaterial({ color: 0x00aaff });
    for (const ex of [7, 13]) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 0.3), exitMat);
        pillar.position.set(ex, 1.5, _EXIT_Z + 1);
        scene.add(pillar);
        const pl = new THREE.PointLight(0x0088ff, 1.5, 8);
        pl.position.set(ex, 2, _EXIT_Z + 1);
        scene.add(pl);
    }
}

// ─────────────────────────────────────────────────────────────────────
// spawnEscortEnemies — 10명, 3구역 매복
// ─────────────────────────────────────────────────────────────────────
function spawnEscortEnemies() {
    TOTAL_ENEMIES = 10;
    document.getElementById('kill-counter').textContent = `KILLS: 0 / ${TOTAL_ENEMIES}`;

    // 1구역 매복 (z≈18~22)
    spawnEnemyAt( 2, 20, [{ x: 2,  z: 16 }, { x: 5,  z: 24 }], false);
    spawnEnemyAt(18, 20, [{ x: 18, z: 16 }, { x: 15, z: 24 }], false);
    spawnEnemyAt(10, 18, [{ x: 6,  z: 18 }, { x: 14, z: 22 }], false);

    // 2구역 측면 (z≈28~34)
    spawnEnemyAt( 2, 30, [{ x: 2,  z: 26 }, { x: 4,  z: 34 }], false);
    spawnEnemyAt(18, 32, [{ x: 18, z: 28 }, { x: 16, z: 36 }], false);
    spawnEnemyAt( 8, 34, [{ x: 5,  z: 30 }, { x: 12, z: 38 }], false);
    spawnEnemyAt(12, 28, [{ x: 15, z: 32 }, { x: 9,  z: 26 }], false);

    // 3구역 출구 근처 (z≈40~46)
    spawnEnemyAt( 3, 42, [{ x: 2,  z: 38 }, { x: 4,  z: 46 }], false);
    spawnEnemyAt(17, 42, [{ x: 18, z: 38 }, { x: 16, z: 46 }], false);
    spawnEnemyAt(10, 44, [{ x: 7,  z: 42 }, { x: 13, z: 46 }], false);
}

// ─────────────────────────────────────────────────────────────────────
// spawnEscortVip — VIP를 allies 에 추가 (ALLY 렌더러 사용)
// ─────────────────────────────────────────────────────────────────────
function spawnEscortVip() {
    const iIdx = EnemyRenderer.allocate(ITYPE.ALLY);

    // VIP 경로: 도로 중앙선을 따라 출구까지
    const waypoints = [
        new THREE.Vector3(10, 0, 12),
        new THREE.Vector3(10, 0, 22),
        new THREE.Vector3(10, 0, 32),
        new THREE.Vector3(10, 0, 42),
        new THREE.Vector3(10, 0, _EXIT_Z),
    ];

    const vip = {
        instanceIdx: iIdx, instanceType: ITYPE.ALLY,
        pos:         new THREE.Vector3(10, 0, 5),
        health:      100,
        state:       STATE.PATROL,
        waypoints,
        wpIndex:     0,
        lastKnownEnemy: null,
        facing:      Math.PI,   // 북쪽(z+)
        speed:       1.8,
        sightRange:  0,         // VIP는 직접 공격 안 함
        damage:      0,
        walkPhase:   0,
        peekPhase:   0,
        peekTimer:   0,
        reactDelay:  0,
        isVip:       true,
    };

    allies.push(vip);
    _escortVip = vip;
}

// ─────────────────────────────────────────────────────────────────────
// updateEscort — 매 프레임 호출
// ─────────────────────────────────────────────────────────────────────
function updateEscort(dt) {
    if (_escortFailed || _escortWon) return;
    if (!_escortVip) return;

    // VIP 사망 체크
    if (_escortVip.state === STATE.DEAD) {
        _escortFailed = true;
        _vipHUD();
        showMessage('\u2716 MISSION FAILED — VIP K.I.A.', 4000);
        setTimeout(() => {
            const sc = calcMissionScore();
            document.getElementById('overlay').innerHTML = _resultHTML(
                'MISSION FAILED', '#f44', 'VIP HAS BEEN ELIMINATED',
                sc, getGrade(0), false
            );
            document.getElementById('overlay').style.display = 'flex';
            document.exitPointerLock();
            gamePaused = true;
        }, 3500);
        return;
    }

    // VIP가 출구에 도달했는지 체크
    if (_escortVip.pos.z >= _EXIT_Z - 1) {
        _escortWon = true;
        _vipHUD();
        showMessage('\u2605 VIP SECURED — MISSION COMPLETE \u2605', 4000);
        setTimeout(() => {
            const sc    = calcMissionScore();
            const grade = getGrade(sc.total);
            document.getElementById('overlay').innerHTML = _resultHTML(
                'MISSION COMPLETE', '#0f0', 'VIP SAFELY ESCORTED TO EXTRACTION',
                sc, grade, true
            );
            document.getElementById('overlay').style.display = 'flex';
            document.exitPointerLock();
            gamePaused = true;
        }, 3000);
        return;
    }

    // VIP 이동 로직
    // 1) 인근 생존 적 체크
    let closestEnemyDist = Infinity;
    for (const e of enemies) {
        if (e.state === STATE.DEAD) continue;
        const d = _escortVip.pos.distanceTo(e.pos);
        if (d < closestEnemyDist) closestEnemyDist = d;
    }

    // 2) 플레이어와의 거리 체크
    const playerDist = _escortVip.pos.distanceTo(player.pos);

    const shouldPause = closestEnemyDist < _VIP_PAUSE_ENEMY_DIST
                     || playerDist > _VIP_PAUSE_PLAYER_DIST;

    if (!shouldPause) {
        const wp = _escortVip.waypoints[_escortVip.wpIndex];
        if (_escortVip.pos.distanceTo(wp) < 0.8) {
            if (_escortVip.wpIndex < _escortVip.waypoints.length - 1) {
                _escortVip.wpIndex++;
            }
        }
        const dx = wp.x - _escortVip.pos.x;
        const dz = wp.z - _escortVip.pos.z;
        const len = Math.sqrt(dx*dx + dz*dz);
        if (len > 0.1) {
            const nx = dx/len, nz = dz/len;
            const tf = Math.atan2(-nx, -nz);
            let diff = tf - _escortVip.facing;
            while (diff >  Math.PI) diff -= Math.PI*2;
            while (diff < -Math.PI) diff += Math.PI*2;
            _escortVip.facing += diff * Math.min(1, dt * 4);
            _escortVip.pos.x  += nx * _escortVip.speed * dt;
            _escortVip.pos.z  += nz * _escortVip.speed * dt;
        }
        _escortVip.walkPhase += dt * 4;
        _escortVip.state = STATE.PATROL;
        resolveWallCollision(_escortVip.pos, 0.35);
    } else {
        // 정지 상태 — facing을 가장 가까운 적 쪽으로 (경계)
        if (closestEnemyDist < _VIP_PAUSE_ENEMY_DIST) {
            // 가장 가까운 적 방향
            for (const e of enemies) {
                if (e.state === STATE.DEAD) continue;
                const dx = e.pos.x - _escortVip.pos.x;
                const dz = e.pos.z - _escortVip.pos.z;
                const d  = Math.sqrt(dx*dx + dz*dz);
                if (Math.abs(d - closestEnemyDist) < 0.1) {
                    const tf = Math.atan2(-dx/d, -dz/d);
                    let diff = tf - _escortVip.facing;
                    while (diff >  Math.PI) diff -= Math.PI*2;
                    while (diff < -Math.PI) diff += Math.PI*2;
                    _escortVip.facing += diff * Math.min(1, dt * 3);
                    break;
                }
            }
        }
    }

    _vipHUD();
}
