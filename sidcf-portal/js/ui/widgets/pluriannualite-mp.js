/**
 * Widget : Encart pluriannualité du marché (Marché+ modif #35)
 *
 * Le user a confirmé : la planification pluriannuelle est déjà
 * disponible dans la Clé de Répartition multi-bailleurs (chaque
 * MP_CLE_LIGNE porte un champ `annee`). Ce widget rend cette
 * information sous une forme synthétique et lisible dans la
 * fiche de vie : tableau pivot années × bailleurs + total par
 * année + comparaison avec l'exécution réelle (cumul OP visé)
 * si disponible.
 *
 * Affichage :
 *   - Tableau pivot : lignes = bailleurs, colonnes = années, total
 *   - Ligne de total par année
 *   - Ligne « Exécuté à ce jour » par année si OP/Mandat dispo
 *   - Indicateur d'écart (écart > 0 = en retard, écart < 0 = en avance)
 *
 * Si la clé de répartition est mono-annuelle, le widget retourne
 * un message court (pas de pluriannualité). Le caller peut alors
 * choisir de ne pas afficher la section.
 */

import { el } from '../../lib/dom.js';
import { money } from '../../lib/format.js';

/**
 * @param {Object} opts
 * @param {Object} opts.cleRepartition  MP_CLE_REPARTITION (avec .lignes[])
 * @param {Array}  [opts.decomptes]     MP_DECOMPTE visés/payés (pour comparaison réel)
 * @param {Object} opts.registries
 * @returns {{ node: HTMLElement, isPluriannuel: boolean }}
 */
