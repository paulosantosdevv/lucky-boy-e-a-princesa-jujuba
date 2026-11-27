import * as THREE from 'three';
import { CostumeId } from '../../types/game';

/** Create a procedural CanvasTexture */
export function makeCanvasTexture(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createCheckeredTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(256, 64, (ctx, w, h) => {
    const sq = 16;
    for (let y = 0; y < h; y += sq) {
      for (let x = 0; x < w; x += sq) {
        ctx.fillStyle = ((x / sq + y / sq) % 2 === 0) ? '#221b18' : '#fffdf5';
        ctx.fillRect(x, y, sq, sq);
      }
    }
  });
}

export function createSpfcBannerTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d92626';
    ctx.fillRect(0, 70, w, 46);
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 140, w, 46);
    // Shield in center
    ctx.fillStyle = '#111111';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 58, 52);
    ctx.lineTo(w / 2 + 58, 52);
    ctx.lineTo(w / 2 + 58, 125);
    ctx.lineTo(w / 2, 206);
    ctx.lineTo(w / 2 - 58, 125);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#d92626';
    ctx.beginPath();
    ctx.moveTo(w / 2 - 46, 125);
    ctx.lineTo(w / 2 - 4, 125);
    ctx.lineTo(w / 2 - 4, 184);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPFC', w / 2, 102);
  });
}

export function createClockFaceTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(512, 512, (ctx, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    ctx.fillStyle = '#fff9eb';
    ctx.beginPath();
    ctx.arc(cx, cy, 245, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d99316';
    ctx.lineWidth = 22;
    ctx.stroke();

    ctx.strokeStyle = '#221b18';
    ctx.lineWidth = 6;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 188, cy + Math.sin(a) * 188);
      ctx.lineTo(cx + Math.cos(a) * 218, cy + Math.sin(a) * 218);
      ctx.stroke();
    }

    ctx.fillStyle = '#c91d1d';
    ctx.font = 'bold 54px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('XII', cx, 92);
    ctx.fillText('III', w - 92, cy);
    ctx.fillText('VI', cx, h - 92);
    ctx.fillText('IX', 92, cy);
  });
}

export function createFestiveRugTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(512, 512, (ctx, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const rings: [number, string][] = [
      [256, '#5ea93f'],
      [226, '#ffe055'],
      [208, '#d92626'],
      [182, '#fff9eb'],
      [164, '#b38cd9'],
      [110, '#80cb4b'],
      [60, '#ffe770'],
    ];
    for (const [r, col] of rings) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#221b18';
      ctx.lineWidth = 5;
      ctx.stroke();
    }
    // Star pattern in center
    ctx.fillStyle = '#d92626';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * 136, cy + Math.sin(a) * 136, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function createTruffulaTrunkTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(64, 256, (ctx, w, h) => {
    ctx.fillStyle = '#f7da59';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#221b18';
    for (let y = 0; y < h; y += 22) {
      ctx.fillRect(0, y, w, 4);
    }
  });
}

