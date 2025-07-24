import { Segment, Contact } from './types';

export const exportService = {
  async exportSegmentToCSV(segment: Segment, contacts: Contact[]) {
    const criteres = typeof segment.criteres === 'string' 
      ? JSON.parse(segment.criteres) 
      : segment.criteres;

    // Filtrer les contacts qui correspondent aux critères du segment
    const matchingContacts = contacts.filter(contact => {
      // Vérifier les critères comme dans SegmentsTab
      // ... (logique de filtrage)
      return true; // TODO: Implémenter le filtrage réel
    });

    // Créer les en-têtes CSV
    const headers = [
      'ID',
      'Nom',
      'Prénom',
      'Email',
      'Téléphone',
      'Type',
      'Statut',
      'Date de création',
      'Prime annuelle'
    ].join(',');

    // Créer les lignes de données
    const rows = matchingContacts.map(contact => {
      const primeAnnuelle = contact.contrats?.reduce(
        (sum, contrat) => sum + (contrat.prime_nette_annuelle || 0),
        0
      ) || 0;

      return [
        contact.id,
        contact.nom,
        contact.prenom,
        contact.email,
        contact.telephone1,
        contact.type,
        contact.statut,
        contact.date_creation,
        primeAnnuelle
      ].join(',');
    });

    // Combiner les en-têtes et les lignes
    const csvContent = [headers, ...rows].join('\n');

    // Créer et télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `segment_${segment.nom}_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
