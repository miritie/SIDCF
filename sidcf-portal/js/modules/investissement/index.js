/* ============================================
   Module Investissement - Routes & Navigation
   ============================================
   Gestion des Projets d'Investissement Publics (PIP)
   Workflow: Notifié → Transféré → Éclaté → Exécuté
   ============================================ */

import router from '../../router.js';
import logger from '../../lib/logger.js';

// Import et ré-export des constantes (pour compatibilité)
export { INV_SIDEBAR_MENU, getCurrentYear, getAvailableYears } from './inv-constants.js';

// Import des écrans existants
import { renderInvDashboard } from './screens/inv-dashboard.js';
import { renderInvProjetsList } from './screens/inv-projets-list.js';
import { renderInvProjetFiche } from './screens/inv-projet-fiche.js';
import { renderInvPortefeuille } from './screens/inv-portefeuille.js';
import { renderInvAlertes } from './screens/inv-alertes.js';

// Import des nouveaux écrans d'analyse par axe
import { renderInvSoutenabilite } from './screens/inv-soutenabilite.js';
import { renderInvPhysique } from './screens/inv-physique.js';
import { renderInvPhysicoFinancier } from './screens/inv-physico-financier.js';
import { renderInvResultats } from './screens/inv-resultats.js';
import { renderInvGouvernance } from './screens/inv-gouvernance.js';

/**
 * Register all Investissement module routes
 */
export function registerInvestissementRoutes() {
  logger.info('[Investissement] Registering module routes...');

  // Dashboard principal
  router.register('/investissement/home', renderInvDashboard);
  router.register('/investissement/dashboard', renderInvDashboard);

  // Liste des projets
  router.register('/investissement/projets', renderInvProjetsList);

  // Fiche projet avec onglets
  router.register('/investissement/projet', renderInvProjetFiche);

  // Vue Portefeuille
  router.register('/investissement/portefeuille', renderInvPortefeuille);

  // Centre d'alertes
  router.register('/investissement/alertes', renderInvAlertes);

  // ============================================
  // Écrans d'analyse par axe
  // ============================================

  // Axe 2: Soutenabilité & Pluriannualité
  router.register('/investissement/soutenabilite', renderInvSoutenabilite);

  // Axe 3: Suivi Physique & RSF
  router.register('/investissement/physique', renderInvPhysique);

  // Axe 4: Croisement Physico-Financier
  router.register('/investissement/physico-financier', renderInvPhysicoFinancier);

  // Axe 5: Résultats & GAR
  router.register('/investissement/resultats', renderInvResultats);

  // Axe 6: Gouvernance & Documentation
  router.register('/investissement/gouvernance', renderInvGouvernance);

  // Aliases pour compatibilité
  router.alias('/inv-dashboard', '/investissement/dashboard');
  router.alias('/inv-projets', '/investissement/projets');
  router.alias('/inv-portefeuille', '/investissement/portefeuille');
  router.alias('/inv-alertes', '/investissement/alertes');

  logger.info('[Investissement] Routes registered successfully');
}

export default { registerInvestissementRoutes };
