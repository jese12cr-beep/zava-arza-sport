import * as THREE from 'three';
import { resolveAssetUrl } from '../../utils/assetUrl';
import { buildNeckLabelCanvasTexture } from './mirlModelLoader';
import {
  composeGarmentPartCanvas,
  drawPresetVectorCrestMm,
} from '../compositor/fishPartCompositor';
import { FABRIC_WEAVES } from '../core/designStore';

export const ALL_POSSIBLE_MESH_PARTS = [
  'Front',
  'Back',
  'LeftArm',
  'RightArm',
  'RightLeg',
  'LeftLeg',
  'Collar',
  'Krageneinfass',
  'Aermelbandlinks',
  'Aermelbandrechts',
  // Dama Baloncesto
  'Seitenteillinks',
  'Seitenteilrechts',
  // Dama Shorts Baloncesto
  'RechtesBeinvorne',
  'LinkesBeinvorne',
  'RechtesBeinhinten',
  'LinkesBeinhinten',
  'Seitenstreifenrechts',
  'Seitenstreifenlinks',
  'Aufnaeher',
  // Chaquetas Softshell Hombre & Dama
  'FrontLeftPart',
  'FrontRightPart',
  'CollarOutside',
  'CollarInside',
  'Unterarmstreifenlinks',
  'Unterarmstreifenrechts',
  'RV',
  'RVS-B',
  'RVPL',
  'RVPR',
  'Toothmesh',
  'Toothmesh_BG',
  'GU',
];

export const PANEL_TO_PARTNAME = {
  front: 'Front',
  back: 'Back',
  left_arm: 'LeftArm',
  right_arm: 'RightArm',
  right_leg: 'RightLeg',
  left_leg: 'LeftLeg',
  collar: 'Collar',
  front_left: 'FrontLeftPart',
  front_right: 'FrontRightPart',
  side_left: 'Seitenteillinks',
  side_right: 'Seitenteilrechts',
};

const FABRIC_MESH_PART_NAMES = [
  'Front',
  'Back',
  'LeftArm',
  'RightArm',
  'RightLeg',
  'LeftLeg',
  'Collar',
  'Krageneinfass',
  'Aermelbandlinks',
  'Aermelbandrechts',
  'Seitenteillinks',
  'Seitenteilrechts',
  'RechtesBeinvorne',
  'LinkesBeinvorne',
  'RechtesBeinhinten',
  'LinkesBeinhinten',
  'Seitenstreifenrechts',
  'Seitenstreifenlinks',
  'Aufnaeher',
  'FrontLeftPart',
  'FrontRightPart',
  'CollarOutside',
  'CollarInside',
  'Unterarmstreifenlinks',
  'Unterarmstreifenrechts',
];

const LARGE_BODY_OR_LEG_PARTS = new Set([
  'Front',
  'Back',
  'RightLeg',
  'LeftLeg',
  'FrontLeftPart',
  'FrontRightPart',
  'LinkesBeinvorne',
  'RechtesBeinvorne',
  'LinkesBeinhinten',
  'RechtesBeinhinten',
]);

/**
 * Inyecta la regla óptica real de sublimación textil interior (`innenseiteAufhellen`):
 * el poliéster técnico blanco muestra penetración parcial (~38%) en el reverso (`!gl_FrontFacing`).
 */
