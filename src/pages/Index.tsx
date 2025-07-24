import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { CampaignsTab } from '@/components/CampaignsTab';
import { AutomationsTab } from '@/components/AutomationsTab';
import { ContactsTab } from '@/components/ContactsTab';
import { SegmentsTab } from '@/components/SegmentsTab';
import { AnalyticsTab } from '@/components/AnalyticsTab';
import { ProjectsManager } from '@/components/CRUDComponents/ProjectsManager';
import { ContractsManager } from '@/components/CRUDComponents/ContractsManager';
import { SettingsTab } from '@/components/SettingsTab';
import { api } from '@/lib/supabase';
import { AnalyticsEngine } from '@/lib/analytics';

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [automationsStats, setAutomationsStats] = useState<any>(null);
  const [campaignsStats, setCampaignsStats] = useState<any>(null);
  const [aiPredictions, setAiPredictions] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [workflowPerformances, setWorkflowPerformances] = useState({});
  const [campaignPerformances, setCampaignPerformances] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Initialisation de Premun IA...");
  const [preselectedSegmentIdForWorkflow, setPreselectedSegmentIdForWorkflow] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const messages = [
        "Connexion à la base de données...",
        "Chargement des contacts...",
        "Analyse des segments...",
        "Synchronisation des campagnes...",
        "Calcul des métriques IA...",
        "Finalisation...",
      ];

      for (let i = 0; i < messages.length; i++) {
        setLoadingMessage(messages[i]);
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      const [
        contactsData,
        segmentsData,
        workflowsData,
        campaignsData,
        templatesData,
        workflowExecutionsData,
        envoisEmailData
      ] = await Promise.all([
        api.getContacts(),
        api.getSegments(),
        api.getWorkflows(),
        api.getCampaigns(),
        api.getTemplates(),
        api.getWorkflowExecutions(),
        api.getEnvoisEmail()
      ]);

      setClients(contactsData);
      setSegments(segmentsData);
      setWorkflows(workflowsData);
      setCampaigns(campaignsData);
      setTemplates(templatesData);

      calculateAdvancedStats(contactsData, segmentsData, campaignsData, workflowsData, workflowExecutionsData, envoisEmailData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAdvancedStats = (contactsData: any[], segmentsData: any[], campaignsData: any[], workflowsData: any[], workflowExecutionsData: any[], envoisEmailData: any[]) => {
    const totalContacts = contactsData.length;
    const activeClients = contactsData.filter((c: any) => c.contrats && c.contrats.length > 0).length;
    const prospects = totalContacts - activeClients;
    const crossSellOpportunities = AnalyticsEngine.findCrossSellOpportunities(contactsData).length;
    const activeCampaigns = campaignsData.filter((c: any) => c.statut === 'active').length;
    const totalRevenue = contactsData.reduce((sum: number, client: any) => sum + AnalyticsEngine.calculateContactRevenue(client), 0);
    const conversionRate = totalContacts > 0 ? ((activeClients / totalContacts) * 100).toFixed(1) : "0";

    const workflowPerformance = AnalyticsEngine.calculateWorkflowPerformance(workflowsData, workflowExecutionsData);
    const workflowPerfValues: any[] = Object.values(workflowPerformance);
    const totalExecutions = workflowPerfValues.reduce((acc: number, perf) => acc + Number(perf?.totalExecutions || 0), 0);
    const successfulExecutions = workflowsData.map((w: any) => {
        const perf = workflowPerformance[w.id];
        return perf ? Number(perf.totalExecutions || 0) * (Number(perf.successRate || 0) / 100) : 0;
    }).reduce((sum: number, current: number) => sum + current, 0);
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
    const totalOpenRateSum = workflowPerfValues.reduce((acc: number, perf) => acc + Number(perf?.avgOpenRate || 0), 0);
    const avgOpenRateAutomations = workflowsData.length > 0 ? totalOpenRateSum / workflowsData.length : 0;
    const totalConversionRateSum = workflowPerfValues.reduce((acc: number, perf) => acc + Number(perf?.avgConversionRate || 0), 0);
    const avgConversionRateAutomations = workflowsData.length > 0 ? totalConversionRateSum / workflowsData.length : 0;

    setAutomationsStats({
        totalExecutions,
        successRate: successRate.toFixed(1),
        avgOpenRate: avgOpenRateAutomations.toFixed(1),
        avgConversionRate: avgConversionRateAutomations.toFixed(1),
    });

    setWorkflowPerformances(workflowPerformance);

    const campaignPerformance = AnalyticsEngine.calculateCampaignPerformance(campaignsData, envoisEmailData);
    const campaignPerfValues: any[] = Object.values(campaignPerformance);
    const totalSent = campaignPerfValues.reduce((acc: number, perf) => acc + Number(perf?.totalSent || 0), 0);
    const totalOpened = campaignPerfValues.reduce((acc: number, perf) => acc + (Number(perf?.totalSent || 0) * (Number(perf?.openRate || 0) / 100)), 0);
    const totalClicked = campaignPerfValues.reduce((acc: number, perf) => acc + (Number(perf?.totalSent || 0) * (Number(perf?.clickRate || 0) / 100)), 0);
    const totalConverted = campaignPerfValues.reduce((acc: number, perf) => acc + (Number(perf?.totalSent || 0) * (Number(perf?.conversionRate || 0) / 100)), 0);
    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;
    const conversionRateCampaigns = totalSent > 0 ? (totalConverted / totalSent) * 100 : 0;

    setCampaignsStats({
        totalSent,
        openRate: openRate.toFixed(1),
        clickRate: clickRate.toFixed(1),
        conversionRate: conversionRateCampaigns.toFixed(1),
    });

    setCampaignPerformances(campaignPerformance);

    const contactStats = AnalyticsEngine.calculateContactStats(contactsData);
    const predictions = AnalyticsEngine.generateAIPredictions(contactsData);
    const segmentPerformance = AnalyticsEngine.analyzeSegmentPerformance(contactsData, segmentsData);
    const segmentPerfValues: any[] = Object.values(segmentPerformance);
    const totalAiScoreSum = segmentPerfValues.reduce((sum: number, perf) => sum + Number(perf?.aiScore || 0), 0);
    const avgAiScore = segmentPerformance.length > 0 ? totalAiScoreSum / segmentPerformance.length : 0;
    
    const trends = AnalyticsEngine.analyzeTrends(contactsData);
    const topCampaigns = Object.values(campaignPerformance)
        .map((perf: any, index: number) => ({ ...(campaignsData[index] || {}), ...perf }))
        .sort((a: any, b: any) => (Number(b?.totalSent || 0) * Number(b?.conversionRate || 0)) - (Number(a?.totalSent || 0) * Number(a?.conversionRate || 0)))
        .slice(0, 4);

    setAnalyticsData({
        trends,
        segmentPerformance,
        topCampaigns,
        overview: {
            totalRevenue,
            revenueGrowth: contactStats.growthRate,
            totalCampaigns: campaignsData.length,
            activeCampaigns,
            emailsSent: totalSent,
            openRate: openRate.toFixed(1),
            clickRate: clickRate.toFixed(1),
            conversionRate: conversionRateCampaigns.toFixed(1),
            roi: 287, // Mock data, ROI calculation is complex
        },
        aiInsights: predictions,
    });
    
    setAiPredictions(predictions);

    setStats({
      totalContacts,
      activeClients,
      prospects,
      crossSellOpportunities,
      activeCampaigns,
      totalRevenue,
      conversionRate,
      avgRevenuePerClient: activeClients > 0 ? (totalRevenue / activeClients).toFixed(0) : "0",
      growthRate: contactStats.growthRate.toFixed(1),
      aiScore: Math.round(avgAiScore),
    });
  };

  const createSegment = async (segmentData: any) => {
    try {
      await api.createSegment(segmentData);
      loadData();
    } catch (error) {
      console.error("Error creating segment:", error);
    }
  };

  const createWorkflow = async (workflowData: any) => {
    try {
      await api.createWorkflow(workflowData);
      loadData();
    } catch (error) {
      console.error("Error creating workflow:", error);
    }
  };

  const updateWorkflow = async (id: number, workflowData: any) => {
    try {
      await api.updateWorkflow(id, workflowData);
      loadData();
    } catch (error) {
      console.error("Error updating workflow:", error);
    }
  };

  const createCampaign = async (campaignData: any) => {
    try {
      await api.createCampaign(campaignData);
      loadData();
    } catch (error) {
      console.error("Error creating campaign:", error);
    }
  };

  const updateCampaign = async (id: number, campaignData: any) => {
    try {
      await api.updateCampaign(id, campaignData);
      loadData();
    } catch (error) {
      console.error("Error updating campaign:", error);
    }
  };

  const handleCreateWorkflowFromSegment = (segmentId: string) => {
    setPreselectedSegmentIdForWorkflow(segmentId);
    setActiveTab("automations");
  };

  if (loading) {
    return <LoadingScreen message={loadingMessage} />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Toaster />
      
      <Sidebar
        collapsed={sidebarCollapsed}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-64"}`}>
        <Header activeTab={activeTab} stats={stats} />

        <main className="p-6">
          {activeTab === "dashboard" && (
            <DashboardTab
              stats={stats}
              clients={clients}
              segments={segments}
              workflows={workflows}
              campaigns={campaigns}
              aiPredictions={aiPredictions}
            />
          )}
          {activeTab === "campaigns" && (
            <CampaignsTab
              campaigns={campaigns}
              segments={segments}
              templates={templates}
              onCreateCampaign={createCampaign}
              onUpdateCampaign={updateCampaign}
              stats={campaignsStats}
              campaignPerformances={campaignPerformances}
            />
          )}
          {activeTab === "automations" && (
            <AutomationsTab
              workflows={workflows}
              segments={segments}
              onCreateWorkflow={createWorkflow}
              onUpdateWorkflow={updateWorkflow}
              preselectedSegmentId={preselectedSegmentIdForWorkflow}
              setPreselectedSegmentId={setPreselectedSegmentIdForWorkflow}
              performance={automationsStats}
              workflowPerformances={workflowPerformances}
            />
          )}
          {activeTab === "contacts" && <ContactsTab clients={clients} onRefresh={loadData} />}
          {activeTab === "projects" && <ProjectsManager onRefresh={loadData} />}
          {activeTab === "contracts" && <ContractsManager onRefresh={loadData} />}
          {activeTab === "segments" && (
            <SegmentsTab
              segments={segments}
              clients={clients}
              onCreateSegment={createSegment}
              onCreateWorkflowFromSegment={handleCreateWorkflowFromSegment}
            />
          )}
          {activeTab === "analytics" && (
            <AnalyticsTab
              stats={stats}
              campaigns={campaigns}
              clients={clients}
              analyticsData={analyticsData}
            />
          )}
          {activeTab === "settings" && <SettingsTab />}
        </main>
      </div>
    </div>
  );
};

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-8">
          <div className="w-20 h-20 border-4 border-white/20 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-white rounded-full animate-spin" style={{ animationDuration: "0.8s" }}></div>
          <div className="absolute top-2 left-2 w-16 h-16 border-4 border-transparent border-t-blue-300 rounded-full animate-spin" style={{ animationDuration: "1.2s", animationDirection: "reverse" }}></div>
        </div>
        <div className="text-white text-2xl font-bold mb-4">Premun IA</div>
        <div className="text-white/80 text-lg mb-2">{message}</div>
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ collapsed, activeTab, setActiveTab, onToggle }: any) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "fas fa-chart-line", color: "from-blue-500 to-blue-600" },
    { id: "campaigns", label: "Campagnes", icon: "fas fa-bullhorn", color: "from-green-500 to-green-600" },
    { id: "automations", label: "Automations", icon: "fas fa-robot", color: "from-purple-500 to-purple-600" },
    { id: "contacts", label: "Contacts", icon: "fas fa-users", color: "from-orange-500 to-orange-600" },
    { id: "projects", label: "Projets", icon: "fas fa-project-diagram", color: "from-teal-500 to-teal-600" },
    { id: "contracts", label: "Contrats", icon: "fas fa-file-contract", color: "from-red-500 to-red-600" },
    { id: "segments", label: "Segments", icon: "fas fa-layer-group", color: "from-pink-500 to-pink-600" },
    { id: "analytics", label: "Analytics", icon: "fas fa-chart-bar", color: "from-indigo-500 to-indigo-600" },
    { id: "settings", label: "Paramètres", icon: "fas fa-cog", color: "from-gray-500 to-gray-600" },
  ];

  return (
    <div className={`fixed left-0 top-0 h-full bg-card shadow-xl border-r border-border transition-all duration-300 z-50 ${collapsed ? "w-16" : "w-64"}`}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                <i className="fas fa-magic text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">Premun IA</h1>
                <p className="text-xs text-muted-foreground">IA Marketing Platform</p>
              </div>
            </div>
          )}
          <button onClick={onToggle} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <i className={`fas fa-${collapsed ? "chevron-right" : "chevron-left"} text-muted-foreground`}></i>
          </button>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 group ${
              activeTab === item.id
                ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <i className={`${item.icon} text-lg ${collapsed ? "mx-auto" : ""}`}></i>
            {!collapsed && <span className="font-medium">{item.label}</span>}
            {activeTab === item.id && !collapsed && (
              <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
            )}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white">
            <div className="flex items-center space-x-2 mb-2">
              <i className="fas fa-brain text-lg"></i>
              <span className="font-semibold">Assistant IA</span>
            </div>
            <p className="text-sm text-white/80 mb-3">Optimisez vos campagnes avec l'IA</p>
            <button className="w-full bg-white/20 hover:bg-white/30 text-white text-sm py-2 rounded-lg transition-colors">
              Demander conseil
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Header({ activeTab, stats }: any) {
  const getHeaderInfo = () => {
    switch (activeTab) {
      case "dashboard":
        return { title: "Dashboard", description: "Vue d'ensemble de vos performances marketing", icon: "fas fa-chart-line", gradient: "from-blue-500 to-blue-600" };
      case "campaigns":
        return { title: "Campagnes Email", description: "Créez et gérez vos campagnes marketing", icon: "fas fa-bullhorn", gradient: "from-green-500 to-green-600" };
      case "automations":
        return { title: "Automations IA", description: "Workflows intelligents et automatisés", icon: "fas fa-robot", gradient: "from-purple-500 to-purple-600" };
      case "contacts":
        return { title: "Base de Contacts", description: "Gérez votre base de données clients", icon: "fas fa-users", gradient: "from-orange-500 to-orange-600" };
      case "projects":
        return { title: "Gestion des Projets", description: "Suivez tous vos projets clients", icon: "fas fa-project-diagram", gradient: "from-teal-500 to-teal-600" };
      case "contracts":
        return { title: "Gestion des Contrats", description: "Gérez vos contrats d'assurance", icon: "fas fa-file-contract", color: "from-red-500 to-red-600" };
      case "segments":
        return { title: "Segmentation", description: "Segments intelligents et ciblage précis", icon: "fas fa-layer-group", gradient: "from-pink-500 to-pink-600" };
      case "analytics":
        return { title: "Analytics Avancées", description: "Insights et métriques de performance", icon: "fas fa-chart-bar", gradient: "from-indigo-500 to-indigo-600" };
      default:
        return { title: "Premun IA", description: "Plateforme marketing intelligente", icon: "fas fa-magic", gradient: "from-blue-500 to-purple-600" };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 bg-gradient-to-r ${headerInfo.gradient} rounded-xl flex items-center justify-center`}>
            <i className={`${headerInfo.icon} text-white text-lg`}></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{headerInfo.title}</h1>
            <p className="text-muted-foreground">{headerInfo.description}</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{stats.totalContacts || 0}</div>
              <div className="text-xs text-muted-foreground">Contacts</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{stats.conversionRate || 0}%</div>
              <div className="text-xs text-muted-foreground">Conversion</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{stats.aiScore || 0}</div>
              <div className="text-xs text-muted-foreground">Score IA</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">AD</span>
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-medium text-foreground">Admin User</div>
              <div className="text-xs text-muted-foreground">Marketing Manager</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function DashboardTab({ stats, clients, segments, workflows, campaigns, aiPredictions }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-primary rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Bienvenue sur Premun IA</h2>
            <p className="text-blue-100 text-lg mb-4">Votre plateforme marketing intelligente propulsée par l'IA</p>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <i className="fas fa-brain text-xl"></i>
                <span>IA Score: {stats.aiScore || 87}/100</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-trending-up text-xl"></i>
                <span>Croissance: +{stats.growthRate || 12.5}%</span>
              </div>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center animate-float">
              <i className="fas fa-rocket text-6xl text-white/80"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: "Nouvelle Campagne", icon: "fas fa-plus", color: "from-green-500 to-green-600" },
          { title: "Créer Segment", icon: "fas fa-layer-group", color: "from-blue-500 to-blue-600" },
          { title: "Automation IA", icon: "fas fa-robot", color: "from-purple-500 to-purple-600" },
          { title: "Analyser Données", icon: "fas fa-chart-line", color: "from-pink-500 to-pink-600" },
        ].map((action, index) => (
          <button key={index} className={`bg-gradient-to-r ${action.color} text-white p-6 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200`}>
            <i className={`${action.icon} text-2xl mb-3 block`}></i>
            <span className="font-semibold">{action.title}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Contacts", value: stats.totalContacts || 0, change: "+12%", icon: "fas fa-users", color: "from-blue-500 to-blue-600" },
          { title: "Clients Actifs", value: stats.activeClients || 0, change: "+8%", icon: "fas fa-user-check", color: "from-green-500 to-green-600" },
          { title: "Revenus Annuels", value: `€${(stats.totalRevenue || 0).toLocaleString()}`, change: "+15%", icon: "fas fa-euro-sign", color: "from-purple-500 to-purple-600" },
          { title: "Taux Conversion", value: `${stats.conversionRate || 0}%`, change: "+3%", icon: "fas fa-percentage", color: "from-pink-500 to-pink-600" },
        ].map((kpi, index) => (
          <div key={index} className="bg-card rounded-xl p-6 shadow-lg border border-border card-glow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${kpi.color} rounded-xl flex items-center justify-center`}>
                <i className={`${kpi.icon} text-white text-lg`}></i>
              </div>
              <div className="metric-positive">{kpi.change}</div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{kpi.title}</p>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl p-6 shadow-lg border border-border card-glow">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            <i className="fas fa-brain text-purple-600 mr-2"></i>
            Insights IA
          </h3>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">Temps réel</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {aiPredictions.map((prediction, index) => (
            <div key={index} className="border border-border rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center`}>
                  <i className={`fas fa-brain text-white text-sm`}></i>
                </div>
                <h4 className="font-medium text-foreground">{prediction.title}</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{prediction.description}</p>
              <button className={`text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-lg hover:shadow-md transition-all duration-200`}>
                {prediction.action}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Index;
