'use strict';

// =====================================================================
// WEAPONS
// =====================================================================

function buildWeaponGroup(idx) {
    const g = new THREE.Group();

    if (idx === 0) { // DESERT EAGLE
        const deMetal = new THREE.MeshPhongMaterial({ color: 0x252525, shininess: 90 });
        const deSlide = new THREE.MeshPhongMaterial({ color: 0x1c1c1c, shininess: 110 });
        const deGrip  = new THREE.MeshPhongMaterial({ color: 0x0e0e0e, shininess: 15 });
        const deFrame = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.078, 0.22), deMetal);
        deFrame.position.set(0, -0.010, 0);
        const deSld = new THREE.Mesh(new THREE.BoxGeometry(0.060, 0.052, 0.27), deSlide);
        deSld.position.set(0, 0.038, -0.050);
        const deStep = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.020, 0.10), deSlide);
        deStep.position.set(0, 0.072, 0.058);
        const deBrl = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.07), deMetal);
        deBrl.position.set(0, 0.014, -0.220);
        const deGas = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.016, 0.13), deMetal);
        deGas.position.set(0, -0.006, -0.160);
        const deTG = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.028, 0.078), deMetal);
        deTG.position.set(0, -0.049, -0.035);
        const deGripM = new THREE.Mesh(new THREE.BoxGeometry(0.066, 0.118, 0.082), deGrip);
        deGripM.position.set(0, -0.098, 0.068);
        const deMagBot = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.013, 0.080), deGrip);
        deMagBot.position.set(0, -0.164, 0.068);
        const deHammer = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.026, 0.014), deMetal);
        deHammer.position.set(0, 0.036, 0.122);
        deHammer.rotation.x = -0.28;
        const deFSBase = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.012, 0.016), deMetal);
        deFSBase.position.set(0, 0.066, -0.206);
        const deFSPost = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.018, 0.005), deMetal);
        deFSPost.position.set(0, 0.084, -0.206);
        const deRSBase  = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.010, 0.014), deMetal);
        deRSBase.position.set(0, 0.076, 0.090);
        const deRSLeft  = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.016, 0.007), deMetal);
        deRSLeft.position.set(-0.014, 0.086, 0.090);
        const deRSRight = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.016, 0.007), deMetal);
        deRSRight.position.set( 0.014, 0.086, 0.090);
        g.add(deFrame, deSld, deStep, deBrl, deGas, deTG, deGripM, deMagBot, deHammer,
              deFSBase, deFSPost, deRSBase, deRSLeft, deRSRight);

    } else if (idx === 1) { // AK-47
        const akMetal = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, shininess: 60 });
        const akWood  = new THREE.MeshPhongMaterial({ color: 0x5a3010, shininess: 15 });
        const akDark  = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 40 });
        const akRec = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.065, 0.35), akMetal);
        const akBrl = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.020, 0.32), akMetal);
        akBrl.position.set(0, 0.010, -0.335);
        const akGas = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.016, 0.20), akMetal);
        akGas.position.set(0, 0.035, -0.28);
        const akUHG = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.022, 0.16), akWood);
        akUHG.position.set(0, 0.028, -0.23);
        const akLHG = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.036, 0.18), akWood);
        akLHG.position.set(0, -0.006, -0.23);
        const akGrip = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.120, 0.048), akWood);
        akGrip.position.set(0, -0.076, 0.095);
        akGrip.rotation.x = -0.75;
        const akStk = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.050, 0.21), akWood);
        akStk.position.set(0, -0.012, 0.265);
        akStk.rotation.x = 0.06;
        const akButt = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.072, 0.016), akWood);
        akButt.position.set(0, -0.020, 0.374);
        const akMag1 = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.115, 0.044), akDark);
        akMag1.position.set(0, -0.088, -0.040);
        const akMag2 = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.060, 0.042), akDark);
        akMag2.position.set(0, -0.160, -0.054);
        akMag2.rotation.x = 0.42;
        const akMag3 = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.040, 0.036), akDark);
        akMag3.position.set(0, -0.198, -0.080);
        akMag3.rotation.x = 0.78;
        const akFSBase = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.032, 0.024), akMetal);
        akFSBase.position.set(0, 0.024, -0.474);
        const akFSPost = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.020, 0.005), akMetal);
        akFSPost.position.set(0, 0.050, -0.474);
        const akRSBase = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.010, 0.026), akMetal);
        akRSBase.position.set(0, 0.042, -0.075);
        const akRSLeft  = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.018, 0.008), akMetal);
        akRSLeft.position.set(-0.014, 0.052, -0.075);
        const akRSRight = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.018, 0.008), akMetal);
        akRSRight.position.set( 0.014, 0.052, -0.075);
        const akCH = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.014, 0.026), akMetal);
        akCH.position.set(-0.034, 0.010, 0.018);
        g.add(akRec, akBrl, akGas, akUHG, akLHG, akGrip, akStk, akButt,
              akMag1, akMag2, akMag3,
              akFSBase, akFSPost, akRSBase, akRSLeft, akRSRight, akCH);

    } else if (idx === 2) { // KNIFE
        const bladeMat = new THREE.MeshPhongMaterial({ color: 0xd0d0d0, shininess: 120 });
        const edgeMat  = new THREE.MeshPhongMaterial({ color: 0xb0b0b0, shininess: 140 });
        const kHndlMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, shininess: 20 });
        const kBlade = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.012, 0.26), bladeMat);
        kBlade.position.set(0, 0, -0.09);
        const kEdge  = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.004, 0.25), edgeMat);
        kEdge.position.set(0, -0.008, -0.09);
        const kHndl  = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.042, 0.14), kHndlMat);
        kHndl.position.set(0, 0, 0.10);
        const kGuard = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.018, 0.026), kHndlMat);
        kGuard.position.set(0, 0, 0.02);
        g.add(kBlade, kEdge, kHndl, kGuard);

    } else if (idx === 3) { // AWP
        const awpMetal = new THREE.MeshPhongMaterial({ color: 0x222222, shininess: 70 });
        const awpGreen = new THREE.MeshPhongMaterial({ color: 0x2a3a1a, shininess: 10 });
        const awpScope = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 80 });
        const awpLens  = new THREE.MeshPhongMaterial({ color: 0x224488, shininess: 200 });
        const awpRec  = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.050, 0.52), awpMetal);
        const awpBrl  = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.55), awpMetal);
        awpBrl.position.set(0, 0.010, -0.480);
        const awpScopeBase = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.018, 0.20), awpScope);
        awpScopeBase.position.set(0, 0.042, -0.050);
        const awpScopeTube = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.024, 0.18), awpScope);
        awpScopeTube.position.set(0, 0.058, -0.050);
        const awpScopeFront = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.034, 0.016), awpLens);
        awpScopeFront.position.set(0, 0.058, -0.148);
        const awpScopeRear = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.028, 0.016), awpLens);
        awpScopeRear.position.set(0, 0.058, 0.048);
        const awpBolt = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.038, 0.012), awpMetal);
        awpBolt.position.set(0.034, 0.012, 0.060);
        const awpGrip = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.120, 0.048), awpGreen);
        awpGrip.position.set(0, -0.080, 0.080);
        awpGrip.rotation.x = -0.70;
        const awpStk  = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.042, 0.20), awpGreen);
        awpStk.position.set(0, 0.000, 0.270);
        const awpButt = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.066, 0.018), awpGreen);
        awpButt.position.set(0, 0.000, 0.372);
        const awpTG   = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.024, 0.060), awpMetal);
        awpTG.position.set(0, -0.040, 0.018);
        const awpMag  = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.054, 0.040), awpMetal);
        awpMag.position.set(0, -0.060, -0.052);
        const awpBipL = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.040, 0.006), awpMetal);
        awpBipL.position.set(-0.026, -0.042, -0.340);
        awpBipL.rotation.x = 0.5;
        const awpBipR = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.040, 0.006), awpMetal);
        awpBipR.position.set( 0.026, -0.042, -0.340);
        awpBipR.rotation.x = 0.5;
        g.add(awpRec, awpBrl, awpScopeBase, awpScopeTube, awpScopeFront, awpScopeRear,
              awpBolt, awpGrip, awpStk, awpButt, awpTG, awpMag, awpBipL, awpBipR);

    } else if (idx === 4) { // M14 EBR
        const ebrMetal = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, shininess: 60 });
        const ebrTan   = new THREE.MeshPhongMaterial({ color: 0x8a7050, shininess: 15 });
        const ebrRec  = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.058, 0.38), ebrMetal);
        const ebrBrl  = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.36), ebrMetal);
        ebrBrl.position.set(0, 0.008, -0.370);
        const ebrMuzz = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.022, 0.040), ebrMetal);
        ebrMuzz.position.set(0, 0.008, -0.568);
        const ebrGas  = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.014, 0.22), ebrMetal);
        ebrGas.position.set(0, 0.034, -0.290);
        const ebrHG   = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.030, 0.20), ebrTan);
        ebrHG.position.set(0, 0.000, -0.250);
        const ebrGrip = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.110, 0.044), ebrTan);
        ebrGrip.position.set(0, -0.075, 0.070);
        ebrGrip.rotation.x = -0.72;
        const ebrMag1 = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.095, 0.040), ebrMetal);
        ebrMag1.position.set(0, -0.090, -0.020);
        const ebrMag2 = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.050, 0.038), ebrMetal);
        ebrMag2.position.set(0, -0.142, -0.034);
        ebrMag2.rotation.x = 0.38;
        const ebrStk  = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.040, 0.16), ebrTan);
        ebrStk.position.set(0, 0.000, 0.240);
        const ebrButt = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.062, 0.016), ebrTan);
        ebrButt.position.set(0, 0.000, 0.325);
        const ebrFS   = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.030, 0.020), ebrMetal);
        ebrFS.position.set(0, 0.030, -0.488);
        const ebrRS   = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.010, 0.024), ebrMetal);
        ebrRS.position.set(0, 0.040, -0.080);
        // 스코프 (리시버 위 레일 마운트)
        const ebrScopeRail  = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 80 });
        const ebrScopeLens  = new THREE.MeshPhongMaterial({ color: 0x1a3a6a, shininess: 220 });
        const ebrSBase = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.014, 0.16), ebrScopeRail);
        ebrSBase.position.set(0, 0.042, -0.120);
        const ebrSTube = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.020, 0.14), ebrScopeRail);
        ebrSTube.position.set(0, 0.056, -0.120);
        const ebrSFront = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.028, 0.014), ebrScopeLens);
        ebrSFront.position.set(0, 0.056, -0.197);
        const ebrSRear  = new THREE.Mesh(new THREE.BoxGeometry(0.023, 0.023, 0.014), ebrScopeLens);
        ebrSRear.position.set(0, 0.056, -0.040);
        g.add(ebrRec, ebrBrl, ebrMuzz, ebrGas, ebrHG, ebrGrip,
              ebrMag1, ebrMag2, ebrStk, ebrButt, ebrFS, ebrRS,
              ebrSBase, ebrSTube, ebrSFront, ebrSRear);

    } else if (idx === 5) { // MP5
        const mp5Metal = new THREE.MeshPhongMaterial({ color: 0x1c1c1c, shininess: 55 });
        const mp5Dark  = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 30 });
        const mp5Rec  = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.052, 0.24), mp5Metal);
        const mp5Brl  = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.016, 0.16), mp5Metal);
        mp5Brl.position.set(0, 0.008, -0.200);
        const mp5FH   = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.032), mp5Metal);
        mp5FH.position.set(0, 0.008, -0.296);
        const mp5TG   = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.024, 0.060), mp5Metal);
        mp5TG.position.set(0, -0.038, -0.020);
        const mp5Grip = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.110, 0.040), mp5Dark);
        mp5Grip.position.set(0, -0.076, 0.060);
        mp5Grip.rotation.x = -0.72;
        const mp5Mag1 = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.100, 0.036), mp5Dark);
        mp5Mag1.position.set(0, -0.090, -0.018);
        const mp5Mag2 = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.050, 0.030), mp5Dark);
        mp5Mag2.position.set(0, -0.142, -0.028);
        mp5Mag2.rotation.x = 0.35;
        const mp5StkT = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.016, 0.18), mp5Metal);
        mp5StkT.position.set(0, 0.032, 0.175);
        const mp5StkB = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.016, 0.18), mp5Metal);
        mp5StkB.position.set(0, -0.016, 0.175);
        const mp5Butt = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.050, 0.016), mp5Metal);
        mp5Butt.position.set(0, 0.010, 0.268);
        const mp5CH   = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.010, 0.030), mp5Metal);
        mp5CH.position.set(0.028, 0.025, -0.050);
        const mp5FS   = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.028, 0.018), mp5Metal);
        mp5FS.position.set(0, 0.030, -0.294);
        g.add(mp5Rec, mp5Brl, mp5FH, mp5TG, mp5Grip,
              mp5Mag1, mp5Mag2, mp5StkT, mp5StkB, mp5Butt, mp5CH, mp5FS);

    } else if (idx === 6) { // SPAS-12
        const spMetal = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, shininess: 50 });
        const spDark  = new THREE.MeshPhongMaterial({ color: 0x0e0e0e, shininess: 15 });
        const spRec   = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.068, 0.30), spMetal);
        const spBrl   = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.026, 0.24), spMetal);
        spBrl.position.set(0, 0.006, -0.270);
        const spTube  = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.016, 0.24), spMetal);
        spTube.position.set(0, -0.018, -0.270);
        const spPump  = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.038, 0.060), spDark);
        spPump.position.set(0, -0.006, -0.220);
        const spFore  = new THREE.Mesh(new THREE.BoxGeometry(0.060, 0.032, 0.14), spDark);
        spFore.position.set(0, 0.006, -0.160);
        const spTG    = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.028, 0.065), spMetal);
        spTG.position.set(0, -0.050, -0.020);
        const spGrip  = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.110, 0.050), spDark);
        spGrip.position.set(0, -0.090, 0.080);
        spGrip.rotation.x = -0.70;
        const spStkC  = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.020, 0.060), spMetal);
        spStkC.position.set(0, -0.002, 0.175);
        const spStkT  = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.17), spMetal);
        spStkT.position.set(0, 0.012, 0.258);
        const spButt  = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.058, 0.018), spMetal);
        spButt.position.set(0, 0.004, 0.346);
        const spMCap  = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.020, 0.014), spMetal);
        spMCap.position.set(0, -0.018, -0.392);
        g.add(spRec, spBrl, spTube, spPump, spFore, spTG, spGrip,
              spStkC, spStkT, spButt, spMCap);

    } else { // M249 — 두꺼운 분대지원화기
        const lgMetal   = new THREE.MeshPhongMaterial({ color: 0x1c1c1c, shininess: 60 });
        const lgTan     = new THREE.MeshPhongMaterial({ color: 0x7a6040, shininess: 15 });
        const lgDark    = new THREE.MeshPhongMaterial({ color: 0x252525, shininess: 35 });
        const lgMagMat  = new THREE.MeshPhongMaterial({ color: 0x303030, shininess: 25 });

        // 리시버 — 두꺼운 본체
        const lgRec = new THREE.Mesh(new THREE.BoxGeometry(0.076, 0.094, 0.46), lgMetal);

        // 총열 — 두껍고 길게
        const lgBrl = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.034, 0.52), lgMetal);
        lgBrl.position.set(0, 0.008, -0.500);

        // 총열 열 차폐대 (heat shield)
        const lgHeat = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.030, 0.42), lgDark);
        lgHeat.position.set(0, 0.040, -0.370);

        // 머즐 브레이크 (두꺼운 플래시 하이더)
        const lgMuzz = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.040, 0.062), lgMetal);
        lgMuzz.position.set(0, 0.008, -0.740);
        // 머즐 슬롯 (측면 홈 — 작은 박스 2개)
        const lgMuzzSL = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.014, 0.010), lgDark);
        lgMuzzSL.position.set(0, 0.016, -0.720);

        // 가스 피스톤 튜브
        const lgGas = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.30), lgMetal);
        lgGas.position.set(0, 0.050, -0.400);

        // 피드 트레이 커버 (상단 — 탄띠 급탄 덮개)
        const lgFeed = new THREE.Mesh(new THREE.BoxGeometry(0.070, 0.020, 0.26), lgDark);
        lgFeed.position.set(0, 0.062, -0.060);
        // 피드 커버 힌지
        const lgHinge = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.016, 0.016), lgMetal);
        lgHinge.position.set(0, 0.058, 0.068);

        // ── 박스 탄창 (M249 특유의 대형 200발 박스) ──
        const lgMagBox = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.130, 0.200), lgMagMat);
        lgMagBox.position.set(0.052, -0.092, -0.038);
        // 탄창 연결 넥
        const lgMagNeck = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.032, 0.036), lgDark);
        lgMagNeck.position.set(0.030, -0.020, -0.038);
        // 탄창 하단 캡
        const lgMagCap = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.020, 0.190), lgDark);
        lgMagCap.position.set(0.052, -0.160, -0.038);
        // 탄창 전면 리브 (질감용 얇은 판)
        const lgMagRib = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.110, 0.200), lgDark);
        lgMagRib.position.set(0.078, -0.092, -0.038);

        // 포어그립 (핸드가드 — 두꺼운 전방 손잡이)
        const lgHG = new THREE.Mesh(new THREE.BoxGeometry(0.060, 0.052, 0.24), lgTan);
        lgHG.position.set(0, -0.012, -0.290);

        // 피스톨 그립
        const lgGrip = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.136, 0.054), lgTan);
        lgGrip.position.set(0, -0.094, 0.092);
        lgGrip.rotation.x = -0.75;
        // 트리거 가드
        const lgTG = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.010, 0.060), lgDark);
        lgTG.position.set(0, -0.050, 0.080);

        // 개머리판 (두꺼운 접이식 버트)
        const lgStk = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.072, 0.26), lgTan);
        lgStk.position.set(0, -0.016, 0.305);
        lgStk.rotation.x = 0.05;
        const lgButt = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.090, 0.024), lgTan);
        lgButt.position.set(0, -0.024, 0.434);

        // 바이포드 (양각대 — 두꺼운 다리)
        const lgBipBase = new THREE.Mesh(new THREE.BoxGeometry(0.090, 0.016, 0.022), lgMetal);
        lgBipBase.position.set(0, -0.006, -0.510);
        const lgBipL = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.072, 0.010), lgMetal);
        lgBipL.position.set(-0.036, -0.056, -0.510);
        lgBipL.rotation.x = 0.30;
        const lgBipR = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.072, 0.010), lgMetal);
        lgBipR.position.set( 0.036, -0.056, -0.510);
        lgBipR.rotation.x = 0.30;
        // 바이포드 발판
        const lgBipFL = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.010, 0.010), lgMetal);
        lgBipFL.position.set(-0.036, -0.088, -0.510);
        const lgBipFR = lgBipFL.clone();
        lgBipFR.position.set( 0.036, -0.088, -0.510);

        // 캐리 핸들
        const lgCH = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.022, 0.16), lgMetal);
        lgCH.position.set(0, 0.060, -0.050);

        g.add(lgRec, lgBrl, lgHeat, lgMuzz, lgMuzzSL, lgGas, lgFeed, lgHinge,
              lgMagBox, lgMagNeck, lgMagCap, lgMagRib,
              lgHG, lgGrip, lgTG,
              lgStk, lgButt,
              lgBipBase, lgBipL, lgBipR, lgBipFL, lgBipFR,
              lgCH);
    }
    return g;
}

