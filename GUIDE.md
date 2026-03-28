# XOPS GAME — AI REFERENCE

## FILE MAP
```
index.html          HTML+CSS + <script src> 로드 순서
js/constants.js     CELL·WALL_H·GRAVITY 등 상수, STATE enum, MAP[][], ENEMY_DATA[], CRATE_POS[], WEAPON_DEFS[], makeWeapons()
js/state.js         scene·camera·renderer·clock, player{}, walls[], enemies[], bullets[], impacts[], pickups[], platforms[], _tv1/_tv2/_tv3
js/audio.js         getAudioCtx(), playGunshot(idx), playEnemyGunshot(idx)
js/physics.js       resolveWallCollision(pos,radius,feetY), segmentHitsSphere(p0,p1,center,radius)
js/pickups.js       buildPickupGroup(idx), createPickup(x,z,wIdx,ammo,deskY), updatePickups(), dropWeapon()
js/enemies.js       canSeePlayer(e), spawnEnemies(), spawnEnemyAt(x,z,wpList,isZombie,floorY=0), spawnHarborEnemies(), spawnTunnelZombies(), updateEnemies(dt), enemyShoot(e), hitEnemy(e,dmg), killEnemy(e)
js/bullets.js       spawnBullet(origin,dir,dmg,isPlayer,speed), updateBullets(dt), spawnImpact(pos,color), updateImpacts(dt)
js/weapons.js       buildWeaponGroup(idx), createWeaponModels(), updateWeaponViewModel(), getWeaponForKey(k), switchWeapon(idx), startReload(), playerShoot(), damagePlayer(dmg)
js/hud.js           drawScopeOverlay(isAWP), updateHUD(), drawMinimap(), showMessage(text,ms)
js/player.js        updatePlayer(dt), setupInput()
js/maps/combat.js   buildMap(), buildLighting()
js/maps/harbor.js   buildHarborMap(), spawnHarborEnemies()  ← addContainer/addCraneBox/addOfficeWall/addForklift 로컬
js/maps/tunnel.js   buildTunnelMap(), spawnTunnelZombies()
js/maps/training.js buildTrainingMap(), makeTargetTexture(), getTargetTexture(), createTarget(), createWedgeHill()
js/game.js          initThree(), gameLoop(), startGame(mapType)
```

## SCRIPT LOAD ORDER (index.html)
```
three.js CDN → constants → state → audio → physics → pickups → enemies → bullets → weapons → hud → player → maps/* → game
```
순서 변경 금지. 모든 파일이 전역 스코프 공유 (import/export 없음).

---

## KEY CONSTANTS (constants.js)
```js
CELL=3, WALL_H=3.2, PLAYER_HEIGHT=1.4, PLAYER_RADIUS=0.38
GRAVITY=-18, JUMP_FORCE=7, MOVE_SPEED=5.5, CROUCH_SPEED=2.2
STEP_HEIGHT=0.65   // 자동 스텝업 최대 높이
STATE = { PATROL:0, ALERT:1, SCAN:2, ATTACK:3, DEAD:4 }
```

## WEAPON_DEFS 구조 (constants.js)
```js
// 인덱스: 0=DE  1=AK  2=Knife  3=AWP  4=M14  5=MP5  6=SPAS  7=M249
{
  id, name,
  ammo, reserve, maxAmmo,
  damage, fireRate, recoil, spread, bulletSpeed, auto, reloadTime,
  shotVar: [playbackRate, lpfHz, hpfHz, gain],   // null이면 총소리 없음
  viewPos: [우, 상, 전방],                        // 카메라 기준 뷰모델 위치
  viewRot: [pitch, yaw, roll],
  // 선택:
  adsFov,          // ADS 시 FOV (없으면 ADS 없음)
  pellets,         // 산탄 수
  melee:true, meleeRange,   // 근접무기
}
```
`weaponBasePos`, `weaponBaseRot`, `USER_SHOT_VAR` → WEAPON_DEFS에서 자동 파생
`makeWeapons()` → 런타임 상태 추가된 배열 반환 (ammo/reloading/dropped 등)

## PLAYER 객체 (state.js)
```js
player.pos          // THREE.Vector3 (발 기준)
player.vel          // 속도
player.yaw/pitch    // 카메라 각도 (라디안)
player.health/maxHealth
player.currentWeapon  // 0~7
player.weapons[i]   // 런타임 무기 상태
  .ammo/.reserve/.maxAmmo
  .reloading, .dropped, .shootTimer
  ._reloadTimer      // setTimeout ID (전환 시 clearTimeout용)
player.onGround, adsLocked, recoilPitch, currentSpread
```

