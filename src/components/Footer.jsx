import React, { useState, useId } from 'react';
import { Globe } from 'lucide-react';
import ArzaLogo from './brand/ArzaLogo';

export default function Footer({
  onOpenShopifyGuide,
  onSelectCategory,
  onSelectProduct,
  onOpenStudio,
  onOpenQuoteModal,
}) {
  const emailId = useId();
  const [registered, setRegistered] = useState(false);

  const directoryCols = [
    {
      title: 'Fútbol Pro',
      links: [
        { label: 'Jersey Apex V1 Caballero', action: () => onSelectProduct?.('futbol_jersey_pro_vneck') },
        { label: 'Jersey Femme V1 Dama', action: () => onSelectProduct?.('futbol_jersey_f3w_women') },
        { label: 'Short Matchday S1', action: () => onSelectProduct?.('football_shorts_fp3') },
        { label: 'Ver Línea Fútbol', action: () => onSelectCategory?.('Fútbol', 'all') },
      ],
    },
    {
      title: 'Baloncesto',
      links: [
        { label: 'Tank Court B1 Caballero', action: () => onSelectProduct?.('basketball_b6_hero') },
        { label: 'Short Court SB1 Largo', action: () => onSelectProduct?.('basketball_shorts_bp6') },
        { label: 'Tank Femme BW1 Dama', action: () => onSelectProduct?.('basketball_b7w_women') },
        { label: 'Short Femme SBW1', action: () => onSelectProduct?.('basketball_shorts_bp7w_women') },
      ],
    },
    {
      title: 'Cortes y E-Sports',
      links: [
        { label: 'Todos los Cortes Caballero', action: () => onSelectCategory?.('all', 'men') },
        { label: 'Todos los Cortes Dama', action: () => onSelectCategory?.('all', 'women') },
        { label: 'Jersey Arena E-Sports E1', action: () => onSelectProduct?.('esports_pro_jersey') },
        { label: 'Abrir Personalizador', action: () => onOpenStudio?.() },
      ],
    },
    {
      title: 'Grupo Zava',
      links: [
        { label: 'Tejidos TS-Tex™ & CoolDry™', href: '#fabric-quality' },
        { label: 'Sublimación Digital 210°C', href: '#fabric-quality' },
        { label: 'Cotización por Volumen', action: () => onOpenQuoteModal?.() },
        { label: 'Guía E-Commerce', action: () => onOpenShopifyGuide?.() },
      ],
    },
  ];

  const footerGroups = [
    {
      id: 'recursos',
      title: 'Recursos',
      defaultOpen: true,
      items: [
        { label: 'Personalizar Uniforme', action: () => onOpenStudio?.() },
        { label: 'Catálogo Completo (8)', action: () => onSelectCategory?.('all', 'all') },
        { label: 'Catálogo Telas Reales', href: '#fabric-quality' },
        { label: 'Solicitar Cotización', action: () => onOpenQuoteModal?.() },
      ],
    },
    {
      id: 'ayuda',
      title: 'Producción y Ayuda',
      items: [
        { label: 'Guía E-Commerce Shopify', action: () => onOpenShopifyGuide?.() },
        { label: 'Opciones de Pago y MSI', action: () => onOpenStudio?.() },
        { label: 'Normativa Dorsales FIFA / FIBA', href: '#fabric-quality' },
        { label: 'Patronaje XS – XXL', href: '#fabric-quality' },
      ],
    },
    {
      id: 'zava',
      title: 'ARZA SPORT',
      items: [
        { label: 'Acerca de Grupo Zava', href: '#fabric-quality' },
        { label: 'Estándar de Sublimación', href: '#fabric-quality' },
        { label: 'Lavado Técnico 60°C', href: '#fabric-quality' },
        { label: 'Producción Sin Mínimo', action: () => onOpenStudio?.() },
      ],
    },
  ];

  return (
    <footer className="w-full bg-white text-[#111111] border-t border-[#E5E5E5] pt-14 pb-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Separador de Marca estilo Nike MX encima del directorio */}
        <div className="flex justify-center mb-10">
          <a href="#" aria-label="Volver arriba — ARZA SPORT" className="inline-flex items-center gap-2">
            <ArzaLogo theme="light" variant="mark" decorative className="h-6 w-auto" />
            <span className="font-display-hero text-lg font-extrabold tracking-tight uppercase text-[#111111]">
              ARZA <span className="text-[#C24100]">SPORT</span>
            </span>
          </a>
        </div>

        {/* Directorio de 4 Columnas Pre-Footer estilo Nike MX */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto pb-14">
          {directoryCols.map((col) => (
            <div key={col.title}>
              <h2 className="text-base font-medium text-[#111111] mb-4">{col.title}</h2>
              <ul className="space-y-2.5 text-sm text-[#707072]">
                {col.links.map((lk) => (
                  <li key={lk.label}>
                    {lk.href ? (
                      <a
                        href={lk.href}
                        className="hover:text-[#111111] transition-colors inline-block"
                      >
                        {lk.label}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={lk.action}
                        className="hover:text-[#111111] transition-colors text-left cursor-pointer"
                      >
                        {lk.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Línea Divisoria Hairline Nike MX */}
        <div className="border-t border-[#E5E5E5] pt-10">
          {/* Versión Escritorio: 4 Columnas Planas + México */}
          <div className="hidden md:grid md:grid-cols-12 gap-8 items-start">
            {footerGroups.map((group) => (
              <div key={group.id} className="md:col-span-2">
                <h2 className="text-sm font-medium text-[#111111] mb-4">{group.title}</h2>
                <ul className="space-y-2.5 text-xs sm:text-[13px] text-[#707072] font-medium">
                  {group.items.map((item) => (
                    <li key={item.label}>
                      {item.href ? (
                        <a href={item.href} className="hover:text-[#111111] transition-colors">
                          {item.label}
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={item.action}
                          className="hover:text-[#111111] transition-colors text-left cursor-pointer"
                        >
                          {item.label}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Columna Muestras Clubes */}
            <div className="md:col-span-4">
              <label htmlFor={emailId} className="text-sm font-medium text-[#111111] block mb-2">
                Muestras Textiles para Clubes
              </label>
              <p className="text-xs sm:text-[13px] text-[#707072] mb-3 max-w-sm">
                Registra el correo de tu club o liga para recibir caja de tallas y muestrario físico Grupo Zava.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setRegistered(true);
                }}
                className="flex items-center max-w-sm"
              >
                <input
                  id={emailId}
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="correo@tuclub.com"
                  className="bg-[#F5F5F5] border border-[#E5E5E5] text-xs sm:text-sm text-[#111111] px-4 min-h-10 rounded-l-full placeholder-[#707072] focus:outline-2 focus:outline-[#111111] w-full"
                />
                <button
                  type="submit"
                  className="bg-[#111111] hover:bg-[#3f3f46] text-white text-xs sm:text-sm font-medium px-5 min-h-10 rounded-r-full transition-colors shrink-0 cursor-pointer"
                >
                  {registered ? 'Registrado' : 'Solicitar'}
                </button>
              </form>
            </div>

            <div className="md:col-span-2 flex justify-end items-center gap-1.5 text-xs font-medium text-[#707072]">
              <Globe className="w-4 h-4 text-[#111111]" aria-hidden="true" />
              <span>México</span>
            </div>
          </div>

          {/* Versión Móvil (<768px): Acordeones Nativos <details> estilo Nike MX */}
          <div className="md:hidden space-y-0 border-t border-[#E5E5E5]">
            {footerGroups.map((group) => (
              <details
                key={group.id}
                open={group.defaultOpen}
                className="arza-footer-accordion border-b border-[#E5E5E5] py-4"
              >
                <summary className="text-sm font-medium text-[#111111] py-1">
                  {group.title}
                </summary>
                <ul className="pt-3 pb-1 space-y-2.5 text-sm text-[#707072]">
                  {group.items.map((item) => (
                    <li key={item.label}>
                      {item.href ? (
                        <a href={item.href} className="hover:text-[#111111] inline-block py-0.5">
                          {item.label}
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={item.action}
                          className="hover:text-[#111111] text-left py-0.5 cursor-pointer"
                        >
                          {item.label}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            ))}

            <details className="arza-footer-accordion border-b border-[#E5E5E5] py-4">
              <summary className="text-sm font-medium text-[#111111] py-1">
                Muestras para Clubes
              </summary>
              <div className="pt-3 pb-1 space-y-2.5">
                <p className="text-xs text-[#707072]">
                  Recibe catálogo técnico y caja de tallas Grupo Zava.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setRegistered(true);
                  }}
                  className="flex items-center"
                >
                  <input
                    type="email"
                    required
                    aria-label="Correo del club"
                    autoComplete="email"
                    placeholder="correo@tuclub.com"
                    className="bg-[#F5F5F5] border border-[#E5E5E5] text-sm text-[#111111] px-4 min-h-10 rounded-l-full placeholder-[#707072] w-full"
                  />
                  <button
                    type="submit"
                    className="bg-[#111111] text-white text-xs font-medium px-5 min-h-10 rounded-r-full shrink-0 cursor-pointer"
                  >
                    {registered ? 'Listo' : 'Enviar'}
                  </button>
                </form>
              </div>
            </details>

            <div className="py-5 flex items-center gap-2 text-sm text-[#707072]">
              <Globe className="w-4 h-4 text-[#111111]" aria-hidden="true" />
              <span>México</span>
            </div>
          </div>

          {/* Barra Legal Inferior Nike MX */}
          <div className="mt-10 pt-6 border-t border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#707072]">
            <p>© 2026 ARZA SPORT — Grupo Zava. Todos los derechos reservados.</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <button
                type="button"
                onClick={onOpenShopifyGuide}
                className="hover:text-[#111111] transition-colors cursor-pointer"
              >
                Integración E-Commerce
              </button>
              <span>Guía de Tallas XS–XXL</span>
              <span>México &amp; USA · Producción Zava</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
