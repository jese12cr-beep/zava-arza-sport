import React, { useState } from 'react';
import { ShieldCheck, Wind, Sparkles, Zap, Scissors } from 'lucide-react';
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
  const [swatchHex, setSwatchHex] = useState('#111111');
  const specs = [
    {
      icon: Wind,
      badge: '145–155 g/m²',
      title: 'TS-Tex & CoolDry™ Microperforado',
      desc: 'Poliéster técnico con microcanales de ventilación que evacuan la humedad durante todo el partido.',
    },
    {
      icon: Sparkles,
      badge: 'Fijado 210°C',
      title: 'Sublimación Digital Indeleble',
      desc: 'Pigmentos integrados directo en la fibra: no agregan peso y conservan el tono lavado tras lavado.',
    },
    {
      icon: Zap,
      badge: '4 Hilos Pro',
      title: 'Costura Plana Reforzada',
      desc: 'Uniones ergonómicas diseñadas para resistir tirones y uso continuo en ligas competitivas.',
    },
    {
      icon: Scissors,
      badge: 'XS – XXL ♂ / ♀',
      title: 'Patronaje Zava Escala 1:1',
      desc: 'Trazos diferenciados para Caballero y Dama desarrollados para máximo rendimiento en cancha.',
    },
  ];

  return (
    <section
      id="fabric-quality"
      className="scroll-mt-20 py-14 sm:py-20 bg-[#F5F5F5] border-t border-[#E5E5E5]"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div className="max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-medium text-[#111111]">
              Ingeniería Textil ARZA SPORT
            </h2>
            <p className="text-sm sm:text-base text-[#707072] mt-1">
              Cortamos, sublimamos y confeccionamos cada prenda desde cero sobre moldes certificados de competición.
            </p>
          </div>

          <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#111111]">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>Protección UV 50+ · Lavado 60°C</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {specs.map((spec) => {
            const Icon = spec.icon;
            return (
              <div
                key={spec.title}
                className="p-6 bg-white border border-[#E5E5E5] rounded-none flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <div className="w-10 h-10 bg-[#111111] text-white flex items-center justify-center">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-mono font-medium text-[#707072]">
                      {spec.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-medium text-[#111111] mb-2 leading-snug">
                    {spec.title}
                  </h3>
                  <p className="text-sm text-[#707072] leading-relaxed">{spec.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Muestrario Interactivo de Telas estilo Galería Nike MX */}
        <div className="mt-8 p-6 sm:p-8 bg-white border border-[#E5E5E5] rounded-none space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#E5E5E5]">
            <div>
              <h3 className="text-lg sm:text-xl font-medium text-[#111111]">
                {ACTIVE_WEAVE_SWATCHES.length} Texturas de Tejido para Sublimación Pro
              </h3>
              <p className="text-sm text-[#707072] mt-0.5">
                Cambia el tono de muestra para inspeccionar el tejido a nivel macro
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5F5F5]">
                <span className="text-xs font-medium text-[#707072] mr-1">
                  Color:
                </span>
                {SWATCH_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    aria-label={c.label}
                    aria-pressed={swatchHex === c.hex}
                    onClick={() => setSwatchHex(c.hex)}
                    className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                      swatchHex === c.hex
                        ? 'scale-110 ring-2 ring-offset-1 ring-[#111111] border-white'
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
                  className="arza-btn-dark px-5 py-2 text-xs sm:text-sm font-medium inline-flex items-center justify-center cursor-pointer"
                >
                  Explorar Telas
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ACTIVE_WEAVE_SWATCHES.map((w) => (
              <div key={w.id} className="bg-white flex flex-col">
                <div className="relative bg-[#F5F5F5] rounded-none overflow-hidden mb-3">
                  <FabricSwatchThumb
                    bumpUrl={w.bumpUrl}
                    tintHex={swatchHex}
                    tileSize={58}
                    className="w-full h-32 rounded-none"
                  />
                  <span className="sr-only">{w.gsm || 150} gramos por metro cuadrado</span>
                </div>

                <div className="text-sm sm:text-base font-medium text-[#111111] leading-snug">
                  {w.name}
                </div>
                <div className="text-xs font-mono text-[#707072] mt-0.5">
                  {w.gsm || 150} g/m²
                </div>
                <p className="text-xs text-[#707072] leading-relaxed mt-1">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
