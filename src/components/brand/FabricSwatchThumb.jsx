import React from 'react';
import { resolveAssetUrl } from '../../utils/assetUrl';

/**
 * Muestrario visual del micro-relieve real del tejido (`/fabrics/*.png`) sobre el color de prenda activo.
 */
export default function FabricSwatchThumb({
  bumpUrl,
  tintHex = '#1e293b',
  tileSize = 36,
  className = 'w-11 h-11 rounded-lg',
}) {
  const tileStyle = {
    backgroundImage: `url("${resolveAssetUrl(bumpUrl)}")`,
    backgroundSize: `${tileSize}px ${tileSize}px`,
    backgroundRepeat: 'repeat',
  };

  return (
    <span
      aria-hidden="true"
      className={`border border-black/15 shrink-0 relative overflow-hidden shadow-2xs block ${className}`}
      style={{ backgroundColor: tintHex }}
    >
      <span
        className="absolute inset-0 opacity-75 mix-blend-screen"
        style={{ ...tileStyle, filter: 'contrast(1.6) brightness(0.72)' }}
      />
      <span
        className="absolute inset-0 opacity-65 mix-blend-multiply"
        style={{ ...tileStyle, filter: 'contrast(1.45)' }}
      />
      <span
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 55%, rgba(0,0,0,0.28) 100%)',
        }}
      />
    </span>
  );
}
