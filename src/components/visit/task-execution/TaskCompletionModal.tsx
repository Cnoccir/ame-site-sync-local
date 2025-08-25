import React, { useState } from 'react';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface TaskCompletionModalProps {
  taskName: string;
  timeSpent: number;
  onComplete: (notes: string) => void;
  onCancel: () => void;
}

export const TaskCompletionModal: React.FC<TaskCompletionModalProps> = ({
  taskName,
  timeSpent,
  onComplete,
  onCancel
}) => {
  const [notes, setNotes] = useState('');
  const [hasIssues, setHasIssues] = useState(false);

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleComplete = () => {
    onComplete(notes);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            Complete Task
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">{taskName}</h3>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Time spent: {formatTime(timeSpent)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="completion-notes">Completion Notes (Optional)</Label>
            <Textarea
              id="completion-notes"
              placeholder="Add any notes about the task completion, issues encountered, or recommendations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="has-issues"
              checked={hasIssues}
              onChange={(e) => setHasIssues(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="has-issues" className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Issues or follow-up required
            </Label>
          </div>

          {hasIssues && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning-foreground">
                This task will be flagged for follow-up review. Please include details in the notes above.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleComplete} className="flex-1">
              Complete Task
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};