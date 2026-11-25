import { PANTONE_CM5_PALETTE } from '../engine/core/palette152';

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

export function normalizeHexColor(rawHex = '#111111') {
  const clean = String(rawHex || '#111111').trim();
  const shortMatch = clean.match(/^#?([0-9a-fA-F]{3})$/);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  const fullMatch = clean.match(/^#?([0-9a-fA-F]{6})$/);
  if (fullMatch) {
    return `#${fullMatch[1].toUpperCase()}`;
  }
  return '#111111';
}

export function hexToRgbInfo(rawHex = '#111111') {
  const hex = normalizeHexColor(rawHex);
  const intVal = parseInt(hex.slice(1), 16);
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  return {
    hex,
    r,
    g,
    b,
    channels: `${r}, ${g}, ${b}`,
    label: `rgb(${r}, ${g}, ${b})`,
  };
}

export function rgbToCmykLabel(r, g, b) {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const k = 1 - Math.max(rf, gf, bf);
  if (k >= 0.999) return 'C0% M0% Y0% K100%';
  const c = Math.round(((1 - rf - k) / (1 - k)) * 100);
  const m = Math.round(((1 - gf - k) / (1 - k)) * 100);
  const y = Math.round(((1 - bf - k) / (1 - k)) * 100);
  const kp = Math.round(k * 100);
  return `C${c}% M${m}% Y${y}% K${kp}%`;
}

function findNearestPantoneMatch(hex) {
  const target = hexToRgbInfo(hex);
  let best = null;
  let bestDist = Infinity;

  for (const entry of PANTONE_CM5_PALETTE) {
    const candidate = hexToRgbInfo(entry.hex);
    const dr = target.r - candidate.r;
    const dg = target.g - candidate.g;
    const db = target.b - candidate.b;
    // Distancia perceptual ponderada en sRGB
    const dist = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
    if (dist < bestDist) {
      bestDist = dist;
      best = { entry, exact: dist === 0 };
      if (dist === 0) break;
    }
  }
  return best;
}

/**
 * Resuelve el perfil completo de un color de zona (HEX, RGB, CMYK y Pantone® oficial o aproximado).
 */
export function resolveColorPaletteSpec(zoneInput, zoneLabel = 'Color') {
  const isObj = zoneInput && typeof zoneInput === 'object';
  const rawHex = isObj ? zoneInput.hex || '#111111' : zoneInput || '#111111';
  const rgbInfo = hexToRgbInfo(rawHex);
  const cmyk = rgbToCmykLabel(rgbInfo.r, rgbInfo.g, rgbInfo.b);
  const rawPantone = isObj ? String(zoneInput.pantone || '').trim() : '';
  const hasExplicitPantone =
    Boolean(rawPantone) && !/personalizad|custom|rgb/i.test(rawPantone);

  const nearest = findNearestPantoneMatch(rgbInfo.hex);
  const pantone = hasExplicitPantone
    ? rawPantone
    : nearest?.exact
    ? nearest.entry.pantone
    : nearest?.entry?.pantone
    ? `Aprox. ${nearest.entry.pantone}`
    : 'Custom RGB';

  const paletteSource =
    hasExplicitPantone || nearest?.exact
      ? 'Paleta Pantone®'
      : 'Paleta RGB (Ref. Pantone)';

  const rawName = isObj
    ? zoneInput.code || zoneInput.name || nearest?.entry?.name || 'Personalizado'
    : nearest?.entry?.name || 'Personalizado';

  return {
    zone: zoneLabel,
    hex: rgbInfo.hex,
    rgb: rgbInfo.label,
    rgbShort: rgbInfo.channels,
    cmyk,
    pantone,
    paletteSource,
    name: rawName,
  };
}

/**
 * Extrae las paletas cromáticas completas de todas las zonas activas de una prenda o par de guantes.
 */
export function extractDesignColorSpecs(designObj, isGloves = false) {
  if (!designObj) return [];
  const zones = designObj.colorZones || {};
  const specs = [];

  if (isGloves) {
    const gloveEntries = [
      ['palm', 'Palma Látex'],
      ['primary', 'Dorso Guante'],
      ['accents', 'Acentos / Dedos'],
      ['strap', 'Cinta Muñequera'],
      ['strapText', 'Texto Muñequera'],
    ];
    for (const [key, label] of gloveEntries) {
      if (zones[key]?.hex) {
        specs.push(resolveColorPaletteSpec(zones[key], label));
      }
    }
    return specs;
  }

  const garmentEntries = [
    ['primary', 'Principal (A)'],
    ['secondary', 'Segundo Color (B)'],
    ['accents', 'Detalles / Contorno (C)'],
  ];
  if (zones.quaternary?.hex) {
    garmentEntries.push(['quaternary', 'Cuarto Color (D)']);
  }
  if (zones.collar?.hex) {
    garmentEntries.push(['collar', 'Cuello / Ribete (K)']);
  }
  if (zones.sleeves?.hex && !String(designObj.productModelId || '').includes('shorts')) {
    garmentEntries.push(['sleeves', 'Mangas / Puños (SL)']);
  }

  for (const [key, label] of garmentEntries) {
    if (zones[key]?.hex) {
      specs.push(resolveColorPaletteSpec(zones[key], label));
    }
  }

  const slots = designObj.variableSlots || {};
  const dorsalFill =
    slots.playerNumberBack?.enabled && slots.playerNumberBack?.fillHex
      ? slots.playerNumberBack.fillHex
      : slots.playerNumberShorts?.enabled && slots.playerNumberShorts?.fillHex
      ? slots.playerNumberShorts.fillHex
      : null;

  if (dorsalFill) {
    specs.push(resolveColorPaletteSpec({ hex: dorsalFill, code: 'Dorsal Principal' }, 'Dorsal / Tipografía'));
  }

  return specs;
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
 * Generates a high-contrast PNG summary poster when a WebGL snapshot is unavailable.
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

  ctx.fillStyle = cA;
  ctx.fillRect(0, 0, canvas.width, 28);
  ctx.fillStyle = cB;
  ctx.fillRect(0, 28, canvas.width, 10);

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
  const next = [order, ...existing].slice(0, 20);
  try {
    window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('arza_orders_updated'));
  } catch {
    // Fallback si cuota de localStorage llena: conservar en almacenamiento sin DataURL pesado
    const { renderImageUrl: _img, ...lightOrder } = order;
    try {
      const compactNext = [lightOrder, ...existing.slice(0, 10)];
      window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(compactNext));
      window.dispatchEvent(new CustomEvent('arza_orders_updated'));
    } catch {}
  }
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

