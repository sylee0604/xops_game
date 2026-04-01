'use strict';

// =====================================================================
// TUNNEL MAP
// =====================================================================

function buildTunnelMap() {
    scene.background = new THREE.Color(0x050810);
    scene.fog = new THREE.FogExp2(0x0a0f1a, 0.028);

    scene.add(new THREE.AmbientLight(0x102030, 0.6));
    muzzleLight = new THREE.PointLight(0xffcc44, 0, 6);
    scene.add(muzzleLight);

    const TW = 10, TH = 5, TL = 140;
    const concreteMat  = new THREE.MeshLambertMaterial({ color: 0x606068, map: makeFloorTex('floor',     TW / 2, TL / 2) });
    const ceilMat      = new THREE.MeshLambertMaterial({ color: 0x484850, map: makeFloorTex('concrete',  TW / 3, TL / 3) });
    const wallMatL     = new THREE.MeshLambertMaterial({ color: 0x383840, map: makeFloorTex('concrete',  1,      TL / 3) });

    // ── 바닥 / 천장 (단일 Plane) ──
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(TW, TL), concreteMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(TW/2, 0, TL/2);
    scene.add(floor);

    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(TW, TL), ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(TW/2, TH, TL/2);
    scene.add(ceil);

    // ── 좌우 벽 (단일 Box 2개 — wallMeshList 항목 2개만) ──
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, TH, TL), wallMatL);
    leftWall.position.set(0.2, TH/2, TL/2);
    scene.add(leftWall);
    walls.push({ box: new THREE.Box3().setFromObject(leftWall) });
    wallMeshList.push(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, TH, TL), wallMatL);
    rightWall.position.set(TW - 0.2, TH/2, TL/2);
    scene.add(rightWall);
    walls.push({ box: new THREE.Box3().setFromObject(rightWall) });
    wallMeshList.push(rightWall);

    // ── 입구/출구 벽 ──
    const endMat = new THREE.MeshLambertMaterial({ color: 0x222228 });
    const entrance = new THREE.Mesh(new THREE.BoxGeometry(TW, TH, 1), endMat);
    entrance.position.set(TW/2, TH/2, -0.5);
    scene.add(entrance);
    walls.push({ box: new THREE.Box3().setFromObject(entrance) });

    const exit = new THREE.Mesh(new THREE.BoxGeometry(TW, TH, 1), endMat);
    exit.position.set(TW/2, TH/2, TL+0.5);
    scene.add(exit);
    walls.push({ box: new THREE.Box3().setFromObject(exit) });

    // ── 비상등 (간격 늘려 조명 수 줄임) ──
    const emergencyPositions = [8, 28, 48, 68, 90, 112, 132];
    for (const lz of emergencyPositions) {
        const isRed = (lz % 40) < 20;
        const light = new THREE.PointLight(isRed ? 0xff2200 : 0xff7700, 2.2, 22);
        light.position.set(TW/2, TH - 0.3, lz);
        scene.add(light);
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.6),
            new THREE.MeshBasicMaterial({ color: isRed ? 0xff4400 : 0xff9900 }));
        lamp.position.copy(light.position);
        scene.add(lamp);
    }

    // ── 차량 장애물 (충돌은 Box3만, 시각은 2개 메시) ──
    function addVehicle(x, z, type) {
        const isTruck = type === 'truck';
        const bodyCol = isTruck ? 0x2e2e44 : 0x3a3020;
        const topCol  = isTruck ? 0x1a1a28 : 0x2a2218;
        const bodyMat = new THREE.MeshLambertMaterial({ color: bodyCol });
        const topMat  = new THREE.MeshLambertMaterial({ color: topCol });

        if (isTruck) {
            const cab   = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 2.2), bodyMat);
            cab.position.set(x, 1.1, z - 2.4);
            const cargo = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.5, 5.2), topMat);
            cargo.position.set(x, 1.25, z + 0.6);
            scene.add(cab, cargo);
            walls.push({ box: new THREE.Box3(
                new THREE.Vector3(x-1.2, 0, z-3.5), new THREE.Vector3(x+1.2, 2.6, z+3.2)
            )});
            // 짐칸 위 플랫폼 (높이 2.5 — 점프 필요)
            addPlatform(x-1.1, x+1.1, z-1.9, z+3.1, 2.5);
        } else {
            const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 4.4), bodyMat);
            body.position.set(x, 0.65, z);
            const top  = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 2.4), topMat);
            top.position.set(x, 1.25, z);
            scene.add(body, top);
            walls.push({ box: new THREE.Box3(
                new THREE.Vector3(x-1.0, 0, z-2.2), new THREE.Vector3(x+1.0, 1.5, z+2.2)
            )});
            // 차 루프 위 플랫폼 (높이 1.6)
            addPlatform(x-0.8, x+0.8, z-1.2, z+1.2, 1.6);
        }
    }

    // 차량 배치
    addVehicle(2.0, 15,  'car');
    addVehicle(8.0, 28,  'truck');
    addVehicle(2.5, 42,  'car');
    addVehicle(7.5, 55,  'car');
    addVehicle(2.0, 70,  'truck');
    addVehicle(8.0, 85,  'car');
    addVehicle(3.0, 98,  'car');
    addVehicle(7.0, 112, 'truck');
    addVehicle(2.5, 125, 'car');

    // ── 드럼통 ──
    const drumMat = new THREE.MeshLambertMaterial({ color: 0x6a2818 });
    for (const [dx, dz] of [[4,22],[6,22],[4,48],[6,48],[3,76],[7,76],[5,105],[4,118],[6,118]]) {
        const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.95, 6), drumMat);
        drum.position.set(dx, 0.475, dz);
        scene.add(drum);
        walls.push({ box: new THREE.Box3(
            new THREE.Vector3(dx-0.35, 0, dz-0.35),
            new THREE.Vector3(dx+0.35, 0.95, dz+0.35)
        )});
    }

    // ── 추가 장애물: 콘크리트 바리케이드 + 버스/차량 잔해 (시야 차단용) ──
    const barrierMat  = new THREE.MeshLambertMaterial({ color: 0x555560 });
    const wreckMat    = new THREE.MeshLambertMaterial({ color: 0x222228 });
    const crateMat2   = new THREE.MeshLambertMaterial({ color: 0x4a3010 });
    const barrierGeo  = new THREE.BoxGeometry(2.2, 2.0, 0.5);
    const crateGeo2   = new THREE.BoxGeometry(1.0, 1.0, 1.0);

    // 장애물 배치 위치 (z 기준, 터널 폭=10 → 좌측/우측 엇갈려 배치)
    // [z위치, 배치타입]  타입: 'L'=좌측막기, 'R'=우측막기, 'C'=중앙버스
    const obstacleRows = [
        [32, 'L'], [50, 'R'], [65, 'L'],
        [80, 'C'], [95, 'R'], [110, 'L'],
        [122, 'R'], [133, 'C']
    ];

    for (const [oz, type] of obstacleRows) {
        if (type === 'L') {
            // 좌측 막기: x=0.5~6, 우측 통로 x=6~10 (step=4.0 → 배리어 사이 1.8 유닛 틈)
            for (let bx = 1; bx <= 5; bx += 4.0) {
                const bar = new THREE.Mesh(barrierGeo, barrierMat);
                bar.position.set(bx, 1.0, oz);
                scene.add(bar);
                walls.push({ box: new THREE.Box3().setFromObject(bar) });
                wallMeshList.push(bar);
            }
            // 드럼통 군집
            for (const [dx2, dz2] of [[5.5,oz-1.2],[5.5,oz+1.2]]) {
                const d2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,0.95,6), drumMat);
                d2.position.set(dx2, 0.475, dz2);
                scene.add(d2);
                walls.push({ box: new THREE.Box3(new THREE.Vector3(dx2-.35,0,dz2-.35), new THREE.Vector3(dx2+.35,.95,dz2+.35))});
            }
        } else if (type === 'R') {
            // 우측 막기: x=4.5~9.5, 좌측 통로 (step=4.0 → 배리어 사이 1.8 유닛 틈)
            for (let bx = 5; bx <= 9; bx += 4.0) {
                const bar = new THREE.Mesh(barrierGeo, barrierMat);
                bar.position.set(bx, 1.0, oz);
                scene.add(bar);
                walls.push({ box: new THREE.Box3().setFromObject(bar) });
                wallMeshList.push(bar);
            }
            for (const [dx2, dz2] of [[4.5,oz-1.2],[4.5,oz+1.2]]) {
                const d2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,0.95,6), drumMat);
                d2.position.set(dx2, 0.475, dz2);
                scene.add(d2);
                walls.push({ box: new THREE.Box3(new THREE.Vector3(dx2-.35,0,dz2-.35), new THREE.Vector3(dx2+.35,.95,dz2+.35))});
            }
        } else {
            // 중앙 버스 잔해 (x=2~8): 양쪽 좁은 통로 남김
            const wreckBody = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.8, 2.0), wreckMat);
            wreckBody.position.set(5, 0.9, oz);
            scene.add(wreckBody);
            walls.push({ box: new THREE.Box3().setFromObject(wreckBody) });
            wallMeshList.push(wreckBody);
            const wreckTop = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.8, 1.8), wreckMat);
            wreckTop.position.set(5, 2.1, oz);
            scene.add(wreckTop);
            // 좌우 목재 상자들
            for (const cx2 of [1.2, 8.8]) {
                const crate2 = new THREE.Mesh(crateGeo2, crateMat2);
                crate2.position.set(cx2, 0.5, oz);
                scene.add(crate2);
                walls.push({ box: new THREE.Box3().setFromObject(crate2) });
            }
        }
    }
}

