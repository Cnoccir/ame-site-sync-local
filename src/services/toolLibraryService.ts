import { ToolRecommendation, Customer } from '@/types';

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

// Tool data based on Tool_Library_v22.csv - Complete Dataset
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
  },
  // Additional tools from CSV
  { Tool_Name: "Thermocouple Lead/Meter", Type: "Hardware", Primary_Purpose: "Fluke 52II or 54IIB Dual Input digital thermometer with K-type thermocouple leads", Applicable_Tiers: "ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "2", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "Fluke 52II or 54IIB Dual Input digital thermometer with K-type thermocouple leads", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Loop Calibrator", Type: "Hardware", Primary_Purpose: "Fluke 789 Loop Calibrator, Process Meter, Multimeter", Applicable_Tiers: "ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "2", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "AC Power Meter", Type: "Hardware", Primary_Purpose: "Fluke 1736 3-Phase Power Quality Logger", Applicable_Tiers: "ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "2", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Extension Cords & Power Strips", Type: "Hardware", Primary_Purpose: "12-gauge heavy duty, UL listed extension cord", Applicable_Tiers: "CORE,ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "2", Must_Have_for: "CORE", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Ethernet Patch Cables", Type: "Hardware", Primary_Purpose: "Cat-5e or Cat-6 Ethernet cables, various lengths (3', 7', 25', 50')", Applicable_Tiers: "CORE,ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "2", Must_Have_for: "CORE", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "USB Extension Cables", Type: "Hardware", Primary_Purpose: "USB 3.0 Type-A to Type-A extension cables (various lengths: 3', 6', 10')", Applicable_Tiers: "CORE,ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "2", Must_Have_for: "CORE", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Serial Cables", Type: "Hardware", Primary_Purpose: "RS-232 serial cables, 9-pin D-Sub (Male-Male, Male-Female, Female-Female)", Applicable_Tiers: "ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "2", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "USB to Serial Adapters", Type: "Hardware", Primary_Purpose: "USB-to-RS232 serial adapters with proper Windows driver support", Applicable_Tiers: "ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "2", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Network Cable Tester", Type: "Hardware", Primary_Purpose: "Fluke Networks CableIQ Qualification Tester or similar", Applicable_Tiers: "ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "2", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Ethernet Switch (Unmanaged)", Type: "Hardware", Primary_Purpose: "5 or 8 port gigabit Ethernet switch for network expansion during troubleshooting", Applicable_Tiers: "ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "2", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "BACnet Scanner", Type: "Software", Primary_Purpose: "BACnet protocol analyzer and device scanner", Applicable_Tiers: "ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "2", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "Free", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "VIP (Virtual IP) Software", Type: "Software", Primary_Purpose: "Honeywell VIP software for EBI/WEBs system management", Applicable_Tiers: "ASSURE,GUARDIAN", System_Fit: "Honeywell", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "2", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Advanced IP Scanner", Type: "Software", Primary_Purpose: "Free IP address scanner for network discovery", Applicable_Tiers: "CORE,ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "2", Must_Have_for: "CORE", Nice_to_Have_for: "GUARDIAN", License_Type: "Free", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Wireshark", Type: "Software", Primary_Purpose: "Network protocol analyzer", Applicable_Tiers: "GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "3", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "Free", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "VPN Software", Type: "Software", Primary_Purpose: "OpenVPN, Cisco AnyConnect, or similar VPN client", Applicable_Tiers: "CORE,ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Remote", Audience_Level: "2", Must_Have_for: "CORE", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Remote Desktop Software", Type: "Software", Primary_Purpose: "TeamViewer, Windows Remote Desktop, or similar", Applicable_Tiers: "CORE,ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Remote", Audience_Level: "2", Must_Have_for: "CORE", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "PuTTY/SSH Client", Type: "Software", Primary_Purpose: "SSH/Telnet client for command-line access to network devices", Applicable_Tiers: "ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "3", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "Free", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "TFTP Server Software", Type: "Software", Primary_Purpose: "Trivial File Transfer Protocol server for firmware updates", Applicable_Tiers: "GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "3", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "Free", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Flashlight/Headlamp", Type: "Hardware", Primary_Purpose: "LED flashlight or headlamp for equipment visibility in dark spaces", Applicable_Tiers: "CORE,ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "1", Must_Have_for: "CORE", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Portable Work Light", Type: "Hardware", Primary_Purpose: "LED work light with magnetic base or clamp", Applicable_Tiers: "ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "2", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Safety Lockout/Tagout Kit", Type: "Hardware", Primary_Purpose: "LOTO devices for electrical panel and equipment isolation", Applicable_Tiers: "ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "2", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "First Aid Kit", Type: "Hardware", Primary_Purpose: "Basic first aid supplies for minor injuries", Applicable_Tiers: "CORE,ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "1", Must_Have_for: "CORE", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Contractor Bags", Type: "Hardware", Primary_Purpose: "Heavy-duty plastic bags for debris and old equipment disposal", Applicable_Tiers: "ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "1", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Labels & Markers", Type: "Hardware", Primary_Purpose: "Waterproof labels and permanent markers for equipment identification", Applicable_Tiers: "CORE,ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "1", Must_Have_for: "CORE", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Digital Camera", Type: "Hardware", Primary_Purpose: "Digital camera or smartphone for documentation photography", Applicable_Tiers: "CORE,ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "1", Must_Have_for: "CORE", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Notebook & Pens", Type: "Hardware", Primary_Purpose: "Physical notebook and writing implements for field notes", Applicable_Tiers: "CORE,ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "1", Must_Have_for: "CORE", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Cable Ties", Type: "Hardware", Primary_Purpose: "Various sizes of cable ties for wire management", Applicable_Tiers: "ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "1", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Wire Nuts & Electrical Tape", Type: "Hardware", Primary_Purpose: "Electrical connection supplies for temporary connections and repairs", Applicable_Tiers: "ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "2", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Non-Contact Voltage Tester", Type: "Hardware", Primary_Purpose: "Fluke 1AC II VoltAlert or similar non-contact voltage detector", Applicable_Tiers: "CORE,ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "2", Must_Have_for: "CORE", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Circuit Breaker Finder", Type: "Hardware", Primary_Purpose: "Klein Tools ET300 Digital Circuit Breaker Finder", Applicable_Tiers: "ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "2", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Wire Strippers", Type: "Hardware", Primary_Purpose: "Klein Tools 11047 wire strippers, 10-18 AWG", Applicable_Tiers: "ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "2", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Terminal Block Removal Tool", Type: "Hardware", Primary_Purpose: "Phoenix Contact PSR-SPF-24UC terminal block removal tool", Applicable_Tiers: "GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "3", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Crimping Tool Set", Type: "Hardware", Primary_Purpose: "Wire crimping tools for RJ45, spade, and ring terminals", Applicable_Tiers: "GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "3", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Oscilloscope (Portable)", Type: "Hardware", Primary_Purpose: "Rigol DS1054Z Digital Storage Oscilloscope", Applicable_Tiers: "GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "3", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Function Generator", Type: "Hardware", Primary_Purpose: "Keysight 33210A Function/Arbitrary Waveform Generator", Applicable_Tiers: "GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "3", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Universal Power Supply", Type: "Hardware", Primary_Purpose: "Adjustable DC power supply (0-30V, 0-5A)", Applicable_Tiers: "GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "3", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Logic Analyzer", Type: "Hardware", Primary_Purpose: "Saleae Logic 8 USB Logic Analyzer", Applicable_Tiers: "GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "3", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Bench Power Strip", Type: "Hardware", Primary_Purpose: "Heavy-duty bench power strip with individual switches", Applicable_Tiers: "GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "2", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Electrical Panel Keys", Type: "Hardware", Primary_Purpose: "Standard electrical panel keys (square, triangle, etc.)", Applicable_Tiers: "ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "2", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Spare Fuses", Type: "Hardware", Primary_Purpose: "Common fuse types and ratings for equipment protection", Applicable_Tiers: "ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "2", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "BACnet Gateway", Type: "Hardware", Primary_Purpose: "Contemporary Controls BASgateway for protocol conversion", Applicable_Tiers: "GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "3", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "Modbus Gateway", Type: "Hardware", Primary_Purpose: "Contemporary Controls BASgateway Modbus for protocol conversion", Applicable_Tiers: "GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "3", Must_Have_for: "", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" },
  { Tool_Name: "USB Drive (Multiple)", Type: "Hardware", Primary_Purpose: "Multiple USB drives for file transfer and backup", Applicable_Tiers: "CORE,ASSURE,GUARDIAN", System_Fit: "Any", Phase: "", Onsite_or_Remote: "Onsite", Audience_Level: "1", Must_Have_for: "CORE", Nice_to_Have_for: "GUARDIAN", License_Type: "", Owner: "", Notes: "", Last_Updated: "2025-08-26", Version: "v2.2" }
];

