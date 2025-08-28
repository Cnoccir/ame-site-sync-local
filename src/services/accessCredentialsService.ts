import { supabase } from '@/integrations/supabase/client';

export interface AccessCredential {
  id?: string;
  customer_id?: string;
  access_name: string;
  system_type: 'computer_pc' | 'web_portal' | 'vpn_client' | 'remote_desktop' | 'ssh_terminal' | 'mobile_app' | 'custom_software';
  description?: string;
  host_address?: string;
  port_number?: number;
  protocol?: string;
  username?: string;
  password_encrypted?: string;
  requires_2fa: boolean;
  auth_method?: string;
  additional_auth_details?: string;
  requires_vpn: boolean;
  vpn_config_name?: string;
  network_requirements?: string;
  connection_instructions?: string;
  troubleshooting_notes?: string;
  has_attachment: boolean;
  access_level: 'standard' | 'admin' | 'readonly';
  is_active: boolean;
  test_status?: 'working' | 'failed' | 'untested';
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  last_tested?: string;
}

export interface CredentialTemplate {
  id: string;
  template_name: string;
  system_type: AccessCredential['system_type'];
  required_fields: string[];
  optional_fields: string[];
  instruction_template: string;
  default_port?: number;
  default_protocol?: string;
  created_at?: string;
  is_active: boolean;
}

export class AccessCredentialsService {
  /**
   * Get all credential templates
   */
  static async getTemplates(): Promise<CredentialTemplate[]> {
    const { data, error } = await supabase
      .from('access_credential_templates')
      .select('*')
      .eq('is_active', true)
      .order('template_name');

    if (error) {
      console.error('Error fetching credential templates:', error);
      throw new Error('Failed to fetch credential templates');
    }

    return data || [];
  }

  /**
   * Get credentials for a specific customer
   */
  static async getCustomerCredentials(customerId: string): Promise<AccessCredential[]> {
    const { data, error } = await supabase
      .from('customer_access_credentials')
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_active', true)
      .order('access_name');

    if (error) {
      console.error('Error fetching customer credentials:', error);
      throw new Error('Failed to fetch customer credentials');
    }

    return data || [];
  }

