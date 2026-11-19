import React from 'react';
import { ShieldCheck, Star } from 'lucide-react';

export default function AthleteProof() {
  const reviews = [
    {
      quote: 'Equipamos a las 4 divisiones del club con ARZA SPORT. La nitidez de los escudos y la resistencia tras decenas de lavados es sobresaliente.',
      author: 'MARCOS E. // DIRECTOR DEPORTIVO',
      club: 'AETHEN FC',
    },
    {
      quote: 'El tejido micromesh del tanque ZAVA Court B1 mantiene ventilación constante y los dorsales integrados en la fibra nunca se despegan.',
      author: 'CARLOS D. // CAPITÁN',
      club: 'BROOKLYN STORM BC',
    },
    {
      quote: 'Cumplieron la entrega en 9 días hábiles antes de playoffs. El patronaje Dama entallado nos evitó ajustes de último minuto.',
      author: 'LAURA M. // ENTRENADORA',
      club: 'OMEGA SPORTS ACADEMY',
    },
  ];

  return (
    <section id="club-proof" className="bg-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-t border-neutral-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C24100] block">
              Clubes Verificados
            </span>
            <h2 className="font-display-hero font-extrabold uppercase text-[#111111] arza-section-headline">
              Equipos que Confían en Zava
            </h2>
          </div>
          <p className="text-[#757575] text-sm max-w-md">
            Clubes federados, ligas universitarias y academias compiten cada semana con uniformes manufacturados bajo la línea ARZA SPORT.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.club}
              className="arza-card bg-[#F5F5F5] p-7 rounded-2xl border border-neutral-200 flex flex-col justify-between gap-5"
            >
              <div>
                <div className="flex gap-1 text-[#FA5400] mb-4" aria-label="Calificación 5 de 5 estrellas">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-current" aria-hidden="true" />
                  ))}
                </div>
                <p className="text-neutral-800 text-sm leading-relaxed">
                  &ldquo;{rev.quote}&rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-200">
                <span className="font-bold text-xs text-neutral-950 block">{rev.author}</span>
                <span className="text-xs text-neutral-600 font-semibold">{rev.club}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 p-6 sm:p-8 rounded-2xl bg-neutral-100 border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-neutral-950 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-950">
                Garantía Kickoff Zava · Cumplimiento en Torneos
              </h3>
              <p className="text-xs text-neutral-600 mt-0.5">
                Plazos de confección protegidos para entregas puntuales antes del inicio oficial de competencia.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-950 bg-white px-4 py-2 rounded-full border border-neutral-300 shrink-0">
            Estándar FIFA / FIBA
          </span>
        </div>
      </div>
    </section>
  );
}
