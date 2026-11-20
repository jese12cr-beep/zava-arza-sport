import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FolderHeart,
  Layers,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  Type,
  Upload,
  Users,
} from 'lucide-react';
import ArzaLogo from '../brand/ArzaLogo';
import FabricSwatchThumb from '../brand/FabricSwatchThumb';
import ProductThumb from '../brand/ProductThumb';
import { getProductMedia } from '../../data/productMediaRegistry';
import {
  COLOR_HARMONY_SUGGESTIONS,
  ENGINE_PRODUCTS,
  FABRIC_WEAVES,
  SPORT_FONTS,
  VECTOR_CREST_PRESETS,
  VOLUME_TIERS,
  ZONE_SURFACE_PATTERNS,
} from '../../engine/core/designStore';
import { getPartSpec } from '../../engine/core/boundingBoxMath';

function wizardRangeVars(val, min, max) {
  return {
    '--attr-min': min,
    '--attr-max': max,
    '--control-value': val,
  };
}

const WIZARD_STEPS = [
  {
    step: 1,
    shortLabel: 'Modelo',
    title: 'Paso 1 de 4 · Elige tu Modelo',
    subtitle: 'Selecciona deporte, corte anatómico y prenda base.',
  },
  {
    step: 2,
    shortLabel: 'Diseño',
    title: 'Paso 2 de 4 · Diseño, Tela y Forma',
    subtitle: 'Escoge el corte gráfico, textura de tela 3D y cuello.',
  },
  {
    step: 3,
    shortLabel: 'Colores',
    title: 'Paso 3 de 4 · Colores del Uniforme',
    subtitle: 'Aplica una paleta ARZA o ajusta cada zona.',
  },
  {
    step: 4,
    shortLabel: 'Logos',
    title: 'Paso 4 de 4 · Logos, Dorsales y Pedido',
    subtitle: 'Agrega escudos, nombre, número y tallas del equipo.',
  },
];

const SPORT_FILTER_PILLS = [
  { id: 'all', label: 'Todos' },
  { id: 'Fútbol', label: 'Fútbol' },
  { id: 'Baloncesto', label: 'Baloncesto' },
  { id: 'Chaquetas', label: 'Chamarras' },
  { id: 'E-Sports', label: 'E-Sports' },
];

const ACTIVE_APPAREL_PRODUCTS = ENGINE_PRODUCTS.filter(
  (prod) => prod.garmentCategory !== 'accessory'
);

const GENDER_EQUIVALENT_MAP = {
  men: {
    futbol_jersey_f3w_women: 'futbol_jersey_pro_vneck',
    basketball_b7w_epic_women: 'basketball_b6_hero',
    basketball_shorts_bp7w_women: 'basketball_shorts_bp6',
    jacket_softshell_601w_women: 'jacket_softshell_601m_men',
  },
  women: {
    futbol_jersey_pro_vneck: 'futbol_jersey_f3w_women',
    basketball_b6_hero: 'basketball_b7w_epic_women',
    basketball_shorts_bp6: 'basketball_shorts_bp7w_women',
    jacket_softshell_601m_men: 'jacket_softshell_601w_women',
  },
};

const DORSAL_QUICK_COLORS = [
  { hex: '#ffffff', label: 'Blanco' },
  { hex: '#111111', label: 'Carbón' },
  { hex: '#fa5400', label: 'Naranja ARZA' },
  { hex: '#facc15', label: 'Amarillo' },
  { hex: '#059669', label: 'Esmeralda' },
  { hex: '#dc2626', label: 'Rojo' },
];

/**
 * Panel asistente en 4 pasos secuenciales para clientes ARZA SPORT.
 * Renderiza estrictamente solo el paso activo para evitar saturación visual y mantener limpio el orden de tabulación.
 */
