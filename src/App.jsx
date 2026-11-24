import React, { useCallback, useEffect, useState } from 'react';
import HybridStudioWorkspace from './components/studio/HybridStudioWorkspace';
import Navbar, { UtilityBar } from './components/Navbar';
import Hero from './components/Hero';
import CampaignSections from './components/CampaignSections';
import ProductCatalog from './components/ProductCatalog';
import QualityShowcase from './components/QualityShowcase';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import OrderQuoteModal from './components/OrderQuoteModal';
import SizeGuideModal from './components/SizeGuideModal';
import StorefrontInfoModal from './components/StorefrontInfoModal';
import OrderTrackingModal from './components/OrderTrackingModal';
import UserDesignGalleryModal from './components/studio/UserDesignGalleryModal';
import { loadUserGallery } from './utils/userGalleryStore';
import { loadOrderHistory } from './utils/orderHistoryStore';
import { buildShopifyAndManufacturingBundle } from './engine/exporter/printReadyBuilder';
import {
  ENGINE_PRODUCTS,
  FABRIC_WEAVES,
  INITIAL_TEAM_ROSTER,
  createInitialMasterDesign,
  createDefaultDesignForProduct,
  createDefaultGoalkeeperDesign,
  createDefaultGlovesDesign,
  summarizeRosterComposition,
} from './engine/core/designStore';

