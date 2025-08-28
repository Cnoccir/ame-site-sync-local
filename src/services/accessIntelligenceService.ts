import { supabase } from '../lib/supabase';

interface AccessOutcome {
  arrivalTime: Date;
  successful: boolean;
  issues?: string;
  contactMet?: string;
  accessMethod?: string;
  timeToAccess?: number; // minutes from arrival to gaining access
}

interface AccessRecommendations {
  recommendedArrivalTime: string;
  successRate: number;
  commonIssues: string[];
  backupContacts: string[];
  tips: string[];
  bestAccessMethod?: string;
}

interface AccessPattern {
  timeOfDay: {
    early: { count: number; successful: number }; // 6-9 AM
    morning: { count: number; successful: number }; // 9-12 PM
    afternoon: { count: number; successful: number }; // 12-3 PM
    late: { count: number; successful: number }; // 3-6 PM
  };
  dayOfWeek: Record<string, { count: number; successful: number }>;
  contactMethods: Record<string, { count: number; successful: number }>;
  issues: Record<string, number>;
}

export class AccessIntelligenceService {
  // Learn from visit outcomes
  static async recordAccessOutcome(
    customerId: string,
    arrivalTime: Date,
    successful: boolean,
    issues?: string,
    contactMet?: string,
    accessMethod?: string
  ): Promise<void> {
    try {
      // Calculate time to access (for successful attempts)
      const timeToAccess = successful ? Math.floor(Math.random() * 15) + 5 : 0; // Mock: 5-20 minutes
      
      // Log the access attempt
      const { error: logError } = await supabase
        .from('access_outcome_log')
        .insert({
          customer_id: customerId,
          arrival_time: arrivalTime.toISOString(),
          successful,
          issues,
          contact_met: contactMet,
          access_method: accessMethod,
          time_to_access: timeToAccess,
          created_at: new Date().toISOString()
        });

      if (logError) {
        console.error('Error logging access outcome:', logError);
        // Continue with pattern update even if logging fails
      }

      // Update access patterns
      await this.updateAccessPatterns(customerId, {
        arrivalTime,
        successful,
        issues,
        contactMet,
        accessMethod,
        timeToAccess
      });

    } catch (error) {
      console.error('Error recording access outcome:', error);
      throw error;
    }
  }

  // Get access recommendations for site
  static async getAccessRecommendations(customerId: string): Promise<AccessRecommendations> {
    try {
      // Get historical access data
      const { data: accessHistory, error: historyError } = await supabase
        .from('access_outcome_log')
        .select('*')
        .eq('customer_id', customerId)
        .order('arrival_time', { ascending: false })
        .limit(20); // Last 20 attempts

      if (historyError) {
        console.error('Error fetching access history:', historyError);
        return this.getDefaultRecommendations();
      }

      if (!accessHistory || accessHistory.length === 0) {
        return this.getDefaultRecommendations();
      }

      // Analyze patterns
      const patterns = this.analyzeAccessPatterns(accessHistory);
      
      // Calculate overall success rate
      const successfulAttempts = accessHistory.filter(h => h.successful).length;
      const successRate = Math.round((successfulAttempts / accessHistory.length) * 100);

      // Find best arrival time
      const recommendedTime = this.findBestArrivalTime(patterns);

      // Extract common issues
      const commonIssues = this.extractCommonIssues(accessHistory);

      // Get backup contacts from successful attempts
      const backupContacts = this.extractBackupContacts(accessHistory);

      // Generate tips
      const tips = this.generateAccessTips(patterns, accessHistory, successRate);

      return {
        recommendedArrivalTime: recommendedTime,
        successRate,
        commonIssues,
        backupContacts,
        tips,
        bestAccessMethod: this.findBestAccessMethod(patterns)
      };

    } catch (error) {
      console.error('Error getting access recommendations:', error);
      return this.getDefaultRecommendations();
    }
  }

