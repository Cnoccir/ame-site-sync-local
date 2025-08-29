import { supabase } from '@/integrations/supabase/client';

export interface AccessRecommendation {
  type: 'timing' | 'contact' | 'approach' | 'general';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number; // 0-100
}

export interface AccessPattern {
  preferredTimes: string[];
  contactPreferences: string[];
  commonIssues: string[];
  successFactors: string[];
  averageAccessTime: number;
  successRate: number;
}

export class AccessIntelligenceService {
  static async logAccessAttempt(
    customerId: string,
    arrivalTime: Date,
    successful: boolean = true,
    issues: string[] = [],
    contactMet: string = '',
    contactName: string = '',
    preferredTimes: string[] = []
  ): Promise<void> {
    try {
      const timeToAccess = successful ? Math.floor(Math.random() * 15) + 5 : 0; // Mock: 5-20 minutes
      
      // Store the access attempt in visit auto_save_data
      const { data: activeVisit } = await supabase
        .from('ame_visits')
        .select('id, auto_save_data')
        .eq('customer_id', customerId)
        .eq('is_active', true)
        .maybeSingle();

      if (activeVisit) {
        const existingData = activeVisit.auto_save_data ? 
          (typeof activeVisit.auto_save_data === 'string' ? 
            JSON.parse(activeVisit.auto_save_data) : activeVisit.auto_save_data) : {};

        const updatedData = {
          ...existingData,
          access_log: {
            customer_id: customerId,
            arrival_time: arrivalTime.toISOString(),
            successful,
            issues,
            contact_met: contactMet,
            time_to_access: timeToAccess,
            contact_name: contactName,
            preferred_times: preferredTimes,
            timestamp: new Date().toISOString()
          }
        };

        await supabase
          .from('ame_visits')
          .update({
            auto_save_data: JSON.stringify(updatedData),
            last_activity: new Date().toISOString()
          })
          .eq('id', activeVisit.id);
      }

    } catch (error) {
      console.error('Error logging access attempt:', error);
    }
  }

  static async getAccessRecommendations(customerId: string): Promise<AccessRecommendation[]> {
    return this.generateAccessRecommendations(customerId);
  }

  static async generateAccessRecommendations(customerId: string): Promise<AccessRecommendation[]> {
    try {
      // Get customer basic access info
      const { data: customer } = await supabase
        .from('ame_customers')
        .select('access_procedure, access_hours, building_access_details, primary_contact, contact_phone')
        .eq('id', customerId)
        .maybeSingle();

      // Get visit history for patterns
      const { data: visitData } = await supabase
        .from('ame_visits')
        .select('auto_save_data, created_at')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(5);

      const accessHistory = [];
      
      if (visitData) {
        for (const visit of visitData) {
          try {
            const autoSaveData = typeof visit.auto_save_data === 'string' ? 
              JSON.parse(visit.auto_save_data) : visit.auto_save_data;
            if (autoSaveData?.access_log) {
              accessHistory.push({
                successful: autoSaveData.access_log.successful || true,
                time_to_access: autoSaveData.access_log.time_to_access || 10,
                contact_met: autoSaveData.access_log.contact_met || '',
                preferred_times: autoSaveData.access_log.preferred_times || []
              });
            }
          } catch (error) {
            // Ignore parse errors
          }
        }
      }

      if (accessHistory.length === 0) {
        return this.getDefaultRecommendations();
      }

      // Calculate success rate and average access time
      const successfulAttempts = accessHistory.filter(attempt => attempt.successful).length;
      const successRate = successfulAttempts / accessHistory.length;
      const avgAccessTime = accessHistory
        .filter(attempt => attempt.successful)
        .reduce((sum, attempt) => sum + (attempt.time_to_access || 10), 0) / 
        Math.max(successfulAttempts, 1);

      const recommendations: AccessRecommendation[] = [];

      // Time-based recommendations
      if (customer?.access_hours) {
        recommendations.push({
          type: 'timing',
          title: 'Optimal Access Times',
          description: `Best access during: ${customer.access_hours}`,
          priority: 'high',
          confidence: 85
        });
      }

      // Contact recommendations
      if (customer?.primary_contact) {
        recommendations.push({
          type: 'contact',
          title: 'Primary Contact',
          description: `Contact ${customer.primary_contact}${customer.contact_phone ? ` at ${customer.contact_phone}` : ''} before arrival`,
          priority: 'high',
          confidence: 90
        });
      }

      // Access procedure recommendations
      if (customer?.access_procedure) {
        recommendations.push({
          type: 'approach',
          title: 'Access Procedure',
          description: customer.access_procedure,
          priority: 'medium',
          confidence: 80
        });
      }

      // Performance-based recommendations
      if (successRate < 0.8) {
        recommendations.push({
          type: 'general',
          title: 'Access Success Rate Low',
          description: `Recent success rate: ${Math.round(successRate * 100)}%. Consider calling ahead to confirm availability.`,
          priority: 'high',
          confidence: 75
        });
      }

      if (avgAccessTime > 15) {
        recommendations.push({
          type: 'timing',
          title: 'Extended Access Time',
          description: `Average access time: ${Math.round(avgAccessTime)} minutes. Plan extra time for site entry.`,
          priority: 'medium',
          confidence: 70
        });
      }

      return recommendations.length > 0 ? recommendations : this.getDefaultRecommendations();

    } catch (error) {
      console.error('Error generating access recommendations:', error);
      return this.getDefaultRecommendations();
    }
  }

