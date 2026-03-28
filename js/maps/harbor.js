'use strict';

// =====================================================================
// HARBOR MAP
// =====================================================================

function buildHarborMap() {
    scene.background = new THREE.Color(0x060d1a);
    scene.fog = new THREE.FogExp2(0x080e1c, 0.007);

    // 야간: 달빛(실루엣 식별용) + 항구 나트륨등
    scene.add(new THREE.AmbientLight(0x1a2c44, 2.0));
    const moon = new THREE.DirectionalLight(0x6080b0, 0.9);
    moon.position.set(-40, 60, -20);
    scene.add(moon);
    muzzleLight = new THREE.PointLight(0xffcc44, 0, 6);
    scene.add(muzzleLight);

    const W = 72, D = 90; // 항구 크기

    // 콘크리트 바닥 (야간)
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x2a2e30 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(W/2, 0, D/2);
    floor.receiveShadow = true;
    scene.add(floor);

    // 바다 (야간)
    const seaMat = new THREE.MeshLambertMaterial({ color: 0x05101a });
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(30, D), seaMat);
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(-15, -0.05, D/2);
    scene.add(sea);

    // 경계 충돌 벽 (입구·출구만 유지, 바다/크레인쪽은 오픈)
    for (const [cx, cz, w, d] of [
        [W/2, -1, W+4, 2], [W/2, D+1, W+4, 2]
    ]) {
        walls.push({ box: new THREE.Box3(
            new THREE.Vector3(cx-w/2, 0, cz-d/2),
            new THREE.Vector3(cx+w/2, 8, cz+d/2)
        )});
    }

    // 컨테이너 배치 함수
    const CONT_COLORS = [0x5a1510, 0x0e3018, 0x102244, 0x4a2a08, 0x2e1840, 0x0e2828];
    const CONT_MATS   = CONT_COLORS.map(c => new THREE.MeshLambertMaterial({ color: c }));
    const contDarkMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const contGeo     = new THREE.BoxGeometry(2.4, 2.5, 6.0);
    const contFrameGeo = new THREE.BoxGeometry(2.4+0.04, 2.5+0.04, 0.08);
    function addContainer(x, z, stackH, rotY, colorIdx) {
        const cw=2.4, ch=2.5, cd=6.0;
        for (let h = 0; h < stackH; h++) {
            // 층마다 다른 색상 (미리 만든 머티리얼 재사용)
            const mesh = new THREE.Mesh(contGeo, CONT_MATS[(colorIdx + h) % CONT_MATS.length]);
            mesh.position.set(x, ch/2 + h*ch, z);
            mesh.rotation.y = rotY || 0;
            mesh.castShadow = false; mesh.receiveShadow = false;
            scene.add(mesh);
            const frame = new THREE.Mesh(contFrameGeo, contDarkMat);
            frame.position.copy(mesh.position);
            frame.position.z += cd/2;
            frame.rotation.y = rotY || 0;
            scene.add(frame);
            const box = new THREE.Box3().setFromObject(mesh);
            walls.push({ box });
            wallMeshList.push(mesh);
            // 최상층 표면에 플랫폼 등록 (점프로 올라갈 수 있음)
            if (h === stackH - 1) {
                addPlatform(x - cw/2, x + cw/2, z - cd/2, z + cd/2, stackH * ch);
            }
        }
    }

    // 왼쪽 컨테이너 열
    addContainer(8,  10, 2, 0, 0);
    addContainer(8,  18, 3, 0, 2);
    addContainer(8,  26, 2, 0, 1);
    addContainer(8,  36, 3, 0, 3);
    addContainer(8,  46, 2, 0, 0);
    addContainer(8,  56, 1, 0, 4);
    addContainer(8,  64, 3, 0, 2);
    addContainer(8,  73, 2, 0, 1);

    // 중앙 컨테이너 그룹
    addContainer(22, 12, 1, 0, 3);
    addContainer(22, 20, 2, 0, 0);
    addContainer(28, 16, 3, 0, 2);
    addContainer(28, 28, 2, 0, 5);
    addContainer(22, 42, 1, 0, 1);
    addContainer(28, 50, 2, 0, 4);
    addContainer(22, 58, 3, 0, 0);
    addContainer(28, 66, 1, 0, 3);
    addContainer(22, 74, 2, 0, 2);

    // 오른쪽 컨테이너 열
    addContainer(42, 8,  2, 0, 5);
    addContainer(42, 18, 3, 0, 1);
    addContainer(42, 30, 1, 0, 0);
    addContainer(42, 40, 2, 0, 3);
    addContainer(42, 52, 3, 0, 2);
    addContainer(42, 62, 2, 0, 4);
    addContainer(42, 72, 1, 0, 0);

    // ── STS 항구 크레인 (Ship-to-Shore Container Crane) ──
    // 위치: 부두 엣지(x≈0) 걸쳐 z=37~45, 높이=28
    function addCraneBox(x, y, z, w, h, d, col) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
            new THREE.MeshLambertMaterial({ color: col }));
        m.position.set(x, y, z);
        scene.add(m);
        if (h > 1.5 && w > 0.3 && d > 0.3) {
            walls.push({ box: new THREE.Box3().setFromObject(m) });
            wallMeshList.push(m);
        }
        return m;
    }
    const CY = 0xe8a020; // 크레인 노란색
    const CD = 0xaa6010; // 어두운 노란
    const CS = 0x4a4a5a; // 철제 회색
    const CR = 0x1a1a2a; // 와이어 검정

    // 레일 (z=37, z=45)
    addCraneBox(8, 0.12, 37, 20, 0.2, 0.4, 0x888888);
    addCraneBox(8, 0.12, 45, 20, 0.2, 0.4, 0x888888);

    // ── 포탈 프레임 전면 (z=37) ──
    addCraneBox(1.5,  14,   37, 1.4, 28, 1.4, CY); // 해수면 레그
    addCraneBox(14.5, 13,   37, 1.4, 26, 1.4, CY); // 육지 레그
    addCraneBox(8,    26.5, 37, 15,  1.2, 1.2, CY); // 포탈 빔
    addCraneBox(5,    18,   37, 0.5, 14, 0.5, CD); // 대각 브레이스1
    addCraneBox(11,   18,   37, 0.5, 14, 0.5, CD); // 대각 브레이스2

    // ── 포탈 프레임 후면 (z=45) ──
    addCraneBox(1.5,  14,   45, 1.4, 28, 1.4, CY);
    addCraneBox(14.5, 13,   45, 1.4, 26, 1.4, CY);
    addCraneBox(8,    26.5, 45, 15,  1.2, 1.2, CY);
    addCraneBox(5,    18,   45, 0.5, 14, 0.5, CD);
    addCraneBox(11,   18,   45, 0.5, 14, 0.5, CD);

    // ── 포탈 상부 연결 보 (z=37~45) ──
    addCraneBox(1.5,  27.5, 41, 1.2, 1.2, 10, CY);
    addCraneBox(14.5, 26.5, 41, 1.2, 1.2, 10, CY);

    // ── 머신 하우스 (기계실 + 운전실) ──
    addCraneBox(11, 26.5, 41, 6, 3.5, 9.8, CS);
    // 운전실 유리창
    addCraneBox(8,  27.5, 41, 0.15, 1.8, 4.0, 0x1a3a5a);
    // 지붕 환기구
    addCraneBox(11, 28.5, 41, 4, 0.5, 6, 0x333344);

    // ── 메인 붐 (x=-16 ~ x=24, 길이=40) ──
    addCraneBox(4, 28.6, 41, 40, 1.4, 2.2, CY);
    // 붐 보강 보
    addCraneBox(4, 28.6, 39.5, 40, 0.5, 0.4, CD);
    addCraneBox(4, 28.6, 42.5, 40, 0.5, 0.4, CD);

    // ── 메인 마스트 (A-프레임 지지대) ──
    addCraneBox(8,  34, 41, 1.0, 12, 1.0, CY); // 전방 마스트
    addCraneBox(14, 31, 41, 1.0,  7, 1.0, CY); // 후방 마스트
    // 마스트 상부 연결 빔
    addCraneBox(11, 40.3, 41, 7, 0.8, 0.8, CY);

    // ── 백스테이 (와이어 근사: 계단식 박스) ──
    addCraneBox(-3,  34, 41, 0.25,  12, 0.25, CR);
    addCraneBox(-9,  31, 41, 0.25,   6, 0.25, CR);
    addCraneBox(21,  32, 41, 0.25,   8, 0.25, CR);
    addCraneBox(18,  35, 41, 0.25,   7, 0.25, CR);

    // ── 트롤리 + 호이스트 (작업 위치 x=3) ──
    addCraneBox(3, 29.3, 41, 2.0, 0.6, 2.0, CS); // 트롤리
    addCraneBox(2.6, 21.5, 41, 0.2, 15, 0.2, CR); // 호이스트 로프1
    addCraneBox(3.4, 21.5, 41, 0.2, 15, 0.2, CR); // 호이스트 로프2

    // ── 스프레더 (컨테이너 잡는 장치) ──
    addCraneBox(3, 13.5, 41, 6.8, 0.5, 2.2, CS);
    // 스프레더에 걸린 컨테이너 (빨간색)
    addCraneBox(3, 10.8, 41, 6.5, 2.6, 2.6, 0x8a1510);

    // ── 베이스 플랫폼 + 계단 ──
    addCraneBox(8, 0.5, 41, 18, 1.0, 12, 0x666666);
    // 크레인 계단 (베이스→지면)
    for (let s = 0; s < 5; s++) {
        addCraneBox(17.5 - s*0.5, 0.1+s*0.2, 41, 1.5, 0.4, 1.5, 0x888888);
    }

    // ══════════════════════════════════════════════════════════════════
    // 항구 사무실 — 2층 건물 (x=38~62, z=78.2~87.8, h=9)
    // 정면 입구(z=78.2 중앙), 우측 벽 안쪽 계단, 계단 위 2층 개구부
    // ══════════════════════════════════════════════════════════════════
    const officeWallMat  = new THREE.MeshLambertMaterial({ color: 0x3a3830 });
    const officeDarkMat  = new THREE.MeshLambertMaterial({ color: 0x887722, emissive: 0x221100 });
    const officeFloorMat = new THREE.MeshLambertMaterial({ color: 0x2e2c28 });
    const officeIntMat   = new THREE.MeshLambertMaterial({ color: 0x302e2a });

    function addOfficeWall(cx, cy, cz, w, h, d, mat, addToMeshList, addCollision) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || officeWallMat);
        m.position.set(cx, cy, cz);
        m.castShadow = true; m.receiveShadow = true;
        scene.add(m);
        if (addCollision !== false) walls.push({ box: new THREE.Box3().setFromObject(m) });
        if (addToMeshList) wallMeshList.push(m);
        return m;
    }

    // 앞벽: 문 좌(x=38~48.5) + 문 우(x=51.5~62) + 문 위(충돌 없음)
    addOfficeWall(43.25, 4.5, 78.2, 10.5, 9.0, 0.4, officeWallMat, true);
    addOfficeWall(56.75, 4.5, 78.2, 10.5, 9.0, 0.4, officeWallMat, true);
    addOfficeWall(50,    6.7, 78.2,  3.0, 5.6, 0.4, officeWallMat, true, false);
    // 뒷벽
    addOfficeWall(50,    4.5, 87.8, 24.0, 9.0, 0.4, officeWallMat, true);
    // 좌벽
    addOfficeWall(38.2,  4.5, 83.0,  0.4, 9.0, 10.0, officeWallMat, true);
    // 우벽 (외벽, 계단은 내부에 배치)
    addOfficeWall(61.8,  4.5, 83.0,  0.4, 9.0, 10.0, officeWallMat, true);
    // 천장
    const officeCeil = new THREE.Mesh(new THREE.PlaneGeometry(24, 10), officeIntMat);
    officeCeil.rotation.x = Math.PI / 2;
    officeCeil.position.set(50, 9, 83);
    scene.add(officeCeil);
    // 1층 내부 바닥
    const officeFloor = new THREE.Mesh(new THREE.PlaneGeometry(23.2, 9.6), officeFloorMat);
    officeFloor.rotation.x = -Math.PI / 2;
    officeFloor.position.set(50, 0.01, 83);
    scene.add(officeFloor);

    // ── 2층 슬라브 (y=4.5) ──
    // 메인: x=38~58.5, z=78.2~87.8 (전체 깊이)
    // 우측 앞 조각: x=58.5~62, z=78.2~79.2
    // 우측 뒤 조각: x=58.5~62, z=84.1~87.8
    // 개구부(뚫린 공간): x=58.5~62, z=79.2~84.1 (계단 위)
    const slabDefs = [
        [48.25, 4.35, 83.0,  20.5, 0.3,  9.6],  // 메인(x=38~58.5, 전체깊이)
        [60.25, 4.35, 78.7,   3.5, 0.3,  1.0],  // 우측 앞(x=58.5~62, z=78.2~79.2)
        [60.25, 4.35, 85.95,  3.5, 0.3,  3.7],  // 우측 뒤(x=58.5~62, z=84.1~87.8)
    ];
    for (const [sx,sy,sz,sw,sh,sd] of slabDefs) {
        const sl = new THREE.Mesh(new THREE.BoxGeometry(sw,sh,sd), officeWallMat);
        sl.position.set(sx,sy,sz); scene.add(sl);
        walls.push({ box: new THREE.Box3().setFromObject(sl) });
    }
    // 2층 플랫폼 등록
    addPlatform(38.0, 58.5, 78.2, 87.8, 4.5);   // 메인 좌측
    addPlatform(58.5, 62.0, 78.2, 79.2, 4.5);   // 우측 앞 조각
    addPlatform(58.5, 62.0, 84.1, 87.8, 4.5);   // 우측 뒤 조각

    // 2층 내부 바닥 시각
    const floor2L = new THREE.Mesh(new THREE.PlaneGeometry(20.3, 9.6), officeFloorMat);
    floor2L.rotation.x = -Math.PI / 2;
    floor2L.position.set(48.25, 4.52, 83.0);
    scene.add(floor2L);

    // ── 우측 벽 안쪽 계단 (x_center=60, z=79.5→83.7, 7단) ──
    // 표면 y: 0.30, 1.05, 1.80, 2.55, 3.30, 4.05, 4.50
    const stairMat2 = new THREE.MeshLambertMaterial({ color: 0x4a4840 });
    for (let s = 0; s < 7; s++) {
        const surfY = s < 6 ? 0.30 + s * 0.75 : 4.50;
        const stairZ = 79.5 + s * 0.7;
        const st = new THREE.Mesh(new THREE.BoxGeometry(3.0, surfY, 0.7), stairMat2);
        st.position.set(60.0, surfY / 2, stairZ);
        scene.add(st);
        walls.push({ box: new THREE.Box3().setFromObject(st) });
        addPlatform(58.5, 61.5, stairZ - 0.35, stairZ + 0.35, surfY);
    }
    // 계단 왼쪽 난간 포스트 (시각 전용)
    const railMat3 = new THREE.MeshLambertMaterial({ color: 0x555555 });
    for (let s = 0; s < 6; s++) {
        const surfY = 0.30 + s * 0.75;
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.08), railMat3);
        post.position.set(58.5, surfY + 0.4, 79.5 + s * 0.7);
        scene.add(post);
    }
    const hRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 4.2), railMat3);
    hRail.position.set(58.5, 5.2, 81.6);
    scene.add(hRail);

    // ── 조명 ──
    const offLight1 = new THREE.PointLight(0xffeedd, 2.0, 15);
    offLight1.position.set(46, 4.0, 83);
    scene.add(offLight1);
    const offLight2 = new THREE.PointLight(0xffeedd, 1.6, 13);
    offLight2.position.set(53, 4.0, 80);
    scene.add(offLight2);
    const offLight3 = new THREE.PointLight(0xffeedd, 1.8, 14);
    offLight3.position.set(46, 8.5, 83);
    scene.add(offLight3);
    const offLight4 = new THREE.PointLight(0xffeedd, 1.6, 13);
    offLight4.position.set(53, 8.5, 85);
    scene.add(offLight4);

    // ── 1층 가구 ──
    const deskMat  = new THREE.MeshLambertMaterial({ color: 0x5a4020 });
    const metalMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    for (const [dx, dz] of [[43,80],[43,83.5],[52,86.5]]) {
        const desk = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 1.4), deskMat);
        desk.position.set(dx, 0.85, dz); scene.add(desk);
        walls.push({ box: new THREE.Box3().setFromObject(desk) });
        const mon = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.06), metalMat);
        mon.position.set(dx, 1.25, dz - 0.3); scene.add(mon);
    }
    // ── 2층 가구 ──
    const deskMat2  = new THREE.MeshLambertMaterial({ color: 0x5a4020 });
    const metalMat2 = new THREE.MeshLambertMaterial({ color: 0x444444 });
    for (const [dx, dz] of [[43,80],[43,83.5],[52,86.5]]) {
        const desk2 = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 1.4), deskMat2);
        desk2.position.set(dx, 5.35, dz); scene.add(desk2);
        walls.push({ box: new THREE.Box3().setFromObject(desk2) });
        const mon2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.06), metalMat2);
        mon2.position.set(dx, 5.75, dz - 0.3); scene.add(mon2);
    }

    // ── 지붕 ──
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 2.5, 8),
        new THREE.MeshLambertMaterial({ color: 0x666666 }));
    tank.position.set(50, 10.2, 83); scene.add(tank);
    for (let i = 0; i < 10; i++) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.9, 0.15),
            new THREE.MeshLambertMaterial({ color: 0x444444 }));
        post.position.set(39.0 + i * 2.4, 9.8, 83); scene.add(post);
    }

    // 앞면 창문 (장식)
    for (let fl = 0; fl < 2; fl++) {
        for (let wi = 0; wi < 3; wi++) {
            const wm = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.3, 0.12), officeDarkMat);
            wm.position.set(40.0 + wi * 3.0, 1.6 + fl * 4.6, 78.05); scene.add(wm);
        }
        for (let wi = 0; wi < 3; wi++) {
            const wm = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.3, 0.12), officeDarkMat);
            wm.position.set(53.5 + wi * 2.8, 1.6 + fl * 4.6, 78.05); scene.add(wm);
        }
    }

    // 사무실 진입로: 계단 없음, 평지로 직접 진입

    // 항구 부두 가장자리 (좌측)
    const dockMat = new THREE.MeshLambertMaterial({ color: 0x5a5040 });
    for (let dz = 0; dz < D; dz += 12) {
        const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 1.0, 6), dockMat);
        bollard.position.set(2, 0.5, dz + 6);
        scene.add(bollard);
        walls.push({ box: new THREE.Box3().setFromObject(bollard) });
    }

    // 포크리프트 (중앙)
    function addForklift(x, z) {
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0xc8a020 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 2.8), bodyMat);
        body.position.set(x, 0.7, z);
        scene.add(body);
        const mast = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.2, 0.2), new THREE.MeshLambertMaterial({ color: 0x555555 }));
        mast.position.set(x, 1.1, z - 1.4);
        scene.add(mast);
        const fork = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.8), new THREE.MeshLambertMaterial({ color: 0x444444 }));
        fork.position.set(x, 0.6, z - 1.8);
        scene.add(fork);
        walls.push({ box: new THREE.Box3().setFromObject(body) });
    }
    addForklift(35, 22);
    addForklift(18, 55);

    // 스폰 입구 엄폐 컨테이너 (플레이어 앞 z≈10, LOS 차단용)
    addContainer(18, 10, 2, 0, 0);
    addContainer(28, 10, 1, 0, 2);
    addContainer(38, 10, 2, 0, 4);

    // 항구 가로등 (야간 - 나트륨등 느낌)
    const lampPts = [[10,5],[10,35],[10,65],[35,15],[35,50],[55,40],[55,75],[20,80],[45,82]];
    for (const [lx, lz] of lampPts) {
        const pl = new THREE.PointLight(0xff8c20, 1.8, 22);
        pl.position.set(lx, 7, lz);
        scene.add(pl);
        // 가로등 기둥
        const pole = new THREE.Mesh(new THREE.BoxGeometry(0.15, 7, 0.15),
            new THREE.MeshLambertMaterial({ color: 0x333333 }));
        pole.position.set(lx, 3.5, lz);
        scene.add(pole);
        // 가로등 헤드
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.5),
            new THREE.MeshBasicMaterial({ color: 0xffcc44 }));
        head.position.set(lx, 7.1, lz);
        scene.add(head);
    }
    // 크레인 작업등 (밝은 흰색)
    const craneLight = new THREE.PointLight(0xffffff, 3.5, 40);
    craneLight.position.set(4, 30, 41);
    scene.add(craneLight);
    // 사무실 창문 빛
    const officeGlow = new THREE.PointLight(0xffeecc, 1.2, 20);
    officeGlow.position.set(50, 4, 78);
    scene.add(officeGlow);
}

