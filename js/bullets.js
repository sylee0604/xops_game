'use strict';

// =====================================================================
// BULLETS
// =====================================================================
const BULLET_GEO = new THREE.SphereGeometry(0.04, 4, 4);
const BULLET_MAT_P = new THREE.MeshBasicMaterial({ color: 0xffee44 });
const BULLET_MAT_E = new THREE.MeshBasicMaterial({ color: 0xff5522 });
// 트레이서: 지오메트리/머티리얼 공유 (샷건 다중발 시 GPU 업로드 스파이크 방지)
const TRACER_GEO   = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-0.4)
]);
const TRACER_MAT_P = new THREE.LineBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.7 });
const TRACER_MAT_E = new THREE.LineBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.7 });
// updateBullets 재사용 임시 벡터 (매 프레임 new Vector3 방지)
const _bStep    = new THREE.Vector3();
const _bHeadC   = new THREE.Vector3();
const _bBodyC   = new THREE.Vector3();
const _bNearC   = new THREE.Vector3();
const _bHitNorm = new THREE.Vector3(); // 피격 역방향 (파티클 방향용)
const _bHitPt   = new THREE.Vector3(); // 탄흔 실제 진입점 (segmentHitsBox 결과)

function spawnBullet(origin, dir, damage, isPlayer, speed, isAlly = false) {
    // Bullet limit: prevent unbounded growth
    if (bullets.length > 60) return;

    const mesh = new THREE.Mesh(BULLET_GEO, isPlayer ? BULLET_MAT_P : BULLET_MAT_E);
    mesh.position.copy(origin);
    scene.add(mesh);

    const tracer = new THREE.Line(TRACER_GEO, isPlayer ? TRACER_MAT_P : TRACER_MAT_E);
    tracer.position.copy(origin);
    tracer.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,-1), dir.clone().normalize());
    scene.add(tracer);

    bullets.push({ mesh, tracer, pos: origin.clone(), prevPos: origin.clone(), dir: dir.clone().normalize(), speed, damage, isPlayer, isAlly, life: 30 });
}

function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.life -= dt;

        b.prevPos.copy(b.pos);
        _bStep.copy(b.dir).multiplyScalar(b.speed * dt);
        b.pos.add(_bStep);
        b.mesh.position.copy(b.pos);
        b.tracer.position.copy(b.pos);

        let remove = b.life <= 0;

        if (!remove) {
            // Wall collision
            for (const w of walls) {
                if (w.box.containsPoint(b.pos)) {
                    const wallN = spawnDecal(b.pos, b.prevPos, w.box); // 탄흔 + 법선 반환
                    spawnBurst(b.pos, wallN, 'concrete', 6);           // 콘크리트 파편
                    spawnImpact(b.pos);
                    remove = true; break;
                }
            }
        }

        if (!remove) {
            if (b.isPlayer) {
                // vs enemies — swept 구 교차 판정
                for (const e of enemies) {
                    if (e.state === STATE.DEAD) continue;
                    _bHeadC.set(e.pos.x, 1.52, e.pos.z);
                    _bBodyC.set(e.pos.x, 0.88, e.pos.z);
                    if (segmentHitsSphere(b.prevPos, b.pos, _bHeadC, 0.22)) {
                        hitEnemy(e, b.damage * 2, b.isAlly);
                        spawnImpact(b.pos, 0xff3300);
                        _bHitNorm.copy(b.dir).negate();
                        spawnBurst(b.pos, _bHitNorm, 'headshot', 12); // 헤드샷 혈흔
                        if (!b.isAlly) showMessage('HEADSHOT!');
                        remove = true; break;
                    } else if (segmentHitsSphere(b.prevPos, b.pos, _bBodyC, 0.46)) {
                        hitEnemy(e, b.damage, b.isAlly);
                        spawnImpact(b.pos, 0xffaa00);
                        _bHitNorm.copy(b.dir).negate();
                        spawnBurst(b.pos, _bHitNorm, 'blood', 7);     // 몸 피격 혈흔
                        remove = true; break;
                    }
                }
            } else {
                // vs player — swept 구 교차 판정
                _bHeadC.set(player.pos.x, player.pos.y,       player.pos.z);
                _bBodyC.set(player.pos.x, player.pos.y - 0.6, player.pos.z);
                if (segmentHitsSphere(b.prevPos, b.pos, _bHeadC, 0.28)) {
                    // 피격 방향 계산: 총알이 날아온 방향을 플레이어 시점 각도로 변환
                    const _s = Math.sin(player.yaw), _c = Math.cos(player.yaw);
                    damagePlayer(b.damage + 8, Math.atan2(-b.dir.x * _c + b.dir.z * _s, b.dir.x * _s + b.dir.z * _c));
                    remove = true;
                } else if (segmentHitsSphere(b.prevPos, b.pos, _bBodyC, 0.38)) {
                    const _s = Math.sin(player.yaw), _c = Math.cos(player.yaw);
                    damagePlayer(b.damage, Math.atan2(-b.dir.x * _c + b.dir.z * _s, b.dir.x * _s + b.dir.z * _c));
                    remove = true;
                }
                // vs allies (assault 맵 아군)
                if (!remove) {
                    for (const ally of allies) {
                        if (ally.state === STATE.DEAD) continue;
                        _bHeadC.set(ally.pos.x, 1.52, ally.pos.z);
                        _bBodyC.set(ally.pos.x, 0.88, ally.pos.z);
                        if (segmentHitsSphere(b.prevPos, b.pos, _bHeadC, 0.22) ||
                            segmentHitsSphere(b.prevPos, b.pos, _bBodyC, 0.46)) {
                            hitAlly(ally, b.damage);
                            spawnImpact(b.pos, 0xffaa00);
                            remove = true; break;
                        }
                    }
                }
            }
        }

        // 니어미스: 플레이어 총알이 순찰 중인 적 근처(2유닛 이내) 통과 시 SCAN
        if (!remove && b.isPlayer) {
            for (const e of enemies) {
                if (e.state !== STATE.PATROL && e.state !== STATE.SCAN) continue;
                _bNearC.set(e.pos.x, 1.0, e.pos.z);
                if (segmentHitsSphere(b.prevPos, b.pos, _bNearC, 2.0)) {
                    e.state = STATE.SCAN;
                    e.scanTimer = 2.5;
                    e.scanDuration = 2.5;
                    e.scanTotalAngle = Math.PI * 2;
                    e.scanStartFacing = e.facing;
                    break;
                }
            }
        }

        if (remove) {
            scene.remove(b.mesh);
            scene.remove(b.tracer);
            bullets.splice(i, 1);
        }
    }
}

