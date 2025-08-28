import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Laptop, Cloud, Wifi, Globe, Chrome } from 'lucide-react';
import { RemoteAccessVendorType } from '@/types/remote-access';
import { VENDOR_CONFIGS, getVendorsByCategory } from '@/config/remote-access-vendors';

interface VendorSelectorProps {
  onVendorSelect?: (vendor: RemoteAccessVendorType) => void;
  onSelect?: (vendor: RemoteAccessVendorType) => void; // Legacy support
  onCancel: () => void;
}

const getVendorIcon = (iconName: string, className: string = "w-6 h-6") => {
  const icons = {
    'Monitor': <Monitor className={className} />,
    'Laptop': <Laptop className={className} />,
    'Cloud': <Cloud className={className} />,
    'Wifi': <Wifi className={className} />,
    'Globe': <Globe className={className} />,
    'Chrome': <Chrome className={className} />
  };
  
  return icons[iconName] || <Monitor className={className} />;
};

export const VendorSelector: React.FC<VendorSelectorProps> = ({ onVendorSelect, onSelect, onCancel }) => {
  const cloudVendors = getVendorsByCategory('cloud');
  const directVendors = getVendorsByCategory('direct');

  const handleVendorSelect = (vendor: RemoteAccessVendorType) => {
    // Support both prop names for backward compatibility
    if (onVendorSelect) {
      onVendorSelect(vendor);
    } else if (onSelect) {
      onSelect(vendor);
    }
  };

  const renderVendorCard = (config: any) => (
    <Card 
      key={config.vendor}
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50"
      onClick={() => handleVendorSelect(config.vendor)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            {getVendorIcon(config.icon, "w-6 h-6 text-primary")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-base">{config.label}</h3>
              <Badge variant="outline" className="text-xs">
                {config.category === 'cloud' ? 'Cloud' : 'Direct'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {config.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Select Remote Access Method</h3>
        <p className="text-sm text-muted-foreground">
          Choose the type of remote access used for this customer
        </p>
      </div>

      {/* Cloud-Based Solutions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-primary" />
          <h4 className="font-medium text-base">Cloud-Based Solutions</h4>
          <Badge variant="secondary" className="text-xs">Popular</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {cloudVendors.map(renderVendorCard)}
        </div>
      </div>

      {/* Direct Connection Methods */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Monitor className="w-5 h-5 text-primary" />
          <h4 className="font-medium text-base">Direct Connection Methods</h4>
          <Badge variant="secondary" className="text-xs">Traditional</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {directVendors.map(renderVendorCard)}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
        <strong>Need help choosing?</strong>
        <ul className="mt-1 space-y-1">
          <li>• <strong>Cloud-based:</strong> Easier to set up, works from anywhere</li>
          <li>• <strong>Direct connection:</strong> More control, typically faster, requires network access</li>
          <li>• Popular choices: TeamViewer, AnyDesk, Windows RDP, VNC</li>
        </ul>
      </div>
    </div>
  );
};
