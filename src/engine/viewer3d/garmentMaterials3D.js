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

export function paintGlovesCanvases(
  backCanvas,
  strapCanvas,
  glovesDesign,
  garmentDesign,
  activePlayer,
  artworkRegistry
) {
  if (!backCanvas || !strapCanvas) return;
  const gColors = glovesDesign?.colorZones || {};
  const backHex = gColors.primary?.hex || '#111111';
  const accentHex = gColors.accents?.hex || '#fa5400';
  const palmHex = gColors.palm?.hex || '#ffffff';
  const strapHex = gColors.strap?.hex || '#059669';
  const strapTextHex = gColors.strapText?.hex || '#ffffff';

  const bCtx = backCanvas.getContext('2d');
  const bW = backCanvas.width;
  const bH = backCanvas.height;
  bCtx.clearRect(0, 0, bW, bH);
  bCtx.fillStyle = backHex;
  bCtx.fillRect(0, 0, bW, bH);

  bCtx.save();
  bCtx.fillStyle = accentHex;
  bCtx.globalAlpha = 0.92;
  bCtx.beginPath();
  bCtx.moveTo(bW * 0.14, bH * 0.44);
  bCtx.lineTo(bW * 0.50, bH * 0.34);
  bCtx.lineTo(bW * 0.86, bH * 0.44);
  bCtx.lineTo(bW * 0.86, bH * 0.50);
  bCtx.lineTo(bW * 0.50, bH * 0.40);
  bCtx.lineTo(bW * 0.14, bH * 0.50);
  bCtx.closePath();
  bCtx.fill();

  bCtx.globalAlpha = 0.72;
  for (let i = 0; i < 3; i++) {
    const yBand = bH * (0.62 + i * 0.065);
    bCtx.fillRect(bW * 0.24, yBand, bW * 0.52, bH * 0.018);
  }
  bCtx.restore();

  bCtx.fillStyle = palmHex;
  bCtx.globalAlpha = 0.22;
  bCtx.fillRect(0, bH * 0.88, bW, bH * 0.025);
  bCtx.globalAlpha = 1;

  if (glovesDesign?.includeCrest !== false) {
    const decalsList =
      (glovesDesign?.decals?.length ? glovesDesign.decals : garmentDesign?.decals) || [];
    const crestDecal =
      decalsList.find((d) => d.type === 'CUSTOM_IMAGE' || d.type === 'PRESET_CREST') || null;
    bCtx.save();
    bCtx.translate(bW * 0.50, bH * 0.67);
    if (crestDecal?.type === 'CUSTOM_IMAGE' && crestDecal.assetId && artworkRegistry?.[crestDecal.assetId]?.image) {
      const img = artworkRegistry[crestDecal.assetId].image;
      const box = bW * 0.24;
      const aspect = (img.width || 1) / (img.height || 1);
      const dw = aspect >= 1 ? box : box * aspect;
      const dh = aspect >= 1 ? box / aspect : box;
      bCtx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    } else {
      const presetId = crestDecal?.presetId || 'arza_official';
      drawPresetVectorCrestMm(
        bCtx,
        presetId,
        bW * 0.24,
        bH * 0.24,
        garmentDesign || { colorZones: { primary: { hex: backHex }, secondary: { hex: accentHex }, accents: { hex: palmHex } } },
        crestDecal?.tintHex || ''
      );
    }
    bCtx.restore();
  }

  const sCtx = strapCanvas.getContext('2d');
  const sW = strapCanvas.width;
  const sH = strapCanvas.height;
  sCtx.clearRect(0, 0, sW, sH);
  sCtx.fillStyle = strapHex;
  sCtx.fillRect(0, 0, sW, sH);

  sCtx.fillStyle = accentHex;
  sCtx.fillRect(0, 0, sW, sH * 0.08);
  sCtx.fillRect(0, sH * 0.92, sW, sH * 0.08);

  const keeperName = String(activePlayer?.name || '').toUpperCase().slice(0, 14);
  const keeperNum = String(activePlayer?.number || '').slice(0, 3);
  const showName = glovesDesign?.strapNameEnabled !== false;
  const showNum = glovesDesign?.strapNumberEnabled !== false;
  const strapLabel = [showNum && keeperNum ? `#${keeperNum}` : '', showName && keeperName ? keeperName : '']
    .filter(Boolean)
    .join(' ') || 'ARZA GK';

  sCtx.save();
  sCtx.fillStyle = strapTextHex;
  sCtx.textAlign = 'center';
  sCtx.textBaseline = 'middle';
  sCtx.font = "900 94px 'Bebas Neue', 'Oswald', Impact, sans-serif";
  sCtx.fillText(strapLabel, sW * 0.5, sH * 0.46, sW * 0.78);
  sCtx.globalAlpha = 0.75;
  sCtx.font = '700 28px Inter, system-ui, sans-serif';
  sCtx.fillText(`ARZA SPORT · PRO ${(glovesDesign?.gloveCut || 'hybrid').toUpperCase()}`, sW * 0.5, sH * 0.78);
  sCtx.restore();
}

export function createGlovesSurfaceSet(maxAniso = 4) {
  const ribBumpTex = getOrLoadRealBumpTexture('/fabrics/bandstoff-rtex3.png', 28, 12);

  const gloveBackCanvas = document.createElement('canvas');
  gloveBackCanvas.width = 1024;
  gloveBackCanvas.height = 1024;
  const gloveBackTex = new THREE.CanvasTexture(gloveBackCanvas);
  gloveBackTex.colorSpace = THREE.SRGBColorSpace;
  gloveBackTex.anisotropy = maxAniso;

  const gloveStrapCanvas = document.createElement('canvas');
  gloveStrapCanvas.width = 1024;
  gloveStrapCanvas.height = 320;
  const gloveStrapTex = new THREE.CanvasTexture(gloveStrapCanvas);
  gloveStrapTex.colorSpace = THREE.SRGBColorSpace;
  gloveStrapTex.anisotropy = maxAniso;

  const glovePalmMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#ffffff'),
    bumpMap: ribBumpTex,
    bumpScale: 0.004,
    roughness: 0.72,
    metalness: 0.02,
    clearcoat: 0.08,
    clearcoatRoughness: 0.55,
    side: THREE.DoubleSide,
  });
  const gloveBackMat = new THREE.MeshPhysicalMaterial({
    map: gloveBackTex,
    roughness: 0.54,
    metalness: 0.06,
    sheen: 0.35,
    sheenRoughness: 0.45,
    side: THREE.DoubleSide,
  });
  const gloveAccentMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#fa5400'),
    bumpMap: ribBumpTex,
    bumpScale: 0.006,
    roughness: 0.68,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  const gloveStrapMat = new THREE.MeshStandardMaterial({
    map: gloveStrapTex,
    roughness: 0.48,
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
    gloveBackTex.dispose();
    gloveStrapTex.dispose();
    glovePalmMat.dispose();
    gloveBackMat.dispose();
    gloveAccentMat.dispose();
    gloveStrapMat.dispose();
  };

  return {
    gloveBackCanvas,
    gloveBackTex,
    gloveStrapCanvas,
    gloveStrapTex,
    gloveMaterials,
    dispose,
  };
}
