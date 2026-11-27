import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import ProductThumb from '../brand/ProductThumb';
import {
  GLOVE_PAIR_UNIT_PRICE,
  GLOVE_SIZE_OPTIONS,
  ROSTER_CUT_OPTIONS,
  ROSTER_SIZE_OPTIONS,
  VOLUME_TIERS,
  calculateStudioGrandTotal,
  parseRosterQuickLines,
  sortRosterForDisplay,
} from '../../engine/core/designStore';

/**
 * Ventana dedicada exclusivamente para configurar la Lista de Jugadores, Portero (Manga Larga)
 * y tallas — reutilizada tanto al elegir un producto en tienda (Paso 1 previo al 3D) como
 * desde el editor dentro del Studio.
 */
export default function RosterWindowModal({
  isOpen,
  onClose,
  mode = 'studio',
  product,
  genderModule = 'men',
  roster = [],
  onUpdateRoster,
  activeRosterIndex = 0,
  onSelectRosterIndex,
  onSwitchKitRole,
  includeGloves = false,
  glovesUnitPrice = GLOVE_PAIR_UNIT_PRICE,
  onToggleIncludeGloves,
  onConfirmGoToDesign,
  onToast,
}) {
  const [confirmStep, setConfirmStep] = useState('edit'); // 'edit' | 'confirm' (pre_studio)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [csvQuickInput, setCsvQuickInput] = useState('');
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const isPreStudio = mode === 'pre_studio';

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }

    const handleNativeClose = () => {
      setConfirmStep('edit');
      onCloseRef.current?.();
    };
    dialog.addEventListener('close', handleNativeClose);

    const handleBackdropClick = (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!inside) dialog.close();
    };

    if (!('closedBy' in dialog)) {
      dialog.addEventListener('click', handleBackdropClick);
    }

    return () => {
      dialog.removeEventListener('close', handleNativeClose);
      dialog.removeEventListener('click', handleBackdropClick);
    };
  }, [isOpen]);

  const rawUnits = useMemo(
    () => roster.reduce((sum, r) => sum + Math.max(1, Number(r?.qty) || 1), 0),
    [roster]
  );
  const currentTier = useMemo(
    () => VOLUME_TIERS.find((t) => rawUnits >= t.min && rawUnits <= t.max) || VOLUME_TIERS[0],
    [rawUnits]
  );
  const basePrice = Number(product?.basePrice) || 34;
  const resolvedUnitPrice = +(basePrice * (1 - currentTier.discountPct / 100)).toFixed(2);

  const totals = useMemo(
    () =>
      calculateStudioGrandTotal({
        roster,
        product,
        unitPrice: resolvedUnitPrice,
        includeGloves,
        glovesUnitPrice,
      }),
    [roster, product, resolvedUnitPrice, includeGloves, glovesUnitPrice]
  );

  const isSoccerProduct = totals.isSoccer;
  const orderedRoster = useMemo(
    () => sortRosterForDisplay(roster, isSoccerProduct),
    [roster, isSoccerProduct]
  );

  const handleClose = () => {
    setConfirmStep('edit');
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    } else {
      onClose?.();
    }
  };

  const handleImportCsvRoster = () => {
    const defaultCut = genderModule === 'women' ? 'WOMEN_FIT' : 'MEN_PRO_SLIM';
    const parsed = parseRosterQuickLines(csvQuickInput, defaultCut);
    if (parsed.length === 0) return;
    onUpdateRoster?.([...roster, ...parsed]);
    setCsvQuickInput('');
    onToast?.(`${parsed.length} filas importadas a la lista`);
  };

  const addRosterRow = (role = 'Jugador') => {
    const nextIdx = roster.length;
    const isKeeper = role === 'Portero';
    onUpdateRoster?.([
      ...roster,
      {
        id: `${isKeeper ? 'pk' : 'p'}_${Date.now()}`,
        name: '',
        number: '',
        size: 'L',
        cut: genderModule === 'women' ? 'WOMEN_FIT' : 'MEN_PRO_SLIM',
        qty: 1,
        role: isKeeper ? 'Portero' : 'Jugador',
        ...(isKeeper ? { gloveSize: '9' } : {}),
      },
    ]);
    if (isSoccerProduct) {
      onSwitchKitRole?.(isKeeper ? 'goalkeeper' : 'field');
    }
    onSelectRosterIndex?.(nextIdx);
  };

  const subtitleText = isPreStudio
    ? confirmStep === 'confirm'
      ? 'Confirmar Paso 1 antes del diseño 3D'
      : 'Paso 1 de 4 · Configura Jugadores antes de diseñar'
    : isSoccerProduct
    ? 'Ventana de Jugadores y Portero (Manga Larga 3D)'
    : 'Ventana de Lista y Tallas';

  const headingText = isPreStudio && confirmStep === 'confirm'
    ? '¿Confirmas tu lista para pasar al Diseño 3D?'
    : isSoccerProduct
    ? `Lista de Jugadores y Portero (${totals.totalUnits} ${totals.totalUnits === 1 ? 'prenda' : 'prendas'})`
    : `Lista de Prendas (${totals.totalUnits} ${totals.totalUnits === 1 ? 'prenda' : 'prendas'})`;

  return (
    <dialog
      ref={dialogRef}
      id={isPreStudio ? 'pre-studio-roster-dialog' : 'studio-roster-dialog'}
      closedby="any"
      aria-labelledby={titleId}
      className="p-0 rounded-3xl bg-white/95 backdrop-blur-xl text-slate-900 border border-slate-200 max-w-2xl w-full shadow-2xl m-auto backdrop:bg-slate-950/50 backdrop:backdrop-blur-xs"
    >
      <div className="p-5 sm:p-6 flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-mono text-emerald-700 uppercase tracking-widest block font-bold">
              {subtitleText}
            </span>
            <h2 id={titleId} className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
              {headingText}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar ventana"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-colors shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pt-4">
          {isPreStudio && confirmStep === 'confirm' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                {product && (
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-200/80">
                    <ProductThumb product={product} className="w-12 h-12 rounded-xl shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-slate-900 truncate">{product.name}</div>
                      <div className="text-[11px] text-slate-600">
                        {currentTier.label} · ${resolvedUnitPrice.toFixed(2)} USD c/u
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-emerald-800 tabular-nums-pro">
                        ${totals.grandTotal.toFixed(2)} USD
                      </div>
                      <div className="text-[10px] font-semibold text-slate-500">
                        {totals.totalUnits} {totals.totalUnits === 1 ? 'prenda' : 'prendas'}
                      </div>
                      {totals.glovePairs > 0 && (
                        <div className="text-[10px] font-bold text-amber-800 tabular-nums-pro">
                          ${Math.max(0, totals.grandTotal - totals.glovePairs * glovesUnitPrice).toFixed(2)} prendas + ${(totals.glovePairs * glovesUnitPrice).toFixed(2)} guantes
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {orderedRoster.map(({ row, origIdx, isKeeper, displayLabel }) => (
                    <span
                      key={row.id || origIdx}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        isKeeper
                          ? 'bg-amber-50 text-amber-950 border-amber-300'
                          : 'bg-white text-slate-800 border-slate-200'
                      }`}
                    >
                      {displayLabel} · {row.size || 'L'}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="leading-relaxed">
                  Autoriza tu lista de jugadores y tallas para entrar directamente al{' '}
                  <strong>Paso 2: Elegir Diseño</strong> en el estudio 3D. Podrás editar los nombres y tallas después en cualquier momento.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  id="btn-prestudio-back-edit"
                  onClick={() => setConfirmStep('edit')}
                  className="flex-1 min-h-11 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  <span>Volver a editar lista</span>
                </button>
                <button
                  type="button"
                  id="btn-prestudio-confirm-go-design"
                  onClick={() => {
                    setConfirmStep('edit');
                    onConfirmGoToDesign?.();
                  }}
                  className="flex-1 min-h-11 px-4 rounded-xl arza-btn-glass-green text-xs font-black inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Sí, ir al Diseño 3D (Paso 2)</span>
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Banner del producto seleccionado en Pre-Studio (antes del visor 3D) */}
              {isPreStudio && product && (
                <div className="p-2.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ProductThumb product={product} className="w-11 h-11 rounded-xl shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono font-bold text-emerald-800 uppercase">
                        Producto seleccionado
                      </div>
                      <div className="text-xs font-black text-slate-900 truncate">{product.name}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 border border-slate-300 text-[11px] font-bold shrink-0 cursor-pointer"
                  >
                    Cambiar prenda
                  </button>
                </div>
              )}

              {/* Resumen Jugadores vs Portero Manga Larga + Tarifa */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 font-black tabular-nums-pro">
                    {isSoccerProduct ? `${totals.playerUnits} Jugadores` : `${totals.totalUnits} Prendas`}
                  </span>
                  {isSoccerProduct && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300 font-black tabular-nums-pro">
                      {totals.keeperUnits} Portero M.L.
                    </span>
                  )}
                  {isSoccerProduct && totals.glovePairs > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-black tabular-nums-pro">
                      +{totals.glovePairs} Guantes
                    </span>
                  )}
                </div>
                <span className="text-xs font-black text-slate-900 tabular-nums-pro">
                  ${totals.grandTotal.toFixed(2)} USD
                </span>
              </div>

              {isSoccerProduct && totals.keeperUnits > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-50/80 border border-amber-200 text-xs font-bold text-amber-950">
                  <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={includeGloves}
                      onChange={(e) => onToggleIncludeGloves?.(e.target.checked)}
                      className="w-4 h-4 accent-[#fa5400] cursor-pointer shrink-0"
                    />
                    <span className="truncate">
                      Incluir Guantes 3D de Portero (+${GLOVE_PAIR_UNIT_PRICE} USD / par)
                    </span>
                  </label>
                  {includeGloves && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold uppercase text-amber-900">Talla:</span>
                      <select
                        aria-label="Talla guantes portero"
                        value={
                          roster.find((r) => (r?.role || '').toLowerCase() === 'portero')?.gloveSize || '9'
                        }
                        onChange={(e) => {
                          const nextSize = e.target.value;
                          onUpdateRoster?.(
                            roster.map((r) =>
                              (r?.role || '').toLowerCase() === 'portero'
                                ? { ...r, gloveSize: nextSize }
                                : r
                            )
                          );
                        }}
                        className="h-7 px-1.5 rounded-lg bg-white border border-amber-300 text-[11px] font-black text-amber-950 cursor-pointer"
                      >
                        {GLOVE_SIZE_OPTIONS.map((gs) => (
                          <option key={gs} value={gs}>
                            T{gs}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Lista minimalista en 1 sola hilera: Participante | Nombre | Nº | Talla | Rol | Vista/Quitar */}
              <div className="space-y-1.5 max-h-[38dvh] overflow-y-auto pr-0.5">
                <div className="flex items-center gap-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <span className="w-24 sm:w-28 shrink-0">Participante</span>
                  <span className="flex-1">Nombre en camisa</span>
                  <span className="w-12 sm:w-14 shrink-0 text-center">Nº</span>
                  <span className="w-[66px] sm:w-[70px] shrink-0">Talla</span>
                  {isSoccerProduct && <span className="w-[84px] sm:w-[90px] shrink-0 text-center">Rol</span>}
                  <span className="w-10 shrink-0 text-right">{isPreStudio ? 'Quitar' : 'Vista'}</span>
                </div>

                {orderedRoster.map(({ row, origIdx, isKeeper, displayLabel }) => {
                  const isPreviewed = !isPreStudio && origIdx === activeRosterIndex;
                  return (
                    <div
                      key={row.id || origIdx}
                      className={`flex items-center gap-1.5 p-2 rounded-xl border transition-colors ${
                        isKeeper
                          ? 'bg-amber-50/75 border-amber-300'
                          : isPreviewed
                          ? 'bg-emerald-50/50 border-emerald-400'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-24 sm:w-28 shrink-0 text-[11px] font-black truncate ${
                          isKeeper ? 'text-[#C24100]' : 'text-slate-700'
                        }`}
                      >
                        {displayLabel}
                      </span>

                      <input
                        type="text"
                        aria-label={`Nombre ${displayLabel}`}
                        value={row.name || ''}
                        onFocus={() => onSelectRosterIndex?.(origIdx)}
                        onChange={(e) =>
                          onUpdateRoster?.(
                            roster.map((r, i) =>
                              i === origIdx ? { ...r, name: e.target.value.toUpperCase() } : r
                            )
                          )
                        }
                        placeholder="En blanco"
                        className="flex-1 min-w-0 px-2 h-9 rounded-lg bg-white border border-slate-300 text-xs font-extrabold uppercase text-slate-900 placeholder:normal-case placeholder:font-medium placeholder:text-slate-400"
                      />

                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={3}
                        aria-label={`Número ${displayLabel}`}
                        value={row.number || ''}
                        onFocus={() => onSelectRosterIndex?.(origIdx)}
                        onChange={(e) =>
                          onUpdateRoster?.(
                            roster.map((r, i) =>
                              i === origIdx ? { ...r, number: e.target.value.slice(0, 3) } : r
                            )
                          )
                        }
                        placeholder="Nº"
                        className="w-12 sm:w-14 h-9 px-1 rounded-lg bg-white border border-slate-300 text-xs font-black text-center text-slate-900 placeholder:font-semibold placeholder:text-slate-400 shrink-0"
                      />

                      <select
                        aria-label={`Talla ${displayLabel}`}
                        value={row.size || 'L'}
                        onChange={(e) =>
                          onUpdateRoster?.(
                            roster.map((r, i) => (i === origIdx ? { ...r, size: e.target.value } : r))
                          )
                        }
                        className="w-[66px] sm:w-[70px] px-1 h-9 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900 shrink-0 cursor-pointer"
                      >
                        {ROSTER_SIZE_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>

                      {isSoccerProduct && (
                        <div className="w-[84px] sm:w-[90px] shrink-0 inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                          <button
                            type="button"
                            aria-pressed={!isKeeper}
                            onClick={() => {
                              onUpdateRoster?.(
                                roster.map((r, i) => (i === origIdx ? { ...r, role: 'Jugador' } : r))
                              );
                              onSwitchKitRole?.('field', origIdx);
                              onSelectRosterIndex?.(origIdx);
                            }}
                            className={`flex-1 py-1.5 rounded-md text-[10px] font-bold cursor-pointer ${
                              !isKeeper ? 'bg-[#111111] text-white' : 'text-slate-600'
                            }`}
                          >
                            Jug.
                          </button>
                          <button
                            type="button"
                            aria-pressed={isKeeper}
                            onClick={() => {
                              onUpdateRoster?.(
                                roster.map((r, i) =>
                                  i === origIdx
                                    ? { ...r, role: 'Portero', gloveSize: r.gloveSize || '9' }
                                    : r
                                )
                              );
                              onSwitchKitRole?.('goalkeeper', origIdx);
                              onSelectRosterIndex?.(origIdx);
                            }}
                            className={`flex-1 py-1.5 rounded-md text-[10px] font-bold cursor-pointer ${
                              isKeeper ? 'bg-[#C24100] text-white' : 'text-slate-600'
                            }`}
                          >
                            Port.
                          </button>
                        </div>
                      )}

                      <div className="w-12 shrink-0 flex items-center justify-end gap-1">
                        {!isPreStudio && (
                          <button
                            type="button"
                            title="Ver en visor 3D"
                            aria-label={`Ver ${displayLabel} en 3D`}
                            onClick={() => {
                              onSelectRosterIndex?.(origIdx);
                              if (isSoccerProduct) {
                                onSwitchKitRole?.(isKeeper ? 'goalkeeper' : 'field');
                              }
                            }}
                            className={`p-1.5 rounded-lg cursor-pointer ${
                              isPreviewed
                                ? 'bg-emerald-700 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        )}
                        {roster.length > 1 && (
                          <button
                            type="button"
                            aria-label={`Eliminar ${displayLabel}`}
                            onClick={() => {
                              const next = roster.filter((_, i) => i !== origIdx);
                              onUpdateRoster?.(next);
                              if (activeRosterIndex >= next.length) {
                                onSelectRosterIndex?.(Math.max(0, next.length - 1));
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botones directos para sumar Jugador o Portero Manga Larga */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => addRosterRow('Jugador')}
                  className="px-3.5 min-h-10 rounded-xl arza-pill-glass-green text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>{isSoccerProduct ? 'Añadir Jugador' : 'Añadir Integrante'}</span>
                </button>

                {isSoccerProduct && (
                  <button
                    type="button"
                    onClick={() => addRosterRow('Portero')}
                    className="px-3.5 min-h-10 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#C24100]" aria-hidden="true" />
                    <span>Añadir Portero (Manga Larga)</span>
                  </button>
                )}
              </div>

              {/* Opciones avanzadas colapsadas y montadas bajo demanda (corte anatómico, cantidad, talla guante o Excel) */}
              <details
                onToggle={(e) => setIsAdvancedOpen(e.currentTarget.open)}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-2.5 group"
              >
                <summary className="cursor-pointer list-none flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Opciones avanzadas (corte, cantidad, guantes o Excel)</span>
                  <ChevronDown
                    className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                {isAdvancedOpen && (
                  <div className="mt-3 space-y-3">
                    <div className="roster-table-wrapper rounded-xl border border-slate-200 bg-white">
                      <table className="roster-data-table text-xs text-left">
                        <thead className="bg-slate-50 text-slate-700 text-[10px] uppercase border-b border-slate-200">
                          <tr>
                            <th className="p-2">Participante</th>
                            <th className="p-2">Corte</th>
                            <th className="p-2">Cant.</th>
                            {isSoccerProduct && includeGloves && <th className="p-2">Guante</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {orderedRoster.map(({ row, origIdx, isKeeper, displayLabel }) => (
                            <tr key={row.id || origIdx}>
                              <td className="p-2 font-bold text-slate-800">{displayLabel}</td>
                              <td className="p-2">
                                <select
                                  aria-label={`Corte ${displayLabel}`}
                                  value={row.cut}
                                  onChange={(e) =>
                                    onUpdateRoster?.(
                                      roster.map((r, i) =>
                                        i === origIdx ? { ...r, cut: e.target.value } : r
                                      )
                                    )
                                  }
                                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800"
                                >
                                  {ROSTER_CUT_OPTIONS.map((c) => (
                                    <option key={c.value} value={c.value}>
                                      {c.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  aria-label={`Cantidad ${displayLabel}`}
                                  min="1"
                                  max="999"
                                  value={row.qty}
                                  onChange={(e) =>
                                    onUpdateRoster?.(
                                      roster.map((r, i) =>
                                        i === origIdx
                                          ? { ...r, qty: Math.max(1, Number(e.target.value) || 1) }
                                          : r
                                      )
                                    )
                                  }
                                  className="w-14 bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 font-mono"
                                />
                              </td>
                              {isSoccerProduct && includeGloves && (
                                <td className="p-2">
                                  {isKeeper ? (
                                    <select
                                      aria-label={`Talla guante ${displayLabel}`}
                                      value={row.gloveSize || '9'}
                                      onChange={(e) =>
                                        onUpdateRoster?.(
                                          roster.map((r, i) =>
                                            i === origIdx ? { ...r, gloveSize: e.target.value } : r
                                          )
                                        )
                                      }
                                      className="bg-amber-50 border border-amber-300 rounded-lg px-2 py-1 text-amber-950 font-bold"
                                    >
                                      {GLOVE_SIZE_OPTIONS.map((gs) => (
                                        <option key={gs} value={gs}>
                                          T{gs}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        Pegado rápido desde Excel / WhatsApp
                      </span>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <textarea
                          rows={2}
                          value={csvQuickInput}
                          onChange={(e) => setCsvQuickInput(e.target.value)}
                          placeholder={'PEREZ, 10, L, Jugador, 1\nLOPEZ, 1, XL, Portero, 1'}
                          className="flex-1 rounded-xl bg-white border border-slate-300 p-2 text-xs font-mono text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={handleImportCsvRoster}
                          className="px-4 py-2 rounded-xl arza-btn-glass-green font-black text-xs shrink-0 cursor-pointer"
                        >
                          Importar Filas
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </details>

              {isPreStudio ? (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 min-h-11 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold cursor-pointer shrink-0"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    id="btn-prestudio-next-step2"
                    onClick={() => setConfirmStep('confirm')}
                    className="flex-1 min-h-11 px-4 rounded-xl arza-btn-glass-green text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Siguiente: Elegir Diseño</span>
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  id="btn-confirm-roster-modal"
                  onClick={handleClose}
                  className="w-full min-h-11 rounded-xl arza-btn-glass-green text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>
                    Confirmar Lista ({totals.totalUnits} {totals.totalUnits === 1 ? 'prenda' : 'prendas'})
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
