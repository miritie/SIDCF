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

// Modif #158 — retire un éventuel préfixe « LOT n : » du libellé (pour n'éditer
// que la description ; le préfixe est ré-appliqué selon le numéro courant).
function stripLotPrefix(libelle) {
  return String(libelle || '').replace(/^\s*LOT\s+\d+\s*:\s*/i, '').trim();
}

// Ré-applique le préfixe obligatoire « LOT n : » à tous les lots (multi-lots),
// d'après leur numéro courant. À appeler après toute (re)numérotation.
function reapplyLotPrefixes(state) {
  state.forEach((l) => {
    const raw = stripLotPrefix(l.libelle || l.objet || '');
    l.objet = raw;
    l.libelle = `LOT ${l.numero} : ${raw}`.trimEnd();
  });
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
  // Modif #158 — en multi-lots, le préfixe « LOT n : » est obligatoire dès le montage.
  if (allotissement === 'MULTIPLES') reapplyLotPrefixes(state);

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
      // Modif #158 — re-préfixe « LOT n : » après renumérotation (multi-lots).
      if (allotissement === 'MULTIPLES') reapplyLotPrefixes(state);
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

    if (allotissement === 'MULTIPLES') {
      // Modif #158 — En multi-lots, le préfixe « LOT n : » est OBLIGATOIRE :
      // affiché comme addon non éditable ; l'agent ne saisit que la description.
      // Le libellé stocké est « LOT n : description » (préfixe baké).
      libInput.placeholder = 'Description du lot';
      libInput.value = stripLotPrefix(lot.libelle);
      const setLib = () => {
        const raw = libInput.value.trim();
        updateLot(idx, (l) => {
          l.objet = raw;
          l.libelle = raw ? `LOT ${l.numero} : ${raw}` : `LOT ${l.numero} : `;
        });
      };
      libInput.addEventListener('input', setLib);
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:stretch;gap:0';
      const prefix = document.createElement('span');
      prefix.textContent = `LOT ${lot.numero} :`;
      prefix.style.cssText = 'display:flex;align-items:center;padding:0 10px;background:#eef2ff;border:1px solid #c7d2fe;border-right:none;border-radius:6px 0 0 6px;font-weight:700;color:#3730a3;white-space:nowrap';
      libInput.style.borderRadius = '0 6px 6px 0';
      row.appendChild(prefix);
      row.appendChild(libInput);
      libInput.style.flex = '1';
      libWrap.appendChild(row);
    } else {
      // Lot unique : on utilise directement l'objet du marché (sans préfixe).
      libInput.placeholder = defaultLibelle || 'Libellé du lot';
      libInput.value = lot.libelle || '';
      libInput.addEventListener('input', () => {
        updateLot(idx, (l) => { l.libelle = libInput.value; l.objet = libInput.value; });
      });
      libWrap.appendChild(libInput);
    }
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

    // PVs par lot (4 — le PV d'ouverture est transverse depuis #150, géré dans ecr02a)
    const pvHeader = document.createElement('div');
    pvHeader.style.fontSize = '12px';
    pvHeader.style.fontWeight = '600';
    pvHeader.style.color = '#6b7280';
    pvHeader.style.margin = '8px 0 6px';
    // Modif #166 — « PV d'analyse » → « Rapport d'analyse » (tous modes). Le PV
    // de jugement reste un PV. En-tête adapté.
    pvHeader.textContent = '📄 Rapports d\'analyse & PV de jugement (le rapport combiné est une alternative aux rapports technique + financier séparés)';
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
    // Modif #150 — Le PV d'ouverture n'est plus par lot : il est transverse
    // (valable pour tous les lots d'un même processus) et géré au niveau
    // procédure dans ecr02a. Il est donc retiré d'ici.
    gridPv.appendChild(mkPv('Rapport d\'analyse technique', 'analyseTechnique', 'RAPPORT_ANATECH'));
    gridPv.appendChild(mkPv('Rapport d\'analyse financière', 'analyseFinanciere', 'RAPPORT_ANAFIN'));
    gridPv.appendChild(mkPv('Rapport d\'analyse tech & fin (combiné)', 'analyseTechFin', 'RAPPORT_ANATECHFIN'));
    gridPv.appendChild(mkPv('PV de jugement', 'jugement', 'PV_JUG'));
    card.appendChild(gridPv);

    // Modif #152 (V3) — cases de disponibilité de pièces PAR LOT (ex. PSC :
    // « Bon de commande et/ou devis disponible », « Formulaire de sélection
    // disponible »). Pilotées par options.lotChecks = [{ key, label }].
    if (Array.isArray(options.lotChecks) && options.lotChecks.length) {
      const checksHeader = document.createElement('div');
      checksHeader.style.cssText = 'font-size:12px;font-weight:600;color:#6b7280;margin:12px 0 6px';
      checksHeader.textContent = '✅ Disponibilité des pièces (liasse du dossier imputé)';
      card.appendChild(checksHeader);
      options.lotChecks.forEach(({ key, label }) => {
        const wrap = document.createElement('label');
        wrap.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:6px;font-size:13px';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = `lot-check-${key}`;
        cb.checked = lot[key] === true;
        cb.addEventListener('change', () => { updateLot(idx, (l) => { l[key] = cb.checked; }); });
        wrap.appendChild(cb);
        const span = document.createElement('span');
        span.textContent = label;
        wrap.appendChild(span);
        card.appendChild(wrap);
      });
    }

    // Modif #153 (V4) — Attribution PAR LOT (tous modes, y compris lot unique) :
    // choix explicite ATTRIBUÉ / INFRUCTUEUX. Si ATTRIBUÉ → désignation de
    // l'attributaire (entreprise unique OU groupement mandataire + membres),
    // forme { singleOrGroup, entreprises:[…] } reconduite telle quelle à
    // l'Enregistrement (ecr03a). Si INFRUCTUEUX → motif en saisie libre.
    if (options.lotAttribution) {
      card.appendChild(renderLotAttribution(lot, idx));
    }

    return card;
  };

  // ---- Modif #153 (V4) : sous-bloc Attribution par lot --------------------
  const entreprisesOpt = Array.isArray(options.entreprises) ? options.entreprises : [];
  const nccByRs = {};
  const idByRs = {}; // Modif #155 — rs → entrepriseId (pour reconduire les comptes)
  entreprisesOpt.forEach(e => {
    if (e.raisonSociale) {
      nccByRs[e.raisonSociale] = e.ncc || '';
      if (e.entrepriseId) idByRs[e.raisonSociale] = e.entrepriseId;
    }
  });

  function makeEntrepriseInput(value, onPick, sanctionHost) {
    const wrap = document.createElement('div');
    wrap.className = 'form-field';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-input lot-attr-entreprise';
    input.setAttribute('list', 'lot-entreprises-datalist');
    input.placeholder = 'Rechercher / saisir une entreprise…';
    input.value = value?.raisonSociale || '';
    const runSanction = () => {
      const rs = input.value.trim();
      if (onPick) onPick({ raisonSociale: rs, ncc: nccByRs[rs] || value?.ncc || '', entrepriseId: idByRs[rs] || value?.entrepriseId || null });
      if (sanctionHost && typeof options.checkSanction === 'function' && rs) {
        Promise.resolve(options.checkSanction(rs)).then(sanction => {
          sanctionHost.innerHTML = '';
          if (sanction) {
            const b = document.createElement('div');
            b.style.cssText = 'margin-top:4px;padding:6px 8px;border-radius:4px;background:#f8d7da;color:#842029;font-size:12px;font-weight:600';
            b.textContent = `🚫 Entreprise sanctionnée — ${sanction.typeSanction || 'sanction'} : ${sanction.motif || 'non précisé'}`;
            sanctionHost.appendChild(b);
          }
        }).catch(() => {});
      } else if (sanctionHost) { sanctionHost.innerHTML = ''; }
    };
    input.addEventListener('input', runSanction);
    setTimeout(runSanction, 0); // vérifie l'état initial
    wrap.appendChild(input);
    return wrap;
  }

  function renderLotAttribution(lot, idx) {
    const box = document.createElement('div');
    box.style.cssText = 'margin-top:12px;border-top:1px dashed #e5e7eb;padding-top:10px';
    const header = document.createElement('div');
    header.style.cssText = 'font-size:12px;font-weight:600;color:#6b7280;margin-bottom:6px';
    header.textContent = '🏆 Issue du lot & attributaire';
    box.appendChild(header);

    const attr = lot.attributaire || {};
    let statut = lot.statut || 'ATTRIBUE';
    let singleOrGroup = attr.singleOrGroup || 'SIMPLE';

    // Statut ATTRIBUE / INFRUCTUEUX
    const statutSel = document.createElement('select');
    statutSel.className = 'form-input lot-attr-statut';
    statutSel.style.maxWidth = '260px';
    [['ATTRIBUE', '✅ Attribué'], ['INFRUCTUEUX', '⛔ Infructueux']].forEach(([v, l]) => {
      const o = document.createElement('option'); o.value = v; o.textContent = l; if (v === statut) o.selected = true; statutSel.appendChild(o);
    });
    box.appendChild(statutSel);

    const attribZone = document.createElement('div');
    attribZone.style.marginTop = '10px';
    const infructZone = document.createElement('div');
    infructZone.style.marginTop = '10px';
    box.appendChild(attribZone);
    box.appendChild(infructZone);

    // ----- Zone ATTRIBUÉ -----
    const buildAttribZone = () => {
      attribZone.innerHTML = '';
      // Type : entreprise unique / groupement
      const typeWrap = document.createElement('div');
      typeWrap.className = 'form-field';
      const typeLabel = document.createElement('label'); typeLabel.className = 'form-label'; typeLabel.textContent = 'Type d\'attributaire';
      typeWrap.appendChild(typeLabel);
      const typeSel = document.createElement('select');
      typeSel.className = 'form-input lot-attr-type'; typeSel.style.maxWidth = '260px';
      [['SIMPLE', 'Entreprise unique'], ['GROUPEMENT', 'Groupement']].forEach(([v, l]) => {
        const o = document.createElement('option'); o.value = v; o.textContent = l; if (v === singleOrGroup) o.selected = true; typeSel.appendChild(o);
      });
      typeWrap.appendChild(typeSel);
      attribZone.appendChild(typeWrap);

      const detail = document.createElement('div');
      attribZone.appendChild(detail);

      const persist = () => {
        // Reconstruit lot.attributaire à partir des inputs courants
        const inputs = [...attribZone.querySelectorAll('.lot-attr-entreprise')];
        const entreprises = inputs.map(i => { const rs = i.value.trim(); return { raisonSociale: rs, ncc: nccByRs[rs] || '', entrepriseId: idByRs[rs] || null }; }).filter(e => e.raisonSociale);
        updateLot(idx, (l) => {
          l.statut = 'ATTRIBUE';
          l.attributaire = { singleOrGroup, entreprises };
          l.motifInfructueux = null;
        });
      };

      const buildDetail = () => {
        detail.innerHTML = '';
        if (singleOrGroup === 'SIMPLE') {
          const sh = document.createElement('div');
          const ent = (attr.entreprises && attr.entreprises[0]) || {};
          detail.appendChild(makeEntrepriseInput(ent, () => persist(), sh));
          detail.appendChild(sh);
        } else {
          // Mandataire + membres
          const mandLabel = document.createElement('div'); mandLabel.style.cssText = 'font-size:12px;font-weight:600;margin:4px 0'; mandLabel.textContent = 'Mandataire';
          detail.appendChild(mandLabel);
          const shM = document.createElement('div');
          const mand = (attr.entreprises && attr.entreprises[0]) || {};
          detail.appendChild(makeEntrepriseInput(mand, () => persist(), shM));
          detail.appendChild(shM);
          const memLabel = document.createElement('div'); memLabel.style.cssText = 'font-size:12px;font-weight:600;margin:8px 0 4px'; memLabel.textContent = 'Membres du groupement';
          detail.appendChild(memLabel);
          const membersHost = document.createElement('div');
          detail.appendChild(membersHost);
          const addMember = (val) => {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;gap:8px;align-items:flex-start;margin-bottom:6px';
            const sh = document.createElement('div'); sh.style.flex = '1';
            const inWrap = makeEntrepriseInput(val, () => persist(), sh);
            inWrap.style.flex = '1';
            const rm = document.createElement('button'); rm.type = 'button'; rm.className = 'btn btn-sm btn-secondary'; rm.textContent = '✕';
            rm.addEventListener('click', () => { row.remove(); persist(); });
            const col = document.createElement('div'); col.style.flex = '1'; col.appendChild(inWrap); col.appendChild(sh);
            row.appendChild(col); row.appendChild(rm);
            membersHost.appendChild(row);
          };
          const existingMembers = (attr.entreprises || []).slice(1);
          existingMembers.forEach(m => addMember(m));
          const addBtn = document.createElement('button');
          addBtn.type = 'button'; addBtn.className = 'btn btn-sm btn-accent'; addBtn.textContent = '+ Ajouter un membre';
          addBtn.style.marginTop = '4px';
          addBtn.addEventListener('click', () => { addMember({}); });
          detail.appendChild(addBtn);
        }
      };
      buildDetail();
      typeSel.addEventListener('change', () => { singleOrGroup = typeSel.value; buildDetail(); persist(); });
    };

    // ----- Zone INFRUCTUEUX -----
    const buildInfructZone = () => {
      infructZone.innerHTML = '';
      const wrap = document.createElement('div'); wrap.className = 'form-field';
      const l = document.createElement('label'); l.className = 'form-label'; l.textContent = 'Motif de l\'infructuosité';
      wrap.appendChild(l);
      const ta = document.createElement('textarea');
      ta.className = 'form-input lot-attr-motif'; ta.rows = 2; ta.placeholder = 'Saisie libre (ex. aucune offre conforme, montants hors enveloppe…)';
      ta.value = lot.motifInfructueux || '';
      ta.addEventListener('input', () => { updateLot(idx, (x) => { x.statut = 'INFRUCTUEUX'; x.motifInfructueux = ta.value; x.attributaire = null; }); });
      wrap.appendChild(ta);
      infructZone.appendChild(wrap);
    };

    const applyStatut = () => {
      if (statut === 'ATTRIBUE') { attribZone.style.display = ''; infructZone.style.display = 'none'; buildAttribZone(); }
      else { attribZone.style.display = 'none'; infructZone.style.display = ''; buildInfructZone(); }
    };
    statutSel.addEventListener('change', () => {
      statut = statutSel.value;
      updateLot(idx, (l) => { l.statut = statut; });
      applyStatut();
    });
    applyStatut();

    return box;
  }

  const render = () => {
    container.innerHTML = '';

    // Modif #153 — datalist partagée des entreprises (pour l'attribution par lot).
    if (options.lotAttribution && entreprisesOpt.length) {
      const dl = document.createElement('datalist');
      dl.id = 'lot-entreprises-datalist';
      entreprisesOpt.slice().sort((a, b) => (a.raisonSociale || '').localeCompare(b.raisonSociale || ''))
        .forEach(e => { if (e.raisonSociale) { const o = document.createElement('option'); o.value = e.raisonSociale; dl.appendChild(o); } });
      container.appendChild(dl);
    }

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
        reapplyLotPrefixes(state); // Modif #158 — préfixe « LOT n : » obligatoire
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
        reapplyLotPrefixes(state); // Modif #158
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
