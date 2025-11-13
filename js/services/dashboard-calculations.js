/* ============================================
   Dashboard Calculations Service
   Calculs de KPIs et métriques pour le dashboard
   ============================================ */

/**
 * Service de calcul des KPIs et métriques du dashboard
 */
export class DashboardCalculations {

  /**
   * Calculer les KPIs globaux du dashboard
   * @param {Array} operations - Liste des opérations
   * @param {Array} avenants - Liste des avenants
   * @param {Array} decomptes - Liste des décomptes
   * @param {Object} rulesConfig - Configuration des règles
   * @returns {Object} KPIs globaux
   */
  static calculateGlobalKPIs(operations, avenants = [], decomptes = [], rulesConfig = {}) {
    const totalMarches = operations.length;
    const enCours = operations.filter(o => o.etat === 'EN_EXEC').length;
    const clotures = operations.filter(o => o.etat === 'CLOS').length;
    const planifies = operations.filter(o => o.etat === 'PLANIFIE').length;

    const budgetPrevu = operations.reduce((sum, o) => sum + (o.montantPrevisionnel || 0), 0);
    const budgetActuel = operations.reduce((sum, o) => sum + (o.montantActuel || o.montantPrevisionnel || 0), 0);

    // Calculer cumul décomptes
    const cumulDecomptes = decomptes.reduce((sum, d) => sum + (d.netTTC || 0), 0);
    const tauxExecutionGlobal = budgetActuel > 0 ? (cumulDecomptes / budgetActuel) * 100 : 0;

    // Calculer budget disponible (simplifié)
    const budgetDisponible = budgetPrevu - budgetActuel;

    return {
      totalMarches,
      enCours,
      clotures,
      planifies,
      budgetPrevu,
      budgetActuel,
      budgetDisponible,
      cumulDecomptes,
      tauxExecutionGlobal: Math.round(tauxExecutionGlobal * 10) / 10
    };
  }

  /**
   * Calculer les KPIs d'un marché spécifique
   * @param {Object} operation - Opération
   * @param {Array} avenants - Avenants du marché
   * @param {Array} decomptes - Décomptes du marché
   * @returns {Object} KPIs du marché
   */
  static calculateMarcheKPIs(operation, avenants = [], decomptes = []) {
    const montantBase = operation.montantPrevisionnel || 0;
    const montantAvenants = avenants.reduce((sum, a) => sum + (a.variationMontant || 0), 0);
    const tauxAvenant = montantBase > 0 ? (montantAvenants / montantBase) * 100 : 0;
    const montantGlobal = montantBase + montantAvenants;

    const cumulDecomptes = decomptes.reduce((sum, d) => sum + (d.netTTC || 0), 0);
    const resteAPayer = montantGlobal - cumulDecomptes;
    const tauxExecutionFinancier = montantGlobal > 0 ? (cumulDecomptes / montantGlobal) * 100 : 0;

    // Durée
    const dureeInitiale = operation.dureePrevisionnelle || 0;
    const dureeAvenants = avenants.reduce((sum, a) => sum + (a.variationDuree || 0), 0);
    const dureeTotale = dureeInitiale + dureeAvenants;

    // Calcul durée écoulée (simplifié - suppose date de début connue)
    const dureeEcoulee = 0; // À calculer avec dates réelles
    const tauxAvancementTemps = dureeTotale > 0 ? (dureeEcoulee / dureeTotale) * 100 : 0;

    return {
      montantBase,
      montantAvenants,
      tauxAvenant: Math.round(tauxAvenant * 10) / 10,
      montantGlobal,
      cumulDecomptes,
      resteAPayer,
      tauxExecutionFinancier: Math.round(tauxExecutionFinancier * 10) / 10,
      dureeInitiale,
      dureeAvenants,
      dureeTotale,
      dureeEcoulee,
      tauxAvancementTemps: Math.round(tauxAvancementTemps * 10) / 10
    };
  }

