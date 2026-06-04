/* ============================================
   Marché+ Module - Route Registration
   Cloné du module Marché avec préfixe /mp/
   ============================================ */

import router from '../../router.js';
import renderImportPPM from './screens/ecr01a-import-ppm.js';
import renderPPMList from './screens/ecr01b-ppm-unitaire.js';
import renderFicheMarche from './screens/ecr01c-fiche-marche.js';
import renderPPMCreateLine from './screens/ecr01d-ppm-create-line.js';
import renderProcedurePV from './screens/ecr02a-procedure-pv.js';
import renderRecours from './screens/ecr02b-recours.js';
import renderAttribution from './screens/ecr03a-attribution.js';
import renderEcheancierCle from './screens/ecr03b-echeancier-cle.js';
import renderVisaCF from './screens/ecr03c-visa-cf.js';
import renderExecutionOS from './screens/ecr04a-execution-os.js';
import renderAvenants from './screens/ecr04b-avenants.js';
import renderAvenantCreate from './screens/ecr04b-avenant-create.js';
import renderGaranties from './screens/ecr04c-garanties.js';
import renderCloture from './screens/ecr05-cloture.js';
import renderDashboardCF from './screens/ecr06-dashboard-cf.js';
import logger from '../../lib/logger.js';

/**
 * Register all Marché+ module routes (préfixe /mp/)
 * Aucun alias legacy : les routes /ecr...  restent exclusives au module Marché original.
 */
export function registerMarchePlusRoutes() {
  logger.info('[Marché+] Registering routes...');

  // PPM & Planning
  router.register('/mp/ppm-list', renderPPMList);
  router.register('/mp/ppm-import', renderImportPPM);
  router.register('/mp/ppm-create-line', renderPPMCreateLine);

  // Fiche marché
  router.register('/mp/fiche-marche', renderFicheMarche);

  // Procedure
  router.register('/mp/procedure', renderProcedurePV);
  router.register('/mp/recours', renderRecours);

  // Attribution
  router.register('/mp/attribution', renderAttribution);
  // Modif #132 (E-1/E-9) — fusion étapes 3 & 4 : l'URL Visa CF rend désormais
  // l'écran d'enregistrement (l'approbation y est contenue).
  router.register('/mp/visa-cf', renderAttribution);
  router.register('/mp/echeancier', renderEcheancierCle);

  // Execution
  router.register('/mp/execution', renderExecutionOS);
  router.register('/mp/avenants', renderAvenants);
  router.register('/mp/avenant-create', renderAvenantCreate);
  router.register('/mp/garanties', renderGaranties);

  // Cloture
  router.register('/mp/cloture', renderCloture);

  // Dashboard
  router.register('/mp/dashboard', renderDashboardCF);

  logger.info('[Marché+] Routes registered (préfixe /mp/)');
}

export default { registerMarchePlusRoutes };
