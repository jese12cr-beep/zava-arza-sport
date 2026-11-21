import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
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
  ROSTER_CUT_OPTIONS,
  ROSTER_SIZE_OPTIONS,
  SPORT_FONTS,
  VECTOR_CREST_PRESETS,
  VOLUME_TIERS,
  ZONE_SURFACE_PATTERNS,
  computeOwayoAutoContrastHex,
  isGoalkeeperRole,
  parseRosterQuickLines,
  summarizeRosterComposition,
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
    shortLabel: 'Uniforme',
    title: 'Paso 1 de 4 · Uniforme, Portero y Nombres',
    subtitle: 'Elige tu prenda, marca quién es portero y arma la lista para definir la cantidad.',
  },
  {
    step: 2,
    shortLabel: 'Diseño',
    title: 'Paso 2 de 4 · Diseño, Tela y Forma',
    subtitle: 'Escoge el corte gráfico, textura de tela técnica y forma de cuello.',
  },
  {
    step: 3,
    shortLabel: 'Colores',
    title: 'Paso 3 de 4 · Colores del Uniforme',
    subtitle: 'Aplica una paleta ARZA o ajusta cada zona.',
  },
  {
    step: 4,
    shortLabel: 'Pedido',
    title: 'Paso 4 de 4 · Logos, Dorsales y Pedido',
    subtitle: 'Agrega escudos, personaliza la tipografía dorsal y confirma tu pedido.',
  },
];

const SPORT_FILTER_PILLS = [
  { id: 'all', label: 'Todos' },
  { id: 'Fútbol', label: 'Fútbol' },
  { id: 'Baloncesto', label: 'Baloncesto' },
  { id: 'E-Sports', label: 'E-Sports' },
];

const ACTIVE_APPAREL_PRODUCTS = ENGINE_PRODUCTS.filter(
  (prod) => !['accessory', 'jacket'].includes(prod.garmentCategory)
);

