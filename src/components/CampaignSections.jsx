import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { resolveAssetUrl } from '../utils/assetUrl';

export default function CampaignSections({
  onSelectCategory,
  onSelectProduct,
}) {
  const trioRef = useRef(null);

  const essentials = [
    {
      id: 'caballero',
      title: 'Patronaje Caballero',
      caption: 'Corte recto profesional y manga ergonómica',
      image: resolveAssetUrl('assets/showcase/futbol_f3_jersey.jpg'),
      action: () => onSelectCategory?.('all', 'men'),
    },
    {
      id: 'dama',
      title: 'Patronaje Dama',
      caption: 'Silueta entallada en cintura, sisa y hombros',
      image: resolveAssetUrl('assets/showcase/futbol_f3w_women.jpg'),
      action: () => onSelectCategory?.('all', 'women'),
    },
    {
      id: 'shorts',
      title: 'Shorts Matchday',
      caption: 'Tela SR-Tex™ anti-fricción con pretina elástica',
      image: resolveAssetUrl('assets/showcase/shorts_fp3_matchday.jpg'),
      action: () => onSelectProduct?.('football_shorts_fp3'),
    },
  ];

  const handleTrioScroll = (dir) => {
    const track = trioRef.current;
    if (!track) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const step = Math.round(track.clientWidth * 0.8);
    track.scrollBy({ left: dir * step, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <>
      {/* Sección 2 estilo Nike MX: 3 Columnas Editoriales ("Esenciales para tu equipo") */}
      <section className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pb-14 sm:pb-20">
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 className="text-xl sm:text-2xl font-medium text-[#111111]">
            Esenciales para tu equipo
          </h2>
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => handleTrioScroll(-1)}
              aria-label="Tarjeta editorial anterior"
              className="w-10 h-10 rounded-full bg-[#F5F5F5] hover:bg-[#E5E5E5] text-[#111111] flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => handleTrioScroll(1)}
              aria-label="Siguiente tarjeta editorial"
              className="w-10 h-10 rounded-full bg-[#F5F5F5] hover:bg-[#E5E5E5] text-[#111111] flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div ref={trioRef} className="arza-editorial-trio">
          {essentials.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={card.action}
              className="group text-left bg-white focus-visible:outline-3 focus-visible:outline-[#FA5400] cursor-pointer"
            >
              <div className="w-full aspect-[4/3] bg-[#F5F5F5] rounded-none overflow-hidden mb-3">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="text-base sm:text-lg font-medium text-[#111111] leading-snug">
                {card.title}
              </div>
              <div className="text-sm text-[#707072] mt-0.5">{card.caption}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Sección 3 estilo Nike MX: Bloque Dividido 50/50 Edge-to-Edge */}
      <section aria-label="Líneas destacadas ARZA SPORT" className="w-full pb-16 sm:pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Mitad Izquierda: Fútbol */}
          <div className="relative aspect-[4/3] bg-[#111111] overflow-hidden rounded-none group">
            <img
              src={resolveAssetUrl('assets/showcase/campaign_split_futbol.jpg')}
              alt="Serie Fútbol Apex ARZA SPORT — Tejido micro-pore de competición"
              className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
              loading="lazy"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none"
            />
            <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10 text-white">
              <p className="text-sm sm:text-base font-medium text-white/95">
                Serie Apex Fútbol · ARZA-Z01M / Z01W
              </p>
              <h2 className="mt-1 font-display-hero text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
                TEJIDO MICRO-PORE Y CORTE PRO
              </h2>
              <button
                type="button"
                onClick={() => onSelectProduct?.('futbol_jersey_pro_vneck')}
                className="mt-4 arza-btn-light-inverse px-6 py-2 text-sm font-medium inline-flex items-center justify-center cursor-pointer"
              >
                Personalizar Fútbol
              </button>
            </div>
          </div>

          {/* Mitad Derecha: Baloncesto */}
          <div className="relative aspect-[4/3] bg-[#111111] overflow-hidden rounded-none group">
            <img
              src={resolveAssetUrl('assets/showcase/campaign_split_basket.jpg')}
              alt="Serie Court Baloncesto ARZA SPORT — Micromesh CoolDry FIBA"
              className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
              loading="lazy"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none"
            />
            <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10 text-white">
              <p className="text-sm sm:text-base font-medium text-white/95">
                Serie Court Baloncesto · ARZA-B01M / B01W
              </p>
              <h2 className="mt-1 font-display-hero text-2xl sm:text-3xl font-extrabold uppercase tracking-tight">
                MALLA COOLDRY™ DE COMPETICIÓN
              </h2>
              <button
                type="button"
                onClick={() => onSelectProduct?.('basketball_b6_hero')}
                className="mt-4 arza-btn-light-inverse px-6 py-2 text-sm font-medium inline-flex items-center justify-center cursor-pointer"
              >
                Personalizar Basket
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
