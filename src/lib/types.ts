// Types complets basés sur le schéma de base de données

export interface Contact {
  id: number;
  type?: string;
  statut?: string;
  date_creation?: string;
  derniere_modification?: string;
  civilite?: string;
  prenom?: string;
  nom?: string;
  raison_sociale?: string;
  siret?: string;
  code_ape?: string;
  forme_juridique?: string;
  nb_employes?: number;
  convention_collective?: string;
  fonction?: string;
  adresse?: string;
  complement_adresse?: string;
  code_postal?: string;
  ville?: string;
  telephone1?: string;
  bloctel1?: string;
  telephone2?: string;
  bloctel2?: string;
  email?: string;
  contrats?: Contrat[]; // Liste des contrats associés au contact
  projets?: Projet[]; // Liste des projets associés au contact
  segments?: string[]; // Liste des segments associés au contact
}

export interface Projet {
  id: number;
  contact_id: number; // Required field for contact relationship
  contrat_id?: number; // Optional field for contract relationship
  type?: string;
  origine?: string;
  provenance?: string;
  auteur?: string;
  projet_prioritaire?: boolean;
  statut?: string;
  date_creation?: string;
  derniere_modification?: string;
  date_souscription?: string;
  iban?: string;
  bic?: string;
  attribution?: string;
  date_effet?: string;
  commentaire?: string;
  // Assurés 1-7
  ass1_type?: string;
  ass1_civilite?: string;
  ass1_prenom?: string;
  ass1_nom?: string;
  ass1_date_naissance?: string;
  ass1_regime?: string;
  ass1_nss?: string;
  ass1_code_organisme?: string;
  ass2_type?: string;
  ass2_civilite?: string;
  ass2_prenom?: string;
  ass2_nom?: string;
  ass2_date_naissance?: string;
  ass2_regime?: string;
  ass2_nss?: string;
  ass2_code_organisme?: string;
  ass3_type?: string;
  ass3_civilite?: string;
  ass3_prenom?: string;
  ass3_nom?: string;
  ass3_date_naissance?: string;
  ass3_regime?: string;
  ass3_nss?: string;
  ass3_code_organisme?: string;
  ass4_type?: string;
  ass4_civilite?: string;
  ass4_prenom?: string;
  ass4_nom?: string;
  ass4_date_naissance?: string;
  ass4_regime?: string;
  ass4_nss?: string;
  ass4_code_organisme?: string;
  ass5_type?: string;
  ass5_civilite?: string;
  ass5_prenom?: string;
  ass5_nom?: string;
  ass5_date_naissance?: string;
  ass5_regime?: string;
  ass5_nss?: string;
  ass5_code_organisme?: string;
  ass6_type?: string;
  ass6_civilite?: string;
  ass6_prenom?: string;
  ass6_nom?: string;
  ass6_date_naissance?: string;
  ass6_regime?: string;
  ass6_nss?: string;
  ass6_code_organisme?: string;
  ass7_type?: string;
  ass7_civilite?: string;
  ass7_prenom?: string;
  ass7_nom?: string;
  ass7_date_naissance?: string;
  ass7_regime?: string;
  ass7_nss?: string;
  ass7_code_organisme?: string;
  contacts?: Contact;
}

export interface Contrat {
  id: number;
  contact_id?: number;
  projet_id?: number;
  contact_civilite?: string;
  contact_prenom?: string;
  contact_nom?: string;
  contact_raison_sociale?: string;
  contact_adresse?: string;
  contact_complement_adresse?: string;
  contact_code_postal?: string;
  contact_ville?: string;
  projet_type?: string;
  projet_origine?: string;
  projet_provenance?: string;
  projet_auteur?: string;
  projet_statut?: string;
  projet_date_creation?: string;
  projet_derniere_modification?: string;
  projet_date_souscription?: string;
  projet_iban?: string;
  projet_bic?: string;
  projet_attribution?: string;
  contrat_num_version?: number;
  contrat_compagnie?: string;
  contrat_produit?: string;
  contrat_formule?: string;
  contrat_options?: string;
  contrat_date_creation?: string;
  contrat_debut_signature?: string;
  contrat_debut_effet?: string;
  contrat_date_echeance?: string;
  contrat_demande_resiliation?: string;
  contrat_fin_contrat?: string;
  contrat_motif_resiliation?: string;
  contrat_num_contrat?: string;
  prime_brute_mensuelle?: number;
  prime_nette_mensuelle?: number;
  prime_brute_annuelle?: number;
  prime_nette_annuelle?: number;
  frais_honoraires?: number;
  nb_mois_gratuits_annee1?: number;
  nb_mois_gratuits_annee2?: number;
  nb_mois_gratuits_annee3?: number;
  fractionnement?: string;
  type_commissionnement?: string;
  commissionnement_annee1?: number;
  commissionnement_autres_annees?: number;
  contrat_commentaire?: string;
  contacts?: Contact;
  projets?: Projet;
}

export interface SegmentCriteres {
  statuts?: string[]; // Ex: ["NRP"] pour le segment NRP
  typeContact?: string[]; // Ex: ["Particulier"] ou ["Entreprise", "Professionnel"]
  primeMin?: string | number; // Ex: "2000" pour Prospects Premium
  primeMax?: string | number;
  dateCreation?: {
    debut?: string;
    fin?: string;
  };
  statutProjet?: ProjetStatut[]; // Statuts des projets à filtrer
  tailleEstimee?: number; // Nombre de contacts estimé
  potentielRevenu?: number; // Potentiel de revenus calculé
  scoreIA?: number; // Score de performance IA
  actions?: {
    type: 'email' | 'appel' | 'reunion';
    moduleId: string;
    delaiJours?: number;
    priorite?: number;
  }[];
}

