/* ============================================
   Rules Engine - Business Rules Validation
   ============================================ */

import logger from '../lib/logger.js';

export class RulesEngine {
  constructor(rulesConfig, piecesMatrice, registries) {
    this.rules = rulesConfig;
    this.matrice = piecesMatrice;
    this.registries = registries;
    logger.info('[RulesEngine] Initialized with config');
  }

  /**
   * Check operation against all rules
   * @param {Object} operation - Operation entity
   * @param {string} phase - Current phase (PLANIF, PROC, ATTR, etc.)
   * @param {Object} context - Additional context (avenants, garanties, etc.)
   * @returns {Object} - {status: 'OK'|'WARN'|'BLOCK', messages: [...]}
   */
  check(operation, phase, context = {}) {
    const messages = [];

    // Run all checks
    messages.push(...this.checkProcedure(operation));
    messages.push(...this.checkPiecesObligatoires(operation, phase));
    messages.push(...this.checkAvenants(operation, context.avenants || []));
    messages.push(...this.checkEcheancier(operation, context.echeancier));
    messages.push(...this.checkGaranties(operation, context.garanties || []));
    messages.push(...this.checkDelais(operation, context));

    // Determine overall status
    const hasBlock = messages.some(m => m.severity === 'BLOCK');
    const hasWarn = messages.some(m => m.severity === 'WARN');

    return {
      status: hasBlock ? 'BLOCK' : hasWarn ? 'WARN' : 'OK',
      messages
    };
  }

  /**
   * Check procedure compliance
   */
  checkProcedure(operation) {
    const messages = [];

    if (!operation.typeMarche || !operation.montantPrevisionnel) {
      return messages;
    }

    const institutionType = operation.institutionType || 'ADMIN_CENTRALE';
    const matrice = this.rules.matrices_procedures[institutionType];

    if (!matrice) {
      messages.push({
        code: 'MATRICE_MANQUANTE',
        severity: 'WARN',
        message: `Matrice de procédure non définie pour ${institutionType}`
      });
      return messages;
    }

    // Find applicable procedures
    const applicableProcedures = matrice.seuils_montants.filter(seuil => {
      const montantOK =
        (seuil.min === null || operation.montantPrevisionnel >= seuil.min) &&
        (seuil.max === null || operation.montantPrevisionnel <= seuil.max);

      const natureOK =
        seuil.natureEco.includes('all') ||
        seuil.natureEco.includes(operation.chaineBudgetaire?.nature);

      const typeOK =
        seuil.typeMarche.includes('all') ||
        seuil.typeMarche.includes(operation.typeMarche);

      return montantOK && natureOK && typeOK;
    });

    if (applicableProcedures.length === 0) {
      messages.push({
        code: 'AUCUNE_PROCEDURE_APPLICABLE',
        severity: 'WARN',
        message: 'Aucune procédure standard trouvée pour ce montant et ce type de marché'
      });
      return messages;
    }

    // Check if selected procedure is in the list
    if (operation.modePassation) {
      const isValid = applicableProcedures.some(p => p.mode === operation.modePassation);

      if (!isValid) {
        messages.push({
          code: 'PROCEDURE_NON_CONFORME',
          severity: 'BLOCK',
          message: `Mode de passation ${operation.modePassation} non conforme. Procédures recommandées: ${applicableProcedures.map(p => p.mode).join(', ')}`,
          fix: 'Joindre justificatif de dérogation ou choisir une procédure conforme'
        });
      }
    } else {
      // Suggest procedures
      messages.push({
        code: 'PROCEDURE_SUGGEREE',
        severity: 'INFO',
        message: `Procédures recommandées: ${applicableProcedures.map(p => p.mode).join(', ')}`
      });
    }

    return messages;
  }

