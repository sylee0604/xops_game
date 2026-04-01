'use strict';

// =====================================================================
// PROCEDURAL TEXTURES
// CanvasTexture 기반 — 외부 이미지 파일 의존성 없음
// 모든 텍스처는 시드 고정 LCG RNG로 생성 → 매 실행 동일 결과 보장
//
// Public API:
//   makeTex('concrete')  — 콘크리트 벽
//   makeTex('floor')     — 바닥 타일 (그루트 선 포함)
//   makeTex('wood')      — 목재 결
//   makeTex('metal')     — 브러시드 메탈 + 패널 심
//   makeTex('crate')     — 나무 상자
//
// 반환값: THREE.CanvasTexture (wrapS/T = RepeatWrapping, repeat=(1,1))
// 대형 면(바닥)에 쓸 때는 .clone() 후 .repeat.set(...) 따로 설정
// =====================================================================

const _texCache = {};

// 시드 기반 LCG — 실행마다 동일 텍스처 보장
function _rng(seed) {
    let s = seed >>> 0;
    return () => {
        s = Math.imul(s, 1664525) + 1013904223 >>> 0;
        return s / 0x100000000;
    };
}

function _canvas(size) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    return [c, c.getContext('2d')];
}

// ─────────────────────────────────────────────
// concrete — 콘크리트 벽/기둥
// ─────────────────────────────────────────────
function _concrete(size = 256) {
    const [c, ctx] = _canvas(size);
    const r = _rng(0x1a2b3c);

    // 베이스: 밝은 중간 회색
    ctx.fillStyle = '#c6cace';
    ctx.fillRect(0, 0, size, size);

    // 거친 노이즈 점 (밝기 변화)
    for (let i = 0; i < 9000; i++) {
        const x = r() * size | 0, y = r() * size | 0;
        const v = (r() * 50 - 25) | 0;
        const b = Math.max(0, Math.min(255, 198 + v));
        ctx.fillStyle = `rgb(${b},${b},${b+3})`;
        const s = r() * 2.2 + 0.4;
        ctx.fillRect(x, y, s, s);
    }

    // 거친 패치 (습기 얼룩)
    for (let i = 0; i < 14; i++) {
        const x = r() * size, y = r() * size;
        const w = r() * 70 + 15, h = r() * 55 + 10;
        ctx.fillStyle = `rgba(70,70,70,${r() * 0.07 + 0.02})`;
        ctx.fillRect(x, y, w, h);
    }

    // 균열선
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = `rgba(55,50,50,${r() * 0.28 + 0.08})`;
        ctx.lineWidth = r() * 0.9 + 0.2;
        ctx.beginPath();
        let px = r() * size, py = r() * size;
        ctx.moveTo(px, py);
        for (let j = 0; j < 9; j++) {
            px += (r() - 0.5) * 52; py += (r() - 0.5) * 22;
            ctx.lineTo(px, py);
        }
        ctx.stroke();
    }

    // 수평 거푸집 선 (콘크리트 타설 흔적)
    for (let y = 42; y < size; y += 42 + (r() * 12 | 0)) {
        ctx.strokeStyle = `rgba(80,80,80,${r() * 0.12 + 0.04})`;
        ctx.lineWidth = 0.5 + r() * 0.5;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y + (r()-0.5)*3); ctx.stroke();
    }

    return _toTex(c);
}

