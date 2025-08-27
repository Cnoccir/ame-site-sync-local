import { useState, useEffect } from 'react';
import { 
  Wrench, 
  Lightbulb, 
  Star, 
  CheckCircle,
  AlertCircle,
  Info,
  TrendingUp,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ToolRecommendation } from '@/types';

interface SmartToolRecommendationsProps {
  systemType: 'N4' | 'FX' | 'Mixed-ALC' | 'EBI-Honeywell' | 'Other';
  serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  selectedTools: string[];
  onToolSelectionChange: (selectedTools: string[]) => void;
  recommendations: ToolRecommendation[];
  showFullList: boolean;
  onShowFullListChange: (show: boolean) => void;
}

export const SmartToolRecommendations = ({
  systemType,
  serviceTier,
  selectedTools,
  onToolSelectionChange,
  recommendations,
  showFullList,
  onShowFullListChange
}: SmartToolRecommendationsProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['essential']));

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'essential': return <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />;
      case 'recommended': return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'optional': return <Info className="w-4 h-4 text-gray-500" />;
      default: return <Wrench className="w-4 h-4" />;
    }
  };

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'required_for_system': return <Zap className="w-3 h-3 text-purple-500" />;
      case 'service_tier': return <Star className="w-3 h-3 text-blue-500" />;
      case 'common_issue': return <AlertCircle className="w-3 h-3 text-orange-500" />;
      case 'site_specific': return <Info className="w-3 h-3 text-green-500" />;
      default: return <Wrench className="w-3 h-3" />;
    }
  };

  const getReasonDisplay = (reason: string) => {
    switch (reason) {
      case 'required_for_system': return 'System Required';
      case 'service_tier': return 'Service Tier';
      case 'common_issue': return 'Common Issue';
      case 'site_specific': return 'Site Specific';
      default: return reason;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'essential': return 'border-yellow-200 bg-yellow-50';
      case 'recommended': return 'border-blue-200 bg-blue-50';
      case 'optional': return 'border-gray-200 bg-gray-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  const toggleToolSelection = (toolId: string) => {
    const newSelected = [...selectedTools];
    const index = newSelected.indexOf(toolId);
    
    if (index >= 0) {
      newSelected.splice(index, 1);
    } else {
      newSelected.push(toolId);
    }
    
    onToolSelectionChange(newSelected);
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

  const groupedRecommendations = recommendations.reduce((groups, tool) => {
    if (!groups[tool.priority]) {
      groups[tool.priority] = [];
    }
    groups[tool.priority].push(tool);
    return groups;
  }, {} as Record<string, ToolRecommendation[]>);

  const essentialTools = groupedRecommendations.essential || [];
  const recommendedTools = groupedRecommendations.recommended || [];
  const optionalTools = groupedRecommendations.optional || [];
  
  const preSelectedCount = recommendations.filter(r => r.isPreSelected).length;
  const totalSelected = selectedTools.length;
  
  const getSystemTypeDisplay = () => {
    switch (systemType) {
      case 'N4': return 'Niagara N4';
      case 'FX': return 'Niagara FX';
      case 'Mixed-ALC': return 'Mixed ALC Systems';
      case 'EBI-Honeywell': return 'EBI/Honeywell Systems';
      case 'Other': return 'Other Systems';
      default: return systemType;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Smart Tool Recommendations
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {totalSelected} Selected
            </Badge>
            {preSelectedCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {preSelectedCount} Pre-Selected
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Context Information */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Recommendations Context</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="font-medium text-blue-800">System Type: </span>
              <span className="text-blue-700">{getSystemTypeDisplay()}</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Service Tier: </span>
              <span className="text-blue-700">{serviceTier}</span>
            </div>
          </div>
        </div>

        {!showFullList ? (
          /* Essential & Quick Selection View */
          <div className="space-y-4">
            {/* Essential Tools */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  Essential Tools ({essentialTools.length})
                </h4>
              </div>
              
              {essentialTools.map((tool) => (
                <div 
                  key={tool.toolId} 
                  className={`p-3 border rounded-lg ${getPriorityColor(tool.priority)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={tool.toolId}
                        checked={selectedTools.includes(tool.toolId) || tool.isPreSelected}
                        onCheckedChange={() => toggleToolSelection(tool.toolId)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <label htmlFor={tool.toolId} className="text-sm font-medium cursor-pointer">
                            {tool.toolName}
                          </label>
                          {tool.isPreSelected && (
                            <Badge variant="secondary" className="text-xs">
                              Pre-selected
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1">
                            {getReasonIcon(tool.reason)}
                            <span className="text-xs text-muted-foreground">
                              {getReasonDisplay(tool.reason)}
                            </span>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-muted-foreground cursor-help">
                                  Why recommended?
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>{tool.reasoning}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                    {getPriorityIcon(tool.priority)}
                  </div>
                </div>
              ))}
            </div>

            {/* Top Recommended Tools */}
            {recommendedTools.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Top Recommendations ({Math.min(recommendedTools.length, 3)})
                </h4>
                
                {recommendedTools.slice(0, 3).map((tool) => (
                  <div 
                    key={tool.toolId} 
                    className={`p-3 border rounded-lg ${getPriorityColor(tool.priority)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`rec-${tool.toolId}`}
                          checked={selectedTools.includes(tool.toolId) || tool.isPreSelected}
                          onCheckedChange={() => toggleToolSelection(tool.toolId)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <label htmlFor={`rec-${tool.toolId}`} className="text-sm font-medium cursor-pointer">
                              {tool.toolName}
                            </label>
                            {tool.isPreSelected && (
                              <Badge variant="secondary" className="text-xs">
                                Pre-selected
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1">
                              {getReasonIcon(tool.reason)}
                              <span className="text-xs text-muted-foreground">
                                {getReasonDisplay(tool.reason)}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {tool.reasoning}
                            </span>
                          </div>
                        </div>
                      </div>
                      {getPriorityIcon(tool.priority)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => onShowFullListChange(true)}
            >
              <Wrench className="w-4 h-4 mr-2" />
              View All Recommendations ({recommendations.length} tools)
            </Button>
          </div>
        ) : (
          /* Full Categorized View */
          <div className="space-y-4">
            {/* Essential Tools Section */}
            {essentialTools.length > 0 && (
              <Collapsible
                open={expandedCategories.has('essential')}
                onOpenChange={() => toggleCategory('essential')}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-3 h-auto border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">Essential Tools</span>
                      <Badge variant="destructive" className="text-xs">
                        {essentialTools.length} Required
                      </Badge>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2">
                  {essentialTools.map((tool) => (
                    <div key={tool.toolId} className={`p-3 border rounded-lg ${getPriorityColor(tool.priority)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`full-${tool.toolId}`}
                            checked={selectedTools.includes(tool.toolId) || tool.isPreSelected}
                            onCheckedChange={() => toggleToolSelection(tool.toolId)}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <label htmlFor={`full-${tool.toolId}`} className="text-sm font-medium cursor-pointer">
                                {tool.toolName}
                              </label>
                              {tool.isPreSelected && (
                                <Badge variant="secondary" className="text-xs">Pre-selected</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {getReasonIcon(tool.reason)}
                              <span className="text-xs text-muted-foreground">
                                {tool.reasoning}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="destructive" className="text-xs">ESSENTIAL</Badge>
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Recommended Tools Section */}
            {recommendedTools.length > 0 && (
              <Collapsible
                open={expandedCategories.has('recommended')}
                onOpenChange={() => toggleCategory('recommended')}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-3 h-auto border rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">Recommended Tools</span>
                      <Badge variant="default" className="text-xs">
                        {recommendedTools.length} Suggested
                      </Badge>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2">
                  {recommendedTools.map((tool) => (
                    <div key={tool.toolId} className={`p-3 border rounded-lg ${getPriorityColor(tool.priority)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`rec-full-${tool.toolId}`}
                            checked={selectedTools.includes(tool.toolId) || tool.isPreSelected}
                            onCheckedChange={() => toggleToolSelection(tool.toolId)}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <label htmlFor={`rec-full-${tool.toolId}`} className="text-sm font-medium cursor-pointer">
                                {tool.toolName}
                              </label>
                              {tool.isPreSelected && (
                                <Badge variant="secondary" className="text-xs">Pre-selected</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {getReasonIcon(tool.reason)}
                              <span className="text-xs text-muted-foreground">
                                {tool.reasoning}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="default" className="text-xs">RECOMMENDED</Badge>
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Optional Tools Section */}
            {optionalTools.length > 0 && (
              <Collapsible
                open={expandedCategories.has('optional')}
                onOpenChange={() => toggleCategory('optional')}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-3 h-auto border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Optional Tools</span>
                      <Badge variant="outline" className="text-xs">
                        {optionalTools.length} Available
                      </Badge>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2">
                  {optionalTools.map((tool) => (
                    <div key={tool.toolId} className={`p-3 border rounded-lg ${getPriorityColor(tool.priority)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`opt-${tool.toolId}`}
                            checked={selectedTools.includes(tool.toolId) || tool.isPreSelected}
                            onCheckedChange={() => toggleToolSelection(tool.toolId)}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <label htmlFor={`opt-${tool.toolId}`} className="text-sm font-medium cursor-pointer">
                                {tool.toolName}
                              </label>
                              {tool.isPreSelected && (
                                <Badge variant="secondary" className="text-xs">Pre-selected</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {getReasonIcon(tool.reason)}
                              <span className="text-xs text-muted-foreground">
                                {tool.reasoning}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">OPTIONAL</Badge>
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => onShowFullListChange(false)}
            >
              Show Essential Tools Only
            </Button>
          </div>
        )}

        {/* Selection Summary */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Tool Selection Summary</span>
            <Badge variant="outline" className="text-xs">
              {totalSelected} of {recommendations.length} tools selected
            </Badge>
          </div>
          {preSelectedCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {preSelectedCount} tools were automatically pre-selected based on your {serviceTier} service tier and {getSystemTypeDisplay()} system.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
