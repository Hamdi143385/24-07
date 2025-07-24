import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from '@/lib/supabase';
import { Projet, Contact } from '@/lib/types';

interface ProjectsManagerProps {
  onRefresh: () => void;
}

export function ProjectsManager({ onRefresh }: ProjectsManagerProps) {
  const [projects, setProjects] = useState<Projet[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Projet | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Projet | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [newProject, setNewProject] = useState<Partial<Projet>>({
    type: 'Complémentaire santé',
    statut: 'Nouveau',
    projet_prioritaire: false,
    contact_id: undefined, // Will be set when creating/editing
    contrat_id: undefined, // Optional, will be set if a contract exists
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectsData, contactsData] = await Promise.all([
        api.getProjets(),
        api.getContacts()
      ]);
      setProjects(projectsData);
      setContacts(contactsData);
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

  const handleCreateProject = async () => {
    if (!newProject.contact_id || !newProject.type) {
      toast({
        title: "Erreur",
        description: "Le contact et le type de projet sont obligatoires.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await api.createProjet(newProject);
      setIsCreateModalOpen(false);
      setNewProject({
        type: 'Complémentaire santé',
        statut: 'Nouveau',
        projet_prioritaire: false,
      });
      loadData();
      onRefresh();
      toast({
        title: "Projet créé",
        description: "Le nouveau projet a été créé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le projet.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditProject = async () => {
    if (!selectedProject) return;

    setLoading(true);
    try {
      await api.updateProjet(selectedProject.id, selectedProject);
      setIsEditModalOpen(false);
      setSelectedProject(null);
      loadData();
      onRefresh();
      toast({
        title: "Projet modifié",
        description: "Le projet a été modifié avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le projet.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    setLoading(true);
    try {
      await api.deleteProjet(projectToDelete.id);
      setIsDeleteDialogOpen(false);
      setProjectToDelete(null);
      loadData();
      onRefresh();
      toast({
        title: "Projet supprimé",
        description: "Le projet a été supprimé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le projet.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (project: Projet) => {
    setSelectedProject({ ...project });
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (project: Projet) => {
    setProjectToDelete(project);
    setIsDeleteDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'nouveau': return 'bg-blue-500';
      case 'en cours': return 'bg-yellow-500';
      case 'devis envoyé': return 'bg-orange-500';
      case 'signé': return 'bg-green-500';
      case 'inexploitable (pas intéressé(e) )': return 'bg-red-500';
      case 'ne répond pas': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchTerm || 
      project.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.statut?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.origine?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || project.statut === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion des Projets</h2>
          <p className="text-muted-foreground">Gérez tous vos projets clients</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <i className="fas fa-plus mr-2"></i>
              Nouveau Projet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl modal-content">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <i className="fas fa-project-diagram mr-2 text-primary"></i>
                Créer un Nouveau Projet
              </DialogTitle>
              <DialogDescription>
                Ajoutez un nouveau projet pour un client
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
                      value={newProject.contact_id?.toString()}
                      onValueChange={(value) => setNewProject({ ...newProject, contact_id: parseInt(value) })}
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
                    <Label htmlFor="type">Type de projet *</Label>
                    <Select
                      value={newProject.type}
                      onValueChange={(value) => setNewProject({ ...newProject, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Complémentaire santé">Complémentaire santé</SelectItem>
                        <SelectItem value="Prévoyance">Prévoyance</SelectItem>
                        <SelectItem value="Retraite supplémentaire">Retraite supplémentaire</SelectItem>
                        <SelectItem value="Assurance vie">Assurance vie</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="origine">Origine</Label>
                    <Select
                      value={newProject.origine}
                      onValueChange={(value) => setNewProject({ ...newProject, origine: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Téléphone">Téléphone</SelectItem>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="Site web">Site web</SelectItem>
                        <SelectItem value="Recommandation">Recommandation</SelectItem>
                        <SelectItem value="Prospection">Prospection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="statut">Statut</Label>
                    <Select
                      value={newProject.statut}
                      onValueChange={(value) => setNewProject({ ...newProject, statut: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nouveau">Nouveau</SelectItem>
                        <SelectItem value="En cours">En cours</SelectItem>
                        <SelectItem value="Devis envoyé">Devis envoyé</SelectItem>
                        <SelectItem value="Signé">Signé</SelectItem>
                        <SelectItem value="Inexploitable (pas intéressé(e) )">Inexploitable</SelectItem>
                        <SelectItem value="Ne répond pas">Ne répond pas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="auteur">Auteur</Label>
                    <Input
                      id="auteur"
                      value={newProject.auteur || ''}
                      onChange={(e) => setNewProject({ ...newProject, auteur: e.target.value })}
                      placeholder="Nom de l'auteur"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="commentaire">Commentaire</Label>
                  <Textarea
                    id="commentaire"
                    value={newProject.commentaire || ''}
                    onChange={(e) => setNewProject({ ...newProject, commentaire: e.target.value })}
                    placeholder="Commentaires sur le projet..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateProject} disabled={loading} className="btn-primary">
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Création...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus mr-2"></i>
                      Créer le Projet
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="card-glow">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
                <Input
                  placeholder="Rechercher un projet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="Nouveau">Nouveau</SelectItem>
                  <SelectItem value="En cours">En cours</SelectItem>
                  <SelectItem value="Devis envoyé">Devis envoyé</SelectItem>
                  <SelectItem value="Signé">Signé</SelectItem>
                  <SelectItem value="Inexploitable (pas intéressé(e) )">Inexploitable</SelectItem>
                  <SelectItem value="Ne répond pas">Ne répond pas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-project-diagram mr-2 text-primary"></i>
            Projets ({filteredProjects.length})
          </CardTitle>
          <CardDescription>
            Liste de tous vos projets clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="loading-spinner mr-2"></div>
              Chargement des projets...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-project-diagram text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold text-foreground mb-2">Aucun projet trouvé</h3>
              <p className="text-muted-foreground">Créez votre premier projet ou modifiez vos filtres</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="card-interactive">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                          <i className="fas fa-project-diagram text-white"></i>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{project.type}</h3>
                          <p className="text-sm text-muted-foreground">
                            Créé le {new Date(project.date_creation || '').toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getStatusColor(project.statut || '')} text-white`}>
                          {project.statut}
                        </Badge>
                        {project.projet_prioritaire && (
                          <Badge className="bg-red-500 text-white">
                            <i className="fas fa-exclamation mr-1"></i>
                            Prioritaire
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Client:</span>
                        <p className="font-medium">
                          {contacts.find(c => c.id === project.contact_id)?.prenom} {contacts.find(c => c.id === project.contact_id)?.nom}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Contrat:</span>
                        <div className="font-medium">
                          {project.contrat_id ? (
                            <Badge className="bg-green-500 text-white">
                              <i className="fas fa-file-contract mr-1"></i>
                              Contrat lié
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pas de contrat</Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Auteur:</span>
                        <p className="font-medium">{project.auteur || 'Non défini'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Origine:</span>
                        <p className="font-medium">{project.origine || 'Non définie'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Attribution:</span>
                        <p className="font-medium">{project.attribution || 'Non définie'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Segments:</span>
                        <div className="font-medium">
                          {contacts.find(c => c.id === project.contact_id)?.segments?.map(segment => (
                            <Badge key={segment} className="mr-1 mb-1">{segment}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {project.commentaire && (
                      <div className="mb-4">
                        <span className="text-sm text-muted-foreground">Commentaire:</span>
                        <p className="text-sm mt-1 p-2 bg-muted rounded">{project.commentaire}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Dernière modification: {new Date(project.derniere_modification || '').toLocaleDateString()}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditModal(project)}>
                          <i className="fas fa-edit mr-1"></i>
                          Modifier
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => openDeleteDialog(project)}
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

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl modal-content">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <i className="fas fa-edit mr-2 text-primary"></i>
              Modifier le Projet
            </DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-6">
              <div className="form-section">
                <h4 className="form-section-title">
                  <i className="fas fa-info-circle"></i>
                  Informations générales
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-type">Type de projet</Label>
                    <Select
                      value={selectedProject.type}
                      onValueChange={(value) => setSelectedProject({ ...selectedProject, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Complémentaire santé">Complémentaire santé</SelectItem>
                        <SelectItem value="Prévoyance">Prévoyance</SelectItem>
                        <SelectItem value="Retraite supplémentaire">Retraite supplémentaire</SelectItem>
                        <SelectItem value="Assurance vie">Assurance vie</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-statut">Statut</Label>
                    <Select
                      value={selectedProject.statut}
                      onValueChange={(value) => setSelectedProject({ ...selectedProject, statut: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nouveau">Nouveau</SelectItem>
                        <SelectItem value="En cours">En cours</SelectItem>
                        <SelectItem value="Devis envoyé">Devis envoyé</SelectItem>
                        <SelectItem value="Signé">Signé</SelectItem>
                        <SelectItem value="Inexploitable (pas intéressé(e) )">Inexploitable</SelectItem>
                        <SelectItem value="Ne répond pas">Ne répond pas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-commentaire">Commentaire</Label>
                  <Textarea
                    id="edit-commentaire"
                    value={selectedProject.commentaire || ''}
                    onChange={(e) => setSelectedProject({ ...selectedProject, commentaire: e.target.value })}
                    placeholder="Commentaires sur le projet..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleEditProject} disabled={loading} className="btn-primary">
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
              Êtes-vous sûr de vouloir supprimer le projet{' '}
              <strong>{projectToDelete?.type}</strong> ?
              Cette action est irréversible et supprimera également tous les contrats associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
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
