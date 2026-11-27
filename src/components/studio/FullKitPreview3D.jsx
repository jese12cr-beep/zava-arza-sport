import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Pause, Play } from 'lucide-react';
import {
  loadMirlModelTemplate,
  instantiateMirlGarmentGroup,
} from '../../engine/viewer3d/mirlModelLoader';
import { loadAndBindGarmentGLB } from '../../engine/viewer3d/glbModelLoader';
import {
  ALL_POSSIBLE_MESH_PARTS,
  addStudioGarmentLighting,
  applyFabricWeaveToMaterials,
  createGarmentSurfaceSet,
  createGlovesSurfaceSet,
  createSoftFloorShadowMesh,
  markGlovesTexturesDirty,
  paintGarmentSurfaceSet,
  paintGlovesCanvases,
} from '../../engine/viewer3d/garmentMaterials3D';
import {
  loadFishDesignMasks,
  resolveActiveFishDesignMeta,
} from '../../engine/compositor/fishPartCompositor';
import { ENGINE_PRODUCTS } from '../../engine/core/designStore';
import { resolveAssetUrl } from '../../utils/assetUrl';

const KIT_CAMERA_PRESETS = {
  three_quarter: { pos: [2.75, 0.42, 7.65], target: [0, 0, 0] },
  front: { pos: [0, 0.08, 8.2], target: [0, 0, 0] },
  back: { pos: [0, 0.08, -8.2], target: [0, 0, 0] },
  gloves_three_quarter: { pos: [1.55, 0.25, 4.95], target: [0, -0.02, 0] },
  gloves_front: { pos: [0, 0.14, 5.15], target: [0, 0, 0] },
  gloves_back: { pos: [0.32, 0.12, -5.05], target: [0, 0, 0] },
};

function computeTorsoWidthFromGroup(topGroup) {
  let torsoMesh = null;
  topGroup.traverse((obj) => {
    if (!obj.isMesh) return;
    if (obj.name === 'Front') torsoMesh = obj;
  });
  if (torsoMesh) {
    const b = new THREE.Box3().setFromObject(torsoMesh);
    const sz = b.getSize(new THREE.Vector3());
    if (sz.x > 0.2) return sz.x;
  }
  const fullBox = new THREE.Box3().setFromObject(topGroup);
  return fullBox.getSize(new THREE.Vector3()).x * 0.62;
}

