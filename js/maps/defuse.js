'use strict';

// =====================================================================
// MAP — DEFUSE  (Mission 6)
// 3개 폭탄 해제 미션
// 각 폭탄 90초 카운트다운 / 플레이어가 1.8m 이내에서 3초 유지 → 해제
// 하나라도 폭발하면 MISSION FAILED
// 적 전멸만으로는 미션 완료 아님 — 폭탄을 모두 해제해야 승리
// =====================================================================

let _bombs        = [];    // { group, light, ledMat, pos, timer, defuseProgress, defused }
let _defuseFailed = false;
let _defuseWin    = false;

const _BOMB_TIMER   = 90.0;  // 초
const _DEFUSE_TIME  = 3.0;   // 해제에 필요한 연속 유지 시간 (초)
const _DEFUSE_RANGE = 1.8;   // 해제 가능 반경 (m)

// 공유 지오메트리 (폭탄 전용)
const _GEO_DB_BODY  = new THREE.BoxGeometry(0.30, 0.18, 0.45);
const _GEO_DB_BASE  = new THREE.BoxGeometry(0.34, 0.06, 0.50);
const _GEO_DB_PANEL = new THREE.BoxGeometry(0.12, 0.10, 0.03);
const _GEO_DB_LED   = new THREE.BoxGeometry(0.05, 0.05, 0.05);
const _GEO_DB_WIRE  = new THREE.BoxGeometry(0.02, 0.02, 0.14);

function _makeDefuseBomb(x, z) {
    const group = new THREE.Group();

    const bodyMat  = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, shininess: 50 });
    const baseMat  = new THREE.MeshPhongMaterial({ color: 0x2c2c2c });
    const panelMat = new THREE.MeshBasicMaterial({ color: 0x00bb00 }); // 초록 디스플레이
    const ledMat   = new THREE.MeshBasicMaterial({ color: 0xff2200 }); // 빨간 LED (점멸)
    const wireMat  = new THREE.MeshPhongMaterial({ color: 0xff4400 }); // 빨간 전선

    const body  = new THREE.Mesh(_GEO_DB_BODY,  bodyMat);  body.position.y = 0.12;
    const base  = new THREE.Mesh(_GEO_DB_BASE,  baseMat);  base.position.y = 0.03;
    const panel = new THREE.Mesh(_GEO_DB_PANEL, panelMat); panel.position.set(0, 0.21, -0.22);
    const led   = new THREE.Mesh(_GEO_DB_LED,   ledMat);   led.position.set(0.10, 0.21, -0.22);
    const wire1 = new THREE.Mesh(_GEO_DB_WIRE,  wireMat);  wire1.position.set(-0.08, 0.21, -0.22); wire1.rotation.x = 0.5;
    const wire2 = new THREE.Mesh(_GEO_DB_WIRE,  wireMat);  wire2.position.set( 0.05, 0.21,  0.22); wire2.rotation.x = -0.5;

    group.add(body, base, panel, led, wire1, wire2);
    group.position.set(x, 0, z);
    scene.add(group);

    const light = new THREE.PointLight(0xff2200, 1.2, 4.5);
    light.position.set(x, 0.8, z);
    scene.add(light);

    return {
        group,
        light,
        ledMat,
        pos: new THREE.Vector3(x, 0, z),
        timer: _BOMB_TIMER,
        defuseProgress: 0,
        defused: false,
    };
}