// =====================================================================
// IMPACTS
// =====================================================================
const IMPACT_GEO = new THREE.SphereGeometry(0.08, 4, 4);
// 자주 쓰는 임팩트 색상 머티리얼 캐시 (매 발사마다 new Material 방지)
const IMPACT_MATS = {
    0xffdd44: new THREE.MeshBasicMaterial({ color: 0xffdd44 }),
    0xff3300: new THREE.MeshBasicMaterial({ color: 0xff3300 }),
    0xffaa00: new THREE.MeshBasicMaterial({ color: 0xffaa00 }),
    0xff2200: new THREE.MeshBasicMaterial({ color: 0xff2200 }),
    0xff4400: new THREE.MeshBasicMaterial({ color: 0xff4400 }),
};
// 머즐 플래시용 단일 PointLight (재사용)
const _impactLight = new THREE.PointLight(0xffdd44, 0, 5);
_impactLight._busy = false;

function spawnImpact(pos, color = 0xffdd44) {
    const mat = IMPACT_MATS[color] || IMPACT_MATS[0xffdd44];
    const mesh = new THREE.Mesh(IMPACT_GEO, mat);
    mesh.position.copy(pos);
    scene.add(mesh);
    // PointLight는 공유 1개만 사용 (샷건 7발에 7개 생성하지 않음)
    let light = null;
    if (!_impactLight._busy) {
        _impactLight.color.setHex(color);
        _impactLight.intensity = 3;
        _impactLight.position.copy(pos);
        _impactLight._busy = true;
        scene.add(_impactLight);
        light = _impactLight;
    }
    impacts.push({ mesh, light, life: 0.08 });
}

function updateImpacts(dt) {
    for (let i = impacts.length - 1; i >= 0; i--) {
        impacts[i].life -= dt;
        if (impacts[i].life <= 0) {
            scene.remove(impacts[i].mesh);
            if (impacts[i].light) {
                scene.remove(impacts[i].light);
                if (impacts[i].light === _impactLight) _impactLight._busy = false;
            }
            impacts.splice(i, 1);
        }
    }
}
