import React, { useEffect, useId, useRef, useState } from 'react';
import {
  ShoppingBag,
  FolderHeart,
  Menu,
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
  const menuId = useId();
  const headerRef = useRef(null);
  const innerRef = useRef(null);
  const navListRef = useRef(null);
  const [isWide, setIsWide] = useState(false);
  const [fallbackOpen, setFallbackOpen] = useState(false);

  const supportsPopover =
    typeof HTMLElement !== 'undefined' && Object.hasOwn(HTMLElement.prototype, 'popover');

  useEffect(() => {
    const header = headerRef.current;
    const inner = innerRef.current;
    const list = navListRef.current;
    if (!header || !inner || !list) return undefined;

    let rafId = 0;

    const measureLayout = () => {
      const wasPopoverOpen =
        supportsPopover && typeof list.matches === 'function' && list.matches(':popover-open');

      header.classList.add('is-measuring');
      list.removeAttribute('popover');
      header.classList.add('is-wide');

      const fitsInline = inner.scrollWidth <= inner.clientWidth + 1;

      header.classList.toggle('is-wide', fitsInline);
      if (fitsInline) {
        list.removeAttribute('popover');
        setFallbackOpen(false);
      } else if (supportsPopover) {
        list.setAttribute('popover', 'auto');
        if (wasPopoverOpen) {
          try {
            list.showPopover();
          } catch {}
        }
      }

      setIsWide(fitsInline);

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        header.classList.remove('is-measuring');
      });
    };

    measureLayout();

    const ro = new ResizeObserver(() => {
      measureLayout();
    });
    ro.observe(inner);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [supportsPopover]);

  const navLinks = [
    { href: '#como-funciona', label: 'En 4 Pasos' },
    { href: '#drops-catalog', label: 'Moldes (13)' },
    { href: '#fabric-quality', label: 'Telas' },
  ];

  const handleCloseCollapsedMenu = () => {
    const list = navListRef.current;
    if (supportsPopover && list && list.matches(':popover-open')) {
      try {
        list.hidePopover();
      } catch {}
    }
    setFallbackOpen(false);
  };

  return (
    <header
      ref={headerRef}
      className={`arza-site-header sticky top-0 left-0 w-full z-50 arza-glass-bar border-b text-neutral-950 ${
        isWide ? 'is-wide' : ''
      }`}
    >
      {/* Barra Oficial de Identidad ARZA SPORT */}
      <div className="bg-[#111111] border-b-2 border-[#FA5400] text-white text-[11px] font-bold py-2 px-4 sm:px-6 text-center tracking-wider uppercase">
        <span className="inline-flex items-center justify-center gap-2.5 max-w-full">
          <ArzaLogo theme="dark" variant="mark" decorative className="h-3.5 w-auto shrink-0" />
          <span className="truncate">
            ARZA SPORT · Marca Oficial Grupo Zava — Personalización 3D Directa Sin Mínimo
          </span>
        </span>
      </div>

      <div
        ref={innerRef}
        className="arza-header-inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 sm:min-h-20 flex items-center justify-between gap-3 sm:gap-5"
      >
        {/* Logotipo Emblema Oficial ARZA SPORT */}
        <a
          href="#"
          aria-label="ARZA SPORT by Grupo Zava — Inicio"
          className="inline-flex items-center gap-2.5 sm:gap-3 shrink-0 rounded-xl py-1 group"
        >
          <span className="inline-flex items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#111111] border border-neutral-800 group-hover:border-[#FA5400] transition-colors shadow-xs">
            <ArzaLogo theme="dark" className="h-8 sm:h-9 w-auto" />
          </span>
          <span className="hidden sm:flex flex-col leading-none">
            <span className="font-display-hero text-base sm:text-lg font-extrabold tracking-tight text-[#111111] uppercase">
              ARZA <span className="text-[#C24100]">SPORT</span>
            </span>
            <span className="text-[10px] font-bold text-[#757575] tracking-[0.2em] uppercase mt-0.5">
              By Grupo Zava
            </span>
          </span>
        </a>

        {/* Árbol único de navegación (<nav> semántico responsive) */}
        <nav aria-label="Navegación principal" className="flex items-center gap-4">
          <ul
            ref={navListRef}
            id={menuId}
            className={`arza-site-menu rounded-2xl bg-white/95 backdrop-blur-xl border border-neutral-200 shadow-2xl p-3 gap-1.5 text-sm font-semibold text-neutral-800 ${
              !isWide && fallbackOpen ? 'is-fallback-open' : ''
            }`}
          >
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={handleCloseCollapsedMenu}
                  className="px-3.5 lg:px-1 min-h-11 rounded-xl lg:rounded-none hover:bg-neutral-100 lg:hover:bg-transparent flex items-center hover:text-[#111111] lg:border-b-2 lg:border-transparent lg:hover:border-[#FA5400] transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}

            {onOpenGallery && (
              <li className="arza-collapsed-only pt-1.5 mt-1 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    handleCloseCollapsedMenu();
                    onOpenGallery();
                  }}
                  className="w-full px-3.5 min-h-11 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <FolderHeart className="w-4 h-4 text-[#C24100]" aria-hidden="true" />
                  <span>Guardados ({galleryCount})</span>
                </button>
              </li>
            )}
            {onOpenQuoteModal && (
              <li className="arza-collapsed-only">
                <button
                  type="button"
                  onClick={() => {
                    handleCloseCollapsedMenu();
                    onOpenQuoteModal();
                  }}
                  className="w-full px-3.5 min-h-11 rounded-xl bg-[#111111] text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#FA5400]" aria-hidden="true" />
                  <span>Cotización de Club</span>
                </button>
              </li>
            )}
          </ul>

          {/* Acciones de App & Comercio */}
          <div className="flex items-center gap-2 shrink-0">
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

            {/* Botón Menú Compacto (solo visible cuando !isWide) */}
            <button
              type="button"
              popoverTarget={supportsPopover ? menuId : undefined}
              popoverTargetAction={supportsPopover ? 'toggle' : undefined}
              aria-controls={menuId}
              aria-expanded={!supportsPopover ? fallbackOpen : undefined}
              aria-label="Abrir menú de navegación"
              onClick={() => {
                if (!supportsPopover) {
                  setFallbackOpen((v) => !v);
                }
              }}
              className="arza-menu-button min-w-11 min-h-11 inline-flex items-center justify-center rounded-full border border-neutral-300 hover:border-neutral-950 text-neutral-950 cursor-pointer"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
