'use strict';

// =====================================================================
// TRAINING MAP
// =====================================================================

function makeTargetTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const cx = 256, cy = 256;

    // 링 (바깥→안) : 흰-검-파-빨-노(10점)
    const rings = [
        { r: 248, color: '#ffffff' },
        { r: 218, color: '#dddddd' },
        { r: 188, color: '#111111' },
        { r: 158, color: '#111111' },
        { r: 128, color: '#2255cc' },
        { r: 98,  color: '#2255cc' },
        { r: 68,  color: '#cc2222' },
        { r: 38,  color: '#cc2222' },
        { r: 18,  color: '#ffdd00' },
    ];
    for (const ring of rings) {
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.fillStyle = ring.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    // 중심 십자
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    for (const [dx, dy] of [[0,-12],[0,12],[-12,0],[12,0]]) {
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + dx, cy + dy); ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
}

// ── 과녁 오브젝트 생성 ──
// 과녁 텍스처 캐시
let _targetTex = null;
function getTargetTexture() {
    if (_targetTex) return _targetTex;
    _targetTex = makeTargetTexture();
    return _targetTex;
}

// 막대기 없는 과녁 — y 위치 직접 지정
function createTarget(x, z, r, y) {
    const radius = r || 0.75;
    const posY   = (y !== undefined) ? y : radius + 0.1;
    const tex = getTargetTexture();

    const face = new THREE.Mesh(
        new THREE.CircleGeometry(radius, 52),
        new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide })
    );
    face.rotation.y = Math.PI; // 플레이어(-Z) 방향
    face.position.set(x, posY, z);
    scene.add(face);

    const rim = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.035, 8, 52),
        new THREE.MeshLambertMaterial({ color: 0x333322 })
    );
    rim.rotation.y = Math.PI;
    rim.position.copy(face.position);
    scene.add(rim);
}

// ── 직각삼각 기둥 언덕 (쐐기형) ──
// 경사면이 플레이어(-Z) 방향을 향하고 수직 뒷면이 +Z 방향
// 0: (-hw,0,-hd) 근접-하  1: (-hw,0,+hd) 원거리-하  2: (-hw,h,+hd) 원거리-상
// 3: (+hw,0,-hd)           4: (+hw,0,+hd)             5: (+hw,h,+hd)
function createWedgeHill(cx, cz, width, height, depth, color) {
    const hw = width / 2, hd = depth / 2, h = height;
    const verts = new Float32Array([
        -hw, 0, -hd,   // 0
        -hw, 0, +hd,   // 1
        -hw, h, +hd,   // 2
         hw, 0, -hd,   // 3
         hw, 0, +hd,   // 4
         hw, h, +hd,   // 5
    ]);
    const idx = [
        0,1,2,          // 왼 삼각 (−X 바깥)
        3,5,4,          // 오른 삼각 (+X 바깥)
        0,3,4, 0,4,1,   // 바닥 (−Y)
        1,4,5, 1,5,2,   // 뒷면 수직 (+Z)
        0,5,3, 0,2,5,   // 경사면 → 플레이어 향 (−Z 성분)
    ];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color }));
    mesh.position.set(cx, 0, cz);
    scene.add(mesh);
}

function buildTrainingMap() {
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0xb8d8f0, 0.005);

    // 조명
    scene.add(new THREE.AmbientLight(0xd0e8ff, 1.2));
    const sun = new THREE.DirectionalLight(0xfff8e0, 1.8);
    sun.position.set(20, 50, -10);
    sun.castShadow = true;
    scene.add(sun);
    muzzleLight = new THREE.PointLight(0xffcc44, 0, 6);
    scene.add(muzzleLight);

    // 녹색 지면
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x4a7c3f });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, 40);
    ground.receiveShadow = true;
    scene.add(ground);

    // 경계 충돌 (투명 벽)
    for (const [cx, cz, w, d] of [
        [0, -10, 60, 2], [0, 90, 60, 2],
        [-28, 40, 2, 110], [28, 40, 2, 110]
    ]) {
        walls.push({ box: new THREE.Box3(
            new THREE.Vector3(cx - w/2, 0, cz - d/2),
            new THREE.Vector3(cx + w/2, 5, cz + d/2)
        )});
    }

    // 책상
    const woodMat = new THREE.MeshLambertMaterial({ color: 0x7a5230 });
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 1.5), woodMat);
    tableTop.position.set(8, 0.88, 2);
    scene.add(tableTop);
    for (const [dx, dz] of [[-1.5,-0.6],[1.5,-0.6],[-1.5,0.6],[1.5,0.6]]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.88, 0.12), woodMat);
        leg.position.set(8 + dx, 0.44, 2 + dz);
        scene.add(leg);
    }

    // 책상 위 무기 픽업 (persistent) — 기본 3종
    createPickup(6.6, 2, 0, 0, 0.94);
    createPickup(8.0, 2, 1, 0, 0.94);
    createPickup(9.4, 2, 2, 0, 0.94);

    // 두 번째 무기 책상 (신규 5종)
    const woodMat2 = new THREE.MeshLambertMaterial({ color: 0x7a5230 });
    const table2Top = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.12, 1.5), woodMat2);
    table2Top.position.set(8, 0.88, 5.5);
    scene.add(table2Top);
    for (const [dx, dz] of [[-2.7,-0.6],[2.7,-0.6],[-2.7,0.6],[2.7,0.6]]) {
        const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.88, 0.12), woodMat2);
        leg2.position.set(8 + dx, 0.44, 5.5 + dz);
        scene.add(leg2);
    }
    // 표지판
    const signMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 0.06), signMat);
    sign.position.set(8, 1.60, 4.78);
    scene.add(sign);

    // 신규 무기 픽업 (persistent): AWP, M14 EBR, MP5, SPAS-12, M249
    createPickup(5.0, 5.5, 3, 0, 0.94);
    createPickup(6.5, 5.5, 4, 0, 0.94);
    createPickup(8.0, 5.5, 5, 0, 0.94);
    createPickup(9.5, 5.5, 6, 0, 0.94);
    createPickup(11.0, 5.5, 7, 0, 0.94);

    // ── 거대한 단일 쐐기 언덕 ──
    // 경사 시작(지면) z=10, 경사 끝(최고점) z=215, 높이=40, 폭=56
    const HNEAR = 10, HFAR = 215, HHEIGHT = 40, HWIDTH = 56;
    const hillCZ = (HNEAR + HFAR) / 2;
    const hillDepth = HFAR - HNEAR;
    createWedgeHill(0, hillCZ, HWIDTH, HHEIGHT, hillDepth, 0x3a6428);

    // 경사면 위 과녁 배치 — slopeY(z) = HHEIGHT*(z−HNEAR)/hillDepth
    const slopeY = wz => HHEIGHT * (wz - HNEAR) / hillDepth;

    // 50m / 100m / 200m, 각 3개 (x = −10, 0, +10)
    const targets = [
        { z: 52,  r: 1.05 },
        { z: 102, r: 1.35 },
        { z: 202, r: 1.80 },
    ];
    for (const { z, r } of targets) {
        const y = slopeY(z) + r + 0.08;
        for (const sx of [-10, 0, 10]) createTarget(sx, z, r, y);
    }
}

