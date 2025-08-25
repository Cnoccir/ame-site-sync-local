import { ExternalLink, FileText, Users, Wrench, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GoogleDriveService } from '@/services/googleDriveService';

interface DriveLink {
  name: string;
  description: string;
  icon: any;
  color: string;
  viewUrl: string;
}

export const KeyLinks = () => {

  const links: DriveLink[] = [
    {
      name: 'SOP Library',
      description: 'Standard Operating Procedures',
      icon: BookOpen,
      color: 'text-blue-600',
      viewUrl: GoogleDriveService.getFileUrls().sopLibrary.view
    },
    {
      name: 'Customers',
      description: 'Customer Database',
      icon: Users,
      color: 'text-purple-600',
      viewUrl: GoogleDriveService.getFileUrls().customers.view
    },
    {
      name: 'Tool Library',
      description: 'Equipment & Tools Reference',
      icon: Wrench,
      color: 'text-orange-600',
      viewUrl: GoogleDriveService.getFileUrls().toolLibrary.view
    },
    {
      name: 'Task Library',
      description: 'Service Task Templates',
      icon: FileText,
      color: 'text-green-600',
      viewUrl: GoogleDriveService.getFileUrls().taskLibrary.view
    }
  ];


  const openDriveLink = (link: DriveLink) => {
    window.open(link.viewUrl, '_blank');
  };

  return (
    <Card className="border-card-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Access Links</CardTitle>
        <p className="text-sm text-muted-foreground">Direct access to key resources</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {links.map((link) => (
            <Button
              key={link.name}
              variant="ghost" 
              onClick={() => openDriveLink(link)}
              className="w-full justify-start h-auto p-4 hover:bg-muted/50"
            >
              <div className="flex items-center space-x-3 w-full">
                <div className={`p-2 rounded-lg bg-muted ${link.color}`}>
                  <link.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="text-sm font-medium text-foreground">{link.name}</h4>
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};