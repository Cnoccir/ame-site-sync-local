import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  FileText, 
  Star, 
  Clock, 
  Settings, 
  User,
  Plus,
  Trash2,
  Eye,
  Download,
  Save
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Customer } from '@/types';

interface PostVisitPhaseProps {
  customer: Customer;
  visitId: string;
  onPhaseComplete: () => void;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  category: 'safety' | 'system' | 'customer';
  required: boolean;
}

interface Issue {
  id: string;
  issue_type: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  action_taken: string;
}

interface CustomerFeedback {
  contact_name: string;
  satisfaction_rating: number;
  comments: string;
  follow_up_required: boolean;
  follow_up_reason: string;
}

interface Recommendations {
  performance: string;
  maintenance: string;
  upgrade: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Safety & Security
  { id: 'tools', text: 'All tools accounted for and removed from site', completed: false, category: 'safety', required: true },
  { id: 'panels', text: 'All panels closed and secured properly', completed: false, category: 'safety', required: true },
  { id: 'cleanup', text: 'Work area cleaned and debris removed', completed: false, category: 'safety', required: true },
  
  // System Verification  
  { id: 'operational', text: 'System confirmed operational', completed: false, category: 'system', required: true },
  { id: 'alarms', text: 'All maintenance alarms cleared', completed: false, category: 'system', required: true },
  { id: 'backup', text: 'System backup completed', completed: false, category: 'system', required: false },
  
  // Customer Communication
  { id: 'briefed', text: 'Customer briefed on work performed', completed: false, category: 'customer', required: true },
  { id: 'issues', text: 'Any issues found discussed with customer', completed: false, category: 'customer', required: true },
  { id: 'recommendations', text: 'Recommendations provided if applicable', completed: false, category: 'customer', required: false },
  { id: 'satisfaction', text: 'Customer satisfaction confirmed', completed: false, category: 'customer', required: true }
];

const ISSUE_TYPES = [
  'Equipment Failure',
  'Programming Issue', 
  'Communication Error',
  'Physical Damage',
  'Performance Issue',
  'Safety Concern',
  'Other'
];

const SEVERITY_COLORS = {
  Critical: 'border-red-500 bg-red-50',
  High: 'border-orange-500 bg-orange-50',
  Medium: 'border-yellow-500 bg-yellow-50',
  Low: 'border-green-500 bg-green-50'
};

const SEVERITY_BADGE_COLORS = {
  Critical: 'bg-red-100 text-red-800',
  High: 'bg-orange-100 text-orange-800', 
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-green-100 text-green-800'
};