  /**
   * Check mandatory documents
   */
  checkPiecesObligatoires(operation, phase) {
    const messages = [];

    if (!phase) return messages;

    const phaseMatrice = this.matrice.matrice.find(p => p.phase === phase);
    if (!phaseMatrice) return messages;

    phaseMatrice.pieces.forEach(piece => {
      // Check if piece is mandatory for this operation
      const modeOK =
        piece.modePassation.includes('*') ||
        piece.modePassation.includes(operation.modePassation);

      const typeOK =
        piece.typeMarche.includes('*') ||
        piece.typeMarche.includes(operation.typeMarche);

      if (piece.obligatoire && modeOK && typeOK) {
        // Check if piece exists in documents
        const hasDoc = operation.documents?.some(d => d.type === piece.code);

        if (!hasDoc) {
          messages.push({
            code: 'PIECE_MANQUANTE',
            severity: 'BLOCK',
            message: `Pièce obligatoire manquante: ${piece.code}`,
            fix: 'Téléverser le document requis'
          });
        }
      }
    });

    return messages;
  }

  /**
   * Check avenants compliance
   */
  checkAvenants(operation, avenants) {
    const messages = [];

    if (!avenants || avenants.length === 0) {
      return messages;
    }

    // Calculate total avenant percentage
    const totalVariation = avenants.reduce((sum, av) => {
      return sum + (av.variationMontant || 0);
    }, 0);

    const montantInitial = operation.montantPrevisionnel || 0;
    const pourcentageCumul = montantInitial > 0
      ? (totalVariation / montantInitial) * 100
      : 0;

    const seuilAlerte = this.rules.seuils.SEUIL_ALERTE_AVENANTS.value;
    const seuilBlock = this.rules.seuils.SEUIL_CUMUL_AVENANTS.value;

    if (pourcentageCumul >= seuilBlock) {
      messages.push({
        code: 'SEUIL_AVENANT_DEPASSE',
        severity: 'BLOCK',
        message: `Cumul des avenants (${pourcentageCumul.toFixed(1)}%) dépasse le seuil autorisé (${seuilBlock}%)`,
        fix: 'Joindre autorisation spéciale ou réviser les avenants'
      });
    } else if (pourcentageCumul >= seuilAlerte) {
      messages.push({
        code: 'SEUIL_AVENANT_ALERTE',
        severity: 'WARN',
        message: `Cumul des avenants (${pourcentageCumul.toFixed(1)}%) approche du seuil maximum (${seuilBlock}%)`
      });
    }

    // Check individual avenant visa requirements
    avenants.forEach(av => {
      const pourcentageAv = montantInitial > 0
        ? (av.variationMontant / montantInitial) * 100
        : 0;

      if (pourcentageAv > 10 && !av.visaCFRef) {
        messages.push({
          code: 'VISA_CF_REQUIS',
          severity: 'BLOCK',
          message: `Avenant n°${av.numero} (${pourcentageAv.toFixed(1)}%) nécessite un visa CF préalable`,
          fix: 'Soumettre l\'avenant au contrôle financier'
        });
      }
    });

    return messages;
  }

  /**
   * Check echeancier validity
   */
  checkEcheancier(operation, echeancier) {
    const messages = [];

    if (!echeancier || !echeancier.items || echeancier.items.length === 0) {
      return messages;
    }

    // Check total matches operation amount
    const montantActuel = operation.montantActuel || operation.montantPrevisionnel;
    const totalEcheancier = echeancier.items.reduce((sum, item) => sum + (item.montant || 0), 0);

    const diff = Math.abs(totalEcheancier - montantActuel);
    const tolerance = montantActuel * 0.01; // 1% tolerance

    if (diff > tolerance) {
      messages.push({
        code: 'ECHEANCIER_TOTAL_INCORRECT',
        severity: 'BLOCK',
        message: `Total échéancier (${totalEcheancier.toLocaleString()}) ≠ Montant marché (${montantActuel.toLocaleString()})`,
        fix: 'Ajuster les montants pour que le total corresponde au montant du marché'
      });
    }

    // Check advance rate if first item is advance
    const firstItem = echeancier.items[0];
    if (firstItem && firstItem.typeEcheance === 'AVANCE') {
      const tauxAvance = (firstItem.montant / montantActuel) * 100;
      const tauxMax = this.rules.seuils.TAUX_MAX_AVANCE.value;

      if (tauxAvance > tauxMax) {
        messages.push({
          code: 'TAUX_AVANCE_DEPASSE',
          severity: 'BLOCK',
          message: `Taux d'avance (${tauxAvance.toFixed(1)}%) dépasse le maximum autorisé (${tauxMax}%)`,
          fix: 'Réduire le montant de l\'avance ou obtenir une dérogation'
        });
      }
    }

    return messages;
  }

