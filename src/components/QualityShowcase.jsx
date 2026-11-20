import React, { useState } from 'react';
import { ShieldCheck, Wind, Sparkles, Zap, Scissors, ArrowUpRight, Layers } from 'lucide-react';
import { FABRIC_WEAVES } from '../engine/core/designStore';
import FabricSwatchThumb from './brand/FabricSwatchThumb';

const SWATCH_COLORS = [
  { hex: '#111111', label: 'Carbón ARZA' },
  { hex: '#fa5400', label: 'Naranja ARZA' },
  { hex: '#059669', label: 'Esmeralda' },
  { hex: '#0033a0', label: 'Azul Real' },
];

const ACTIVE_WEAVE_SWATCHES = FABRIC_WEAVES.filter((w) => w.id !== 'k_tex_wind');

export default function QualityShowcase({ onOpenTexturesInStudio }) {
  const [swatchHex, setSwatchHex] = useState('#fa5400');
  const specs = [
    {
      icon: Wind,
      badge: '145–155 g/m²',
      title: 'TS-Tex & CoolDry™ Microperforado',
      desc: 'Poliéster técnico de alta transpirabilidad con microcanales de ventilación que evacuan la humedad en cada minuto de juego.',
    },
    {
      icon: Sparkles,
      badge: 'Fijado 210°C',
      title: 'Sublimación Digital Indeleble HD',
      desc: 'Pigmentos integrados en la fibra que no agregan peso, conservan la respiración del tejido y mantienen su intensidad color tras lavado.',
    },
    {
      icon: Zap,
      badge: '4 Hilos Pro',
      title: 'Costura Plana Reforzada',
      desc: 'Uniones ergonómicas anti-rozaduras diseñadas para resistir tirones y el desgaste continuo de ligas competitivas.',
    },
    {
      icon: Scissors,
      badge: 'XS – XXL ♂ / ♀',
      title: 'Patronaje Zava Escala 1:1',
      desc: 'Cortes diferenciados para Caballero y Dama validados en pliegos 2D con márgenes de costura y sangrado listos para plotter.',
    },
  ];

  return (
    <section id="fabric-quality" className="scroll-mt-28 py-16 sm:py-24 bg-[#F5F5F5] border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C24100] block">
              Estándar Grupo Zava
            </span>
            <h2 className="font-display-hero font-extrabold uppercase text-[#111111] arza-section-headline">
              Ingeniería Textil ARZA SPORT
            </h2>
            <p className="text-[#757575] text-sm sm:text-base leading-relaxed">
              Cortamos, sublimamos y confeccionamos cada prenda desde cero sobre moldes técnicos certificados de primera división.
            </p>
          </div>

          <div className="px-5 min-h-11 rounded-full bg-[#111111] text-white text-xs font-semibold inline-flex items-center gap-2 shrink-0 self-start md:self-auto">
            <ShieldCheck className="w-4 h-4 text-[#FA5400]" aria-hidden="true" />
            <span>Protección UV 50+ · Lavado 60°C</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {specs.map((spec) => {
            const Icon = spec.icon;
            return (
              <div
                key={spec.title}
                className="arza-card p-6 rounded-2xl bg-white border border-neutral-200 hover:border-[#FA5400] transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <div className="w-11 h-11 rounded-xl bg-[#111111] text-[#FA5400] flex items-center justify-center">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-800 border border-neutral-200">
                      {spec.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-neutral-950 mb-2 leading-snug">
                    {spec.title}
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">{spec.desc}</p>
                </div>

                <div className="mt-6 pt-3.5 border-t border-neutral-200 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-800">
                  <ShieldCheck className="w-4 h-4 text-neutral-950" aria-hidden="true" />
                  <span>Garantía Oficial ARZA · Zava</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Muestrario Interactivo de Texturas de Tela Reales (Tejidos PBR 3D) */}
        <div className="mt-10 p-6 sm:p-8 rounded-3xl bg-white border border-neutral-200 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-5">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#C24100]">
                  <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Muestrario Macro de Telas Reales</span>
                </span>
                <h3 className="font-display-hero text-xl sm:text-2xl font-extrabold uppercase text-[#111111] mt-1">
                  {ACTIVE_WEAVE_SWATCHES.length} Texturas de Tejido Aplicables en el Configurador 3D
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 mr-1">
                    Color muestra:
                  </span>
                  {SWATCH_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      aria-label={c.label}
                      aria-pressed={swatchHex === c.hex}
                      onClick={() => setSwatchHex(c.hex)}
                      className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                        swatchHex === c.hex
                          ? 'scale-115 ring-2 ring-offset-1 ring-[#111111] border-white'
                          : 'border-black/20 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>

                {onOpenTexturesInStudio && (
                  <button
                    type="button"
                    onClick={onOpenTexturesInStudio}
                    className="px-4 min-h-10 rounded-full arza-btn-glass-green text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Probar Texturas en Paso 2</span>
                    <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ACTIVE_WEAVE_SWATCHES.map((w) => (
              <div
                key={w.id}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3.5 flex flex-col justify-between gap-3 hover:border-[#FA5400] transition-colors"
              >
                <div className="relative rounded-xl overflow-hidden">
                  <FabricSwatchThumb
                    bumpUrl={w.bumpUrl}
                    tintHex={swatchHex}
                    tileSize={58}
                    className="w-full h-28 rounded-xl"
                  />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-mono font-bold backdrop-blur-xs">
                    {w.gsm || 150} g/m²
                  </span>
                </div>

                <div>
                  <div className="text-sm font-extrabold text-neutral-950 leading-snug">
                    {w.name}
                  </div>
                  <p className="text-[11px] text-neutral-600 leading-relaxed mt-1">
                    {w.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
