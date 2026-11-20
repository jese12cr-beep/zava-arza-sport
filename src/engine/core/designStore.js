/**
 * ATLETIQ Engine v5.0 — Catálogo 3D Exacto de 4 Moldes `.mirl` + 52 Plantillas `.fish` (Fútbol & Baloncesto: Camisetas + Shorts),
 * Sistema Cromático de 167 Colores Pantone® / CM5, Fuentes Atléticas y Estado Multi-Prenda (Kit Sincronizable)
 */

import {
  PANTONE_CM5_PALETTE,
  FOOTBALL_FISH_DESIGNS,
  FOOTBALL_SHORTS_FISH_DESIGNS,
  BASKETBALL_FISH_DESIGNS,
  BASKETBALL_SHORTS_FISH_DESIGNS,
  BASKETBALL_WOMEN_FISH_DESIGNS,
  BASKETBALL_SHORTS_WOMEN_FISH_DESIGNS,
  JACKET_MEN_FISH_DESIGNS,
  JACKET_WOMEN_FISH_DESIGNS,
} from './palette152.js';
import { getPartSpec } from './boundingBoxMath.js';

export {
  PANTONE_CM5_PALETTE,
  FOOTBALL_FISH_DESIGNS,
  FOOTBALL_SHORTS_FISH_DESIGNS,
  BASKETBALL_FISH_DESIGNS,
  BASKETBALL_SHORTS_FISH_DESIGNS,
  BASKETBALL_WOMEN_FISH_DESIGNS,
  BASKETBALL_SHORTS_WOMEN_FISH_DESIGNS,
  JACKET_MEN_FISH_DESIGNS,
  JACKET_WOMEN_FISH_DESIGNS,
};

