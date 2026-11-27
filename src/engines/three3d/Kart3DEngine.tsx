import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  CostumeId,
  HudSnapshot,
  LevelCompletionResult,
  PowerUpType,
} from '../../types/game';
import { inputManager } from '../../systems/inputSystem';
import { audioSystem } from '../../systems/audioSystem';
import { haptics } from '../../systems/haptics';
import {
  createBoostPadTexture,
  createCheckeredTexture,
  createChristmasTree3D,
  createItemBoxTexture,
  createLicensePlateTexture,
  createLucky3D,
  createLully3D,
  createSnowPoints,
  createSpfcBannerTexture,
  createTruffulaTree3D,
  createTruffulaTrunkTexture,
} from './models3d';

interface Props {
  costume: CostumeId;
  lives: number;
  paused: boolean;
  onHudUpdate: (hud: HudSnapshot) => void;
  onFinish: (result: LevelCompletionResult) => void;
  onPauseRequest: () => void;
}

interface Racer {
  name: string;
  mesh: THREE.Group;
  bodyGroup: THREE.Group;
  wheels: THREE.Mesh[];
  frontWheelPivots: THREE.Group[];
  steeringWheel: THREE.Mesh;
  flames: THREE.Mesh[];
  t: number;
  lap: number;
  laneOffset: number;
  targetLane: number;
  speed: number;
  baseSpeed: number;
  isPlayer: boolean;
  boostTimer: number;
  spinTimer: number;
  shieldActive: boolean;
  color: string;
}

interface MiniMapDot {
  x: number;
  y: number;
  color: string;
  isPlayer: boolean;
}