// ─────────────────────────────────────────────
// buildDefuseMap
// 맵: x=[0,40], z=[0,50]  /  플레이어 시작: x=20, z=2
// ─────────────────────────────────────────────
function buildDefuseMap() {
    // 재시작 시 이전 폭탄 오브젝트 씬에서 제거
    for (const b of _bombs) {
        scene.remove(b.group);
        scene.remove(b.light);
    }
    _bombs        = [];
    _defuseFailed = false;
    _defuseWin    = false;

    scene.background = new THREE.Color(0x252030);
    scene.fog = new THREE.FogExp2(0x252030, 0.018);

    muzzleLight = new THREE.PointLight(0xffcc44, 0, 6);
    scene.add(muzzleLight);

    // 조명
    scene.add(new THREE.AmbientLight(0x252035, 0.80));
    const _pl = (x, y, z, col, intensity, dist) => {
        const l = new THREE.PointLight(col, intensity, dist);
        l.position.set(x, y, z);
        scene.add(l);
    };
    _pl(20, 3.5,  9,  0x8888aa, 1.1, 28);   // 메인 홀
    _pl( 7, 3.0, 38,  0xcc7744, 0.9, 16);   // 좌측 방 (Bomb A)
    _pl(20, 3.0, 38,  0xcc7744, 0.9, 16);   // 중앙 방 (Bomb B)
    _pl(33, 3.0, 38,  0xcc7744, 0.9, 16);   // 우측 방 (Bomb C)

    const WH      = WALL_H;
    const WY      = WALL_H / 2;
    const wallMat  = new THREE.MeshLambertMaterial({ color: 0x5a5565, map: makeTex('concrete') });
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x7a7080, map: makeFloorTex('floor', 10, 12) });

    // 바닥
    const floor = new THREE.Mesh(new THREE.BoxGeometry(40, 0.2, 50), floorMat);
    floor.position.set(20, -0.1, 25);
    floor.receiveShadow = true;
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
    addWall(20,  0,  40, 0.3);   // 남벽
    addWall(20, 50,  40, 0.3);   // 북벽
    addWall( 0, 25, 0.3, 50);   // 서벽
    addWall(40, 25, 0.3, 50);   // 동벽

    // ── 중간 구분벽 (z=21) — 출입구: x=4~10, x=15~25, x=30~36 ──
    addWall( 2,   21,  4,  0.3);  // x=0~4
    addWall(12.5, 21,  5,  0.3);  // x=10~15
    addWall(27.5, 21,  5,  0.3);  // x=25~30
    addWall(38,   21,  4,  0.3);  // x=36~40

    // ── 방 칸막이 (x=13.5, x=26.5 / z=21~50) ──
    addWall(13.5, 35.5, 0.3, 29);
    addWall(26.5, 35.5, 0.3, 29);

    // ── 메인 홀 엄폐물 ──
    addWall( 7, 12, 2.5, 0.8);
    addWall(33, 12, 2.5, 0.8);
    addWall(20, 16, 1.2, 0.8);

    // ── 각 방 내부 엄폐물 ──
    // 좌측 방 (Bomb A)
    addWall( 4, 27, 1.0, 0.8);
    addWall(10, 33, 0.8, 1.0);
    // 중앙 방 (Bomb B)
    addWall(17, 27, 0.8, 1.0);
    addWall(24, 33, 0.8, 0.8);
    // 우측 방 (Bomb C)
    addWall(30, 27, 1.0, 0.8);
    addWall(36, 33, 0.8, 1.0);

    // ── 남측 안전구역 분리벽 (z=6) — 플레이어 시작점(z≈2)과 메인홀(z=8+) 분리 ──
    // 출입구: x=10~15 (서쪽 갭), x=25~30 (동쪽 갭)
    addWall( 5,  6, 10, 0.4);   // x=0~10
    addWall(20,  6, 10, 0.4);   // x=15~25
    addWall(35,  6, 10, 0.4);   // x=30~40

    // ── 폭탄 생성 ──
    _bombs.push(_makeDefuseBomb( 7, 44));   // Bomb A (좌측)
    _bombs.push(_makeDefuseBomb(20, 46));   // Bomb B (중앙)
    _bombs.push(_makeDefuseBomb(33, 44));   // Bomb C (우측)
}

// ─────────────────────────────────────────────
// spawnDefuseEnemies
// ─────────────────────────────────────────────
function spawnDefuseEnemies() {
    TOTAL_ENEMIES = 9;
    document.getElementById('kill-counter').textContent = _defuseHUDText();

    // 메인 홀 순찰병 3명 (z=8 이남 순찰 없음 — 남측 안전구역 분리벽 안쪽 접근 방지)
    spawnEnemyAt( 7, 13, [{ x:  4, z:  9 }, { x: 12, z: 19 }], false);
    spawnEnemyAt(20, 14, [{ x: 16, z:  9 }, { x: 24, z: 19 }], false);
    spawnEnemyAt(33, 13, [{ x: 28, z:  9 }, { x: 37, z: 19 }], false);

    // Bomb A 경비 2명
    spawnEnemyAt( 4, 27, [{ x:  2, z: 23 }, { x:  8, z: 46 }], false);
    spawnEnemyAt( 9, 38, [{ x:  3, z: 46 }, { x: 12, z: 28 }], false);

    // Bomb B 경비 2명
    spawnEnemyAt(16, 27, [{ x: 14, z: 23 }, { x: 25, z: 46 }], false);
    spawnEnemyAt(24, 38, [{ x: 15, z: 46 }, { x: 26, z: 28 }], false);

    // Bomb C 경비 2명
    spawnEnemyAt(30, 27, [{ x: 28, z: 23 }, { x: 37, z: 46 }], false);
    spawnEnemyAt(36, 38, [{ x: 28, z: 46 }, { x: 39, z: 28 }], false);
}

// ─────────────────────────────────────────────
// HUD 텍스트 생성
// ─────────────────────────────────────────────
function _defuseHUDText() {
    const labels = ['A', 'B', 'C'];
    const parts  = _bombs.map((b, i) => {
        if (b.defused) return `[${labels[i]}:SAFE]`;
        const t = Math.ceil(b.timer);
        return t < 30 ? `[!${labels[i]}:${t}s!]` : `[${labels[i]}:${t}s]`;
    });
    return `BOMB ${parts.join(' ')}`;
}

