import React, { useEffect, useId, useRef, useState } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Download,
  MessageCircle,
  Package,
  Copy,
  Check,
} from 'lucide-react';
import {
  loadOrderHistory,
  downloadFactoryOrderSheetHtml,
  buildFactoryOrderSummaryText,
  buildWhatsAppUrl,
  formatCutLabel,
} from '../utils/orderHistoryStore';

const TIMELINE_STAGES = [
  'Pedido recibido',
  'Diseño aprobado para taller',
  'Sublimación 210°C y confección',
  'Control de calidad y envío',
];

export default function OrderTrackingModal({ isOpen, onClose, initialFolio = '' }) {
  const dialogRef = useRef(null);
  const uid = useId();
  const [orders, setOrders] = useState(() => loadOrderHistory());
  const [query, setQuery] = useState(initialFolio);
  const [copiedFolio, setCopiedFolio] = useState('');

  useEffect(() => {
    const onUpdate = () => setOrders(loadOrderHistory());
    window.addEventListener('arza_orders_updated', onUpdate);
    return () => window.removeEventListener('arza_orders_updated', onUpdate);
  }, []);

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
    const handleBackdrop = (event) => {
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
      dialog.addEventListener('click', handleBackdrop);
    }
    return () => {
      dialog.removeEventListener('close', handleNativeClose);
      dialog.removeEventListener('click', handleBackdrop);
    };
  }, [isOpen, onClose]);

  const cleanQuery = query.trim().toLowerCase();
  const filtered = cleanQuery
    ? orders.filter(
        (o) =>
          o.folio?.toLowerCase().includes(cleanQuery) ||
          o.email?.toLowerCase().includes(cleanQuery) ||
          o.customerName?.toLowerCase().includes(cleanQuery)
      )
    : orders;

  const handleCopySummary = (order) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(buildFactoryOrderSummaryText(order));
    }
    setCopiedFolio(order.folio);
    setTimeout(() => setCopiedFolio(''), 1800);
  };

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby={`${uid}-title`}
      className="p-0 rounded-none sm:rounded-2xl bg-white text-[#111111] border border-[#E5E5E5] max-w-3xl w-full max-h-[90vh] backdrop:bg-black/55 backdrop:backdrop-blur-xs shadow-2xl m-auto"
    >
      <div className="flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-[#E5E5E5] flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C24100] block">
              Seguimiento y Fichas de Taller
            </span>
            <h2 id={`${uid}-title`} className="text-xl sm:text-2xl font-bold text-[#111111] mt-0.5">
              Mis Pedidos y Rastreo ({orders.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar seguimiento de pedidos"
            className="w-10 h-10 rounded-full bg-[#F5F5F5] hover:bg-[#E5E5E5] text-[#111111] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-3 bg-[#F5F5F5] border-b border-[#E5E5E5]">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#707072] absolute left-3.5" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por folio (ej. ARZA-...) o correo"
              aria-label="Buscar por folio o correo"
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#E5E5E5] rounded-full text-xs sm:text-sm"
            />
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {filtered.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-[#F5F5F5] border border-[#E5E5E5] p-6">
              <Package className="w-10 h-10 text-[#707072] mx-auto" aria-hidden="true" />
              <p className="text-sm font-bold text-[#111111]">
                {orders.length === 0
                  ? 'Aún no has confirmado pedidos en este navegador'
                  : 'No encontramos un pedido con ese folio o correo'}
              </p>
              <p className="text-xs text-[#707072] max-w-md mx-auto">
                Al confirmar un pedido en la Bolsa de Pedido, aquí aparecerá tu folio ARZA para descargar la ficha para fábrica o dar seguimiento por WhatsApp.
              </p>
            </div>
          ) : (
            filtered.map((order) => (
              <article key={order.folio} className="border border-[#E5E5E5] p-5 space-y-4 bg-white">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E5E5E5] pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-extrabold text-sm text-[#111111]">
                        {order.folio}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        {order.statusLabel || 'Recibido · En revisión con taller'}
                      </span>
                    </div>
                    <p className="text-xs text-[#707072] mt-1">
                      {order.createdAtLabel} · {order.customerName || order.email} · {order.units} prendas
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-[#111111] tabular-nums-pro block">
                      ${order.totalOrder || order.amountPaid} USD
                    </span>
                    <span className="text-[11px] text-[#707072]">{order.methodLabel}</span>
                  </div>
                </div>

                {/* Progreso de taller */}
                <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  {TIMELINE_STAGES.map((stage, idx) => (
                    <li
                      key={stage}
                      className={`p-2 border ${
                        idx === 0
                          ? 'border-[#111111] bg-[#111111] text-white font-bold'
                          : 'border-[#E5E5E5] bg-[#FAFAFA] text-[#707072]'
                      }`}
                    >
                      <span className="font-mono block text-[10px] opacity-75">Paso {idx + 1}</span>
                      <span>{stage}</span>
                    </li>
                  ))}
                </ol>

                {/* Prendas + Miniatura Render */}
                <div className="space-y-2 text-xs">
                  {order.renderImageUrl && (
                    <div className="p-2.5 bg-[#F8FAFC] border border-[#E5E5E5] flex items-center gap-3">
                      <img
                        src={order.renderImageUrl}
                        alt={`Render 3D ${order.folio}`}
                        className="w-16 h-20 object-contain bg-white border border-[#E5E5E5] shrink-0"
                      />
                      <div className="text-[11px] text-[#52525B]">
                        <strong className="text-[#111111] block">Render 3D + Paleta RGB / Pantone® adjuntos</strong>
                        Listo para descargar o imprimir en la ficha técnica de fábrica.
                      </div>
                    </div>
                  )}
                  {(order.snapshotItems || []).map((it, i) => (
                    <div key={i} className="p-3 bg-[#F5F5F5] flex flex-wrap justify-between gap-2">
                      <div>
                        <strong className="text-[#111111]">{it.product?.name}</strong>
                        <span className="text-[#707072] block">
                          Corte: {it.design?.pattern} · {it.totalUnits || 1} uds
                          {it.sizeSummary ? ` · ${it.sizeSummary}` : ''}
                          {it.roster?.[0]?.cut ? ` · ${formatCutLabel(it.roster[0].cut)}` : ''}
                        </span>
                      </div>
                      <span className="font-bold text-[#111111]">${it.totalPrice} USD</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => downloadFactoryOrderSheetHtml(order)}
                    className="px-4 min-h-9 rounded-full bg-[#111111] hover:bg-[#3f3f46] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Descargar Ficha Técnica</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopySummary(order)}
                    className="px-4 min-h-9 rounded-full bg-[#F5F5F5] hover:bg-[#E5E5E5] text-[#111111] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedFolio === order.folio ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                        <span>Resumen Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Copiar Resumen</span>
                      </>
                    )}
                  </button>
                  <a
                    href={buildWhatsAppUrl(buildFactoryOrderSummaryText(order))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 min-h-9 rounded-full border border-[#111111] hover:bg-[#F5F5F5] text-[#111111] text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Enviar por WhatsApp</span>
                  </a>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </dialog>
  );
}