function getFallbackColorSpecsForItem(it) {
  const cp = it?.colorPalettes;
  if (cp?.topZones?.length) return cp;
  const fallbackTop = [
    resolveColorPaletteSpec({ hex: it?.design?.baseColor || '#111111' }, 'Principal (A)'),
    resolveColorPaletteSpec(
      { hex: it?.design?.sleeveColor || it?.design?.baseColor || '#111111' },
      'Mangas / Sec.'
    ),
    resolveColorPaletteSpec({ hex: it?.design?.accentColor || '#FFFFFF' }, 'Detalles (C)'),
  ];
  return {
    topTitle: it?.product?.name || 'Prenda Principal',
    topZones: fallbackTop,
    bottomTitle: null,
    bottomZones: [],
    goalkeeperTitle: it?.goalkeeperSpec ? 'Portero Manga Larga' : null,
    goalkeeperZones: it?.goalkeeperSpec
      ? [
          resolveColorPaletteSpec({ hex: it.goalkeeperSpec.primaryColor || '#059669' }, 'Principal Portero'),
          resolveColorPaletteSpec({ hex: it.goalkeeperSpec.secondaryColor || '#111111' }, 'Secundario Portero'),
        ]
      : [],
    glovesTitle: it?.glovesSpec ? `Guantes Pro 3D (${formatGloveCutLabel(it.glovesSpec.gloveCut)})` : null,
    glovesZones: [],
  };
}

