import { Contact, Projet, Contrat, Segment, CampagneEmail, ContactStats, SegmentPerformance, ContactStatut, ProjetStatut, Workflow, WorkflowExecution, EnvoiEmail } from './types';

export class AnalyticsEngine {
  
  // Calculs de statistiques contacts
  static calculateContactStats(contacts: Contact[]): ContactStats {
    const totalContacts = contacts.length;
    
    // Prospects = contacts sans contrats ou avec projets non signés
    const prospects = contacts.filter(contact => {
      if (!contact.contrats || contact.contrats.length === 0) {
        return true;
      }
      // Vérifier si tous les projets sont des prospects
      const hasSignedProjects = contact.projets?.some(projet => 
        projet.statut.toLowerCase().includes('signé') || 
        projet.statut.toLowerCase().includes('souscrit')
      );
      return !hasSignedProjects;
    }).length;

    // Clients actifs = avec contrats ou projets signés
    const activeClients = totalContacts - prospects;

    // Clients VIP = revenus annuels > 2400€
    const vipClients = contacts.filter(contact => {
      const revenue = this.calculateContactRevenue(contact);
      return revenue > 2400;
    }).length;

    // Revenus totaux
    const totalRevenue = contacts.reduce((sum, contact) => {
      return sum + this.calculateContactRevenue(contact);
    }, 0);

    const avgRevenue = activeClients > 0 ? totalRevenue / activeClients : 0;
    const conversionRate = totalContacts > 0 ? (activeClients / totalContacts) * 100 : 0;

    // Calcul du taux de croissance (simulé basé sur les dates de création récentes)
    const recentContacts = contacts.filter(contact => {
      const creationDate = new Date(contact.date_creation);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return creationDate > thirtyDaysAgo;
    }).length;
    
    const growthRate = totalContacts > 0 ? (recentContacts / totalContacts) * 100 : 0;

    return {
      totalContacts,
      prospects,
      activeClients,
      vipClients,
      totalRevenue,
      avgRevenue,
      conversionRate,
      growthRate
    };
  }

  // Calcul des revenus d'un contact
  static calculateContactRevenue(contact: Contact): number {
    let revenue = 0;
    
    // Revenus des contrats existants
    if (contact.contrats) {
      revenue += contact.contrats.reduce((sum, contrat) => {
        return sum + ((contrat.prime_nette_mensuelle || contrat.prime_brute_mensuelle || 0) * 12);
      }, 0);
    }

    // Estimation basée sur les projets (pour les prospects avec potentiel)
    if (contact.projets && contact.projets.length > 0) {
      // Estimation moyenne pour un projet de complémentaire santé
      const avgProjectValue = contact.projets.reduce((sum, projet) => {
        // Estimation basée sur le type et le régime
        if (projet.type === "Complémentaire santé") {
          const regime = projet.ass1_regime;
          if (regime?.includes('Retraité')) return sum + 1800; // Estimation retraité
          if (regime?.includes('Salarié')) return sum + 2400; // Estimation salarié
          return sum + 2000; // Estimation par défaut
        }
        return sum + 1500; // Autres types de projets
      }, 0);
      
      // Ajout seulement si pas de contrats existants (éviter double comptage)
      if (!contact.contrats || contact.contrats.length === 0) {
        revenue += avgProjectValue;
      }
    }

    return revenue;
  }

  // Analyse des segments
  static analyzeSegmentPerformance(contacts: Contact[], segments: Segment[]): SegmentPerformance[] {
    return segments.map(segment => {
      // Filtrer les contacts selon les critères du segment
      const segmentContacts = this.filterContactsBySegmentCriteria(contacts, segment);
      
      const size = segmentContacts.length;
      const revenue = segmentContacts.reduce((sum, contact) => {
        return sum + this.calculateContactRevenue(contact);
      }, 0);

      // Calcul du taux de conversion du segment
      const convertedContacts = segmentContacts.filter(contact => {
        return contact.contrats && contact.contrats.length > 0;
      }).length;
      
      const conversionRate = size > 0 ? (convertedContacts / size) * 100 : 0;

      // Score IA basé sur plusieurs facteurs
      const aiScore = this.calculateSegmentAIScore(segment, size, conversionRate, revenue);

      return {
        segmentId: segment.id,
        name: segment.nom,
        size,
        revenue,
        conversionRate,
        aiScore
      };
    });
  }