// Enhanced context interface for intelligent recommendations
interface SiteIntelligenceContext {
  site_experience?: 'first_time' | 'familiar' | 'expert';
  known_issues?: string[];
  completion_status?: 'Design' | 'Construction' | 'Commissioning' | 'Operational' | 'Warranty';
  system_platform?: 'N4' | 'FX' | 'WEBs' | 'Mixed-ALC' | 'EBI-Honeywell' | 'Other';
  documentation_score?: number;
  system_architecture?: string;
  common_access_issues?: string[];
}

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

/**
 * Enhanced version that uses customer site intelligence for better recommendations
 * @param systemType - The system type
 * @param serviceTier - The service tier
 * @param enhancedContext - Additional site intelligence context
 */
export const generateToolRecommendationsWithIntelligence = async (
  systemType: 'N4' | 'FX' | 'WEBs' | 'Mixed-ALC' | 'EBI-Honeywell' | 'Other',
  serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN',
  enhancedContext?: SiteIntelligenceContext
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
        case 'WEBs':
          systemMatch = systemFit.includes('webs') || systemFit.includes('johnson');
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
    
    // Determine priority and pre-selection with enhanced context
    let priority: 'essential' | 'recommended' | 'optional';
    let isPreSelected: boolean;
    let reason: 'required_for_system' | 'service_tier' | 'common_issue' | 'site_specific';
    let reasoning = tool.Primary_Purpose;
    
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
    
    // Apply site intelligence enhancements
    if (enhancedContext) {
      // First-time visit adjustments
      if (enhancedContext.site_experience === 'first_time') {
        // Pre-select extra diagnostic tools for first-time visits
        if (tool.Tool_Name.includes('Network') || 
            tool.Tool_Name.includes('Scan') ||
            tool.Tool_Name.includes('Diagnostic')) {
          isPreSelected = true;
          reason = 'site_specific';
          reasoning += ' (Recommended for first-time site visit)';
        }
      }
      
      // Known issues adjustments
      if (enhancedContext.known_issues && enhancedContext.known_issues.length > 0) {
        const issuesText = enhancedContext.known_issues.join(' ').toLowerCase();
        
        // Communication issues
        if (issuesText.includes('communication') || issuesText.includes('network')) {
          if (tool.Tool_Name.toLowerCase().includes('laptop') ||
              tool.Tool_Name.toLowerCase().includes('network') ||
              tool.Tool_Name.toLowerCase().includes('cable')) {
            if (priority === 'optional') priority = 'recommended';
            reason = 'site_specific';
            reasoning += ' (Addresses known communication issues)';
          }
        }
        
        // Temperature issues
        if (issuesText.includes('temperature') || issuesText.includes('hvac')) {
          if (tool.Tool_Name.toLowerCase().includes('temperature') ||
              tool.Tool_Name.toLowerCase().includes('infrared') ||
              tool.Tool_Name.toLowerCase().includes('thermo')) {
            if (priority === 'optional') priority = 'recommended';
            isPreSelected = true;
            reason = 'site_specific';
            reasoning += ' (Addresses known temperature issues)';
          }
        }
        
        // Electrical issues
        if (issuesText.includes('electrical') || issuesText.includes('power')) {
          if (tool.Tool_Name.toLowerCase().includes('multimeter') ||
              tool.Tool_Name.toLowerCase().includes('electrical')) {
            if (priority === 'optional') priority = 'recommended';
            isPreSelected = true;
            reason = 'site_specific';
            reasoning += ' (Addresses known electrical issues)';
          }
        }
      }
      
      // Documentation score adjustments
      if (enhancedContext.documentation_score && enhancedContext.documentation_score < 50) {
        // Add extra documentation tools for poorly documented sites
        if (tool.Tool_Name.toLowerCase().includes('camera') ||
            tool.Tool_Name.toLowerCase().includes('documentation') ||
            tool.Tool_Name.toLowerCase().includes('notes')) {
          if (priority === 'optional') priority = 'recommended';
          reason = 'site_specific';
          reasoning += ' (Extra documentation needed for this site)';
        }
      }
      
      // Commissioning status adjustments
      if (enhancedContext.completion_status === 'Commissioning') {
        // Pre-select commissioning-specific tools
        if (tool.Tool_Name.toLowerCase().includes('test') ||
            tool.Tool_Name.toLowerCase().includes('measurement') ||
            tool.Tool_Name.toLowerCase().includes('calibration')) {
          if (priority === 'optional') priority = 'recommended';
          isPreSelected = true;
          reason = 'site_specific';
          reasoning += ' (Required for commissioning phase)';
        }
      }
      
      // Access issues adjustments
      if (enhancedContext.common_access_issues && enhancedContext.common_access_issues.length > 0) {
        const accessIssues = enhancedContext.common_access_issues.join(' ').toLowerCase();
        
        // Remote access issues
        if (accessIssues.includes('remote') || accessIssues.includes('vpn')) {
          if (tool.Tool_Name.toLowerCase().includes('remote') ||
              tool.Tool_Name.toLowerCase().includes('vpn') ||
              tool.Tool_Name.toLowerCase().includes('laptop')) {
            if (priority === 'optional') priority = 'recommended';
            reason = 'site_specific';
            reasoning += ' (Addresses known access challenges)';
          }
        }
      }
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
      reasoning
    });
  }
  
  // Sort by priority (essential first, then recommended, then optional)
  // Then by pre-selected status
  recommendations.sort((a, b) => {
    const priorityOrder = { essential: 0, recommended: 1, optional: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Within same priority, pre-selected items come first
    if (a.isPreSelected && !b.isPreSelected) return -1;
    if (!a.isPreSelected && b.isPreSelected) return 1;
    
    return 0;
  });
  
  return recommendations;
};

/**
 * Generate recommendations directly from customer data
 */
export const generateToolRecommendationsFromCustomer = async (
  customer: Customer
): Promise<ToolRecommendation[]> => {
  const systemType = (customer.system_platform || customer.system_type || 'Other') as any;
  const serviceTier = customer.service_tier;
  
  const enhancedContext: SiteIntelligenceContext = {
    site_experience: customer.site_experience,
    known_issues: customer.known_issues,
    completion_status: customer.completion_status,
    system_platform: customer.system_platform,
    documentation_score: customer.documentation_score,
    system_architecture: customer.system_architecture,
    common_access_issues: customer.common_access_issues
  };
  
  return generateToolRecommendationsWithIntelligence(
    systemType,
    serviceTier,
    enhancedContext
  );
};
