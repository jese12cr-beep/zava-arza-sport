import React, { useEffect, useId, useRef, useState } from 'react';
import {
  X,
  ChevronDown,
  Truck,
  CreditCard,
  ShieldCheck,
  MessageCircle,
  Mail,
  FileText,
} from 'lucide-react';
import { ARZA_CONTACT, buildWhatsAppUrl } from '../utils/orderHistoryStore';

const TOPICS = [
  { id: 'faq', label: 'Preguntas Frecuentes' },
  { id: 'payments', label: 'Pagos, MSI y Mínimos' },
  { id: 'shipping', label: 'Envíos y Tiempos' },
  { id: 'care', label: 'Telas y Normativa' },
  { id: 'contact', label: 'Contacto y Garantía' },
];

const FAQS = [
  {
    q: '¿Existe un pedido mínimo por diseño o club?',
    a: 'No. Confeccionamos desde 1 sola prenda personalizada y desde 6 piezas aplicamos descuentos automáticos por volumen de hasta 35%.',
  },
  {
    q: '¿Cómo reciben las especificaciones y colores para fabricar mi pedido?',
    a: 'Configuras tus colores, corte gráfico, tela, escudos, nombres y tallas en el estudio. Al confirmar tu orden o cotización se genera tu folio y ficha técnica completa lista para que nuestro equipo y diseñadores de fábrica inicien patronaje y confección.',
  },
  {
    q: '¿Qué incluye el uniforme de portero y los guantes 3D?',
    a: 'Para fútbol el uniforme de portero siempre se fabrica en manga larga obligatoria con puño elástico, y puedes agregar pares de guantes 3D con palma profesional Látex Contact 4mm (Corte Negativo, Roll Finger o Híbrido).',
  },
  {
    q: '¿Cuánto tarda la confección y entrega de Grupo Zava?',
    a: 'El tiempo estándar es de 10 a 12 días hábiles a partir de la confirmación de tallas, dorsales y diseño.',
  },
  {
    q: '¿Puedo pedir reposiciones exactas a mitad de torneo?',
    a: 'Sí. Tu folio y diseño quedan guardados con tus colores y nombres de referencia para pedir desde 1 prenda adicional manteniendo exactamente el mismo tono.',
  },
  {
    q: '¿Qué formatos acepta para subir el escudo o patrocinadores?',
    a: 'Acepta archivos SVG, PNG y JPG de alta resolución. También puedes elegir emblemas ARZA listos en el Paso 4.',
  },
];

