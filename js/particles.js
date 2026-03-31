'use strict';

// =====================================================================
// PARTICLES & DECALS
// =====================================================================

// ── 파티클 버스트 ──────────────────────────────────────────────────
// 충돌 1회 = THREE.Points 1개 → draw call 최소화
// 각 버스트는 자체 geometry/material을 가지며, 수명 종료 시 dispose
const _bursts   = [];
const _BURST_MAX = 20;  // 동시 활성 버스트 상한

/**
 * 충돌 지점에 파편/혈흔 파티클 버스트를 생성한다.
 * @param {THREE.Vector3} pos    충돌 위치
 * @param {THREE.Vector3} normal 표면 법선 (파편이 날아가는 기준 방향)
 * @param {'concrete'|'blood'|'headshot'} type
 * @param {number} count  파티클 수 (최대 14로 클램프)
 */
function spawnBurst(pos, normal, type, count) {
    if (_bursts.length >= _BURST_MAX) {
        const old = _bursts.shift();
        scene.remove(old.pts);
        old.geo.dispose();
        old.mat.dispose();
    }

    const cnt      = Math.min(count, 14);
    const positions = new Float32Array(cnt * 3);
    const vels      = new Array(cnt);

    for (let i = 0; i < cnt; i++) {
        positions[i*3]     = pos.x;
        positions[i*3 + 1] = pos.y;
        positions[i*3 + 2] = pos.z;

        const speed = 2.5 + Math.random() * 4.5;
        const rx    = (Math.random() - 0.5) * 1.6;
        const ry    =  Math.random() * 0.8 + 0.3;
        const rz    = (Math.random() - 0.5) * 1.6;
        vels[i] = {
            x: normal.x * speed + rx,
            y: normal.y * speed + ry,
            z: normal.z * speed + rz,
        };
    }

    const geo     = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(positions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', posAttr);

    const color = type === 'headshot' ? 0xdd1111
                : type === 'blood'    ? 0xaa1111
                :                       0xbbbbbb;   // concrete
    const size  = type === 'headshot' ? 0.090
                : type === 'blood'    ? 0.070
                :                       0.056;

    const mat = new THREE.PointsMaterial({
        color, size, sizeAttenuation: true, transparent: true,
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    const maxLife = 0.30 + Math.random() * 0.20;
    _bursts.push({ pts, geo, mat, posAttr, positions, vels, life: maxLife, maxLife });
}

function updateBursts(dt) {
    for (let i = _bursts.length - 1; i >= 0; i--) {
        const b = _bursts[i];
        b.life -= dt;
        if (b.life <= 0) {
            scene.remove(b.pts);
            b.geo.dispose();
            b.mat.dispose();
            _bursts.splice(i, 1);
            continue;
        }

        // 후반 50% 구간부터 페이드아웃
        b.mat.opacity = Math.min(1, (b.life / b.maxLife) * 2);

        const posArr = b.positions;
        const vArr   = b.vels;
        for (let j = 0; j < vArr.length; j++) {
            vArr[j].y    -= 9.8 * dt;               // 중력
            posArr[j*3]     += vArr[j].x * dt;
            posArr[j*3 + 1] += vArr[j].y * dt;
            posArr[j*3 + 2] += vArr[j].z * dt;
        }
        b.posAttr.needsUpdate = true;
    }
}


// ── 탄흔 (Bullet Decal) ────────────────────────────────────────────
// 모든 탄흔이 geometry/material을 공유 → 메모리 최소화
// 최대 50개 유지, 초과 시 가장 오래된 것부터 제거
const _DECAL_GEO = new THREE.PlaneGeometry(0.10, 0.10);
const _DECAL_MAT = new THREE.MeshBasicMaterial({
    color: 0x111111,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,       // 뎁스 버퍼 오염 방지
    polygonOffset: true,
    polygonOffsetFactor: -2, // z-fighting 방지: 벽 표면보다 살짝 앞으로
    polygonOffsetUnits: -2,
});
const _decalQueue = [];
const _DECAL_MAX  = 50;

// 재사용 법선 벡터 (매 충돌마다 new Vector3 방지)
const _dn = new THREE.Vector3();

/**
 * 이전 총알 위치(prevPos)를 기준으로 어느 벽 면에서 충돌했는지 법선을 계산한다.
 */
function _wallNormal(prevPos, box) {
    const cx = (box.min.x + box.max.x) * 0.5;
    const cy = (box.min.y + box.max.y) * 0.5;
    const cz = (box.min.z + box.max.z) * 0.5;
    const hx = (box.max.x - box.min.x) * 0.5 + 0.001;
    const hy = (box.max.y - box.min.y) * 0.5 + 0.001;
    const hz = (box.max.z - box.min.z) * 0.5 + 0.001;

    const dx = (prevPos.x - cx) / hx;
    const dy = (prevPos.y - cy) / hy;
    const dz = (prevPos.z - cz) / hz;
    const ax = Math.abs(dx), ay = Math.abs(dy), az = Math.abs(dz);

    // 가장 벽 바깥으로 돌출된 축이 충돌 면
    if (ax >= ay && ax >= az) _dn.set(Math.sign(dx) || 1, 0, 0);
    else if (az >= ay)        _dn.set(0, 0, Math.sign(dz) || 1);
    else                      _dn.set(0, Math.sign(dy) || 1, 0);
    return _dn;
}

/**
 * 벽 충돌 지점에 탄흔 데칼을 생성한다.
 * @param {THREE.Vector3} impactPos  충돌 위치 (벽 내부)
 * @param {THREE.Vector3} prevPos    충돌 직전 위치 (벽 외부)
 * @param {THREE.Box3}    box        충돌한 벽의 AABB
 * @returns {THREE.Vector3} 계산된 법선 (spawnBurst 방향으로 재사용)
 */
function spawnDecal(impactPos, prevPos, box) {
    const n = _wallNormal(prevPos, box);

    // 탄흔 위치 = 해당 벽 면 위 + 법선 방향 0.014 오프셋 (z-fighting 방지 보조)
    let sx, sy, sz;
    if (n.x !== 0) {
        sx = n.x > 0 ? box.max.x : box.min.x;
        sy = impactPos.y;
        sz = impactPos.z;
    } else if (n.z !== 0) {
        sx = impactPos.x;
        sy = impactPos.y;
        sz = n.z > 0 ? box.max.z : box.min.z;
    } else {
        sx = impactPos.x;
        sy = n.y > 0 ? box.max.y : box.min.y;
        sz = impactPos.z;
    }

    if (_decalQueue.length >= _DECAL_MAX) scene.remove(_decalQueue.shift());

    const mesh = new THREE.Mesh(_DECAL_GEO, _DECAL_MAT);
    mesh.position.set(
        sx + n.x * 0.014,
        sy + n.y * 0.014,
        sz + n.z * 0.014,
    );
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
    mesh.rotateZ(Math.random() * Math.PI * 2);              // 랜덤 회전 (반복감 제거)
    mesh.scale.setScalar(0.75 + Math.random() * 0.55);      // 크기 변화
    mesh.renderOrder = 1;
    scene.add(mesh);
    _decalQueue.push(mesh);

    return n; // bullets.js에서 spawnBurst 방향으로 재사용
}
