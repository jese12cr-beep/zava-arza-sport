import React, { useEffect, useId, useRef, useState } from 'react';
import {
  X,
  Trash2,
  CheckCircle2,
  Copy,
  Check,
  FileText,
  CreditCard,
  Landmark,
  Wallet,
  Lock,
  ShieldCheck,
  AlertCircle,
  Download,
  MessageCircle,
  Package,
  Printer,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import FullKitPreview3D from './studio/FullKitPreview3D';
import {
  ARZA_CONTACT,
  buildFactoryOrderSummaryText,
  buildWhatsAppUrl,
  captureCanvasSnapshot,
  downloadFactoryOrderSheetHtml,
  formatCollarLabel,
  formatCutLabel,
  formatGloveCutLabel,
  openPrintableFactorySheet,
  renderFallbackKitThumbnail,
  saveConfirmedOrder,
} from '../utils/orderHistoryStore';

const SPEI_CLABE = ARZA_CONTACT.speiClabe;

function getItemUnits(item) {
  return (
    item?.totalUnits ||
    item?.roster?.reduce((sum, r) => sum + (Number(r.qty) || 1), 0) ||
    1
  );
}

function detectCardBrand(digits = '') {
  if (/^4/.test(digits)) return { id: 'visa', badge: 'VISA', maxLen: 19 };
  if (/^3[47]/.test(digits)) return { id: 'amex', badge: 'AMEX', maxLen: 15 };
  if (/^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d\d|27[01]\d|2720)/.test(digits)) {
    return { id: 'mastercard', badge: 'MC', maxLen: 16 };
  }
  return { id: 'card', badge: 'TARJETA', maxLen: 19 };
}

