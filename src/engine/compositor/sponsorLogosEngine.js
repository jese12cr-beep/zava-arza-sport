/**
 * ATLETIQ Engine — Official Sponsor Logos Vector Engine
 * Renderiza los logotipos publicitarios oficiales en alta definición vectorial
 * tanto para los clubes de la Liga MX como para los clubes de la UEFA Champions League.
 *
 * Coordenadas milimétricas exactas centradas en (0, 0), escalables sin pérdida.
 */

import { resolveAssetUrl } from '../../utils/assetUrl';

// Cache global de logotipos publicitarios en alta resolución
const SPONSOR_IMAGE_CACHE = {};
const TINT_CANVAS_CACHE = new Map();
const OUTLINE_CANVAS_CACHE = new Map();

function getTintedSponsorDrawable(img, tintHex) {
  if (!tintHex || typeof document === 'undefined') return img;
  const cleanTint = tintHex.toLowerCase().trim();
  const key = `${img.src}|${cleanTint}`;
  if (TINT_CANVAS_CACHE.has(key)) return TINT_CANVAS_CACHE.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || 1200;
  canvas.height = img.naturalHeight || 400;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = cleanTint;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  TINT_CANVAS_CACHE.set(key, canvas);
  return canvas;
}

function getOutlinedSponsorDrawable(sourceDrawable, cacheKeyBase, outlineHex) {
  if (!outlineHex || typeof document === 'undefined') {
    return { drawable: sourceDrawable, padRatioX: 0, padRatioY: 0 };
  }
  const cleanOutline = String(outlineHex).toLowerCase().trim();
  const fullKey = `${cacheKeyBase}|outline:${cleanOutline}`;
  if (OUTLINE_CANVAS_CACHE.has(fullKey)) return OUTLINE_CANVAS_CACHE.get(fullKey);

  const srcW = sourceDrawable.naturalWidth || sourceDrawable.width || 1200;
  const srcH = sourceDrawable.naturalHeight || sourceDrawable.height || 400;
  const strokePx = Math.max(4, Math.round(srcH * 0.028));
  const pad = strokePx + 4;

  // Silueta sólida del logotipo en outlineHex
  const sil = document.createElement('canvas');
  sil.width = srcW;
  sil.height = srcH;
  const sctx = sil.getContext('2d');
  sctx.drawImage(sourceDrawable, 0, 0, srcW, srcH);
  sctx.globalCompositeOperation = 'source-in';
  sctx.fillStyle = cleanOutline;
  sctx.fillRect(0, 0, srcW, srcH);

  // Canvas compuesto con borde uniforme en 16 direcciones (+ anillo intermedio)
  const out = document.createElement('canvas');
  out.width = srcW + pad * 2;
  out.height = srcH + pad * 2;
  const octx = out.getContext('2d');

  const steps = 16;
  for (const r of [strokePx * 0.55, strokePx]) {
    for (let i = 0; i < steps; i++) {
      const ang = (Math.PI * 2 * i) / steps;
      octx.drawImage(sil, pad + Math.cos(ang) * r, pad + Math.sin(ang) * r);
    }
  }
  octx.drawImage(sourceDrawable, pad, pad, srcW, srcH);

  const entry = {
    drawable: out,
    padRatioX: pad / srcW,
    padRatioY: pad / srcH,
  };
  OUTLINE_CANVAS_CACHE.set(fullKey, entry);
  return entry;
}

/**
 * Helper aislado para operaciones destination-out (calados internos) sin perforar
 * las franjas/colores subyacentes de la camiseta.
 */
function drawWithHolePunch(targetCtx, wMm, hMm, drawFn) {
  if (typeof document === 'undefined') {
    drawFn(targetCtx);
    return;
  }
  const scale = 3.2;
  const padMm = 24;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(32, Math.ceil((wMm + padMm * 2) * scale));
  canvas.height = Math.max(32, Math.ceil((hMm + padMm * 2) * scale));
  const sctx = canvas.getContext('2d');
  sctx.translate(canvas.width / 2, canvas.height / 2);
  sctx.scale(scale, scale);
  drawFn(sctx);
  targetCtx.drawImage(
    canvas,
    -wMm / 2 - padMm,
    -hMm / 2 - padMm,
    wMm + padMm * 2,
    hMm + padMm * 2
  );
}

/**
 * Ajusta el fontSize horizontalmente si el texto excede maxWidthMm.
 */
function fitFontMm(ctx, fontPrefix, desiredMm, text, maxWidthMm) {
  let fs = desiredMm;
  ctx.font = `${fontPrefix} ${fs}px`;
  const m = ctx.measureText(text).width;
  if (m > maxWidthMm && m > 0) {
    fs = fs * (maxWidthMm / m);
  }
  return fs;
}

export function getOrLoadSponsorImage(sponsorId, tintHex = null) {
  if (typeof window === 'undefined') return null;
  if (!sponsorId) return null;

  const cleanId = String(sponsorId).toLowerCase().trim();
  const needsTint = Boolean(tintHex);
  const cacheKey = `${cleanId}_${needsTint ? 'tinted' : 'color'}`;

  if (SPONSOR_IMAGE_CACHE[cacheKey]) return SPONSOR_IMAGE_CACHE[cacheKey];

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.dataset.loaded = 'false';
  img.onload = () => {
    img.dataset.loaded = 'true';
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('atletiq:sponsor-loaded', { detail: { sponsorId: cleanId } }));
    }
  };
  img.onerror = () => {
    img.dataset.failed = 'true';
  };

  const filename = needsTint ? `${cleanId}_white.png` : `${cleanId}.png`;
  img.src = resolveAssetUrl(`assets/sponsors/${filename}`);
  SPONSOR_IMAGE_CACHE[cacheKey] = img;
  return img;
}

