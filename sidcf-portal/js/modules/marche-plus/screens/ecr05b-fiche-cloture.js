/* ============================================================
   ECR05B — FICHE DE CLÔTURE (synthèse centrée Contrôleur Financier)
   ------------------------------------------------------------
   Doc clôture 24/06 (Lot 3). Une PAGE UNIQUE, imprimable, qui ne retient que
   l'information pertinente pour le CF à la clôture (≠ fiche marché ECR01C, plus
   exhaustive). Lecture seule, générée à partir des données existantes — aucune
   saisie, aucune persistance.
   ============================================================ */

import { el, mount } from '../../../lib/dom.js';
import router from '../../../router.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import { getLotData, getLotsFromProcedure, resolveCurrentLotId } from '../../../lib/lot-data.js';

const fmtXOF = (n) => `${Number(n || 0).toLocaleString('fr-FR')} XOF`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

function field(label, value, color) {
  return el('div', { style: { padding: '4px 0' } }, [
    el('span', { style: { color: '#6b7280', fontSize: '12px' } }, label + ' : '),
    el('span', { style: { fontWeight: 600, color: color || '#111827' } }, value)
  ]);
}

function blocCard(titre, children) {
  return el('div', { className: 'card', style: { marginBottom: '14px' } }, [
    el('div', { className: 'card-header', style: { padding: '8px 14px' } }, [
      el('h3', { className: 'card-title', style: { margin: 0, fontSize: '14px' } }, titre)
    ]),
    el('div', { className: 'card-body', style: { padding: '12px 14px' } }, children)
  ]);
}

