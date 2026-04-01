'use strict';

// =====================================================================
// MAP — RESCUE  (Mission 5)
// 건물 내부 3개 방에 각 1명씩 인질 감금
// 각 방의 경비병이 플레이어를 발견하면 2.5초 후 인질 처형 → 임무 실패
// =====================================================================

// 인질 오브젝트 배열 { mesh, alive, enemy(경비), alertTimer }
let _rescueHostages  = [];
let _rescueFailed    = false;   // 처형 발생 후 중복 처리 방지

const _EXEC_DELAY    = 2.5;     // 발각 후 처형까지 유예 (초)

// ── 공유 지오메트리 (인질 전용) ──
const _GEO_HBODY = new THREE.BoxGeometry(0.26, 0.50, 0.18);
const _GEO_HHEAD = new THREE.BoxGeometry(0.17, 0.17, 0.17);
const _GEO_HLEGS = new THREE.BoxGeometry(0.22, 0.36, 0.15);
const _MAT_HOSTI = new THREE.MeshPhongMaterial({ color: 0xf0c050 }); // 노란색 — 인질

function _makeHostageMesh(x, z) {
    const group = new THREE.Group();
    const legs  = new THREE.Mesh(_GEO_HLEGS, _MAT_HOSTI.clone()); legs.position.y = 0.18;
    const body  = new THREE.Mesh(_GEO_HBODY, _MAT_HOSTI.clone()); body.position.y = 0.61;
    const head  = new THREE.Mesh(_GEO_HHEAD, _MAT_HOSTI.clone()); head.position.y = 0.97;
    group.add(legs, body, head);
    group.position.set(x, 0, z);
    scene.add(group);
    return group;
}

// ─────────────────────────────────────────────
// buildRescueMap
// 건물: x=[0,30], z=[5,40]  /  플레이어 시작: x=15, z=2
// ─────────────────────────────────────────────
function buildRescueMap() {
    scene.background = new THREE.Color(0x1e1e28);
    scene.fog = new THREE.FogExp2(0x1e1e28, 0.024);

    muzzleLight = new THREE.PointLight(0xffcc44, 0, 6);
    scene.add(muzzleLight);

    // 조명
    scene.add(new THREE.AmbientLight(0x30304a, 0.9));
    const _pl = (x, z, intensity, dist) => {
        const l = new THREE.PointLight(0xaaaacc, intensity, dist);
        l.position.set(x, 3.5, z);
        scene.add(l);
    };
    _pl(15, 11, 1.0, 20);   // 복도 중앙
    _pl(5,  31, 0.9, 14);   // 좌측 방
    _pl(15, 31, 0.9, 14);   // 중앙 방
    _pl(25, 31, 0.9, 14);   // 우측 방

    const WH = WALL_H, WY = WALL_H / 2;
    const wallMat  = new THREE.MeshPhongMaterial({ color: 0x484858 });
    const floorMat = new THREE.MeshPhongMaterial({ color: 0x383842 });

    // 바닥
    const floor = new THREE.Mesh(new THREE.BoxGeometry(30, 0.2, 35), floorMat);
    floor.position.set(15, -0.1, 22.5);
    scene.add(floor);

    function addWall(cx, cz, w, d) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, WH, d), wallMat);
        m.position.set(cx, WY, cz);
        m.castShadow = true; m.receiveShadow = true;
        scene.add(m);
        walls.push({ box: new THREE.Box3().setFromObject(m) });
        wallMeshList.push(m);
    }

    // ── 외벽 ──
    // 남쪽: 문(x=13~17) 남겨두고 양쪽
    addWall(6.5,  5,  13, 0.3);   // 서쪽 벽 (x=0~13)
    addWall(23.5, 5,  13, 0.3);   // 동쪽 벽 (x=17~30)
    addWall(15,   40, 30, 0.3);   // 북벽
    addWall(0,    22.5, 0.3, 35); // 서벽
    addWall(30,   22.5, 0.3, 35); // 동벽

    // ── 방 구분 벽 (z=22, 세 개 출입구: x=3~7, x=13~17, x=23~27) ──
    addWall(1.5,  22,  3,  0.3);  // x=0~3
    addWall(10,   22,  6,  0.3);  // x=7~13
    addWall(20,   22,  6,  0.3);  // x=17~23
    addWall(28.5, 22,  3,  0.3);  // x=27~30

    // ── 방 칸막이 (북쪽 구간 x=10, x=20 / z=22~40) ──
    addWall(10, 31, 0.3, 18);
    addWall(20, 31, 0.3, 18);

    // ── 복도 내 엄폐물 2개 ──
    addWall(7,  13.5, 1.2, 0.8);
    addWall(23, 13.5, 1.2, 0.8);
}