  /**
   * Détecter les alertes et non-conformités
   * @param {Array} operations - Liste des opérations
   * @param {Array} avenants - Liste des avenants
   * @param {Array} ordresService - Liste des ordres de service
   * @param {Array} anos - Liste des ANO
   * @param {Array} visasCF - Liste des visas CF
   * @param {Object} rulesConfig - Configuration des règles
   * @returns {Array} Liste des alertes
   */
  static detectAlerts(operations, avenants = [], ordresService = [], anos = [], visasCF = [], rulesConfig = {}) {
    const alerts = [];

    const SEUIL_ALERTE_AVENANTS = rulesConfig.SEUIL_ALERTE_AVENANTS || 0.25;
    const SEUIL_CUMUL_AVENANTS = rulesConfig.SEUIL_CUMUL_AVENANTS || 0.30;
    const DELAI_MAX_OS = rulesConfig.DELAI_MAX_OS_APRES_VISA || 30;

    // 1. Alertes avenants > 25%
    operations.forEach(op => {
      const opAvenants = avenants.filter(a => a.operationId === op.id);
      const montantBase = op.montantPrevisionnel || 0;
      const montantAvenants = opAvenants.reduce((sum, a) => sum + (a.variationMontant || 0), 0);
      const tauxAvenant = montantBase > 0 ? montantAvenants / montantBase : 0;

      if (tauxAvenant > SEUIL_ALERTE_AVENANTS && tauxAvenant <= SEUIL_CUMUL_AVENANTS) {
        alerts.push({
          type: 'warning',
          category: 'AVENANT_ALERTE',
          message: `Marché "${op.objet}" : avenants à ${(tauxAvenant * 100).toFixed(1)}% (seuil: ${SEUIL_ALERTE_AVENANTS * 100}%)`,
          operationId: op.id,
          severity: 'MOYEN'
        });
      }

      if (tauxAvenant > SEUIL_CUMUL_AVENANTS) {
        alerts.push({
          type: 'error',
          category: 'AVENANT_DEPASSEMENT',
          message: `Marché "${op.objet}" : DÉPASSEMENT avenants à ${(tauxAvenant * 100).toFixed(1)}% (limite: ${SEUIL_CUMUL_AVENANTS * 100}%)`,
          operationId: op.id,
          severity: 'CRITIQUE'
        });
      }
    });

    // 2. Alertes OS en retard
    const operationsVisees = operations.filter(o => o.etat === 'VISE' || o.etat === 'EN_EXEC');
    operationsVisees.forEach(op => {
      const visa = visasCF.find(v => v.operationId === op.id && v.decision === 'VISA');
      const os = ordresService.find(o => o.operationId === op.id);

      if (visa && !os) {
        const dateVisa = new Date(visa.dateDecision);
        const aujourdhui = new Date();
        const delaiEcoule = Math.floor((aujourdhui - dateVisa) / (1000 * 60 * 60 * 24));

        if (delaiEcoule > DELAI_MAX_OS) {
          alerts.push({
            type: 'warning',
            category: 'OS_RETARD',
            message: `Marché "${op.objet}" : OS non délivré (${delaiEcoule} jours après visa)`,
            operationId: op.id,
            severity: 'MOYEN'
          });
        }
      }
    });

    // 3. Alertes ANO en attente
    const anosEnAttente = anos.filter(a => a.decision === 'EN_ATTENTE' || !a.decision);
    anosEnAttente.forEach(ano => {
      const op = operations.find(o => o.id === ano.operationId);
      if (op) {
        alerts.push({
          type: 'info',
          category: 'ANO_ATTENTE',
          message: `Marché "${op.objet}" : ANO en attente auprès de ${ano.organismeDetail || ano.organisme}`,
          operationId: op.id,
          severity: 'FAIBLE'
        });
      }
    });

    return alerts;
  }

  /**
   * Grouper les opérations par état
   * @param {Array} operations - Liste des opérations
   * @returns {Object} Groupement par état
   */
  static groupByEtat(operations) {
    const groups = {};
    operations.forEach(op => {
      const etat = op.etat || 'INCONNU';
      groups[etat] = (groups[etat] || 0) + 1;
    });
    return groups;
  }

  /**
   * Grouper les opérations par source de financement
   * @param {Array} operations - Liste des opérations
   * @returns {Object} Groupement par source
   */
  static groupBySourceFinancement(operations) {
    const groups = {};
    operations.forEach(op => {
      const source = op.sourceFinancement || 'Non spécifiée';
      const montant = op.montantActuel || op.montantPrevisionnel || 0;

      if (!groups[source]) {
        groups[source] = { count: 0, montant: 0 };
      }
      groups[source].count++;
      groups[source].montant += montant;
    });
    return groups;
  }

  /**
   * Grouper les opérations par type de marché
   * @param {Array} operations - Liste des opérations
   * @returns {Object} Groupement par type
   */
  static groupByTypeMarche(operations) {
    const groups = {};
    operations.forEach(op => {
      const type = op.typeMarche || 'Non spécifié';
      const montant = op.montantActuel || op.montantPrevisionnel || 0;

      if (!groups[type]) {
        groups[type] = { count: 0, montant: 0 };
      }
      groups[type].count++;
      groups[type].montant += montant;
    });
    return groups;
  }

  /**
   * Grouper les opérations par unité administrative
   * @param {Array} operations - Liste des opérations
   * @returns {Object} Groupement par UA
   */
  static groupByUnite(operations) {
    const groups = {};
    operations.forEach(op => {
      const unite = op.unite || 'Non spécifiée';
      const montant = op.montantActuel || op.montantPrevisionnel || 0;

      if (!groups[unite]) {
        groups[unite] = { count: 0, montant: 0 };
      }
      groups[unite].count++;
      groups[unite].montant += montant;
    });
    return groups;
  }

  /**
   * Obtenir les top N marchés par montant
   * @param {Array} operations - Liste des opérations
   * @param {Number} n - Nombre de marchés à retourner
   * @returns {Array} Top N marchés
   */
  static getTopMarches(operations, n = 10) {
    return [...operations]
      .sort((a, b) => {
        const montantA = a.montantActuel || a.montantPrevisionnel || 0;
        const montantB = b.montantActuel || b.montantPrevisionnel || 0;
        return montantB - montantA;
      })
      .slice(0, n);
  }

