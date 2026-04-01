'use strict';

// =====================================================================
// ENEMIES
// =====================================================================

// Assault map: sandbag gap x-centers (spaces between wall clusters)
const _ASSAULT_GAPS = [1.7, 9.5, 16.8, 22.2, 29.5, 37.3];
function _nearestGapX(x) {
    return _ASSAULT_GAPS.reduce((best, g) => Math.abs(g - x) < Math.abs(best - x) ? g : best);
}

// Shared body-part geometries — never modified at runtime, safe to reuse across all units
const _GEO = {
    leg:     new THREE.BoxGeometry(0.14, 0.52, 0.15),
    boot:    new THREE.BoxGeometry(0.15, 0.09, 0.19),
    torso:   new THREE.BoxGeometry(0.38, 0.72, 0.20),
    vest:    new THREE.BoxGeometry(0.36, 0.56, 0.18),
    uArm:    new THREE.BoxGeometry(0.12, 0.25, 0.13),
    lArm:    new THREE.BoxGeometry(0.10, 0.21, 0.11),
    neck:    new THREE.BoxGeometry(0.12, 0.13, 0.12),
    head:    new THREE.BoxGeometry(0.21, 0.21, 0.21),
    helm:    new THREE.BoxGeometry(0.25, 0.15, 0.27),
    brim:    new THREE.BoxGeometry(0.25, 0.04, 0.06),
    eye:     new THREE.BoxGeometry(0.05, 0.038, 0.022),
    gBody:   new THREE.BoxGeometry(0.055, 0.075, 0.42),
    gBarrel: new THREE.BoxGeometry(0.022, 0.022, 0.20),
    gMag:    new THREE.BoxGeometry(0.038, 0.08, 0.045),
    gMag2:   new THREE.BoxGeometry(0.036, 0.05, 0.04),
    gStock:  new THREE.BoxGeometry(0.045, 0.065, 0.18),
    gHG:     new THREE.BoxGeometry(0.05, 0.045, 0.16),
};

// Shared gun/wood materials — gunGroup is a THREE.Group (no .material),
// so its children are NOT reached by the death-darkening forEach → safe to share globally.
const _MAT_GUN  = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, shininess: 60 });
const _MAT_WOOD = new THREE.MeshPhongMaterial({ color: 0x7a4f1a });

// peek 타이머 헬퍼: phase 0/2(이동) = 짧게, phase 1/3(대기) = 길게
function _nextPeekTimer(u) {
    u.peekTimer = (u.peekPhase % 2 === 0)
        ? 0.15 + Math.random() * 0.10
        : 0.30 + Math.random() * 0.70;
}

// Raycaster reuse vars (avoid per-frame allocation)
const _ray       = new THREE.Raycaster();
const _eyePos    = new THREE.Vector3();
const _playerEye = new THREE.Vector3();
const _toPlayer  = new THREE.Vector3();
const _fwd       = new THREE.Vector3();
const _rayDir    = new THREE.Vector3();
const FOV_COS    = Math.cos(THREE.MathUtils.degToRad(55));

function canSeePlayer(e) {
    _eyePos.set(e.pos.x, 1.45, e.pos.z);
    _playerEye.set(player.pos.x, player.pos.y, player.pos.z);
    const dist = _eyePos.distanceTo(_playerEye);
    if (e.isZombie && dist < 8) return true;
    if (dist > e.sightRange) return false;

    _toPlayer.set(_playerEye.x - _eyePos.x, 0, _playerEye.z - _eyePos.z).normalize();
    _fwd.set(-Math.sin(e.facing), 0, -Math.cos(e.facing));
    const dot = _fwd.dot(_toPlayer);
    const behindEnemy = dot < -0.5;

    if (player.isStealth && behindEnemy) return false;
    if (dot < FOV_COS && dist > 3) return false;

    _rayDir.subVectors(_playerEye, _eyePos).normalize();
    _ray.set(_eyePos, _rayDir);
    const hits = _ray.intersectObjects(wallMeshList);
    return (hits.length === 0 || hits[0].distance > dist - 0.3);
}

