'use strict';

// =====================================================================
// HUD
// =====================================================================

// ── 데미지 방향 인디케이터 ──────────────────────────────────────────
const _dirCanvas = document.getElementById('dir-canvas');
const _dirCtx    = _dirCanvas.getContext('2d');
const _dmgInds   = []; // { angle, life, maxLife }

/**
 * 피격 방향 인디케이터를 추가한다.
 * @param {number} relAngle  플레이어 시점 기준 각도 (0=정면, +π/2=오른쪽, +π/-π=후방, -π/2=왼쪽)
 */
function showDamageIndicator(relAngle) {
    _dmgInds.push({ angle: relAngle, life: 1.8, maxLife: 1.8 });
}

function drawDamageIndicators(dt) {
    const W = innerWidth, H = innerHeight;
    if (_dirCanvas.width !== W || _dirCanvas.height !== H) {
        _dirCanvas.width = W;
        _dirCanvas.height = H;
    }
    _dirCtx.clearRect(0, 0, W, H);
    if (_dmgInds.length === 0) return;

    const cx = W * 0.5, cy = H * 0.5;
    const r  = Math.min(W, H) * 0.42;

    for (let i = _dmgInds.length - 1; i >= 0; i--) {
        const ind = _dmgInds[i];
        ind.life -= dt;
        if (ind.life <= 0) { _dmgInds.splice(i, 1); continue; }

        const alpha  = ind.life / ind.maxLife;
        // relAngle: 0=앞(12시), +π/2=오른쪽(3시), +π=뒤(6시), -π/2=왼쪽(9시)
        // Canvas: 0=3시, +π/2=6시 → canvasAngle = relAngle - π/2
        const cAngle = ind.angle - Math.PI * 0.5;
        const sweep  = 0.44; // ≈25° 반폭

        const gr = _dirCtx.createRadialGradient(cx, cy, r * 0.48, cx, cy, r);
        gr.addColorStop(0,    `rgba(255,20,0,0)`);
        gr.addColorStop(0.55, `rgba(255,20,0,${(0.68 * alpha).toFixed(3)})`);
        gr.addColorStop(1,    `rgba(255,20,0,0)`);

        _dirCtx.save();
        _dirCtx.beginPath();
        _dirCtx.moveTo(cx, cy);
        _dirCtx.arc(cx, cy, r, cAngle - sweep, cAngle + sweep);
        _dirCtx.closePath();
        _dirCtx.fillStyle = gr;
        _dirCtx.fill();
        _dirCtx.restore();
    }
}

const _scopeCanvas = document.getElementById('scope-canvas');
const _scopeCtx    = _scopeCanvas.getContext('2d');
let _scopeW = 0;
let _scopeH = 0;

// Resize scope canvas only when dimensions change (not every frame)
window.addEventListener('resize', () => {
    _scopeW = 0; // force resize on next drawScopeOverlay call
    _scopeH = 0;
});

function drawScopeOverlay(isAWP) {
    const W = innerWidth;
    const H = innerHeight;
    // Only resize canvas if dimensions actually changed
    if (_scopeCanvas.width !== W || _scopeCanvas.height !== H) {
        _scopeCanvas.width  = W;
        _scopeCanvas.height = H;
        _scopeW = W;
        _scopeH = H;
    }
    const cx = W * 0.5, cy = H * 0.5;
    const r  = Math.min(W, H) * (isAWP ? 0.278 : 0.308);

    _scopeCtx.clearRect(0, 0, W, H);

    // 검은 비네팅 (원 바깥)
    _scopeCtx.beginPath();
    _scopeCtx.rect(0, 0, W, H);
    _scopeCtx.arc(cx, cy, r, 0, Math.PI * 2, true);
    _scopeCtx.fillStyle = 'rgba(0,0,0,0.97)';
    _scopeCtx.fill();

    // 스코프 링 테두리
    _scopeCtx.beginPath();
    _scopeCtx.arc(cx, cy, r, 0, Math.PI * 2);
    _scopeCtx.strokeStyle = 'rgba(90,90,90,0.55)';
    _scopeCtx.lineWidth = 2.5;
    _scopeCtx.stroke();

    // 크로스헤어 색상
    const chColor = 'rgba(10,10,10,0.78)';
    const gap     = isAWP ? 14 : 10; // 중앙 공백
    _scopeCtx.strokeStyle = chColor;
    _scopeCtx.lineWidth   = isAWP ? 1.2 : 1.5;

    // 세로선 (위 / 아래)
    _scopeCtx.beginPath(); _scopeCtx.moveTo(cx, cy - r + 3); _scopeCtx.lineTo(cx, cy - gap); _scopeCtx.stroke();
    _scopeCtx.beginPath(); _scopeCtx.moveTo(cx, cy + gap);   _scopeCtx.lineTo(cx, cy + r - 3); _scopeCtx.stroke();
    // 가로선 (왼 / 오른)
    _scopeCtx.beginPath(); _scopeCtx.moveTo(cx - r + 3, cy); _scopeCtx.lineTo(cx - gap, cy); _scopeCtx.stroke();
    _scopeCtx.beginPath(); _scopeCtx.moveTo(cx + gap, cy);   _scopeCtx.lineTo(cx + r - 3, cy); _scopeCtx.stroke();

    if (isAWP) {
        // AWP 밀도트: 가로선 위 4개
        _scopeCtx.fillStyle = chColor;
        for (const dx of [-r*0.5, -r*0.25, r*0.25, r*0.5]) {
            _scopeCtx.beginPath();
            _scopeCtx.arc(cx + dx, cy, 2.8, 0, Math.PI * 2);
            _scopeCtx.fill();
        }
        // 세로선 아래 1개 (원거리 보정점)
        _scopeCtx.beginPath();
        _scopeCtx.arc(cx, cy + r * 0.3, 2.2, 0, Math.PI * 2);
        _scopeCtx.fill();
    } else {
        // M14: 가로 서브 눈금 (±r*0.4)
        _scopeCtx.lineWidth = 1.0;
        _scopeCtx.strokeStyle = chColor;
        for (const dx of [-r*0.4, r*0.4]) {
            _scopeCtx.beginPath();
            _scopeCtx.moveTo(cx + dx, cy - 6);
            _scopeCtx.lineTo(cx + dx, cy + 6);
            _scopeCtx.stroke();
        }
    }
}