export const PostVisitPhase = ({ customer, visitId, onPhaseComplete }: PostVisitPhaseProps) => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(CHECKLIST_ITEMS);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [newIssue, setNewIssue] = useState({
    issue_type: '',
    severity: 'Medium' as const,
    description: '',
    action_taken: ''
  });
  const [recommendations, setRecommendations] = useState<Recommendations>({
    performance: '',
    maintenance: '',
    upgrade: ''
  });
  const [feedback, setFeedback] = useState<CustomerFeedback>({
    contact_name: '',
    satisfaction_rating: 0,
    comments: '',
    follow_up_required: false,
    follow_up_reason: ''
  });
  const [visitSummary, setVisitSummary] = useState('');
  const [nextVisitNotes, setNextVisitNotes] = useState('');
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [visitStats, setVisitStats] = useState({
    totalTime: '0h 0m',
    tasksCompleted: '0/0',
    issuesFound: 0
  });

  const { toast } = useToast();

  useEffect(() => {
    loadExistingData();
    calculateVisitStats();
  }, [visitId]);

  // Auto-save drafts every 30 seconds
  useEffect(() => {
    const interval = setInterval(saveDraft, 30000);
    return () => clearInterval(interval);
  }, [checklist, issues, recommendations, feedback, visitSummary, nextVisitNotes]);

  const loadExistingData = async () => {
    try {
      // Load existing issues
      const { data: issuesData } = await supabase
        .from('visit_issues')
        .select('*')
        .eq('visit_id', visitId);
      
      if (issuesData) {
        setIssues(issuesData.map(issue => ({
          id: issue.id,
          issue_type: issue.issue_type,
          severity: issue.severity as 'Critical' | 'High' | 'Medium' | 'Low',
          description: issue.description,
          action_taken: issue.action_taken || ''
        })));
      }

      // Load existing recommendations
      const { data: recData } = await supabase
        .from('visit_recommendations')
        .select('*')
        .eq('visit_id', visitId);
      
      if (recData && recData.length > 0) {
        const recByType = recData.reduce((acc, rec) => {
          acc[rec.recommendation_type] = rec.recommendation_text;
          return acc;
        }, {} as any);
        
        setRecommendations({
          performance: recByType.performance || '',
          maintenance: recByType.maintenance || '',
          upgrade: recByType.upgrade || ''
        });
      }

      // Load existing feedback
      const { data: feedbackData } = await supabase
        .from('customer_feedback')
        .select('*')
        .eq('visit_id', visitId)
        .single();
      
      if (feedbackData) {
        setFeedback({
          contact_name: feedbackData.contact_name,
          satisfaction_rating: feedbackData.satisfaction_rating,
          comments: feedbackData.comments || '',
          follow_up_required: feedbackData.follow_up_required,
          follow_up_reason: feedbackData.follow_up_reason || ''
        });
      }

    } catch (error) {
      console.error('Error loading existing data:', error);
    }
  };

  const calculateVisitStats = async () => {
    try {
      // Get visit start time and calculate duration
      const { data: visitData } = await supabase
        .from('ame_visits')
        .select('started_at, current_phase')
        .eq('visit_id', visitId)
        .single();

      if (visitData?.started_at) {
        const start = new Date(visitData.started_at);
        const now = new Date();
        const diffMs = now.getTime() - start.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setVisitStats(prev => ({ ...prev, totalTime: `${hours}h ${minutes}m` }));
      }

      // Get task completion stats
      const { data: tasksData } = await supabase
        .from('ame_visit_tasks')
        .select('status')
        .eq('visit_id', visitId);

      if (tasksData) {
        const completed = tasksData.filter(task => task.status === 'Completed').length;
        setVisitStats(prev => ({ 
          ...prev, 
          tasksCompleted: `${completed}/${tasksData.length}`,
          issuesFound: issues.length
        }));
      }

    } catch (error) {
      console.error('Error calculating visit stats:', error);
    }
  };

  const updateChecklistItem = (id: string, completed: boolean) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completed } : item
    ));
  };

  const addIssue = async () => {
    if (!newIssue.issue_type || !newIssue.description) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in issue type and description',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('visit_issues')
        .insert({
          visit_id: visitId,
          issue_type: newIssue.issue_type,
          severity: newIssue.severity,
          description: newIssue.description,
          action_taken: newIssue.action_taken
        })
        .select()
        .single();

      if (error) throw error;

      const issue: Issue = {
        id: data.id,
        issue_type: data.issue_type,
        severity: data.severity as 'Critical' | 'High' | 'Medium' | 'Low',
        description: data.description,
        action_taken: data.action_taken || ''
      };

      setIssues(prev => [...prev, issue]);
      setNewIssue({
        issue_type: '',
        severity: 'Medium',
        description: '',
        action_taken: ''
      });

      toast({
        title: 'Issue Added',
        description: 'Issue has been recorded successfully'
      });

    } catch (error) {
      console.error('Error adding issue:', error);
      toast({
        title: 'Error',
        description: 'Failed to add issue',
        variant: 'destructive'
      });
    }
  };

  const removeIssue = async (issueId: string) => {
    try {
      await supabase
        .from('visit_issues')
        .delete()
        .eq('id', issueId);

      setIssues(prev => prev.filter(issue => issue.id !== issueId));
      
      toast({
        title: 'Issue Removed',
        description: 'Issue has been deleted'
      });

    } catch (error) {
      console.error('Error removing issue:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove issue',
        variant: 'destructive'
      });
    }
  };

  const saveDraft = async () => {
    try {
      // Save recommendations
      for (const [type, text] of Object.entries(recommendations)) {
        if (text.trim()) {
          await supabase
            .from('visit_recommendations')
            .upsert({
              visit_id: visitId,
              recommendation_type: type,
              recommendation_text: text,
              priority: 'Medium'
            }, { onConflict: 'visit_id,recommendation_type' });
        }
      }

      // Save customer feedback if contact name is provided
      if (feedback.contact_name.trim()) {
        await supabase
          .from('customer_feedback')
          .upsert({
            visit_id: visitId,
            contact_name: feedback.contact_name,
            satisfaction_rating: feedback.satisfaction_rating,
            comments: feedback.comments,
            follow_up_required: feedback.follow_up_required,
            follow_up_reason: feedback.follow_up_reason
          }, { onConflict: 'visit_id' });
      }

    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const validateCompletion = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check required checklist items
    const requiredItems = checklist.filter(item => item.required && !item.completed);
    if (requiredItems.length > 0) {
      errors.push(`${requiredItems.length} required checklist items not completed`);
    }

    // Check customer contact name
    if (!feedback.contact_name.trim()) {
      errors.push('Customer contact name is required');
    }

    // Check visit summary
    if (!visitSummary.trim()) {
      errors.push('Visit summary is required');
    }

    return { isValid: errors.length === 0, errors };
  };

  const completeVisit = async () => {
    const validation = validateCompletion();
    if (!validation.isValid) {
      toast({
        title: 'Cannot Complete Visit',
        description: validation.errors.join(', '),
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Save final data
      await saveDraft();

      // Generate comprehensive report data
      const reportData = {
        customer: customer,
        visitId: visitId,
        checklist: checklist,
        issues: issues,
        recommendations: recommendations,
        feedback: feedback,
        visitSummary: visitSummary,
        nextVisitNotes: nextVisitNotes,
        visitStats: visitStats,
        completedAt: new Date().toISOString()
      };

      // Save final report
      await supabase
        .from('visit_reports')
        .insert({
          visit_id: visitId,
          report_data: JSON.parse(JSON.stringify(reportData)),
          technician_email: 'technician@ame-inc.com'
        });

      // Update visit status
      await supabase
        .from('ame_visits')
        .update({
          visit_status: 'Completed',
          completion_date: new Date().toISOString(),
          phase_4_completed_at: new Date().toISOString(),
          phase_4_status: 'Completed'
        })
        .eq('visit_id', visitId);

      toast({
        title: 'Visit Completed',
        description: 'Visit has been successfully completed and report generated',
      });

      onPhaseComplete();

    } catch (error) {
      console.error('Error completing visit:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete visit',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const progressPercentage = (completedCount / checklist.length) * 100;

  const StarRating = ({ rating, onRatingChange }: { rating: number; onRatingChange: (rating: number) => void }) => {
    const [hoverRating, setHoverRating] = useState(0);

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="text-2xl transition-colors"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => onRatingChange(star)}
          >
            <Star 
              className={`w-6 h-6 ${
                star <= (hoverRating || rating) 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-300'
              }`} 
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {rating === 0 ? 'No rating' : 
           rating === 1 ? 'Poor' :
           rating === 2 ? 'Fair' :
           rating === 3 ? 'Good' :
           rating === 4 ? 'Very Good' : 'Excellent'}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Visit Closeout Checklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Visit Closeout Checklist
            </CardTitle>
            <Badge variant="outline">
              {completedCount} of {checklist.length} completed
            </Badge>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Safety & Security */}
          <div>
            <h4 className="font-medium flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4" />
              Safety & Security
            </h4>
            <div className="space-y-2">
              {checklist.filter(item => item.category === 'safety').map(item => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={item.id}
                    checked={item.completed}
                    onCheckedChange={(checked) => updateChecklistItem(item.id, checked as boolean)}
                  />
                  <label htmlFor={item.id} className="text-sm">
                    {item.text}
                    {item.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* System Verification */}
          <div>
            <h4 className="font-medium flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4" />
              System Verification
            </h4>
            <div className="space-y-2">
              {checklist.filter(item => item.category === 'system').map(item => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={item.id}
                    checked={item.completed}
                    onCheckedChange={(checked) => updateChecklistItem(item.id, checked as boolean)}
                  />
                  <label htmlFor={item.id} className="text-sm">
                    {item.text}
                    {item.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Customer Communication */}
          <div>
            <h4 className="font-medium flex items-center gap-2 mb-3">
              <User className="w-4 h-4" />
              Customer Communication
            </h4>
            <div className="space-y-2">
              {checklist.filter(item => item.category === 'customer').map(item => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={item.id}
                    checked={item.completed}
                    onCheckedChange={(checked) => updateChecklistItem(item.id, checked as boolean)}
                  />
                  <label htmlFor={item.id} className="text-sm">
                    {item.text}
                    {item.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues & Observations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Issues & Observations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Issue Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <label className="text-sm font-medium">Issue Type</label>
              <Select value={newIssue.issue_type} onValueChange={(value) => setNewIssue(prev => ({ ...prev, issue_type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Severity</label>
              <Select value={newIssue.severity} onValueChange={(value) => setNewIssue(prev => ({ ...prev, severity: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                value={newIssue.description}
                onChange={(e) => setNewIssue(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the issue in detail..."
                rows={3}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Action Taken</label>
              <Textarea
                value={newIssue.action_taken}
                onChange={(e) => setNewIssue(prev => ({ ...prev, action_taken: e.target.value }))}
                placeholder="Describe any corrective actions taken..."
                rows={2}
              />
            </div>

            <div className="md:col-span-2">
              <Button onClick={addIssue} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Issue
              </Button>
            </div>
          </div>

          {/* Issues List */}
          {issues.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Reported Issues ({issues.length})</h4>
              {issues.map(issue => (
                <div key={issue.id} className={`p-4 border-l-4 rounded-lg ${SEVERITY_COLORS[issue.severity]}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{issue.issue_type}</Badge>
                        <Badge className={SEVERITY_BADGE_COLORS[issue.severity]}>
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{issue.description}</p>
                      {issue.action_taken && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Action taken:</strong> {issue.action_taken}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIssue(issue.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">System Performance Recommendations</label>
            <Textarea
              value={recommendations.performance}
              onChange={(e) => setRecommendations(prev => ({ ...prev, performance: e.target.value }))}
              placeholder="Enter recommendations for improving system performance..."
              rows={3}
            />
            <div className="text-xs text-muted-foreground text-right">
              {recommendations.performance.length}/500 characters
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Preventive Maintenance Recommendations</label>
            <Textarea
              value={recommendations.maintenance}
              onChange={(e) => setRecommendations(prev => ({ ...prev, maintenance: e.target.value }))}
              placeholder="Enter preventive maintenance recommendations..."
              rows={3}
            />
            <div className="text-xs text-muted-foreground text-right">
              {recommendations.maintenance.length}/500 characters
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Upgrade/Replacement Recommendations</label>
            <Textarea
              value={recommendations.upgrade}
              onChange={(e) => setRecommendations(prev => ({ ...prev, upgrade: e.target.value }))}
              placeholder="Enter upgrade or replacement recommendations..."
              rows={3}
            />
            <div className="text-xs text-muted-foreground text-right">
              {recommendations.upgrade.length}/500 characters
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Customer Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Customer Contact Name *</label>
            <Input
              value={feedback.contact_name}
              onChange={(e) => setFeedback(prev => ({ ...prev, contact_name: e.target.value }))}
              placeholder="Enter customer contact name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Satisfaction Rating</label>
            <StarRating 
              rating={feedback.satisfaction_rating}
              onRatingChange={(rating) => setFeedback(prev => ({ ...prev, satisfaction_rating: rating }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Customer Comments</label>
            <Textarea
              value={feedback.comments}
              onChange={(e) => setFeedback(prev => ({ ...prev, comments: e.target.value }))}
              placeholder="Enter customer feedback and comments..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="follow-up"
              checked={feedback.follow_up_required}
              onCheckedChange={(checked) => setFeedback(prev => ({ ...prev, follow_up_required: checked as boolean }))}
            />
            <label htmlFor="follow-up" className="text-sm font-medium">
              Follow-up required
            </label>
          </div>

          {feedback.follow_up_required && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Follow-up Reason</label>
              <Textarea
                value={feedback.follow_up_reason}
                onChange={(e) => setFeedback(prev => ({ ...prev, follow_up_reason: e.target.value }))}
                placeholder="Explain why follow-up is needed..."
                rows={2}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visit Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Visit Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{visitStats.totalTime}</div>
              <div className="text-sm text-muted-foreground">Total Time On-Site</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{visitStats.tasksCompleted}</div>
              <div className="text-sm text-muted-foreground">Tasks Completed</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{issues.length}</div>
              <div className="text-sm text-muted-foreground">Issues Found</div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Overall Visit Summary *</label>
            <Textarea
              value={visitSummary}
              onChange={(e) => setVisitSummary(e.target.value)}
              placeholder="Provide a comprehensive summary of the visit..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Next Visit Preparation Notes</label>
            <Textarea
              value={nextVisitNotes}
              onChange={(e) => setNextVisitNotes(e.target.value)}
              placeholder="Notes for preparing the next visit..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Final Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={saveDraft}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            
            <Dialog open={showReportPreview} onOpenChange={setShowReportPreview}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Report
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Visit Report Preview</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 p-4">
                  <div className="text-center border-b pb-4">
                    <h2 className="text-xl font-bold">AME Maintenance Visit Report</h2>
                    <p className="text-muted-foreground">Visit ID: {visitId}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Customer:</strong> {customer.company_name}</div>
                    <div><strong>Site:</strong> {customer.site_name}</div>
                    <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                    <div><strong>Time on Site:</strong> {visitStats.totalTime}</div>
                  </div>

                  {issues.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Issues Found ({issues.length})</h3>
                      {issues.map((issue, index) => (
                        <div key={issue.id} className="mb-2 p-2 border-l-4 border-orange-500">
                          <div className="font-medium">{issue.issue_type} - {issue.severity}</div>
                          <div className="text-sm">{issue.description}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {feedback.satisfaction_rating > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Customer Feedback</h3>
                      <div className="flex items-center gap-2">
                        <StarRating rating={feedback.satisfaction_rating} onRatingChange={() => {}} />
                      </div>
                      {feedback.comments && (
                        <p className="text-sm mt-2">"{feedback.comments}"</p>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              onClick={completeVisit} 
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              <Download className="w-4 h-4 mr-2" />
              {loading ? 'Completing...' : 'Complete Visit & Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};