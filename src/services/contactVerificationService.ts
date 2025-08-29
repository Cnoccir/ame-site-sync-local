import { supabase } from '@/integrations/supabase/client';

interface ContactVerification {
  id: string;
  customer_id: string;
  visit_id: string;
  contact_method: 'phone' | 'email' | 'text';
  contact_person: string;
  attempted_at: Date;
  successful: boolean;
  response_notes?: string;
}

interface VerificationStatus {
  primaryVerified: boolean;
  secondaryVerified: boolean;
  lastAttempt?: Date;
  recommendations: string[];
}

interface SchedulingCoordination {
  coordinatedWith: string;
  expectedContact: string;
  coordinationNotes: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
}

export class ContactVerificationService {
  // Pre-visit contact verification workflow
  static async initiateContactVerification(customerId: string, visitId: string): Promise<ContactVerification[]> {
    try {
      // Get customer contact information
      const { data: customer, error: customerError } = await supabase
        .from('ame_customers')
        .select(`
          primary_contact,
          contact_phone,
          contact_email,
          secondary_contact_name,
          secondary_contact_phone,
          secondary_contact_email
        `)
        .eq('id', customerId)
        .single();

      if (customerError) {
        console.error('Error getting customer for verification:', customerError);
        return [];
      }

      // Create pending verification entries
      const verifications: ContactVerification[] = [];

      // Primary contact verification
      if (customer.primary_contact && customer.contact_phone) {
        const primaryVerification: ContactVerification = {
          id: crypto.randomUUID(),
          customer_id: customerId,
          visit_id: visitId,
          contact_method: 'phone',
          contact_person: customer.primary_contact,
          attempted_at: new Date(),
          successful: false
        };
        verifications.push(primaryVerification);
      }

      // Secondary contact verification
      if (customer.secondary_contact_name && customer.secondary_contact_phone) {
        const secondaryVerification: ContactVerification = {
          id: crypto.randomUUID(),
          customer_id: customerId,
          visit_id: visitId,
          contact_method: 'phone',
          contact_person: customer.secondary_contact_name,
          attempted_at: new Date(),
          successful: false
        };
        verifications.push(secondaryVerification);
      }

      return verifications;
    } catch (error) {
      console.error('Error initiating contact verification:', error);
      return [];
    }
  }

  // Log contact attempt results
  static async logContactAttempt(
    customerId: string,
    visitId: string,
    method: 'phone' | 'email' | 'text',
    person: string,
    successful: boolean,
    notes?: string
  ): Promise<void> {
    try {
      // Use mock logging since contact_verification_log table doesn't exist
      console.log('Contact attempt:', {
        customer_id: customerId,
        visit_id: visitId,
        contact_method: method,
        contact_person: person,
        attempted_at: new Date().toISOString(),
        successful,
        response_notes: notes
      });


      // Update access intelligence based on contact success
      await this.updateContactIntelligence(customerId, method, successful, notes);
    } catch (error) {
      console.error('Error logging contact attempt:', error);
      throw error;
    }
  }

  // Get contact verification status for visit
  static async getVerificationStatus(visitId: string): Promise<VerificationStatus> {
    try {
      // Mock verification status since table doesn't exist
      const verifications: any[] = [];

      const primaryVerified = false;
      const secondaryVerified = false;
      const lastAttempt = undefined;

      const recommendations = this.generateVerificationRecommendations(
        primaryVerified,
        secondaryVerified,
        verifications || []
      );

      return {
        primaryVerified,
        secondaryVerified,
        lastAttempt,
        recommendations
      };
    } catch (error) {
      console.error('Error getting verification status:', error);
      return {
        primaryVerified: false,
        secondaryVerified: false,
        recommendations: ['Error loading verification status']
      };
    }
  }

  // Update scheduling coordination tracking
  static async updateSchedulingCoordination(
    customerId: string,
    coordinatedWith: string,
    expectedContact: string,
    notes: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('ame_customers')
        .update({
          special_instructions: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);

      if (error) {
        console.error('Error updating scheduling coordination:', error);
        throw error;
      }

      // Log the coordination update (mock)
      console.log('Coordination update:', {
        customer_id: customerId,
        contact_method: 'coordination',
        contact_person: coordinatedWith,
        attempted_at: new Date().toISOString(),
        successful: true,
        response_notes: `Coordinated with ${coordinatedWith}, expecting to meet ${expectedContact}. Notes: ${notes}`
      });
    } catch (error) {
      console.error('Error updating scheduling coordination:', error);
      throw error;
    }
  }