export function renderPluriannualite({ cleRepartition, decomptes = [], registries = {} } = {}) {
  const lignes = Array.isArray(cleRepartition?.lignes) ? cleRepartition.lignes : [];
  // Années distinctes triées
  const annees = [...new Set(lignes.map(l => l.annee).filter(a => a != null))].sort((a, b) => a - b);
  const isPluriannuel = annees.length > 1;

  if (lignes.length === 0) {
    return {
      isPluriannuel: false,
      node: el('p', { className: 'text-muted', style: { fontStyle: 'italic', fontSize: '13px' } },
        'La clé de répartition multi-bailleurs n\'est pas encore renseignée — la pluriannualité sera disponible après saisie.')
    };
  }

  if (!isPluriannuel) {
    return {
      isPluriannuel: false,
      node: el('div', {
        style: {
          padding: '10px 12px',
          background: '#f9fafb',
          borderLeft: '3px solid #9ca3af',
          fontSize: '13px',
          color: '#374151'
        }
      }, [
        el('strong', {}, 'Marché annuel · '),
        `Toute la planification est sur l'année ${annees[0] || '?'}. Aucun découpage pluriannuel à afficher.`
      ])
    };
  }

  // Bailleurs distincts, en gardant l'ordre d'apparition
  const bailleursOrder = [];
  for (const l of lignes) {
    if (l.bailleur && !bailleursOrder.includes(l.bailleur)) bailleursOrder.push(l.bailleur);
  }

  // Construire la grille : pivot[bailleur][annee] = somme des montants
  const pivot = {};
  for (const b of bailleursOrder) pivot[b] = {};
  for (const l of lignes) {
    const b = l.bailleur || '?';
    const a = l.annee || 0;
    pivot[b][a] = (pivot[b][a] || 0) + (Number(l.montant) || 0);
  }

  // Totaux par année et grand total
  const totalAnnee = {};
  let grandTotal = 0;
  for (const a of annees) {
    let t = 0;
    for (const b of bailleursOrder) t += pivot[b][a] || 0;
    totalAnnee[a] = t;
    grandTotal += t;
  }

  // Exécution réelle par année (basée sur dateDecompte.year des décomptes visés/payés)
  const realiseAnnee = {};
  for (const a of annees) realiseAnnee[a] = 0;
  for (const d of decomptes || []) {
    if (d.etat !== 'VISE' && d.etat !== 'PAYE') continue;
    const annee = d.dateDecompte ? new Date(d.dateDecompte).getFullYear() : null;
    if (annee != null && realiseAnnee[annee] != null) {
      realiseAnnee[annee] += Number(d.netTTC) || Number(d.acompteHTVA) || 0;
    }
  }
  const hasExecution = Object.values(realiseAnnee).some(v => v > 0);

  // Construire la table HTML
  const labelBailleur = (code) => {
    return registries.BAILLEUR?.find(b => b.code === code)?.label || code;
  };

  const thead = el('thead', {}, [
    el('tr', { style: { background: '#f3f4f6' } }, [
      el('th', { style: { padding: '8px', textAlign: 'left', fontSize: '12px' } }, 'Bailleur / Année'),
      ...annees.map(a => el('th', { style: { padding: '8px', textAlign: 'right', fontSize: '12px' } }, String(a))),
      el('th', { style: { padding: '8px', textAlign: 'right', fontSize: '12px', background: '#e5e7eb' } }, 'Total bailleur')
    ])
  ]);

  const tbody = el('tbody', {}, [
    ...bailleursOrder.map(b => {
      const totalBailleur = annees.reduce((s, a) => s + (pivot[b][a] || 0), 0);
      return el('tr', { style: { borderBottom: '1px solid #e5e7eb' } }, [
        el('td', { style: { padding: '6px 8px', fontSize: '12px', fontWeight: 500 } },
          el('span', { className: 'badge badge-info' }, labelBailleur(b))),
        ...annees.map(a => el('td', { style: { padding: '6px 8px', textAlign: 'right', fontSize: '12px' } },
          pivot[b][a] ? money(pivot[b][a]) : '-')),
        el('td', { style: { padding: '6px 8px', textAlign: 'right', fontSize: '12px', fontWeight: 600, background: '#f9fafb' } },
          money(totalBailleur))
      ]);
    }),
    // Total par année
    el('tr', { style: { borderTop: '2px solid #0f5132', background: '#ecfdf5' } }, [
      el('td', { style: { padding: '8px', fontSize: '13px', fontWeight: 700 } }, 'Total planifié'),
      ...annees.map(a => el('td', { style: { padding: '8px', textAlign: 'right', fontSize: '13px', fontWeight: 700 } },
        money(totalAnnee[a]))),
      el('td', { style: { padding: '8px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#0f5132' } },
        money(grandTotal))
    ]),
    // Ligne exécuté réel par année (si dispo)
    hasExecution ? el('tr', { style: { background: '#fff7ed' } }, [
      el('td', { style: { padding: '8px', fontSize: '12px', fontWeight: 600 } }, 'Exécuté à ce jour'),
      ...annees.map(a => el('td', { style: { padding: '8px', textAlign: 'right', fontSize: '12px', fontWeight: 600 } },
        money(realiseAnnee[a] || 0))),
      el('td', { style: { padding: '8px', textAlign: 'right', fontSize: '12px', fontWeight: 600 } },
        money(Object.values(realiseAnnee).reduce((s, v) => s + v, 0)))
    ]) : null,
    // Ligne écart par année (si exécution dispo)
    hasExecution ? el('tr', { style: { background: '#fef3c7' } }, [
      el('td', { style: { padding: '8px', fontSize: '12px', fontWeight: 600 } }, 'Écart (planifié − exécuté)'),
      ...annees.map(a => {
        const ecart = totalAnnee[a] - (realiseAnnee[a] || 0);
        const color = ecart > 0 ? '#dc2626' : (ecart < 0 ? '#0066cc' : '#16a34a');
        return el('td', { style: { padding: '8px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color } },
          (ecart >= 0 ? '+' : '') + money(ecart));
      }),
      el('td', { style: { padding: '8px', textAlign: 'right', fontSize: '12px' } }, '')
    ]) : null
  ]);

  const table = el('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' } }, [thead, tbody]);

  // Bandeau de synthèse au-dessus du tableau
  const banner = el('div', {
    style: {
      padding: '10px 14px',
      marginBottom: '10px',
      background: '#eff6ff',
      borderLeft: '4px solid #0066cc',
      borderRadius: '4px',
      fontSize: '13px'
    }
  }, [
    el('strong', {}, `📅 Marché pluriannuel sur ${annees.length} années : ${annees[0]} → ${annees[annees.length - 1]}`),
    el('br', {}),
    el('span', { style: { color: '#374151', fontSize: '12px' } },
      `${bailleursOrder.length} bailleur${bailleursOrder.length > 1 ? 's' : ''} · ${lignes.length} ligne${lignes.length > 1 ? 's' : ''} de répartition · Total planifié ${money(grandTotal)}`)
  ]);

  return {
    isPluriannuel: true,
    node: el('div', {}, [banner, el('div', { style: { overflowX: 'auto' } }, [table])])
  };
}

export default { renderPluriannualite };