function spawnEnemies() {
    for (const ed of ENEMY_DATA) {
        const skinMat   = new THREE.MeshPhongMaterial({ color: 0xb07040 });
        const unifMat   = new THREE.MeshPhongMaterial({ color: 0x2d5016 });
        const vestMat   = new THREE.MeshPhongMaterial({ color: 0x1e3a0f });
        const helmetMat = new THREE.MeshPhongMaterial({ color: 0x1a2e0a });
        const bootMat   = new THREE.MeshPhongMaterial({ color: 0x111111 });
        const eyeMat    = new THREE.MeshBasicMaterial({ color: 0x111111 });

        const group = new THREE.Group();

        const lLeg = new THREE.Mesh(_GEO.leg,  unifMat); lLeg.position.set(-0.10, 0.30, 0);
        const rLeg = new THREE.Mesh(_GEO.leg,  unifMat); rLeg.position.set( 0.10, 0.30, 0);
        const lBoot = new THREE.Mesh(_GEO.boot, bootMat); lBoot.position.set(-0.10, 0.045, 0.02);
        const rBoot = new THREE.Mesh(_GEO.boot, bootMat); rBoot.position.set( 0.10, 0.045, 0.02);
        const torso = new THREE.Mesh(_GEO.torso, unifMat); torso.position.y = 0.92;
        const vest  = new THREE.Mesh(_GEO.vest,  vestMat); vest.position.set(0, 0.94, 0.01);
        const lUA = new THREE.Mesh(_GEO.uArm, unifMat); lUA.position.set(-0.25, 1.10, 0);
        const lLA = new THREE.Mesh(_GEO.lArm, unifMat); lLA.position.set(-0.25, 0.84, 0);
        const rUA = new THREE.Mesh(_GEO.uArm, unifMat); rUA.position.set( 0.25, 1.10, 0);
        const rLA = new THREE.Mesh(_GEO.lArm, unifMat); rLA.position.set( 0.25, 0.84, -0.08); rLA.rotation.x = -0.35;
        const neck = new THREE.Mesh(_GEO.neck, skinMat); neck.position.y = 1.32;
        const head = new THREE.Mesh(_GEO.head, skinMat); head.position.y = 1.50;
        const helm = new THREE.Mesh(_GEO.helm, helmetMat); helm.position.set(0, 1.60, 0.01);
        const brim = new THREE.Mesh(_GEO.brim, helmetMat); brim.position.set(0, 1.53, -0.145);
        const lEye = new THREE.Mesh(_GEO.eye, eyeMat); lEye.position.set(-0.052, 1.50, -0.115);
        const rEye = new THREE.Mesh(_GEO.eye, eyeMat); rEye.position.set( 0.052, 1.50, -0.115);

        const gunGroup = new THREE.Group();
        const gBarrel = new THREE.Mesh(_GEO.gBarrel, _MAT_GUN); gBarrel.position.set(0, 0.015, -0.31);
        const gMag1   = new THREE.Mesh(_GEO.gMag,    _MAT_GUN); gMag1.position.set(0, -0.075, -0.02);
        const gMag2   = new THREE.Mesh(_GEO.gMag2,   _MAT_GUN); gMag2.position.set(0, -0.13, -0.045); gMag2.rotation.x = 0.35;
        const gStock  = new THREE.Mesh(_GEO.gStock,  _MAT_WOOD); gStock.position.set(0, -0.008, 0.28);
        const gHG     = new THREE.Mesh(_GEO.gHG,     _MAT_WOOD); gHG.position.set(0, -0.015, -0.16);
        gunGroup.add(new THREE.Mesh(_GEO.gBody, _MAT_GUN), gBarrel, gMag1, gMag2, gStock, gHG);
        gunGroup.position.set(0.32, 1.04, -0.16);
        gunGroup.rotation.set(0.32, 0, 0);

        group.add(
            lLeg, rLeg, lBoot, rBoot,
            torso, vest,
            lUA, lLA, rUA, rLA,
            neck, head, helm, brim,
            lEye, rEye,
            gunGroup
        );

        const x = ed.c * CELL + CELL / 2;
        const z = ed.r * CELL + CELL / 2;
        group.position.set(x, 0, z);
        scene.add(group);

        const wp1 = new THREE.Vector3(ed.wp[0].c * CELL + CELL/2, 0, ed.wp[0].r * CELL + CELL/2);
        const wp2 = new THREE.Vector3(ed.wp[1].c * CELL + CELL/2, 0, ed.wp[1].r * CELL + CELL/2);

        enemies.push({
            mesh: group,
            bodyMesh: vest,
            pos: new THREE.Vector3(x, 0, z),
            health: 100,
            state: STATE.PATROL,
            waypoints: [wp1, wp2],
            wpIndex: 0,
            lastKnownPlayer: null,
            alertTimer: 0,
            shootTimer: 1 + Math.random() * 0.5,
            shootCooldown: 0.8 + Math.random() * 0.4,
            speed: 2.2 + Math.random() * 0.5,
            sightRange: 30,
            attackRange: 30,
            facing: Math.random() * Math.PI * 2,
            damage: 25,
            walkPhase: Math.random() * Math.PI * 2,
            scanTimer: 0,
            scanDuration: 2.5,
            scanTotalAngle: Math.PI * 2,
            scanStartFacing: 0,
            scanToAttack: false,
            strafeTimer: Math.random() * 1.5,
            strafeDir: (Math.random() > 0.5) ? 1 : -1,
            dodgeTimer: 0,
            peekPhase: 0,
            peekTimer: Math.random() * 0.3,
            reactDelay: 0,
            shootCount: 0,
            attackTarget: null,
            isZombie: false,
            baseY: 0,
        });
    }
}