  // Get contact recommendations based on historical data
  static async getContactRecommendations(customerId: string): Promise<{
    bestContactMethod: 'phone' | 'email' | 'text';
    bestContactTime: string;
    successRate: number;
    tips: string[];
  }> {
    try {
      // Mock contact history since table doesn't exist
      const history: any[] = [];

      return {
        bestContactMethod: 'phone',
        bestContactTime: '9:00 AM - 11:00 AM',
        successRate: 0,
        tips: ['No historical contact data available']
      };

    } catch (error) {
      console.error('Error getting contact recommendations:', error);
      return {
        bestContactMethod: 'phone',
        bestContactTime: '9:00 AM - 11:00 AM',
        successRate: 0,
        tips: ['Error loading contact recommendations']
      };
    }
  }

  // Update contact intelligence patterns
  private static async updateContactIntelligence(
    customerId: string,
    method: string,
    successful: boolean,
    notes?: string
  ): Promise<void> {
    try {
      // Mock access intelligence update since table doesn't exist
      console.log('Contact intelligence update:', {
        customer_id: customerId,
        method,
        successful,
        notes
      });
    } catch (error) {
      console.error('Error updating contact intelligence:', error);
    }
  }

  // Generate verification recommendations
  private static generateVerificationRecommendations(
    primaryVerified: boolean,
    secondaryVerified: boolean,
    verifications: any[]
  ): string[] {
    const recommendations: string[] = [];

    if (!primaryVerified && !secondaryVerified) {
      recommendations.push('⚠️ No contacts verified - High risk of access delays');
      recommendations.push('📞 Try calling primary contact before departure');
      recommendations.push('📧 Send confirmation email with arrival time');
    } else if (primaryVerified && !secondaryVerified) {
      recommendations.push('✅ Primary contact verified');
      recommendations.push('📋 Keep secondary contact info handy as backup');
    } else if (!primaryVerified && secondaryVerified) {
      recommendations.push('✅ Secondary contact verified');
      recommendations.push('⚠️ Primary contact not verified - use secondary as main point of contact');
    } else {
      recommendations.push('✅ Both contacts verified - Good to proceed');
    }

    // Add method-specific recommendations
    const failedAttempts = verifications.filter(v => !v.successful);
    if (failedAttempts.length > 0) {
      const failedMethods = [...new Set(failedAttempts.map(v => v.contact_method))];
      recommendations.push(`💡 Consider trying: ${failedMethods.includes('phone') ? 'email or text' : failedMethods.includes('email') ? 'phone or text' : 'phone or email'}`);
    }

    return recommendations;
  }

  // Generate contact tips based on historical data
  private static generateContactTips(
    history: any[],
    methodStats: any,
    successRate: number
  ): string[] {
    const tips: string[] = [];

    if (successRate < 50) {
      tips.push('🎯 Low contact success rate - consider updating contact information');
    }

    if (methodStats.phone.total > methodStats.email.total && methodStats.email.successful > methodStats.phone.successful) {
      tips.push('📧 Email appears more reliable than phone for this contact');
    }

    if (methodStats.text.successful > 0) {
      tips.push('📱 Text messaging has worked well in the past');
    }

    const morningAttempts = history.filter(h => {
      const hour = new Date(h.attempted_at).getHours();
      return hour >= 8 && hour < 12;
    });

    const afternoonAttempts = history.filter(h => {
      const hour = new Date(h.attempted_at).getHours();
      return hour >= 12 && hour < 17;
    });

    if (morningAttempts.length > 0 && afternoonAttempts.length > 0) {
      const morningSuccess = morningAttempts.filter(h => h.successful).length / morningAttempts.length;
      const afternoonSuccess = afternoonAttempts.filter(h => h.successful).length / afternoonAttempts.length;

      if (morningSuccess > afternoonSuccess + 0.2) {
        tips.push('🌅 Morning contact attempts are more successful');
      } else if (afternoonSuccess > morningSuccess + 0.2) {
        tips.push('🌆 Afternoon contact attempts are more successful');
      }
    }

    if (tips.length === 0) {
      tips.push('👍 Contact patterns look normal');
    }

    return tips;
  }

  // Verify contact availability before visit
  static async quickContactCheck(customerId: string, contactMethod: 'phone' | 'email' | 'text' = 'phone'): Promise<{
    available: boolean;
    contactPerson?: string;
    response?: string;
    recommendations: string[];
  }> {
    try {
      // This would integrate with actual communication APIs in a real implementation
      // For now, we'll return mock data based on historical patterns
      const recommendations = await this.getContactRecommendations(customerId);

      // Simulate a quick contact check
      const mockAvailability = Math.random() > 0.3; // 70% chance of availability

      return {
        available: mockAvailability,
        contactPerson: 'Primary Contact',
        response: mockAvailability ? 'Confirmed available for visit' : 'No response received',
        recommendations: mockAvailability ? 
          ['✅ Contact confirmed - proceed with visit'] : 
          ['⚠️ No response - consider trying secondary contact', ...recommendations.tips]
      };
    } catch (error) {
      console.error('Error performing quick contact check:', error);
      return {
        available: false,
        recommendations: ['Error performing contact check']
      };
    }
  }
}

export type { ContactVerification, VerificationStatus, SchedulingCoordination };