function spawnHarborEnemies() {
    // 야외 14명 + 사무실 1층 3명 + 사무실 2층 3명 = 20명
    TOTAL_ENEMIES = 20;
    // 야외 경비 (컨테이너 구역)
    spawnEnemyAt(24, 22, [{x:24,z:22},{x:30,z:28}], false);
    spawnEnemyAt(30, 32, [{x:30,z:32},{x:24,z:40}], false);
    spawnEnemyAt(8,  40, [{x:8,z:40},{x:14,z:48}],  false);
    spawnEnemyAt(44, 36, [{x:44,z:36},{x:38,z:44}], false);
    spawnEnemyAt(44, 56, [{x:44,z:56},{x:38,z:64}], false);
    spawnEnemyAt(25, 62, [{x:25,z:62},{x:18,z:70}], false);
    spawnEnemyAt(12, 72, [{x:12,z:72},{x:6,z:78}],  false);
    spawnEnemyAt(35, 72, [{x:35,z:72},{x:28,z:78}], false);
    spawnEnemyAt(55, 75, [{x:55,z:75},{x:52,z:82}], false);
    spawnEnemyAt(58, 38, [{x:58,z:38},{x:52,z:32}], false);
    // 추가 야외 (바다쪽 부두·크레인 구역)
    spawnEnemyAt(5,  28, [{x:5,z:28},{x:8,z:35}],   false); // 부두 순찰
    spawnEnemyAt(5,  50, [{x:5,z:50},{x:8,z:58}],   false); // 부두 순찰
    spawnEnemyAt(5,  68, [{x:5,z:68},{x:8,z:74}],   false); // 부두 순찰
    spawnEnemyAt(18, 40, [{x:18,z:40},{x:12,z:32}], false); // 크레인 앞
    // 사무실 1층 (y=0)
    spawnEnemyAt(44, 81, [{x:44,z:81},{x:44,z:85}], false, 0);
    spawnEnemyAt(52, 85, [{x:52,z:85},{x:48,z:82}], false, 0);
    spawnEnemyAt(43, 86, [{x:43,z:86},{x:46,z:83}], false, 0);
    // 사무실 2층 (floorY=4.5)
    spawnEnemyAt(44, 80, [{x:44,z:80},{x:44,z:85}], false, 4.5);
    spawnEnemyAt(52, 84, [{x:52,z:84},{x:48,z:81}], false, 4.5);
    spawnEnemyAt(43, 86, [{x:43,z:86},{x:46,z:83}], false, 4.5);
    document.getElementById('kill-counter').textContent = `KILLS: 0 / ${TOTAL_ENEMIES}`;
}