// 임의 월드좌표로 적 생성 (그리드 독립)
function spawnEnemyAt(x, z, wpList, isZombie, floorY = 0) {
    const skinMat   = new THREE.MeshPhongMaterial({ color: isZombie ? 0x7a9a60 : 0xb07040 });
    const clothMat  = new THREE.MeshPhongMaterial({ color: isZombie ? 0x3a2a1a : 0x2d5016 });
    const vestMat   = new THREE.MeshPhongMaterial({ color: 0x1e3a0f });
    const helmetMat = new THREE.MeshPhongMaterial({ color: 0x1a2e0a });
    const bootMat   = new THREE.MeshPhongMaterial({ color: 0x111111 });

    const group = new THREE.Group();

    const lLeg = new THREE.Mesh(_GEO.leg,  clothMat); lLeg.position.set(-0.10, 0.30, 0);
    const rLeg = new THREE.Mesh(_GEO.leg,  clothMat); rLeg.position.set( 0.10, 0.30, 0);
    const lBoot = new THREE.Mesh(_GEO.boot, bootMat); lBoot.position.set(-0.10, 0.045, 0.02);
    const rBoot = new THREE.Mesh(_GEO.boot, bootMat); rBoot.position.set( 0.10, 0.045, 0.02);
    const torso = new THREE.Mesh(_GEO.torso, clothMat); torso.position.y = 0.92;
    const vest  = new THREE.Mesh(_GEO.vest,  isZombie ? clothMat : vestMat); vest.position.set(0, 0.94, 0.01);
    const lUA = new THREE.Mesh(_GEO.uArm, clothMat); lUA.position.set(-0.25, 1.10, 0);
    const lLA = new THREE.Mesh(_GEO.lArm, clothMat); lLA.position.set(-0.25, 0.84, 0);
    const rUA = new THREE.Mesh(_GEO.uArm, clothMat); rUA.position.set( 0.25, 1.10, 0);
    const rLA = new THREE.Mesh(_GEO.lArm, clothMat); rLA.position.set( 0.25, 0.84, -0.08);
    rLA.rotation.x = -0.35;
    // 좀비: 팔을 앞으로 뻗음
    if (isZombie) {
        lUA.position.set(-0.22, 1.15, -0.12); lUA.rotation.x = -0.9;
        rUA.position.set( 0.22, 1.15, -0.12); rUA.rotation.x = -0.9;
        lLA.position.set(-0.22, 0.90, -0.30); lLA.rotation.x = -0.9;
        rLA.position.set( 0.22, 0.90, -0.30); rLA.rotation.x = -0.9;
    }
    const neck = new THREE.Mesh(_GEO.neck, skinMat); neck.position.y = 1.32;
    const head = new THREE.Mesh(_GEO.head, skinMat); head.position.y = 1.50;
    if (isZombie) { head.position.set(0, 1.45, -0.06); head.rotation.x = 0.35; }
    const helm = new THREE.Mesh(_GEO.helm, helmetMat); helm.position.set(0, 1.60, 0.01);
    const brim = new THREE.Mesh(_GEO.brim, helmetMat); brim.position.set(0, 1.53, -0.145);

    // 눈 (좀비: 빨간 눈, 병사: 검은 눈)
    const eyeMat = new THREE.MeshBasicMaterial({ color: isZombie ? 0xcc0000 : 0x111111 });
    const lEye = new THREE.Mesh(_GEO.eye, eyeMat);
    const rEye = new THREE.Mesh(_GEO.eye, eyeMat);
    if (isZombie) {
        lEye.position.set(-0.052, 1.44, -0.12);
        rEye.position.set( 0.052, 1.44, -0.12);
    } else {
        lEye.position.set(-0.052, 1.50, -0.115);
        rEye.position.set( 0.052, 1.50, -0.115);
    }

    const toAdd = [lLeg, rLeg, lBoot, rBoot, torso, vest, lUA, lLA, rUA, rLA, neck, head, lEye, rEye];
    if (!isZombie) toAdd.push(helm, brim);

    if (!isZombie) {
        const gunGroup = new THREE.Group();
        const gBarrel = new THREE.Mesh(_GEO.gBarrel, _MAT_GUN); gBarrel.position.set(0, 0.015, -0.31);
        const gMag    = new THREE.Mesh(_GEO.gMag,    _MAT_GUN); gMag.position.set(0, -0.075, -0.02);
        const gStock  = new THREE.Mesh(_GEO.gStock,  _MAT_WOOD); gStock.position.set(0, -0.008, 0.28);
        gunGroup.add(new THREE.Mesh(_GEO.gBody, _MAT_GUN), gBarrel, gMag, gStock);
        gunGroup.position.set(0.32, 1.04, -0.16);
        gunGroup.rotation.set(0.32, 0, 0);
        toAdd.push(gunGroup);
    }

    for (const m of toAdd) group.add(m);
    group.position.set(x, 0, z);
    scene.add(group);

    const wps = (wpList || []).map(p => new THREE.Vector3(p.x, 0, p.z));
    if (wps.length < 2) {
        wps.push(new THREE.Vector3(x + 3, 0, z), new THREE.Vector3(x - 3, 0, z));
    }

    enemies.push({
        mesh: group, bodyMesh: vest,
        pos: new THREE.Vector3(x, 0, z),
        baseY: floorY,
        health: isZombie ? 192 : 100,
        state: STATE.PATROL,
        waypoints: wps, wpIndex: 0,
        lastKnownPlayer: null, alertTimer: 0,
        shootTimer: isZombie ? 0.2 : (1 + Math.random() * 0.5),
        shootCooldown: isZombie ? 1.2 : (0.8 + Math.random() * 0.4),
        speed: isZombie ? (4.56 + Math.random() * 0.96) : (2.2 + Math.random() * 0.5),
        sightRange: isZombie ? 22 : 35,
        attackRange: 35,
        facing: Math.random() * Math.PI * 2,
        damage: isZombie ? 27 : 25,
        walkPhase: Math.random() * Math.PI * 2,
        scanTimer: 0, scanDuration: 2.5,
        scanTotalAngle: Math.PI * 2, scanStartFacing: 0, scanToAttack: false,
        strafeTimer: Math.random() * 1.5,
        strafeDir: (Math.random() > 0.5) ? 1 : -1,
        dodgeTimer: 0,
        peekPhase: 0,          // 0=이동 1=정지/사격 2=반대이동 3=정지
        peekTimer: Math.random() * 0.3,
        reactDelay: 0,
        shootCount: 0,
        attackTarget: null,
        isZombie,
    });
}

