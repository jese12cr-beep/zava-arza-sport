import React from 'react';
import { getProductMedia } from '../../data/productMediaRegistry';

function AccessoryGlyph({ kind }) {
  if (kind === 'cap') {
    return (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" aria-hidden="true">
        <path
          d="M11 25C11 16.7 17.7 11 25.5 11C33.3 11 38 16.5 38 25H11Z"
          fill="#262626"
          stroke="#ffffff"
          strokeWidth="1.8"
        />
        <path d="M24 11V25" stroke="#FA5400" strokeWidth="1.6" />
        <path d="M9 26C17 24.5 29 24.5 41 27.5C39.5 30 34 31 24 30.5C15 30 10.5 28 9 26Z" fill="#FA5400" />
      </svg>
    );
  }
  if (kind === 'bottle') {
    return (
      <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" aria-hidden="true">
        <rect x="19" y="8" width="10" height="4" rx="1.5" fill="#FA5400" />
        <path
          d="M17 15C17 13.5 18.2 12.5 19.7 12.5H28.3C29.8 12.5 31 13.5 31 15V38C31 39.6 29.7 41 28 41H20C18.3 41 17 39.6 17 38V15Z"
          fill="#262626"
          stroke="#ffffff"
          strokeWidth="1.8"
        />
        <path d="M17 24H31" stroke="#FA5400" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" aria-hidden="true">
      <path
        d="M13 11C18 9.5 22.5 10.5 25 14L23.5 37C20.5 38.5 16 38.5 13 36.5V11Z"
        fill="#262626"
        stroke="#ffffff"
        strokeWidth="1.8"
      />
      <path
        d="M27 14C29.5 10.5 34 9.5 36.5 11V36.5C34 38.5 29.5 38.5 27 37V14Z"
        fill="#1f2937"
        stroke="#FA5400"
        strokeWidth="1.8"
      />
      <path d="M15 21H22M28.5 21H34.5" stroke="#FA5400" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Miniatura limpia y consistente para tarjetas de producto en el Paso 1 del asistente.
 */
export default function ProductThumb({ product, className = 'w-14 h-14 rounded-xl' }) {
  const media = getProductMedia(product?.id);
  const isAccessory = product?.renderMode === 'FAUX_3D_LAYERED_WEBP';

  return (
    <span
      aria-hidden="true"
      className={`relative overflow-hidden bg-[#111111] border border-black/15 shrink-0 flex items-center justify-center shadow-2xs ${className}`}
    >
      {isAccessory ? (
        <AccessoryGlyph kind={media.kind} />
      ) : (
        <img
          src={media.image}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover object-center"
        />
      )}
      <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/75 text-white text-[8px] font-mono font-bold leading-tight">
        {isAccessory ? '2.5D' : '3D'}
      </span>
    </span>
  );
}