function createWeaponModels() {
    weaponScene = new THREE.Scene();
    weaponCamera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.01, 5);
    weaponCamera.position.set(0, 0, 1);
    weaponCamera.lookAt(0, 0, 0);

    weaponScene.add(new THREE.AmbientLight(0xffffff, 1.8));
    const wDir = new THREE.DirectionalLight(0xffffff, 1.0);
    wDir.position.set(0.5, 1, 0.8);
    weaponScene.add(wDir);

    // ── DESERT EAGLE ──
    const pG = new THREE.Group();
    const deMetal = new THREE.MeshPhongMaterial({ color: 0x252525, shininess: 90 });
    const deSlide = new THREE.MeshPhongMaterial({ color: 0x1c1c1c, shininess: 110 });
    const deGrip  = new THREE.MeshPhongMaterial({ color: 0x0e0e0e, shininess: 15 });

    // 프레임 (하단 메인 바디)
    const deFrame = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.078, 0.22), deMetal);
    deFrame.position.set(0, -0.010, 0);

    // 슬라이드 (상단, 앞으로 길게 — 계단형)
    const deSld = new THREE.Mesh(new THREE.BoxGeometry(0.060, 0.052, 0.27), deSlide);
    deSld.position.set(0, 0.038, -0.050);

    // 슬라이드 후방 단차 (DE 특유의 높은 뒷부분)
    const deStep = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.020, 0.10), deSlide);
    deStep.position.set(0, 0.072, 0.058);

    // 총신 (슬라이드 앞으로 돌출)
    const deBrl = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.07), deMetal);
    deBrl.position.set(0, 0.014, -0.220);

    // 가스관 (총신 아래 — DE는 가스 작동식)
    const deGas = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.016, 0.13), deMetal);
    deGas.position.set(0, -0.006, -0.160);

    // 트리거 가드 (크고 직각형)
    const deTG = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.028, 0.078), deMetal);
    deTG.position.set(0, -0.049, -0.035);

    // 그립 (넓고 두툼 — .50AE 탄창 수납)
    const deGripM = new THREE.Mesh(new THREE.BoxGeometry(0.066, 0.118, 0.082), deGrip);
    deGripM.position.set(0, -0.098, 0.068);

    // 탄창 밑판
    const deMagBot = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.013, 0.080), deGrip);
    deMagBot.position.set(0, -0.164, 0.068);

    // 노출 해머 (DE 특유)
    const deHammer = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.026, 0.014), deMetal);
    deHammer.position.set(0, 0.036, 0.122);
    deHammer.rotation.x = -0.28;

    // 가늠쇠 (총신 끝, 높은 포스트)
    const deFSBase = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.012, 0.016), deMetal);
    deFSBase.position.set(0, 0.066, -0.206);
    const deFSPost = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.018, 0.005), deMetal);
    deFSPost.position.set(0, 0.084, -0.206);

    // 가늠자 (슬라이드 후방, 노치형 좌우 기둥)
    const deRSBase  = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.010, 0.014), deMetal);
    deRSBase.position.set(0, 0.076, 0.090);
    const deRSLeft  = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.016, 0.007), deMetal);
    deRSLeft.position.set(-0.014, 0.086, 0.090);
    const deRSRight = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.016, 0.007), deMetal);
    deRSRight.position.set( 0.014, 0.086, 0.090);

    pG.add(deFrame, deSld, deStep, deBrl, deGas, deTG, deGripM, deMagBot, deHammer,
           deFSBase, deFSPost, deRSBase, deRSLeft, deRSRight);
    pG.scale.setScalar(1.5);
    pG.position.set(...weaponBasePos[0]);
    pG.rotation.set(...weaponBaseRot[0]);
    weaponScene.add(pG);
    weaponModels[0] = pG;

    // ── AK-47 ──
    const arG = new THREE.Group();
    const akMetal = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, shininess: 60 });
    const akWood  = new THREE.MeshPhongMaterial({ color: 0x5a3010, shininess: 15 });
    const akDark  = new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 40 });

    // 리시버 (메인 바디)
    const akRec = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.065, 0.35), akMetal);

    // 총신 (길고 가늚)
    const akBrl = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.020, 0.32), akMetal);
    akBrl.position.set(0, 0.010, -0.335);

    // 가스관 (총신 위에 평행)
    const akGas = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.016, 0.20), akMetal);
    akGas.position.set(0, 0.035, -0.28);

    // 상단 핸드가드 (목재)
    const akUHG = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.022, 0.16), akWood);
    akUHG.position.set(0, 0.028, -0.23);

    // 하단 핸드가드 (목재)
    const akLHG = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.036, 0.18), akWood);
    akLHG.position.set(0, -0.006, -0.23);

    // 피스톨 그립 (목재, 플레이어/개머리판 방향으로 기울어짐)
    const akGrip = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.120, 0.048), akWood);
    akGrip.position.set(0, -0.076, 0.095);
    akGrip.rotation.x = -0.75;

    // 개머리판 (목재, 약간 아래로)
    const akStk = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.050, 0.21), akWood);
    akStk.position.set(0, -0.012, 0.265);
    akStk.rotation.x = 0.06;

    // 버트플레이트 (개머리판 끝)
    const akButt = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.072, 0.016), akWood);
    akButt.position.set(0, -0.020, 0.374);

    // 바나나 탄창 — 아래로 내려오면서 총구(-Z) 방향으로 굽는 곡선
    // rotation.x 양수 → 하단이 -Z(총구) 방향으로 기울어짐
    const akMag1 = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.115, 0.044), akDark);
    akMag1.position.set(0, -0.088, -0.040); // 앞으로 이동
    const akMag2 = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.060, 0.042), akDark);
    akMag2.position.set(0, -0.160, -0.054);
    akMag2.rotation.x = 0.42;
    const akMag3 = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.040, 0.036), akDark);
    akMag3.position.set(0, -0.198, -0.080);
    akMag3.rotation.x = 0.78;

    // 가늠쇠 (총신 끝 탑재)
    const akFSBase = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.032, 0.024), akMetal);
    akFSBase.position.set(0, 0.024, -0.474);
    const akFSPost = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.020, 0.005), akMetal);
    akFSPost.position.set(0, 0.050, -0.474); // 조준점

    // 가늠자 (리시버 상단, 노치형)
    const akRSBase = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.010, 0.026), akMetal);
    akRSBase.position.set(0, 0.042, -0.075);
    const akRSLeft  = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.018, 0.008), akMetal);
    akRSLeft.position.set(-0.014, 0.052, -0.075);
    const akRSRight = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.018, 0.008), akMetal);
    akRSRight.position.set( 0.014, 0.052, -0.075);

    // 노리쇠 손잡이
    const akCH = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.014, 0.026), akMetal);
    akCH.position.set(-0.034, 0.010, 0.018);

    arG.add(akRec, akBrl, akGas, akUHG, akLHG, akGrip, akStk, akButt,
            akMag1, akMag2, akMag3,
            akFSBase, akFSPost, akRSBase, akRSLeft, akRSRight, akCH);
    arG.scale.setScalar(1.5);
    arG.position.set(...weaponBasePos[1]);
    arG.rotation.set(...weaponBaseRot[1]);
    weaponScene.add(arG);
    weaponModels[1] = arG;

    // ── KNIFE ──
    const kG = new THREE.Group();
    const bladeMat  = new THREE.MeshPhongMaterial({ color: 0xd0d0d0, shininess: 120 });
    const edgeMat   = new THREE.MeshPhongMaterial({ color: 0xb0b0b0, shininess: 140 });
    const kHndlMat  = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, shininess: 20 });
    const kBlade = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.012, 0.26), bladeMat);
    kBlade.position.set(0, 0, -0.09);
    const kEdge  = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.004, 0.25), edgeMat);
    kEdge.position.set(0, -0.008, -0.09);
    const kHndl  = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.042, 0.14), kHndlMat);
    kHndl.position.set(0, 0, 0.10);
    const kGuard = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.018, 0.026), kHndlMat);
    kGuard.position.set(0, 0, 0.02);
    kG.add(kBlade, kEdge, kHndl, kGuard);
    kG.scale.setScalar(1.5);
    kG.position.set(...weaponBasePos[2]);
    kG.rotation.set(0.14, 0.32, -0.06);
    weaponScene.add(kG);
    weaponModels[2] = kG;

    // ── AWP ──
    for (let wi = 3; wi <= 7; wi++) {
        const wG = buildWeaponGroup(wi);
        wG.scale.setScalar(1.5);
        wG.position.set(...weaponBasePos[wi]);
        wG.rotation.set(...weaponBaseRot[wi]);
        weaponScene.add(wG);
        weaponModels[wi] = wG;
    }

    updateWeaponViewModel();
}

