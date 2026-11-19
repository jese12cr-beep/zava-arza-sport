import React, { useState, useId } from 'react';
import { Ruler, Package, Check, Send, ShieldCheck, Info } from 'lucide-react';
import { resolveAssetUrl } from '../utils/assetUrl';

const SIZE_TABLES = {
  men: {
    label: 'Caballero / Unisex (ARZA Pro)',
    headers: ['Talla', 'Pecho (cm)', 'Cintura (cm)', 'Largo Espalda (cm)', 'Estatura Recomendada'],
    rows: [
      ['XS', '82 - 87', '70 - 75', '69', '160 - 168 cm'],
      ['S', '88 - 94', '76 - 82', '71', '165 - 173 cm'],
      ['M', '95 - 102', '83 - 90', '73', '172 - 180 cm'],
      ['L', '103 - 110', '91 - 98', '75', '178 - 186 cm'],
      ['XL', '111 - 118', '99 - 106', '77', '184 - 192 cm'],
      ['2XL', '119 - 126', '107 - 114', '79', '188 - 196 cm'],
    ],
  },
  women: {
    label: 'Dama (Corte ZAVA Femme)',
    headers: ['Talla', 'Pecho (cm)', 'Cintura (cm)', 'Cadera (cm)', 'Largo Espalda (cm)'],
    rows: [
      ['XS', '80 - 85', '64 - 69', '88 - 93', '63'],
      ['S', '86 - 91', '70 - 75', '94 - 99', '65'],
      ['M', '92 - 97', '76 - 81', '100 - 105', '67'],
      ['L', '98 - 103', '82 - 87', '106 - 111', '69'],
      ['XL', '104 - 109', '88 - 93', '112 - 117', '71'],
      ['2XL', '110 - 116', '94 - 100', '118 - 124', '73'],
    ],
  },
  kids: {
    label: 'Junior / Academia',
    headers: ['Talla / Edad', 'Estatura (cm)', 'Pecho (cm)', 'Cintura (cm)', 'Largo (cm)'],
    rows: [
      ['116 (6 años)', '111 - 116', '58 - 62', '53 - 56', '49'],
      ['128 (8 años)', '123 - 128', '63 - 67', '57 - 60', '53'],
      ['140 (10 años)', '135 - 140', '68 - 73', '61 - 65', '57'],
      ['152 (12 años)', '147 - 152', '74 - 79', '66 - 70', '61'],
      ['164 (14 años)', '159 - 164', '80 - 85', '71 - 75', '65'],
    ],
  },
};