  /**
   * Obtenir les dernières opérations modifiées
   * @param {Array} operations - Liste des opérations
   * @param {Number} n - Nombre d'opérations à retourner
   * @returns {Array} Dernières opérations
   */
  static getRecentOperations(operations, n = 10) {
    return [...operations]
      .filter(op => op.updatedAt)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, n);
  }

  /**
   * Calculer l'évolution mensuelle des engagements
   * @param {Array} operations - Liste des opérations
   * @param {Number} mois - Nombre de mois à analyser
   * @returns {Array} Évolution par mois
   */
  static getEvolutionMensuelle(operations, mois = 12) {
    const now = new Date();
    const evolution = [];

    for (let i = mois - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const moisLabel = date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' });

      const opsMonth = operations.filter(op => {
        if (!op.createdAt) return false;
        const opDate = new Date(op.createdAt);
        return opDate.getFullYear() === date.getFullYear() &&
               opDate.getMonth() === date.getMonth();
      });

      const montant = opsMonth.reduce((sum, o) => sum + (o.montantPrevisionnel || 0), 0);

      evolution.push({
        mois: moisLabel,
        count: opsMonth.length,
        montant
      });
    }

    return evolution;
  }

  /**
   * Calculer les statistiques de conformité
   * @param {Array} operations - Liste des opérations
   * @param {Array} avenants - Liste des avenants
   * @param {Object} rulesConfig - Configuration des règles
   * @returns {Object} Statistiques de conformité
   */
  static calculateConformiteStats(operations, avenants = [], rulesConfig = {}) {
    const SEUIL_CUMUL_AVENANTS = rulesConfig.SEUIL_CUMUL_AVENANTS || 0.30;

    let totalWithAvenants = 0;
    let totalRespectSeuil = 0;
    let totalDerogations = 0;

    operations.forEach(op => {
      const opAvenants = avenants.filter(a => a.operationId === op.id);

      if (opAvenants.length > 0) {
        totalWithAvenants++;
        const montantBase = op.montantPrevisionnel || 0;
        const montantAvenants = opAvenants.reduce((sum, a) => sum + (a.variationMontant || 0), 0);
        const tauxAvenant = montantBase > 0 ? montantAvenants / montantBase : 0;

        if (tauxAvenant <= SEUIL_CUMUL_AVENANTS) {
          totalRespectSeuil++;
        }
      }

      if (op.procDerogation?.isDerogation) {
        totalDerogations++;
      }
    });

    const tauxRespectSeuil = totalWithAvenants > 0
      ? (totalRespectSeuil / totalWithAvenants) * 100
      : 100;

    const tauxDerogations = operations.length > 0
      ? (totalDerogations / operations.length) * 100
      : 0;

    return {
      totalWithAvenants,
      totalRespectSeuil,
      tauxRespectSeuil: Math.round(tauxRespectSeuil * 10) / 10,
      totalDerogations,
      tauxDerogations: Math.round(tauxDerogations * 10) / 10
    };
  }

  /**
   * Préparer les données pour graphique en barres (états)
   * @param {Array} operations - Liste des opérations
   * @returns {Array} Données pour graphique
   */
  static prepareChartDataEtats(operations) {
    const groups = this.groupByEtat(operations);

    const etatsConfig = {
      'PLANIFIE': { label: 'Planifié', color: '#5B9BD5' },
      'EN_PROCEDURE': { label: 'En Procédure', color: '#9966FF' },
      'EN_ATTRIBUTION': { label: 'En Attribution', color: '#F59E0B' },
      'VISE': { label: 'Visé', color: '#A3E635' },
      'EN_EXEC': { label: 'En Exécution', color: '#22C55E' },
      'CLOS': { label: 'Clôturé', color: '#6B7280' },
      'REFUSE': { label: 'Refusé', color: '#EF4444' }
    };

    return Object.entries(groups).map(([etat, count]) => ({
      label: etatsConfig[etat]?.label || etat,
      value: count,
      color: etatsConfig[etat]?.color || '#999999',
      etat
    }));
  }

  /**
   * Préparer les données pour graphique circulaire (sources financement)
   * @param {Array} operations - Liste des opérations
   * @returns {Array} Données pour graphique
   */
  static prepareChartDataFinancement(operations) {
    const groups = this.groupBySourceFinancement(operations);

    const total = Object.values(groups).reduce((sum, g) => sum + g.montant, 0);

    const colors = ['#1E40AF', '#059669', '#DC2626', '#F59E0B', '#8B5CF6', '#EC4899'];

    return Object.entries(groups).map(([source, data], index) => ({
      label: source,
      value: data.montant,
      count: data.count,
      percentage: total > 0 ? (data.montant / total) * 100 : 0,
      color: colors[index % colors.length]
    }));
  }
}

export default DashboardCalculations;