function updateWeaponViewModel() {
    for (let i = 0; i < weaponModels.length; i++) {
        if (weaponModels[i])
            weaponModels[i].visible = (i === player.currentWeapon) && !player.weapons[i].dropped;
    }
}


function damagePlayer(dmg) {
    if (gameOver) return;
    player.health = Math.max(0, player.health - dmg);
    // Vignette flash
    const v = document.getElementById('vignette');
    v.style.background = 'radial-gradient(ellipse at center, transparent 40%, rgba(255,0,0,0.55) 100%)';
    setTimeout(() => v.style.background = '', 250);

    if (player.health <= 0) triggerGameOver();
}

function triggerGameOver() {
    if (gameOver) return;
    gameOver = true;
    gamePaused = true;
    document.exitPointerLock();
    setTimeout(() => {
        document.getElementById('overlay').innerHTML = `
            <h1 style="color:#e33;font-size:2.8em">MISSION FAILED</h1>
            <div class="subtitle">K.I.A.</div>
            <p style="color:#aaa;margin:20px 0">KILLS: ${kills} / ${TOTAL_ENEMIES}</p>
            <button id="start-btn" onclick="location.reload()">▶  RETRY</button>`;
        document.getElementById('overlay').style.display = 'flex';
    }, 500);
}

// =====================================================================

