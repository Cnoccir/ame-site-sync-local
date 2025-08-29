import { useState, useEffect } from 'react';
import { Search, Image as ImageIcon, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { SOPImageUpload } from './SOPImageUpload';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface SOP {
  id: string;
  sop_id: string;
  sop_name: string;
  category: string;
  system_type?: string;
}

export const SOPImageManager = () => {
  const [sops, setSops] = useState<SOP[]>([]);
  const [filteredSops, setFilteredSops] = useState<SOP[]>([]);
  const [selectedSop, setSelectedSop] = useState<SOP | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user is admin
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      setIsAdmin(userRole?.role === 'admin');
    };

    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    fetchSOPs();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredSops(
        sops.filter(sop => 
          sop.sop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sop.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sop.sop_id.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredSops(sops);
    }
  }, [searchQuery, sops]);

  const fetchSOPs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ame_sops')
        .select('id, sop_id, sop_name, category, system_type')
        .order('sop_name');

      if (error) throw error;
      
      setSops(data || []);
      setFilteredSops(data || []);
    } catch (error) {
      console.error('Error fetching SOPs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load SOPs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpdated = async (sopId: string, stepNumber: number, imageUrl: string | null) => {
    // For now, just show a success message since step_images isn't implemented yet
    toast({
      title: 'Image Updated',
      description: `Step ${stepNumber} image has been processed for SOP ${sopId}`,
    });
  };

  const getImageCount = (sop: SOP) => {
    // Placeholder - will be implemented when step_images column is added
    return 0;
  };

  const getStepCount = (sop: SOP) => {
    // Placeholder - return a default count for demo
    return 5;
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Settings className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
          <p className="text-muted-foreground">
            Only administrators can manage SOP images.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Loading SOPs...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">SOP Image Management</h2>
        <p className="text-muted-foreground">
          Upload and manage visual guides for Standard Operating Procedures
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>SOPs Library</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search SOPs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedSop ? 'edit' : 'list'} className="space-y-4">
            <TabsList>
              <TabsTrigger value="list">SOP List</TabsTrigger>
              {selectedSop && (
                <TabsTrigger value="edit">
                  Editing: {selectedSop.sop_name}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <div className="grid gap-4">
                {filteredSops.map((sop) => (
                  <Card 
                    key={sop.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedSop(sop)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold">{sop.sop_name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{sop.category}</Badge>
                            <Badge variant="secondary">
                              {getStepCount(sop)} steps
                            </Badge>
                            <Badge variant={getImageCount(sop) > 0 ? "default" : "secondary"}>
                              <ImageIcon className="w-3 h-3 mr-1" />
                              {getImageCount(sop)} images
                            </Badge>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Manage Images
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredSops.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No SOPs found</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {selectedSop && (
              <TabsContent value="edit" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedSop.sop_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage visual guides for each step
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedSop(null)}
                  >
                    Back to List
                  </Button>
                </div>

                <div className="grid gap-6">
                  {Array.from({ length: getStepCount(selectedSop) }, (_, i) => i + 1).map((stepNumber) => (
                    <SOPImageUpload
                      key={stepNumber}
                      sopId={selectedSop.sop_id}
                      stepNumber={stepNumber}
                      currentImageUrl={undefined}
                      onImageUpdated={(imageUrl) => handleImageUpdated(selectedSop.sop_id, stepNumber, imageUrl)}
                    />
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};