// ─────────────────────────────────────────────
// floor — 콘크리트 바닥 타일
// ─────────────────────────────────────────────
function _floor(size = 256) {
    const [c, ctx] = _canvas(size);
    const r = _rng(0x4d5e6f);

    // 베이스: 약간 어두운 회색
    ctx.fillStyle = '#a8aaae';
    ctx.fillRect(0, 0, size, size);

    // 노이즈
    for (let i = 0; i < 7000; i++) {
        const x = r() * size | 0, y = r() * size | 0;
        const v = (r() * 40 - 20) | 0;
        const b = Math.max(0, Math.min(255, 168 + v));
        ctx.fillStyle = `rgb(${b},${b},${b+2})`;
        ctx.fillRect(x, y, r() * 2 + 0.5, r() * 2 + 0.5);
    }

    // 타일 그루트 선 (64px 간격 = 텍스처당 4타일)
    const TILE = 64;
    ctx.strokeStyle = 'rgba(50,50,50,0.28)';
    ctx.lineWidth = 1.8;
    for (let i = 0; i <= size; i += TILE) {
        ctx.beginPath(); ctx.moveTo(i, 0);   ctx.lineTo(i, size);   ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i);   ctx.lineTo(size, i);   ctx.stroke();
    }

    // 타일마다 경미한 밝기 편차
    for (let ty = 0; ty < size / TILE; ty++) {
        for (let tx = 0; tx < size / TILE; tx++) {
            const v = (r() * 0.06 - 0.03);
            const dir = v > 0 ? 255 : 0;
            ctx.fillStyle = `rgba(${dir},${dir},${dir},${Math.abs(v)})`;
            ctx.fillRect(tx * TILE + 2, ty * TILE + 2, TILE - 4, TILE - 4);
        }
    }

    // 바닥 마모/얼룩
    for (let i = 0; i < 8; i++) {
        const x = r() * size, y = r() * size;
        ctx.fillStyle = `rgba(60,60,60,${r() * 0.06 + 0.01})`;
        ctx.beginPath();
        ctx.ellipse(x, y, r() * 30 + 10, r() * 15 + 5, r() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
    }

    return _toTex(c);
}