export default function GuidedStepWizardPanel({
  wizardStep,
  onStepChange,
  design,
  currentProduct,
  pairedProduct,
  genderModule,
  onChangeGenderModule,
  onSwitchProduct,
  onSyncPairedColors,
  availableFishDesigns,
  patternCategoryFilter,
  onChangePatternCategoryFilter,
  onSelectDesignCut,
  onCommitDesign,
  activeColorZone,
  onChangeActiveColorZone,
  onUpdateColorZone,
  onApplyColorHarmony,
  essentialColors,
  droppablePanels,
  logoDecals,
  textDecals,
  activePlayer,
  roster,
  activeRosterIndex,
  onUpdateRoster,
  totalUnits,
  unitPrice,
  totalPrice,
  currentTierLabel,
  onFilesSelected,
  onAddPresetCrest,
  onUpdateDecal,
  onDeleteDecal,
  onUpdateVariableSlot,
  onAddQuickText,
  onOpenRosterModal,
  onSaveDraft,
  onFinishOrder,
  onCameraFocus,
  onToast,
}) {
  const [sportFilter, setSportFilter] = useState('all');
  const [showAllGenders, setShowAllGenders] = useState(false);
  const [customTextDraft, setCustomTextDraft] = useState('');
  const [isDragOverUpload, setIsDragOverUpload] = useState(false);

  const stepHeadingRef = useRef(null);
  const didUserSwitchStepRef = useRef(false);
  const localFileInputRef = useRef(null);

  const logoInputId = useId();
  const customColorId = useId();
  const sampleNameId = useId();
  const sampleNumberId = useId();
  const customTextInputId = useId();

  const isShorts = ['football_shorts', 'basketball_shorts'].includes(currentProduct?.garmentShape);
  const isJacket = currentProduct?.garmentCategory === 'jacket';
  const isAccessory = currentProduct?.renderMode === 'FAUX_3D_LAYERED_WEBP';
  const hasCollar =
    !isShorts && !isAccessory && !isJacket && currentProduct?.garmentShape !== 'basketball_tank';
  const hasSleeves =
    Boolean(design?.colorZones?.sleeves) &&
    !['basketball_tank', 'football_shorts', 'basketball_shorts'].includes(
      currentProduct?.garmentShape
    );

  const currentStepMeta = WIZARD_STEPS.find((s) => s.step === wizardStep) || WIZARD_STEPS[0];

  useEffect(() => {
    if (didUserSwitchStepRef.current) {
      didUserSwitchStepRef.current = false;
      stepHeadingRef.current?.focus();
    }
  }, [wizardStep]);

  const navigateToStep = (nextStep) => {
    const clamped = Math.max(1, Math.min(4, nextStep));
    if (clamped === wizardStep) return;
    didUserSwitchStepRef.current = true;
    onStepChange(clamped);
    if (!isAccessory) {
      onCameraFocus?.(clamped === 4 ? 'front' : 'three_quarter');
    }
  };

  const handleToggleGender = (targetGender) => {
    if (targetGender === 'all') {
      setShowAllGenders(true);
      return;
    }
    setShowAllGenders(false);
    onChangeGenderModule(targetGender);
    const mappedId = GENDER_EQUIVALENT_MAP[targetGender]?.[design.productModelId];
    if (mappedId && mappedId !== design.productModelId) {
      onSwitchProduct(mappedId);
      onToast?.(targetGender === 'women' ? 'Corte Dama aplicado' : 'Corte Caballero aplicado');
    }
  };

  const genderFilteredProducts = useMemo(
    () =>
      ACTIVE_APPAREL_PRODUCTS.filter((prod) => {
        if (showAllGenders) return true;
        if (prod.sport === 'E-Sports') return true;
        if (genderModule === 'women' && prod.id === 'football_shorts_fp3') return true;
        if (prod.gender && prod.gender !== genderModule) return false;
        return true;
      }),
    [showAllGenders, genderModule]
  );

  const sportCounts = useMemo(() => {
    const counts = { all: genderFilteredProducts.length };
    for (const prod of genderFilteredProducts) {
      counts[prod.sport] = (counts[prod.sport] || 0) + 1;
    }
    return counts;
  }, [genderFilteredProducts]);

  const step1Products = useMemo(() => {
    if (sportFilter === 'all') return genderFilteredProducts;
    return genderFilteredProducts.filter((prod) => prod.sport === sportFilter);
  }, [genderFilteredProducts, sportFilter]);

  const maxClubDiscountPct = VOLUME_TIERS[VOLUME_TIERS.length - 1]?.discountPct || 35;
  const activeProductMedia = getProductMedia(currentProduct?.id);
  const activeClubMinPrice = +(
    (currentProduct?.basePrice || 0) *
    (1 - maxClubDiscountPct / 100)
  ).toFixed(2);

  const step2Categories = useMemo(() => {
    const counts = new Map();
    for (const d of availableFishDesigns) {
      const cat = d.category || 'Clásico';
      counts.set(cat, (counts.get(cat) || 0) + 1);
    }
    const ordered = ['Clásico', 'Moderno', 'Rayas', 'Geométrico', 'Degradado', 'Minimalista'];
    const dynamicCats = [
      ...ordered.filter((c) => counts.has(c)),
      ...[...counts.keys()].filter((c) => !ordered.includes(c)),
    ];
    return [
      { id: 'Todos', label: 'Todos', count: availableFishDesigns.length },
      ...dynamicCats.map((cat) => ({ id: cat, label: cat, count: counts.get(cat) })),
    ];
  }, [availableFishDesigns]);

  const activePatternCategory = step2Categories.some((c) => c.id === patternCategoryFilter)
    ? patternCategoryFilter
    : 'Todos';

  const filteredStep2Designs = useMemo(() => {
    if (activePatternCategory === 'Todos') return availableFishDesigns;
    return availableFishDesigns.filter(
      (d) => (d.category || 'Clásico') === activePatternCategory
    );
  }, [availableFishDesigns, activePatternCategory]);

  const activeFishMeta =
    availableFishDesigns.find((d) => d.id === design.patternId) || availableFishDesigns[0];

  const zoneLetterToHex = (letter) => {
    if (letter === 'A') return design.colorZones?.primary?.hex || '#111111';
    if (letter === 'B') return design.colorZones?.secondary?.hex || '#fa5400';
    if (letter === 'C') return design.colorZones?.accents?.hex || '#ffffff';
    return design.colorZones?.quaternary?.hex || '#757575';
  };

  const garmentShape = currentProduct?.garmentShape;

  const visibleZoneButtons = useMemo(() => {
    const list = [
      { id: 'primary', label: 'Principal', hex: design.colorZones.primary?.hex || '#111111' },
      { id: 'secondary', label: 'Segundo color', hex: design.colorZones.secondary?.hex || '#fa5400' },
      { id: 'accents', label: 'Contorno / Detalles', hex: design.colorZones.accents?.hex || '#ffffff' },
      {
        id: 'collar',
        label: garmentShape === 'basketball_tank' ? 'Ribetes / Sisa' : 'Cuello',
        hex:
          design.colorZones.collar?.hex ||
          design.colorZones.accents?.hex ||
          design.colorZones.primary?.hex ||
          '#fa5400',
      },
    ];
    if (hasSleeves) {
      list.push({
        id: 'sleeves',
        label: 'Mangas',
        hex: design.colorZones.sleeves?.hex || '#111111',
      });
    }
    return list;
  }, [design.colorZones, garmentShape, hasSleeves]);

  const placeLogoPresetSpot = (decal, spotKey) => {
    const pickPanel = (preferred) =>
      droppablePanels.some((p) => p.panelId === preferred)
        ? preferred
        : droppablePanels[0]?.panelId || 'front';

    let targetPanel = 'front';
    let u = 0.36;
    let v = 0.25;
    let camera = 'front';

    if (spotKey === 'chest_center') {
      targetPanel = pickPanel('front');
      const sp = getPartSpec(design.productModelId, targetPanel);
      u = sp.snapCenterU ?? 0.5;
      v = 0.34;
      camera = 'front';
    } else if (spotKey === 'back_top') {
      targetPanel = pickPanel('back');
      const sp = getPartSpec(design.productModelId, targetPanel);
      u = sp.snapCenterU ?? 0.5;
      v = 0.22;
      camera = 'back';
    } else if (spotKey === 'sleeve') {
      targetPanel = pickPanel('left_arm');
      const sp = getPartSpec(design.productModelId, targetPanel);
      u = sp.snapCenterU ?? 0.45;
      v = sp.defaultPlaceV ?? 0.56;
      camera = 'left_sleeve';
    } else {
      targetPanel = droppablePanels.some((p) => p.panelId === 'front_left')
        ? 'front_left'
        : pickPanel('front');
      u = targetPanel === 'front_left' ? 0.38 : 0.36;
      v = 0.25;
      camera = 'front';
    }

    const sp = getPartSpec(design.productModelId, targetPanel);
    onUpdateDecal(
      decal.id,
      {
        panel: targetPanel,
        centerMm: {
          x: +(sp.widthMm * u).toFixed(1),
          y: +(sp.heightMm * v).toFixed(1),
        },
      },
      true
    );
    if (!isAccessory) onCameraFocus?.(camera);
  };

  const handleSubmitQuickText = (e) => {
    e.preventDefault();
    const cleaned = customTextDraft.trim();
    if (!cleaned) return;
    onAddQuickText(cleaned);
    setCustomTextDraft('');
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Navegación Progresiva en 4 Pasos */}
      <div className="shrink-0 px-3.5 sm:px-4 pt-3 pb-2.5 border-b border-slate-200/75 bg-white/50 backdrop-blur-md space-y-2.5">
        <nav aria-label="Pasos de personalización">
          <ol className="grid grid-cols-4 gap-1.5" role="list">
            {WIZARD_STEPS.map((s) => {
              const isActive = s.step === wizardStep;
              const isCompleted = s.step < wizardStep;
              return (
                <li key={s.step}>
                  <button
                    type="button"
                    aria-current={isActive ? 'step' : undefined}
                    onClick={() => navigateToStep(s.step)}
                    className={`w-full min-h-10 px-1.5 py-1.5 rounded-xl text-[11px] flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer border ${
                      isActive
                        ? 'arza-btn-glass-green font-black shadow-xs'
                        : isCompleted
                        ? 'arza-pill-glass-green font-bold'
                        : 'bg-white/75 border-slate-200 text-slate-600 hover:border-slate-300 font-semibold'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1 leading-none">
                      {isCompleted ? (
                        <Check className="w-3 h-3 shrink-0" aria-hidden="true" />
                      ) : (
                        <span className="font-mono text-[10px]">{s.step}</span>
                      )}
                      <span className="truncate">{s.shortLabel}</span>
                    </span>
                    {isCompleted && <span className="visually-hidden"> (completado)</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="pt-0.5">
          <h2
            ref={stepHeadingRef}
            tabIndex={-1}
            className="text-sm sm:text-base font-black text-slate-900 tracking-tight outline-none"
          >
            {currentStepMeta.title}
          </h2>
          <p className="text-[11px] text-slate-600 font-medium leading-snug">
            {currentStepMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Contenido Exclusivo del Paso Activo */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4">
        {/* ==================== PASO 1: MODELO Y CORTE ==================== */}
        {wizardStep === 1 && (
          <div className="space-y-4">
            {/* 1A: Corte Anatómico (Caballero / Dama / Todos) */}
            <fieldset className="p-3 rounded-2xl arza-glass-card space-y-2">
              <legend className="text-[11px] font-bold uppercase tracking-wider text-slate-700 px-1">
                1. Corte anatómico
              </legend>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  aria-pressed={!showAllGenders && genderModule === 'men'}
                  onClick={() => handleToggleGender('men')}
                  className={`min-h-10 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center ${
                    !showAllGenders && genderModule === 'men'
                      ? 'arza-btn-glass-green'
                      : 'bg-white/85 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span>♂ Caballero</span>
                </button>
                <button
                  type="button"
                  aria-pressed={!showAllGenders && genderModule === 'women'}
                  onClick={() => handleToggleGender('women')}
                  className={`min-h-10 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center ${
                    !showAllGenders && genderModule === 'women'
                      ? 'arza-btn-glass-green'
                      : 'bg-white/85 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span>♀ Dama</span>
                </button>
                <button
                  type="button"
                  aria-pressed={showAllGenders}
                  onClick={() => handleToggleGender('all')}
                  className={`min-h-10 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center ${
                    showAllGenders
                      ? 'arza-btn-glass-green'
                      : 'bg-white/85 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span>Todos ({ACTIVE_APPAREL_PRODUCTS.length})</span>
                </button>
              </div>
            </fieldset>

            {/* 1B: Deporte o Categoría sin recortes */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                2. Deporte o categoría
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {SPORT_FILTER_PILLS.map((sp) => {
                  const active = sportFilter === sp.id;
                  const count = sportCounts[sp.id] || 0;
                  return (
                    <button
                      key={sp.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSportFilter(sp.id)}
                      className={`px-3 min-h-8 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border inline-flex items-center gap-1 ${
                        active
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-white/85 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span>{sp.label}</span>
                      <span
                        className={`text-[10px] font-mono ${
                          active ? 'text-neutral-300' : 'text-slate-400'
                        }`}
                      >
                        ({count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 1C: Tarjeta Resumen del Modelo Activo + Kit Emparejado */}
            {currentProduct && (
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
                <div className="flex items-center gap-3">
                  <ProductThumb product={currentProduct} className="w-14 h-14 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-700 text-white">
                        En visor
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-900">
                        {currentProduct.owayoCutCode}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-800">
                        · {activeProductMedia.fabricSummary}
                      </span>
                    </div>
                    <div className="text-xs font-black text-slate-900 truncate mt-0.5">
                      {currentProduct.name}
                    </div>
                    <div className="text-[10px] text-slate-600 flex items-center gap-2 mt-0.5">
                      <strong className="text-slate-900 tabular-nums-pro">
                        ${currentProduct.basePrice.toFixed(2)} USD
                      </strong>
                      <span>·</span>
                      <span className="text-emerald-800 font-bold tabular-nums-pro">
                        ${activeClubMinPrice.toFixed(2)} USD en 25+ uds (-{maxClubDiscountPct}%)
                      </span>
                    </div>
                  </div>
                </div>

                {pairedProduct && (
                  <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-emerald-950 truncate">
                      Kit compatible: {pairedProduct.shortName}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onSyncPairedColors?.();
                        onSwitchProduct(pairedProduct.id);
                        onToast?.(`Cambiado a ${pairedProduct.shortName} con colores sincronizados`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold shrink-0 cursor-pointer transition-colors"
                    >
                      Cambiar a {pairedProduct.shortName}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 1D: Lista Visual de Prendas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  3. Selecciona tu prenda ({step1Products.length})
                </span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold">
                  Vista en vivo
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {step1Products.map((prod) => {
                  const isSel = prod.id === design.productModelId;
                  const media = getProductMedia(prod.id);
                  const clubPrice = +(prod.basePrice * (1 - maxClubDiscountPct / 100)).toFixed(2);
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      aria-pressed={isSel}
                      onClick={() => {
                        onSwitchProduct(prod.id);
                        onToast?.(`${prod.shortName || prod.name} cargado`);
                      }}
                      className={`p-2.5 rounded-2xl text-left transition-all cursor-pointer flex items-center gap-3 border ${
                        isSel
                          ? 'border-2 border-emerald-600 bg-emerald-50/55 shadow-xs'
                          : 'bg-white/90 border-slate-200 hover:border-emerald-400'
                      }`}
                    >
                      <ProductThumb product={prod} className="w-14 h-14 rounded-xl" />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {prod.sport}
                          </span>
                          <span className="text-[10px] text-slate-300" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-[10px] font-semibold text-slate-600">
                            {media.fitLabel}
                          </span>
                          {isSel && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                              <Check className="w-3 h-3" aria-hidden="true" />
                              <span>Activo</span>
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-black text-slate-900 leading-snug truncate mt-0.5">
                          {prod.name}
                        </div>

                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          <span className="font-mono">{prod.owayoCutCode}</span> · {prod.badge}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-black text-slate-900 tabular-nums-pro">
                          ${prod.basePrice.toFixed(2)}
                        </div>
                        <div className="text-[9px] font-bold text-emerald-700 tabular-nums-pro">
                          -${maxClubDiscountPct}%: ${clubPrice.toFixed(2)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== PASO 2: DISEÑO, TELA Y FORMA ==================== */}
        {wizardStep === 2 && (
          <div className="space-y-4">
            {/* 2A: Diseño activo + filtros dinámicos envueltos sin recorte */}
            <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      1. Corte gráfico ({availableFishDesigns.length})
                    </span>
                    {activeFishMeta && (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 truncate max-w-[200px]">
                        Activo: {activeFishMeta.name} ({activeFishMeta.baseColors?.length || 3} zonas)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {step2Categories.map((cat) => {
                      const active = activePatternCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => onChangePatternCategoryFilter(cat.id)}
                          className={`px-2.5 min-h-8 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border inline-flex items-center gap-1 ${
                            active
                              ? 'bg-[#111111] text-white border-[#111111]'
                              : 'bg-white/85 text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span>{cat.label}</span>
                          <span
                            className={`text-[10px] font-mono ${
                              active ? 'text-neutral-300' : 'text-slate-400'
                            }`}
                          >
                            ({cat.count})
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 lg:max-h-[215px] lg:overflow-y-auto lg:pr-1">
                    {filteredStep2Designs.map((dMeta) => {
                      const isSel = design.patternId === dMeta.id;
                      const zones = dMeta.baseColors?.length ? dMeta.baseColors : ['A', 'B', 'C'];
                      return (
                        <button
                          key={dMeta.id}
                          type="button"
                          aria-pressed={isSel}
                          onClick={() => {
                            onSelectDesignCut(dMeta.id);
                            onToast?.(`Diseño ${dMeta.name} aplicado`);
                          }}
                          className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                            isSel
                              ? 'border-2 border-emerald-600 bg-emerald-50/55 shadow-xs'
                              : 'border-slate-200 bg-white/90 hover:border-emerald-400'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 w-full">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 truncate">
                              {dMeta.category || 'Clásico'}
                            </span>
                            {isSel && (
                              <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                            )}
                          </div>
                          <div className="text-xs font-black text-slate-900 truncate w-full">
                            {dMeta.name}
                          </div>
                          <div className="flex items-center justify-between gap-1 pt-0.5">
                            <div className="flex items-center gap-1" aria-hidden="true">
                              {zones.map((letter) => (
                                <span
                                  key={letter}
                                  className="w-3 h-3 rounded-full border border-black/15"
                                  style={{ backgroundColor: zoneLetterToHex(letter) }}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {zones.length}z
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2B: Forma de cuello (solo jerseys con cuello; especificación para taller) */}
                {hasCollar && (
                  <div className="p-3 rounded-2xl arza-glass-card space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-slate-900">
                        2. Forma de cuello
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        Ficha taller (visor en V)
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'v_neck', label: 'Cuello V', desc: 'Deportivo' },
                        { id: 'round', label: 'Redondo', desc: 'Clásico' },
                        { id: 'polo', label: 'Cuello Polo', desc: 'Formal' },
                      ].map((col) => {
                        const isSel = (design.proCollar || 'v_neck') === col.id;
                        return (
                          <button
                            key={col.id}
                            type="button"
                            aria-pressed={isSel}
                            onClick={() => {
                              onCommitDesign({ ...design, proCollar: col.id }, true);
                              onToast?.(`Cuello ${col.label} guardado en ficha`);
                            }}
                            className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                              isSel
                                ? 'arza-btn-glass-green'
                                : 'bg-white/85 hover:bg-white text-slate-800 border-slate-200'
                            }`}
                          >
                            <div className="text-xs font-black truncate">{col.label}</div>
                            <div
                              className={`text-[10px] mt-0.5 ${
                                isSel ? 'text-emerald-100' : 'text-slate-500'
                              }`}
                            >
                              {col.desc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2C: Texturas Reales de Tela 3D y Trama Sublimada */}
                <div className="p-3.5 rounded-2xl arza-glass-card space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-900">
                      <Layers className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                      <span>Textura de Tela 3D (Tejido Real)</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Micro-relieve
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {FABRIC_WEAVES.map((w, idx) => {
                      const isWeaveSel =
                        (design.fabricWeaveId || currentProduct?.defaultFabricId || 'ts_tex_football') ===
                        w.id;
                      const swatchBg = design.colorZones?.primary?.hex || '#1e293b';
                      const spanFullOnLastOdd =
                        idx === FABRIC_WEAVES.length - 1 && FABRIC_WEAVES.length % 2 === 1;
                      return (
                        <button
                          key={w.id}
                          type="button"
                          aria-pressed={isWeaveSel}
                          onClick={() => {
                            onCommitDesign({ ...design, fabricWeaveId: w.id }, true);
                            onToast?.(`Tela ${w.shortName || w.name} aplicada`);
                          }}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                            spanFullOnLastOdd ? 'sm:col-span-2' : ''
                          } ${
                            isWeaveSel
                              ? 'border-2 border-emerald-600 bg-emerald-50/70 shadow-xs'
                              : 'bg-white/90 border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          <FabricSwatchThumb
                            bumpUrl={w.bumpUrl}
                            tintHex={swatchBg}
                            tileSize={36}
                            className="w-11 h-11 rounded-lg"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[11px] font-black text-slate-900 truncate">
                                {w.shortName || w.name}
                              </span>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold shrink-0">
                                {w.gsm || 150}g
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-600 truncate mt-0.5">
                              {w.subtitle || w.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2.5 border-t border-slate-200/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800">
                        Trama geométrica sublimada
                      </span>
                      {design.surfacePatternId && design.surfacePatternId !== 'none' && (
                        <span className="text-[10px] font-mono font-bold text-emerald-700">
                          {Math.round((design.surfacePatternOpacity ?? 0.16) * 100)}%
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      {ZONE_SURFACE_PATTERNS.map((pat) => (
                        <button
                          key={pat.id}
                          type="button"
                          aria-pressed={(design.surfacePatternId || 'none') === pat.id}
                          onClick={() => {
                            onCommitDesign({ ...design, surfacePatternId: pat.id }, true);
                            onToast?.(`Trama ${pat.name} aplicada`);
                          }}
                          className={`px-2 py-1.5 rounded-xl text-[11px] font-bold border truncate cursor-pointer transition-colors ${
                            (design.surfacePatternId || 'none') === pat.id
                              ? 'arza-btn-glass-green'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          {pat.name}
                        </button>
                      ))}
                    </div>

                    {design.surfacePatternId && design.surfacePatternId !== 'none' && (
                      <input
                        type="range"
                        min="5"
                        max="55"
                        aria-label="Intensidad de trama sublimada"
                        value={Math.round((design.surfacePatternOpacity ?? 0.16) * 100)}
                        style={wizardRangeVars(
                          Math.round((design.surfacePatternOpacity ?? 0.16) * 100),
                          5,
                          55
                        )}
                        onChange={(e) =>
                          onCommitDesign(
                            { ...design, surfacePatternOpacity: Number(e.target.value) / 100 },
                            false
                          )
                        }
                        className="studio-range w-full"
                      />
                    )}

                    {!isShorts && !isJacket && (
                      <label className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70 text-xs font-bold text-slate-800 cursor-pointer">
                        <span>Inserciones de Malla Mesh Lateral</span>
                        <input
                          type="checkbox"
                          {...{ switch: '' }}
                          checked={Boolean(design.hasMeshPanels)}
                          onChange={(e) => {
                            onCommitDesign({ ...design, hasMeshPanels: e.target.checked }, true);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
          </div>
        )}

        {/* ==================== PASO 3: PALETA DE COLORES ==================== */}
        {wizardStep === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                Combinaciones listas ARZA (1 clic)
              </span>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_HARMONY_SUGGESTIONS.slice(0, 6).map((h) => {
                  const pHex = h.zones?.primary?.hex || '#111111';
                  const sHex = h.zones?.secondary?.hex || '#fa5400';
                  const aHex = h.zones?.accents?.hex || '#ffffff';
                  const isMatch =
                    design.colorZones.primary?.hex?.toLowerCase() === pHex.toLowerCase() &&
                    design.colorZones.secondary?.hex?.toLowerCase() === sHex.toLowerCase();
                  return (
                    <button
                      key={h.name}
                      type="button"
                      aria-pressed={isMatch}
                      onClick={() => {
                        onApplyColorHarmony(h);
                        onToast?.(`Paleta ${h.name} aplicada`);
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        isMatch
                          ? 'border-2 border-emerald-600 bg-emerald-50/60 shadow-xs'
                          : 'bg-white/85 border-slate-200 hover:border-emerald-400'
                      }`}
                    >
                      <div className="flex -space-x-1.5 shrink-0" aria-hidden="true">
                        <span
                          className="w-5 h-5 rounded-full border border-white shadow-2xs"
                          style={{ backgroundColor: pHex }}
                        />
                        <span
                          className="w-5 h-5 rounded-full border border-white shadow-2xs"
                          style={{ backgroundColor: sHex }}
                        />
                        <span
                          className="w-5 h-5 rounded-full border border-slate-300 shadow-2xs"
                          style={{ backgroundColor: aHex }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-900 leading-tight line-clamp-2">
                        {h.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl arza-glass-card space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-slate-900">
                  Ajustar por zona
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onCommitDesign(
                      {
                        ...design,
                        colorZones: {
                          ...design.colorZones,
                          primary: design.colorZones.secondary,
                          secondary: design.colorZones.primary,
                        },
                      },
                      true
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-[11px] font-bold text-slate-800 inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" aria-hidden="true" />
                  <span>Invertir Principal ↔ Segundo</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {visibleZoneButtons.map((z) => {
                  const isActive = activeColorZone === z.id;
                  return (
                    <button
                      key={z.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => onChangeActiveColorZone(z.id)}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isActive
                          ? 'border-2 border-emerald-600 bg-white shadow-xs'
                          : 'bg-white/75 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-lg border border-black/15 shrink-0"
                        style={{ backgroundColor: z.hex }}
                        aria-hidden="true"
                      />
                      <span className="text-[11px] font-bold text-slate-900 truncate">
                        {z.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-200/70 space-y-2.5">
                <div className="grid grid-cols-6 gap-2">
                  {essentialColors.map((c) => {
                    const isCur =
                      design.colorZones[activeColorZone]?.hex?.toUpperCase() ===
                      c.hex.toUpperCase();
                    const isLight = [
                      '#FFFFFF',
                      '#F1F5F9',
                      '#94A3B8',
                      '#FACC15',
                      '#38BDF8',
                    ].includes(c.hex.toUpperCase());
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        aria-label={`${c.name} (${c.hex})`}
                        aria-pressed={isCur}
                        onClick={() =>
                          onUpdateColorZone(activeColorZone, {
                            hex: c.hex,
                            name: c.name,
                            code: c.hex,
                          })
                        }
                        className={`w-full aspect-square rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                          isCur
                            ? 'ring-2 ring-emerald-700 scale-105 shadow-md z-10'
                            : 'hover:scale-105 border border-slate-300/80 shadow-2xs'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {isCur && (
                          <Check
                            className={`w-4 h-4 ${isLight ? 'text-slate-900' : 'text-white'}`}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-200/70">
                  <label htmlFor={customColorId} className="text-xs font-bold text-slate-700">
                    ¿Tono exacto de tu club?
                  </label>
                  <input
                    id={customColorId}
                    type="color"
                    value={design.colorZones[activeColorZone]?.hex || '#fa5400'}
                    onChange={(e) =>
                      onUpdateColorZone(activeColorZone, {
                        hex: e.target.value,
                        name: 'Personalizado',
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-10 h-8 rounded-lg border border-slate-300 cursor-pointer bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== PASO 4: LOGOS, DORSALES Y PEDIDO ==================== */}
        {wizardStep === 4 && (
          <div className="space-y-4">
            {/* 4A: Subida de Escudos / Sponsors */}
            <div className="p-3.5 rounded-2xl arza-glass-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  <span>Escudo del Club y Sponsors</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">PNG / SVG / JPG</span>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOverUpload(true);
                }}
                onDragLeave={() => setIsDragOverUpload(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOverUpload(false);
                  onFilesSelected(e.dataTransfer.files);
                }}
                className={`p-3.5 rounded-xl border-2 border-dashed text-center transition-colors ${
                  isDragOverUpload
                    ? 'border-emerald-600 bg-emerald-50/70'
                    : 'border-slate-300 bg-white/75 hover:border-emerald-500'
                }`}
              >
                <input
                  ref={localFileInputRef}
                  id={logoInputId}
                  type="file"
                  multiple
                  accept=".png,.svg,.webp,.jpg,.jpeg,image/*"
                  onChange={(e) => {
                    onFilesSelected(e.target.files);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => localFileInputRef.current?.click()}
                  className="px-4 min-h-10 rounded-xl arza-btn-glass-green text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Subir tu Escudo o Sponsor</span>
                </button>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  O arrastra aquí tus imágenes para colocarlas sobre la prenda
                </p>
              </div>

              {logoDecals.length > 0 && (
                <div className="space-y-2">
                  {logoDecals.map((ld) => (
                    <div
                      key={ld.id}
                      className="p-2.5 rounded-xl bg-white/90 border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {ld.label || 'Escudo en prenda'}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            aria-label={`Reducir tamaño de ${ld.label}`}
                            onClick={() =>
                              onUpdateDecal(
                                ld.id,
                                { scale: Math.max(0.4, +((ld.scale ?? 1) - 0.15).toFixed(2)) },
                                true
                              )
                            }
                            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold cursor-pointer"
                          >
                            −
                          </button>
                          <button
                            type="button"
                            aria-label={`Aumentar tamaño de ${ld.label}`}
                            onClick={() =>
                              onUpdateDecal(
                                ld.id,
                                { scale: Math.min(2.4, +((ld.scale ?? 1) + 0.15).toFixed(2)) },
                                true
                              )
                            }
                            className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold cursor-pointer"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            aria-label={`Eliminar ${ld.label}`}
                            onClick={() => onDeleteDecal(ld.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {!isAccessory && (
                        <div className="flex flex-wrap gap-1">
                          {[
                            { id: 'chest_left', label: 'Pecho Izq.' },
                            { id: 'chest_center', label: 'Centro' },
                            { id: 'back_top', label: 'Espalda' },
                            { id: 'sleeve', label: 'Manga' },
                          ].map((spot) => (
                            <button
                              key={spot.id}
                              type="button"
                              onClick={() => placeLogoPresetSpot(ld, spot.id)}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 text-[10px] font-bold cursor-pointer"
                            >
                              {spot.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <details className="rounded-xl bg-white/70 border border-slate-200 p-2.5 group">
                <summary className="cursor-pointer list-none flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span>¿No tienes archivo? Usa un emblema ARZA</span>
                  <ChevronRight
                    className="w-3.5 h-3.5 text-slate-500 transition-transform group-open:rotate-90"
                    aria-hidden="true"
                  />
                </summary>
                <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                  {VECTOR_CREST_PRESETS.slice(0, 6).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onAddPresetCrest(preset)}
                      className="p-2 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-500 text-left flex items-center gap-2 cursor-pointer"
                    >
                      {preset.id === 'arza_official' ? (
                        <ArzaLogo theme="light" decorative className="w-6 h-4 shrink-0" />
                      ) : (
                        <Shield className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                      )}
                      <span className="text-[11px] font-bold text-slate-800 truncate">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </details>
            </div>

            {/* 4B: Nombre, Número y Sponsor en Texto */}
            <div className="p-3.5 rounded-2xl arza-glass-card space-y-3">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Type className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                <span>Nombre, Número y Texto</span>
              </span>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label htmlFor={sampleNameId} className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nombre en espalda
                  </label>
                  <input
                    id={sampleNameId}
                    type="text"
                    value={activePlayer.name || ''}
                    onFocus={() => !isAccessory && onCameraFocus?.('back')}
                    onChange={(e) => {
                      const nextName = e.target.value.toUpperCase();
                      const nextRoster = [...roster];
                      if (nextRoster[activeRosterIndex]) {
                        nextRoster[activeRosterIndex] = { ...nextRoster[activeRosterIndex], name: nextName };
                      } else if (nextRoster[0]) {
                        nextRoster[0] = { ...nextRoster[0], name: nextName };
                      }
                      onUpdateRoster(nextRoster);
                      if (!design.variableSlots?.playerNameBack?.enabled) {
                        onUpdateVariableSlot(
                          'playerNameBack',
                          { ...design.variableSlots?.playerNameBack, enabled: true },
                          false
                        );
                      }
                    }}
                    placeholder="Ej: RODRÍGUEZ"
                    className="w-full px-3 min-h-10 rounded-xl bg-white border border-slate-300 text-xs font-extrabold uppercase text-slate-900"
                  />
                </div>

                <div>
                  <label htmlFor={sampleNumberId} className="text-[11px] font-bold text-slate-700 block mb-1">
                    Número
                  </label>
                  <input
                    id={sampleNumberId}
                    type="text"
                    inputMode="numeric"
                    maxLength={3}
                    value={activePlayer.number || ''}
                    onFocus={() => !isAccessory && onCameraFocus?.('back')}
                    onChange={(e) => {
                      const nextNum = e.target.value;
                      const nextRoster = [...roster];
                      if (nextRoster[activeRosterIndex]) {
                        nextRoster[activeRosterIndex] = { ...nextRoster[activeRosterIndex], number: nextNum };
                      } else if (nextRoster[0]) {
                        nextRoster[0] = { ...nextRoster[0], number: nextNum };
                      }
                      onUpdateRoster(nextRoster);
                      if (!design.variableSlots?.playerNumberBack?.enabled) {
                        onUpdateVariableSlot(
                          'playerNumberBack',
                          { ...design.variableSlots?.playerNumberBack, enabled: true },
                          false
                        );
                      }
                    }}
                    placeholder="10"
                    className="w-full px-2 min-h-10 rounded-xl bg-white border border-slate-300 text-sm font-black text-center text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-700">Color de dorsal:</span>
                <div className="flex items-center gap-1.5">
                  {DORSAL_QUICK_COLORS.map((dc) => {
                    const active = design.variableSlots?.playerNumberBack?.fillHex === dc.hex;
                    return (
                      <button
                        key={dc.hex}
                        type="button"
                        aria-label={`Color dorsal ${dc.label}`}
                        aria-pressed={active}
                        onClick={() => {
                          onUpdateVariableSlot(
                            'playerNumberBack',
                            { ...design.variableSlots?.playerNumberBack, fillHex: dc.hex },
                            true
                          );
                          onUpdateVariableSlot(
                            'playerNameBack',
                            { ...design.variableSlots?.playerNameBack, fillHex: dc.hex },
                            true
                          );
                          if (design.variableSlots?.playerNumberFront) {
                            onUpdateVariableSlot(
                              'playerNumberFront',
                              { ...design.variableSlots.playerNumberFront, fillHex: dc.hex },
                              true
                            );
                          }
                        }}
                        className={`w-6 h-6 rounded-lg border-2 cursor-pointer transition-transform ${
                          active ? 'border-emerald-600 scale-110' : 'border-slate-300'
                        }`}
                        style={{ backgroundColor: dc.hex }}
                      />
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  Tipografía deportiva
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {SPORT_FONTS.slice(0, 6).map((f) => {
                    const isFontSel = design.variableSlots?.playerNumberBack?.fontFamily === f.family;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        aria-pressed={isFontSel}
                        style={{ fontFamily: f.family }}
                        onClick={() => {
                          onUpdateVariableSlot(
                            'playerNumberBack',
                            { ...design.variableSlots?.playerNumberBack, fontFamily: f.family },
                            true
                          );
                          onUpdateVariableSlot(
                            'playerNameBack',
                            { ...design.variableSlots?.playerNameBack, fontFamily: f.family },
                            true
                          );
                        }}
                        className={`py-1.5 px-1.5 rounded-xl text-xs font-black border truncate cursor-pointer ${
                          isFontSel
                            ? 'arza-btn-glass-green'
                            : 'bg-white text-slate-900 border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        {f.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleSubmitQuickText} className="pt-2 border-t border-slate-200/70 space-y-1.5">
                <label htmlFor={customTextInputId} className="text-[11px] font-bold text-slate-700 block">
                  Añadir texto o sponsor al pecho
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id={customTextInputId}
                    type="text"
                    value={customTextDraft}
                    onChange={(e) => setCustomTextDraft(e.target.value)}
                    placeholder="Ej: GRUPO ZAVA o TU CLUB"
                    className="flex-1 px-3 min-h-10 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900"
                  />
                  <button
                    type="submit"
                    className="px-3 min-h-10 rounded-xl arza-pill-glass-green text-xs font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Añadir</span>
                  </button>
                </div>
              </form>

              {textDecals.length > 0 && (
                <div className="space-y-1.5">
                  {textDecals.map((td) => (
                    <div
                      key={td.id}
                      className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <span className="text-xs font-bold text-slate-900 truncate">{td.text}</span>
                      <button
                        type="button"
                        aria-label={`Eliminar texto ${td.text}`}
                        onClick={() => onDeleteDecal(td.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4C: Resumen de Tallas */}
            <div className="p-3.5 rounded-2xl arza-pill-glass-green flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                  <span>Lista de Tallas ({totalUnits} prendas)</span>
                </div>
                <p className="text-[11px] text-emerald-800 truncate">
                  {currentTierLabel} • ${unitPrice.toFixed(2)} USD c/u
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenRosterModal}
                className="px-3 min-h-10 rounded-xl bg-white/90 hover:bg-white text-emerald-900 border border-emerald-300 text-xs font-bold shrink-0 cursor-pointer"
              >
                Editar Tallas →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Barra Inferior Limpia de Navegación Paso a Paso */}
      <div className="shrink-0 p-3 sm:p-3.5 border-t border-slate-200/80 bg-white/75 backdrop-blur-md space-y-2">
        <div className="flex items-center justify-between text-xs px-0.5">
          <span className="text-slate-600 font-medium">
            {totalUnits} uds • <strong className="text-slate-900">{currentProduct.shortName}</strong>
          </span>
          <span className="font-black text-slate-900 tabular-nums-pro">
            ${totalPrice.toFixed(2)} USD
          </span>
        </div>

        <div className="flex items-center gap-2">
          {wizardStep > 1 && (
            <button
              type="button"
              onClick={() => navigateToStep(wizardStep - 1)}
              className="px-3.5 min-h-11 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              <span>Anterior</span>
            </button>
          )}

          {wizardStep < 4 ? (
            <button
              type="button"
              id={`btn-wizard-next-step-${wizardStep}`}
              onClick={() => navigateToStep(wizardStep + 1)}
              className="flex-1 min-h-11 px-4 rounded-xl arza-btn-glass-green text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>
                {wizardStep === 1
                  ? 'Siguiente: Elegir Diseño'
                  : wizardStep === 2
                  ? 'Siguiente: Elegir Colores'
                  : 'Siguiente: Logos y Pedido'}
              </span>
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onSaveDraft}
                title="Guardar este diseño en tu galería"
                aria-label="Guardar diseño"
                className="px-3 min-h-11 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                <FolderHeart className="w-4 h-4 text-rose-500" aria-hidden="true" />
                <span>Guardar</span>
              </button>
              <button
                type="button"
                id="btn-wizard-finish-order"
                onClick={onFinishOrder}
                className="flex-1 min-h-11 px-4 rounded-xl arza-btn-glass-green text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Finalizar Pedido</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
