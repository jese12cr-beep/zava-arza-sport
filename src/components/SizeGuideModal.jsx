import React, { useEffect, useId, useRef, useState } from 'react';
import { X, Ruler, Package, Check, Send, ShieldCheck, Info, MessageCircle } from 'lucide-react';
import { resolveAssetUrl } from '../utils/assetUrl';
import { ARZA_CONTACT, buildWhatsAppUrl, saveSampleRequest } from '../utils/orderHistoryStore';

const SIZE_TABLES = {
  men: {
    label: 'Caballero / Unisex',
    headers: ['Talla', 'Pecho (cm)', 'Cintura (cm)', 'Largo Espalda (cm)', 'Estatura Sugerida'],
    rows: [
      ['XS', '82 - 87', '70 - 75', '69', '160 - 168 cm'],
      ['S', '88 - 94', '76 - 82', '71', '165 - 173 cm'],
      ['M', '95 - 102', '83 - 90', '73', '172 - 180 cm'],
      ['L', '103 - 110', '91 - 98', '75', '178 - 186 cm'],
      ['XL', '111 - 118', '99 - 106', '77', '184 - 192 cm'],
      ['2XL', '119 - 126', '107 - 114', '79', '188 - 196 cm'],
      ['3XL', '127 - 134', '115 - 122', '81', '192 - 202 cm'],
    ],
  },
  women: {
    label: 'Dama (ZAVA Femme)',
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
    headers: ['Talla', 'Estatura (cm)', 'Pecho (cm)', 'Cintura (cm)', 'Largo (cm)'],
    rows: [
      ['128 (8 años)', '123 - 128', '63 - 67', '57 - 60', '53'],
      ['140 (10 años)', '135 - 140', '68 - 73', '61 - 65', '57'],
      ['152 (12 años)', '147 - 152', '74 - 79', '66 - 70', '61'],
    ],
  },
  gloves: {
    label: 'Guantes Portero',
    headers: ['Talla Guante', 'Palma (cm)', 'Categoría Sugerida', 'Ajuste'],
    rows: [
      ['7', '17.0 - 18.0', 'Juvenil / Dama', 'Corte Negativo / Híbrido'],
      ['8', '18.1 - 19.2', 'Adulto S–M', 'Corte Negativo / Roll / Híbrido'],
      ['9', '19.3 - 20.5', 'Adulto M–L (Estándar)', 'Corte Negativo / Roll / Híbrido'],
      ['10', '20.6 - 21.8', 'Adulto L–XL', 'Corte Negativo / Roll / Híbrido'],
      ['11', '21.9 - 23.2', 'Adulto XL–XXL', 'Roll Finger / Híbrido'],
    ],
  },
};

