/**
 * Technician Service - Handles technician data and search
 * Currently uses mock data, can be extended with Google Sheets integration
 */

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'primary' | 'secondary' | 'lead' | 'apprentice';
  specialties: string[];
  isActive: boolean;
}

export class TechnicianService {
  // Mock technician data - replace with Google Sheets or database integration
  private static mockTechnicians: Technician[] = [
    {
      id: 'tech_001',
      name: 'John Smith',
      email: 'j.smith@amecontrols.com',
      phone: '(555) 123-4567',
      role: 'lead',
      specialties: ['Niagara', 'BACnet', 'Commissioning'],
      isActive: true
    },
    {
      id: 'tech_002', 
      name: 'Jane Doe',
      email: 'j.doe@amecontrols.com',
      phone: '(555) 234-5678',
      role: 'primary',
      specialties: ['Johnson Controls', 'Honeywell', 'Energy Management'],
      isActive: true
    },
    {
      id: 'tech_003',
      name: 'Mike Johnson', 
      email: 'm.johnson@amecontrols.com',
      phone: '(555) 345-6789',
      role: 'primary',
      specialties: ['Siemens', 'Schneider', 'Network Troubleshooting'],
      isActive: true
    },
    {
      id: 'tech_004',
      name: 'Sarah Wilson',
      email: 's.wilson@amecontrols.com', 
      phone: '(555) 456-7890',
      role: 'secondary',
      specialties: ['Graphics', 'Training', 'Documentation'],
      isActive: true
    },
    {
      id: 'tech_005',
      name: 'David Brown',
      email: 'd.brown@amecontrols.com',
      phone: '(555) 567-8901', 
      role: 'apprentice',
      specialties: ['Installation', 'Basic Programming'],
      isActive: true
    }
  ];

  /**
   * Search technicians by name or specialties
   */
  static async searchTechnicians(query: string): Promise<Technician[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const searchTerm = query.toLowerCase().trim();
    
    return this.mockTechnicians.filter(tech =>
      tech.isActive && (
        tech.name.toLowerCase().includes(searchTerm) ||
        tech.email.toLowerCase().includes(searchTerm) ||
        tech.specialties.some(spec => spec.toLowerCase().includes(searchTerm))
      )
    ).sort((a, b) => {
      // Prioritize by role: lead > primary > secondary > apprentice
      const roleOrder = { 'lead': 0, 'primary': 1, 'secondary': 2, 'apprentice': 3 };
      return roleOrder[a.role] - roleOrder[b.role];
    });
  }

  /**
   * Get all active technicians
   */
  static async getAllActiveTechnicians(): Promise<Technician[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return this.mockTechnicians
      .filter(tech => tech.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get technician by ID
   */
  static async getTechnicianById(id: string): Promise<Technician | null> {
    if (!id) return null;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return this.mockTechnicians.find(tech => tech.id === id) || null;
  }

  /**
   * Get technicians by role
   */
  static async getTechniciansByRole(role: Technician['role']): Promise<Technician[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return this.mockTechnicians
      .filter(tech => tech.isActive && tech.role === role)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Format technician display name
   */
  static formatTechnicianName(tech: Technician): string {
    return `${tech.name} (${tech.role.charAt(0).toUpperCase() + tech.role.slice(1)})`;
  }

  /**
   * Format technician for dropdown display
   */
  static formatTechnicianDropdown(tech: Technician): string {
    const specialtyText = tech.specialties.slice(0, 2).join(', ');
    return `${tech.name} • ${tech.role} • ${specialtyText}`;
  }

  // TODO: Replace with Google Sheets integration
  // Example Google Sheets API integration:
  /*
  static async fetchTechniciansFromGoogleSheets(): Promise<Technician[]> {
    const SHEET_ID = 'your-google-sheet-id';
    const API_KEY = 'your-api-key';
    const RANGE = 'Technicians!A2:G'; // Adjust range as needed
    
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`
    );
    
    const data = await response.json();
    
    return data.values?.map((row: string[]) => ({
      id: row[0],
      name: row[1], 
      email: row[2],
      phone: row[3],
      role: row[4] as Technician['role'],
      specialties: row[5]?.split(',').map(s => s.trim()) || [],
      isActive: row[6]?.toLowerCase() === 'true'
    })) || [];
  }
  */
}

export default TechnicianService;