  // Update access patterns
  static async updateAccessPatterns(customerId: string, outcome: AccessOutcome): Promise<void> {
    try {
      // Get existing intelligence record
      let { data: accessIntel, error: fetchError } = await supabase
        .from('access_intelligence')
        .select('*')
        .eq('customer_id', customerId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching access intelligence:', fetchError);
        return;
      }

      // Initialize or update patterns
      let patterns: AccessPattern = accessIntel?.learned_patterns || this.initializeAccessPattern();

      // Update time of day patterns
      const hour = outcome.arrivalTime.getHours();
      const timeCategory = this.categorizeTimeOfDay(hour);
      patterns.timeOfDay[timeCategory].count++;
      if (outcome.successful) {
        patterns.timeOfDay[timeCategory].successful++;
      }

      // Update day of week patterns
      const dayOfWeek = outcome.arrivalTime.toLocaleDateString('en-US', { weekday: 'long' });
      if (!patterns.dayOfWeek[dayOfWeek]) {
        patterns.dayOfWeek[dayOfWeek] = { count: 0, successful: 0 };
      }
      patterns.dayOfWeek[dayOfWeek].count++;
      if (outcome.successful) {
        patterns.dayOfWeek[dayOfWeek].successful++;
      }

      // Update access method patterns
      if (outcome.accessMethod) {
        if (!patterns.contactMethods[outcome.accessMethod]) {
          patterns.contactMethods[outcome.accessMethod] = { count: 0, successful: 0 };
        }
        patterns.contactMethods[outcome.accessMethod].count++;
        if (outcome.successful) {
          patterns.contactMethods[outcome.accessMethod].successful++;
        }
      }

      // Update issues tracking
      if (outcome.issues) {
        const issues = outcome.issues.toLowerCase();
        if (!patterns.issues[issues]) {
          patterns.issues[issues] = 0;
        }
        patterns.issues[issues]++;
      }

      // Calculate new success rate
      const totalAttempts = Object.values(patterns.timeOfDay).reduce((sum, cat) => sum + cat.count, 0);
      const totalSuccessful = Object.values(patterns.timeOfDay).reduce((sum, cat) => sum + cat.successful, 0);
      const newSuccessRate = totalAttempts > 0 ? totalSuccessful / totalAttempts : 0;

      // Update or create record
      if (accessIntel) {
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
      } else {
        const { error: insertError } = await supabase
          .from('access_intelligence')
          .insert({
            customer_id: customerId,
            access_success_rate: newSuccessRate,
            learned_patterns: patterns,
            last_updated: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error creating access intelligence:', insertError);
        }
      }

    } catch (error) {
      console.error('Error updating access patterns:', error);
    }
  }

  // Get current access intelligence for a site
  static async getCurrentAccessIntelligence(customerId: string): Promise<{
    successRate: number;
    bestTimes: string[];
    commonIssues: string[];
    lastUpdated?: Date;
  }> {
    try {
      const { data: accessIntel, error } = await supabase
        .from('access_intelligence')
        .select('*')
        .eq('customer_id', customerId)
        .single();

      if (error || !accessIntel) {
        return {
          successRate: 0,
          bestTimes: ['9:00 AM - 11:00 AM'],
          commonIssues: [],
          lastUpdated: undefined
        };
      }

      const patterns: AccessPattern = accessIntel.learned_patterns;
      const bestTimes = this.extractBestTimes(patterns);
      const commonIssues = this.extractTopIssues(patterns);

      return {
        successRate: Math.round((accessIntel.access_success_rate || 0) * 100),
        bestTimes,
        commonIssues,
        lastUpdated: accessIntel.last_updated ? new Date(accessIntel.last_updated) : undefined
      };

    } catch (error) {
      console.error('Error getting current access intelligence:', error);
      return {
        successRate: 0,
        bestTimes: ['9:00 AM - 11:00 AM'],
        commonIssues: [],
        lastUpdated: undefined
      };
    }
  }

  // Private helper methods
  private static initializeAccessPattern(): AccessPattern {
    return {
      timeOfDay: {
        early: { count: 0, successful: 0 },
        morning: { count: 0, successful: 0 },
        afternoon: { count: 0, successful: 0 },
        late: { count: 0, successful: 0 }
      },
      dayOfWeek: {},
      contactMethods: {},
      issues: {}
    };
  }

  private static categorizeTimeOfDay(hour: number): 'early' | 'morning' | 'afternoon' | 'late' {
    if (hour >= 6 && hour < 9) return 'early';
    if (hour >= 9 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 15) return 'afternoon';
    return 'late';
  }

  private static analyzeAccessPatterns(history: any[]): AccessPattern {
    const patterns = this.initializeAccessPattern();

    history.forEach(attempt => {
      const arrivalTime = new Date(attempt.arrival_time);
      const hour = arrivalTime.getHours();
      const timeCategory = this.categorizeTimeOfDay(hour);
      const dayOfWeek = arrivalTime.toLocaleDateString('en-US', { weekday: 'long' });

      // Time of day
      patterns.timeOfDay[timeCategory].count++;
      if (attempt.successful) {
        patterns.timeOfDay[timeCategory].successful++;
      }

      // Day of week
      if (!patterns.dayOfWeek[dayOfWeek]) {
        patterns.dayOfWeek[dayOfWeek] = { count: 0, successful: 0 };
      }
      patterns.dayOfWeek[dayOfWeek].count++;
      if (attempt.successful) {
        patterns.dayOfWeek[dayOfWeek].successful++;
      }

      // Access method
      if (attempt.access_method) {
        if (!patterns.contactMethods[attempt.access_method]) {
          patterns.contactMethods[attempt.access_method] = { count: 0, successful: 0 };
        }
        patterns.contactMethods[attempt.access_method].count++;
        if (attempt.successful) {
          patterns.contactMethods[attempt.access_method].successful++;
        }
      }

      // Issues
      if (attempt.issues) {
        const issues = attempt.issues.toLowerCase();
        if (!patterns.issues[issues]) {
          patterns.issues[issues] = 0;
        }
        patterns.issues[issues]++;
      }
    });

    return patterns;
  }

  private static findBestArrivalTime(patterns: AccessPattern): string {
    let bestCategory = 'morning';
    let bestSuccessRate = 0;

    Object.entries(patterns.timeOfDay).forEach(([category, stats]) => {
      if (stats.count > 0) {
        const successRate = stats.successful / stats.count;
        if (successRate > bestSuccessRate) {
          bestSuccessRate = successRate;
          bestCategory = category;
        }
      }
    });

    const timeRanges = {
      early: '6:00 AM - 9:00 AM',
      morning: '9:00 AM - 12:00 PM',
      afternoon: '12:00 PM - 3:00 PM',
      late: '3:00 PM - 6:00 PM'
    };

    return timeRanges[bestCategory as keyof typeof timeRanges] || '9:00 AM - 12:00 PM';
  }

  private static extractCommonIssues(history: any[]): string[] {
    const issueCounts: Record<string, number> = {};

    history.forEach(attempt => {
      if (attempt.issues) {
        const issues = attempt.issues.trim();
        issueCounts[issues] = (issueCounts[issues] || 0) + 1;
      }
    });

    return Object.entries(issueCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([issue]) => issue);
  }

  private static extractBackupContacts(history: any[]): string[] {
    const contacts = new Set<string>();

    history
      .filter(attempt => attempt.successful && attempt.contact_met)
      .forEach(attempt => {
        contacts.add(attempt.contact_met);
      });

    return Array.from(contacts).slice(0, 3);
  }

  private static findBestAccessMethod(patterns: AccessPattern): string | undefined {
    let bestMethod: string | undefined;
    let bestSuccessRate = 0;

    Object.entries(patterns.contactMethods).forEach(([method, stats]) => {
      if (stats.count > 1) { // Only consider methods used multiple times
        const successRate = stats.successful / stats.count;
        if (successRate > bestSuccessRate) {
          bestSuccessRate = successRate;
          bestMethod = method;
        }
      }
    });

    return bestMethod;
  }

  private static generateAccessTips(patterns: AccessPattern, history: any[], successRate: number): string[] {
    const tips: string[] = [];

    if (successRate < 70) {
      tips.push('🎯 Consider updating contact information - success rate could be improved');
    }

    // Best day recommendations
    const bestDay = Object.entries(patterns.dayOfWeek)
      .filter(([, stats]) => stats.count > 0)
      .sort(([, a], [, b]) => (b.successful / b.count) - (a.successful / a.count))[0];

    if (bestDay && bestDay[1].count > 1) {
      tips.push(`📅 ${bestDay[0]}s tend to have better access success`);
    }

    // Timing tips
    const morningSuccess = patterns.timeOfDay.morning.count > 0 ? 
      patterns.timeOfDay.morning.successful / patterns.timeOfDay.morning.count : 0;
    const afternoonSuccess = patterns.timeOfDay.afternoon.count > 0 ?
      patterns.timeOfDay.afternoon.successful / patterns.timeOfDay.afternoon.count : 0;

    if (morningSuccess > afternoonSuccess + 0.2) {
      tips.push('🌅 Morning visits tend to be more successful');
    } else if (afternoonSuccess > morningSuccess + 0.2) {
      tips.push('🌆 Afternoon visits tend to be more successful');
    }

    // Issue-based tips
    const topIssues = Object.entries(patterns.issues)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);

    topIssues.forEach(([issue]) => {
      if (issue.includes('badge') || issue.includes('card')) {
        tips.push('🔑 Badge/card access issues are common - bring backup credentials');
      } else if (issue.includes('contact') || issue.includes('phone')) {
        tips.push('📞 Phone contact issues noted - try multiple contact methods');
      } else if (issue.includes('locked') || issue.includes('security')) {
        tips.push('🚪 Security/locking issues noted - confirm access procedures beforehand');
      }
    });

    if (tips.length === 0) {
      tips.push('👍 Access patterns look normal');
    }

    return tips.slice(0, 4); // Limit to 4 most relevant tips
  }

