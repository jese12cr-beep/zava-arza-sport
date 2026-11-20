import React, { useState } from 'react';
import { ArrowRight, ArrowUpRight, Layers, Scissors, Ruler } from 'lucide-react';
import ArzaLogo from './brand/ArzaLogo';
import { resolveAssetUrl } from '../utils/assetUrl';

const FEATURED_ZAVA_LINES = [
  {
    id: 'futbol_jersey_pro_vneck',
    sport: 'Fútbol',
    tabLabel: 'Fútbol · Apex V1',
    code: 'ARZA-Z01M / Z01W',
    name: 'Jersey Fútbol ZAVA Apex V1',
    subtitle: 'Patronaje anatómico Caballero y Dama • Cuello en V ergonómico',
    fabric: 'TS-Tex™ Micro-Pore 145 g/m²',
    price: '$34.00',
    colors: ['#111111', '#fa5400', '#ffffff', '#757575'],
    image: resolveAssetUrl('assets/showcase/futbol_f3_jersey.jpg'),
  },
  {
    id: 'basketball_b6_hero',
    sport: 'Baloncesto',
    tabLabel: 'Baloncesto · Court B1',
    code: 'ARZA-B01M / B01W',
    name: 'Tank Basket ZAVA Court B1',
    subtitle: 'Sisa competitiva FIFA / FIBA • 19 cortes gráficos configurables',
    fabric: 'CoolDry™ Micromesh Hex 155 g/m²',
    price: '$32.50',
    colors: ['#111111', '#fa5400', '#ffffff', '#059669'],
    image: resolveAssetUrl('assets/showcase/basket_b6_men.jpg'),
  },
  {
    id: 'jacket_softshell_601m_men',
    sport: 'Chamarras',
    tabLabel: 'Softshell · Shield J1',
    code: 'ARZA-J01M / J01W',
    name: 'Chamarra Softshell ZAVA Shield J1',
    subtitle: 'Cortavientos 3 capas • 11 piezas sublimables de confección',
    fabric: 'K-Tex Windblock 280 g/m²',
    price: '$68.00',
    colors: ['#111111', '#fa5400', '#757575', '#065f46'],
    image: resolveAssetUrl('assets/showcase/jacket_601m_softshell.jpg'),
  },
  {
    id: 'esports_pro_jersey',
    sport: 'E-Sports',
    tabLabel: 'E-Sports · Arena E1',
    code: 'ARZA-E01M',
    name: 'Jersey Arena E-Sports ZAVA E1',
    subtitle: 'Sublimación integral Full HD • Sponsors y Gamertags ilimitados',
    fabric: 'TS-Tex Ultra-Light 140 g/m²',
    price: '$36.00',
    colors: ['#111111', '#fa5400', '#ffffff', '#059669'],
    image: resolveAssetUrl('assets/stitch/ghost_mannequin.png'),
  },
];