  /**
   * Check garanties
   */
  checkGaranties(operation, garanties) {
    const messages = [];

    const hasAvance = garanties.some(g => g.type === 'AVANCE' && g.etat === 'ACTIVE');
    const hasBonneExec = garanties.some(g => g.type === 'BONNE_EXEC' && g.etat === 'ACTIVE');

    // Check if advance guarantee is required
    if (operation.montantPrevisionnel > 50000000 && !hasBonneExec) {
      messages.push({
        code: 'GARANTIE_BONNE_EXEC_REQUISE',
        severity: 'WARN',
        message: 'Garantie de bonne exécution recommandée pour ce montant',
        fix: 'Demander une garantie de bonne exécution'
      });
    }

    // Check expired guarantees
    garanties.forEach(g => {
      if (g.etat === 'ACTIVE' && g.dateEcheance) {
        const now = new Date();
        const echeance = new Date(g.dateEcheance);

        if (echeance < now) {
          messages.push({
            code: 'GARANTIE_EXPIREE',
            severity: 'WARN',
            message: `Garantie ${g.type} expirée depuis le ${echeance.toLocaleDateString('fr-FR')}`,
            fix: 'Renouveler la garantie ou effectuer la mainlevée'
          });
        }
      }
    });

    return messages;
  }

  /**
   * Check delays
   */
  checkDelais(operation, context) {
    const messages = [];

    // Check OS delay after visa
    if (operation.etat === 'VISE' && context.attribution) {
      const dateVisa = new Date(context.attribution.dates?.decisionCF);
      const dateOS = context.dateOS ? new Date(context.dateOS) : null;

      if (!dateOS) {
        const delaiMax = this.rules.seuils.DELAI_MAX_OS_APRES_VISA.value;
        const now = new Date();
        const diffJours = Math.floor((now - dateVisa) / (1000 * 60 * 60 * 24));

        if (diffJours > delaiMax) {
          messages.push({
            code: 'DELAI_OS_DEPASSE',
            severity: 'WARN',
            message: `OS non émis ${diffJours} jours après le visa (délai max: ${delaiMax} jours)`,
            fix: 'Émettre l\'ordre de service rapidement'
          });
        }
      }
    }

    return messages;
  }

  /**
   * Get suggested procedures for operation
   */
  getSuggestedProcedures(operation) {
    const institutionType = operation.institutionType || 'ADMIN_CENTRALE';
    const matrice = this.rules.matrices_procedures[institutionType];

    if (!matrice) return [];

    return matrice.seuils_montants.filter(seuil => {
      const montantOK =
        (seuil.min === null || operation.montantPrevisionnel >= seuil.min) &&
        (seuil.max === null || operation.montantPrevisionnel <= seuil.max);

      const natureOK =
        seuil.natureEco.includes('all') ||
        seuil.natureEco.includes(operation.chaineBudgetaire?.nature);

      const typeOK =
        seuil.typeMarche.includes('all') ||
        seuil.typeMarche.includes(operation.typeMarche);

      return montantOK && natureOK && typeOK;
    });
  }
}

export default RulesEngine;