function playerShoot() {
    const w = player.weapons[player.currentWeapon];
    if (w.shootTimer > 0) return;

    // 근접 무기 처리
    if (w.melee) {
        w.shootTimer = w.fireRate;
        knifeSwingTimer = w.fireRate;
        knifeSwingDir *= -1;
        playGunshot(2);
        const fwd = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
        for (const e of enemies) {
            if (e.state === 'DEAD') continue;
            const dx = e.pos.x - player.pos.x, dz = e.pos.z - player.pos.z;
            const dist = Math.sqrt(dx*dx + dz*dz);
            if (dist < w.meleeRange) {
                const dot = fwd.dot(new THREE.Vector3(dx/dist, 0, dz/dist));
                if (dot > 0.5) { // 정면 90° 이내
                    hitEnemy(e, w.damage);
                    spawnImpact(new THREE.Vector3(e.pos.x, 1.0, e.pos.z), 0xff4400);
                    showMessage('SLASH!');
                }
            }
        }
        return;
    }

    if (w.dropped || w.reloading || w.ammo <= 0) return;
    w.ammo--;
    w.shootTimer = w.fireRate;

    // Muzzle flash + 발사음
    muzzleLight.intensity = 6;
    muzzleLightTimer = 0.06;
    playGunshot(player.currentWeapon);

    // Direction (반동 적용 전 현재 pitch/yaw 기준으로 발사)
    // adsActive와 동일한 조건으로 판단 (keys['mouse2'] 단독 사용 시 재장전/칼 등에서 오작동)
    const isADS = !!keys['mouse2'] && !w.reloading && !player.adsLocked && !w.melee;
    // 샷건은 currentSpread 무관하게 항상 고정 콘 스프레드 사용
    // 샷건 ADS: 완전 집탄이 아닌 약 35% 스프레드 유지
    const effectiveSpread = isADS
        ? (w.pellets ? w.spread * 0.35 : 0)
        : (w.pellets ? w.spread : player.currentSpread);
    const origin = camera.position.clone();
    const pellets = w.pellets ?? 1;
    for (let p = 0; p < pellets; p++) {
        const psx = (Math.random() - 0.5) * effectiveSpread;
        const psy = (Math.random() - 0.5) * effectiveSpread;
        const pEuler = new THREE.Euler(player.pitch + psy, player.yaw + psx, 0, 'YXZ');
        const pDir = new THREE.Vector3(0, 0, -1).applyEuler(pEuler).normalize();
        spawnBullet(origin, pDir, w.damage, true, w.bulletSpeed);
    }

    // Recoil (총알 발사 후 적용)
    player.pitch += w.recoil;
    player.recoilPitch += w.recoil * 8;
    if (!isADS) // ADS 중엔 탄퍼짐 누적 안 함
        player.currentSpread = Math.min(0.25, player.currentSpread + w.spread);

    if (w.ammo === 0 && w.reserve > 0) startReload();
}