function updateEnemies(dt) {
    for (const e of enemies) {
        if (e.state === STATE.DEAD) continue;

        const sees = canSeePlayer(e);

        // ── 아군 시야 체크 (플레이어를 못 볼 때만) ──
        let visibleAlly = null;
        if (!sees && allies.length > 0) {
            _eyePos.set(e.pos.x, 1.45, e.pos.z);
            for (const ally of allies) {
                if (ally.state === STATE.DEAD) continue;
                const ax = ally.pos.x - e.pos.x, az = ally.pos.z - e.pos.z;
                const adist = Math.sqrt(ax*ax + az*az);
                if (adist > e.sightRange) continue;
                _toPlayer.set(ax / adist, 0, az / adist);
                _fwd.set(-Math.sin(e.facing), 0, -Math.cos(e.facing));
                if (_fwd.dot(_toPlayer) < FOV_COS && adist > 3) continue;
                _rayDir.copy(_toPlayer);
                _ray.set(_eyePos, _rayDir);
                const hits = _ray.intersectObjects(wallMeshList);
                if (hits.length === 0 || hits[0].distance > adist - 0.3) {
                    visibleAlly = ally; break;
                }
            }
        }

        // 현재 유효 타겟 (플레이어 우선)
        const effectiveTarget = sees ? player.pos
            : (e.attackTarget && e.attackTarget.state !== STATE.DEAD ? e.attackTarget.pos : player.pos);

        const dx0 = e.pos.x - effectiveTarget.x;
        const dz0 = e.pos.z - effectiveTarget.z;
        const distSq = dx0*dx0 + dz0*dz0;
        const dist = Math.sqrt(distSq);

        // --- State machine ---
        if (sees) {
            e.attackTarget = null; // 플레이어 타겟
            e.lastKnownPlayer = player.pos.clone();
            e.alertTimer = 10;
            if (e.state !== STATE.ATTACK) {
                e.state = STATE.ATTACK;
                e.strafeTimer = 0;
                e.reactDelay = 0.75;
                e.shootCount = 0;
            }
        } else if (visibleAlly) {
            e.attackTarget = visibleAlly;
            e.lastKnownPlayer = visibleAlly.pos.clone();
            e.alertTimer = 8;
            if (e.state !== STATE.ATTACK) {
                e.state = STATE.ATTACK;
                e.strafeTimer = 0;
                e.reactDelay = 0.75;
                e.shootCount = 0;
            }
        } else {
            if (e.state === STATE.SCAN) {
                e.scanTimer -= dt;
                e.facing = e.scanStartFacing + (1 - e.scanTimer / e.scanDuration) * e.scanTotalAngle;
                e.mesh.rotation.y = e.facing;
                if (e.scanTimer <= 0) {
                    if (e.scanToAttack) {
                        e.state = STATE.ATTACK;
                        e.alertTimer = 8;
                        e.scanToAttack = false;
                    } else {
                        e.state = STATE.PATROL;
                    }
                }
                continue;
            }
            if (e.alertTimer > 0) {
                e.alertTimer -= dt;
                if (e.state === STATE.PATROL) e.state = STATE.ALERT;
            } else {
                e.state = STATE.PATROL;
                e.attackTarget = null;
            }
        }

        const seesTarget = sees || (visibleAlly !== null);

        // --- Movement ---
        let target = null;
        let moveSpeed = e.speed;

        if (e.state === STATE.PATROL) {
            // oneWayPatrol: 이미 지나친 waypoint(z가 현재 위치보다 뒤쪽) 스킵
            if (e.oneWayPatrol) {
                while (e.wpIndex < e.waypoints.length - 1 &&
                       e.waypoints[e.wpIndex].z > e.pos.z) {
                    e.wpIndex++;
                }
            }
            target = e.waypoints[e.wpIndex];
            moveSpeed = e.speed * 0.5;
            const _wpDx = e.pos.x - target.x, _wpDz = e.pos.z - target.z;
            if (_wpDx * _wpDx + _wpDz * _wpDz < 0.36) {
                if (e.oneWayPatrol) e.wpIndex = Math.min(e.wpIndex + 1, e.waypoints.length - 1);
                else e.wpIndex = (e.wpIndex + 1) % e.waypoints.length;
            }
        } else if (e.state === STATE.ALERT) {
            target = e.lastKnownPlayer;
        } else if (e.state === STATE.ATTACK) {
            target = e.lastKnownPlayer || effectiveTarget;

            // 인지 딜레이 차감
            if (e.reactDelay > 0) e.reactDelay -= dt;

            // 좀비: 무조건 돌진
            if (e.isZombie) {
                target = player.pos;
                moveSpeed = e.speed;
                if (distSq < 1.5 * 1.5) {
                    e.shootTimer -= dt;
                    if (e.shootTimer <= 0) {
                        e.shootTimer = e.shootCooldown;
                        damagePlayer(e.damage);
                        spawnImpact(new THREE.Vector3(player.pos.x, 1.0, player.pos.z), 0xff2200);
                    }
                    moveSpeed = 0;
                } else {
                    e.shootTimer = 0.2;
                }
            } else if (seesTarget) {
                // Peek-and-Shoot
                e.peekTimer -= dt;
                if (e.peekTimer <= 0) {
                    e.peekPhase = (e.peekPhase + 1) % 4;
                    _nextPeekTimer(e);

                    if (e.peekPhase === 1 && e.reactDelay <= 0) enemyShoot(e);
                }

                const right = new THREE.Vector3(-Math.cos(e.facing), 0, Math.sin(e.facing));
                if (e.peekPhase === 0) {
                    e.pos.x += right.x * e.speed * 0.9 * dt;
                    e.pos.z += right.z * e.speed * 0.9 * dt;
                } else if (e.peekPhase === 2) {
                    e.pos.x -= right.x * e.speed * 0.9 * dt;
                    e.pos.z -= right.z * e.speed * 0.9 * dt;
                }

                // 거리 유지
                if (distSq < 5*5)       moveSpeed = -e.speed * 0.5;
                else if (distSq > 20*20) moveSpeed =  e.speed * 0.7;
                else                     moveSpeed = 0;

            } else {
                moveSpeed = distSq > 2*2 ? e.speed * 0.8 : 0;
            }
        }

        if (target) {
            const dx = target.x - e.pos.x;
            const dz = target.z - e.pos.z;
            const len = Math.sqrt(dx*dx + dz*dz);
            if (len > 0.1) {
                const nx = dx / len, nz = dz / len;
                const targetFacing = Math.atan2(-nx, -nz);
                const turnSpeed = (e.state === STATE.PATROL) ? 3 : 9;
                let diff = targetFacing - e.facing;
                while (diff > Math.PI)  diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                e.facing += diff * Math.min(1, dt * turnSpeed);
                e.mesh.rotation.y = e.facing;
                if (moveSpeed > 0 && Math.abs(diff) < Math.PI / 18) {
                    e.pos.x += nx * moveSpeed * dt;
                    e.pos.z += nz * moveSpeed * dt;
                }
            }
        }

        // Wall push
        resolveWallCollision(e.pos, 0.35);

        // Walk bob
        e.walkPhase += dt * moveSpeed * 3;
        e.mesh.position.set(e.pos.x, e.baseY + Math.sin(e.walkPhase) * 0.03, e.pos.z);
    }
}

