'use strict';

// =====================================================================
// COMBAT MAP
// =====================================================================

function buildMap() {
    // Floor
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x404448 });
    const floorGeo = new THREE.PlaneGeometry(MAP[0].length * CELL, MAP.length * CELL);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(MAP[0].length * CELL / 2, 0, MAP.length * CELL / 2);
    floor.receiveShadow = true;
    scene.add(floor);

    // Ceiling
    const ceilMat = new THREE.MeshLambertMaterial({ color: 0x555a60 });
    const ceilGeo = new THREE.PlaneGeometry(MAP[0].length * CELL, MAP.length * CELL);
    const ceil = new THREE.Mesh(ceilGeo, ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(MAP[0].length * CELL / 2, WALL_H, MAP.length * CELL / 2);
    scene.add(ceil);

    // Walls — InstancedMesh으로 draw call 1개로 통합
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x6a7080 });
    const wallGeo = new THREE.BoxGeometry(CELL, WALL_H, CELL);

    let _wallCount = 0;
    for (const row of MAP) for (const cell of row) if (cell === 1) _wallCount++;

    const wallInstMesh = new THREE.InstancedMesh(wallGeo, wallMat, _wallCount);
    wallInstMesh.castShadow = false;
    wallInstMesh.receiveShadow = true;
    const _wallDummy = new THREE.Object3D();
    let _wi = 0;

    for (let r = 0; r < MAP.length; r++) {
        for (let c = 0; c < MAP[r].length; c++) {
            if (MAP[r][c] === 1) {
                const x = c * CELL + CELL / 2;
                const z = r * CELL + CELL / 2;
                _wallDummy.position.set(x, WALL_H / 2, z);
                _wallDummy.updateMatrix();
                wallInstMesh.setMatrixAt(_wi++, _wallDummy.matrix);
                walls.push({ box: new THREE.Box3(
                    new THREE.Vector3(x - CELL/2, 0,      z - CELL/2),
                    new THREE.Vector3(x + CELL/2, WALL_H, z + CELL/2)
                )});
            }
        }
    }
    wallInstMesh.instanceMatrix.needsUpdate = true;
    scene.add(wallInstMesh);
    wallMeshList.push(wallInstMesh);

    // Crates
    const crateGeo = new THREE.BoxGeometry(1.1, 1.0, 1.1);
    for (const cp of CRATE_POS) {
        const hue = Math.random() * 0.05 + 0.06;
        const crateMat = new THREE.MeshLambertMaterial({ color: new THREE.Color().setHSL(hue, 0.4, 0.25) });
        const mesh = new THREE.Mesh(crateGeo, crateMat);
        const x = cp.c * CELL + CELL / 2;
        const z = cp.r * CELL + CELL / 2;
        mesh.position.set(x, 0.5, z);
        mesh.castShadow = true;
        scene.add(mesh);
        const box = new THREE.Box3().setFromObject(mesh);
        walls.push({ box });
        wallMeshList.push(mesh);
        addPlatform(x - 0.55, x + 0.55, z - 0.55, z + 0.55, 1.0); // 크레이트 위
    }
}


function buildLighting() {
    scene.add(new THREE.AmbientLight(0xb0bcc8, 0.9));

    // Ceiling strip lights
    const lightPositions = [
        [1.5, 4.5], [1.5, 16.5], [3.5, 10.5],
        [7.5, 3], [7.5, 10.5], [7.5, 18],
        [11, 10.5], [15, 5], [15, 15.5],
        [17.5, 10.5],
    ];
    // 램프 메시 — InstancedMesh으로 통합
    const _lampGeo = new THREE.BoxGeometry(0.6, 0.05, 0.6);
    const _lampMat = new THREE.MeshBasicMaterial({ color: 0x9090ff });
    const _lampInst = new THREE.InstancedMesh(_lampGeo, _lampMat, lightPositions.length);
    const _lampDummy = new THREE.Object3D();

    for (let li = 0; li < lightPositions.length; li++) {
        const [r, c] = lightPositions[li];
        // 조명 수를 절반으로 줄여 성능 개선 (격번 배치)
        if (li % 2 === 0) {
            const light = new THREE.PointLight(0xa0b8e0, 1.2, 28);
            light.position.set(c * CELL, WALL_H - 0.2, r * CELL);
            scene.add(light);
        }
        _lampDummy.position.set(c * CELL, WALL_H - 0.2, r * CELL);
        _lampDummy.updateMatrix();
        _lampInst.setMatrixAt(li, _lampDummy.matrix);
    }
    _lampInst.instanceMatrix.needsUpdate = true;
    scene.add(_lampInst);

    // Red accent lights at key positions
    const redLights = [[6.5, 9], [16.5, 9]];
    for (const [r, c] of redLights) {
        const light = new THREE.PointLight(0xff2020, 0.8, 10);
        light.position.set(c * CELL, WALL_H - 0.5, r * CELL);
        scene.add(light);
    }

    // Muzzle flash light (shared, repositioned on shoot)
    muzzleLight = new THREE.PointLight(0xffcc44, 0, 6);
    scene.add(muzzleLight);
}

