'use strict';

// =====================================================================
// PLAYER
// =====================================================================

function updatePlayer(dt) {
    const w = player.weapons[player.currentWeapon];
    w.shootTimer = Math.max(0, w.shootTimer - dt);

    // Recoil / spread recovery
    player.recoilPitch  *= Math.pow(0.001, dt);
    player.currentSpread = Math.max(0, player.currentSpread - dt * 0.18);

    // Muzzle flash decay
    if (muzzleLightTimer > 0) {
        muzzleLightTimer -= dt;
        if (muzzleLightTimer <= 0) muzzleLight.intensity = 0;
    }

    // Direction vectors
    _tv1.set(-Math.sin(player.yaw), 0, -Math.cos(player.yaw)); // fwd
    _tv2.set( Math.cos(player.yaw), 0, -Math.sin(player.yaw));  // right
    const fwd = _tv1;
    const right = _tv2;

    const crouching = keys['ShiftLeft'] || keys['ShiftRight'];
    const speed = crouching ? CROUCH_SPEED : MOVE_SPEED;
    let moving = false;

    _tv3.set(0, 0, 0); // acc
    const acc = _tv3;
    if (keys['KeyW'] || keys['ArrowUp'])    { acc.add(fwd);   moving = true; }
    if (keys['KeyS'] || keys['ArrowDown'])  { acc.sub(fwd);   moving = true; }
    if (keys['KeyA'] || keys['ArrowLeft'])  { acc.sub(right); moving = true; }
    if (keys['KeyD'] || keys['ArrowRight']) { acc.add(right); moving = true; }

    const stealth = crouching && moving; // 앉아서 이동할 때만 스텔스

    if (acc.lengthSq() > 0) acc.normalize();

    // 공중 + Shift = 감속 없음, 공중 = 마찰 최소, 지상 = 빠른 감속
    if (!player.onGround && crouching) {
        // 속도 유지 (방향 입력만 반영, 현재 속력 보존)
        const hspd = Math.sqrt(player.vel.x ** 2 + player.vel.z ** 2);
        if (acc.lengthSq() > 0 && hspd > 0) {
            // 에어스트레이프: 현재 속력 유지하면서 방향만 살짝 보정
            const wish = acc.clone().multiplyScalar(speed);
            player.vel.x += (wish.x - player.vel.x) * Math.min(1, dt * 2);
            player.vel.z += (wish.z - player.vel.z) * Math.min(1, dt * 2);
            // 속력이 줄지 않도록 재정규화
            const newSpd = Math.sqrt(player.vel.x ** 2 + player.vel.z ** 2);
            if (newSpd > 0) {
                const keep = Math.max(hspd, newSpd);
                player.vel.x = (player.vel.x / newSpd) * keep;
                player.vel.z = (player.vel.z / newSpd) * keep;
            }
        }
    } else {
        const friction = player.onGround ? 18 : 4;
        player.vel.x += (acc.x * speed - player.vel.x) * Math.min(1, dt * friction);
        player.vel.z += (acc.z * speed - player.vel.z) * Math.min(1, dt * friction);
    }

    // 공중에서 Shift 누르면 bhop 플래그
    if (!player.onGround && crouching) bhopFlag = true;

    // bhop 윈도우 감소
    if (bhopWindow > 0) bhopWindow -= dt;

    // Gravity + jump
    if (!player.onGround) player.vel.y += GRAVITY * dt;

    const wasOnGround = player.onGround;

    // Move X
    player.pos.x += player.vel.x * dt;
    resolveWallCollision(player.pos, PLAYER_RADIUS, player.pos.y - PLAYER_HEIGHT);

    // Move Z
    player.pos.z += player.vel.z * dt;
    resolveWallCollision(player.pos, PLAYER_RADIUS, player.pos.y - PLAYER_HEIGHT);

    // Move Y  — getFloorY로 밟을 수 있는 표면 높이 반영
    player.pos.y += player.vel.y * dt;
    const _feetY     = player.pos.y - PLAYER_HEIGHT;
    const _surfaceY  = getFloorY(player.pos.x, player.pos.z, _feetY);
    const _groundLvl = _surfaceY + PLAYER_HEIGHT;
    if (player.pos.y <= _groundLvl) {
        player.pos.y = _groundLvl;
        player.vel.y = 0;
        player.onGround = true;
    } else {
        player.onGround = false;
    }

    // 항구맵: 바다(y < -4)에 빠지면 낙사 (부두 아래로 떨어진 후 사망)
    if (currentMap === 'harbor' && player.pos.y < -4) {
        damagePlayer(999);
        return;
    }

    // 착지 감지: bhop 플래그 있으면 점프 윈도우 열기
    if (!wasOnGround && player.onGround && bhopFlag) {
        bhopWindow = 0.18; // 180ms 안에 Space 누르면 bhop 성공
        bhopFlag = false;
    }

    // 점프 처리
    if (keys['Space'] && player.onGround) {
        if (bhopWindow > 0) {
            // bhop 성공: 수평 속도 유지 + 소폭 부스트
            const hspd = Math.sqrt(player.vel.x ** 2 + player.vel.z ** 2);
            if (hspd > 0.1) {
                const boosted = Math.min(hspd * 1.12, BHOP_MAX_SPEED);
                player.vel.x = (player.vel.x / hspd) * boosted;
                player.vel.z = (player.vel.z / hspd) * boosted;
            }
            bhopWindow = 0;
        }
        player.vel.y = JUMP_FORCE;
        player.onGround = false;
    }

    // Head bob
    if (moving && player.onGround) {
        walkPhase += dt * (stealth ? 5 : 9);
    }

    // 플레이어 발소리
    if (moving && player.onGround) {
        _stepTimer -= dt;
        if (_stepTimer <= 0) {
            _stepTimer = crouching ? 0.60 : 0.38;
            playPlayerStep(crouching);
        }
    } else {
        _stepTimer = 0; // 멈추면 즉시 리셋 (다시 움직이면 바로 한 발)
    }
    const bob = moving ? Math.sin(walkPhase) * (stealth ? 0.012 : 0.025) : 0;
    const tilt = moving ? Math.sin(walkPhase * 0.5) * 0.008 : 0;

    // 우클릭 떼면 ADS 잠금 해제
    if (!keys['mouse2']) player.adsLocked = false;
    // ADS 상태 — 재장전 중이거나 잠금 상태면 강제 해제
    const adsActive = !!keys['mouse2'] && !w.reloading && !player.adsLocked && !w.melee;

    // Weapon viewmodel bob + ADS 조준 애니메이션
    const wm = weaponModels[player.currentWeapon];
    if (wm) {
        const bp = weaponBasePos[player.currentWeapon];
        const br = weaponBaseRot[player.currentWeapon];
        const bobX = moving && !adsActive ? Math.sin(walkPhase * 2) * 0.007 : 0;
        const bobY = moving && !adsActive ? Math.abs(Math.sin(walkPhase)) * -0.012 : 0;

        // ADS시 무기를 화면 중앙으로 이동
        // adsY = -(가늠쇠 로컬 y * scale), 가늠쇠가 화면 정중앙에 오도록 역산
        const adsY = [-0.126, -0.075, -0.060, -0.087, -0.084, -0.080, -0.070, -0.072]; // DE / AK / Knife / AWP / M14 / MP5 / SPAS / M249
        let tpx = adsActive ? 0 : bp[0] + bobX;
        let tpy = adsActive ? adsY[player.currentWeapon] : bp[1] + bobY;
        let tpz = adsActive ? bp[2] + 0.04 : bp[2];
        let trx = adsActive ? 0 : br[0]; // ADS 시 그룹 회전 없음 → 총신이 정면 향함
        let tryaw = adsActive ? 0 : br[1];
        let trz = adsActive ? 0 : br[2];

        // 칼 찌르기 애니메이션 — 빠르게 전진, 천천히 복귀
        if (player.currentWeapon === 2 && knifeSwingTimer > 0) {
            knifeSwingTimer = Math.max(0, knifeSwingTimer - dt);
            const t = 1 - knifeSwingTimer / player.weapons[2].fireRate; // 0→1
            const thrust = t < 0.30
                ? t / 0.30              // 빠른 전진 0→1
                : 1 - (t - 0.30) / 0.70; // 느린 복귀 1→0
            tpz = bp[2] - thrust * 0.24;  // 앞으로 크게 이동
            tpy = bp[1] - thrust * 0.04;  // 살짝 아래로
            trx = br[0] - thrust * 0.5;   // 칼날 앞으로 기울기
        }

        const spd = Math.min(1, dt * (player.currentWeapon === 2 && knifeSwingTimer > 0 ? 28 : 18));
        wm.position.x += (tpx - wm.position.x) * spd;
        wm.position.y += (tpy - wm.position.y) * spd;
        wm.position.z += (tpz - wm.position.z) * spd;
        wm.rotation.x += (trx - wm.rotation.x) * spd;
        wm.rotation.y += (tryaw - wm.rotation.y) * spd;
        wm.rotation.z += (trz - wm.rotation.z) * spd;

    }

    // 총기 조준 시 크로스헤어 숨김 (가늠자/가늠쇠로 조준, 나이프 제외)
    document.getElementById('crosshair').style.opacity = adsActive ? '0' : '1';

    // ADS FOV lerp — 줌인: dt*9(≈300ms), 줌아웃: dt*12(≈230ms)
    const targetFov  = adsActive ? (w.adsFov ?? 35) : 72;
    const lerpFactor = Math.min(1, dt * (targetFov < camera.fov ? 9 : 12));
    camera.fov += (targetFov - camera.fov) * lerpFactor;
    camera.updateProjectionMatrix();

    // 스코프 무기 (AWP=3, M14=4): FOV가 목표값의 80% 이상 수렴했을 때만 오버레이 표시
    // → mouse2 눌러도 즉시 전환되지 않고, 총이 눈 앞으로 올라오는 느낌
    const isScopeWeapon = player.currentWeapon === 3 || player.currentWeapon === 4;
    const fovRange      = 72 - (w.adsFov ?? 35);
    const isScoped = adsActive && isScopeWeapon
        && fovRange > 0 && (camera.fov - targetFov) < fovRange * 0.20;

    if (isScoped) {
        _scopeCanvas.style.display = 'block';
        drawScopeOverlay(player.currentWeapon === 3);
        if (wm) wm.visible = false;
    } else {
        _scopeCanvas.style.display = 'none';
        if (wm) wm.visible = !player.weapons[player.currentWeapon].dropped;
    }
    player.adsInScope = isScoped;

    // ADS 중엔 빠른 회복만, 강제 0 제거 (해제 후 잔존 spread 방지)
    if (adsActive) player.currentSpread = Math.max(0, player.currentSpread - dt * 1.2);

    const camHeight = crouching ? CROUCH_HEIGHT - PLAYER_HEIGHT : 0; // 앉으면 시야 낮아짐
    camera.position.set(player.pos.x, player.pos.y + bob + camHeight, player.pos.z);
    camera.rotation.set(
        player.pitch + player.recoilPitch * 0.04,
        player.yaw,
        tilt,
        'YXZ'
    );

    // Muzzle light follows camera
    _tv1.set(0.15, -0.05, -0.3).applyEuler(camera.rotation); // muzzleOffset
    const muzzleOffset = _tv1;
    muzzleLight.position.copy(camera.position).add(muzzleOffset);

    // Auto fire
    if (keys['mouse0'] && w.auto) playerShoot();

    // State bar
    const sb = document.getElementById('state-bar');
    player.isStealth = stealth;
    if (crouching) { sb.textContent = stealth ? '[ STEALTH ]' : '[ CROUCH ]'; sb.className = 'stealth'; }
    else { sb.textContent = ''; sb.className = ''; }
}