export const ENGINE_PRODUCTS = [
  {
    id: 'futbol_jersey_pro_vneck',
    name: 'Jersey Fútbol ZAVA Apex V1',
    shortName: 'Jersey Fútbol',
    sport: 'Fútbol',
    gender: 'men',
    garmentCategory: 'jersey',
    pairedProductId: 'football_shorts_fp3',
    renderMode: 'WEBGL_3D_PBR',
    garmentShape: 'jersey_short',
    mirlUrl: '/models/football_f3_ka.mirl',
    mirlKey: 'football_f3_ka',
    owayoCutCode: 'ARZA-Z01M',
    defaultFabricId: 'ts_tex_football',
    defaultDesignId: 'tackle',
    basePrice: 34.0,
    shopifyVariantBase: 44901234567001,
    badge: 'Molde Maestro Zava • 29 Cortes Exclusivos',
  },
  {
    id: 'futbol_jersey_f3w_women',
    name: 'Jersey Fútbol ZAVA Femme V1',
    shortName: 'Jersey Dama Z01W',
    sport: 'Fútbol',
    gender: 'women',
    garmentCategory: 'jersey',
    pairedProductId: 'football_shorts_fp3',
    renderMode: 'WEBGL_3D_PBR',
    garmentShape: 'jersey_short',
    mirlUrl: '/models/football_f3w_women.mirl',
    mirlKey: 'football_f3w_women',
    owayoCutCode: 'ARZA-Z01W',
    defaultFabricId: 'ts_tex_football',
    defaultDesignId: 'tackle',
    basePrice: 34.0,
    shopifyVariantBase: 44901234567002,
    badge: 'Corte Dama Anatómico • 29 Cortes Exclusivos',
  },
  {
    id: 'football_shorts_fp3',
    name: 'Short Fútbol ZAVA Match S1',
    shortName: 'Short Fútbol',
    sport: 'Fútbol',
    gender: 'men',
    garmentCategory: 'shorts',
    pairedProductId: 'futbol_jersey_pro_vneck',
    renderMode: 'WEBGL_3D_PBR',
    garmentShape: 'football_shorts',
    mirlUrl: '/models/football_shorts_fp3.mirl',
    mirlKey: 'football_shorts_fp3',
    owayoCutCode: 'ARZA-S01M',
    defaultFabricId: 'sr_tex_shorts',
    defaultDesignId: 'city',
    basePrice: 22.0,
    shopifyVariantBase: 44901234567101,
    badge: 'Molde Matchday • 9 Cortes Deportivos',
  },
  {
    id: 'basketball_b6_hero',
    name: 'Tank Basket ZAVA Court B1',
    shortName: 'Tank Basket',
    sport: 'Baloncesto',
    gender: 'men',
    garmentCategory: 'jersey',
    pairedProductId: 'basketball_shorts_bp6',
    renderMode: 'WEBGL_3D_PBR',
    garmentShape: 'basketball_tank',
    mirlUrl: '/models/basketball_b6_hero.mirl',
    mirlKey: 'basketball_b6_hero',
    owayoCutCode: 'ARZA-B01M',
    defaultFabricId: 'cooldry_hex',
    defaultDesignId: 'legend',
    basePrice: 32.5,
    shopifyVariantBase: 44901234567007,
    badge: 'Patronaje Arena Pro • 19 Cortes Exclusivos',
  },
  {
    id: 'basketball_shorts_bp6',
    name: 'Short Basket ZAVA Court SB1',
    shortName: 'Short Basket',
    sport: 'Baloncesto',
    gender: 'men',
    garmentCategory: 'shorts',
    pairedProductId: 'basketball_b6_hero',
    renderMode: 'WEBGL_3D_PBR',
    garmentShape: 'basketball_shorts',
    mirlUrl: '/models/basketball_shorts_bp6.mirl',
    mirlKey: 'basketball_shorts_bp6',
    owayoCutCode: 'ARZA-SB01M',
    defaultFabricId: 'cooldry_hex',
    defaultDesignId: 'legend',
    basePrice: 26.5,
    shopifyVariantBase: 44901234567201,
    badge: 'Silueta Larga FIBA • 6 Cortes Exclusivos',
  },
  {
    id: 'basketball_b7w_epic_women',
    name: 'Tank Basket ZAVA Femme BW1',
    shortName: 'Tank Dama BW1',
    sport: 'Baloncesto',
    gender: 'women',
    garmentCategory: 'jersey',
    pairedProductId: 'basketball_shorts_bp7w_women',
    renderMode: 'WEBGL_3D_PBR',
    garmentShape: 'basketball_tank',
    mirlUrl: '/models/basketball_b7w_epic_women.mirl',
    mirlKey: 'basketball_b7w_epic_women',
    owayoCutCode: 'ARZA-B01W',
    defaultFabricId: 'cooldry_hex',
    defaultDesignId: 'legend',
    basePrice: 33.5,
    shopifyVariantBase: 44901234567301,
    badge: '7 Paneles Anatómicos Dama • 9 Cortes',
  },
  {
    id: 'basketball_shorts_bp7w_women',
    name: 'Short Basket ZAVA Femme SBW1',
    shortName: 'Short Dama SBW1',
    sport: 'Baloncesto',
    gender: 'women',
    garmentCategory: 'shorts',
    pairedProductId: 'basketball_b7w_epic_women',
    renderMode: 'WEBGL_3D_PBR',
    garmentShape: 'basketball_shorts',
    mirlUrl: '/models/basketball_shorts_bp7w_women.mirl',
    mirlKey: 'basketball_shorts_bp7w_women',
    owayoCutCode: 'ARZA-SB01W',
    defaultFabricId: 'cooldry_hex',
    defaultDesignId: 'pure',
    basePrice: 27.5,
    shopifyVariantBase: 44901234567401,
    badge: '7 Piezas Corte Dama • 9 Cortes Exclusivos',
  },
  {
    id: 'jacket_softshell_601m_men',
    name: 'Chamarra Softshell ZAVA Shield J1',
    shortName: 'Chamarra J1',
    sport: 'Chaquetas',
    gender: 'men',
    garmentCategory: 'jacket',
    pairedProductId: 'jacket_softshell_601w_women',
    renderMode: 'WEBGL_3D_PBR',
    garmentShape: 'jacket_zipper',
    mirlUrl: '/models/jacket_softshell_601m_men.mirl',
    mirlKey: 'jacket_softshell_601m_men',
    owayoCutCode: 'ARZA-J01M',
    defaultFabricId: 'k_tex_wind',
    defaultDesignId: 'velo',
    basePrice: 68.0,
    shopifyVariantBase: 44901234567501,
    badge: '11 Piezas Cortavientos • Cierre Frontal',
  },
  {
    id: 'jacket_softshell_601w_women',
    name: 'Chamarra Softshell ZAVA Femme JW1',
    shortName: 'Chamarra Dama JW1',
    sport: 'Chaquetas',
    gender: 'women',
    garmentCategory: 'jacket',
    pairedProductId: 'jacket_softshell_601m_men',
    renderMode: 'WEBGL_3D_PBR',
    garmentShape: 'jacket_zipper',
    mirlUrl: '/models/jacket_softshell_601w_women.mirl',
    mirlKey: 'jacket_softshell_601w_women',
    owayoCutCode: 'ARZA-J01W',
    defaultFabricId: 'k_tex_wind',
    defaultDesignId: 'peloton',
    basePrice: 68.0,
    shopifyVariantBase: 44901234567601,
    badge: '11 Piezas Entallado Mujer • 9 Cortes',
  },
  {
    id: 'esports_pro_jersey',
    name: 'Jersey Arena E-Sports ZAVA E1',
    shortName: 'Jersey E-Sports',
    sport: 'E-Sports',
    gender: 'men',
    garmentCategory: 'jersey',
    pairedProductId: 'football_shorts_fp3',
    renderMode: 'WEBGL_3D_PBR',
    garmentShape: 'jersey_crew',
    mirlUrl: '/models/football_f3_ka.mirl',
    mirlKey: 'football_f3_ka',
    owayoCutCode: 'ARZA-E01M',
    defaultFabricId: 'ts_tex_football',
    defaultDesignId: 'gladiator',
    basePrice: 36.0,
    shopifyVariantBase: 44901234567003,
    badge: 'Molde Zava Gaming • Sublimación Full',
  },
  {
    id: 'cap_snapback_6panel',
    name: 'Gorra Snapback ZAVA G1',
    shortName: 'Gorra ARZA',
    sport: 'Accesorios',
    garmentCategory: 'accessory',
    renderMode: 'FAUX_3D_LAYERED_WEBP',
    accessoryType: 'cap',
    owayoCutCode: 'ARZA-G01',
    basePrice: 21.0,
    shopifyVariantBase: 44901234567004,
    badge: 'Personalización 6-Panel ARZA',
  },
  {
    id: 'bottle_inox_laser_750',
    name: 'Termo Inox ZAVA 750ml',
    shortName: 'Termo 750ml',
    sport: 'Accesorios',
    garmentCategory: 'accessory',
    renderMode: 'FAUX_3D_LAYERED_WEBP',
    accessoryType: 'bottle',
    owayoCutCode: 'ARZA-T750',
    basePrice: 18.5,
    shopifyVariantBase: 44901234567005,
    badge: 'Grabado Láser Personalizado',
  },
  {
    id: 'shinguards_carbon_pro',
    name: 'Espinilleras Carbon ZAVA P1',
    shortName: 'Espinilleras',
    sport: 'Accesorios',
    garmentCategory: 'accessory',
    renderMode: 'FAUX_3D_LAYERED_WEBP',
    accessoryType: 'shinguards',
    owayoCutCode: 'ARZA-P01',
    basePrice: 25.0,
    shopifyVariantBase: 44901234567006,
    badge: 'Protección Sublimada Zava',
  },
];

