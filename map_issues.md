# 최신 3개 맵 문제점 분석

> 분석 일자: 2026-04-04
> 대상 파일 (최근 수정순): `survival.js` (Apr 3) → `escort.js` (Apr 3) → `defuse.js` (Apr 2)

---

## 1. `survival.js` — SURVIVAL 무한 웨이브

### 1-1. [심각] 전역 상태 변수 재시작 시 미초기화

```js
// 파일 최상단 (모듈 로드 시 1회만 초기화됨)
let survivalWave    = 0;
let _svWaveActive   = false;
let _svNextWaveIn   = 3.5;
```

`buildSurvivalMap()` 또는 `MAP_REGISTRY.survival.setup()` 어디에도 세 변수를 초기값으로 리셋하는 코드가 없다.
게임을 한 번 플레이한 뒤 재시작하면 `survivalWave`가 이전 웨이브에서 이어지고,
`_svWaveActive`가 `true`로 남아 대기 타이머 자체가 동작하지 않는다.

**재현**: SURVIVAL 웨이브를 진행 후 메인 메뉴로 돌아가 다시 SURVIVAL 시작 → 웨이브 카운터가 이어지거나 즉시 웨이브가 시작됨.

**수정 방향**: `buildSurvivalMap()` 맨 위에 세 변수를 초기값으로 리셋.

---

### 1-2. [심각] EnemyRenderer double-free 위험

`_spawnSurvivalWave()` (line 44-45):
```js
EnemyRenderer.reset();   // 모든 인스턴스 초기화
enemies.length = 0;      // 배열 비움
```

`killEnemy()` (enemies.js line 585-590):
```js
setTimeout(() => {
    const idx = enemies.indexOf(e);
    if (idx !== -1) enemies.splice(idx, 1);
    EnemyRenderer.free(e.instanceIdx, e.instanceType); // ← 3초 후 실행
}, 3000);
```

흐름:
1. 웨이브 클리어 → `onSurvivalWaveClear()` → `_svNextWaveIn = 5.0`
2. 5초 대기 → `_spawnSurvivalWave()` → `EnemyRenderer.reset()` + `enemies.length = 0`
3. 직전 웨이브 적들의 3초 setTimeout이 아직 살아있으면 `EnemyRenderer.free(인스턴스)`를 이미 reset()된 풀에 재호출

`reset()` 이후 `free()` 가 특정 인덱스에 대해 실행될 경우 인스턴스 풀 상태 불일치 및 렌더링 아티팩트 가능.

**수정 방향**: `_spawnSurvivalWave` 진입 전 이전 kill setTimeout을 취소하거나, `free()` 호출 전 `instanceIdx`가 유효한지 검사.

---

### 1-3. [중간] 킬 카운터 형식 불일치

`killEnemy()` (enemies.js line 579):
```js
document.getElementById('kill-counter').textContent = `KILLS: ${kills} / ${TOTAL_ENEMIES}`;
```

`updateSurvival()` (line 37):
```js
document.getElementById('kill-counter').textContent = `KILLS: ${kills}`;
```

매 프레임 `updateSurvival`이 `KILLS: X` 형식으로 덮어쓰므로 `KILLS: X / TOTAL` 형식이 즉시 사라짐.
TOTAL_ENEMIES는 누적 스폰 수라 의미가 다르긴 하지만, 형식 불일치로 순간적으로 `/` 표시가 깜빡이는 현상 발생.

**수정 방향**: `updateSurvival`의 킬 카운터를 `KILLS: ${kills}` 단독 형식으로 통일하고,
`killEnemy`에서 SURVIVAL 모드일 때 별도 분기 처리하거나 `kill-counter` 업데이트를 맵별 update 콜백에 위임.

---

### 1-4. [낮음] `addPlatform` 범위가 맵 경계 초과

```js
addPlatform(-4, W + 4, -4, D + 4, 0);  // -4 ~ 44 (맵은 0~40)
```

플레이어가 외벽을 뚫거나 넘어가는 경우 맵 바깥 8유닛까지 바닥 충돌이 유지됨.
의도된 여분일 수 있으나 외벽과 platform 범위가 정확히 일치하는 편이 안전.