function formatCardNumberDisplay(rawValue = '') {
  const digits = rawValue.replace(/\D/g, '');
  const { id, maxLen } = detectCardBrand(digits);
  const clipped = digits.slice(0, maxLen);
  if (id === 'amex') {
    const p1 = clipped.slice(0, 4);
    const p2 = clipped.slice(4, 10);
    const p3 = clipped.slice(10, 15);
    return [p1, p2, p3].filter(Boolean).join(' ');
  }
  return clipped.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiryDisplay(rawValue = '') {
  const digits = rawValue.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function passesLuhn(digits = '') {
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function validatePaymentField(name, value, extra = {}) {
  const trimmed = String(value || '').trim();
  if (name === 'email') {
    if (!trimmed) return 'Error: Ingresa tu correo electrónico para enviarte el comprobante.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
      return 'Error: Ingresa un correo en formato nombre@club.com.';
    }
    return '';
  }
  if (name === 'shippingName') {
    if (trimmed.length < 2) return 'Error: Ingresa el nombre del responsable o capitán.';
    return '';
  }
  if (name === 'phone') {
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length < 8) return 'Error: Ingresa un teléfono o WhatsApp válido (8–12 dígitos).';
    return '';
  }
  if (name === 'shippingAddress') {
    if (trimmed.length < 5) return 'Error: Ingresa calle, número y colonia para el envío.';
    return '';
  }
  if (name === 'shippingCity') {
    if (trimmed.length < 2) return 'Error: Ingresa ciudad y estado de entrega.';
    return '';
  }
  if (name === 'shippingZip') {
    if (!/^[a-zA-Z0-9\s-]{4,10}$/.test(trimmed)) return 'Error: Ingresa un código postal válido.';
    return '';
  }
  if (name === 'ccNumber') {
    const digits = trimmed.replace(/\D/g, '');
    if (!digits) return 'Error: Ingresa el número completo de tu tarjeta.';
    if (digits.length < 13 || digits.length > 19 || !passesLuhn(digits)) {
      return 'Error: Verifica los 13–19 dígitos de tu tarjeta sin guiones.';
    }
    return '';
  }
  if (name === 'ccName') {
    if (!trimmed) return 'Error: Escribe el nombre tal como aparece en la tarjeta.';
    if (trimmed.length < 2 || !/\p{L}/u.test(trimmed)) {
      return 'Error: Ingresa un nombre y apellido válido (solo letras y espacios).';
    }
    return '';
  }
  if (name === 'ccExp') {
    const match = trimmed.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
    if (!match) return 'Error: Usa el formato MM/AA (ejemplo 08/29).';
    const expMonth = Number(match[1]);
    const expYear = 2000 + Number(match[2]);
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    if (expYear < curYear || (expYear === curYear && expMonth < curMonth)) {
      return 'Error: Esta tarjeta aparece vencida; verifica mes y año.';
    }
    return '';
  }
  if (name === 'ccCsc') {
    const reqDigits = extra.brandId === 'amex' ? 4 : 3;
    const ok = extra.brandId === 'amex' ? /^\d{4}$/.test(trimmed) : /^\d{3,4}$/.test(trimmed);
    if (!ok) {
      return `Error: Ingresa ${reqDigits === 4 ? 'los 4 dígitos' : 'los 3 o 4 dígitos'} del código de seguridad.`;
    }
    return '';
  }
  return '';
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  artworkRegistry = {},
  onRemoveItem,
  onClearCart,
  onOpenQuoteModal,
  onOpenOrderTracking,
}) {
  const dialogRef = useRef(null);
  const emailInputRef = useRef(null);
  const shippingNameRef = useRef(null);
  const phoneRef = useRef(null);
  const shippingAddressRef = useRef(null);
  const shippingCityRef = useRef(null);
  const shippingZipRef = useRef(null);
  const ccNumberRef = useRef(null);
  const ccNameRef = useRef(null);
  const ccExpRef = useRef(null);
  const ccCscRef = useRef(null);
  const announceTimerRef = useRef(null);

  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'spei' | 'wallet'
  const [cardKind, setCardKind] = useState('debit'); // 'debit' | 'credit'
  const [installments, setInstallments] = useState('1'); // '1' | '3' | '6'
  const [speiMode, setSpeiMode] = useState('deposit50'); // 'deposit50' | 'full100'
  const [walletProvider, setWalletProvider] = useState('mercadopago'); // 'mercadopago' | 'paypal' | 'apple_gpay'
  const [sameBillingAddress, setSameBillingAddress] = useState(true);

  const [formValues, setFormValues] = useState({
    email: '',
    shippingName: '',
    phone: '',
    shippingAddress: '',
    shippingCity: '',
    shippingZip: '',
    ccNumber: '',
    ccName: '',
    ccExp: '',
    ccCsc: '',
    billingAddress: '',
    billingPostalCode: '',
    billingCity: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState(null);
  const [copiedKey, setCopiedKey] = useState('');
  const [previewItemIndex, setPreviewItemIndex] = useState(0);
  const kitSnapshotRef = useRef(null);

  const uid = useId();
  const emailId = `${uid}-email`;
  const emailHintId = `${uid}-email-hint`;
  const emailErrId = `${uid}-email-err`;
  const shipNameId = `${uid}-ship-name`;
  const shipNameErrId = `${uid}-ship-name-err`;
  const phoneId = `${uid}-phone`;
  const phoneErrId = `${uid}-phone-err`;
  const shipAddrId = `${uid}-ship-addr`;
  const shipAddrErrId = `${uid}-ship-addr-err`;
  const shipCityId = `${uid}-ship-city`;
  const shipCityErrId = `${uid}-ship-city-err`;
  const shipZipId = `${uid}-ship-zip`;
  const shipZipErrId = `${uid}-ship-zip-err`;
  const ccNumId = `${uid}-cc-num`;
  const ccNumHintId = `${uid}-cc-num-hint`;
  const ccNumErrId = `${uid}-cc-num-err`;
  const ccNameId = `${uid}-cc-name`;
  const ccNameErrId = `${uid}-cc-name-err`;
  const ccExpId = `${uid}-cc-exp`;
  const ccExpHintId = `${uid}-cc-exp-hint`;
  const ccExpErrId = `${uid}-cc-exp-err`;
  const ccCscId = `${uid}-cc-csc`;
  const ccCscHintId = `${uid}-cc-csc-hint`;
  const ccCscErrId = `${uid}-cc-csc-err`;
  const billingStreetId = `${uid}-bill-street`;
  const billingZipId = `${uid}-bill-zip`;
  const billingCityId = `${uid}-bill-city`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }

    const handleNativeClose = () => {
      if (isOpen) onClose();
    };
    const handleBackdropClick = (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!isDialogContent) {
        onClose();
      }
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

  useEffect(() => () => clearTimeout(announceTimerRef.current), []);

  const totalNumeric = items.reduce((acc, item) => acc + (parseFloat(item.totalPrice) || 0), 0);
  const totalAmount = totalNumeric.toFixed(2);
  const totalQuantity = items.reduce((acc, item) => acc + getItemUnits(item), 0);
  const speiAmount = (speiMode === 'deposit50' ? totalNumeric * 0.5 : totalNumeric).toFixed(2);
  const monthlyMsiAmount =
    installments === '1' ? totalAmount : (totalNumeric / Number(installments)).toFixed(2);

  const cardDigits = formValues.ccNumber.replace(/\D/g, '');
  const cardBrand = detectCardBrand(cardDigits);

  const announcePoliteError = (msg) => {
    clearTimeout(announceTimerRef.current);
    setLiveAnnouncement('');
    if (!msg) return;
    announceTimerRef.current = setTimeout(() => {
      setLiveAnnouncement(msg);
    }, 350);
  };

  const handleFieldChange = (name, rawVal) => {
    let nextVal = rawVal;
    if (name === 'ccNumber') {
      nextVal = formatCardNumberDisplay(rawVal);
    } else if (name === 'ccExp') {
      nextVal = formatExpiryDisplay(rawVal);
    } else if (name === 'ccCsc') {
      nextVal = rawVal.replace(/\D/g, '').slice(0, 4);
    }

    setFormValues((prev) => ({ ...prev, [name]: nextVal }));

    if (fieldErrors[name]) {
      const nextErr = validatePaymentField(name, nextVal, {
        brandId: name === 'ccNumber' ? detectCardBrand(nextVal.replace(/\D/g, '')).id : cardBrand.id,
      });
      if (!nextErr) {
        setFieldErrors((prev) => ({ ...prev, [name]: '' }));
      }
    }
  };

  const handleFieldBlur = (name) => {
    setFieldTouched((prev) => ({ ...prev, [name]: true }));
    const err = validatePaymentField(name, formValues[name], { brandId: cardBrand.id });
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
    if (err) {
      announcePoliteError(err);
    }
  };

  const handleCopyValue = (key, text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 1800);
  };

  const handleSubmitPayment = (e) => {
    e.preventDefault();
    if (isSubmitting || items.length === 0) return;

    const baseFields = ['email', 'shippingName', 'phone', 'shippingAddress', 'shippingCity', 'shippingZip'];
    const requiredFields =
      paymentMethod === 'card'
        ? [...baseFields, 'ccNumber', 'ccName', 'ccExp', 'ccCsc']
        : baseFields;

    const refMap = {
      email: emailInputRef,
      shippingName: shippingNameRef,
      phone: phoneRef,
      shippingAddress: shippingAddressRef,
      shippingCity: shippingCityRef,
      shippingZip: shippingZipRef,
      ccNumber: ccNumberRef,
      ccName: ccNameRef,
      ccExp: ccExpRef,
      ccCsc: ccCscRef,
    };

    const nextErrors = {};
    const nextTouched = { ...fieldTouched };
    let firstInvalidKey = null;

    for (const key of requiredFields) {
      nextTouched[key] = true;
      const err = validatePaymentField(key, formValues[key], { brandId: cardBrand.id });
      nextErrors[key] = err;
      if (err && !firstInvalidKey) {
        firstInvalidKey = key;
      }
    }

    setFieldTouched(nextTouched);
    setFieldErrors(nextErrors);

    if (firstInvalidKey) {
      announcePoliteError(nextErrors[firstInvalidKey]);
      refMap[firstInvalidKey]?.current?.focus();
      return;
    }

    setIsSubmitting(true);
    const folio = `ARZA-${String(Math.floor(100000 + Math.random() * 900000))}`;
    const last4 = cardDigits.slice(-4) || '0000';
    const paidLabel =
      paymentMethod === 'card'
        ? `Tarjeta de ${cardKind === 'credit' ? 'Crédito' : 'Débito'} (${cardBrand.badge} •••• ${last4})`
        : paymentMethod === 'spei'
        ? `Transferencia SPEI (${speiMode === 'deposit50' ? '50% Anticipo' : '100% Liquidación'})`
        : walletProvider === 'paypal'
        ? 'PayPal Checkout'
        : walletProvider === 'apple_gpay'
        ? 'Apple Pay / Google Pay'
        : 'Mercado Pago Link';

    const firstItem = items[0];
    const capturedRenderUrl =
      captureCanvasSnapshot(kitSnapshotRef) ||
      renderFallbackKitThumbnail({
        title: `Folio ${folio}`,
        productName: firstItem?.product?.name || 'Equipación ARZA SPORT',
        patternName: firstItem?.design?.pattern || 'Personalizado',
        colors: [
          firstItem?.design?.baseColor || '#111111',
          firstItem?.design?.sleeveColor || '#fa5400',
          firstItem?.design?.accentColor || '#ffffff',
        ],
      });

    const receiptRecord = saveConfirmedOrder({
      folio,
      createdAtLabel: new Date().toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      statusLabel: 'Recibido · En revisión con taller',
      methodLabel: paidLabel,
      email: formValues.email.trim(),
      customerName: formValues.shippingName.trim(),
      phone: formValues.phone.trim(),
      shippingAddress: formValues.shippingAddress.trim(),
      shippingCity: formValues.shippingCity.trim(),
      shippingZip: formValues.shippingZip.trim(),
      amountPaid: paymentMethod === 'spei' ? speiAmount : totalAmount,
      totalOrder: totalAmount,
      units: totalQuantity,
      installmentsLabel:
        paymentMethod === 'card' && cardKind === 'credit' && installments !== '1'
          ? `${installments} MSI de $${monthlyMsiAmount} USD`
          : 'Pago en una exhibición',
      speiClabe: paymentMethod === 'spei' ? SPEI_CLABE : null,
      renderImageUrl: capturedRenderUrl,
      snapshotItems: items.map(
        ({
          topDesign: _td,
          bottomDesign: _bd,
          goalkeeperFullDesign: _gd,
          glovesFullDesign: _gld,
          ...lightItem
        }) => lightItem
      ),
    });
    setPaymentReceipt(receiptRecord);
    setIsSubmitting(false);
    downloadFactoryOrderSheetHtml(receiptRecord);

    try {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    } catch {}
  };

  const renderFieldError = (key, errId) => {
    const hasErr = Boolean(fieldTouched[key] && fieldErrors[key]);
    return (
      <div
        id={errId}
        className={`arza-pay-error items-start gap-1 text-[11px] font-semibold text-rose-700 mt-1 ${
          hasErr ? '!flex' : ''
        }`}
      >
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          <span className="visually-hidden">Error: </span>
          {fieldErrors[key]?.replace(/^Error:\s*/, '')}
        </span>
      </div>
    );
  };

  const showItemsBadgeCount = paymentReceipt
    ? paymentReceipt.units
    : totalQuantity;
  const showLiveShowcase = Boolean(isOpen && items.length > 0 && !paymentReceipt);
  const safePreviewIndex = Math.min(previewItemIndex, Math.max(0, items.length - 1));
  const previewItem = items[safePreviewIndex] || items[0] || null;

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="cart-title"
      className={`p-0 bg-white/95 backdrop-blur-xl text-slate-900 backdrop:bg-slate-950/50 backdrop:backdrop-blur-xs shadow-2xl open:flex open:flex-col transition-all ${
        showLiveShowcase
          ? 'm-0 lg:m-auto h-full max-h-screen lg:h-[90dvh] lg:max-h-[840px] w-full lg:w-[1060px] lg:max-w-[95vw] border-l lg:border border-white/75 lg:rounded-3xl overflow-hidden'
          : 'm-0 ml-auto mr-0 h-full max-h-screen w-full sm:max-w-lg border-l border-white/75'
      }`}
    >
      <div
        className={
          showLiveShowcase
            ? 'flex-1 min-h-0 overflow-y-auto lg:overflow-hidden flex flex-col lg:grid lg:grid-cols-12'
            : 'p-4 sm:p-6 flex flex-col h-full min-h-0'
        }
      >
        {showLiveShowcase && (
          <div className="shrink-0 h-[310px] sm:h-[360px] lg:h-full lg:col-span-6 border-b lg:border-b-0 lg:border-r border-slate-200/80 min-h-0">
            <FullKitPreview3D
              item={previewItem}
              artworkRegistry={artworkRegistry}
              onRegisterCapture={(fn) => {
                kitSnapshotRef.current = fn;
              }}
            />
          </div>
        )}

        <div
          className={
            showLiveShowcase
              ? 'p-4 sm:p-6 flex flex-col lg:h-full min-h-0 lg:col-span-6'
              : 'contents'
          }
        >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between pb-3.5 border-b border-slate-200/80">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <h2 id="cart-title" className="text-lg sm:text-xl font-black text-slate-900 truncate">
                {paymentReceipt ? `Pedido ${paymentReceipt.folio}` : `Tu Pedido (${showItemsBadgeCount})`}
              </h2>
              {!paymentReceipt && items.length > 0 && (
                <p className="text-[11px] text-slate-500 font-medium">
                  Gira tu kit 3D completo en vivo y confirma tu compra
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            aria-label="Cerrar panel de pedido"
            onClick={() => {
              if (paymentReceipt) {
                setPaymentReceipt(null);
              }
              onClose();
            }}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Región Live amable para anunciar errores de formulario sin saturar */}
        <div aria-live="polite" className="visually-hidden">
          {liveAnnouncement}
        </div>

        {/* Cuerpo Principal Desplazable */}
        <div className="flex-1 lg:overflow-y-auto py-3.5 pr-0.5 space-y-4 min-h-0">
          {paymentReceipt ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
                  <span>¡Pedido Registrado Correctamente!</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Enviamos el resumen de confección y confirmación al correo{' '}
                  <strong className="font-bold">{paymentReceipt.email}</strong>.
                </p>
                <dl className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/80 text-xs">
                  <div>
                    <dt className="text-[10px] font-bold uppercase text-emerald-700">Folio</dt>
                    <dd className="font-mono font-black text-slate-900">{paymentReceipt.folio}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase text-emerald-700">Monto</dt>
                    <dd className="font-black text-slate-900">${paymentReceipt.amountPaid} USD</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-[10px] font-bold uppercase text-emerald-700">Método de pago</dt>
                    <dd className="font-bold text-slate-900">
                      {paymentReceipt.methodLabel} · {paymentReceipt.installmentsLabel}
                    </dd>
                  </div>
                  {paymentReceipt.speiClabe && (
                    <div className="col-span-2">
                      <dt className="text-[10px] font-bold uppercase text-emerald-700">CLABE Interbancaria SPEI</dt>
                      <dd className="font-mono font-black text-slate-900">{paymentReceipt.speiClabe}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Ficha Técnica Generada (Render · RGB / Pantone · Tallas)
                </span>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  {paymentReceipt.renderImageUrl && (
                    <div className="rounded-xl bg-white border border-slate-200 p-2 flex items-center gap-3">
                      <img
                        src={paymentReceipt.renderImageUrl}
                        alt={`Render 3D finalizado del pedido ${paymentReceipt.folio}`}
                        className="w-24 h-28 object-contain rounded-lg bg-[#f8fafc] border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                          Fotografía del Render Incluida
                        </span>
                        <p className="text-xs font-bold text-slate-900">
                          {paymentReceipt.snapshotItems?.[0]?.product?.name || 'Kit ARZA SPORT'}
                        </p>
                        {paymentReceipt.snapshotItems?.[0]?.sizeSummary && (
                          <p className="text-[11px] text-slate-600 font-mono">
                            Tallas: {paymentReceipt.snapshotItems[0].sizeSummary}
                            {paymentReceipt.snapshotItems[0].gloveSizeSummary
                              ? ` · Guantes ${paymentReceipt.snapshotItems[0].gloveSizeSummary}`
                              : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {(paymentReceipt.snapshotItems || []).map((it, idx) => {
                    const zones = [
                      ...(it.colorPalettes?.topZones || []),
                      ...(it.colorPalettes?.bottomZones?.slice(0, 2) || []).map((z) => ({
                        ...z,
                        zone: `Short: ${z.zone}`,
                      })),
                      ...(it.colorPalettes?.goalkeeperZones?.slice(0, 2) || []).map((z) => ({
                        ...z,
                        zone: `Portero: ${z.zone}`,
                      })),
                    ];
                    return (
                      <div key={it.cartId || idx} className="space-y-2">
                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="font-bold text-slate-900 truncate pr-2">{it.product.name}</span>
                          <span className="font-black text-slate-900 shrink-0">${it.totalPrice} USD</span>
                        </div>
                        {zones.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {zones.map((c, cIdx) => (
                              <div
                                key={`${c.zone}-${cIdx}`}
                                className="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-slate-200 text-[10px]"
                              >
                                <span
                                  className="w-5 h-5 rounded border border-slate-300 shrink-0"
                                  style={{ backgroundColor: c.hex }}
                                />
                                <div className="min-w-0 leading-tight">
                                  <div className="font-bold text-slate-900 truncate">
                                    {c.zone} · {c.pantone}
                                  </div>
                                  <div className="font-mono text-slate-500 truncate">
                                    {c.rgb} · {c.hex}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => downloadFactoryOrderSheetHtml(paymentReceipt)}
                    className="min-h-11 px-3 rounded-xl arza-btn-glass-green text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Descargar Ficha Técnica</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openPrintableFactorySheet(paymentReceipt)}
                    className="min-h-11 px-3 rounded-xl border border-slate-900 bg-white hover:bg-slate-50 text-xs font-bold text-slate-900 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-slate-700 shrink-0" aria-hidden="true" />
                    <span>Imprimir / PDF</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={buildWhatsAppUrl(buildFactoryOrderSummaryText(paymentReceipt))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-10 px-3 rounded-xl arza-glass-card hover:bg-white text-xs font-bold text-slate-800 inline-flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                    <span>Enviar WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={onOpenQuoteModal}
                    className="min-h-10 px-3 rounded-xl arza-glass-card hover:bg-white text-xs font-bold text-slate-800 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                    <span>Cotización</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentReceipt(null);
                    onClearCart?.();
                    onClose();
                  }}
                  className="w-full min-h-10 px-4 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Nuevo Pedido
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" aria-hidden="true" />
              <p className="text-sm font-bold text-slate-700">No hay pedidos agregados</p>
              <p className="text-xs text-slate-500 mt-1">
                Personaliza una equipación y pulsa «Finalizar Pedido».
              </p>
            </div>
          ) : (
            <>
              {/* 1. Artículos en el pedido */}
              <div className="space-y-2.5">
                {items.map((item, index) => {
                  const unitCount = getItemUnits(item);
                  const keeperCount =
                    item.keeperUnits ??
                    (item.roster || []).reduce(
                      (acc, r) =>
                        acc + (/portero|arquero/i.test(r.role || '') ? Number(r.qty) || 1 : 0),
                      0
                    );
                  const fieldCount = Math.max(0, unitCount - keeperCount);
                  return (
                    <div
                      key={item.cartId || index}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 relative flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 truncate">
                            {item.product.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-0.5 font-medium">
                            <span>{unitCount} prendas</span>
                            {keeperCount > 0 && (
                              <>
                                <span>•</span>
                                <span className="font-bold text-[#C24100]">
                                  {fieldCount} Jug. + {keeperCount} Port. (Manga Larga)
                                </span>
                              </>
                            )}
                            {item.glovePairs > 0 && (
                              <>
                                <span>•</span>
                                <span className="font-bold text-slate-800">
                                  +{item.glovePairs} Par Guantes Pro
                                </span>
                              </>
                            )}
                            <span>•</span>
                            <span className="font-bold text-emerald-700">${item.unitPrice} c/u</span>
                            <span>•</span>
                            <span className="font-black text-slate-900">${item.totalPrice} USD</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          aria-label={`Eliminar ${item.product.name} del pedido`}
                          onClick={() => onRemoveItem(item.cartId)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>

                      {items.length > 1 && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => setPreviewItemIndex(index)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-colors ${
                              safePreviewIndex === index
                                ? 'bg-[#111111] text-white border-[#111111]'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            {safePreviewIndex === index ? '✓ En visor 3D' : 'Ver kit 3D en vivo'}
                          </button>
                        </div>
                      )}

                      <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1.5 font-medium">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-slate-300"
                            style={{ backgroundColor: item.design.baseColor }}
                          />
                          <span>{item.design.pattern || 'Tackle'} · {formatCollarLabel(item.design.collarStyle)}</span>
                        </span>
                        {item.goalkeeperSpec && (
                          <span className="bg-amber-50 text-amber-950 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1.5 font-bold">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-amber-400"
                              style={{ backgroundColor: item.goalkeeperSpec.primaryColor || '#059669' }}
                            />
                            <span>Portero Manga Larga</span>
                          </span>
                        )}
                        {item.glovesSpec && (
                          <span className="bg-slate-900 text-white px-2 py-0.5 rounded flex items-center gap-1.5 font-bold">
                            <span>
                              Guantes ({item.glovesSpec.glovePairs}×${Number(item.glovesSpec.unitPrice || 28).toFixed(0)} · {formatGloveCutLabel(item.glovesSpec.gloveCut)})
                            </span>
                          </span>
                        )}
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono font-medium">
                          #{item.design.playerNumber || '10'} {item.design.playerName || 'PRO'}
                        </span>
                        {item.design.sponsorText && (
                          <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                            Sponsor: {item.design.sponsorText}
                          </span>
                        )}
                      </div>

                      {item.roster && item.roster.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-wrap gap-1">
                          {item.roster.slice(0, 6).map((r, rIdx) => {
                            const isKeeper = /portero|arquero/i.test(r.role || '');
                            return (
                              <span
                                key={r.id || rIdx}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                  isKeeper
                                    ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                                    : 'bg-white border-slate-200 text-slate-700'
                                }`}
                              >
                                {[
                                  isKeeper
                                    ? `[PORT M.L.${item.glovePairs > 0 && r.gloveSize ? ` · G${r.gloveSize}` : ''}]`
                                    : '',
                                  r.number ? `#${r.number}` : '',
                                  r.name || 'Sin nombre',
                                  formatCutLabel(r.cut),
                                  r.size,
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </span>
                            );
                          })}
                          {item.roster.length > 6 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                              +{item.roster.length - 6} más
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Resumen Financiero */}
              <div className="p-3.5 rounded-2xl arza-pill-glass-green flex items-baseline justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-emerald-950 block">Total a Pagar</span>
                  <span className="text-[11px] text-emerald-800 font-semibold">
                    Envío asegurado incluido • {totalQuantity} prendas
                  </span>
                </div>
                <span className="text-xl font-black text-emerald-950 tabular-nums-pro">
                  ${totalAmount} USD
                </span>
              </div>

              {/* 2. SECCIÓN DE PAGO (Tarjetas de Débito, Crédito, SPEI, Wallet) */}
              <form
                method="POST"
                noValidate
                onSubmit={handleSubmitPayment}
                aria-labelledby={`${uid}-pay-heading`}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3
                    id={`${uid}-pay-heading`}
                    className="text-sm font-black text-slate-900 flex items-center gap-1.5"
                  >
                    <Lock className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                    <span>Método de Pago</span>
                  </h3>
                  <div className="flex items-center gap-1 text-[9px] font-black tracking-wider">
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white">VISA</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">MC</span>
                    <span className="px-1.5 py-0.5 rounded bg-sky-700 text-white">AMEX</span>
                  </div>
                </div>

                {/* Selector de Método de Pago (Radio Group accesible) */}
                <fieldset className="space-y-1.5">
                  <legend className="sr-only">Selecciona cómo deseas pagar</legend>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'card', label: 'Tarjeta', sub: 'Débito / Crédito', Icon: CreditCard },
                      { id: 'spei', label: 'SPEI', sub: 'Transferencia', Icon: Landmark },
                      { id: 'wallet', label: 'Wallet', sub: 'Link / PayPal', Icon: Wallet },
                    ].map(({ id: mId, label, sub, Icon }) => {
                      const radioId = `${uid}-method-${mId}`;
                      const selected = paymentMethod === mId;
                      return (
                        <div key={mId} className="relative">
                          <input
                            type="radio"
                            id={radioId}
                            name="payment-method"
                            value={mId}
                            checked={selected}
                            onChange={() => setPaymentMethod(mId)}
                            className="sr-only peer"
                          />
                          <label
                            htmlFor={radioId}
                            className={`flex flex-col items-center justify-center text-center p-2 rounded-xl border min-h-12 cursor-pointer transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-700 peer-focus-visible:ring-offset-1 ${
                              selected
                                ? 'bg-emerald-50 border-emerald-700 text-emerald-950 ring-2 ring-emerald-700/25 shadow-2xs'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <Icon className="w-4 h-4 mb-0.5 text-emerald-700" aria-hidden="true" />
                            <span className="text-xs font-black leading-none">{label}</span>
                            <span className="text-[10px] text-slate-500 font-medium mt-0.5 leading-none">
                              {sub}
                            </span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Correo de confirmación común a todos los métodos */}
                <div>
                  <label htmlFor={emailId} className="text-xs font-bold text-slate-800 block">
                    Correo para confirmación y seguimiento <span aria-hidden="true">*</span>
                  </label>
                  <span id={emailHintId} className="text-[11px] text-slate-500 block mt-0.5 mb-1">
                    Ejemplo: capitan@tuclub.com
                  </span>
                  <input
                    ref={emailInputRef}
                    id={emailId}
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    enterKeyHint="next"
                    required
                    value={formValues.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    onBlur={() => handleFieldBlur('email')}
                    aria-invalid={fieldTouched.email && fieldErrors.email ? 'true' : 'false'}
                    aria-describedby={
                      fieldTouched.email && fieldErrors.email
                        ? `${emailHintId} ${emailErrId}`
                        : emailHintId
                    }
                    placeholder="tu@club.com"
                    className={`arza-pay-input w-full px-3 min-h-11 rounded-xl bg-white border border-slate-300 text-base sm:text-sm font-medium text-slate-900 ${
                      fieldTouched.email && fieldErrors.email ? 'user-invalid-fallback' : ''
                    }`}
                  />
                  {renderFieldError('email', emailErrId)}
                </div>

                {/* DATOS DE CONTACTO Y DIRECCIÓN DE ENTREGA */}
                <fieldset className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <legend className="text-[11px] font-bold uppercase tracking-wider text-slate-700 px-1">
                    Datos de Entrega y Contacto
                  </legend>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label htmlFor={shipNameId} className="text-[11px] font-bold text-slate-700 block mb-0.5">
                        Nombre completo / Capitán *
                      </label>
                      <input
                        ref={shippingNameRef}
                        id={shipNameId}
                        name="shipping-name"
                        type="text"
                        autoComplete="name"
                        required
                        value={formValues.shippingName}
                        onChange={(e) => handleFieldChange('shippingName', e.target.value)}
                        onBlur={() => handleFieldBlur('shippingName')}
                        aria-invalid={fieldTouched.shippingName && fieldErrors.shippingName ? 'true' : 'false'}
                        placeholder="Ej. Carlos Mendoza"
                        className={`arza-pay-input w-full px-3 min-h-10 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-900 ${
                          fieldTouched.shippingName && fieldErrors.shippingName ? 'user-invalid-fallback' : ''
                        }`}
                      />
                      {renderFieldError('shippingName', shipNameErrId)}
                    </div>

                    <div>
                      <label htmlFor={phoneId} className="text-[11px] font-bold text-slate-700 block mb-0.5">
                        WhatsApp / Teléfono *
                      </label>
                      <input
                        ref={phoneRef}
                        id={phoneId}
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        required
                        value={formValues.phone}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        onBlur={() => handleFieldBlur('phone')}
                        aria-invalid={fieldTouched.phone && fieldErrors.phone ? 'true' : 'false'}
                        placeholder="55 1234 5678"
                        className={`arza-pay-input w-full px-3 min-h-10 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-900 ${
                          fieldTouched.phone && fieldErrors.phone ? 'user-invalid-fallback' : ''
                        }`}
                      />
                      {renderFieldError('phone', phoneErrId)}
                    </div>
                  </div>

                  <div>
                    <label htmlFor={shipAddrId} className="text-[11px] font-bold text-slate-700 block mb-0.5">
                      Dirección de envío (calle, número, colonia) *
                    </label>
                    <input
                      ref={shippingAddressRef}
                      id={shipAddrId}
                      name="shipping-address"
                      type="text"
                      autoComplete="shipping street-address"
                      required
                      value={formValues.shippingAddress}
                      onChange={(e) => handleFieldChange('shippingAddress', e.target.value)}
                      onBlur={() => handleFieldBlur('shippingAddress')}
                      aria-invalid={fieldTouched.shippingAddress && fieldErrors.shippingAddress ? 'true' : 'false'}
                      placeholder="Av. Reforma 240, Col. Juárez"
                      className={`arza-pay-input w-full px-3 min-h-10 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-900 ${
                        fieldTouched.shippingAddress && fieldErrors.shippingAddress ? 'user-invalid-fallback' : ''
                      }`}
                    />
                    {renderFieldError('shippingAddress', shipAddrErrId)}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor={shipCityId} className="text-[11px] font-bold text-slate-700 block mb-0.5">
                        Ciudad y Estado *
                      </label>
                      <input
                        ref={shippingCityRef}
                        id={shipCityId}
                        name="shipping-city"
                        type="text"
                        autoComplete="shipping address-level2"
                        required
                        value={formValues.shippingCity}
                        onChange={(e) => handleFieldChange('shippingCity', e.target.value)}
                        onBlur={() => handleFieldBlur('shippingCity')}
                        aria-invalid={fieldTouched.shippingCity && fieldErrors.shippingCity ? 'true' : 'false'}
                        placeholder="CDMX / Jalisco"
                        className={`arza-pay-input w-full px-3 min-h-10 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-900 ${
                          fieldTouched.shippingCity && fieldErrors.shippingCity ? 'user-invalid-fallback' : ''
                        }`}
                      />
                      {renderFieldError('shippingCity', shipCityErrId)}
                    </div>

                    <div>
                      <label htmlFor={shipZipId} className="text-[11px] font-bold text-slate-700 block mb-0.5">
                        Código Postal *
                      </label>
                      <input
                        ref={shippingZipRef}
                        id={shipZipId}
                        name="shipping-zip"
                        type="text"
                        autoComplete="shipping postal-code"
                        inputMode="numeric"
                        required
                        value={formValues.shippingZip}
                        onChange={(e) => handleFieldChange('shippingZip', e.target.value)}
                        onBlur={() => handleFieldBlur('shippingZip')}
                        aria-invalid={fieldTouched.shippingZip && fieldErrors.shippingZip ? 'true' : 'false'}
                        placeholder="06600"
                        className={`arza-pay-input w-full px-3 min-h-10 rounded-lg bg-white border border-slate-300 text-xs font-mono font-medium text-slate-900 ${
                          fieldTouched.shippingZip && fieldErrors.shippingZip ? 'user-invalid-fallback' : ''
                        }`}
                      />
                      {renderFieldError('shippingZip', shipZipErrId)}
                    </div>
                  </div>
                </fieldset>

                {/* DETALLE TARJETA DE DÉBITO / CRÉDITO */}
                {paymentMethod === 'card' && (
                  <div className="space-y-3 pt-1">
                    {/* Tipo de Tarjeta: Débito vs Crédito */}
                    <fieldset className="space-y-1.5">
                      <legend className="text-xs font-bold text-slate-800">
                        Tipo de tarjeta
                      </legend>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'debit', label: 'Tarjeta de Débito' },
                          { id: 'credit', label: 'Tarjeta de Crédito' },
                        ].map((opt) => {
                          const optId = `${uid}-ckind-${opt.id}`;
                          const activeKind = cardKind === opt.id;
                          return (
                            <div key={opt.id} className="relative">
                              <input
                                type="radio"
                                id={optId}
                                name="card-kind"
                                value={opt.id}
                                checked={activeKind}
                                onChange={() => {
                                  setCardKind(opt.id);
                                  if (opt.id === 'debit') setInstallments('1');
                                }}
                                className="sr-only peer"
                              />
                              <label
                                htmlFor={optId}
                                className={`flex items-center justify-center min-h-10 px-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-700 peer-focus-visible:ring-offset-1 ${
                                  activeKind
                                    ? 'arza-btn-glass-green'
                                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                                }`}
                              >
                                {opt.label}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </fieldset>

                    {cardKind === 'credit' && (
                      <fieldset className="space-y-1.5">
                        <legend className="text-xs font-bold text-slate-800">
                          Plan de pagos (Meses Sin Intereses)
                        </legend>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { val: '1', title: '1 pago', sub: `$${totalAmount}` },
                            { val: '3', title: '3 MSI', sub: `$${(totalNumeric / 3).toFixed(2)}/m` },
                            { val: '6', title: '6 MSI', sub: `$${(totalNumeric / 6).toFixed(2)}/m` },
                          ].map((plan) => {
                            const pId = `${uid}-msi-${plan.val}`;
                            const activePlan = installments === plan.val;
                            return (
                              <div key={plan.val} className="relative">
                                <input
                                  type="radio"
                                  id={pId}
                                  name="installments"
                                  value={plan.val}
                                  checked={activePlan}
                                  onChange={() => setInstallments(plan.val)}
                                  className="sr-only peer"
                                />
                                <label
                                  htmlFor={pId}
                                  className={`flex flex-col items-center justify-center min-h-11 px-2 py-1 rounded-xl border text-center cursor-pointer transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-700 peer-focus-visible:ring-offset-1 ${
                                    activePlan
                                      ? 'bg-emerald-50 border-emerald-700 text-emerald-950 font-black'
                                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 font-semibold'
                                  }`}
                                >
                                  <span className="text-xs leading-tight">{plan.title}</span>
                                  <span className="text-[10px] text-slate-500 font-mono leading-tight">
                                    {plan.sub}
                                  </span>
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </fieldset>
                    )}

                    {/* Número único de tarjeta (`autocomplete="cc-number"`, sin type="number") */}
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <label htmlFor={ccNumId} className="text-xs font-bold text-slate-800 block">
                          Número de tarjeta <span aria-hidden="true">*</span>
                        </label>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {cardBrand.badge}
                        </span>
                      </div>
                      <span id={ccNumHintId} className="text-[11px] text-slate-500 block mt-0.5 mb-1">
                        Ingresa los 13 a 19 dígitos (ej. 4532 1000 2000 3001)
                      </span>
                      <input
                        ref={ccNumberRef}
                        id={ccNumId}
                        name="cc-number"
                        type="text"
                        autoComplete="cc-number"
                        inputMode="numeric"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        enterKeyHint="next"
                        maxLength={23}
                        pattern="[\d ]{13,23}"
                        required
                        value={formValues.ccNumber}
                        onChange={(e) => handleFieldChange('ccNumber', e.target.value)}
                        onBlur={() => handleFieldBlur('ccNumber')}
                        aria-invalid={fieldTouched.ccNumber && fieldErrors.ccNumber ? 'true' : 'false'}
                        aria-describedby={
                          fieldTouched.ccNumber && fieldErrors.ccNumber
                            ? `${ccNumHintId} ${ccNumErrId}`
                            : ccNumHintId
                        }
                        placeholder="0000 0000 0000 0000"
                        className={`arza-pay-input w-full px-3 min-h-11 rounded-xl bg-white border border-slate-300 font-mono text-base sm:text-sm font-bold text-slate-900 ${
                          fieldTouched.ccNumber && fieldErrors.ccNumber ? 'user-invalid-fallback' : ''
                        }`}
                      />
                      {renderFieldError('ccNumber', ccNumErrId)}
                    </div>

                    {/* Nombre único de titular (`autocomplete="cc-name"`, patrón Unicode) */}
                    <div>
                      <label htmlFor={ccNameId} className="text-xs font-bold text-slate-800 block mb-1">
                        Nombre del titular en la tarjeta <span aria-hidden="true">*</span>
                      </label>
                      <input
                        ref={ccNameRef}
                        id={ccNameId}
                        name="cc-name"
                        type="text"
                        autoComplete="cc-name"
                        enterKeyHint="next"
                        maxLength={60}
                        pattern="[\p{L} \-\.']+"
                        required
                        value={formValues.ccName}
                        onChange={(e) => handleFieldChange('ccName', e.target.value)}
                        onBlur={() => handleFieldBlur('ccName')}
                        aria-invalid={fieldTouched.ccName && fieldErrors.ccName ? 'true' : 'false'}
                        aria-describedby={
                          fieldTouched.ccName && fieldErrors.ccName ? ccNameErrId : undefined
                        }
                        placeholder="Como aparece en el plástico"
                        className={`arza-pay-input w-full px-3 min-h-11 rounded-xl bg-white border border-slate-300 text-base sm:text-sm font-semibold text-slate-900 ${
                          fieldTouched.ccName && fieldErrors.ccName ? 'user-invalid-fallback' : ''
                        }`}
                      />
                      {renderFieldError('ccName', ccNameErrId)}
                    </div>

                    {/* Vencimiento MM/AA y CVV visible en 2 columnas */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={ccExpId} className="text-xs font-bold text-slate-800 block">
                          Vencimiento <span aria-hidden="true">*</span>
                        </label>
                        <span id={ccExpHintId} className="text-[11px] text-slate-500 block mt-0.5 mb-1">
                          Formato: MM/AA
                        </span>
                        <input
                          ref={ccExpRef}
                          id={ccExpId}
                          name="cc-exp"
                          type="text"
                          autoComplete="cc-exp"
                          inputMode="numeric"
                          enterKeyHint="next"
                          maxLength={5}
                          pattern="(0[1-9]|1[0-2])\/\d{2}"
                          required
                          value={formValues.ccExp}
                          onChange={(e) => handleFieldChange('ccExp', e.target.value)}
                          onBlur={() => handleFieldBlur('ccExp')}
                          aria-invalid={fieldTouched.ccExp && fieldErrors.ccExp ? 'true' : 'false'}
                          aria-describedby={
                            fieldTouched.ccExp && fieldErrors.ccExp
                              ? `${ccExpHintId} ${ccExpErrId}`
                              : ccExpHintId
                          }
                          placeholder="08/29"
                          className={`arza-pay-input w-full px-3 min-h-11 rounded-xl bg-white border border-slate-300 font-mono text-base sm:text-sm font-bold text-slate-900 ${
                            fieldTouched.ccExp && fieldErrors.ccExp ? 'user-invalid-fallback' : ''
                          }`}
                        />
                        {renderFieldError('ccExp', ccExpErrId)}
                      </div>

                      <div>
                        <label htmlFor={ccCscId} className="text-xs font-bold text-slate-800 block">
                          CVV / CVC <span aria-hidden="true">*</span>
                        </label>
                        <span id={ccCscHintId} className="text-[11px] text-slate-500 block mt-0.5 mb-1">
                          {cardBrand.id === 'amex' ? '4 dígitos al frente' : '3 o 4 dígitos reverso'}
                        </span>
                        <input
                          ref={ccCscRef}
                          id={ccCscId}
                          name="cc-csc"
                          type="text"
                          autoComplete="cc-csc"
                          inputMode="numeric"
                          autoCorrect="off"
                          autoCapitalize="none"
                          spellCheck={false}
                          enterKeyHint="done"
                          maxLength={4}
                          pattern="\d{3,4}"
                          required
                          value={formValues.ccCsc}
                          onChange={(e) => handleFieldChange('ccCsc', e.target.value)}
                          onBlur={() => handleFieldBlur('ccCsc')}
                          aria-invalid={fieldTouched.ccCsc && fieldErrors.ccCsc ? 'true' : 'false'}
                          aria-describedby={
                            fieldTouched.ccCsc && fieldErrors.ccCsc
                              ? `${ccCscHintId} ${ccCscErrId}`
                              : ccCscHintId
                          }
                          placeholder={cardBrand.id === 'amex' ? '1234' : '123'}
                          className={`arza-pay-input w-full px-3 min-h-11 rounded-xl bg-white border border-slate-300 font-mono text-base sm:text-sm font-bold text-slate-900 ${
                            fieldTouched.ccCsc && fieldErrors.ccCsc ? 'user-invalid-fallback' : ''
                          }`}
                        />
                        {renderFieldError('ccCsc', ccCscErrId)}
                      </div>
                    </div>

                    {/* Dirección de facturación colapsable según mejores prácticas */}
                    <div className="pt-1 border-t border-slate-100 space-y-2">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer min-h-8">
                        <input
                          type="checkbox"
                          checked={sameBillingAddress}
                          onChange={(e) => setSameBillingAddress(e.target.checked)}
                          className="w-4 h-4 accent-emerald-700 rounded cursor-pointer"
                        />
                        <span>La dirección de facturación coincide con el envío</span>
                      </label>

                      {!sameBillingAddress && (
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <div>
                            <label htmlFor={billingStreetId} className="text-[11px] font-bold text-slate-700 block mb-1">
                              Dirección de facturación / fiscal
                            </label>
                            <textarea
                              id={billingStreetId}
                              name="billing-address"
                              rows={2}
                              autoComplete="billing street-address"
                              value={formValues.billingAddress}
                              onChange={(e) => handleFieldChange('billingAddress', e.target.value)}
                              placeholder="Calle, número, colonia y referencias"
                              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-900"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label htmlFor={billingCityId} className="text-[11px] font-bold text-slate-700 block mb-1">
                                Ciudad / Estado
                              </label>
                              <input
                                id={billingCityId}
                                type="text"
                                autoComplete="billing address-level2"
                                value={formValues.billingCity}
                                onChange={(e) => handleFieldChange('billingCity', e.target.value)}
                                className="w-full px-2.5 min-h-10 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-900"
                              />
                            </div>
                            <div>
                              <label htmlFor={billingZipId} className="text-[11px] font-bold text-slate-700 block mb-1">
                                Código postal (opcional)
                              </label>
                              <input
                                id={billingZipId}
                                type="text"
                                inputMode="numeric"
                                autoComplete="billing postal-code"
                                value={formValues.billingPostalCode}
                                onChange={(e) => handleFieldChange('billingPostalCode', e.target.value)}
                                className="w-full px-2.5 min-h-10 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* DETALLE SPEI / TRANSFERENCIA */}
                {paymentMethod === 'spei' && (
                  <div className="space-y-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'deposit50', title: '50% Anticipo', amt: (totalNumeric * 0.5).toFixed(2) },
                        { id: 'full100', title: '100% Total', amt: totalAmount },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          aria-pressed={speiMode === opt.id}
                          onClick={() => setSpeiMode(opt.id)}
                          className={`p-2 rounded-xl border text-center cursor-pointer transition-colors ${
                            speiMode === opt.id
                              ? 'bg-emerald-50 border-emerald-700 text-emerald-950 font-black'
                              : 'bg-white border-slate-200 text-slate-700 font-semibold'
                          }`}
                        >
                          <span className="block">{opt.title}</span>
                          <span className="font-mono text-[11px] text-emerald-800">${opt.amt} USD</span>
                        </button>
                      ))}
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500 block">
                          CLABE SPEI (ARZA SPORT / Grupo Zava)
                        </span>
                        <span className="font-mono font-black text-slate-900">{SPEI_CLABE}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyValue('clabe', SPEI_CLABE)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-800 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        {copiedKey === 'clabe' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                            <span>Copiada</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* DETALLE BILLETERAS / LINK DE PAGO */}
                {paymentMethod === 'wallet' && (
                  <fieldset className="space-y-1.5">
                    <legend className="text-xs font-bold text-slate-800">
                      Elige tu billetera o enlace rápido
                    </legend>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'mercadopago', label: 'Mercado Pago' },
                        { id: 'paypal', label: 'PayPal' },
                        { id: 'apple_gpay', label: 'Apple / GPay' },
                      ].map((w) => {
                        const wId = `${uid}-wallet-${w.id}`;
                        const activeW = walletProvider === w.id;
                        return (
                          <div key={w.id} className="relative">
                            <input
                              type="radio"
                              id={wId}
                              name="wallet-provider"
                              value={w.id}
                              checked={activeW}
                              onChange={() => setWalletProvider(w.id)}
                              className="sr-only peer"
                            />
                            <label
                              htmlFor={wId}
                              className={`flex items-center justify-center min-h-11 px-2 rounded-xl border text-[11px] font-bold text-center cursor-pointer transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-700 peer-focus-visible:ring-offset-1 ${
                                activeW
                                  ? 'arza-btn-glass-green'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              {w.label}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                {/* CTA Exacto de Pago */}
                <button
                  type="submit"
                  id="btn-submit-order-payment"
                  disabled={isSubmitting}
                  className="w-full min-h-12 px-5 rounded-2xl arza-btn-glass-green font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>
                    {paymentMethod === 'card'
                      ? `Pagar $${totalAmount} USD con Tarjeta${
                          cardKind === 'credit' && installments !== '1' ? ` (${installments} MSI)` : ''
                        }`
                      : paymentMethod === 'spei'
                      ? `Generar Orden SPEI ($${speiAmount} USD)`
                      : `Pagar $${totalAmount} USD (${
                          walletProvider === 'paypal'
                            ? 'PayPal'
                            : walletProvider === 'apple_gpay'
                            ? 'Apple / GPay'
                            : 'Mercado Pago'
                        })`}
                  </span>
                </button>

                <p className="text-[10px] text-center text-slate-500 leading-snug">
                  Registro cifrado • Tu folio y ficha de especificaciones se envían directo a taller ARZA SPORT ({ARZA_CONTACT.leadTime}).
                </p>
              </form>
            </>
          )}
        </div>

        {/* Utilidades Secundarias al pie del pedido */}
        {!paymentReceipt && items.length > 0 && (
          <div className="shrink-0 pt-3 border-t border-slate-200 grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={onOpenQuoteModal}
              className="min-h-10 px-2 rounded-xl arza-glass-card hover:bg-white text-[11px] font-bold text-slate-800 inline-flex items-center justify-center gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
              <span className="truncate">Cotización</span>
            </button>

            {onOpenOrderTracking && (
              <button
                type="button"
                onClick={() => onOpenOrderTracking('')}
                className="min-h-10 px-2 rounded-xl arza-glass-card hover:bg-white text-[11px] font-bold text-slate-800 inline-flex items-center justify-center gap-1 cursor-pointer"
              >
                <Package className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                <span className="truncate">Mis Pedidos</span>
              </button>
            )}

            <a
              href={buildWhatsAppUrl(
                buildFactoryOrderSummaryText({
                  folio: 'BORRADOR',
                  createdAtLabel: 'Borrador activo',
                  statusLabel: 'Solicitud previa por WhatsApp',
                  customerName: formValues.shippingName || 'Cliente Web',
                  phone: formValues.phone,
                  email: formValues.email,
                  totalOrder: totalAmount,
                  units: totalQuantity,
                  snapshotItems: items,
                })
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-10 px-2 rounded-xl arza-glass-card hover:bg-white text-[11px] font-bold text-slate-800 inline-flex items-center justify-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
              <span className="truncate">WhatsApp</span>
            </a>
          </div>
        )}
        </div>
      </div>
    </dialog>
  );
}