export function applyOwayoInnerSublimationShader(material, keySuffix) {
  material.customProgramCacheKey = () => `owayo_v5_inner_sublimation_${keySuffix}`;
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
      if (!gl_FrontFacing) {
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.95, 0.96, 0.98), 0.62);
      }`
    );
  };
}

const bumpTextureCache = new Map();
export function getOrLoadRealBumpTexture(url, repeatX = 48, repeatY = 48) {
  const resolved = resolveAssetUrl(url);
  const key = `${resolved}|${repeatX}|${repeatY}`;
  if (bumpTextureCache.has(key)) return bumpTextureCache.get(key);
  const loader = new THREE.TextureLoader();
  const tex = loader.load(resolved);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  bumpTextureCache.set(key, tex);
  return tex;
}

/**
 * Iluminación estándar de estudio fotográfico ARZA SPORT para prendas y kits 3D.
 */
export function addStudioGarmentLighting(scene) {
  const hemiLight = new THREE.HemisphereLight(0xf8fafc, 0x1e293b, 1.08);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.85);
  keyLight.position.set(2.9, 3.9, 4.6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.88);
  fillLight.position.set(-3.5, 1.6, 3.2);
  scene.add(fillLight);

  const backRimLight = new THREE.DirectionalLight(0xfef3c7, 1.35);
  backRimLight.position.set(0.3, 2.8, -4.6);
  scene.add(backRimLight);
}

export function createSoftFloorShadowMesh(width = 2.7, depth = 1.8, yPos = -1.44) {
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d');
  const sGrad = sCtx.createRadialGradient(64, 64, 6, 64, 64, 62);
  sGrad.addColorStop(0, 'rgba(0,0,0,0.52)');
  sGrad.addColorStop(1, 'rgba(0,0,0,0)');
  sCtx.fillStyle = sGrad;
  sCtx.fillRect(0, 0, 128, 128);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);

  const floorShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  );
  floorShadow.rotation.x = -Math.PI / 2;
  floorShadow.position.y = yPos;
  return { floorShadow, shadowTex };
}

export function createGarmentSurfaceSet(maxAniso = 4, initialPlayerSize = 'L', { resolutionScale = 1 } = {}) {
  const partCanvases = {};
  const partTextures = {};
  const partMaterials = {};
  const ribBumpTex = getOrLoadRealBumpTexture('/fabrics/bandstoff-rtex3.png', 28, 12);

  for (const partName of ALL_POSSIBLE_MESH_PARTS) {
    const c = document.createElement('canvas');
    const isLarge = LARGE_BODY_OR_LEG_PARTS.has(partName);
    const baseLarge = Math.round(2048 * resolutionScale);
    const baseMed = Math.round(1024 * resolutionScale);
    const baseCollar = Math.round(256 * resolutionScale);
    const baseSmall = Math.round(128 * resolutionScale);

    c.width = isLarge ? baseLarge : baseMed;
    c.height = isLarge
      ? baseLarge
      : partName === 'LeftArm' || partName === 'RightArm'
      ? baseMed
      : partName.includes('Collar') || partName.includes('Krageneinfass')
      ? Math.max(128, baseCollar)
      : Math.max(64, baseSmall);

    partCanvases[partName] = c;

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso;
    tex.__lastW = c.width;
    tex.__lastH = c.height;
    partTextures[partName] = tex;

    const isRibTrim =
      partName === 'Collar' ||
      partName === 'Krageneinfass' ||
      partName === 'Aermelbandlinks' ||
      partName === 'Aermelbandrechts';

    const mat = new THREE.MeshPhysicalMaterial({
      map: tex,
      bumpMap: isRibTrim ? ribBumpTex : null,
      bumpScale: isRibTrim ? 0.008 : 0.006,
      roughness: isRibTrim ? 0.64 : 0.54,
      metalness: 0.02,
      sheen: 0.28,
      sheenRoughness: 0.56,
      sheenColor: new THREE.Color(0xffffff),
      side: THREE.DoubleSide,
    });
    applyOwayoInnerSublimationShader(mat, partName);
    partMaterials[partName] = mat;
  }

  const neckLabelTex = buildNeckLabelCanvasTexture(initialPlayerSize || 'L');
  const neckLabelMat = new THREE.MeshStandardMaterial({
    map: neckLabelTex,
    roughness: 0.65,
    side: THREE.DoubleSide,
  });
  const hemFlagMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#0f172a'),
    roughness: 0.7,
    side: THREE.DoubleSide,
  });

  const dispose = () => {
    Object.values(partTextures).forEach((t) => t.dispose());
    Object.values(partMaterials).forEach((m) => m.dispose());
    neckLabelMat.map?.dispose();
    neckLabelMat.dispose();
    hemFlagMat.dispose();
  };

  return {
    partCanvases,
    partTextures,
    partMaterials,
    neckLabelMat,
    hemFlagMat,
    dispose,
  };
}

export function applyFabricWeaveToMaterials(partMaterials, fabricWeaveId) {
  const weave = FABRIC_WEAVES.find((w) => w.id === fabricWeaveId) || FABRIC_WEAVES[0];
  const bumpTex = getOrLoadRealBumpTexture(weave.bumpUrl || '/fabrics/ts-tex.png', weave.uvRepeat, weave.uvRepeat);
  for (const partName of FABRIC_MESH_PART_NAMES) {
    const mat = partMaterials[partName];
    if (!mat) continue;
    mat.bumpMap = bumpTex;
    mat.bumpScale = Math.abs(weave.bumpScale || 0.005) * 1.4;
    mat.roughness = weave.roughness;
    mat.needsUpdate = true;
  }
}

export function paintGarmentSurfaceSet(
  surfaceSet,
  partNames,
  design,
  activePlayer,
  artworkRegistry,
  masksMap,
  overlayOpts = null
) {
  if (!surfaceSet || !design) return;
  for (const partName of partNames) {
    const canvas = surfaceSet.partCanvases[partName];
    const tex = surfaceSet.partTextures[partName];
    if (!canvas || !tex) continue;

    composeGarmentPartCanvas(
      canvas,
      partName,
      design,
      activePlayer,
      artworkRegistry,
      masksMap,
      overlayOpts
    );

    if (tex.__lastW !== canvas.width || tex.__lastH !== canvas.height) {
      tex.dispose();
      tex.__lastW = canvas.width;
      tex.__lastH = canvas.height;
      const mat = surfaceSet.partMaterials[partName];
      if (mat) mat.needsUpdate = true;
    }
    tex.needsUpdate = true;
  }
}

function drawRoundedRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function drawHexNeoprenePattern(ctx, bumpCtx, w, h) {
  const stepX = 24;
  const stepY = 20;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1.4;
  bumpCtx.save();
  bumpCtx.strokeStyle = 'rgb(112,112,112)';
  bumpCtx.lineWidth = 2.0;

  for (let row = 0; row * stepY < h + stepY; row++) {
    const offset = (row % 2) * (stepX * 0.5);
    const cy = row * stepY;
    for (let col = -1; col * stepX < w + stepX; col++) {
      const cx = col * stepX + offset;
      const rx = stepX * 0.44;
      const ry = stepY * 0.48;
      ctx.beginPath();
      bumpCtx.beginPath();
      for (let k = 0; k < 6; k++) {
        const ang = (Math.PI / 3) * k + Math.PI / 6;
        const px = cx + Math.cos(ang) * rx;
        const py = cy + Math.sin(ang) * ry;
        if (k === 0) {
          ctx.moveTo(px, py);
          bumpCtx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
          bumpCtx.lineTo(px, py);
        }
      }
      ctx.closePath();
      ctx.stroke();
      bumpCtx.closePath();
      bumpCtx.stroke();
    }
  }
  ctx.restore();
  bumpCtx.restore();
}

function drawLatexMicroPores(ctx, bumpCtx, w, h) {
  // Fine deterministic cellular pore grain (contact latex grip surface, non-fabric)
  ctx.save();
  bumpCtx.save();
  for (let i = 0; i < 4200; i++) {
    const px = ((i * 733 + 19) % 1009) * (w / 1009);
    const py = ((i * 419 + 83) % 1013) * (h / 1013);
    const r = 0.9 + (i % 3) * 0.45;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(0,0,0,0.032)' : 'rgba(255,255,255,0.045)';
    ctx.fillRect(px, py, r, r);
    bumpCtx.fillStyle = i % 3 === 0 ? 'rgb(168,168,168)' : 'rgb(112,112,112)';
    bumpCtx.fillRect(px, py, r * 1.4, r * 1.4);
  }
  ctx.restore();
  bumpCtx.restore();
}

export function paintGlovesCanvases(
  glovesSurface,
  glovesDesign,
  garmentDesign,
  activePlayer,
  artworkRegistry
) {
  const {
    gloveBackCanvas: backCanvas,
    gloveBackBumpCanvas: backBumpCanvas,
    glovePalmCanvas: palmCanvas,
    glovePalmBumpCanvas: palmBumpCanvas,
    gloveStrapCanvas: strapCanvas,
    gloveStrapBumpCanvas: strapBumpCanvas,
  } = glovesSurface || {};
  if (!backCanvas || !strapCanvas) return;

  const gColors = glovesDesign?.colorZones || {};
  const backHex = gColors.primary?.hex || '#111111';
  const accentHex = gColors.accents?.hex || '#fa5400';
  const palmHex = gColors.palm?.hex || '#ffffff';
  const strapHex = gColors.strap?.hex || '#059669';
  const strapTextHex = gColors.strapText?.hex || '#ffffff';
  const gloveCut = glovesDesign?.gloveCut || 'hybrid';

  // ==================== 1. DORSO NEOPRENO + RELIEVE SILICONA PUNCH-ZONE ====================
  const bCtx = backCanvas.getContext('2d');
  const bbCtx = backBumpCanvas?.getContext('2d');
  const bW = backCanvas.width;
  const bH = backCanvas.height;

  bCtx.clearRect(0, 0, bW, bH);
  bCtx.fillStyle = backHex;
  bCtx.fillRect(0, 0, bW, bH);

  // Shading anatómico suave sobre nudillos y laterales
  const backGrad = bCtx.createLinearGradient(0, 0, 0, bH);
  backGrad.addColorStop(0, 'rgba(255,255,255,0.06)');
  backGrad.addColorStop(0.48, 'rgba(0,0,0,0.0)');
  backGrad.addColorStop(0.85, 'rgba(0,0,0,0.16)');
  backGrad.addColorStop(1, 'rgba(0,0,0,0.28)');
  bCtx.fillStyle = backGrad;
  bCtx.fillRect(0, 0, bW, bH);

  if (bbCtx) {
    bbCtx.fillStyle = 'rgb(128,128,128)';
    bbCtx.fillRect(0, 0, bW, bH);
  }

  // AeroMesh micro-celda hexagonal en color y mapa de relieve
  if (bbCtx) {
    drawHexNeoprenePattern(bCtx, bbCtx, bW, bH);
  }

  // Elementos 3D de Silicona Punch-Zone en las 4 falanges superiores (zona v arriba -> y < 0.44)
  bCtx.save();
  if (bbCtx) bbCtx.save();
  const fingerCentersX = [0.22, 0.39, 0.56, 0.72];
  fingerCentersX.forEach((fx) => {
    [0.14, 0.25, 0.36].forEach((fy, idx) => {
      const rw = bW * (idx === 2 ? 0.088 : 0.072);
      const rh = bH * 0.022;
      const rx = bW * fx - rw * 0.5;
      const ry = bH * fy - rh * 0.5;
      drawRoundedRectPath(bCtx, rx, ry, rw, rh, 6);
      bCtx.fillStyle = accentHex;
      bCtx.globalAlpha = 0.94;
      bCtx.fill();
      bCtx.strokeStyle = 'rgba(0,0,0,0.38)';
      bCtx.lineWidth = 2;
      bCtx.stroke();

      if (bbCtx) {
        drawRoundedRectPath(bbCtx, rx, ry, rw, rh, 6);
        bbCtx.fillStyle = 'rgb(242,242,242)';
        bbCtx.fill();
        bbCtx.strokeStyle = 'rgb(75,75,75)';
        bbCtx.lineWidth = 2.5;
        bbCtx.stroke();
      }
    });
  });

  // Zona Principal de Despeje en Nudillos (Predator V-Armor limpio arriba de la zona del escudo)
  bCtx.globalAlpha = 0.96;
  bCtx.beginPath();
  bCtx.moveTo(bW * 0.14, bH * 0.50);
  bCtx.lineTo(bW * 0.50, bH * 0.415);
  bCtx.lineTo(bW * 0.86, bH * 0.50);
  bCtx.lineTo(bW * 0.86, bH * 0.548);
  bCtx.lineTo(bW * 0.50, bH * 0.463);
  bCtx.lineTo(bW * 0.14, bH * 0.548);
  bCtx.closePath();
  bCtx.fillStyle = accentHex;
  bCtx.fill();
  bCtx.strokeStyle = 'rgba(0,0,0,0.45)';
  bCtx.lineWidth = 3;
  bCtx.stroke();

  // Micro-aletas dentro de la barra de nudillos
  bCtx.strokeStyle = 'rgba(255,255,255,0.28)';
  bCtx.lineWidth = 2;
  for (let i = -5; i <= 5; i++) {
    const cx = bW * (0.50 + i * 0.058);
    const cy = bH * (0.44 + Math.abs(i) * 0.014);
    bCtx.beginPath();
    bCtx.moveTo(cx, cy);
    bCtx.lineTo(cx, cy + bH * 0.042);
    bCtx.stroke();
  }

  if (bbCtx) {
    bbCtx.beginPath();
    bbCtx.moveTo(bW * 0.14, bH * 0.50);
    bbCtx.lineTo(bW * 0.50, bH * 0.415);
    bbCtx.lineTo(bW * 0.86, bH * 0.50);
    bbCtx.lineTo(bW * 0.86, bH * 0.548);
    bbCtx.lineTo(bW * 0.50, bH * 0.463);
    bbCtx.lineTo(bW * 0.14, bH * 0.548);
    bbCtx.closePath();
    bbCtx.fillStyle = 'rgb(252,252,252)';
    bbCtx.fill();
    bbCtx.strokeStyle = 'rgb(70,70,70)';
    bbCtx.lineWidth = 4;
    bbCtx.stroke();
  }

  // Costura perimetral ergonómica y canal de flexión lateral alrededor del escudo (zona limpia en bH*0.58..0.77)
  drawRoundedRectPath(bCtx, bW * 0.28, bH * 0.56, bW * 0.44, bH * 0.23, 28);
  bCtx.setLineDash([7, 5]);
  bCtx.strokeStyle = 'rgba(255,255,255,0.22)';
  bCtx.lineWidth = 2.2;
  bCtx.stroke();
  bCtx.setLineDash([]);

  if (bbCtx) {
    drawRoundedRectPath(bbCtx, bW * 0.28, bH * 0.56, bW * 0.44, bH * 0.23, 28);
    bbCtx.strokeStyle = 'rgb(90,90,90)';
    bbCtx.lineWidth = 3;
    bbCtx.stroke();
  }

  // Remate inferior neopreno elástico puño
  bCtx.fillStyle = accentHex;
  bCtx.globalAlpha = 0.78;
  bCtx.fillRect(0, bH * 0.895, bW, bH * 0.02);
  bCtx.globalAlpha = 1;
  bCtx.restore();
  if (bbCtx) bbCtx.restore();

  // Escudo limpio en zona central baja del dorso (sin traslape de franjas)
  if (glovesDesign?.includeCrest !== false) {
    const decalsList =
      (glovesDesign?.decals?.length ? glovesDesign.decals : garmentDesign?.decals) || [];
    const crestDecal =
      decalsList.find((d) => d.type === 'CUSTOM_IMAGE' || d.type === 'PRESET_CREST') || null;
    bCtx.save();
    bCtx.translate(bW * 0.50, bH * 0.675);
    if (crestDecal?.type === 'CUSTOM_IMAGE' && crestDecal.assetId && artworkRegistry?.[crestDecal.assetId]?.image) {
      const img = artworkRegistry[crestDecal.assetId].image;
      const box = bW * 0.22;
      const aspect = (img.width || 1) / (img.height || 1);
      const dw = aspect >= 1 ? box : box * aspect;
      const dh = aspect >= 1 ? box / aspect : box;
      bCtx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    } else {
      const presetId = crestDecal?.presetId || 'arza_official';
      drawPresetVectorCrestMm(
        bCtx,
        presetId,
        bW * 0.22,
        bH * 0.22,
        garmentDesign || { colorZones: { primary: { hex: backHex }, secondary: { hex: accentHex }, accents: { hex: palmHex } } },
        crestDecal?.tintHex || ''
      );
    }
    bCtx.restore();
  }

  // ==================== 2. PALMA LÁTEX CONTACT 4MM + PLIEGUES ERGONÓMICOS ====================
  if (palmCanvas && palmBumpCanvas) {
    const pCtx = palmCanvas.getContext('2d');
    const pbCtx = palmBumpCanvas.getContext('2d');
    const pW = palmCanvas.width;
    const pH = palmCanvas.height;

    pCtx.fillStyle = palmHex;
    pCtx.fillRect(0, 0, pW, pH);
    pbCtx.fillStyle = 'rgb(132,132,132)';
    pbCtx.fillRect(0, 0, pW, pH);

    // Sombreo suave palmar cóncavo + micro-poros Contact Latex
    const palmRad = pCtx.createRadialGradient(pW * 0.50, pH * 0.60, pW * 0.05, pW * 0.50, pH * 0.60, pW * 0.45);
    palmRad.addColorStop(0, 'rgba(0,0,0,0.06)');
    palmRad.addColorStop(0.7, 'rgba(0,0,0,0.0)');
    palmRad.addColorStop(1, 'rgba(0,0,0,0.12)');
    pCtx.fillStyle = palmRad;
    pCtx.fillRect(0, 0, pW, pH);

    drawLatexMicroPores(pCtx, pbCtx, pW, pH);

    // Canales anatómicos de flexión palmar (thumb crutch + transverse & distal palm folds)
    pCtx.save();
    pbCtx.save();
    const flexCurves = [
      [pW * 0.24, pH * 0.56, pW * 0.50, pH * 0.61, pW * 0.78, pH * 0.57],
      [pW * 0.28, pH * 0.66, pW * 0.52, pH * 0.72, pW * 0.72, pH * 0.75],
      [pW * 0.34, pH * 0.78, pW * 0.48, pH * 0.69, pW * 0.60, pH * 0.59],
    ];
    flexCurves.forEach(([x0, y0, cx, cy, x1, y1]) => {
      pCtx.beginPath();
      pCtx.moveTo(x0, y0);
      pCtx.quadraticCurveTo(cx, cy, x1, y1);
      pCtx.strokeStyle = 'rgba(0,0,0,0.13)';
      pCtx.lineWidth = 4.5;
      pCtx.lineCap = 'round';
      pCtx.stroke();

      pbCtx.beginPath();
      pbCtx.moveTo(x0, y0);
      pbCtx.quadraticCurveTo(cx, cy, x1, y1);
      pbCtx.strokeStyle = 'rgb(62,62,62)';
      pbCtx.lineWidth = 7;
      pbCtx.lineCap = 'round';
      pbCtx.stroke();
    });

    // Pliegues articulados en falanges de cada dedo
    [0.24, 0.41, 0.57, 0.72].forEach((fx) => {
      [0.24, 0.38].forEach((fy) => {
        pCtx.beginPath();
        pCtx.moveTo(pW * (fx - 0.04), pH * fy);
        pCtx.lineTo(pW * (fx + 0.04), pH * fy);
        pCtx.strokeStyle = 'rgba(0,0,0,0.14)';
        pCtx.lineWidth = 3;
        pCtx.stroke();

        pbCtx.beginPath();
        pbCtx.moveTo(pW * (fx - 0.045), pH * fy);
        pbCtx.lineTo(pW * (fx + 0.045), pH * fy);
        pbCtx.strokeStyle = 'rgb(70,70,70)';
        pbCtx.lineWidth = 4.5;
        pbCtx.stroke();
      });
    });

    // Zona Abrasion Shield (talón inferior de la palma) ubicada claramente sobre la muñequera
    drawRoundedRectPath(pCtx, pW * 0.30, pH * 0.675, pW * 0.22, pH * 0.075, 14);
    pCtx.fillStyle = 'rgba(0,0,0,0.065)';
    pCtx.fill();
    pCtx.strokeStyle = accentHex;
    pCtx.globalAlpha = 0.55;
    pCtx.lineWidth = 2.8;
    pCtx.stroke();
    pCtx.globalAlpha = 1;

    drawRoundedRectPath(pbCtx, pW * 0.30, pH * 0.675, pW * 0.22, pH * 0.075, 14);
    pbCtx.fillStyle = 'rgb(190,190,190)';
    pbCtx.fill();
    pbCtx.strokeStyle = 'rgb(75,75,75)';
    pbCtx.lineWidth = 2.8;
    pbCtx.stroke();

    // Detalle visual distintivo del corte seleccionado (Negativo / Roll / Híbrido)
    if (gloveCut === 'negative') {
      pCtx.strokeStyle = 'rgba(0,0,0,0.28)';
      pCtx.setLineDash([5, 5]);
      pCtx.lineWidth = 2.4;
      pCtx.strokeRect(pW * 0.16, pH * 0.08, pW * 0.68, pH * 0.76);
      pCtx.setLineDash([]);
    } else if (gloveCut === 'roll_finger') {
      pCtx.fillStyle = 'rgba(255,255,255,0.12)';
      [0.24, 0.41, 0.57, 0.72].forEach((fx) => {
        pCtx.fillRect(pW * (fx - 0.015), pH * 0.08, pW * 0.03, pH * 0.36);
      });
    }

    // Grabado sutil de látex 4MM centrado en talón palmar encima de la cinta
    pCtx.fillStyle = 'rgba(0,0,0,0.38)';
    pCtx.font = '800 18px Inter, system-ui, sans-serif';
    pCtx.textAlign = 'center';
    pCtx.fillText(`ARZA CONTACT 4MM · ${gloveCut.toUpperCase()}`, pW * 0.50, pH * 0.79);
    pCtx.restore();
    pbCtx.restore();
  }

  // ==================== 3. MUÑEQUERA 360° TEJIDA + LENGÜETA PULL-TAB ====================
  const sCtx = strapCanvas.getContext('2d');
  const sbCtx = strapBumpCanvas?.getContext('2d');
  const sW = strapCanvas.width;
  const sH = strapCanvas.height;
  sCtx.clearRect(0, 0, sW, sH);
  sCtx.fillStyle = strapHex;
  sCtx.fillRect(0, 0, sW, sH);

  // Micro-textura horizontal tejida en cinta elástica + pull-tab acanalado
  if (sbCtx) {
    sbCtx.fillStyle = 'rgb(128,128,128)';
    sbCtx.fillRect(0, 0, sW, sH);
    for (let y = 0; y < sH; y += 6) {
      sbCtx.fillStyle = y % 12 === 0 ? 'rgb(152,152,152)' : 'rgb(108,108,108)';
      sbCtx.fillRect(0, y, sW, 3);
    }
    // Pull-tab goma con estrías verticales en zona derecha del cierre
    drawRoundedRectPath(sbCtx, sW * 0.67, sH * 0.14, sW * 0.085, sH * 0.72, 14);
    sbCtx.fillStyle = 'rgb(235,235,235)';
    sbCtx.fill();
    for (let gx = 0; gx < 5; gx++) {
      sbCtx.fillStyle = 'rgb(80,80,80)';
      sbCtx.fillRect(sW * (0.688 + gx * 0.012), sH * 0.24, 4, sH * 0.52);
    }
  }

  sCtx.fillStyle = accentHex;
  sCtx.fillRect(0, 0, sW, sH * 0.085);
  sCtx.fillRect(0, sH * 0.915, sW, sH * 0.085);

  // Pull-tab contraste derecho + costura en caja central de cierre
  drawRoundedRectPath(sCtx, sW * 0.67, sH * 0.14, sW * 0.085, sH * 0.72, 14);
  sCtx.fillStyle = accentHex;
  sCtx.fill();
  sCtx.strokeStyle = 'rgba(0,0,0,0.45)';
  sCtx.lineWidth = 3;
  sCtx.stroke();

  sCtx.save();
  sCtx.strokeStyle = 'rgba(255,255,255,0.32)';
  sCtx.setLineDash([6, 5]);
  sCtx.lineWidth = 2.5;
  drawRoundedRectPath(sCtx, sW * 0.30, sH * 0.13, sW * 0.355, sH * 0.74, 14);
  sCtx.stroke();
  sCtx.restore();

  const keeperName = String(activePlayer?.name || '').toUpperCase().slice(0, 14);
  const keeperNum = String(activePlayer?.number || '').slice(0, 3);
  const showName = glovesDesign?.strapNameEnabled !== false;
  const showNum = glovesDesign?.strapNumberEnabled !== false;
  const strapLabel = [showNum && keeperNum ? `#${keeperNum}` : '', showName && keeperName ? keeperName : '']
    .filter(Boolean)
    .join(' ') || 'ARZA GK PRO';

  sCtx.save();
  sCtx.fillStyle = strapTextHex;
  sCtx.textAlign = 'center';
  sCtx.textBaseline = 'middle';
  sCtx.font = "900 84px 'Bebas Neue', 'Oswald', Impact, sans-serif";
  sCtx.fillText(strapLabel, sW * 0.475, sH * 0.45, sW * 0.33);
  sCtx.globalAlpha = 0.82;
  sCtx.font = '700 24px Inter, system-ui, sans-serif';
  sCtx.fillText(`ARZA PRO · ${gloveCut.toUpperCase()}`, sW * 0.475, sH * 0.75, sW * 0.32);
  sCtx.restore();
}

