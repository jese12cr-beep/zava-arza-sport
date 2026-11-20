import React from 'react';
import { Shirt, Layers, Palette, Shield, ArrowRight } from 'lucide-react';

export default function HowItWorks({ onOpenStudio, onOpenQuote }) {
  const steps = [
    {
      number: '01',
      icon: Shirt,
      title: 'Modelo y Corte',
      desc: 'Elige deporte, corte Caballero o Dama y la prenda base (jersey, tank o short).',
    },
    {
      number: '02',
      icon: Layers,
      title: 'Diseño y Forma',
      desc: 'Escoge el patrón de franjas o paneles gráficos junto con el estilo de cuello que prefieras.',
    },
    {
      number: '03',
      icon: Palette,
      title: 'Colores ARZA',
      desc: 'Selecciona una combinación sugerida con 1 clic o personaliza cada zona de la prenda.',
    },
    {
      number: '04',
      icon: Shield,
      title: 'Logos, Dorsales y Pedido',
      desc: 'Sube el escudo de tu club, define nombre y número de muestra, tallas y envía tu orden.',
    },
  ];

  return (
    <section id="como-funciona" className="scroll-mt-28 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-neutral-200/80">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div className="space-y-2 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C24100] block">
            Experiencia Guiada ARZA SPORT
          </span>
          <h2 className="font-display-hero font-extrabold uppercase text-[#111111] arza-section-headline">
            Tu Uniforme Listo en 4 Pasos Simples
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenStudio}
            className="px-5 min-h-11 rounded-full arza-btn-glass-green text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Iniciar Paso 1</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
          {onOpenQuote && (
            <button
              type="button"
              onClick={onOpenQuote}
              className="px-5 min-h-11 rounded-full border border-[#111111] text-[#111111] hover:bg-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Cotización de Club</span>
            </button>
          )}
        </div>
      </div>

      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="list">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <li
              key={step.number}
              className="arza-glass-card p-6 rounded-2xl flex flex-col justify-between gap-4 hover:border-emerald-500 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-display-hero text-3xl font-extrabold text-[#FA5400]">
                    {step.number}
                  </span>
                  <div className="w-10 h-10 rounded-xl arza-pill-glass-green flex items-center justify-center">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                </div>

                <h3 className="text-base font-bold text-neutral-950 mb-1.5">
                  {step.title}
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
