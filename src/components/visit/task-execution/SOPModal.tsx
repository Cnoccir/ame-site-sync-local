import React from 'react';
import { X, Clock, FileText, ExternalLink, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface TaskProcedure {
  id: string;
  task_id: string;
  procedure_title: string;
  procedure_category: string;
  procedure_steps: any[];
  visual_guides: any[];
  additional_resources: any[];
}

interface SOPModalProps {
  procedure: TaskProcedure;
  onClose: () => void;
}

export const SOPModal: React.FC<SOPModalProps> = ({ procedure, onClose }) => {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const totalDuration = procedure.procedure_steps.reduce(
    (sum, step) => sum + (step.duration || 0), 
    0
  );

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold">{procedure.procedure_title}</h2>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="outline">{procedure.procedure_category}</Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{totalDuration} minutes total</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-100px)] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Procedure Steps */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Procedure Steps
              </h3>
              <div className="space-y-4">
                {procedure.procedure_steps.map((step, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Step {step.step}: {step.title}
                        </CardTitle>
                        {step.duration && (
                          <Badge variant="secondary" className="text-xs">
                            {step.duration} min
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* Visual Guides */}
            {procedure.visual_guides && procedure.visual_guides.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Visual Guides
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {procedure.visual_guides.map((guide, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <Image className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="font-medium">{guide.title}</h4>
                            <p className="text-sm text-muted-foreground capitalize">
                              {guide.type}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Resources */}
            {procedure.additional_resources && procedure.additional_resources.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  Additional Resources
                </h3>
                <div className="space-y-3">
                  {procedure.additional_resources.map((resource, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div>
                              <h4 className="font-medium">{resource.title}</h4>
                              <p className="text-sm text-muted-foreground capitalize">
                                {resource.type}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <div className="flex justify-end">
            <Button onClick={onClose}>
              Close SOP
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};