/** Detailed Cute 3D Lucky Boy (Chubby All-White Shih Tzu + Red Scarf + Costumes) */
export function createLucky3D(costume: CostumeId = 'classic', scale = 1): THREE.Group {
  const g = new THREE.Group();
  const whiteMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.45 });
  const creamMat = new THREE.MeshStandardMaterial({ color: '#fff8eb', roughness: 0.5 });
  const darkMat = new THREE.MeshStandardMaterial({ color: '#1b1414', roughness: 0.25 });
  const pinkMat = new THREE.MeshStandardMaterial({ color: '#ff8fab', roughness: 0.5 });
  const redMat = new THREE.MeshStandardMaterial({ color: '#d92626', roughness: 0.4 });

  // Chubby round body
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.88, 18, 16), whiteMat);
  body.scale.set(1.05, 0.85, 1.24);
  body.position.set(0, 0.82, 0);
  body.castShadow = true;
  g.add(body);

  // SPFC Tricolor chest stripes on Lucky!
  if (costume === 'spfc') {
    const rBand = new THREE.Mesh(new THREE.TorusGeometry(0.84, 0.08, 8, 20), redMat);
    rBand.rotation.x = Math.PI / 2;
    rBand.position.set(0, 0.92, 0.05);
    const bBand = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.08, 8, 20), darkMat);
    bBand.rotation.x = Math.PI / 2;
    bBand.position.set(0, 0.72, 0.05);
    g.add(rBand, bBand);
  }

  // 4 stubby white paws
  const pawGeo = new THREE.SphereGeometry(0.24, 12, 10);
  [
    [-0.48, 0.24, 0.52],
    [0.48, 0.24, 0.52],
    [-0.48, 0.24, -0.52],
    [0.48, 0.24, -0.52],
  ].forEach(([x, y, z]) => {
    const paw = new THREE.Mesh(pawGeo, whiteMat);
    paw.scale.set(1, 0.75, 1.2);
    paw.position.set(x, y, z);
    paw.castShadow = true;
    g.add(paw);
  });

  // Fluffy wagging tail
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), whiteMat);
  tail.position.set(0, 1.15, -1.02);
  g.add(tail);

  // Head group
  const head = new THREE.Group();
  head.position.set(0, 1.56, 0.62);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.72, 18, 16), whiteMat);
  skull.scale.set(1.1, 0.96, 1.0);
  skull.castShadow = true;
  head.add(skull);

  // Fluffy cheek tufts
  const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), whiteMat);
  cheekL.position.set(-0.52, -0.18, 0.26);
  const cheekR = cheekL.clone();
  cheekR.position.x = 0.52;
  head.add(cheekL, cheekR);

  // Droopy fluffy Shih Tzu ears
  const earGeo = new THREE.SphereGeometry(0.34, 12, 12);
  const earL = new THREE.Mesh(earGeo, creamMat);
  earL.scale.set(0.62, 1.45, 0.8);
  earL.position.set(-0.72, -0.14, -0.04);
  earL.rotation.z = 0.22;
  const earR = earL.clone();
  earR.position.x = 0.72;
  earR.rotation.z = -0.22;
  head.add(earL, earR);

  // Big shiny eyes + specular dots
  const eyeGeo = new THREE.SphereGeometry(0.14, 12, 12);
  const glintGeo = new THREE.SphereGeometry(0.05, 8, 8);
  const eyeL = new THREE.Mesh(eyeGeo, darkMat);
  eyeL.position.set(-0.27, 0.1, 0.61);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.27;
  const glintL = new THREE.Mesh(glintGeo, whiteMat);
  glintL.position.set(-0.24, 0.14, 0.72);
  const glintR = glintL.clone();
  glintR.position.x = 0.3;
  head.add(eyeL, eyeR, glintL, glintR);

  // Cute shiny nose & happy tongue
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), darkMat);
  nose.scale.set(1.25, 0.85, 0.85);
  nose.position.set(0, -0.06, 0.7);
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), pinkMat);
  tongue.scale.set(0.9, 1.2, 0.5);
  tongue.position.set(0, -0.24, 0.67);
  head.add(nose, tongue);

  // Costume hats
  if (costume === 'santa') {
    const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.54, 0.95, 14), redMat);
    hatCone.position.set(0, 0.95, -0.05);
    hatCone.rotation.x = -0.18;
    const hatBrim = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.14, 10, 18), whiteMat);
    hatBrim.rotation.x = Math.PI / 2;
    hatBrim.position.set(0, 0.56, 0);
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), whiteMat);
    pom.position.set(0, 1.4, -0.18);
    head.add(hatCone, hatBrim, pom);
  } else if (costume === 'pilot') {
    const gogMat = new THREE.MeshStandardMaterial({ color: '#6fd3f7', metalness: 0.3, roughness: 0.2 });
    const gL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 12), gogMat);
    gL.rotation.x = Math.PI / 2;
    gL.position.set(-0.24, 0.38, 0.58);
    const gR = gL.clone();
    gR.position.x = 0.24;
    head.add(gL, gR);
  } else if (costume === 'starlight') {
    const star = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.28),
      new THREE.MeshStandardMaterial({ color: '#ffe055', emissive: '#ff9f1c', emissiveIntensity: 0.65 })
    );
    star.position.set(0, 0.92, 0);
    head.add(star);
  }

  g.add(head);

  // Festive Red Scarf + fluttering tail
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.16, 10, 20), redMat);
  scarf.rotation.x = Math.PI / 2;
  scarf.position.set(0, 1.12, 0.45);
  const scarfTail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.72), redMat);
  scarfTail.position.set(0.32, 1.05, -0.1);
  scarfTail.rotation.y = 0.25;
  g.add(scarf, scarfTail);

  g.scale.setScalar(scale);
  return g;
}

