import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  AlertTriangle
} from 'lucide-react';
import { ContactVerificationService } from '../../services/contactVerificationService';

interface ContactVerificationCardProps {
  type: 'Primary' | 'Secondary';
  name: string;
  phone?: string;
  email?: string;
  customerId: string;
  visitId: string;
  onVerify: (method: string, successful: boolean, notes: string) => void;
  initialStatus?: 'pending' | 'verified' | 'failed';
}

export function ContactVerificationCard({ 
  type, 
  name, 
  phone, 
  email, 
  customerId,
  visitId,
  onVerify,
  initialStatus = 'pending'
}: ContactVerificationCardProps) {
  const [status, setStatus] = useState<'pending' | 'verified' | 'failed'>(initialStatus);
  const [lastAttempt, setLastAttempt] = useState<{method: string, notes: string} | null>(null);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<'phone' | 'email' | 'text'>('phone');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerificationAttempt = async (method: 'phone' | 'email' | 'text', successful: boolean) => {
    setIsVerifying(true);
    
    try {
      // Log the contact attempt
      await ContactVerificationService.logContactAttempt(
        customerId,
        visitId,
        method,
        `${type} Contact: ${name}`,
        successful,
        verificationNotes
      );

      // Update local state
      setStatus(successful ? 'verified' : 'failed');
      setLastAttempt({ method, notes: verificationNotes });
      
      // Notify parent component
      onVerify(method, successful, verificationNotes);
      
      setShowVerificationDialog(false);
      setVerificationNotes('');
    } catch (error) {
      console.error('Error logging contact attempt:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'verified': return 'Verified';
      case 'failed': return 'Failed';
      default: return 'Pending';
    }
  };

  const renderContactMethod = (method: 'phone' | 'email' | 'text', value: string, icon: React.ReactNode) => {
    if (!value) return null;
    
    return (
      <div className="flex items-center gap-2 text-sm">
        {icon}
        <span className="flex-1">{value}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setVerificationMethod(method);
            setShowVerificationDialog(true);
          }}
          disabled={status === 'verified'}
        >
          Try
        </Button>
      </div>
    );
  };

  return (
    <>
      <Card className={`border transition-colors ${getStatusColor()}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {type} Contact
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <Badge variant="outline" className="text-xs">
                {getStatusText()}
              </Badge>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-900">{name}</div>
        </CardHeader>
        
        <CardContent className="space-y-2">
          {renderContactMethod('phone', phone || '', <Phone className="h-3 w-3" />)}
          {renderContactMethod('email', email || '', <Mail className="h-3 w-3" />)}
          {renderContactMethod('text', phone || '', <MessageSquare className="h-3 w-3" />)}
          
          {lastAttempt && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
              <div className="font-medium">Last attempt: {lastAttempt.method}</div>
              {lastAttempt.notes && <div className="text-gray-600">{lastAttempt.notes}</div>}
            </div>
          )}
          
          {!phone && !email && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertTriangle className="h-3 w-3" />
              No contact information available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Verify {type} Contact - {verificationMethod.charAt(0).toUpperCase() + verificationMethod.slice(1)}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{name}</div>
                <div className="text-sm text-gray-600">
                  {verificationMethod === 'phone' && phone && `Call: ${phone}`}
                  {verificationMethod === 'email' && email && `Email: ${email}`}
                  {verificationMethod === 'text' && phone && `Text: ${phone}`}
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Contact Notes</Label>
              <Textarea
                id="notes"
                placeholder="Record response, availability, special instructions, etc..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                rows={3}
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => handleVerificationAttempt(verificationMethod, true)}
                disabled={isVerifying}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isVerifying ? 'Recording...' : 'Contact Successful'}
              </Button>
              
              <Button
                variant="destructive"
                onClick={() => handleVerificationAttempt(verificationMethod, false)}
                disabled={isVerifying}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {isVerifying ? 'Recording...' : 'Contact Failed'}
              </Button>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowVerificationDialog(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Scheduling coordination tracking component
interface SchedulingCoordinationCardProps {
  coordinatedWith: string;
  expectedContact: string;
  notes: string;
  customerId: string;
  onChange: (data: { coordinatedWith: string; expectedContact: string; notes: string }) => void;
}

export function SchedulingCoordinationCard({
  coordinatedWith,
  expectedContact,
  notes,
  customerId,
  onChange
}: SchedulingCoordinationCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    coordinatedWith,
    expectedContact,
    notes
  });

  const handleSave = async () => {
    try {
      await ContactVerificationService.updateSchedulingCoordination(
        customerId,
        formData.coordinatedWith,
        formData.expectedContact,
        formData.notes
      );
      
      onChange(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating scheduling coordination:', error);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <User className="h-4 w-4" />
          Scheduling Coordination
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </Button>
      </CardHeader>
      
      <CardContent>
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor="coordinatedWith">Coordinated With</Label>
              <Input
                id="coordinatedWith"
                value={formData.coordinatedWith}
                onChange={(e) => setFormData({ ...formData, coordinatedWith: e.target.value })}
                placeholder="Who did scheduling coordinate with?"
              />
            </div>
            
            <div>
              <Label htmlFor="expectedContact">Expecting to Meet</Label>
              <Input
                id="expectedContact"
                value={formData.expectedContact}
                onChange={(e) => setFormData({ ...formData, expectedContact: e.target.value })}
                placeholder="Who are we expecting to meet on site?"
              />
            </div>
            
            <div>
              <Label htmlFor="coordinationNotes">Coordination Notes</Label>
              <Textarea
                id="coordinationNotes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Special instructions, timing notes, access details..."
                rows={2}
              />
            </div>
            
            <Button onClick={handleSave} size="sm">
              Save Coordination Details
            </Button>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Coordinated with:</span>{' '}
              {coordinatedWith || 'Not specified'}
            </div>
            <div>
              <span className="font-medium">Expecting to meet:</span>{' '}
              {expectedContact || 'Not specified'}
            </div>
            {notes && (
              <div>
                <span className="font-medium">Notes:</span>{' '}
                <div className="text-gray-600 mt-1">{notes}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
