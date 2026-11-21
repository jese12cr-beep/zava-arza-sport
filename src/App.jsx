import React, { useCallback, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import HybridStudioWorkspace from './components/studio/HybridStudioWorkspace';
import ProductionPayloadModal from './components/studio/ProductionPayloadModal';
import Navbar, { UtilityBar } from './components/Navbar';
import Hero from './components/Hero';
import CampaignSections from './components/CampaignSections';
import ProductCatalog from './components/ProductCatalog';
import QualityShowcase from './components/QualityShowcase';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import ShopifyIntegrationGuide from './components/ShopifyIntegrationGuide';
import OrderQuoteModal from './components/OrderQuoteModal';
import UserDesignGalleryModal from './components/studio/UserDesignGalleryModal';
import { loadUserGallery } from './utils/userGalleryStore';
import { buildShopifyAndManufacturingBundle } from './engine/exporter/printReadyBuilder';
import {
  ENGINE_PRODUCTS,
  INITIAL_TEAM_ROSTER,
  createInitialMasterDesign,
  createDefaultDesignForProduct,
  generateDesignId,
  summarizeRosterComposition,
} from './engine/core/designStore';

function createInitialKitSnapshot() {
  const designsByProduct = {};
  for (const prod of ENGINE_PRODUCTS) {
    designsByProduct[prod.id] = createDefaultDesignForProduct(prod.id);
  }
  return {
    activeProductId: 'futbol_jersey_pro_vneck',
    designsByProduct,
  };
}

export default function App() {
  const [appMode, setAppMode] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#studio')) {
      return 'studio';
    }
    return 'storefront';
  });

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash || '';
      if (hash.startsWith('#studio')) {
        setAppMode('studio');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (hash === '#storefront' || hash === '') {
        setAppMode('storefront');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const switchMode = useCallback((mode) => {
    setAppMode(mode);
    if (typeof window !== 'undefined') {
      window.location.hash = mode === 'studio' ? '#studio' : '';
      if (mode === 'studio') {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  }, []);

  // Historial Undo/Redo de 50 pasos atómico con memoria independiente por prenda del kit
  const [{ history, historyIdx }, setHistoryState] = useState(() => ({
    history: [createInitialKitSnapshot()],
    historyIdx: 0,
  }));

  const currentSnapshot = history[historyIdx] || history[0];
  const activeProductId = currentSnapshot?.activeProductId || 'futbol_jersey_pro_vneck';
  const design =
    currentSnapshot?.designsByProduct?.[activeProductId] ||
    (currentSnapshot?.designsByProduct
      ? Object.values(currentSnapshot.designsByProduct)[0]
      : createInitialMasterDesign());

  const [roster, setRoster] = useState(INITIAL_TEAM_ROSTER);
  const [artworkRegistry, setArtworkRegistry] = useState({});

  const [cartItems, setCartItems] = useState([]);
  const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isShopifyGuideOpen, setIsShopifyGuideOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isStorefrontGalleryOpen, setIsStorefrontGalleryOpen] = useState(false);
  const [studioInitialStep, setStudioInitialStep] = useState(1);
  const [catalogSport, setCatalogSport] = useState('all');
  const [catalogGender, setCatalogGender] = useState('all');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [galleryCount, setGalleryCount] = useState(() => {
    try {
      return loadUserGallery().length;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        setGalleryCount(loadUserGallery().length);
      } catch {}
    };
    window.addEventListener('arza_gallery_updated', handleUpdate);
    return () => window.removeEventListener('arza_gallery_updated', handleUpdate);
  }, []);

  const handleLoadDesignFromStorefrontGallery = (item) => {
    if (!item?.design) return;
    if (item.productModelId) {
      handleSwitchProduct(item.productModelId);
    }
    handleCommitDesign(item.design, true);
    if (item.roster && item.roster.length > 0) {
      setRoster(item.roster);
    }
    setIsStorefrontGalleryOpen(false);
    switchMode('studio');
  };

  const currentProduct =
    ENGINE_PRODUCTS.find((p) => p.id === design.productModelId) || ENGINE_PRODUCTS[0];

  const pushSnapshot = useCallback((updater, recordUndo = true) => {
    setHistoryState((prev) => {
      const curIdx = Math.min(prev.historyIdx, prev.history.length - 1);
      const baseSnap = prev.history[curIdx];
      const nextSnap = typeof updater === 'function' ? updater(baseSnap) : updater;

      if (!recordUndo) {
        const copy = [...prev.history];
        copy[curIdx] = nextSnap;
        return { ...prev, history: copy };
      }
      const sliced = prev.history.slice(0, curIdx + 1).slice(-50);
      const nextArr = [...sliced, nextSnap];
      return {
        history: nextArr,
        historyIdx: nextArr.length - 1,
      };
    });
  }, []);

  const handleCommitDesign = useCallback(
    (nextDesign, recordUndo = true) => {
      pushSnapshot((snap) => {
        const pid = nextDesign.productModelId || snap.activeProductId;
        return {
          activeProductId: pid,
          designsByProduct: {
            ...snap.designsByProduct,
            [pid]: nextDesign,
          },
        };
      }, recordUndo);
    },
    [pushSnapshot]
  );

  const handleSwitchProduct = useCallback(
    (targetProductId) => {
      pushSnapshot((snap) => {
        const curDesign = snap.designsByProduct[snap.activeProductId];
        const existing = snap.designsByProduct[targetProductId];
        const resolved =
          existing || createDefaultDesignForProduct(targetProductId, curDesign?.colorZones || null);
        return {
          activeProductId: targetProductId,
          designsByProduct: {
            ...snap.designsByProduct,
            [targetProductId]: resolved,
          },
        };
      }, true);
    },
    [pushSnapshot]
  );

  const handleSyncPairedColors = useCallback(() => {
    const pairedId = currentProduct.pairedProductId;
    if (!pairedId) return;
    pushSnapshot((snap) => {
      const sourceDesign = snap.designsByProduct[snap.activeProductId];
      const targetExisting =
        snap.designsByProduct[pairedId] ||
        createDefaultDesignForProduct(pairedId, sourceDesign?.colorZones);
      return {
        ...snap,
        designsByProduct: {
          ...snap.designsByProduct,
          [pairedId]: {
            ...targetExisting,
            colorZones: JSON.parse(JSON.stringify(sourceDesign.colorZones)),
          },
        },
      };
    }, true);
  }, [currentProduct.pairedProductId, pushSnapshot]);

  const handleUndo = useCallback(() => {
    setHistoryState((prev) => ({
      ...prev,
      historyIdx: Math.max(0, prev.historyIdx - 1),
    }));
  }, []);

  const handleRedo = useCallback(() => {
    setHistoryState((prev) => ({
      ...prev,
      historyIdx: Math.min(prev.history.length - 1, prev.historyIdx + 1),
    }));
  }, []);

  // Atajos globales de teclado Ctrl+Z / Ctrl+Y idénticos a Owayo
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  const handleRegisterArtwork = (artworkId, assetData) => {
    setArtworkRegistry((prev) => ({ ...prev, [artworkId]: assetData }));
  };

  const createCartEntryFromBundle = useCallback(
    (bundle, existingCartId = null) => {
      const comp = summarizeRosterComposition(roster);
      const keeperNote = comp.keeperUnits > 0 ? ` (${comp.playerUnits} Jug. + ${comp.keeperUnits} Port.)` : '';
      return {
        cartId: existingCartId || `item_${Date.now()}`,
        designId: design.designId,
        product: {
          id: currentProduct.id,
          name: currentProduct.name,
          type: currentProduct.renderMode,
          description: `${bundle.pricing.totalUnits} prendas${keeperNote} vinculadas a ${design.designId}`,
        },
        design: {
          baseColor: design.colorZones.primary?.hex,
          sleeveColor: design.colorZones.sleeves?.hex,
          pattern: design.patternId,
          playerName: roster[0]?.name || 'EQUIPO',
          playerNumber: roster[0]?.number || '10',
          sponsorText: (design.decals || []).find((d) => d.type === 'STATIC_TEXT')?.text || '',
        },
        roster: roster.map((r, i) => ({
          id: r.id || i,
          name: r.name,
          number: r.number,
          role: r.role || 'Jugador',
          qty: Number(r.qty) || 1,
          size: `${r.size} (${r.cut}) x${Number(r.qty) || 1}`,
        })),
        keeperUnits: comp.keeperUnits,
        playerUnits: comp.playerUnits,
        totalUnits: bundle.pricing.totalUnits,
        unitPrice: bundle.pricing.unitPrice.toFixed(2),
        totalPrice: bundle.pricing.totalOrderPrice.toFixed(2),
      };
    },
    [currentProduct, design, roster]
  );

  const handleConfirmAddToCart = (bundle) => {
    const newItem = createCartEntryFromBundle(bundle);
    setCartItems((prev) => [...prev, newItem]);
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.65 } });

    handleCommitDesign({ ...design, designId: generateDesignId() }, true);
    setIsCartOpen(true);
  };

  const handleFinishOrderToCheckout = () => {
    const bundle = buildShopifyAndManufacturingBundle(design, currentProduct, roster);
    setCartItems((prev) => {
      const matchIdx = prev.findIndex(
        (item) => item.designId === design.designId && item.product?.id === currentProduct.id
      );
      if (matchIdx >= 0) {
        const updated = [...prev];
        updated[matchIdx] = createCartEntryFromBundle(bundle, prev[matchIdx].cartId);
        return updated;
      }
      return [...prev, createCartEntryFromBundle(bundle)];
    });
    setIsCartOpen(true);
  };

  const handleOpenGuidedWizard = useCallback(
    (step = 1) => {
      setStudioInitialStep(step);
      switchMode('studio');
    },
    [switchMode]
  );

  const handleSelectCatalogCategory = (sport = 'all', gender = 'all') => {
    setCatalogSport(sport);
    setCatalogGender(gender);
    if (typeof window !== 'undefined') {
      const target = document.getElementById('drops-catalog');
      if (target) {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
    }
  };

  const handleSelectCatalogProduct = (engineId) => {
    handleSwitchProduct(engineId);
    setStudioInitialStep(1);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    setAppMode('studio');
    if (typeof window !== 'undefined') {
      window.location.hash = '#studio';
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {appMode === 'studio' ? (
        <HybridStudioWorkspace
          design={design}
          designsByProduct={currentSnapshot.designsByProduct}
          onSwitchProduct={handleSwitchProduct}
          onSyncPairedColors={handleSyncPairedColors}
          onCommitDesign={handleCommitDesign}
          canUndo={historyIdx > 0}
          canRedo={historyIdx < history.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
          roster={roster}
          onUpdateRoster={setRoster}
          artworkRegistry={artworkRegistry}
          onRegisterArtwork={handleRegisterArtwork}
          onOpenProductionModal={() => setIsProductionModalOpen(true)}
          onFinishOrderToCheckout={handleFinishOrderToCheckout}
          onOpenCart={() => setIsCartOpen(true)}
          cartCount={cartItems.length}
          onSwitchToStorefront={() => switchMode('storefront')}
          initialStep={studioInitialStep}
        />
      ) : (
        <div className="arza-storefront-wrap flex flex-col min-h-screen bg-white">
          <UtilityBar
            onOpenStudio={() => handleOpenGuidedWizard(1)}
            onSelectCategory={handleSelectCatalogCategory}
            onOpenQuoteModal={() => setIsQuoteModalOpen(true)}
          />
          <Navbar
            cartCount={cartItems.length}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenStudio={() => handleOpenGuidedWizard(1)}
            galleryCount={galleryCount}
            onOpenGallery={() => setIsStorefrontGalleryOpen(true)}
            onOpenShopifyGuide={() => setIsShopifyGuideOpen(true)}
            onOpenQuoteModal={() => setIsQuoteModalOpen(true)}
            onSelectCategory={handleSelectCatalogCategory}
            searchQuery={catalogSearch}
            onSearchChange={(q) => setCatalogSearch(q)}
          />
          <main className="flex-1 w-full bg-white">
            <Hero
              onStartDesigning={(productId) => {
                if (typeof productId === 'string' && productId) {
                  handleSelectCatalogProduct(productId);
                } else {
                  handleOpenGuidedWizard(1);
                }
              }}
            />
            <CampaignSections
              onSelectCategory={handleSelectCatalogCategory}
              onSelectProduct={handleSelectCatalogProduct}
            />
            <ProductCatalog
              sportFilter={catalogSport}
              genderFilter={catalogGender}
              searchQuery={catalogSearch}
              onChangeSportFilter={setCatalogSport}
              onChangeGenderFilter={setCatalogGender}
              onClearSearch={() => setCatalogSearch('')}
              onSelectProduct={handleSelectCatalogProduct}
              onOpenQuote={() => setIsQuoteModalOpen(true)}
            />
            <QualityShowcase onOpenTexturesInStudio={() => handleOpenGuidedWizard(2)} />
          </main>
          <Footer
            onOpenShopifyGuide={() => setIsShopifyGuideOpen(true)}
            onSelectCategory={handleSelectCatalogCategory}
            onSelectProduct={handleSelectCatalogProduct}
            onOpenStudio={() => handleOpenGuidedWizard(1)}
            onOpenQuoteModal={() => setIsQuoteModalOpen(true)}
          />
        </div>
      )}

      <ProductionPayloadModal
        isOpen={isProductionModalOpen}
        onClose={() => setIsProductionModalOpen(false)}
        design={design}
        product={currentProduct}
        roster={roster}
        artworkRegistry={artworkRegistry}
        onConfirmAddToCart={handleConfirmAddToCart}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemoveItem={(id) => setCartItems((prev) => prev.filter((x) => x.cartId !== id))}
        onClearCart={() => setCartItems([])}
        onOpenQuoteModal={() => {
          setIsCartOpen(false);
          setIsQuoteModalOpen(true);
        }}
        onOpenProductionModal={() => {
          setIsCartOpen(false);
          setIsProductionModalOpen(true);
        }}
      />

      <ShopifyIntegrationGuide
        isOpen={isShopifyGuideOpen}
        onClose={() => setIsShopifyGuideOpen(false)}
      />

      <OrderQuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        items={cartItems}
      />

      <UserDesignGalleryModal
        isOpen={isStorefrontGalleryOpen}
        onClose={() => setIsStorefrontGalleryOpen(false)}
        currentDesign={design}
        currentProduct={currentProduct}
        currentRoster={roster}
        unitPrice={34}
        totalUnits={roster.length}
        totalPrice={34 * roster.length}
        onLoadDesignFromGallery={handleLoadDesignFromStorefrontGallery}
      />
    </div>
  );
}
