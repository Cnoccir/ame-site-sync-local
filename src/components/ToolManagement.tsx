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
  category: string;
  is_essential: boolean;
  is_required: boolean;
  is_safety: boolean;
  notes?: string;
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
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('ame_tool_categories')
        .select('*')
        .order('category_name');

      if (categoriesError) throw categoriesError;

      // Load tools
      const { data: toolsData, error: toolsError } = await supabase
        .from('ame_tools')
        .select('*')
        .order('tool_name');

      if (toolsError) throw toolsError;

      setCategories(categoriesData || []);
      setTools(toolsData || []);

      // Auto-expand essential categories
      const essentialCategories = categoriesData?.filter(cat => cat.is_essential).map(cat => cat.id) || [];
      setExpandedCategories(new Set(essentialCategories));

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

  const getToolsByCategory = (categoryName: string) => {
    return tools.filter(tool => tool.category === categoryName);
  };

  const getToolStats = () => {
    const selectedToolsArray = Array.from(selectedTools);
    const selectedToolObjects = tools.filter(tool => selectedToolsArray.includes(tool.id));
    return {
      total: selectedToolsArray.length,
      required: selectedToolObjects.filter(tool => tool.is_required).length,
      safety: selectedToolObjects.filter(tool => tool.is_safety).length
    };
  };

  const essentialTools = tools.filter(tool => tool.is_essential);
  const displayedCategories = showFullList ? categories : categories.filter(cat => cat.is_essential);
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
            <span>Tool Management</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Badge variant="outline">{stats.total} selected</Badge>
            {stats.required > 0 && (
              <Badge variant="destructive">{stats.required} required</Badge>
            )}
            {stats.safety > 0 && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                <Shield className="w-3 h-3 mr-1" />
                {stats.safety} safety
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showFullList && (
          <div>
            <h4 className="font-medium text-foreground mb-3">Essential Tools</h4>
            <div className="space-y-2">
              {essentialTools.map((tool) => (
                <div key={tool.id} className="flex items-center space-x-3 p-2 rounded border border-border">
                  <Checkbox
                    id={tool.id}
                    checked={selectedTools.has(tool.id)}
                    onCheckedChange={() => toggleToolSelection(tool.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <label htmlFor={tool.id} className="text-sm font-medium cursor-pointer">
                        {tool.tool_name}
                      </label>
                      {tool.is_required && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                      {tool.is_safety && (
                        <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                          <Shield className="w-3 h-3 mr-1" />
                          Safety
                        </Badge>
                      )}
                    </div>
                    {tool.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{tool.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showFullList && (
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">All Tool Categories</h4>
            {displayedCategories.map((category) => {
              const categoryTools = getToolsByCategory(category.category_name);
              const isExpanded = expandedCategories.has(category.id);
              
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
                        <Badge variant="outline">{categoryTools.length} tools</Badge>
                        {category.is_essential && (
                          <Badge variant="default" className="bg-green-100 text-green-800">Essential</Badge>
                        )}
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="pl-6 space-y-2">
                      {categoryTools.map((tool) => (
                        <div key={tool.id} className="flex items-center space-x-3 p-2 rounded border border-border">
                          <Checkbox
                            id={tool.id}
                            checked={selectedTools.has(tool.id)}
                            onCheckedChange={() => toggleToolSelection(tool.id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <label htmlFor={tool.id} className="text-sm font-medium cursor-pointer">
                                {tool.tool_name}
                              </label>
                              {tool.is_required && (
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              )}
                              {tool.is_safety && (
                                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Safety
                                </Badge>
                              )}
                            </div>
                            {tool.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{tool.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
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