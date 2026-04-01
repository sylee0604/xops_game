# XOPS GAME — AI REFERENCE (2026-04-01)

## FILE MAP
```
index.html           HTML+CSS + 보안 로더 (fetch→Function 클로저, startGame만 window 노출)
js/constants.js      CELL·WALL_H·GRAVITY 상수, STATE enum, MAP[][], ENEMY_DATA[], CRATE_POS[], WEAPON_DEFS[], makeWeapons()
js/events.js         GameEvents pub-sub 버스 (on/emit/off)
js/state.js          scene·camera·renderer·clock, player{}, walls[], enemies[], allies[], bullets[], impacts[], pickups[], platforms[], _tv1/_tv2/_tv3
js/audio.js          getAudioCtx(), playGunshot(idx), playEnemyGunshot(idx)
js/physics.js        resolveWallCollision(pos,radius,feetY), segmentHitsSphere(p0,p1,center,radius)
js/particles.js      파티클 풀 시스템 — updateBursts(dt), spawnMuzzleFlash(pos), spawnImpactSpark(pos,color)
js/pickups.js        buildPickupGroup(idx), createPickup(x,z,wIdx,ammo,deskY), updatePickups(), dropWeapon()
js/enemies.js        canSeePlayer(e), spawnEnemies(), spawnEnemyAt(x,z,wpList,isZombie,floorY=0)
                     spawnAllyAt(x,z), spawnHarborEnemies(), spawnTunnelZombies()
                     spawnAssaultEnemies(), spawnAssaultAllies(), spawnAssaultPickups()
                     updateEnemies(dt), updateAllies(dt), enemyShoot(e), hitEnemy(e,dmg), killEnemy(e)
js/bullets.js        spawnBullet(origin,dir,dmg,isPlayer,speed), updateBullets(dt), spawnImpact(pos,color), updateImpacts(dt)
js/weapons.js        buildWeaponGroup(idx), createWeaponModels(), updateWeaponViewModel(), getWeaponForKey(k)
                     switchWeapon(idx), startReload(), playerShoot()
                     damagePlayer(dmg, fromAngle=null)   ← fromAngle → showDamageIndicator 호출
                     triggerGameOver(), calcMissionScore(), getGrade(total), _resultHTML(...)
js/hud.js            showDamageIndicator(relAngle), drawDamageIndicators(dt)
                     drawScopeOverlay(isAWP), updateHUD(), drawMinimap(), showMessage(text,ms)
js/player.js         updatePlayer(dt), setupInput()
js/maps/combat.js    buildMap(), buildLighting(), spawnPickups()
js/maps/harbor.js    buildHarborMap(), spawnHarborEnemies(), spawnHarborPickups()
js/maps/tunnel.js    buildTunnelMap(), spawnTunnelZombies()
js/maps/training.js  buildTrainingMap(), makeTargetTexture(), getTargetTexture(), createTarget(), createWedgeHill()
js/maps/assault.js   buildAssaultMap(), spawnAssaultEnemies(), spawnAssaultAllies(), spawnAssaultPickups()
js/maps/survival.js  buildSurvivalMap(), updateSurvival(dt), onSurvivalWaveClear(), _spawnSurvivalWave()
                     survivalWave (let, 전역 공유)
js/game.js           initThree(), gameLoop(), MAP_REGISTRY{}, _showMissionComplete(), _resetToKnife(), startGame(mapType)
```

## SCRIPT LOAD ORDER (index.html — 변경 금지)
```
three.js CDN → constants → events → state → audio → physics → particles
→ pickups → enemies → bullets → weapons → hud → player
→ maps/combat → maps/harbor → maps/tunnel → maps/training → maps/assault → maps/survival → game
```
모든 파일이 단일 Function 클로저 스코프 공유. import/export 없음. 순서 변경 금지.

---