export function buildFactoryOrderSummaryText(order) {
  if (!order) return '';
  const lines = [
    `*FICHA TÉCNICA Y PEDIDO ARZA SPORT (${order.folio})*`,
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
    const palettes = getFallbackColorSpecsForItem(it);
    lines.push(
      `${idx + 1}. ${it.product?.name || 'Prenda ARZA'} (${it.totalUnits || 1} uds · Ref diseño: ${it.designId || 'ARZA'})`
    );
    lines.push(
      `   Corte gráfico: ${it.design?.pattern || 'Tackle'} · Cuello: ${formatCollarLabel(it.design?.collarStyle)} · Tela: ${it.design?.fabricName || 'Técnica ARZA'}`
    );
    if (it.sizeSummary) {
      lines.push(`   Tallas: ${it.sizeSummary}${it.gloveSizeSummary ? ` · Guantes: ${it.gloveSizeSummary}` : ''}`);
    }
    if (palettes.topZones?.length) {
      lines.push('   Paleta Principal (RGB / Pantone):');
      palettes.topZones.forEach((c) => {
        lines.push(`     • ${c.zone}: ${c.pantone} · ${c.rgb} · ${c.hex}`);
      });
    }
    if (palettes.bottomZones?.length) {
      lines.push(`   Paleta ${palettes.bottomTitle || 'Short Coordinado'}:`);
      palettes.bottomZones.forEach((c) => {
        lines.push(`     • ${c.zone}: ${c.pantone} · ${c.rgb} · ${c.hex}`);
      });
    }
    if (it.goalkeeperSpec || palettes.goalkeeperZones?.length) {
      lines.push(
        `   Portero Manga Larga (${it.goalkeeperSpec?.keeperUnits || 1} uds):`
      );
      (palettes.goalkeeperZones || []).forEach((c) => {
        lines.push(`     • ${c.zone}: ${c.pantone} · ${c.rgb} · ${c.hex}`);
      });
    }
    if (it.glovesSpec) {
      lines.push(
        `   Guantes Portero 3D (${it.glovesSpec.glovePairs} pares): ${formatGloveCutLabel(it.glovesSpec.gloveCut)}`
      );
      (palettes.glovesZones || []).forEach((c) => {
        lines.push(`     • ${c.zone}: ${c.pantone} · ${c.rgb} · ${c.hex}`);
      });
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

function renderColorPaletteTableHtml(title, zones = []) {
  if (!zones || zones.length === 0) return '';
  const rows = zones
    .map(
      (z) => `
      <tr>
        <td><span class="swatch" style="background:${escapeHtml(z.hex)}"></span></td>
        <td><strong>${escapeHtml(z.zone)}</strong><div class="sub">${escapeHtml(z.name || '')}</div></td>
        <td><strong>${escapeHtml(z.pantone)}</strong><div class="sub">${escapeHtml(z.paletteSource || 'Paleta Pantone®')}</div></td>
        <td class="mono">${escapeHtml(z.rgb)}<div class="sub">${escapeHtml(z.cmyk || '')}</div></td>
        <td class="mono"><strong>${escapeHtml(z.hex)}</strong></td>
      </tr>`
    )
    .join('');

  return `
    <div class="palette-block">
      <h4>${escapeHtml(title)}</h4>
      <table class="palette-table">
        <thead>
          <tr>
            <th>Muestra</th>
            <th>Zona de Prenda</th>
            <th>Paleta / Pantone®</th>
            <th>Perfil RGB / CMYK</th>
            <th>HEX</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

export function buildFactoryOrderSheetHtml(order) {
  if (!order) return '';
  const itemsList = order.snapshotItems || [];
  const firstItem = itemsList[0];
  const renderImgSrc =
    order.renderImageUrl ||
    renderFallbackKitThumbnail({
      title: `Folio ${order.folio || 'ARZA'}`,
      productName: firstItem?.product?.name || 'Equipación ARZA SPORT',
      patternName: firstItem?.design?.pattern || 'Personalizado',
      colors: [
        firstItem?.design?.baseColor || '#111111',
        firstItem?.design?.sleeveColor || '#fa5400',
        firstItem?.design?.accentColor || '#ffffff',
      ],
    });

  const itemsHtml = itemsList
    .map((it, idx) => {
      const palettes = getFallbackColorSpecsForItem(it);
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
            <div><span>Desglose Tallas</span><strong>${escapeHtml(it.sizeSummary || `${it.totalUnits || 1} uds`)}${it.gloveSizeSummary ? ` · Guantes ${escapeHtml(it.gloveSizeSummary)}` : ''}</strong></div>
          </div>

          ${renderColorPaletteTableHtml(
            `Paleta de Colores — ${palettes.topTitle || it.product?.name || 'Uniforme Principal'}`,
            palettes.topZones
          )}
          ${
            palettes.bottomZones?.length
              ? renderColorPaletteTableHtml(
                  `Paleta Coordinada — ${palettes.bottomTitle || 'Short'}`,
                  palettes.bottomZones
                )
              : ''
          }
          ${
            palettes.goalkeeperZones?.length
              ? renderColorPaletteTableHtml(
                  `Paleta Portero Manga Larga (${it.goalkeeperSpec?.keeperUnits || 1} uds)`,
                  palettes.goalkeeperZones
                )
              : ''
          }
          ${
            palettes.glovesZones?.length
              ? renderColorPaletteTableHtml(
                  `Paleta Guantes Pro 3D (${it.glovesSpec?.glovePairs || 1} pares)`,
                  palettes.glovesZones
                )
              : ''
          }

          ${
            rosterRows
              ? `<div class="roster-block"><h4>Lista de Prendas y Tallas (${escapeHtml(it.totalUnits || it.roster?.length || 1)} uds)</h4><table><thead><tr><th>Dorsal</th><th>Nombre</th><th>Rol</th><th>Corte</th><th>Talla</th><th>Guante</th><th>Cant.</th></tr></thead><tbody>${rosterRows}</tbody></table></div>`
              : ''
          }
        </section>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Ficha Técnica ${escapeHtml(order.folio)} — ARZA SPORT</title>
  <style>
    *{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box}
    body{font-family:Inter,system-ui,sans-serif;color:#111;background:#f4f4f5;margin:0;padding:24px}
    .sheet{max-width:960px;margin:0 auto;background:#fff;padding:28px;border:1px solid #e4e4e7}
    .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:14px;margin-bottom:18px}
    .brand{font-weight:900;font-size:21px;letter-spacing:.04em}
    .brand span{color:#fa5400}
    .meta{text-align:right;font-size:12px}
    .folio{font-family:monospace;font-size:16px;font-weight:900;color:#065f46}
    .hero-grid{display:grid;grid-template-columns:280px 1fr;gap:18px;margin-bottom:20px;align-items:stretch}
    .render-box{background:#f8fafc;border:1px solid #e2e8f0;padding:10px;display:flex;flex-direction:column;justify-content:center;align-items:center}
    .render-box img{width:100%;max-height:290px;object-fit:contain;display:block}
    .render-cap{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#475569;font-weight:800;margin-top:8px}
    .info-panel{display:flex;flex-direction:column;gap:10px;justify-content:space-between;background:#f8fafc;padding:16px;border:1px solid #e2e8f0;font-size:13px}
    .info-block{border-bottom:1px solid #e2e8f0;padding-bottom:10px}
    .info-block:last-child{border-bottom:none;padding-bottom:0}
    .card{border:1px solid #e2e8f0;padding:18px;margin-bottom:18px;page-break-inside:avoid}
    .card-head{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px}
    .card-head h2{margin:0;font-size:16px}
    .muted{color:#64748b;font-size:12px;margin:4px 0 0}
    .price{font-weight:900;font-size:16px;white-space:nowrap}
    .specs{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;border-top:1px solid #eee;border-bottom:1px solid #eee;padding:10px 0;font-size:12px}
    .specs span{display:block;color:#64748b;font-size:10px;text-transform:uppercase;font-weight:700}
    .palette-block,.roster-block{margin-top:14px}
    h4{margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#334155}
    .swatch{display:inline-block;width:24px;height:24px;border-radius:6px;border:1px solid rgba(0,0,0,0.2)}
    .sub{font-size:10px;color:#64748b;margin-top:2px}
    .mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left;vertical-align:middle}
    th{background:#f1f5f9;font-size:10px;text-transform:uppercase;letter-spacing:.05em}
    .foot{margin-top:20px;display:flex;justify-content:space-between;align-items:center;font-size:12px;border-top:2px solid #111;padding-top:12px;gap:16px}
    @media(max-width:720px){.hero-grid{grid-template-columns:1fr}.specs{grid-template-columns:repeat(2,1fr)}}
    @media print{body{background:#fff;padding:0}.sheet{border:none;padding:0}}
  </style>
</head>
<body>
  <div class="sheet">
    <div class="top">
      <div>
        <div class="brand">ARZA <span>SPORT</span> · Ficha Técnica de Producción</div>
        <div class="muted">Grupo Zava · ${escapeHtml(ARZA_CONTACT.email)} · ${escapeHtml(ARZA_CONTACT.phoneDisplay)}</div>
      </div>
      <div class="meta">
        <div class="folio">${escapeHtml(order.folio)}</div>
        <div>${escapeHtml(order.createdAtLabel || '')}</div>
        <div><strong>${escapeHtml(order.statusLabel || 'Recibido · Taller')}</strong></div>
      </div>
    </div>

    <div class="hero-grid">
      <div class="render-box">
        ${
          renderImgSrc
            ? `<img src="${escapeHtml(renderImgSrc)}" alt="Render 3D Finalizado ARZA SPORT" />`
            : '<div class="muted">Render 3D pendiente</div>'
        }
        <span class="render-cap">Fotografía del Render Finalizado</span>
      </div>
      <div class="info-panel">
        <div class="info-block">
          <strong>Cliente y Envío</strong><br/>
          ${escapeHtml(order.customerName || 'Club ARZA')}<br/>
          Tel: ${escapeHtml(order.phone || 'Por confirmar')}<br/>
          Correo: ${escapeHtml(order.email || '')}<br/>
          ${escapeHtml(order.shippingAddress || 'Dirección por confirmar')}${order.shippingCity ? `, ${escapeHtml(order.shippingCity)}` : ''}${order.shippingZip ? ` CP ${escapeHtml(order.shippingZip)}` : ''}
        </div>
        <div class="info-block">
          <strong>Pago y Tiempos de Confección</strong><br/>
          Método: ${escapeHtml(order.methodLabel || 'Confirmado')}<br/>
          Plan: ${escapeHtml(order.installmentsLabel || '1 exhibición')}<br/>
          Tiempo estimado de entrega: ${escapeHtml(ARZA_CONTACT.leadTime)}
        </div>
        <div class="info-block">
          <strong>Resumen Global</strong><br/>
          Total piezas: <strong>${escapeHtml(order.units || 0)}</strong> · Importe: <strong>$${escapeHtml(order.totalOrder || order.amountPaid || '0.00')} USD</strong>
        </div>
      </div>
    </div>

    ${itemsHtml}

    <div class="foot">
      <span>Referencia de sublimación 210°C: utilizar perfiles Pantone® Solid Coated o coordenadas RGB indicadas por zona en esta ficha técnica.</span>
      <strong>Total (${escapeHtml(order.units || 0)} uds): $${escapeHtml(order.totalOrder || order.amountPaid || '0.00')} USD</strong>
    </div>
  </div>
</body>
</html>`;
}

export function downloadFactoryOrderSheetHtml(order) {
  if (typeof document === 'undefined' || !order) return;
  const html = buildFactoryOrderSheetHtml(order);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ARZA_${order.folio}_Ficha_Tecnica.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function openPrintableFactorySheet(order) {
  if (typeof window === 'undefined' || !order) return;
  const html = buildFactoryOrderSheetHtml(order);
  const win = window.open('', '_blank', 'noopener');
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      try {
        win.print();
      } catch {}
    }, 350);
  } else {
    downloadFactoryOrderSheetHtml(order);
  }
}