---

## 2. `escort.js` — MISSION 7 VIP 호위

### 2-1. [치명] VIP 벽 충돌 미처리

`updateEscort()` (line 295-303) VIP 이동 코드:
```js
_escortVip.pos.x += nx * _escortVip.speed * dt;
_escortVip.pos.z += nz * _escortVip.speed * dt;
```

`resolveWallCollision(_escortVip.pos, 0.35)` 호출이 **전혀 없다**.
VIP는 경로를 따라 직선 이동하므로, 양측 건물(x=-1~1, x=20~25 구간 외벽)이나
도로 내 엄폐물과 충돌 처리 없이 통과함.

**재현**: 미션 시작 → VIP가 건물 외벽을 그대로 뚫고 지나가는 것 확인.

**수정 방향**: VIP 위치 업데이트 직후 `resolveWallCollision(_escortVip.pos, 0.35)` 추가.

---

### 2-2. [심각] 적이 VIP를 조기에 처치 가능 (밸런스 문제)

`updateEnemies()` (enemies.js line 169-186)에서 `allies` 배열을 순회해 VIP를 `visibleAlly`로 설정하고 공격함.
VIP는 `sightRange: 0`, `damage: 0`으로 반격하지 못하며,
VIP 체력(100)이 총격에 쉽게 소모됨.

특히 1구역 적(z≈18~22)이 VIP 시작 위치(z=5)와 가깝지 않지만,
VIP가 첫 waypoint(z=12)로 이동하는 도중 sightRange 35인 적에게 발각될 수 있음.

**수정 방향**:
- VIP 오브젝트에 `isVip` 플래그가 이미 있으므로, `updateEnemies`에서 `visibleAlly` 판정 시 `isVip`인 ally는 타겟에서 제외하거나
- VIP 체력을 높이거나 무적 구간 추가 (플레이어가 엄호하기 전 구간)

---

### 2-3. [중간] VIP 정지 거리 18m가 게임플레이를 방해

```js
const _VIP_PAUSE_PLAYER_DIST = 18; // 플레이어가 이것보다 멀면 VIP 정지
```

맵 전체 길이가 52유닛인데, 플레이어가 적을 처치하며 빠르게 전진하면
VIP(z=5 시작)와의 거리가 18m를 쉽게 초과해 VIP가 계속 기다림.
적이 없는 상황에서도 플레이어가 20m 이상 앞서 있으면 VIP가 멈춰 미션 진행이 지체됨.

**수정 방향**: `_VIP_PAUSE_PLAYER_DIST`를 25~30으로 상향하거나,
플레이어가 일정 구역(z 임계값)을 통과하면 VIP가 해당 구역까지 무조건 전진하는 트리거 방식 도입.

---

### 2-4. [낮음] `wave-display` 초기 텍스트가 setup에서만 설정

```js
// game.js escort setup
document.getElementById('wave-display').textContent = 'VIP HP: 100';
```

`_vipHUD()`는 매 프레임 업데이트되므로 큰 문제는 없으나,
VIP 스폰 전 첫 프레임에 `_escortVip`가 `null`이면 `_vipHUD()`에서 `VIP: K.I.A.` 텍스트가 잠시 표시될 수 있음.

---

## 3. `defuse.js` — MISSION 6 폭탄 해제

### 3-1. [치명] `spawnImpactSpark` 미정의 함수 호출

`_triggerBombExplosion()` (line 284-292):
```js
for (let i = 0; i < 10; i++) {
    spawnImpactSpark(   // ← 전체 코드베이스에 이 함수가 존재하지 않음
        new THREE.Vector3(...),
        0xff4400
    );
}
```

`particles.js`에는 `spawnBurst`, `spawnDecal`만 있고 `spawnImpactSpark`는 없다.
`bullets.js`에는 `spawnImpact(pos, color)`가 있으며, 이것이 의도된 함수로 보임.

**결과**: 폭탄 폭발 시 `ReferenceError: spawnImpactSpark is not defined` 발생 →
`_triggerBombExplosion` 실행이 중단되어 `_defuseFailed = true`가 설정되지 않을 수 있고
overlay 표시 setTimeout이 등록되지 않아 **미션 실패 처리 전체가 멈춤**.

