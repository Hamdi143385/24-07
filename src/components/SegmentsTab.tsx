import React, { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProjetStatut } from '@/lib/types';
import { aiService } from '@/lib/ai-service';
import { exportService } from '@/lib/export-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface SegmentsTabProps {
  segments: any[];
  clients: any[];
  onCreateSegment: (segment: any) => Promise<void>;
  onCreateWorkflowFromSegment: (segmentId: string) => void;
}

export function SegmentsTab({ segments, clients, onCreateSegment, onCreateWorkflowFromSegment }: SegmentsTabProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSegment, setNewSegment] = useState({
    nom: '',
    description: '',
    couleur: '#3B82F6',
    criteres: {
      statuts: [],
      typeContact: [],
      statutProjet: [], // Nouveau champ pour les statuts de projet
      origines: [],
      primeMin: undefined,
      primeMax: undefined,
      ages: {
        min: undefined,
        max: undefined
      },
      produits: [],
      dateCreation: {
        debut: undefined,
        fin: undefined
      }
    },
  });
  const { toast } = useToast();

  const handleCreateSegment = async () => {
    try {
      // Validation des champs obligatoires
      if (!newSegment.nom?.trim()) {
        toast({
          title: "Erreur de validation",
          description: "Le nom du segment est obligatoire",
          variant: "destructive",
        });
        return;
      }

      // Nettoyage des critères vides
      const criteres = { ...newSegment.criteres };
      Object.keys(criteres).forEach(key => {
        const value = (criteres as any)[key];
        if (Array.isArray(value) && value.length === 0) {
          delete (criteres as any)[key];
        }
        if (value === undefined || value === null) {
          delete (criteres as any)[key];
        }
        if (typeof value === 'object' && !Array.isArray(value)) {
          const subObj = value as any;
          if (Object.keys(subObj).every(k => subObj[k] === undefined)) {
            delete (criteres as any)[key];
          }
        }
      });

      const segmentData = {
        nom: newSegment.nom.trim(),
        description: newSegment.description?.trim() || '',
        couleur: newSegment.couleur || '#3B82F6',
        criteres: JSON.stringify(criteres),
      };

      await onCreateSegment(segmentData);
      setIsCreateModalOpen(false);
      setNewSegment({
        nom: '',
        description: '',
        couleur: '#3B82F6',
        criteres: {
          statuts: [],
          typeContact: [],
          origines: [],
          primeMin: undefined,
          primeMax: undefined,
          ages: {
            min: undefined,
            max: undefined
          },
          produits: [],
          dateCreation: {
            debut: undefined,
            fin: undefined
          }
        },
      });
      toast({
        title: "Segment créé",
        description: "Votre nouveau segment a été créé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer le segment.",
        variant: "destructive",
      });
    }
  };

  // Calculate segment sizes and revenue potential
  const enrichedSegments = useMemo(() => {
    return segments.map(segment => {
      // Calculer les vraies statistiques basées sur les critères du segment
      const criteres = typeof segment.criteres === 'string' 
        ? JSON.parse(segment.criteres) 
        : segment.criteres;

      // Filtrer les clients qui correspondent aux critères
      const matchingClients = clients.filter(client => {
        // Vérifier le statut
        if (criteres.statuts?.length && !criteres.statuts.includes(client.statut)) {
          return false;
        }

        // Vérifier le type de contact
        if (criteres.typeContact?.length && !criteres.typeContact.includes(client.type)) {
          return false;
        }

        // Vérifier le statut du projet
        if (criteres.statutProjet?.length && client.projets) {
          const hasMatchingStatus = client.projets.some(
            projet => criteres.statutProjet.includes(projet.statut)
          );
          if (!hasMatchingStatus) return false;
        }

        // Vérifier les projets et leurs origines
        if (criteres.origines?.length && client.projets) {
          const hasMatchingOrigin = client.projets.some(
            projet => criteres.origines.includes(projet.origine)
          );
          if (!hasMatchingOrigin) return false;
        }

        // Vérifier la prime minimale
        if (criteres.primeMin && client.contrats) {
          const totalPrime = client.contrats.reduce(
            (sum, contrat) => sum + (contrat.prime_nette_annuelle || 0), 
            0
          );
          if (totalPrime < criteres.primeMin) return false;
        }

        return true;
      });

      // Calculer les métriques réelles
      const size = matchingClients.length;
      const revenue = matchingClients.reduce((total, client) => {
        const clientRevenue = (client.contrats || []).reduce(
          (sum, contrat) => sum + (contrat.prime_nette_annuelle || 0),
          0
        );
        return total + clientRevenue;
      }, 0);

      // Calculer le taux de conversion (basé sur les contrats signés)
      const signedContracts = matchingClients.filter(
        client => client.contrats?.some(c => c.contrat_statut === 'signé')
      ).length;
      const conversionRate = size > 0 ? (signedContracts / size) * 100 : 0;

      // Calculer le score AI basé sur différents facteurs
      const revenueScore = Math.min(revenue / 1000, 40); // Max 40 points
      const sizeScore = Math.min((size / clients.length) * 30, 30); // Max 30 points
      const conversionScore = Math.min(conversionRate * 2, 30); // Max 30 points
      const aiScore = Math.round(revenueScore + sizeScore + conversionScore);

      return {
        ...segment,
        size,
        revenue,
        conversionRate,
        aiScore,
        matchingClients: matchingClients.map(c => c.id) // Pour référence future
      };
    });
  }, [segments, clients]);

  // AI-suggested segments basés sur l'analyse des données et création du segment "Relance NRP" si nécessaire
  useEffect(() => {
    const loadAndCreateSegment = async () => {
      // Check if clients data is available
      if (!clients || clients.length === 0) {
        return; // Cannot proceed without client data
      }

      try {
        // Load AI suggestions
        const suggestions = await aiService.analyzeContacts(clients);
        setAiSuggestedSegments(suggestions);

        // Now that suggestions are loaded, try to create the "Relance NRP" segment
        const nrpSuggestion = suggestions.find(seg => seg.nom === "Relance NRP");
        const segmentExists = segments.some(s => s.nom === "Relance NRP");

        if (nrpSuggestion && !segmentExists) {
          await onCreateSegment({
            nom: nrpSuggestion.nom,
            description: nrpSuggestion.description,
            couleur: '#EF4444', // Corresponds to 'from-red-500'
            criteres: nrpSuggestion.criteres
          });
          toast({
            title: "Segment IA créé",
            description: `Le segment "${nrpSuggestion.nom}" a été créé automatiquement.`,
          });
          // Note: Re-fetching segments would be ideal here, but we assume the parent handles it.
        }
      } catch (error) {
        console.error('Erreur lors de l\'analyse IA ou de la création du segment:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les suggestions IA ou de créer le segment.",
          variant: "destructive",
        });
      }
    };
    
    // Only run this effect if clients data is available.
    // The check for aiSuggestedSegments and segmentExists will happen inside.
    if (clients && clients.length > 0) {
      loadAndCreateSegment();
    }
  }, [clients, onCreateSegment, segments, toast]); // Dependencies for this combined effect


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Segmentation Intelligente</h2>
          <p className="text-muted-foreground">Créez des segments précis avec l'aide de l'IA</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <i className="fas fa-plus mr-2"></i>
              Nouveau Segment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <i className="fas fa-magic mr-2 text-primary"></i>
                Créer un Segment IA
              </DialogTitle>
              <DialogDescription>
                L'IA vous aide à identifier les meilleurs critères de segmentation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom du segment</Label>
                  <Input
                    id="name"
                    value={newSegment.nom}
                    onChange={(e) => setNewSegment({ ...newSegment, nom: e.target.value })}
                    placeholder="Ex: Prospects Prévoyance"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Couleur</Label>
                  <div className="flex space-x-2">
                    {['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280'].map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${newSegment.couleur === color ? 'border-foreground' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewSegment({ ...newSegment, couleur: color })}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newSegment.description}
                  onChange={(e) => setNewSegment({ ...newSegment, description: e.target.value })}
                  placeholder="Décrivez votre segment..."
                  rows={3}
                />
              </div>
              
              {/* AI Segment Builder */}
              <div className="bg-gradient-primary rounded-xl p-6 text-white">
                <h4 className="font-semibold mb-4 flex items-center">
                  <i className="fas fa-brain mr-2"></i>
                  Assistant IA de Segmentation
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/90">Âge</Label>
                      <Select>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="18-25">18-25 ans</SelectItem>
                          <SelectItem value="26-35">26-35 ans</SelectItem>
                          <SelectItem value="36-50">36-50 ans</SelectItem>
                          <SelectItem value="50+">50+ ans</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white/90">Type de contrat</Label>
                      <Select>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mutuelle">Mutuelle uniquement</SelectItem>
                          <SelectItem value="prevoyance">Prévoyance uniquement</SelectItem>
                          <SelectItem value="both">Les deux</SelectItem>
                          <SelectItem value="none">Aucun contrat</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white/90">Statut du projet</Label>
                      <Select
                        value={newSegment.criteres.statutProjet?.[0] || ''}
                        onValueChange={(value) => 
                          setNewSegment({
                            ...newSegment,
                            criteres: {
                              ...newSegment.criteres,
                              statutProjet: value ? [value as ProjetStatut] : []
                            }
                          })
                        }
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(ProjetStatut).map((statut) => (
                            <SelectItem key={statut} value={statut}>
                              {statut}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                    <span className="text-sm">Taille estimée du segment:</span>
                    <Badge variant="secondary" className="text-xs">156 contacts</Badge>
                  </div>
                  <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                    <span className="text-sm">Potentiel de revenus:</span>
                    <Badge variant="secondary" className="text-xs">€89,500</Badge>
                  </div>
                  <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                    <span className="text-sm">Score IA de performance:</span>
                    <Badge variant="secondary" className="text-xs">87/100</Badge>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateSegment} className="btn-primary">
                  Créer le Segment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* AI Suggested Segments */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-brain mr-2 text-purple-600"></i>
            Segments Suggérés par l'IA
          </CardTitle>
          <CardDescription>
            L'IA a identifié ces opportunités de segmentation dans votre base
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiSuggestedSegments.map((segment, index) => (
              <Card key={index} className="border-2 border-dashed border-muted hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${segment.color} rounded-xl flex items-center justify-center`}>
                      <i className={`${segment.icon} text-white text-lg`}></i>
                    </div>
                    <Badge className="bg-purple-100 text-purple-700">
                      Score IA: {segment.aiScore}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{segment.nom}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{segment.description}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Taille:</span>
                      <span className="font-medium">{segment.size} contacts</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Potentiel:</span>
                      <span className="font-medium">€{segment.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" size="sm">
                    <i className="fas fa-plus mr-1"></i>
                    Créer ce segment
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Existing Segments */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-layer-group mr-2 text-primary"></i>
            Mes Segments ({enrichedSegments.length})
          </CardTitle>
          <CardDescription>
            Gérez vos segments existants et analysez leurs performances
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enrichedSegments.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-layer-group text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold text-foreground mb-2">Aucun segment créé</h3>
              <p className="text-muted-foreground">Commencez par créer votre premier segment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {enrichedSegments.map((segment, index) => (
                <Card key={segment.id || index} className="hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: segment.couleur || '#3B82F6' }}
                        ></div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{segment.nom}</h3>
                          <p className="text-sm text-muted-foreground">{segment.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-purple-100 text-purple-700">
                          IA: {segment.aiScore}/100
                        </Badge>
                        <Button variant="outline" size="sm">
                          <i className="fas fa-edit mr-1"></i>
                          Modifier
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{segment.size}</div>
                        <div className="text-xs text-muted-foreground">Contacts</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-green-600">€{Math.floor(segment.revenue).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Potentiel</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{segment.conversionRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">Conversion</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-pink-600">{segment.aiScore}</div>
                        <div className="text-xs text-muted-foreground">Score IA</div>
                      </div>
                    </div>
                    
                    {/* Performance Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Performance du segment</span>
                        <span>{segment.aiScore}%</span>
                      </div>
                      <Progress value={segment.aiScore} className="h-2" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <i className="fas fa-calendar"></i>
                          <span>Créé il y a 5 jours</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <i className="fas fa-chart-line"></i>
                          <span>+12% cette semaine</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCreateWorkflowFromSegment(segment.id)}
                        >
                          <i className="fas fa-bullhorn mr-1"></i>
                          Créer Workflow
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            exportService.exportSegmentToCSV(segment, clients);
                            toast({
                              title: "Export réussi",
                              description: "Les données du segment ont été exportées au format CSV.",
                            });
                          }}
                        >
                          <i className="fas fa-download mr-1"></i>
                          Exporter
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
    </div>
  );
}
