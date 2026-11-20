import React, { useEffect, useId, useRef, useState } from 'react';
import {
  ShoppingBag,
  Heart,
  Menu,
  Search,
  FileText,
  X,
} from 'lucide-react';
import ArzaLogo from './brand/ArzaLogo';

export function UtilityBar({
  onOpenStudio,
  onSelectCategory,
  onOpenQuoteModal,
}) {
  return (
    <div className="hidden lg:flex w-full bg-[#F5F5F5] text-[#111111] h-9 px-6 lg:px-12 items-center justify-between text-xs font-medium border-b border-transparent">
      <div className="flex items-center gap-2">
        <ArzaLogo theme="light" variant="mark" decorative className="h-3.5 w-auto" />
        <span className="font-semibold tracking-wider uppercase text-[11px] text-[#111111]">
          Grupo Zava · México
        </span>
      </div>

      <div className="flex items-center gap-3 text-[12px]">
        <button
          type="button"
          onClick={onOpenStudio}
          className="hover:text-[#707072] transition-colors cursor-pointer"
        >
          Personalizador
        </button>
        <span aria-hidden="true" className="text-[#CACACB]">|</span>
        <a
          href="#drops-catalog"
          onClick={() => onSelectCategory?.('all', 'all')}
          className="hover:text-[#707072] transition-colors"
        >
          Catálogo (8)
        </a>
        <span aria-hidden="true" className="text-[#CACACB]">|</span>
        <a
          href="#fabric-quality"
          className="hover:text-[#707072] transition-colors"
        >
          Telas Técnicas
        </a>
        <span aria-hidden="true" className="text-[#CACACB]">|</span>
        <button
          type="button"
          onClick={onOpenQuoteModal}
          className="hover:text-[#707072] transition-colors cursor-pointer"
        >
          Cotizar Club
        </button>
      </div>
    </div>
  );
}

