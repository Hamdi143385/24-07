import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from '@/lib/supabase';
import { Contact } from '@/lib/types';

interface ContactsTabProps {
  clients: any[];
  onRefresh: () => void;
}

export function ContactsTab({ clients, onRefresh }: ContactsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(false);
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    type: 'Particulier',
    statut: 'Prospect',
    civilite: 'M.',
  });
  const { toast } = useToast();

  // Filter and search logic
  const filteredClients = useMemo(() => {
    let filtered = clients;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(client => {
        switch (filterType) {
          case 'prospects':
            return !client.contrats || client.contrats.length === 0;
          case 'clients':
            return client.contrats && client.contrats.length > 0;
          case 'vip':
            return client.contrats && client.contrats.reduce((sum: number, c: any) => 
              sum + (c.prime_mensuelle || 0), 0) > 200;
          default:
            return true;
        }
      });
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        `${client.prenom} ${client.nom} ${client.email}`.toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [clients, searchTerm, filterType]);

  const getClientType = (client: any) => {
    if (!client.contrats || client.contrats.length === 0) return 'prospect';
    const totalRevenue = client.contrats.reduce((sum: number, c: any) => 
      sum + (c.prime_mensuelle || 0) * 12, 0);
    if (totalRevenue > 2400) return 'vip';
    return 'client';
  };

  const getClientTypeLabel = (type: string) => {
    switch (type) {
      case 'prospect': return 'Prospect';
      case 'client': return 'Client';
      case 'vip': return 'VIP';
      default: return 'Inconnu';
    }
  };

  const getClientTypeColor = (type: string) => {
    switch (type) {
      case 'prospect': return 'bg-blue-500';
      case 'client': return 'bg-green-500';
      case 'vip': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateRevenue = (client: any) => {
    if (!client.contrats) return 0;
    return client.contrats.reduce((sum: number, contract: any) => 
      sum + (contract.prime_mensuelle || 0) * 12, 0);
  };

  const stats = useMemo(() => {
    const prospects = clients.filter(c => getClientType(c) === 'prospect').length;
    const activeClients = clients.filter(c => getClientType(c) === 'client').length;
    const vipClients = clients.filter(c => getClientType(c) === 'vip').length;
    const totalRevenue = clients.reduce((sum, client) => sum + calculateRevenue(client), 0);

    return { prospects, activeClients, vipClients, totalRevenue };
  }, [clients]);

  const handleCreateContact = async () => {
    if (!newContact.nom || !newContact.prenom) {
      toast({
        title: "Erreur",
        description: "Le nom et le prénom sont obligatoires.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await api.createContact(newContact);
      setIsCreateModalOpen(false);
      setNewContact({
        type: 'Particulier',
        statut: 'Prospect',
        civilite: 'M.',
      });
      onRefresh();
      toast({
        title: "Contact créé",
        description: "Le nouveau contact a été créé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le contact.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditContact = async () => {
    if (!selectedContact) return;

    setLoading(true);
    try {
      await api.updateContact(selectedContact.id, selectedContact);
      setIsEditModalOpen(false);
      setSelectedContact(null);
      onRefresh();
      toast({
        title: "Contact modifié",
        description: "Le contact a été modifié avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le contact.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;

    setLoading(true);
    try {
      await api.deleteContact(contactToDelete.id);
      setIsDeleteDialogOpen(false);
      setContactToDelete(null);
      onRefresh();
      toast({
        title: "Contact supprimé",
        description: "Le contact a été supprimé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le contact.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (contact: Contact) => {
    setSelectedContact({ ...contact });
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (contact: Contact) => {
    setContactToDelete(contact);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Base de Contacts</h2>
          <p className="text-muted-foreground">Gérez votre portefeuille clients et prospects</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <i className="fas fa-upload mr-2"></i>
                Importer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importer des Contacts</DialogTitle>
                <DialogDescription>
                  Importez vos contacts depuis un fichier CSV ou Excel
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                  <i className="fas fa-cloud-upload-alt text-4xl text-muted-foreground mb-4"></i>
                  <p className="text-muted-foreground mb-2">Glissez-déposez votre fichier ici</p>
                  <p className="text-sm text-muted-foreground">Formats supportés: CSV, Excel</p>
                  <Button variant="outline" className="mt-4">
                    Choisir un fichier
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <i className="fas fa-plus mr-2"></i>
                Nouveau Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <i className="fas fa-user-plus mr-2 text-primary"></i>
                  Créer un Nouveau Contact
                </DialogTitle>
                <DialogDescription>
                  Ajoutez un nouveau contact à votre base de données
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Informations de base */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="type">Type de contact</Label>
                    <Select
                      value={newContact.type}
                      onValueChange={(value) => setNewContact({ ...newContact, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Particulier">Particulier</SelectItem>
                        <SelectItem value="Professionnel">Professionnel</SelectItem>
                        <SelectItem value="Entreprise">Entreprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="statut">Statut</Label>
                    <Select
                      value={newContact.statut}
                      onValueChange={(value) => setNewContact({ ...newContact, statut: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Prospect">Prospect</SelectItem>
                        <SelectItem value="Client">Client</SelectItem>
                        <SelectItem value="Inexploitable">Inexploitable</SelectItem>
                        <SelectItem value="Ne répond pas">Ne répond pas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="civilite">Civilité</Label>
                    <Select
                      value={newContact.civilite}
                      onValueChange={(value) => setNewContact({ ...newContact, civilite: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M.">M.</SelectItem>
                        <SelectItem value="Mme">Mme</SelectItem>
                        <SelectItem value="Mlle">Mlle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Identité */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prenom">Prénom *</Label>
                    <Input
                      id="prenom"
                      value={newContact.prenom || ''}
                      onChange={(e) => setNewContact({ ...newContact, prenom: e.target.value })}
                      placeholder="Prénom"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="nom">Nom *</Label>
                    <Input
                      id="nom"
                      value={newContact.nom || ''}
                      onChange={(e) => setNewContact({ ...newContact, nom: e.target.value })}
                      placeholder="Nom"
                      required
                    />
                  </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newContact.email || ''}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      placeholder="email@exemple.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telephone1">Téléphone</Label>
                    <Input
                      id="telephone1"
                      value={newContact.telephone1 || ''}
                      onChange={(e) => setNewContact({ ...newContact, telephone1: e.target.value })}
                      placeholder="01 23 45 67 89"
                    />
                  </div>
                </div>

                {/* Adresse */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="adresse">Adresse</Label>
                    <Input
                      id="adresse"
                      value={newContact.adresse || ''}
                      onChange={(e) => setNewContact({ ...newContact, adresse: e.target.value })}
                      placeholder="123 rue de la Paix"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="code_postal">Code postal</Label>
                      <Input
                        id="code_postal"
                        value={newContact.code_postal || ''}
                        onChange={(e) => setNewContact({ ...newContact, code_postal: e.target.value })}
                        placeholder="75001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ville">Ville</Label>
                      <Input
                        id="ville"
                        value={newContact.ville || ''}
                        onChange={(e) => setNewContact({ ...newContact, ville: e.target.value })}
                        placeholder="Paris"
                      />
                    </div>
                  </div>
                </div>

                {/* Informations professionnelles (si applicable) */}
                {newContact.type !== 'Particulier' && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Informations professionnelles</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="raison_sociale">Raison sociale</Label>
                        <Input
                          id="raison_sociale"
                          value={newContact.raison_sociale || ''}
                          onChange={(e) => setNewContact({ ...newContact, raison_sociale: e.target.value })}
                          placeholder="Nom de l'entreprise"
                        />
                      </div>
                      <div>
                        <Label htmlFor="siret">SIRET</Label>
                        <Input
                          id="siret"
                          value={newContact.siret || ''}
                          onChange={(e) => setNewContact({ ...newContact, siret: e.target.value })}
                          placeholder="12345678901234"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateContact} disabled={loading} className="btn-primary">
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Création...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus mr-2"></i>
                        Créer le Contact
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Contact Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <i className="fas fa-user-edit mr-2 text-primary"></i>
              Modifier le Contact
            </DialogTitle>
            <DialogDescription>
              Modifiez les informations du contact
            </DialogDescription>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-6">
              {/* Same form structure as create, but with selectedContact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-type">Type de contact</Label>
                  <Select
                    value={selectedContact.type}
                    onValueChange={(value) => setSelectedContact({ ...selectedContact, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Particulier">Particulier</SelectItem>
                      <SelectItem value="Professionnel">Professionnel</SelectItem>
                      <SelectItem value="Entreprise">Entreprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-statut">Statut</Label>
                  <Select
                    value={selectedContact.statut}
                    onValueChange={(value) => setSelectedContact({ ...selectedContact, statut: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Prospect">Prospect</SelectItem>
                      <SelectItem value="Client">Client</SelectItem>
                      <SelectItem value="Inexploitable">Inexploitable</SelectItem>
                      <SelectItem value="Ne répond pas">Ne répond pas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-civilite">Civilité</Label>
                  <Select
                    value={selectedContact.civilite}
                    onValueChange={(value) => setSelectedContact({ ...selectedContact, civilite: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M.">M.</SelectItem>
                      <SelectItem value="Mme">Mme</SelectItem>
                      <SelectItem value="Mlle">Mlle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-prenom">Prénom *</Label>
                  <Input
                    id="edit-prenom"
                    value={selectedContact.prenom || ''}
                    onChange={(e) => setSelectedContact({ ...selectedContact, prenom: e.target.value })}
                    placeholder="Prénom"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-nom">Nom *</Label>
                  <Input
                    id="edit-nom"
                    value={selectedContact.nom || ''}
                    onChange={(e) => setSelectedContact({ ...selectedContact, nom: e.target.value })}
                    placeholder="Nom"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedContact.email || ''}
                    onChange={(e) => setSelectedContact({ ...selectedContact, email: e.target.value })}
                    placeholder="email@exemple.com"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-telephone1">Téléphone</Label>
                  <Input
                    id="edit-telephone1"
                    value={selectedContact.telephone1 || ''}
                    onChange={(e) => setSelectedContact({ ...selectedContact, telephone1: e.target.value })}
                    placeholder="01 23 45 67 89"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleEditContact} disabled={loading} className="btn-primary">
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
              Êtes-vous sûr de vouloir supprimer le contact{' '}
              <strong>{contactToDelete?.prenom} {contactToDelete?.nom}</strong> ?
              Cette action est irréversible et supprimera également tous les projets et contrats associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContact}
              className="bg-red-600 hover:bg-red-700"
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: "Total Contacts",
            value: clients.length.toLocaleString(),
            change: "+12%",
            icon: "fas fa-users",
            color: "from-blue-500 to-blue-600",
          },
          {
            title: "Prospects",
            value: stats.prospects.toLocaleString(),
            change: "+8%",
            icon: "fas fa-user-plus",
            color: "from-green-500 to-green-600",
          },
          {
            title: "Clients VIP",
            value: stats.vipClients.toLocaleString(),
            change: "+15%",
            icon: "fas fa-crown",
            color: "from-purple-500 to-purple-600",
          },
          {
            title: "Revenus Totaux",
            value: `€${stats.totalRevenue.toLocaleString()}`,
            change: "+18%",
            icon: "fas fa-euro-sign",
            color: "from-pink-500 to-pink-600",
          },
        ].map((stat, index) => (
          <Card key={index} className="card-glow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}>
                  <i className={`${stat.icon} text-white text-lg`}></i>
                </div>
                <Badge className="metric-positive">{stat.change}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <Card className="card-glow">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
                <Input
                  placeholder="Rechercher un contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous ({clients.length})</SelectItem>
                  <SelectItem value="prospects">Prospects ({stats.prospects})</SelectItem>
                  <SelectItem value="clients">Clients ({stats.activeClients})</SelectItem>
                  <SelectItem value="vip">VIP ({stats.vipClients})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <i className="fas fa-filter mr-1"></i>
                Filtres avancés
              </Button>
              <Button variant="outline" size="sm">
                <i className="fas fa-download mr-1"></i>
                Exporter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts List */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-users mr-2 text-primary"></i>
            Contacts ({filteredClients.length})
          </CardTitle>
          <CardDescription>
            Votre base de données clients avec informations détaillées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="grid" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grid">Vue Grille</TabsTrigger>
              <TabsTrigger value="table">Vue Tableau</TabsTrigger>
            </TabsList>
            
            <TabsContent value="grid" className="mt-6">
              <ContactsGrid 
                clients={filteredClients} 
                getClientType={getClientType}
                onEdit={openEditModal}
                onDelete={openDeleteDialog}
              />
            </TabsContent>
            
            <TabsContent value="table" className="mt-6">
              <ContactsTable 
                clients={filteredClients} 
                getClientType={getClientType}
                onEdit={openEditModal}
                onDelete={openDeleteDialog}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function ContactsGrid({ clients, getClientType, onEdit, onDelete }: any) {
  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-users text-4xl text-muted-foreground mb-4"></i>
        <h3 className="text-lg font-semibold text-foreground mb-2">Aucun contact trouvé</h3>
        <p className="text-muted-foreground">Modifiez vos filtres ou ajoutez de nouveaux contacts</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clients.map((client: any, index: number) => {
        const clientType = getClientType(client);
        const revenue = client.contrats?.reduce((sum: number, c: any) => 
          sum + (c.prime_mensuelle || 0) * 12, 0) || 0;
        
        return (
          <Card key={client.id || index} className="hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {(client.prenom?.[0] || '') + (client.nom?.[0] || '')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {client.prenom} {client.nom}
                    </h3>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  </div>
                </div>
                <Badge className={`${clientType === 'prospect' ? 'bg-blue-500' : 
                  clientType === 'vip' ? 'bg-purple-500' : 'bg-green-500'} text-white`}>
                  {clientType === 'prospect' ? 'Prospect' : 
                   clientType === 'vip' ? 'VIP' : 'Client'}
                </Badge>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Contrats:</span>
                  <span className="font-medium">{client.contrats?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Revenus annuels:</span>
                  <span className="font-medium">€{revenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Téléphone:</span>
                  <span className="font-medium">{client.telephone1 || 'N/A'}</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(client)}>
                  <i className="fas fa-eye mr-1"></i>
                  Voir
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(client)}>
                  <i className="fas fa-edit mr-1"></i>
                  Modifier
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50" 
                  onClick={() => onDelete(client)}
                >
                  <i className="fas fa-trash mr-1"></i>
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ContactsTable({ clients, getClientType, onEdit, onDelete }: any) {
  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-users text-4xl text-muted-foreground mb-4"></i>
        <h3 className="text-lg font-semibold text-foreground mb-2">Aucun contact trouvé</h3>
        <p className="text-muted-foreground">Modifiez vos filtres ou ajoutez de nouveaux contacts</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left p-4 font-medium">Contact</th>
            <th className="text-left p-4 font-medium">Type</th>
            <th className="text-left p-4 font-medium">Contrats</th>
            <th className="text-left p-4 font-medium">Revenus</th>
            <th className="text-left p-4 font-medium">Téléphone</th>
            <th className="text-left p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client: any, index: number) => {
            const clientType = getClientType(client);
            const revenue = client.contrats?.reduce((sum: number, c: any) => 
              sum + (c.prime_mensuelle || 0) * 12, 0) || 0;
            
            return (
              <tr key={client.id || index} className="border-b border-border hover:bg-muted/50">
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {(client.prenom?.[0] || '') + (client.nom?.[0] || '')}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{client.prenom} {client.nom}</div>
                      <div className="text-sm text-muted-foreground">{client.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <Badge className={`${clientType === 'prospect' ? 'bg-blue-500' : 
                    clientType === 'vip' ? 'bg-purple-500' : 'bg-green-500'} text-white`}>
                    {clientType === 'prospect' ? 'Prospect' : 
                     clientType === 'vip' ? 'VIP' : 'Client'}
                  </Badge>
                </td>
                <td className="p-4">
                  <span className="font-medium">{client.contrats?.length || 0}</span>
                </td>
                <td className="p-4">
                  <span className="font-medium">€{revenue.toLocaleString()}</span>
                </td>
                <td className="p-4">
                  <span>{client.telephone1 || 'N/A'}</span>
                </td>
                <td className="p-4">
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm" onClick={() => onEdit(client)}>
                      <i className="fas fa-eye"></i>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onEdit(client)}>
                      <i className="fas fa-edit"></i>
                    </Button>
                    <Button variant="outline" size="sm">
                      <i className="fas fa-envelope"></i>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => onDelete(client)}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}