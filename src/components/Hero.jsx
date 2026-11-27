import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ArzaLogo from './brand/ArzaLogo';
import { resolveAssetUrl } from '../utils/assetUrl';

const PROMO_MESSAGES = [
  {
    text: 'Pedido mínimo desde 1 pieza personalizada con Grupo Zava.',
    cta: 'Empezar ahora',
    type: 'studio',
  },
  {
    text: 'Aprovecha 3, 6 y 9 MSI con tarjeta de crédito al confirmar tu pedido.',
    cta: 'Explorar prendas',
    type: 'catalog',
  },
];

export default function Hero({ onStartDesigning }) {
  const [promoIdx, setPromoIdx] = useState(0);
  const heroBrandRef = useRef(null);

  useEffect(() => {
    const el = heroBrandRef.current;
    if (!el || typeof window === 'undefined' || typeof CSS === 'undefined') return undefined;

    const nativeSupported = CSS.supports(
      '(animation-timeline: scroll()) and (animation-range: 0% 100%)'
    );
    if (nativeSupported) return undefined;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: no-preference)');
    const handleScroll = () => {
      const progress = Math.min(1, Math.max(0, window.scrollY / 115));
      el.style.opacity = String(1 - progress);
      el.style.transform = motionQuery.matches
        ? `translateY(${(-14 * progress).toFixed(1)}px) scale(${(1 - 0.08 * progress).toFixed(3)})`
        : '';
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentPromo = PROMO_MESSAGES[promoIdx];

  const handlePromoAction = () => {
    if (currentPromo.type === 'studio') {
      onStartDesigning(null);
      return;
    }
    const target = document.getElementById('drops-catalog');
    if (target) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  };

  return (
    <section className="w-full bg-white text-[#111111]">
      {/* Tira Promocional superior estilo Nike MX (#F5F5F5) */}
      <div className="w-full bg-[#F5F5F5] border-b border-[#E5E5E5] px-4 sm:px-6 lg:px-12 py-2.5 flex items-center justify-center gap-3 text-xs sm:text-[13px] text-[#111111]">
        <button
          type="button"
          onClick={() => setPromoIdx((i) => (i === 0 ? PROMO_MESSAGES.length - 1 : i - 1))}
          aria-label="Aviso anterior"
          className="hidden sm:inline-flex items-center justify-center min-w-8 min-h-8 rounded-full hover:bg-[#E5E5E5] text-[#111111] transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>

        <p className="text-center font-normal">
          <span>{currentPromo.text} </span>
          <button
            type="button"
            onClick={handlePromoAction}
            className="font-semibold underline underline-offset-4 hover:text-[#707072] cursor-pointer"
          >
            {currentPromo.cta}
          </button>
        </p>

        <button
          type="button"
          onClick={() => setPromoIdx((i) => (i + 1) % PROMO_MESSAGES.length)}
          aria-label="Siguiente aviso"
          className="hidden sm:inline-flex items-center justify-center min-w-8 min-h-8 rounded-full hover:bg-[#E5E5E5] text-[#111111] transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Emblema Central ARZA SPORT sin recuadro — se desvanece suavemente al desplazarse */}
      <div
        ref={heroBrandRef}
        className="arza-hero-brand-exit max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-4 pb-3 flex flex-col items-center justify-center text-center"
      >
        <ArzaLogo theme="light" className="h-11 sm:h-14 w-auto" />
        <span className="mt-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.26em] text-[#707072]">
          Colección Oficial Grupo Zava 2026
        </span>
      </div>

      {/* Fotografía Editorial Full-Bleed sin esquinas redondeadas */}
      <div className="w-full max-w-[1440px] mx-auto lg:px-12">
        <div className="w-full bg-[#F5F5F5] overflow-hidden rounded-none">
          <img
            src={resolveAssetUrl('assets/showcase/campaign_hero_wide.jpg')}
            alt="Campaña oficial ARZA SPORT by Grupo Zava — Kits sublimados para fútbol y baloncesto"
            fetchPriority="high"
            className="w-full h-[280px] sm:h-[360px] lg:h-[390px] object-cover object-center"
          />
        </div>
      </div>

      {/* Bloque Tipográfico Centrado sobre fondo Blanco Puro estilo Nike MX */}
      <div className="max-w-4xl mx-auto px-6 pt-6 pb-10 sm:pt-8 sm:pb-12 text-center flex flex-col items-center">
        <p className="text-sm sm:text-base font-medium text-[#111111] mb-2">
          Personalización Oficial ARZA · Caballero y Dama
        </p>

        <h1 className="font-display-hero font-extrabold uppercase text-[#111111] arza-hero-headline">
          TU UNIFORME EN 4 PASOS.
        </h1>

        <p className="mt-3 text-sm sm:text-base text-[#111111] font-body-lg max-w-[60ch]">
          1. Uniforme, Portero, Guantes y Nombres · 2. Diseño y Tela · 3. Colores · 4. Logos y Pedido. Sublimación digital en telas técnicas XS a XXL.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onStartDesigning(null)}
            className="arza-btn-dark px-7 py-2.5 text-sm sm:text-base font-medium inline-flex items-center justify-center cursor-pointer"
          >
            Empezar Paso 1
          </button>

          <a
            href="#drops-catalog"
            className="arza-btn-outline px-7 py-2.5 text-sm sm:text-base font-medium inline-flex items-center justify-center"
          >
            Ver Catálogo
          </a>
        </div>
      </div>
    </section>
  );
}