// ─────────────────────────────────────────────
// wood — 목재 결
// ─────────────────────────────────────────────
function _wood(size = 256) {
    const [c, ctx] = _canvas(size);
    const r = _rng(0xab1234);

    // 베이스
    ctx.fillStyle = '#c89850';
    ctx.fillRect(0, 0, size, size);

    // 결 라인 (수평)
    for (let i = 0; i < 70; i++) {
        const y   = r() * size;
        const a   = r() * 0.30 + 0.04;
        const drk = r() > 0.5;
        ctx.strokeStyle = drk ? `rgba(55,25,5,${a})` : `rgba(200,160,80,${a * 0.5})`;
        ctx.lineWidth   = r() * 1.8 + 0.3;
        ctx.beginPath();
        ctx.moveTo(0, y);
        let cx = 0;
        while (cx < size) {
            cx += r() * 28 + 8;
            ctx.lineTo(cx, y + (r() - 0.5) * 4);
        }
        ctx.stroke();
    }

    // 나무 옹이 1~2개
    for (let i = 0; i < 2; i++) {
        const kx = r() * size, ky = r() * size;
        const kr = r() * 14 + 7;
        for (let ring = 0; ring < 3; ring++) {
            const rr = kr * (1 - ring * 0.3);
            ctx.strokeStyle = `rgba(50,22,4,${0.35 - ring * 0.08})`;
            ctx.lineWidth   = 1.2 - ring * 0.3;
            ctx.beginPath();
            ctx.ellipse(kx, ky, rr, rr * 0.55, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    return _toTex(c);
}

// ─────────────────────────────────────────────
// metal — 브러시드 메탈
// ─────────────────────────────────────────────
function _metal(size = 256) {
    const [c, ctx] = _canvas(size);
    const r = _rng(0xfe9876);

    // 베이스: 중간 강철색
    ctx.fillStyle = '#8a8a8a';
    ctx.fillRect(0, 0, size, size);

    // 브러시 스트리크 (수평)
    for (let i = 0; i < 280; i++) {
        const y     = r() * size;
        const bright = r() > 0.5 ? 220 : 50;
        const a = r() * 0.07 + 0.01;
        ctx.strokeStyle = `rgba(${bright},${bright},${bright},${a})`;
        ctx.lineWidth   = r() * 0.5 + 0.1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y + (r() - 0.5) * 3);
        ctx.stroke();
    }

    // 패널 심 (128px 간격)
    ctx.strokeStyle = 'rgba(30,30,30,0.45)';
    ctx.lineWidth = 1.2;
    for (let i = 128; i < size; i += 128) {
        ctx.beginPath(); ctx.moveTo(i, 0);   ctx.lineTo(i, size);   ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i);   ctx.lineTo(size, i);   ctx.stroke();
    }

    // 리벳 (패널 모서리)
    ctx.fillStyle = 'rgba(60,60,60,0.5)';
    for (let y = 128; y < size; y += 128) {
        for (let x = 128; x < size; x += 128) {
            for (const [ox, oy] of [[-6,-6],[6,-6],[-6,6],[6,6]]) {
                ctx.beginPath();
                ctx.arc(x + ox, y + oy, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // 긁힘
    for (let i = 0; i < 10; i++) {
        const x1 = r() * size, y1 = r() * size;
        const len = r() * 70 + 15;
        const ang = r() * Math.PI;
        ctx.strokeStyle = `rgba(200,200,200,${r() * 0.25 + 0.08})`;
        ctx.lineWidth   = 0.4;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + Math.cos(ang) * len, y1 + Math.sin(ang) * len);
        ctx.stroke();
    }

    return _toTex(c);
}

// ─────────────────────────────────────────────
// crate — 나무 상자
// ─────────────────────────────────────────────
function _crate(size = 256) {
    const [c, ctx] = _canvas(size);
    const r = _rng(0x778899);

    // 베이스
    ctx.fillStyle = '#7a5a20';
    ctx.fillRect(0, 0, size, size);

    // 목재 결
    for (let i = 0; i < 50; i++) {
        const y   = r() * size;
        const a   = r() * 0.35 + 0.06;
        ctx.strokeStyle = `rgba(40,18,3,${a})`;
        ctx.lineWidth   = r() * 2 + 0.4;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y + (r() - 0.5) * 10);
        ctx.stroke();
    }

    // 판자 구분선 (33%, 66%)
    ctx.strokeStyle = 'rgba(25,10,2,0.55)';
    ctx.lineWidth = 3;
    for (const t of [0.33, 0.67]) {
        ctx.beginPath();
        ctx.moveTo(t * size, 0); ctx.lineTo(t * size, size); ctx.stroke();
    }

    // 테두리 철제 모서리 마감
    ctx.strokeStyle = 'rgba(15,12,8,0.65)';
    ctx.lineWidth = 9;
    ctx.strokeRect(4.5, 4.5, size - 9, size - 9);

    // 마모/충격 흔적
    for (let i = 0; i < 18; i++) {
        const x = r() * size, y = r() * size;
        ctx.fillStyle = `rgba(20,8,0,${r() * 0.22 + 0.04})`;
        ctx.fillRect(x, y, r() * 25 + 4, r() * 10 + 2);
    }

    // 모서리 타격 흔적 (밝게)
    for (let i = 0; i < 6; i++) {
        const x = r() * size, y = r() * size;
        ctx.fillStyle = `rgba(220,180,100,${r() * 0.12 + 0.03})`;
        ctx.fillRect(x, y, r() * 8 + 2, r() * 4 + 1);
    }

    return _toTex(c);
}

// 공통 마무리: CanvasTexture 생성
function _toTex(canvas) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────
function makeTex(type) {
    if (_texCache[type]) return _texCache[type];
    const gen = { concrete: _concrete, floor: _floor, wood: _wood, metal: _metal, crate: _crate };
    return (_texCache[type] = gen[type]?.() ?? null);
}

/**
 * 대형 바닥/천장 평면용 클론 텍스처.
 * @param {string} type   텍스처 타입
 * @param {number} repX   U 반복 횟수
 * @param {number} repY   V 반복 횟수
 */
function makeFloorTex(type, repX, repY) {
    const t = makeTex(type).clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repX, repY);
    t.needsUpdate = true;
    return t;
}
