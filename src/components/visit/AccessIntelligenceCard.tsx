import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  MapPin, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Users,
  Calendar,
  Phone
} from 'lucide-react';

interface AccessIntelligenceCardProps {
  customerId: string;
  onAccessUpdate?: (outcome: any) => void;
}

// Simple mock data structure since the service isn't working
interface AccessData {
  successRate: number;
  recommendedArrivalTime: string;
  bestAccessMethod: string;
  backupContacts: string[];
  commonIssues: string[];
  tips: string[];
}

export function AccessIntelligenceCard({ customerId, onAccessUpdate }: AccessIntelligenceCardProps) {
  const [accessData, setAccessData] = useState<AccessData | null>(null);
  const [contactData, setContactData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMockData = async () => {
      try {
        setIsLoading(true);
        
        // Mock data since the service has type issues
        const mockAccessData: AccessData = {
          successRate: 85,
          recommendedArrivalTime: '9:00 AM - 10:00 AM',
          bestAccessMethod: 'Phone call to main contact',
          backupContacts: ['Security Desk', 'Facilities Manager'],
          commonIssues: ['Locked main entrance', 'Contact unavailable'],
          tips: ['Call 30 minutes before arrival', 'Use visitor parking']
        };
        
        const mockContactData = {
          bestContactMethod: 'Phone',
          bestContactTime: '9:00 AM - 11:00 AM',
          successRate: 78
        };
        
        setAccessData(mockAccessData);
        setContactData(mockContactData);
      } catch (error) {
        console.error('Error fetching access intelligence:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (customerId) {
      fetchMockData();
    }
  }, [customerId]);

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-50';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getSuccessRateVariant = (rate: number) => {
    if (rate >= 80) return 'default';
    if (rate >= 60) return 'secondary';
    return 'destructive';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Access Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!accessData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Access Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No access intelligence data available for this site yet.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Access Intelligence
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Success Rate */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Access Success Rate</span>
          <div className="flex items-center gap-2">
            <Progress value={accessData.successRate} className="w-20" />
            <Badge variant={getSuccessRateVariant(accessData.successRate)}>
              {accessData.successRate}%
            </Badge>
          </div>
        </div>
        
        {/* Best Arrival Time */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Recommended Arrival Time</span>
          </div>
          <div className="pl-6">
            <Badge variant="outline" className="text-sm">
              {accessData.recommendedArrivalTime}
            </Badge>
          </div>
        </div>

        {/* Contact Success Rate */}
        {contactData && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Contact Intelligence</span>
            </div>
            <div className="pl-6 space-y-1">
              <div className="text-sm text-gray-600">
                Best method: <strong>{contactData.bestContactMethod}</strong>
              </div>
              <div className="text-sm text-gray-600">
                Best time: <strong>{contactData.bestContactTime}</strong>
              </div>
              <div className="text-sm text-gray-600">
                Success rate: <strong>{contactData.successRate}%</strong>
              </div>
            </div>
          </div>
        )}

        {/* Backup Contacts */}
        {accessData.backupContacts && accessData.backupContacts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Known Backup Contacts</span>
            </div>
            <div className="pl-6 space-y-1">
              {accessData.backupContacts.map((contact, index) => (
                <div key={index} className="text-sm text-gray-600">
                  {contact}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Common Issues */}
        {accessData.commonIssues && accessData.commonIssues.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Common Access Issues</span>
            </div>
            <div className="pl-6 space-y-1">
              {accessData.commonIssues.map((issue, index) => (
                <div key={index} className="text-sm text-orange-600">
                  • {issue}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips and Recommendations */}
        {accessData.tips && accessData.tips.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Access Tips</span>
            </div>
            <div className="pl-6 space-y-1">
              {accessData.tips.map((tip, index) => (
                <div key={index} className="text-sm text-blue-600">
                  {tip}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Best Access Method */}
        {accessData.bestAccessMethod && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Most Successful Access Method</span>
            </div>
            <div className="pl-6">
              <Badge variant="outline" className="text-sm">
                {accessData.bestAccessMethod}
              </Badge>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-2 border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('Quick contact check for customer:', customerId);
              }}
            >
              <Phone className="h-3 w-3 mr-1" />
              Quick Contact Check
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (onAccessUpdate) {
                  onAccessUpdate({
                    arrivalTime: new Date(),
                    successful: true,
                    issues: '',
                    contactMet: '',
                    accessMethod: accessData.bestAccessMethod || 'phone'
                  });
                }
              }}
            >
              <Calendar className="h-3 w-3 mr-1" />
              Log Access Outcome
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
