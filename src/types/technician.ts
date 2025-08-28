export interface Technician {
  id: string;
  employee_name: string;
  mobile_phone?: string;
  email: string;
  extension?: string;
  direct_line?: string;
  is_active: boolean;
  hire_date?: string;
  specialties?: string[];
  region?: string;
  created_at?: string;
  updated_at?: string;
}
