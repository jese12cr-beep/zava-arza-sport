import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: '¿Existe un pedido mínimo por diseño o club?',
    a: 'No. Confeccionamos desde 1 sola prenda en la app ARZA SPORT, y a partir de 6 piezas aplicamos descuentos progresivos por volumen de hasta 35%.',
  },
  {
    q: '¿Qué incluye el precio mostrado en el configurador?',
    a: 'Incluye tejido técnico deportivo, sublimación total sin límite de colores, escudo, sponsors, nombres y dorsales individuales en cada prenda.',
  },
  {
    q: '¿Cuánto tarda la confección y entrega de Grupo Zava?',
    a: 'El tiempo estándar garantizado es de 10 a 12 días hábiles a partir de la aprobación de tu plantilla de tallas y dorsales.',
  },
  {
    q: '¿Puedo pedir reposiciones exactas a mitad de temporada?',
    a: 'Sí. Tu diseño ARZA queda almacenado con código único de producción para solicitar desde 1 prenda adicional manteniendo colores y moldes exactos.',
  },
  {
    q: '¿Qué formatos acepta la app para escudos y sponsors?',
    a: 'Acepta archivos vectoriales (SVG) e imágenes PNG/JPG de alta resolución. El visor valida automáticamente la nitidez para impresión industrial.',
  },
  {
    q: '¿En qué se diferencian los moldes Caballero y Dama (ZAVA Femme)?',
    a: 'Cada línea femenina utiliza geometría y patronaje propio desarrollado por Zava con ajuste anatómico en cintura, sisas y hombros.',
  },
];

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <section id="faq" className="py-16 sm:py-24 bg-neutral-100 border-t border-neutral-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C24100] block">
            Preguntas Frecuentes
          </span>
          <h2 className="font-display-hero font-extrabold uppercase text-[#111111] arza-section-headline">
            Todo Sobre tu Pedido ARZA SPORT
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={faq.q}
                className={`rounded-2xl border bg-white transition-colors ${
                  isOpen ? 'border-[#FA5400]' : 'border-neutral-200'
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  className="w-full py-4 px-6 text-left flex items-center justify-between gap-4 font-bold text-neutral-950 text-sm sm:text-base cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-neutral-600 transition-transform shrink-0 ${
                      isOpen ? 'rotate-180 text-neutral-950' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