**수정 방향**: `spawnImpactSpark` → `spawnImpact`로 교체.

---

### 3-2. [심각] 씬 정리 없이 폭탄 재생성 (메모리 누수)

`buildDefuseMap()` (line 143-149):
```js
_bombs = [];   // 이전 폭탄 참조만 제거
_bombs.push(_makeDefuseBomb( 7, 44));
_bombs.push(_makeDefuseBomb(20, 46));
_bombs.push(_makeDefuseBomb(33, 44));
```

`_makeDefuseBomb()`은 내부에서 `scene.add(group)`, `scene.add(light)`를 호출한다.
재시작 시 이전 폭탄 Group과 PointLight가 씬에서 제거되지 않아:
- 이전 폭탄 메시가 화면에 그대로 남음
- PointLight가 누적되어 씬 조명이 비정상적으로 밝아짐

**수정 방향**: `buildDefuseMap()` 진입 시 기존 `_bombs` 배열을 순회해
`scene.remove(b.group)`, `scene.remove(b.light)` 후 `_bombs = []` 처리.

---

### 3-3. [중간] `_defuseHUDText()`에서 'A' 하드코딩 오타

```js
// line 183
if (b.defused) return `[A${labels[i]}:SAFE]`;
//                      ^^ 불필요한 'A' 프리픽스
```

- Bomb B 해제 시: `[AB:SAFE]` (의도: `[B:SAFE]`)
- Bomb C 해제 시: `[AC:SAFE]` (의도: `[C:SAFE]`)
- Bomb A 해제 시: `[AA:SAFE]` (의도: `[A:SAFE]`)

**수정 방향**: `` `[A${labels[i]}:SAFE]` `` → `` `[${labels[i]}:SAFE]` ``

---

### 3-4. [중간] 플레이어 시작 위치가 분리벽에 즉시 막힘

플레이어 시작: `x=20, z=2`
안전구역 분리벽 배치:
```js
addWall( 5,  6, 10, 0.4);   // x=0~10 막음
addWall(20,  6, 10, 0.4);   // x=15~25 막음  ← 시작 x=20이 이 구간에 해당
addWall(35,  6, 10, 0.4);   // x=30~40 막음
```

출입구는 `x=10~15`(서쪽)와 `x=25~30`(동쪽)에 있으나,
플레이어 시작 x=20은 막힌 구간 중앙이어서 **z+ 방향 직진이 불가**.
초보 플레이어는 입구를 못 찾고 벽에 막혀 혼란스러울 수 있음.

**수정 방향**: 플레이어 시작 x를 `10~15` 또는 `25~30` 구간으로 조정하거나,
분리벽 출입구를 x=15~25 (시작 지점 정면)으로 변경.

---

## 요약 우선순위

| 순위 | 파일 | 문제 | 심각도 |
|------|------|------|--------|
| 1 | defuse.js | `spawnImpactSpark` 미정의 → 폭발 시 런타임 에러, 미션 실패 처리 중단 | **치명** |
| 2 | escort.js | VIP 벽 충돌 없음 → VIP가 건물 통과 | **치명** |
| 3 | survival.js | 전역 상태 미초기화 → 재시작 시 웨이브 이어짐 | **심각** |
| 4 | survival.js | EnemyRenderer double-free → 렌더 아티팩트 | **심각** |
| 5 | escort.js | 적이 VIP를 너무 쉽게 처치 → 미션 밸런스 붕괴 | **심각** |
| 6 | defuse.js | 씬 정리 없이 폭탄 재생성 → 재시작 시 이전 폭탄 잔존 | **심각** |
| 7 | defuse.js | `_defuseHUDText` 'A' 하드코딩 오타 → 잘못된 HUD | **중간** |
| 8 | defuse.js | 플레이어 시작 위치가 분리벽 정면 → 직진 불가 | **중간** |
| 9 | escort.js | VIP 정지 거리 18m → 게임플레이 지체 | **중간** |
| 10 | survival.js | 킬 카운터 형식 불일치 | **낮음** |
