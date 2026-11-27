import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Undo2,
  Redo2,
  Pin,
  PinOff,
  Trash2,
  AlignCenterVertical,
  Copy,
  Minus,
  Plus,
  StepBack,
} from 'lucide-react';
import {
  loadMirlModelTemplate,
  instantiateMirlGarmentGroup,
  buildNeckLabelCanvasTexture,
} from './mirlModelLoader';
import { loadAndBindGarmentGLB } from './glbModelLoader';
import { resolveAssetUrl } from '../../utils/assetUrl';
import {
  loadFishDesignMasks,
  resolveActiveFishDesignMeta,
} from '../compositor/fishPartCompositor';
import { ENGINE_PRODUCTS } from '../core/designStore';
import {
  getPartSpec,
  evaluateDecalPlacement,
  isShortsProduct,
  snapRotationAngle,
} from '../core/boundingBoxMath';
import {
  ALL_POSSIBLE_MESH_PARTS,
  PANEL_TO_PARTNAME,
  addStudioGarmentLighting,
  applyFabricWeaveToMaterials,
  createGarmentSurfaceSet,
  createGlovesSurfaceSet,
  createSoftFloorShadowMesh,
  markGlovesTexturesDirty,
  paintGarmentSurfaceSet,
  paintGlovesCanvases,
} from './garmentMaterials3D';
import ArzaLogo from '../../components/brand/ArzaLogo';

// Lente teleobjetivo exacto de retrato Owayo v6 (`CAMERA_STANDARD_FOV = 30` en viewer-CmBNa226.js)
const CAMERA_STANDARD_FOV = 30;

const CAMERA_PRESETS = {
  front: { pos: [0, 0.08, 5.75], target: [0, 0.06, 0] },
  three_quarter: { pos: [2.4, 0.36, 5.35], target: [0, 0.06, 0] },
  back: { pos: [0, 0.08, -5.75], target: [0, 0.06, 0] },
  left_sleeve: { pos: [4.25, 0.46, 1.55], target: [0.62, 0.38, 0] },
  right_sleeve: { pos: [-4.25, 0.46, 1.55], target: [-0.62, 0.38, 0] },
  right_leg: { pos: [-4.1, 0.14, 2.9], target: [-0.42, 0.02, 0] },
  left_leg: { pos: [4.1, 0.14, 2.9], target: [0.42, 0.02, 0] },
  interior_tag: { pos: [0, 0.92, 2.35], target: [0, 0.62, -0.18] },
  macro_weave: { pos: [0.52, 0.42, 2.05], target: [0.22, 0.35, 0.25] },
  gloves_pair: { pos: [1.45, 0.22, 4.95], target: [0, -0.02, 0] },
  gloves_back: { pos: [0, 0.14, 5.15], target: [0, 0, 0] },
  gloves_palm: { pos: [0.32, 0.12, -5.05], target: [0, 0, 0] },
  gloves_strap: { pos: [0.55, -0.78, 3.25], target: [0, -0.82, 0] },
};

const VARIABLE_SLOT_LABELS = {
  playerNameBack: 'Nombre Jugador (Espalda)',
  playerNumberBack: 'Dorsal Trasero',
  playerNumberFront: 'Número Frontal',
  playerNumberSleeve: 'Número Manga',
  playerNumberShorts: 'Número Pierna Short',
};

