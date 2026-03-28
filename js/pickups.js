'use strict';

// =====================================================================
// PICKUPS
// =====================================================================

// 뷰모델과 동일한 무기 지오메트리 그룹 생성 (픽업/드롭 공용)
function buildPickupGroup(weaponIndex) {
    const g = buildWeaponGroup(weaponIndex);
    g.scale.setScalar(1.5);
    return g;
}

// persistent=true 이면 줍고도 사라지지 않음 (훈련장 책상용)
function createPickup(x, z, weaponIndex, ammo, deskY) {
    const group = buildPickupGroup(weaponIndex);
    const onDesk = (deskY !== undefined);
    // 바닥: 무기 폭(약 0.09~0.13)의 절반 -> 살짝 들어올려 박히지 않도록
    const groundY = [0.09, 0.07, 0.06, 0.05, 0.05, 0.06, 0.07, 0.06][weaponIndex] ?? 0.06;
    const y = onDesk ? deskY : groundY;

    group.position.set(x, y, z);
    if (!onDesk) {
        // 옆으로 눕혀서 측면 프로파일이 보이도록
        group.rotation.z = Math.PI / 2;                  // 총이 옆으로 쓰러짐
        group.rotation.y = Math.random() * Math.PI * 2; // 방향 랜덤
    } else {
        // 책상 위: 살짝 기울여 전시
        group.rotation.y = -0.3;
        group.rotation.z = 0.12;
    }
    scene.add(group);

    const glow = new THREE.PointLight(0x44aaff, 0.7, 2.5);
    glow.position.set(x, y + 0.5, z);
    scene.add(glow);

    pickups.push({
        mesh: group, glow,
        pos: new THREE.Vector3(x, 0, z),
        weaponIndex, ammo, active: true,
        persistent: onDesk
    });
}

function spawnPickups() {
    // compound 맵 입구: AK(1) / MP5(5) / SPAS(6) / AWP(3) 일렬 배치
    // 플레이어 시작(x=4.5, z=4.5)에서 정면(+z)으로 3유닛 앞
    const lineup = [1, 5, 6, 3];
    const startX = 3.5, lineZ = 7.5, spacing = 1.5;
    lineup.forEach((wIdx, i) => {
        const def = WEAPON_DEFS[wIdx];
        createPickup(startX + i * spacing, lineZ, wIdx, def.ammo + def.reserve);
    });
}

function updatePickups() {
    for (const pk of pickups) {
        if (!pk.active) continue;
        const d = new THREE.Vector2(player.pos.x - pk.pos.x, player.pos.z - pk.pos.z).length();
        if (d >= 1.5) continue;

        if (currentMap === 'combat') {
            // ── carry-slot 픽업 (compound 맵 전용) ──
            let slotIdx = -1;
            if (player.carrySlots[0] === null) slotIdx = 0;
            else if (player.carrySlots[1] === null) slotIdx = 1;

            if (slotIdx === -1) {
                showMessage('INVENTORY FULL  /  G: 버리기');
                continue;
            }
            const w = player.weapons[pk.weaponIndex];
            const def = WEAPON_DEFS[pk.weaponIndex];
            w.ammo    = Math.min(pk.ammo, def.maxAmmo);
            w.reserve = Math.min(pk.ammo - w.ammo, def.reserve);
            w.reloading = false;
            w.dropped = false;
            player.carrySlots[slotIdx] = pk.weaponIndex;
            if (slotIdx === 0) switchWeapon(pk.weaponIndex);
            showMessage(w.name);
        } else {
            // ── 기존 픽업 로직 (harbor / tunnel / training) ──
            const w = player.weapons[pk.weaponIndex];
            const _def = WEAPON_DEFS[pk.weaponIndex];
            const maxAmmo    = _def ? _def.ammo    : 1;
            const maxReserve = _def ? _def.reserve : 0;
            if (w.dropped || w.ammo < maxAmmo || w.reserve < maxReserve) {
                const wasDrop = w.dropped;
                if (wasDrop) {
                    w.ammo    = Math.min(pk.ammo, maxAmmo);
                    w.reserve = Math.min(Math.max(0, pk.ammo - w.ammo), maxReserve);
                } else {
                    w.ammo    = maxAmmo;
                    w.reserve = maxReserve;
                }
                w.reloading = false;
                w.dropped = false;
                if (wasDrop && pk.weaponIndex === player.currentWeapon) updateWeaponViewModel();
                const names = ['PISTOL', 'ASSAULT RIFLE', 'KNIFE', 'AWP', 'M14 EBR', 'MP5', 'SPAS-12', 'M249'];
                showMessage(names[pk.weaponIndex] + ' PICKED UP');
            }
        }

        if (!pk.persistent) {
            pk.active = false;
            scene.remove(pk.mesh);
            scene.remove(pk.glow);
        }
    }
}

function dropWeapon() {
    if (player.currentWeapon === 2) return; // 칼은 버릴 수 없음
    const w = player.weapons[player.currentWeapon];
    if (w.dropped) return;

    const dropX = player.pos.x - Math.sin(player.yaw) * 2.5;
    const dropZ = player.pos.z - Math.cos(player.yaw) * 2.5;
    createPickup(dropX, dropZ, player.currentWeapon, w.ammo + w.reserve);
    const name = w.name;
    w.ammo = 0; w.reserve = 0; w.reloading = false; w.dropped = true;

    let next = 2; // 기본 폴백: 칼
    if (currentMap === 'combat') {
        // carry-slot에서 제거 후 압축
        const slotIdx = player.carrySlots.indexOf(player.currentWeapon);
        if (slotIdx !== -1) player.carrySlots[slotIdx] = null;
        if (player.carrySlots[0] === null && player.carrySlots[1] !== null) {
            player.carrySlots[0] = player.carrySlots[1];
            player.carrySlots[1] = null;
        }
        next = player.carrySlots[0] ?? player.carrySlots[1] ?? 2;
    } else {
        const validSlots = [1,2,3].map(k => getWeaponForKey(k)).filter(i => i >= 0);
        next = validSlots.find(i => i !== player.currentWeapon && !player.weapons[i].dropped) ?? 2;
    }
    switchWeapon(next);
    showMessage(name + ' DROPPED');
}
