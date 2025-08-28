/**
 * Utility for persisting form data during authentication flows
 */

export interface PersistedFormData {
  [key: string]: any;
  timestamp: number;
  formType: string;
}

export class FormDataPersistence {
  private static readonly STORAGE_PREFIX = 'ame_form_data_';
  private static readonly EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

  /**
   * Save form data to localStorage with expiry
   */
  static saveFormData(formType: string, data: Record<string, any>): string {
    const key = `${this.STORAGE_PREFIX}${formType}`;
    const sessionId = this.generateSessionId();
    
    const persistedData: PersistedFormData = {
      ...data,
      timestamp: Date.now(),
      formType,
      sessionId
    };

    try {
      localStorage.setItem(key, JSON.stringify(persistedData));
      localStorage.setItem('ame_current_form_session', sessionId);
      console.log(`📝 Form data saved for ${formType}:`, Object.keys(data));
      return sessionId;
    } catch (error) {
      console.error('Failed to save form data:', error);
      return sessionId;
    }
  }

  /**
   * Restore form data from localStorage
   */
  static restoreFormData(formType: string): Record<string, any> | null {
    const key = `${this.STORAGE_PREFIX}${formType}`;
    
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const data: PersistedFormData = JSON.parse(stored);
      
      // Check if data has expired
      if (Date.now() - data.timestamp > this.EXPIRY_TIME) {
        this.clearFormData(formType);
        return null;
      }

      // Remove metadata before returning
      const { timestamp, formType: type, sessionId, ...formData } = data;
      console.log(`📄 Form data restored for ${formType}:`, Object.keys(formData));
      return formData;
    } catch (error) {
      console.error('Failed to restore form data:', error);
      return null;
    }
  }

  /**
   * Clear saved form data
   */
  static clearFormData(formType: string): void {
    const key = `${this.STORAGE_PREFIX}${formType}`;
    localStorage.removeItem(key);
    localStorage.removeItem('ame_current_form_session');
    console.log(`🗑️ Cleared form data for ${formType}`);
  }

  /**
   * Check if there's persisted data for a form
   */
  static hasPersistedData(formType: string): boolean {
    const key = `${this.STORAGE_PREFIX}${formType}`;
    const stored = localStorage.getItem(key);
    
    if (!stored) return false;

    try {
      const data: PersistedFormData = JSON.parse(stored);
      return Date.now() - data.timestamp <= this.EXPIRY_TIME;
    } catch {
      return false;
    }
  }

  /**
   * Get current session ID for tracking
   */
  static getCurrentSessionId(): string | null {
    return localStorage.getItem('ame_current_form_session');
  }

  /**
   * Save the current form step/page for restoration
   */
  static saveFormStep(formType: string, step: number | string): void {
    const key = `${this.STORAGE_PREFIX}${formType}_step`;
    localStorage.setItem(key, step.toString());
  }

  /**
   * Restore the saved form step/page
   */
  static restoreFormStep(formType: string): number | null {
    const key = `${this.STORAGE_PREFIX}${formType}_step`;
    const step = localStorage.getItem(key);
    return step ? parseInt(step, 10) : null;
  }

  /**
   * Save authentication return URL
   */
  static saveReturnUrl(url: string): void {
    localStorage.setItem('google_oauth_return_url', url);
  }

  /**
   * Generate unique session ID
   */
  private static generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up expired form data (call periodically)
   */
  static cleanupExpiredData(): void {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.STORAGE_PREFIX));
    
    keys.forEach(key => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const data: PersistedFormData = JSON.parse(stored);
          if (Date.now() - data.timestamp > this.EXPIRY_TIME) {
            localStorage.removeItem(key);
            console.log(`🗑️ Cleaned up expired form data: ${key}`);
          }
        }
      } catch (error) {
        // Invalid data, remove it
        localStorage.removeItem(key);
      }
    });
  }
}

/**
 * Hook for React components to use form persistence
 */
export const useFormPersistence = (formType: string) => {
  const saveData = (data: Record<string, any>) => {
    return FormDataPersistence.saveFormData(formType, data);
  };

  const restoreData = () => {
    return FormDataPersistence.restoreFormData(formType);
  };

  const clearData = () => {
    FormDataPersistence.clearFormData(formType);
  };

  const hasData = () => {
    return FormDataPersistence.hasPersistedData(formType);
  };

  const saveStep = (step: number | string) => {
    FormDataPersistence.saveFormStep(formType, step);
  };

  const restoreStep = () => {
    return FormDataPersistence.restoreFormStep(formType);
  };

  return {
    saveData,
    restoreData,
    clearData,
    hasData,
    saveStep,
    restoreStep
  };
};