export default function GarmentCanvas3D({
  design,
  activePlayer,
  artworkRegistry,
  cameraPreset = 'three_quarter',
  cameraPulse = 0,
  isVisible = true,
  onChangeCameraPreset,
  autoRotate = false,
  selectedDecalId = null,
  selectedSlotKey = null,
  onSelectDecalFrom3D,
  onSelectSlotFrom3D,
  onUpdateDecalFrom3D,
  onUpdateSlotFrom3D,
  onDeleteDecalFrom3D,
  onMirrorDecalFrom3D,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  canvasSnapshotRef,
  activeKitRole = 'field',
  glovesDesign = null,
}) {
  const stageWrapperRef = useRef(null);
  const mountRef = useRef(null);
  const sceneStateRef = useRef(null);
  const fishMasksRef = useRef(null);
  const activeMeshPartNamesRef = useRef(ALL_POSSIBLE_MESH_PARTS);
  const holdTurnRafRef = useRef(null);
  const lastDragPanelRef = useRef(null);
  const [localCamPulse, setLocalCamPulse] = useState(0);
  const triggerCameraPreset = (presetId) => {
    onChangeCameraPreset?.(presetId);
    setLocalCamPulse((n) => n + 1);
  };

  const latestPropsRef = useRef({
    design,
    activePlayer,
    artworkRegistry,
    selectedDecalId,
    selectedSlotKey,
    onSelectDecalFrom3D,
    onSelectSlotFrom3D,
    onUpdateDecalFrom3D,
    onUpdateSlotFrom3D,
  });

  const dragSessionRef = useRef(null);
  const [isDraggingObject, setIsDraggingObject] = useState(false);
  const [hoveringObjectLabel, setHoveringObjectLabel] = useState(null);
  const [active3DOverlay, setActive3DOverlay] = useState(null);
  const [modelStats, setModelStats] = useState({ loading: true, vertices: 0, faces: 0 });
  const [fishVersionTick, setFishVersionTick] = useState(0);

  latestPropsRef.current = {
    design,
    activePlayer,
    artworkRegistry,
    selectedDecalId,
    selectedSlotKey,
    onSelectDecalFrom3D,
    onSelectSlotFrom3D,
    onUpdateDecalFrom3D,
    onUpdateSlotFrom3D,
  };

  const isShorts = isShortsProduct(design.productModelId);

  const commitClampedDecalPosition = (decal, rawXmm, rawYmm, enableSnap = true, recordUndo = false) => {
    const curDesign = latestPropsRef.current.design;
    const candidate = {
      ...decal,
      centerMm: { x: rawXmm, y: rawYmm },
    };
    const evaluated = evaluateDecalPlacement(
      candidate,
      curDesign.productModelId,
      enableSnap,
      curDesign.bleedEnforcement || 'SOFT_WARN'
    );
    const finalCenterMm =
      curDesign.bleedEnforcement === 'HARD_CLAMP'
        ? evaluated.clampedSafeCenterMm
        : evaluated.snappedCenterMm;

    latestPropsRef.current.onUpdateDecalFrom3D?.(
      decal.id,
      {
        centerMm: {
          x: Math.round(finalCenterMm.x * 10) / 10,
          y: Math.round(finalCenterMm.y * 10) / 10,
        },
      },
      recordUndo
    );
    return evaluated;
  };

  const commitSlotPosition = (slotKey, slotObj, panel, rawXmm, rawYmm, enableSnap = true, recordUndo = false) => {
    const curDesign = latestPropsRef.current.design;
    const spec = getPartSpec(curDesign.productModelId, panel);
    const snapAxesU =
      Array.isArray(spec.snapAxesU) && spec.snapAxesU.length > 0 ? spec.snapAxesU : [spec.snapCenterU ?? 0.5];

    let snappedX = Math.max(24, Math.min(spec.widthMm - 24, rawXmm));
    let snappedY = Math.max(24, Math.min(spec.heightMm - spec.sperrbezirkMm - 12, rawYmm));
    let verticalCenter = false;
    let snapCenterX = spec.snapCenterU * spec.widthMm;

    if (enableSnap) {
      let bestDist = Infinity;
      for (const axisU of snapAxesU) {
        const axMm = axisU * spec.widthMm;
        const d = Math.abs(snappedX - axMm);
        if (d < bestDist) {
          bestDist = d;
          snapCenterX = axMm;
        }
      }
      if (bestDist <= 11) {
        snappedX = snapCenterX;
        verticalCenter = true;
      }
    }

    latestPropsRef.current.onUpdateSlotFrom3D?.(
      slotKey,
      {
        ...slotObj,
        centerMm: {
          x: Math.round(snappedX * 10) / 10,
          y: Math.round(snappedY * 10) / 10,
        },
      },
      recordUndo
    );

    return {
      snapGuides: {
        verticalCenter,
        snapCenterX,
        horizontalChest: false,
        horizontalSponsor: false,
      },
    };
  };

  // Raycast UV multi-pieza real sobre camisetas (`Front`, `Back`, `LeftArm`, `RightArm`, `Collar`) y shorts (`RightLeg`, `LeftLeg`)
  const raycastDroppableUV = (clientX, clientY, restrictToPanel = null) => {
    const st = sceneStateRef.current;
    const container = mountRef.current;
    if (!st || !container) return null;

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, st.camera);
    const hits = raycaster.intersectObjects(st.jerseyContainer.children, true);

    const validHit = hits.find((h) => {
      if (!h.object?.userData?.isDroppable || !h.uv) return false;
      const hitPanel = h.object.userData.panel;
      if (!hitPanel) return false;
      if (restrictToPanel && hitPanel !== restrictToPanel) return false;
      return true;
    });

    if (!validHit) return null;

    const panel = validHit.object.userData.panel;
    const spec = getPartSpec(latestPropsRef.current.design.productModelId, panel);
    const { x: u, y: v } = validHit.uv;
    const xMm = u * spec.widthMm;
    const yMm = (1 - v) * spec.heightMm;

    return { panel, partName: validHit.object.userData.partName, xMm, yMm, spec };
  };

  const findObjectAtMm = (curDesign, panel, xMm, yMm) => {
    // 1. Revisar primero Decals (PNG, SVG, Escudos y Textos estáticos) ordenados por zIndex descendente
    const matchingDecals = (curDesign.decals || [])
      .filter((d) => (d.panel || 'front') === panel)
      .slice()
      .sort((a, b) => (b.zIndex ?? 10) - (a.zIndex ?? 10));

    for (const d of matchingDecals) {
      // Gráficos estructurales de kits (LIGAMX_GRAPHIC, rayas, patrones de tela, chevrones)
      // o elementos bloqueados/fijados: NUNCA interceptar ni mover al rotar la prenda en 3D
      if (
        d.type === 'LIGAMX_GRAPHIC' ||
        d.isPattern ||
        d.isBackgroundGraphic ||
        d.locked === true ||
        d.pinned === true
      ) {
        continue;
      }

      const hw = (d.sizeMm.width * (d.scale ?? 1)) / 2 + 14;
      const hh = (d.sizeMm.height * (d.scale ?? 1)) / 2 + 14;
      if (Math.abs(xMm - d.centerMm.x) <= hw && Math.abs(yMm - d.centerMm.y) <= hh) {
        return { kind: 'decal', decal: d, label: d.label, pinned: Boolean(d.pinned) };
      }
    }

    // 2. Revisar Slots variables del Roster (`einzelexemplare`) activos en esta pieza
    const slots = curDesign.variableSlots || {};
    const slotCandidates = [];
    if (panel === 'back') {
      if (slots.playerNameBack?.enabled) {
        slotCandidates.push({
          key: 'playerNameBack',
          slot: slots.playerNameBack,
          hw: (slots.playerNameBack.maxWidthMm || 260) / 2,
          hh: (slots.playerNameBack.capHeightMm || 52) * 0.68,
        });
      }
      if (slots.playerNumberBack?.enabled) {
        const h = slots.playerNumberBack.heightMm || 220;
        slotCandidates.push({
          key: 'playerNumberBack',
          slot: slots.playerNumberBack,
          hw: h * 0.45,
          hh: h * 0.48,
        });
      }
    } else if (panel === 'front' && slots.playerNumberFront?.enabled) {
      const h = slots.playerNumberFront.heightMm || 50;
      slotCandidates.push({
        key: 'playerNumberFront',
        slot: slots.playerNumberFront,
        hw: h * 0.65,
        hh: h * 0.58,
      });
    } else if (slots.playerNumberSleeve?.enabled && slots.playerNumberSleeve.panel === panel) {
      const h = slots.playerNumberSleeve.heightMm || 44;
      slotCandidates.push({
        key: 'playerNumberSleeve',
        slot: slots.playerNumberSleeve,
        hw: h * 0.65,
        hh: h * 0.58,
      });
    } else if (slots.playerNumberShorts?.enabled && slots.playerNumberShorts.panel === panel) {
      const h = slots.playerNumberShorts.heightMm || 68;
      slotCandidates.push({
        key: 'playerNumberShorts',
        slot: slots.playerNumberShorts,
        hw: h * 0.65,
        hh: h * 0.58,
      });
    }

    for (const c of slotCandidates) {
      if (
        Math.abs(xMm - c.slot.centerMm.x) <= c.hw + 12 &&
        Math.abs(yMm - c.slot.centerMm.y) <= c.hh + 12
      ) {
        return {
          kind: 'slot',
          slotKey: c.key,
          slot: c.slot,
          label: VARIABLE_SLOT_LABELS[c.key] || c.key,
          pinned: Boolean(c.slot.pinned),
        };
      }
    }

    return null;
  };

  // Controles flotantes `#toolbox` de Owayo (Zoom +/- y Rotación continua al mantener pulsado)
  const handleToolboxZoom = (factor) => {
    const st = sceneStateRef.current;
    if (!st) return;
    st.setTransition(false);
    const offset = st.camera.position.clone().sub(st.controls.target);
    const nextLen = Math.max(st.controls.minDistance, Math.min(st.controls.maxDistance, offset.length() * factor));
    offset.setLength(nextLen);
    st.camera.position.copy(st.controls.target).add(offset);
    st.controls.update();
  };

  const startHoldOrbitTurn = (dirSign) => {
    stopHoldOrbitTurn();
    const stepTurn = () => {
      const st = sceneStateRef.current;
      if (!st) return;
      st.setTransition(false);
      const offset = st.camera.position.clone().sub(st.controls.target);
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), dirSign * 0.042);
      st.camera.position.copy(st.controls.target).add(offset);
      st.controls.update();
      holdTurnRafRef.current = requestAnimationFrame(stepTurn);
    };
    holdTurnRafRef.current = requestAnimationFrame(stepTurn);
  };

  const stopHoldOrbitTurn = () => {
    if (holdTurnRafRef.current !== null) {
      cancelAnimationFrame(holdTurnRafRef.current);
      holdTurnRafRef.current = null;
    }
  };

  // 1. Inicializar motor WebGL Three.js con FOV=30° (Owayo Standard) y materiales por pieza
  useEffect(() => {
    const container = mountRef.current;
    const stageEl = stageWrapperRef.current;
    if (!container || !stageEl) return;

    const scene = new THREE.Scene();

    const computeFovForAspect = (aspect) => {
      if (aspect < 0.8) {
        return Math.min(48, CAMERA_STANDARD_FOV / (aspect * 0.94));
      } else if (aspect < 1.0) {
        return Math.min(38, CAMERA_STANDARD_FOV / (aspect * 0.98));
      }
      return CAMERA_STANDARD_FOV;
    };

    const initW = Math.max(1, container.clientWidth);
    const initH = Math.max(1, container.clientHeight);
    const initAspect = initW / initH;

    const camera = new THREE.PerspectiveCamera(
      computeFovForAspect(initAspect),
      initAspect,
      0.1,
      60
    );
    camera.position.set(...CAMERA_PRESETS.three_quarter.pos);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    if (canvasSnapshotRef) {
      canvasSnapshotRef.current = renderer.domElement;
    }

    addStudioGarmentLighting(scene);
    const { floorShadow, shadowTex } = createSoftFloorShadowMesh(2.7, 1.8, -1.44);
    scene.add(floorShadow);

    const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const garmentSurface = createGarmentSurfaceSet(maxAniso, activePlayer?.size || 'L');
    const glovesSurface = createGlovesSurfaceSet(maxAniso);
    const { partCanvases, partTextures, partMaterials, neckLabelMat, hemFlagMat } = garmentSurface;
    const { gloveMaterials } = glovesSurface;

    const jerseyContainer = new THREE.Group();
    scene.add(jerseyContainer);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.085;
    controls.enablePan = false;
    controls.minDistance = 1.65;
    controls.maxDistance = 8.4;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.minPolarAngle = Math.PI * 0.12;

    const targetCamPos = new THREE.Vector3(...CAMERA_PRESETS.three_quarter.pos);
    const targetLookAt = new THREE.Vector3(...CAMERA_PRESETS.three_quarter.target);
    let isTransitioningCam = false;

    const syncSizeAndRender = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const aspect = rect.width / rect.height;
        camera.aspect = aspect;
        camera.fov = computeFovForAspect(aspect);
        camera.updateProjectionMatrix();
        renderer.setSize(rect.width, rect.height);
      }
      controls.update();
      renderer.render(scene, camera);
    };

    sceneStateRef.current = {
      scene,
      camera,
      renderer,
      controls,
      floorShadow,
      partCanvases,
      partTextures,
      partMaterials,
      neckLabelMat,
      hemFlagMat,
      glovesSurface,
      gloveMaterials,
      jerseyContainer,
      targetCamPos,
      targetLookAt,
      setTransition: (v) => {
        isTransitioningCam = v;
      },
      syncSizeAndRender,
      renderNow: () => {
        controls.update();
        renderer.render(scene, camera);
      },
    };
    if (typeof window !== 'undefined') {
      window.__OWAYO_SCENE_STATE__ = sceneStateRef.current;
    }

    const onControlStart = () => {
      isTransitioningCam = false;
    };
    controls.addEventListener('start', onControlStart);

    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect || rect.width === 0 || rect.height === 0) return;
      const aspect = rect.width / rect.height;
      camera.aspect = aspect;
      camera.fov = computeFovForAspect(aspect);
      camera.updateProjectionMatrix();
      renderer.setSize(rect.width, rect.height);
    });
    ro.observe(container);

    let rafId = null;
    let isLoopRunning = false;

    const animate = () => {
      if (!isLoopRunning) return;
      rafId = requestAnimationFrame(animate);
      if (isTransitioningCam) {
        controls.target.lerp(targetLookAt, 0.14);
        const curOffset = camera.position.clone().sub(controls.target);
        const tgtOffset = targetCamPos.clone().sub(targetLookAt);
        const curSph = new THREE.Spherical().setFromVector3(curOffset);
        const tgtSph = new THREE.Spherical().setFromVector3(tgtOffset);
        let dTheta = tgtSph.theta - curSph.theta;
        while (dTheta > Math.PI) dTheta -= Math.PI * 2;
        while (dTheta < -Math.PI) dTheta += Math.PI * 2;
        curSph.theta += dTheta * 0.14;
        curSph.phi += (tgtSph.phi - curSph.phi) * 0.14;
        curSph.radius += (tgtSph.radius - curSph.radius) * 0.14;
        camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(curSph));
        if (
          Math.abs(dTheta) < 0.012 &&
          Math.abs(tgtSph.phi - curSph.phi) < 0.012 &&
          Math.abs(tgtSph.radius - curSph.radius) < 0.018
        ) {
          camera.position.copy(targetCamPos);
          controls.target.copy(targetLookAt);
          isTransitioningCam = false;
        }
      }
      controls.update();
      renderer.render(scene, camera);
    };

    const startRenderLoop = () => {
      if (!isLoopRunning) {
        isLoopRunning = true;
        rafId = requestAnimationFrame(animate);
      }
    };

    const stopRenderLoop = () => {
      isLoopRunning = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    startRenderLoop();

    const handleContentVisibilityChange = (event) => {
      if (event.skipped) stopRenderLoop();
      else startRenderLoop();
    };
    stageEl.addEventListener('contentvisibilityautostatechange', handleContentVisibilityChange);

    let ioFallback = null;
    const isContentVisibilitySupported = 'contentVisibility' in document.documentElement.style;
    if (!isContentVisibilitySupported && typeof IntersectionObserver !== 'undefined') {
      ioFallback = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) startRenderLoop();
            else stopRenderLoop();
          });
        },
        { rootMargin: '200px' }
      );
      ioFallback.observe(stageEl);
    }

    return () => {
      stopHoldOrbitTurn();
      stopRenderLoop();
      stageEl.removeEventListener('contentvisibilityautostatechange', handleContentVisibilityChange);
      if (ioFallback) ioFallback.disconnect();
      ro.disconnect();
      controls.removeEventListener('start', onControlStart);
      controls.dispose();
      garmentSurface.dispose();
      glovesSurface.dispose();
      floorShadow.geometry.dispose();
      floorShadow.material.dispose();
      shadowTex.dispose();
      renderer.dispose();
    };
  }, []);

  // 2. Cargar geometría binaria exacta `.mirl` o Guantes `.glb` cuando cambia la prenda / rol activo
  useEffect(() => {
    let cancelled = false;
    const st = sceneStateRef.current;
    if (!st) return;

    // Limpiar malla previa inmediatamente para nunca mostrar otra prenda mientras carga la nueva
    while (st.jerseyContainer.children.length > 0) {
      st.jerseyContainer.remove(st.jerseyContainer.children[0]);
    }
    st.renderNow?.();
    setModelStats((prev) => ({ ...prev, loading: true }));

    if (activeKitRole === 'gloves') {
      const glbUrl = resolveAssetUrl(glovesDesign?.modelUrl || 'models/goalkeeper_gloves_gk1.glb');
      loadAndBindGarmentGLB(glbUrl, st.gloveMaterials)
        .then(({ modelGroup, meshManifest }) => {
          if (cancelled || !sceneStateRef.current) return;
          const curSt = sceneStateRef.current;
          while (curSt.jerseyContainer.children.length > 0) {
            curSt.jerseyContainer.remove(curSt.jerseyContainer.children[0]);
          }
          curSt.jerseyContainer.add(modelGroup);
          if (curSt.floorShadow) {
            curSt.floorShadow.position.y = -1.32;
          }
          paintGlovesCanvases(
            curSt.glovesSurface,
            glovesDesign,
            design,
            activePlayer,
            artworkRegistry
          );
          markGlovesTexturesDirty(curSt.glovesSurface);

          const totalVerts = meshManifest.reduce((acc, m) => acc + (m.vertexCount || 0), 0);
          setModelStats({
            loading: false,
            vertices: totalVerts,
            faces: Math.round(totalVerts / 3),
          });
          curSt.renderNow?.();
        })
        .catch((err) => {
          console.error('Error cargando modelo GLB de guantes:', err);
          if (!cancelled) setModelStats({ loading: false, vertices: 0, faces: 0 });
        });

      return () => {
        cancelled = true;
      };
    }

    const prod = ENGINE_PRODUCTS.find((p) => p.id === design.productModelId) || ENGINE_PRODUCTS[0];
    const mirlUrl = prod.mirlUrl || '/models/football_f3_ka.mirl';
    const effectiveSleeveLength =
      activeKitRole === 'goalkeeper' || design?.sleeveLength === 'long' ? 'long' : 'short';

    loadMirlModelTemplate(mirlUrl)
      .then((template) => {
        if (cancelled || !sceneStateRef.current) return;
        const curSt = sceneStateRef.current;
        while (curSt.jerseyContainer.children.length > 0) {
          curSt.jerseyContainer.remove(curSt.jerseyContainer.children[0]);
        }
        const group = instantiateMirlGarmentGroup(
          template,
          curSt.partMaterials,
          curSt.neckLabelMat,
          curSt.hemFlagMat,
          { sleeveLength: effectiveSleeveLength }
        );
        curSt.jerseyContainer.add(group);

        // Registrar únicamente las piezas presentes en este modelo `.mirl` para optimizar el compositor GPU
        const presentNames = template.parts
          .map((p) => p.name)
          .filter((n) => ALL_POSSIBLE_MESH_PARTS.includes(n));
        activeMeshPartNamesRef.current = presentNames.length > 0 ? presentNames : ALL_POSSIBLE_MESH_PARTS;

        // Ajustar altura de la sombra de contacto según la altura escalada de la prenda
        if (curSt.floorShadow) {
          curSt.floorShadow.position.y = -(template.dimensions.y / 2) - 0.14;
        }

        setModelStats({
          loading: false,
          vertices: template.totalVertices,
          faces: template.totalFaces,
        });
        setFishVersionTick((n) => n + 1);
        curSt.renderNow?.();
      })
      .catch((err) => {
        console.error('Error cargando malla .mirl:', err);
        if (!cancelled) setModelStats({ loading: false, vertices: 0, faces: 0 });
      });

    return () => {
      cancelled = true;
    };
  }, [design.productModelId, design.sleeveLength, activeKitRole, glovesDesign?.modelUrl]);

  // 2b. Sincronizar materiales y texturas de Guantes 3D en vivo a 60 FPS
  useEffect(() => {
    const st = sceneStateRef.current;
    if (!st || activeKitRole !== 'gloves') return;
    const gColors = glovesDesign?.colorZones || {};
    st.gloveMaterials.palm.color.set('#ffffff');
    st.gloveMaterials.accents.color.set(gColors.accents?.hex || '#fa5400');
    st.gloveMaterials.palm.roughness = glovesDesign?.gloveCut === 'negative' ? 0.72 : 0.62;
    paintGlovesCanvases(
      st.glovesSurface,
      glovesDesign,
      design,
      activePlayer,
      artworkRegistry
    );
    markGlovesTexturesDirty(st.glovesSurface);
    st.renderNow?.();
  }, [activeKitRole, glovesDesign, design, activePlayer, artworkRegistry]);

  // 3. Cargar archivo de máscaras `.fish` (o limpiar máscaras para diseño liso `Pure`)
  useEffect(() => {
    let cancelled = false;
    fishMasksRef.current = null;
    const activeFish = resolveActiveFishDesignMeta(design);
    if (!activeFish?.fileUrl) {
      setFishVersionTick((n) => n + 1);
      return;
    }

    loadFishDesignMasks(activeFish.fileUrl)
      .then((masksMap) => {
        if (cancelled) return;
        fishMasksRef.current = masksMap;
        setFishVersionTick((n) => n + 1);
      })
      .catch((err) => {
        console.error('Error decodificando diseño .fish:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [design.productModelId, design.patternId]);

  // 4. Actualizar micro-relieve textil real (`ts-tex.png` / `k-tex2.png` / `sr-tex.png` / `bandstoff-rtex3.png`)
  useEffect(() => {
    const st = sceneStateRef.current;
    if (!st) return;
    applyFabricWeaveToMaterials(st.partMaterials, design.fabricWeaveId);
  }, [design.fabricWeaveId]);

  // 5. Actualizar etiqueta interior de talla (`Etikett`) cuando cambia el jugador activo
  useEffect(() => {
    const st = sceneStateRef.current;
    if (!st?.neckLabelMat) return;
    const prevMap = st.neckLabelMat.map;
    const nextTex = buildNeckLabelCanvasTexture(activePlayer?.size || 'L');
    st.neckLabelMat.map = nextTex;
    st.neckLabelMat.needsUpdate = true;
    if (prevMap) prevMap.dispose();
  }, [activePlayer?.size]);

  // 6. Re-componer texturas por pieza a 60 FPS (durante arrastre solo repinta la pieza activa en < 1 ms)
  useEffect(() => {
    const st = sceneStateRef.current;
    if (!st || activeKitRole === 'gloves') return;

    const masksMap = fishMasksRef.current;
    let partsToUpdate = activeMeshPartNamesRef.current;

    if (active3DOverlay?.panel) {
      const singlePart = PANEL_TO_PARTNAME[active3DOverlay.panel];
      if (singlePart && partsToUpdate.includes(singlePart)) {
        partsToUpdate = [singlePart];
        lastDragPanelRef.current = singlePart;
      }
    } else if (lastDragPanelRef.current) {
      lastDragPanelRef.current = null;
    }

    paintGarmentSurfaceSet(
      st,
      partsToUpdate,
      design,
      activePlayer,
      artworkRegistry,
      masksMap,
      active3DOverlay
        ? {
            showGuides: true,
            showSelectionBox: true,
            panel: active3DOverlay.panel,
            selectedDecalId: active3DOverlay.selectedDecalId,
            selectedSlotKey: active3DOverlay.selectedSlotKey,
            snapGuides: active3DOverlay.snapGuides,
          }
        : selectedDecalId || selectedSlotKey
        ? {
            showGuides: false,
            showSelectionBox: true,
            panel: null,
            selectedDecalId,
            selectedSlotKey,
            snapGuides: null,
          }
        : null
    );
  }, [
    design,
    activePlayer,
    artworkRegistry,
    active3DOverlay,
    selectedDecalId,
    selectedSlotKey,
    fishVersionTick,
  ]);

  // 7. Presets de cámara y auto-rotación
  useEffect(() => {
    const st = sceneStateRef.current;
    if (!st) return;
    st.controls.autoRotate = Boolean(autoRotate) && !isDraggingObject;
    st.controls.autoRotateSpeed = 1.5;
  }, [autoRotate, isDraggingObject]);

  const effectiveCameraPreset =
    activeKitRole === 'gloves'
      ? cameraPreset?.startsWith('gloves_')
        ? cameraPreset
        : 'gloves_pair'
      : cameraPreset?.startsWith('gloves_')
      ? 'three_quarter'
      : cameraPreset;

  useEffect(() => {
    const st = sceneStateRef.current;
    if (!st) return;
    const preset = CAMERA_PRESETS[effectiveCameraPreset] || CAMERA_PRESETS.three_quarter;
    st.targetCamPos.set(...preset.pos);
    st.targetLookAt.set(...preset.target);
    st.setTransition(true);
  }, [effectiveCameraPreset, cameraPulse, localCamPulse]);

  useEffect(() => {
    if (!isVisible) return;
    const st = sceneStateRef.current;
    if (!st) return;
    st.syncSizeAndRender?.();
    const raf = requestAnimationFrame(() => st.syncSizeAndRender?.());
    return () => cancelAnimationFrame(raf);
  }, [isVisible]);

  // Re-componer de inmediato en 3D cuando un escudo o sponsor oficial en alta resolución termina de cargarse
  useEffect(() => {
    const handleAssetLoaded = () => {
      setFishVersionTick((n) => n + 1);
    };

    window.addEventListener('atletiq:crest-loaded', handleAssetLoaded);
    window.addEventListener('atletiq:sponsor-loaded', handleAssetLoaded);

    return () => {
      window.removeEventListener('atletiq:crest-loaded', handleAssetLoaded);
      window.removeEventListener('atletiq:sponsor-loaded', handleAssetLoaded);
    };
  }, []);

  // 8. Selección y Arrastre Directo Raycast UV a 60 FPS (Decals + Slots Variables + Respeto a `Fijar objeto`)
  const handlePointerDown = (e) => {
    if (e.button !== 0 || !sceneStateRef.current || activeKitRole === 'gloves') return;

    const hit = raycastDroppableUV(e.clientX, e.clientY);
    if (!hit) return;

    const found = findObjectAtMm(design, hit.panel, hit.xMm, hit.yMm);
    if (!found) return;

    if (found.kind === 'decal') {
      if (found.pinned || found.decal?.locked || found.decal?.type === 'LIGAMX_GRAPHIC' || !onUpdateDecalFrom3D) {
        return;
      }
      onSelectDecalFrom3D?.(found.decal.id, hit.panel);

      sceneStateRef.current.controls.enabled = false;
      dragSessionRef.current = {
        pointerId: e.pointerId,
        kind: 'decal',
        decalId: found.decal.id,
        panel: hit.panel,
        startClientX: e.clientX,
        startClientY: e.clientY,
        hasMovedThreshold: false,
        lastXmm: found.decal.centerMm.x,
        lastYmm: found.decal.centerMm.y,
        grabOffsetMm: {
          x: hit.xMm - found.decal.centerMm.x,
          y: hit.yMm - found.decal.centerMm.y,
        },
      };

      e.currentTarget.setPointerCapture(e.pointerId);
      setActive3DOverlay({
        panel: hit.panel,
        selectedDecalId: found.decal.id,
        selectedSlotKey: null,
        snapGuides: null,
      });
    } else if (found.kind === 'slot') {
      onSelectSlotFrom3D?.(found.slotKey, hit.panel);
      if (found.pinned || !onUpdateSlotFrom3D) return;

      sceneStateRef.current.controls.enabled = false;
      dragSessionRef.current = {
        pointerId: e.pointerId,
        kind: 'slot',
        slotKey: found.slotKey,
        panel: hit.panel,
        startClientX: e.clientX,
        startClientY: e.clientY,
        hasMovedThreshold: false,
        lastXmm: found.slot.centerMm.x,
        lastYmm: found.slot.centerMm.y,
        grabOffsetMm: {
          x: hit.xMm - found.slot.centerMm.x,
          y: hit.yMm - found.slot.centerMm.y,
        },
      };

      e.currentTarget.setPointerCapture(e.pointerId);
      setActive3DOverlay({
        panel: hit.panel,
        selectedDecalId: null,
        selectedSlotKey: found.slotKey,
        snapGuides: null,
      });
    }
  };

  const handlePointerMove = (e) => {
    const session = dragSessionRef.current;
    if (session && e.currentTarget.hasPointerCapture(e.pointerId)) {
      const distPx = Math.hypot(e.clientX - session.startClientX, e.clientY - session.startClientY);
      if (!session.hasMovedThreshold && distPx < 4) return;
      if (!session.hasMovedThreshold) {
        session.hasMovedThreshold = true;
        setIsDraggingObject(true);
      }

      const hit = raycastDroppableUV(e.clientX, e.clientY, session.panel);
      if (!hit) return;

      const rawX = hit.xMm - session.grabOffsetMm.x;
      const rawY = hit.yMm - session.grabOffsetMm.y;
      session.lastXmm = rawX;
      session.lastYmm = rawY;

      if (session.kind === 'decal') {
        const curDecal = (latestPropsRef.current.design.decals || []).find((d) => d.id === session.decalId);
        if (!curDecal) return;
        const evaluated = commitClampedDecalPosition(curDecal, rawX, rawY, true, false);
        setActive3DOverlay({
          panel: session.panel,
          selectedDecalId: session.decalId,
          selectedSlotKey: null,
          snapGuides: evaluated.snapGuides,
        });
      } else if (session.kind === 'slot') {
        const curSlot = latestPropsRef.current.design.variableSlots?.[session.slotKey];
        if (!curSlot) return;
        const evaluated = commitSlotPosition(session.slotKey, curSlot, session.panel, rawX, rawY, true, false);
        setActive3DOverlay({
          panel: session.panel,
          selectedDecalId: null,
          selectedSlotKey: session.slotKey,
          snapGuides: evaluated.snapGuides,
        });
      }
      return;
    }

    const hit = raycastDroppableUV(e.clientX, e.clientY);
    if (!hit) {
      if (hoveringObjectLabel) setHoveringObjectLabel(null);
      return;
    }
    const hovered = findObjectAtMm(design, hit.panel, hit.xMm, hit.yMm);
    const nextLabel = hovered
      ? `${hovered.pinned ? '📌 ' : ''}${hovered.label} (${hit.spec.shortLabel})`
      : null;
    if (nextLabel !== hoveringObjectLabel) {
      setHoveringObjectLabel(nextLabel);
    }
  };

  const endPointerDragSession = () => {
    const session = dragSessionRef.current;
    if (session?.hasMovedThreshold) {
      if (session.kind === 'decal') {
        const curDecal = (latestPropsRef.current.design.decals || []).find((d) => d.id === session.decalId);
        if (curDecal) {
          commitClampedDecalPosition(curDecal, session.lastXmm, session.lastYmm, true, true);
        }
      } else if (session.kind === 'slot') {
        const curSlot = latestPropsRef.current.design.variableSlots?.[session.slotKey];
        if (curSlot) {
          commitSlotPosition(session.slotKey, curSlot, session.panel, session.lastXmm, session.lastYmm, true, true);
        }
      }
    }

    if (sceneStateRef.current) {
      sceneStateRef.current.controls.enabled = true;
    }
    dragSessionRef.current = null;
    setIsDraggingObject(false);
    setActive3DOverlay(null);
  };

  const handleKeyDown = (e) => {
    const stepMap = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const dir = stepMap[e.key];
    if (!dir) return;

    const stepMm = e.shiftKey ? 1 : 5;
    if (selectedSlotKey && design.variableSlots?.[selectedSlotKey]) {
      const slot = design.variableSlots[selectedSlotKey];
      if (slot.pinned) return;
      e.preventDefault();
      const slotPanel =
        selectedSlotKey === 'playerNameBack' || selectedSlotKey === 'playerNumberBack'
          ? 'back'
          : selectedSlotKey === 'playerNumberFront'
          ? 'front'
          : slot.panel || 'front';
      commitSlotPosition(
        selectedSlotKey,
        slot,
        slotPanel,
        slot.centerMm.x + dir[0] * stepMm,
        slot.centerMm.y + dir[1] * stepMm,
        false,
        true
      );
      return;
    }

    const activeDecal = (design.decals || []).find((d) => d.id === selectedDecalId);
    if (!activeDecal || activeDecal.pinned || !onUpdateDecalFrom3D) return;

    e.preventDefault();
    commitClampedDecalPosition(
      activeDecal,
      activeDecal.centerMm.x + dir[0] * stepMm,
      activeDecal.centerMm.y + dir[1] * stepMm,
      false,
      true
    );
  };

  const activeSelectedDecal = selectedDecalId
    ? (design.decals || []).find((d) => d.id === selectedDecalId) || null
    : null;

  const isTank = !isShorts && (design.productModelId.includes('basketball') || design.productModelId.includes('tank'));
  const quickCameraButtons =
    activeKitRole === 'gloves'
      ? [
          { id: 'gloves_pair', label: '3/4 Par' },
          { id: 'gloves_back', label: 'Dorso' },
          { id: 'gloves_palm', label: 'Palma Látex' },
          { id: 'gloves_strap', label: 'Muñequera' },
        ]
      : isShorts
      ? [
          { id: 'three_quarter', label: '3/4' },
          { id: 'front', label: 'Frente' },
          { id: 'back', label: 'Atrás' },
          { id: 'right_leg', label: 'Pierna Der.' },
          { id: 'left_leg', label: 'Pierna Izq.' },
          { id: 'interior_tag', label: 'Interior' },
        ]
      : isTank
      ? [
          { id: 'three_quarter', label: '3/4' },
          { id: 'front', label: 'Frente' },
          { id: 'back', label: 'Espalda' },
          { id: 'right_sleeve', label: 'Costado Der.' },
          { id: 'left_sleeve', label: 'Costado Izq.' },
          { id: 'interior_tag', label: 'Interior' },
        ]
      : [
          { id: 'three_quarter', label: '3/4' },
          { id: 'front', label: 'Frente' },
          { id: 'back', label: 'Espalda' },
          { id: 'right_sleeve', label: 'Manga Der.' },
          { id: 'left_sleeve', label: 'Manga Izq.' },
          { id: 'interior_tag', label: 'Interior' },
        ];

  return (
    <div ref={stageWrapperRef} className="garment-3d-stage relative w-full h-full min-h-[280px] sm:min-h-[400px]">
      <div
        ref={mountRef}
        tabIndex={0}
        aria-label="Visor 3D interactivo multi-pieza Owayo FOV 30°. Arrastra para rotar la cámara o arrastra cualquier logo, texto o dorsal directamente sobre la prenda."
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointerDragSession}
        onLostPointerCapture={endPointerDragSession}
        onKeyDown={handleKeyDown}
        className={`garment-3d-drag-surface w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${
          isDraggingObject
            ? 'cursor-grabbing'
            : hoveringObjectLabel
            ? 'cursor-grab'
            : 'cursor-move'
        }`}
      />

      {/* Insignia superior izquierda: Solo en pantallas medianas y grandes */}
      <div className="hidden sm:flex absolute top-4 left-4 items-center gap-2.5 z-10 select-none">
        <ArzaLogo theme="light" className="h-8 w-auto" />
        <span className="text-[11px] font-semibold text-neutral-600 tracking-wide border-l border-neutral-300 pl-2">
          {activeKitRole === 'gloves'
            ? 'Guantes GK Pro 3D'
            : activeKitRole === 'goalkeeper' || design?.sleeveLength === 'long'
            ? 'Portero · Manga Larga'
            : 'Studio 3D'}
        </span>
      </div>

      {/* Selector rápido de vistas 3D: Envuelve limpio sin recortar puntas en móvil ni escritorio */}
      <div className="absolute top-2.5 sm:top-4 left-2 right-2 sm:left-auto sm:right-4 xl:left-1/2 xl:right-auto xl:-translate-x-1/2 flex flex-wrap items-center justify-center sm:justify-end xl:justify-center gap-1 sm:gap-1.5 z-10 py-0.5 max-w-full">
        {quickCameraButtons.map((btn) => (
          <button
            key={btn.id}
            type="button"
            onClick={() => triggerCameraPreset(btn.id)}
            className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all border cursor-pointer shrink-0 ${
              effectiveCameraPreset === btn.id
                ? 'arza-btn-glass-green'
                : 'arza-glass-card text-slate-800 hover:border-emerald-500/50 hover:text-emerald-950'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Barra flotante lateral `#toolbox`: Cápsula glassmorphism en escritorio */}
      <div
        aria-label="Herramientas de visor 3D"
        className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 flex-col gap-2.5 p-2 rounded-2xl arza-glass-card z-10"
      >
        <button
          type="button"
          onClick={() => handleToolboxZoom(0.84)}
          title="Acercar (Zoom +)"
          aria-label="Acercar cámara"
          className="p-1.5 rounded-xl text-slate-800 hover:text-emerald-700 hover:bg-emerald-500/15 hover:scale-105 transition-all cursor-pointer"
        >
          <ZoomIn className="w-5 h-5 stroke-[2]" />
        </button>
        <button
          type="button"
          onClick={() => handleToolboxZoom(1.18)}
          title="Alejar (Zoom -)"
          aria-label="Alejar cámara"
          className="p-1.5 rounded-xl text-slate-800 hover:text-emerald-700 hover:bg-emerald-500/15 hover:scale-105 transition-all cursor-pointer"
        >
          <ZoomOut className="w-5 h-5 stroke-[2]" />
        </button>
        <button
          type="button"
          onPointerDown={() => startHoldOrbitTurn(1)}
          onPointerUp={stopHoldOrbitTurn}
          onPointerLeave={stopHoldOrbitTurn}
          onPointerCancel={stopHoldOrbitTurn}
          title="Girar prenda (mantener pulsado)"
          aria-label="Girar prenda"
          className="p-1.5 rounded-xl text-slate-800 hover:text-emerald-700 hover:bg-emerald-500/15 hover:scale-105 transition-all cursor-pointer"
        >
          <RotateCw className="w-5 h-5 stroke-[2]" />
        </button>
        <button
          type="button"
          onClick={() => triggerCameraPreset('front')}
          title="Restablecer vista frontal"
          aria-label="Restablecer vista frontal"
          className="p-1.5 rounded-xl text-slate-800 hover:text-emerald-700 hover:bg-emerald-500/15 hover:scale-105 transition-all cursor-pointer"
        >
          <RotateCcw className="w-5 h-5 stroke-[2]" />
        </button>
        <button
          type="button"
          onClick={() => triggerCameraPreset(cameraPreset === 'back' ? 'front' : 'back')}
          title="Girar a vista trasera / frontal"
          aria-label="Girar a vista trasera"
          className="p-1.5 rounded-xl text-slate-800 hover:text-emerald-700 hover:bg-emerald-500/15 hover:scale-105 transition-all cursor-pointer"
        >
          <StepBack className="w-5 h-5 stroke-[2]" />
        </button>
      </div>

      {/* Gizmo flotante contextual Owayo para escalar, rotar, centrar, espejar, fijar o borrar sin salir del visor */}
      {activeSelectedDecal && !isDraggingObject && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-slate-950/92 border border-slate-700/90 shadow-2xl backdrop-blur-md max-w-[94%] overflow-x-auto">
          <span className="text-[11px] font-bold text-amber-300 px-1.5 truncate max-w-[120px]">
            {activeSelectedDecal.label}
          </span>
          <div className="h-4 w-px bg-slate-800 mx-0.5" />
          <button
            type="button"
            disabled={activeSelectedDecal.pinned}
            onClick={() =>
              onUpdateDecalFrom3D?.(
                activeSelectedDecal.id,
                { scale: Math.max(0.2, +((activeSelectedDecal.scale ?? 1) - 0.1).toFixed(2)) },
                true
              )
            }
            title="Reducir tamaño (-10%)"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 disabled:opacity-35"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-slate-300 px-1">
            {Math.round((activeSelectedDecal.scale ?? 1) * 100)}%
          </span>
          <button
            type="button"
            disabled={activeSelectedDecal.pinned}
            onClick={() =>
              onUpdateDecalFrom3D?.(
                activeSelectedDecal.id,
                { scale: Math.min(3.5, +((activeSelectedDecal.scale ?? 1) + 0.1).toFixed(2)) },
                true
              )
            }
            title="Aumentar tamaño (+10%)"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 disabled:opacity-35"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-0.5" />
          <button
            type="button"
            disabled={activeSelectedDecal.pinned}
            onClick={() => {
              const nextRot = snapRotationAngle((activeSelectedDecal.rotationDeg || 0) - 15);
              onUpdateDecalFrom3D?.(activeSelectedDecal.id, { rotationDeg: nextRot }, true);
            }}
            title="Rotar -15°"
            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-slate-200 disabled:opacity-35"
          >
            -15°
          </button>
          <button
            type="button"
            disabled={activeSelectedDecal.pinned}
            onClick={() => {
              const nextRot = snapRotationAngle((activeSelectedDecal.rotationDeg || 0) + 15);
              onUpdateDecalFrom3D?.(activeSelectedDecal.id, { rotationDeg: nextRot }, true);
            }}
            title="Rotar +15°"
            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-slate-200 disabled:opacity-35"
          >
            +15°
          </button>

          <button
            type="button"
            disabled={activeSelectedDecal.pinned}
            onClick={() => {
              const spec = getPartSpec(design.productModelId, activeSelectedDecal.panel || 'front');
              onUpdateDecalFrom3D?.(
                activeSelectedDecal.id,
                { centerMm: { ...activeSelectedDecal.centerMm, x: +(spec.widthMm * spec.snapCenterU).toFixed(1) } },
                true
              );
            }}
            title="Centrar en eje de la pieza"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 disabled:opacity-35"
          >
            <AlignCenterVertical className="w-3.5 h-3.5" />
          </button>

          {onMirrorDecalFrom3D && (
            <button
              type="button"
              onClick={() => onMirrorDecalFrom3D(activeSelectedDecal)}
              title="Duplicar / Espejar a pieza simétrica"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              onUpdateDecalFrom3D?.(activeSelectedDecal.id, { pinned: !activeSelectedDecal.pinned }, true)
            }
            title={activeSelectedDecal.pinned ? 'Desbloquear objeto' : 'Fijar posición (Pin)'}
            className={`p-1.5 rounded-lg ${
              activeSelectedDecal.pinned
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
            }`}
          >
            {activeSelectedDecal.pinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
          </button>

          {onDeleteDecalFrom3D && (
            <button
              type="button"
              onClick={() => onDeleteDecalFrom3D(activeSelectedDecal.id)}
              title="Eliminar objeto"
              className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Píldora flotante al pasar o arrastrar sobre el tejido 3D */}
      {(hoveringObjectLabel || isDraggingObject) && (
        <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-950/90 border border-emerald-400/50 text-[11px] font-bold text-emerald-300 shadow-lg whitespace-nowrap">
          {isDraggingObject
            ? '🎯 Ajustando con SnapLines verdes Owayo + Sperrbezirk activo'
            : `✋ Clic para editar o arrastrar «${hoveringObjectLabel}»`}
        </div>
      )}
    </div>
  );
}
