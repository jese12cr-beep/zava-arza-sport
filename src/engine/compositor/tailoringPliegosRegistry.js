/**
 * ATLETIQ — tailoringPliegosRegistry.js
 * Registro Maestro de Moldes y Pliegos Industriales de Confección 2D (Escala 1:1)
 *
 * Sincroniza 1:1 las geometrías UV reales extraídas de los modelos `.mirl` (`MIRL_UV_PATHS`)
 * con las texturas directas compuestas en vivo (`composeGarmentPartCanvas`) y el sistema de escalado XS..XXL.
 */

import {
  getGarmentGradingData,
  generateDynamicSizeBadgeSvg,
  GRADING_SIZES,
} from './patternGradingEngine';
import { getMirlUvCutPath } from './mirlUvPathsRegistry';
import { resolveMirlKeyForProduct } from '../core/boundingBoxMath';
import { MOLDE_PATHS, MOLD_CONSTANTS } from './moldFlatteningEngine';

const MOLD_VIEWBOX = '0 0 4400 3800';

const MOLD_STYLE = `
  .st0 { fill: #333333; }
  .st1 { stroke: #010101; fill: none; stroke-miterlimit: 10; }
  .st2 { fill: none; }
  .st3 { stroke: #1d1d1b; fill: none; stroke-miterlimit: 10; }
  .st4 { fill: #ffed00; }
  .st5 { fill: #009fe3; }
  .st6 { fill: #5e4b14; }
  .st7 { fill: #4d4d4d; }
  .st8 { fill: #e6007e; }
  .st9 { fill: #f6e81d; }
  .st10 { fill: #f6ee8d; }
  .st11 { fill: #616160; }
`;

