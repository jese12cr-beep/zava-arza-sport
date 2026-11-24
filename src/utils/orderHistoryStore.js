export const ARZA_CONTACT = {
  brand: 'ARZA SPORT™ by Grupo Zava',
  email: 'contacto@arzasport.mx',
  phoneDisplay: '+52 (55) 4160-8800',
  whatsappDigits: '525541608800',
  speiClabe: '646180110400928374',
  leadTime: '10 a 12 días hábiles',
};

const ORDERS_STORAGE_KEY = 'arza_orders_history_v1';
const SAMPLES_STORAGE_KEY = 'arza_sample_requests_v1';

const CUT_LABELS = {
  MEN_PRO_SLIM: 'Caballero Slim',
  MEN_CLASSIC: 'Caballero Clásico',
  WOMEN_FIT: 'Dama Entallado',
  YOUTH_KIDS: 'Infantil / Juvenil',
};

const COLLAR_LABELS = {
  v_neck: 'Cuello V',
  round: 'Cuello Redondo',
  polo: 'Cuello Polo',
};

const GLOVE_CUT_LABELS = {
  negative: 'Corte Negativo',
  roll_finger: 'Roll Finger',
  hybrid: 'Híbrido Pro',
};

export function formatCutLabel(cut = '') {
  return CUT_LABELS[cut] || String(cut || 'Estándar').replace(/_/g, ' ');
}

export function formatCollarLabel(collar = 'v_neck') {
  return COLLAR_LABELS[collar] || 'Cuello V';
}

export function formatGloveCutLabel(cut = 'hybrid') {
  return GLOVE_CUT_LABELS[cut] || String(cut || 'Híbrido Pro').replace(/_/g, ' ');
}

/**
 * Safely captures a PNG data URL from either a getter function ref or a live <canvas> element ref.
 */