export default function SizeGuideModal({
  isOpen,
  initialTab = 'sizes',
  onClose,
}) {
  const dialogRef = useRef(null);
  const uid = useId();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sizeCategory, setSizeCategory] = useState('men');
  const [savedSample, setSavedSample] = useState(null);
  const [sampleForm, setSampleForm] = useState({
    clubName: '',
    contactName: '',
    email: '',
    phone: '',
    sport: 'Fútbol',
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }

    const handleNativeClose = () => {
      if (isOpen) onClose();
    };
    const handleBackdropClick = (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const inside =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!inside) onClose();
    };

    dialog.addEventListener('close', handleNativeClose);
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', handleBackdropClick);
    }
    return () => {
      dialog.removeEventListener('close', handleNativeClose);
      dialog.removeEventListener('click', handleBackdropClick);
    };
  }, [isOpen, onClose]);

  const handleSampleSubmit = (e) => {
    e.preventDefault();
    const saved = saveSampleRequest(sampleForm);
    setSavedSample(saved);
  };

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby={`${uid}-title`}
      className="p-0 rounded-none sm:rounded-2xl bg-white text-[#111111] border border-[#E5E5E5] max-w-4xl w-full max-h-[92vh] backdrop:bg-black/55 backdrop:backdrop-blur-xs shadow-2xl m-auto"
    >
      <div className="flex flex-col max-h-[92vh]">
        <div className="px-6 py-5 border-b border-[#E5E5E5] flex items-center justify-between gap-4 bg-white">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C24100] block">
              Patronaje Grupo Zava
            </span>
            <h2 id={`${uid}-title`} className="text-xl sm:text-2xl font-bold text-[#111111] mt-0.5">
              Guía de Tallas y Muestras Físicas
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar guía de tallas"
            className="w-10 h-10 rounded-full bg-[#F5F5F5] hover:bg-[#E5E5E5] text-[#111111] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-[#E5E5E5] bg-[#F5F5F5] flex flex-wrap items-center gap-2" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'sizes'}
            onClick={() => setActiveTab('sizes')}
            className={`px-4 min-h-9 rounded-full text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'sizes'
                ? 'bg-[#111111] text-white'
                : 'bg-white text-[#111111] border border-[#E5E5E5] hover:bg-neutral-100'
            }`}
          >
            <Ruler className="w-4 h-4" aria-hidden="true" />
            <span>Tabla de Tallas (XS–3XL / Junior / Guantes)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'samples'}
            onClick={() => setActiveTab('samples')}
            className={`px-4 min-h-9 rounded-full text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'samples'
                ? 'bg-[#111111] text-white'
                : 'bg-white text-[#111111] border border-[#E5E5E5] hover:bg-neutral-100'
            }`}
          >
            <Package className="w-4 h-4" aria-hidden="true" />
            <span>Solicitar Caja de Muestras</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'sizes' ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {Object.keys(SIZE_TABLES).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSizeCategory(key)}
                      aria-pressed={sizeCategory === key}
                      className={`px-4 min-h-9 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                        sizeCategory === key
                          ? 'bg-[#111111] text-white'
                          : 'bg-[#F5F5F5] text-[#111111] hover:bg-[#E5E5E5]'
                      }`}
                    >
                      {SIZE_TABLES[key].label}
                    </button>
                  ))}
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-[#707072]">
                  <Info className="w-4 h-4 text-[#111111]" aria-hidden="true" />
                  Medidas corporales aproximadas en centímetros
                </span>
              </div>

              <div className="overflow-x-auto border border-[#E5E5E5]">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#F5F5F5] text-[#111111] font-bold uppercase text-[11px] tracking-wider border-b border-[#E5E5E5]">
                    <tr>
                      {SIZE_TABLES[sizeCategory].headers.map((h) => (
                        <th key={h} scope="col" className="py-3 px-4">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5] text-[#111111] tabular-nums-pro">
                    {SIZE_TABLES[sizeCategory].rows.map((row) => (
                      <tr key={row[0]} className="hover:bg-[#FAFAFA]">
                        {row.map((cell, idx) =>
                          idx === 0 ? (
                            <th key={idx} scope="row" className="py-3 px-4 font-extrabold bg-[#F9F9F9] text-left">
                              {cell}
                            </th>
                          ) : (
                            <td key={idx} className="py-3 px-4 text-[#4B4B4D]">
                              {cell}
                            </td>
                          )
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#4B4B4D]">
                <div className="p-4 bg-[#F5F5F5]">
                  <strong className="text-[#111111] block mb-1">1. Pecho / Busto</strong>
                  Mide de forma horizontal por la parte más ancha del tórax debajo de las axilas.
                </div>
                <div className="p-4 bg-[#F5F5F5]">
                  <strong className="text-[#111111] block mb-1">2. Cintura</strong>
                  Toma la medida alrededor de la cintura natural sin ajustar de más la cinta.
                </div>
                <div className="p-4 bg-[#F5F5F5]">
                  <strong className="text-[#111111] block mb-1">3. Consejo de Calce</strong>
                  El corte Slim viene ceñido; elige una talla arriba si buscas caída clásica u holgada.
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5 space-y-4">
                <div className="aspect-[16/10] bg-[#F5F5F5] overflow-hidden border border-[#E5E5E5]">
                  <img
                    src={resolveAssetUrl('assets/showcase/sample_fabric_box.jpg')}
                    alt="Caja de muestras textiles y tallas ARZA SPORT"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-base font-bold text-[#111111]">
                  Prueba telas TS-Tex™ y tallas físicas antes de confirmar tu lote
                </h3>
                <ul className="space-y-1.5 text-xs text-[#4B4B4D]" role="list">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#111111] shrink-0" aria-hidden="true" />
                    Prendas escaladas Caballero, Dama y Junior
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#111111] shrink-0" aria-hidden="true" />
                    Muestrario impreso con carta Pantone real a 210°C
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-7 bg-[#F5F5F5] p-5 border border-[#E5E5E5]">
                {savedSample ? (
                  <div className="py-6 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-[#111111] text-white flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-bold text-[#C24100]">
                        FOLIO {savedSample.folio}
                      </span>
                      <h4 className="text-lg font-bold text-[#111111] mt-0.5">
                        Solicitud de Muestrario Registrada
                      </h4>
                      <p className="text-xs text-[#4B4B4D] mt-1 max-w-md mx-auto">
                        Guardamos los datos de <strong>{savedSample.clubName}</strong>. También puedes enviarla directo por WhatsApp para agilizar el despacho.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <a
                        href={buildWhatsAppUrl(
                          `Hola ARZA SPORT, solicité la caja de muestras (${savedSample.folio}) para ${savedSample.clubName} (${savedSample.sport}). Contacto: ${savedSample.contactName}, Tel: ${savedSample.phone}, Email: ${savedSample.email}`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 min-h-10 rounded-full bg-[#111111] text-white text-xs font-semibold inline-flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" aria-hidden="true" />
                        <span>Enviar por WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => setSavedSample(null)}
                        className="px-4 min-h-10 rounded-full bg-white border border-[#111111] text-xs font-semibold cursor-pointer"
                      >
                        Nueva solicitud
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSampleSubmit} className="space-y-3.5">
                    <h4 className="text-sm font-bold text-[#111111]">Solicitar Caja de Muestras</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={`${uid}-club`} className="text-xs font-semibold text-[#111111] block mb-1">
                          Club o Academia *
                        </label>
                        <input
                          id={`${uid}-club`}
                          type="text"
                          required
                          placeholder="Ej. Deportivo Zava"
                          value={sampleForm.clubName}
                          onChange={(e) => setSampleForm({ ...sampleForm, clubName: e.target.value })}
                          className="w-full px-3 py-2.5 bg-white border border-[#E5E5E5] text-xs"
                        />
                      </div>
                      <div>
                        <label htmlFor={`${uid}-contact`} className="text-xs font-semibold text-[#111111] block mb-1">
                          Responsable *
                        </label>
                        <input
                          id={`${uid}-contact`}
                          type="text"
                          required
                          placeholder="Nombre completo"
                          value={sampleForm.contactName}
                          onChange={(e) => setSampleForm({ ...sampleForm, contactName: e.target.value })}
                          className="w-full px-3 py-2.5 bg-white border border-[#E5E5E5] text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={`${uid}-email`} className="text-xs font-semibold text-[#111111] block mb-1">
                          Correo *
                        </label>
                        <input
                          id={`${uid}-email`}
                          type="email"
                          required
                          placeholder="correo@tuclub.com"
                          value={sampleForm.email}
                          onChange={(e) => setSampleForm({ ...sampleForm, email: e.target.value })}
                          className="w-full px-3 py-2.5 bg-white border border-[#E5E5E5] text-xs"
                        />
                      </div>
                      <div>
                        <label htmlFor={`${uid}-phone`} className="text-xs font-semibold text-[#111111] block mb-1">
                          WhatsApp / Teléfono *
                        </label>
                        <input
                          id={`${uid}-phone`}
                          type="tel"
                          required
                          placeholder="+52 55 1234 5678"
                          value={sampleForm.phone}
                          onChange={(e) => setSampleForm({ ...sampleForm, phone: e.target.value })}
                          className="w-full px-3 py-2.5 bg-white border border-[#E5E5E5] text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor={`${uid}-sport`} className="text-xs font-semibold text-[#111111] block mb-1">
                        Disciplina principal
                      </label>
                      <select
                        id={`${uid}-sport`}
                        value={sampleForm.sport}
                        onChange={(e) => setSampleForm({ ...sampleForm, sport: e.target.value })}
                        className="w-full px-3 py-2.5 bg-white border border-[#E5E5E5] text-xs"
                      >
                        <option value="Fútbol">Fútbol y Porteros</option>
                        <option value="Baloncesto">Baloncesto</option>
                        <option value="E-Sports">E-Sports</option>
                        <option value="Chamarras Softshell">Chamarras Softshell</option>
                        <option value="Muestrario Completo">Muestrario Completo</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full min-h-11 rounded-full bg-[#111111] hover:bg-[#3f3f46] text-white text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4" aria-hidden="true" />
                      <span>Registrar Solicitud de Muestras</span>
                    </button>
                    <p className="text-[11px] text-[#707072] text-center">
                      Atención directa {ARZA_CONTACT.phoneDisplay} · {ARZA_CONTACT.email}
                    </p>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