const MOLD_BACKGROUND_MARKS = `
    <!-- 1. ICONO Y TEXTO: SCALE 1:1 -->
    <g id="MARK_SCALE" transform="translate(120, 360)">
      <g>
        <path class="st0" d="M694.96,3313.86c2.14,1.15,5.5,2.25,8.95,2.25,3.71,0,5.68-1.54,5.68-3.89,0-2.2-1.7-3.49-5.98-5-5.96-2.11-9.85-5.36-9.85-10.57,0-6.09,5.11-10.72,13.51-10.72,4.07,0,7.01.8,9.12,1.79l-1.79,6.48c-1.41-.68-3.98-1.7-7.45-1.7s-5.2,1.63-5.2,3.46c0,2.27,1.98,3.27,6.61,5.02,6.33,2.36,9.26,5.65,9.26,10.69,0,5.97-4.57,11.09-14.4,11.09-4.05,0-8.1-1.11-10.09-2.22L694.96,3313.86Z"/>
        <path class="st0" d="M750.21,3321.22c-1.45.71-4.83,1.54-9.13,1.54-12.37,0-18.75-7.73-18.75-17.91,0-12.18,8.73-18.92,19.51-18.92,4.2,0,7.39.81,8.8,1.58l-1.65,6.38c-1.61-.7-3.9-1.34-6.79-1.34-6.37,0-11.36,3.89-11.36,11.83,0,7.16,4.22,11.66,11.41,11.66,2.48,0,5.15-.49,6.75-1.16L750.21,3321.22Z"/>
        <path class="st0" d="M765.36,3313.03l-2.52,9.17h-8.35l10.9-35.72h10.56l11.12,35.72h-8.7l-2.74-9.17H765.36ZM774.43,3307.01l-2.22-7.59c-.62-2.11-1.25-4.79-1.8-6.88h-.11c-.53,2.1-1.06,4.82-1.64,6.89l-2.13,7.58H774.43Z"/>
        <path class="st0" d="M792.25,3286.48h8.07v28.95h14.22v6.77h-22.29V3286.48Z"/>
        <path class="st0" d="M841.32,3307.09h-13.14v8.49h14.69v6.62h-22.77v-35.72h22.01v6.62h-13.93v7.44h13.14V3307.09Z"/>
        <path class="st0" d="M871.27,3294.93h-.1l-6.55,3.11-1.34-6.04,9.14-4.25h6.65v34.45h-7.8V3294.93Z"/>
        <path class="st0" d="M889.02,3300.82c0-2.82,1.95-4.85,4.74-4.85s4.68,1.98,4.71,4.85c0,2.79-1.87,4.83-4.73,4.83S889.02,3303.61,889.02,3300.82ZM889.02,3317.95c0-2.82,1.95-4.86,4.74-4.86s4.68,1.98,4.71,4.86c0,2.78-1.87,4.83-4.73,4.83S889.02,3320.73,889.02,3317.95Z"/>
        <path class="st0" d="M916.61,3294.93h-.1l-6.55,3.11-1.33-6.04,9.13-4.25h6.65v34.45h-7.8V3294.93Z"/>
      </g>
      <g>
        <path class="st0" d="M642.45,3269.93h-43.53c-8.07,0-14.63,6.57-14.63,14.63v43.53c0,8.07,6.56,14.63,14.63,14.63h43.53c8.06,0,14.62-6.56,14.62-14.63v-43.53C657.07,3276.5,650.51,3269.93,642.45,3269.93ZM651.07,3328.09c0,4.76-3.87,8.63-8.62,8.63h-43.53c-4.76,0-8.63-3.87-8.63-8.63v-43.53c0-4.76,3.87-8.63,8.63-8.63h43.53c4.75,0,8.62,3.87,8.62,8.63V3328.09Z"/>
        <path class="st0" d="M639.65,3285.48h-18.41c-1.65,0-3,1.34-3,3s1.35,3,3,3h11.17l-26.58,26.58v-11.17c0-1.66-1.34-3-3-3s-3,1.34-3,3v18.41c0,1.66,1.35,3,3,3h18.41c1.66,0,3-1.34,3-3s-1.34-3-3-3h-11.16l26.57-26.58v11.17c0,1.66,1.35,3,3,3s3-1.34,3-3v-18.41C642.65,3286.82,641.31,3285.48,639.65,3285.48Z"/>
      </g>
    </g>

    <!-- 2. ICONO Y TEXTO: CMYK COLOR -->
    <g id="MARK_CMYK" transform="translate(500, 360)">
      <g>
        <path class="st0" d="M1696.11,3310.12q-.59,3.02-1.86,5.45t-3.21,4.19-4.47,2.71-5.62.95q-3.45,0-6.44-1.17-3-1.16-5.17-3.5-2.17-2.33-3.42-5.75-1.24-3.41-1.24-7.97,0-4.46,1.14-8.03,1.14-3.58,3.26-6.04,2.12-2.47,5.16-3.79,3.05-1.33,6.81-1.33,3.29,0,5.97.98,2.67.98,4.61,2.71,1.93,1.72,3.07,4.05,1.14,2.33,1.41,4.98h-7.37q-.74-3.02-2.86-4.69-2.12-1.67-4.77-1.67-4.61,0-6.79,3.31-2.17,3.32-2.17,9.09,0,5.89,2.15,9.15,2.14,3.26,6.44,3.26,3.28,0,5.27-1.78,1.99-1.77,2.73-5.11H1696.11Z"/>
        <path class="st0" d="M1726.62,3322.2v-24.12l-6.57,24.12h-7.31l-6.52-24.01v24.01h-6.84v-35.19h10.81l6.36,25.81,6.36-25.81h10.6v35.19H1726.62Z"/>
        <path class="st0" d="M1748.57,3322.2v-13.3l-12.19-21.89h8.59l7.42,14.31,6.84-14.31h8.48l-11.77,21.99v13.2H1748.57Z"/>
        <path class="st0" d="M1792.2,3322.2l-10.44-15.85-3.92,3.87v11.98h-7.26v-35.19h7.26v14.31l13.46-14.31h9.54l-13.88,13.88,14.2,21.31H1792.2Z"/>
        <path class="st0" d="M1849.55,3310.12q-.59,3.02-1.86,5.45t-3.2,4.19-4.48,2.71-5.62.95q-3.45,0-6.44-1.17-2.99-1.16-5.17-3.5-2.17-2.33-3.41-5.75-1.25-3.41-1.25-7.97,0-4.46,1.14-8.03,1.14-3.58,3.26-6.04,2.12-2.47,5.17-3.79,3.04-1.33,6.81-1.33,3.28,0,5.96.98,2.68.98,4.61,2.71,1.93,1.72,3.07,4.05,1.14,2.33,1.41,4.98h-7.37q-.74-3.02-2.86-4.69-2.12-1.67-4.77-1.67-4.61,0-6.78,3.31-2.18,3.32-2.18,9.09,0,5.89,2.15,9.15,2.15,3.26,6.44,3.26,3.28,0,5.27-1.78,1.99-1.77,2.73-5.11H1849.55Z"/>
        <path class="st0" d="M1868.88,3323.42q-8.16,0-12.53-4.77t-4.37-13.73q0-4.45,1.11-8,1.11-3.55,3.28-6.02,2.18-2.46,5.3-3.76,3.13-1.3,7.21-1.3,4.03,0,7.18,1.3,3.16,1.3,5.28,3.79,2.12,2.49,3.23,6.07,1.11,3.58,1.11,8.08,0,9.12-4.32,13.73Q1877.04,3323.42,1868.88,3323.42ZM1868.88,3317.11q1.96,0,3.71-.71,1.75-.72,3.05-2.18,1.3-1.45,2.04-3.73.74-2.28.74-5.41,0-6.25-2.44-9.49-2.43-3.23-7.1-3.23-4.66,0-7.15,3.23-2.49,3.24-2.49,9.49,0,6.26,2.51,9.14Q1864.27,3317.11,1868.88,3317.11Z"/>
        <path class="st0" d="M1889.57,3322.2v-35.19h7.37v28.78h17.44v6.41H1889.57Z"/>
        <path class="st0" d="M1933.04,3323.42q-8.16,0-12.53-4.77t-4.37-13.73q0-4.45,1.11-8,1.11-3.55,3.29-6.02,2.17-2.46,5.3-3.76,3.12-1.3,7.2-1.3,4.03,0,7.18,1.3,3.16,1.3,5.28,3.79,2.12,2.49,3.23,6.07,1.11,3.58,1.11,8.08,0,9.12-4.31,13.73Q1941.2,3323.42,1933.04,3323.42ZM1933.04,3317.11q1.96,0,3.71-.71,1.75-.72,3.05-2.18,1.3-1.45,2.04-3.73.74-2.28.74-5.41,0-6.25-2.43-9.49-2.44-3.23-7.11-3.23-4.66,0-7.15,3.23-2.49,3.24-2.49,9.49,0,6.26,2.52,9.14Q1928.43,3317.11,1933.04,3317.11Z"/>
        <path class="st0" d="M1974.25,3322.2v-9.06q0-2.55-1.17-3.63t-4.35-1.09h-7.84v13.78h-7.15v-35.19h17.86q2.43,0,4.42.77,1.99.76,3.42,2.12,1.43,1.35,2.2,3.23.77,1.88.77,4.05,0,2.87-1.35,5.06-1.36,2.2-3.9,3.11,2.33.74,3.31,2.27.98,1.54.98,4.62v9.96H1974.25ZM1960.89,3293.1v9.38h9.22q2.97,0,4.19-1.32,1.22-1.33,1.22-3.34,0-2.07-1.19-3.39-1.2-1.33-3.95-1.33H1960.89Z"/>
      </g>
      <g>
        <path class="st11" d="M1617.43,3306.33c0,9.22-3.74,17.57-9.78,23.61-6.04,6.04-14.39,9.78-23.61,9.78v-33.39H1617.43Z"/>
        <path class="st5" d="M1584.04,3272.94v33.39h-33.39c0-9.22,3.74-17.57,9.78-23.61C1566.47,3276.68,1574.82,3272.94,1584.04,3272.94Z"/>
        <path class="st8" d="M1617.43,3306.33h-33.39v-33.39c9.22,0,17.57,3.74,23.61,9.78C1613.69,3288.76,1617.43,3297.11,1617.43,3306.33Z"/>
        <path class="st4" d="M1584.04,3306.33v33.39c-18.44,0-33.39-14.95-33.39-33.39H1584.04Z"/>
        <path class="st0" d="M1635.5,3303.33h-15.21c-1.45-17.68-15.58-31.81-33.26-33.26v-15.21c0-1.66-1.34-3-3-3s-3,1.34-3,3v15.21c-17.67,1.45-31.8,15.58-33.25,33.26h-15.21c-1.66,0-3,1.34-3,3s1.34,3,3,3h15.21c1.45,17.67,15.58,31.8,33.25,33.25v15.21c0,1.66,1.35,3,3,3s3-1.34,3-3v-15.21c17.68-1.45,31.81-15.58,33.26-33.25h15.21c1.66,0,3-1.35,3-3S1637.16,3303.33,1635.5,3303.33ZM1614.28,3303.33h-27.25v-27.25C1601.4,3277.5,1612.86,3288.96,1614.28,3303.33ZM1581.03,3276.08v27.25h-27.24C1555.21,3288.96,1566.67,3277.5,1581.03,3276.08ZM1553.79,3309.33h27.24v27.24C1566.67,3335.15,1555.21,3323.69,1553.79,3309.33ZM1587.03,3336.57v-27.24h27.25C1612.86,3323.69,1601.4,3335.15,1587.03,3336.57Z"/>
      </g>
    </g>

    <!-- 3. ICONO Y TEXTO: READY TO PRINT -->
    <g id="MARK_READY_TO_PRINT" transform="translate(700, 360)">
      <g>
        <path class="st0" d="M2642.96,3322.2v-9.06q0-2.55-1.17-3.63t-4.34-1.09h-7.85v13.78h-7.15v-35.19h17.86q2.44,0,4.42.77,1.99.76,3.42,2.12,1.43,1.35,2.2,3.23.77,1.88.77,4.05,0,2.87-1.35,5.06-1.35,2.2-3.9,3.11,2.33.74,3.31,2.27.99,1.54.99,4.62v9.96H2642.96ZM2629.6,3293.1v9.38h9.22q2.97,0,4.19-1.32,1.22-1.33,1.22-3.34,0-2.07-1.19-3.39-1.2-1.33-3.95-1.33H2629.6Z"/>
        <path class="st0" d="M2655.05,3322.2v-35.19h25.87v6.15h-18.71v7.52h17.22v6.2h-17.22v9.07h19.55v6.25H2655.05Z"/>
        <path class="st0" d="M2709.56,3322.2l-2.23-7.26h-12.98l-2.5,7.26h-7.79l12.57-35.19h8.53l12.4,35.19H2709.56ZM2700.81,3294.9h-.05l-4.51,14h8.96L2700.81,3294.9Z"/>
        <path class="st0" d="M2720.43,3322.2v-35.19h13.62q3.55,0,6.57,1.19t5.17,3.42,3.37,5.4,1.22,7.21-1.09,7.34-3.1,5.67-4.82,3.66-6.2,1.3H2720.43ZM2733.68,3316.21q4.82,0,7-2.99,2.17-3,2.17-8.99,0-2.97-.53-5.09-.53-2.11-1.72-3.47-1.2-1.35-3.05-1.96-1.85-.61-4.5-.61h-5.46v23.11H2733.68Z"/>
        <path class="st0" d="M2762.01,3322.2v-13.3l-12.18-21.89h8.58l7.42,14.31,6.84-14.31h8.48l-11.77,21.99v13.2H2762.01Z"/>
        <path class="st0" d="M2808.34,3322.2v-29.04h-10.6v-6.15h28.62v6.15h-10.66v29.04H2808.34Z"/>
        <path class="st0" d="M2844.77,3323.42q-8.16,0-12.54-4.77t-4.37-13.73q0-4.45,1.11-8,1.12-3.55,3.29-6.02,2.17-2.46,5.3-3.76,3.13-1.3,7.21-1.3,4.02,0,7.18,1.3,3.15,1.3,5.27,3.79,2.12,2.49,3.24,6.07,1.11,3.58,1.11,8.08,0,9.12-4.32,13.73Q2852.93,3323.42,2844.77,3323.42ZM2844.77,3317.11q1.96,0,3.71-.71,1.75-.72,3.05-2.18,1.29-1.45,2.04-3.73.74-2.28.74-5.41,0-6.25-2.44-9.49-2.44-3.23-7.1-3.23-4.67,0-7.16,3.23-2.49,3.24-2.49,9.49,0,6.26,2.52,9.14Q2840.16,3317.11,2844.77,3317.11Z"/>
        <path class="st0" d="M2879.75,3322.2v-35.19h15.53q2.59,0,4.66.87t3.55,2.44,2.28,3.63.8,4.45-.8,4.43-2.28,3.5-3.55,2.27-4.66.83h-8.17v12.77H2879.75ZM2894.11,3303.44q3.18,0,4.59-1.46,1.4-1.46,1.4-3.79,0-2.23-1.4-3.66-1.41-1.43-4.59-1.43h-7v10.34H2894.11Z"/>
        <path class="st0" d="M2929.88,3322.2v-9.06q0-2.55-1.17-3.63t-4.35-1.09h-7.84v13.78h-7.16v-35.19h17.87q2.43,0,4.42.77,1.99.76,3.42,2.12,1.43,1.35,2.2,3.23.77,1.88.77,4.05,0,2.87-1.35,5.06-1.36,2.2-3.9,3.11,2.33.74,3.31,2.27.98,1.54.98,4.62v9.96H2929.88ZM2916.52,3293.1v9.38h9.22q2.97,0,4.19-1.32,1.22-1.33,1.22-3.34,0-2.07-1.2-3.39-1.19-1.33-3.94-1.33H2916.52Z"/>
        <path class="st0" d="M2942.02,3322.2v-35.19h7.36v35.19H2942.02Z"/>
        <path class="st0" d="M2976.03,3322.2l-15.06-23.64v23.64h-6.83v-35.19h7.79l13.99,22.63v-22.63h6.89v35.19H2976.03Z"/>
        <path class="st0" d="M2996.25,3322.2v-29.04h-10.6v-6.15h28.62v6.15h-10.65v29.04H2996.25Z"/>
      </g>
      <g>
        <path class="st0" d="M2580.83,3283.29c-.66-4.18-3.42-7.67-7.18-9.32v-12.61c0-3.04-2.47-5.5-5.51-5.5h-35.05c-3.03,0-5.5,2.46-5.5,5.5v12.61c-3.76,1.65-6.52,5.14-7.19,9.32-4.53,1.41-7.83,5.64-7.83,10.63v30.46c0,6.14,5,11.14,11.14,11.14h3.88v14.7c0,3.63,2.95,6.58,6.58,6.58h32.9c3.63,0,6.58-2.95,6.58-6.58v-14.7h3.88c6.14,0,11.14-5,11.14-11.14v-30.46C2588.67,3288.93,2585.37,3284.7,2580.83,3283.29ZM2567.65,3261.86v11.07h-34.06v-11.07H2567.65ZM2532.52,3278.93h36.2c2.61,0,4.84,1.59,5.79,3.86h-47.79C2527.67,3280.52,2529.91,3278.93,2532.52,3278.93ZM2567.65,3350.22c0,.32-.26.58-.58.58h-32.9c-.32,0-.58-.26-.58-.58v-30.66c0-.31.26-.57.58-.57h32.9c.32,0,.58.26.58.57V3350.22ZM2582.67,3324.38c0,2.83-2.31,5.14-5.14,5.14h-3.88v-9.96c0-3.62-2.95-6.57-6.58-6.57h-32.9c-3.63,0-6.58,2.95-6.58,6.57v9.96h-3.88c-2.83,0-5.14-2.31-5.14-5.14v-30.46c0-2.83,2.31-5.13,5.14-5.13h53.82c2.83,0,5.14,2.3,5.14,5.13V3324.38Z"/>
        <path class="st0" d="M2525.69,3294.58c-1.15,0-2.09.93-2.09,2.08s.94,2.09,2.09,2.09,2.09-.93,2.09-2.09S2526.84,3294.58,2525.69,3294.58Z"/>
        <path class="st0" d="M2532.68,3294.58c-1.15,0-2.09.93-2.09,2.08s.94,2.09,2.09,2.09,2.08-.93,2.08-2.09S2533.83,3294.58,2532.68,3294.58Z"/>
      </g>
    </g>
`;

