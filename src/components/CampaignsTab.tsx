import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { api } from '@/lib/supabase';
import { EmailConfiguration } from '@/lib/types';

interface CampaignsTabProps {
  campaigns: any[];
  segments: any[];
  templates: any[];
  onCreateCampaign: (campaign: any) => Promise<void>;
  onUpdateCampaign: (id: number, campaign: any) => Promise<void>;
  stats: any;
  campaignPerformances: any;
}

export function CampaignsTab({ campaigns, segments, templates, onCreateCampaign, onUpdateCampaign, stats, campaignPerformances }: CampaignsTabProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);
  const [newCampaign, setNewCampaign] = useState<any>({
    nom: '',
    description: '',
    segment_id: '',
    template_id: '',
    statut: 'brouillon',
    planification_type: 'manuel',
    statut_cible: '',
    email_config_id: '',
  });
  const [emailConfigs, setEmailConfigs] = useState<EmailConfiguration[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadEmailConfigs();
  }, []);

  const loadEmailConfigs = async () => {
    const data = await api.getEmailConfigurations();
    setEmailConfigs(data);
  };

  const openCreateModal = () => {
    setEditingCampaign(null);
    setNewCampaign({
      nom: '',
      description: '',
      segment_id: '',
      template_id: '',
      statut: 'brouillon',
      planification_type: 'manuel',
      statut_cible: '',
      email_config_id: '',
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (campaign: any) => {
    setEditingCampaign(campaign);
    setNewCampaign({
      ...campaign,
      segment_id: campaign.segment_id?.toString() || '',
      template_id: campaign.template_id?.toString() || '',
      email_config_id: campaign.email_config_id?.toString() || '',
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateOrUpdateCampaign = async () => {
    try {
      if (editingCampaign) {
        await onUpdateCampaign(editingCampaign.id, newCampaign);
      } else {
        await onCreateCampaign(newCampaign);
      }
      
      setIsCreateModalOpen(false);
      toast({
        title: editingCampaign ? "Campagne mise à jour" : "Campagne créée",
        description: editingCampaign
          ? "Votre campagne a été mise à jour avec succès."
          : "Votre nouvelle campagne a été créée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer ou mettre à jour la campagne.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateCampaign = async (campaign: any) => {
    const { id, ...duplicatedCampaignData } = campaign;
    const duplicatedCampaign = {
      ...duplicatedCampaignData,
      nom: `${campaign.nom} (Copie)`,
    };
    await onCreateCampaign(duplicatedCampaign);
    toast({
      title: "Campagne dupliquée",
      description: "La campagne a été dupliquée avec succès.",
    });
  };

  const handleLaunchCampaign = async (campaignId: number) => {
    try {
      await onUpdateCampaign(campaignId, { statut: 'active' });
      toast({
        title: "Campagne lancée",
        description: "La campagne est maintenant active et les emails seront envoyés.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de lancer la campagne.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      case 'brouillon': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'completed': return 'Terminée';
      case 'paused': return 'En pause';
      case 'brouillon': return 'Brouillon';
      default: return status;
    }
  };

  const statsData = stats || {
    totalSent: 0,
    openRate: 0,
    clickRate: 0,
    conversionRate: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Campagnes Email</h2>
          <p className="text-muted-foreground">Créez et gérez vos campagnes marketing intelligentes</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary" onClick={openCreateModal}>
              <i className="fas fa-plus mr-2"></i>
              Nouvelle Campagne
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <i className="fas fa-magic mr-2 text-primary"></i>
                {editingCampaign ? 'Modifier la Campagne' : 'Créer une Campagne IA'}
              </DialogTitle>
              <DialogDescription>
                L'IA vous aide à créer des campagnes optimisées pour votre audience
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom de la campagne</Label>
                  <Input
                    id="name"
                    value={newCampaign.nom}
                    onChange={(e) => setNewCampaign({ ...newCampaign, nom: e.target.value })}
                    placeholder="Ex: Cross-sell Prévoyance"
                  />
                </div>
                <div>
                  <Label htmlFor="segment">Segment cible</Label>
                  <Select
                    value={newCampaign.segment_id}
                    onValueChange={(value) => setNewCampaign({ ...newCampaign, segment_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un segment" />
                    </SelectTrigger>
                    <SelectContent>
                      {segments.map((segment) => (
                        <SelectItem key={segment.id} value={segment.id.toString()}>
                          {segment.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  placeholder="Décrivez l'objectif de votre campagne..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template">Template Email</Label>
                  <Select
                    value={newCampaign.template_id}
                    onValueChange={(value) => setNewCampaign({ ...newCampaign, template_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="email_config_id">Email d'envoi</Label>
                  <Select
                    value={newCampaign.email_config_id}
                    onValueChange={(value) => setNewCampaign({ ...newCampaign, email_config_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un email" />
                    </SelectTrigger>
                    <SelectContent>
                      {emailConfigs.map((config) => (
                        <SelectItem key={config.id} value={config.id.toString()}>
                          {config.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="statut_cible">Statut de projet cible</Label>
                <Select
                  value={newCampaign.statut_cible}
                  onValueChange={(value) => setNewCampaign({ ...newCampaign, statut_cible: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un statut de projet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ne réponds pas">Ne réponds pas</SelectItem>
                    <SelectItem value="en attente">En attente</SelectItem>
                    <SelectItem value="à relancer">À relancer</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-gradient-primary rounded-xl p-4 text-white">
                <h4 className="font-semibold mb-2 flex items-center">
                  <i className="fas fa-brain mr-2"></i>
                  Suggestions IA
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>• Meilleur timing d'envoi: Mardi 14h-16h</span>
                    <Badge variant="secondary" className="text-xs">+23% ouverture</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>• Personnalisation recommandée: Prénom + Ville</span>
                    <Badge variant="secondary" className="text-xs">+15% clic</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>• Performance prédite: 28% ouverture, 4.2% clic</span>
                    <Badge variant="secondary" className="text-xs">Score IA: 87</Badge>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateOrUpdateCampaign} className="btn-primary">
                  {editingCampaign ? 'Mettre à jour' : 'Créer la Campagne'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: "Total Envoyés",
            value: statsData.totalSent.toLocaleString(),
            change: "+12%",
            icon: "fas fa-paper-plane",
            color: "from-blue-500 to-blue-600",
          },
          {
            title: "Taux d'Ouverture",
            value: `${statsData.openRate}%`,
            change: "+3%",
            icon: "fas fa-envelope-open",
            color: "from-green-500 to-green-600",
          },
          {
            title: "Taux de Clic",
            value: `${statsData.clickRate}%`,
            change: "+0.8%",
            icon: "fas fa-mouse-pointer",
            color: "from-purple-500 to-purple-600",
          },
          {
            title: "Conversions",
            value: `${statsData.conversionRate}%`,
            change: "+1.2%",
            icon: "fas fa-chart-line",
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

      {/* Campaigns List */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-bullhorn mr-2 text-primary"></i>
            Campagnes Actives
          </CardTitle>
          <CardDescription>
            Gérez vos campagnes en cours et analysez leurs performances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="active">Actives ({campaigns.filter(c => c.statut === 'active').length})</TabsTrigger>
              <TabsTrigger value="draft">Brouillons ({campaigns.filter(c => c.statut === 'brouillon').length})</TabsTrigger>
              <TabsTrigger value="completed">Terminées ({campaigns.filter(c => c.statut === 'completed').length})</TabsTrigger>
              <TabsTrigger value="all">Toutes ({campaigns.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-6">
              <CampaignsList 
                campaigns={campaigns.filter(c => c.statut === 'active')} 
                segments={segments}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
                campaignPerformances={campaignPerformances}
                onEdit={openEditModal}
                onDuplicate={handleDuplicateCampaign}
                onLaunch={handleLaunchCampaign}
              />
            </TabsContent>
            
            <TabsContent value="draft" className="mt-6">
              <CampaignsList 
                campaigns={campaigns.filter(c => c.statut === 'brouillon')} 
                segments={segments}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
                campaignPerformances={campaignPerformances}
                onEdit={openEditModal}
                onDuplicate={handleDuplicateCampaign}
                onLaunch={handleLaunchCampaign}
              />
            </TabsContent>
            
            <TabsContent value="completed" className="mt-6">
              <CampaignsList 
                campaigns={campaigns.filter(c => c.statut === 'completed')} 
                segments={segments}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
                campaignPerformances={campaignPerformances}
                onEdit={openEditModal}
                onDuplicate={handleDuplicateCampaign}
                onLaunch={handleLaunchCampaign}
              />
            </TabsContent>
            
            <TabsContent value="all" className="mt-6">
              <CampaignsList 
                campaigns={campaigns} 
                segments={segments}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
                campaignPerformances={campaignPerformances}
                onEdit={openEditModal}
                onDuplicate={handleDuplicateCampaign}
                onLaunch={handleLaunchCampaign}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function CampaignsList({ campaigns, segments, getStatusColor, getStatusLabel, campaignPerformances, onEdit, onDuplicate, onLaunch }: any) {
  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-bullhorn text-4xl text-muted-foreground mb-4"></i>
        <h3 className="text-lg font-semibold text-foreground mb-2">Aucune campagne</h3>
        <p className="text-muted-foreground">Commencez par créer votre première campagne</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign: any, index: number) => (
        <Card key={campaign.id || index} className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <i className="fas fa-bullhorn text-white"></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{campaign.nom || 'Campagne sans nom'}</h3>
                  <p className="text-sm text-muted-foreground">{campaign.description || 'Aucune description'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={`${getStatusColor(campaign.statut)} text-white`}>
                  {getStatusLabel(campaign.statut)}
                </Badge>
                {campaign.statut === 'brouillon' && (
                  <Button variant="outline" size="sm" onClick={() => onLaunch(campaign.id)}>
                    <i className="fas fa-rocket mr-1"></i>
                    Lancer
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => onEdit(campaign)}>
                  <i className="fas fa-edit mr-1"></i>
                  Modifier
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{(campaignPerformances?.[campaign.id]?.totalSent ?? 0).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Envoyés</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">{campaignPerformances?.[campaign.id]?.openRate?.toFixed(1) ?? 0}%</div>
                <div className="text-xs text-muted-foreground">Ouverture</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{campaignPerformances?.[campaign.id]?.clickRate?.toFixed(1) ?? 0}%</div>
                <div className="text-xs text-muted-foreground">Clic</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-pink-600">{campaignPerformances?.[campaign.id]?.conversionRate?.toFixed(1) ?? 0}%</div>
                <div className="text-xs text-muted-foreground">Conversion</div>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <i className="fas fa-users"></i>
                <span>Segment: {segments.find((s: any) => s.id == campaign.segment_id)?.nom || 'Non défini'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <i className="fas fa-chart-bar mr-1"></i>
                  Analytics
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDuplicate(campaign)}>
                  <i className="fas fa-copy mr-1"></i>
                  Dupliquer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
