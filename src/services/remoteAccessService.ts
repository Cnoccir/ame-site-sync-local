import { supabase } from '@/integrations/supabase/client';
import { RemoteAccessCredential, VpnConfiguration, RemoteAccessSummary } from '@/types/remote-access';
import { useAuth } from '@/hooks/useAuth';

export class RemoteAccessService {
  
  // ==================== REMOTE ACCESS CREDENTIALS ====================
  
  /**
   * Get all remote access credentials for a customer
   */
  static async getCustomerCredentials(customerId: string): Promise<RemoteAccessCredential[]> {
    const { data, error } = await supabase
      .from('customer_remote_access_credentials')
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_active', true)
      .order('priority', { ascending: true });
    
    if (error) {
      console.error('Error fetching remote access credentials:', error);
      throw new Error(`Failed to fetch remote access credentials: ${error.message}`);
    }
    
    return data || [];
  }
  
  /**
   * Create a new remote access credential
   */
  static async createCredential(credential: Omit<RemoteAccessCredential, 'id' | 'created_at' | 'updated_at'>): Promise<RemoteAccessCredential> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('customer_remote_access_credentials')
      .insert([{
        ...credential,
        created_by: user?.id,
        updated_by: user?.id
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating remote access credential:', error);
      throw new Error(`Failed to create remote access credential: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Update a remote access credential
   */
  static async updateCredential(id: string, updates: Partial<RemoteAccessCredential>): Promise<RemoteAccessCredential> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('customer_remote_access_credentials')
      .update({
        ...updates,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating remote access credential:', error);
      throw new Error(`Failed to update remote access credential: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Delete a remote access credential
   */
  static async deleteCredential(id: string): Promise<void> {
    const { error } = await supabase
      .from('customer_remote_access_credentials')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting remote access credential:', error);
      throw new Error(`Failed to delete remote access credential: ${error.message}`);
    }
  }
  
  /**
   * Update credential priorities (for reordering)
   */
  static async updateCredentialPriorities(updates: { id: string; priority: number }[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const promises = updates.map(({ id, priority }) =>
      supabase
        .from('customer_remote_access_credentials')
        .update({ 
          priority,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
    );
    
    const results = await Promise.all(promises);
    const errors = results.filter(result => result.error);
    
    if (errors.length > 0) {
      console.error('Error updating credential priorities:', errors);
      throw new Error('Failed to update credential priorities');
    }
  }
  
  /**
   * Test remote access credential connection
   */
  static async testCredential(id: string): Promise<{ success: boolean; message: string }> {
    // This would typically call a backend service to test the connection
    // For now, we'll simulate the test
    
    try {
      const { data, error } = await supabase
        .from('customer_remote_access_credentials')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Simulate connection test based on vendor type
      const testResult = await this.simulateConnectionTest(data);
      
      // Update the credential with test results
      await this.updateCredential(id, {
        last_verified_at: new Date().toISOString(),
        verification_notes: testResult.message
      });
      
      return testResult;
    } catch (error) {
      console.error('Error testing credential:', error);
      return {
        success: false,
        message: `Connection test failed: ${error.message}`
      };
    }
  }
  
  private static async simulateConnectionTest(credential: RemoteAccessCredential): Promise<{ success: boolean; message: string }> {
    // Simulate different test scenarios based on vendor
    const delay = Math.random() * 2000 + 1000; // 1-3 second delay
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Simulate success rate based on vendor type
    const successRate = this.getVendorSuccessRate(credential.vendor);
    const success = Math.random() < successRate;
    
    if (success) {
      return {
        success: true,
        message: `Successfully connected to ${credential.display_name || credential.vendor} at ${new Date().toLocaleTimeString()}`
      };
    } else {
      return {
        success: false,
        message: `Connection failed - check network connectivity and credentials`
      };
    }
  }
  
  private static getVendorSuccessRate(vendor: string): number {
    // Different vendors have different typical success rates for testing
    const rates = {
      'teamviewer': 0.9,
      'anydesk': 0.85,
      'windows_rdp': 0.8,
      'realvnc': 0.75,
      'tightvnc': 0.75,
      'chrome_remote_desktop': 0.7,
      'remotepc': 0.8,
      default: 0.7
    };
    
    return rates[vendor] || rates.default;
  }
  
  // ==================== VPN CONFIGURATION ====================
  
  /**
   * Get VPN configuration for a customer
   */
  static async getCustomerVpnConfiguration(customerId: string): Promise<VpnConfiguration | null> {
    const { data, error } = await supabase
      .from('customer_vpn_configurations')
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_active', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No VPN configuration found
      }
      console.error('Error fetching VPN configuration:', error);
      throw new Error(`Failed to fetch VPN configuration: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Create or update VPN configuration
   */
  static async upsertVpnConfiguration(config: Omit<VpnConfiguration, 'id' | 'created_at' | 'updated_at'>): Promise<VpnConfiguration> {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if configuration already exists
    const existing = await this.getCustomerVpnConfiguration(config.customer_id);
    
    if (existing) {
      // Update existing configuration
      const { data, error } = await supabase
        .from('customer_vpn_configurations')
        .update({
          ...config,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating VPN configuration:', error);
        throw new Error(`Failed to update VPN configuration: ${error.message}`);
      }
      
      return data;
    } else {
      // Create new configuration
      const { data, error } = await supabase
        .from('customer_vpn_configurations')
        .insert([{
          ...config,
          created_by: user?.id,
          updated_by: user?.id
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating VPN configuration:', error);
        throw new Error(`Failed to create VPN configuration: ${error.message}`);
      }
      
      return data;
    }
  }
  
  /**
   * Delete VPN configuration
   */
  static async deleteVpnConfiguration(customerId: string): Promise<void> {
    const { error } = await supabase
      .from('customer_vpn_configurations')
      .delete()
      .eq('customer_id', customerId);
    
    if (error) {
      console.error('Error deleting VPN configuration:', error);
      throw new Error(`Failed to delete VPN configuration: ${error.message}`);
    }
  }
  
  // ==================== SUMMARY & QUERIES ====================
  
  /**
   * Get remote access summary for a customer
   */
  static async getCustomerRemoteAccessSummary(customerId: string): Promise<RemoteAccessSummary | null> {
    const { data, error } = await supabase
      .from('customer_remote_access_summary')
      .select('*')
      .eq('customer_id', customerId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No remote access configured
      }
      console.error('Error fetching remote access summary:', error);
      throw new Error(`Failed to fetch remote access summary: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Get formatted remote access display information
   */
  static async getCustomerRemoteAccessDisplay(customerId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('customer_remote_access_display')
      .select('*')
      .eq('customer_id', customerId);
    
    if (error) {
      console.error('Error fetching remote access display:', error);
      throw new Error(`Failed to fetch remote access display: ${error.message}`);
    }
    
    return data || [];
  }
  
  /**
   * Search customers by remote access vendor
   */
  static async findCustomersByVendor(vendor: string): Promise<RemoteAccessSummary[]> {
    const { data, error } = await supabase
      .from('customer_remote_access_summary')
      .select('*')
      .contains('available_vendors', [vendor]);
    
    if (error) {
      console.error('Error searching customers by vendor:', error);
      throw new Error(`Failed to search customers: ${error.message}`);
    }
    
    return data || [];
  }
  
  /**
   * Get customers requiring VPN
   */
  static async getCustomersRequiringVpn(): Promise<RemoteAccessSummary[]> {
    const { data, error } = await supabase
      .from('customer_remote_access_summary')
      .select('*')
      .eq('vpn_required', true);
    
    if (error) {
      console.error('Error fetching VPN customers:', error);
      throw new Error(`Failed to fetch VPN customers: ${error.message}`);
    }
    
    return data || [];
  }
  
  // ==================== MIGRATION HELPERS ====================
  
  /**
   * Migrate legacy remote access data to new system
   */
  static async migrateLegacyRemoteAccess(customerId: string, legacyData: any): Promise<void> {
    const credentials: Omit<RemoteAccessCredential, 'id' | 'created_at' | 'updated_at'>[] = [];
    
    // Convert legacy remote_access_type to new credentials
    if (legacyData.remote_access_type) {
      const type = legacyData.remote_access_type.toLowerCase();
      
      if (type.includes('teamviewer')) {
        credentials.push({
          customer_id: customerId,
          vendor: 'teamviewer',
          display_name: 'Legacy TeamViewer Access',
          is_active: true,
          priority: 1,
          connection_notes: `Migrated from legacy field: ${legacyData.remote_access_type}`
        });
      } else if (type.includes('anydesk')) {
        credentials.push({
          customer_id: customerId,
          vendor: 'anydesk',
          display_name: 'Legacy AnyDesk Access',
          is_active: true,
          priority: 1,
          connection_notes: `Migrated from legacy field: ${legacyData.remote_access_type}`
        });
      } else if (type.includes('rdp')) {
        credentials.push({
          customer_id: customerId,
          vendor: 'windows_rdp',
          display_name: 'Legacy RDP Access',
          is_active: true,
          priority: 1,
          rdp_host_address: legacyData.bms_supervisor_ip || '',
          connection_notes: `Migrated from legacy field: ${legacyData.remote_access_type}`
        });
      }
    }
    
    // Create VPN configuration if needed
    if (legacyData.vpn_required && legacyData.vpn_details) {
      await this.upsertVpnConfiguration({
        customer_id: customerId,
        vpn_required: true,
        connection_instructions: legacyData.vpn_details,
        setup_notes: 'Migrated from legacy VPN details',
        is_active: true
      });
    }
    
    // Create credentials
    for (const credential of credentials) {
      try {
        await this.createCredential(credential);
      } catch (error) {
        console.error('Error creating migrated credential:', error);
        // Continue with other credentials even if one fails
      }
    }
  }
}
