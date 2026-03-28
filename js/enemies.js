'use strict';

// =====================================================================
// ENEMIES
// =====================================================================

// Raycaster reuse vars (avoid per-frame allocation)
const _ray       = new THREE.Raycaster();
const _eyePos    = new THREE.Vector3();
const _playerEye = new THREE.Vector3();
const _toPlayer  = new THREE.Vector3();
const _fwd       = new THREE.Vector3();
const _rayDir    = new THREE.Vector3();
const FOV_COS    = Math.cos(THREE.MathUtils.degToRad(45));

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
        const gunMat    = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, shininess: 60 });
        const eyeMat    = new THREE.MeshBasicMaterial({ color: 0x111111 });

        const group = new THREE.Group();

        // Legs
        const legGeo = new THREE.BoxGeometry(0.14, 0.52, 0.15);
        const lLeg = new THREE.Mesh(legGeo, unifMat.clone());
        lLeg.position.set(-0.10, 0.30, 0);
        const rLeg = new THREE.Mesh(legGeo, unifMat.clone());
        rLeg.position.set( 0.10, 0.30, 0);

        // Boots
        const bootGeo = new THREE.BoxGeometry(0.15, 0.09, 0.19);
        const lBoot = new THREE.Mesh(bootGeo, bootMat);
        lBoot.position.set(-0.10, 0.045, 0.02);
        const rBoot = new THREE.Mesh(bootGeo, bootMat);
        rBoot.position.set( 0.10, 0.045, 0.02);

        // Torso + plate carrier vest
        const torsoGeo = new THREE.BoxGeometry(0.38, 0.72, 0.20);
        const torso = new THREE.Mesh(torsoGeo, unifMat.clone());
        torso.position.y = 0.92;
        const vestGeo = new THREE.BoxGeometry(0.36, 0.56, 0.18);
        const vest = new THREE.Mesh(vestGeo, vestMat); // bodyMesh (hit flash target)
        vest.position.set(0, 0.94, 0.01);

        // Arms
        const uArmGeo = new THREE.BoxGeometry(0.12, 0.25, 0.13);
        const lArmGeo = new THREE.BoxGeometry(0.10, 0.21, 0.11);
        const lUA = new THREE.Mesh(uArmGeo, unifMat.clone());
        lUA.position.set(-0.25, 1.10, 0);
        const lLA = new THREE.Mesh(lArmGeo, unifMat.clone());
        lLA.position.set(-0.25, 0.84, 0);
        const rUA = new THREE.Mesh(uArmGeo, unifMat.clone());
        rUA.position.set( 0.25, 1.10, 0);
        const rLA = new THREE.Mesh(lArmGeo, unifMat.clone());
        rLA.position.set( 0.25, 0.84, -0.08);
        rLA.rotation.x = -0.35;

        // Neck
        const neckGeo = new THREE.BoxGeometry(0.12, 0.13, 0.12);
        const neck = new THREE.Mesh(neckGeo, skinMat);
        neck.position.y = 1.32;

        // Head
        const headGeo = new THREE.BoxGeometry(0.21, 0.21, 0.21);
        const head = new THREE.Mesh(headGeo, skinMat);
        head.position.y = 1.50;

        // Helmet + brim
        const helmGeo = new THREE.BoxGeometry(0.25, 0.15, 0.27);
        const helm = new THREE.Mesh(helmGeo, helmetMat);
        helm.position.set(0, 1.60, 0.01);
        const brimGeo = new THREE.BoxGeometry(0.25, 0.04, 0.06);
        const brim = new THREE.Mesh(brimGeo, helmetMat);
        brim.position.set(0, 1.53, -0.145);

        // Eyes
        const eyeGeo = new THREE.BoxGeometry(0.05, 0.038, 0.022);
        const lEye = new THREE.Mesh(eyeGeo, eyeMat);
        lEye.position.set(-0.052, 1.50, -0.115);
        const rEye = new THREE.Mesh(eyeGeo, eyeMat);
        rEye.position.set( 0.052, 1.50, -0.115);

        // AK-47 gun group
        const woodMat = new THREE.MeshPhongMaterial({ color: 0x7a4f1a });
        const gunGroup = new THREE.Group();
        const gBody = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.075, 0.42), gunMat);
        const gBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.20), gunMat);
        gBarrel.position.set(0, 0.015, -0.31);
        const gMag1 = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.08, 0.045), gunMat);
        gMag1.position.set(0, -0.075, -0.02);
        const gMag2 = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.05, 0.04), gunMat);
        gMag2.position.set(0, -0.13, -0.045);
        gMag2.rotation.x = 0.35;
        const gStock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.065, 0.18), woodMat);
        gStock.position.set(0, -0.008, 0.28);
        const gHG = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.045, 0.16), woodMat);
        gHG.position.set(0, -0.015, -0.16);
        gunGroup.add(gBody, gBarrel, gMag1, gMag2, gStock, gHG);
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
    const gunMat    = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, shininess: 60 });

    const group = new THREE.Group();

    const legGeo  = new THREE.BoxGeometry(0.14, 0.52, 0.15);
    const lLeg = new THREE.Mesh(legGeo, clothMat.clone()); lLeg.position.set(-0.10, 0.30, 0);
    const rLeg = new THREE.Mesh(legGeo, clothMat.clone()); rLeg.position.set( 0.10, 0.30, 0);
    const bootGeo = new THREE.BoxGeometry(0.15, 0.09, 0.19);
    const lBoot = new THREE.Mesh(bootGeo, bootMat); lBoot.position.set(-0.10, 0.045, 0.02);
    const rBoot = new THREE.Mesh(bootGeo, bootMat); rBoot.position.set( 0.10, 0.045, 0.02);
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.72, 0.20), clothMat.clone());
    torso.position.y = 0.92;
    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.56, 0.18), isZombie ? clothMat : vestMat);
    vest.position.set(0, 0.94, 0.01);
    const uArmGeo = new THREE.BoxGeometry(0.12, 0.25, 0.13);
    const lArmGeo = new THREE.BoxGeometry(0.10, 0.21, 0.11);
    const lUA = new THREE.Mesh(uArmGeo, clothMat.clone()); lUA.position.set(-0.25, 1.10, 0);
    const lLA = new THREE.Mesh(lArmGeo, clothMat.clone()); lLA.position.set(-0.25, 0.84, 0);
    const rUA = new THREE.Mesh(uArmGeo, clothMat.clone()); rUA.position.set( 0.25, 1.10, 0);
    const rLA = new THREE.Mesh(lArmGeo, clothMat.clone()); rLA.position.set( 0.25, 0.84, -0.08);
    rLA.rotation.x = -0.35;
    // 좀비: 팔을 앞으로 뻗음
    if (isZombie) {
        lUA.position.set(-0.22, 1.15, -0.12); lUA.rotation.x = -0.9;
        rUA.position.set( 0.22, 1.15, -0.12); rUA.rotation.x = -0.9;
        lLA.position.set(-0.22, 0.90, -0.30); lLA.rotation.x = -0.9;
        rLA.position.set( 0.22, 0.90, -0.30); rLA.rotation.x = -0.9;
    }
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.13, 0.12), skinMat);
    neck.position.y = 1.32;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.21, 0.21), skinMat);
    head.position.y = 1.50;
    if (isZombie) {
        head.position.set(0, 1.45, -0.06);
        head.rotation.x = 0.35;
    }
    const helm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.27), helmetMat);
    helm.position.set(0, 1.60, 0.01);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.04, 0.06), helmetMat);
    brim.position.set(0, 1.53, -0.145);

    // 눈 (좀비: 빨간 눈, 병사: 검은 눈)
    const eyeMat = new THREE.MeshBasicMaterial({ color: isZombie ? 0xcc0000 : 0x111111 });
    const eyeGeo = new THREE.BoxGeometry(0.05, 0.038, 0.022);
    const lEye = new THREE.Mesh(eyeGeo, eyeMat);
    const rEye = new THREE.Mesh(eyeGeo, eyeMat);
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
        const woodMat = new THREE.MeshPhongMaterial({ color: 0x7a4f1a });
        const gunGroup = new THREE.Group();
        const gBody   = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.075, 0.42), gunMat);
        const gBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.20), gunMat);
        gBarrel.position.set(0, 0.015, -0.31);
        const gMag    = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.08, 0.045), gunMat);
        gMag.position.set(0, -0.075, -0.02);
        const gStock  = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.065, 0.18), woodMat);
        gStock.position.set(0, -0.008, 0.28);
        gunGroup.add(gBody, gBarrel, gMag, gStock);
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
        shootTimer: isZombie ? 0 : (1 + Math.random() * 0.5),
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
            target = e.waypoints[e.wpIndex];
            moveSpeed = e.speed * 0.5;
            if (e.pos.distanceTo(target) < 0.6) e.wpIndex ^= 1;
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
                    e.shootTimer = 0;
                }
            } else if (seesTarget) {
                // Peek-and-Shoot
                e.peekTimer -= dt;
                if (e.peekTimer <= 0) {
                    e.peekPhase = (e.peekPhase + 1) % 4;
                    if      (e.peekPhase === 0) e.peekTimer = 0.15 + Math.random() * 0.10;
                    else if (e.peekPhase === 1) e.peekTimer = 0.30 + Math.random() * 0.70;
                    else if (e.peekPhase === 2) e.peekTimer = 0.15 + Math.random() * 0.10;
                    else                        e.peekTimer = 0.30 + Math.random() * 0.70;

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
        spawnBullet(origin, dir, ally.damage, true, 140);
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
    showMessage('ALLY DOWN');
}

function spawnAllyAt(x, z) {
    const skinMat   = new THREE.MeshPhongMaterial({ color: 0xb07040 });
    const clothMat  = new THREE.MeshPhongMaterial({ color: 0x2a3a5a });
    const vestMat   = new THREE.MeshPhongMaterial({ color: 0x3a4e6a });
    const helmetMat = new THREE.MeshPhongMaterial({ color: 0x1a2a4a });
    const bootMat   = new THREE.MeshPhongMaterial({ color: 0x111111 });
    const gunMat    = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, shininess: 60 });

    const group = new THREE.Group();
    const legGeo = new THREE.BoxGeometry(0.14, 0.52, 0.15);
    const lLeg = new THREE.Mesh(legGeo, clothMat.clone()); lLeg.position.set(-0.10, 0.30, 0);
    const rLeg = new THREE.Mesh(legGeo, clothMat.clone()); rLeg.position.set( 0.10, 0.30, 0);
    const bootGeo = new THREE.BoxGeometry(0.15, 0.09, 0.19);
    const lBoot = new THREE.Mesh(bootGeo, bootMat); lBoot.position.set(-0.10, 0.045, 0.02);
    const rBoot = new THREE.Mesh(bootGeo, bootMat); rBoot.position.set( 0.10, 0.045, 0.02);
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.72, 0.20), clothMat.clone());
    torso.position.y = 0.92;
    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.56, 0.18), vestMat);
    vest.position.set(0, 0.94, 0.01);
    const uArmGeo = new THREE.BoxGeometry(0.12, 0.25, 0.13);
    const lArmGeo = new THREE.BoxGeometry(0.10, 0.21, 0.11);
    const lUA = new THREE.Mesh(uArmGeo, clothMat.clone()); lUA.position.set(-0.25, 1.10, 0);
    const lLA = new THREE.Mesh(lArmGeo, clothMat.clone()); lLA.position.set(-0.25, 0.84, 0);
    const rUA = new THREE.Mesh(uArmGeo, clothMat.clone()); rUA.position.set( 0.25, 1.10, 0);
    const rLA = new THREE.Mesh(lArmGeo, clothMat.clone()); rLA.position.set( 0.25, 0.84, -0.08);
    rLA.rotation.x = -0.35;
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.13, 0.12), skinMat); neck.position.y = 1.32;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.21, 0.21), skinMat); head.position.y = 1.50;
    const helm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.27), helmetMat); helm.position.set(0, 1.60, 0.01);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.04, 0.06), helmetMat); brim.position.set(0, 1.53, -0.145);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const eyeGeo = new THREE.BoxGeometry(0.05, 0.038, 0.022);
    const lEye = new THREE.Mesh(eyeGeo, eyeMat); lEye.position.set(-0.052, 1.50, -0.115);
    const rEye = new THREE.Mesh(eyeGeo, eyeMat); rEye.position.set( 0.052, 1.50, -0.115);
    const woodMat = new THREE.MeshPhongMaterial({ color: 0x7a4f1a });
    const gunGroup = new THREE.Group();
    const gBody   = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.075, 0.42), gunMat);
    const gBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.20), gunMat);
    gBarrel.position.set(0, 0.015, -0.31);
    const gMag = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.08, 0.045), gunMat);
    gMag.position.set(0, -0.075, -0.02);
    const gStock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.065, 0.18), woodMat);
    gStock.position.set(0, -0.008, 0.28);
    gunGroup.add(gBody, gBarrel, gMag, gStock);
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
        waypoints: [
            new THREE.Vector3(x + (Math.random()-0.5)*5, 0, 38),
            new THREE.Vector3(x + (Math.random()-0.5)*4, 0, 6),
        ],
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
            if (ally.pos.distanceTo(wp) < 0.8) ally.wpIndex ^= 1;
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
                if      (ally.peekPhase === 0) ally.peekTimer = 0.15 + Math.random() * 0.10;
                else if (ally.peekPhase === 1) ally.peekTimer = 0.30 + Math.random() * 0.70;
                else if (ally.peekPhase === 2) ally.peekTimer = 0.15 + Math.random() * 0.10;
                else                           ally.peekTimer = 0.30 + Math.random() * 0.70;

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

            // Advance if target too far
            if (len > 28 && len > 0.1) {
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

    // Dead enemy cleanup after 3s
    setTimeout(() => {
        const idx = enemies.indexOf(e);
        if (idx !== -1) enemies.splice(idx, 1);
    }, 3000);

    const alive = enemies.filter(en => en.state !== STATE.DEAD).length;
    if (alive === 0) {
        setTimeout(() => {
            showMessage('\u2605 MISSION COMPLETE \u2605', 6000);
            setTimeout(() => {
                document.getElementById('overlay').innerHTML = `
                    <h1 style="color:#0f0;font-size:2.5em">MISSION COMPLETE</h1>
                    <div class="subtitle">ALL TARGETS ELIMINATED</div>
                    <p style="color:#aaa;margin:20px 0">KILLS: ${kills} / ${TOTAL_ENEMIES}</p>
                    <button id="start-btn" onclick="location.reload()">&#9654;  PLAY AGAIN</button>`;
                document.getElementById('overlay').style.display = 'flex';
                document.exitPointerLock();
                gamePaused = true;
            }, 3000);
        }, 1000);
    }
}
