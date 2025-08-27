import { ToolRecommendation } from '@/types';

interface ToolRecord {
  Tool_Name: string;
  Type: string;
  Primary_Purpose: string;
  Applicable_Tiers: string;
  System_Fit: string;
  Phase: string;
  Onsite_or_Remote: string;
  Audience_Level: string;
  Must_Have_for: string;
  Nice_to_Have_for: string;
  License_Type: string;
  Owner: string;
  Notes: string;
  Last_Updated: string;
  Version: string;
}

// Tool data based on Tool_Library_v22.csv
const TOOL_LIBRARY: ToolRecord[] = [
  {
    Tool_Name: "PPE Gear Bags (Blue/Orange)",
    Type: "Hardware",
    Primary_Purpose: "PPE Gear Bags containing: hard hat; safety glasses; high-visibility vest; gloves; ear protection",
    Applicable_Tiers: "CORE,ASSURE,GUARDIAN",
    System_Fit: "Any",
    Phase: "",
    Onsite_or_Remote: "Onsite",
    Audience_Level: "2",
    Must_Have_for: "CORE",
    Nice_to_Have_for: "GUARDIAN",
    License_Type: "",
    Owner: "",
    Notes: "PPE Gear Bags containing: hard hat; safety glasses; high-visibility vest; gloves; ear protection",
    Last_Updated: "2025-08-26",
    Version: "v2.2"
  },
  {
    Tool_Name: "Digital Multimeter",
    Type: "Hardware",
    Primary_Purpose: "Fluke 87V or ruggedized 87V MAX True-RMS multimeter",
    Applicable_Tiers: "CORE,ASSURE,GUARDIAN",
    System_Fit: "Any",
    Phase: "",
    Onsite_or_Remote: "Onsite",
    Audience_Level: "2",
    Must_Have_for: "CORE",
    Nice_to_Have_for: "GUARDIAN",
    License_Type: "",
    Owner: "",
    Notes: "Fluke 87V or ruggedized 87V MAX True-RMS multimeter",
    Last_Updated: "2025-08-26",
    Version: "v2.2"
  },
  {
    Tool_Name: "Laptop Computer",
    Type: "Hardware",
    Primary_Purpose: "Primary laptop with Ethernet, USB, and Wi-Fi interfaces",
    Applicable_Tiers: "CORE,ASSURE,GUARDIAN",
    System_Fit: "Any",
    Phase: "",
    Onsite_or_Remote: "Onsite",
    Audience_Level: "2",
    Must_Have_for: "CORE",
    Nice_to_Have_for: "GUARDIAN",
    License_Type: "",
    Owner: "",
    Notes: "Primary laptop with Ethernet, USB, and Wi-Fi interfaces",
    Last_Updated: "2025-08-26",
    Version: "v2.2"
  },
  {
    Tool_Name: "Assorted Insulated Hand-Tool Set",
    Type: "Hardware",
    Primary_Purpose: "Insulated screwdrivers, pliers, nut drivers, adjustable wrenches, hex keys, Torx bits",
    Applicable_Tiers: "CORE,ASSURE,GUARDIAN",
    System_Fit: "Any",
    Phase: "",
    Onsite_or_Remote: "Onsite",
    Audience_Level: "2",
    Must_Have_for: "CORE",
    Nice_to_Have_for: "GUARDIAN",
    License_Type: "",
    Owner: "",
    Notes: "Insulated screwdrivers, pliers, nut drivers, adjustable wrenches, hex keys, Torx bits",
    Last_Updated: "2025-08-26",
    Version: "v2.2"
  },
  {
    Tool_Name: "Tridium Niagara Workbench",
    Type: "Software",
    Primary_Purpose: "Niagara Workbench N4 v4.10/4.11",
    Applicable_Tiers: "CORE,ASSURE,GUARDIAN",
    System_Fit: "Niagara N4",
    Phase: "",
    Onsite_or_Remote: "Onsite",
    Audience_Level: "2",
    Must_Have_for: "CORE",
    Nice_to_Have_for: "GUARDIAN",
    License_Type: "",
    Owner: "",
    Notes: "Niagara Workbench N4 v4.10/4.11",
    Last_Updated: "2025-08-26",
    Version: "v2.2"
  },
  {
    Tool_Name: "Johnson Controls CCT/PCT",
    Type: "Software",
    Primary_Purpose: "Controller Configuration Tool and Programmable Controller Tool",
    Applicable_Tiers: "ASSURE,GUARDIAN",
    System_Fit: "Johnson Controls",
    Phase: "",
    Onsite_or_Remote: "Onsite",
    Audience_Level: "2",
    Must_Have_for: "",
    Nice_to_Have_for: "GUARDIAN",
    License_Type: "",
    Owner: "",
    Notes: "Controller Configuration Tool and Programmable Controller Tool",
    Last_Updated: "2025-08-26",
    Version: "v2.2"
  },
  {
    Tool_Name: "Honeywell Spyder Tool",
    Type: "Software",
    Primary_Purpose: "Niagara module for legacy Honeywell Spyder controllers",
    Applicable_Tiers: "ASSURE,GUARDIAN",
    System_Fit: "Honeywell",
    Phase: "",
    Onsite_or_Remote: "Onsite",
    Audience_Level: "2",
    Must_Have_for: "",
    Nice_to_Have_for: "GUARDIAN",
    License_Type: "",
    Owner: "",
    Notes: "Niagara module for legacy Honeywell Spyder controllers",
    Last_Updated: "2025-08-26",
    Version: "v2.2"
  },
  {
    Tool_Name: "Temperature/Humidity Meter",
    Type: "Hardware",
    Primary_Purpose: "Fluke 971 Thermo-Hygrometer for temperature and humidity readings",
    Applicable_Tiers: "CORE,ASSURE,GUARDIAN",
    System_Fit: "Any",
    Phase: "",
    Onsite_or_Remote: "Onsite",
    Audience_Level: "2",
    Must_Have_for: "CORE",
    Nice_to_Have_for: "GUARDIAN",
    License_Type: "",
    Owner: "",
    Notes: "Fluke 971 Thermo-Hygrometer for temperature and humidity readings",
    Last_Updated: "2025-08-26",
    Version: "v2.2"
  },
  {
    Tool_Name: "Infrared Thermometer",
    Type: "Hardware",
    Primary_Purpose: "Raytek MiniTemp RAYMT4U or Fluke 62 MAX infrared thermometer",
    Applicable_Tiers: "CORE,ASSURE,GUARDIAN",
    System_Fit: "Any",
    Phase: "",
    Onsite_or_Remote: "Onsite",
    Audience_Level: "2",
    Must_Have_for: "CORE",
    Nice_to_Have_for: "GUARDIAN",
    License_Type: "",
    Owner: "",
    Notes: "Raytek MiniTemp RAYMT4U or Fluke 62 MAX infrared thermometer",
    Last_Updated: "2025-08-26",
    Version: "v2.2"
  },
  {
    Tool_Name: "Digital Manometer",
    Type: "Hardware",
    Primary_Purpose: "Dwyer 475-1-FM digital manometer",
    Applicable_Tiers: "ASSURE,GUARDIAN",
    System_Fit: "Any",
    Phase: "",
    Onsite_or_Remote: "Onsite",
    Audience_Level: "2",
    Must_Have_for: "",
    Nice_to_Have_for: "GUARDIAN",
    License_Type: "",
    Owner: "",
    Notes: "Dwyer 475-1-FM digital manometer",
    Last_Updated: "2025-08-26",
    Version: "v2.2"
  }
];