export default function FullKitPreview3D({
  item,
  artworkRegistry = {},
  onRegisterCapture = null,
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const registerCaptureRef = useRef(onRegisterCapture);
  useEffect(() => {
    registerCaptureRef.current = onRegisterCapture;
  }, [onRegisterCapture]);

  const playerUnits = Number(item?.playerUnits ?? 0);
  const keeperUnits = Number(item?.keeperUnits ?? 0);
  const glovePairs = Number(item?.glovePairs ?? 0);
  const hasKeeperOption = keeperUnits > 0 && Boolean(item?.goalkeeperFullDesign);
  const hasGlovesOption = glovePairs > 0 && Boolean(item?.glovesFullDesign);

  const [viewMode, setViewMode] = useState(() =>
    keeperUnits > 0 && playerUnits === 0 && item?.goalkeeperFullDesign ? 'goalkeeper' : 'field'
  );
  const [cameraPreset, setCameraPreset] = useState('three_quarter');
  const [autoSpin, setAutoSpin] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return true;
  });
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  const autoSpinRef = useRef(autoSpin);
  useEffect(() => {
    autoSpinRef.current = autoSpin;
    const st = sceneRef.current;
    if (st?.controls) {
      st.controls.autoRotate = Boolean(autoSpin) && !st.isUserDragging;
    }
  }, [autoSpin]);

  const effectiveViewMode =
    viewMode === 'gloves' && hasGlovesOption
      ? 'gloves'
      : viewMode === 'goalkeeper' && hasKeeperOption
      ? 'goalkeeper'
      : 'field';

  const activeTopProductId =
    effectiveViewMode === 'goalkeeper'
      ? item?.goalkeeperFullDesign?.productModelId || item?.topProductId || 'futbol_jersey_pro_vneck'
      : item?.topProductId || item?.product?.id || 'futbol_jersey_pro_vneck';

  const activeTopDesign =
    effectiveViewMode === 'goalkeeper'
      ? item?.goalkeeperFullDesign || item?.topDesign
      : item?.topDesign;

  const activeBottomProductId = item?.bottomProductId || null;
  const activeBottomDesign = item?.bottomDesign || null;

  const topProdMeta =
    ENGINE_PRODUCTS.find((p) => p.id === activeTopProductId) || ENGINE_PRODUCTS[0];
  const botProdMeta = activeBottomProductId
    ? ENGINE_PRODUCTS.find((p) => p.id === activeBottomProductId) || null
    : null;

  const activePlayer = useMemo(() => {
    const wantsKeeper = effectiveViewMode === 'goalkeeper' || effectiveViewMode === 'gloves';
    const matched = (item?.roster || []).find((r) =>
      wantsKeeper
        ? /portero|arquero|keeper|\bgk\b/i.test(r.role || '')
        : !/portero|arquero|keeper|\bgk\b/i.test(r.role || '')
    );
    return (
      matched ||
      item?.roster?.[0] || {
        name: item?.design?.playerName || '',
        number: item?.design?.playerNumber || '',
        size: 'L',
      }
    );
  }, [item?.roster, item?.design?.playerName, item?.design?.playerNumber, effectiveViewMode]);

  const handleSelectCameraPreset = (nextPreset) => {
    setCameraPreset(nextPreset);
    const st = sceneRef.current;
    if (!st) return;
    const lookupKey =
      effectiveViewMode === 'gloves' ? `gloves_${nextPreset}` : nextPreset;
    const preset = KIT_CAMERA_PRESETS[lookupKey] || KIT_CAMERA_PRESETS.three_quarter;
    st.targetCamPos.set(...preset.pos);
    st.targetLookAt.set(...preset.target);
    st.setTransition(true);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new THREE.Scene();
    const computeFov = (aspect) => {
      if (aspect < 0.85) return Math.min(44, 30 / (aspect * 0.92));
      return 30;
    };

    const initW = Math.max(1, container.clientWidth);
    const initH = Math.max(1, container.clientHeight);
    const camera = new THREE.PerspectiveCamera(
      computeFov(initW / initH),
      initW / initH,
      0.1,
      60
    );
    camera.position.set(...KIT_CAMERA_PRESETS.three_quarter.pos);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(initW, initH);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    addStudioGarmentLighting(scene);
    const { floorShadow, shadowTex } = createSoftFloorShadowMesh(3.2, 2.1, -1.96);
    scene.add(floorShadow);

    const maxAniso = Math.min(6, renderer.capabilities.getMaxAnisotropy());
    const topSurface = createGarmentSurfaceSet(maxAniso, 'L', {
      resolutionScale: 0.5,
    });
    const bottomSurface = createGarmentSurfaceSet(maxAniso, 'L', {
      resolutionScale: 0.5,
    });
    const gloveSurface = createGlovesSurfaceSet(maxAniso);

    const ensembleGroup = new THREE.Group();
    scene.add(ensembleGroup);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 2.8;
    controls.maxDistance = 13.5;
    controls.minPolarAngle = Math.PI * 0.14;
    controls.maxPolarAngle = Math.PI * 0.86;
    controls.autoRotate = Boolean(autoSpinRef.current);
    controls.autoRotateSpeed = 1.65;

    const targetCamPos = new THREE.Vector3(...KIT_CAMERA_PRESETS.three_quarter.pos);
    const targetLookAt = new THREE.Vector3(...KIT_CAMERA_PRESETS.three_quarter.target);
    let isTransitioning = false;
    let disposed = false;

    const captureKitSnapshot = () => {
      if (!sceneRef.current?.renderer || !sceneRef.current?.scene || !sceneRef.current?.camera) {
        return null;
      }
      controls.update();
      renderer.render(scene, camera);
      const rawCanvas = renderer.domElement;
      const maxDim = 840;
      const scale = Math.min(1, maxDim / Math.max(rawCanvas.width || 1, rawCanvas.height || 1));
      const outW = Math.max(320, Math.round((rawCanvas.width || 640) * scale));
      const outH = Math.max(320, Math.round((rawCanvas.height || 640) * scale));
      const tmp = document.createElement('canvas');
      tmp.width = outW;
      tmp.height = outH;
      const ctx = tmp.getContext('2d');
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, outW, outH);
      ctx.drawImage(rawCanvas, 0, 0, outW, outH);
      try {
        return tmp.toDataURL('image/jpeg', 0.88);
      } catch {
        return null;
      }
    };

    const stateObj = {
      scene,
      camera,
      renderer,
      controls,
      floorShadow,
      ensembleGroup,
      topSurface,
      bottomSurface,
      gloveSurface,
      topGroup: null,
      bottomGroup: null,
      topBaseY: 0,
      bottomBaseY: 0,
      isUserDragging: false,
      targetCamPos,
      targetLookAt,
      setTransition: (v) => {
        isTransitioning = v;
      },
      renderNow: () => {
        controls.update();
        renderer.render(scene, camera);
      },
      meshSummary: {
        topMeshNames: [],
        bottomMeshNames: [],
        ready: false,
        captureSnapshot: captureKitSnapshot,
      },
    };
    sceneRef.current = stateObj;
    registerCaptureRef.current?.(captureKitSnapshot);
    if (typeof window !== 'undefined') {
      window.__ARZA_CHECKOUT_KIT_STATE__ = stateObj.meshSummary;
    }

    const onControlStart = () => {
      isTransitioning = false;
      stateObj.isUserDragging = true;
      controls.autoRotate = false;
    };
    const onControlEnd = () => {
      stateObj.isUserDragging = false;
      controls.autoRotate = Boolean(autoSpinRef.current);
    };
    controls.addEventListener('start', onControlStart);
    controls.addEventListener('end', onControlEnd);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(1, Math.round(entry.contentRect.width));
        const h = Math.max(1, Math.round(entry.contentRect.height));
        const aspect = w / h;
        camera.aspect = aspect;
        camera.fov = computeFov(aspect);
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        controls.update();
        renderer.render(scene, camera);
      }
    });
    ro.observe(container);

    let rafId = null;
    const clockStart = performance.now();
    const animate = () => {
      if (disposed) return;
      rafId = requestAnimationFrame(animate);

      const elapsed = (performance.now() - clockStart) * 0.001;
      if (autoSpinRef.current && !stateObj.isUserDragging) {
        if (stateObj.topGroup) {
          stateObj.topGroup.position.y = stateObj.topBaseY + Math.sin(elapsed * 1.45) * 0.026;
        }
        if (stateObj.bottomGroup) {
          stateObj.bottomGroup.position.y =
            stateObj.bottomBaseY + Math.sin(elapsed * 1.45 + 0.65) * 0.022;
        }
      }

      if (isTransitioning) {
        camera.position.lerp(targetCamPos, 0.14);
        controls.target.lerp(targetLookAt, 0.14);
        if (camera.position.distanceTo(targetCamPos) < 0.02) {
          camera.position.copy(targetCamPos);
          controls.target.copy(targetLookAt);
          isTransitioning = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      ro.disconnect();
      controls.removeEventListener('start', onControlStart);
      controls.removeEventListener('end', onControlEnd);
      controls.dispose();
      topSurface.dispose();
      bottomSurface.dispose();
      gloveSurface.dispose();
      floorShadow.geometry.dispose();
      floorShadow.material.dispose();
      shadowTex.dispose();
      renderer.dispose();
      if (typeof window !== 'undefined' && window.__ARZA_CHECKOUT_KIT_STATE__ === stateObj.meshSummary) {
        delete window.__ARZA_CHECKOUT_KIT_STATE__;
      }
    };
  }, []);

  useEffect(() => {
    const st = sceneRef.current;
    if (!st) return undefined;
    let cancelled = false;
    setIsLoadingModels(true);

    while (st.ensembleGroup.children.length > 0) {
      st.ensembleGroup.remove(st.ensembleGroup.children[0]);
    }
    st.topGroup = null;
    st.bottomGroup = null;
    st.meshSummary.topMeshNames = [];
    st.meshSummary.bottomMeshNames = [];
    st.meshSummary.ready = false;

    if (effectiveViewMode === 'gloves' && item?.glovesFullDesign) {
      const glbUrl = resolveAssetUrl(
        item.glovesFullDesign.modelUrl || 'models/goalkeeper_gloves_gk1.glb'
      );
      loadAndBindGarmentGLB(glbUrl, st.gloveSurface.gloveMaterials)
        .then(({ modelGroup, meshManifest }) => {
          if (cancelled || !sceneRef.current) return;
          const gColors = item.glovesFullDesign.colorZones || {};
          st.gloveSurface.gloveMaterials.palm.color.set('#ffffff');
          st.gloveSurface.gloveMaterials.accents.color.set(gColors.accents?.hex || '#fa5400');
          st.gloveSurface.gloveMaterials.palm.roughness =
            item.glovesFullDesign.gloveCut === 'negative' ? 0.72 : 0.62;
          paintGlovesCanvases(
            st.gloveSurface,
            item.glovesFullDesign,
            activeTopDesign,
            activePlayer,
            artworkRegistry
          );
          markGlovesTexturesDirty(st.gloveSurface);

          st.ensembleGroup.position.set(0, 0, 0);
          st.ensembleGroup.add(modelGroup);
          st.topGroup = modelGroup;
          st.topBaseY = modelGroup.position.y;
          st.floorShadow.position.y = -1.35;
          st.targetCamPos.set(...KIT_CAMERA_PRESETS.gloves_three_quarter.pos);
          st.targetLookAt.set(...KIT_CAMERA_PRESETS.gloves_three_quarter.target);
          st.setTransition(true);
          st.meshSummary.topMeshNames = meshManifest.map((m) => m.name);
          st.meshSummary.ready = true;
          setIsLoadingModels(false);
          st.renderNow();
        })
        .catch(() => {
          if (!cancelled) setIsLoadingModels(false);
        });

      return () => {
        cancelled = true;
      };
    }

    const topUrl = topProdMeta?.mirlUrl || '/models/football_f3_ka.mirl';
    const topSleeveLength =
      effectiveViewMode === 'goalkeeper' || activeTopDesign?.sleeveLength === 'long'
        ? 'long'
        : 'short';
    const topFishMeta = resolveActiveFishDesignMeta(activeTopDesign || {});
    const botUrl = botProdMeta?.mirlUrl || null;
    const botFishMeta = activeBottomDesign ? resolveActiveFishDesignMeta(activeBottomDesign) : null;

    Promise.all([
      loadMirlModelTemplate(topUrl),
      topFishMeta?.fileUrl ? loadFishDesignMasks(topFishMeta.fileUrl) : Promise.resolve(null),
      botUrl ? loadMirlModelTemplate(botUrl) : Promise.resolve(null),
      botFishMeta?.fileUrl ? loadFishDesignMasks(botFishMeta.fileUrl) : Promise.resolve(null),
    ])
      .then(([topTemplate, topMasks, botTemplate, botMasks]) => {
        if (cancelled || !sceneRef.current) return;

        applyFabricWeaveToMaterials(st.topSurface.partMaterials, activeTopDesign?.fabricWeaveId);
        const topGroup = instantiateMirlGarmentGroup(
          topTemplate,
          st.topSurface.partMaterials,
          st.topSurface.neckLabelMat,
          st.topSurface.hemFlagMat,
          { sleeveLength: topSleeveLength }
        );
        const topPresentParts = topTemplate.parts
          .map((p) => p.name)
          .filter((n) => ALL_POSSIBLE_MESH_PARTS.includes(n));
        paintGarmentSurfaceSet(
          st.topSurface,
          topPresentParts.length ? topPresentParts : ALL_POSSIBLE_MESH_PARTS,
          activeTopDesign,
          activePlayer,
          artworkRegistry,
          topMasks,
          null
        );

        let bottomGroup = null;
        let bottomPresentParts = [];
        if (botTemplate && activeBottomDesign) {
          applyFabricWeaveToMaterials(st.bottomSurface.partMaterials, activeBottomDesign.fabricWeaveId);
          bottomGroup = instantiateMirlGarmentGroup(
            botTemplate,
            st.bottomSurface.partMaterials,
            st.bottomSurface.neckLabelMat,
            st.bottomSurface.hemFlagMat,
            { sleeveLength: 'short' }
          );
          bottomPresentParts = botTemplate.parts
            .map((p) => p.name)
            .filter((n) => ALL_POSSIBLE_MESH_PARTS.includes(n));
          paintGarmentSurfaceSet(
            st.bottomSurface,
            bottomPresentParts.length ? bottomPresentParts : ALL_POSSIBLE_MESH_PARTS,
            activeBottomDesign,
            activePlayer,
            artworkRegistry,
            botMasks,
            null
          );

          const torsoW = computeTorsoWidthFromGroup(topGroup);
          const rawBotW = new THREE.Box3().setFromObject(bottomGroup).getSize(new THREE.Vector3()).x;
          const botScale =
            torsoW > 0 && rawBotW > 0
              ? Math.min(0.88, Math.max(0.64, (torsoW * 0.96) / rawBotW))
              : 0.74;
          bottomGroup.scale.setScalar(botScale);
        }

        st.ensembleGroup.position.set(0, 0, 0);
        st.ensembleGroup.add(topGroup);
        if (bottomGroup) {
          st.ensembleGroup.add(bottomGroup);
        }

        const topBox = new THREE.Box3().setFromObject(topGroup);
        if (bottomGroup) {
          const botBox = new THREE.Box3().setFromObject(bottomGroup);
          const gap = 0.16;
          topGroup.position.y = -topBox.min.y + gap * 0.5;
          bottomGroup.position.y = -botBox.max.y - gap * 0.5;

          const totalBox = new THREE.Box3().setFromObject(st.ensembleGroup);
          const totalCenter = totalBox.getCenter(new THREE.Vector3());
          st.ensembleGroup.position.y = -totalCenter.y;
          st.floorShadow.position.y = totalBox.min.y - totalCenter.y - 0.18;

          st.targetCamPos.set(...KIT_CAMERA_PRESETS.three_quarter.pos);
          st.targetLookAt.set(...KIT_CAMERA_PRESETS.three_quarter.target);
        } else {
          topGroup.position.y = 0;
          st.floorShadow.position.y = -(topTemplate.dimensions.y / 2) - 0.14;
          st.targetCamPos.set(2.4, 0.36, 5.4);
          st.targetLookAt.set(0, 0.04, 0);
        }

        st.topGroup = topGroup;
        st.bottomGroup = bottomGroup;
        st.topBaseY = topGroup.position.y;
        st.bottomBaseY = bottomGroup ? bottomGroup.position.y : 0;
        st.setTransition(true);
        st.meshSummary.topMeshNames = topPresentParts;
        st.meshSummary.bottomMeshNames = bottomPresentParts;
        st.meshSummary.ready = true;
        setCameraPreset('three_quarter');
        setIsLoadingModels(false);
        st.renderNow();
      })
      .catch(() => {
        if (!cancelled) setIsLoadingModels(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    effectiveViewMode,
    activeTopProductId,
    activeTopDesign,
    activeBottomProductId,
    activeBottomDesign,
    item?.glovesFullDesign,
    activePlayer,
    artworkRegistry,
    topProdMeta?.mirlUrl,
    botProdMeta?.mirlUrl,
  ]);

  if (topProdMeta?.renderMode === 'FAUX_3D_LAYERED_WEBP') {
    return (
      <div className="h-full min-h-[240px] flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-100 to-white">
        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
          Prenda Seleccionada
        </span>
        <p className="text-sm font-black text-slate-900 mt-1">{topProdMeta.name}</p>
        <p className="text-xs text-slate-500 mt-1">{item?.design?.fabricName}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[290px] sm:min-h-[420px] flex flex-col bg-[radial-gradient(circle_at_50%_42%,#ffffff_0%,#eef1f5_75%,#e5e9ef_100%)] overflow-hidden select-none">
      {/* Encabezado superior: Etiqueta + pestañas Campo / Portero / Guantes */}
      <div className="relative z-10 px-3 pt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 border border-slate-200/80 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
            {effectiveViewMode === 'gloves'
              ? 'Guantes Pro 3D'
              : botProdMeta
              ? `${topProdMeta.shortName} + ${botProdMeta.shortName}`
              : topProdMeta.shortName}
          </span>
        </div>

        {(hasKeeperOption || hasGlovesOption) && (
          <div
            role="group"
            aria-label="Cambiar vista 3D del pedido"
            className="inline-flex flex-wrap items-center gap-1 p-0.5 rounded-full bg-white/90 border border-slate-200 shadow-2xs"
          >
            {playerUnits > 0 && (
              <button
                type="button"
                aria-pressed={effectiveViewMode === 'field'}
                onClick={() => setViewMode('field')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                  effectiveViewMode === 'field'
                    ? 'bg-[#111111] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {botProdMeta ? 'Camisa + Short' : 'Uniforme Campo'}
              </button>
            )}
            {hasKeeperOption && (
              <button
                type="button"
                aria-pressed={effectiveViewMode === 'goalkeeper'}
                onClick={() => setViewMode('goalkeeper')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                  effectiveViewMode === 'goalkeeper'
                    ? 'bg-[#C24100] text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Portero M.L.
              </button>
            )}
            {hasGlovesOption && (
              <button
                type="button"
                aria-pressed={effectiveViewMode === 'gloves'}
                onClick={() => setViewMode('gloves')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                  effectiveViewMode === 'gloves'
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Guantes 3D
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lienzo WebGL 3D interactivo */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={containerRef}
          aria-label="Vista previa 3D interactiva de uniforme completo"
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />
        {isLoadingModels && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/45 backdrop-blur-[1px]">
            <span className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-700 shadow-xs">
              Cargando uniforme 3D en vivo...
            </span>
          </div>
        )}
      </div>

      {/* Controles inferiores de cámara y rotación */}
      <div className="relative z-10 px-3 pb-3 pt-1 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 p-1 rounded-full bg-white/90 border border-slate-200 shadow-2xs">
          {[
            { id: 'three_quarter', label: '3/4' },
            { id: 'front', label: 'Frente' },
            { id: 'back', label: 'Espalda' },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => handleSelectCameraPreset(btn.id)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                cameraPreset === btn.id
                  ? 'bg-[#111111] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-pressed={autoSpin}
          onClick={() => setAutoSpin((s) => !s)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border cursor-pointer transition-colors shadow-2xs ${
            autoSpin
              ? 'bg-emerald-700 text-white border-emerald-700'
              : 'bg-white/90 text-slate-800 border-slate-300 hover:bg-white'
          }`}
        >
          {autoSpin ? (
            <>
              <Pause className="w-3 h-3" aria-hidden="true" />
              <span>Girando 360°</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3" aria-hidden="true" />
              <span>Girar 360°</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