export function getDesignsForProduct(productModelId = 'futbol_jersey_pro_vneck') {
  switch (productModelId) {
    case 'basketball_b6_hero':
      return BASKETBALL_FISH_DESIGNS;
    case 'basketball_shorts_bp6':
      return BASKETBALL_SHORTS_FISH_DESIGNS;
    case 'basketball_b7w_epic_women':
      return BASKETBALL_WOMEN_FISH_DESIGNS;
    case 'basketball_shorts_bp7w_women':
      return BASKETBALL_SHORTS_WOMEN_FISH_DESIGNS;
    case 'jacket_softshell_601m_men':
      return JACKET_MEN_FISH_DESIGNS;
    case 'jacket_softshell_601w_women':
      return JACKET_WOMEN_FISH_DESIGNS;
    case 'football_shorts_fp3':
      return FOOTBALL_SHORTS_FISH_DESIGNS;
    case 'futbol_jersey_f3w_women':
    case 'futbol_jersey_pro_vneck':
    default:
      return FOOTBALL_FISH_DESIGNS;
  }
}

export const TEXTILE_COLORS = PANTONE_CM5_PALETTE;

export const VECTOR_PATTERNS = FOOTBALL_FISH_DESIGNS.map((d) => ({
  id: d.id,
  name: d.name,
  subtitle: `Zonas ${d.baseColors.join('+')} • HD`,
}));

export const ZONE_SURFACE_PATTERNS = [
  { id: 'none', name: 'Liso Limpio', desc: 'Color Pantone sólido puro' },
  { id: 'hex_carbon', name: 'Panal Hexagonal', desc: 'Micro-malla geométrica e-sports/fútbol' },
  { id: 'speed_lines', name: 'Líneas Velocidad', desc: 'Trama diagonal aerodinámica' },
  { id: 'halftone_dots', name: 'Degradado Halftone', desc: 'Puntos progresivos de competición' },
  { id: 'micro_chevrons', name: 'Espiga Jacquard', desc: 'Textura tejida en V tipo estadio' },
  { id: 'diag_pinstripes', name: 'Filetes Finos', desc: 'Rayado sutil a 45° tono sobre tono' },
];

export const VECTOR_CREST_PRESETS = [
  { id: 'arza_official', name: 'ARZA SPORT Oficial', category: 'Oficial' },
  { id: 'royal_shield', name: 'Escudo Club Pro', category: 'Escudos' },
  { id: 'eagle_hex', name: 'Emblema Hexagonal', category: 'Escudos' },
  { id: 'circle_badge', name: 'Sello Redondo FC', category: 'Escudos' },
  { id: 'league_patch', name: 'Parche Oficial Liga', category: 'Parches' },
  { id: 'three_stars', name: '3 Estrellas Campeón', category: 'Insignias' },
  { id: 'esports_bolt', name: 'Rayo Pro Arena', category: 'E-Sports' },
  { id: 'crown_crest', name: 'Corona Real Oro', category: 'Insignias' },
  { id: 'wing_emblem', name: 'Alas Velocidad', category: 'Sponsor' },
];

export const FABRIC_WEAVES = [
  {
    id: 'ts_tex_football',
    name: 'TS-Tex™ Fútbol Ultra-Dry 145g',
    shortName: 'TS-Tex™ Ultra-Dry',
    subtitle: 'Microperforado transpirable de alta ligereza',
    gsm: 145,
    bumpUrl: '/fabrics/ts-tex.png',
    uvRepeat: 48,
    normalScale: 0.34,
    bumpScale: -0.004,
    roughness: 0.52,
    desc: 'Tejido técnico transpirable ZAVA Apex V1 de secado rápido (scaleStoff 0.50×0.60)',
  },
  {
    id: 'cooldry_hex',
    name: 'K-Tex 2™ Basket Micromesh 155g',
    shortName: 'K-Tex 2™ Micromesh',
    subtitle: 'Malla panal abierta de máximo flujo de aire',
    gsm: 155,
    bumpUrl: '/fabrics/k-tex2.png',
    uvRepeat: 44,
    normalScale: 0.42,
    bumpScale: -0.0075,
    roughness: 0.56,
    desc: 'Malla abierta de alto flujo de aire para tanques ZAVA Court B1 y shorts SB1',
  },
  {
    id: 'sr_tex_shorts',
    name: 'SR-Tex™ Anti-Fricción Shorts 160g',
    shortName: 'SR-Tex™ Anti-Fricción',
    subtitle: 'Trama elástica de alta resistencia al roce',
    gsm: 160,
    bumpUrl: '/fabrics/sr-tex.png',
    uvRepeat: 38,
    normalScale: 0.38,
    bumpScale: -0.004,
    roughness: 0.50,
    desc: 'Poliéster elástico resistente al deslizamiento para shorts ZAVA Match S1',
  },
  {
    id: 'pique_heavy',
    name: 'R-Tex 3™ Ribete & Piqué 210g',
    shortName: 'R-Tex 3™ Piqué',
    subtitle: 'Relieve acanalado estructural de alta densidad',
    gsm: 210,
    bumpUrl: '/fabrics/bandstoff-rtex3.png',
    uvRepeat: 34,
    normalScale: 0.52,
    bumpScale: -0.009,
    roughness: 0.65,
    desc: 'Trama acanalada elástica para cuellos, sisas de 48mm y refuerzos',
  },
];

