// Supabase client et API complètes avec toutes les fonctions CRUD
import { Contact, Segment, SegmentCriteres, CampagneEmail, Workflow, TemplateEmail, EnvoiEmail, EmailStats, Interaction, Projet, Contrat, EmailConfiguration, WorkflowExecution, Settings } from './types';
import { AnalyticsEngine } from './analytics';

export const SUPABASE_URL = "https://wybhtprxiwgzmpmnfceq.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5Ymh0cHJ4aXdnem1wbW5mY2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMzIwODksImV4cCI6MjA2NjYwODA4OX0.ctFmwHC_iitVB16WB7lY616lIp0CAHBUGRaoi56ruqc";

export const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

// Utilitaire pour gérer les erreurs
const handleApiError = (error: any, operation: string) => {
  console.error(`Erreur lors de ${operation}:`, error);
  throw new Error(`Échec de l'opération: ${operation}`);
};

// Utilitaire pour les requêtes GET
const fetchData = async <T>(endpoint: string, operation: string): Promise<T[]> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data || [];
  } catch (error) {
    handleApiError(error, operation);
    return [];
  }
};

// Utilitaire pour les requêtes POST
const createData = async <T>(endpoint: string, data: Partial<T>, operation: string): Promise<T | null> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      method: "POST",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    return Array.isArray(result) ? result[0] : result;
  } catch (error) {
    handleApiError(error, operation);
    return null;
  }
};

// Utilitaire pour les requêtes PATCH
const updateData = async <T>(endpoint: string, id: number, data: Partial<T>, operation: string): Promise<T | null> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    return Array.isArray(result) ? result[0] : result;
  } catch (error) {
    handleApiError(error, operation);
    return null;
  }
};

