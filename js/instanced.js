'use strict';

// =====================================================================
// INSTANCED ENEMY RENDERER
//
// 모든 적/아군 모델을 InstancedMesh로 렌더링.
// 결과: 적 수에 무관하게 고정 ~55 draw call (기존 적 10명 시 ~200).
//
// 공개 API (EnemyRenderer):
//   init(scene)                          — initThree() 직후 호출
//   allocate(type)                       — 스폰 시 instanceIdx 반환
//   free(idx, type)                      — 제거 시 인스턴스 반환
//   updateAll(enemiesArr, alliesArr)     — gameLoop에서 매 프레임 호출
//   flashHit(idx, type)                  — 피격 flash
//   setDeadPose(idx, type, pos, facing, baseY) — 사망 처리
//   reset()                              — 서바이벌 웨이브 초기화
// =====================================================================

const ITYPE = Object.freeze({ SOLDIER: 0, ZOMBIE: 1, ALLY: 2 });
const _IMAX  = { [0]: 50, [1]: 30, [2]: 8 }; // SOLDIER / ZOMBIE / ALLY 최대 인스턴스 수

// ── 파트별 기본 색상 (type별) ─────────────────────────────────────────────────
const _ICOLORS = [
    { cloth:0x2d5016, vest:0x1e3a0f, helmet:0x1a2e0a, boot:0x111111, skin:0xb07040, eye:0x111111, gun:0x1a1a1a, wood:0x7a4f1a }, // SOLDIER
    { cloth:0x3a2a1a, vest:0x3a2a1a, helmet:0x111111,  boot:0x111111, skin:0x7a9a60, eye:0xcc0000, gun:0x111111, wood:0x111111 }, // ZOMBIE
    { cloth:0x2a3a5a, vest:0x3a4e6a, helmet:0x1a2a4a, boot:0x111111, skin:0xb07040, eye:0x111111, gun:0x1a1a1a, wood:0x7a4f1a }, // ALLY
];

// ── 파트 정의 (n:이름, g:_GEO key, m:재질, lp:로컬위치, lr:로컬회전, ck:색상키, gc:gunGroup자식) ──
// m: 'b'=MeshPhong body, 'e'=MeshBasic eye, 'g'=MeshPhong gun(shininess 60)
function _soldierParts() {
    return [
        { n:'lLeg',  g:'leg',    m:'b', lp:[-0.10,0.30,  0],      lr:[0,0,0],       ck:'cloth'  },
        { n:'rLeg',  g:'leg',    m:'b', lp:[ 0.10,0.30,  0],      lr:[0,0,0],       ck:'cloth'  },
        { n:'lBoot', g:'boot',   m:'b', lp:[-0.10,0.045, 0.02],   lr:[0,0,0],       ck:'boot'   },
        { n:'rBoot', g:'boot',   m:'b', lp:[ 0.10,0.045, 0.02],   lr:[0,0,0],       ck:'boot'   },
        { n:'torso', g:'torso',  m:'b', lp:[ 0,   0.92,  0],      lr:[0,0,0],       ck:'cloth'  },
        { n:'vest',  g:'vest',   m:'b', lp:[ 0,   0.94,  0.01],   lr:[0,0,0],       ck:'vest'   },
        { n:'lUA',   g:'uArm',   m:'b', lp:[-0.25,1.10,  0],      lr:[0,0,0],       ck:'cloth'  },
        { n:'lLA',   g:'lArm',   m:'b', lp:[-0.25,0.84,  0],      lr:[0,0,0],       ck:'cloth'  },
        { n:'rUA',   g:'uArm',   m:'b', lp:[ 0.25,1.10,  0],      lr:[0,0,0],       ck:'cloth'  },
        { n:'rLA',   g:'lArm',   m:'b', lp:[ 0.25,0.84, -0.08],   lr:[-0.35,0,0],   ck:'cloth'  },
        { n:'neck',  g:'neck',   m:'b', lp:[ 0,   1.32,  0],      lr:[0,0,0],       ck:'cloth'  },
        { n:'head',  g:'head',   m:'b', lp:[ 0,   1.50,  0],      lr:[0,0,0],       ck:'skin'   },
        { n:'helm',  g:'helm',   m:'b', lp:[ 0,   1.60,  0.01],   lr:[0,0,0],       ck:'helmet' },
        { n:'brim',  g:'brim',   m:'b', lp:[ 0,   1.53, -0.145],  lr:[0,0,0],       ck:'helmet' },
        { n:'lEye',  g:'eye',    m:'e', lp:[-0.052,1.50,-0.115],  lr:[0,0,0],       ck:'eye'    },
        { n:'rEye',  g:'eye',    m:'e', lp:[ 0.052,1.50,-0.115],  lr:[0,0,0],       ck:'eye'    },
        // Gun parts (gunGroup child: pos(0.32,1.04,-0.16) rot.x=0.32)
        { n:'gBody', g:'gBody',  m:'g', lp:[ 0,   0,     0],      lr:[0,0,0],       ck:'gun', gc:1 },
        { n:'gBar',  g:'gBarrel',m:'g', lp:[ 0,   0.015,-0.31],   lr:[0,0,0],       ck:'gun', gc:1 },
        { n:'gMag',  g:'gMag',   m:'g', lp:[ 0,  -0.075,-0.02],   lr:[0,0,0],       ck:'gun', gc:1 },
        { n:'gMag2', g:'gMag2',  m:'g', lp:[ 0,  -0.13, -0.045],  lr:[0.35,0,0],    ck:'gun', gc:1 },
        { n:'gStk',  g:'gStock', m:'g', lp:[ 0,  -0.008, 0.28],   lr:[0,0,0],       ck:'wood',gc:1 },
        { n:'gHG',   g:'gHG',    m:'g', lp:[ 0,  -0.015,-0.16],   lr:[0,0,0],       ck:'wood',gc:1 },
    ];
}