export function captureCanvasSnapshot(canvasSnapshotRef) {
  try {
    const current = canvasSnapshotRef?.current;
    if (!current) return null;
    if (typeof current === 'function') {
      return current() || null;
    }
    if (typeof current.toDataURL === 'function') {
      return current.toDataURL('image/png') || null;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Generates a high-contrast PNG summary poster when an older saved design lacks a WebGL capture.
 */
export function renderFallbackKitThumbnail({
  title = 'Diseño ARZA SPORT',
  productName = 'Jersey Técnico',
  patternName = 'Personalizado',
  colors = ['#111111', '#fa5400', '#ffffff'],
} = {}) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const [cA = '#111111', cB = '#fa5400', cC = '#ffffff'] = colors;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle decorative stripe motif
  ctx.fillStyle = cA;
  ctx.fillRect(0, 0, canvas.width, 28);
  ctx.fillStyle = cB;
  ctx.fillRect(0, 28, canvas.width, 10);

  // Stylized centered jersey silhouette
  ctx.save();
  ctx.translate(480, 315);
  ctx.beginPath();
  ctx.moveTo(-110, -155);
  ctx.lineTo(-42, -172);
  ctx.quadraticCurveTo(0, -135, 42, -172);
  ctx.lineTo(110, -155);
  ctx.lineTo(205, -80);
  ctx.lineTo(165, -2);
  ctx.lineTo(115, -32);
  ctx.lineTo(115, 165);
  ctx.lineTo(-115, 165);
  ctx.lineTo(-115, -32);
  ctx.lineTo(-165, -2);
  ctx.lineTo(-205, -80);
  ctx.closePath();
  ctx.fillStyle = cA;
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = cB;
  ctx.fillRect(-220, -28, 440, 62);
  ctx.fillStyle = cC;
  ctx.fillRect(-220, 34, 440, 14);
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(title).slice(0, 34), 480, 540);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 20px sans-serif';
  ctx.fillText(`${productName} · Corte ${patternName}`, 480, 578);

  colors.slice(0, 3).forEach((hex, idx) => {
    ctx.beginPath();
    ctx.arc(432 + idx * 48, 608, 11, 0, Math.PI * 2);
    ctx.fillStyle = hex || '#ffffff';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  try {
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

export function loadOrderHistory() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveConfirmedOrder(order) {
  if (typeof window === 'undefined' || !order) return order;
  const existing = loadOrderHistory().filter((item) => item.folio !== order.folio);
  const next = [order, ...existing].slice(0, 25);
  try {
    window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('arza_orders_updated'));
  } catch {}
  return order;
}

export function loadSampleRequests() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SAMPLES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSampleRequest(req) {
  const entry = {
    folio: `SM-${String(Math.floor(10000 + Math.random() * 90000))}`,
    createdAt: new Date().toISOString(),
    ...req,
  };
  if (typeof window !== 'undefined') {
    const existing = loadSampleRequests();
    const next = [entry, ...existing].slice(0, 20);
    try {
      window.localStorage.setItem(SAMPLES_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }
  return entry;
}

export function buildWhatsAppUrl(text) {
  return `https://wa.me/${ARZA_CONTACT.whatsappDigits}?text=${encodeURIComponent(text)}`;
}

export function buildFactoryOrderSummaryText(order) {
  if (!order) return '';
  const lines = [
    `*PEDIDO ARZA SPORT (${order.folio})*`,
    `Fecha: ${order.createdAtLabel || new Date().toLocaleDateString('es-MX')}`,
    `Estado: ${order.statusLabel || 'Recibido · En revisión con taller'}`,
    order.customerName ? `Cliente / Capitán: ${order.customerName}` : null,
    order.phone ? `Tel / WhatsApp: ${order.phone}` : null,
    order.email ? `Correo: ${order.email}` : null,
    order.shippingAddress
      ? `Envío: ${order.shippingAddress}${order.shippingCity ? `, ${order.shippingCity}` : ''}${order.shippingZip ? ` CP ${order.shippingZip}` : ''}`
      : null,
    `Método: ${order.methodLabel || 'Cotización directa'} (${order.installmentsLabel || 'Por confirmar'})`,
    `Total: $${order.totalOrder || order.amountPaid || '0.00'} USD · ${order.units || 0} prendas`,
    '',
    '*ESPECIFICACIONES PARA FÁBRICA:*',
  ].filter(Boolean);

  (order.snapshotItems || []).forEach((it, idx) => {
    lines.push(
      `${idx + 1}. ${it.product?.name || 'Prenda ARZA'} (${it.totalUnits || 1} uds · Ref diseño: ${it.designId || 'ARZA'})`
    );
    lines.push(
      `   Corte gráfico: ${it.design?.pattern || 'Tackle'} · Cuello: ${formatCollarLabel(it.design?.collarStyle)} · Tela: ${it.design?.fabricName || 'Técnica ARZA'}`
    );
    lines.push(
      `   Colores: Base ${it.design?.baseColor || '#111111'} | Mangas ${it.design?.sleeveColor || it.design?.baseColor || '#111111'} | Acentos ${it.design?.accentColor || '#FFFFFF'}`
    );
    if (it.goalkeeperSpec) {
      lines.push(
        `   Portero Manga Larga (${it.goalkeeperSpec.keeperUnits} uds): Base ${it.goalkeeperSpec.primaryColor} · Sec ${it.goalkeeperSpec.secondaryColor}`
      );
    }
    if (it.glovesSpec) {
      lines.push(
        `   Guantes Portero 3D (${it.glovesSpec.glovePairs} pares): ${formatGloveCutLabel(it.glovesSpec.gloveCut)}`
      );
    }
    if (it.roster?.length) {
      const rosterSummary = it.roster
        .map(
          (r) =>
            `   - ${r.number ? `#${r.number} ` : ''}${r.name || 'Sin nombre'} | ${r.size} | ${formatCutLabel(r.cut)} | ${r.role || 'Jugador'}${r.gloveSize ? ` (Guante T${r.gloveSize})` : ''} x${r.qty || 1}`
        )
        .join('\n');
      lines.push(rosterSummary);
    }
  });

  return lines.join('\n');
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function downloadFactoryOrderSheetHtml(order) {
  if (typeof document === 'undefined' || !order) return;
  const itemsHtml = (order.snapshotItems || [])
    .map((it, idx) => {
      const rosterRows = (it.roster || [])
        .map(
          (r) => `
          <tr>
            <td>${r.number ? `#${escapeHtml(r.number)}` : '—'}</td>
            <td><strong>${escapeHtml(r.name || 'Sin nombre')}</strong></td>
            <td>${escapeHtml(r.role || 'Jugador')}</td>
            <td>${escapeHtml(formatCutLabel(r.cut))}</td>
            <td>${escapeHtml(r.size || 'L')}</td>
            <td>${r.gloveSize ? `T${escapeHtml(r.gloveSize)}` : '—'}</td>
            <td>${escapeHtml(r.qty || 1)}</td>
          </tr>`
        )
        .join('');

      return `
        <section class="card">
          <div class="card-head">
            <div>
              <h2>${idx + 1}. ${escapeHtml(it.product?.name || 'Equipación ARZA SPORT')}</h2>
              <p class="muted">Ref. Diseño: ${escapeHtml(it.designId || 'ARZA')} · ${escapeHtml(it.product?.description || '')}</p>
            </div>
            <div class="price">$${escapeHtml(it.totalPrice || '0.00')} USD</div>
          </div>
          <div class="specs">
            <div><span>Corte Gráfico</span><strong>${escapeHtml(it.design?.pattern || 'Tackle')}</strong></div>
            <div><span>Cuello Taller</span><strong>${escapeHtml(formatCollarLabel(it.design?.collarStyle))}</strong></div>
            <div><span>Tejido</span><strong>${escapeHtml(it.design?.fabricName || 'TS-Tex™ / CoolDry™')}</strong></div>
            <div><span>Colores</span><strong><i class="dot" style="background:${escapeHtml(it.design?.baseColor || '#111111')}"></i> ${escapeHtml(it.design?.baseColor || '#111111')} / ${escapeHtml(it.design?.sleeveColor || it.design?.baseColor || '#111111')}</strong></div>
          </div>
          ${
            it.goalkeeperSpec || it.glovesSpec
              ? `<p class="extra">${
                  it.goalkeeperSpec
                    ? `<strong>Portero Manga Larga (${escapeHtml(it.goalkeeperSpec.keeperUnits)} uds):</strong> Base ${escapeHtml(it.goalkeeperSpec.primaryColor)} / Sec ${escapeHtml(it.goalkeeperSpec.secondaryColor)}. `
                    : ''
                }${
                  it.glovesSpec
                    ? `<strong>Guantes Portero 3D (${escapeHtml(it.glovesSpec.glovePairs)} pares):</strong> ${escapeHtml(formatGloveCutLabel(it.glovesSpec.gloveCut))}.`
                    : ''
                }</p>`
              : ''
          }
          ${
            rosterRows
              ? `<table><thead><tr><th>Dorsal</th><th>Nombre</th><th>Rol</th><th>Corte</th><th>Talla</th><th>Guante</th><th>Cant.</th></tr></thead><tbody>${rosterRows}</tbody></table>`
              : ''
          }
        </section>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Ficha de Pedido ${escapeHtml(order.folio)} — ARZA SPORT</title>
  <style>
    body{font-family:Inter,system-ui,sans-serif;color:#111;background:#f7f7f7;margin:0;padding:32px}
    .sheet{max-width:920px;margin:0 auto;background:#fff;padding:32px;border:1px solid #e5e5e5}
    .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:16px;margin-bottom:20px}
    .brand{font-weight:900;font-size:22px;letter-spacing:.04em}
    .brand span{color:#fa5400}
    .meta{text-align:right;font-size:12px}
    .folio{font-family:monospace;font-size:16px;font-weight:900;color:#065f46}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;background:#f5f5f5;padding:14px;margin-bottom:20px;font-size:13px}
    .card{border:1px solid #e5e5e5;padding:18px;margin-bottom:16px}
    .card-head{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px}
    .card-head h2{margin:0;font-size:16px}
    .muted{color:#64748b;font-size:12px;margin:4px 0 0}
    .price{font-weight:900;font-size:16px;white-space:nowrap}
    .specs{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;border-top:1px solid #eee;border-bottom:1px solid #eee;padding:10px 0;font-size:12px}
    .specs span{display:block;color:#64748b;font-size:10px;text-transform:uppercase;font-weight:700}
    .dot{display:inline-block;width:10px;height:10px;border-radius:50%;border:1px solid #999;vertical-align:middle}
    .extra{font-size:12px;background:#fffbeb;border:1px solid #fde68a;padding:8px 10px;margin:10px 0 0}
    table{width:100%;border-collapse:collapse;margin-top:12px;font-size:12px}
    th,td{border:1px solid #e5e5e5;padding:6px 8px;text-align:left}
    th{background:#f5f5f5;font-size:11px;text-transform:uppercase}
    .foot{margin-top:20px;display:flex;justify-content:space-between;font-size:13px;border-top:2px solid #111;padding-top:14px}
    @media print{body{background:#fff;padding:0}.sheet{border:none;padding:0}}
  </style>
</head>
<body>
  <div class="sheet">
    <div class="top">
      <div>
        <div class="brand">ARZA <span>SPORT</span> · Orden de Taller</div>
        <div class="muted">Grupo Zava · ${escapeHtml(ARZA_CONTACT.email)} · ${escapeHtml(ARZA_CONTACT.phoneDisplay)}</div>
      </div>
      <div class="meta">
        <div class="folio">${escapeHtml(order.folio)}</div>
        <div>${escapeHtml(order.createdAtLabel || '')}</div>
        <div><strong>${escapeHtml(order.statusLabel || 'Recibido')}</strong></div>
      </div>
    </div>
    <div class="grid2">
      <div>
        <strong>Cliente / Entrega</strong><br/>
        ${escapeHtml(order.customerName || 'Club ARZA')}<br/>
        Tel: ${escapeHtml(order.phone || 'Por confirmar')}<br/>
        Correo: ${escapeHtml(order.email || '')}<br/>
        ${escapeHtml(order.shippingAddress || 'Dirección por confirmar')}${order.shippingCity ? `, ${escapeHtml(order.shippingCity)}` : ''}${order.shippingZip ? ` CP ${escapeHtml(order.shippingZip)}` : ''}
      </div>
      <div>
        <strong>Pago y Condiciones</strong><br/>
        Método: ${escapeHtml(order.methodLabel || 'Cotización')}<br/>
        Plan: ${escapeHtml(order.installmentsLabel || '1 exhibición')}<br/>
        Tiempo estimado de fábrica: ${escapeHtml(ARZA_CONTACT.leadTime)}
      </div>
    </div>
    ${itemsHtml}
    <div class="foot">
      <span>Nota para diseñadores de fábrica: generar pliego de corte según tabla de dorsales y referencias de color arriba indicadas.</span>
      <strong>Total (${escapeHtml(order.units || 0)} uds): $${escapeHtml(order.totalOrder || order.amountPaid || '0.00')} USD</strong>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ARZA_${order.folio}_Ficha_Fabrica.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