export const SPORT_FONTS = [
  { id: 'F-101', name: 'Varsity Premier', label: 'Varsity Premier (Bebas)', family: "'Bebas Neue', sans-serif" },
  { id: 'F-102', name: 'Athletic Tall', label: 'Athletic Tall (Teko)', family: "'Teko', sans-serif" },
  { id: 'F-103', name: 'Cyber Strike', label: 'Cyber Strike (Chakra)', family: "'Chakra Petch', sans-serif" },
  { id: 'F-104', name: 'Stadium Block', label: 'Stadium Block (Anton)', family: "'Anton', sans-serif" },
  { id: 'F-105', name: 'Bundesliga Cond', label: 'Bundesliga Cond (Oswald)', family: "'Oswald', sans-serif" },
  { id: 'F-106', name: 'Motorsports Pro', label: 'Motorsports Pro (Russo)', family: "'Russo One', sans-serif" },
  { id: 'F-107', name: 'Tactical Stencil', label: 'Tactical Stencil (Black Ops)', family: "'Black Ops One', sans-serif" },
  { id: 'F-108', name: 'Heavy Impact', label: 'Heavy Impact (Archivo)', family: "'Archivo Black', sans-serif" },
  { id: 'F-109', name: 'Arena Tech', label: 'Arena Tech (Play)', family: "'Play', sans-serif" },
  { id: 'F-110', name: 'Pro Sans Clean', label: 'Pro Sans Clean (Outfit)', family: "'Outfit', sans-serif" },
];

