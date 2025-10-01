import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Clock,
  Cpu,
  Shield
} from 'lucide-react';
import { PlatformDataService } from '@/services/PlatformDataService';

interface PlatformBenchmarkDashboardProps {
  customerId: string;
  currentSessionId?: string;
}

interface TrendAnalysis {
  metric: string;
  current: any;
  previous: any;
  trend: 'improving' | 'stable' | 'degrading' | 'new';
  changePercentage?: number;
  significance: 'critical' | 'moderate' | 'minor' | 'none';
}

export const PlatformBenchmarkDashboard: React.FC<PlatformBenchmarkDashboardProps> = ({
  customerId,
  currentSessionId
}) => {
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBenchmarkData();
  }, [customerId, currentSessionId]);

  const loadBenchmarkData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get platform history for this customer
      const historyResult = await PlatformDataService.getPlatformHistory(customerId, 10);
      if (historyResult.error) {
        setError(historyResult.error);
        return;
      }

      const history = historyResult.data || [];
      setBenchmarkData(history);

      // Perform trend analysis
      if (history.length >= 2) {
        const trends = analyzeTrends(history);
        setTrendAnalysis(trends);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load benchmark data');
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeTrends = (history: any[]): TrendAnalysis[] => {
    if (history.length < 2) return [];

    const current = history[0]; // Most recent
    const previous = history[1]; // Previous visit

    const currentSummary = current.platformData.summary;
    const previousSummary = previous.platformData.summary;

    const trends: TrendAnalysis[] = [
      {
        metric: 'Niagara Version',
        current: currentSummary.daemonVersion,
        previous: previousSummary.daemonVersion,
        trend: currentSummary.daemonVersion !== previousSummary.daemonVersion ? 'improving' : 'stable',
        significance: currentSummary.daemonVersion !== previousSummary.daemonVersion ? 'moderate' : 'none'
      },
      {
        metric: 'CPU Count',
        current: currentSummary.cpuCount,
        previous: previousSummary.cpuCount,
        trend: currentSummary.cpuCount > previousSummary.cpuCount ? 'improving' :
               currentSummary.cpuCount < previousSummary.cpuCount ? 'degrading' : 'stable',
        changePercentage: previousSummary.cpuCount > 0 ?
          ((currentSummary.cpuCount - previousSummary.cpuCount) / previousSummary.cpuCount) * 100 : 0,
        significance: currentSummary.cpuCount !== previousSummary.cpuCount ? 'critical' : 'none'
      },
      {
        metric: 'TLS Support',
        current: currentSummary.platformTlsSupport,
        previous: previousSummary.platformTlsSupport,
        trend: currentSummary.platformTlsSupport !== previousSummary.platformTlsSupport ? 'improving' : 'stable',
        significance: currentSummary.platformTlsSupport !== previousSummary.platformTlsSupport ? 'moderate' : 'none'
      },
      {
        metric: 'Runtime Profiles',
        current: currentSummary.enabledRuntimeProfiles?.length || 0,
        previous: previousSummary.enabledRuntimeProfiles?.length || 0,
        trend: (currentSummary.enabledRuntimeProfiles?.length || 0) > (previousSummary.enabledRuntimeProfiles?.length || 0) ? 'improving' :
               (currentSummary.enabledRuntimeProfiles?.length || 0) < (previousSummary.enabledRuntimeProfiles?.length || 0) ? 'degrading' : 'stable',
        significance: (currentSummary.enabledRuntimeProfiles?.length || 0) !== (previousSummary.enabledRuntimeProfiles?.length || 0) ? 'minor' : 'none'
      },
      {
        metric: 'Host ID Status',
        current: currentSummary.hostIdStatus,
        previous: previousSummary.hostIdStatus,
        trend: currentSummary.hostIdStatus !== previousSummary.hostIdStatus ? 'degrading' : 'stable',
        significance: currentSummary.hostIdStatus !== previousSummary.hostIdStatus ? 'critical' : 'none'
      }
    ];

    return trends.filter(trend => trend.significance !== 'none');
  };

  const getTrendIcon = (trend: TrendAnalysis['trend']) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'degrading': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-500" />;
      case 'new': return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: TrendAnalysis['trend']) => {
    switch (trend) {
      case 'improving': return 'text-green-600 bg-green-50 border-green-200';
      case 'degrading': return 'text-red-600 bg-red-50 border-red-200';
      case 'stable': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'new': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSignificanceColor = (significance: TrendAnalysis['significance']) => {
    switch (significance) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'minor': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading benchmark data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !benchmarkData || benchmarkData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <span>No historical data available for benchmarking</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Benchmarking data will appear after multiple PM visits with platform imports.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-lg font-semibold">{benchmarkData.length}</div>
                <div className="text-sm text-gray-600">Total Visits</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-lg font-semibold">{trendAnalysis.length}</div>
                <div className="text-sm text-gray-600">Tracked Changes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <div className="text-lg font-semibold">
                  {trendAnalysis.filter(t => t.significance === 'critical').length}
                </div>
                <div className="text-sm text-gray-600">Critical Changes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">📈 Trend Analysis</TabsTrigger>
          <TabsTrigger value="history">📅 Visit History</TabsTrigger>
          <TabsTrigger value="recommendations">💡 Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Platform Configuration Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {trendAnalysis.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                  <p>No significant changes detected</p>
                  <p className="text-sm">Platform configuration appears stable</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trendAnalysis.map((trend, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getTrendIcon(trend.trend)}
                        <div>
                          <div className="font-medium text-sm">{trend.metric}</div>
                          <div className="text-xs text-gray-600">
                            {trend.previous} → {trend.current}
                            {trend.changePercentage && trend.changePercentage !== 0 && (
                              <span className={`ml-2 ${trend.changePercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ({trend.changePercentage > 0 ? '+' : ''}{trend.changePercentage.toFixed(1)}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`text-xs ${getTrendColor(trend.trend)}`}>
                          {trend.trend}
                        </Badge>
                        <Badge className={`text-xs ${getSignificanceColor(trend.significance)}`}>
                          {trend.significance}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Platform Visit History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {benchmarkData.map((visit: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">
                        {new Date(visit.visitDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-600">
                        {visit.technician || 'Unknown Technician'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">
                        <Badge variant="outline" className="text-xs">
                          {visit.platformData.summary.daemonVersion}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {visit.platformData.summary.model} {visit.platformData.summary.product}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Benchmarking Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trendAnalysis.filter(t => t.significance === 'critical').length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-red-800 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">Critical Changes Detected</span>
                    </div>
                    <ul className="text-sm text-red-700 space-y-1">
                      {trendAnalysis
                        .filter(t => t.significance === 'critical')
                        .map((trend, idx) => (
                          <li key={idx}>• {trend.metric} change requires attention</li>
                        ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Cpu className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">Performance Monitoring</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Continue collecting platform data during each PM visit to establish performance baselines
                    and identify optimization opportunities.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-sm">Security Compliance</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Monitor TLS configuration and security settings to ensure continued compliance
                    with cybersecurity standards.
                  </p>
                </div>

                {benchmarkData.length >= 3 && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <span className="font-medium text-sm">Predictive Analysis</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      With {benchmarkData.length} visits recorded, consider setting up automated alerts
                      for significant configuration changes between visits.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};