// ─────────────────────────────────────────────
// updateDefuse  — MAP_REGISTRY.update(dt)
// ─────────────────────────────────────────────
function updateDefuse(dt) {
    if (_defuseFailed || _defuseWin) return;

    const px = player.pos.x, pz = player.pos.z;
    let allDefused = true;
    let nearBomb   = -1;   // 현재 해제 중인 폭탄 인덱스 (-1 = 없음)

    for (let i = 0; i < _bombs.length; i++) {
        const b = _bombs[i];
        if (b.defused) continue;
        allDefused = false;

        // 타이머 카운트다운
        b.timer -= dt;
        if (b.timer <= 0) {
            _triggerBombExplosion(i);
            return;
        }

        // 플레이어 근접 여부
        const dx    = px - b.pos.x;
        const dz    = pz - b.pos.z;
        const distSq = dx * dx + dz * dz;

        if (distSq < _DEFUSE_RANGE * _DEFUSE_RANGE) {
            b.defuseProgress += dt;
            nearBomb = i;
            if (b.defuseProgress >= _DEFUSE_TIME) {
                _defuseBomb(i);
            }
        } else {
            // 범위 벗어나면 진행도 빠르게 감소
            b.defuseProgress = Math.max(0, b.defuseProgress - dt * 2.5);
        }

        // LED 점멸 (타이머 30초 이하 시 2배 빠름)
        const blinkHz  = b.timer < 30 ? 4 : 1.8;
        const blinkOn  = (Math.floor(Date.now() / (1000 / blinkHz)) % 2 === 0);
        b.ledMat.color.setHex(blinkOn ? 0xff2200 : 0x440000);
        b.light.intensity = blinkOn ? 1.2 : 0.3;
    }

    if (allDefused && !_defuseWin) {
        _defuseWin = true;
        _onAllDefused();
    }

    // HUD 업데이트
    const k = document.getElementById('kill-counter');
    if (!k) return;

    if (nearBomb >= 0 && !_bombs[nearBomb].defused) {
        const pct = Math.floor((_bombs[nearBomb].defuseProgress / _DEFUSE_TIME) * 100);
        k.textContent = _defuseHUDText() + `  ▶ DEFUSING ${pct}%`;
    } else {
        k.textContent = _defuseHUDText();
    }
}

// ─────────────────────────────────────────────
// _defuseBomb  — 폭탄 1개 해제 처리
// ─────────────────────────────────────────────
function _defuseBomb(idx) {
    const b      = _bombs[idx];
    b.defused    = true;
    b.defuseProgress = 0;

    // LED → 녹색으로 전환
    b.ledMat.color.setHex(0x00ff44);
    b.light.color.setHex(0x00ff44);
    b.light.intensity = 0.7;
    b.light.distance  = 5;

    const labels = ['A', 'B', 'C'];
    showMessage(`BOMB ${labels[idx]} DEFUSED`, 2200);
}

// ─────────────────────────────────────────────
// _triggerBombExplosion  — 폭발 → 임무 실패
// ─────────────────────────────────────────────
function _triggerBombExplosion(idx) {
    _defuseFailed = true;
    const b      = _bombs[idx];
    const labels = ['A', 'B', 'C'];

    // 강한 주황 섬광
    b.light.color.setHex(0xff6600);
    b.light.intensity = 10;
    b.light.distance  = 24;

    // 파티클 스파크 스폰
    for (let i = 0; i < 10; i++) {
        spawnImpact(
            new THREE.Vector3(
                b.pos.x + (Math.random() - 0.5) * 2.5,
                0.6 + Math.random() * 0.8,
                b.pos.z + (Math.random() - 0.5) * 2.5
            ),
            0xff4400
        );
    }

    showMessage(`BOMB ${labels[idx]} EXPLODED — MISSION FAILED`, 4000);

    setTimeout(() => { b.light.intensity = 0; }, 400);

    setTimeout(() => {
        const sc = calcMissionScore();
        document.getElementById('overlay').innerHTML = _resultHTML(
            'MISSION FAILED', '#f44',
            `BOMB ${labels[idx]} EXPLODED`,
            sc, getGrade(0), true
        );
        document.getElementById('overlay').style.display = 'flex';
        document.exitPointerLock();
        gamePaused = true;
    }, 4000);
}

// ─────────────────────────────────────────────
// _onAllDefused  — 전체 폭탄 해제 → 임무 성공
// ─────────────────────────────────────────────
function _onAllDefused() {
    setTimeout(() => {
        showMessage('★ ALL BOMBS DEFUSED — MISSION COMPLETE ★', 6000);
        setTimeout(() => {
            const sc    = calcMissionScore();
            const grade = getGrade(sc.total);
            document.getElementById('overlay').innerHTML = _resultHTML(
                'MISSION COMPLETE', '#0f0',
                'ALL BOMBS DEFUSED',
                sc, grade, true
            );
            document.getElementById('overlay').style.display = 'flex';
            document.exitPointerLock();
            gamePaused = true;
        }, 3000);
    }, 1000);
}