function _zombieParts() {
    return [
        { n:'lLeg',  g:'leg',    m:'b', lp:[-0.10,0.30,  0],      lr:[0,0,0],       ck:'cloth' },
        { n:'rLeg',  g:'leg',    m:'b', lp:[ 0.10,0.30,  0],      lr:[0,0,0],       ck:'cloth' },
        { n:'lBoot', g:'boot',   m:'b', lp:[-0.10,0.045, 0.02],   lr:[0,0,0],       ck:'boot'  },
        { n:'rBoot', g:'boot',   m:'b', lp:[ 0.10,0.045, 0.02],   lr:[0,0,0],       ck:'boot'  },
        { n:'torso', g:'torso',  m:'b', lp:[ 0,   0.92,  0],      lr:[0,0,0],       ck:'cloth' },
        { n:'vest',  g:'vest',   m:'b', lp:[ 0,   0.94,  0.01],   lr:[0,0,0],       ck:'vest'  },
        // 좀비: 팔 앞으로 뻗음
        { n:'lUA',   g:'uArm',   m:'b', lp:[-0.22,1.15, -0.12],   lr:[-0.9,0,0],    ck:'cloth' },
        { n:'lLA',   g:'lArm',   m:'b', lp:[-0.22,0.90, -0.30],   lr:[-0.9,0,0],    ck:'cloth' },
        { n:'rUA',   g:'uArm',   m:'b', lp:[ 0.22,1.15, -0.12],   lr:[-0.9,0,0],    ck:'cloth' },
        { n:'rLA',   g:'lArm',   m:'b', lp:[ 0.22,0.90, -0.30],   lr:[-0.9,0,0],    ck:'cloth' },
        { n:'neck',  g:'neck',   m:'b', lp:[ 0,   1.32,  0],      lr:[0,0,0],       ck:'cloth' },
        // 좀비: 머리 숙임
        { n:'head',  g:'head',   m:'b', lp:[ 0,   1.45, -0.06],   lr:[0.35,0,0],    ck:'skin'  },
        { n:'lEye',  g:'eye',    m:'e', lp:[-0.052,1.44,-0.12],   lr:[0,0,0],       ck:'eye'   },
        { n:'rEye',  g:'eye',    m:'e', lp:[ 0.052,1.44,-0.12],   lr:[0,0,0],       ck:'eye'   },
    ];
}