// ─────────────────────────────────────────────
// spawnRescueEnemies
// ─────────────────────────────────────────────
function spawnRescueEnemies() {
    _rescueHostages = [];
    _rescueFailed   = false;

    TOTAL_ENEMIES = 5;
    document.getElementById('kill-counter').textContent = `KILLS: 0 / 5  │  HOSTAGES: 3 / 3`;

    // 복도 순찰병 2명 (인질 없음)
    spawnEnemyAt(7,  13, [{ x: 5,  z: 8  }, { x: 8,  z: 19 }], false);
    spawnEnemyAt(23, 13, [{ x: 25, z: 8  }, { x: 22, z: 19 }], false);

    // 방 경비병 3명 — 각 인질과 연결
    const guards = [
        _spawnGuard(5,  30, [{ x: 3,  z: 25 }, { x: 7,  z: 37 }]),
        _spawnGuard(15, 30, [{ x: 12, z: 25 }, { x: 18, z: 37 }]),
        _spawnGuard(25, 30, [{ x: 23, z: 25 }, { x: 27, z: 37 }]),
    ];

    // 인질 생성 (각 방 안쪽에 배치)
    const hostagePositions = [[5, 37], [15, 37], [25, 37]];
    for (let i = 0; i < 3; i++) {
        _rescueHostages.push({
            mesh:       _makeHostageMesh(hostagePositions[i][0], hostagePositions[i][1]),
            alive:      true,
            enemy:      guards[i],
            alertTimer: 0,
        });
    }
}

function _spawnGuard(x, z, wps) {
    spawnEnemyAt(x, z, wps, false);
    return enemies[enemies.length - 1];
}

// ─────────────────────────────────────────────
// updateRescue  — MAP_REGISTRY.update(dt)
// ─────────────────────────────────────────────
function updateRescue(dt) {
    if (_rescueFailed) return;

    let aliveCount = 0;
    for (const h of _rescueHostages) {
        if (!h.alive) continue;
        aliveCount++;

        // 경비가 이미 처치됐으면 인질은 안전
        if (!h.enemy || h.enemy.state === STATE.DEAD) {
            h.alertTimer = 0;
            continue;
        }

        if (h.enemy.state === STATE.ATTACK) {
            h.alertTimer += dt;
            if (h.alertTimer >= _EXEC_DELAY) {
                _executeHostage(h);
                return; // 실패 처리 → 이후 업데이트 중단
            }
        } else {
            // 경계 해제 시 타이머 서서히 감소
            h.alertTimer = Math.max(0, h.alertTimer - dt * 0.8);
        }
    }

    _updateHostageHUD(aliveCount);
}

function _updateHostageHUD(aliveCount) {
    const k = document.getElementById('kill-counter');
    if (k) k.textContent = `KILLS: ${kills} / 5  │  HOSTAGES: ${aliveCount} / 3`;
}

function _executeHostage(h) {
    _rescueFailed = true;
    h.alive = false;

    // 인질 쓰러뜨리기
    h.mesh.rotation.z = Math.PI / 2;
    h.mesh.position.y = -0.25;
    h.mesh.children.forEach(c => { if (c.material) c.material.color.set(0x3a0000); });

    showMessage('HOSTAGE EXECUTED — MISSION FAILED', 4000);

    setTimeout(() => {
        const sc    = calcMissionScore();
        const grade = getGrade(0);
        document.getElementById('overlay').innerHTML = _resultHTML(
            'MISSION FAILED', '#f44', 'HOSTAGE EXECUTED', sc, grade, true
        );
        document.getElementById('overlay').style.display = 'flex';
        document.exitPointerLock();
        gamePaused = true;
    }, 4000);
}

// ─────────────────────────────────────────────
// onRescueAllDead  — 'all_enemies_dead' 이벤트
// ─────────────────────────────────────────────
function onRescueAllDead() {
    if (_rescueFailed) return;

    const saved = _rescueHostages.filter(h => h.alive).length;

    setTimeout(() => {
        showMessage(`★ RESCUE COMPLETE — ${saved}/3 HOSTAGES SAVED ★`, 6000);
        setTimeout(() => {
            const sc    = calcMissionScore();
            const grade = getGrade(sc.total);
            document.getElementById('overlay').innerHTML = _resultHTML(
                'MISSION COMPLETE', '#0f0',
                `${saved}/3 HOSTAGES RESCUED`,
                sc, grade, true
            );
            document.getElementById('overlay').style.display = 'flex';
            document.exitPointerLock();
            gamePaused = true;
        }, 3000);
    }, 1000);
}
