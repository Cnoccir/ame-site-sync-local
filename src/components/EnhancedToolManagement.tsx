import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Package, Wrench, AlertTriangle, Info, Sparkles, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { generateToolRecommendationsFromCustomer } from '@/services/toolLibraryService';
import { Customer, ToolRecommendation } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface EnhancedToolManagementProps {
  customer: Customer;
  onToolSelectionChange?: (selectedTools: string[]) => void;
}

export const EnhancedToolManagement = ({ customer, onToolSelectionChange }: EnhancedToolManagementProps) => {
  const [recommendations, setRecommendations] = useState<ToolRecommendation[]>([]);
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['essential', 'recommended']));
  const [showFullList, setShowFullList] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRecommendations();
  }, [customer]);

  useEffect(() => {
    onToolSelectionChange?.(Array.from(selectedTools));
  }, [selectedTools, onToolSelectionChange]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const toolRecs = await generateToolRecommendationsFromCustomer(customer);
      setRecommendations(toolRecs);
      
      // Pre-select tools that are marked as pre-selected
      const preSelected = new Set(
        toolRecs
          .filter(tool => tool.isPreSelected)
          .map(tool => tool.toolId)
      );
      setSelectedTools(preSelected);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading tool recommendations:', error);
      toast({
        title: 'Error Loading Tools',
        description: 'Failed to generate tool recommendations.',
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

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getToolsByPriority = (priority: 'essential' | 'recommended' | 'optional') => {
    return recommendations.filter(tool => tool.priority === priority);
  };

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case 'required_for_system':
        return <Badge variant="destructive" className="text-xs">System Required</Badge>;
      case 'service_tier':
        return <Badge variant="default" className="text-xs">Tier Required</Badge>;
      case 'site_specific':
        return <Badge variant="secondary" className="text-xs">Site Specific</Badge>;
      case 'common_issue':
        return <Badge variant="outline" className="text-xs">Common Need</Badge>;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'essential':
        return 'text-red-600';
      case 'recommended':
        return 'text-orange-600';
      case 'optional':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tool Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Generating intelligent tool recommendations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const essentialTools = getToolsByPriority('essential');
  const recommendedTools = getToolsByPriority('recommended');
  const optionalTools = getToolsByPriority('optional');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span>Intelligent Tool Recommendations</span>
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </div>
          {!showFullList && (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => setShowFullList(true)}
            >
              Show All Tools
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tool Statistics */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Badge variant="destructive">{essentialTools.length}</Badge>
            <span className="text-muted-foreground">Essential</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary">{recommendedTools.length}</Badge>
            <span className="text-muted-foreground">Recommended</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline">{optionalTools.length}</Badge>
            <span className="text-muted-foreground">Optional</span>
          </div>
        </div>

        {/* Essential Tools */}
        {essentialTools.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Essential Tools
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleCategory('essential')}
                className="h-8 w-8 p-0"
              >
                {expandedCategories.has('essential') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
            {expandedCategories.has('essential') && (
              <div className="space-y-2">
                {essentialTools.map((tool) => (
                  <div key={tool.toolId} className="flex items-start gap-3 p-2 rounded-lg border hover:bg-muted/50">
                    <Checkbox
                      id={tool.toolId}
                      checked={selectedTools.has(tool.toolId)}
                      onCheckedChange={() => toggleToolSelection(tool.toolId)}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <label htmlFor={tool.toolId} className="text-sm font-medium cursor-pointer">
                          {tool.toolName}
                        </label>
                        {getReasonBadge(tool.reason)}
                      </div>
                      <p className="text-xs text-muted-foreground">{tool.reasoning}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recommended Tools */}
        {recommendedTools.length > 0 && (showFullList || !essentialTools.length) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-600" />
                Recommended Tools
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleCategory('recommended')}
                className="h-8 w-8 p-0"
              >
                {expandedCategories.has('recommended') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
            {expandedCategories.has('recommended') && (
              <div className="space-y-2">
                {recommendedTools.map((tool) => (
                  <div key={tool.toolId} className="flex items-start gap-3 p-2 rounded-lg border hover:bg-muted/50">
                    <Checkbox
                      id={tool.toolId}
                      checked={selectedTools.has(tool.toolId)}
                      onCheckedChange={() => toggleToolSelection(tool.toolId)}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <label htmlFor={tool.toolId} className="text-sm font-medium cursor-pointer">
                          {tool.toolName}
                        </label>
                        {getReasonBadge(tool.reason)}
                      </div>
                      <p className="text-xs text-muted-foreground">{tool.reasoning}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Optional Tools */}
        {showFullList && optionalTools.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-600" />
                Optional Tools
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleCategory('optional')}
                className="h-8 w-8 p-0"
              >
                {expandedCategories.has('optional') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
            {expandedCategories.has('optional') && (
              <div className="space-y-2">
                {optionalTools.map((tool) => (
                  <div key={tool.toolId} className="flex items-start gap-3 p-2 rounded-lg border hover:bg-muted/50">
                    <Checkbox
                      id={tool.toolId}
                      checked={selectedTools.has(tool.toolId)}
                      onCheckedChange={() => toggleToolSelection(tool.toolId)}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <label htmlFor={tool.toolId} className="text-sm font-medium cursor-pointer">
                          {tool.toolName}
                        </label>
                        {getReasonBadge(tool.reason)}
                      </div>
                      <p className="text-xs text-muted-foreground">{tool.reasoning}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Tools Summary */}
        {selectedTools.size > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium">{selectedTools.size} tools selected</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