function updateHUD() {
    const w = player.weapons[player.currentWeapon];

    // Health
    document.getElementById('health-fill').style.width = `${(player.health / player.maxHealth) * 100}%`;

    // Ammo
    if (w.dropped) {
        document.getElementById('ammo-current').textContent = '0';
        document.getElementById('ammo-reserve').textContent = '0';
        document.getElementById('weapon-name').textContent  = 'EMPTY';
    } else {
        document.getElementById('ammo-current').textContent = w.melee ? '---' : (w.reloading ? '...' : w.ammo);
        document.getElementById('ammo-reserve').textContent = w.melee ? '\u221e' : w.reserve;
        document.getElementById('weapon-name').textContent  = w.name;
    }

    // Live score (kill score only; bonuses shown at mission end)
    document.getElementById('score-display').textContent = `SCORE: ${(kills * 100).toLocaleString()}`;

    // Crosshair spread
    const spread = player.currentSpread;
    const gap = 6 + spread * 250;
    document.querySelector('.ch-top').style.bottom    = `calc(50% + ${gap}px)`;
    document.querySelector('.ch-bottom').style.top    = `calc(50% + ${gap}px)`;
    document.querySelector('.ch-left').style.right    = `calc(50% + ${gap}px)`;
    document.querySelector('.ch-right').style.left    = `calc(50% + ${gap}px)`;
}

function drawMinimap() {
    const canvas = document.getElementById('minimap-canvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const rows = MAP.length, cols = MAP[0].length;
    const sx = W / (cols * CELL), sz = H / (rows * CELL);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#606468';
    ctx.fillRect(0, 0, W, H);

    // Walls
    ctx.fillStyle = '#aaaaaa';
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (MAP[r][c] === 1) {
                ctx.fillRect(c * CELL * sx, r * CELL * sz, CELL * sx + 1, CELL * sz + 1);
            }
        }
    }

    // Enemies
    for (const e of enemies) {
        if (e.state === STATE.DEAD)   { ctx.fillStyle = '#333'; }
        else if (e.state === STATE.ATTACK) { ctx.fillStyle = '#f22'; }
        else if (e.state === STATE.ALERT)  { ctx.fillStyle = '#fa0'; }
        else { ctx.fillStyle = '#660'; }
        ctx.fillRect(e.pos.x * sx - 2, e.pos.z * sz - 2, 4, 4);
    }

    // Player dot + direction
    const px = player.pos.x * sx, pz = player.pos.z * sz;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(px, pz, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, pz);
    ctx.lineTo(px - Math.sin(player.yaw) * 10, pz - Math.cos(player.yaw) * 10);
    ctx.stroke();
}

let _msgTimer = null;
function showMessage(text, duration = 1600) {
    const el = document.getElementById('message');
    el.textContent = text;
    el.style.opacity = 1;
    if (_msgTimer) clearTimeout(_msgTimer);
    _msgTimer = setTimeout(() => { el.style.opacity = 0; }, duration);
}