function startReload() {
    const w = player.weapons[player.currentWeapon];
    if (w.dropped || w.melee || w.reloading || w.reserve === 0 || w.ammo === w.maxAmmo) return;
    w.reloading = true;
    w.reloadProgress = 0;
    showMessage('RELOADING');

    const bar = document.getElementById('reload-bar-bg');
    const fill = document.getElementById('reload-bar-fill');
    bar.style.display = 'block';
    fill.style.transition = `width ${w.reloadTime}s linear`;
    fill.style.width = '0%';
    setTimeout(() => fill.style.width = '100%', 10);

    // 타이머 ID를 무기에 저장 → 무기 교체 시 취소 가능
    w._reloadTimer = setTimeout(() => {
        if (!w.reloading) return; // 교체 등으로 이미 취소됨
        const needed = w.maxAmmo - w.ammo;
        const take = Math.min(needed, w.reserve);
        w.ammo += take;
        w.reserve -= take;
        w.reloading = false;
        w._reloadTimer = null;
        player.adsLocked = true;
        bar.style.display = 'none';
        fill.style.width = '0%';
        fill.style.transition = '';
    }, w.reloadTime * 1000);
}

// 맵별 무기 슬롯: 1=메인총, 2=서브/슬롯2, 3=나이프 (훈련장은 전부 해금)
function getWeaponForKey(keyNum) {
    if (currentMap === 'training') return keyNum - 1; // 키 1~8 → 인덱스 0~7
    if (currentMap === 'combat' || currentMap === 'harbor') {
        // carry-slot 기반: 1=슬롯0, 2=슬롯1, 3=칼
        if (keyNum === 1) return player.carrySlots[0] ?? -1;
        if (keyNum === 2) return player.carrySlots[1] ?? -1;
        if (keyNum === 3) return 2;
        return -1;
    }
    const mainIdx = { tunnel: 7 }[currentMap] ?? 1;
    if (keyNum === 1) return mainIdx; // 메인총 (맵마다 다름)
    if (keyNum === 2) return 0;       // Desert Eagle
    if (keyNum === 3) return 2;       // Knife
    return -1;
}

function switchWeapon(idx) {
    if (idx === player.currentWeapon) return;

    // 이전 무기 장전 취소
    const prev = player.weapons[player.currentWeapon];
    if (prev.reloading) {
        clearTimeout(prev._reloadTimer);
        prev._reloadTimer = null;
        prev.reloading = false;
        const bar = document.getElementById('reload-bar-bg');
        bar.style.display = 'none';
        document.getElementById('reload-bar-fill').style.width = '0%';
        document.getElementById('reload-bar-fill').style.transition = '';
    }

    player.currentWeapon = idx;
    keys['mouse2'] = false;
    player.adsLocked = false;
    updateWeaponViewModel();
    // dropped 상태면 EMPTY 표시
    showMessage(player.weapons[idx].dropped ? 'EMPTY' : player.weapons[idx].name);
}
