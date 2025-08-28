import { supabase } from '../lib/supabase';

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
        .from('customers')
        .select(`
          primary_contact,
          contact_phone,
          contact_email,
          secondary_contact,
          secondary_phone,
          secondary_email
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
      if (customer.secondary_contact && customer.secondary_phone) {
        const secondaryVerification: ContactVerification = {
          id: crypto.randomUUID(),
          customer_id: customerId,
          visit_id: visitId,
          contact_method: 'phone',
          contact_person: customer.secondary_contact,
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
      const { error } = await supabase
        .from('contact_verification_log')
        .insert({
          customer_id: customerId,
          visit_id: visitId,
          contact_method: method,
          contact_person: person,
          attempted_at: new Date().toISOString(),
          successful,
          response_notes: notes
        });

      if (error) {
        console.error('Error logging contact attempt:', error);
        throw error;
      }

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
      const { data: verifications, error } = await supabase
        .from('contact_verification_log')
        .select('*')
        .eq('visit_id', visitId)
        .order('attempted_at', { ascending: false });

      if (error) {
        console.error('Error getting verification status:', error);
        return {
          primaryVerified: false,
          secondaryVerified: false,
          recommendations: ['Unable to load verification status']
        };
      }

      const primaryVerified = verifications?.some(v => 
        v.contact_person.toLowerCase().includes('primary') && v.successful
      ) || false;

      const secondaryVerified = verifications?.some(v => 
        v.contact_person.toLowerCase().includes('secondary') && v.successful
      ) || false;

      const lastAttempt = verifications?.[0] ? new Date(verifications[0].attempted_at) : undefined;

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
        .from('customers')
        .update({
          scheduling_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);

      if (error) {
        console.error('Error updating scheduling coordination:', error);
        throw error;
      }

      // Log the coordination update
      await supabase
        .from('contact_verification_log')
        .insert({
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
      const { data: history, error } = await supabase
        .from('contact_verification_log')
        .select('*')
        .eq('customer_id', customerId)
        .order('attempted_at', { ascending: false })
        .limit(10);

      if (error || !history || history.length === 0) {
        return {
          bestContactMethod: 'phone',
          bestContactTime: '9:00 AM - 11:00 AM',
          successRate: 0,
          tips: ['No historical contact data available']
        };
      }

      // Analyze success rates by method
      const methodStats = {
        phone: { total: 0, successful: 0 },
        email: { total: 0, successful: 0 },
        text: { total: 0, successful: 0 }
      };

      history.forEach(attempt => {
        if (attempt.contact_method in methodStats) {
          methodStats[attempt.contact_method].total++;
          if (attempt.successful) {
            methodStats[attempt.contact_method].successful++;
          }
        }
      });

      // Find best method
      let bestMethod: 'phone' | 'email' | 'text' = 'phone';
      let bestRate = 0;

      Object.entries(methodStats).forEach(([method, stats]) => {
        if (stats.total > 0) {
          const rate = stats.successful / stats.total;
          if (rate > bestRate) {
            bestRate = rate;
            bestMethod = method as 'phone' | 'email' | 'text';
          }
        }
      });

      // Analyze timing patterns
      const successfulTimes = history
        .filter(attempt => attempt.successful)
        .map(attempt => new Date(attempt.attempted_at).getHours());

      let bestTime = '9:00 AM - 11:00 AM';
      if (successfulTimes.length > 0) {
        const avgHour = successfulTimes.reduce((sum, hour) => sum + hour, 0) / successfulTimes.length;
        if (avgHour < 10) {
          bestTime = '8:00 AM - 10:00 AM';
        } else if (avgHour > 14) {
          bestTime = '2:00 PM - 4:00 PM';
        }
      }

      const overallSuccessRate = history.length > 0 ? 
        (history.filter(h => h.successful).length / history.length) * 100 : 0;

      const tips = this.generateContactTips(history, methodStats, overallSuccessRate);

      return {
        bestContactMethod: bestMethod,
        bestContactTime: bestTime,
        successRate: Math.round(overallSuccessRate),
        tips
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
      // Get or create access intelligence record
      let { data: accessIntel, error: fetchError } = await supabase
        .from('access_intelligence')
        .select('*')
        .eq('customer_id', customerId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching access intelligence:', fetchError);
        return;
      }

      if (!accessIntel) {
        // Create new record
        const { error: insertError } = await supabase
          .from('access_intelligence')
          .insert({
            customer_id: customerId,
            access_success_rate: successful ? 1.0 : 0.0,
            learned_patterns: {
              contact_methods: { [method]: { total: 1, successful: successful ? 1 : 0 } }
            },
            last_updated: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error creating access intelligence:', insertError);
        }
      } else {
        // Update existing record
        const patterns = accessIntel.learned_patterns || {};
        const contactMethods = patterns.contact_methods || {};
        const methodStats = contactMethods[method] || { total: 0, successful: 0 };

        methodStats.total++;
        if (successful) methodStats.successful++;

        contactMethods[method] = methodStats;
        patterns.contact_methods = contactMethods;

        // Recalculate overall success rate
        const totalAttempts = Object.values(contactMethods).reduce(
          (sum, stats: any) => sum + stats.total, 0
        );
        const totalSuccessful = Object.values(contactMethods).reduce(
          (sum, stats: any) => sum + stats.successful, 0
        );

        const newSuccessRate = totalAttempts > 0 ? totalSuccessful / totalAttempts : 0;

        const { error: updateError } = await supabase
          .from('access_intelligence')
          .update({
            access_success_rate: newSuccessRate,
            learned_patterns: patterns,
            last_updated: new Date().toISOString()
          })
          .eq('customer_id', customerId);

        if (updateError) {
          console.error('Error updating access intelligence:', updateError);
        }
      }
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
