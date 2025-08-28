import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Building2, Users, MapPin, Tool, Phone, Clipboard, Edit2, Save, History, Computer } from 'lucide-react';
import { Customer, SiteContext, TechnicianInfo } from '@/types';
import { SiteIntelligenceService } from '@/services/siteIntelligenceService';
import SiteIntelligenceEditor from './SiteIntelligenceEditor';

interface Props {
  customer: Customer;
  onUpdate?: (updatedCustomer: Customer) => void;
  readOnly?: boolean;
}

export function EnhancedCustomerInfoCard({ customer, onUpdate, readOnly = false }: Props) {
  const [siteContext, setSiteContext] = useState<SiteContext | null>(null);
  const [technicians, setTechnicians] = useState<TechnicianInfo[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState({
    site_nickname: customer.site_nickname || '',
    system_platform: customer.system_platform || '',
    primary_technician_id: customer.primary_technician_id || '',
    secondary_technician_id: customer.secondary_technician_id || '',
  });

  // Fetch site context and technicians on initial load
  useEffect(() => {
    const fetchSiteContext = async () => {
      if (customer.id) {
        const context = await SiteIntelligenceService.getSiteContext(customer.id);
        setSiteContext(context);
      }
    };

    const fetchTechnicians = async () => {
      const availableTechs = await SiteIntelligenceService.getAvailableTechnicians();
      setTechnicians(availableTechs);
    };

    fetchSiteContext();
    fetchTechnicians();
  }, [customer.id]);

  // Create a site number if none exists
  useEffect(() => {
    const ensureSiteNumber = async () => {
      if (customer.id && (!customer.site_number || customer.site_number.trim() === '') && !readOnly) {
        try {
          await SiteIntelligenceService.ensureSiteIntelligence(customer.id);
          // Refresh site context after ensuring site intelligence
          const context = await SiteIntelligenceService.getSiteContext(customer.id);
          setSiteContext(context);
        } catch (error) {
          console.error('Failed to ensure site number:', error);
        }
      }
    };

    ensureSiteNumber();
  }, [customer.id, customer.site_number, readOnly]);

  const handleEditSubmit = async () => {
    setIsPending(true);
    
    try {
      await SiteIntelligenceService.updateSiteIntelligence(customer.id, {
        site_nickname: editData.site_nickname,
        system_platform: editData.system_platform,
        primary_technician_id: editData.primary_technician_id || null,
        secondary_technician_id: editData.secondary_technician_id || null,
      });
      
      // Refresh site context
      const context = await SiteIntelligenceService.getSiteContext(customer.id);
      setSiteContext(context);
      
      // Update parent component if callback provided
      if (onUpdate) {
        onUpdate({
          ...customer,
          site_nickname: editData.site_nickname,
          system_platform: editData.system_platform,
          primary_technician_id: editData.primary_technician_id,
          secondary_technician_id: editData.secondary_technician_id,
        });
      }
      
      setShowEditDialog(false);
    } catch (error) {
      console.error('Failed to update site intelligence:', error);
    } finally {
      setIsPending(false);
    }
  };

  const getServiceTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'GUARDIAN': return 'default';
      case 'ASSURE': return 'secondary';
      default: return 'outline';
    }
  };

  const getSystemPlatformBadgeVariant = (platform: string) => {
    switch (platform) {
      case 'N4': return 'default';
      case 'FX': return 'secondary';
      case 'WEBs': return 'destructive';
      case 'Mixed-ALC': return 'outline';
      default: return 'outline';
    }
  };

  const renderTechnicianInfo = (techName?: string, role: string = 'Technician') => {
    if (!techName) return <span className="text-muted-foreground">Not assigned</span>;
    
    return (
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{techName.split(' ').map(n => n[0]).join('').toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{techName}</div>
          <div className="text-xs text-muted-foreground">{role}</div>
        </div>
      </div>
    );
  };

  const openFullEditor = () => {
    setShowEditDialog(true);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
        <CardTitle className="text-xl">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {customer.site_nickname || customer.company_name}
          </div>
        </CardTitle>
        {!readOnly && (
          <Button variant="ghost" size="sm" onClick={() => openFullEditor()}>
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        <div className="mb-3">
          <div className="flex flex-wrap gap-2 mb-2">
            {customer.site_number && (
              <Badge variant="secondary" className="font-mono">
                {customer.site_number}
              </Badge>
            )}
            <Badge variant={getServiceTierBadgeVariant(customer.service_tier)}>
              {customer.service_tier}
            </Badge>
            {siteContext?.systemPlatform && (
              <Badge variant={getSystemPlatformBadgeVariant(siteContext.systemPlatform)}>
                <Computer className="h-3 w-3 mr-1" />
                {siteContext.systemPlatform}
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-600">
            {customer.company_name}
          </div>
        </div>
        
        <Tabs defaultValue="site" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="site" className="text-xs">
              <Building2 className="h-3 w-3 mr-1" />
              Site
            </TabsTrigger>
            <TabsTrigger value="team" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              Team
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs">
              <History className="h-3 w-3 mr-1" />
              History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="site" className="pt-3">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-sm">
                  {customer.site_address || 'No address on record'}
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Computer className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium">System: </span>
                  {siteContext?.systemPlatform || customer.system_platform || customer.system_type || 'Unknown'}
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Tool className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium">Building Type: </span>
                  {customer.building_type || 'Not specified'}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="team" className="pt-3">
            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium mb-1 text-muted-foreground">PRIMARY TECHNICIAN</div>
                {renderTechnicianInfo(siteContext?.primaryTech, 'Primary')}
              </div>
              
              <div>
                <div className="text-xs font-medium mb-1 text-muted-foreground">SECONDARY TECHNICIAN</div>
                {renderTechnicianInfo(siteContext?.secondaryTech, 'Secondary')}
              </div>
              
              {siteContext?.lastVisit && (
                <div>
                  <div className="text-xs font-medium mb-1 text-muted-foreground">LAST VISIT</div>
                  <div className="text-sm flex flex-col gap-1">
                    <div>{siteContext.lastVisit.technicianName}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(siteContext.lastVisit.date).toLocaleDateString()} - Phase {siteContext.lastVisit.phase}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="pt-3">
            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium mb-1 text-muted-foreground">JOB NUMBER HISTORY</div>
                {siteContext?.jobNumberHistory && siteContext.jobNumberHistory.length > 0 ? (
                  <div className="text-sm space-y-1">
                    {siteContext.jobNumberHistory.map((jobNumber, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {jobNumber}
                        </Badge>
                        {index === 0 && <span className="text-xs text-muted-foreground">Current</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No job numbers recorded</div>
                )}
              </div>
              
              <div>
                <div className="text-xs font-medium mb-1 text-muted-foreground">CONTACT HISTORY</div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">{customer.primary_contact || customer.contact_phone || 'No contact information'}</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Site Intelligence</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="site_nickname">Site Nickname</Label>
              <Input
                id="site_nickname"
                value={editData.site_nickname}
                onChange={(e) => setEditData({...editData, site_nickname: e.target.value})}
                placeholder="Quick reference name"
              />
              <p className="text-xs text-muted-foreground">A short name for quick site reference</p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="system_platform">System Platform</Label>
              <Select 
                value={editData.system_platform} 
                onValueChange={(value) => setEditData({...editData, system_platform: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="N4">Niagara N4</SelectItem>
                  <SelectItem value="FX">Facility Explorer (FX)</SelectItem>
                  <SelectItem value="WEBs">Honeywell WEBs</SelectItem>
                  <SelectItem value="Mixed-ALC">Mixed ALC Systems</SelectItem>
                  <SelectItem value="EBI-Honeywell">EBI Honeywell</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            <div className="grid gap-2">
              <Label htmlFor="primary_tech">Primary Technician</Label>
              <Select 
                value={editData.primary_technician_id} 
                onValueChange={(value) => setEditData({...editData, primary_technician_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign primary technician" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="secondary_tech">Secondary Technician</Label>
              <Select 
                value={editData.secondary_technician_id} 
                onValueChange={(value) => setEditData({...editData, secondary_technician_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assign secondary technician" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {technicians
                    .filter(tech => tech.id !== editData.primary_technician_id)
                    .map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Backup technician familiar with this site</p>
            </div>
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditSubmit} 
              disabled={isPending}
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
