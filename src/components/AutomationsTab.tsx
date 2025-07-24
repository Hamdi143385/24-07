import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface AutomationsTabProps {
  workflows: any[];
  segments: any[];
  onCreateWorkflow: (workflow: any) => Promise<void>;
  onUpdateWorkflow: (id: number, workflow: any) => Promise<void>;
  preselectedSegmentId: string | null;
  setPreselectedSegmentId: Dispatch<SetStateAction<string | null>>;
  performance: any;
  workflowPerformances: any;
}

export function AutomationsTab({ workflows, segments, onCreateWorkflow, onUpdateWorkflow, preselectedSegmentId, setPreselectedSegmentId, performance, workflowPerformances }: AutomationsTabProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<any | null>(null);
  const [newWorkflow, setNewWorkflow] = useState<any>({
    nom: '',
    description: '',
    type: 'cross_sell',
    declencheur: 'contact_created',
    segment_id: '',
    delai: 24,
    actif: true,
    etapes: [],
    actions: [],
  });
  const { toast } = useToast();

  const performanceData = performance || {
    totalExecutions: 0,
    successRate: 0,
    avgOpenRate: 0,
    avgConversionRate: 0,
  };

  useEffect(() => {
    if (preselectedSegmentId) {
      openCreateModal();
      setNewWorkflow(prev => ({ ...prev, segment_id: preselectedSegmentId }));
      setPreselectedSegmentId(null);
    }
  }, [preselectedSegmentId, setPreselectedSegmentId]);

  const openCreateModal = () => {
    setEditingWorkflow(null);
    setNewWorkflow({
      nom: '',
      description: '',
      type: 'cross_sell',
      declencheur: 'contact_created',
      segment_id: '',
      delai: 24,
      actif: true,
      etapes: [],
      actions: [],
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (workflow: any) => {
    setEditingWorkflow(workflow);
    setNewWorkflow({
      ...workflow,
      segment_id: workflow.segment_id?.toString() || '',
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateOrUpdateWorkflow = async () => {
    try {
      const workflowData = {
        ...newWorkflow,
        etapes: JSON.stringify(newWorkflow.etapes),
        actions: JSON.stringify(newWorkflow.actions),
      };

      if (editingWorkflow) {
        await onUpdateWorkflow(editingWorkflow.id, workflowData);
      } else {
        await onCreateWorkflow(workflowData);
      }
      
      setIsCreateModalOpen(false);
      toast({
        title: editingWorkflow ? "Automation mise à jour" : "Automation créée",
        description: editingWorkflow
          ? "Votre workflow a été mis à jour avec succès."
          : "Votre nouvel workflow a été créé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer ou mettre à jour l'automation.",
        variant: "destructive",
      });
    }
  };
  
  const handleDuplicateWorkflow = async (workflow: any) => {
    const { id, ...duplicatedWorkflowData } = workflow;
    const duplicatedWorkflow = {
      ...duplicatedWorkflowData,
      nom: `${workflow.nom} (Copie)`,
    };
    await onCreateWorkflow(duplicatedWorkflow);
    toast({
      title: "Automation dupliquée",
      description: "Le workflow a été dupliqué avec succès.",
    });
  };

  const getWorkflowIcon = (type: string) => {
    switch (type) {
      case 'cross_sell': return 'fas fa-shopping-cart';
      case 'nurturing': return 'fas fa-seedling';
      case 'retention': return 'fas fa-heart';
      case 'onboarding': return 'fas fa-hand-peace';
      default: return 'fas fa-robot';
    }
  };

  const getWorkflowColor = (type: string) => {
    switch (type) {
      case 'cross_sell': return 'from-green-500 to-green-600';
      case 'nurturing': return 'from-blue-500 to-blue-600';
      case 'retention': return 'from-purple-500 to-purple-600';
      case 'onboarding': return 'from-orange-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Automations IA</h2>
          <p className="text-muted-foreground">Workflows intelligents et automatisés propulsés par l'IA</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary" onClick={openCreateModal}>
              <i className="fas fa-robot mr-2"></i>
              Nouvelle Automation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <i className="fas fa-magic mr-2 text-primary"></i>
                {editingWorkflow ? 'Modifier le Workflow IA' : 'Créer un Workflow IA'}
              </DialogTitle>
              <DialogDescription>
                L'IA optimise automatiquement vos workflows pour maximiser les conversions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom du workflow</Label>
                  <Input
                    id="name"
                    value={newWorkflow.nom}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, nom: e.target.value })}
                    placeholder="Ex: Cross-sell Prévoyance IA"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type d'automation</Label>
                  <Select
                    value={newWorkflow.type}
                    onValueChange={(value) => setNewWorkflow({ ...newWorkflow, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cross_sell">Cross-sell IA</SelectItem>
                      <SelectItem value="nurturing">Lead Nurturing</SelectItem>
                      <SelectItem value="retention">Rétention Client</SelectItem>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                  placeholder="Décrivez l'objectif de votre automation..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trigger">Déclencheur</Label>
                  <Select
                    value={newWorkflow.declencheur}
                    onValueChange={(value) => setNewWorkflow({ ...newWorkflow, declencheur: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contact_created">Nouveau contact</SelectItem>
                      <SelectItem value="contract_signed">Contrat signé</SelectItem>
                      <SelectItem value="email_opened">Email ouvert</SelectItem>
                      <SelectItem value="page_visited">Page visitée</SelectItem>
                      <SelectItem value="date_anniversary">Date anniversaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="delay">Délai initial (heures)</Label>
                  <Input
                    id="delay"
                    type="number"
                    value={newWorkflow.delai}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, delai: parseInt(e.target.value) })}
                    min="1"
                    max="168"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="segment">Segment cible (optionnel)</Label>
                <Select
                  value={newWorkflow.segment_id}
                  onValueChange={(value) => setNewWorkflow({ ...newWorkflow, segment_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les contacts" />
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

              <div className="bg-gradient-primary rounded-xl p-6 text-white">
                <h4 className="font-semibold mb-4 flex items-center">
                  <i className="fas fa-brain mr-2"></i>
                  Optimisation IA Prédictive
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Timing optimal détecté</span>
                      <Badge variant="secondary" className="text-xs">Mardi 14h</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Fréquence recommandée</span>
                      <Badge variant="secondary" className="text-xs">3 jours</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Personnalisation IA</span>
                      <Badge variant="secondary" className="text-xs">Activée</Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Taux ouverture prédit</span>
                      <Badge variant="secondary" className="text-xs">31.2%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Conversion prédite</span>
                      <Badge variant="secondary" className="text-xs">5.8%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Score IA global</span>
                      <Badge variant="secondary" className="text-xs">92/100</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={newWorkflow.actif}
                  onCheckedChange={(checked) => setNewWorkflow({ ...newWorkflow, actif: checked })}
                />
                <Label htmlFor="active">Activer immédiatement</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateOrUpdateWorkflow} className="btn-primary">
                  {editingWorkflow ? "Mettre à jour" : "Créer l'Automation"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: "Exécutions Totales",
            value: performanceData.totalExecutions.toLocaleString(),
            change: "+18%",
            icon: "fas fa-play-circle",
            color: "from-blue-500 to-blue-600",
          },
          {
            title: "Taux de Succès",
            value: `${performanceData.successRate}%`,
            change: "+5%",
            icon: "fas fa-check-circle",
            color: "from-green-500 to-green-600",
          },
          {
            title: "Ouvertures Moy.",
            value: `${performanceData.avgOpenRate}%`,
            change: "+2.3%",
            icon: "fas fa-envelope-open",
            color: "from-purple-500 to-purple-600",
          },
          {
            title: "Conversions Moy.",
            value: `${performanceData.avgConversionRate}%`,
            change: "+1.5%",
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

      {/* Workflows List */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-robot mr-2 text-primary"></i>
            Workflows Automatisés
          </CardTitle>
          <CardDescription>
            Vos automations IA qui travaillent 24/7 pour optimiser vos conversions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Actifs ({workflows.filter(w => w.actif).length})</TabsTrigger>
              <TabsTrigger value="inactive">Inactifs ({workflows.filter(w => !w.actif).length})</TabsTrigger>
              <TabsTrigger value="all">Tous ({workflows.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-6">
              <WorkflowsList 
                workflows={workflows.filter(w => w.actif)} 
                getWorkflowIcon={getWorkflowIcon}
                getWorkflowColor={getWorkflowColor}
                workflowPerformances={workflowPerformances}
                onEdit={openEditModal}
                onDuplicate={handleDuplicateWorkflow}
              />
            </TabsContent>
            
            <TabsContent value="inactive" className="mt-6">
              <WorkflowsList 
                workflows={workflows.filter(w => !w.actif)} 
                getWorkflowIcon={getWorkflowIcon}
                getWorkflowColor={getWorkflowColor}
                workflowPerformances={workflowPerformances}
                onEdit={openEditModal}
                onDuplicate={handleDuplicateWorkflow}
              />
            </TabsContent>
            
            <TabsContent value="all" className="mt-6">
              <WorkflowsList 
                workflows={workflows} 
                getWorkflowIcon={getWorkflowIcon}
                getWorkflowColor={getWorkflowColor}
                workflowPerformances={workflowPerformances}
                onEdit={openEditModal}
                onDuplicate={handleDuplicateWorkflow}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function WorkflowsList({ workflows, getWorkflowIcon, getWorkflowColor, workflowPerformances, onEdit, onDuplicate }: any) {
  if (workflows.length === 0) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-robot text-4xl text-muted-foreground mb-4"></i>
        <h3 className="text-lg font-semibold text-foreground mb-2">Aucun workflow</h3>
        <p className="text-muted-foreground">Créez votre première automation intelligente</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {workflows.map((workflow: any, index: number) => (
        <Card key={workflow.id || index} className="hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${getWorkflowColor(workflow.type)} rounded-xl flex items-center justify-center`}>
                  <i className={`${getWorkflowIcon(workflow.type)} text-white`}></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground flex items-center">
                    {workflow.nom || 'Workflow sans nom'}
                    <i className="fas fa-brain text-purple-500 ml-2" title="Optimisé par IA"></i>
                  </h3>
                  <p className="text-sm text-muted-foreground">{workflow.description || 'Aucune description'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={workflow.actif ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}>
                  {workflow.actif ? 'Actif' : 'Inactif'}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => onEdit(workflow)}>
                  <i className="fas fa-edit mr-1"></i>
                  Modifier
                </Button>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium text-foreground mb-2">Étapes du workflow:</h4>
              <div className="flex items-center space-x-2 overflow-x-auto">
                {[
                  { icon: 'fas fa-play', label: 'Déclencheur', color: 'bg-blue-500' },
                  { icon: 'fas fa-clock', label: `Attendre ${workflow.delai || 24}h`, color: 'bg-yellow-500' },
                  { icon: 'fas fa-envelope', label: 'Email 1', color: 'bg-green-500' },
                  { icon: 'fas fa-clock', label: 'Attendre 72h', color: 'bg-yellow-500' },
                  { icon: 'fas fa-envelope', label: 'Email 2', color: 'bg-green-500' },
                  { icon: 'fas fa-brain', label: 'IA Optimise', color: 'bg-purple-500' },
                ].map((step, stepIndex) => (
                  <div key={stepIndex} className="flex items-center">
                    <div className={`w-8 h-8 ${step.color} rounded-full flex items-center justify-center`}>
                      <i className={`${step.icon} text-white text-xs`}></i>
                    </div>
                    <span className="text-xs text-muted-foreground ml-1 whitespace-nowrap">{step.label}</span>
                    {stepIndex < 5 && <i className="fas fa-arrow-right text-muted-foreground text-xs mx-2"></i>}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{workflowPerformances?.[workflow.id]?.totalExecutions ?? 0}</div>
                <div className="text-xs text-muted-foreground">Exécutions</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">{workflowPerformances?.[workflow.id]?.successRate?.toFixed(1) ?? 0}%</div>
                <div className="text-xs text-muted-foreground">Succès</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{workflowPerformances?.[workflow.id]?.avgOpenRate?.toFixed(1) ?? 0}%</div>
                <div className="text-xs text-muted-foreground">Ouverture</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-pink-600">{workflowPerformances?.[workflow.id]?.avgConversionRate?.toFixed(1) ?? 0}%</div>
                <div className="text-xs text-muted-foreground">Conversion</div>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <i className="fas fa-bolt"></i>
                  <span>Déclencheur: {workflow.declencheur || 'Non défini'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <i className="fas fa-brain text-purple-500"></i>
                  <span>Score IA: {workflowPerformances?.[workflow.id]?.aiScore ?? 0}/100</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <i className="fas fa-chart-bar mr-1"></i>
                  Analytics
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDuplicate(workflow)}>
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
