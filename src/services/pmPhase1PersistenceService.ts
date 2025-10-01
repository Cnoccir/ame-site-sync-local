import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export class PMPhase1PersistenceService {
  static async upsert(sessionId: string, phase1Data: any): Promise<void> {
    try {
      // Upsert customer snapshot
      const customer = phase1Data.customer || {};
      const customerPayload: any = {
        session_id: sessionId,
        company_name: customer.companyName || null,
        site_name: customer.siteName || null,
        address: customer.address || null,
        service_tier: customer.serviceTier || null,
        contract_number: customer.contractNumber || null,
        account_manager_id: customer.accountManagerId || null,
        account_manager_name: customer.accountManager || null,
        account_manager_phone: customer.accountManagerPhone || null,
        account_manager_email: customer.accountManagerEmail || null,
        simpro_customer_id: customer.simproCustomerId || null,
      };

      await supabase.from('pm_phase1_customer').upsert(customerPayload);

      // Replace contacts for this session
      const contacts = Array.isArray(phase1Data.contacts) ? phase1Data.contacts : [];
      await supabase.from('pm_phase1_contacts').delete().eq('session_id', sessionId);
      if (contacts.length > 0) {
        const contactRows = contacts.map((c: any) => ({
          session_id: sessionId,
          name: c.name || null,
          phone: c.phone || null,
          email: c.email || null,
          role: c.role || null,
          is_primary: !!c.isPrimary,
          is_emergency: !!c.isEmergency,
        }));
        await supabase.from('pm_phase1_contacts').insert(contactRows);
      }

      // Upsert access
      const access = phase1Data.access || {};
      const accessPayload: any = {
        session_id: sessionId,
        access_method: access.method || null,
        parking_instructions: access.parkingInstructions || null,
        badge_required: !!access.badgeRequired,
        escort_required: !!access.escortRequired,
        special_instructions: access.specialInstructions || null,
        best_arrival_time: access.bestArrivalTime || null,
      };
      await supabase.from('pm_phase1_access').upsert(accessPayload);

      // Upsert safety
      const safety = phase1Data.safety || {};
      const safetyPayload: any = {
        session_id: sessionId,
        required_ppe: Array.isArray(safety.requiredPPE) ? safety.requiredPPE : [],
        known_hazards: Array.isArray(safety.knownHazards) ? safety.knownHazards : [],
        safety_contact_name: safety.safetyContact || null,
        safety_contact_phone: safety.safetyPhone || null,
        safety_notes: safety.specialNotes || null,
      };
      await supabase.from('pm_phase1_safety').upsert(safetyPayload);

      // Upsert team
      const teamPayload: any = {
        session_id: sessionId,
        primary_technician_id: customer.primaryTechnicianId || null,
        primary_technician_name: customer.primaryTechnicianName || null,
        primary_technician_phone: customer.primaryTechnicianPhone || null,
        primary_technician_email: customer.primaryTechnicianEmail || null,
        secondary_technician_id: customer.secondaryTechnicianId || null,
        secondary_technician_name: customer.secondaryTechnicianName || null,
        secondary_technician_phone: customer.secondaryTechnicianPhone || null,
        secondary_technician_email: customer.secondaryTechnicianEmail || null,
      };
      await supabase.from('pm_phase1_team').upsert(teamPayload);

      logger.info('Phase 1 normalized data persisted', { sessionId });
    } catch (error) {
      logger.error('Failed to persist Phase 1 normalized data', error);
      // Do not throw to avoid breaking UI saves; log only
    }
  }
}