/** Detailed Adorable 3D Lully (Black & White Shih Tzu with Red Christmas Bow & Golden Bell!) */
export function createLully3D(scale = 1): THREE.Group {
  const g = new THREE.Group();
  const whiteMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.45 });
  const blackMat = new THREE.MeshStandardMaterial({ color: '#221e26', roughness: 0.45 });
  const redMat = new THREE.MeshStandardMaterial({ color: '#e63946', roughness: 0.35 });
  const greenMat = new THREE.MeshStandardMaterial({ color: '#4ea83b', roughness: 0.45 });
  const goldMat = new THREE.MeshStandardMaterial({ color: '#ffe055', metalness: 0.4, roughness: 0.25 });
  const pinkMat = new THREE.MeshStandardMaterial({ color: '#ff8fab', roughness: 0.5 });

  // White fluffy body + black saddle patch
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.82, 16, 14), whiteMat);
  body.scale.set(1.0, 0.85, 1.2);
  body.position.set(0, 0.78, 0);
  g.add(body);

  const patch = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), blackMat);
  patch.position.set(0.36, 0.92, -0.15);
  g.add(patch);

  // Head
  const head = new THREE.Group();
  head.position.set(0, 1.5, 0.55);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.68, 16, 14), whiteMat);
  skull.scale.set(1.08, 0.96, 1.0);
  head.add(skull);

  // Silky black Shih Tzu ears
  const earGeo = new THREE.SphereGeometry(0.34, 12, 12);
  const earL = new THREE.Mesh(earGeo, blackMat);
  earL.scale.set(0.6, 1.5, 0.8);
  earL.position.set(-0.7, -0.12, -0.02);
  earL.rotation.z = 0.2;
  const earR = earL.clone();
  earR.position.x = 0.7;
  earR.rotation.z = -0.2;
  head.add(earL, earR);

  // Cute black eye patch around left eye
  const eyePatch = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), blackMat);
  eyePatch.scale.set(1.1, 1.0, 0.55);
  eyePatch.position.set(-0.27, 0.1, 0.54);
  head.add(eyePatch);

  // Sparkling eyes + blush
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), blackMat);
  eyeL.position.set(-0.26, 0.1, 0.63);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.26;
  const glintL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), whiteMat);
  glintL.position.set(-0.23, 0.14, 0.73);
  const glintR = glintL.clone();
  glintR.position.x = 0.29;
  const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), pinkMat);
  cheekL.scale.set(1.2, 0.7, 0.4);
  cheekL.position.set(-0.44, -0.1, 0.55);
  const cheekR = cheekL.clone();
  cheekR.position.x = 0.44;
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), blackMat);
  nose.position.set(0, -0.05, 0.68);
  head.add(eyeL, eyeR, glintL, glintR, cheekL, cheekR, nose);

  // Lush 3D Red Christmas Bow on top!
  const bowL = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.45, 10), redMat);
  bowL.rotation.z = -Math.PI / 2.2;
  bowL.position.set(-0.24, 0.74, 0.08);
  const bowR = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.45, 10), redMat);
  bowR.rotation.z = Math.PI / 2.2;
  bowR.position.set(0.24, 0.74, 0.08);
  const bowCenter = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), pinkMat);
  bowCenter.position.set(0, 0.74, 0.12);
  head.add(bowL, bowR, bowCenter);

  g.add(head);

  // Green collar + Golden Jingle Bell
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.11, 8, 18), greenMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 1.08, 0.42);
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), goldMat);
  bell.position.set(0, 0.94, 0.92);
  g.add(collar, bell);

  g.scale.setScalar(scale);
  return g;
}

