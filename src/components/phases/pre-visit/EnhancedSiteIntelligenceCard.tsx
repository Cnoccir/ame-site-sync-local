import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Users, 
  Clock, 
  Phone, 
  AlertTriangle, 
  CheckCircle, 
  Wrench, 
  Calendar,
  Shield,
  Building,
  User,
  Settings,
  FileText
} from 'lucide-react';
import { Customer } from '@/types';
import { SiteIntelligenceService } from '@/services/SiteIntelligenceService';

interface EnhancedSiteIntelligenceCardProps {
  customer: Customer;
  onEdit?: () => void;
}

export const EnhancedSiteIntelligenceCard: React.FC<EnhancedSiteIntelligenceCardProps> = ({ 
  customer, 
  onEdit 
}) => {
  const [toolRecommendations, setToolRecommendations] = useState<Array<{
    toolName: string;
    reason: string;
    priority: 'essential' | 'recommended' | 'optional';
    category: string;
  }>>([]);

  useEffect(() => {
    const recommendations = SiteIntelligenceService.generateToolRecommendations(customer);
    setToolRecommendations(recommendations);
  }, [customer]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'essential': return 'bg-red-100 text-red-800 border-red-200';
      case 'recommended': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'optional': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSystemPlatformColor = (platform?: string) => {
    switch (platform) {
      case 'N4': return 'bg-blue-100 text-blue-800';
      case 'FX': return 'bg-green-100 text-green-800';
      case 'WEBs': return 'bg-purple-100 text-purple-800';
      case 'Mixed-ALC': return 'bg-orange-100 text-orange-800';
      case 'EBI-Honeywell': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getExperienceColor = (experience?: string) => {
    switch (experience) {
      case 'expert': return 'bg-green-100 text-green-800';
      case 'familiar': return 'bg-yellow-100 text-yellow-800';
      case 'first_time': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Enhanced Site Intelligence
          </CardTitle>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Settings className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Site Identity Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <MapPin className="h-4 w-4" />
            Site Identity
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium">Site Nickname</div>
              <div className="text-lg font-semibold text-blue-600">
                {customer.site_nickname || 'Not set'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Site Number</div>
              <div className="text-lg font-semibold text-green-600">
                {customer.site_number || 'Not assigned'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">System Platform</div>
              <Badge className={getSystemPlatformColor(customer.system_platform)}>
                {customer.system_platform || 'Not set'}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium">Service Tier</div>
              <Badge variant="secondary">
                {customer.service_tier}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Team Context Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Users className="h-4 w-4" />
            Team Context
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium">Primary Technician</div>
              <div className="text-sm text-gray-600">
                {customer.primary_technician_name || 'Unassigned'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Secondary Technician</div>
              <div className="text-sm text-gray-600">
                {customer.secondary_technician_name || 'Unassigned'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Last Visit By</div>
              <div className="text-sm text-gray-600">
                {customer.last_visit_by || 'No previous visits'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Site Experience</div>
              <Badge className={getExperienceColor(customer.site_experience)}>
                {customer.site_experience || 'Unknown'}
              </Badge>
            </div>
          </div>
          {customer.handoff_notes && (
            <div>
              <div className="text-sm font-medium">Handoff Notes</div>
              <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-md border border-yellow-200">
                {customer.handoff_notes}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Access Intelligence Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Shield className="h-4 w-4" />
            Access Intelligence
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium">Point of Contact</div>
              <div className="text-sm text-gray-600">
                {customer.poc_name || 'Not specified'}
                {customer.poc_phone && (
                  <div className="flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3" />
                    {customer.poc_phone}
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Available Hours</div>
              <div className="text-sm text-gray-600">
                {customer.poc_available_hours || 'Not specified'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Best Arrival Times</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {customer.best_arrival_times?.map((time, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {time}
                  </Badge>
                )) || <span className="text-sm text-gray-500">Not specified</span>}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Backup Contact</div>
              <div className="text-sm text-gray-600">
                {customer.backup_contact || 'Not specified'}
              </div>
            </div>
          </div>
          {customer.access_approach && (
            <div>
              <div className="text-sm font-medium">Successful Access Approach</div>
              <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-md border border-green-200">
                {customer.access_approach}
              </div>
            </div>
          )}
          {customer.common_access_issues && customer.common_access_issues.length > 0 && (
            <div>
              <div className="text-sm font-medium flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Common Access Issues
              </div>
              <div className="space-y-1">
                {customer.common_access_issues.map((issue, index) => (
                  <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    {issue}
                  </div>
                ))}
              </div>
            </div>
          )}
          {customer.scheduling_notes && (
            <div>
              <div className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Scheduling Notes
              </div>
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md border border-blue-200">
                {customer.scheduling_notes}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Project Status Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <FileText className="h-4 w-4" />
            Project Status
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium">Completion Status</div>
              <Badge variant="outline">
                {customer.completion_status || 'Unknown'}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium">Documentation Score</div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold">
                  {customer.documentation_score || 0}%
                </div>
                {(customer.documentation_score || 0) >= 80 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
              </div>
            </div>
          </div>
          {customer.commissioning_notes && (
            <div>
              <div className="text-sm font-medium">Commissioning Notes</div>
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md border border-blue-200">
                {customer.commissioning_notes}
              </div>
            </div>
          )}
          {customer.known_issues && customer.known_issues.length > 0 && (
            <div>
              <div className="text-sm font-medium flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Known Issues
              </div>
              <div className="space-y-1">
                {customer.known_issues.map((issue, index) => (
                  <div key={index} className="text-sm text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                    {issue}
                  </div>
                ))}
              </div>
            </div>
          )}
          {customer.original_team_contact && (
            <div>
              <div className="text-sm font-medium flex items-center gap-1">
                <User className="h-4 w-4" />
                Original Team Contact
              </div>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-200">
                <div><strong>{customer.original_team_contact}</strong> - {customer.original_team_role}</div>
                <div>{customer.original_team_info}</div>
                {customer.when_to_contact_original && (
                  <div className="mt-2 text-xs text-blue-600">
                    When to contact: {customer.when_to_contact_original}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Intelligent Tool Recommendations */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Wrench className="h-4 w-4" />
            Intelligent Tool Recommendations
          </div>
          <div className="space-y-2">
            {toolRecommendations.map((tool, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                <Badge className={getPriorityColor(tool.priority)} variant="outline">
                  {tool.priority}
                </Badge>
                <div className="flex-1">
                  <div className="font-medium text-sm">{tool.toolName}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    <span className="font-medium">{tool.category}:</span> {tool.reason}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Job Number History */}
        {customer.last_job_numbers && customer.last_job_numbers.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">Recent Job Numbers</div>
            <div className="flex flex-wrap gap-2">
              {customer.last_job_numbers.map((jobNumber, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {jobNumber}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedSiteIntelligenceCard;
