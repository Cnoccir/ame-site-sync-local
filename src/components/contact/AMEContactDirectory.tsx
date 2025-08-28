import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  Phone, 
  Mail, 
  User, 
  Building, 
  Copy,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AMEContactService, AMEContactSearchResult } from '@/services/ameContactService';

interface AMEContactDirectoryProps {
  onContactSelect?: (contact: AMEContactSearchResult) => void;
  showSelectButtons?: boolean;
  className?: string;
}

export const AMEContactDirectory: React.FC<AMEContactDirectoryProps> = ({
  onContactSelect,
  showSelectButtons = false,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<AMEContactSearchResult[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<AMEContactSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [technicianFilter, setTechnicianFilter] = useState<'all' | 'technicians' | 'non-technicians'>('all');
  const { toast } = useToast();

  // Load all contacts on mount
  useEffect(() => {
    loadContacts();
  }, []);

  // Filter contacts when search query or filters change
  useEffect(() => {
    filterContacts();
  }, [searchQuery, contacts, roleFilter, technicianFilter]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const allContacts = await AMEContactService.getAllEmployees();
      setContacts(allContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast({
        title: "Error",
        description: "Failed to load contact directory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterContacts = () => {
    let filtered = contacts;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(contact =>
        contact.name.toLowerCase().includes(query) ||
        contact.role?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.phone?.toLowerCase().includes(query)
      );
    }

    // Filter by role
    if (roleFilter) {
      const roleQuery = roleFilter.toLowerCase();
      filtered = filtered.filter(contact =>
        contact.role?.toLowerCase().includes(roleQuery)
      );
    }

    // Filter by technician status
    if (technicianFilter !== 'all') {
      filtered = filtered.filter(contact =>
        technicianFilter === 'technicians' ? contact.is_technician : !contact.is_technician
      );
    }

    setFilteredContacts(filtered);
  };

  const handleCopyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleCallPhone = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleSendEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getUniqueRoles = () => {
    const roles = contacts
      .map(c => c.role)
      .filter(Boolean)
      .filter((role, index, arr) => arr.indexOf(role) === index)
      .sort();
    return roles as string[];
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            AME Contact Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading contacts...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          AME Contact Directory
          <Badge variant="secondary" className="ml-auto">
            {filteredContacts.length} contacts
          </Badge>
        </CardTitle>
        
        {/* Search and Filter Controls */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name, role, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role-filter">Filter by Role</Label>
              <Input
                id="role-filter"
                placeholder="Enter role (e.g., Technician, Engineer)"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="type-filter">Filter by Type</Label>
              <select
                id="type-filter"
                value={technicianFilter}
                onChange={(e) => setTechnicianFilter(e.target.value as 'all' | 'technicians' | 'non-technicians')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="all">All Employees</option>
                <option value="technicians">Technicians Only</option>
                <option value="non-technicians">Non-Technicians Only</option>
              </select>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredContacts.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            {searchQuery || roleFilter || technicianFilter !== 'all' 
              ? 'No contacts match your search criteria.' 
              : 'No contacts found.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar className="w-12 h-12">
                  <AvatarFallback className={`${contact.is_technician ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                    {getInitials(contact.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {contact.name}
                    </h3>
                    {contact.is_technician && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                        Technician
                      </Badge>
                    )}
                  </div>
                  
                  {contact.role && (
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {contact.role}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    {contact.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {contact.phone}
                        </span>
                      </div>
                    )}
                    
                    {contact.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {contact.email}
                        </span>
                      </div>
                    )}
                    
                    {contact.extension && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Ext:</span>
                        <span className="text-muted-foreground">
                          {contact.extension}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  {/* Action buttons */}
                  <div className="flex gap-1">
                    {contact.phone && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCallPhone(contact.phone!)}
                        title="Call"
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {contact.email && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSendEmail(contact.email!)}
                        title="Email"
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToClipboard(
                        AMEContactService.formatContactInfo(contact),
                        'Contact info'
                      )}
                      title="Copy contact info"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Select button for forms */}
                  {showSelectButtons && onContactSelect && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onContactSelect(contact)}
                    >
                      Select
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
