import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { api } from '@/lib/supabase';
import { useToast } from "@/hooks/use-toast";
import { EmailConfiguration } from '@/lib/types';

export function SettingsTab() {
  const [emailConfigs, setEmailConfigs] = useState<EmailConfiguration[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<EmailConfiguration | null>(null);
  const [newConfig, setNewConfig] = useState<Partial<EmailConfiguration>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadEmailConfigs();
  }, []);

  const loadEmailConfigs = async () => {
    const data = await api.getEmailConfigurations();
    setEmailConfigs(data);
  };

  const openCreateModal = () => {
    setEditingConfig(null);
    setNewConfig({
      email: '',
      description: '',
      smtp_host: '',
      smtp_port: 587,
      smtp_secure: true,
      smtp_username: '',
      smtp_password: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (config: EmailConfiguration) => {
    setEditingConfig(config);
    setNewConfig(config);
    setIsModalOpen(true);
  };

  const handleSaveConfig = async () => {
    try {
      if (editingConfig) {
        await api.updateEmailConfiguration(editingConfig.id, newConfig);
      } else {
        await api.createEmailConfiguration(newConfig);
      }
      setIsModalOpen(false);
      loadEmailConfigs();
      toast({ title: "Succès", description: "Configuration enregistrée." });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'enregistrer la configuration.", variant: "destructive" });
    }
  };

  const handleDeleteConfig = async (id: number) => {
    try {
      await api.deleteEmailConfiguration(id);
      loadEmailConfigs();
      toast({ title: "Succès", description: "Configuration supprimée." });
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de supprimer la configuration.", variant: "destructive" });
    }
  };

  const handleTestConnection = async (config: EmailConfiguration) => {
    try {
      toast({ title: "Test en cours...", description: "Vérification de la connexion SMTP." });

      const result = await api.testSmtpConnection(config);

      if (result.success) {
        toast({ title: "Succès", description: result.message });
      } else {
        toast({ title: "Erreur", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Une erreur est survenue lors du test de la connexion.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configurations Email</CardTitle>
              <CardDescription>Gérez les adresses email pour l'envoi des campagnes.</CardDescription>
            </div>
            <Button onClick={openCreateModal}>Ajouter une configuration</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emailConfigs.map(config => (
              <Card key={config.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{config.email}</p>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={config.is_active ? "default" : "outline"}>
                    {config.is_active ? "Actif" : "Inactif"}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => handleTestConnection(config)}>Tester</Button>
                  <Button variant="outline" size="sm" onClick={() => openEditModal(config)}>Modifier</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteConfig(config.id)}>Supprimer</Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingConfig ? "Modifier" : "Ajouter"} une configuration email</DialogTitle>
            <DialogDescription>
              Renseignez les informations de votre serveur d'envoi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse Email</Label>
                <Input id="email" value={newConfig.email || ''} onChange={e => setNewConfig({...newConfig, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={newConfig.description || ''} onChange={e => setNewConfig({...newConfig, description: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp_host">Hôte SMTP</Label>
                <Input id="smtp_host" value={newConfig.smtp_host || ''} onChange={e => setNewConfig({...newConfig, smtp_host: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp_port">Port SMTP</Label>
                <Input id="smtp_port" type="number" value={newConfig.smtp_port || ''} onChange={e => setNewConfig({...newConfig, smtp_port: parseInt(e.target.value)})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp_username">Nom d'utilisateur SMTP</Label>
              <Input id="smtp_username" value={newConfig.smtp_username || ''} onChange={e => setNewConfig({...newConfig, smtp_username: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp_password">Mot de passe SMTP</Label>
              <Input id="smtp_password" type="password" value={newConfig.smtp_password || ''} onChange={e => setNewConfig({...newConfig, smtp_password: e.target.value})} />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="smtp_secure" checked={newConfig.smtp_secure} onCheckedChange={checked => setNewConfig({...newConfig, smtp_secure: checked})} />
              <Label htmlFor="smtp_secure">Utiliser SMTPS (SSL/TLS)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is_active" checked={newConfig.is_active} onCheckedChange={checked => setNewConfig({...newConfig, is_active: checked})} />
              <Label htmlFor="is_active">Activer cette configuration</Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveConfig}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