## ENEMY 객체 (enemies.js)
```js
{
  mesh, bodyMesh,      // Three.js Group, vest Mesh (피격 색상 변경용)
  pos,                 // THREE.Vector3 (XZ 이동)
  baseY,               // 층 높이 오프셋 (0=1F, 4.5=2F)
  state,               // STATE.* 열거형
  health, speed, sightRange, damage,
  shootTimer, shootCooldown,
  reactDelay,          // 발견 후 첫 발사 딜레이 (0.5s)
  isZombie,
  waypoints[], wpIndex,
  facing,              // 현재 향하는 방향 (라디안)
}
```

## 전역 배열 (state.js)
```
walls[]        {box:THREE.Box3}       이동+총알 충돌
wallMeshList[] THREE.Mesh             적 시야 레이캐스트
enemies[]      적 객체
bullets[]      투사체 객체 (최대 60개)
impacts[]      이펙트 객체
pickups[]      {mesh,glow,pos,weaponIndex,ammo,active,persistent}
platforms[]    {minX,maxX,minZ,maxZ,y}   플랫폼 표면
```

## REUSE VECTORS (state.js)
```js
_tv1/_tv2/_tv3   // 핫루프 안에서 new THREE.Vector3() 금지, 이것 사용
```

---

## 무기 추가 절차

**1. constants.js** → `WEAPON_DEFS` 배열에 항목 추가 (인덱스 = 배열 끝)

**2. weapons.js** → `buildWeaponGroup(idx)` 에 `else if (idx === N)` 분기 추가
뷰모델: `THREE.Group`에 `THREE.Mesh` 파츠들 `add()`. Z=앞뒤, Y=상하, X=좌우.

**3. weapons.js** → `getWeaponForKey()` 에서 맵별 mainIdx 딕셔너리 업데이트
```js
const mainIdx = { combat:1, harbor:4, tunnel:7, newmap:N }[currentMap] ?? 1;
```

**4. game.js** → `startGame()` 새 맵 분기에서 `player.currentWeapon = N` 설정

---

## 맵 추가 절차

**1.** `js/maps/newmap.js` 생성
```js
'use strict';
function buildNewMap() {
    scene.background = new THREE.Color(0x...);
    scene.fog = new THREE.FogExp2(0x..., 0.015);
    muzzleLight = new THREE.PointLight(0xffcc44, 0, 6); scene.add(muzzleLight);
    // 바닥/벽 추가 → walls[], wallMeshList[] 등록
    // 2층 있으면 → addPlatform(minX,maxX,minZ,maxZ,surfY)
}
function spawnNewMapEnemies() {
    TOTAL_ENEMIES = N;
    spawnEnemyAt(x, z, [{x,z},{x,z}], false /*, floorY*/);
    document.getElementById('kill-counter').textContent = `KILLS: 0 / ${TOTAL_ENEMIES}`;
}
```

**2. index.html** → training.js 다음 줄에 `<script src="js/maps/newmap.js"></script>` 추가

**3. game.js** → `startGame()` 에 분기 추가
```js
} else if (currentMap === 'newmap') {
    buildNewMap();
    spawnNewMapEnemies();
    player.currentWeapon = 1;
    player.pos.set(x, PLAYER_HEIGHT, z);
    player.yaw = Math.PI;
    showMessage('MISSION N — ...', 2500);
}
```

**4. index.html** → 메뉴 버튼 추가
```html
<button id="start-btn" style="border-color:#COLOR;color:#COLOR"
        onclick="startGame('newmap')">▶  MISSION N — NAME</button>
```

---

## 2층 구조 패턴
```js
// 슬라브 (바닥판) — cy=4.35이면 표면 y=4.5
const slab = new THREE.Mesh(new THREE.BoxGeometry(w,0.3,d), mat);
slab.position.set(cx, 4.35, cz);
scene.add(slab);
walls.push({ box: new THREE.Box3().setFromObject(slab) });
addPlatform(minX, maxX, minZ, maxZ, 4.5);

// 2층 적
spawnEnemyAt(x, z, wps, false, 4.5);
```

## 계단 패턴 (7단, 표면 y=0.30→4.50)
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
거리 비교는 distanceSq            → const distSq=dx*dx+dz*dz; if(distSq<r*r)
적 상태는 STATE.* enum            → 문자열 비교 금지
캔버스 resize는 window resize만   → hud.js 참고
총알 상한 60개                     → spawnBullet() 첫 줄에 가드
죽은 적 3초 후 splice              → killEnemy() setTimeout 안에 enemies.splice(idx,1)
```

## startGame() 흐름 (game.js)
```
initThree() → createWeaponModels() → setupInput() → getAudioCtx()
→ buildMap() + spawnEnemies()   (맵별)
→ player.currentWeapon = N
→ player.pos.set(...)
→ updateWeaponViewModel()       ← 반드시 currentWeapon 설정 후
→ gameLoop()
```

## gameLoop() 업데이트 순서
```
updatePlayer → updateEnemies → updateBullets → updateImpacts → updatePickups → updateHUD → render×2
```
