import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, User, Phone, Mail, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AMEContactService, AMEContactSearchResult } from '@/services/ameContactService';
import { useToast } from '@/hooks/use-toast';

interface AMEContactSelectorProps {
  value?: string;
  onValueChange: (contactId: string) => void;
  onContactChange?: (contact: AMEContactSearchResult | null) => void;
  label?: string;
  placeholder?: string;
  technicianOnly?: boolean;
  className?: string;
  disabled?: boolean;
}

export const AMEContactSelector: React.FC<AMEContactSelectorProps> = ({
  value,
  onValueChange,
  onContactChange,
  label = "Select AME Contact",
  placeholder = "Search AME employees...",
  technicianOnly = false,
  className = "",
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AMEContactSearchResult[]>([]);
  const [selectedContact, setSelectedContact] = useState<AMEContactSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load selected contact details when value changes
  useEffect(() => {
    if (value && value !== selectedContact?.id) {
      loadContactById(value);
    } else if (!value) {
      setSelectedContact(null);
    }
  }, [value]);

  // Search contacts when query changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchContacts(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, technicianOnly]);

  const loadContactById = async (contactId: string) => {
    try {
      const contact = await AMEContactService.getEmployeeById(contactId);
      setSelectedContact(contact);
      if (onContactChange) {
        onContactChange(contact);
      }
    } catch (error) {
      console.error('Error loading contact:', error);
    }
  };

  const searchContacts = async (query: string) => {
    try {
      setLoading(true);
      let results: AMEContactSearchResult[];
      
      if (technicianOnly) {
        results = await AMEContactService.advancedSearch({
          name: query,
          technicianOnly: true
        });
      } else {
        results = await AMEContactService.searchEmployees(query);
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching contacts:', error);
      toast({
        title: "Error",
        description: "Failed to search contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (contact: AMEContactSearchResult) => {
    setSelectedContact(contact);
    onValueChange(contact.id);
    if (onContactChange) {
      onContactChange(contact);
    }
    setOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    setSelectedContact(null);
    onValueChange('');
    if (onContactChange) {
      onContactChange(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className={className}>
      {label && <Label className="mb-2 block">{label}</Label>}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !selectedContact && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            {selectedContact ? (
              <div className="flex items-center gap-2 truncate">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className={`text-xs ${selectedContact.is_technician ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                    {getInitials(selectedContact.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{selectedContact.name}</span>
                {selectedContact.is_technician && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                    Tech
                  </Badge>
                )}
              </div>
            ) : (
              placeholder
            )}
            <div className="flex items-center gap-1">
              {selectedContact && !disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={`Search ${technicianOnly ? 'technicians' : 'employees'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center p-6">
                  <div className="text-sm text-muted-foreground">Searching...</div>
                </div>
              ) : searchQuery.length < 2 ? (
                <div className="flex items-center justify-center p-6">
                  <div className="text-sm text-muted-foreground">Type at least 2 characters to search</div>
                </div>
              ) : searchResults.length === 0 ? (
                <CommandEmpty>No employees found.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {searchResults.map((contact) => (
                    <CommandItem
                      key={contact.id}
                      value={contact.id}
                      onSelect={() => handleSelect(contact)}
                      className="flex items-center gap-3 p-3"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          value === contact.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className={`text-xs ${contact.is_technician ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{contact.name}</span>
                          {contact.is_technician && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                              Technician
                            </Badge>
                          )}
                        </div>
                        {contact.role && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span className="truncate">{contact.role}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {contact.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{contact.phone}</span>
                            </div>
                          )}
                          {contact.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{contact.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected contact details */}
      {selectedContact && (
        <Card className="mt-2">
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className={selectedContact.is_technician ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}>
                  {getInitials(selectedContact.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium truncate">{selectedContact.name}</h4>
                  {selectedContact.is_technician && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                      Technician
                    </Badge>
                  )}
                </div>
                {selectedContact.role && (
                  <p className="text-sm text-muted-foreground mb-2">{selectedContact.role}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm">
                  {selectedContact.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{selectedContact.phone}</span>
                    </div>
                  )}
                  {selectedContact.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground truncate">{selectedContact.email}</span>
                    </div>
                  )}
                  {selectedContact.extension && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Ext:</span>
                      <span className="text-muted-foreground">{selectedContact.extension}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
