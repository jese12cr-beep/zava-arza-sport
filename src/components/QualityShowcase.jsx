import React from 'react';
import { ShieldCheck, Wind, Sparkles, Zap, Scissors } from 'lucide-react';

export default function QualityShowcase() {
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
    <section id="fabric-quality" className="py-16 sm:py-24 bg-[#F5F5F5] border-t border-neutral-200">
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
      </div>
    </section>
  );
}