export const Kart3DEngine: React.FC<Props> = ({
  costume,
  lives,
  paused,
  onHudUpdate,
  onFinish,
  onPauseRequest,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const [countdownText, setCountdownText] = useState<string>('3');
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [miniDots, setMiniDots] = useState<MiniMapDot[]>([]);
  const [miniPath, setMiniPath] = useState<string>('');

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#66cef5');
    scene.fog = new THREE.Fog('#c2f0ff', 85, 320);

    const camera = new THREE.PerspectiveCamera(
      62,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      460
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight('#ffffff', '#5aa835', 1.3));
    const sun = new THREE.DirectionalLight('#fff7cc', 1.4);
    sun.position.set(60, 115, 50);
    sun.castShadow = true;
    scene.add(sun);

    const snow = createSnowPoints(240, 220, 48);
    snow.position.set(0, 0, -80);
    scene.add(snow);

    // Whimsical Rolling Candy Circuit (with smooth hills!)
    const curvePoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(65, 2.5, -25),
      new THREE.Vector3(105, 5.5, -85),
      new THREE.Vector3(70, 2.0, -150),
      new THREE.Vector3(-10, 0, -165),
      new THREE.Vector3(-85, 4.0, -135),
      new THREE.Vector3(-105, 1.5, -60),
      new THREE.Vector3(-60, 0, 5),
    ];
    const trackCurve = new THREE.CatmullRomCurve3(curvePoints, true, 'catmullrom', 0.5);
    const TRACK_WIDTH = 16.5;

    const toMini = (pt: THREE.Vector3) => ({
      x: ((pt.x + 125) / 250) * 86 + 7,
      y: ((pt.z + 185) / 210) * 86 + 7,
    });
    const pathSamples: string[] = [];
    for (let i = 0; i <= 48; i++) {
      const m = toMini(trackCurve.getPointAt(i / 48));
      pathSamples.push(`${m.x.toFixed(1)},${m.y.toFixed(1)}`);
    }
    setMiniPath(pathSamples.join(' '));

    // Vibrant Dr. Seuss Spring Meadow + Rolling Scenic Hills around horizon
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(800, 800),
      new THREE.MeshStandardMaterial({ color: '#69b543', roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.3;
    ground.receiveShadow = true;
    scene.add(ground);

    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const hill = new THREE.Mesh(
        new THREE.SphereGeometry(28 + (i % 3) * 10, 14, 10),
        new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? '#5aa835' : '#80cb4b', roughness: 0.9 })
      );
      hill.scale.set(1.5, 0.55, 1.5);
      hill.position.set(Math.cos(a) * 195, -4, -80 + Math.sin(a) * 185);
      scene.add(hill);
    }

    // Dr. Seuss Hot Air Balloons
    const balloons: THREE.Group[] = [];
    const balCols = ['#f46d75', '#ffe055', '#e278b8', '#ff9f43', '#4cc9f0'];
    for (let i = 0; i < 7; i++) {
      const bg = new THREE.Group();
      const env = new THREE.Mesh(
        new THREE.SphereGeometry(6.5, 16, 14),
        new THREE.MeshStandardMaterial({ color: balCols[i % balCols.length], roughness: 0.45 })
      );
      env.scale.set(1, 1.2, 1);
      const stripe = new THREE.Mesh(
        new THREE.TorusGeometry(6.3, 0.7, 8, 22),
        new THREE.MeshStandardMaterial({ color: '#fff9eb' })
      );
      stripe.rotation.x = Math.PI / 2;
      const basket = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 2.2, 2.6),
        new THREE.MeshStandardMaterial({ color: '#8b623f' })
      );
      basket.position.y = -10.5;
      bg.add(env, stripe, basket);
      const ang = (i / 7) * Math.PI * 2;
      bg.position.set(Math.cos(ang) * 145, 38 + (i % 3) * 8, -80 + Math.sin(ang) * 135);
      scene.add(bg);
      balloons.push(bg);
    }

    // Track Road with center dashed racing stripe + Red/White Curbs!
    const segments = 220;
    const roadPositions: number[] = [];
    const roadColors: number[] = [];
    const roadIndices: number[] = [];
    const curbPositions: number[] = [];
    const curbColors: number[] = [];
    const curbIndices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const pt = trackCurve.getPointAt(u);
      const tan = trackCurve.getTangentAt(u).normalize();
      const right = new THREE.Vector3(-tan.z, 0, tan.x).normalize();

      const leftPt = pt.clone().addScaledVector(right, -TRACK_WIDTH / 2);
      const midL = pt.clone().addScaledVector(right, -0.45);
      const midR = pt.clone().addScaledVector(right, 0.45);
      const rightPt = pt.clone().addScaledVector(right, TRACK_WIDTH / 2);

      // 4 vertices across road to render crisp golden dashed center line!
      roadPositions.push(
        leftPt.x, leftPt.y + 0.08, leftPt.z,
        midL.x, midL.y + 0.09, midL.z,
        midR.x, midR.y + 0.09, midR.z,
        rightPt.x, rightPt.y + 0.08, rightPt.z
      );

      const asphalt = new THREE.Color(i % 4 < 2 ? '#59506b' : '#655c78');
      const dash = new THREE.Color(i % 4 < 2 ? '#ffe055' : '#655c78');
      roadColors.push(
        asphalt.r, asphalt.g, asphalt.b,
        dash.r, dash.g, dash.b,
        dash.r, dash.g, dash.b,
        asphalt.r, asphalt.g, asphalt.b
      );

      const outerL = pt.clone().addScaledVector(right, -TRACK_WIDTH / 2 - 1.5);
      const outerR = pt.clone().addScaledVector(right, TRACK_WIDTH / 2 + 1.5);
      curbPositions.push(
        outerL.x, outerL.y + 0.22, outerL.z,
        leftPt.x, leftPt.y + 0.22, leftPt.z,
        rightPt.x, rightPt.y + 0.22, rightPt.z,
        outerR.x, outerR.y + 0.22, outerR.z
      );
      const cc = new THREE.Color(i % 2 === 0 ? '#d92626' : '#ffffff');
      for (let k = 0; k < 4; k++) curbColors.push(cc.r, cc.g, cc.b);

      if (i < segments) {
        const a = i * 4;
        const b = (i + 1) * 4;
        // 3 strips across road
        roadIndices.push(a, a + 1, b, a + 1, b + 1, b);
        roadIndices.push(a + 1, a + 2, b + 1, a + 2, b + 2, b + 1);
        roadIndices.push(a + 2, a + 3, b + 2, a + 3, b + 3, b + 2);

        curbIndices.push(a, a + 1, b, a + 1, b + 1, b);
        curbIndices.push(a + 2, a + 3, b + 2, a + 3, b + 3, b + 2);
      }
    }

    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
    roadGeo.setAttribute('color', new THREE.Float32BufferAttribute(roadColors, 3));
    roadGeo.setIndex(roadIndices);
    roadGeo.computeVertexNormals();
    scene.add(new THREE.Mesh(roadGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78 })));

    const curbGeo = new THREE.BufferGeometry();
    curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbPositions, 3));
    curbGeo.setAttribute('color', new THREE.Float32BufferAttribute(curbColors, 3));
    curbGeo.setIndex(curbIndices);
    curbGeo.computeVertexNormals();
    scene.add(new THREE.Mesh(curbGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 })));

    // Festive Christmas Lamp Posts lining the circuit!
    const lampMat = new THREE.MeshStandardMaterial({ color: '#ffe055', emissive: '#ff9f1c', emissiveIntensity: 0.85 });
    const poleMat = new THREE.MeshStandardMaterial({ color: '#221b18', metalness: 0.4 });
    for (let i = 0; i < 24; i++) {
      const u = i / 24;
      const pt = trackCurve.getPointAt(u);
      const tan = trackCurve.getTangentAt(u).normalize();
      const right = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      const side = i % 2 === 0 ? 1 : -1;
      const pos = pt.clone().addScaledVector(right, side * (TRACK_WIDTH / 2 + 2.6));
      const post = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 6.2, 8), poleMat);
      pole.position.y = 3.1;
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.65, 10, 10), lampMat);
      globe.position.y = 6.5;
      post.add(pole, globe);
      post.position.set(pos.x, pt.y, pos.z);
      scene.add(post);
    }

    // Giant Candy Cane Arches spanning over track
    [0.25, 0.5, 0.75].forEach((u, idx) => {
      const pt = trackCurve.getPointAt(u);
      const tan = trackCurve.getTangentAt(u).normalize();
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(TRACK_WIDTH / 2 + 1.5, 0.95, 12, 28, Math.PI),
        new THREE.MeshStandardMaterial({ color: idx % 2 === 0 ? '#d92626' : '#e47bb8', roughness: 0.35 })
      );
      arch.position.set(pt.x, pt.y, pt.z);
      arch.rotation.y = Math.atan2(tan.x, tan.z) + Math.PI / 2;
      scene.add(arch);
    });

    // Start/Finish Checkered Arch + Paulo's SPFC Grandstand with Bouncing Crowd!
    const crowdMembers: THREE.Mesh[] = [];
    {
      const startPt = trackCurve.getPointAt(0);
      const startTan = trackCurve.getTangentAt(0).normalize();
      const archGroup = new THREE.Group();
      archGroup.position.copy(startPt);
      archGroup.rotation.y = Math.atan2(startTan.x, startTan.z);

      const checkTex = createCheckeredTexture();
      const startLine = new THREE.Mesh(
        new THREE.PlaneGeometry(TRACK_WIDTH, 3.6),
        new THREE.MeshBasicMaterial({ map: checkTex })
      );
      startLine.rotation.x = -Math.PI / 2;
      startLine.position.y = 0.14;
      archGroup.add(startLine);

      const pillarMat = new THREE.MeshStandardMaterial({ color: '#d92626', roughness: 0.35 });
      const leftPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.15, 11, 14), pillarMat);
      leftPillar.position.set(-TRACK_WIDTH / 2 - 1.5, 5.5, 0);
      const rightPillar = leftPillar.clone();
      rightPillar.position.set(TRACK_WIDTH / 2 + 1.5, 5.5, 0);
      const topBanner = new THREE.Mesh(
        new THREE.BoxGeometry(TRACK_WIDTH + 5, 2.5, 1.4),
        new THREE.MeshStandardMaterial({ map: checkTex })
      );
      topBanner.position.set(0, 11, 0);
      archGroup.add(leftPillar, rightPillar, topBanner);

      const spfcTex = createSpfcBannerTexture();
      const stand = new THREE.Mesh(
        new THREE.BoxGeometry(11.5, 5.4, 5.4),
        new THREE.MeshStandardMaterial({ map: spfcTex })
      );
      stand.position.set(TRACK_WIDTH / 2 + 8.8, 2.7, 0);
      archGroup.add(stand);

      // Cheering fans on top of the SPFC grandstand!
      const fanCols = ['#ffffff', '#d92626', '#ffe055', '#6fd3f7', '#e278b8'];
      for (let f = 0; f < 6; f++) {
        const fan = new THREE.Mesh(
          new THREE.SphereGeometry(0.7, 10, 10),
          new THREE.MeshStandardMaterial({ color: fanCols[f % fanCols.length] })
        );
        fan.position.set(TRACK_WIDTH / 2 + 4.8 + f * 1.6, 6.2, 0.8);
        archGroup.add(fan);
        crowdMembers.push(fan);
      }
      scene.add(archGroup);
    }

    // Truffula Trees + Christmas Trees
    const trunkTex = createTruffulaTrunkTexture();
    const truffulaColors = ['#f46d75', '#ffe055', '#ff9f43', '#e278b8'];
    for (let i = 0; i < 40; i++) {
      const u = i / 40;
      const pt = trackCurve.getPointAt(u);
      const tan = trackCurve.getTangentAt(u).normalize();
      const right = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      const side = i % 2 === 0 ? 1 : -1;
      const dist = TRACK_WIDTH / 2 + 7.5 + (i % 3) * 5;
      const pos = pt.clone().addScaledVector(right, side * dist);

      if (i % 2 === 0) {
        const truf = createTruffulaTree3D(truffulaColors[i % truffulaColors.length], trunkTex);
        truf.position.set(pos.x, 0, pos.z);
        truf.rotation.z = side * 0.1;
        scene.add(truf);
      } else {
        const tree = createChristmasTree3D(1.0 + (i % 2) * 0.22);
        tree.position.set(pos.x, 0, pos.z);
        scene.add(tree);
      }
    }

    // Animated Glowing Arrow Boost Pads!
    const boostTex = createBoostPadTexture();
    const boostPads = [0.14, 0.39, 0.64, 0.86].map((u) => {
      const pt = trackCurve.getPointAt(u);
      const tan = trackCurve.getTangentAt(u).normalize();
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(5.0, 0.18, 6.8),
        new THREE.MeshStandardMaterial({ map: boostTex, emissive: '#ff9f1c', emissiveIntensity: 0.4 })
      );
      pad.position.set(pt.x, pt.y + 0.16, pt.z);
      pad.rotation.y = Math.atan2(tan.x, tan.z);
      scene.add(pad);
      return { u, lane: 0 };
    });

    // Crisp "?" Mystery Item Boxes!
    const itemTex = createItemBoxTexture();
    const itemBoxes = [0.22, 0.52, 0.77].map((u) => {
      const pt = trackCurve.getPointAt(u);
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 2.1, 2.1),
        new THREE.MeshStandardMaterial({ map: itemTex, emissive: '#ffe055', emissiveIntensity: 0.28 })
      );
      mesh.position.set(pt.x, pt.y + 1.9, pt.z);
      scene.add(mesh);
      return { u, lane: 0, mesh, cooldown: 0 };
    });

    const goldenPawNodes = [
      { u: 0.31, lane: -4.2, collected: false },
      { u: 0.58, lane: 4.2, collected: false },
      { u: 0.91, lane: -3.5, collected: false },
    ].map((p) => {
      const pt = trackCurve.getPointAt(p.u);
      const tan = trackCurve.getTangentAt(p.u).normalize();
      const right = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      const pos = pt.clone().addScaledVector(right, p.lane);
      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.3),
        new THREE.MeshStandardMaterial({ color: '#ffe055', emissive: '#f5b922', emissiveIntensity: 0.8 })
      );
      mesh.position.set(pos.x, pos.y + 1.9, pos.z);
      scene.add(mesh);
      return { ...p, mesh };
    });

    const candyObstacles = [0.18, 0.44, 0.71, 0.83].map((u, idx) => {
      const lane = idx % 2 === 0 ? 3.5 : -3.5;
      const pt = trackCurve.getPointAt(u);
      const tan = trackCurve.getTangentAt(u).normalize();
      const right = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      const pos = pt.clone().addScaledVector(right, lane);
      const mesh = new THREE.Mesh(
        new THREE.ConeGeometry(1.05, 2.3, 12),
        new THREE.MeshStandardMaterial({ color: '#d92626' })
      );
      mesh.position.set(pos.x, pos.y + 1.2, pos.z);
      scene.add(mesh);
      return { u, lane, mesh };
    });

    // =========================================================================
    // DELUXE 3D KART BUILDER (Sculpted Nose, Spoiler, Turning Front Wheels,
    // License Plate, Tail Lights, Exhaust Boost Flames & Cute 3D Drivers!)
    // =========================================================================
    const buildDeluxeKart = (
      bodyColor: string,
      accentColor: string,
      plateText: string,
      driverType: 'lucky' | 'lully' | 'rival',
      rivalColor = '#ff9f43'
    ) => {
      const root = new THREE.Group();
      const bodyGroup = new THREE.Group();
      root.add(bodyGroup);

      const paintMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.24, metalness: 0.2 });
      const accentMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.25, metalness: 0.25 });
      const chromeMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', metalness: 0.82, roughness: 0.16 });
      const darkMat = new THREE.MeshStandardMaterial({ color: '#221b18', roughness: 0.75 });

      // Lower chassis floor pan
      const floorPan = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.42, 3.6), darkMat);
      floorPan.position.set(0, 0.52, 0);
      bodyGroup.add(floorPan);

      // Sculpted rounded kart body + sleek nose hood!
      const mainTub = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.65, 2.5), paintMat);
      mainTub.position.set(0, 0.92, -0.2);
      mainTub.castShadow = true;
      const hood = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.98, 1.35, 16), paintMat);
      hood.rotation.x = Math.PI / 2;
      hood.scale.set(1.05, 1, 0.56);
      hood.position.set(0, 0.86, 1.45);
      // Racing Center Stripe
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.68, 2.7), accentMat);
      stripe.position.set(0, 0.94, 0.18);
      // Front bumper + chrome grille
      const bumper = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.2, 12), chromeMat);
      bumper.rotation.z = Math.PI / 2;
      bumper.position.set(0, 0.62, 2.08);
      // Side pods
      const podL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.48, 1.75), accentMat);
      podL.position.set(-1.12, 0.72, -0.05);
      const podR = podL.clone();
      podR.position.x = 1.12;
      bodyGroup.add(mainTub, hood, stripe, bumper, podL, podR);

      // Rear Racing Spoiler Wing!
      const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.82, 0.25), darkMat);
      strutL.position.set(-0.68, 1.5, -1.55);
      const strutR = strutL.clone();
      strutR.position.x = 0.68;
      const wing = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.16, 0.62), accentMat);
      wing.position.set(0, 1.92, -1.62);
      wing.rotation.x = 0.16;
      bodyGroup.add(strutL, strutR, wing);

      // License Plate on Rear!
      const plateTex = createLicensePlateTexture(plateText, driverType === 'lully' ? '#ffd6e6' : '#ffe055');
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.42), new THREE.MeshBasicMaterial({ map: plateTex }));
      plate.rotation.y = Math.PI;
      plate.position.set(0, 0.86, -1.82);
      bodyGroup.add(plate);

      // Red glowing taillights + Golden Headlights!
      const tailLightMat = new THREE.MeshStandardMaterial({ color: '#ff2a2a', emissive: '#ff0000', emissiveIntensity: 0.9 });
      const headLightMat = new THREE.MeshStandardMaterial({ color: '#fff9c4', emissive: '#ffe055', emissiveIntensity: 0.9 });
      [-0.78, 0.78].forEach((lx) => {
        const tl = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), tailLightMat);
        tl.position.set(lx, 0.95, -1.78);
        const hl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 10), headLightMat);
        hl.position.set(lx * 0.85, 0.98, 1.92);
        bodyGroup.add(tl, hl);
      });

      // Twin Chrome Exhaust Pipes + Animated Boost Flames!
      const flames: THREE.Mesh[] = [];
      const flameMat = new THREE.MeshBasicMaterial({ color: '#ff9f1c', transparent: true, opacity: 0.92 });
      [-0.56, 0.56].forEach((px) => {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.21, 1.05, 12), chromeMat);
        pipe.rotation.x = Math.PI / 2.25;
        pipe.position.set(px, 1.15, -1.85);
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.1, 10), flameMat);
        flame.rotation.x = -Math.PI / 2;
        flame.position.set(px, 1.25, -2.65);
        flame.visible = false;
        bodyGroup.add(pipe, flame);
        flames.push(flame);
      });

      // Plush Racing Seat & Interactive Steering Wheel
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.92, 0.42), new THREE.MeshStandardMaterial({ color: '#221b18' }));
      seat.position.set(0, 1.48, -0.82);
      const steeringWheel = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.065, 8, 16), chromeMat);
      steeringWheel.position.set(0, 1.56, 0.72);
      steeringWheel.rotation.x = 0.42;
      bodyGroup.add(seat, steeringWheel);

      // Driver Model!
      if (driverType === 'lucky') {
        // Bone accents on front & rear bumpers for Lucky's iconic Bone Kart!
        const boneKnob = new THREE.SphereGeometry(0.45, 12, 12);
        [
          [-1.08, 0.65, 2.05],
          [1.08, 0.65, 2.05],
        ].forEach(([bx, by, bz]) => {
          const bk = new THREE.Mesh(boneKnob, paintMat);
          bk.position.set(bx, by, bz);
          bodyGroup.add(bk);
        });
        const luckyDriver = createLucky3D(costume, 0.78);
        luckyDriver.position.set(0, 0.92, -0.15);
        bodyGroup.add(luckyDriver);
      } else if (driverType === 'lully') {
        const lullyDriver = createLully3D(0.78);
        lullyDriver.position.set(0, 0.92, -0.15);
        bodyGroup.add(lullyDriver);
      } else {
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.68, 14, 14), new THREE.MeshStandardMaterial({ color: rivalColor }));
        head.position.set(0, 1.82, -0.12);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.75, 10), accentMat);
        cap.position.set(0, 2.55, -0.12);
        bodyGroup.add(head, cap);
      }

      // 4 Fat Racing Tires with Golden Alloy Rims (Front 2 inside turning pivots!)
      const wheels: THREE.Mesh[] = [];
      const frontWheelPivots: THREE.Group[] = [];
      const tireGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.56, 16);
      tireGeo.rotateZ(Math.PI / 2);
      const rimGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.58, 12);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMat = new THREE.MeshStandardMaterial({ color: '#ffe055', metalness: 0.6, roughness: 0.2 });

      const wheelPositions: Array<[number, number, number, boolean]> = [
        [-1.32, 0.6, 1.25, true],
        [1.32, 0.6, 1.25, true],
        [-1.38, 0.64, -1.15, false],
        [1.38, 0.64, -1.15, false],
      ];
      wheelPositions.forEach(([wx, wy, wz, isFront]) => {
        const w = new THREE.Mesh(tireGeo, darkMat);
        const rim = new THREE.Mesh(rimGeo, rimMat);
        w.add(rim);
        if (isFront) {
          const piv = new THREE.Group();
          piv.position.set(wx, wy, wz);
          piv.add(w);
          root.add(piv);
          frontWheelPivots.push(piv);
        } else {
          w.scale.set(1.12, 1.12, 1.12);
          w.position.set(wx, wy, wz);
          root.add(w);
        }
        wheels.push(w);
      });

      return { group: root, bodyGroup, wheels, frontWheelPivots, steeringWheel, flames };
    };

    const specs: Array<{
      name: string;
      body: string;
      accent: string;
      plate: string;
      driver: 'lucky' | 'lully' | 'rival';
      rivalCol: string;
      t: number;
      lane: number;
      baseSpeed: number;
      isPlayer: boolean;
    }> = [
      { name: 'Lucky Boy', body: '#fff9eb', accent: '#d92626', plate: '#01 LUCKY', driver: 'lucky', rivalCol: '#ffe055', t: 0.002, lane: 0, baseSpeed: 0.122, isPlayer: true },
      { name: 'Lully', body: '#f46d75', accent: '#ffe055', plate: 'LULLY ♥', driver: 'lully', rivalCol: '#f46d75', t: 0.012, lane: -3.2, baseSpeed: 0.089, isPlayer: false },
      { name: 'Biscoitão', body: '#ff9f43', accent: '#5ea93f', plate: 'DOCE 03', driver: 'rival', rivalCol: '#8b623f', t: 0.018, lane: 3.2, baseSpeed: 0.084, isPlayer: false },
      { name: 'Pinguim Noel', body: '#6fd3f7', accent: '#d92626', plate: 'GELO 04', driver: 'rival', rivalCol: '#1d3557', t: 0.024, lane: -1.5, baseSpeed: 0.08, isPlayer: false },
      { name: 'Cupcake Turbo', body: '#e278b8', accent: '#fff9eb', plate: 'CAKE 05', driver: 'rival', rivalCol: '#ffccd5', t: 0.03, lane: 2.0, baseSpeed: 0.077, isPlayer: false },
      { name: 'Duende Rabugento', body: '#9f7aea', accent: '#80ed99', plate: 'ELFO 06', driver: 'rival', rivalCol: '#80ed99', t: 0.036, lane: -4.2, baseSpeed: 0.074, isPlayer: false },
    ];

    const racers: Racer[] = specs.map((s) => {
      const built = buildDeluxeKart(s.body, s.accent, s.plate, s.driver, s.rivalCol);
      scene.add(built.group);
      return {
        name: s.name,
        mesh: built.group,
        bodyGroup: built.bodyGroup,
        wheels: built.wheels,
        frontWheelPivots: built.frontWheelPivots,
        steeringWheel: built.steeringWheel,
        flames: built.flames,
        t: s.t,
        lap: 1,
        laneOffset: s.lane,
        targetLane: s.lane,
        speed: 0,
        baseSpeed: s.baseSpeed,
        isPlayer: s.isPlayer,
        boostTimer: 0,
        spinTimer: 0,
        shieldActive: false,
        color: s.rivalCol,
      };
    });

    interface Spark3D {
      mesh: THREE.Mesh;
      vx: number;
      vy: number;
      vz: number;
      life: number;
    }
    const sparks: Spark3D[] = [];
    const sparkGeo = new THREE.SphereGeometry(0.24, 6, 6);

    const playerRacer = racers[0];
    let heldItem: PowerUpType | null = null;
    let treatsCollected = 0;
    let countdown = 2.6;
    let timeSec = 0;
    let bannerText = '🏁 Prepare-se para a largada!';
    let bannerTimer = 2.6;
    let finished = false;
    let hudTick = 0;

    const resize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / Math.max(1, container.clientHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', resize);

    let lastTs = performance.now();
    let rafId = 0;

    const animate = (ts: number) => {
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;

      const inp = inputManager.poll();
      if (inp.pauseJustPressed) onPauseRequest();

      if (!pausedRef.current && !finished) {
        timeSec += dt;

        balloons.forEach((b, idx) => {
          b.position.y += Math.sin(timeSec * 1.2 + idx) * 0.03;
          b.rotation.y += dt * 0.25;
        });
        crowdMembers.forEach((fan, idx) => {
          fan.position.y = 6.2 + Math.abs(Math.sin(timeSec * 7 + idx)) * 0.8;
        });

        const snowPos = snow.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < snowPos.count; i++) {
          let ny = snowPos.getY(i) - 4.5 * dt;
          if (ny < 0) ny = 48;
          snowPos.setY(i, ny);
        }
        snowPos.needsUpdate = true;

        if (bannerTimer > 0) {
          bannerTimer -= dt;
          if (bannerTimer <= 0) bannerText = '';
        }

        const racingStarted = countdown <= 0;
        if (countdown > 0) {
          const prevC = Math.ceil(countdown);
          countdown -= dt;
          const nextC = Math.ceil(countdown);
          if (nextC !== prevC) {
            if (nextC > 0) {
              setCountdownText(String(nextC));
              audioSystem.playSfx('click');
            } else {
              setCountdownText('JÁ! 🏁');
              audioSystem.playSfx('boost');
              haptics.bounce();
              window.setTimeout(() => setCountdownText(''), 900);
            }
          }
        }

        const accel = racingStarted && (inp.a || inp.up);
        const brake = racingStarted && (inp.b || inp.down);
        const steer = racingStarted ? (inp.right ? 1 : 0) - (inp.left ? 1 : 0) : 0;
        const drifting = racingStarted && inp.x && Math.abs(steer) > 0;

        if (playerRacer.boostTimer > 0) playerRacer.boostTimer -= dt;
        if (playerRacer.spinTimer > 0) playerRacer.spinTimer -= dt;

        const maxSpd = playerRacer.boostTimer > 0 ? 0.15 : drifting ? 0.108 : 0.118;
        if (accel && playerRacer.spinTimer <= 0) {
          playerRacer.speed = Math.min(maxSpd, playerRacer.speed + 0.1 * dt);
        } else if (brake) {
          playerRacer.speed = Math.max(-0.025, playerRacer.speed - 0.12 * dt);
        } else {
          playerRacer.speed *= Math.pow(0.3, dt);
        }

        const steerRate = drifting ? 14.2 : 10.2;
        playerRacer.laneOffset += steer * steerRate * dt;
        playerRacer.laneOffset = Math.max(-TRACK_WIDTH / 2 + 1.5, Math.min(TRACK_WIDTH / 2 - 1.5, playerRacer.laneOffset));

        // Animate steering front wheels, body lean & exhaust turbo flames!
        playerRacer.frontWheelPivots.forEach((p) => {
          p.rotation.y += (-steer * 0.42 - p.rotation.y) * Math.min(1, dt * 14);
        });
        playerRacer.steeringWheel.rotation.z = -steer * 0.8;
        playerRacer.bodyGroup.rotation.z += (-steer * 0.11 - playerRacer.bodyGroup.rotation.z) * Math.min(1, dt * 10);

        const showFlames = playerRacer.boostTimer > 0 || (accel && playerRacer.speed > 0.08);
        playerRacer.flames.forEach((fl) => {
          fl.visible = showFlames;
          const sc = playerRacer.boostTimer > 0 ? 1.45 + Math.sin(timeSec * 40) * 0.35 : 0.65 + Math.sin(timeSec * 30) * 0.2;
          fl.scale.set(1, sc, 1);
        });

        // Dynamic speed FOV!
        const targetFov = playerRacer.boostTimer > 0 ? 74 : 62 + playerRacer.speed * 42;
        camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 6);
        camera.updateProjectionMatrix();

        if (racingStarted && inp.yJustPressed && heldItem) {
          haptics.bounce();
          if (heldItem === 'golden_bone') {
            audioSystem.playSfx('boost');
            playerRacer.boostTimer = 2.8;
            bannerText = '🦴 TURBO DE OSSO ATIVADO!';
          } else if (heldItem === 'spicy_treat') {
            audioSystem.playSfx('super_bark');
            playerRacer.boostTimer = 1.6;
            const ahead = racers.find((r) => !r.isPlayer && r.lap + r.t > playerRacer.lap + playerRacer.t);
            if (ahead) {
              ahead.spinTimer = 1.4;
              ahead.speed *= 0.25;
              bannerText = `🌶️ Pimenta acertou ${ahead.name}!`;
            } else {
              bannerText = '🌶️ TURBO APIMENTADO!';
            }
          } else {
            audioSystem.playSfx('powerup');
            playerRacer.shieldActive = true;
            playerRacer.boostTimer = 1.4;
            bannerText = '🫧 BOLHA PROTETORA ATIVADA!';
          }
          bannerTimer = 2.0;
          heldItem = null;
        }

        if ((drifting || playerRacer.boostTimer > 0) && Math.random() < 0.72) {
          const sp = new THREE.Mesh(
            sparkGeo,
            new THREE.MeshBasicMaterial({ color: playerRacer.boostTimer > 0 ? '#ffe055' : '#6fd3f7' })
          );
          sp.position.copy(playerRacer.mesh.position).add(new THREE.Vector3((Math.random() - 0.5) * 1.8, 0.55, (Math.random() - 0.5) * 1.4));
          scene.add(sp);
          sparks.push({ mesh: sp, vx: (Math.random() - 0.5) * 5, vy: 2 + Math.random() * 4, vz: (Math.random() - 0.5) * 5, life: 0.45 });
        }

        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          s.life -= dt;
          s.mesh.position.x += s.vx * dt;
          s.mesh.position.y += s.vy * dt;
          s.mesh.position.z += s.vz * dt;
          s.mesh.scale.setScalar(Math.max(0.01, s.life * 2));
          if (s.life <= 0) {
            scene.remove(s.mesh);
            sparks.splice(i, 1);
          }
        }

        for (const r of racers) {
          if (!r.isPlayer) {
            if (!racingStarted) {
              r.speed = 0;
            } else if (r.spinTimer > 0) {
              r.spinTimer -= dt;
              r.speed *= Math.pow(0.4, dt);
            } else {
              const targetS = r.baseSpeed + Math.sin(timeSec * 1.4 + r.laneOffset) * 0.007;
              r.speed += (targetS - r.speed) * Math.min(1, dt * 3);
            }
            if (racingStarted && Math.random() < dt * 0.6) {
              r.targetLane = (Math.random() - 0.5) * (TRACK_WIDTH - 4);
            }
            r.laneOffset += (r.targetLane - r.laneOffset) * Math.min(1, dt * 1.8);
          }

          for (const w of r.wheels) w.rotation.x += r.speed * 118 * dt;

          const prevT = r.t;
          r.t += r.speed * dt;
          if (r.t >= 1) {
            r.t -= 1;
            if (prevT > 0.75) {
              r.lap++;
              if (r.isPlayer) {
                haptics.collect();
                audioSystem.playSfx('checkpoint');
                treatsCollected += 8;
                if (r.lap <= 3) {
                  bannerText = `🏁 Volta ${r.lap}/3!`;
                  bannerTimer = 2.0;
                }
              }
            }
          } else if (r.t < 0) {
            r.t = 0;
          }

          const pt = trackCurve.getPointAt(r.t);
          const tan = trackCurve.getTangentAt(r.t).normalize();
          const right = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
          const worldPos = pt.clone().addScaledVector(right, r.laneOffset);
          r.mesh.position.copy(worldPos);
          r.mesh.rotation.y = Math.atan2(tan.x, tan.z) + (r.isPlayer && drifting ? -steer * 0.35 : 0);
          if (r.spinTimer > 0) r.mesh.rotation.y += timeSec * 14;
        }

        for (const pad of boostPads) {
          const distU = Math.min(Math.abs(playerRacer.t - pad.u), 1 - Math.abs(playerRacer.t - pad.u));
          if (distU < 0.015 && Math.abs(playerRacer.laneOffset - pad.lane) < 3.6) {
            if (playerRacer.boostTimer < 0.5) {
              playerRacer.boostTimer = 1.65;
              haptics.bounce();
              audioSystem.playSfx('boost');
              treatsCollected += 2;
            }
          }
        }

        const itemPool: PowerUpType[] = ['golden_bone', 'spicy_treat', 'bubble_shield'];
        for (const box of itemBoxes) {
          box.mesh.rotation.y += dt * 2.6;
          box.mesh.rotation.x += dt * 1.1;
          if (box.cooldown > 0) {
            box.cooldown -= dt;
            box.mesh.visible = false;
            continue;
          }
          box.mesh.visible = true;
          const distU = Math.min(Math.abs(playerRacer.t - box.u), 1 - Math.abs(playerRacer.t - box.u));
          if (distU < 0.016 && Math.abs(playerRacer.laneOffset - box.lane) < 3.0) {
            box.cooldown = 4;
            heldItem = itemPool[Math.floor(Math.random() * itemPool.length)];
            haptics.collect();
            audioSystem.playSfx('powerup');
            bannerText = '🎁 Item obtido! Aperte Y para usar!';
            bannerTimer = 2.0;
          }
        }

        goldenPawNodes.forEach((gp, idx) => {
          gp.mesh.rotation.y += dt * 3;
          if (gp.collected) {
            gp.mesh.visible = false;
            return;
          }
          const distU = Math.min(Math.abs(playerRacer.t - gp.u), 1 - Math.abs(playerRacer.t - gp.u));
          if (distU < 0.017 && Math.abs(playerRacer.laneOffset - gp.lane) < 3.4) {
            gp.collected = true;
            haptics.collect();
            audioSystem.playSfx('paw');
            bannerText = `🐾 Patinha Dourada #${idx + 1} coletada!`;
            bannerTimer = 2.0;
          }
        });

        for (const ob of candyObstacles) {
          const distU = Math.min(Math.abs(playerRacer.t - ob.u), 1 - Math.abs(playerRacer.t - ob.u));
          if (distU < 0.012 && Math.abs(playerRacer.laneOffset - ob.lane) < 2.0 && playerRacer.boostTimer <= 0 && playerRacer.spinTimer <= 0) {
            if (playerRacer.shieldActive) {
              playerRacer.shieldActive = false;
              audioSystem.playSfx('splash');
            } else {
              playerRacer.spinTimer = 0.55;
              playerRacer.speed *= 0.4;
              haptics.hurt();
              audioSystem.playSfx('hurt');
            }
          }
        }

        const progressScore = (r: Racer) => r.lap + r.t;
        const sorted = [...racers].sort((a, b) => progressScore(b) - progressScore(a));
        const rank = sorted.findIndex((r) => r.isPlayer) + 1;

        if (playerRacer.lap > 3) {
          finished = true;
          const won = rank <= 3;
          audioSystem.playSfx(won ? 'win' : 'hurt');
          const starsEarned = won ? (rank === 1 ? 3 : rank === 2 ? 2 : 1) : 0;
          onFinish({
            levelId: 3,
            won,
            treatsCollected,
            goldenPaws: [goldenPawNodes[0].collected, goldenPawNodes[1].collected, goldenPawNodes[2].collected],
            timeSec,
            heartsRemaining: won ? 3 : 0,
            starsEarned,
            extraNote: `Você chegou em ${rank}º lugar de 6 pilotos!`,
          });
        }

        const tan = trackCurve.getTangentAt(playerRacer.t).normalize();
        const desiredCam = playerRacer.mesh.position
          .clone()
          .addScaledVector(tan, -11.2)
          .add(new THREE.Vector3(0, 5.2, 0));
        camera.position.lerp(desiredCam, Math.min(1, dt * 8));
        const lookAt = playerRacer.mesh.position.clone().addScaledVector(tan, 12).add(new THREE.Vector3(0, 1.7, 0));
        camera.lookAt(lookAt);

        hudTick += dt;
        if (hudTick > 0.09) {
          hudTick = 0;
          setSpeedKmh(Math.round(Math.max(0, playerRacer.speed * 1350)));
          setMiniDots(
            racers.map((r) => {
              const m = toMini(r.mesh.position);
              return { x: m.x, y: m.y, color: r.color, isPlayer: r.isPlayer };
            })
          );
          onHudUpdate({
            hearts: 3,
            maxHearts: 3,
            treats: treatsCollected,
            lives,
            goldenPaws: [goldenPawNodes[0].collected, goldenPawNodes[1].collected, goldenPawNodes[2].collected],
            activePower: heldItem,
            powerTimer: heldItem ? 999 : 0,
            hasShield: playerRacer.shieldActive,
            progressLabel: `🏆 ${rank}º Lugar · Volta ${Math.min(3, playerRacer.lap)}/3`,
            bannerText: bannerText || undefined,
          });
        }
      }

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [costume, lives, onHudUpdate, onFinish, onPauseRequest]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Live Mini-Map + Speedometer Overlay */}
      <div
        style={{
          position: 'absolute',
          left: 12,
          top: 98,
          zIndex: 18,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: 86,
            height: 86,
            background: 'rgba(255, 249, 235, 0.92)',
            border: '3px solid #221b18',
            borderRadius: 16,
            boxShadow: '0 4px 0 rgba(34,27,24,0.28)',
          }}
        >
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            <polygon points={miniPath} fill="none" stroke="#59506b" strokeWidth="7" strokeLinejoin="round" />
            {miniDots.map((d, idx) => (
              <circle
                key={idx}
                cx={d.x}
                cy={d.y}
                r={d.isPlayer ? 5.5 : 3.6}
                fill={d.isPlayer ? '#d92626' : d.color}
                stroke="#221b18"
                strokeWidth="1.5"
              />
            ))}
          </svg>
        </div>

        <div
          className="seuss-title"
          style={{
            background: '#ffe770',
            border: '2.5px solid #221b18',
            borderRadius: 12,
            padding: '2px 10px',
            fontSize: 13,
            fontWeight: 900,
            color: '#221b18',
          }}
        >
          {speedKmh} km/h
        </div>
      </div>

      {countdownText && (
        <div
          className="seuss-title"
          style={{
            position: 'absolute',
            left: '50%',
            top: '42%',
            transform: 'translate(-50%, -50%)',
            zIndex: 30,
            pointerEvents: 'none',
            fontSize: 'clamp(3.2rem, 12vw, 5.5rem)',
            color: '#ffe055',
            textShadow: '0 6px 0 #c91d1d, 0 10px 24px rgba(0,0,0,0.45)',
          }}
        >
          {countdownText}
        </div>
      )}
    </div>
  );
};