export function preloadSponsorLogo(sponsorId, tintHex = null) {
  return new Promise((resolve) => {
    const img = getOrLoadSponsorImage(sponsorId, tintHex);
    if (!img) return resolve(null);
    if (img.dataset?.loaded === 'true' || (img.complete && img.naturalWidth > 0)) {
      img.dataset.loaded = 'true';
      return resolve(img);
    }
    img.addEventListener('load', () => {
      img.dataset.loaded = 'true';
      resolve(img);
    }, { once: true });
    img.addEventListener('error', () => resolve(null), { once: true });
  });
}

export function drawSponsorLogoMm(ctx, sponsorId, wMm, hMm, tintHex = null, outlineHex = null) {
  if (!ctx || !sponsorId) return;

  const halfW = wMm / 2;
  const halfH = hMm / 2;

  ctx.save();

  // 1. Intentar renderizar el logotipo oficial en alta resolución si está cargado
  const sponsorImg = getOrLoadSponsorImage(sponsorId, tintHex);
  if (sponsorImg && sponsorImg.dataset?.loaded === 'true') {
    const baseDrawable = tintHex ? getTintedSponsorDrawable(sponsorImg, tintHex) : sponsorImg;
    const cacheKeyBase = `${sponsorImg.src}|${(tintHex || 'color').toLowerCase()}`;
    const { drawable, padRatioX, padRatioY } = getOutlinedSponsorDrawable(
      baseDrawable,
      cacheKeyBase,
      outlineHex
    );

    const imgW = sponsorImg.naturalWidth || 1200;
    const imgH = sponsorImg.naturalHeight || 400;
    const imgAspect = imgW / imgH;
    const boxAspect = wMm / hMm;
    let drawW = wMm;
    let drawH = hMm;
    if (imgAspect > boxAspect) {
      drawW = wMm;
      drawH = wMm / imgAspect;
    } else {
      drawH = hMm;
      drawW = hMm * imgAspect;
    }
    const padX = drawW * padRatioX;
    const padY = drawH * padRatioY;
    ctx.drawImage(drawable, -drawW / 2 - padX, -drawH / 2 - padY, drawW + padX * 2, drawH + padY * 2);
    ctx.restore();
    return;
  }

  // Fallback vectorial / generación maestro PNG
  if (outlineHex && !tintHex) {
    ctx.shadowColor = outlineHex;
    ctx.shadowBlur = Math.max(2, hMm * 0.05);
  }

  switch (sponsorId.toLowerCase()) {
    // =========================================================================
    // LIGA MX: CALIENTE.MX (América, Chivas, Atlas, Puebla, Xolos, Querétaro, Mazatlán)
    // =========================================================================
    case 'caliente':
    case 'caliente_mx': {
      const textColor = tintHex || '#C8102E';
      const mxColor = tintHex || '#111827';
      const ballRadius = Math.min(wMm * 0.105, hMm * 0.36);

      const drawCaliente = (c) => {
        let fontMain = Math.min(hMm * 0.56, wMm * 0.16);
        let fontMx = fontMain * 0.62;
        const fontMainSuffix = `'Arial Black', sans-serif`;
        c.font = `italic 900 ${fontMain}px ${fontMainSuffix}`;
        let calW = c.measureText('Caliente').width;
        c.font = `italic 900 ${fontMx}px ${fontMainSuffix}`;
        let mxW = c.measureText('.mx').width;

        const flameTail = ballRadius * 0.9;
        const gap1 = ballRadius * 0.5;
        const gap2 = Math.max(2, wMm * 0.01);
        const maxTextRowW = wMm * 0.90;
        const rawTotalW = flameTail + ballRadius * 2 + gap1 + calW + gap2 + mxW;
        if (rawTotalW > maxTextRowW) {
          const k = maxTextRowW / rawTotalW;
          fontMain *= k;
          fontMx *= k;
          c.font = `italic 900 ${fontMain}px ${fontMainSuffix}`;
          calW = c.measureText('Caliente').width;
          c.font = `italic 900 ${fontMx}px ${fontMainSuffix}`;
          mxW = c.measureText('.mx').width;
        }

        const totalW = flameTail + ballRadius * 2 + gap1 + calW + gap2 + mxW;
        const startX = -totalW / 2;
        const ballCenterX = startX + flameTail + ballRadius;
        const ballCenterY = 0;

        // Flamas dinámicas + círculo del balón
        c.beginPath();
        c.arc(ballCenterX, ballCenterY, ballRadius, 0, Math.PI * 2);
        c.fillStyle = textColor;
        c.fill();

        c.beginPath();
        c.moveTo(ballCenterX - ballRadius * 0.35, ballCenterY - ballRadius * 0.92);
        c.quadraticCurveTo(ballCenterX - ballRadius * 1.45, ballCenterY - ballRadius * 1.15, ballCenterX - ballRadius * 0.78, ballCenterY);
        c.quadraticCurveTo(ballCenterX - ballRadius * 1.25, ballCenterY + ballRadius * 0.8, ballCenterX, ballCenterY + ballRadius * 0.98);
        c.fillStyle = textColor;
        c.fill();

        // Gajos calados (transparentes si está tintado)
        c.save();
        if (tintHex) c.globalCompositeOperation = 'destination-out';
        c.beginPath();
        c.arc(ballCenterX, ballCenterY, ballRadius * 0.62, 0, Math.PI * 2);
        c.strokeStyle = tintHex ? '#000000' : '#FFFFFF';
        c.lineWidth = Math.max(1.5, ballRadius * 0.14);
        c.stroke();
        c.restore();

        // Texto "Caliente"
        const calX = ballCenterX + ballRadius + gap1;
        c.fillStyle = textColor;
        c.font = `italic 900 ${fontMain}px ${fontMainSuffix}`;
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        c.fillText('Caliente', calX, -hMm * 0.03);

        // ".mx" alineado limpiamente sin colisión
        c.fillStyle = mxColor;
        c.font = `italic 900 ${fontMx}px ${fontMainSuffix}`;
        c.fillText('.mx', calX + calW + gap2, hMm * 0.07);
      };

      drawWithHolePunch(ctx, wMm, hMm, drawCaliente);
      break;
    }

    // =========================================================================
    // LIGA MX: CEMENTO CRUZ AZUL (Cruz Azul)
    // =========================================================================
    case 'cruz_azul':
    case 'cemento_cruz_azul': {
      const boxSize = Math.min(hMm * 0.84, wMm * 0.25);
      const textColor = tintHex || '#00509D';

      const drawCruzAzul = (c) => {
        let fontSz = Math.min(hMm * 0.34, wMm * 0.095);
        c.font = `900 ${fontSz}px 'Arial Black', sans-serif`;
        const w1 = c.measureText('CEMENTO').width;
        const w2 = c.measureText('CRUZ AZUL').width;
        let textW = Math.max(w1, w2);
        const gap = Math.max(8, wMm * 0.03);
        const maxW = wMm * 0.90;
        if (boxSize + gap + textW > maxW) {
          fontSz *= (maxW - boxSize - gap) / Math.max(1, textW);
          c.font = `900 ${fontSz}px 'Arial Black', sans-serif`;
          textW = Math.max(c.measureText('CEMENTO').width, c.measureText('CRUZ AZUL').width);
        }

        const totalW = boxSize + gap + textW;
        const boxX = -totalW / 2 + boxSize / 2;

        if (tintHex) {
          // Modo monocromo calado limpio
          c.fillStyle = textColor;
          c.fillRect(boxX - boxSize / 2, -boxSize / 2, boxSize, boxSize);

          c.save();
          c.globalCompositeOperation = 'destination-out';
          // Marco interno calado
          c.lineWidth = boxSize * 0.07;
          c.strokeStyle = '#000000';
          c.strokeRect(boxX - boxSize * 0.41, -boxSize * 0.41, boxSize * 0.82, boxSize * 0.82);
          // Cruz calada
          const cw = boxSize * 0.28;
          c.fillStyle = '#000000';
          c.fillRect(boxX - cw / 2, -boxSize * 0.32, cw, boxSize * 0.64);
          c.fillRect(boxX - boxSize * 0.32, -cw / 2, boxSize * 0.64, cw);
          c.restore();
        } else {
          // Emblema tricolor oficial
          c.fillStyle = '#00509D';
          c.fillRect(boxX - boxSize / 2 - 2, -boxSize / 2 - 2, boxSize + 4, boxSize + 4);
          c.fillStyle = '#FFFFFF';
          c.fillRect(boxX - boxSize / 2, -boxSize / 2, boxSize, boxSize);
          c.fillStyle = '#C8102E';
          c.fillRect(boxX - boxSize * 0.44, -boxSize * 0.44, boxSize * 0.88, boxSize * 0.88);

          const crossW = boxSize * 0.32;
          c.fillStyle = '#FFFFFF';
          c.fillRect(boxX - crossW / 2, -boxSize * 0.36, crossW, boxSize * 0.72);
          c.fillRect(boxX - boxSize * 0.36, -crossW / 2, boxSize * 0.72, crossW);

          c.fillStyle = '#00509D';
          const innerCrossW = crossW * 0.62;
          c.fillRect(boxX - innerCrossW / 2, -boxSize * 0.28, innerCrossW, boxSize * 0.56);
          c.fillRect(boxX - boxSize * 0.28, -innerCrossW / 2, boxSize * 0.56, innerCrossW);
        }

        c.fillStyle = textColor;
        c.font = `900 ${fontSz}px 'Arial Black', sans-serif`;
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        c.fillText('CEMENTO', boxX + boxSize / 2 + gap, -hMm * 0.20);
        c.fillText('CRUZ AZUL', boxX + boxSize / 2 + gap, hMm * 0.22);
      };

      drawWithHolePunch(ctx, wMm, hMm, drawCruzAzul);
      break;
    }

    // =========================================================================
    // LIGA MX: DHL (Pumas UNAM)
    // =========================================================================
    case 'dhl': {
      const drawDhl = (c) => {
        const pillW = wMm * 0.86;
        const pillH = hMm * 0.74;
        const mainCol = tintHex || '#FFCC00';
        const barH = Math.max(2, hMm * 0.045);

        c.fillStyle = mainCol;
        c.fillRect(-pillW / 2, -pillH / 2 - hMm * 0.04, pillW, pillH);

        if (tintHex) {
          c.save();
          c.globalCompositeOperation = 'destination-out';
          c.fillStyle = '#000000';
          c.font = `italic 900 ${Math.min(hMm * 0.64, wMm * 0.34)}px 'Impact', 'Arial Black', sans-serif`;
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText('DHL', 0, -hMm * 0.03);
          c.restore();

          c.fillStyle = mainCol;
          c.fillRect(-pillW / 2, halfH * 0.56, pillW, barH);
        } else {
          c.fillStyle = '#D40511';
          c.fillRect(-pillW / 2, halfH * 0.56, pillW, barH);
          c.fillRect(-pillW / 2, halfH * 0.72, pillW, barH * 0.6);

          c.fillStyle = '#D40511';
          c.font = `italic 900 ${Math.min(hMm * 0.64, wMm * 0.34)}px 'Impact', 'Arial Black', sans-serif`;
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText('DHL', 0, -hMm * 0.03);
        }
      };

      drawWithHolePunch(ctx, wMm, hMm, drawDhl);
      break;
    }

    // =========================================================================
    // LIGA MX: CEMEX (Tigres UANL)
    // =========================================================================
    case 'cemex': {
      const textColor = tintHex || '#002B7F';
      const redBar = tintHex || '#D40511';
      const blueBar = tintHex || '#003DA5';

      let fontSz = Math.min(hMm * 0.58, wMm * 0.19);
      ctx.font = `900 ${fontSz}px 'Arial Black', sans-serif`;
      let textW = ctx.measureText('CEMEX').width;
      const barW = Math.min(wMm * 0.09, hMm * 0.34);
      const barGap = barW * 0.25;
      const slant = barW * 0.38;
      const groupGap = wMm * 0.035;
      const barsSpan = barW * 2 + barGap + slant;
      const maxTotal = wMm * 0.90;

      if (barsSpan + groupGap + textW > maxTotal) {
        fontSz *= (maxTotal - barsSpan - groupGap) / Math.max(1, textW);
        ctx.font = `900 ${fontSz}px 'Arial Black', sans-serif`;
        textW = ctx.measureText('CEMEX').width;
      }

      const totalW = barsSpan + groupGap + textW;
      const startX = -totalW / 2;
      const bH = hMm * 0.36;

      // Bloque 1 rojo inclinado
      ctx.fillStyle = redBar;
      ctx.beginPath();
      ctx.moveTo(startX + slant, -bH);
      ctx.lineTo(startX + slant + barW, -bH);
      ctx.lineTo(startX + barW, bH);
      ctx.lineTo(startX, bH);
      ctx.closePath();
      ctx.fill();

      // Bloque 2 azul inclinado
      const b2X = startX + barW + barGap;
      ctx.fillStyle = blueBar;
      ctx.beginPath();
      ctx.moveTo(b2X + slant, -bH);
      ctx.lineTo(b2X + slant + barW, -bH);
      ctx.lineTo(b2X + barW, bH);
      ctx.lineTo(b2X, bH);
      ctx.closePath();
      ctx.fill();

      // Texto CEMEX completo y centrado en bloque
      ctx.fillStyle = textColor;
      ctx.font = `900 ${fontSz}px 'Arial Black', sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('CEMEX', startX + barsSpan + groupGap, hMm * 0.02);
      break;
    }

    // =========================================================================
    // LIGA MX: CODERE (Monterrey Rayados)
    // =========================================================================
    case 'codere': {
      const mainColor = tintHex || '#00C379';
      let fontSz = Math.min(hMm * 0.62, wMm * 0.22);
      ctx.letterSpacing = `${Math.round(hMm * 0.018)}px`;
      fontSz = fitFontMm(ctx, "900", fontSz, 'codere', wMm * 0.86);
      ctx.font = `900 ${fontSz}px 'Montserrat', 'Arial Black', sans-serif`;
      ctx.fillStyle = mainColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('codere', 0, -hMm * 0.06);

      ctx.beginPath();
      ctx.ellipse(0, hMm * 0.24, wMm * 0.24, hMm * 0.14, 0, Math.PI * 0.12, Math.PI * 0.88);
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = Math.max(2.5, hMm * 0.045);
      ctx.lineCap = 'round';
      ctx.stroke();
      break;
    }

    // =========================================================================
    // LIGA MX: ROSHFRANS (Toluca)
    // =========================================================================
    case 'roshfrans': {
      const mainColor = tintHex || '#C8102E';
      const strokeW = Math.max(2.5, hMm * 0.045);
      ctx.beginPath();
      ctx.ellipse(0, 0, halfW * 0.90, halfH * 0.76, 0, 0, Math.PI * 2);
      if (!tintHex) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
      }
      ctx.lineWidth = strokeW;
      ctx.strokeStyle = mainColor;
      ctx.stroke();

      let fontSz = Math.min(hMm * 0.44, wMm * 0.13);
      ctx.font = `italic 900 ${fontSz}px 'Arial Black', sans-serif`;
      const m = ctx.measureText('ROSHFRANS').width;
      if (m > wMm * 0.72) fontSz *= (wMm * 0.72) / m;

      ctx.fillStyle = mainColor;
      ctx.font = `italic 900 ${fontSz}px 'Arial Black', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ROSHFRANS', 0, hMm * 0.02);
      break;
    }

    // =========================================================================
    // LIGA MX: SORIANA (Santos Laguna)
    // =========================================================================
    case 'soriana': {
      const mainColor = tintHex || '#C8102E';
      let fontSz = Math.min(hMm * 0.56, wMm * 0.18);
      ctx.font = `900 ${fontSz}px 'Arial Black', sans-serif`;
      let textW = ctx.measureText('Soriana').width;
      const heartW = hMm * 0.48;
      const gap = Math.max(5, hMm * 0.10);
      if (heartW + gap + textW > wMm * 0.90) {
        fontSz *= (wMm * 0.90 - heartW - gap) / Math.max(1, textW);
        ctx.font = `900 ${fontSz}px 'Arial Black', sans-serif`;
        textW = ctx.measureText('Soriana').width;
      }

      const startX = -(heartW + gap + textW) / 2;
      const heartX = startX + heartW / 2;
      const hs = heartW * 0.5;
      ctx.fillStyle = mainColor;
      ctx.beginPath();
      ctx.moveTo(heartX, -hs * 0.35);
      ctx.bezierCurveTo(heartX - hs * 0.7, -hs * 1.15, heartX - hs * 1.5, -hs * 0.1, heartX, hs * 0.95);
      ctx.bezierCurveTo(heartX + hs * 1.5, -hs * 0.1, heartX + hs * 0.7, -hs * 1.15, heartX, -hs * 0.35);
      ctx.fill();

      ctx.fillStyle = mainColor;
      ctx.font = `900 ${fontSz}px 'Arial Black', sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Soriana', startX + heartW + gap, hMm * 0.02);
      break;
    }

    // =========================================================================
    // LIGA MX: TELCEL (León, Pachuca)
    // =========================================================================
    case 'telcel': {
      const mainColor = tintHex || '#002B7F';
      ctx.fillStyle = mainColor;
      let fontSz = Math.min(hMm * 0.68, wMm * 0.24);
      ctx.font = `900 ${fontSz}px 'Arial Black', sans-serif`;
      const m = ctx.measureText('telcel').width;
      if (m > wMm * 0.88) fontSz *= (wMm * 0.88) / m;
      ctx.font = `900 ${fontSz}px 'Arial Black', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('telcel', 0, 0);
      break;
    }

    // =========================================================================
    // LIGA MX: CEMENTOS FORTALEZA (León, Pachuca)
    // =========================================================================
    case 'fortaleza':
    case 'cementos_fortaleza': {
      const drawFortaleza = (c) => {
        const boxW = wMm * 0.86;
        const barH = hMm * 0.40;
        const topY = -hMm * 0.44;
        const botY = hMm * 0.04;
        const fontSz = Math.min(hMm * 0.25, wMm * 0.105);

        if (tintHex) {
          c.fillStyle = tintHex;
          c.fillRect(-boxW / 2, topY, boxW, barH);
          c.fillRect(-boxW / 2, botY, boxW, barH);

          c.save();
          c.globalCompositeOperation = 'destination-out';
          c.fillStyle = '#000000';
          c.font = `900 ${fontSz}px 'Arial Black', sans-serif`;
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText('CEMENTOS', 0, topY + barH / 2 + hMm * 0.01);
          c.fillText('FORTALEZA', 0, botY + barH / 2 + hMm * 0.01);
          c.restore();
        } else {
          c.fillStyle = '#002B7F';
          c.fillRect(-boxW / 2, topY, boxW, barH);
          c.fillStyle = '#C8102E';
          c.fillRect(-boxW / 2, botY, boxW, barH);

          c.fillStyle = '#FFFFFF';
          c.font = `900 ${fontSz}px 'Arial Black', sans-serif`;
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText('CEMENTOS', 0, topY + barH / 2 + hMm * 0.01);
          c.fillText('FORTALEZA', 0, botY + barH / 2 + hMm * 0.01);
        }
      };

      drawWithHolePunch(ctx, wMm, hMm, drawFortaleza);
      break;
    }

    // =========================================================================
    // LIGA MX: ROLCAR (Necaxa)
    // =========================================================================
    case 'rolcar': {
      const mainColor = tintHex || '#C8102E';
      let fontSz = Math.min(hMm * 0.68, wMm * 0.24);
      ctx.font = `italic 900 ${fontSz}px 'Arial Black', sans-serif`;
      const m = ctx.measureText('ROLCAR').width;
      if (m > wMm * 0.88) fontSz *= (wMm * 0.88) / m;
      ctx.fillStyle = mainColor;
      ctx.font = `italic 900 ${fontSz}px 'Arial Black', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ROLCAR', 0, 0);
      break;
    }

    // =========================================================================
    // LIGA MX: PEDIGREE (Querétaro)
    // =========================================================================
    case 'pedigree': {
      const drawPedigree = (c) => {
        const bw = wMm * 0.84;
        const bh = hMm * 0.72;
        let fontSz = Math.min(hMm * 0.48, wMm * 0.18);
        c.font = `italic 900 ${fontSz}px 'Arial Black', sans-serif`;
        const m = c.measureText('Pedigree').width;
        if (m > bw * 0.82) fontSz *= (bw * 0.82) / m;

        if (tintHex) {
          c.beginPath();
          c.roundRect(-bw / 2, -bh / 2, bw, bh, Math.max(4, bh * 0.18));
          c.fillStyle = tintHex;
          c.fill();

          c.save();
          c.globalCompositeOperation = 'destination-out';
          c.fillStyle = '#000000';
          c.font = `italic 900 ${fontSz}px 'Arial Black', sans-serif`;
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText('Pedigree', 0, hMm * 0.02);
          c.restore();
        } else {
          c.beginPath();
          c.roundRect(-bw / 2, -bh / 2, bw, bh, Math.max(4, bh * 0.18));
          c.fillStyle = '#FFC72C';
          c.fill();
          c.lineWidth = Math.max(2, hMm * 0.035);
          c.strokeStyle = '#D40511';
          c.stroke();

          c.fillStyle = '#002B7F';
          c.font = `italic 900 ${fontSz}px 'Arial Black', sans-serif`;
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText('Pedigree', 0, hMm * 0.02);
        }
      };

      drawWithHolePunch(ctx, wMm, hMm, drawPedigree);
      break;
    }

    // =========================================================================
    // LIGA MX: CANEL'S (Atlético de San Luis)
    // =========================================================================
    case 'canels': {
      const drawCanels = (c) => {
        const rx = halfW * 0.86;
        const ry = halfH * 0.70;
        let fontSz = Math.min(hMm * 0.48, wMm * 0.18);
        c.font = `italic 900 ${fontSz}px 'Arial Black', sans-serif`;
        const m = c.measureText("Canel's").width;
        if (m > rx * 1.48) fontSz *= (rx * 1.48) / m;

        if (tintHex) {
          c.beginPath();
          c.ellipse(0, 0, rx, ry, -0.04, 0, Math.PI * 2);
          c.fillStyle = tintHex;
          c.fill();

          c.save();
          c.globalCompositeOperation = 'destination-out';
          c.lineWidth = Math.max(2, hMm * 0.032);
          c.strokeStyle = '#000000';
          c.beginPath();
          c.ellipse(0, 0, rx * 0.90, ry * 0.84, -0.04, 0, Math.PI * 2);
          c.stroke();

          c.fillStyle = '#000000';
          c.font = `italic 900 ${fontSz}px 'Arial Black', sans-serif`;
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText("Canel's", 0, hMm * 0.02);
          c.restore();
        } else {
          c.beginPath();
          c.ellipse(0, 0, rx, ry, -0.04, 0, Math.PI * 2);
          c.fillStyle = '#C8102E';
          c.fill();
          c.lineWidth = Math.max(2.5, hMm * 0.04);
          c.strokeStyle = '#FFFFFF';
          c.stroke();

          c.fillStyle = '#FFFFFF';
          c.font = `italic 900 ${fontSz}px 'Arial Black', sans-serif`;
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText("Canel's", 0, hMm * 0.02);
        }
      };

      drawWithHolePunch(ctx, wMm, hMm, drawCanels);
      break;
    }

    // =========================================================================
    // LIGA MX: BETCRIS (FC Juárez)
    // =========================================================================
    case 'betcris': {
      const textColor = tintHex || '#FFFFFF';
      let fontSz = Math.min(hMm * 0.64, wMm * 0.22);
      ctx.font = `900 ${fontSz}px 'Montserrat', 'Arial Black', sans-serif`;
      const m = ctx.measureText('betcris').width;
      if (m > wMm * 0.88) fontSz *= (wMm * 0.88) / m;
      ctx.fillStyle = textColor;
      ctx.font = `900 ${fontSz}px 'Montserrat', 'Arial Black', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('betcris', 0, 0);
      break;
    }

    // =========================================================================
    // UCL: EMIRATES FLY BETTER (Real Madrid, Arsenal, AC Milan)
    // =========================================================================
    case 'fly_emirates':
    case 'emirates': {
      const textColor = tintHex || '#FFFFFF';
      ctx.fillStyle = textColor;
      let fontEm = Math.min(hMm * 0.46, wMm * 0.16);
      ctx.letterSpacing = `${Math.round(hMm * 0.015)}px`;
      ctx.font = `bold ${fontEm}px 'Georgia', 'Times New Roman', serif`;
      const m1 = ctx.measureText('Emirates').width;
      if (m1 > wMm * 0.86) fontEm *= (wMm * 0.86) / m1;
      ctx.font = `bold ${fontEm}px 'Georgia', 'Times New Roman', serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Emirates', 0, -hMm * 0.22);

      let fontFly = Math.min(hMm * 0.27, wMm * 0.10);
      ctx.letterSpacing = `${Math.round(hMm * 0.04)}px`;
      ctx.font = `900 ${fontFly}px 'Arial Black', sans-serif`;
      const m2 = ctx.measureText('FLY BETTER').width;
      if (m2 > wMm * 0.86) fontFly *= (wMm * 0.86) / m2;
      ctx.font = `900 ${fontFly}px 'Arial Black', sans-serif`;
      ctx.fillText('FLY BETTER', 0, hMm * 0.26);
      break;
    }

    // =========================================================================
    // UCL: SPOTIFY (FC Barcelona)
    // =========================================================================
    case 'spotify': {
      const textColor = tintHex || '#1DB954';
      const circleR = Math.min(wMm * 0.10, hMm * 0.36);

      const drawSpotify = (c) => {
        let fontSz = Math.min(hMm * 0.56, wMm * 0.19);
        c.font = `900 ${fontSz}px 'Montserrat', 'Arial Black', sans-serif`;
        let textW = c.measureText('Spotify').width;
        const gap = Math.max(6, circleR * 0.34);
        if (circleR * 2 + gap + textW > wMm * 0.90) {
          fontSz *= (wMm * 0.90 - circleR * 2 - gap) / Math.max(1, textW);
          c.font = `900 ${fontSz}px 'Montserrat', 'Arial Black', sans-serif`;
          textW = c.measureText('Spotify').width;
        }

        const totalW = circleR * 2 + gap + textW;
        const circleX = -totalW / 2 + circleR;

        // Disco Spotify
        c.beginPath();
        c.arc(circleX, 0, circleR, 0, Math.PI * 2);
        c.fillStyle = textColor;
        c.fill();

        // Tres ondas sonoras SIEMPRE caladas con destination-out (para color y tinta blanca)
        c.save();
        c.globalCompositeOperation = 'destination-out';
        c.strokeStyle = '#000000';
        c.lineCap = 'round';
        [-circleR * 0.28, -circleR * 0.02, circleR * 0.22].forEach((offsetY, idx) => {
          const arcR = circleR * (0.95 - idx * 0.16);
          c.lineWidth = Math.max(1.8, circleR * (0.14 - idx * 0.015));
          c.beginPath();
          c.arc(circleX - circleR * 0.04, offsetY + arcR * 0.82, arcR, Math.PI * 1.30, Math.PI * 1.78);
          c.stroke();
        });
        c.restore();

        // Texto "Spotify"
        c.fillStyle = textColor;
        c.font = `900 ${fontSz}px 'Montserrat', 'Arial Black', sans-serif`;
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        c.fillText('Spotify', circleX + circleR + gap, hMm * 0.02);
      };

      drawWithHolePunch(ctx, wMm, hMm, drawSpotify);
      break;
    }

    // =========================================================================
    // UCL: ETIHAD AIRWAYS (Manchester City)
    // =========================================================================
    case 'etihad':
    case 'etihad_airways': {
      const textColor = tintHex || '#001A49';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Árabe decorativo superior (escala proporcional)
      ctx.letterSpacing = `${Math.round(hMm * 0.015)}px`;
      ctx.font = `bold ${Math.min(hMm * 0.24, wMm * 0.09)}px sans-serif`;
      ctx.fillText('الاتحاد', 0, -hMm * 0.34);

      // ETIHAD
      let fontMain = Math.min(hMm * 0.44, wMm * 0.16);
      ctx.letterSpacing = `${Math.round(hMm * 0.045)}px`;
      ctx.font = `900 ${fontMain}px 'Arial Black', sans-serif`;
      const m = ctx.measureText('ETIHAD').width;
      if (m > wMm * 0.88) fontMain *= (wMm * 0.88) / m;
      ctx.font = `900 ${fontMain}px 'Arial Black', sans-serif`;
      ctx.fillText('ETIHAD', 0, hMm * 0.01);

      // AIRWAYS
      ctx.letterSpacing = `${Math.round(hMm * 0.06)}px`;
      ctx.font = `bold ${Math.min(hMm * 0.20, wMm * 0.08)}px 'Arial Black', sans-serif`;
      ctx.fillText('AIRWAYS', 0, hMm * 0.36);
      break;
    }

    // =========================================================================
    // UCL: TELEKOM · T ··· (Bayern Múnich)
    // =========================================================================
    case 'telekom':
    case 't_mobile': {
      const textColor = tintHex || '#FFFFFF';
      ctx.fillStyle = textColor;
      const dotSize = Math.min(wMm * 0.045, hMm * 0.15);
      const tHeight = Math.min(hMm * 0.78, wMm * 0.28);
      const tWidthApprox = tHeight * 0.65;
      const spacing = dotSize * 1.65;

      // Centrar todo el conjunto [·] [T] [· · ·]
      const span = dotSize + spacing + tWidthApprox + spacing + dotSize * 3 + spacing * 2;
      const leftX = -span / 2;

      ctx.fillRect(leftX, -dotSize / 2, dotSize, dotSize);

      const tX = leftX + dotSize + spacing + tWidthApprox / 2;
      ctx.font = `900 ${tHeight}px 'Arial Black', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('T', tX, hMm * 0.02);

      const rStart = tX + tWidthApprox / 2 + spacing;
      for (let p = 0; p < 3; p++) {
        ctx.fillRect(rStart + p * (dotSize + spacing * 0.65), -dotSize / 2, dotSize, dotSize);
      }
      break;
    }

    // =========================================================================
    // UCL: QATAR AIRWAYS (Paris Saint-Germain)
    // =========================================================================
    case 'qatar':
    case 'qatar_airways': {
      const textColor = tintHex || '#FFFFFF';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let fontQ = Math.min(hMm * 0.48, wMm * 0.17);
      ctx.letterSpacing = `${Math.round(hMm * 0.03)}px`;
      ctx.font = `900 ${fontQ}px 'Arial Black', sans-serif`;
      const m1 = ctx.measureText('QATAR').width;
      if (m1 > wMm * 0.88) fontQ *= (wMm * 0.88) / m1;
      ctx.font = `900 ${fontQ}px 'Arial Black', sans-serif`;
      ctx.fillText('QATAR', 0, -hMm * 0.20);

      let fontA = Math.min(hMm * 0.24, wMm * 0.09);
      ctx.letterSpacing = `${Math.round(hMm * 0.05)}px`;
      ctx.font = `bold ${fontA}px 'Arial Black', sans-serif`;
      const m2 = ctx.measureText('AIRWAYS').width;
      if (m2 > wMm * 0.88) fontA *= (wMm * 0.88) / m2;
      ctx.font = `bold ${fontA}px 'Arial Black', sans-serif`;
      ctx.fillText('AIRWAYS', 0, hMm * 0.27);
      break;
    }

    // =========================================================================
    // UCL: STANDARD CHARTERED (Liverpool FC)
    // =========================================================================
    case 'standard_chartered': {
      const textColor = tintHex || '#FFFFFF';
      const markR = Math.min(hMm * 0.36, wMm * 0.11);
      let fontSz = Math.min(hMm * 0.38, wMm * 0.125);
      ctx.font = `900 ${fontSz}px 'Montserrat', 'Arial Black', sans-serif`;
      let textW = Math.max(ctx.measureText('Standard').width, ctx.measureText('Chartered').width);
      const gap = Math.max(6, markR * 0.45);
      const markSpan = markR * 1.6;
      if (markSpan + gap + textW > wMm * 0.90) {
        fontSz *= (wMm * 0.90 - markSpan - gap) / Math.max(1, textW);
        ctx.font = `900 ${fontSz}px 'Montserrat', 'Arial Black', sans-serif`;
        textW = Math.max(ctx.measureText('Standard').width, ctx.measureText('Chartered').width);
      }

      const totalW = markSpan + gap + textW;
      const logoX = -totalW / 2 + markSpan / 2;

      // Doble lazo icónico Standard Chartered escalado al tamaño mm
      ctx.strokeStyle = textColor;
      ctx.lineWidth = Math.max(2.2, hMm * 0.055);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(logoX - markSpan * 0.45, -hMm * 0.28);
      ctx.bezierCurveTo(
        logoX + markSpan * 0.55,
        -hMm * 0.36,
        logoX - markSpan * 0.55,
        hMm * 0.36,
        logoX + markSpan * 0.45,
        hMm * 0.28
      );
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(logoX + markSpan * 0.45, -hMm * 0.22);
      ctx.bezierCurveTo(
        logoX - markSpan * 0.45,
        -hMm * 0.08,
        logoX + markSpan * 0.45,
        hMm * 0.08,
        logoX - markSpan * 0.45,
        hMm * 0.22
      );
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = `900 ${fontSz}px 'Montserrat', 'Arial Black', sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Standard', logoX + markSpan / 2 + gap, -hMm * 0.20);
      ctx.fillText('Chartered', logoX + markSpan / 2 + gap, hMm * 0.22);
      break;
    }

    // =========================================================================
    // UCL: BETSSON SPORT (Inter de Milán)
    // =========================================================================
    case 'betsson':
    case 'betsson_sport': {
      const textColor = tintHex || '#FFFFFF';
      let fontSz = Math.min(hMm * 0.48, wMm * 0.13);
      ctx.font = `900 ${fontSz}px 'Arial Black', sans-serif`;
      const m = ctx.measureText('betsson.sport').width;
      if (m > wMm * 0.90) fontSz *= (wMm * 0.90) / m;
      ctx.fillStyle = textColor;
      ctx.font = `900 ${fontSz}px 'Arial Black', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('betsson.sport', 0, 0);
      break;
    }

    // =========================================================================
    // UCL: JEEP (Juventus)
    // =========================================================================
    case 'jeep': {
      const textColor = tintHex || '#000000';
      let fontSz = Math.min(hMm * 0.74, wMm * 0.26);
      ctx.letterSpacing = `${Math.round(hMm * 0.02)}px`;
      ctx.font = `900 ${fontSz}px 'Arial Black', sans-serif`;
      const m = ctx.measureText('Jeep').width;
      if (m > wMm * 0.88) fontSz *= (wMm * 0.88) / m;
      ctx.fillStyle = textColor;
      ctx.font = `900 ${fontSz}px 'Arial Black', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Jeep', 0, 0);
      break;
    }

    // =========================================================================
    // UCL: 1&1 (Borussia Dortmund)
    // =========================================================================
    case '1and1':
    case 'one_and_one': {
      const draw1and1 = (c) => {
        const boxH = hMm * 0.86;
        const boxW = Math.min(wMm * 0.88, Math.max(boxH * 1.48, wMm * 0.46));
        const rad = Math.max(4, boxH * 0.14);

        let fontSz = boxH * 0.56;
        c.font = `900 ${fontSz}px 'Arial Black', sans-serif`;
        const m = c.measureText('1&1').width;
        if (m > boxW * 0.76) fontSz *= (boxW * 0.76) / m;

        if (tintHex) {
          c.fillStyle = tintHex;
          c.beginPath();
          c.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, rad);
          c.fill();

          c.save();
          c.globalCompositeOperation = 'destination-out';
          c.fillStyle = '#000000';
          c.font = `900 ${fontSz}px 'Arial Black', sans-serif`;
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText('1&1', 0, hMm * 0.02);
          c.restore();
        } else {
          c.fillStyle = '#FFFFFF';
          c.beginPath();
          c.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, rad);
          c.fill();
          c.lineWidth = Math.max(1.5, boxH * 0.028);
          c.strokeStyle = '#0B1B3D';
          c.stroke();

          c.fillStyle = '#002B7F';
          c.font = `900 ${fontSz}px 'Arial Black', sans-serif`;
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText('1&1', 0, hMm * 0.02);
        }
      };

      drawWithHolePunch(ctx, wMm, hMm, draw1and1);
      break;
    }

    // =========================================================================
    // UCL: RIYADH AIR (Atlético de Madrid)
    // =========================================================================
    case 'riyadh_air': {
      const textColor = tintHex || '#001A49';
      let fontSz = Math.min(hMm * 0.46, wMm * 0.13);
      ctx.letterSpacing = `${Math.round(hMm * 0.03)}px`;
      ctx.font = `900 ${fontSz}px 'Montserrat', 'Arial Black', sans-serif`;
      const m = ctx.measureText('RIYADH AIR').width;
      if (m > wMm * 0.88) fontSz *= (wMm * 0.88) / m;
      ctx.fillStyle = textColor;
      ctx.font = `900 ${fontSz}px 'Montserrat', 'Arial Black', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('RIYADH AIR', 0, 0);
      break;
    }

    default: {
      const textColor = tintHex || '#FFFFFF';
      let fontSz = Math.min(hMm * 0.55, wMm * 0.18);
      const label = sponsorId.replace(/_/g, ' ').toUpperCase();
      ctx.font = `900 ${fontSz}px 'Arial Black', sans-serif`;
      const m = ctx.measureText(label).width;
      if (m > wMm * 0.88) fontSz *= (wMm * 0.88) / m;
      ctx.fillStyle = textColor;
      ctx.font = `900 ${fontSz}px 'Arial Black', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 0);
      break;
    }
  }

  ctx.restore();
}