export async function renderFicheCloture(params) {
  const { idOperation } = params;
  if (!idOperation) {
    mount('#app', el('div', { className: 'page' }, [el('div', { className: 'alert alert-error' }, 'ID marché manquant')]));
    return;
  }
  const fullData = await dataService.getMpOperationFull(idOperation);
  if (!fullData?.operation) {
    mount('#app', el('div', { className: 'page' }, [el('div', { className: 'alert alert-error' }, 'Marché / contrat introuvable')]));
    return;
  }
  const { operation, procedure } = fullData;
  const registries = dataService.getAllRegistries();
  const lots = getLotsFromProcedure(procedure);
  const currentLotId = resolveCurrentLotId(lots, params);

  const clotures = await dataService.query(ENTITIES.MP_CLOTURE, { operationId: idOperation });
  const rawCloture = clotures && clotures[0] ? clotures[0] : null;
  const cloture = getLotData(rawCloture, currentLotId);
  const garanties = (await dataService.query(ENTITIES.MP_GARANTIE, { operationId: idOperation }))
    .filter(g => !currentLotId || !g.lotId || g.lotId === currentLotId);
  const mpDecomptes = await dataService.query(ENTITIES.MP_DECOMPTE, { operationId: idOperation }).catch(() => []);
  const attribution = getLotData(fullData.attribution, currentLotId);
  const avenants = (fullData.avenants || []).filter(av => !currentLotId || !av.lotId || av.lotId === currentLotId);

  // ----- Calculs (identiques à ECR05) -----
  const montantBase = Number(attribution?.montants?.ttc) || Number(attribution?.montants?.attribue) || Number(attribution?.montantAttribue) || 0;
  const totalAvenants = avenants.reduce((s, a) => s + (Number(a.variationMontant) || 0), 0);
  const montantTotal = montantBase + totalAvenants;
  const cumulDecomptes = mpDecomptes.filter(d => d.etat === 'VISE' || d.etat === 'PAYE').reduce((s, d) => s + (Number(d.netTTC) || 0), 0);
  const ecart = montantTotal - cumulDecomptes;
  const solde = Math.abs(ecart) < 1;

  const dureeContractuelle = Number(attribution?.dates?.delaiExecution) || 0;
  const dureeUnite = attribution?.dates?.delaiUnite || 'JOURS';
  const osDate = (fullData.ordresService && fullData.ordresService[0]) ? fullData.ordresService[0].dateEmission : null;
  const finDate = cloture?.receptionDef?.date || cloture?.receptionProv?.date || null;
  const contractuelJours = dureeUnite === 'MOIS' ? dureeContractuelle * 30 : dureeContractuelle;
  const reelJours = (osDate && finDate) ? Math.round((new Date(finDate) - new Date(osDate)) / 86400000) : null;
  const delaiComputable = contractuelJours > 0 && reelJours != null;
  const horsDelai = delaiComputable && reelJours > contractuelJours;

  const attr = attribution?.attributaire || {};
  const attributaireNom = attr.nomGroupement
    || (Array.isArray(attr.entreprises) && attr.entreprises[0]?.raisonSociale)
    || attr.raisonSociale || '—';
  const modeLabel = registries.MODE_PASSATION?.find(m => m.code === (procedure?.modePassation || operation.modePassation))?.label
    || procedure?.modePassation || operation.modePassation || '—';
  const livrables = Array.isArray(operation.livrables) ? operation.livrables : [];
  const statutLiv = registries.STATUT_LIVRABLE || [];
  const statutLivLabel = (c) => statutLiv.find(s => s.code === c)?.label || c || '—';

  // ----- Page -----
  const page = el('div', { className: 'page', id: 'fiche-cloture-print' }, [
    // Barre d'actions (non imprimée)
    el('div', { className: 'no-print', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' } }, [
      (() => { const b = el('button', { className: 'btn btn-secondary' }, '← Retour clôture'); b.addEventListener('click', () => router.navigate('/mp/cloture', { idOperation })); return b; })(),
      (() => { const b = el('button', { className: 'btn btn-primary' }, '🖨️ Imprimer la fiche'); b.addEventListener('click', () => window.print()); return b; })()
    ]),

    el('div', { style: { textAlign: 'center', marginBottom: '14px' } }, [
      el('h1', { style: { margin: 0, fontSize: '20px' } }, '📄 Fiche de clôture du marché'),
      el('div', { className: 'text-small text-muted' }, 'Synthèse à l\'attention du Contrôleur Financier')
    ]),

    // 1. En-tête marché
    blocCard('🏢 Identification du marché', [
      field('N° marché approuvé', attribution?.numeroMarcheApprouve || operation.numeroMarche || '—'),
      field('Objet', operation.objet || operation.intitule || '—'),
      field('Attributaire', attributaireNom + (attr.singleOrGroup === 'GROUPEMENT' ? ` (groupement ${attr.groupType || 'CONJOINT'})` : '')),
      field('Mode de passation', modeLabel),
      field('Autorité contractante / type', operation.typeInstitution || '—')
    ]),

    // 2. Montants
    blocCard('💰 Montants', [
      field('Montant de base TTC', fmtXOF(montantBase)),
      field(`Avenants (${avenants.length})`, fmtXOF(totalAvenants)),
      field('Montant total du marché', fmtXOF(montantTotal))
    ]),

    // 3. Situation de paiement (⭐ CF)
    blocCard('💳 Situation de paiement', [
      field('Cumul des décomptes visés', fmtXOF(cumulDecomptes)),
      field('Écart (total − payé)', fmtXOF(ecart), solde ? '#16a34a' : '#b45309'),
      field('Statut', solde ? '✓ Soldé' : '⚠️ Non soldé', solde ? '#16a34a' : '#b45309'),
      cloture?.observationPaiement ? field('Observation CF', cloture.observationPaiement) : null
    ]),

    // 4. Délai (⭐ CF)
    blocCard('⏱️ Délai d\'exécution', [
      field('Délai contractuel', contractuelJours > 0 ? (dureeUnite === 'MOIS' ? `${(contractuelJours / 30).toFixed(1)} mois` : `${contractuelJours} jour(s)`) : '—'),
      field('Délai réel (OS → réception)', reelJours != null ? `${reelJours} jour(s)` : '—'),
      field('Verdict', !delaiComputable ? '— (dates incomplètes)' : (horsDelai ? '⏰ HORS DÉLAI' : '✓ Dans le délai'), horsDelai ? '#dc2626' : (delaiComputable ? '#16a34a' : '#6b7280'))
    ]),

    // 5. Livrables prévu / réalisé
    blocCard(`📦 Livrables (${livrables.length})`, [
      livrables.length === 0
        ? el('div', { className: 'text-muted text-small' }, 'Aucun livrable défini.')
        : el('table', { className: 'table', style: { width: '100%', fontSize: '12px' } }, [
            el('thead', {}, [el('tr', {}, [el('th', {}, 'Livrable'), el('th', { style: { textAlign: 'center' } }, 'Prévu'), el('th', { style: { textAlign: 'center' } }, 'Réalisé'), el('th', {}, 'Statut'), el('th', {}, 'Justif. écart')])]),
            el('tbody', {}, livrables.map(l => el('tr', {}, [
              el('td', {}, l.libelle || '—'),
              el('td', { style: { textAlign: 'center' } }, String(l.quantite != null ? l.quantite : 1)),
              el('td', { style: { textAlign: 'center' } }, String(l.quantiteRealisee || 0)),
              el('td', {}, statutLivLabel(l.statut)),
              el('td', { className: 'text-small' }, l.justificationCF?.commentaire || (l.justificationCF?.motif || '—'))
            ])))
          ])
    ]),

    // 6. Garanties (levées OUI/NON)
    blocCard(`🛡️ Garanties (${garanties.length})`, [
      garanties.length === 0
        ? el('div', { className: 'text-muted text-small' }, 'Aucune garantie enregistrée.')
        : el('table', { className: 'table', style: { width: '100%', fontSize: '12px' } }, [
            el('thead', {}, [el('tr', {}, [el('th', {}, 'Type'), el('th', { style: { textAlign: 'right' } }, 'Montant'), el('th', { style: { textAlign: 'center' } }, 'Levée ?')])]),
            el('tbody', {}, garanties.map(g => el('tr', {}, [
              el('td', {}, g.type || '—'),
              el('td', { style: { textAlign: 'right' } }, fmtXOF(g.montant)),
              el('td', { style: { textAlign: 'center', fontWeight: 700, color: g.mainleveeDate ? '#16a34a' : '#b45309' } }, g.mainleveeDate ? 'OUI' : 'NON')
            ])))
          ])
    ]),

    // 7. Réceptions
    blocCard('✅ Réceptions', [
      field('Réception provisoire', fmtDate(cloture?.receptionProv?.date)),
      field('Réception définitive', fmtDate(cloture?.receptionDef?.date))
    ]),

    // 8/9. Satisfaction + synthèse + enseignements CF
    blocCard('📝 Appréciation & enseignements', [
      field('Satisfaction des bénéficiaires', cloture?.satisfactionBeneficiaires || '— (à évaluer)'),
      (() => {
        const para = (titre, txt) => el('div', { style: { marginTop: '6px' } }, [
          el('div', { style: { color: '#6b7280', fontSize: '12px' } }, titre),
          el('div', { style: { fontStyle: txt ? 'normal' : 'italic', color: txt ? '#111827' : '#9ca3af' } }, txt || 'Non renseigné.')
        ]);
        return el('div', {}, [
          para('Bilan technique et financier :', cloture?.syntheseFinale),
          para('🎓 Leçons tirées :', cloture?.leconsTirees),
          para('💡 Recommandations :', cloture?.recommandations)
        ]);
      })()
    ]),

    // 10. Annexes
    blocCard('🖼️ Annexes', [
      el('div', { className: 'text-small text-muted' }, 'Catalogue d\'images (pendant / fin d\'exécution) — à intégrer ultérieurement.')
    ])
  ]);

  // Style d'impression : masquer la navigation et les boutons.
  page.appendChild(el('style', {}, '@media print { .no-print, .sidebar, nav, header { display: none !important; } #fiche-cloture-print { margin: 0; } .card { break-inside: avoid; } }'));

  mount('#app', page);
}

export default renderFicheCloture;