function _allyParts() {
    return [
        { n:'lLeg',  g:'leg',    m:'b', lp:[-0.10,0.30,  0],      lr:[0,0,0],       ck:'cloth'  },
        { n:'rLeg',  g:'leg',    m:'b', lp:[ 0.10,0.30,  0],      lr:[0,0,0],       ck:'cloth'  },
        { n:'lBoot', g:'boot',   m:'b', lp:[-0.10,0.045, 0.02],   lr:[0,0,0],       ck:'boot'   },
        { n:'rBoot', g:'boot',   m:'b', lp:[ 0.10,0.045, 0.02],   lr:[0,0,0],       ck:'boot'   },
        { n:'torso', g:'torso',  m:'b', lp:[ 0,   0.92,  0],      lr:[0,0,0],       ck:'cloth'  },
        { n:'vest',  g:'vest',   m:'b', lp:[ 0,   0.94,  0.01],   lr:[0,0,0],       ck:'vest'   },
        { n:'lUA',   g:'uArm',   m:'b', lp:[-0.25,1.10,  0],      lr:[0,0,0],       ck:'cloth'  },
        { n:'lLA',   g:'lArm',   m:'b', lp:[-0.25,0.84,  0],      lr:[0,0,0],       ck:'cloth'  },
        { n:'rUA',   g:'uArm',   m:'b', lp:[ 0.25,1.10,  0],      lr:[0,0,0],       ck:'cloth'  },
        { n:'rLA',   g:'lArm',   m:'b', lp:[ 0.25,0.84, -0.08],   lr:[-0.35,0,0],   ck:'cloth'  },
        { n:'neck',  g:'neck',   m:'b', lp:[ 0,   1.32,  0],      lr:[0,0,0],       ck:'cloth'  },
        { n:'head',  g:'head',   m:'b', lp:[ 0,   1.50,  0],      lr:[0,0,0],       ck:'skin'   },
        { n:'helm',  g:'helm',   m:'b', lp:[ 0,   1.60,  0.01],   lr:[0,0,0],       ck:'helmet' },
        { n:'brim',  g:'brim',   m:'b', lp:[ 0,   1.53, -0.145],  lr:[0,0,0],       ck:'helmet' },
        { n:'lEye',  g:'eye',    m:'e', lp:[-0.052,1.50,-0.115],  lr:[0,0,0],       ck:'eye'    },
        { n:'rEye',  g:'eye',    m:'e', lp:[ 0.052,1.50,-0.115],  lr:[0,0,0],       ck:'eye'    },
        { n:'gBody', g:'gBody',  m:'g', lp:[ 0,   0,     0],      lr:[0,0,0],       ck:'gun', gc:1 },
        { n:'gBar',  g:'gBarrel',m:'g', lp:[ 0,   0.015,-0.31],   lr:[0,0,0],       ck:'gun', gc:1 },
        { n:'gMag',  g:'gMag',   m:'g', lp:[ 0,  -0.075,-0.02],   lr:[0,0,0],       ck:'gun', gc:1 },
        { n:'gStk',  g:'gStock', m:'g', lp:[ 0,  -0.008, 0.28],   lr:[0,0,0],       ck:'wood',gc:1 },
    ];
}

// ── 핫패스 GC 방지용 사전 할당 임시 변수 ────────────────────────────────────────
const _i_gp  = new THREE.Vector3();   // group world pos
const _i_gq  = new THREE.Quaternion(); // group world quat
const _i_ggp = new THREE.Vector3();   // gunGroup world pos
const _i_ggq = new THREE.Quaternion(); // gunGroup world quat
const _i_pp  = new THREE.Vector3();   // part world pos
const _i_pq  = new THREE.Quaternion(); // part world quat
const _i_e   = new THREE.Euler();
const _i_m   = new THREE.Matrix4();
const _i_S1  = new THREE.Vector3(1, 1, 1);
const _IHIDDEN = new THREE.Matrix4().makeScale(0.001, 0.001, 0.001);
const _IDARK   = new THREE.Color(0x111111);
const _IRED    = new THREE.Color(0xff2200);

