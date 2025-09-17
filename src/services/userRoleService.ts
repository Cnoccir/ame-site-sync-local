// User role and permission management
import { useAuth } from '@/hooks/useAuth';

export interface UserRole {
  role: 'admin' | 'tech' | 'manager';
  permissions: string[];
}

export const USER_ROLES = {
  ADMIN: 'admin',
  TECH: 'tech', 
  MANAGER: 'manager'
} as const;

export const USER_PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  MANAGE_CUSTOMERS: 'manage_customers',
  VIEW_CUSTOMERS: 'view_customers',
  PERFORM_PM_TASKS: 'perform_pm_tasks',
  GENERATE_REPORTS: 'generate_reports',
  VIEW_REPORTS: 'view_reports',
  MANAGE_PROJECTS: 'manage_projects',
  VIEW_PROJECTS: 'view_projects',
  SYSTEM_ADMIN: 'system_admin',
  HELP_ACCESS: 'help_access'
} as const;

// Role definitions with permissions
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [USER_ROLES.ADMIN]: [
    USER_PERMISSIONS.VIEW_DASHBOARD,
    USER_PERMISSIONS.MANAGE_CUSTOMERS,
    USER_PERMISSIONS.VIEW_CUSTOMERS,
    USER_PERMISSIONS.PERFORM_PM_TASKS,
    USER_PERMISSIONS.GENERATE_REPORTS,
    USER_PERMISSIONS.VIEW_REPORTS,
    USER_PERMISSIONS.MANAGE_PROJECTS,
    USER_PERMISSIONS.VIEW_PROJECTS,
    USER_PERMISSIONS.SYSTEM_ADMIN,
    USER_PERMISSIONS.HELP_ACCESS
  ],
  [USER_ROLES.TECH]: [
    USER_PERMISSIONS.PERFORM_PM_TASKS,
    USER_PERMISSIONS.GENERATE_REPORTS,
    USER_PERMISSIONS.VIEW_REPORTS,
    USER_PERMISSIONS.VIEW_CUSTOMERS,
    USER_PERMISSIONS.HELP_ACCESS
  ],
  [USER_ROLES.MANAGER]: [
    USER_PERMISSIONS.VIEW_DASHBOARD,
    USER_PERMISSIONS.VIEW_CUSTOMERS,
    USER_PERMISSIONS.PERFORM_PM_TASKS,
    USER_PERMISSIONS.GENERATE_REPORTS,
    USER_PERMISSIONS.VIEW_REPORTS,
    USER_PERMISSIONS.VIEW_PROJECTS,
    USER_PERMISSIONS.HELP_ACCESS
  ]
};

export class UserRoleService {
  
  // Get user role from auth context or email domain
  static getUserRole(user: any): string {
    if (!user) return USER_ROLES.TECH;
    
    // Development override for testing
    if (process.env.NODE_ENV === 'development') {
      const devOverride = localStorage.getItem('dev_role_override');
      if (devOverride && Object.values(USER_ROLES).includes(devOverride as any)) {
        return devOverride;
      }
    }
    
    // Check if role is explicitly set in user metadata
    if (user.user_metadata?.role) {
      return user.user_metadata.role;
    }
    
    // Check email domain for role inference
    const email = user.email?.toLowerCase() || '';
    
    // Admin domains/emails  
    if (email.includes('@admin.ame') || email.includes('@management.ame') || email === 'admin@ame-inc.com') {
      return USER_ROLES.ADMIN;
    }
    
    // Manager indicators
    if (email.includes('manager') || email.includes('supervisor') || email.includes('lead')) {
      return USER_ROLES.MANAGER;
    }
    
    // Tech user for testing
    if (email === 'tech@ame-inc.com') {
      return USER_ROLES.TECH;
    }
    
    // Default to tech for field workers
    return USER_ROLES.TECH;
  }
  
  // Check if user has specific permission
  static hasPermission(user: any, permission: string): boolean {
    const role = this.getUserRole(user);
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  }
  
  // Check if user has any of the provided permissions
  static hasAnyPermission(user: any, permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(user, permission));
  }
  
  // Get all permissions for user's role
  static getUserPermissions(user: any): string[] {
    const role = this.getUserRole(user);
    return ROLE_PERMISSIONS[role] || [];
  }
  
  // Check if user is admin
  static isAdmin(user: any): boolean {
    return this.getUserRole(user) === USER_ROLES.ADMIN;
  }
  
  // Check if user is tech
  static isTech(user: any): boolean {
    return this.getUserRole(user) === USER_ROLES.TECH;
  }
  
  // Check if user is manager
  static isManager(user: any): boolean {
    return this.getUserRole(user) === USER_ROLES.MANAGER;
  }
}

// Hook for easy role checking in components
export function useUserRole() {
  const { user } = useAuth();
  
  return {
    role: UserRoleService.getUserRole(user),
    permissions: UserRoleService.getUserPermissions(user),
    hasPermission: (permission: string) => UserRoleService.hasPermission(user, permission),
    hasAnyPermission: (permissions: string[]) => UserRoleService.hasAnyPermission(user, permissions),
    isAdmin: UserRoleService.isAdmin(user),
    isTech: UserRoleService.isTech(user),
    isManager: UserRoleService.isManager(user)
  };
}