export default function Hero({ onStartDesigning }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const active = FEATURED_ZAVA_LINES[selectedIdx];

  return (
    <section className="w-full bg-white text-neutral-950 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-14 sm:pt-12 sm:pb-20">
        {/* Selector de línea deportiva arriba estilo editorial */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-neutral-200">
          <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.18em] text-neutral-600">
            <ArzaLogo theme="light" variant="mark" decorative className="h-4 w-auto shrink-0" />
            <span className="text-neutral-950">ARZA SPORT</span>
            <span aria-hidden="true">/</span>
            <span>Colección Oficial Zava 2026</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Líneas destacadas ARZA">
            {FEATURED_ZAVA_LINES.map((item, idx) => {
              const isSel = idx === selectedIdx;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isSel}
                  onClick={() => setSelectedIdx(idx)}
                  className={`px-4 min-h-10 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    isSel
                      ? 'bg-[#111111] text-white'
                      : 'bg-[#F5F5F5] text-[#757575] hover:bg-neutral-200 hover:text-[#111111]'
                  }`}
                >
                  {item.tabLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hero Split Editorial Minimalista */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Columna de Tipografía Display + CTAs */}
          <div className="lg:col-span-6 space-y-6">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#C24100]">
              ASISTENTE DE DISEÑO 3D PASO A PASO
            </p>

            <h1 className="font-display-hero font-extrabold uppercase text-[#111111] arza-hero-headline">
              DISEÑA TU UNIFORME{' '}
              <span className="text-[#757575] block sm:inline">PASO A PASO.</span>
            </h1>

            <p className="font-body-lg text-base sm:text-lg text-[#525252] max-w-[52ch]">
              Sin menús complejos: elige primero tu modelo, luego diseño y cuello, después colores y al final tus logotipos y tallas en vista 3D real.
            </p>

            {/* Resumen visual limpio de los 4 pasos */}
            <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2" role="list">
              {[
                '1. Modelo y Corte',
                '2. Diseño y Cuello',
                '3. Colores ARZA',
                '4. Logos y Pedido',
              ].map((stepLabel) => (
                <li
                  key={stepLabel}
                  className="px-3 py-2 rounded-xl arza-glass-card text-[11px] font-bold text-[#111111] border border-neutral-200/80"
                >
                  {stepLabel}
                </li>
              ))}
            </ol>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onStartDesigning(null)}
                className="px-7 min-h-12 rounded-full arza-btn-glass-green text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Empezar Paso 1: Elegir Modelo</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <a
                href="#drops-catalog"
                className="px-7 min-h-12 rounded-full border border-[#111111] text-[#111111] hover:bg-[#F5F5F5] text-sm font-semibold inline-flex items-center gap-2 transition-colors"
              >
                <span>Ver Catálogo (13 Moldes)</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>

            {/* Datos Técnicos Limpios */}
            <dl className="grid grid-cols-3 gap-4 pt-6 border-t border-neutral-200">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#757575] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#C24100] shrink-0" aria-hidden="true" />
                  <span>Moldes 3D</span>
                </dt>
                <dd className="mt-1 font-display-hero text-2xl sm:text-3xl font-extrabold text-[#111111] tabular-nums-pro">
                  13 CORTES
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#757575] flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-[#C24100] shrink-0" aria-hidden="true" />
                  <span>Pliegos RIP</span>
                </dt>
                <dd className="mt-1 font-display-hero text-2xl sm:text-3xl font-extrabold text-[#111111] tabular-nums-pro">
                  ESCALA 1:1
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-[#757575] flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-[#C24100] shrink-0" aria-hidden="true" />
                  <span>Tallas</span>
                </dt>
                <dd className="mt-1 font-display-hero text-2xl sm:text-3xl font-extrabold text-[#111111] tabular-nums-pro">
                  XS – XXL
                </dd>
              </div>
            </dl>
          </div>

          {/* Columna Visual Producto Activo sobre Fondo Neutro Estilo Estudio */}
          <div className="lg:col-span-6">
            <div className="relative rounded-2xl bg-[#111111] overflow-hidden border border-neutral-200 shadow-sm">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#111111]">
                <img
                  src={active.image}
                  alt={`${active.name} — Indumentaria deportiva ARZA SPORT by Zava`}
                  className="w-full h-full object-contain object-center transition-transform duration-500 hover:scale-[1.03]"
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none"
                  aria-hidden="true"
                />
                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 pointer-events-none">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111111]/85 backdrop-blur-md border border-[#FA5400]/45 text-[#FA5400] text-[11px] font-mono font-bold tracking-wider">
                    <ArzaLogo theme="dark" variant="mark" decorative className="h-3.5 w-auto" />
                    <span>ARZA SPORT · {active.code}</span>
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-[#111111]/85 backdrop-blur-md border border-white/15">
                    <ArzaLogo theme="dark" className="h-6 w-auto" />
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 text-white">
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-widest text-neutral-200 font-semibold">
                      {active.fabric}
                    </div>
                    <div className="font-display-hero text-2xl sm:text-3xl font-extrabold tracking-tight uppercase truncate">
                      {active.name}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] uppercase tracking-wider text-neutral-200 block">Desde</span>
                    <span className="font-display-hero text-2xl sm:text-3xl font-extrabold text-[#FA5400] tabular-nums-pro">
                      {active.price}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 bg-white/85 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-neutral-200/80">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#525252]">{active.subtitle}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#757575]">
                      Tonos sugeridos:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {active.colors.map((hex) => (
                        <span
                          key={hex}
                          className="w-4 h-4 rounded-full border border-neutral-300 inline-block"
                          style={{ backgroundColor: hex }}
                          title={hex}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onStartDesigning(active.id)}
                  className="px-5 min-h-11 rounded-full arza-btn-glass-green text-xs font-bold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <span>Diseñar este Molde</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