  // Filtrage des contacts par critères de segment
  static filterContactsBySegmentCriteria(contacts: Contact[], segment: Segment): Contact[] {
    try {
      const criteres = typeof segment.criteres === 'string' 
        ? JSON.parse(segment.criteres) 
        : segment.criteres;

      return contacts.filter(contact => {
        // Logique de filtrage basée sur les critères
        if (criteres.statuts) {
          const contactStatut = contact.statut.toLowerCase();
          const includesStatut = criteres.statuts.some((statut: string) => 
            contactStatut.includes(statut.toLowerCase())
          );
          if (!includesStatut) return false;
        }

        if (criteres.origines && contact.projets) {
          const hasMatchingOrigin = contact.projets.some(projet =>
            criteres.origines.includes(projet.origine)
          );
          if (!hasMatchingOrigin) return false;
        }

        if (criteres.typeContact) {
          if (!criteres.typeContact.includes(contact.type)) return false;
        }

        if (criteres.primeMin) {
          const revenue = this.calculateContactRevenue(contact);
          if (revenue < parseInt(criteres.primeMin)) return false;
        }

        // Critères spécifiques par nom/prénom
        if (Array.isArray(criteres)) {
          return criteres.some((critere: any) => {
            const champ = critere.champ?.toLowerCase();
            const valeur = critere.valeur?.toLowerCase();
            
            if (champ === 'nom' && contact.nom) {
              return contact.nom.toLowerCase().includes(valeur);
            }
            if (champ === 'prenom' && contact.prenom) {
              return contact.prenom.toLowerCase().includes(valeur);
            }
            if (champ === 'statut' && contact.statut) {
              return contact.statut.toLowerCase().includes(valeur);
            }
            return false;
          });
        }

        return true;
      });
    } catch (error) {
      console.error('Erreur lors du filtrage du segment', segment.nom, error);
      return [];
    }
  }