## KEY CONSTANTS (constants.js)
```js
CELL=3, WALL_H=3.2, PLAYER_HEIGHT=1.4, PLAYER_RADIUS=0.38
GRAVITY=-18, JUMP_FORCE=7, MOVE_SPEED=5.5, CROUCH_SPEED=2.2
STEP_HEIGHT=0.65
STATE = { PATROL:0, ALERT:1, SCAN:2, ATTACK:3, DEAD:4 }
```

## WEAPON_DEFS 구조 (constants.js)
```js
// 인덱스: 0=DE  1=AK  2=Knife  3=AWP  4=M14  5=MP5  6=SPAS  7=M249
{
  id, name,
  ammo, reserve, maxAmmo,
  damage, fireRate, recoil, spread, bulletSpeed, auto, reloadTime,
  shotVar: [playbackRate, lpfHz, hpfHz, gain],
  viewPos: [우, 상, 전방],
  viewRot: [pitch, yaw, roll],
  adsFov,        // ADS FOV (없으면 ADS 없음)
  pellets,       // 산탄
  melee:true, meleeRange,
}
```

## PLAYER 객체 (state.js)
```js
player.pos, player.vel          // THREE.Vector3
player.yaw, player.pitch
player.health, player.maxHealth
player.currentWeapon            // 0~7
player.weapons[i].ammo/.reserve/.maxAmmo/.reloading/.dropped/.shootTimer/._reloadTimer
player.onGround, player.adsLocked, player.adsInScope
player.recoilPitch, player.currentSpread
player.isStealth                // 크라우치+이동 중
player.carrySlots               // [null|idx, null|idx] 무기 슬롯
```

## ENEMY 객체
```js
{
  mesh,           // THREE.Group
  bodyMesh,       // vest Mesh — 피격 색상 변경용
  pos,            // THREE.Vector3 (XZ)
  baseY,          // 층 오프셋 (0=1F, 4.5=2F)
  state,          // STATE.*
  health, speed, sightRange, damage,
  shootTimer, shootCooldown,
  reactDelay,     // 발견 후 첫 발사 딜레이
  isZombie,
  waypoints[], wpIndex,
  facing,         // 라디안
  attackTarget,   // null | ally 객체
}
```

## 전역 배열 (state.js)
```
walls[]        {box:THREE.Box3}
wallMeshList[] THREE.Mesh             — 적 시야 레이캐스트
enemies[]      적 객체
allies[]        아군 객체
bullets[]      (max 60)
impacts[]
pickups[]      {mesh,glow,pos,weaponIndex,ammo,active,persistent}
platforms[]    {minX,maxX,minZ,maxZ,y}
```

## 전역 스칼라 (state.js / game.js)
```
gameStarted, gamePaused, currentMap
enemiesEnabled                  — F키 토글 (training 기본 false)
TOTAL_ENEMIES                   — kill-counter 분모
kills, damageTaken, missionStartTime, missionTime
survivalWave                    — survival.js에 선언, game.js kiaSubtitle에서 참조
```

## REUSE VECTORS
```js
_tv1/_tv2/_tv3   // 핫루프 안에서 new THREE.Vector3() 금지
```

---

## MAP_REGISTRY 패턴 (game.js)
```js
const MAP_REGISTRY = {
  mapKey: {
    setup()     { /* buildMap() + spawnEnemies() + player 초기화 */ },
    update(dt)  { /* 매 프레임 (없으면 생략) */ },
    onAllDead() { /* 'all_enemies_dead' 이벤트 수신 시 */ },
    kiaSubtitle:() => 'K.I.A.',   // 사망 화면 부제 (없으면 기본)
    msg: '시작 메시지', msgDur: 2500,
  },
};
```
`startGame()` 내부에서 `MAP_REGISTRY[currentMap]?.setup()` 호출 후
`GameEvents.off('all_enemies_dead')` → `GameEvents.on('all_enemies_dead', mapDef.onAllDead)` 등록.
`gameLoop()` 내부에서 `MAP_REGISTRY[currentMap]?.update?.(dt)` 호출.

