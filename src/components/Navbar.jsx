import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  FolderHeart,
  Menu,
  X,
  FileText,
  ArrowUpRight,
} from 'lucide-react';
import ArzaLogo from './brand/ArzaLogo';

export default function Navbar({
  cartCount = 0,
  onOpenCart,
  onOpenStudio,
  galleryCount = 0,
  onOpenGallery,
  onOpenQuoteModal,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      window.addEventListener('keydown', onKey);
    }
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: '#como-funciona', label: 'En 4 Pasos' },
    { href: '#drops-catalog', label: 'Moldes (13)' },
  ];

  return (
    <header className="sticky top-0 left-0 w-full z-50 arza-glass-bar border-b text-neutral-950">
      {/* Barra utilitaria superior minimalista */}
      <div className="bg-[#111111] text-white text-[11px] font-semibold py-2 px-4 sm:px-6 text-center tracking-wider uppercase">
        <span className="inline-flex items-center gap-2 max-w-full">
          <span className="inline-block w-2 h-2 rounded-full bg-[#FA5400] shrink-0" aria-hidden="true" />
          <span className="truncate">
            Grupo Zava • Marca Oficial ARZA SPORT — Sin Pedido Mínimo · Entrega 10–12 Días
          </span>
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 sm:min-h-20 flex items-center justify-between gap-3">
        {/* Logotipo oficial ARZA SPORT */}
        <a
          href="#"
          aria-label="ARZA SPORT by Zava — Ir al inicio"
          className="inline-flex items-center gap-2.5 sm:gap-3 shrink-0 group rounded-md py-1"
        >
          <ArzaLogo theme="light" className="h-10 sm:h-12 w-auto" />
          <span className="hidden sm:inline-flex items-center pl-2.5 border-l border-neutral-200 text-[10px] font-bold text-[#757575] tracking-[0.22em] uppercase">
            By Zava
          </span>
        </a>

        {/* Navegación Desktop */}
        <nav aria-label="Navegación principal" className="hidden lg:flex items-center gap-7 text-sm font-medium text-neutral-700">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="min-h-11 inline-flex items-center hover:text-[#111111] border-b-2 border-transparent hover:border-[#FA5400] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Acciones de App & Comercio */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onOpenQuoteModal && (
            <button
              type="button"
              onClick={onOpenQuoteModal}
              className="hidden xl:inline-flex items-center gap-1.5 px-3.5 min-h-11 rounded-full border border-neutral-300 hover:border-[#111111] text-[#111111] text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#C24100]" aria-hidden="true" />
              <span>Cotizar</span>
            </button>
          )}

          {onOpenGallery && (
            <button
              type="button"
              onClick={onOpenGallery}
              className="hidden sm:inline-flex relative px-3.5 min-h-11 rounded-full border border-neutral-300 hover:border-[#111111] text-[#111111] text-xs font-semibold items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FolderHeart className="w-3.5 h-3.5 text-[#C24100]" aria-hidden="true" />
              <span className="hidden md:inline">Guardados</span>
              {galleryCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#111111] text-white text-[10px] font-bold tabular-nums-pro">
                  {galleryCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenStudio}
            className="px-4 sm:px-5 min-h-11 rounded-full arza-btn-glass-green text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Diseñar en 4 Pasos</span>
            <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            className="relative min-w-11 min-h-11 inline-flex items-center justify-center rounded-full border border-neutral-300 hover:border-neutral-950 text-neutral-950 transition-colors cursor-pointer"
            aria-label={`Carrito de pedido (${cartCount} artículos)`}
          >
            <ShoppingBag className="w-4 h-4" aria-hidden="true" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-neutral-950 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full tabular-nums-pro">
                {cartCount}
              </span>
            )}
          </button>

          {/* Toggle Menú Móvil */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden min-w-11 min-h-11 inline-flex items-center justify-center rounded-full border border-neutral-300 hover:border-neutral-950 text-neutral-950 cursor-pointer"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
            aria-controls="arza-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Cajón Móvil Minimalista */}
      {mobileMenuOpen && (
        <nav
          id="arza-mobile-menu"
          aria-label="Menú móvil"
          className="lg:hidden bg-white border-t border-neutral-200 px-5 py-5 space-y-2 shadow-xl"
        >
          <ul className="grid grid-cols-2 gap-2" role="list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 min-h-11 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-950 text-sm font-semibold flex items-center transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="pt-3 mt-2 border-t border-neutral-200 grid grid-cols-2 gap-2">
            {onOpenGallery && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenGallery();
                }}
                className="min-h-11 px-4 rounded-full border border-neutral-300 text-neutral-950 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <FolderHeart className="w-4 h-4" aria-hidden="true" />
                <span>Guardados ({galleryCount})</span>
              </button>
            )}
            {onOpenQuoteModal && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenQuoteModal();
                }}
                className="min-h-11 px-4 rounded-full bg-neutral-950 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" aria-hidden="true" />
                <span>Cotizar Club</span>
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
