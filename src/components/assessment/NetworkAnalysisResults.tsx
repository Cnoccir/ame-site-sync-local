import { FileText, Network, Server, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NetworkAnalysisResultsProps {
  data: {
    totalStations: number;
    totalNetworks: number;
    protocolsFound: string[];
    filesProcessed: number;
    networkSegments: string[];
    recommendations: string[];
  };
}

export const NetworkAnalysisResults = ({ data }: NetworkAnalysisResultsProps) => {
  const statisticsCards = [
    {
      icon: Server,
      label: 'Total Stations',
      value: data.totalStations.toLocaleString(),
      color: 'text-blue-600'
    },
    {
      icon: Network,
      label: 'Networks',
      value: data.totalNetworks.toString(),
      color: 'text-green-600'
    },
    {
      icon: Zap,
      label: 'Protocols',
      value: data.protocolsFound.length.toString(),
      color: 'text-orange-600'
    },
    {
      icon: FileText,
      label: 'Files Processed',
      value: data.filesProcessed.toString(),
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      <h4 className="font-medium mb-4">Network Analysis Results</h4>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statisticsCards.map((stat) => (
          <Card key={stat.label} className="p-4 text-center">
            <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Protocols Found */}
      <Card className="p-4">
        <h5 className="font-medium mb-3">Protocols Detected</h5>
        <div className="flex flex-wrap gap-2">
          {data.protocolsFound.map((protocol) => (
            <Badge key={protocol} variant="outline">
              {protocol}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Network Segments */}
      <Card className="p-4">
        <h5 className="font-medium mb-3">Network Segments</h5>
        <div className="space-y-2">
          {data.networkSegments.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <Network className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{segment}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Recommendations */}
      <Card className="p-4">
        <h5 className="font-medium mb-3">Analysis Recommendations</h5>
        <div className="space-y-2">
          {data.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span className="text-sm">{recommendation}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};