## GameEvents 이벤트 버스 (events.js)
```js
GameEvents.on('event_name', fn)    // 리스너 등록
GameEvents.emit('event_name', data)// 발생
GameEvents.off('event_name')       // 전체 제거 (맵 전환 시)
```
정의된 이벤트:
- `'enemy_killed'`  — payload: `{ enemy, fromAlly }`
- `'all_enemies_dead'` — payload: none

## 데미지 방향 인디케이터 (hud.js + bullets.js + weapons.js)
```
bullets.js : 적 총알이 플레이어 히트 시
  const _s = Math.sin(player.yaw), _c = Math.cos(player.yaw);
  relAngle = Math.atan2(-b.dir.x*_c + b.dir.z*_s, b.dir.x*_s + b.dir.z*_c)
  // relAngle=0 → 정면, π/2 → 우측

weapons.js : damagePlayer(dmg, fromAngle=null)
  → showDamageIndicator(fromAngle) 호출

hud.js : showDamageIndicator(relAngle) → _dmgInds[] push
         drawDamageIndicators(dt) → dir-canvas에 arc 렌더 (game.js의 gameLoop에서 호출)
```

## Material 공유 전략 (enemies.js)
```
_MAT_GUN  / _MAT_WOOD — 모듈 레벨 전역 상수 (모든 유닛 공유)
  → 안전: gunGroup은 THREE.Group (no .material),
    killEnemy의 forEach가 children을 탐색하지 않음

unifMat / clothMat — 유닛 생성마다 new (유닛 간 색상 변경 분리 필요)
  → 같은 유닛 내 모든 팔다리는 .clone() 없이 단일 인스턴스 공유
  → 안전: 유닛 사망 시 같은 인스턴스로 limb 전체가 일괄 어두워짐

사망 다크닝 코드 (변경 금지):
  e.mesh.children.forEach(c => { if (c.material) c.material.color.set(0x111111); });
```

## Survival 웨이브 모드 (maps/survival.js)
```
웨이브 공식: count = 3 + survivalWave*2  (Wave1=5, Wave2=7 ...)
속도 배율:  speedMult = 1 + (survivalWave-1)*0.10
TOTAL_ENEMIES += count 누적 (점수 분모)
```
`onSurvivalWaveClear()` → `GameEvents.on('all_enemies_dead', ...)` 재등록 후
다음 웨이브 카운트다운 시작.

## 점수 시스템 (weapons.js → game.js)
```js
calcMissionScore()  → { kills, time, damageTaken, total }
getGrade(total)     → 'S'|'A'|'B'|'C'|'D'
_resultHTML(title, color, subtitle, sc, grade, showRetry)
```

---

## startGame() 흐름
```
initThree() → createWeaponModels() → setupInput() → getAudioCtx()
→ MAP_REGISTRY[currentMap].setup()
→ GameEvents.off('all_enemies_dead') + on(mapDef.onAllDead)
→ showMessage(mapDef.msg, mapDef.msgDur)
→ 점수/타이머 초기화
→ updateWeaponViewModel()   ← 반드시 currentWeapon 설정 후
→ gameLoop()
```

## gameLoop() 업데이트 순서
```
updatePlayer → updateEnemies → MAP_REGISTRY[currentMap]?.update(dt)
→ updateBullets → updateImpacts → updatePickups → updateBursts
→ updateHUD → drawDamageIndicators
→ renderer.clear → render(scene,camera) → clearDepth → render(weaponScene,weaponCamera)
  (player.adsInScope 시 weapon scene 렌더 생략)
```

---

## 맵 추가 절차 (MAP_REGISTRY 방식)

