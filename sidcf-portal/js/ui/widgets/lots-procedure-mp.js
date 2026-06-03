/* ============================================
   Lots & procédure par lot (Marché+)
   ============================================
   Widget qui gère :
   - le « Nombre de lots » d'une opération
   - pour chaque lot : libellé + nb offres + 4 dates + 5 PVs
   Conserve les champs additionnels éventuels (montantHT/TTC, livrables,
   soumissionnairesLot, observations) hérités d'une saisie antérieure
   via l'ancien LotsWidget — pass-through.

   Format de sortie pour chaque lot :
   {
     id, numero, libelle,
     nbOffresRecues, nbOffresClassees,
     dates: { ouverture, analyseTechnique, analyseFinanciere, jugement },
     pv:    { ouverture, analyseTechnique, analyseFinanciere, analyseTechFin, jugement },
     // pass-through éventuels :
     objet, montantHT, montantTTC, delaiExecution, livrables,
     soumissionnairesLot, observations
   }
*/

import { el } from '../../lib/dom.js';
import { uid } from '../../lib/uid.js';

const blankDates = () => ({
  ouverture: null,
  analyseTechnique: null,
  analyseFinanciere: null,
  jugement: null
});

const blankPv = () => ({
  ouverture: null,
  analyseTechnique: null,
  analyseFinanciere: null,
  analyseTechFin: null,
  jugement: null
});

const blankLot = (numero, libelle = '') => ({
  id: uid('LOT'),
  numero,
  libelle,
  nbOffresRecues: 0,
  nbOffresClassees: 0,
  dates: blankDates(),
  pv: blankPv()
});

// Migration depuis l'ancien format (LotsWidget historique : `objet` au lieu
// de `libelle`, pas de dates/pv per-lot)
function normalizeLot(rawLot, idx, defaultLibelle) {
  const dates = { ...blankDates(), ...(rawLot?.dates || {}) };
  const pv = { ...blankPv(), ...(rawLot?.pv || {}) };
  // Compat : pv.analyse legacy → analyseTechFin
  if (!pv.analyseTechFin && rawLot?.pv?.analyse) {
    pv.analyseTechFin = rawLot.pv.analyse;
  }
  return {
    ...(rawLot || {}),
    id: rawLot?.id || uid('LOT'),
    numero: rawLot?.numero || idx + 1,
    libelle: rawLot?.libelle || rawLot?.objet || (idx === 0 ? (defaultLibelle || '') : ''),
    nbOffresRecues: Number(rawLot?.nbOffresRecues) || 0,
    nbOffresClassees: Number(rawLot?.nbOffresClassees) || 0,
    dates,
    pv
  };
}

function fmtDateForInput(iso) {
  if (!iso) return '';
  if (typeof iso === 'string' && iso.length >= 10) return iso.slice(0, 10);
  return '';
}

/**
 * @param {Array} lots  - liste initiale (normalisée)
 * @param {Object} options
 * @param {string} [options.defaultLibelle] - libellé par défaut du 1er lot
 * @param {(lots:Array) => void} [onChange]
 * @returns {HTMLElement}
 */
