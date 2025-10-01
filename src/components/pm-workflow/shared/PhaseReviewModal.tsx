import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Edit3,
  Save,
  X,
  ArrowRight,
  Building,
  User,
  Phone,
  Mail,
  Key,
  Shield,
  Database,
  Settings
} from 'lucide-react';

interface PhaseSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  fields: {
    key: string;
    label: string;
    value: string | undefined | null;
    type?: 'text' | 'textarea' | 'select';
    options?: string[];
    required?: boolean;
  }[];
}

interface PhaseReviewModalProps {
  open: boolean;
  phase: number;
  phaseTitle: string;
  sections: PhaseSection[];
  onClose: () => void;
  onContinue: () => void;
  onSave: (sectionId: string, fieldKey: string, value: string) => void;
}

const getPhaseIcon = (phase: number) => {
  switch (phase) {
    case 1: return <Building className="h-5 w-5" />;
    case 2: return <Database className="h-5 w-5" />;
    case 3: return <Settings className="h-5 w-5" />;
    case 4: return <CheckCircle2 className="h-5 w-5" />;
    default: return <CheckCircle2 className="h-5 w-5" />;
  }
};

export const PhaseReviewModal: React.FC<PhaseReviewModalProps> = ({
  open,
  phase,
  phaseTitle,
  sections,
  onClose,
  onContinue,
  onSave
}) => {
  const [editingSections, setEditingSections] = useState<Set<string>>(new Set());
  const [editValues, setEditValues] = useState<{ [key: string]: string }>({});

  const startEditing = (sectionId: string) => {
    setEditingSections(prev => new Set(prev).add(sectionId));

    // Initialize edit values with current values
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      const newEditValues = { ...editValues };
      section.fields.forEach(field => {
        const key = `${sectionId}.${field.key}`;
        newEditValues[key] = field.value || '';
      });
      setEditValues(newEditValues);
    }
  };

  const cancelEditing = (sectionId: string) => {
    setEditingSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(sectionId);
      return newSet;
    });
  };

  const saveSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      section.fields.forEach(field => {
        const key = `${sectionId}.${field.key}`;
        const value = editValues[key];
        if (value !== undefined) {
          onSave(sectionId, field.key, value);
        }
      });
    }
    setEditingSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(sectionId);
      return newSet;
    });
  };

  const handleFieldChange = (sectionId: string, fieldKey: string, value: string) => {
    const key = `${sectionId}.${fieldKey}`;
    setEditValues(prev => ({ ...prev, [key]: value }));
  };

  const isEditing = (sectionId: string) => editingSections.has(sectionId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {getPhaseIcon(phase)}
            </div>
            <div>
              <div>Phase {phase} Review - {phaseTitle}</div>
              <DialogDescription>
                Review and edit the information collected in this phase
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {sections.map((section) => (
            <Card key={section.id} className="border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {section.icon}
                    {section.title}
                  </CardTitle>
                  <div className="flex gap-2">
                    {isEditing(section.id) ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelEditing(section.id)}
                          className="gap-1"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveSection(section.id)}
                          className="gap-1"
                        >
                          <Save className="h-3 w-3" />
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditing(section.id)}
                        className="gap-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {isEditing(section.id) ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.fields.map((field) => {
                      const key = `${section.id}.${field.key}`;
                      const value = editValues[key] || '';

                      return (
                        <div key={field.key} className="space-y-2">
                          <Label className="text-sm font-medium">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          {field.type === 'textarea' ? (
                            <Textarea
                              value={value}
                              onChange={(e) => handleFieldChange(section.id, field.key, e.target.value)}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              className="min-h-[80px]"
                            />
                          ) : (
                            <Input
                              value={value}
                              onChange={(e) => handleFieldChange(section.id, field.key, e.target.value)}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    {section.fields.map((field) => (
                      <div key={field.key} className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600 flex-shrink-0 w-32">
                          {field.label}:
                        </span>
                        <span className="text-sm text-gray-900 text-right flex-1 ml-2">
                          {field.value ? (
                            <span>{field.value}</span>
                          ) : (
                            <span className="text-gray-400 italic">Not specified</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">Phase {phase} completed</span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={onContinue} className="gap-2">
              Continue to Phase {phase + 1}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};