const F3_ILLUSTRATOR_PIECES = [
  {
    id: 'front',
    partName: 'Front',
    name: 'Delantero / Frente',
    tag: '[ 1. FRENTE • CABALLERO ]',
    panel: 'front',
    box: { x: 261, y: 1162, w: 1498, h: 2166 },
    customMold: {
      path: MOLDE_PATHS.FRENTE,
      bounds: MOLD_CONSTANTS.PIECES.FRONT.bounds,
      origCx: MOLD_CONSTANTS.PIECES.FRONT.centerX,
      origCy: MOLD_CONSTANTS.PIECES.FRONT.centerY,
      targetCx: 1010,
      targetCy: 2245,
      uvBounds: { uMin: 0.0145, uMax: 0.9858, yTop: 0.0127, yBot: 0.9721 },
    },
  },
  {
    id: 'back',
    partName: 'Back',
    name: 'Trasero / Espalda',
    tag: '[ 2. ESPALDA • CABALLERO ]',
    panel: 'back',
    box: { x: 2641, y: 1150, w: 1498, h: 2189 },
    customMold: {
      path: MOLDE_PATHS.TRASERO,
      bounds: MOLD_CONSTANTS.PIECES.BACK.bounds,
      origCx: MOLD_CONSTANTS.PIECES.BACK.centerX,
      origCy: MOLD_CONSTANTS.PIECES.BACK.centerY,
      targetCx: 3390,
      targetCy: 2245,
      uvBounds: { uMin: 0.0120, uMax: 0.9883, yTop: 0.0119, yBot: 0.9728 },
    },
  },
  {
    id: 'collar',
    partName: 'Collar',
    name: 'Tira de Cuello',
    tag: '[ 3. TIRA DE CUELLO ]',
    panel: 'collar',
    box: { x: 2128, y: 751, w: 144, h: 1398 },
    customMold: {
      path: 'M1699.46,196.34 H1843.81 V1593.96 H1699.46 Z',
      bounds: MOLD_CONSTANTS.PIECES.COLLAR.bounds,
      origCx: MOLD_CONSTANTS.PIECES.COLLAR.centerX,
      origCy: MOLD_CONSTANTS.PIECES.COLLAR.centerY,
      targetCx: 2200,
      targetCy: 1450,
      uvBounds: { uMin: 0.0129, uMax: 0.9869, yTop: 0.5028, yBot: 0.8542 },
      rotateDeg: 90,
    },
  },
  {
    id: 'left_sleeve',
    partName: 'LeftArm',
    name: 'Manga Izquierda',
    tag: '[ 4. MANGA IZQUIERDA ]',
    panel: 'left_sleeve',
    box: { x: 372, y: 197, w: 1277, h: 686 },
    customMold: {
      path: MOLDE_PATHS.MANGA_IZQUIERDA,
      bounds: MOLD_CONSTANTS.PIECES.LEFT_SLEEVE.bounds,
      origCx: MOLD_CONSTANTS.PIECES.LEFT_SLEEVE.centerX,
      origCy: MOLD_CONSTANTS.PIECES.LEFT_SLEEVE.centerY,
      targetCx: 1010,
      targetCy: 540,
      uvBounds: { uMin: 0.0184, uMax: 0.9826, yTop: 0.0265, yBot: 0.9854 },
    },
  },
  {
    id: 'right_sleeve',
    partName: 'RightArm',
    name: 'Manga Derecha',
    tag: '[ 5. MANGA DERECHA ]',
    panel: 'right_sleeve',
    box: { x: 2752, y: 197, w: 1277, h: 686 },
    customMold: {
      path: MOLDE_PATHS.MANGA_DERECHA,
      bounds: MOLD_CONSTANTS.PIECES.RIGHT_SLEEVE.bounds,
      origCx: MOLD_CONSTANTS.PIECES.RIGHT_SLEEVE.centerX,
      origCy: MOLD_CONSTANTS.PIECES.RIGHT_SLEEVE.centerY,
      targetCx: 3390,
      targetCy: 540,
      uvBounds: { uMin: 0.0184, uMax: 0.9825, yTop: 0.0271, yBot: 0.9890 },
    },
  },
];

