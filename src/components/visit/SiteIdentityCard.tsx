import { useState, useEffect } from 'react';
import { Edit2, Building2, Settings, Calendar, User, MapPin, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Customer, TeamContext } from '@/types';
import { ServiceTierBadge } from '@/components/ui/service-tier-badge';

interface SiteIdentityCardProps {
  customer: Customer;
  siteNickname: string;
  siteNumber: string;
  systemType: 'N4' | 'FX' | 'Mixed-ALC' | 'EBI-Honeywell' | 'Other';
  teamContext?: TeamContext;
  onSiteDetailsUpdate: (updates: {
    nickname: string;
    siteNumber: string;
    systemType: 'N4' | 'FX' | 'Mixed-ALC' | 'EBI-Honeywell' | 'Other';
  }) => void;
}

export const SiteIdentityCard = ({
  customer,
  siteNickname,
  siteNumber,
  systemType,
  teamContext,
  onSiteDetailsUpdate
}: SiteIdentityCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    nickname: siteNickname,
    siteNumber: siteNumber,
    systemType: systemType
  });

  const handleSave = () => {
    onSiteDetailsUpdate(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      nickname: siteNickname,
      siteNumber: siteNumber,
      systemType: systemType
    });
    setIsEditing(false);
  };

  const getSystemTypeDisplay = (type: string) => {
    switch (type) {
      case 'N4': return 'Niagara N4';
      case 'FX': return 'Niagara FX';
      case 'Mixed-ALC': return 'Mixed ALC';
      case 'EBI-Honeywell': return 'EBI/Honeywell';
      case 'Other': return 'Other System';
      default: return type;
    }
  };

  const getSystemTypeIcon = (type: string) => {
    switch (type) {
      case 'N4':
      case 'FX':
        return '🔧'; // Wrench for Niagara systems
      case 'Mixed-ALC':
        return '⚡'; // Lightning for mixed systems
      case 'EBI-Honeywell':
        return '🏢'; // Building for enterprise systems
      default:
        return '🔲'; // Generic square for other
    }
  };

  const getSiteExperienceColor = (experience: string) => {
    switch (experience) {
      case 'expert': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'familiar': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'first_time': return 'bg-orange-500/10 text-orange-700 border-orange-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card className="w-full bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
              {getSystemTypeIcon(systemType)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {siteNickname || customer.site_name}
                </h1>
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Site Identity</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="nickname">Site Nickname</Label>
                        <Input
                          id="nickname"
                          value={editData.nickname}
                          onChange={(e) => setEditData(prev => ({ ...prev, nickname: e.target.value }))}
                          placeholder="Enter memorable site nickname..."
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          A memorable name that helps identify this site (e.g., "The School Building", "Main Campus")
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="siteNumber">Site Number</Label>
                        <Input
                          id="siteNumber"
                          value={editData.siteNumber}
                          onChange={(e) => setEditData(prev => ({ ...prev, siteNumber: e.target.value }))}
                          placeholder="Persistent site identifier..."
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Unique site number that stays consistent across contracts
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="systemType">System Type</Label>
                        <Select 
                          value={editData.systemType} 
                          onValueChange={(value: any) => setEditData(prev => ({ ...prev, systemType: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="N4">Niagara N4</SelectItem>
                            <SelectItem value="FX">Niagara FX</SelectItem>
                            <SelectItem value="Mixed-ALC">Mixed ALC</SelectItem>
                            <SelectItem value="EBI-Honeywell">EBI/Honeywell</SelectItem>
                            <SelectItem value="Other">Other System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={handleCancel}>
                          Cancel
                        </Button>
                        <Button onClick={handleSave}>
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <p className="text-sm text-muted-foreground">{customer.company_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ServiceTierBadge tier={customer.service_tier} size="md" />
            <Badge variant="outline" className="font-mono text-xs">
              #{siteNumber || customer.customer_id}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Site Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Site Details</span>
            </div>
            <div className="space-y-2 pl-6">
              <div>
                <p className="text-xs text-muted-foreground">System Type</p>
                <p className="text-sm font-medium">{getSystemTypeDisplay(systemType)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <p className="text-sm">{customer.site_address}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Building Type</p>
                <p className="text-sm">{customer.building_type || 'Not specified'}</p>
              </div>
            </div>
          </div>

          {/* Team Assignment */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Team Assignment</span>
            </div>
            {teamContext ? (
              <div className="space-y-2 pl-6">
                <div>
                  <p className="text-xs text-muted-foreground">Primary Tech</p>
                  <p className="text-sm font-medium">{teamContext.primaryTechnician.name}</p>
                </div>
                {teamContext.secondaryTechnician && (
                  <div>
                    <p className="text-xs text-muted-foreground">Secondary Tech</p>
                    <p className="text-sm">{teamContext.secondaryTechnician.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Site Experience</p>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getSiteExperienceColor(teamContext.siteExperience)}`}
                  >
                    {teamContext.siteExperience.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="pl-6">
                <p className="text-sm text-muted-foreground">Team information loading...</p>
              </div>
            )}
          </div>

          {/* Service History */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Service History</span>
            </div>
            <div className="space-y-2 pl-6">
              <div>
                <p className="text-xs text-muted-foreground">Last Service</p>
                <p className="text-sm">{customer.last_service || 'Not available'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Next Due</p>
                <p className="text-sm font-medium">{customer.next_due || 'Not scheduled'}</p>
              </div>
              {teamContext?.lastVisit && (
                <div>
                  <p className="text-xs text-muted-foreground">Last Technician</p>
                  <p className="text-sm">{teamContext.lastVisit.technicianName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(teamContext.lastVisit.date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Project Folder Link */}
        {customer.drive_folder_url && (
          <div className="mt-4 pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => window.open(customer.drive_folder_url, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Project Folder
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
