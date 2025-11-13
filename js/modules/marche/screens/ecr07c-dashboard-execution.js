/* ============================================
   ECR07C - Situation d'Exécution
   Suivi opérationnel de l'avancement des marchés
   ============================================ */

import { el, mount } from '../../../lib/dom.js';
import dataService, { ENTITIES } from '../../../datastore/data-service.js';
import DashboardCalculations from '../../../services/dashboard-calculations.js';
import { timelineChart, financialTimeline } from '../../../ui/widgets/timeline-chart.js';
import { simpleDonut } from '../../../ui/widgets/pie-chart.js';
import { money } from '../../../lib/format.js';

export async function renderDashboardExecution(container, filters = {}) {
  const operations = await dataService.query(ENTITIES.OPERATION);

  // Sélectionner le premier marché EN_EXEC comme exemple
  const selectedOp = operations.find(o => o.etat === 'EN_EXEC') || operations[0];

  if (!selectedOp) {
    mount(container, el('div', { className: 'alert alert-info' }, 'Aucun marché disponible'));
    return;
  }

  const avenants = (await dataService.query(ENTITIES.AVENANT))
    .filter(a => a.operationId === selectedOp.id);
  const decomptes = (await dataService.query(ENTITIES.DECOMPTE))
    .filter(d => d.operationId === selectedOp.id);

  const kpis = DashboardCalculations.calculateMarcheKPIs(selectedOp, avenants, decomptes);

  const content = el('div', { className: 'dashboard-execution' }, [
    // Sélecteur de marché (simplifié)
    el('div', { className: 'card', style: 'margin-bottom: 24px;' }, [
      el('div', { className: 'card-body' }, [
        el('strong', {}, 'Marché sélectionné : '),
        el('span', {}, selectedOp.objet || 'Sans objet')
      ])
    ]),

    // Fiche synthétique
    el('div', {
      className: 'card',
      style: 'margin-bottom: 24px; background: linear-gradient(135deg, #FF6B35 0%, #F59E0B 100%); color: white;'
    }, [
      el('div', { className: 'card-body' }, [
        el('div', { style: 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;' }, [
          el('div', {}, [
            el('div', { style: 'font-size: 13px; opacity: 0.9;' }, 'Numéro marché'),
            el('div', { style: 'font-weight: bold; margin-top: 4px;' }, selectedOp.id || 'N/A')
          ]),
          el('div', {}, [
            el('div', { style: 'font-size: 13px; opacity: 0.9;' }, 'Unité administrative'),
            el('div', { style: 'font-weight: bold; margin-top: 4px;' }, selectedOp.unite || 'N/A')
          ]),
          el('div', {}, [
            el('div', { style: 'font-size: 13px; opacity: 0.9;' }, 'Montant de base'),
            el('div', { style: 'font-weight: bold; margin-top: 4px;' }, money(kpis.montantBase))
          ])
        ])
      ])
    ]),

    // Graphiques d'avancement
    el('div', { style: 'display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;' }, [
      el('div', { className: 'card' }, [
        el('div', { className: 'card-body' }, [
          timelineChart({
            dureeInitiale: kpis.dureeInitiale,
            dureeAvenants: kpis.dureeAvenants,
            dureeEcoulee: kpis.dureeEcoulee,
            dureeTotale: kpis.dureeTotale
          })
        ])
      ]),

      el('div', { className: 'card' }, [
        el('div', { className: 'card-body' }, [
          financialTimeline({
            montantBase: kpis.montantBase,
            montantAvenants: kpis.montantAvenants,
            cumulDecomptes: kpis.cumulDecomptes,
            resteAExecuter: kpis.resteAPayer
          })
        ])
      ])
    ]),

    // Avancement physique
    el('div', { className: 'card' }, [
      el('div', { className: 'card-header' }, [
        el('h3', { className: 'card-title' }, 'Avancement Physique')
      ]),
      el('div', { className: 'card-body', style: 'display: flex; justify-content: center;' }, [
        simpleDonut(kpis.tauxExecutionFinancier, {
          size: 200,
          label: 'Exécution Physique'
        })
      ])
    ])
  ]);

  mount(container, content);
}

export default { renderDashboardExecution };