export const COLOR_HARMONY_SUGGESTIONS = [
  {
    name: 'ARZA Flagship (Carbón & Naranja)',
    zones: {
      primary: { hex: '#111111', pantone: 'PMS Black 6 C', code: 'Carbón ARZA', owayoCode: 'A' },
      secondary: { hex: '#fa5400', pantone: 'PMS 1655 C', code: 'Naranja ARZA', owayoCode: 'B' },
      accents: { hex: '#ffffff', pantone: 'PMS Bright White', code: 'White 1', owayoCode: 'C' },
      quaternary: { hex: '#757575', pantone: 'PMS Cool Gray 9 C', code: 'Gris Técnico', owayoCode: 'D' },
      collar: { hex: '#fa5400', pantone: 'PMS 1655 C', code: 'Naranja ARZA', owayoCode: 'K' },
      sleeves: { hex: '#111111', pantone: 'PMS Black 6 C', code: 'Carbón ARZA', owayoCode: 'SLL/SLR' },
    },
  },
  {
    name: 'ARZA Blanco & Naranja Pro',
    zones: {
      primary: { hex: '#ffffff', pantone: 'PMS Bright White', code: 'White 1', owayoCode: 'A' },
      secondary: { hex: '#111111', pantone: 'PMS Black 6 C', code: 'Carbón ARZA', owayoCode: 'B' },
      accents: { hex: '#fa5400', pantone: 'PMS 1655 C', code: 'Naranja ARZA', owayoCode: 'C' },
      quaternary: { hex: '#757575', pantone: 'PMS Cool Gray 9 C', code: 'Gris Técnico', owayoCode: 'D' },
      collar: { hex: '#111111', pantone: 'PMS Black 6 C', code: 'Carbón ARZA', owayoCode: 'K' },
      sleeves: { hex: '#ffffff', pantone: 'PMS Bright White', code: 'White 1', owayoCode: 'SLL/SLR' },
    },
  },
  {
    name: 'ARZA Esmeralda & Carbón Glass',
    zones: {
      primary: { hex: '#111111', pantone: 'PMS Black 6 C', code: 'Carbón ARZA', owayoCode: 'A' },
      secondary: { hex: '#059669', pantone: 'PMS 3395 C', code: 'Esmeralda', owayoCode: 'B' },
      accents: { hex: '#fa5400', pantone: 'PMS 1655 C', code: 'Naranja ARZA', owayoCode: 'C' },
      quaternary: { hex: '#ffffff', pantone: 'PMS Bright White', code: 'White 1', owayoCode: 'D' },
      collar: { hex: '#059669', pantone: 'PMS 3395 C', code: 'Esmeralda', owayoCode: 'K' },
      sleeves: { hex: '#111111', pantone: 'PMS Black 6 C', code: 'Carbón ARZA', owayoCode: 'SLL/SLR' },
    },
  },
  {
    name: 'Azul Real & Oro',
    zones: {
      primary: { hex: '#0033a0', pantone: 'PMS 286 C', code: 'Royal 4', owayoCode: 'A' },
      secondary: { hex: '#0c2340', pantone: 'PMS 289 C', code: 'Navy 5', owayoCode: 'B' },
      accents: { hex: '#ffcd00', pantone: 'PMS 116 C', code: 'Yellow 4', owayoCode: 'C' },
      quaternary: { hex: '#ffffff', pantone: 'PMS Bright White', code: 'White 1', owayoCode: 'D' },
      collar: { hex: '#ffcd00', pantone: 'PMS 116 C', code: 'Yellow 4', owayoCode: 'K' },
      sleeves: { hex: '#0c2340', pantone: 'PMS 289 C', code: 'Navy 5', owayoCode: 'SLL/SLR' },
    },
  },
  {
    name: 'Carmesí & Ónix',
    zones: {
      primary: { hex: '#c8102e', pantone: 'PMS 186 C', code: 'Red 4', owayoCode: 'A' },
      secondary: { hex: '#101820', pantone: 'PMS Black 6 C', code: 'Black 5', owayoCode: 'B' },
      accents: { hex: '#ffffff', pantone: 'PMS Bright White', code: 'White 1', owayoCode: 'C' },
      quaternary: { hex: '#ffc72c', pantone: 'PMS 135 C', code: 'Gold 3', owayoCode: 'D' },
      collar: { hex: '#101820', pantone: 'PMS Black 6 C', code: 'Black 5', owayoCode: 'K' },
      sleeves: { hex: '#101820', pantone: 'PMS Black 6 C', code: 'Black 5', owayoCode: 'SLL/SLR' },
    },
  },
  {
    name: 'Menta Pro & Carbón',
    zones: {
      primary: { hex: '#00bfb3', pantone: 'PMS 3262 C', code: 'Mint 3', owayoCode: 'A' },
      secondary: { hex: '#101820', pantone: 'PMS Black 6 C', code: 'Black 5', owayoCode: 'B' },
      accents: { hex: '#ffffff', pantone: 'PMS Bright White', code: 'White 1', owayoCode: 'C' },
      quaternary: { hex: '#5bd1c5', pantone: 'PMS 3252 C', code: 'Mint 2', owayoCode: 'D' },
      collar: { hex: '#101820', pantone: 'PMS Black 6 C', code: 'Black 5', owayoCode: 'K' },
      sleeves: { hex: '#101820', pantone: 'PMS Black 6 C', code: 'Black 5', owayoCode: 'SLL/SLR' },
    },
  },
  {
    name: 'Lakers Púrpura & Oro',
    zones: {
      primary: { hex: '#330072', pantone: 'PMS 2685 C', code: 'Purple 5', owayoCode: 'A' },
      secondary: { hex: '#ffcd00', pantone: 'PMS 116 C', code: 'Yellow 4', owayoCode: 'B' },
      accents: { hex: '#ffffff', pantone: 'PMS Bright White', code: 'White 1', owayoCode: 'C' },
      quaternary: { hex: '#753bbd', pantone: 'PMS 266 C', code: 'Violet 4', owayoCode: 'D' },
      collar: { hex: '#ffcd00', pantone: 'PMS 116 C', code: 'Yellow 4', owayoCode: 'K' },
      sleeves: { hex: '#ffcd00', pantone: 'PMS 116 C', code: 'Yellow 4', owayoCode: 'SLL/SLR' },
    },
  },
  {
    name: 'Blanco Real & Marino',
    zones: {
      primary: { hex: '#ffffff', pantone: 'PMS Bright White', code: 'White 1', owayoCode: 'A' },
      secondary: { hex: '#0c2340', pantone: 'PMS 289 C', code: 'Navy 5', owayoCode: 'B' },
      accents: { hex: '#00a3e0', pantone: 'PMS 299 C', code: 'Cyan 3', owayoCode: 'C' },
      quaternary: { hex: '#b9975b', pantone: 'PMS 465 C', code: 'Gold 4', owayoCode: 'D' },
      collar: { hex: '#0c2340', pantone: 'PMS 289 C', code: 'Navy 5', owayoCode: 'K' },
      sleeves: { hex: '#ffffff', pantone: 'PMS Bright White', code: 'White 1', owayoCode: 'SLL/SLR' },
    },
  },
  {
    name: 'Verde Neón & Antracita',
    zones: {
      primary: { hex: '#101820', pantone: 'PMS Black 6 C', code: 'Black 5', owayoCode: 'A' },
      secondary: { hex: '#44d62c', pantone: 'PMS 802 C (Flúor)', code: 'Neon Green', owayoCode: 'B' },
      accents: { hex: '#ffffff', pantone: 'PMS Bright White', code: 'White 1', owayoCode: 'C' },
      quaternary: { hex: '#53565a', pantone: 'PMS Cool Gray 11 C', code: 'Grey 4', owayoCode: 'D' },
      collar: { hex: '#44d62c', pantone: 'PMS 802 C (Flúor)', code: 'Neon Green', owayoCode: 'K' },
      sleeves: { hex: '#101820', pantone: 'PMS Black 6 C', code: 'Black 5', owayoCode: 'SLL/SLR' },
    },
  },
];

