import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Shirt, X } from 'lucide-react';
import { ENGINE_PRODUCTS } from '../engine/core/designStore';
import { getProductMedia } from '../data/productMediaRegistry';

const APPAREL_PRODUCTS = ENGINE_PRODUCTS.filter(
  (item) => !['accessory', 'jacket'].includes(item.garmentCategory)
);

const SPORT_FILTERS = [
  { id: 'all', label: `Todos (${APPAREL_PRODUCTS.length})` },
  { id: 'Fútbol', label: 'Fútbol' },
  { id: 'Baloncesto', label: 'Baloncesto' },
  { id: 'E-Sports', label: 'E-Sports' },
];

const GENDER_FILTERS = [
  { id: 'all', label: 'Todos los Cortes' },
  { id: 'men', label: 'Caballero' },
  { id: 'women', label: 'Dama' },
];

export default function ProductCatalog({
  sportFilter = 'all',
  genderFilter = 'all',
  searchQuery = '',
  onChangeSportFilter,
  onChangeGenderFilter,
  onClearSearch,
  onSelectProduct,
  onOpenQuote,
}) {
  const [viewMode, setViewMode] = useState('shelf');
  const [announcement, setAnnouncement] = useState('');
  const trackRef = useRef(null);
  const currentSlideRef = useRef(0);
  const pendingTargetRef = useRef(null);
  const settleTimerRef = useRef(null);
  const userInitiatedRef = useRef(false);

  const isFiltered =
    sportFilter !== 'all' || genderFilter !== 'all' || searchQuery.trim().length > 0;
  const effectiveMode = isFiltered ? 'grid' : viewMode;

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return APPAREL_PRODUCTS.filter((item) => {
      if (sportFilter !== 'all' && item.sport !== sportFilter) return false;
      if (genderFilter !== 'all') {
        if (genderFilter === 'women' && item.id === 'football_shorts_fp3') return true;
        if (item.gender !== genderFilter) return false;
      }
      if (q) {
        const haystack = `${item.name} ${item.sport} ${item.badge} ${item.owayoCutCode || ''} ${
          item.gender === 'women' ? 'dama mujer' : 'caballero hombre'
        }`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [sportFilter, genderFilter, searchQuery]);

  const computeNearestSlide = (track) => {
    const children = [...track.children];
    if (children.length === 0) return 0;
    const scrollLeft = track.scrollLeft;
    let bestIdx = 0;
    let bestDist = Infinity;
    children.forEach((child, idx) => {
      const dist = Math.abs(child.offsetLeft - scrollLeft);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    });
    return bestIdx;
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track || effectiveMode !== 'shelf') return undefined;

    const handleSettle = () => {
      const settledIdx = computeNearestSlide(track);
      if (pendingTargetRef.current !== null && settledIdx !== pendingTargetRef.current) {
        return;
      }
      pendingTargetRef.current = null;
      if (userInitiatedRef.current && settledIdx !== currentSlideRef.current) {
        currentSlideRef.current = settledIdx;
        setAnnouncement(`Prenda ${settledIdx + 1} de ${filteredProducts.length}`);
      } else {
        currentSlideRef.current = settledIdx;
      }
    };

    const onPointerOrKey = () => {
      userInitiatedRef.current = true;
    };

    const supportsScrollEnd = 'onscrollend' in window;
    const onScrollFallback = () => {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = setTimeout(handleSettle, 140);
    };

    track.addEventListener('pointerdown', onPointerOrKey, { passive: true });
    track.addEventListener('wheel', onPointerOrKey, { passive: true });
    if (supportsScrollEnd) {
      track.addEventListener('scrollend', handleSettle);
    } else {
      track.addEventListener('scroll', onScrollFallback, { passive: true });
    }

    return () => {
      clearTimeout(settleTimerRef.current);
      track.removeEventListener('pointerdown', onPointerOrKey);
      track.removeEventListener('wheel', onPointerOrKey);
      if (supportsScrollEnd) {
        track.removeEventListener('scrollend', handleSettle);
      } else {
        track.removeEventListener('scroll', onScrollFallback);
      }
    };
  }, [effectiveMode, filteredProducts.length]);

  const handleSlideStep = (direction) => {
    const track = trackRef.current;
    if (!track || filteredProducts.length === 0) return;

    userInitiatedRef.current = true;
    const baseIdx =
      pendingTargetRef.current !== null ? pendingTargetRef.current : computeNearestSlide(track);
    const total = filteredProducts.length;
    const nextIdx = (baseIdx + direction + total) % total;
    pendingTargetRef.current = nextIdx;

    const targetChild = track.children[nextIdx];
    if (!targetChild) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({
      left: targetChild.offsetLeft,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <section
      id="drops-catalog"
      aria-roledescription={effectiveMode === 'shelf' ? 'carousel' : undefined}
      aria-label="Catálogo Oficial ARZA SPORT"
      className="scroll-mt-20 py-10 sm:py-16 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto bg-white"
    >
      {/* Cabecera estilo Nike MX ("Lo Nuevo" / Carrusel + Ver todo) */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-medium text-[#111111]">
            Elige tu Prenda ({filteredProducts.length})
          </h2>
          <p className="text-sm text-[#707072] mt-0.5">
            Modelos técnicos para fútbol, baloncesto y e-sports · Corte Caballero y Dama
          </p>
        </div>

        {/* Controles previos al track en DOM (estilo circular Nike MX) */}
        <div className="flex items-center gap-3">
          {!isFiltered && (
            <button
              type="button"
              onClick={() => setViewMode((m) => (m === 'shelf' ? 'grid' : 'shelf'))}
              className="text-sm font-medium text-[#111111] hover:text-[#707072] transition-colors cursor-pointer"
            >
              {effectiveMode === 'shelf'
                ? `Ver todo (${APPAREL_PRODUCTS.length})`
                : 'Vista carrusel'}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenQuote}
            className="hidden sm:inline-flex arza-btn-outline px-4 py-1.5 text-xs font-medium items-center cursor-pointer"
          >
            Cotizar Equipo
          </button>

          {effectiveMode === 'shelf' && filteredProducts.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSlideStep(-1)}
                aria-label="Prenda anterior"
                className="w-10 h-10 rounded-full bg-[#F5F5F5] hover:bg-[#CACACB] text-[#111111] flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => handleSlideStep(1)}
                aria-label="Siguiente prenda"
                className="w-10 h-10 rounded-full bg-[#F5F5F5] hover:bg-[#CACACB] text-[#111111] flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filtros Minimalistas Blancos/Gris Nike MX */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-7 pb-5 border-b border-[#E5E5E5]">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por deporte">
          {SPORT_FILTERS.map((sp) => (
            <button
              key={sp.id}
              type="button"
              onClick={() => onChangeSportFilter?.(sp.id)}
              aria-pressed={sportFilter === sp.id}
              className={`px-4 min-h-9 rounded-full text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                sportFilter === sp.id
                  ? 'bg-[#111111] text-white'
                  : 'bg-[#F5F5F5] text-[#111111] hover:bg-[#E5E5E5]'
              }`}
            >
              {sp.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {searchQuery.trim() && (
            <button
              type="button"
              onClick={onClearSearch}
              className="px-3.5 min-h-9 rounded-full bg-[#111111] text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Buscando: &ldquo;{searchQuery.trim()}&rdquo;</span>
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}

          <div
            className="inline-flex items-center p-1 rounded-full bg-[#F5F5F5]"
            role="group"
            aria-label="Filtrar por corte"
          >
            {GENDER_FILTERS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => onChangeGenderFilter?.(g.id)}
                aria-pressed={genderFilter === g.id}
                className={`px-3.5 min-h-8 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  genderFilter === g.id
                    ? 'bg-white text-[#111111] shadow-xs'
                    : 'text-[#707072] hover:text-[#111111]'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Carrusel Horizontal Nike MX o Grid Completo sin bordes redondeados */}
      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center bg-[#F5F5F5]">
          <p className="text-base font-medium text-[#111111]">
            No encontramos prendas para esa combinación.
          </p>
          <button
            type="button"
            onClick={() => {
              onChangeSportFilter?.('all');
              onChangeGenderFilter?.('all');
              onClearSearch?.();
            }}
            className="mt-4 arza-btn-dark px-6 py-2 text-sm font-medium inline-flex items-center cursor-pointer"
          >
            Mostrar las {APPAREL_PRODUCTS.length} prendas
          </button>
        </div>
      ) : (
        <div
          ref={trackRef}
          tabIndex={effectiveMode === 'shelf' ? 0 : undefined}
          role={effectiveMode === 'shelf' ? 'group' : undefined}
          aria-label={effectiveMode === 'shelf' ? 'Prendas ARZA SPORT' : undefined}
          className={
            effectiveMode === 'shelf'
              ? 'arza-carousel-track pb-4'
              : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-8'
          }
        >
          {filteredProducts.map((item, idx) => {
            const media = getProductMedia(item.id);
            const isWomen = item.gender === 'women';
            return (
              <article
                key={item.id}
                role={effectiveMode === 'shelf' ? 'group' : undefined}
                aria-roledescription={effectiveMode === 'shelf' ? 'slide' : undefined}
                aria-label={
                  effectiveMode === 'shelf'
                    ? `${idx + 1} de ${filteredProducts.length}`
                    : undefined
                }
                className={`${
                  effectiveMode === 'shelf' ? 'arza-shelf-slide' : ''
                } group bg-white flex flex-col`}
              >
                <button
                  type="button"
                  onClick={() => onSelectProduct(item.id)}
                  aria-label={`Personalizar ${item.name}`}
                  className="w-full aspect-[4/3] bg-[#F5F5F5] rounded-none overflow-hidden mb-3 block cursor-pointer"
                >
                  {media.image ? (
                    <img
                      src={media.image}
                      alt={item.name}
                      className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#707072]">
                      <Shirt className="w-12 h-12" aria-hidden="true" />
                    </div>
                  )}
                </button>

                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#9E3500]">
                    <span>{media.tag || item.owayoCutCode}</span>
                    <span className="font-mono text-[11px] text-[#707072]">
                      {item.owayoCutCode}
                    </span>
                  </div>

                  <h3 className="mt-1 text-base font-medium text-[#111111] leading-snug">
                    {item.name}
                  </h3>

                  <p className="text-sm text-[#707072]">
                    {item.sport} · {isWomen ? 'Corte Dama' : 'Corte Caballero'}
                  </p>

                  <div className="mt-3 pt-2 flex items-center justify-between gap-3 mt-auto">
                    <span className="text-base font-semibold text-[#111111] tabular-nums-pro">
                      ${item.basePrice.toFixed(2)} USD
                    </span>

                    <button
                      type="button"
                      onClick={() => onSelectProduct(item.id)}
                      className="arza-btn-dark px-5 py-1.5 text-xs font-medium inline-flex items-center justify-center cursor-pointer"
                    >
                      Personalizar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {effectiveMode === 'shelf' && (
        <p className="visually-hidden" role="status" aria-live="polite">
          {announcement}
        </p>
      )}
    </section>
  );
}