function enemyShoot(e) {
    // 타겟: 아군이 있으면 아군, 없으면 플레이어
    const tpos = (e.attackTarget && e.attackTarget.state !== STATE.DEAD)
        ? e.attackTarget.pos : player.pos;
    // 아군은 pos.y=0 → 가슴 높이 0.9, 플레이어는 pos.y=PLAYER_HEIGHT → -0.5
    const aimY = (e.attackTarget && e.attackTarget.state !== STATE.DEAD)
        ? 0.9 : (tpos.y - 0.5);
    const dist = e.pos.distanceTo(tpos);
    const spread = 0.07 + dist * 0.0025;

    function _fire() {
        if (e.state === STATE.DEAD) return;
        const tgt = new THREE.Vector3(
            tpos.x + (Math.random()-0.5) * spread * 5,
            aimY    + (Math.random()-0.5) * spread * 3,
            tpos.z + (Math.random()-0.5) * spread * 5
        );
        const origin = new THREE.Vector3(e.pos.x, e.baseY + 1.50, e.pos.z);
        const dir = new THREE.Vector3().subVectors(tgt, origin).normalize();
        spawnBullet(origin, dir, e.damage, false, 140);
        if (dist < 60) playEnemyGunshot(1);
    }

    // 랜덤 1~3발 점사
    const count = 1 + Math.floor(Math.random() * 3);
    _fire();
    for (let i = 1; i < count; i++) setTimeout(_fire, i * 110);
}