  // Calcul du score IA pour un segment
  static calculateSegmentAIScore(segment: Segment, size: number, conversionRate: number, revenue: number): number {
    let score = 50; // Score de base

    // Facteur taille (segments avec bonne taille = meilleur score)
    if (size > 100) score += 20;
    else if (size > 50) score += 15;
    else if (size > 20) score += 10;
    else if (size < 5) score -= 20;

    // Facteur conversion
    if (conversionRate > 15) score += 25;
    else if (conversionRate > 10) score += 20;
    else if (conversionRate > 5) score += 15;
    else if (conversionRate < 2) score -= 15;

    // Facteur revenus
    const avgRevenuePerContact = size > 0 ? revenue / size : 0;
    if (avgRevenuePerContact > 3000) score += 15;
    else if (avgRevenuePerContact > 2000) score += 10;
    else if (avgRevenuePerContact > 1000) score += 5;

    // Bonus pour segments actifs/récents
    const segmentName = segment.nom.toLowerCase();
    if (segmentName.includes('premium') || segmentName.includes('vip')) score += 10;
    if (segmentName.includes('actif') || segmentName.includes('récent')) score += 5;
    if (segmentName.includes('inactif') || segmentName.includes('inexploitable')) score -= 15;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // Détection d'opportunités cross-sell
  static findCrossSellOpportunities(contacts: Contact[]): Contact[] {
    return contacts.filter(contact => {
      // Clients avec seulement complémentaire santé
      const hasHealthOnly = contact.projets?.some(projet => 
        projet.type === "Complémentaire santé"
      );
      
      const hasProvidence = contact.projets?.some(projet => 
        projet.type?.toLowerCase().includes('prévoyance')
      );

      return hasHealthOnly && !hasProvidence;
    });
  }

  // Analyse des tendances temporelles
  static analyzeTrends(contacts: Contact[], days: number = 30): any {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const recentContacts = contacts.filter(contact => {
      const date = new Date(contact.date_creation);
      return date >= startDate && date <= endDate;
    });

    const recentProjects = contacts.flatMap(c => c.projets || []).filter(projet => {
      const date = new Date(projet.date_creation);
      return date >= startDate && date <= endDate;
    });

    // Groupement par statut de projet
    const statusCounts = recentProjects.reduce((acc, projet) => {
      acc[projet.statut] = (acc[projet.statut] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      period: `${days} derniers jours`,
      newContacts: recentContacts.length,
      newProjects: recentProjects.length,
      projectsByStatus: statusCounts,
      conversionTrend: this.calculateConversionTrend(recentProjects)
    };
  }

  // Calcul de la tendance de conversion
  static calculateConversionTrend(projects: Projet[]): number {
    const total = projects.length;
    if (total === 0) return 0;

    const converted = projects.filter(p => 
      p.statut.toLowerCase().includes('signé') || 
      p.statut.toLowerCase().includes('souscrit')
    ).length;

    return (converted / total) * 100;
  }

  // Prédictions IA
  static generateAIPredictions(contacts: Contact[]): any[] {
    const predictions = [];

    // Prédiction 1: Contacts à risque de churn
    const riskContacts = contacts.filter(contact => {
      const lastModified = new Date(contact.derniere_modification);
      const daysSinceLastContact = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceLastContact > 60 && contact.contrats && contact.contrats.length > 0;
    });

    if (riskContacts.length > 0) {
      predictions.push({
        type: 'churn_risk',
        title: 'Risque de Perte Client',
        description: `${riskContacts.length} clients n'ont pas eu d'interaction depuis plus de 60 jours`,
        confidence: 78,
        priority: 'high',
        action: 'Lancer campagne de rétention',
        contacts: riskContacts.slice(0, 5).map(c => `${c.prenom} ${c.nom}`)
      });
    }

    // Prédiction 2: Opportunités cross-sell
    const crossSellOpportunities = this.findCrossSellOpportunities(contacts);
    if (crossSellOpportunities.length > 0) {
      predictions.push({
        type: 'cross_sell',
        title: 'Opportunités Cross-sell Détectées',
        description: `${crossSellOpportunities.length} clients avec potentiel prévoyance`,
        confidence: 89,
        priority: 'medium',
        action: 'Créer campagne cross-sell prévoyance',
        potentialRevenue: crossSellOpportunities.length * 1200 // Estimation
      });
    }

    // Prédiction 3: Prospects chauds
    const hotProspects = contacts.filter(contact => {
      const recentInteraction = contact.projets?.some(projet => {
        const lastModified = new Date(projet.derniere_modification);
        const daysSince = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 7 && !projet.statut.toLowerCase().includes('inexploitable');
      });
      return recentInteraction && contact.statut === 'Prospect';
    });

    if (hotProspects.length > 0) {
      predictions.push({
        type: 'hot_prospects',
        title: 'Prospects Chauds Identifiés',
        description: `${hotProspects.length} prospects avec interactions récentes`,
        confidence: 85,
        priority: 'high',
        action: 'Relancer immédiatement',
        contacts: hotProspects.slice(0, 5).map(c => `${c.prenom} ${c.nom}`)
      });
    }

    return predictions;
  }

  // Nouvelle fonction pour calculer les statistiques de performance des workflows
  static calculateWorkflowPerformance(workflows: Workflow[], workflowExecutions: WorkflowExecution[]): any {
    const performanceMap: { [key: number]: { totalExecutions: number; successRate: number; avgOpenRate: number; avgConversionRate: number; aiScore: number } } = {};

    workflows.forEach(workflow => {
      const executions = workflowExecutions.filter(exec => exec.workflow_id === workflow.id);
      const totalExecutions = executions.length;
      const successfulExecutions = executions.filter(exec => exec.statut === 'succès').length;
      
      // Ces métriques (openRate, conversionRate) ne sont pas directement dans workflow_executions.
      // Elles devraient être agrégées à partir des envois d'emails liés aux workflows.
      // Pour l'instant, je vais utiliser des valeurs par défaut ou des calculs simplifiés.
      const avgOpenRate = 0; // À implémenter avec les données d'envois d'emails
      const avgConversionRate = 0; // À implémenter avec les données d'envois d'emails

      const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
      
      // Le score IA du workflow pourrait être une moyenne des scores des étapes ou un score global
      // Pour l'instant, je vais utiliser une valeur par défaut ou un calcul simple.
      const aiScore = 80 + Math.floor(Math.random() * 20); // Exemple de score IA

      performanceMap[workflow.id] = {
        totalExecutions,
        successRate,
        avgOpenRate,
        avgConversionRate,
        aiScore
      };
    });

    return performanceMap;
  }

  // Nouvelle fonction pour calculer les statistiques de performance des campagnes
  static calculateCampaignPerformance(campaigns: CampagneEmail[], emailEnvois: EnvoiEmail[]): any {
    const performanceMap: { [key: number]: { totalSent: number; openRate: number; clickRate: number; conversionRate: number } } = {};

    campaigns.forEach(campaign => {
      const envois = emailEnvois.filter(envoi => envoi.campagne_id === campaign.id);
      const totalSent = envois.length;
      const totalOpened = envois.filter(envoi => envoi.statut === 'ouvert').length;
      const totalClicked = envois.filter(envoi => envoi.statut === 'cliqué').length;
      const totalConverted = envois.filter(envoi => envoi.statut === 'converti').length; // Supposons un statut 'converti'

      const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
      const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
      const conversionRate = totalSent > 0 ? (totalConverted / totalSent) * 100 : 0;

      performanceMap[campaign.id] = {
        totalSent,
        openRate,
        clickRate,
        conversionRate
      };
    });

    return performanceMap;
  }
}