export interface Segment {
  id: number;
  nom: string;
  description?: string;
  criteres: string | SegmentCriteres;
  couleur: string; // Couleur obligatoire
  date_creation?: string;
  derniere_modification?: string;
  statut?: 'actif' | 'inactif';
  nb_contacts?: number;
  potentielRevenu?: number;
  scoreIA?: number;
}

export interface TemplateEmail {
  id: number;
  nom?: string;
  description?: string;
  contenu?: string;
}

export interface Workflow {
  id: number;
  nom?: string;
  declencheur?: string;
  etapes?: any; // JSON
  statut?: string;
  derniere_execution?: string;
  sujet_email?: string;
  corps_email?: string;
  segment_id?: number;
  template_id?: number;
  description?: string;
  type?: string;
  delai?: number;
  actions?: any; // JSON array
  actif?: boolean;
  frequence?: string;
  created_at?: string;
  statut_declencheur?: string;
}

export interface CampagneEmail {
  id: number;
  nom: string;
  description?: string;
  workflow_id?: number;
  segment_id?: number;
  template_id?: number;
  email_config_id?: number;
  statut_cible?: string;
  planification_type?: string;
  date_planifiee?: string;
  frequence?: string;
  conditions_declenchement?: any; // JSON
  parametres_avances?: any; // JSON
  statut?: string;
  date_lancement?: string;
  date_fin?: string;
  created_at?: string;
  updated_at?: string;
  segments?: Segment;
  'Templates Email'?: TemplateEmail;
}

export interface EmailConfiguration {
  id: number;
  email: string;
  description?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_secure?: boolean;
  smtp_username?: string;
  smtp_password?: string;
  imap_host?: string;
  imap_port?: number;
  imap_secure?: boolean;
  is_active?: boolean;
  last_check?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EnvoiEmail {
  id: number;
  campagne_id?: number;
  contact_id?: number;
  projet_id?: number;
  email_destinataire: string;
  sujet?: string;
  contenu_html?: string;
  contenu_texte?: string;
  statut?: string;
  date_envoi?: string;
  date_ouverture?: string;
  date_clic?: string;
  erreur_message?: string;
  tracking_id?: string;
  created_at?: string;
  campagnes_email?: CampagneEmail;
  contacts?: Contact;
  projets?: Projet;
}

export interface EmailStats {
  id: number;
  config_id?: number;
  date_stats: string;
  envois_total?: number;
  envois_reussis?: number;
  bounces?: number;
  ouvertures?: number;
  clics?: number;
  desinscriptions?: number;
  plaintes?: number;
  stats_horaires?: any; // JSON
  created_at?: string;
}

export interface Interaction {
  id: number;
  contact_id?: number;
  created_at?: string;
  type?: string;
  canal?: string;
  sujet?: string;
  message?: string;
  statut?: string;
  workflow_name?: string;
  segment_name?: string;
  contacts?: Contact;
}

export interface WorkflowExecution {
  id: number;
  workflow_id?: number;
  statut?: string;
  date?: string;
  duree?: number;
  workflows?: Workflow;
}

export interface Settings {
  key: string;
  value?: string;
  type?: string;
}

// Types pour les statistiques calculées
export interface ContactStats {
  totalContacts: number;
  prospects: number;
  activeClients: number;
  vipClients: number;
  totalRevenue: number;
  avgRevenue: number;
  conversionRate: number;
  growthRate: number;
}

export interface CampaignStats {
  totalSent: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  bounceRate: number;
  unsubscribeRate: number;
}

export interface SegmentPerformance {
  segmentId: number;
  name: string;
  size: number;
  revenue: number;
  conversionRate: number;
  aiScore: number;
}

// Enums pour les statuts
export enum ContactStatut {
  PROSPECT = "Prospect",
  CLIENT = "Client",
  INEXPLOITABLE = "Inexploitable",
  NE_REPOND_PAS = "Ne répond pas"
}

export enum ProjetStatut {
  NOUVEAU = "Nouveau",
  EN_COURS = "En cours",
  DEVIS_ENVOYE = "Devis envoyé",
  SIGNE = "Signé",
  INEXPLOITABLE = "Inexploitable (pas intéressé(e) )",
  NE_REPOND_PAS = "Ne répond pas"
}

export enum CampagneStatut {
  BROUILLON = "brouillon",
  ACTIVE = "active",
  PAUSEE = "pausee",
  TERMINEE = "terminee",
  ARCHIVEE = "archivee"
}

export enum WorkflowType {
  RELANCE_PROSPECTS = "relance_prospects",
  SUIVI_DEVIS = "suivi_devis",
  ONBOARDING = "onboarding",
  RAPPEL_RDV = "rappel_rdv",
  CROSS_SELL = "cross_sell",
  RETENTION = "retention"
}

export enum EmailStatut {
  EN_ATTENTE = "en_attente",
  ENVOYE = "envoye",
  LIVRE = "livre",
  OUVERT = "ouvert",
  CLIQUE = "clique",
  BOUNCE = "bounce",
  ERREUR = "erreur"
}