// ── 아군 AI ──────────────────────────────────────────────────────────

function canSeeEnemy(ally, enemy) {
    if (enemy.state === STATE.DEAD) return false;
    _eyePos.set(ally.pos.x, 1.45, ally.pos.z);
    const enemyEye = new THREE.Vector3(enemy.pos.x, 1.45, enemy.pos.z);
    const dist = _eyePos.distanceTo(enemyEye);
    if (dist > ally.sightRange) return false;
    _toPlayer.set(enemyEye.x - _eyePos.x, 0, enemyEye.z - _eyePos.z).normalize();
    _fwd.set(-Math.sin(ally.facing), 0, -Math.cos(ally.facing));
    if (_fwd.dot(_toPlayer) < FOV_COS && dist > 3) return false;
    _rayDir.subVectors(enemyEye, _eyePos).normalize();
    _ray.set(_eyePos, _rayDir);
    const hits = _ray.intersectObjects(wallMeshList);
    return (hits.length === 0 || hits[0].distance > dist - 0.3);
}

function allyShoot(ally, targetEnemy) {
    const tpos = targetEnemy.pos;
    const dist = ally.pos.distanceTo(tpos);
    const spread = 0.06 + dist * 0.002;

    function _fire() {
        if (ally.state === STATE.DEAD || targetEnemy.state === STATE.DEAD) return;
        const tgt = new THREE.Vector3(
            tpos.x + (Math.random()-0.5) * spread * 5,
            0.9   + (Math.random()-0.5) * spread * 3,
            tpos.z + (Math.random()-0.5) * spread * 5
        );
        const origin = new THREE.Vector3(ally.pos.x, 1.50, ally.pos.z);
        const dir = new THREE.Vector3().subVectors(tgt, origin).normalize();
        spawnBullet(origin, dir, ally.damage, true, 140, true);
        if (dist < 60) playEnemyGunshot(1);
    }

    const count = 1 + Math.floor(Math.random() * 3);
    _fire();
    for (let i = 1; i < count; i++) setTimeout(_fire, i * 110);
}

function hitAlly(ally, damage) {
    if (ally.state === STATE.DEAD) return;
    ally.health -= damage;
    ally.bodyMesh.material.color.set(0xff2200);
    setTimeout(() => {
        if (ally.state !== STATE.DEAD) ally.bodyMesh.material.color.set(0x3a4e6a);
    }, 80);
    if (ally.health <= 0) killAlly(ally);
}

function killAlly(ally) {
    ally.state = STATE.DEAD;
    ally.mesh.rotation.z = Math.PI / 2;
    ally.mesh.position.y = -0.3;
    ally.mesh.children.forEach(c => { if (c.material) c.material.color.set(0x111111); });
}