export const VOLUME_TIERS = [
  { min: 1, max: 5, discountPct: 0, code: 'INDIVIDUAL', label: '1–5 uds (Precio Base)' },
  { min: 6, max: 11, discountPct: 15, code: 'TEAM_S', label: '6–11 uds (-15% Equipo)' },
  { min: 12, max: 24, discountPct: 25, code: 'TEAM_FULL', label: '12–24 uds (-25% Plantilla)' },
  { min: 25, max: 9999, discountPct: 35, code: 'CLUB_PRO', label: '25+ uds (-35% Club Oficial)' },
];

export function computeOwayoAutoContrastHex(masterHex = '#1d4ed8') {
  const clean = String(masterHex).replace('#', '');
  if (clean.length !== 6) return '#ffffff';
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return luminance > 0.36 ? '#101820' : '#ffffff';
}

export function generateDesignId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < 8; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return `des_${token}`;
}

export function createDefaultDesignForProduct(productModelId = 'futbol_jersey_pro_vneck', inheritedColorZones = null) {
  const prod = ENGINE_PRODUCTS.find((p) => p.id === productModelId) || ENGINE_PRODUCTS[0];
  const isWomenCut = prod.gender === 'women';
  const isBasketJersey = prod.id === 'basketball_b6_hero' || prod.id === 'basketball_b7w_epic_women';
  const isBasketShorts = prod.id === 'basketball_shorts_bp6' || prod.id === 'basketball_shorts_bp7w_women';
  const isFootballShorts = prod.id === 'football_shorts_fp3';
  const isJacket = prod.id === 'jacket_softshell_601m_men' || prod.id === 'jacket_softshell_601w_women';
  const isShorts = isBasketShorts || isFootballShorts;

  const frontSpec = getPartSpec(prod.id, 'front');
  const backSpec = getPartSpec(prod.id, 'back');
  const leftLegSpec = getPartSpec(prod.id, 'left_leg');
  const rightLegSpec = getPartSpec(prod.id, 'right_leg');
  const frontLeftSpec = getPartSpec(prod.id, 'front_left');
  const frontRightSpec = getPartSpec(prod.id, 'front_right');
  const rightArmSpec = getPartSpec(prod.id, 'right_arm');

  const round1 = (val) => Math.round(val * 10) / 10;

  const baseColors = inheritedColorZones
    ? structuredClone(inheritedColorZones)
    : isBasketJersey || isBasketShorts
    ? {
        primary: { hex: '#111111', pantone: 'PMS Black 6 C', code: 'Carbón ARZA', owayoCode: 'A' },
        secondary: { hex: '#fa5400', pantone: 'PMS 1655 C', code: 'Naranja ARZA', owayoCode: 'B' },
        accents: { hex: '#ffffff', pantone: 'PMS Bright White', code: 'White 1', owayoCode: 'C' },
        quaternary: { hex: '#757575', pantone: 'PMS Cool Gray 9 C', code: 'Gris Técnico', owayoCode: 'D' },
        collar: { hex: '#fa5400', pantone: 'PMS 1655 C', code: 'Naranja ARZA', owayoCode: 'K' },
        sleeves: { hex: '#111111', pantone: 'PMS Black 6 C', code: 'Carbón ARZA', owayoCode: 'SLL/SLR' },
      }
    : {
        primary: { hex: '#111111', pantone: 'PMS Black 6 C', code: 'Carbón ARZA', owayoCode: 'A' },
        secondary: { hex: '#fa5400', pantone: 'PMS 1655 C', code: 'Naranja ARZA', owayoCode: 'B' },
        accents: { hex: '#ffffff', pantone: 'PMS Bright White', code: 'White 1', owayoCode: 'C' },
        quaternary: { hex: '#757575', pantone: 'PMS Cool Gray 9 C', code: 'Gris Técnico', owayoCode: 'D' },
        collar: { hex: '#fa5400', pantone: 'PMS 1655 C', code: 'Naranja ARZA', owayoCode: 'K' },
        sleeves: { hex: '#111111', pantone: 'PMS Black 6 C', code: 'Carbón ARZA', owayoCode: 'SLL/SLR' },
      };

  const isAccessory = prod.garmentCategory === 'accessory';
  let decals = [];
  if (isFootballShorts) {
    decals = [
      {
        id: 'decal_short_brand',
        type: 'PRESET_CREST',
        presetId: 'arza_official',
        isFixed: true,
        label: 'Logo Oficial ARZA SPORT (Muslo)',
        panel: 'left_leg',
        centerMm: {
          x: round1(leftLegSpec.widthMm * (leftLegSpec.snapCenterU ?? 0.251)),
          y: round1(leftLegSpec.heightMm * (leftLegSpec.defaultPlaceV ?? 0.67)),
        },
        sizeMm: { width: 76, height: 65 },
        scale: 1,
        rotationDeg: 0,
        opacity: 1,
        blendMode: 'source-over',
        clampToZone: 'ALL',
        pinned: false,
        zIndex: 10,
        isVector: true,
        widthPx: 3200,
      },
    ];
  } else if (isBasketShorts) {
    const useSeparateLeg = prod.id === 'basketball_shorts_bp7w_women';
    const crestCenterX = round1(leftLegSpec.widthMm * (leftLegSpec.snapCenterU ?? 0.425));
    const crestCenterY = round1(leftLegSpec.heightMm * (useSeparateLeg ? 0.64 : 0.74));
    decals = [
      {
        id: 'decal_bshort_brand',
        type: 'PRESET_CREST',
        presetId: 'arza_official',
        isFixed: true,
        label: 'Logo Oficial ARZA SPORT (Muslo)',
        panel: 'left_leg',
        centerMm: { x: crestCenterX, y: crestCenterY },
        sizeMm: useSeparateLeg ? { width: 72, height: 62 } : { width: 82, height: 70 },
        scale: 1,
        rotationDeg: 0,
        opacity: 1,
        blendMode: 'source-over',
        clampToZone: 'ALL',
        pinned: false,
        zIndex: 10,
        isVector: true,
        widthPx: 3200,
      },
    ];
  } else if (isBasketJersey) {
    const teamY = isWomenCut ? round1(frontSpec.heightMm * 0.39) : 296;
    decals = [
      {
        id: 'decal_bball_team',
        type: 'PRESET_CREST',
        presetId: 'arza_official',
        isFixed: true,
        label: 'Logo Oficial ARZA SPORT (Pecho)',
        panel: 'front',
        centerMm: { x: round1(frontSpec.widthMm * 0.5), y: teamY },
        sizeMm: isWomenCut ? { width: 120, height: 103 } : { width: 140, height: 120 },
        scale: 1,
        rotationDeg: 0,
        opacity: 1,
        blendMode: 'source-over',
        clampToZone: 'ALL',
        pinned: false,
        zIndex: 20,
        isVector: true,
        widthPx: 3200,
      },
    ];
  } else if (isJacket) {
    const frCenterX = round1(frontRightSpec.widthMm * 0.64);
    const chestY = round1(frontLeftSpec.heightMm * 0.31);
    decals = [
      {
        id: 'decal_main_sponsor',
        type: 'PRESET_CREST',
        presetId: 'arza_official',
        isFixed: true,
        label: 'Logo Oficial ARZA SPORT (Pecho)',
        panel: 'front_right',
        centerMm: { x: frCenterX, y: chestY },
        sizeMm: { width: 72, height: 62 },
        scale: 1,
        rotationDeg: 0,
        opacity: 1,
        blendMode: 'source-over',
        clampToZone: 'ALL',
        pinned: false,
        zIndex: 20,
        isVector: true,
        widthPx: 3200,
      },
    ];
  } else if (isAccessory) {
    decals = [
      {
        id: 'decal_accessory_brand',
        type: 'PRESET_CREST',
        presetId: 'arza_official',
        isFixed: true,
        label: 'Logo Oficial ARZA SPORT',
        panel: 'front',
        centerMm: {
          x: round1((frontSpec?.widthMm ?? 220) * 0.5),
          y: round1((frontSpec?.heightMm ?? 220) * 0.45),
        },
        sizeMm: { width: 76, height: 65 },
        scale: 1,
        rotationDeg: 0,
        opacity: 1,
        blendMode: 'source-over',
        clampToZone: 'ALL',
        pinned: false,
        zIndex: 20,
        isVector: true,
        widthPx: 3200,
      },
    ];
  } else {
    const fCenterX = round1(frontSpec.widthMm * 0.5);
    const sponsorY = round1(frontSpec.heightMm * (isWomenCut ? 0.386 : 0.385));
    decals = [
      {
        id: 'decal_main_sponsor',
        type: 'PRESET_CREST',
        presetId: 'arza_official',
        isFixed: true,
        label: 'Logo Oficial ARZA SPORT',
        panel: 'front',
        centerMm: { x: fCenterX, y: sponsorY },
        sizeMm: isWomenCut ? { width: 148, height: 127 } : { width: 168, height: 144 },
        scale: 1,
        rotationDeg: 0,
        opacity: 1,
        blendMode: 'source-over',
        clampToZone: 'ALL',
        pinned: false,
        zIndex: 20,
        isVector: true,
        widthPx: 3200,
      },
    ];
  }

  const backCenterX = round1((backSpec?.widthMm ?? 520) * 0.5);
  const backNameY = isBasketJersey
    ? round1((backSpec?.heightMm ?? 750) * (isWomenCut ? 0.285 : 0.232))
    : isJacket
    ? round1((backSpec?.heightMm ?? 700) * 0.235)
    : round1((backSpec?.heightMm ?? 780) * 0.2);
  const backNumY = isBasketJersey
    ? round1((backSpec?.heightMm ?? 750) * (isWomenCut ? 0.51 : 0.45))
    : isJacket
    ? round1((backSpec?.heightMm ?? 700) * 0.48)
    : round1((backSpec?.heightMm ?? 780) * 0.42);
  const frontCenterX = round1((frontSpec?.widthMm ?? 519.25) * 0.5);
  const frontNumX = isBasketJersey
    ? frontCenterX
    : round1((frontSpec?.widthMm ?? 519.25) * 0.356);
  const frontNumY = isBasketJersey
    ? round1((frontSpec?.heightMm ?? 850) * (isWomenCut ? 0.57 : 0.54))
    : round1((frontSpec?.heightMm ?? 774.8) * 0.243);
  const shortsCenterX = round1((rightLegSpec?.widthMm ?? 778) * (rightLegSpec?.snapCenterU ?? 0.575));
  const shortsCenterY = round1((rightLegSpec?.heightMm ?? 624) * (prod.id === 'basketball_shorts_bp7w_women' ? 0.64 : isBasketShorts ? 0.74 : 0.67));

  return {
    designId: generateDesignId(),
    engineVersion: '5.0.0',
    productModelId: prod.id,
    collarStyle: 'v-neck',
    patternId: prod.defaultDesignId || 'pure',
    surfacePatternId: 'none',
    surfacePatternOpacity: 0.16,
    fabricWeaveId: prod.defaultFabricId || 'ts_tex_football',
    bleedEnforcement: 'SOFT_WARN',
    autoContrastHF: true,
    colorZones: baseColors,
    decals,
    variableSlots: {
      playerNameBack: {
        textObjectUUID: 'uuid-slot-name-back',
        masterID: null,
        enabled: !isShorts,
        panel: 'back',
        centerMm: { x: backCenterX, y: backNameY },
        maxWidthMm: isBasketJersey ? (isWomenCut ? 188 : 240) : isJacket ? round1((backSpec?.widthMm ?? 500) * 0.54) : isWomenCut ? 260 : 295,
        capHeightMm: isBasketJersey ? (isWomenCut ? 42 : 48) : isJacket ? 44 : isWomenCut ? 46 : 52,
        archDeg: isBasketJersey ? (isWomenCut ? 14 : 18) : 0,
        autoCondense: true,
        fontFamily: "'Bebas Neue', sans-serif",
        fillHex: '#ffffff',
        outlineHex: '#111111',
        outlineWidthMm: 3.0,
      },
      playerNumberBack: {
        textObjectUUID: 'uuid-slot-num-back',
        masterID: null,
        enabled: !isShorts,
        panel: 'back',
        centerMm: { x: backCenterX, y: backNumY },
        heightMm: isBasketJersey ? (isWomenCut ? 178 : 210) : isJacket ? 175 : isWomenCut ? 202 : 225,
        fontFamily: "'Bebas Neue', sans-serif",
        fillHex: '#ffffff',
        outlineHex: '#111111',
        inlineHex: '#fa5400',
        outlineWidthMm: 4.8,
      },
      playerNumberFront: {
        textObjectUUID: 'uuid-slot-num-front',
        masterID: 'uuid-slot-num-back',
        enabled: !isShorts && !isJacket,
        panel: 'front',
        centerMm: { x: frontNumX, y: frontNumY },
        heightMm: isBasketJersey ? (isWomenCut ? 114 : 132) : isWomenCut ? 44 : 48,
        fontFamily: "'Bebas Neue', sans-serif",
        fillHex: isBasketJersey ? '#ffffff' : '#fa5400',
        outlineHex: '#111111',
        outlineWidthMm: isBasketJersey ? 3.8 : 2.2,
      },
      playerNumberSleeve: {
        textObjectUUID: 'uuid-slot-num-sleeve',
        masterID: 'uuid-slot-num-back',
        enabled: false,
        panel: 'right_arm',
        centerMm: {
          x: round1((rightArmSpec?.widthMm ?? 505.69) * (rightArmSpec?.snapCenterU ?? 0.555)),
          y: round1((rightArmSpec?.heightMm ?? 283.5) * 0.56),
        },
        heightMm: 44,
        fontFamily: "'Bebas Neue', sans-serif",
        fillHex: '#ffffff',
        outlineHex: '#111111',
      },
      playerNumberShorts: {
        textObjectUUID: 'uuid-slot-num-shorts',
        masterID: 'uuid-slot-num-back',
        enabled: isShorts,
        panel: 'right_leg',
        centerMm: { x: shortsCenterX, y: shortsCenterY },
        heightMm: prod.id === 'basketball_shorts_bp7w_women' ? 58 : 66,
        fontFamily: "'Bebas Neue', sans-serif",
        fillHex: '#ffffff',
        outlineHex: '#111111',
        outlineWidthMm: 2.8,
      },
    },
  };
}

export function createInitialMasterDesign() {
  return createDefaultDesignForProduct('futbol_jersey_pro_vneck');
}

export const INITIAL_TEAM_ROSTER = [
  { id: 'r1', cut: 'MEN_PRO_SLIM', size: 'L', qty: 1, name: 'RODRÍGUEZ', number: '10', role: 'Capitán' },
  { id: 'r2', cut: 'MEN_PRO_SLIM', size: 'M', qty: 1, name: 'FERNÁNDEZ-GARCÍA', number: '7', role: 'Titular (Nombre Largo)' },
  { id: 'r3', cut: 'WOMEN_FIT', size: 'S', qty: 1, name: 'VALERIA M.', number: '9', role: 'Titular' },
  { id: 'r4', cut: 'MEN_CLASSIC', size: 'XL', qty: 1, name: 'SANTOS', number: '1', role: 'Portero / Pivot' },
  { id: 'r5', cut: 'YOUTH_KIDS', size: '152', qty: 2, name: 'MATEO', number: '14', role: 'Cantera' },
  { id: 'r6', cut: 'MEN_PRO_SLIM', size: 'L', qty: 1, name: 'JORDAN', number: '23', role: 'Escolta' },
];