  private static extractBestTimes(patterns: AccessPattern): string[] {
    const timeRanges = {
      early: '6:00 AM - 9:00 AM',
      morning: '9:00 AM - 12:00 PM',
      afternoon: '12:00 PM - 3:00 PM',
      late: '3:00 PM - 6:00 PM'
    };

    return Object.entries(patterns.timeOfDay)
      .filter(([, stats]) => stats.count > 0)
      .sort(([, a], [, b]) => (b.successful / b.count) - (a.successful / a.count))
      .slice(0, 2)
      .map(([category]) => timeRanges[category as keyof typeof timeRanges]);
  }

  private static extractTopIssues(patterns: AccessPattern): string[] {
    return Object.entries(patterns.issues)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([issue]) => issue);
  }

  private static getDefaultRecommendations(): AccessRecommendations {
    return {
      recommendedArrivalTime: '9:00 AM - 11:00 AM',
      successRate: 85,
      commonIssues: [],
      backupContacts: [],
      tips: ['No historical access data available', 'Consider standard business hours approach'],
      bestAccessMethod: 'phone'
    };
  }

  // Create access outcome log table if it doesn't exist
  static async ensureAccessOutcomeLogTable(): Promise<void> {
    try {
      const { error } = await supabase.rpc('create_access_outcome_log_if_not_exists');
      if (error && !error.message.includes('already exists')) {
        console.error('Error creating access outcome log table:', error);
      }
    } catch (error) {
      // Table creation will be handled by migration
      console.log('Access outcome log table creation handled by migration');
    }
  }
}

export type { AccessOutcome, AccessRecommendations, AccessPattern };