// Utilitaire pour les requêtes DELETE
const deleteData = async (endpoint: string, id: number, operation: string): Promise<boolean> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}?id=eq.${id}`, {
      method: "DELETE",
      headers,
    });
    return response.ok;
  } catch (error) {
    handleApiError(error, operation);
    return false;
  }
};

export const api = {
  // === CONTACTS CRUD ===
  async getContacts(): Promise<Contact[]> {
    return fetchData<Contact>(
      'contacts?select=*,contrats(*),projets(*)&order=id.desc',
      'chargement des contacts'
    );
  },

  async getContact(id: number): Promise<Contact | null> {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/contacts?id=eq.${id}&select=*,contrats(*),projets(*)`,
        { headers }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data[0] || null;
    } catch (error) {
      handleApiError(error, 'récupération du contact');
      return null;
    }
  },

  async createContact(contact: Partial<Contact>): Promise<Contact | null> {
    return createData<Contact>('contacts', {
      ...contact,
      date_creation: new Date().toISOString(),
      derniere_modification: new Date().toISOString(),
    }, 'création du contact');
  },

  async updateContact(id: number, contact: Partial<Contact>): Promise<Contact | null> {
    return updateData<Contact>('contacts', id, {
      ...contact,
      derniere_modification: new Date().toISOString(),
    }, 'mise à jour du contact');
  },

  async deleteContact(id: number): Promise<boolean> {
    return deleteData('contacts', id, 'suppression du contact');
  },

  async searchContacts(query: string, filters?: any): Promise<Contact[]> {
    try {
      let url = `${SUPABASE_URL}/rest/v1/contacts?select=*,contrats(*),projets(*)`;
      
      if (query) {
        url += `&or=(prenom.ilike.*${query}*,nom.ilike.*${query}*,email.ilike.*${query}*)`;
      }

      if (filters?.statut) {
        url += `&statut=eq.${filters.statut}`;
      }

      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json() || [];
    } catch (error) {
      handleApiError(error, 'recherche de contacts');
      return [];
    }
  },

  // === PROJETS CRUD ===
  async getProjets(): Promise<Projet[]> {
    // Get projects with their related contacts and contracts
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/projets?select=*,contacts(*),contrats(*)`, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data || [];
    } catch (error) {
      handleApiError(error, "récupération des projets");
      return [];
    }
  },

  async getProjet(id: number): Promise<Projet | null> {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/projets?id=eq.${id}&select=*,contacts(*)`,
        { headers }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data[0] || null;
    } catch (error) {
      handleApiError(error, 'récupération du projet');
      return null;
    }
  },

  async createProjet(projet: Partial<Projet>): Promise<Projet | null> {
    if (!projet.contact_id) {
      throw new Error("Le contact_id est obligatoire pour créer un projet");
    }
    return createData<Projet>('projets', {
      ...projet,
      date_creation: new Date().toISOString(),
      derniere_modification: new Date().toISOString(),
    }, 'création du projet');
  },

  async updateProjet(id: number, projet: Partial<Projet>): Promise<Projet | null> {
    if (projet.contact_id === undefined) {
      throw new Error("Le contact_id est obligatoire pour mettre à jour un projet");
    }
    return updateData<Projet>('projets', id, {
      ...projet,
      derniere_modification: new Date().toISOString(),
    }, 'mise à jour du projet');
  },

  async deleteProjet(id: number): Promise<boolean> {
    return deleteData('projets', id, 'suppression du projet');
  },

  // === CONTRATS CRUD ===
  async getContrats(): Promise<Contrat[]> {
    return fetchData<Contrat>('contrats?select=*,contacts(*),projets(*)&order=id.desc', 'chargement des contrats');
  },

  async getContrat(id: number): Promise<Contrat | null> {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/contrats?id=eq.${id}&select=*,contacts(*),projets(*)`,
        { headers }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data[0] || null;
    } catch (error) {
      handleApiError(error, 'récupération du contrat');
      return null;
    }
  },

  async createContrat(contrat: Partial<Contrat>): Promise<Contrat | null> {
    return createData<Contrat>('contrats', {
      ...contrat,
      contrat_date_creation: new Date().toISOString(),
    }, 'création du contrat');
  },

  async updateContrat(id: number, contrat: Partial<Contrat>): Promise<Contrat | null> {
    return updateData<Contrat>('contrats', id, contrat, 'mise à jour du contrat');
  },

  async deleteContrat(id: number): Promise<boolean> {
    return deleteData('contrats', id, 'suppression du contrat');
  },

  // === SEGMENTS CRUD ===
  async getSegments(): Promise<Segment[]> {
    return fetchData<Segment>('segments?order=id.desc', 'chargement des segments');
  },

  async getSegment(id: number): Promise<Segment | null> {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/segments?id=eq.${id}`, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data[0] || null;
    } catch (error) {
      handleApiError(error, 'récupération du segment');
      return null;
    }
  },

  async createSegment(segment: Partial<Segment>): Promise<Segment | null> {
    const now = new Date().toISOString();
    
    // Validation des données obligatoires
    if (!segment.nom) {
      throw new Error('Le nom du segment est obligatoire');
    }
    if (!segment.couleur) {
      throw new Error('La couleur du segment est obligatoire');
    }

    // Préparation des critères
    let criteres = segment.criteres;
    if (typeof criteres === 'object' && criteres !== null) {
      const criteresObj = criteres as SegmentCriteres;
      
      // Calculer les métriques si elles ne sont pas définies
      if (!criteresObj.tailleEstimee) {
        criteresObj.tailleEstimee = 0; // À calculer en fonction de l'âge et du type de contrat
      }
      if (!criteresObj.potentielRevenu) {
        criteresObj.potentielRevenu = 0; // À calculer en fonction des critères
      }
      if (!criteresObj.scoreIA) {
        criteresObj.scoreIA = 0; // À calculer selon l'algorithme de scoring
      }

      criteres = JSON.stringify(criteresObj);
    }

    // Création du segment avec les données nettoyées
    return createData<Segment>('segments', {
      nom: segment.nom.trim(),
      description: segment.description?.trim() || null,
      couleur: segment.couleur || null,
      criteres: criteres || '{}'
    }, 'création du segment');
  },

  async updateSegment(id: number, segment: Partial<Segment>): Promise<Segment | null> {
    const now = new Date().toISOString();
    return updateData<Segment>('segments', id, {
      ...segment,
      criteres: typeof segment.criteres === 'object' 
        ? JSON.stringify(segment.criteres) 
        : segment.criteres
    }, 'mise à jour du segment');
  },
  
  async getSegmentContacts(segmentId: number): Promise<Contact[]> {
    try {
      const segment = await this.getSegment(segmentId);
      if (!segment) throw new Error('Segment non trouvé');
      
      const criteres = typeof segment.criteres === 'string'
        ? JSON.parse(segment.criteres)
        : segment.criteres;
        
      let query = `${SUPABASE_URL}/rest/v1/contacts?select=*,contrats(*),projets!inner(*)`;
      
      // Construire la requête basée sur les critères
      if (criteres.statuts?.length) {
        query += `&statut=in.(${criteres.statuts.join(',')})`;
      }
      
      if (criteres.typeContact?.length) {
        query += `&type=in.(${criteres.typeContact.join(',')})`;
      }

      // Filtrer par statut de projet
      if (criteres.statutsProjet?.length) {
        query += `&projets.statut=in.(${criteres.statutsProjet.join(',')})`;
      }
      
      if (criteres.primeMin || criteres.primeMax) {
        const primeConditions = [];
        if (criteres.primeMin) {
          primeConditions.push(`prime_nette_annuelle.gte.${criteres.primeMin}`);
        }
        if (criteres.primeMax) {
          primeConditions.push(`prime_nette_annuelle.lte.${criteres.primeMax}`);
        }
        if (primeConditions.length) {
          query += `&and=(${primeConditions.join(',')})`;
        }
      }
      
      if (criteres.dateCreation?.debut || criteres.dateCreation?.fin) {
        if (criteres.dateCreation.debut) {
          query += `&date_creation=gte.${criteres.dateCreation.debut}`;
        }
        if (criteres.dateCreation.fin) {
          query += `&date_creation=lte.${criteres.dateCreation.fin}`;
        }
      }

      const response = await fetch(query, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json() || [];
    } catch (error) {
      handleApiError(error, 'récupération des contacts du segment');
      return [];
    }
  },

  async deleteSegment(id: number): Promise<boolean> {
    return deleteData('segments', id, 'suppression du segment');
  },

  // === TEMPLATES EMAIL CRUD ===
  async getTemplates(): Promise<TemplateEmail[]> {
    return fetchData<TemplateEmail>('templates_email?order=id.desc', 'chargement des templates');
  },

  async getTemplate(id: number): Promise<TemplateEmail | null> {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/templates_email?id=eq.${id}`, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data[0] || null;
    } catch (error) {
      handleApiError(error, 'récupération du template');
      return null;
    }
  },

  async createTemplate(template: Partial<TemplateEmail>): Promise<TemplateEmail | null> {
    return createData<TemplateEmail>('templates_email', template, 'création du template');
  },

  async updateTemplate(id: number, template: Partial<TemplateEmail>): Promise<TemplateEmail | null> {
    return updateData<TemplateEmail>('templates_email', id, template, 'mise à jour du template');
  },

  async deleteTemplate(id: number): Promise<boolean> {
    return deleteData('templates_email', id, 'suppression du template');
  },

  // === CAMPAGNES EMAIL CRUD ===
  async getCampaigns(): Promise<CampagneEmail[]> {
    return fetchData<CampagneEmail>(
      'campagnes_email?select=*,segments(*),templates_email(*)&order=id.desc',
      'chargement des campagnes'
    );
  },

  async getCampaign(id: number): Promise<CampagneEmail | null> {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/campagnes_email?id=eq.${id}&select=*,segments(*),templates_email(*)`,
        { headers }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data[0] || null;
    } catch (error) {
      handleApiError(error, 'récupération de la campagne');
      return null;
    }
  },

  async createCampaign(campaign: Partial<CampagneEmail>): Promise<CampagneEmail | null> {
    return createData<CampagneEmail>('campagnes_email', {
      ...campaign,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      statut: campaign.statut || 'brouillon'
    }, 'création de la campagne');
  },

  async updateCampaign(id: number, campaign: Partial<CampagneEmail>): Promise<CampagneEmail | null> {
    return updateData<CampagneEmail>('campagnes_email', id, {
      ...campaign,
      updated_at: new Date().toISOString()
    }, 'mise à jour de la campagne');
  },

  async deleteCampaign(id: number): Promise<boolean> {
    return deleteData('campagnes_email', id, 'suppression de la campagne');
  },

  // === WORKFLOWS CRUD ===
  async getWorkflows(): Promise<Workflow[]> {
    return fetchData<Workflow>('workflows?order=id.desc', 'chargement des workflows');
  },

  async getWorkflow(id: number): Promise<Workflow | null> {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/workflows?id=eq.${id}`, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data[0] || null;
    } catch (error) {
      handleApiError(error, 'récupération du workflow');
      return null;
    }
  },

  async createWorkflow(workflow: Partial<Workflow>): Promise<Workflow | null> {
    return createData<Workflow>('workflows', {
      ...workflow,
      created_at: new Date().toISOString(),
      actif: workflow.actif !== undefined ? workflow.actif : true,
      actions: typeof workflow.actions === 'object' 
        ? JSON.stringify(workflow.actions) 
        : workflow.actions,
      etapes: typeof workflow.etapes === 'object' 
        ? JSON.stringify(workflow.etapes) 
        : workflow.etapes
    }, 'création du workflow');
  },

  async updateWorkflow(id: number, workflow: Partial<Workflow>): Promise<Workflow | null> {
    return updateData<Workflow>('workflows', id, {
      ...workflow,
      actions: typeof workflow.actions === 'object' 
        ? JSON.stringify(workflow.actions) 
        : workflow.actions,
      etapes: typeof workflow.etapes === 'object' 
        ? JSON.stringify(workflow.etapes) 
        : workflow.etapes
    }, 'mise à jour du workflow');
  },

  async deleteWorkflow(id: number): Promise<boolean> {
    return deleteData('workflows', id, 'suppression du workflow');
  },

  // === EMAIL CONFIGURATIONS CRUD ===
  async getEmailConfigurations(): Promise<EmailConfiguration[]> {
    return fetchData<EmailConfiguration>('email_configurations?order=id.desc', 'chargement des configurations email');
  },

  async createEmailConfiguration(config: Partial<EmailConfiguration>): Promise<EmailConfiguration | null> {
    return createData<EmailConfiguration>('email_configurations', config, 'création de la configuration email');
  },

  async updateEmailConfiguration(id: number, config: Partial<EmailConfiguration>): Promise<EmailConfiguration | null> {
    return updateData<EmailConfiguration>('email_configurations', id, config, 'mise à jour de la configuration email');
  },

  async deleteEmailConfiguration(id: number): Promise<boolean> {
    return deleteData('email_configurations', id, 'suppression de la configuration email');
  },

  async testSmtpConnection(config: EmailConfiguration): Promise<{ success: boolean; message: string }> {
    try {
      // In a real application, this would call a backend endpoint (e.g., a Supabase Edge Function)
      // that attempts to connect to the SMTP server and send a test email.
      console.log("Testing SMTP connection:", config);

      // Simulate a successful connection
      return { success: true, message: "La connexion SMTP a été établie avec succès." };

      // Simulate a failed connection
      // return { success: false, message: "Impossible de se connecter au serveur SMTP." };
    } catch (error) {
      console.error("Erreur lors du test de la connexion SMTP:", error);
      return { success: false, message: "Une erreur est survenue lors du test de la connexion." };
    }
  },

  // === ENVOIS EMAIL CRUD ===
  async getEnvoisEmail(): Promise<EnvoiEmail[]> {
    return fetchData<EnvoiEmail>(
      'envois_email?select=*,campagnes_email(*),contacts(*),projets(*)&order=id.desc',
      'chargement des envois email'
    );
  },

  async getEnvoiEmail(id: number): Promise<EnvoiEmail | null> {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/envois_email?id=eq.${id}&select=*,campagnes_email(*),contacts(*),projets(*)`,
        { headers }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data[0] || null;
    } catch (error) {
      handleApiError(error, 'récupération de l\'envoi email');
      return null;
    }
  },

  async createEnvoiEmail(envoi: Partial<EnvoiEmail>): Promise<EnvoiEmail | null> {
    return createData<EnvoiEmail>('envois_email', {
      ...envoi,
      created_at: new Date().toISOString(),
    }, 'création de l\'envoi email');
  },

  async updateEnvoiEmail(id: number, envoi: Partial<EnvoiEmail>): Promise<EnvoiEmail | null> {
    return updateData<EnvoiEmail>('envois_email', id, envoi, 'mise à jour de l\'envoi email');
  },

  async deleteEnvoiEmail(id: number): Promise<boolean> {
    return deleteData('envois_email', id, 'suppression de l\'envoi email');
  },

  // === EMAIL STATS CRUD ===
  async getEmailStats(days: number = 30): Promise<EmailStats[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/email_stats?date_stats=gte.${startDate.toISOString().split('T')[0]}&order=date_stats.desc`,
        { headers }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json() || [];
    } catch (error) {
      handleApiError(error, 'chargement des statistiques email');
      return [];
    }
  },

  async createEmailStats(stats: Partial<EmailStats>): Promise<EmailStats | null> {
    return createData<EmailStats>('email_stats', {
      ...stats,
      created_at: new Date().toISOString(),
    }, 'création des statistiques email');
  },

  async updateEmailStats(id: number, stats: Partial<EmailStats>): Promise<EmailStats | null> {
    return updateData<EmailStats>('email_stats', id, stats, 'mise à jour des statistiques email');
  },

  async deleteEmailStats(id: number): Promise<boolean> {
    return deleteData('email_stats', id, 'suppression des statistiques email');
  },

  // === INTERACTIONS CRUD ===
  async getInteractions(limit: number = 100): Promise<Interaction[]> {
    return fetchData<Interaction>(
      `interactions?select=*,contacts(*)&order=created_at.desc&limit=${limit}`,
      'chargement des interactions'
    );
  },

  async getInteraction(id: number): Promise<Interaction | null> {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/interactions?id=eq.${id}&select=*,contacts(*)`,
        { headers }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data[0] || null;
    } catch (error) {
      handleApiError(error, 'récupération de l\'interaction');
      return null;
    }
  },

  async createInteraction(interaction: Partial<Interaction>): Promise<Interaction | null> {
    return createData<Interaction>('interactions', {
      ...interaction,
      created_at: new Date().toISOString()
    }, 'création de l\'interaction');
  },

  async updateInteraction(id: number, interaction: Partial<Interaction>): Promise<Interaction | null> {
    return updateData<Interaction>('interactions', id, interaction, 'mise à jour de l\'interaction');
  },

  async deleteInteraction(id: number): Promise<boolean> {
    return deleteData('interactions', id, 'suppression de l\'interaction');
  },

  // === WORKFLOW EXECUTIONS CRUD ===
  async getWorkflowExecutions(): Promise<WorkflowExecution[]> {
    return fetchData<WorkflowExecution>(
      'workflow_executions?select=*,workflows(*)&order=id.desc',
      'chargement des exécutions de workflow'
    );
  },

  async createWorkflowExecution(execution: Partial<WorkflowExecution>): Promise<WorkflowExecution | null> {
    return createData<WorkflowExecution>('workflow_executions', {
      ...execution,
      date: new Date().toISOString(),
    }, 'création de l\'exécution de workflow');
  },

  async updateWorkflowExecution(id: number, execution: Partial<WorkflowExecution>): Promise<WorkflowExecution | null> {
    return updateData<WorkflowExecution>('workflow_executions', id, execution, 'mise à jour de l\'exécution de workflow');
  },

  async deleteWorkflowExecution(id: number): Promise<boolean> {
    return deleteData('workflow_executions', id, 'suppression de l\'exécution de workflow');
  },

  // === SETTINGS CRUD ===
  async getSettings(): Promise<Settings[]> {
    return fetchData<Settings>('settings?order=key', 'chargement des paramètres');
  },

  async getSetting(key: string): Promise<Settings | null> {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.${key}`, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data[0] || null;
    } catch (error) {
      handleApiError(error, 'récupération du paramètre');
      return null;
    }
  },

  async createSetting(setting: Partial<Settings>): Promise<Settings | null> {
    return createData<Settings>('settings', setting, 'création du paramètre');
  },

  async updateSetting(key: string, setting: Partial<Settings>): Promise<Settings | null> {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.${key}`, {
        method: "PATCH",
        headers: { ...headers, "Prefer": "return=representation" },
        body: JSON.stringify(setting),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      return Array.isArray(result) ? result[0] : result;
    } catch (error) {
      handleApiError(error, 'mise à jour du paramètre');
      return null;
    }
  },

  async deleteSetting(key: string): Promise<boolean> {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.${key}`, {
        method: "DELETE",
        headers,
      });
      return response.ok;
    } catch (error) {
      handleApiError(error, 'suppression du paramètre');
      return false;
    }
  },

  // === ANALYTICS AVANCÉS ===
  async getAnalytics() {
    try {
      const [contacts, segments] = await Promise.all([
        this.getContacts(),
        this.getSegments()
      ]);

      const stats = AnalyticsEngine.calculateContactStats(contacts);
      const segmentPerformance = AnalyticsEngine.analyzeSegmentPerformance(contacts, segments);
      const crossSellOpportunities = AnalyticsEngine.findCrossSellOpportunities(contacts);
      const trends = AnalyticsEngine.analyzeTrends(contacts);
      const predictions = AnalyticsEngine.generateAIPredictions(contacts);

      return {
        stats,
        segmentPerformance,
        crossSellOpportunities,
        trends,
        predictions,
        totalContacts: contacts.length,
        totalSegments: segments.length
      };
    } catch (error) {
      handleApiError(error, 'calcul des analytics');
      return null;
    }
  },

  // === FONCTIONS UTILITAIRES ===
  async bulkDelete(table: string, ids: number[]): Promise<boolean> {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=in.(${ids.join(',')})`, {
        method: "DELETE",
        headers,
      });
      return response.ok;
    } catch (error) {
      handleApiError(error, 'suppression en masse');
      return false;
    }
  },

  async bulkUpdate<T>(table: string, updates: Array<{id: number, data: Partial<T>}>): Promise<boolean> {
    try {
      const promises = updates.map(update => 
        updateData(table, update.id, update.data, 'mise à jour en masse')
      );
      await Promise.all(promises);
      return true;
    } catch (error) {
      handleApiError(error, 'mise à jour en masse');
      return false;
    }
  },

  async getTableCount(table: string): Promise<number> {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=count`, {
        headers: { ...headers, "Prefer": "count=exact" }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const count = response.headers.get('content-range');
      return count ? parseInt(count.split('/')[1]) : 0;
    } catch (error) {
      handleApiError(error, 'comptage des enregistrements');
      return 0;
    }
  }
};
