import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from '@/lib/supabase';
import { Contrat, Contact, Projet } from '@/lib/types';

interface ContractsManagerProps {
  onRefresh: () => void;
}

export function ContractsManager({ onRefresh }: ContractsManagerProps) {
  const [contracts, setContracts] = useState<Contrat[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [projects, setProjects] = useState<Projet[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contrat | null>(null);
  const [contractToDelete, setContractToDelete] = useState<Contrat | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newContract, setNewContract] = useState<Partial<Contrat>>({
    fractionnement: 'Mensuel',
    type_commissionnement: 'Pourcentage',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [contractsData, contactsData, projectsData] = await Promise.all([
        api.getContrats(),
        api.getContacts(),
        api.getProjets()
      ]);
      setContracts(contractsData);
      setContacts(contactsData);
      setProjects(projectsData);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les données.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async () => {
    if (!newContract.contact_id || !newContract.contrat_compagnie) {
      toast({
        title: "Erreur",
        description: "Le contact et la compagnie sont obligatoires.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await api.createContrat(newContract);
      setIsCreateModalOpen(false);
      setNewContract({
        fractionnement: 'Mensuel',
        type_commissionnement: 'Pourcentage',
      });
      loadData();
      onRefresh();
      toast({
        title: "Contrat créé",
        description: "Le nouveau contrat a été créé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le contrat.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditContract = async () => {
    if (!selectedContract) return;

    setLoading(true);
    try {
      await api.updateContrat(selectedContract.id, selectedContract);
      setIsEditModalOpen(false);
      setSelectedContract(null);
      loadData();
      onRefresh();
      toast({
        title: "Contrat modifié",
        description: "Le contrat a été modifié avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le contrat.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContract = async () => {
    if (!contractToDelete) return;

    setLoading(true);
    try {
      await api.deleteContrat(contractToDelete.id);
      setIsDeleteDialogOpen(false);
      setContractToDelete(null);
      loadData();
      onRefresh();
      toast({
        title: "Contrat supprimé",
        description: "Le contrat a été supprimé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le contrat.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (contract: Contrat) => {
    setSelectedContract({ ...contract });
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (contract: Contrat) => {
    setContractToDelete(contract);
    setIsDeleteDialogOpen(true);
  };

  const filteredContracts = contracts.filter(contract => {
    return !searchTerm || 
      contract.contrat_compagnie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contrat_produit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contrat_num_contrat?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatCurrency = (amount: number | undefined) => {
    return amount ? `€${amount.toLocaleString()}` : 'N/A';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion des Contrats</h2>
          <p className="text-muted-foreground">Gérez tous vos contrats d'assurance</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <i className="fas fa-plus mr-2"></i>
              Nouveau Contrat
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl modal-content">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <i className="fas fa-file-contract mr-2 text-primary"></i>
                Créer un Nouveau Contrat
              </DialogTitle>
              <DialogDescription>
                Ajoutez un nouveau contrat d'assurance
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Informations de base */}
              <div className="form-section">
                <h4 className="form-section-title">
                  <i className="fas fa-info-circle"></i>
                  Informations générales
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_id">Client *</Label>
                    <Select
                      value={newContract.contact_id?.toString()}
                      onValueChange={(value) => setNewContract({ ...newContract, contact_id: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un client" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id.toString()}>
                            {contact.prenom} {contact.nom} - {contact.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="projet_id">Projet associé</Label>
                    <Select
                      value={newContract.projet_id?.toString()}
                      onValueChange={(value) => setNewContract({ ...newContract, projet_id: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un projet" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id.toString()}>
                            {project.type} - {project.statut}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Informations contrat */}
              <div className="form-section">
                <h4 className="form-section-title">
                  <i className="fas fa-file-contract"></i>
                  Détails du contrat
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contrat_compagnie">Compagnie *</Label>
                    <Input
                      id="contrat_compagnie"
                      value={newContract.contrat_compagnie || ''}
                      onChange={(e) => setNewContract({ ...newContract, contrat_compagnie: e.target.value })}
                      placeholder="Nom de la compagnie"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contrat_produit">Produit</Label>
                    <Input
                      id="contrat_produit"
                      value={newContract.contrat_produit || ''}
                      onChange={(e) => setNewContract({ ...newContract, contrat_produit: e.target.value })}
                      placeholder="Nom du produit"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contrat_formule">Formule</Label>
                    <Input
                      id="contrat_formule"
                      value={newContract.contrat_formule || ''}
                      onChange={(e) => setNewContract({ ...newContract, contrat_formule: e.target.value })}
                      placeholder="Formule du contrat"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contrat_num_contrat">Numéro de contrat</Label>
                    <Input
                      id="contrat_num_contrat"
                      value={newContract.contrat_num_contrat || ''}
                      onChange={(e) => setNewContract({ ...newContract, contrat_num_contrat: e.target.value })}
                      placeholder="Numéro du contrat"
                    />
                  </div>
                </div>
              </div>

              {/* Primes et tarification */}
              <div className="form-section">
                <h4 className="form-section-title">
                  <i className="fas fa-euro-sign"></i>
                  Primes et tarification
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prime_brute_mensuelle">Prime brute mensuelle (€)</Label>
                    <Input
                      id="prime_brute_mensuelle"
                      type="number"
                      step="0.01"
                      value={newContract.prime_brute_mensuelle || ''}
                      onChange={(e) => setNewContract({ ...newContract, prime_brute_mensuelle: parseFloat(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="prime_nette_mensuelle">Prime nette mensuelle (€)</Label>
                    <Input
                      id="prime_nette_mensuelle"
                      type="number"
                      step="0.01"
                      value={newContract.prime_nette_mensuelle || ''}
                      onChange={(e) => setNewContract({ ...newContract, prime_nette_mensuelle: parseFloat(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fractionnement">Fractionnement</Label>
                    <Select
                      value={newContract.fractionnement}
                      onValueChange={(value) => setNewContract({ ...newContract, fractionnement: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mensuel">Mensuel</SelectItem>
                        <SelectItem value="Trimestriel">Trimestriel</SelectItem>
                        <SelectItem value="Semestriel">Semestriel</SelectItem>
                        <SelectItem value="Annuel">Annuel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="frais_honoraires">Frais d'honoraires (€)</Label>
                    <Input
                      id="frais_honoraires"
                      type="number"
                      step="0.01"
                      value={newContract.frais_honoraires || ''}
                      onChange={(e) => setNewContract({ ...newContract, frais_honoraires: parseFloat(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Commissionnement */}
              <div className="form-section">
                <h4 className="form-section-title">
                  <i className="fas fa-percentage"></i>
                  Commissionnement
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="type_commissionnement">Type de commissionnement</Label>
                    <Select
                      value={newContract.type_commissionnement}
                      onValueChange={(value) => setNewContract({ ...newContract, type_commissionnement: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pourcentage">Pourcentage</SelectItem>
                        <SelectItem value="Montant fixe">Montant fixe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="commissionnement_annee1">Commissionnement année 1</Label>
                    <Input
                      id="commissionnement_annee1"
                      type="number"
                      step="0.01"
                      value={newContract.commissionnement_annee1 || ''}
                      onChange={(e) => setNewContract({ ...newContract, commissionnement_annee1: parseFloat(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="commissionnement_autres_annees">Commissionnement autres années</Label>
                    <Input
                      id="commissionnement_autres_annees"
                      type="number"
                      step="0.01"
                      value={newContract.commissionnement_autres_annees || ''}
                      onChange={(e) => setNewContract({ ...newContract, commissionnement_autres_annees: parseFloat(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateContract} disabled={loading} className="btn-primary">
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Création...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus mr-2"></i>
                      Créer le Contrat
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="card-glow">
        <CardContent className="p-6">
          <div className="relative w-full md:w-80">
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
            <Input
              placeholder="Rechercher un contrat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contracts List */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-file-contract mr-2 text-primary"></i>
            Contrats ({filteredContracts.length})
          </CardTitle>
          <CardDescription>
            Liste de tous vos contrats d'assurance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="loading-spinner mr-2"></div>
              Chargement des contrats...
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-file-contract text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold text-foreground mb-2">Aucun contrat trouvé</h3>
              <p className="text-muted-foreground">Créez votre premier contrat ou modifiez vos filtres</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContracts.map((contract) => (
                <Card key={contract.id} className="card-interactive">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                          <i className="fas fa-file-contract text-white"></i>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {contract.contrat_compagnie} - {contract.contrat_produit}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Contrat n° {contract.contrat_num_contrat || 'Non défini'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(contract.prime_nette_mensuelle)}/mois
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency((contract.prime_nette_mensuelle || 0) * 12)}/an
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Formule:</span>
                        <p className="font-medium">{contract.contrat_formule || 'Non définie'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Fractionnement:</span>
                        <p className="font-medium">{contract.fractionnement || 'Non défini'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Commission année 1:</span>
                        <p className="font-medium">{contract.commissionnement_annee1 || 0}%</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Début d'effet:</span>
                        <p className="font-medium">
                          {contract.contrat_debut_effet ? 
                            new Date(contract.contrat_debut_effet).toLocaleDateString() : 
                            'Non défini'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Créé le {contract.contrat_date_creation ? 
                          new Date(contract.contrat_date_creation).toLocaleDateString() : 
                          'Date inconnue'
                        }
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditModal(contract)}>
                          <i className="fas fa-edit mr-1"></i>
                          Modifier
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => openDeleteDialog(contract)}
                        >
                          <i className="fas fa-trash mr-1"></i>
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal - Similar structure to create modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-6xl modal-content">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <i className="fas fa-edit mr-2 text-primary"></i>
              Modifier le Contrat
            </DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-6">
              {/* Similar form structure as create modal but with selectedContract */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleEditContract} disabled={loading} className="btn-primary">
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Modification...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Sauvegarder
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le contrat{' '}
              <strong>{contractToDelete?.contrat_compagnie} - {contractToDelete?.contrat_produit}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContract}
              className="btn-danger"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Suppression...
                </>
              ) : (
                <>
                  <i className="fas fa-trash mr-2"></i>
                  Supprimer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}