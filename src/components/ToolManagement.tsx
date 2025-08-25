import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Package, Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Tool {
  id: string;
  tool_id: string;
  tool_name: string;
  category_id: string;
  description?: string;
  status: string;
  safety_category: string;
  current_stock: number;
  minimum_stock: number;
}

interface ToolCategory {
  id: string;
  category_name: string;
  description: string;
  is_essential: boolean;
}

interface ToolManagementProps {
  onToolSelectionChange?: (selectedTools: string[]) => void;
}

export const ToolManagement = ({ onToolSelectionChange }: ToolManagementProps) => {
  const [categories, setCategories] = useState<ToolCategory[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showFullList, setShowFullList] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadToolsAndCategories();
  }, []);

  useEffect(() => {
    onToolSelectionChange?.(Array.from(selectedTools));
  }, [selectedTools, onToolSelectionChange]);

  const loadToolsAndCategories = async () => {
    try {
      // Load tools and categories
      const [toolsResult, categoriesResult] = await Promise.all([
        supabase
          .from('ame_tools_normalized')
          .select('id, tool_id, tool_name, category_id, description, status, safety_category, current_stock, minimum_stock')
          .eq('status', 'active')
          .order('tool_name'),
        supabase
          .from('ame_tool_categories')
          .select('id, category_name, description, is_essential')
          .order('category_name')
      ]);

      if (toolsResult.error) throw toolsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      setTools(toolsResult.data || []);
      setCategories(categoriesResult.data || []);

      // Auto-expand essential categories
      const essentialCategoryIds = (categoriesResult.data || [])
        .filter(cat => cat.is_essential)
        .map(cat => cat.id);
      setExpandedCategories(new Set(essentialCategoryIds));

      setLoading(false);
    } catch (error) {
      console.error('Error loading tools:', error);
      toast({
        title: 'Error Loading Tools',
        description: 'Failed to load tool information.',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const toggleToolSelection = (toolId: string) => {
    const newSelected = new Set(selectedTools);
    if (newSelected.has(toolId)) {
      newSelected.delete(toolId);
    } else {
      newSelected.add(toolId);
    }
    setSelectedTools(newSelected);
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getToolsByCategory = (categoryId: string) => {
    return tools.filter(tool => tool.category_id === categoryId);
  };

  const getToolStats = () => {
    const allTools = tools.length;
    const requiredTools = tools.filter(tool => tool.safety_category === 'site_required').length;
    const recommendedTools = tools.filter(tool => tool.safety_category === 'recommended').length;
    const optionalTools = tools.filter(tool => tool.safety_category === 'standard').length;
    
    return {
      total: allTools,
      required: requiredTools,
      recommended: recommendedTools,
      optional: optionalTools
    };
  };

  const getRequiredTools = () => {
    return tools.filter(tool => tool.safety_category === 'site_required');
  };

  const stats = getToolStats();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Tool Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading tools...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Tools & Equipment</span>
          </div>
          <Button variant="default" size="sm">
            Generate Full Recommended List
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showFullList && (
          <div>
            <h4 className="text-sm text-muted-foreground mb-3">Essential Tools (Default)</h4>
            <div className="space-y-3">
              {getRequiredTools().map((tool) => (
                <div key={tool.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={tool.id}
                      checked={selectedTools.has(tool.id)}
                      onCheckedChange={() => toggleToolSelection(tool.id)}
                    />
                    <label htmlFor={tool.id} className="text-sm font-medium cursor-pointer">
                      {tool.tool_name}
                    </label>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    REQUIRED
                  </Badge>
                </div>
              ))}
              
              {tools.filter(tool => tool.safety_category === 'recommended').slice(0, 2).map((tool) => (
                <div key={tool.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={tool.id}
                      checked={selectedTools.has(tool.id)}
                      onCheckedChange={() => toggleToolSelection(tool.id)}
                    />
                    <label htmlFor={tool.id} className="text-sm font-medium cursor-pointer">
                      {tool.tool_name}
                    </label>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    OPTIONAL
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {showFullList && (
          <div className="space-y-4">
            {/* Statistics Section */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">TOTAL TOOLS</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.required}</div>
                <div className="text-xs text-muted-foreground">REQUIRED</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.recommended}</div>
                <div className="text-xs text-muted-foreground">RECOMMENDED</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.optional}</div>
                <div className="text-xs text-muted-foreground">OPTIONAL</div>
              </div>
            </div>

            {/* Categories Section */}
            <div className="space-y-3">
              {categories.map((category) => {
                const categoryTools = getToolsByCategory(category.id);
                const isExpanded = expandedCategories.has(category.id);
                
                if (categoryTools.length === 0) return null;
                
                return (
                  <Collapsible
                    key={category.id}
                    open={isExpanded}
                    onOpenChange={() => toggleCategory(category.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-3 h-auto border border-border rounded-lg hover:bg-muted"
                      >
                        <div className="flex items-center space-x-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <span className="font-medium">{category.category_name}</span>
                          <span className="text-sm text-muted-foreground">({categoryTools.length} Tools)</span>
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="pl-6 space-y-2">
                        {categoryTools.map((tool) => (
                          <div key={tool.id} className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id={`full-${tool.id}`}
                                checked={selectedTools.has(tool.id)}
                                onCheckedChange={() => toggleToolSelection(tool.id)}
                              />
                              <label htmlFor={`full-${tool.id}`} className="text-sm font-medium cursor-pointer">
                                {tool.tool_name}
                              </label>
                            </div>
                            <Badge 
                              variant={tool.safety_category === 'site_required' ? 'destructive' : 
                                     tool.safety_category === 'recommended' ? 'default' : 'outline'} 
                              className="text-xs"
                            >
                              {tool.safety_category === 'site_required' ? 'REQUIRED' : 
                               tool.safety_category === 'recommended' ? 'RECOMMENDED' : 'OPTIONAL'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => setShowFullList(!showFullList)}
            className="w-full"
          >
            {showFullList ? 'Show Essential Tools Only' : 'Generate Full Recommended List'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};