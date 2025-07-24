import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface AnalyticsTabProps {
  stats: any;
  campaigns: any[];
  clients: any[];
  analyticsData: any;
}

export function AnalyticsTab({ stats, campaigns, clients, analyticsData }: AnalyticsTabProps) {
  const [dateRange, setDateRange] = useState('30d');

  const data = analyticsData || {
    overview: {
      totalRevenue: 0,
      revenueGrowth: 0,
      totalCampaigns: 0,
      activeCampaigns: 0,
      emailsSent: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      roi: 0,
    },
    trends: { projectsByStatus: {} },
    topCampaigns: [],
    segmentPerformance: [],
    aiInsights: [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics Avancées</h2>
          <p className="text-muted-foreground">Insights et métriques de performance en temps réel</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">3 derniers mois</SelectItem>
              <SelectItem value="1y">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <i className="fas fa-download mr-2"></i>
            Exporter
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Chiffre d'Affaires",
            value: `€${(data.overview.totalRevenue || 0).toLocaleString()}`,
            change: `+${(data.overview.revenueGrowth || 0).toFixed(1)}%`,
            icon: "fas fa-euro-sign",
            color: "from-green-500 to-green-600",
            trend: "up"
          },
          {
            title: "ROI Marketing",
            value: `${data.overview.roi}%`,
            change: "+45%",
            icon: "fas fa-chart-line",
            color: "from-blue-500 to-blue-600",
            trend: "up"
          },
          {
            title: "Taux de Conversion",
            value: `${data.overview.conversionRate}%`,
            change: "+0.3%",
            icon: "fas fa-percentage",
            color: "from-purple-500 to-purple-600",
            trend: "up"
          },
          {
            title: "Emails Envoyés",
            value: (data.overview.emailsSent || 0).toLocaleString(),
            change: "+18%",
            icon: "fas fa-paper-plane",
            color: "from-pink-500 to-pink-600",
            trend: "up"
          },
        ].map((metric, index) => (
          <Card key={index} className="card-glow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${metric.color} rounded-xl flex items-center justify-center`}>
                  <i className={`${metric.icon} text-white text-lg`}></i>
                </div>
                <Badge className="metric-positive">{metric.change}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                <p className="text-2xl font-bold text-foreground">{metric.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analytics Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <Card className="lg:col-span-2 card-glow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-chart-area mr-2 text-primary"></i>
              Évolution du Chiffre d'Affaires
            </CardTitle>
            <CardDescription>Progression mensuelle des revenus et conversions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center">
              <p className="text-muted-foreground">Données de tendance non disponibles.</p>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-brain mr-2 text-purple-600"></i>
              Insights IA
            </CardTitle>
            <CardDescription>Analyses prédictives et recommandations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.aiInsights.map((insight: any, index: number) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      insight.type === 'opportunity' ? 'bg-green-100 text-green-600' :
                      insight.type === 'optimization' ? 'bg-blue-100 text-blue-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      <i className={`${insight.icon} text-sm`}></i>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-sm">{insight.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline" className="text-xs">
                          Confiance: {insight.confidence}%
                        </Badge>
                        <Button variant="outline" size="sm" className="text-xs">
                          {insight.action}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle>Analyses Détaillées</CardTitle>
          <CardDescription>Performance par campagne, segment et canal</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="campaigns" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
              <TabsTrigger value="segments">Segments</TabsTrigger>
              <TabsTrigger value="funnel">Funnel de Conversion</TabsTrigger>
            </TabsList>
            
            <TabsContent value="campaigns" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Top Campagnes</h3>
                {data.topCampaigns.map((campaign: any, index: number) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground">{campaign.nom}</h4>
                      <Badge className="bg-green-100 text-green-700">
                        €{((campaign.totalSent || 0) * (campaign.conversionRate || 0) * 10).toLocaleString()} {/* Mock Revenue */}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{(campaign.totalSent || 0).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Envoyés</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{campaign.openRate}%</div>
                        <div className="text-xs text-muted-foreground">Ouverture</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{campaign.clickRate}%</div>
                        <div className="text-xs text-muted-foreground">Clic</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-pink-600">{campaign.conversionRate}%</div>
                        <div className="text-xs text-muted-foreground">Conversions</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="segments" className="mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Performance par Segment</h3>
                {data.segmentPerformance.map((segment: any, index: number) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-foreground">{segment.name}</h4>
                        <p className="text-sm text-muted-foreground">{segment.size} contacts</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">€{(segment.revenue || 0).toLocaleString()}</div>
                        <Badge className="bg-purple-100 text-purple-700 text-xs">
                          IA: {segment.aiScore}/100
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Taux de conversion</span>
                        <span className="font-medium">{segment.conversionRate}%</span>
                      </div>
                      <Progress value={segment.conversionRate} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="funnel" className="mt-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Funnel de Conversion Email</h3>
                <div className="space-y-4">
                  {[
                    { stage: 'Emails Envoyés', count: data.overview.emailsSent, percentage: 100, color: 'bg-blue-500' },
                    { stage: 'Emails Ouverts', count: Math.round(data.overview.emailsSent * (data.overview.openRate / 100)), percentage: data.overview.openRate, color: 'bg-yellow-500' },
                    { stage: 'Clics', count: Math.round(data.overview.emailsSent * (data.overview.clickRate / 100)), percentage: data.overview.clickRate, color: 'bg-orange-500' },
                    { stage: 'Conversions', count: Math.round(data.overview.emailsSent * (data.overview.conversionRate / 100)), percentage: data.overview.conversionRate, color: 'bg-red-500' },
                  ].map((stage, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-32 text-sm font-medium">{stage.stage}</div>
                      <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                        <div 
                          className={`h-full ${stage.color} transition-all duration-500`}
                          style={{ width: `${stage.percentage}%` }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                          {stage.count.toLocaleString()} ({stage.percentage}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