export default function Navbar({
  cartCount = 0,
  onOpenCart,
  onOpenStudio,
  galleryCount = 0,
  onOpenGallery,
  onOpenQuoteModal,
  onSelectCategory,
  searchQuery = '',
  onSearchChange,
}) {
  const menuId = useId();
  const searchInputId = useId();
  const headerRef = useRef(null);
  const sentinelRef = useRef(null);
  const innerRef = useRef(null);
  const navListRef = useRef(null);
  const [isWide, setIsWide] = useState(false);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);

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

  useEffect(() => {
    const header = headerRef.current;
    const sentinel = sentinelRef.current;
    if (!header || !sentinel || typeof IntersectionObserver === 'undefined') return undefined;

    if (typeof CSS !== 'undefined' && CSS.supports('container-type: scroll-state')) {
      return undefined;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        header.classList.toggle('is-stuck', !entry.isIntersecting);
      },
      { threshold: 0 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const list = navListRef.current;
      const menuOpen =
        fallbackOpen || (supportsPopover && list && list.matches(':popover-open'));

      if (menuOpen || mobileSearchOpen || y < 140) {
        setNavHidden(false);
      } else if (y > lastScrollY.current + 12) {
        setNavHidden(true);
      } else if (y < lastScrollY.current - 12) {
        setNavHidden(false);
      }
      lastScrollY.current = y;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [fallbackOpen, mobileSearchOpen, supportsPopover]);

  const handleCloseCollapsedMenu = () => {
    const list = navListRef.current;
    if (supportsPopover && list && list.matches(':popover-open')) {
      try {
        list.hidePopover();
      } catch {}
    }
    setFallbackOpen(false);
  };

  const scrollToCatalog = () => {
    const target = document.getElementById('drops-catalog');
    if (target) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  };

  const handleCategoryNav = (sport, gender) => {
    handleCloseCollapsedMenu();
    if (onSelectCategory) {
      onSelectCategory(sport, gender);
    }
    scrollToCatalog();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    scrollToCatalog();
  };

  const navItems = [
    { label: 'Caballero', sport: 'all', gender: 'men' },
    { label: 'Dama', sport: 'all', gender: 'women' },
    { label: 'Fútbol', sport: 'Fútbol', gender: 'all' },
    { label: 'Baloncesto', sport: 'Baloncesto', gender: 'all' },
    { label: 'E-Sports', sport: 'E-Sports', gender: 'all' },
    { label: 'Personalizar', isStudio: true },
  ];

  const handleNavClick = (item) => {
    if (item.isStudio) {
      handleCloseCollapsedMenu();
      onOpenStudio?.();
      return;
    }
    handleCategoryNav(item.sport, item.gender);
  };

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full -mb-px pointer-events-none" />
      <header
        ref={headerRef}
        className={`arza-site-header ${isWide ? 'is-wide' : ''} ${
          navHidden ? 'is-nav-hidden' : ''
        }`}
      >
        <div className="arza-header-surface">
          <div
            ref={innerRef}
            className="arza-header-inner max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 min-h-[60px] flex items-center justify-between gap-3 sm:gap-4"
          >
            {/* Marca ARZA SPORT a la izquierda sin recuadro */}
            <a
              href="#"
              aria-label="ARZA SPORT by Grupo Zava — Inicio"
              className="inline-flex items-center gap-2 shrink-0 py-1 group"
            >
              <ArzaLogo
                theme="light"
                variant="mark"
                decorative
                className="h-6 sm:h-7 w-auto shrink-0 transition-transform duration-200 group-hover:scale-105"
              />
              <span className="font-display-hero text-base sm:text-xl font-extrabold tracking-tight text-[#111111] uppercase">
                ARZA <span className="text-[#C24100]">SPORT</span>
              </span>
            </a>

            {/* Navegación principal centrada (árbol único responsive) */}
            <nav aria-label="Navegación principal" className="flex items-center gap-1 sm:gap-2">
              <ul
                ref={navListRef}
                id={menuId}
                className={`arza-site-menu rounded-none sm:rounded-xl lg:rounded-none bg-white border border-[#E5E5E5] lg:border-0 shadow-2xl lg:shadow-none p-4 lg:p-0 gap-1 text-[15px] font-medium text-[#111111] ${
                  !isWide && fallbackOpen ? 'is-fallback-open' : ''
                }`}
              >
                {navItems.map((item) => (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={() => handleNavClick(item)}
                      className="w-full lg:w-auto text-left px-3 lg:px-1 min-h-11 lg:min-h-[60px] hover:text-[#707072] lg:border-b-2 lg:border-transparent lg:hover:border-[#111111] flex items-center transition-colors cursor-pointer"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}

                {onOpenQuoteModal && (
                  <li className="arza-collapsed-only pt-2 mt-2 border-t border-[#E5E5E5]">
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseCollapsedMenu();
                        onOpenQuoteModal();
                      }}
                      className="w-full px-3 min-h-11 bg-[#111111] text-white text-sm font-medium rounded-full flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FileText className="w-4 h-4" aria-hidden="true" />
                      <span>Cotización de Club</span>
                    </button>
                  </li>
                )}
              </ul>
            </nav>

            {/* Controles derecha estilo Nike MX: Buscador Píldora + Favoritos + Bolsa + Menú */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <form
                onSubmit={handleSearchSubmit}
                className="hidden sm:flex items-center relative w-36 lg:w-44"
                role="search"
                aria-label="Buscar prendas ARZA SPORT"
              >
                <label htmlFor={searchInputId} className="visually-hidden">
                  Buscar prendas
                </label>
                <button
                  type="submit"
                  aria-label="Buscar"
                  className="absolute left-1 min-w-9 min-h-9 rounded-full inline-flex items-center justify-center text-[#111111] hover:bg-[#E5E5E5] transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4" aria-hidden="true" />
                </button>
                <input
                  id={searchInputId}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder="Buscar"
                  className="w-full min-h-9 pl-10 pr-3 rounded-full bg-[#F5F5F5] hover:bg-[#E5E5E5] focus:bg-[#F5F5F5] text-sm text-[#111111] placeholder-[#707072] focus:outline-2 focus:outline-[#111111] transition-colors"
                />
              </form>

              <button
                type="button"
                onClick={() => setMobileSearchOpen((v) => !v)}
                aria-label="Buscar prendas"
                aria-expanded={mobileSearchOpen}
                className="sm:hidden min-w-10 min-h-10 rounded-full inline-flex items-center justify-center hover:bg-[#F5F5F5] text-[#111111] transition-colors cursor-pointer"
              >
                {mobileSearchOpen ? (
                  <X className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Search className="w-5 h-5" aria-hidden="true" />
                )}
              </button>

              {onOpenGallery && (
                <button
                  type="button"
                  onClick={onOpenGallery}
                  aria-label={`Diseños guardados (${galleryCount})`}
                  className="relative min-w-10 min-h-10 rounded-full inline-flex items-center justify-center hover:bg-[#F5F5F5] text-[#111111] transition-colors cursor-pointer"
                >
                  <Heart className="w-5 h-5" aria-hidden="true" />
                  {galleryCount > 0 && (
                    <span className="absolute top-1 right-0.5 bg-[#111111] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full tabular-nums-pro">
                      {galleryCount}
                    </span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onOpenCart}
                aria-label={`Bolsa de pedido (${cartCount} artículos)`}
                className="relative min-w-10 min-h-10 rounded-full inline-flex items-center justify-center hover:bg-[#F5F5F5] text-[#111111] transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-5 h-5" aria-hidden="true" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-0.5 bg-[#111111] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full tabular-nums-pro">
                    {cartCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                popoverTarget={supportsPopover ? menuId : undefined}
                popoverTargetAction={supportsPopover ? 'toggle' : undefined}
                aria-controls={menuId}
                aria-expanded={!supportsPopover ? fallbackOpen : undefined}
                aria-label="Menú"
                onClick={() => {
                  if (!supportsPopover) {
                    setFallbackOpen((v) => !v);
                  }
                }}
                className="arza-menu-button min-w-10 min-h-10 rounded-full inline-flex items-center justify-center hover:bg-[#F5F5F5] text-[#111111] cursor-pointer"
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {mobileSearchOpen && (
            <form
              onSubmit={(e) => {
                handleSearchSubmit(e);
                setMobileSearchOpen(false);
              }}
              className="sm:hidden px-4 pb-3 bg-white border-b border-[#E5E5E5]"
              role="search"
              aria-label="Buscar prendas móvil"
            >
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-[#707072] absolute left-3.5" aria-hidden="true" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder="Buscar jersey, short, fútbol, dama..."
                  className="w-full min-h-10 pl-10 pr-4 rounded-full bg-[#F5F5F5] text-sm text-[#111111] placeholder-[#707072] focus:outline-2 focus:outline-[#111111]"
                />
              </div>
            </form>
          )}
        </div>
      </header>
    </>
  );
}
