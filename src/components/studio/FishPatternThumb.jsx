import React, { useEffect, useRef, useState } from 'react';
import { renderFishFrontThumbDataUrl } from '../../engine/compositor/fishPartCompositor';

/**
 * Lazy-loaded colored thumbnail preview rendered from the pattern's `.fish` front map
 * so every cut card in Step 2 displays its real graphic silhouette with live team colors.
 */
export default function FishPatternThumb({
  fileUrl,
  colorZones,
  alt = '',
  className = 'w-12 h-14 rounded-lg',
}) {
  const hostRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [src, setSrc] = useState(null);

  const cA = colorZones?.primary?.hex || '#111111';
  const cB = colorZones?.secondary?.hex || '#fa5400';
  const cC = colorZones?.accents?.hex || '#ffffff';
  const cD = colorZones?.quaternary?.hex || '#757575';
  const cK = colorZones?.collar?.hex || cC;

  useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !fileUrl) return undefined;
    let cancelled = false;
    renderFishFrontThumbDataUrl(fileUrl, {
      primary: { hex: cA },
      secondary: { hex: cB },
      accents: { hex: cC },
      quaternary: { hex: cD },
      collar: { hex: cK },
    })
      .then((url) => {
        if (!cancelled && url) setSrc(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [visible, fileUrl, cA, cB, cC, cD, cK]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={`relative overflow-hidden border border-slate-200/90 bg-slate-100 shrink-0 ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover object-center"
        />
      ) : (
        <div
          className="w-full h-full"
          style={{
            background: `linear-gradient(135deg, ${cA} 0%, ${cA} 52%, ${cB} 52%, ${cB} 84%, ${cC} 84%, ${cC} 100%)`,
          }}
        />
      )}
    </div>
  );
}