function spawnAllyAt(x, z) {
    const skinMat   = new THREE.MeshPhongMaterial({ color: 0xb07040 });
    const clothMat  = new THREE.MeshPhongMaterial({ color: 0x2a3a5a });
    const vestMat   = new THREE.MeshPhongMaterial({ color: 0x3a4e6a });
    const helmetMat = new THREE.MeshPhongMaterial({ color: 0x1a2a4a });
    const bootMat   = new THREE.MeshPhongMaterial({ color: 0x111111 });

    const group = new THREE.Group();
    const lLeg = new THREE.Mesh(_GEO.leg,  clothMat); lLeg.position.set(-0.10, 0.30, 0);
    const rLeg = new THREE.Mesh(_GEO.leg,  clothMat); rLeg.position.set( 0.10, 0.30, 0);
    const lBoot = new THREE.Mesh(_GEO.boot, bootMat); lBoot.position.set(-0.10, 0.045, 0.02);
    const rBoot = new THREE.Mesh(_GEO.boot, bootMat); rBoot.position.set( 0.10, 0.045, 0.02);
    const torso = new THREE.Mesh(_GEO.torso, clothMat); torso.position.y = 0.92;
    const vest  = new THREE.Mesh(_GEO.vest,  vestMat); vest.position.set(0, 0.94, 0.01);
    const lUA = new THREE.Mesh(_GEO.uArm, clothMat); lUA.position.set(-0.25, 1.10, 0);
    const lLA = new THREE.Mesh(_GEO.lArm, clothMat); lLA.position.set(-0.25, 0.84, 0);
    const rUA = new THREE.Mesh(_GEO.uArm, clothMat); rUA.position.set( 0.25, 1.10, 0);
    const rLA = new THREE.Mesh(_GEO.lArm, clothMat); rLA.position.set( 0.25, 0.84, -0.08); rLA.rotation.x = -0.35;
    const neck = new THREE.Mesh(_GEO.neck, skinMat); neck.position.y = 1.32;
    const head = new THREE.Mesh(_GEO.head, skinMat); head.position.y = 1.50;
    const helm = new THREE.Mesh(_GEO.helm, helmetMat); helm.position.set(0, 1.60, 0.01);
    const brim = new THREE.Mesh(_GEO.brim, helmetMat); brim.position.set(0, 1.53, -0.145);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const lEye = new THREE.Mesh(_GEO.eye, eyeMat); lEye.position.set(-0.052, 1.50, -0.115);
    const rEye = new THREE.Mesh(_GEO.eye, eyeMat); rEye.position.set( 0.052, 1.50, -0.115);
    const gunGroup = new THREE.Group();
    const gBarrel = new THREE.Mesh(_GEO.gBarrel, _MAT_GUN); gBarrel.position.set(0, 0.015, -0.31);
    const gMag    = new THREE.Mesh(_GEO.gMag,    _MAT_GUN); gMag.position.set(0, -0.075, -0.02);
    const gStock  = new THREE.Mesh(_GEO.gStock,  _MAT_WOOD); gStock.position.set(0, -0.008, 0.28);
    gunGroup.add(new THREE.Mesh(_GEO.gBody, _MAT_GUN), gBarrel, gMag, gStock);
    gunGroup.position.set(0.32, 1.04, -0.16);
    gunGroup.rotation.set(0.32, 0, 0);

    group.add(lLeg, rLeg, lBoot, rBoot, torso, vest, lUA, lLA, rUA, rLA,
              neck, head, helm, brim, lEye, rEye, gunGroup);
    group.position.set(x, 0, z);
    scene.add(group);

    allies.push({
        mesh: group, bodyMesh: vest,
        pos: new THREE.Vector3(x, 0, z),
        health: 100,
        state: STATE.PATROL,
        waypoints: (() => {
            const gx = _nearestGapX(x);
            return [
                new THREE.Vector3(gx, 0, 21),  // 아군 모래주머니 앞
                new THREE.Vector3(gx, 0, 28),  // 갭 통과 후
                new THREE.Vector3(gx, 0, 45),  // 목표 지점 (여기서 정지)
            ];
        })(),
        wpIndex: 0,
        lastKnownEnemy: null,
        facing: 0,
        speed: 2.0 + Math.random() * 0.4,
        sightRange: 35,
        damage: 20,
        walkPhase: Math.random() * Math.PI * 2,
        peekPhase: 0,
        peekTimer: 0.2 + Math.random() * 0.2,
        reactDelay: 0,
    });
}