export function renderLotsProcedureMP(lots = [], options = {}, onChange = null) {
  const container = el('div', { className: 'lots-procedure-mp' });
  const defaultLibelle = options.defaultLibelle || '';
  // Modif #105 — C-8 : mode d'allotissement piloté par l'écran de
  // contractualisation. 'UNIQUE' = lot unique (saisie simple, pas de
  // numérotation ni de gestion du nombre de lots) ; 'MULTIPLES' = N lots
  // numérotés (comportement historique). Défaut : UNIQUE.
  const allotissement = options.allotissement === 'MULTIPLES' ? 'MULTIPLES' : 'UNIQUE';

  // Initial state — au moins 1 lot
  let state = (lots && lots.length > 0
    ? lots.map((l, i) => normalizeLot(l, i, defaultLibelle))
    : [blankLot(1, defaultLibelle)]
  );
  // En lot unique, on ne conserve que le premier lot.
  if (allotissement === 'UNIQUE' && state.length > 1) state = state.slice(0, 1);

  const notify = () => { if (onChange) onChange([...state]); };

  const updateLot = (idx, mutator) => {
    const next = { ...state[idx] };
    mutator(next);
    state[idx] = next;
    notify();
  };

  const renderLotCard = (lot, idx) => {
    const card = document.createElement('div');
    card.className = 'lot-procedure-card';
    Object.assign(card.style, {
      border: '1px solid #d1d5db', borderRadius: '8px',
      padding: '14px 16px', marginBottom: '12px', background: '#fafafa'
    });

    // Header
    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: '12px', borderBottom: '1px dashed #e5e7eb', paddingBottom: '8px'
    });
    const title = document.createElement('strong');
    // Modif #105 — C-8 : pas de numérotation « Lot N » en allotissement unique.
    title.textContent = allotissement === 'UNIQUE' ? 'Lot unique' : `Lot ${lot.numero}`;
    title.style.color = '#111827';
    header.appendChild(title);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-sm btn-secondary';
    removeBtn.textContent = '✕';
    removeBtn.title = 'Retirer ce lot';
    Object.assign(removeBtn.style, { padding: '4px 10px' });
    removeBtn.addEventListener('click', () => {
      if (state.length <= 1) return; // toujours au moins 1 lot
      state.splice(idx, 1);
      // re-numérote
      state.forEach((l, i) => { l.numero = i + 1; });
      notify();
      render();
    });
    if (allotissement === 'UNIQUE' || state.length <= 1) removeBtn.style.visibility = 'hidden';
    header.appendChild(removeBtn);
    card.appendChild(header);

    // Libellé (full width)
    const libWrap = document.createElement('div');
    libWrap.className = 'form-field';
    libWrap.style.marginBottom = '12px';
    const libLabel = document.createElement('label');
    libLabel.className = 'form-label';
    // Modif #84 (CR 5.c) — « Objet / Libellé » par cohérence avec le renommage
    // de la colonne du tableau PPM (Lot 2). Pour un lot unique, prend par défaut
    // le nom du marché ; pour un marché multi-lots, on le définit par lot.
    libLabel.textContent = 'Objet / Libellé du lot';
    libWrap.appendChild(libLabel);
    const libInput = document.createElement('input');
    libInput.type = 'text';
    libInput.className = 'form-input';
    libInput.placeholder = idx === 0 ? (defaultLibelle || 'Libellé du lot') : `Lot ${lot.numero}`;
    libInput.value = lot.libelle || '';
    libInput.addEventListener('input', () => {
      updateLot(idx, (l) => { l.libelle = libInput.value; l.objet = libInput.value; });
    });
    libWrap.appendChild(libInput);
    card.appendChild(libWrap);

    // Grille : nb offres
    const gridOffres = document.createElement('div');
    Object.assign(gridOffres.style, {
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px'
    });
    const mkNb = (labelText, key) => {
      const w = document.createElement('div');
      w.className = 'form-field';
      const l = document.createElement('label');
      l.className = 'form-label';
      l.textContent = labelText;
      w.appendChild(l);
      const i = document.createElement('input');
      i.type = 'number';
      i.className = 'form-input';
      i.min = '0';
      i.value = lot[key] || 0;
      i.addEventListener('input', () => {
        updateLot(idx, (lot2) => { lot2[key] = Number(i.value) || 0; });
      });
      w.appendChild(i);
      return w;
    };
    gridOffres.appendChild(mkNb('Nombre d\'offres reçues', 'nbOffresRecues'));
    // Modif #85 — champ « Nombre d'offres classées » retiré de l'UI (non utile).
    // La donnée reste préservée en base via normalizeLot (spread de rawLot +
    // nbOffresClassees conservé dans l'état), donc les valeurs existantes ne
    // sont pas écrasées.
    card.appendChild(gridOffres);

    // Dates (4)
    const datesHeader = document.createElement('div');
    datesHeader.style.fontSize = '12px';
    datesHeader.style.fontWeight = '600';
    datesHeader.style.color = '#6b7280';
    datesHeader.style.margin = '8px 0 6px';
    datesHeader.textContent = '📅 Dates de la procédure';
    card.appendChild(datesHeader);

    const gridDates = document.createElement('div');
    Object.assign(gridDates.style, {
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '12px'
    });
    const mkDate = (labelText, key) => {
      const w = document.createElement('div');
      w.className = 'form-field';
      const l = document.createElement('label');
      l.className = 'form-label';
      l.textContent = labelText;
      w.appendChild(l);
      const i = document.createElement('input');
      i.type = 'date';
      i.className = 'form-input';
      i.value = fmtDateForInput(lot.dates?.[key]);
      i.addEventListener('input', () => {
        updateLot(idx, (lot2) => {
          lot2.dates = { ...lot2.dates, [key]: i.value || null };
        });
      });
      w.appendChild(i);
      return w;
    };
    gridDates.appendChild(mkDate('Date d\'ouverture', 'ouverture'));
    gridDates.appendChild(mkDate('Date d\'analyse technique', 'analyseTechnique'));
    gridDates.appendChild(mkDate('Date d\'analyse financière', 'analyseFinanciere'));
    gridDates.appendChild(mkDate('Date de jugement', 'jugement'));
    card.appendChild(gridDates);

    // PVs (5)
    const pvHeader = document.createElement('div');
    pvHeader.style.fontSize = '12px';
    pvHeader.style.fontWeight = '600';
    pvHeader.style.color = '#6b7280';
    pvHeader.style.margin = '8px 0 6px';
    pvHeader.textContent = '📄 Procès-verbaux (le PV combiné est une alternative aux PV technique + financier séparés)';
    card.appendChild(pvHeader);

    const gridPv = document.createElement('div');
    Object.assign(gridPv.style, {
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px'
    });
    const mkPv = (labelText, key, prefix) => {
      const w = document.createElement('div');
      w.className = 'form-field';
      const l = document.createElement('label');
      l.className = 'form-label';
      l.textContent = labelText;
      w.appendChild(l);
      const i = document.createElement('input');
      i.type = 'file';
      i.className = 'form-input';
      i.accept = '.pdf,.doc,.docx';
      i.addEventListener('change', () => {
        const f = i.files?.[0];
        updateLot(idx, (lot2) => {
          lot2.pv = { ...lot2.pv, [key]: f ? `${prefix}_LOT${lot2.numero}_${Date.now()}.pdf` : null };
        });
      });
      w.appendChild(i);
      if (lot.pv?.[key]) {
        const ok = document.createElement('small');
        ok.className = 'text-success';
        ok.textContent = `✓ ${lot.pv[key]}`;
        w.appendChild(ok);
      }
      return w;
    };
    gridPv.appendChild(mkPv('PV d\'ouverture', 'ouverture', 'PV_OUV'));
    gridPv.appendChild(mkPv('PV d\'analyse technique', 'analyseTechnique', 'PV_ANATECH'));
    gridPv.appendChild(mkPv('PV d\'analyse financière', 'analyseFinanciere', 'PV_ANAFIN'));
    gridPv.appendChild(mkPv('PV analyse tech & fin (combiné)', 'analyseTechFin', 'PV_ANATECHFIN'));
    gridPv.appendChild(mkPv('PV de jugement', 'jugement', 'PV_JUG'));
    card.appendChild(gridPv);

    return card;
  };

  const render = () => {
    container.innerHTML = '';

    // Top bar : nombre de lots + ajouter
    const topBar = document.createElement('div');
    Object.assign(topBar.style, {
      display: 'flex', alignItems: 'center', gap: '10px',
      marginBottom: '14px', flexWrap: 'wrap'
    });

    const titleEl = document.createElement('strong');
    titleEl.textContent = allotissement === 'UNIQUE'
      ? 'Lot unique'
      : `Lots & procédure par lot (${state.length})`;
    titleEl.style.color = '#111827';
    topBar.appendChild(titleEl);

    const filler = document.createElement('div');
    filler.style.flex = '1';
    topBar.appendChild(filler);

    // Modif #105 — C-8 : contrôles de gestion du nombre de lots réservés au
    // mode « lots multiples ». En lot unique, la saisie est directe (1 carte).
    if (allotissement === 'MULTIPLES') {
      const genLabel = document.createElement('label');
      genLabel.textContent = 'Nombre de lots :';
      Object.assign(genLabel.style, { fontSize: '13px', color: '#6b7280' });
      topBar.appendChild(genLabel);

      const countInput = document.createElement('input');
      countInput.type = 'number';
      countInput.min = '1';
      countInput.max = '20';
      countInput.value = state.length;
      countInput.className = 'form-input';
      Object.assign(countInput.style, { width: '70px', padding: '4px 8px' });
      topBar.appendChild(countInput);

      const setBtn = document.createElement('button');
      setBtn.type = 'button';
      setBtn.className = 'btn btn-sm btn-secondary';
      setBtn.textContent = 'Définir';
      setBtn.title = 'Ajuste le nombre total de lots (préserve les lots existants en tête)';
      setBtn.addEventListener('click', () => {
        const n = Math.max(1, Math.min(20, Math.floor(Number(countInput.value) || 1)));
        if (n > state.length) {
          for (let i = state.length; i < n; i++) {
            state.push(blankLot(i + 1, ''));
          }
        } else if (n < state.length) {
          state = state.slice(0, n);
        }
        notify();
        render();
      });
      topBar.appendChild(setBtn);

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'btn btn-sm btn-accent';
      addBtn.textContent = '+ Ajouter un lot';
      addBtn.addEventListener('click', () => {
        state.push(blankLot(state.length + 1, ''));
        notify();
        render();
      });
      topBar.appendChild(addBtn);
    }

    container.appendChild(topBar);

    // Note d'aide
    const help = document.createElement('div');
    Object.assign(help.style, {
      fontSize: '12px', color: '#6b7280', marginBottom: '10px',
      padding: '6px 10px', background: '#f9fafb', borderRadius: '4px',
      borderLeft: '3px solid #9ca3af'
    });
    help.innerHTML = allotissement === 'UNIQUE'
      ? 'Marché à <strong>lot unique</strong> : renseignez les champs ci-dessous (le libellé prend par défaut le nom du marché). Tous les champs sont optionnels.'
      : `Le projet est constitué de <strong>${state.length} lots</strong>. Chaque lot a sa propre procédure (offres, dates, PVs). Tous les champs sont optionnels.`;
    container.appendChild(help);

    // Cards
    state.forEach((lot, idx) => container.appendChild(renderLotCard(lot, idx)));
  };

  render();
  return container;
}

export default renderLotsProcedureMP;