export const TAILORING_GARMENT_SPECS = {
  futbol_jersey_pro_vneck: {
    title: 'Jersey Fútbol ZAVA Apex V1 (Caballero)',
    cutCode: 'ARZA-Z01M',
    category: 'jersey',
    pieces: F3_ILLUSTRATOR_PIECES,
  },

  esports_pro_jersey: {
    title: 'Jersey Arena E-Sports ZAVA E1 (Sublimación Full)',
    cutCode: 'ARZA-E01M',
    category: 'jersey',
    pieces: F3_ILLUSTRATOR_PIECES,
  },

  futbol_jersey_f3w_women: {
    title: 'Jersey Fútbol ZAVA Femme V1 (Dama)',
    cutCode: 'ARZA-Z01W',
    category: 'jersey',
    pieces: [
      { id: 'front', partName: 'Front', name: 'Delantero Silueta Dama', tag: '[ 1. FRENTE ZAVA FEMME ]', panel: 'front', box: { x: 420, y: 1120, w: 1260, h: 1953 } },
      { id: 'back', partName: 'Back', name: 'Trasero Anatómico Dama', tag: '[ 2. ESPALDA ZAVA FEMME ]', panel: 'back', box: { x: 2440, y: 1100, w: 1520, h: 1976 } },
      { id: 'collar', partName: 'Collar', name: 'Cuello V Femenino', tag: '[ 3. CUELLO V DAMA ]', panel: 'collar', box: { x: 1710, y: 350, w: 980, h: 245 } },
      { id: 'left_sleeve', partName: 'LeftArm', name: 'Manga Corta Dama Izq', tag: '[ 4. MANGA DAMA IZQ ]', panel: 'left_sleeve', box: { x: 320, y: 260, w: 1100, h: 618 } },
      { id: 'right_sleeve', partName: 'RightArm', name: 'Manga Corta Dama Der', tag: '[ 5. MANGA DAMA DER ]', panel: 'right_sleeve', box: { x: 2980, y: 260, w: 1100, h: 618 } },
    ],
  },

  football_shorts_fp3: {
    title: 'Short Fútbol ZAVA Match S1',
    cutCode: 'ARZA-S01M',
    category: 'shorts',
    pieces: [
      { id: 'left_leg', partName: 'LeftLeg', name: 'Pierna Izquierda', tag: '[ 1. PIERNA IZQUIERDA ]', panel: 'left_leg', box: { x: 380, y: 1080, w: 1600, h: 1249 } },
      { id: 'right_leg', partName: 'RightLeg', name: 'Pierna Derecha', tag: '[ 2. PIERNA DERECHA ]', panel: 'right_leg', box: { x: 2420, y: 1080, w: 1600, h: 1249 } },
    ],
    waistband: { x: 850, y: 310, w: 2700, h: 250, label: '[ 3. PRETINA ELÁSTICA CON CORDÓN INTERNO ]' },
  },

  basketball_b6_hero: {
    title: 'Tank Basket ZAVA Court B1 (Caballero)',
    cutCode: 'ARZA-B01M',
    category: 'tank',
    pieces: [
      { id: 'front', partName: 'Front', name: 'Delantero Tank Caballero', tag: '[ 1. FRENTE ZAVA B1 ]', panel: 'front', box: { x: 380, y: 840, w: 1580, h: 2146 } },
      { id: 'back', partName: 'Back', name: 'Espalda Atlética', tag: '[ 2. ESPALDA ZAVA B1 ]', panel: 'back', box: { x: 2560, y: 900, w: 1120, h: 2013 } },
      { id: 'collar', partName: 'Krageneinfass', name: 'Ribete Cuello', tag: '[ 3. RIBETE CUELLO ]', panel: 'collar', box: { x: 1690, y: 260, w: 1020, h: 180 } },
      { id: 'left_armhole', partName: 'Aermelbandlinks', name: 'Ribete Sisa Izq', tag: '[ 4. RIBETE SISA IZQ ]', panel: 'left_sleeve', box: { x: 360, y: 270, w: 1020, h: 160 } },
      { id: 'right_armhole', partName: 'Aermelbandrechts', name: 'Ribete Sisa Der', tag: '[ 5. RIBETE SISA DER ]', panel: 'right_sleeve', box: { x: 3020, y: 270, w: 1020, h: 160 } },
    ],
  },

  basketball_b7w_epic_women: {
    title: 'Tank Basket ZAVA Femme BW1 (Dama)',
    cutCode: 'ARZA-B01W',
    category: 'tank_women',
    pieces: [
      { id: 'left_side', partName: 'Seitenteillinks', name: 'Panel Lateral Izq', tag: '[ 3. LATERAL IZQ ]', panel: 'side_left', box: { x: 190, y: 1040, w: 420, h: 1680 } },
      { id: 'front', partName: 'Front', name: 'Delantero Tank Dama', tag: '[ 1. FRENTE ZAVA BW1 ]', panel: 'front', box: { x: 840, y: 880, w: 1320, h: 1978 } },
      { id: 'back', partName: 'Back', name: 'Espalda Tank Dama', tag: '[ 2. ESPALDA ZAVA BW1 ]', panel: 'back', box: { x: 2490, y: 960, w: 1040, h: 1848 } },
      { id: 'right_side', partName: 'Seitenteilrechts', name: 'Panel Lateral Der', tag: '[ 4. LATERAL DER ]', panel: 'side_right', box: { x: 3790, y: 1040, w: 420, h: 1680 } },
      { id: 'collar', partName: 'Collar', name: 'Ribete Cuello Dama', tag: '[ 5. RIBETE CUELLO ]', panel: 'collar', box: { x: 1710, y: 250, w: 960, h: 220 } },
      { id: 'left_armhole', partName: 'Aermelbandlinks', name: 'Ribete Sisa Izq', tag: '[ 6. SISA IZQ ]', panel: 'left_sleeve', box: { x: 380, y: 280, w: 960, h: 140 } },
      { id: 'right_armhole', partName: 'Aermelbandrechts', name: 'Ribete Sisa Der', tag: '[ 7. SISA DER ]', panel: 'right_sleeve', box: { x: 3060, y: 280, w: 960, h: 140 } },
    ],
  },

  basketball_shorts_bp6: {
    title: 'Short Basket ZAVA Court SB1 (Caballero)',
    cutCode: 'ARZA-SB01M',
    category: 'shorts_basketball',
    pieces: [
      { id: 'left_leg', partName: 'LeftLeg', name: 'Pierna Izq Amplia', tag: '[ 1. PIERNA IZQUIERDA BASKET ]', panel: 'left_leg', box: { x: 380, y: 1060, w: 1600, h: 1321 } },
      { id: 'right_leg', partName: 'RightLeg', name: 'Pierna Der Amplia', tag: '[ 2. PIERNA DERECHA BASKET ]', panel: 'right_leg', box: { x: 2420, y: 1060, w: 1600, h: 1321 } },
    ],
    waistband: { x: 850, y: 310, w: 2700, h: 250, label: '[ 3. PRETINA ANCHA BASKET CON CORDÓN ]' },
  },

  basketball_shorts_bp7w_women: {
    title: 'Short Basket ZAVA Femme SBW1 (Dama)',
    cutCode: 'ARZA-SB01W',
    category: 'shorts_basketball_women',
    pieces: [
      { id: 'waistband', partName: 'Aufnaeher', name: 'Pretina / Parche Cintura', tag: '[ 7. PRETINA ANATÓMICA DAMA ]', panel: 'waistband', box: { x: 1560, y: 150, w: 1280, h: 320 } },
      { id: 'left_front', partName: 'LinkesBeinvorne', name: 'Delantero Izquierdo', tag: '[ 1. DELANTERO IZQ ]', panel: 'left_leg', box: { x: 300, y: 620, w: 680, h: 1126 } },
      { id: 'left_stripe', partName: 'Seitenstreifenlinks', name: 'Banda Lateral Izq', tag: '[ 5. BANDA IZQ ]', panel: 'side_left', box: { x: 1320, y: 620, w: 340, h: 1128 } },
      { id: 'right_stripe', partName: 'Seitenstreifenrechts', name: 'Banda Lateral Der', tag: '[ 6. BANDA DER ]', panel: 'side_right', box: { x: 2740, y: 620, w: 340, h: 1128 } },
      { id: 'right_front', partName: 'RechtesBeinvorne', name: 'Delantero Derecho', tag: '[ 2. DELANTERO DER ]', panel: 'right_leg', box: { x: 3420, y: 620, w: 680, h: 1126 } },
      { id: 'left_back', partName: 'LinkesBeinhinten', name: 'Trasero Izquierdo', tag: '[ 3. TRASERO IZQ ]', panel: 'left_back', box: { x: 1080, y: 2040, w: 740, h: 1120 } },
      { id: 'right_back', partName: 'RechtesBeinhinten', name: 'Trasero Derecho', tag: '[ 4. TRASERO DER ]', panel: 'right_back', box: { x: 2580, y: 2040, w: 740, h: 1120 } },
    ],
  },

  jacket_softshell_601m_men: {
    title: 'Chamarra Softshell ZAVA Shield J1 (Caballero)',
    cutCode: 'ARZA-J01M',
    category: 'jacket',
    pieces: [
      { id: 'front_left', partName: 'FrontLeftPart', name: 'Pecho Izquierdo', tag: '[ 1. PECHO IZQ CIERRE ]', panel: 'front_left', box: { x: 280, y: 240, w: 540, h: 1474 } },
      { id: 'front_right', partName: 'FrontRightPart', name: 'Pecho Derecho', tag: '[ 2. PECHO DER CIERRE ]', panel: 'front_right', box: { x: 1040, y: 240, w: 540, h: 1474 } },
      { id: 'back', partName: 'Back', name: 'Espalda Chamarra', tag: '[ 3. ESPALDA SOFTSHELL ]', panel: 'back', box: { x: 1860, y: 280, w: 1020, h: 1400 } },
      { id: 'collar_ext', partName: 'CollarOutside', name: 'Cuello Exterior', tag: '[ 4. CUELLO EXT ]', panel: 'collar', box: { x: 3240, y: 400, w: 280, h: 1080 } },
      { id: 'collar_int', partName: 'CollarInside', name: 'Cuello Interior', tag: '[ 5. CUELLO INT ]', panel: 'collar_int', box: { x: 3760, y: 400, w: 280, h: 1080 } },
      { id: 'left_sleeve', partName: 'LeftArm', name: 'Manga Izquierda', tag: '[ 6. MANGA IZQ ]', panel: 'left_sleeve', box: { x: 260, y: 2000, w: 520, h: 1240 } },
      { id: 'left_underarm', partName: 'Unterarmstreifenlinks', name: 'Bajo Manga Izq', tag: '[ 7. BAJO MANGA IZQ ]', panel: 'left_underarm', box: { x: 940, y: 2020, w: 400, h: 1200 } },
      { id: 'left_side', partName: 'Seitenteillinks', name: 'Costado Izq', tag: '[ 8. COSTADO IZQ ]', panel: 'side_left', box: { x: 1500, y: 2030, w: 420, h: 1180 } },
      { id: 'right_side', partName: 'Seitenteilrechts', name: 'Costado Der', tag: '[ 9. COSTADO DER ]', panel: 'side_right', box: { x: 2140, y: 2030, w: 420, h: 1180 } },
      { id: 'right_underarm', partName: 'Unterarmstreifenrechts', name: 'Bajo Manga Der', tag: '[ 10. BAJO MANGA DER ]', panel: 'right_underarm', box: { x: 2740, y: 2020, w: 400, h: 1200 } },
      { id: 'right_sleeve', partName: 'RightArm', name: 'Manga Derecha', tag: '[ 11. MANGA DER ]', panel: 'right_sleeve', box: { x: 3420, y: 2000, w: 520, h: 1240 } },
    ],
  },

  jacket_softshell_601w_women: {
    title: 'Chamarra Softshell ZAVA Femme JW1 (Dama)',
    cutCode: 'ARZA-J01W',
    category: 'jacket',
    pieces: [
      { id: 'front_left', partName: 'FrontLeftPart', name: 'Pecho Izq Dama', tag: '[ 1. PECHO IZQ DAMA ]', panel: 'front_left', box: { x: 280, y: 260, w: 560, h: 1362 } },
      { id: 'front_right', partName: 'FrontRightPart', name: 'Pecho Der Dama', tag: '[ 2. PECHO DER DAMA ]', panel: 'front_right', box: { x: 1040, y: 260, w: 560, h: 1362 } },
      { id: 'back', partName: 'Back', name: 'Espalda Dama', tag: '[ 3. ESPALDA DAMA ]', panel: 'back', box: { x: 1860, y: 280, w: 980, h: 1400 } },
      { id: 'collar_ext', partName: 'CollarOutside', name: 'Cuello Exterior', tag: '[ 4. CUELLO EXT ]', panel: 'collar', box: { x: 3240, y: 400, w: 280, h: 1080 } },
      { id: 'collar_int', partName: 'CollarInside', name: 'Cuello Interior', tag: '[ 5. CUELLO INT ]', panel: 'collar_int', box: { x: 3760, y: 400, w: 280, h: 1080 } },
      { id: 'left_sleeve', partName: 'LeftArm', name: 'Manga Dama Izq', tag: '[ 6. MANGA IZQ ]', panel: 'left_sleeve', box: { x: 260, y: 2000, w: 520, h: 1240 } },
      { id: 'left_underarm', partName: 'Unterarmstreifenlinks', name: 'Bajo Manga Izq', tag: '[ 7. BAJO MANGA IZQ ]', panel: 'left_underarm', box: { x: 940, y: 2020, w: 400, h: 1200 } },
      { id: 'left_side', partName: 'Seitenteillinks', name: 'Costado Izq', tag: '[ 8. COSTADO IZQ ]', panel: 'side_left', box: { x: 1500, y: 2030, w: 420, h: 1180 } },
      { id: 'right_side', partName: 'Seitenteilrechts', name: 'Costado Der', tag: '[ 9. COSTADO DER ]', panel: 'side_right', box: { x: 2140, y: 2030, w: 420, h: 1180 } },
      { id: 'right_underarm', partName: 'Unterarmstreifenrechts', name: 'Bajo Manga Der', tag: '[ 10. BAJO MANGA DER ]', panel: 'right_underarm', box: { x: 2740, y: 2020, w: 400, h: 1200 } },
      { id: 'right_sleeve', partName: 'RightArm', name: 'Manga Dama Der', tag: '[ 11. MANGA DER ]', panel: 'right_sleeve', box: { x: 3420, y: 2000, w: 520, h: 1240 } },
    ],
  },
};

