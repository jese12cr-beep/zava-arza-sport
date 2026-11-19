import React from 'react';
import { Palette, Users, Truck, CheckCircle2, PackageCheck, ArrowRight } from 'lucide-react';

export default function HowItWorks({ onOpenStudio, onOpenQuote }) {
  const steps = [
    {
      number: '01',
      icon: Palette,
      title: 'Elige Molde y Personaliza en 3D',
      desc: 'Selecciona el corte ZAVA (Caballero o Dama), define la combinación cromática y visualiza cada zona en el motor 3D antes de confirmar.',
      highlight: 'Paleta completa y cortes sin costo extra',
    },
    {
      number: '02',
      icon: Users,
      title: 'Integra Logos, Sponsors y Plantilla',
      desc: 'Sube el escudo de tu club, posiciona sponsors en pecho o mangas y carga nombres y dorsales de todos tus jugadores en una sola lista.',
      highlight: 'Sublimación integral todo incluido',
    },
    {
      number: '03',
      icon: Truck,
      title: 'Confección Zava y Envío en 10–12 Días',
      desc: 'Imprimimos pliegos 1:1 en tejidos técnicos de alta resistencia y confeccionamos tu pedido con entrega directa a domicilio o club.',
      highlight: 'Reposiciones desde 1 unidad todo el año',
    },
  ];

  return (
    <section id="como-funciona" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white border-t border-neutral-200">
      <div className="max-w-3xl mb-14 space-y-2">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-600 block">
          Flujo de Trabajo Directo
        </span>
        <h2 className="font-display-hero font-extrabold uppercase text-neutral-950 arza-section-headline">
          De la App a la Cancha en 3 Pasos
        </h2>
        <p className="text-neutral-600 text-sm sm:text-base">
          Diseña sin intermediarios, controla cada detalle técnico y recibe equipaciones listas para competir.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className="arza-card p-7 rounded-2xl bg-neutral-100 border border-neutral-200 hover:border-neutral-950 transition-colors flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-display-hero text-4xl font-extrabold text-neutral-400 group-hover:text-neutral-950 transition-colors">
                    {step.number}
                  </span>
                  <div className="w-11 h-11 rounded-xl bg-white text-neutral-950 flex items-center justify-center border border-neutral-200 group-hover:bg-neutral-950 group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-neutral-950 mb-2">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-200 flex items-center gap-2 text-xs font-semibold text-neutral-800">
                <CheckCircle2 className="w-4 h-4 text-neutral-950 shrink-0" aria-hidden="true" />
                <span>{step.highlight}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Banner Corporativo Grupo Zava / Clubes */}
      <div className="mt-10 p-6 sm:p-10 rounded-2xl bg-neutral-950 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-lime-300 text-xs font-bold uppercase tracking-[0.2em]">
            <PackageCheck className="w-4 h-4" aria-hidden="true" />
            <span>Programa Clubes &amp; Academias Zava</span>
          </div>
          <h3 className="font-display-hero text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white">
            ¿Equipas varias categorías o toda una liga?
          </h3>
          <p className="text-neutral-300 text-xs sm:text-sm max-w-2xl">
            Obtén descuentos por volumen de hasta 35%, solicita muestrario de tallas y resguarda tus moldes ARZA para futuras temporadas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenStudio}
            className="px-6 min-h-11 rounded-full bg-white hover:bg-neutral-200 text-neutral-950 font-semibold text-xs inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <span>Abrir Configurador</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
          {onOpenQuote && (
            <button
              type="button"
              onClick={onOpenQuote}
              className="px-6 min-h-11 rounded-full border border-white/40 hover:border-white text-white font-semibold text-xs inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Cotización PDF</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
