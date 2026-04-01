'use strict';

// =====================================================================
// PHYSICS
// =====================================================================

// feetY: 플레이어 발 높이 (undefined면 적용 안 함 — 적 전용)
function resolveWallCollision(pos, radius, feetY) {
    const PASSES = 3;
    for (let p = 0; p < PASSES; p++) {
        for (const w of walls) {
            if (feetY !== undefined) {
                const wTop = w.box.max.y;
                const wBot = w.box.min.y;
                if (feetY >= wTop - 0.05) continue;       // 이미 위에 서 있음
                if (wTop <= feetY + STEP_HEIGHT) continue; // 스텝업 범위
                if (wBot >= feetY + 2.2) continue;         // 머리 위 구조물 — 통과 가능
            }
            const { min, max } = w.box;
            const cx = Math.max(min.x, Math.min(pos.x, max.x));
            const cz = Math.max(min.z, Math.min(pos.z, max.z));
            const dx = pos.x - cx, dz = pos.z - cz;
            const d2 = dx * dx + dz * dz;
            if (d2 < radius * radius && d2 > 1e-6) {
                const d = Math.sqrt(d2);
                pos.x += (dx / d) * (radius - d);
                pos.z += (dz / d) * (radius - d);
            }
        }
    }
}

// 선분(p0→p1)이 AABB box와 교차하는지 판정 (slab 알고리즘)
// 교차 시 첫 진입 점의 {t, x, y, z} 반환, 교차 없으면 null
// containsPoint 대신 이 함수를 쓰면 고속 총알이 벽을 통과하는 문제 해결
function segmentHitsBox(p0, p1, box) {
    const dx = p1.x - p0.x, dy = p1.y - p0.y, dz = p1.z - p0.z;
    let tmin = 0, tmax = 1;

    // X 슬랩
    if (Math.abs(dx) < 1e-9) { if (p0.x < box.min.x || p0.x > box.max.x) return null; }
    else {
        const tx1 = (box.min.x - p0.x) / dx, tx2 = (box.max.x - p0.x) / dx;
        tmin = Math.max(tmin, Math.min(tx1, tx2));
        tmax = Math.min(tmax, Math.max(tx1, tx2));
        if (tmin > tmax) return null;
    }
    // Y 슬랩
    if (Math.abs(dy) < 1e-9) { if (p0.y < box.min.y || p0.y > box.max.y) return null; }
    else {
        const ty1 = (box.min.y - p0.y) / dy, ty2 = (box.max.y - p0.y) / dy;
        tmin = Math.max(tmin, Math.min(ty1, ty2));
        tmax = Math.min(tmax, Math.max(ty1, ty2));
        if (tmin > tmax) return null;
    }
    // Z 슬랩
    if (Math.abs(dz) < 1e-9) { if (p0.z < box.min.z || p0.z > box.max.z) return null; }
    else {
        const tz1 = (box.min.z - p0.z) / dz, tz2 = (box.max.z - p0.z) / dz;
        tmin = Math.max(tmin, Math.min(tz1, tz2));
        tmax = Math.min(tmax, Math.max(tz1, tz2));
        if (tmin > tmax) return null;
    }

    if (tmin > 1) return null; // 선분 밖 (벽이 완전히 p1 너머)
    return { t: tmin, x: p0.x + dx*tmin, y: p0.y + dy*tmin, z: p0.z + dz*tmin };
}

// 선분(p0->p1)이 구(center, radius)를 통과하는지 판정
function segmentHitsSphere(p0, p1, center, radius) {
    const dx = p1.x - p0.x, dy = p1.y - p0.y, dz = p1.z - p0.z;
    const len = Math.sqrt(dx*dx + dy*dy + dz*dz);
    if (len < 1e-6) return false;
    const rdx = dx/len, rdy = dy/len, rdz = dz/len;
    const ocx = p0.x - center.x, ocy = p0.y - center.y, ocz = p0.z - center.z;
    const b2 = ocx*rdx + ocy*rdy + ocz*rdz;
    const c  = ocx*ocx + ocy*ocy + ocz*ocz - radius*radius;
    const disc = b2*b2 - c;
    if (disc < 0) return false;
    const sqrtDisc = Math.sqrt(disc);
    const t1 = -b2 - sqrtDisc; // 진입점
    const t2 = -b2 + sqrtDisc; // 출구점
    // 선분[0, len]과 구 교차구간[t1, t2]이 겹치면 히트
    return t2 >= 0 && t1 <= len;
}
