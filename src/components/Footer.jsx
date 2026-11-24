import React, { useState, useId } from 'react';
import { Globe, MessageCircle } from 'lucide-react';
import ArzaLogo from './brand/ArzaLogo';
import { ARZA_CONTACT, buildWhatsAppUrl, saveSampleRequest } from '../utils/orderHistoryStore';

export default function Footer({
  onSelectCategory,
  onSelectProduct,
  onSelectGoalkeeper,
  onOpenStudio,
  onOpenQuoteModal,
  onOpenSizeGuide,
  onOpenInfoModal,
  onOpenOrderTracking,
}) {
  const emailId = useId();
  const [sampleEmail, setSampleEmail] = useState('');
  const [registeredSample, setRegisteredSample] = useState(null);

  const handleSampleEmailSubmit = (e) => {
    e.preventDefault();
    const clean = sampleEmail.trim();
    if (!clean) return;
    const saved = saveSampleRequest({
      clubName: 'Club / Liga Web',
      contactName: clean.split('@')[0],
      email: clean,
      phone: '',
      sport: 'Muestrario Completo',
    });
    setRegisteredSample(saved);
  };

  const directoryCols = [
    {
      title: 'Fútbol Pro',
      links: [
        { label: 'Jersey Apex V1 Caballero', action: () => onSelectProduct?.('futbol_jersey_pro_vneck') },
        { label: 'Jersey Femme V1 Dama', action: () => onSelectProduct?.('futbol_jersey_f3w_women') },
        { label: 'Kit Portero Manga Larga', action: () => onSelectGoalkeeper?.() },
        { label: 'Short Matchday S1', action: () => onSelectProduct?.('football_shorts_fp3') },
      ],
    },
    {
      title: 'Baloncesto & Abrigo',
      links: [
        { label: 'Tank Court B1 Caballero', action: () => onSelectProduct?.('basketball_b6_hero') },
        { label: 'Short Court SB1 Largo', action: () => onSelectProduct?.('basketball_shorts_bp6') },
        { label: 'Tank Femme BW1 Dama', action: () => onSelectProduct?.('basketball_b7w_epic_women') },
        { label: 'Chamarras Softshell J1 / JW1', action: () => onSelectCategory?.('Chaquetas', 'all') },
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
      title: 'Atención Grupo Zava',
      links: [
        { label: 'Guía de Tallas XS–3XL', action: () => onOpenSizeGuide?.('sizes') },
        { label: 'Solicitar Caja de Muestras', action: () => onOpenSizeGuide?.('samples') },
        { label: 'Cotización por Volumen', action: () => onOpenQuoteModal?.() },
        { label: 'Rastrear Mis Pedidos', action: () => onOpenOrderTracking?.() },
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
        { label: 'Catálogo Completo (11)', action: () => onSelectCategory?.('all', 'all') },
        { label: 'Tejidos TS-Tex™ y CoolDry™', href: '#fabric-quality' },
        { label: 'Solicitar Cotización', action: () => onOpenQuoteModal?.() },
      ],
    },
    {
      id: 'ayuda',
      title: 'Ayuda y Pedidos',
      items: [
        { label: 'Preguntas Frecuentes (FAQ)', action: () => onOpenInfoModal?.('faq') },
        { label: 'Pagos, MSI y Sin Mínimo', action: () => onOpenInfoModal?.('payments') },
        { label: 'Envíos y Tiempos (10–12 días)', action: () => onOpenInfoModal?.('shipping') },
        { label: 'Rastrear Mis Pedidos', action: () => onOpenOrderTracking?.() },
      ],
    },
    {
      id: 'zava',
      title: 'ARZA SPORT',
      items: [
        { label: 'Guía de Tallas y Medidas', action: () => onOpenSizeGuide?.('sizes') },
        { label: 'Normativa y Lavado 60°C', action: () => onOpenInfoModal?.('care') },
        { label: 'Contacto y WhatsApp Directo', action: () => onOpenInfoModal?.('contact') },
        { label: 'Garantía Grupo Zava', action: () => onOpenInfoModal?.('contact') },
      ],
    },
  ];

  return (
    <footer className="w-full bg-white text-[#111111] border-t border-[#E5E5E5] pt-14 pb-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex justify-center mb-10">
          <a href="#" aria-label="Volver arriba — ARZA SPORT" className="inline-flex items-center gap-2">
            <ArzaLogo theme="light" variant="mark" decorative className="h-6 w-auto" />
            <span className="font-display-hero text-lg font-extrabold tracking-tight uppercase text-[#111111]">
              ARZA <span className="text-[#C24100]">SPORT</span>
            </span>
          </a>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto pb-14">
          {directoryCols.map((col) => (
            <div key={col.title}>
              <h2 className="text-base font-medium text-[#111111] mb-4">{col.title}</h2>
              <ul className="space-y-2.5 text-sm text-[#707072]">
                {col.links.map((lk) => (
                  <li key={lk.label}>
                    <button
                      type="button"
                      onClick={lk.action}
                      className="hover:text-[#111111] transition-colors text-left cursor-pointer"
                    >
                      {lk.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[#E5E5E5] pt-10">
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

            <div className="md:col-span-4">
              <label htmlFor={emailId} className="text-sm font-medium text-[#111111] block mb-2">
                Muestras Textiles para Clubes
              </label>
              <p className="text-xs sm:text-[13px] text-[#707072] mb-3 max-w-sm">
                Registra el correo de tu club o liga para recibir caja de tallas y muestrario físico Grupo Zava.
              </p>
              <form onSubmit={handleSampleEmailSubmit} className="flex items-center max-w-sm">
                <input
                  id={emailId}
                  type="email"
                  required
                  autoComplete="email"
                  value={sampleEmail}
                  onChange={(e) => setSampleEmail(e.target.value)}
                  placeholder="correo@tuclub.com"
                  className="bg-[#F5F5F5] border border-[#E5E5E5] text-xs sm:text-sm text-[#111111] px-4 min-h-10 rounded-l-full placeholder-[#707072] focus:outline-2 focus:outline-[#111111] w-full"
                />
                <button
                  type="submit"
                  className="bg-[#111111] hover:bg-[#3f3f46] text-white text-xs sm:text-sm font-medium px-5 min-h-10 rounded-r-full transition-colors shrink-0 cursor-pointer"
                >
                  {registeredSample ? 'Registrado' : 'Solicitar'}
                </button>
              </form>
              {registeredSample && (
                <p className="mt-2 text-xs text-emerald-700 font-semibold flex items-center gap-2">
                  <span>Folio {registeredSample.folio} guardado.</span>
                  <a
                    href={buildWhatsAppUrl(
                      `Hola ARZA SPORT, solicité muestras (${registeredSample.folio}) desde ${registeredSample.email}`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-[#111111] inline-flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Coordinar WhatsApp</span>
                  </a>
                </p>
              )}
            </div>

            <div className="md:col-span-2 flex justify-end items-center gap-1.5 text-xs font-medium text-[#707072]">
              <Globe className="w-4 h-4 text-[#111111]" aria-hidden="true" />
              <span>México</span>
            </div>
          </div>

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
                <form onSubmit={handleSampleEmailSubmit} className="flex items-center">
                  <input
                    type="email"
                    required
                    aria-label="Correo del club"
                    autoComplete="email"
                    value={sampleEmail}
                    onChange={(e) => setSampleEmail(e.target.value)}
                    placeholder="correo@tuclub.com"
                    className="bg-[#F5F5F5] border border-[#E5E5E5] text-sm text-[#111111] px-4 min-h-10 rounded-l-full placeholder-[#707072] w-full"
                  />
                  <button
                    type="submit"
                    className="bg-[#111111] text-white text-xs font-medium px-5 min-h-10 rounded-r-full shrink-0 cursor-pointer"
                  >
                    {registeredSample ? 'Listo' : 'Enviar'}
                  </button>
                </form>
              </div>
            </details>

            <div className="py-5 flex items-center gap-2 text-sm text-[#707072]">
              <Globe className="w-4 h-4 text-[#111111]" aria-hidden="true" />
              <span>México</span>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#707072]">
            <p>© 2026 ARZA SPORT — Grupo Zava. {ARZA_CONTACT.phoneDisplay}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <button
                type="button"
                onClick={() => onOpenSizeGuide?.('sizes')}
                className="hover:text-[#111111] transition-colors cursor-pointer"
              >
                Guía de Tallas XS–3XL
              </button>
              <button
                type="button"
                onClick={() => onOpenOrderTracking?.()}
                className="hover:text-[#111111] transition-colors cursor-pointer"
              >
                Rastrear Pedidos
              </button>
              <button
                type="button"
                onClick={() => onOpenInfoModal?.('contact')}
                className="hover:text-[#111111] transition-colors cursor-pointer"
              >
                Garantía y Contacto
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