export const TAILORING_SVG_PATHS = {};
export const TAILORING_PIECE_BOUNDS = {};

/**
 * Convierte un contorno UV normalizado (0..1000) a coordenadas reales del lienzo SVG `(boxX, boxY, boxW, boxH)`.
 */
function scaleNormalizedUvPath(uvPathStr, box) {
  if (!uvPathStr || !box) {
    const x0 = box?.x ?? 0;
    const y0 = box?.y ?? 0;
    const w = box?.w ?? 100;
    const h = box?.h ?? 100;
    return `M${x0},${y0} L${x0 + w},${y0} L${x0 + w},${y0 + h} L${x0},${y0 + h} Z`;
  }
  const sx = box.w / 1000;
  const sy = box.h / 1000;
  return uvPathStr.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, xStr, yStr) => {
    const nx = (box.x + parseFloat(xStr) * sx).toFixed(1);
    const ny = (box.y + parseFloat(yStr) * sy).toFixed(1);
    return `${nx},${ny}`;
  });
}

/**
 * Genera el SVG 2D de Confección Industrial sincronizado 1:1 con las texturas UV reales del motor 3D.
 */
export function generateGarmentTailoringSvgString(
  productModelId = 'futbol_jersey_f3w_women',
  design = {},
  activePlayer = {},
  options = {}
) {
  const spec = TAILORING_GARMENT_SPECS[productModelId] || TAILORING_GARMENT_SPECS.futbol_jersey_f3w_women;
  const mirlKey = resolveMirlKeyForProduct(productModelId);
  const directTextures = options.directTextures || null;
  const showCutLines = options.showCutLines !== false;
  const showRegistrationMarks = options.showRegistrationMarks !== false;
  const showProductionLabels = options.showProductionLabels !== false;
  const activeSize = GRADING_SIZES.includes(options.size || activePlayer?.size)
    ? options.size || activePlayer?.size
    : 'M';

  const gradingData = getGarmentGradingData(productModelId, activeSize);
  const { scaleX, scaleY } = gradingData;

  const primaryColor = design?.colorZones?.primary?.hex || '#0033a0';
  const collarColor = design?.colorZones?.collar?.hex || '#ffcd00';
  const secondaryColor = design?.colorZones?.secondary?.hex || '#ffffff';

  const clipDefs = [];
  const pieceGroups = [];

  for (const piece of spec.pieces) {
    const clipId = `clip-piece-${piece.id}`;
    const imgSrc =
      directTextures?.[piece.partName] ||
      directTextures?.[piece.id] ||
      null;

    if (piece.customMold) {
      const cm = piece.customMold;
      const b = cm.bounds;
      const isCollarVert = Boolean(cm.rotateDeg);
      const sx = isCollarVert ? scaleY : scaleX;
      const sy = isCollarVert ? scaleX : scaleY;

      clipDefs.push(`<clipPath id="${clipId}"><path d="${cm.path}" /></clipPath>`);

      let innerContent;
      if (imgSrc) {
        const uv = cm.uvBounds;
        const uSpan = Math.max(0.01, uv.uMax - uv.uMin);
        const ySpan = Math.max(0.01, uv.yBot - uv.yTop);
        if (isCollarVert) {
          // Imagen original de cuello es horizontal; se proyecta en caja horizontal pre-rotación y se gira 90°
          const hW = b.height;
          const hH = b.width;
          const hx = cm.origCx - hW / 2;
          const hy = cm.origCy - hH / 2;
          const imgW = hW / uSpan;
          const imgH = hH / ySpan;
          const imgX = hx - uv.uMin * imgW;
          const imgY = hy - uv.yTop * imgH;
          innerContent = `<g transform="rotate(${cm.rotateDeg} ${cm.origCx} ${cm.origCy})"><image href="${imgSrc}" xlink:href="${imgSrc}" x="${imgX.toFixed(1)}" y="${imgY.toFixed(1)}" width="${imgW.toFixed(1)}" height="${imgH.toFixed(1)}" preserveAspectRatio="none" /></g>`;
        } else {
          const imgW = b.width / uSpan;
          const imgH = b.height / ySpan;
          const imgX = b.x - uv.uMin * imgW;
          const imgY = b.y - uv.yTop * imgH;
          innerContent = `<image href="${imgSrc}" xlink:href="${imgSrc}" x="${imgX.toFixed(1)}" y="${imgY.toFixed(1)}" width="${imgW.toFixed(1)}" height="${imgH.toFixed(1)}" preserveAspectRatio="none" />`;
        }
      } else {
        innerContent = `<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="${piece.panel === 'collar' ? collarColor : primaryColor}" />`;
      }

      const labelY = Math.round(cm.targetCy + (b.height / 2) * sy + 42);
      pieceGroups.push(`
    <g id="PIECE_${piece.partName}" transform="translate(${cm.targetCx}, ${cm.targetCy}) scale(${sx}, ${sy}) translate(${-cm.origCx}, ${-cm.origCy})">
      <g clip-path="url(#${clipId})">
        ${innerContent}
      </g>
      ${showCutLines ? `<path d="${cm.path}" class="cut-line" />` : ''}
    </g>${showProductionLabels ? `\n    <text x="${cm.targetCx}" y="${labelY}" text-anchor="middle" class="piece-tag">${piece.tag} • TALLA ${activeSize}</text>` : ''}`);
      continue;
    }

    const uvPath = getMirlUvCutPath(mirlKey, piece.partName);
    const scaledPath = scaleNormalizedUvPath(uvPath, piece.box);
    clipDefs.push(`<clipPath id="${clipId}"><path d="${scaledPath}" /></clipPath>`);

    const cx = Math.round(piece.box.x + piece.box.w / 2);
    const cy = Math.round(piece.box.y + piece.box.h / 2);
    const labelY = Math.round(cy + (piece.box.h / 2) * scaleY + 42);

    pieceGroups.push(`
    <g id="PIECE_${piece.partName}" transform="translate(${cx}, ${cy}) scale(${scaleX}, ${scaleY}) translate(${-cx}, ${-cy})">
      <g clip-path="url(#${clipId})">
        ${
          imgSrc
            ? `<image href="${imgSrc}" xlink:href="${imgSrc}" x="${piece.box.x}" y="${piece.box.y}" width="${piece.box.w}" height="${piece.box.h}" preserveAspectRatio="none" />`
            : `<rect x="${piece.box.x}" y="${piece.box.y}" width="${piece.box.w}" height="${piece.box.h}" fill="${piece.panel === 'collar' ? collarColor : primaryColor}" />`
        }
      </g>
      ${showCutLines ? `<path d="${scaledPath}" class="cut-line" />` : ''}
    </g>${showProductionLabels ? `\n    <text x="${cx}" y="${labelY}" text-anchor="middle" class="piece-tag">${piece.tag} • TALLA ${activeSize}</text>` : ''}`);
  }

  const hexLuminance = (hex) => {
    const clean = String(hex || '').replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(clean)) return 0.5;
    const ch = [0, 2, 4].map((i) => {
      const c = parseInt(clean.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const pickReadableTextColor = (bgHex, preferredHex) => {
    const lBg = hexLuminance(bgHex);
    const lPref = hexLuminance(preferredHex);
    const ratio = (Math.max(lBg, lPref) + 0.05) / (Math.min(lBg, lPref) + 0.05);
    if (ratio >= 3.2) return preferredHex;
    return lBg > 0.45 ? '#0f172a' : '#ffffff';
  };

  const waistbandGroup = spec.waistband
    ? (() => {
        const wb = spec.waistband;
        const wcx = Math.round(wb.x + wb.w / 2);
        const wcy = Math.round(wb.y + wb.h / 2);
        const labelColor = pickReadableTextColor(primaryColor, secondaryColor);
        return `
    <g id="PIECE_PRETINA" transform="translate(${wcx}, ${wcy}) scale(${scaleX}, 1) translate(${-wcx}, ${-wcy})">
      <rect x="${wb.x}" y="${wb.y}" width="${wb.w}" height="${wb.h}" fill="${primaryColor}" />
      ${showCutLines ? `<rect x="${wb.x}" y="${wb.y}" width="${wb.w}" height="${wb.h}" class="cut-line" />` : ''}
    </g>${showProductionLabels ? `\n    <text x="${wcx}" y="${wcy}" text-anchor="middle" dominant-baseline="middle" font-family="'Arial Black', sans-serif" font-weight="900" font-size="24" fill="${labelColor}" letter-spacing="3">${wb.label} • TALLA ${activeSize}</text>` : ''}`;
      })()
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="100%" height="100%" viewBox="${MOLD_VIEWBOX}" preserveAspectRatio="xMidYMid meet">
  <defs>
    <style>
      ${MOLD_STYLE}
      .cut-line { stroke: #0f172a; stroke-width: 2.5; fill: none; stroke-miterlimit: 10; }
      .piece-tag { font-family: 'Arial Black', sans-serif; font-size: 20px; font-weight: 900; letter-spacing: 1.5px; fill: #334155; }
    </style>
    ${clipDefs.join('\n    ')}
  </defs>

  <g id="BACKGROUND">
    ${showRegistrationMarks ? MOLD_BACKGROUND_MARKS : ''}
    ${generateDynamicSizeBadgeSvg(activeSize, 4150, 160)}
  </g>

  <g id="DESIGN">
    ${waistbandGroup}
    ${pieceGroups.join('\n')}
  </g>
</svg>`;
}