export default function SizeGuideAndSamples() {
  const formId = useId();
  const [activeTab, setActiveTab] = useState('sizes');
  const [sizeCategory, setSizeCategory] = useState('men');
  const [sampleSubmitted, setSampleSubmitted] = useState(false);
  const [sampleForm, setSampleForm] = useState({
    clubName: '',
    contactName: '',
    email: '',
    phone: '',
    sport: 'futbol',
  });

  const handleSampleSubmit = (e) => {
    e.preventDefault();
    setSampleSubmitted(true);
  };

  return (
    <section id="tallas-muestras" className="py-16 sm:py-24 bg-neutral-100 border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C24100] block">
              Patronaje Anatómico Garantizado
            </span>
            <h2 className="font-display-hero font-extrabold uppercase text-[#111111] arza-section-headline">
              Guía de Tallas &amp; Muestras Zava
            </h2>
            <p className="text-[#757575] text-sm sm:text-base max-w-xl">
              Consulta las tablas oficiales por disciplina o solicita un muestrario físico de telas y tallas para tu club.
            </p>
          </div>

          <div className="inline-flex rounded-full bg-white p-1 border border-neutral-200 self-start md:self-auto" role="tablist" aria-label="Tallas o Muestras">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'sizes'}
              onClick={() => setActiveTab('sizes')}
              className={`px-5 min-h-10 rounded-full text-xs font-semibold transition-colors inline-flex items-center gap-2 cursor-pointer ${
                activeTab === 'sizes'
                  ? 'bg-neutral-950 text-white'
                  : 'text-neutral-700 hover:text-neutral-950'
              }`}
            >
              <Ruler className="w-4 h-4" aria-hidden="true" />
              <span>Tabla de Tallas</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'samples'}
              onClick={() => setActiveTab('samples')}
              className={`px-5 min-h-10 rounded-full text-xs font-semibold transition-colors inline-flex items-center gap-2 cursor-pointer ${
                activeTab === 'samples'
                  ? 'bg-neutral-950 text-white'
                  : 'text-neutral-700 hover:text-neutral-950'
              }`}
            >
              <Package className="w-4 h-4" aria-hidden="true" />
              <span>Solicitar Muestras</span>
            </button>
          </div>
        </div>

        {activeTab === 'sizes' ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-neutral-200">
              <div className="flex flex-wrap gap-2">
                {Object.keys(SIZE_TABLES).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSizeCategory(key)}
                    aria-pressed={sizeCategory === key}
                    className={`px-4 min-h-10 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      sizeCategory === key
                        ? 'bg-neutral-950 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {SIZE_TABLES[key].label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-neutral-600">
                <Info className="w-4 h-4 text-neutral-950 shrink-0" aria-hidden="true" />
                <span>Medidas corporales expresadas en centímetros (cm).</span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-neutral-200">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-neutral-100 text-neutral-700 font-bold uppercase text-[11px] tracking-wider border-b border-neutral-200">
                  <tr>
                    {SIZE_TABLES[sizeCategory].headers.map((h) => (
                      <th key={h} scope="col" className="py-3.5 px-4 font-bold text-neutral-900">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-neutral-700 font-medium tabular-nums-pro">
                  {SIZE_TABLES[sizeCategory].rows.map((row) => (
                    <tr key={row[0]} className="hover:bg-neutral-50 transition-colors">
                      {row.map((cell, cIdx) =>
                        cIdx === 0 ? (
                          <th key={cIdx} scope="row" className="py-3.5 px-4 font-extrabold text-neutral-950 bg-neutral-50 text-left">
                            {cell}
                          </th>
                        ) : (
                          <td key={cIdx} className="py-3.5 px-4">
                            {cell}
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-neutral-200 text-xs text-neutral-600">
              <div className="p-4 rounded-xl bg-neutral-100">
                <span className="font-bold text-neutral-950 block mb-1">A. Contorno de Pecho</span>
                Mide horizontalmente alrededor de la parte más ancha pasando por debajo de las axilas sin apretar.
              </div>
              <div className="p-4 rounded-xl bg-neutral-100">
                <span className="font-bold text-neutral-950 block mb-1">B. Cintura Natural</span>
                Mide la circunferencia relajada por encima de la cadera.
              </div>
              <div className="p-4 rounded-xl bg-neutral-100">
                <span className="font-bold text-neutral-950 block mb-1">C. Ajuste Recomendado</span>
                Elige la talla menor para corte atlético ceñido, o la superior para uso holgado con térmica debajo.
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-5">
              <span className="inline-block px-3 py-1 rounded-full bg-neutral-950 text-white text-[11px] font-bold uppercase tracking-wider">
                Servicio de Prueba Zava
              </span>
              <h3 className="font-display-hero text-2xl sm:text-3xl font-extrabold uppercase text-neutral-950">
                Prueba Tallas y Telas Reales Antes de Ordenar
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Enviamos caja con prendas físicas en tallas escaladas y carta cromática sublimada en tela original ARZA SPORT.
              </p>

              <div className="relative rounded-xl overflow-hidden border border-neutral-200 aspect-[16/10] bg-neutral-900">
                <img
                  src={resolveAssetUrl('assets/showcase/sample_fabric_box.jpg')}
                  alt="Caja de Muestras Oficial ARZA SPORT por Grupo Zava"
                  className="w-full h-full object-cover"
                />
              </div>

              <ul className="space-y-2 text-xs font-semibold text-neutral-800" role="list">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-neutral-950 shrink-0" aria-hidden="true" />
                  <span>Muestras de Fútbol, Baloncesto y Chamarra Shield J1.</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-neutral-950 shrink-0" aria-hidden="true" />
                  <span>Carta de colores sublimada a 210°C en tejido real.</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-7 bg-neutral-100 p-6 sm:p-8 rounded-2xl border border-neutral-200">
              {sampleSubmitted ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-neutral-950 text-white flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-7 h-7" aria-hidden="true" />
                  </div>
                  <h4 className="text-xl font-bold text-neutral-950">Solicitud Recibida</h4>
                  <p className="text-xs text-neutral-600 max-w-md mx-auto">
                    El equipo Zava contactará a <strong>{sampleForm.contactName}</strong> en menos de 24 horas para coordinar el envío a ({sampleForm.clubName}).
                  </p>
                  <button
                    type="button"
                    onClick={() => setSampleSubmitted(false)}
                    className="px-5 min-h-10 rounded-full bg-neutral-950 text-white text-xs font-semibold cursor-pointer"
                  >
                    Enviar otra solicitud
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSampleSubmit} className="space-y-4">
                  <h4 className="text-base font-bold text-neutral-950">Solicitar Muestrario Físico</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`${formId}-club`} className="text-xs font-semibold text-neutral-800 block mb-1">
                        Club o Entidad *
                      </label>
                      <input
                        id={`${formId}-club`}
                        type="text"
                        required
                        autoComplete="organization"
                        placeholder="Ej. Deportivo Zava Norte"
                        value={sampleForm.clubName}
                        onChange={(e) => setSampleForm({ ...sampleForm, clubName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white text-xs text-neutral-950"
                      />
                    </div>
                    <div>
                      <label htmlFor={`${formId}-contact`} className="text-xs font-semibold text-neutral-800 block mb-1">
                        Persona de Contacto *
                      </label>
                      <input
                        id={`${formId}-contact`}
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="Nombre completo"
                        value={sampleForm.contactName}
                        onChange={(e) => setSampleForm({ ...sampleForm, contactName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white text-xs text-neutral-950"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`${formId}-email`} className="text-xs font-semibold text-neutral-800 block mb-1">
                        Correo Electrónico *
                      </label>
                      <input
                        id={`${formId}-email`}
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="correo@club.com"
                        value={sampleForm.email}
                        onChange={(e) => setSampleForm({ ...sampleForm, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white text-xs text-neutral-950"
                      />
                    </div>
                    <div>
                      <label htmlFor={`${formId}-phone`} className="text-xs font-semibold text-neutral-800 block mb-1">
                        Teléfono / WhatsApp *
                      </label>
                      <input
                        id={`${formId}-phone`}
                        type="tel"
                        required
                        autoComplete="tel"
                        placeholder="+52 55 1234 5678"
                        value={sampleForm.phone}
                        onChange={(e) => setSampleForm({ ...sampleForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white text-xs text-neutral-950"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor={`${formId}-sport`} className="text-xs font-semibold text-neutral-800 block mb-1">
                      Disciplina Principal
                    </label>
                    <select
                      id={`${formId}-sport`}
                      value={sampleForm.sport}
                      onChange={(e) => setSampleForm({ ...sampleForm, sport: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-white text-xs text-neutral-950"
                    >
                      <option value="futbol">Fútbol / Fútbol Sala</option>
                      <option value="basket">Baloncesto</option>
                      <option value="chaquetas">Chamarras Técnicas</option>
                      <option value="completo">Muestrario Completo ARZA</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full min-h-11 rounded-full bg-[#FA5400] hover:bg-[#ff6a1f] text-[#111111] font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" aria-hidden="true" />
                    <span>Enviar Solicitud de Muestras</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
