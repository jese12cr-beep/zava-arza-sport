import React, { useState, useId } from 'react';

export default function Footer({ onOpenShopifyGuide }) {
  const emailId = useId();
  const [registered, setRegistered] = useState(false);

  return (
    <footer className="w-full bg-[#111111] text-white border-t border-neutral-800 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-10">
        {/* Identidad Corporativa Zava / ARZA SPORT */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <div>
            <span className="font-display-hero font-extrabold text-2xl tracking-wide uppercase block leading-none">
              ARZA SPORT
            </span>
            <span className="text-[10px] tracking-[0.24em] uppercase text-[#757575] mt-1 block">
              Una marca de Grupo Zava
            </span>
          </div>

          <p className="text-xs text-neutral-300 max-w-sm leading-relaxed">
            Manufactura, sublimación textil digital y patronaje 3D/2D personalizado para clubes profesionales, ligas y academias deportivas.
          </p>

          <div className="text-[11px] font-mono text-[#FA5400] font-bold uppercase tracking-wider">
            [ GRUPO ZAVA · MOLDES PROPIETARIOS ARZA ]
          </div>
        </div>

        {/* Muestras para Clubes */}
        <div className="md:col-span-4 flex flex-col gap-2">
          <label htmlFor={emailId} className="text-xs font-bold uppercase tracking-wider text-white">
            Muestras Textiles para Clubes
          </label>
          <p className="text-xs text-neutral-300">
            Registra el correo oficial de tu equipo para recibir catálogo técnico y caja de tallas.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setRegistered(true);
            }}
            className="flex items-center mt-2 max-w-sm"
          >
            <input
              id={emailId}
              type="email"
              required
              autoComplete="email"
              placeholder="correo@tuclub.com"
              className="bg-neutral-900 border border-neutral-700 text-xs text-white px-3.5 min-h-11 rounded-l-full placeholder-neutral-400 focus:outline-none focus:border-[#FA5400] w-full"
            />
            <button
              type="submit"
              className="bg-[#FA5400] text-[#111111] text-xs font-bold px-5 min-h-11 rounded-r-full hover:bg-[#ff6a1f] transition-colors uppercase shrink-0 cursor-pointer"
            >
              {registered ? 'Listo' : 'Pedir'}
            </button>
          </form>
        </div>

        {/* Información Técnica */}
        <div className="md:col-span-3 flex flex-col gap-2.5 text-xs">
          <span className="font-bold uppercase tracking-wider text-white mb-1">
            Soporte &amp; Especificaciones
          </span>
          <button
            type="button"
            onClick={onOpenShopifyGuide}
            className="text-left text-neutral-300 hover:text-white underline-offset-4 hover:underline font-medium cursor-pointer"
          >
            Guía de Integración E-Commerce
          </button>
          <span className="text-neutral-400">Lavado Técnico hasta 60°C</span>
          <span className="text-neutral-400">Normativas de Dorsales FIFA / FIBA</span>
          <span className="text-neutral-400">Patronaje Zava Escala 1:1 XS–XXL</span>
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-neutral-400">
        <p>© 2026 ARZA SPORT — Grupo Zava. Todos los derechos reservados.</p>
        <div className="flex flex-wrap gap-4">
          <span className="font-medium text-neutral-300">México &amp; USA · Producción Zava</span>
          <span>Garantía Oficial de Competición</span>
        </div>
      </div>
    </footer>
  );
}