let _stepTimer = 0; // 다음 발소리까지 남은 시간

function setupInput() {
    document.addEventListener('keydown', e => {
        keys[e.code] = true;
        for (let _k = 1; _k <= 8; _k++) {
            if (e.code === 'Digit' + _k) {
                const _idx = getWeaponForKey(_k);
                if (_idx >= 0) switchWeapon(_idx);
            }
        }
        if (e.code === 'KeyR') startReload();
        if (e.code === 'KeyG') dropWeapon();
        if (e.code === 'KeyF') {
            enemiesEnabled = !enemiesEnabled;
            for (const en of enemies) {
                en.mesh.visible = enemiesEnabled;
                if (!enemiesEnabled) en.state = 'PATROL';
            }
            showMessage(enemiesEnabled ? 'ENEMIES ON' : 'ENEMIES OFF');
        }
        if (e.code === 'Escape') {
            if (pointerLocked) document.exitPointerLock();
        }
    });
    document.addEventListener('keyup', e => { keys[e.code] = false; });

    document.addEventListener('mousemove', e => {
        if (!pointerLocked) return;
        player.yaw   -= e.movementX * 0.0022;
        player.pitch -= e.movementY * 0.0022;
        player.pitch  = Math.max(-Math.PI * 0.42, Math.min(Math.PI * 0.42, player.pitch));
    });

    document.addEventListener('mousedown', e => {
        if (!pointerLocked) return;
        if (e.button === 0) { keys['mouse0'] = true; playerShoot(); }
        if (e.button === 2) keys['mouse2'] = !keys['mouse2'];
    });
    document.addEventListener('mouseup', e => {
        if (e.button === 0) keys['mouse0'] = false;
    });
    document.addEventListener('contextmenu', e => e.preventDefault());

    document.addEventListener('pointerlockchange', () => {
        pointerLocked = document.pointerLockElement === renderer.domElement;
    });

    renderer.domElement.addEventListener('click', () => {
        if (gameStarted && !gamePaused) renderer.domElement.requestPointerLock();
    });
}