export const generateToolRecommendations = async (
  systemType: 'N4' | 'FX' | 'Mixed-ALC' | 'EBI-Honeywell' | 'Other',
  serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN'
): Promise<ToolRecommendation[]> => {
  const recommendations: ToolRecommendation[] = [];
  
  for (const tool of TOOL_LIBRARY) {
    const applicableTiers = tool.Applicable_Tiers.split(',').map(t => t.trim());
    const mustHaveTiers = tool.Must_Have_for.split(',').map(t => t.trim()).filter(t => t);
    const niceToHaveTiers = tool.Nice_to_Have_for.split(',').map(t => t.trim()).filter(t => t);
    
    // Check if tool applies to current service tier
    if (!applicableTiers.includes(serviceTier)) {
      continue;
    }
    
    // Check system compatibility
    const systemFit = tool.System_Fit.toLowerCase();
    let systemMatch = systemFit === 'any';
    
    if (!systemMatch) {
      switch (systemType) {
        case 'N4':
          systemMatch = systemFit.includes('niagara') || systemFit.includes('n4');
          break;
        case 'FX':
          systemMatch = systemFit.includes('johnson') || systemFit.includes('jci') || systemFit.includes('fx');
          break;
        case 'EBI-Honeywell':
          systemMatch = systemFit.includes('honeywell') || systemFit.includes('ebi');
          break;
        case 'Mixed-ALC':
          systemMatch = systemFit.includes('mixed') || systemFit.includes('alc');
          break;
        default:
          systemMatch = true; // Include for 'Other' systems
      }
    }
    
    if (!systemMatch) continue;
    
    // Determine priority and pre-selection
    let priority: 'essential' | 'recommended' | 'optional';
    let isPreSelected: boolean;
    let reason: 'required_for_system' | 'service_tier' | 'common_issue' | 'site_specific';
    
    if (mustHaveTiers.includes(serviceTier)) {
      priority = 'essential';
      isPreSelected = true;
      reason = 'service_tier';
    } else if (niceToHaveTiers.includes(serviceTier)) {
      priority = 'recommended';
      isPreSelected = false;
      reason = 'service_tier';
    } else {
      priority = 'optional';
      isPreSelected = false;
      reason = 'common_issue';
    }
    
    // System-specific tools get higher priority
    if (systemMatch && systemFit !== 'any') {
      reason = 'required_for_system';
      if (priority === 'optional') priority = 'recommended';
    }
    
    recommendations.push({
      toolId: tool.Tool_Name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      toolName: tool.Tool_Name,
      priority,
      isPreSelected,
      reason,
      reasoning: tool.Primary_Purpose
    });
  }
  
  // Sort by priority (essential first, then recommended, then optional)
  recommendations.sort((a, b) => {
    const priorityOrder = { essential: 0, recommended: 1, optional: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  return recommendations;
};