  static async storeAccessIntelligence(customerId: string, intelligence: AccessPattern): Promise<void> {
    try {
      // Store intelligence in customer record
      await supabase
        .from('ame_customers')
        .update({
          access_procedure: intelligence.successFactors.join(', '),
          access_hours: intelligence.preferredTimes.join(', '),
          building_access_details: `Success rate: ${intelligence.successRate}%, Avg time: ${intelligence.averageAccessTime}min. Issues: ${intelligence.commonIssues.join(', ')}`
        })
        .eq('id', customerId);

    } catch (error) {
      console.error('Error updating access intelligence:', error);
    }
  }

  private static getDefaultRecommendations(): AccessRecommendation[] {
    return [
      {
        type: 'contact',
        title: 'Call Ahead',
        description: 'Contact site before arrival to ensure availability and smooth access',
        priority: 'high',
        confidence: 80
      },
      {
        type: 'timing',
        title: 'Business Hours',
        description: 'Arrive during normal business hours (8 AM - 5 PM) for best results',
        priority: 'medium',
        confidence: 70
      },
      {
        type: 'approach',
        title: 'Professional Approach',
        description: 'Bring proper identification and explain purpose of visit clearly',
        priority: 'medium',
        confidence: 75
      },
      {
        type: 'general',
        title: 'Allow Extra Time',
        description: 'Plan 10-15 minutes for access procedures and security checks',
        priority: 'low',
        confidence: 60
      }
    ];
  }

  static async getAccessPattern(customerId: string): Promise<AccessPattern> {
    try {
      const { data: customer } = await supabase
        .from('ame_customers')
        .select('access_procedure, access_hours, building_access_details')
        .eq('id', customerId)
        .maybeSingle();

      const { data: visitData } = await supabase
        .from('ame_visits')
        .select('auto_save_data')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10);

      const accessHistory = [];
      
      if (visitData) {
        for (const visit of visitData) {
          try {
            const autoSaveData = typeof visit.auto_save_data === 'string' ? 
              JSON.parse(visit.auto_save_data) : visit.auto_save_data;
            if (autoSaveData?.access_log) {
              accessHistory.push(autoSaveData.access_log);
            }
          } catch (error) {
            // Ignore parse errors
          }
        }
      }

      const successfulAttempts = accessHistory.filter(attempt => attempt.successful);
      const successRate = accessHistory.length > 0 ? successfulAttempts.length / accessHistory.length : 0.8;
      const avgAccessTime = successfulAttempts.length > 0 ? 
        successfulAttempts.reduce((sum, attempt) => sum + (attempt.time_to_access || 10), 0) / successfulAttempts.length : 10;

      return {
        preferredTimes: customer?.access_hours ? [customer.access_hours] : ['9:00 AM - 4:00 PM'],
        contactPreferences: customer?.access_procedure ? [customer.access_procedure] : ['Call ahead'],
        commonIssues: [],
        successFactors: customer?.building_access_details ? [customer.building_access_details] : [],
        averageAccessTime: avgAccessTime,
        successRate: successRate
      };

    } catch (error) {
      console.error('Error getting access pattern:', error);
      return {
        preferredTimes: ['9:00 AM - 4:00 PM'],
        contactPreferences: ['Call ahead'],
        commonIssues: [],
        successFactors: [],
        averageAccessTime: 10,
        successRate: 0.8
      };
    }
  }
}