function spawnTunnelZombies() {
    const zombiePositions = [
        // 기존 35마리
        [3,20], [7,24], [5,28], [2,32], [8,36],
        [4,40], [6,44], [3,47], [7,51], [5,54],
        [2,57], [8,60], [4,63], [6,66], [3,69],
        [7,72], [5,75], [2,78], [8,81], [4,84],
        [6,87], [3,90], [7,93], [5,96], [2,99],
        [8,102],[4,105],[6,108],[3,111],[7,114],
        [5,118],[2,122],[8,126],[4,132],[6,138],
        // 추가 15마리 — 각 장애물 바로 뒤에 배치
        [7,35], [3,37],          // 첫 바리케이드 뒤
        [3,52], [7,53],          // 두번째 바리케이드 뒤
        [8,67], [6,68],          // 세번째 바리케이드 뒤
        [2,83], [8,84], [5,85],  // 버스 잔해 뒤
        [3,97], [7,98],          // 다섯번째 바리케이드 뒤
        [7,112],[3,113],         // 여섯번째 바리케이드 뒤
        [3,124],[7,125]          // 일곱번째 바리케이드 뒤
    ];
    TOTAL_ENEMIES = zombiePositions.length;
    for (const [x, z] of zombiePositions) {
        const wx = x + (Math.random()-0.5)*2;
        spawnEnemyAt(x, z, [{x:wx,z:z},{x:10-wx,z:z+4}], true);
    }
    document.getElementById('kill-counter').textContent = `KILLS: 0 / ${TOTAL_ENEMIES}`;
}