// gunGroup 로컬 변환 상수 (모든 총기류 적 공통)
const _I_GUN_LP = new THREE.Vector3(0.32, 1.04, -0.16);
const _I_GUN_LQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.32, 0, 0));

// ── EnemyRenderer ─────────────────────────────────────────────────────────────
const EnemyRenderer = (() => {
    let _pools = null; // { [ITYPE]: { partDefs, meshes:{n:InstancedMesh}, free:[], maxCount, cols } }

    // 그룹 월드 변환 계산 (_i_gp, _i_gq, _i_ggp, _i_ggq 갱신)
    function _computeGroup(pos, facing, walkBob, isDead, baseY) {
        _i_gp.set(pos.x, isDead ? baseY - 0.3 : baseY + walkBob, pos.z);
        _i_e.set(0, facing, isDead ? Math.PI / 2 : 0);
        _i_gq.setFromEuler(_i_e);
        // gunGroup 월드 변환 미리 계산 (총 있는 유닛에만 사용)
        _i_ggp.copy(_I_GUN_LP).applyQuaternion(_i_gq).add(_i_gp);
        _i_ggq.copy(_i_gq).multiply(_I_GUN_LQ);
    }

    // 파트 하나의 월드 행렬을 _i_m에 기록
    function _setPartMat(pd) {
        const bp = pd.gc ? _i_ggp : _i_gp;
        const bq = pd.gc ? _i_ggq : _i_gq;
        _i_pp.set(pd.lp[0], pd.lp[1], pd.lp[2]).applyQuaternion(bq).add(bp);
        _i_pq.copy(bq).multiply(pd._lq);
        _i_m.compose(_i_pp, _i_pq, _i_S1);
    }

    // 풀 생성 (초기화 시 1회)
    function _buildPool(type, partDefs, maxCount, scene, matB, matE, matG) {
        // 파트별 로컬 쿼터니언 캐시 (Euler→Quat은 초기화 시 1회만)
        for (const pd of partDefs) {
            pd._lq = new THREE.Quaternion().setFromEuler(new THREE.Euler(pd.lr[0], pd.lr[1], pd.lr[2]));
        }

        const cols   = _ICOLORS[type];
        const meshes = {};

        for (const pd of partDefs) {
            const mat = (pd.m === 'e') ? matE : (pd.m === 'g') ? matG : matB;
            const im  = new THREE.InstancedMesh(_GEO[pd.g], mat, maxCount);
            im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            im.castShadow    = true;
            im.receiveShadow = false;

            const col = new THREE.Color(cols[pd.ck] ?? 0xffffff);
            for (let i = 0; i < maxCount; i++) {
                im.setMatrixAt(i, _IHIDDEN);
                im.setColorAt(i, col);
            }
            im.instanceMatrix.needsUpdate = true;
            im.instanceColor.needsUpdate  = true;

            scene.add(im);
            meshes[pd.n] = im;
        }

        const free = [];
        for (let i = maxCount - 1; i >= 0; i--) free.push(i);

        return { partDefs, meshes, free, maxCount, cols };
    }

    // 인스턴스 행렬 일괄 갱신 (그룹 변환 이미 계산된 상태에서 호출)
    function _writeMatrices(pool, idx) {
        for (const pd of pool.partDefs) {
            _setPartMat(pd);
            pool.meshes[pd.n].setMatrixAt(idx, _i_m);
        }
    }

    return {
        init(sceneRef) {
            // 공유 재질: 색은 흰색(1,1,1) → 인스턴스 색으로 완전 제어
            const matB = new THREE.MeshPhongMaterial({ color: 0xffffff });
            const matE = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const matG = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 60 });

            _pools = {
                [ITYPE.SOLDIER]: _buildPool(ITYPE.SOLDIER, _soldierParts(), _IMAX[0], sceneRef, matB, matE, matG),
                [ITYPE.ZOMBIE]:  _buildPool(ITYPE.ZOMBIE,  _zombieParts(),  _IMAX[1], sceneRef, matB, matE, matG),
                [ITYPE.ALLY]:    _buildPool(ITYPE.ALLY,    _allyParts(),    _IMAX[2], sceneRef, matB, matE, matG),
            };
        },

        // 빈 인스턴스 슬롯 할당, 없으면 -1
        allocate(type) {
            const pool = _pools?.[type];
            return (pool && pool.free.length > 0) ? pool.free.pop() : -1;
        },

        // 인스턴스 숨기고 반환 (e.instanceIdx = -1 후 호출 금지 방지)
        free(idx, type) {
            if (idx < 0 || !_pools) return;
            const pool = _pools[type];
            if (!pool) return;
            for (const pd of pool.partDefs) {
                pool.meshes[pd.n].setMatrixAt(idx, _IHIDDEN);
                pool.meshes[pd.n].instanceMatrix.needsUpdate = true;
            }
            pool.free.push(idx);
        },

        // 매 프레임: 살아있는 유닛의 행렬 갱신
        updateAll(enemiesArr, alliesArr) {
            if (!_pools) return;

            for (const e of enemiesArr) {
                if (e.instanceIdx < 0 || e.state === STATE.DEAD) continue;
                const pool = _pools[e.instanceType];
                if (!pool) continue;
                _computeGroup(e.pos, e.facing, Math.sin(e.walkPhase) * 0.03, false, e.baseY ?? 0);
                _writeMatrices(pool, e.instanceIdx);
            }

            for (const a of alliesArr) {
                if (a.instanceIdx < 0 || a.state === STATE.DEAD) continue;
                const pool = _pools[ITYPE.ALLY];
                if (!pool) continue;
                _computeGroup(a.pos, a.facing, Math.sin(a.walkPhase) * 0.03, false, 0);
                _writeMatrices(pool, a.instanceIdx);
            }

            // 모든 풀의 instanceMatrix dirty 플래그 설정
            for (const type in _pools) {
                for (const pd of _pools[type].partDefs) {
                    _pools[type].meshes[pd.n].instanceMatrix.needsUpdate = true;
                }
            }
        },

        // 조끼(vest) 빨간 flash → 80ms 후 원래 색 복원
        flashHit(idx, type) {
            if (idx < 0 || !_pools) return;
            const pool = _pools[type];
            if (!pool) return;
            const vestMesh = pool.meshes['vest'];
            if (!vestMesh) return;
            vestMesh.setColorAt(idx, _IRED);
            vestMesh.instanceColor.needsUpdate = true;
            const baseCol = new THREE.Color(pool.cols['vest']);
            setTimeout(() => {
                if (!_pools?.[type]) return;
                vestMesh.setColorAt(idx, baseCol);
                vestMesh.instanceColor.needsUpdate = true;
            }, 80);
        },

        // 사망 포즈 적용 + 전 파트 어둡게
        setDeadPose(idx, type, pos, facing, baseY) {
            if (idx < 0 || !_pools) return;
            const pool = _pools[type];
            if (!pool) return;
            _computeGroup(pos, facing, 0, true, baseY ?? 0);
            _writeMatrices(pool, idx);
            for (const pd of pool.partDefs) {
                const im = pool.meshes[pd.n];
                im.setColorAt(idx, _IDARK);
                im.instanceMatrix.needsUpdate = true;
                im.instanceColor.needsUpdate  = true;
            }
        },

        // 서바이벌 웨이브 초기화: 전 인스턴스 숨기고 free 리스트 리셋
        reset() {
            if (!_pools) return;
            for (const type in _pools) {
                const pool  = _pools[type];
                pool.free.length = 0;
                for (let i = pool.maxCount - 1; i >= 0; i--) pool.free.push(i);
                for (const pd of pool.partDefs) {
                    const im  = pool.meshes[pd.n];
                    const col = new THREE.Color(pool.cols[pd.ck] ?? 0xffffff);
                    for (let i = 0; i < pool.maxCount; i++) {
                        im.setMatrixAt(i, _IHIDDEN);
                        im.setColorAt(i, col);
                    }
                    im.instanceMatrix.needsUpdate = true;
                    im.instanceColor.needsUpdate  = true;
                }
            }
        },
    };
})();
