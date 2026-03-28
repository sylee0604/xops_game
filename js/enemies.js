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
        isZombie,
    });
}

function updateEnemies(dt) {
    for (const e of enemies) {
        if (e.state === STATE.DEAD) continue;

        const sees = canSeePlayer(e);
        // distanceSq for range comparisons (avoid sqrt where possible)
        const dx0 = e.pos.x - player.pos.x;
        const dz0 = e.pos.z - player.pos.z;
        const distSq = dx0*dx0 + dz0*dz0;
        const dist = Math.sqrt(distSq); // needed for movement math

        // --- State machine ---
        if (sees) {
            e.lastKnownPlayer = player.pos.clone();
            e.alertTimer = 10;
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
            }
        }

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
            target = e.lastKnownPlayer || player.pos;
            if (sees) e.lastKnownPlayer = player.pos.clone();

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
            } else if (sees) {
                // Peek-and-Shoot
                e.peekTimer -= dt;
                if (e.peekTimer <= 0) {
                    e.peekPhase = (e.peekPhase + 1) % 4;
                    if      (e.peekPhase === 0) e.peekTimer = 0.18 + Math.random() * 0.06;
                    else if (e.peekPhase === 1) e.peekTimer = 0.52 + Math.random() * 0.08;
                    else if (e.peekPhase === 2) e.peekTimer = 0.18 + Math.random() * 0.06;
                    else                        e.peekTimer = 0.52 + Math.random() * 0.08;

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

                // 거리 유지 (use distSq for comparisons)
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
    const dist = e.pos.distanceTo(player.pos);
    // 탄퍼짐: 기본값 증가 (0.03 → 0.07)
    const spread = 0.07 + dist * 0.0025;

    function _fire() {
        if (e.state === STATE.DEAD) return;
        // 몸통 조준: player.pos.y(눈높이) - 0.5 = 가슴/복부
        const tgt = new THREE.Vector3(
            player.pos.x + (Math.random()-0.5) * spread * 5,
            (player.pos.y - 0.5) + (Math.random()-0.5) * spread * 3,
            player.pos.z + (Math.random()-0.5) * spread * 5
        );
        const origin = new THREE.Vector3(e.pos.x, e.baseY + 1.50, e.pos.z);
        const dir = new THREE.Vector3().subVectors(tgt, origin).normalize();
        spawnBullet(origin, dir, e.damage, false, 140);
        if (dist < 60) playEnemyGunshot(1);
    }

    const count = e.shootCount;
    e.shootCount++;

    if (count === 0) {
        // 초탄: 1발
        _fire();
    } else if (count % 2 === 1) {
        // 홀수 회차: 2발 점사
        _fire();
        setTimeout(_fire, 120);
    } else {
        // 짝수 회차: 1발
        _fire();
    }
}

function hitEnemy(e, damage) {
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

    if (e.health <= 0) killEnemy(e);
}

function killEnemy(e) {
    e.state = STATE.DEAD;
    kills++;
    e.mesh.rotation.z = Math.PI / 2;
    e.mesh.position.y = e.baseY - 0.3;
    e.mesh.children.forEach(c => {
        if (c.material) c.material.color.set(0x111111);
    });
    document.getElementById('kill-counter').textContent = `KILLS: ${kills} / ${TOTAL_ENEMIES}`;
    showMessage('ENEMY DOWN');

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
