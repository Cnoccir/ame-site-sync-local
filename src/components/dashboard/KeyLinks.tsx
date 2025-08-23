import { useState, useEffect } from 'react';
import { ExternalLink, FileText, Users, Wrench, BookOpen, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GoogleDriveService } from '@/services/googleDriveService';
import { useToast } from '@/hooks/use-toast';

interface DriveLink {
  name: string;
  description: string;
  icon: any;
  color: string;
  service: () => Promise<string>;
  viewUrl: string;
}

export const KeyLinks = () => {
  const [linkStatuses, setLinkStatuses] = useState<Record<string, 'idle' | 'checking' | 'connected' | 'error'>>({});
  const { toast } = useToast();

  const links: DriveLink[] = [
    {
      name: 'SOP Library',
      description: 'SOP Library data source',
      icon: BookOpen,
      color: 'text-blue-600',
      service: GoogleDriveService.getSopLibraryData,
      viewUrl: GoogleDriveService.getFileUrls().sopLibrary.view
    },
    {
      name: 'Customers',
      description: 'Customer data source',
      icon: Users,
      color: 'text-purple-600',
      service: GoogleDriveService.getCustomersData,
      viewUrl: GoogleDriveService.getFileUrls().customers.view
    },
    {
      name: 'Tool Library',
      description: 'Tool Library data source',
      icon: Wrench,
      color: 'text-orange-600',
      service: GoogleDriveService.getToolLibraryData,
      viewUrl: GoogleDriveService.getFileUrls().toolLibrary.view
    },
    {
      name: 'Task Library',
      description: 'Task Library data source',
      icon: FileText,
      color: 'text-green-600',
      service: GoogleDriveService.getTaskLibraryData,
      viewUrl: GoogleDriveService.getFileUrls().taskLibrary.view
    }
  ];

  const testConnection = async (link: DriveLink) => {
    setLinkStatuses(prev => ({ ...prev, [link.name]: 'checking' }));
    
    try {
      await link.service();
      setLinkStatuses(prev => ({ ...prev, [link.name]: 'connected' }));
      toast({
        title: `${link.name} Connected`,
        description: 'Successfully accessed drive data source',
        variant: 'default'
      });
    } catch (error) {
      setLinkStatuses(prev => ({ ...prev, [link.name]: 'error' }));
      toast({
        title: `${link.name} Connection Failed`,
        description: 'Unable to access drive data source',
        variant: 'destructive'
      });
    }
  };

  const testAllConnections = async () => {
    for (const link of links) {
      await testConnection(link);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-3 h-3 animate-spin text-blue-500" />;
      case 'connected':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <ExternalLink className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const openDriveLink = (link: DriveLink) => {
    window.open(link.viewUrl, '_blank');
  };

  return (
    <Card className="border-card-border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">KEY DRIVE LINKS</CardTitle>
            <p className="text-sm text-muted-foreground">Quick access to drive resources</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={testAllConnections}
            disabled={Object.values(linkStatuses).some(status => status === 'checking')}
          >
            Test All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {links.map((link) => (
            <div 
              key={link.name} 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-card-border group"
            >
              <div className={`p-2 rounded-lg bg-muted ${link.color}`}>
                <link.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">{link.name}</h4>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(linkStatuses[link.name] || 'idle')}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{link.description}</p>
              </div>
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => testConnection(link)}
                  disabled={linkStatuses[link.name] === 'checking'}
                  className="h-8 px-2"
                >
                  Test
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDriveLink(link)}
                  className="h-8 px-2"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};