/** Detailed 3D Lorax Truffula Tree with striped yellow trunk & multi-puff fluffy tuft */
export function createTruffulaTree3D(tuftColor: string, trunkTex: THREE.CanvasTexture): THREE.Group {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ map: trunkTex, roughness: 0.75 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.52, 8.8, 10), trunkMat);
  trunk.position.y = 4.4;
  trunk.castShadow = true;
  g.add(trunk);

  const tuftMat = new THREE.MeshStandardMaterial({ color: tuftColor, roughness: 0.75 });
  const core = new THREE.Mesh(new THREE.DodecahedronGeometry(2.7, 1), tuftMat);
  core.position.y = 9.2;
  core.castShadow = true;
  g.add(core);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const puff = new THREE.Mesh(new THREE.SphereGeometry(1.55, 10, 10), tuftMat);
    puff.position.set(Math.cos(a) * 1.9, 9.0 + (i % 2) * 0.5, Math.sin(a) * 1.9);
    g.add(puff);
  }
  return g;
}

/** Lush 3D Cat-in-the-Hat Christmas Tree with 3 tiers, pink garland, golden bell & colorful ornaments */
export function createChristmasTree3D(scale = 1): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.85, 2.8, 10),
    new THREE.MeshStandardMaterial({ color: '#8b623f', roughness: 0.9 })
  );
  trunk.position.y = 1.4;
  g.add(trunk);

  const green1 = new THREE.MeshStandardMaterial({ color: '#5ea93f', roughness: 0.7 });
  const green2 = new THREE.MeshStandardMaterial({ color: '#69b543', roughness: 0.7 });
  const c1 = new THREE.Mesh(new THREE.ConeGeometry(4.0, 4.2, 12), green1);
  c1.position.y = 4.2;
  const c2 = new THREE.Mesh(new THREE.ConeGeometry(3.2, 3.8, 12), green2);
  c2.position.y = 6.5;
  const c3 = new THREE.Mesh(new THREE.ConeGeometry(2.2, 3.4, 12), green1);
  c3.position.y = 8.7;
  g.add(c1, c2, c3);

  // Pink Fluffy Garlands
  const garMat = new THREE.MeshStandardMaterial({ color: '#e47bb8', roughness: 0.6 });
  const g1 = new THREE.Mesh(new THREE.TorusGeometry(2.85, 0.34, 8, 22), garMat);
  g1.rotation.x = Math.PI / 2;
  g1.position.y = 4.6;
  const g2 = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.28, 8, 20), garMat);
  g2.rotation.x = Math.PI / 2;
  g2.position.y = 7.0;
  g.add(g1, g2);

  // Golden Star Topper
  const star = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.85),
    new THREE.MeshStandardMaterial({ color: '#ffe055', emissive: '#ff9f1c', emissiveIntensity: 0.5 })
  );
  star.position.y = 10.7;
  g.add(star);

  // Bright Colorful Ornaments
  const orbCols = ['#d92626', '#ffe055', '#4cc9f0', '#ff9f43'];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const r = i % 2 === 0 ? 3.2 : 2.3;
    const y = i % 2 === 0 ? 3.6 : 6.1;
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 10, 10),
      new THREE.MeshStandardMaterial({ color: orbCols[i % orbCols.length], roughness: 0.25, metalness: 0.25 })
    );
    orb.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    g.add(orb);
  }

  g.scale.setScalar(scale);
  return g;
}

/** 3D Falling Snow Particle Field */
export function createSnowPoints(count = 320, spread = 80, height = 38): THREE.Points {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread;
    pos[i * 3 + 1] = Math.random() * height;
    pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: '#ffffff',
    size: 0.45,
    transparent: true,
    opacity: 0.85,
  });
  return new THREE.Points(geo, mat);
}