  /**
   * Save credentials for a customer
   */
  static async saveCustomerCredentials(
    customerId: string, 
    credentials: Omit<AccessCredential, 'id' | 'customer_id' | 'created_at' | 'updated_at'>[]
  ): Promise<AccessCredential[]> {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // First, mark all existing credentials as inactive
    await supabase
      .from('customer_access_credentials')
      .update({ 
        is_active: false, 
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('customer_id', customerId);

    // Then insert new credentials
    const credentialsToInsert = credentials.map(cred => ({
      ...cred,
      customer_id: customerId,
      created_by: userId,
      updated_by: userId,
      password_encrypted: cred.password_encrypted ? this.encryptPassword(cred.password_encrypted) : undefined
    }));

    const { data, error } = await supabase
      .from('customer_access_credentials')
      .insert(credentialsToInsert)
      .select();

    if (error) {
      console.error('Error saving credentials:', error);
      throw new Error('Failed to save credentials');
    }

    return data || [];
  }

  /**
   * Update a specific credential
   */
  static async updateCredential(
    credentialId: string,
    updates: Partial<Omit<AccessCredential, 'id' | 'customer_id' | 'created_at'>>
  ): Promise<AccessCredential> {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    const updateData = {
      ...updates,
      updated_by: userId,
      updated_at: new Date().toISOString(),
      password_encrypted: updates.password_encrypted ? this.encryptPassword(updates.password_encrypted) : undefined
    };

    const { data, error } = await supabase
      .from('customer_access_credentials')
      .update(updateData)
      .eq('id', credentialId)
      .select()
      .single();

    if (error) {
      console.error('Error updating credential:', error);
      throw new Error('Failed to update credential');
    }

    return data;
  }

  /**
   * Delete a credential (mark as inactive)
   */
  static async deleteCredential(credentialId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    const { error } = await supabase
      .from('customer_access_credentials')
      .update({ 
        is_active: false,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', credentialId);

    if (error) {
      console.error('Error deleting credential:', error);
      throw new Error('Failed to delete credential');
    }
  }

  /**
   * Test a credential's connectivity
   */
  static async testCredential(credentialId: string): Promise<{ success: boolean; message: string }> {
    // This would implement actual connectivity testing
    // For now, just update the test status
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    const { error } = await supabase
      .from('customer_access_credentials')
      .update({
        test_status: 'untested', // Would be 'working' or 'failed' based on actual test
        last_tested: new Date().toISOString(),
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', credentialId);

    if (error) {
      console.error('Error updating test status:', error);
      throw new Error('Failed to update test status');
    }

    return { success: true, message: 'Test completed' };
  }

  /**
   * Upload a document for a credential
   */
  static async uploadCredentialDocument(
    credentialId: string,
    file: File,
    metadata: {
      document_title?: string;
      description?: string;
      version?: string;
    }
  ): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Upload file to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${credentialId}-${Date.now()}.${fileExt}`;
    const filePath = `credential-docs/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw new Error('Failed to upload document');
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Save document metadata
    const { data, error } = await supabase
      .from('customer_access_documents')
      .insert({
        credential_id: credentialId,
        filename: file.name,
        file_type: fileExt,
        file_size: file.size,
        mime_type: file.type,
        storage_path: filePath,
        storage_url: publicUrl,
        document_title: metadata.document_title || file.name,
        description: metadata.description,
        version: metadata.version,
        uploaded_by: userId,
        is_sensitive: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving document metadata:', error);
      throw new Error('Failed to save document metadata');
    }

    // Update credential to mark as having attachment
    await supabase
      .from('customer_access_credentials')
      .update({
        has_attachment: true,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', credentialId);

    return publicUrl;
  }

  /**
   * Simple password encryption (in production, use proper encryption)
   */
  private static encryptPassword(password: string): string {
    // In production, implement proper encryption
    // For now, just base64 encode as a placeholder
    return btoa(password);
  }

  /**
   * Decrypt password (in production, use proper decryption)
   */
  static decryptPassword(encryptedPassword: string): string {
    // In production, implement proper decryption
    try {
      return atob(encryptedPassword);
    } catch {
      return encryptedPassword; // Return as-is if not base64
    }
  }

  /**
   * Generate connection instructions from template
   */
  static generateInstructionsFromTemplate(
    template: string,
    credential: Partial<AccessCredential>
  ): string {
    let instructions = template;
    
    // Replace placeholders with actual values
    instructions = instructions.replace(/\{username\}/g, credential.username || '[USERNAME]');
    instructions = instructions.replace(/\{password\}/g, '[PASSWORD]');
    instructions = instructions.replace(/\{host_address\}/g, credential.host_address || '[HOST_ADDRESS]');
    instructions = instructions.replace(/\{port_number\}/g, credential.port_number?.toString() || '[PORT]');
    instructions = instructions.replace(/\{vpn_config_name\}/g, credential.vpn_config_name || '[VPN_CONFIG]');
    
    return instructions;
  }

  /**
   * Convert legacy credentials to new format
   */
  static convertLegacyCredentials(legacyData: any): AccessCredential[] {
    const credentials: AccessCredential[] = [];

    // Convert PC/Computer login
    if (legacyData.pc_username || legacyData.pc_password) {
      credentials.push({
        access_name: 'Main Control Computer',
        system_type: 'computer_pc',
        description: 'Primary workstation/PC login for on-site access',
        username: legacyData.pc_username || '',
        password_encrypted: legacyData.pc_password || '',
        requires_2fa: false,
        requires_vpn: false,
        has_attachment: false,
        access_level: 'standard',
        is_active: true,
        connection_instructions: `Log into the local workstation/PC using these credentials:
1. Power on the computer
2. Wait for login screen
3. Enter username: {username}
4. Enter password: {password}
5. Press Enter or click Sign In`
      });
    }

    // Convert Web Portal
    if (legacyData.web_supervisor_url || legacyData.platform_username || legacyData.platform_password) {
      credentials.push({
        access_name: 'Web Supervisor Portal',
        system_type: 'web_portal',
        description: 'BMS Web Supervisor Access',
        host_address: legacyData.web_supervisor_url || '',
        username: legacyData.platform_username || '',
        password_encrypted: legacyData.platform_password || '',
        requires_2fa: false,
        requires_vpn: legacyData.vpn_required || false,
        has_attachment: false,
        access_level: 'standard',
        is_active: true,
        connection_instructions: `Access the web portal:
1. Open web browser
2. Navigate to: {host_address}
3. Enter Username: {username}
4. Enter Password: {password}
5. Complete any 2FA if prompted`
      });
    }

    // Convert VPN
    if (legacyData.vpn_required && legacyData.vpn_details) {
      credentials.push({
        access_name: 'VPN Connection',
        system_type: 'vpn_client',
        description: 'VPN required for remote access',
        username: '',
        password_encrypted: '',
        requires_2fa: false,
        requires_vpn: true,
        vpn_config_name: legacyData.remote_access_type || 'VPN',
        connection_instructions: legacyData.vpn_details || '',
        has_attachment: false,
        access_level: 'standard',
        is_active: true
      });
    }

    return credentials;
  }
}

export default AccessCredentialsService;
