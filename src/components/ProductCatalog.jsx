import React, { useMemo, useState } from 'react';
import { ArrowRight, Shirt } from 'lucide-react';
import { ENGINE_PRODUCTS } from '../engine/core/designStore';
import { resolveAssetUrl } from '../utils/assetUrl';

const PRODUCT_MEDIA = {
  futbol_jersey_pro_vneck: {
    image: resolveAssetUrl('assets/showcase/futbol_f3_jersey.jpg'),
    tag: 'Molde Principal',
    desc: 'Jersey ZAVA Apex V1 con cuello ergonómico, tejido TS-Tex y 29 cortes de sublimación.',
  },
  futbol_jersey_f3w_women: {
    image: resolveAssetUrl('assets/stitch/football_celebration.png'),
    tag: 'Patronaje Dama',
    desc: 'Jersey ZAVA Femme V1 entallado para mujer con ajuste en cintura, sisa y hombros.',
  },
  football_shorts_fp3: {
    image: resolveAssetUrl('assets/showcase/shorts_fp3_matchday.jpg'),
    tag: 'Kit ZAVA Apex',
    desc: 'Short ZAVA Match S1 en tejido SR-Tex anti-fricción con pretina elástica y dorsal.',
  },
  basketball_b6_hero: {
    image: resolveAssetUrl('assets/showcase/basket_b6_men.jpg'),
    tag: 'Normativa FIBA',
    desc: 'Tank sin mangas ZAVA Court B1 en CoolDry™ Hex con 19 cortes deportivos configurables.',
  },
  basketball_shorts_bp6: {
    image: resolveAssetUrl('assets/stitch/basketball_arena.png'),
    tag: 'Corte Arena',
    desc: 'Short largo ZAVA Court SB1 con abertura lateral y costura reforzada de competición.',
  },
  basketball_b7w_epic_women: {
    image: resolveAssetUrl('assets/showcase/basket_b7w_women.jpg'),
    tag: '7 Paneles Dama',
    desc: 'Tank femenino ZAVA Femme BW1 con costados independientes y ribetes personalizables.',
  },
  basketball_shorts_bp7w_women: {
    image: resolveAssetUrl('assets/showcase/shorts_fp3_matchday.jpg'),
    tag: '7 Piezas Dama',
    desc: 'Short femenino ZAVA Femme SBW1 con bandas laterales y pretina anatómica.',
  },
  jacket_softshell_601m_men: {
    image: resolveAssetUrl('assets/showcase/jacket_601m_softshell.jpg'),
    tag: 'Concentración',
    desc: 'Chamarra Softshell ZAVA Shield J1 cortavientos 3 capas con 11 piezas sublimables.',
  },
  jacket_softshell_601w_women: {
    image: resolveAssetUrl('assets/showcase/jacket_601w_women.jpg'),
    tag: 'Corte Dama J1W',
    desc: 'Chamarra técnica ZAVA Femme JW1 térmica y transpirable adaptada a silueta femenina.',
  },
  esports_pro_jersey: {
    image: resolveAssetUrl('assets/stitch/ghost_mannequin.png'),
    tag: 'Torneos Gaming',
    desc: 'Jersey ZAVA Arena E1 ultraligero con gamertag individual y sponsors sin límite.',
  },
  cap_snapback_6panel: {
    image: resolveAssetUrl('assets/showcase/sample_fabric_box.jpg'),
    tag: 'Complemento',
    desc: 'Gorra estructurada ZAVA G1 de 6 paneles personalizada con el emblema de tu equipo.',
  },
  bottle_inox_laser_750: {
    image: resolveAssetUrl('assets/showcase/sample_fabric_box.jpg'),
    tag: 'Hidratación',
    desc: 'Termo deportivo acero inox ZAVA 750ml grabado con escudo y número de jugador.',
  },
  shinguards_carbon_pro: {
    image: resolveAssetUrl('assets/showcase/sample_fabric_box.jpg'),
    tag: 'Protección',
    desc: 'Espinilleras ligeras ZAVA P1 sublimadas a todo color con dorsal y escudo personal.',
  },
};

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
    <section id="drops-catalog" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white">
      {/* Cabecera Editorial Minimalista */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-neutral-200">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-600 block">
            Catálogo Oficial Zava // Serie ARZA
          </span>
          <h2 className="font-display-hero font-extrabold uppercase text-neutral-950 arza-section-headline">
            Moldes y Prendas Configurables ({ENGINE_PRODUCTS.length})
          </h2>
          <p className="text-neutral-600 text-sm sm:text-base max-w-2xl">
            Patronaje propietario ARZA SPORT en 3D interactivo y pliegos 2D 1:1 para Caballero, Dama y Equipos.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenQuote}
          className="px-5 min-h-11 rounded-full border border-neutral-950 text-neutral-950 hover:bg-neutral-950 hover:text-white text-xs font-semibold transition-colors cursor-pointer shrink-0 self-start md:self-auto"
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
          const media = PRODUCT_MEDIA[item.id] || {};
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
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-neutral-950 text-white text-[10px] font-mono font-bold tracking-wider">
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
                  className="px-4 min-h-11 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Configurar Molde</span>
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