function createInitialKitSnapshot() {
  const designsByProduct = {};
  for (const prod of ENGINE_PRODUCTS) {
    designsByProduct[prod.id] = createDefaultDesignForProduct(prod.id);
  }
  const baseField = designsByProduct.futbol_jersey_pro_vneck;
  return {
    activeProductId: 'futbol_jersey_pro_vneck',
    activeKitRole: 'field',
    includeGloves: true,
    designsByProduct,
    goalkeeperDesign: createDefaultGoalkeeperDesign('futbol_jersey_pro_vneck', baseField),
    glovesDesign: createDefaultGlovesDesign(baseField),
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
  const activeKitRole = currentSnapshot?.activeKitRole || 'field';
  const includeGloves = currentSnapshot?.includeGloves !== false;
  const fieldDesign =
    currentSnapshot?.designsByProduct?.[activeProductId] ||
    (currentSnapshot?.designsByProduct
      ? Object.values(currentSnapshot.designsByProduct)[0]
      : createInitialMasterDesign());
  const goalkeeperDesign =
    currentSnapshot?.goalkeeperDesign ||
    createDefaultGoalkeeperDesign(activeProductId, fieldDesign);
  const glovesDesign =
    currentSnapshot?.glovesDesign || createDefaultGlovesDesign(fieldDesign);
  const design = activeKitRole === 'goalkeeper' ? goalkeeperDesign : fieldDesign;

  const [roster, setRoster] = useState(INITIAL_TEAM_ROSTER);
  const [artworkRegistry, setArtworkRegistry] = useState({});

  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [sizeGuideState, setSizeGuideState] = useState({ open: false, tab: 'sizes' });
  const [infoModalState, setInfoModalState] = useState({ open: false, topic: 'faq' });
  const [trackingState, setTrackingState] = useState({ open: false, folio: '' });
  const [isStorefrontGalleryOpen, setIsStorefrontGalleryOpen] = useState(false);
  const [studioInitialStep, setStudioInitialStep] = useState(1);
  const [catalogSport, setCatalogSport] = useState('all');
  const [catalogGender, setCatalogGender] = useState('all');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [orderCount, setOrderCount] = useState(() => {
    try {
      return loadOrderHistory().length;
    } catch {
      return 0;
    }
  });
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
    const handleOrdersUpdate = () => {
      try {
        setOrderCount(loadOrderHistory().length);
      } catch {}
    };
    window.addEventListener('arza_gallery_updated', handleUpdate);
    window.addEventListener('arza_orders_updated', handleOrdersUpdate);
    return () => {
      window.removeEventListener('arza_gallery_updated', handleUpdate);
      window.removeEventListener('arza_orders_updated', handleOrdersUpdate);
    };
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
        if (snap.activeKitRole === 'goalkeeper') {
          return {
            ...snap,
            goalkeeperDesign: {
              ...nextDesign,
              isGoalkeeper: true,
              sleeveLength: 'long',
            },
          };
        }
        const pid = nextDesign.productModelId || snap.activeProductId;
        return {
          ...snap,
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

  const handleSwitchKitRole = useCallback(
    (nextRole) => {
      pushSnapshot((snap) => ({
        ...snap,
        activeKitRole: nextRole || 'field',
      }), false);
    },
    [pushSnapshot]
  );

  const handleCommitGlovesDesign = useCallback(
    (nextGloves, recordUndo = true) => {
      pushSnapshot((snap) => ({
        ...snap,
        glovesDesign: nextGloves,
      }), recordUndo);
    },
    [pushSnapshot]
  );

  const handleToggleIncludeGloves = useCallback(
    (nextInclude) => {
      pushSnapshot((snap) => ({
        ...snap,
        includeGloves: Boolean(nextInclude),
      }), true);
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
          ...snap,
          activeKitRole: 'field',
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
      const targetProd =
        ENGINE_PRODUCTS.find((p) => p.id === fieldDesign.productModelId) || currentProduct;
      const isSoccer = !targetProd || targetProd.sport === 'Fútbol';
      const rawComp = summarizeRosterComposition(roster, isSoccer && includeGloves);
      const comp = isSoccer
        ? rawComp
        : { ...rawComp, keeperUnits: 0, playerUnits: rawComp.totalUnits, glovePairs: 0 };
      const keeperNote = comp.keeperUnits > 0 ? ` (${comp.playerUnits} Jug. + ${comp.keeperUnits} Port. Manga Larga)` : '';
      const glovesNote = comp.glovePairs > 0 ? ` + ${comp.glovePairs} par guantes` : '';
      const weaveMeta = FABRIC_WEAVES.find((w) => w.id === fieldDesign.fabricWeaveId);
      return {
        cartId: existingCartId || `item_${Date.now()}`,
        designId: fieldDesign.designId,
        product: {
          id: targetProd.id,
          name: targetProd.name,
          type: targetProd.renderMode,
          description: `${bundle.pricing.totalUnits} prendas${keeperNote}${glovesNote} vinculadas a ${fieldDesign.designId}`,
        },
        design: {
          baseColor: fieldDesign.colorZones.primary?.hex,
          sleeveColor: fieldDesign.colorZones.sleeves?.hex,
          accentColor: fieldDesign.colorZones.accents?.hex,
          pattern: fieldDesign.patternId,
          collarStyle: fieldDesign.proCollar || fieldDesign.collarStyle || 'v_neck',
          fabricName: weaveMeta?.name || 'Tejido Técnico ARZA',
          playerName: roster[0]?.name || 'EQUIPO',
          playerNumber: roster[0]?.number || '10',
          sponsorText: (fieldDesign.decals || []).find((d) => d.type === 'STATIC_TEXT')?.text || '',
        },
        goalkeeperSpec:
          comp.keeperUnits > 0
            ? {
                sleeveLength: 'long',
                primaryColor: goalkeeperDesign.colorZones?.primary?.hex,
                secondaryColor: goalkeeperDesign.colorZones?.secondary?.hex,
                keeperUnits: comp.keeperUnits,
              }
            : null,
        glovesSpec:
          comp.glovePairs > 0
            ? {
                glovePairs: comp.glovePairs,
                gloveCut: glovesDesign.gloveCut,
                unitPrice: glovesDesign.unitPrice,
                totalPrice: +(glovesDesign.unitPrice * comp.glovePairs).toFixed(2),
                colors: glovesDesign.colorZones,
              }
            : null,
        roster: roster.map((r, i) => ({
          id: r.id || i,
          name: r.name,
          number: r.number,
          cut: r.cut,
          role: isSoccer ? r.role || 'Jugador' : 'Jugador',
          gloveSize: isSoccer ? r.gloveSize || '9' : undefined,
          qty: Number(r.qty) || 1,
          size: `${r.size} x${Number(r.qty) || 1}`,
        })),
        keeperUnits: comp.keeperUnits,
        playerUnits: comp.playerUnits,
        glovePairs: comp.glovePairs,
        totalUnits: bundle.pricing.totalUnits,
        unitPrice: bundle.pricing.unitPrice.toFixed(2),
        totalPrice: bundle.pricing.totalOrderPrice.toFixed(2),
      };
    },
    [currentProduct, fieldDesign, goalkeeperDesign, glovesDesign, includeGloves, roster]
  );

  const handleSelectGoalkeeperKit = useCallback(() => {
    handleSwitchProduct('futbol_jersey_pro_vneck');
    handleSwitchKitRole('goalkeeper');
    setStudioInitialStep(1);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
      window.location.hash = '#studio';
    }
    setAppMode('studio');
  }, [handleSwitchProduct, handleSwitchKitRole]);

  const handleFinishOrderToCheckout = () => {
    const fieldProduct =
      ENGINE_PRODUCTS.find((p) => p.id === fieldDesign.productModelId) || currentProduct;
    const bundle = buildShopifyAndManufacturingBundle(fieldDesign, fieldProduct, roster, '', {
      goalkeeperDesign,
      glovesDesign,
      includeGloves,
    });
    setCartItems((prev) => {
      const matchIdx = prev.findIndex(
        (item) => item.designId === fieldDesign.designId && item.product?.id === fieldProduct.id
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
          goalkeeperDesign={goalkeeperDesign}
          glovesDesign={glovesDesign}
          activeKitRole={activeKitRole}
          includeGloves={includeGloves}
          onSwitchKitRole={handleSwitchKitRole}
          onCommitGlovesDesign={handleCommitGlovesDesign}
          onToggleIncludeGloves={handleToggleIncludeGloves}
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
          onOpenQuoteModal={() => setIsQuoteModalOpen(true)}
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
            onOpenSizeGuide={(tab = 'sizes') => setSizeGuideState({ open: true, tab })}
            onOpenOrderTracking={() => setTrackingState({ open: true, folio: '' })}
            orderCount={orderCount}
          />
          <Navbar
            cartCount={cartItems.length}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenStudio={() => handleOpenGuidedWizard(1)}
            galleryCount={galleryCount}
            orderCount={orderCount}
            onOpenGallery={() => setIsStorefrontGalleryOpen(true)}
            onOpenQuoteModal={() => setIsQuoteModalOpen(true)}
            onOpenSizeGuide={(tab = 'sizes') => setSizeGuideState({ open: true, tab })}
            onOpenOrderTracking={() => setTrackingState({ open: true, folio: '' })}
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
              onSelectGoalkeeper={handleSelectGoalkeeperKit}
            />
            <ProductCatalog
              sportFilter={catalogSport}
              genderFilter={catalogGender}
              searchQuery={catalogSearch}
              onChangeSportFilter={setCatalogSport}
              onChangeGenderFilter={setCatalogGender}
              onClearSearch={() => setCatalogSearch('')}
              onSelectProduct={handleSelectCatalogProduct}
              onSelectGoalkeeper={handleSelectGoalkeeperKit}
              onOpenQuote={() => setIsQuoteModalOpen(true)}
            />
            <QualityShowcase onOpenTexturesInStudio={() => handleOpenGuidedWizard(2)} />
          </main>
          <Footer
            onSelectCategory={handleSelectCatalogCategory}
            onSelectProduct={handleSelectCatalogProduct}
            onSelectGoalkeeper={handleSelectGoalkeeperKit}
            onOpenStudio={() => handleOpenGuidedWizard(1)}
            onOpenQuoteModal={() => setIsQuoteModalOpen(true)}
            onOpenSizeGuide={(tab = 'sizes') => setSizeGuideState({ open: true, tab })}
            onOpenInfoModal={(topic = 'faq') => setInfoModalState({ open: true, topic })}
            onOpenOrderTracking={() => setTrackingState({ open: true, folio: '' })}
          />
        </div>
      )}

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
        onOpenOrderTracking={(folio = '') => {
          setIsCartOpen(false);
          setTrackingState({ open: true, folio });
        }}
      />

      <OrderQuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        items={cartItems}
        onOpenStudioForProduct={(prodId, isKeeper = false) => {
          if (isKeeper) {
            handleSelectGoalkeeperKit();
          } else {
            handleSelectCatalogProduct(prodId);
          }
        }}
      />

      <SizeGuideModal
        key={`sg-${sizeGuideState.tab}-${sizeGuideState.open}`}
        isOpen={sizeGuideState.open}
        initialTab={sizeGuideState.tab}
        onClose={() => setSizeGuideState((s) => ({ ...s, open: false }))}
      />

      <StorefrontInfoModal
        key={`info-${infoModalState.topic}-${infoModalState.open}`}
        isOpen={infoModalState.open}
        initialTopic={infoModalState.topic}
        onClose={() => setInfoModalState((s) => ({ ...s, open: false }))}
        onOpenSizeGuide={() => setSizeGuideState({ open: true, tab: 'sizes' })}
        onOpenStudio={() => handleOpenGuidedWizard(1)}
      />

      <OrderTrackingModal
        key={`track-${trackingState.folio}-${trackingState.open}`}
        isOpen={trackingState.open}
        initialFolio={trackingState.folio}
        onClose={() => setTrackingState((s) => ({ ...s, open: false }))}
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