const ACTIVE_FABRIC_WEAVES = FABRIC_WEAVES.filter((w) => w.id !== 'k_tex_wind');

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
  onSelectRosterIndex,
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
  onUpdateVariableSlotsBatch,
  onAddQuickText,
  onOpenRosterModal,
  onSaveDraft,
  onFinishOrder,
  activeCameraPreset,
  onCameraFocus,
  onToast,
}) {
  const [sportFilter, setSportFilter] = useState('all');
  const [showAllGenders, setShowAllGenders] = useState(false);
  const [customTextDraft, setCustomTextDraft] = useState('');
  const [inlineCsvDraft, setInlineCsvDraft] = useState('');
  const [isDragOverUpload, setIsDragOverUpload] = useState(false);

  const stepHeadingRef = useRef(null);
  const didUserSwitchStepRef = useRef(false);
  const localFileInputRef = useRef(null);

  const logoInputId = useId();
  const customColorId = useId();
  const dorsalColorId = useId();
  const sampleNameId = useId();
  const sampleNumberId = useId();
  const customTextInputId = useId();
  const rosterFieldsetBaseId = useId();
  const quickCsvId = useId();

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

  const hasFourthZone = Boolean(activeFishMeta?.baseColors?.includes('D'));

  const visibleZoneButtons = useMemo(() => {
    const list = [
      { id: 'primary', label: 'Principal', hex: design.colorZones.primary?.hex || '#111111' },
      { id: 'secondary', label: 'Segundo color', hex: design.colorZones.secondary?.hex || '#fa5400' },
      { id: 'accents', label: 'Contorno / Detalles', hex: design.colorZones.accents?.hex || '#ffffff' },
    ];
    if (hasFourthZone) {
      list.push({
        id: 'quaternary',
        label: 'Cuarto color',
        hex: design.colorZones.quaternary?.hex || '#757575',
      });
    }
    if (!isShorts) {
      list.push({
        id: 'collar',
        label: garmentShape === 'basketball_tank' ? 'Ribetes / Sisa' : 'Cuello',
        hex:
          design.colorZones.collar?.hex ||
          design.colorZones.accents?.hex ||
          design.colorZones.primary?.hex ||
          '#fa5400',
      });
    }
    if (hasSleeves) {
      list.push({
        id: 'sleeves',
        label: 'Mangas',
        hex: design.colorZones.sleeves?.hex || '#111111',
      });
    }
    return list;
  }, [design.colorZones, garmentShape, hasSleeves, isShorts, hasFourthZone]);

  const safeActiveColorZone = visibleZoneButtons.some((z) => z.id === activeColorZone)
    ? activeColorZone
    : visibleZoneButtons[0]?.id || 'primary';
  const activeZoneColorObj = design.colorZones?.[safeActiveColorZone] || design.colorZones?.primary;

  const spotOptions = useMemo(() => {
    if (isShorts) {
      return [
        { id: 'leg_right', label: 'Muslo Der.' },
        { id: 'leg_left', label: 'Muslo Izq.' },
        { id: 'side_right', label: 'Costado Der.' },
        { id: 'side_left', label: 'Costado Izq.' },
      ];
    }
    const spots = [
      { id: 'chest_left', label: 'Pecho Izq.' },
      { id: 'chest_center', label: 'Centro' },
      { id: 'back_top', label: 'Espalda' },
    ];
    if (hasSleeves) {
      spots.push({ id: 'sleeve_right', label: 'Manga Der.' });
      spots.push({ id: 'sleeve_left', label: 'Manga Izq.' });
    }
    return spots;
  }, [isShorts, hasSleeves]);

  const placeDecalPresetSpot = (decal, spotKey) => {
    const pickPanel = (preferred) =>
      droppablePanels.some((p) => p.panelId === preferred)
        ? preferred
        : droppablePanels[0]?.panelId || 'front';

    let targetPanel = pickPanel('front');
    let sp = getPartSpec(design.productModelId, targetPanel);
    let u = sp.snapCenterU ?? 0.5;
    let v = sp.defaultPlaceV ?? 0.34;
    let camera = 'front';

    if (spotKey === 'leg_right') {
      targetPanel = pickPanel('right_leg');
      sp = getPartSpec(design.productModelId, targetPanel);
      u = sp.snapAxesU?.[0]?.u ?? sp.snapCenterU ?? 0.749;
      v = sp.defaultPlaceV ?? 0.67;
      camera = 'front';
    } else if (spotKey === 'leg_left') {
      targetPanel = pickPanel('left_leg');
      sp = getPartSpec(design.productModelId, targetPanel);
      u = sp.snapAxesU?.[0]?.u ?? sp.snapCenterU ?? 0.251;
      v = sp.defaultPlaceV ?? 0.67;
      camera = 'front';
    } else if (spotKey === 'side_right') {
      targetPanel = pickPanel('right_leg');
      sp = getPartSpec(design.productModelId, targetPanel);
      u = sp.snapAxesU?.[1]?.u ?? 0.298;
      v = 0.54;
      camera = 'right_sleeve';
    } else if (spotKey === 'side_left') {
      targetPanel = pickPanel('left_leg');
      sp = getPartSpec(design.productModelId, targetPanel);
      u = sp.snapAxesU?.[1]?.u ?? 0.702;
      v = 0.54;
      camera = 'left_sleeve';
    } else if (spotKey === 'chest_center') {
      targetPanel = pickPanel('front');
      sp = getPartSpec(design.productModelId, targetPanel);
      u = sp.snapCenterU ?? 0.5;
      v = 0.34;
      camera = 'front';
    } else if (spotKey === 'back_top') {
      targetPanel = pickPanel('back');
      sp = getPartSpec(design.productModelId, targetPanel);
      u = sp.snapCenterU ?? 0.5;
      v = 0.22;
      camera = 'back';
    } else if (spotKey === 'sleeve_right') {
      targetPanel = pickPanel('right_arm');
      sp = getPartSpec(design.productModelId, targetPanel);
      u = sp.snapCenterU ?? 0.555;
      v = sp.defaultPlaceV ?? 0.56;
      camera = 'right_sleeve';
    } else if (spotKey === 'sleeve_left' || spotKey === 'sleeve') {
      targetPanel = pickPanel('left_arm');
      sp = getPartSpec(design.productModelId, targetPanel);
      u = sp.snapCenterU ?? 0.445;
      v = sp.defaultPlaceV ?? 0.56;
      camera = 'left_sleeve';
    } else {
      targetPanel = droppablePanels.some((p) => p.panelId === 'front_left')
        ? 'front_left'
        : pickPanel('front');
      sp = getPartSpec(design.productModelId, targetPanel);
      u = targetPanel === 'front_left' ? 0.38 : 0.36;
      v = 0.25;
      camera = 'front';
    }

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

  const isSpotActiveForDecal = (decal, spotKey) => {
    const sp = getPartSpec(design.productModelId, decal.panel || 'front');
    const relU = sp?.widthMm ? (decal.centerMm?.x ?? 0) / sp.widthMm : 0.5;
    if (spotKey === 'chest_left') return decal.panel === 'front' && relU < 0.44;
    if (spotKey === 'chest_center') return decal.panel === 'front' && relU >= 0.44;
    if (spotKey === 'back_top') return decal.panel === 'back';
    if (spotKey === 'sleeve_right') return decal.panel === 'right_arm';
    if (spotKey === 'sleeve_left') return decal.panel === 'left_arm';
    if (spotKey === 'leg_right') {
      return decal.panel === 'right_leg' && (!sp?.snapAxesU?.[1] || Math.abs(relU - sp.snapAxesU[0].u) <= Math.abs(relU - sp.snapAxesU[1].u));
    }
    if (spotKey === 'side_right') {
      return decal.panel === 'right_leg' && sp?.snapAxesU?.[1] && Math.abs(relU - sp.snapAxesU[1].u) < Math.abs(relU - sp.snapAxesU[0].u);
    }
    if (spotKey === 'leg_left') {
      return decal.panel === 'left_leg' && (!sp?.snapAxesU?.[1] || Math.abs(relU - sp.snapAxesU[0].u) <= Math.abs(relU - sp.snapAxesU[1].u));
    }
    if (spotKey === 'side_left') {
      return decal.panel === 'left_leg' && sp?.snapAxesU?.[1] && Math.abs(relU - sp.snapAxesU[1].u) < Math.abs(relU - sp.snapAxesU[0].u);
    }
    return false;
  };

  const applyDorsalColor = (hex, recordHistory = true) => {
    const contrastOutline = computeOwayoAutoContrastHex(hex);
    if (onUpdateVariableSlotsBatch) {
      if (isShorts) {
        onUpdateVariableSlotsBatch(
          { playerNumberShorts: { fillHex: hex, outlineHex: contrastOutline } },
          recordHistory
        );
      } else {
        onUpdateVariableSlotsBatch(
          {
            playerNumberBack: { fillHex: hex, outlineHex: contrastOutline },
            playerNameBack: { fillHex: hex, outlineHex: contrastOutline },
            playerNumberFront: { fillHex: hex, outlineHex: contrastOutline },
            playerNumberSleeve: { fillHex: hex, outlineHex: contrastOutline },
          },
          recordHistory
        );
      }
      return;
    }
    const primaryKey = isShorts ? 'playerNumberShorts' : 'playerNumberBack';
    onUpdateVariableSlot(
      primaryKey,
      { ...design.variableSlots?.[primaryKey], fillHex: hex, outlineHex: contrastOutline },
      recordHistory
    );
  };

  const applyDorsalFont = (family) => {
    if (onUpdateVariableSlotsBatch) {
      if (isShorts) {
        onUpdateVariableSlotsBatch({ playerNumberShorts: { fontFamily: family } }, true);
      } else {
        onUpdateVariableSlotsBatch(
          {
            playerNumberBack: { fontFamily: family },
            playerNameBack: { fontFamily: family },
            playerNumberFront: { fontFamily: family },
            playerNumberSleeve: { fontFamily: family },
          },
          true
        );
      }
      return;
    }
    const primaryKey = isShorts ? 'playerNumberShorts' : 'playerNumberBack';
    onUpdateVariableSlot(
      primaryKey,
      { ...design.variableSlots?.[primaryKey], fontFamily: family },
      true
    );
  };

  const updateRosterPlayerField = (field, nextValue, enableSlotKey) => {
    const nextRoster = [...roster];
    const targetIdx = nextRoster[activeRosterIndex] ? activeRosterIndex : 0;
    if (nextRoster[targetIdx]) {
      nextRoster[targetIdx] = { ...nextRoster[targetIdx], [field]: nextValue };
    }
    onUpdateRoster(nextRoster);
    if (enableSlotKey && design.variableSlots?.[enableSlotKey] && !design.variableSlots[enableSlotKey].enabled) {
      onUpdateVariableSlot(
        enableSlotKey,
        { ...design.variableSlots[enableSlotKey], enabled: true },
        false
      );
    }
  };

  const rosterComposition = useMemo(() => summarizeRosterComposition(roster), [roster]);
  const rosterSizeSummary = rosterComposition.bySizeLabel;

  const updateRowAt = (idx, patch) => {
    onUpdateRoster(roster.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const handleAddRosterRow = (role = 'Jugador') => {
    const keeper = isGoalkeeperRole(role);
    const nextIdx = roster.length;
    const defaultCut = genderModule === 'women' ? 'WOMEN_FIT' : 'MEN_PRO_SLIM';
    const nextRow = {
      id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      name: keeper ? 'PORTERO' : `JUGADOR ${roster.length + 1}`,
      number: keeper ? '1' : String(roster.length + 1),
      size: 'L',
      cut: defaultCut,
      qty: 1,
      role: keeper ? 'Portero' : 'Jugador',
    };
    onUpdateRoster([...roster, nextRow]);
    onSelectRosterIndex?.(nextIdx);
    onToast?.(keeper ? 'Portero añadido a la lista' : 'Jugador añadido a la lista');
  };

  const handleRemoveRosterRow = (idx) => {
    if (roster.length <= 1) return;
    const next = roster.filter((_, i) => i !== idx);
    onUpdateRoster(next);
    if (activeRosterIndex >= next.length) {
      onSelectRosterIndex?.(Math.max(0, next.length - 1));
    }
  };

  const handleInlineCsvImport = () => {
    const defaultCut = genderModule === 'women' ? 'WOMEN_FIT' : 'MEN_PRO_SLIM';
    const parsed = parseRosterQuickLines(inlineCsvDraft, defaultCut);
    if (parsed.length === 0) return;
    onUpdateRoster([...roster, ...parsed]);
    setInlineCsvDraft('');
    onToast?.(`${parsed.length} filas agregadas a la lista del pedido`);
  };

  const activeDorsalSlot = isShorts
    ? design.variableSlots?.playerNumberShorts
    : design.variableSlots?.playerNumberBack || design.variableSlots?.playerNameBack;
  const activeDorsalFillHex = (activeDorsalSlot?.fillHex || '#ffffff').toUpperCase();
  const activeDorsalFont = activeDorsalSlot?.fontFamily || "'Bebas Neue', sans-serif";

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

            {/* 1E: Uniforme, Portero y Lista de Nombres para la Cantidad del Pedido */}
            <fieldset className="p-3 rounded-2xl arza-glass-card space-y-2.5 border border-emerald-200/80">
              <legend className="text-[11px] font-bold uppercase tracking-wider text-slate-800 px-1">
                4. Lista de nombres y porteros ({totalUnits} prendas)
              </legend>

              {/* Resumen Jugadores vs Porteros + Tarifa */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-950 text-[10px] font-black tabular-nums-pro">
                    {rosterComposition.playerUnits} Jugador{rosterComposition.playerUnits === 1 ? '' : 'es'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 text-[10px] font-black tabular-nums-pro">
                    {rosterComposition.keeperUnits} Portero{rosterComposition.keeperUnits === 1 ? '' : 's'}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-600 tabular-nums-pro">
                  {currentTierLabel} · ${unitPrice.toFixed(2)} c/u
                </span>
              </div>

              {/* Botones rápidos + Jugador / + Portero / Tabla Completa */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddRosterRow('Jugador')}
                  className="px-2.5 min-h-9 rounded-xl arza-pill-glass-green text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Añadir Jugador</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddRosterRow('Portero')}
                  className="px-2.5 min-h-9 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-[#C24100]" aria-hidden="true" />
                  <span>Añadir Portero</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenRosterModal}
                  className="ml-auto px-2.5 min-h-9 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                  <span>Tabla</span>
                </button>
              </div>

              {/* Filas editables directamente en Paso 1 */}
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-0.5">
                {roster.map((row, idx) => {
                  const isKeeper = isGoalkeeperRole(row.role);
                  const isPreviewed = idx === activeRosterIndex;
                  const rowIdPrefix = `${rosterFieldsetBaseId}-row-${idx}`;
                  return (
                    <div
                      key={row.id || idx}
                      className={`p-2.5 rounded-xl border space-y-2 transition-colors ${
                        isKeeper
                          ? 'bg-amber-50/70 border-amber-300'
                          : isPreviewed
                          ? 'bg-emerald-50/50 border-emerald-400'
                          : 'bg-white/95 border-slate-200'
                      }`}
                    >
                      {/* Cabecera de fila: Índice, Selector Rol (Jugador / Portero), Vista Previa y Borrar */}
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-black text-slate-500">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <div
                            className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200"
                            role="group"
                            aria-label={`Rol en lista fila ${idx + 1}`}
                          >
                            <button
                              type="button"
                              aria-pressed={!isKeeper}
                              onClick={() => updateRowAt(idx, { role: 'Jugador' })}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                                !isKeeper
                                  ? 'bg-[#111111] text-white'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Jugador
                            </button>
                            <button
                              type="button"
                              aria-pressed={isKeeper}
                              onClick={() => updateRowAt(idx, { role: 'Portero' })}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                                isKeeper
                                  ? 'bg-[#C24100] text-white'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Portero
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-pressed={isPreviewed}
                            onClick={() => {
                              onSelectRosterIndex?.(idx);
                              onToast?.(`Mostrando #${row.number || '-'} ${row.name || 'S/N'}`);
                            }}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer border ${
                              isPreviewed
                                ? 'bg-emerald-700 text-white border-emerald-700'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <Eye className="w-3 h-3" aria-hidden="true" />
                            <span>Ver</span>
                          </button>

                          {roster.length > 1 && (
                            <button
                              type="button"
                              aria-label={`Eliminar fila ${idx + 1} (${row.name || 'sin nombre'})`}
                              onClick={() => handleRemoveRosterRow(idx)}
                              className="p-1 rounded-md text-slate-500 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Campos de datos con etiquetas explícitas (<label>) */}
                      <div className="grid grid-cols-12 gap-1.5">
                        <div className="col-span-6">
                          <label
                            htmlFor={`${rowIdPrefix}-name`}
                            className="block text-[10px] font-bold text-slate-600 mb-0.5"
                          >
                            Nombre
                          </label>
                          <input
                            id={`${rowIdPrefix}-name`}
                            type="text"
                            value={row.name || ''}
                            onChange={(e) =>
                              updateRowAt(idx, { name: e.target.value.toUpperCase() })
                            }
                            placeholder="Ej: PÉREZ"
                            className="w-full px-2 min-h-9 rounded-lg bg-white border border-slate-300 text-xs font-extrabold uppercase text-slate-900"
                          />
                        </div>

                        <div className="col-span-3">
                          <label
                            htmlFor={`${rowIdPrefix}-num`}
                            className="block text-[10px] font-bold text-slate-600 mb-0.5"
                          >
                            Número
                          </label>
                          <input
                            id={`${rowIdPrefix}-num`}
                            type="text"
                            inputMode="numeric"
                            maxLength={3}
                            value={row.number || ''}
                            onChange={(e) => updateRowAt(idx, { number: e.target.value })}
                            placeholder="10"
                            className="w-full px-1.5 min-h-9 rounded-lg bg-white border border-slate-300 text-xs font-black text-center text-slate-900"
                          />
                        </div>

                        <div className="col-span-3">
                          <label
                            htmlFor={`${rowIdPrefix}-qty`}
                            className="block text-[10px] font-bold text-slate-600 mb-0.5"
                          >
                            Cant.
                          </label>
                          <input
                            id={`${rowIdPrefix}-qty`}
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={999}
                            value={row.qty || 1}
                            onChange={(e) =>
                              updateRowAt(idx, {
                                qty: Math.max(1, parseInt(e.target.value, 10) || 1),
                              })
                            }
                            className="w-full px-1.5 min-h-9 rounded-lg bg-white border border-slate-300 text-xs font-mono font-bold text-center text-slate-900"
                          />
                        </div>

                        <div className="col-span-5">
                          <label
                            htmlFor={`${rowIdPrefix}-size`}
                            className="block text-[10px] font-bold text-slate-600 mb-0.5"
                          >
                            Talla
                          </label>
                          <select
                            id={`${rowIdPrefix}-size`}
                            value={row.size || 'L'}
                            onChange={(e) => updateRowAt(idx, { size: e.target.value })}
                            className="w-full px-2 min-h-9 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900"
                          >
                            {ROSTER_SIZE_OPTIONS.map((sz) => (
                              <option key={sz} value={sz}>
                                {sz}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-7">
                          <label
                            htmlFor={`${rowIdPrefix}-cut`}
                            className="block text-[10px] font-bold text-slate-600 mb-0.5"
                          >
                            Corte (Caballero / Dama / Niño)
                          </label>
                          <select
                            id={`${rowIdPrefix}-cut`}
                            value={row.cut || 'MEN_PRO_SLIM'}
                            onChange={(e) => updateRowAt(idx, { cut: e.target.value })}
                            className="w-full px-2 min-h-9 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800"
                          >
                            {ROSTER_CUT_OPTIONS.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pegado Rápido desde Excel / WhatsApp */}
              <details className="rounded-xl bg-white/80 border border-slate-200 p-2 group">
                <summary className="cursor-pointer list-none flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span>Pegado rápido Excel / WhatsApp</span>
                  <ChevronRight
                    className="w-3.5 h-3.5 text-slate-500 transition-transform group-open:rotate-90"
                    aria-hidden="true"
                  />
                </summary>
                <div className="mt-2 space-y-2">
                  <label htmlFor={quickCsvId} className="block text-[10px] text-slate-600">
                    Una línea por uniforme: <span className="font-mono">NOMBRE, NÚMERO, TALLA, PORTERO/JUGADOR, CANT</span>
                  </label>
                  <textarea
                    id={quickCsvId}
                    rows={2}
                    value={inlineCsvDraft}
                    onChange={(e) => setInlineCsvDraft(e.target.value)}
                    placeholder={'RODRÍGUEZ, 10, L, Jugador, 1\nSANTOS, 1, XL, Portero, 1'}
                    className="w-full rounded-xl bg-white border border-slate-300 p-2 text-xs font-mono text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleInlineCsvImport}
                    className="w-full min-h-9 rounded-xl arza-btn-glass-green text-xs font-bold cursor-pointer"
                  >
                    Importar Filas a la Lista
                  </button>
                </div>
              </details>
            </fieldset>
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

                {/* 2C: Texturas Reales de Tela y Trama Sublimada */}
                <div className="p-3.5 rounded-2xl arza-glass-card space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-900">
                      <Layers className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                      <span>Textura de Tela (Tejido Real)</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Micro-relieve
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ACTIVE_FABRIC_WEAVES.map((w, idx) => {
                      const isWeaveSel =
                        (design.fabricWeaveId || currentProduct?.defaultFabricId || 'ts_tex_football') ===
                        w.id;
                      const swatchBg = design.colorZones?.primary?.hex || '#1e293b';
                      const spanFullOnLastOdd =
                        idx === ACTIVE_FABRIC_WEAVES.length - 1 &&
                        ACTIVE_FABRIC_WEAVES.length % 2 === 1;
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
          <div className="space-y-3.5">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Combinaciones listas ARZA ({COLOR_HARMONY_SUGGESTIONS.length})
                </span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold">
                  1 clic
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-[158px] overflow-y-auto pr-0.5">
                {COLOR_HARMONY_SUGGESTIONS.map((h) => {
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
                      className={`p-2 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        isMatch
                          ? 'border-2 border-emerald-600 bg-emerald-50/60 shadow-xs'
                          : 'bg-white/85 border-slate-200 hover:border-emerald-400'
                      }`}
                    >
                      <div className="flex -space-x-1.5 shrink-0" aria-hidden="true">
                        <span
                          className="w-4 h-4 rounded-full border border-white shadow-2xs"
                          style={{ backgroundColor: pHex }}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-white shadow-2xs"
                          style={{ backgroundColor: sHex }}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs"
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

            <div className="p-3.5 rounded-2xl arza-glass-card space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-slate-900">
                  Ajustar por zona
                </span>
                <button
                  type="button"
                  onClick={() => {
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
                    );
                    onToast?.('Colores Principal y Segundo invertidos');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-[11px] font-bold text-slate-800 inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" aria-hidden="true" />
                  <span>Invertir Principal ↔ Segundo</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {visibleZoneButtons.map((z) => {
                  const isActive = safeActiveColorZone === z.id;
                  return (
                    <button
                      key={z.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => onChangeActiveColorZone(z.id)}
                      className={`px-2 py-1.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isActive
                          ? 'border-2 border-emerald-600 bg-white shadow-xs'
                          : 'bg-white/75 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-md border border-black/15 shrink-0"
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
                <div className="grid grid-cols-8 gap-1.5">
                  {essentialColors.map((c) => {
                    const isCur =
                      activeZoneColorObj?.hex?.toUpperCase() === c.hex.toUpperCase();
                    const checkDark = computeOwayoAutoContrastHex(c.hex) === '#101820';
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        aria-label={`${c.name} (${c.hex})`}
                        aria-pressed={isCur}
                        onClick={() =>
                          onUpdateColorZone(
                            safeActiveColorZone,
                            {
                              hex: c.hex,
                              name: c.name,
                              code: c.name,
                            },
                            true
                          )
                        }
                        className={`w-full aspect-square rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                          isCur
                            ? 'ring-2 ring-emerald-700 scale-105 shadow-md z-10'
                            : 'hover:scale-105 border border-slate-300/80 shadow-2xs'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {isCur && (
                          <Check
                            className={`w-3.5 h-3.5 ${checkDark ? 'text-slate-900' : 'text-white'}`}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200/70">
                  <div className="min-w-0">
                    <label htmlFor={customColorId} className="text-xs font-bold text-slate-800 block">
                      Tono exacto de tu club
                    </label>
                    <span className="text-[10px] font-mono text-slate-500 block truncate">
                      {activeZoneColorObj?.code || 'ARZA'} ·{' '}
                      {(activeZoneColorObj?.hex || '#FA5400').toUpperCase()}
                    </span>
                  </div>
                  <input
                    id={customColorId}
                    type="color"
                    value={activeZoneColorObj?.hex || '#fa5400'}
                    onChange={(e) =>
                      onUpdateColorZone(
                        safeActiveColorZone,
                        {
                          hex: e.target.value,
                          name: 'Personalizado',
                          code: e.target.value.toUpperCase(),
                        },
                        false
                      )
                    }
                    className="w-10 h-8 rounded-lg border border-slate-300 cursor-pointer bg-white shrink-0"
                  />
                </div>

                {pairedProduct && !['accessory', 'jacket'].includes(pairedProduct.garmentCategory) && (
                  <button
                    type="button"
                    onClick={() => {
                      onSyncPairedColors?.();
                      onToast?.(`Paleta sincronizada con ${pairedProduct.shortName}`);
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Copiar estos colores al {pairedProduct.shortName} →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== PASO 4: LOGOS, DORSALES Y PEDIDO ==================== */}
        {wizardStep === 4 && (
          <div className="space-y-3">
            {/* 4A: Subida de Escudos / Sponsors */}
            <div className="p-3 rounded-2xl arza-glass-card space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  <span>Escudo del Club y Sponsors ({logoDecals.length})</span>
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
                className={`p-3 rounded-xl border-2 border-dashed text-center transition-colors ${
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
                  className="px-4 min-h-9 rounded-xl arza-btn-glass-green text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Subir tu Escudo o Sponsor</span>
                </button>
                <p className="text-[10px] text-slate-500 mt-1">
                  O arrastra aquí tus imágenes para colocarlas sobre la prenda
                </p>
              </div>

              {logoDecals.length > 0 && (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
                  {logoDecals.map((ld) => (
                    <div
                      key={ld.id}
                      className="p-2 rounded-xl bg-white/90 border border-slate-200 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {ld.label || 'Escudo en prenda'}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] font-mono text-slate-500 mr-0.5">
                            {Math.round((ld.scale ?? 1) * 100)}%
                          </span>
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
                          {spotOptions.map((spot) => {
                            const activeSpot = isSpotActiveForDecal(ld, spot.id);
                            return (
                              <button
                                key={spot.id}
                                type="button"
                                aria-pressed={activeSpot}
                                onClick={() => placeDecalPresetSpot(ld, spot.id)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                                  activeSpot
                                    ? 'bg-emerald-700 text-white'
                                    : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900'
                                }`}
                              >
                                {spot.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <details className="rounded-xl bg-white/70 border border-slate-200 p-2 group">
                <summary className="cursor-pointer list-none flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span>¿No tienes archivo? Usa un emblema ARZA ({VECTOR_CREST_PRESETS.length})</span>
                  <ChevronRight
                    className="w-3.5 h-3.5 text-slate-500 transition-transform group-open:rotate-90"
                    aria-hidden="true"
                  />
                </summary>
                <div className="grid grid-cols-2 gap-1.5 mt-2 max-h-40 overflow-y-auto pr-0.5">
                  {VECTOR_CREST_PRESETS.map((preset) => (
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
            <div className="p-3 rounded-2xl arza-glass-card space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  <span>{isShorts ? 'Número en Short y Texto' : 'Nombre, Número y Texto'}</span>
                </span>
                {!isAccessory && (
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      aria-pressed={activeCameraPreset === 'front'}
                      onClick={() => onCameraFocus?.('front')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer transition-colors ${
                        activeCameraPreset === 'front'
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
                      }`}
                    >
                      Ver Frente
                    </button>
                    {!isShorts && (
                      <button
                        type="button"
                        aria-pressed={activeCameraPreset === 'back'}
                        onClick={() => onCameraFocus?.('back')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer transition-colors ${
                          activeCameraPreset === 'back'
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
                        }`}
                      >
                        Ver Espalda
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isShorts ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 items-end">
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
                        onFocus={() => onCameraFocus?.('front')}
                        onChange={(e) =>
                          updateRosterPlayerField('number', e.target.value, 'playerNumberShorts')
                        }
                        placeholder="10"
                        className="w-full px-2 min-h-9 rounded-xl bg-white border border-slate-300 text-sm font-black text-center text-slate-900"
                      />
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5">
                      {[
                        { panelId: 'right_leg', label: 'Pierna Der.' },
                        { panelId: 'left_leg', label: 'Pierna Izq.' },
                      ].map((leg) => {
                        const isActiveLeg =
                          Boolean(design.variableSlots?.playerNumberShorts?.enabled) &&
                          (design.variableSlots?.playerNumberShorts?.panel || 'right_leg') === leg.panelId;
                        return (
                          <button
                            key={leg.panelId}
                            type="button"
                            aria-pressed={isActiveLeg}
                            onClick={() => {
                              const sp = getPartSpec(design.productModelId, leg.panelId);
                              const u = sp?.defaultPlaceU ?? sp?.snapCenterU ?? 0.5;
                              const v = sp?.defaultPlaceV ?? 0.67;
                              onUpdateVariableSlot(
                                'playerNumberShorts',
                                {
                                  ...design.variableSlots?.playerNumberShorts,
                                  enabled: true,
                                  panel: leg.panelId,
                                  centerMm: {
                                    x: +((sp?.widthMm || 780) * u).toFixed(1),
                                    y: +((sp?.heightMm || 630) * v).toFixed(1),
                                  },
                                },
                                true
                              );
                              onCameraFocus?.('front');
                            }}
                            className={`flex-1 min-h-9 px-2 rounded-xl text-[11px] font-bold border cursor-pointer transition-colors ${
                              isActiveLeg
                                ? 'arza-btn-glass-green'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                            }`}
                          >
                            {leg.label}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        aria-pressed={!design.variableSlots?.playerNumberShorts?.enabled}
                        onClick={() =>
                          onUpdateVariableSlot(
                            'playerNumberShorts',
                            {
                              ...design.variableSlots?.playerNumberShorts,
                              enabled: !design.variableSlots?.playerNumberShorts?.enabled,
                            },
                            true
                          )
                        }
                        className={`min-h-9 px-2.5 rounded-xl text-[11px] font-bold border cursor-pointer ${
                          !design.variableSlots?.playerNumberShorts?.enabled
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Ocultar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {roster.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Previsualizar de tu lista ({roster.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {roster.slice(0, 8).map((r, rIdx) => {
                          const keeper = isGoalkeeperRole(r.role);
                          const isCur = rIdx === activeRosterIndex;
                          return (
                            <button
                              key={r.id || rIdx}
                              type="button"
                              aria-pressed={isCur}
                              onClick={() => onSelectRosterIndex?.(rIdx)}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer transition-colors ${
                                isCur
                                  ? 'bg-[#111111] text-white border-[#111111]'
                                  : keeper
                                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              #{r.number || '-'} {r.name || 'S/N'}
                              {keeper ? ' · Port.' : ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

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
                        onChange={(e) =>
                          updateRosterPlayerField('name', e.target.value.toUpperCase(), 'playerNameBack')
                        }
                        placeholder="Ej: RODRÍGUEZ"
                        className="w-full px-3 min-h-9 rounded-xl bg-white border border-slate-300 text-xs font-extrabold uppercase text-slate-900"
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
                        onChange={(e) =>
                          updateRosterPlayerField('number', e.target.value, 'playerNumberBack')
                        }
                        placeholder="10"
                        className="w-full px-2 min-h-9 rounded-xl bg-white border border-slate-300 text-sm font-black text-center text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Interruptores rápidos para encender/apagar dorsales visibles */}
                  <div className="flex flex-wrap items-center gap-1">
                    {[
                      { key: 'playerNameBack', label: 'Nombre espalda', cam: 'back' },
                      { key: 'playerNumberBack', label: 'Nº espalda', cam: 'back' },
                      { key: 'playerNumberFront', label: 'Nº pecho', cam: 'front' },
                      ...(hasSleeves
                        ? [{ key: 'playerNumberSleeve', label: 'Nº manga', cam: 'right_sleeve' }]
                        : []),
                    ]
                      .filter((item) => Boolean(design.variableSlots?.[item.key]))
                      .map((item) => {
                        const enabled = Boolean(design.variableSlots?.[item.key]?.enabled);
                        return (
                          <button
                            key={item.key}
                            type="button"
                            aria-pressed={enabled}
                            onClick={() => {
                              onUpdateVariableSlot(
                                item.key,
                                { ...design.variableSlots[item.key], enabled: !enabled },
                                true
                              );
                              if (!enabled && !isAccessory) {
                                onCameraFocus?.(item.cam);
                              }
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border inline-flex items-center gap-1 cursor-pointer transition-colors ${
                              enabled
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-400'
                                : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
                            }`}
                          >
                            {enabled && <Check className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />}
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-0.5">
                <label htmlFor={dorsalColorId} className="text-[11px] font-bold text-slate-700">
                  Color dorsal ({activeDorsalFillHex})
                </label>
                <div className="flex items-center gap-1.5">
                  {DORSAL_QUICK_COLORS.map((dc) => {
                    const active = activeDorsalFillHex === dc.hex.toUpperCase();
                    const darkCheck = computeOwayoAutoContrastHex(dc.hex) === '#101820';
                    return (
                      <button
                        key={dc.hex}
                        type="button"
                        aria-label={`Color dorsal ${dc.label}`}
                        aria-pressed={active}
                        onClick={() => applyDorsalColor(dc.hex, true)}
                        className={`w-6 h-6 rounded-lg border-2 cursor-pointer transition-transform flex items-center justify-center ${
                          active ? 'border-emerald-700 scale-110 shadow-xs' : 'border-slate-300'
                        }`}
                        style={{ backgroundColor: dc.hex }}
                      >
                        {active && (
                          <Check
                            className={`w-3 h-3 ${darkCheck ? 'text-slate-900' : 'text-white'}`}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })}
                  <input
                    id={dorsalColorId}
                    type="color"
                    aria-label="Color exacto de dorsal"
                    value={activeDorsalSlot?.fillHex || '#ffffff'}
                    onChange={(e) => applyDorsalColor(e.target.value, false)}
                    className="w-7 h-6 rounded-md border border-slate-300 cursor-pointer bg-white shrink-0"
                  />
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-700 block mb-1">
                  Tipografía deportiva ({SPORT_FONTS.length})
                </span>
                <div className="grid grid-cols-3 gap-1.5 max-h-[82px] overflow-y-auto pr-0.5">
                  {SPORT_FONTS.map((f) => {
                    const isFontSel = activeDorsalFont === f.family;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        aria-pressed={isFontSel}
                        style={{ fontFamily: f.family }}
                        onClick={() => applyDorsalFont(f.family)}
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
                  {isShorts ? 'Añadir texto o sponsor al short' : 'Añadir texto o sponsor al pecho'}
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id={customTextInputId}
                    type="text"
                    value={customTextDraft}
                    onChange={(e) => setCustomTextDraft(e.target.value)}
                    placeholder="Ej: GRUPO ZAVA o TU CLUB"
                    className="flex-1 px-3 min-h-9 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900"
                  />
                  <button
                    type="submit"
                    className="px-3 min-h-9 rounded-xl arza-pill-glass-green text-xs font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
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
                      className="p-2 rounded-xl bg-white/90 border border-slate-200 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">{td.text}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {['#ffffff', '#111111', '#fa5400', '#facc15'].map((txHex) => {
                            const activeTxColor = (td.fillHex || '#ffffff').toUpperCase() === txHex.toUpperCase();
                            return (
                              <button
                                key={txHex}
                                type="button"
                                aria-label={`Color texto ${txHex}`}
                                aria-pressed={activeTxColor}
                                onClick={() =>
                                  onUpdateDecal(
                                    td.id,
                                    {
                                      fillHex: txHex,
                                      outlineHex: computeOwayoAutoContrastHex(txHex),
                                    },
                                    true
                                  )
                                }
                                className={`w-4 h-4 rounded-full border cursor-pointer ${
                                  activeTxColor ? 'ring-2 ring-emerald-700 border-emerald-800' : 'border-slate-300'
                                }`}
                                style={{ backgroundColor: txHex }}
                              />
                            );
                          })}
                          <button
                            type="button"
                            aria-label={`Reducir tamaño de texto ${td.text}`}
                            onClick={() =>
                              onUpdateDecal(
                                td.id,
                                { scale: Math.max(0.45, +((td.scale ?? 1) - 0.15).toFixed(2)) },
                                true
                              )
                            }
                            className="px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[11px] font-bold cursor-pointer"
                          >
                            −
                          </button>
                          <button
                            type="button"
                            aria-label={`Aumentar tamaño de texto ${td.text}`}
                            onClick={() =>
                              onUpdateDecal(
                                td.id,
                                { scale: Math.min(2.0, +((td.scale ?? 1) + 0.15).toFixed(2)) },
                                true
                              )
                            }
                            className="px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[11px] font-bold cursor-pointer"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            aria-label={`Eliminar texto ${td.text}`}
                            onClick={() => onDeleteDecal(td.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      {!isAccessory && (
                        <div className="flex flex-wrap gap-1">
                          {spotOptions.slice(0, 3).map((spot) => {
                            const activeSpot = isSpotActiveForDecal(td, spot.id);
                            return (
                              <button
                                key={spot.id}
                                type="button"
                                aria-pressed={activeSpot}
                                onClick={() => placeDecalPresetSpot(td, spot.id)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                                  activeSpot
                                    ? 'bg-emerald-700 text-white'
                                    : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900'
                                }`}
                              >
                                {spot.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4C: Resumen de Lista de Nombres y Porteros */}
            <div className="p-3 rounded-2xl arza-pill-glass-green flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                    <span>
                      Pedido Total: {totalUnits} prendas ({rosterComposition.playerUnits} Jug. + {rosterComposition.keeperUnits} Port.)
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 truncate mt-0.5">
                    {currentTierLabel} • ${unitPrice.toFixed(2)} USD c/u
                  </p>
                  {rosterSizeSummary && (
                    <p className="text-[10px] font-mono text-emerald-900/80 truncate mt-0.5">
                      {rosterSizeSummary}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => navigateToStep(1)}
                  className="px-3 min-h-9 rounded-xl bg-white/90 hover:bg-white text-slate-900 border border-emerald-300 text-xs font-bold cursor-pointer"
                >
                  ← Editar en Paso 1
                </button>
                <button
                  type="button"
                  onClick={onOpenRosterModal}
                  className="px-3 min-h-9 rounded-xl bg-white/90 hover:bg-white text-emerald-900 border border-emerald-300 text-xs font-bold cursor-pointer"
                >
                  Editar Tallas →
                </button>
              </div>
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
                  ? 'Siguiente: Diseño y Tela'
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