**1.** `js/maps/newmap.js` 생성
```js
'use strict';
function buildNewMap() {
    scene.background = new THREE.Color(0x...);
    scene.fog = new THREE.FogExp2(0x..., 0.015);
    muzzleLight = new THREE.PointLight(0xffcc44, 0, 6); scene.add(muzzleLight);
    // 바닥/벽 → walls[], wallMeshList[] 등록
}
function spawnNewMapEnemies() {
    TOTAL_ENEMIES = N;
    spawnEnemyAt(x, z, [{x,z},{x,z}], false /*, floorY*/);
    document.getElementById('kill-counter').textContent = `KILLS: 0 / ${TOTAL_ENEMIES}`;
}
```

**2.** `index.html` `_GAME_FILES` 배열에 `'js/maps/newmap.js'` 추가 (survival.js 앞, game.js 앞)

**3.** `game.js` `MAP_REGISTRY`에 항목 추가
```js
newmap: {
    setup() {
        buildNewMap(); spawnNewMapEnemies();
        _resetToKnife();
        player.pos.set(x, PLAYER_HEIGHT, z);
        player.yaw = Math.PI;
    },
    msg: 'MISSION N — ...', msgDur: 2500,
    onAllDead: _showMissionComplete,
},
```

**4.** `index.html` 메뉴 버튼 추가
```html
<button id="start-btn" style="border-color:#COLOR;color:#COLOR"
        onclick="startGame('newmap')">&#9654;  MISSION N — NAME</button>
```

---

## 무기 추가 절차

**1. constants.js** → `WEAPON_DEFS` 배열 끝에 항목 추가 (인덱스 = 배열 끝)

**2. weapons.js** → `buildWeaponGroup(idx)` 에 `else if (idx === N)` 분기

**3. weapons.js** → `getWeaponForKey()` mainIdx 딕셔너리 업데이트
```js
const mainIdx = { combat:1, harbor:4, tunnel:7, newmap:N }[currentMap] ?? 1;
```

**4. game.js** → 해당 맵 MAP_REGISTRY `setup()`에서 `player.currentWeapon = N`

---

## 2층 구조 패턴
```js
const slab = new THREE.Mesh(new THREE.BoxGeometry(w,0.3,d), mat);
slab.position.set(cx, 4.35, cz);  // 표면 y=4.5
scene.add(slab);
walls.push({ box: new THREE.Box3().setFromObject(slab) });
addPlatform(minX, maxX, minZ, maxZ, 4.5);
spawnEnemyAt(x, z, wps, false, 4.5);  // floorY=4.5
```

## 계단 패턴 (7단, y=0.30→4.50)
```js
for (let s = 0; s < 7; s++) {
    const surfY = s < 6 ? 0.30 + s * 0.75 : 4.50;
    const stairZ = startZ + s * 0.7;
    const st = new THREE.Mesh(new THREE.BoxGeometry(width, surfY, 0.7), mat);
    st.position.set(centerX, surfY/2, stairZ);
    scene.add(st);
    walls.push({ box: new THREE.Box3().setFromObject(st) });
    addPlatform(centerX-width/2, centerX+width/2, stairZ-0.35, stairZ+0.35, surfY);
}
```

## 충돌 등록 패턴
```js
walls.push({ box: new THREE.Box3().setFromObject(mesh) });  // 이동+총알 충돌
wallMeshList.push(mesh);                                     // 적 시야 차단 (불투명만)
```

---

## 성능 규칙
```
루프 안 new THREE.Vector3() 금지  → _tv1/_tv2/_tv3 재사용
거리 비교는 distanceSq            → dx*dx+dz*dz < r*r
적 상태는 STATE.* enum            → 문자열 비교 금지
총알 상한 60개                     → spawnBullet() 첫 줄 가드
죽은 적 3초 후 splice              → killEnemy() setTimeout 안에 enemies.splice(idx,1)
Material 공유                      → 유닛 내 같은 색 limb는 단일 인스턴스 (clone 금지)
                                     gun/wood는 _MAT_GUN/_MAT_WOOD 전역 공유
```