export function createGlovesSurfaceSet(maxAniso = 4) {
  // Mapa micro-perforado AeroMesh exclusivamente para gussets respirables
  const meshCanvas = document.createElement('canvas');
  meshCanvas.width = 256;
  meshCanvas.height = 256;
  const mCtx = meshCanvas.getContext('2d');
  mCtx.fillStyle = 'rgb(190,190,190)';
  mCtx.fillRect(0, 0, 256, 256);
  mCtx.fillStyle = 'rgb(45,45,45)';
  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 16; col++) {
      const px = col * 16 + (row % 2) * 8 + 4;
      const py = row * 16 + 4;
      mCtx.beginPath();
      mCtx.arc(px, py, 3.6, 0, Math.PI * 2);
      mCtx.fill();
    }
  }
  const aeroMeshBumpTex = new THREE.CanvasTexture(meshCanvas);
  aeroMeshBumpTex.wrapS = THREE.RepeatWrapping;
  aeroMeshBumpTex.wrapT = THREE.RepeatWrapping;
  aeroMeshBumpTex.repeat.set(6, 6);

  const makeTex = (w, h, srgb = true) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const t = new THREE.CanvasTexture(c);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    return [c, t];
  };

  const [gloveBackCanvas, gloveBackTex] = makeTex(1024, 1024, true);
  const [gloveBackBumpCanvas, gloveBackBumpTex] = makeTex(1024, 1024, false);
  const [glovePalmCanvas, glovePalmTex] = makeTex(1024, 1024, true);
  const [glovePalmBumpCanvas, glovePalmBumpTex] = makeTex(1024, 1024, false);
  const [gloveStrapCanvas, gloveStrapTex] = makeTex(1024, 320, true);
  const [gloveStrapBumpCanvas, gloveStrapBumpTex] = makeTex(1024, 320, false);

  const glovePalmMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#ffffff'),
    map: glovePalmTex,
    bumpMap: glovePalmBumpTex,
    bumpScale: 0.015,
    roughness: 0.64,
    metalness: 0.02,
    clearcoat: 0.14,
    clearcoatRoughness: 0.42,
    side: THREE.DoubleSide,
  });
  const gloveBackMat = new THREE.MeshPhysicalMaterial({
    map: gloveBackTex,
    bumpMap: gloveBackBumpTex,
    bumpScale: 0.024,
    roughness: 0.46,
    metalness: 0.06,
    sheen: 0.45,
    sheenRoughness: 0.4,
    clearcoat: 0.16,
    clearcoatRoughness: 0.35,
    side: THREE.DoubleSide,
  });
  const gloveAccentMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#fa5400'),
    bumpMap: aeroMeshBumpTex,
    bumpScale: 0.014,
    roughness: 0.65,
    metalness: 0.03,
    sheen: 0.25,
    side: THREE.DoubleSide,
  });
  const gloveStrapMat = new THREE.MeshStandardMaterial({
    map: gloveStrapTex,
    bumpMap: gloveStrapBumpTex,
    bumpScale: 0.016,
    roughness: 0.44,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const gloveMaterials = {
    palm: glovePalmMat,
    backhand: gloveBackMat,
    accents: gloveAccentMat,
    strap: gloveStrapMat,
    body: gloveBackMat,
  };

  const dispose = () => {
    aeroMeshBumpTex.dispose();
    gloveBackTex.dispose();
    gloveBackBumpTex.dispose();
    glovePalmTex.dispose();
    glovePalmBumpTex.dispose();
    gloveStrapTex.dispose();
    gloveStrapBumpTex.dispose();
    glovePalmMat.dispose();
    gloveBackMat.dispose();
    gloveAccentMat.dispose();
    gloveStrapMat.dispose();
  };

  return {
    gloveBackCanvas,
    gloveBackTex,
    gloveBackBumpCanvas,
    gloveBackBumpTex,
    glovePalmCanvas,
    glovePalmTex,
    glovePalmBumpCanvas,
    glovePalmBumpTex,
    gloveStrapCanvas,
    gloveStrapTex,
    gloveStrapBumpCanvas,
    gloveStrapBumpTex,
    gloveMaterials,
    dispose,
  };
}

export function markGlovesTexturesDirty(glovesSurface) {
  if (!glovesSurface) return;
  [
    glovesSurface.gloveBackTex,
    glovesSurface.gloveBackBumpTex,
    glovesSurface.glovePalmTex,
    glovesSurface.glovePalmBumpTex,
    glovesSurface.gloveStrapTex,
    glovesSurface.gloveStrapBumpTex,
  ].forEach((tex) => {
    if (tex) tex.needsUpdate = true;
  });
}
