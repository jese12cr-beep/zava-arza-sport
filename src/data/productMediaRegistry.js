import { resolveAssetUrl } from '../utils/assetUrl';

export const PRODUCT_MEDIA_REGISTRY = {
  futbol_jersey_pro_vneck: {
    image: resolveAssetUrl('assets/showcase/futbol_f3_jersey.jpg'),
    tag: 'Molde Principal',
    kind: 'jersey',
    fitLabel: 'Corte Caballero',
    fabricSummary: 'TS-Tex™ 145g',
    desc: 'Jersey ZAVA Apex V1 con cuello ergonómico, tejido TS-Tex y 44 cortes de sublimación.',
  },
  futbol_jersey_f3w_women: {
    image: resolveAssetUrl('assets/showcase/futbol_f3w_women.jpg'),
    tag: 'Patronaje Dama',
    kind: 'jersey',
    fitLabel: 'Corte Dama',
    fabricSummary: 'TS-Tex™ 145g',
    desc: 'Jersey ZAVA Femme V1 entallado para mujer con ajuste en cintura, sisa y hombros.',
  },
  football_shorts_fp3: {
    image: resolveAssetUrl('assets/showcase/shorts_fp3_matchday.jpg'),
    tag: 'Kit ZAVA Apex',
    kind: 'shorts',
    fitLabel: 'Unisex / Mixto',
    fabricSummary: 'SR-Tex™ 160g',
    desc: 'Short ZAVA Match S1 en tejido SR-Tex anti-fricción con pretina elástica y dorsal.',
  },
  basketball_b6_hero: {
    image: resolveAssetUrl('assets/showcase/basket_b6_men.jpg'),
    tag: 'Normativa FIBA',
    kind: 'tank',
    fitLabel: 'Corte Caballero',
    fabricSummary: 'K-Tex 2™ 155g',
    desc: 'Tank sin mangas ZAVA Court B1 en CoolDry™ Hex con 19 cortes deportivos configurables.',
  },
  basketball_shorts_bp6: {
    image: resolveAssetUrl('assets/showcase/basket_shorts_bp6_men.jpg'),
    tag: 'Corte Arena',
    kind: 'shorts',
    fitLabel: 'Corte Caballero',
    fabricSummary: 'K-Tex 2™ 155g',
    desc: 'Short largo ZAVA Court SB1 con abertura lateral y costura reforzada de competición.',
  },
  basketball_b7w_epic_women: {
    image: resolveAssetUrl('assets/showcase/basket_b7w_women.jpg'),
    tag: '7 Paneles Dama',
    kind: 'tank',
    fitLabel: 'Corte Dama',
    fabricSummary: 'K-Tex 2™ 155g',
    desc: 'Tank femenino ZAVA Femme BW1 con costados independientes y ribetes personalizables.',
  },
  basketball_shorts_bp7w_women: {
    image: resolveAssetUrl('assets/showcase/basket_shorts_bp7w_women.jpg'),
    tag: '7 Piezas Dama',
    kind: 'shorts',
    fitLabel: 'Corte Dama',
    fabricSummary: 'K-Tex 2™ 155g',
    desc: 'Short femenino ZAVA Femme SBW1 con bandas laterales y pretina anatómica.',
  },
  jacket_softshell_601m_men: {
    image: resolveAssetUrl('assets/showcase/jacket_601m_softshell.jpg'),
    tag: 'Concentración',
    kind: 'jacket',
    fitLabel: 'Corte Caballero',
    fabricSummary: 'K-Tex Wind 280g',
    desc: 'Chamarra Softshell ZAVA Shield J1 cortavientos 3 capas con 11 piezas sublimables.',
  },
  jacket_softshell_601w_women: {
    image: resolveAssetUrl('assets/showcase/jacket_601w_women.jpg'),
    tag: 'Corte Dama J1W',
    kind: 'jacket',
    fitLabel: 'Corte Dama',
    fabricSummary: 'K-Tex Wind 280g',
    desc: 'Chamarra técnica ZAVA Femme JW1 térmica y transpirable adaptada a silueta femenina.',
  },
  esports_pro_jersey: {
    image: resolveAssetUrl('assets/showcase/esports_e1_jersey.jpg'),
    tag: 'Torneos Gaming',
    kind: 'jersey',
    fitLabel: 'Unisex / Arena',
    fabricSummary: 'TS-Tex Ultra 140g',
    desc: 'Jersey ZAVA Arena E1 ultraligero con gamertag individual y sponsors sin límite.',
  },
  portero_gk_set: {
    image: resolveAssetUrl('assets/showcase/portero_gk_set.jpg'),
    tag: 'Portero Manga Larga + Guantes',
    kind: 'jersey',
    fitLabel: 'Portero Profesional',
    fabricSummary: 'TS-Tex™ + Látex 4mm',
    desc: 'Jersey de portero manga larga obligatoria con puños elásticos y par de guantes profesionales personalizables.',
  },
  cap_snapback_6panel: {
    image: resolveAssetUrl('assets/showcase/sample_fabric_box.jpg'),
    tag: 'Complemento',
    kind: 'cap',
    fitLabel: 'Talla Única',
    fabricSummary: 'Twill Estructurado',
    desc: 'Gorra estructurada ZAVA G1 de 6 paneles personalizada con el emblema de tu equipo.',
  },
  bottle_inox_laser_750: {
    image: resolveAssetUrl('assets/showcase/sample_fabric_box.jpg'),
    tag: 'Hidratación',
    kind: 'bottle',
    fitLabel: '750 ml Inox',
    fabricSummary: 'Acero 18/8',
    desc: 'Termo deportivo acero inox ZAVA 750ml grabado con escudo y número de jugador.',
  },
  shinguards_carbon_pro: {
    image: resolveAssetUrl('assets/showcase/sample_fabric_box.jpg'),
    tag: 'Protección',
    kind: 'shinguards',
    fitLabel: 'Unisex Pro',
    fabricSummary: 'Carcasa Sublimada',
    desc: 'Espinilleras ligeras ZAVA P1 sublimadas a todo color con dorsal y escudo personal.',
  },
};

export function getProductMedia(productId) {
  return (
    PRODUCT_MEDIA_REGISTRY[productId] || {
      image: resolveAssetUrl('assets/showcase/futbol_f3_jersey.jpg'),
      tag: 'ARZA Pro',
      kind: 'jersey',
      fitLabel: 'Unisex',
      fabricSummary: 'TS-Tex™ 145g',
      desc: 'Prenda deportiva técnica ARZA SPORT personalizable en vivo.',
    }
  );
}
