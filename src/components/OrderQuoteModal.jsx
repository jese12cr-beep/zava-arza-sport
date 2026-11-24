import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  X,
  Printer,
  FileText,
  Download,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import {
  ENGINE_PRODUCTS,
  GLOVE_PAIR_UNIT_PRICE,
  VOLUME_TIERS,
} from '../engine/core/designStore';
import {
  ARZA_CONTACT,
  buildFactoryOrderSummaryText,
  buildWhatsAppUrl,
  downloadFactoryOrderSheetHtml,
  formatCollarLabel,
  formatCutLabel,
} from '../utils/orderHistoryStore';

const QUOTE_MODELS = [
  ...ENGINE_PRODUCTS.filter((p) => p.garmentCategory !== 'accessory'),
  {
    id: 'portero_gk_set',
    name: 'Kit Portero Manga Larga (Solo Portero)',
    sport: 'Fútbol',
    basePrice: 34.0,
    isKeeperOnly: true,
  },
];

export default function OrderQuoteModal({
  isOpen,
  onClose,
  items = [],
  onOpenStudioForProduct,
}) {
  const dialogRef = useRef(null);
  const uid = useId();
  const hasCartItems = Array.isArray(items) && items.length > 0;

  // Cotizador rápido para visitantes sin carrito
  const [selectedModelId, setSelectedModelId] = useState('futbol_jersey_pro_vneck');
  const [expressQty, setExpressQty] = useState(15);
  const [expressIncludeKeeper, setExpressIncludeKeeper] = useState(true);
  const [expressGlovePairs, setExpressGlovePairs] = useState(1);
  const [clubName, setClubName] = useState('');
  const [clubContact, setClubContact] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }

    const handleNativeClose = () => {
      if (isOpen) onClose();
    };
    const handleBackdropClick = (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!inside) onClose();
    };
    dialog.addEventListener('close', handleNativeClose);
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', handleBackdropClick);
    }
    return () => {
      dialog.removeEventListener('close', handleNativeClose);
      dialog.removeEventListener('click', handleBackdropClick);
    };
  }, [isOpen, onClose]);

  const quoteNumber = useMemo(
    () => `QT-${String(Math.floor(100000 + Math.random() * 900000))}`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen]
  );

  const currentDate = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const expressModel =
    QUOTE_MODELS.find((m) => m.id === selectedModelId) || QUOTE_MODELS[0];
  const isSoccerModel = expressModel.sport === 'Fútbol';
  const safeQty = Math.max(1, Math.min(500, Number(expressQty) || 1));
  const expressTier =
    VOLUME_TIERS.find((t) => safeQty >= t.min && safeQty <= t.max) || VOLUME_TIERS[0];
  const expressUnitPrice = +(
    expressModel.basePrice *
    (1 - expressTier.discountPct / 100)
  ).toFixed(2);
  const effectiveGlovePairs =
    isSoccerModel && expressIncludeKeeper ? Math.max(0, Number(expressGlovePairs) || 0) : 0;
  const expressGlovesTotal = +(effectiveGlovePairs * GLOVE_PAIR_UNIT_PRICE).toFixed(2);
  const expressTotal = +(expressUnitPrice * safeQty + expressGlovesTotal).toFixed(2);

  const syntheticExpressOrder = useMemo(
    () => ({
      folio: quoteNumber,
      createdAtLabel: currentDate,
      statusLabel: 'Cotización Express ARZA SPORT',
      customerName: clubName.trim() || 'Cotización Club / Equipo',
      email: clubContact.trim() || '',
      methodLabel: '50% Anticipo SPEI o Tarjeta',
      installmentsLabel: `${expressTier.label} (-${expressTier.discountPct}%)`,
      units: safeQty,
      totalOrder: expressTotal.toFixed(2),
      snapshotItems: [
        {
          designId: 'COTIZACION-CLUB',
          totalUnits: safeQty,
          totalPrice: expressTotal.toFixed(2),
          product: {
            id: expressModel.id,
            name: expressModel.name,
            description: `${safeQty} piezas · ${expressTier.label}`,
          },
          design: {
            pattern: 'A elegir en configurador (44+ cortes)',
            collarStyle: 'v_neck',
            baseColor: '#111111',
            sleeveColor: '#fa5400',
            fabricName: 'Tejido técnico ARZA Pro',
          },
          goalkeeperSpec:
            isSoccerModel && expressIncludeKeeper
              ? { keeperUnits: Math.max(1, effectiveGlovePairs || 1), primaryColor: '#059669', secondaryColor: '#111111' }
              : null,
          glovesSpec:
            effectiveGlovePairs > 0
              ? { glovePairs: effectiveGlovePairs, gloveCut: 'hybrid' }
              : null,
          roster: [],
        },
      ],
    }),
    [
      quoteNumber,
      currentDate,
      clubName,
      clubContact,
      expressTier,
      safeQty,
      expressTotal,
      expressModel,
      isSoccerModel,
      expressIncludeKeeper,
      effectiveGlovePairs,
    ]
  );

  const getItemUnits = (item) =>
    item?.totalUnits ||
    item?.roster?.reduce((s, r) => s + (Number(r.qty) || 1), 0) ||
    1;

  const cartOrderObj = useMemo(() => {
    if (!hasCartItems) return syntheticExpressOrder;
    const totalAmount = items
      .reduce((acc, item) => acc + (parseFloat(item.totalPrice) || 0), 0)
      .toFixed(2);
    const totalUnits = items.reduce((acc, item) => acc + getItemUnits(item), 0);
    return {
      folio: quoteNumber,
      createdAtLabel: currentDate,
      statusLabel: 'Cotización Formal Vigente (15 días)',
      customerName: clubName.trim() || 'Club / Equipación Configurada',
      email: clubContact.trim() || '',
      methodLabel: '50% Anticipo o MSI con Tarjeta',
      installmentsLabel: `${totalUnits} prendas cotizadas`,
      units: totalUnits,
      totalOrder: totalAmount,
      snapshotItems: items,
    };
  }, [hasCartItems, syntheticExpressOrder, items, quoteNumber, currentDate, clubName, clubContact]);

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby={`${uid}-title`}
      className="p-0 rounded-none sm:rounded-2xl bg-white text-[#111111] border border-[#E5E5E5] max-w-3xl w-full max-h-[92vh] backdrop:bg-black/55 backdrop:backdrop-blur-xs shadow-2xl m-auto"
    >
      <div className="p-5 sm:p-7 flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#111111] text-white flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id={`${uid}-title`} className="text-lg sm:text-xl font-bold text-[#111111]">
                {hasCartItems ? 'Ficha Técnica y Cotización Formal' : 'Cotizador de Equipos por Volumen'}
              </h2>
              <p className="text-xs text-[#707072]">
                Documento con precios directos de fábrica listo para aprobar presupuesto o enviar a taller.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar cotización"
            className="w-9 h-9 rounded-full bg-[#F5F5F5] hover:bg-[#E5E5E5] text-[#111111] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pr-1 my-4 space-y-4">
          {!hasCartItems ? (
            <div className="space-y-4 bg-[#F5F5F5] p-5 border border-[#E5E5E5] text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`${uid}-model`} className="font-bold text-[#111111] block mb-1">
                    Prenda base a cotizar
                  </label>
                  <select
                    id={`${uid}-model`}
                    value={selectedModelId}
                    onChange={(e) => setSelectedModelId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-[#E5E5E5] text-xs font-medium text-[#111111]"
                  >
                    {QUOTE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (${m.basePrice.toFixed(2)} USD base)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={`${uid}-qty`} className="font-bold text-[#111111] block mb-1">
                    Cantidad total de prendas ({safeQty} uds · -{expressTier.discountPct}% volumen)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id={`${uid}-qty`}
                      type="number"
                      min={1}
                      max={500}
                      value={expressQty}
                      onChange={(e) => setExpressQty(e.target.value)}
                      className="w-24 px-3 py-2 bg-white border border-[#E5E5E5] font-mono font-bold text-[#111111]"
                    />
                    <div className="flex flex-wrap gap-1">
                      {[1, 6, 15, 25, 40].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setExpressQty(preset)}
                          className={`px-2.5 py-1.5 rounded-full font-semibold cursor-pointer ${
                            safeQty === preset
                              ? 'bg-[#111111] text-white'
                              : 'bg-white border border-[#E5E5E5] text-[#111111]'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {isSoccerModel && (
                <div className="p-3 bg-white border border-[#E5E5E5] flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 font-semibold text-[#111111] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={expressIncludeKeeper}
                      onChange={(e) => setExpressIncludeKeeper(e.target.checked)}
                      className="w-4 h-4 accent-[#111111]"
                    />
                    <span>Incluir Uniforme Portero Manga Larga + Guantes Pro ($28 USD c/u)</span>
                  </label>
                  {expressIncludeKeeper && (
                    <div className="flex items-center gap-2">
                      <span>Pares de guantes:</span>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        aria-label="Cantidad de pares de guantes"
                        value={expressGlovePairs}
                        onChange={(e) => setExpressGlovePairs(e.target.value)}
                        className="w-16 px-2 py-1 border border-[#E5E5E5] font-mono font-bold text-center"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`${uid}-club`} className="font-bold text-[#111111] block mb-1">
                    Nombre del Club / Academia (opcional)
                  </label>
                  <input
                    id={`${uid}-club`}
                    type="text"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="Ej. Deportivo Zava FC"
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E5]"
                  />
                </div>
                <div>
                  <label htmlFor={`${uid}-contact`} className="font-bold text-[#111111] block mb-1">
                    Correo o WhatsApp de contacto (opcional)
                  </label>
                  <input
                    id={`${uid}-contact`}
                    type="text"
                    value={clubContact}
                    onChange={(e) => setClubContact(e.target.value)}
                    placeholder="correo@club.com"
                    className="w-full px-3 py-2 bg-white border border-[#E5E5E5]"
                  />
                </div>
              </div>

              <div className="p-4 bg-white border border-[#111111] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase text-[#C24100] block">
                    {quoteNumber} · {expressTier.label}
                  </span>
                  <strong className="text-sm text-[#111111]">
                    ${expressUnitPrice.toFixed(2)} USD por prenda
                    {effectiveGlovePairs > 0 ? ` + ${effectiveGlovePairs} par guantes ($${expressGlovesTotal.toFixed(2)} USD)` : ''}
                  </strong>
                  <span className="block text-[11px] text-[#707072]">
                    Incluye sublimación total, escudos, nombres y dorsales · Entrega {ARZA_CONTACT.leadTime}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#707072] block">Estimado Total</span>
                  <span className="text-2xl font-extrabold text-[#111111] tabular-nums-pro">
                    ${expressTotal.toFixed(2)} USD
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#F5F5F5] p-5 border border-[#E5E5E5] text-xs space-y-4">
              <div className="flex justify-between items-start border-b border-[#E5E5E5] pb-3">
                <div>
                  <span className="text-base font-extrabold text-[#111111] tracking-wider">
                    ARZA <span className="text-[#C24100]">SPORT</span> STUDIO
                  </span>
                  <p className="text-[#707072] text-[11px] mt-0.5">
                    {ARZA_CONTACT.brand} · {ARZA_CONTACT.email} · {ARZA_CONTACT.phoneDisplay}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[#065f46] font-bold block">{quoteNumber}</span>
                  <span className="text-[#707072] text-[11px]">{currentDate}</span>
                </div>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={item.cartId || idx} className="p-3.5 bg-white border border-[#E5E5E5]">
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <div>
                        <strong className="text-[#111111] text-xs">{item.product.name}</strong>
                        <p className="text-[#707072] text-[11px]">{item.product.description}</p>
                      </div>
                      <span className="font-mono font-bold text-[#111111] shrink-0">${item.totalPrice} USD</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#F0F0F0] text-[11px] text-[#111111]">
                      <div>
                        <span className="text-[#707072] block text-[10px] font-semibold">COLOR BASE</span>
                        <span className="inline-flex items-center gap-1.5 font-mono font-semibold">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/20"
                            style={{ backgroundColor: item.design.baseColor || '#111111' }}
                          />
                          {item.design.baseColor}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#707072] block text-[10px] font-semibold">MANGAS / CUELLO</span>
                        <span className="font-semibold">
                          {formatCollarLabel(item.design.collarStyle)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#707072] block text-[10px] font-semibold">CORTE GRÁFICO</span>
                        <span className="font-semibold">{item.design.pattern}</span>
                      </div>
                      <div>
                        <span className="text-[#707072] block text-[10px] font-semibold">CANTIDAD</span>
                        <span className="font-bold text-emerald-700">{getItemUnits(item)} uds</span>
                      </div>
                    </div>

                    {item.roster && item.roster.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-[#F0F0F0]">
                        <span className="text-[#707072] text-[10px] font-bold uppercase block mb-1">
                          Lista de Jugadores / Tallas / Dorsales
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.roster.map((player) => (
                            <span
                              key={player.id}
                              className="bg-[#F5F5F5] px-2 py-0.5 text-[10px] border border-[#E5E5E5] text-[#111111]"
                            >
                              #{player.number} {player.name || 'JUGADOR'} · {formatCutLabel(player.cut)} ({player.size} x{player.qty || 1})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#E5E5E5] flex flex-wrap justify-between items-baseline gap-3">
                <div>
                  <span className="text-[#707072] text-[11px] block">
                    Condición: 50% anticipo SPEI o MSI con tarjeta.
                  </span>
                  <span className="text-emerald-700 text-[10px] font-semibold">
                    Entrega estándar {ARZA_CONTACT.leadTime}. Garantía de confección ARZA SPORT.
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#707072] text-[11px] block">
                    Total: {cartOrderObj.units} unidades
                  </span>
                  <span className="text-2xl font-extrabold text-[#111111] tabular-nums-pro">
                    ${cartOrderObj.totalOrder} USD
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-[#E5E5E5] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => downloadFactoryOrderSheetHtml(cartOrderObj)}
              className="px-4 min-h-10 rounded-full bg-[#111111] hover:bg-[#3f3f46] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Descargar Ficha HTML</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 min-h-10 rounded-full bg-[#F5F5F5] hover:bg-[#E5E5E5] text-[#111111] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Imprimir / PDF</span>
            </button>
            <a
              href={buildWhatsAppUrl(buildFactoryOrderSummaryText(cartOrderObj))}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 min-h-10 rounded-full border border-[#111111] hover:bg-[#F5F5F5] text-[#111111] text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Enviar por WhatsApp</span>
            </a>
          </div>

          {!hasCartItems && onOpenStudioForProduct ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenStudioForProduct(
                  expressModel.id === 'portero_gk_set' ? 'futbol_jersey_pro_vneck' : expressModel.id,
                  expressModel.id === 'portero_gk_set'
                );
              }}
              className="px-5 min-h-10 rounded-full bg-[#FA5400] hover:bg-[#e04800] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Personalizar Ahora</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 min-h-10 rounded-full bg-[#F5F5F5] hover:bg-[#E5E5E5] text-[#111111] text-xs font-semibold cursor-pointer"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
