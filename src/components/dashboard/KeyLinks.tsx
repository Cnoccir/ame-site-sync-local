import { ExternalLink, FileText, Users, Wrench, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const KeyLinks = () => {
  const links = [
    {
      name: 'SOP Library',
      description: 'SOP Library data source',
      icon: BookOpen,
      color: 'text-info'
    },
    {
      name: 'Customers',
      description: 'Customer data source',
      icon: Users,
      color: 'text-primary'
    },
    {
      name: 'Tool Library',
      description: 'Tool Library data source',
      icon: Wrench,
      color: 'text-warning'
    },
    {
      name: 'Task Library',
      description: 'Task Library data source',
      icon: FileText,
      color: 'text-success'
    }
  ];

  return (
    <Card className="border-card-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">KEY DRIVE LINKS</CardTitle>
        <p className="text-sm text-muted-foreground">Quick access to drive resources</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {links.map((link) => (
            <div key={link.name} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer border border-card-border">
              <div className={`p-2 rounded-lg bg-muted ${link.color}`}>
                <link.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">{link.name}</h4>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">{link.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};