import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Node polyfill for GLTFExporter's FileReader usage when serializing GLB buffers
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class NodeFileReader {
    async readAsArrayBuffer(blob) {
      const ab = await blob.arrayBuffer();
      this.result = ab;
      if (typeof this.onloadend === 'function') {
        this.onloadend({ target: this });
      } else if (typeof this.onload === 'function') {
        this.onload({ target: this });
      }
    }
  };
}

/**
 * Generates an organic lofted anatomical glove mesh piece from longitudinal slice contours.
 * Preserves continuous outward normals, smooth joints (no blocky shelves), and normalized UVs.
 */
function buildLoftedSurface(slices, rings, fn, uvMapper, flipWinding = false) {
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= slices; i++) {
    const t = i / slices;
    for (let j = 0; j <= rings; j++) {
      const s = j / rings;
      const p = fn(t, s);
      positions.push(p.x, p.y, p.z);
      const [u, v] = uvMapper(p.x, p.y, p.z, t, s);
      uvs.push(THREE.MathUtils.clamp(u, 0.015, 0.985), THREE.MathUtils.clamp(v, 0.015, 0.985));
    }
  }

  const stride = rings + 1;
  for (let i = 0; i < slices; i++) {
    for (let j = 0; j < rings; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      if (flipWinding) {
        indices.push(a, c, b, a, d, c);
      } else {
        indices.push(a, b, c, a, c, d);
      }
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Merges an array of indexed BufferGeometries (matching position, uv, normal attributes).
 */
function mergeBufferGeometries(geoms) {
  let totalVerts = 0;
  let totalIndices = 0;
  for (const g of geoms) {
    totalVerts += g.attributes.position.count;
    totalIndices += g.index ? g.index.count : g.attributes.position.count;
  }

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const uvs = new Float32Array(totalVerts * 2);
  const indices = new Uint32Array(totalIndices);

  let vOffset = 0;
  let iOffset = 0;
  for (const g of geoms) {
    const pos = g.attributes.position.array;
    const norm = g.attributes.normal.array;
    const uv = g.attributes.uv.array;
    positions.set(pos, vOffset * 3);
    normals.set(norm, vOffset * 3);
    uvs.set(uv, vOffset * 2);

    const idxCount = g.index.count;
    const idxArr = g.index.array;
    for (let k = 0; k < idxCount; k++) {
      indices[iOffset + k] = idxArr[k] + vOffset;
    }
    vOffset += g.attributes.position.count;
    iOffset += idxCount;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  return merged;
}

/**
 * Shared global hand-panel UV projection so all decals, flex creases, and silicone armor
 * map accurately onto Left/Right Backhand & Palm surfaces.
 */
function handPanelUv(x, y) {
  const u = THREE.MathUtils.clamp((x + 0.58) / 1.16, 0.02, 0.98);
  const v = THREE.MathUtils.clamp((y + 1.18) / 2.20, 0.02, 0.98);
  return [u, v];
}

/**
 * Mirrored-U projection for the -Z palm surfaces so view from palm front reads left-to-right
 * (eliminates backward/mirrored "ARZA CONTACT 4MM" heel stamp & palm seams).
 */
function palmPanelUv(x, y) {
  const u = THREE.MathUtils.clamp(1.0 - (x + 0.58) / 1.16, 0.02, 0.98);
  const v = THREE.MathUtils.clamp((y + 1.18) / 2.20, 0.02, 0.98);
  return [u, v];
}

function createSingleGloveParts(handSide = 'right') {
  const dir = handSide === 'right' ? 1 : -1;

  // Ergonomic relaxed goalkeeper catch arch: gently cupped forward (-Z) across the hand
  const handCurlZ = (y) => {
    if (y <= -0.10) {
      // Forearm cuff & palm bowl slight cup
      const t = THREE.MathUtils.clamp((y + 1.18) / 1.08, 0, 1);
      return -0.025 * Math.sin(t * Math.PI);
    }
    // Natural ready-to-catch forward arch above knuckles
    const d = Math.max(0, y + 0.10);
    return -0.145 * Math.pow(d, 1.48);
  };

  // Sculpted hand silhouette width from elastic wrist tunnel up to metacarpal knuckles
  const palmHalfWidth = (tY) => {
    // tY 0 = y=-1.18 cuff rim, 1 = y=+0.08 finger crotch ridge
    const wWrist = 0.285;
    const taper = Math.sin(tY * Math.PI * 0.65);
    const bulge = Math.exp(-Math.pow((tY - 0.62) / 0.25, 2)) * 0.095;
    return wWrist + taper * 0.075 + bulge;
  };

  // 1) Main Palm Body Shell (-Z face + heel pad relief)
  const palmBody = buildLoftedSurface(
    36,
    28,
    (tY, sX) => {
      const y = THREE.MathUtils.lerp(-1.14, 0.10, tY);
      const uSigned = sX * 2 - 1; // -1 (pinky side) .. +1 (thumb/index side)
      const hw = palmHalfWidth(tY);
      const x = dir * (uSigned * hw - 0.01 * (1 - tY));
      const dome = Math.sqrt(Math.max(0, 1 - Math.pow(uSigned * 0.92, 2)));
      // Deep ergonomic palm cup + raised lower-outer abrasion cushion near pinky heel
      const heelAbrasion =
        Math.exp(-Math.pow((tY - 0.28) / 0.14, 2)) *
        Math.exp(-Math.pow((uSigned + 0.55) / 0.36, 2)) *
        0.028;
      const cupDepth = Math.exp(-Math.pow((tY - 0.65) / 0.26, 2)) * (1 - uSigned * uSigned) * 0.032;
      const edgeLip = 0.016 * (1 - dome);
      const z = handCurlZ(y) - 0.118 * dome - heelAbrasion + cupDepth + edgeLip;
      return { x, y, z };
    },
    (x, y) => palmPanelUv(x, y),
    dir < 0
  );

  // 2) Main Backhand Neoprene Shell (+Z face + 3D raised knuckle punch armor bar + cuff sleeve)
  const backBody = buildLoftedSurface(
    40,
    30,
    (tY, sX) => {
      const y = THREE.MathUtils.lerp(-1.18, 0.105, tY);
      const uSigned = sX * 2 - 1;
      const hw = palmHalfWidth(tY) * 1.005;
      const x = dir * (uSigned * hw - 0.01 * (1 - tY));
      const dome = Math.sqrt(Math.max(0, 1 - Math.pow(uSigned * 0.94, 2)));
      // 3D sculpted punch-zone knuckle ridges & diagonal V grip bar baked into backhand vertices
      const vDist = Math.abs(tY - (0.78 - Math.abs(uSigned) * 0.08));
      const punchBarRelief = Math.exp(-Math.pow(vDist / 0.045, 2)) * 0.026;
      const knuckleWaves =
        Math.exp(-Math.pow((tY - 0.87) / 0.055, 2)) *
        (0.5 + 0.5 * Math.cos(uSigned * Math.PI * 3.5)) *
        0.016;
      const paddingBulge = Math.exp(-Math.pow((tY - 0.62) / 0.26, 2)) * 0.022;
      const z = handCurlZ(y) + 0.124 * dome + paddingBulge + punchBarRelief + knuckleWaves;
      return { x, y, z };
    },
    (x, y) => handPanelUv(x, y, handSide),
    dir > 0
  );

  // Outer Perimeter Mesh Wall connecting Palm & Backhand cleanly (plus thumb cutout flare)
  const bodySideLeft = buildLoftedSurface(
    28,
    10,
    (tY, sZ) => {
      const y = THREE.MathUtils.lerp(-1.15, 0.095, tY);
      const hw = palmHalfWidth(tY);
      const uSigned = -1;
      const arch = Math.sin(sZ * Math.PI);
      const x = dir * (uSigned * hw - 0.01 * (1 - tY) - arch * 0.028);
      const zMid = THREE.MathUtils.lerp(-0.085, 0.09, sZ);
      const z = handCurlZ(y) + zMid;
      return { x, y, z };
    },
    (x, y) => handPanelUv(x, y, handSide),
    dir > 0
  );

  const bodySideRight = buildLoftedSurface(
    28,
    10,
    (tY, sZ) => {
      const y = THREE.MathUtils.lerp(-1.15, 0.095, tY);
      const hw = palmHalfWidth(tY);
      const uSigned = 1;
      const arch = Math.sin(sZ * Math.PI);
      const x = dir * (uSigned * hw - 0.01 * (1 - tY) + arch * 0.024);
      const zMid = THREE.MathUtils.lerp(-0.085, 0.09, sZ);
      const z = handCurlZ(y) + zMid;
      return { x, y, z };
    },
    (x, y) => handPanelUv(x, y, handSide),
    dir < 0
  );

  // Sculpted Anatomical Fingers (Index, Middle, Ring, Pinky) — curved forward & tucked nicely into knuckles!
  const fingersSpec = [
    { name: 'pinky', baseX: -0.275, topX: -0.325, baseY: -0.02, len: 0.67, rad: 0.072 },
    { name: 'ring', baseX: -0.095, topX: -0.115, baseY: 0.03, len: 0.87, rad: 0.079 },
    { name: 'middle', baseX: 0.095, topX: 0.095, baseY: 0.04, len: 0.96, rad: 0.083 },
    { name: 'index', baseX: 0.28, topX: 0.305, baseY: 0.02, len: 0.84, rad: 0.082 },
  ];

  const palmMeshes = [palmBody];
  const backMeshes = [backBody];
  const gussetMeshes = [bodySideLeft, bodySideRight];

  for (const f of fingersSpec) {
    const fingerCenter = (t) => {
      // Smooth slight forward curl + flared knuckle skirt at t=0
      const y = f.baseY + t * f.len;
      const cx = dir * THREE.MathUtils.lerp(f.baseX, f.topX, Math.pow(t, 0.85));
      const cz = handCurlZ(y) - 0.01 * t;
      // Tip dome rounding in final 18% of finger
      const tipT = Math.max(0, (t - 0.82) / 0.18);
      const profileScale = Math.sqrt(Math.max(0.04, 1 - tipT * tipT * 0.94));
      // Slight subtle joint narrowing at IP creases (t=0.38, 0.68)
      const jointPinch =
        1 -
        0.045 * Math.exp(-Math.pow((t - 0.38) / 0.06, 2)) -
        0.04 * Math.exp(-Math.pow((t - 0.68) / 0.06, 2));
      return {
        x: cx,
        y,
        z: cz,
        rx: f.rad * profileScale * jointPinch,
        rz: f.rad * 1.06 * profileScale * jointPinch,
      };
    };

    // Finger Palm Latex (-Z front face wrapping gently around sides for Roll-Hybrid look)
    const fPalm = buildLoftedSurface(
      24,
      18,
      (t, s) => {
        const c = fingerCenter(t);
        const theta = THREE.MathUtils.lerp(-Math.PI * 0.86, -Math.PI * 0.14, s);
        // Overlapping knuckle base lip blends smoothly into palm shell
        const rootBlend = Math.exp(-t * 9) * 0.018;
        return {
          x: c.x + Math.cos(theta) * (c.rx * 1.03 + rootBlend),
          y: c.y,
          z: c.z + Math.sin(theta) * (c.rz * 1.04 + rootBlend),
        };
      },
      (x, y) => palmPanelUv(x, y),
      false
    );
    palmMeshes.push(fPalm);

    // Finger Backhand (+Z dorsal face with sculpted 3D silicone grip fins per phalanx!)
    const fBack = buildLoftedSurface(
      26,
      18,
      (t, s) => {
        const c = fingerCenter(t);
        const theta = THREE.MathUtils.lerp(Math.PI * 0.14, Math.PI * 0.86, s);
        const rootBlend = Math.exp(-t * 9) * 0.018;
        // Raised 3D phalanx silicone punch blades at t ~ 0.22, 0.50, 0.74
        const fin1 = Math.exp(-Math.pow((t - 0.22) / 0.045, 2));
        const fin2 = Math.exp(-Math.pow((t - 0.50) / 0.045, 2));
        const fin3 = Math.exp(-Math.pow((t - 0.74) / 0.04, 2));
        const centerFactor = Math.sin(s * Math.PI);
        const finRelief = (fin1 + fin2 + fin3 * 0.8) * centerFactor * 0.022;
        return {
          x: c.x + Math.cos(theta) * (c.rx * 1.02 + rootBlend),
          y: c.y,
          z: c.z + Math.sin(theta) * (c.rz * 1.02 + rootBlend) + finRelief,
        };
      },
      (x, y) => handPanelUv(x, y, handSide),
      false
    );
    backMeshes.push(fBack);

    // Recessed Breathable Mesh Side Gussets (left and right side strips of each finger)
    for (const side of ['neg', 'pos']) {
      const fGusset = buildLoftedSurface(
        22,
        8,
        (t, s) => {
          const c = fingerCenter(t);
          const angleStart = side === 'neg' ? Math.PI * 0.84 : -Math.PI * 0.16;
          const angleEnd = side === 'neg' ? Math.PI * 1.16 : Math.PI * 0.16;
          const theta = THREE.MathUtils.lerp(angleStart, angleEnd, s);
          const inset = 0.91; // Slightly recessed mesh gussets make palm & backhand bevels pop
          return {
            x: c.x + Math.cos(theta) * c.rx * inset,
            y: c.y,
            z: c.z + Math.sin(theta) * c.rz * inset,
          };
        },
        (x, y) => handPanelUv(x, y, handSide),
        false
      );
      gussetMeshes.push(fGusset);
    }
  }

  // Sculpted Opposed Anatomical Thumb emerging from outer thenar rim (no dorsal poke-through)
  const thumbCenter = (t) => {
    const curve = Math.pow(t, 0.86);
    const x = dir * THREE.MathUtils.lerp(0.325, 0.64, curve);
    const y = THREE.MathUtils.lerp(-0.56, 0.06, curve);
    const z = THREE.MathUtils.lerp(-0.048, -0.225, Math.sin(t * Math.PI * 0.68));
    const tipT = Math.max(0, (t - 0.78) / 0.22);
    const taper = Math.sqrt(Math.max(0.05, 1 - tipT * tipT * 0.93));
    const baseThick = 1 + 0.26 * Math.exp(-t * 5);
    return { x, y, z, rx: 0.086 * taper * baseThick, rz: 0.092 * taper * baseThick };
  };

  // Tangent rotation helper along thumb axis
  const thumbRingPoint = (t, theta, scaleR = 1) => {
    const c = thumbCenter(t);
    // Thumb axis direction in XY: tilted ~42 deg outward
    const axAngle = dir * 0.56;
    const ux = Math.cos(axAngle);
    const uy = Math.sin(axAngle);
    const localX = Math.cos(theta) * c.rx * scaleR;
    const localZ = Math.sin(theta) * c.rz * scaleR;
    return {
      x: c.x + ux * localX,
      y: c.y - uy * localX,
      z: c.z + localZ,
    };
  };

  const thumbPalm = buildLoftedSurface(
    22,
    18,
    (t, s) => {
      const theta = THREE.MathUtils.lerp(-Math.PI * 1.15, Math.PI * 0.05, s);
      return thumbRingPoint(t, theta, 1.04);
    },
    (x, y) => palmPanelUv(x, y),
    dir < 0
  );
  palmMeshes.push(thumbPalm);

  const thumbBack = buildLoftedSurface(
    22,
    18,
    (t, s) => {
      const theta = THREE.MathUtils.lerp(Math.PI * 0.03, Math.PI * 0.88, s);
      const pt = thumbRingPoint(t, theta, 1.02);
      const thumbGrip = Math.exp(-Math.pow((t - 0.55) / 0.12, 2)) * 0.015;
      const rootTuckZ = 0.028 * Math.exp(-t * 10);
      return { x: pt.x, y: pt.y, z: pt.z + thumbGrip - rootTuckZ };
    },
    (x, y) => handPanelUv(x, y, handSide),
    dir < 0
  );
  backMeshes.push(thumbBack);

  const thumbGusset = buildLoftedSurface(
    18,
    8,
    (t, s) => {
      const theta = THREE.MathUtils.lerp(Math.PI * 0.85, Math.PI * 1.18, s);
      return thumbRingPoint(t, theta, 0.92);
    },
    (x, y) => handPanelUv(x, y, handSide),
    dir < 0
  );
  gussetMeshes.push(thumbGusset);

  // Elastic Double-Wrap Wrist Strap + Raised 3D Velcro Lock Tab at Front Dorsal Closure
  const wristStrap = buildLoftedSurface(
    22,
    44,
    (tY, sAng) => {
      const y = THREE.MathUtils.lerp(-1.10, -0.84, tY);
      const theta = sAng * Math.PI * 2;
      const baseRx = THREE.MathUtils.lerp(0.325, 0.345, tY);
      const baseRz = THREE.MathUtils.lerp(0.165, 0.175, tY);
      // Velcro flap raised ridge wrapping cleanly across the front (+Z)
      const angleDiff = Math.atan2(Math.sin(theta - Math.PI * 0.5), Math.cos(theta - Math.PI * 0.5));
      const velcroFlap =
        Math.exp(-Math.pow(angleDiff / 0.72, 2)) *
        (tY > 0.08 && tY < 0.92 ? 0.022 : 0.008);
      // Molded rubber pull tab bump near closing tip
      const pullTabAngle = dir > 0 ? Math.PI * 0.24 : Math.PI * 0.76;
      const pullDiff = Math.atan2(Math.sin(theta - pullTabAngle), Math.cos(theta - pullTabAngle));
      const rubberTab = Math.exp(-Math.pow(pullDiff / 0.16, 2)) * 0.025;
      const rScale = 1 + velcroFlap * 2.1 + rubberTab * 1.8;
      return {
        x: Math.cos(theta) * baseRx * rScale,
        y,
        z: handCurlZ(y) + Math.sin(theta) * baseRz * rScale,
      };
    },
    (_x, _y, _z, tY, sAng) => {
      // Non-mirrored readable front projection across +Z dorsal closure (center u=0.50 at +Z)
      const rel = (0.75 - sAng + 1.0) % 1.0;
      return [THREE.MathUtils.clamp(rel, 0.015, 0.985), THREE.MathUtils.clamp(tY, 0.02, 0.98)];
    },
    true
  );

  return {
    PalmLatex: mergeBufferGeometries(palmMeshes),
    Backhand: mergeBufferGeometries(backMeshes),
    FingerGussets: mergeBufferGeometries(gussetMeshes),
    WristStrap: wristStrap,
  };
}

async function buildProGlovesGLB() {
  const root = new THREE.Group();
  root.name = 'GoalkeeperGloves_GK1';

  const leftParts = createSingleGloveParts('left');
  const rightParts = createSingleGloveParts('right');

  const dummyPalmMat = new THREE.MeshStandardMaterial({ name: 'palm_mat', color: 0xffffff });
  const dummyBackMat = new THREE.MeshStandardMaterial({ name: 'backhand_mat', color: 0x111111 });
  const dummyAccentMat = new THREE.MeshStandardMaterial({ name: 'gussets_mat', color: 0xfa5400 });
  const dummyStrapMat = new THREE.MeshStandardMaterial({ name: 'strap_mat', color: 0x059669 });

  const leftGroup = new THREE.Group();
  leftGroup.name = 'LeftGlove';
  leftGroup.position.set(-0.78, 0, 0);
  leftGroup.rotation.set(0.05, 0.22, 0.04);

  const lPalm = new THREE.Mesh(leftParts.PalmLatex, dummyPalmMat);
  lPalm.name = 'Left_PalmLatex';
  const lBack = new THREE.Mesh(leftParts.Backhand, dummyBackMat);
  lBack.name = 'Left_Backhand';
  const lGus = new THREE.Mesh(leftParts.FingerGussets, dummyAccentMat);
  lGus.name = 'Left_FingerGussets';
  const lStrap = new THREE.Mesh(leftParts.WristStrap, dummyStrapMat);
  lStrap.name = 'Left_WristStrap';
  leftGroup.add(lPalm, lBack, lGus, lStrap);

  const rightGroup = new THREE.Group();
  rightGroup.name = 'RightGlove';
  rightGroup.position.set(0.78, 0, 0);
  rightGroup.rotation.set(0.05, -0.22, -0.04);

  const rPalm = new THREE.Mesh(rightParts.PalmLatex, dummyPalmMat);
  rPalm.name = 'Right_PalmLatex';
  const rBack = new THREE.Mesh(rightParts.Backhand, dummyBackMat);
  rBack.name = 'Right_Backhand';
  const rGus = new THREE.Mesh(rightParts.FingerGussets, dummyAccentMat);
  rGus.name = 'Right_FingerGussets';
  const rStrap = new THREE.Mesh(rightParts.WristStrap, dummyStrapMat);
  rStrap.name = 'Right_WristStrap';
  rightGroup.add(rPalm, rBack, rGus, rStrap);

  root.add(leftGroup, rightGroup);

  const exporter = new GLTFExporter();
  const glbBuffer = await exporter.parseAsync(root, { binary: true });
  const outPath = path.resolve(process.cwd(), 'public/models/goalkeeper_gloves_gk1.glb');
  fs.writeFileSync(outPath, Buffer.from(glbBuffer));

  const buf = fs.readFileSync(outPath);
  const jlen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.slice(20, 20 + jlen).toString('utf8'));
  console.log('Generated pro gloves GLB:', {
    bytes: buf.length,
    meshes: json.meshes.map((m) => json.accessors[m.primitives[0].attributes.POSITION].count),
    nodes: json.nodes.map((n) => n.name),
  });
}

buildProGlovesGLB().catch((err) => {
  console.error(err);
  process.exit(1);
});