function updateAllies(dt) {
    for (const ally of allies) {
        if (ally.state === STATE.DEAD) continue;

        // Find nearest visible enemy
        let targetEnemy = null;
        let minDist = Infinity;
        for (const e of enemies) {
            if (e.state === STATE.DEAD) continue;
            const d = ally.pos.distanceTo(e.pos);
            if (d < minDist && canSeeEnemy(ally, e)) { minDist = d; targetEnemy = e; }
        }

        if (targetEnemy) {
            if (ally.state !== STATE.ATTACK) {
                ally.state = STATE.ATTACK;
                ally.reactDelay = 0.5 + Math.random() * 0.3;
                ally.peekPhase = 0;
                ally.peekTimer = 0.15 + Math.random() * 0.1;
            }
            ally.lastKnownEnemy = targetEnemy.pos.clone();
        } else {
            if (ally.state === STATE.ATTACK) ally.state = STATE.PATROL;
        }

        let moveSpeed = ally.speed;

        if (ally.state === STATE.PATROL) {
            const wp = ally.waypoints[ally.wpIndex];
            if (ally.pos.distanceTo(wp) < 0.8) ally.wpIndex = Math.min(ally.wpIndex + 1, ally.waypoints.length - 1);
            const dx = wp.x - ally.pos.x, dz = wp.z - ally.pos.z;
            const len = Math.sqrt(dx*dx + dz*dz);
            if (len > 0.1) {
                const nx = dx/len, nz = dz/len;
                const tf = Math.atan2(-nx, -nz);
                let diff = tf - ally.facing;
                while (diff >  Math.PI) diff -= Math.PI*2;
                while (diff < -Math.PI) diff += Math.PI*2;
                ally.facing += diff * Math.min(1, dt * 5);
                ally.mesh.rotation.y = ally.facing;
                ally.pos.x += nx * moveSpeed * 0.55 * dt;
                ally.pos.z += nz * moveSpeed * 0.55 * dt;
            }
        } else if (ally.state === STATE.ATTACK) {
            const target = targetEnemy ? targetEnemy.pos : ally.lastKnownEnemy;
            if (!target) { ally.state = STATE.PATROL; continue; }

            const dx = target.x - ally.pos.x, dz = target.z - ally.pos.z;
            const len = Math.sqrt(dx*dx + dz*dz);
            if (len > 0.1) {
                const tf = Math.atan2(-dx/len, -dz/len);
                let diff = tf - ally.facing;
                while (diff >  Math.PI) diff -= Math.PI*2;
                while (diff < -Math.PI) diff += Math.PI*2;
                ally.facing += diff * Math.min(1, dt * 9);
                ally.mesh.rotation.y = ally.facing;
            }

            if (ally.reactDelay > 0) ally.reactDelay -= dt;

            ally.peekTimer -= dt;
            if (ally.peekTimer <= 0) {
                ally.peekPhase = (ally.peekPhase + 1) % 4;
                _nextPeekTimer(ally);

                if (ally.peekPhase === 1 && ally.reactDelay <= 0 && targetEnemy) {
                    allyShoot(ally, targetEnemy);
                }
            }

            const right = new THREE.Vector3(-Math.cos(ally.facing), 0, Math.sin(ally.facing));
            if (ally.peekPhase === 0) {
                ally.pos.x += right.x * ally.speed * 0.85 * dt;
                ally.pos.z += right.z * ally.speed * 0.85 * dt;
            } else if (ally.peekPhase === 2) {
                ally.pos.x -= right.x * ally.speed * 0.85 * dt;
                ally.pos.z -= right.z * ally.speed * 0.85 * dt;
            }

            // Advance only if target is very close (stay behind cover)
            if (len > 10 && len < 25) {
                ally.pos.x += (dx/len) * ally.speed * 0.45 * dt;
                ally.pos.z += (dz/len) * ally.speed * 0.45 * dt;
            }
        }

        resolveWallCollision(ally.pos, 0.35);
        ally.walkPhase += dt * moveSpeed * 3;
        ally.mesh.position.set(ally.pos.x, Math.sin(ally.walkPhase) * 0.03, ally.pos.z);
    }
}

function hitEnemy(e, damage, fromAlly = false) {
    if (e.state === STATE.DEAD) return;
    e.health -= damage;
    // Flash
    e.bodyMesh.material.color.set(0xff2200);
    setTimeout(() => {
        if (e.state !== STATE.DEAD) e.bodyMesh.material.color.set(e.isZombie ? 0x3a2a1a : 0x1e3a0f);
    }, 80);

    // 피격 시: ATTACK 상태가 아니면 SCAN -> ATTACK
    e.alertTimer = 12;
    if (e.state !== STATE.ATTACK && e.state !== STATE.DEAD) {
        e.state = STATE.SCAN;
        e.scanStartFacing = e.facing;
        const scanAmt = Math.PI * (0.4 + Math.random() * 0.6);
        e.scanTotalAngle = (Math.random() < 0.5 ? 1 : -1) * scanAmt;
        e.scanTimer    = 0.6 + Math.random() * 0.4;
        e.scanDuration = e.scanTimer;
        e.scanToAttack = true;
    }
    if (e.state === STATE.ATTACK) {
        e.peekTimer = 0;
    }

    if (e.health <= 0) killEnemy(e, fromAlly);
}

function killEnemy(e, fromAlly = false) {
    e.state = STATE.DEAD;
    kills++;
    e.mesh.rotation.z = Math.PI / 2;
    e.mesh.position.y = e.baseY - 0.3;
    e.mesh.children.forEach(c => {
        if (c.material) c.material.color.set(0x111111);
    });
    document.getElementById('kill-counter').textContent = `KILLS: ${kills} / ${TOTAL_ENEMIES}`;
    if (!fromAlly) showMessage('ENEMY DOWN');

    GameEvents.emit('enemy_killed', { enemy: e, fromAlly });

    // Dead enemy cleanup after 3s
    setTimeout(() => {
        const idx = enemies.indexOf(e);
        if (idx !== -1) enemies.splice(idx, 1);
    }, 3000);

    const alive = enemies.filter(en => en.state !== STATE.DEAD).length;
    if (alive === 0) GameEvents.emit('all_enemies_dead');
}
