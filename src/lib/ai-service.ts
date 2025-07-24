import { Contact, Segment, ProjetStatut } from './types';

const GEMINI_API_KEY = 'AIzaSyC2-POijS8PfsaU_ZWVwkynGe6jZdYr4Bs';

export interface AISegmentSuggestion {
  nom: string;
  description: string;
  criteres: {
    statuts?: string[];
    typeContact?: string[];
    statutProjet?: ProjetStatut[];
    primeMin?: number;
    primeMax?: number;
  };
  color: string;
  icon: string;
  size?: number;
  revenue?: number;
  aiScore?: number;
}

export const aiService = {
  async analyzeContacts(contacts: Contact[]): Promise<AISegmentSuggestion[]> {
    // Analyse des contacts pour générer des suggestions de segments
    const suggestions: AISegmentSuggestion[] = [];

    // 1. Segment "Ne répond pas"
    const nrpContacts = contacts.filter(contact => 
      contact.projets?.some(projet => projet.statut === ProjetStatut.NE_REPOND_PAS)
    );
    if (nrpContacts.length > 0) {
      suggestions.push({
        nom: "Relance NRP",
        description: "Contacts avec projets sans réponse à relancer",
        criteres: {
          statutProjet: [ProjetStatut.NE_REPOND_PAS]
        },
        size: nrpContacts.length,
        revenue: calculatePotentialRevenue(nrpContacts),
        aiScore: 95,
        color: "from-red-500 to-red-600",
        icon: "fas fa-phone-slash"
      });
    }

    // 2. Segment "Prospects à fort potentiel"
    const highValueProspects = contacts.filter(contact => {
      const hasHighValueContract = contact.contrats?.some(
        contrat => (contrat.prime_nette_annuelle || 0) > 2000
      );
      return hasHighValueContract;
    });
    if (highValueProspects.length > 0) {
      suggestions.push({
        nom: "Prospects Premium",
        description: "Prospects avec potentiel élevé",
        criteres: {
          primeMin: 2000
        },
        size: highValueProspects.length,
        revenue: calculatePotentialRevenue(highValueProspects),
        aiScore: 90,
        color: "from-blue-500 to-blue-600",
        icon: "fas fa-star"
      });
    }

    return suggestions;
  },

  async generateCampaignSuggestions(segment: Segment) {
    // Utiliser Gemini pour générer des suggestions de campagnes
    const prompt = `Générer une campagne marketing pour le segment suivant :
    Nom: ${segment.nom}
    Description: ${segment.description}
    Type de contacts: ${JSON.stringify(segment.criteres)}`;

    // TODO: Implémenter l'appel à Gemini API
    return {
      emailSubject: "Offre spéciale pour vous",
      emailContent: "Contenu personnalisé...",
      recommendedActions: [
        "Envoyer un email personnalisé",
        "Planifier un appel de suivi",
        "Proposer une réunion"
      ]
    };
  }
};

function calculatePotentialRevenue(contacts: Contact[]): number {
  return contacts.reduce((total, contact) => {
    const contractRevenue = contact.contrats?.reduce(
      (sum, contrat) => sum + (contrat.prime_nette_annuelle || 0),
      0
    ) || 0;
    return total + contractRevenue;
  }, 0);
}