export default function StorefrontInfoModal({
  isOpen,
  initialTopic = 'faq',
  onClose,
  onOpenSizeGuide,
  onOpenStudio,
}) {
  const dialogRef = useRef(null);
  const uid = useId();
  const [topic, setTopic] = useState(initialTopic);
  const [openFaq, setOpenFaq] = useState(0);

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
              Información Oficial Grupo Zava
            </span>
            <h2 id={`${uid}-title`} className="text-xl sm:text-2xl font-bold text-[#111111] mt-0.5">
              Centro de Ayuda ARZA SPORT
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar centro de ayuda"
            className="w-10 h-10 rounded-full bg-[#F5F5F5] hover:bg-[#E5E5E5] text-[#111111] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-3 bg-[#F5F5F5] border-b border-[#E5E5E5] flex flex-wrap gap-1.5" role="tablist">
          {TOPICS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={topic === t.id}
              onClick={() => setTopic(t.id)}
              className={`px-3.5 min-h-9 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                topic === t.id
                  ? 'bg-[#111111] text-white'
                  : 'bg-white text-[#111111] border border-[#E5E5E5] hover:bg-neutral-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm text-[#4B4B4D]">
          {topic === 'faq' && (
            <div className="space-y-2.5">
              {FAQS.map((item, idx) => {
                const isOpenItem = openFaq === idx;
                return (
                  <div key={item.q} className="border border-[#E5E5E5] bg-white">
                    <button
                      type="button"
                      aria-expanded={isOpenItem}
                      onClick={() => setOpenFaq(isOpenItem ? -1 : idx)}
                      className="w-full py-3.5 px-4 text-left flex items-center justify-between gap-3 font-bold text-[#111111] text-xs sm:text-sm cursor-pointer"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isOpenItem ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    {isOpenItem && (
                      <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-[#4B4B4D] border-t border-[#F0F0F0] leading-relaxed">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {topic === 'payments' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 border border-[#E5E5E5] space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-[#111111]">
                    <CreditCard className="w-4 h-4" aria-hidden="true" />
                    <span>Tarjetas Débito, Crédito y MSI</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    Aceptamos Visa, Mastercard y American Express con planes a <strong>1 exhibición, 3 MSI y 6 MSI</strong> en tarjeta de crédito.
                  </p>
                </div>
                <div className="p-4 border border-[#E5E5E5] space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-[#111111]">
                    <FileText className="w-4 h-4" aria-hidden="true" />
                    <span>Transferencia SPEI / Anticipo 50%</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    Para lotes de club puedes apartar producción con <strong>50% de anticipo</strong> a CLABE <code className="font-mono font-bold text-[#111111]">{ARZA_CONTACT.speiClabe}</code> y liquidar previo al envío.
                  </p>
                </div>
              </div>
              <div className="p-4 bg-[#F5F5F5] border border-[#E5E5E5] space-y-2">
                <strong className="text-[#111111] block text-xs uppercase tracking-wider">
                  Tabla de Descuentos por Volumen (Sin Mínimo)
                </strong>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 bg-white border border-[#E5E5E5]"><strong>1 – 5 uds</strong><span className="block text-[#707072]">Precio base lista</span></div>
                  <div className="p-2.5 bg-white border border-[#E5E5E5]"><strong>6 – 14 uds</strong><span className="block text-emerald-700 font-bold">-15% Club</span></div>
                  <div className="p-2.5 bg-white border border-[#E5E5E5]"><strong>15 – 24 uds</strong><span className="block text-emerald-700 font-bold">-25% Equipo</span></div>
                  <div className="p-2.5 bg-white border border-[#E5E5E5]"><strong>25+ uds</strong><span className="block text-emerald-700 font-bold">-35% Liga Pro</span></div>
                </div>
              </div>
            </div>
          )}

          {topic === 'shipping' && (
            <div className="space-y-4">
              <div className="p-4 border border-[#E5E5E5] flex items-start gap-3">
                <Truck className="w-5 h-5 text-[#111111] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-1">
                  <h3 className="font-bold text-[#111111]">Entrega Estándar: {ARZA_CONTACT.leadTime}</h3>
                  <p className="text-xs leading-relaxed">
                    Enviamos a todo México y Estados Unidos con número de guía asegurado. El conteo inicia en cuanto el taller confirma tu folio, tallas y lista de dorsales.
                  </p>
                </div>
              </div>
              <div className="p-4 bg-[#F5F5F5] border border-[#E5E5E5] text-xs space-y-1.5">
                <strong className="text-[#111111] block">Reposiciones individuales garantizadas</strong>
                <p>Si a mitad de temporada entra un jugador nuevo, puedes solicitar desde 1 prenda con los mismos tonos Pantone y tipografía de tu diseño guardado.</p>
              </div>
            </div>
          )}

          {topic === 'care' && (
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-4 border border-[#E5E5E5] space-y-2">
                <h3 className="font-bold text-[#111111]">Especificaciones FIFA / FIBA y Cuidado del Tejido</h3>
                <ul className="space-y-1.5 list-disc pl-5 text-xs">
                  <li>Dorsales de 22–25 cm en espalda y número frontal proporcional siguiendo reglamento de liga.</li>
                  <li>Sublimación directa a 210°C: tinta fusionada a la fibra, sin plásticos ni peso extra.</li>
                  <li>Protección UV 50+ y lavado seguro en máquina hasta 60°C sin usar blanqueador ni plancha directa.</li>
                </ul>
              </div>
              {onOpenSizeGuide && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSizeGuide();
                  }}
                  className="px-5 min-h-10 rounded-full bg-[#111111] text-white text-xs font-semibold cursor-pointer"
                >
                  Ver Tabla de Tallas XS–3XL
                </button>
              )}
            </div>
          )}

          {topic === 'contact' && (
            <div className="space-y-4">
              <div className="p-4 border border-[#E5E5E5] space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#111111]">
                  <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                  <span>Garantía Grupo Zava &amp; Privacidad de Datos</span>
                </div>
                <p className="text-xs leading-relaxed">
                  Todos los pedidos cuentan con garantía 100% contra defectos de costura o impresión. Los datos de contacto y listas de jugadores se utilizan exclusivamente para confección, facturación y envío del pedido.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <a
                  href={buildWhatsAppUrl('Hola ARZA SPORT, necesito asesoría para uniformes personalizados de mi equipo.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 min-h-10 rounded-full bg-[#111111] hover:bg-[#3f3f46] text-white text-xs font-semibold inline-flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  <span>WhatsApp {ARZA_CONTACT.phoneDisplay}</span>
                </a>
                <a
                  href={`mailto:${ARZA_CONTACT.email}`}
                  className="px-5 min-h-10 rounded-full border border-[#111111] text-[#111111] text-xs font-semibold inline-flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" aria-hidden="true" />
                  <span>{ARZA_CONTACT.email}</span>
                </a>
                {onOpenStudio && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenStudio();
                    }}
                    className="px-5 min-h-10 rounded-full bg-[#F5F5F5] hover:bg-[#E5E5E5] text-[#111111] text-xs font-semibold cursor-pointer"
                  >
                    Abrir Configurador 3D
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
