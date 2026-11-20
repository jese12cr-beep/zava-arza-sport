import React, { useMemo, useState } from 'react';
import { ArrowRight, Shirt } from 'lucide-react';
import { ENGINE_PRODUCTS } from '../engine/core/designStore';
import { getProductMedia } from '../data/productMediaRegistry';

const SPORT_FILTERS = [
  { id: 'all', label: 'Todos (13)' },
  { id: 'Fútbol', label: 'Fútbol' },
  { id: 'Baloncesto', label: 'Baloncesto' },
  { id: 'Chaquetas', label: 'Chamarras' },
  { id: 'E-Sports', label: 'E-Sports' },
  { id: 'Accesorios', label: 'Accesorios' },
];

const GENDER_FILTERS = [
  { id: 'all', label: 'Todos los Cortes' },
  { id: 'men', label: 'Caballero' },
  { id: 'women', label: 'Dama' },
];

export default function ProductCatalog({ onSelectProduct, onOpenQuote }) {
  const [sportFilter, setSportFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');

  const filteredProducts = useMemo(() => {
    return ENGINE_PRODUCTS.filter((item) => {
      if (sportFilter !== 'all' && item.sport !== sportFilter) return false;
      if (genderFilter !== 'all') {
        if (item.garmentCategory === 'accessory') return false;
        if (genderFilter === 'women' && item.id === 'football_shorts_fp3') return true;
        if (item.gender !== genderFilter) return false;
      }
      return true;
    });
  }, [sportFilter, genderFilter]);

  return (
    <section id="drops-catalog" className="scroll-mt-28 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white">
      {/* Cabecera Editorial Minimalista */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-neutral-200">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C24100] block">
            Paso 1 Directo // Catálogo ARZA SPORT
          </span>
          <h2 className="font-display-hero font-extrabold uppercase text-[#111111] arza-section-headline">
            Elige tu Molde ({ENGINE_PRODUCTS.length})
          </h2>
          <p className="text-[#757575] text-sm sm:text-base max-w-2xl">
            Haz clic en cualquier prenda para saltar directo al Paso 2 (Diseño y Forma) sobre su modelo 3D.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenQuote}
          className="px-5 min-h-11 rounded-full border border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white text-xs font-semibold transition-colors cursor-pointer shrink-0 self-start md:self-auto"
        >
          Solicitar Cotización de Club
        </button>
      </div>

      {/* Filtros Limpios */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-10">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por deporte">
          {SPORT_FILTERS.map((sp) => (
            <button
              key={sp.id}
              type="button"
              onClick={() => setSportFilter(sp.id)}
              aria-pressed={sportFilter === sp.id}
              className={`px-4 min-h-10 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                sportFilter === sp.id
                  ? 'bg-neutral-950 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-950'
              }`}
            >
              {sp.label}
            </button>
          ))}
        </div>

        <div className="inline-flex items-center p-1 rounded-full bg-neutral-100 border border-neutral-200 self-start lg:self-auto" role="group" aria-label="Filtrar por corte">
          {GENDER_FILTERS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGenderFilter(g.id)}
              aria-pressed={genderFilter === g.id}
              className={`px-4 min-h-9 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                genderFilter === g.id
                  ? 'bg-white text-neutral-950 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-950'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Estilo Flagship Borderless */}
      <div className="catalog-fluid-grid">
        {filteredProducts.map((item) => {
          const media = getProductMedia(item.id);
          const isWomen = item.gender === 'women';
          return (
            <article
              key={item.id}
              className="catalog-subgrid-card arza-card group bg-white flex flex-col border-b border-neutral-200 pb-6"
            >
              {/* Contenedor Fotográfico Neutro */}
              <div className="relative aspect-[4/3] bg-neutral-100 rounded-xl overflow-hidden mb-4">
                {media.image ? (
                  <img
                    src={media.image}
                    alt={item.name}
                    className="w-full h-full object-cover object-center group-hover:scale-[1.04] transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <Shirt className="w-12 h-12" aria-hidden="true" />
                  </div>
                )}

                {item.owayoCutCode && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#111111] text-[#FA5400] text-[10px] font-mono font-bold tracking-wider">
                    {item.owayoCutCode}
                  </span>
                )}

                {media.tag && (
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-white/95 text-neutral-950 text-[10px] font-bold uppercase tracking-wider border border-neutral-200">
                    {media.tag}
                  </span>
                )}
              </div>

              {/* Contenido Editorial */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  <span>{item.sport}</span>
                  <span>
                    {item.garmentCategory === 'accessory'
                      ? 'Unisex'
                      : isWomen
                      ? 'Corte Dama'
                      : 'Corte Caballero'}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-neutral-950 leading-snug">
                  {item.name}
                </h3>

                <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2">
                  {media.desc || item.badge}
                </p>
              </div>

              {/* Precio y Acción */}
              <div className="flex items-center justify-between gap-3 pt-2 mt-auto">
                <div>
                  <span className="text-[11px] text-neutral-500 block">Desde</span>
                  <span className="text-lg font-extrabold text-neutral-950 tabular-nums-pro">
                    ${item.basePrice.toFixed(2)} USD
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectProduct(item.id)}
                  className="px-4 min-h-11 rounded-full arza-btn-glass-green text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Elegir Molde</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
