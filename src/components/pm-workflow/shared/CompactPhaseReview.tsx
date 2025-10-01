import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Circle,
  Edit3,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

interface ReviewSection {
  id: string;
  title: string;
  isValid: boolean;
  data: { label: string; value: string | null | undefined }[];
  onEdit: () => void;
}

interface CompactPhaseReviewProps {
  phase: number;
  sections: ReviewSection[];
  onContinue: () => void;
  onDismiss: () => void;
  className?: string;
}

export const CompactPhaseReview: React.FC<CompactPhaseReviewProps> = ({
  phase,
  sections,
  onContinue,
  onDismiss,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [approvedSections, setApprovedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleApproval = (sectionId: string) => {
    const newApproved = new Set(approvedSections);
    if (newApproved.has(sectionId)) {
      newApproved.delete(sectionId);
    } else {
      newApproved.add(sectionId);
    }
    setApprovedSections(newApproved);
  };

  const allSectionsApproved = sections.every(section => approvedSections.has(section.id));
  const validSections = sections.filter(s => s.isValid).length;

  return (
    <Card className={`border-blue-200 bg-blue-50 ${className}`}>
      <div className="p-3">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Phase {phase} Review - {validSections}/{sections.length} sections complete
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
          >
            ×
          </Button>
        </div>

        {/* Compact Section List */}
        <div className="space-y-1 mb-3">
          {sections.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            const isApproved = approvedSections.has(section.id);

            return (
              <div key={section.id} className="border rounded bg-white text-xs">
                {/* Section Header */}
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-2 flex-1">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      <span className="font-medium">{section.title}</span>
                    </button>

                    {!section.isValid && (
                      <AlertCircle className="h-3 w-3 text-amber-500" />
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Approval Checkbox */}
                    <button
                      onClick={() => toggleApproval(section.id)}
                      className="flex items-center gap-1 text-gray-600 hover:text-green-600"
                      title="Mark as reviewed"
                    >
                      {isApproved ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <Circle className="h-3 w-3" />
                      )}
                      <span className="text-xs">✓</span>
                    </button>

                    {/* Edit Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={section.onEdit}
                      className="h-5 px-1 text-xs gap-1"
                    >
                      <Edit3 className="h-2.5 w-2.5" />
                      Edit
                    </Button>
                  </div>
                </div>

                {/* Expanded Content - PDF Preview Style */}
                {isExpanded && (
                  <div className="px-2 pb-2 border-t bg-gray-50">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2">
                      {section.data.map((item, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-gray-600 font-medium">{item.label}:</span>
                          <span className="text-gray-900 text-right max-w-[120px] truncate">
                            {item.value || <em className="text-gray-400">Not specified</em>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-xs text-blue-700">
            {allSectionsApproved ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                All sections reviewed
              </span>
            ) : (
              <span>Review and approve each section to continue</span>
            )}
          </div>

          <Button
            onClick={onContinue}
            disabled={!allSectionsApproved}
            size="sm"
            className="gap-1 text-xs h-6"
          >
            Continue to Phase {phase + 1}
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};