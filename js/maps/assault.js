'use strict';

// =====================================================================
// ASSAULT MAP  (75 deep × 39 wide)
// =====================================================================

function buildAssaultMap() {
    // Morning sky
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0xa8d8f0, 0.005);

    // Morning lighting: warm angled sun
    scene.add(new THREE.AmbientLight(0xfff0d0, 1.1));
    const sun = new THREE.DirectionalLight(0xffe090, 2.0);
    sun.position.set(20, 30, -5);
    sun.castShadow = true;
    scene.add(sun);
    muzzleLight = new THREE.PointLight(0xffcc44, 0, 6);
    scene.add(muzzleLight);

    const W = 39, D = 75;

    // Sandy floor
    const floorMat = new THREE.MeshLambertMaterial({ color: 0xd4b07a });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W + 20, D + 20), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(W / 2, 0, D / 2);
    floor.receiveShadow = true;
    scene.add(floor);
    addPlatform(-10, W + 10, -10, D + 10, 0);

    // Boundary collision walls
    for (const [cx, cz, w, d] of [
        [W/2,   -0.5,  W+4, 1],
        [W/2,   D+0.5, W+4, 1],
        [-0.5,  D/2,   1,   D+4],
        [W+0.5, D/2,   1,   D+4],
    ]) {
        walls.push({ box: new THREE.Box3(
            new THREE.Vector3(cx-w/2, 0, cz-d/2),
            new THREE.Vector3(cx+w/2, 5, cz+d/2)
        )});
    }

    // ── Sandbag cover mid-map (z ≈ 33–45) ──
    const bagMat1 = new THREE.MeshLambertMaterial({ color: 0xb89458 });
    const bagMat2 = new THREE.MeshLambertMaterial({ color: 0x9a7840 });

    function addSandbagWall(cx, cz, cols, stackH) {
        const BW = 0.62, BD = 0.36, BH = 0.24;
        for (let h = 0; h < stackH; h++) {
            const mat = (h % 2 === 0) ? bagMat1 : bagMat2;
            const offset = (h % 2) * (BW * 0.45);
            for (let c = 0; c < cols; c++) {
                const geo = new THREE.BoxGeometry(
                    BW + Math.random() * 0.04,
                    BH + Math.random() * 0.03,
                    BD + Math.random() * 0.04
                );
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(
                    cx + (c - (cols-1)/2) * BW + offset + (Math.random()-0.5)*0.04,
                    h * BH + BH/2,
                    cz + (Math.random()-0.5)*0.04
                );
                mesh.rotation.y = (Math.random()-0.5) * 0.12;
                scene.add(mesh);
            }
        }
        const totalW = cols * BW + 0.4;
        const totalH = stackH * BH;
        const box = new THREE.Box3(
            new THREE.Vector3(cx - totalW/2, 0, cz - BD),
            new THREE.Vector3(cx + totalW/2, totalH, cz + BD)
        );
        walls.push({ box });
        const wMesh = new THREE.Mesh(
            new THREE.BoxGeometry(totalW, totalH, BD * 2),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        wMesh.position.set(cx, totalH/2, cz);
        scene.add(wMesh);
        wallMeshList.push(wMesh);
        addPlatform(cx - totalW/2, cx + totalW/2, cz - BD, cz + BD, totalH);
    }

    // Left cluster
    addSandbagWall(5.5,  35, 5, 3);
    addSandbagWall(5.5,  40, 4, 2);
    // Center-left
    addSandbagWall(13.5, 37, 5, 3);
    addSandbagWall(13.5, 42, 4, 4);
    // Center (two walls with gap)
    addSandbagWall(19.5, 33, 3, 4);
    addSandbagWall(19.5, 44, 3, 4);
    // Center-right
    addSandbagWall(25.5, 37, 5, 3);
    addSandbagWall(25.5, 42, 4, 4);
    // Right cluster
    addSandbagWall(33.5, 35, 5, 3);
    addSandbagWall(33.5, 40, 4, 2);

    // Scattered rocks for visual texture
    const rockMat = new THREE.MeshLambertMaterial({ color: 0x8a7560 });
    for (const [rx, rz, rs] of [
        [7, 18, 0.28], [31, 20, 0.35], [15, 26, 0.22],
        [24, 55, 0.30], [10, 60, 0.25], [29, 58, 0.32],
        [6, 48, 0.20],  [33, 52, 0.27], [19, 12, 0.24],
        [22, 64, 0.30], [3, 30, 0.26],  [36, 62, 0.22],
    ]) {
        const mesh = new THREE.Mesh(
            new THREE.DodecahedronGeometry(rs),
            rockMat
        );
        mesh.position.set(rx, rs * 0.4, rz);
        mesh.rotation.set(Math.random(), Math.random() * Math.PI, Math.random());
        scene.add(mesh);
    }
}

function spawnAssaultEnemies() {
    // 12 enemies spread across far end (z = 65–73)
    const spawns = [
        { x:  4,    z: 68 }, { x:  9,    z: 71 }, { x: 14,   z: 67 },
        { x: 19.5,  z: 73 }, { x: 25,    z: 68 }, { x: 30,   z: 71 },
        { x: 35,    z: 67 }, { x:  7,    z: 65 }, { x: 17,   z: 70 },
        { x: 22,    z: 65 }, { x: 27,    z: 73 }, { x: 33,   z: 66 },
    ];
    for (const sp of spawns) {
        spawnEnemyAt(sp.x, sp.z, [
            { x: sp.x + (Math.random()-0.5) * 5, z: 5  },
            { x: sp.x + (Math.random()-0.5) * 5, z: 65 },
        ], false, 0);
    }
    TOTAL_ENEMIES = enemies.length;
    document.getElementById('kill-counter').textContent = `KILLS: 0 / ${TOTAL_ENEMIES}`;
}

function spawnAssaultPickups() {
    // AK / AWP / M14 / MP5 on ground near player spawn
    const lineup = [1, 3, 4, 5];
    const startX = 16, lineZ = 4.5, spacing = 2.5;
    lineup.forEach((wIdx, i) => {
        const def = WEAPON_DEFS[wIdx];
        createPickup(startX + i * spacing, lineZ, wIdx, def.ammo + def.reserve);
    });
}

function spawnAssaultAllies() {
    // 3 allied units near player spawn, advance toward mid-map cover
    const allySpawns = [
        { x: 13,   z: 7 },
        { x: 19.5, z: 5 },
        { x: 26,   z: 8 },
    ];
    for (const sp of allySpawns) {
        spawnAllyAt(sp.x, sp.z);
    }
}
