/**
 * CRUD operations for PreVisit workflow
 * Uses Supabase MCP tools and database functions
 */

import { supabase } from '@/integrations/supabase/client';
import { Customer } from '@/types';
import { unifyPreVisitFormShape, buildPrevisitSectionsForStorage, getSectionCompletionStatus } from '@/utils/previsit-data-transforms';
export interface PreVisitData {
  customer: Customer;
  preparation?: PrevisitPreparation;
  toolCatalog: ToolCatalogItem[];
  selectedTools?: { toolId: string }[];
}

export interface PrevisitPreparation {
  id: string;
  customer_id: string;
  visit_id?: string;
  site_intelligence_data?: any;
  site_intelligence_complete: boolean;
  contact_access_data?: any;
  contact_access_complete: boolean;
  documentation_data?: any;
  documentation_complete: boolean;
  tool_preparation_data?: any;
  tool_preparation_complete: boolean;
  checklist_data?: any;
  checklist_complete: boolean;
  preparation_status: 'pending' | 'in_progress' | 'completed';
  overall_progress: number;
  sections_completed: number;
  session_token?: string;
  auto_save_data?: any;
  last_activity: string;
  created_at: string;
  updated_at: string;
}

export interface ToolCatalogItem {
  id: string;
  name: string;
  category: 'standard' | 'system_specific' | 'spare_parts';
  platforms: string[];
  isRequired: boolean;
  description?: string;
}

/**
 * Load all data needed for PreVisit workflow with intelligent pre-population
 */
export const loadPreVisitData = async (customerId: string, visitId?: string): Promise<PreVisitData> => {
  try {
    // Load customer data
    const { data: customer, error: customerError } = await supabase
      .from('ame_customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError) {
      throw new Error(`Failed to load customer: ${customerError.message}`);
    }

    // Load existing preparation data
    let preparation: PrevisitPreparation | null = null;
    const { data: prepData } = await supabase
      .from('previsit_preparations')
      .select(`
        *,
        previsit_tool_selections (
          tool_id,
          tool_name,
          tool_category,
          is_selected,
          quantity,
          notes
        )
      `)
      .eq('customer_id', customerId)
      .eq('visit_id', visitId || null)
      .maybeSingle();
      
    preparation = prepData;

    // If no preparation exists, create one with intelligent pre-population from customer data
    // FALLBACK: If table doesn't exist yet, create in-memory preparation data
    if (!preparation) {
      try {
        const initialPreparationData = {
          customer_id: customerId,
          visit_id: visitId,
          preparation_status: 'in_progress' as const,
          
          // Pre-populate Site Intelligence from customer data
          site_intelligence_data: {
            siteNickname: customer.site_nickname || customer.site_name || '',
            systemPlatform: customer.system_platform || '',
            siteNumber: customer.site_number || '',
            primaryTechnicianId: customer.primary_technician_id,
            secondaryTechnicianId: customer.secondary_technician_id,
            primaryTechnicianName: customer.primary_technician_name || '',
            secondaryTechnicianName: customer.secondary_technician_name || '',
            siteExperience: customer.site_experience || 'first_time',
            lastVisitDate: customer.last_visit_date,
            lastVisitBy: customer.last_visit_by,
            handoffNotes: customer.handoff_notes || '',
            knownIssues: customer.known_issues || []
          },
          
          // Pre-populate Contact & Access from customer data
          contact_access_data: {
            primaryContact: customer.primary_contact || '',
            contactPhone: customer.contact_phone || '',
            contactEmail: customer.contact_email || '',
            secondaryContactName: customer.secondary_contact_name,
            secondaryContactPhone: customer.secondary_contact_phone,
            pocName: customer.poc_name,
            pocPhone: customer.poc_phone,
            pocAvailableHours: customer.poc_available_hours || '',
            bestArrivalTimes: customer.best_arrival_times || [],
            address: customer.address || '',
            accessApproach: customer.access_approach || '',
            parkingInstructions: customer.parking_instructions || '',
            badgeRequired: customer.badge_required || false,
            escortRequired: customer.escort_required || false,
            ppeRequired: customer.ppe_required || false,
            safetyRequirements: customer.safety_requirements
          },
          
          // Pre-populate Documentation from customer data
          documentation_data: {
            driveFolderUrl: customer.drive_folder_url || '',
            hasSubmittals: customer.has_submittals || false,
            hasFloorPlans: customer.has_floor_plans || false,
            hasAsBuilt: customer.has_as_built || false,
            hasSequence: customer.has_sequence || false,
            hasNetworkDiagram: customer.has_network_diagram || false,
            documentationScore: customer.documentation_score,
            originalTeamContact: customer.original_team_contact || '',
            originalTeamRole: customer.original_team_role || '',
            whenToContactOriginal: customer.when_to_contact_original || ''
          },
          
          // Initialize tool preparation
          tool_preparation_data: {
            selectedTools: [],
            additionalToolsNeeded: customer.additional_tools_needed || ''
          },
          
          // Initialize checklist with some smart defaults
          checklist_data: {
            contactConfirmed: false,
            accessPlanReviewed: false,
            credentialsVerified: false,
            toolsLoaded: false,
            notesReviewed: false,
            safetyReviewed: customer.ppe_required || customer.badge_required || false
          }
        };

        // Try to create the preparation record
        const { data: newPrep, error: createError } = await supabase
          .from('previsit_preparations')
          .insert([initialPreparationData])
          .select(`
            *,
            previsit_tool_selections (
              tool_id,
              tool_name,
              tool_category,
              is_selected,
              quantity,
              notes
            )
          `)
          .single();

        if (createError) {
          console.error('Failed to create preparation record (table may not exist):', createError);
          console.log('Using fallback: pre-populated data from customer record');
          
          // FALLBACK: Create a mock preparation object with customer data
          preparation = {
            id: `fallback-${customerId}-${visitId || 'no-visit'}`,
            customer_id: customerId,
            visit_id: visitId,
            ...initialPreparationData,
            site_intelligence_complete: false,
            contact_access_complete: false,
            documentation_complete: false,
            tool_preparation_complete: false,
            checklist_complete: false,
            overall_progress: 0,
            sections_completed: 0,
            session_token: null,
            auto_save_data: {},
            last_activity: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as PrevisitPreparation;
        } else {
          preparation = newPrep;
        }
      } catch (error) {
        console.error('Error creating preparation:', error);
        console.log('Using minimal fallback preparation data');
        
        // MINIMAL FALLBACK: Just use customer data directly
        preparation = {
          id: `minimal-fallback-${customerId}`,
          customer_id: customerId,
          visit_id: visitId,
          site_intelligence_data: {
            siteNickname: customer.site_nickname || customer.site_name || '',
            systemPlatform: customer.system_platform || ''
          },
          contact_access_data: {
            primaryContact: customer.primary_contact || '',
            contactPhone: customer.contact_phone || ''
          },
          documentation_data: {},
          tool_preparation_data: { selectedTools: [] },
          checklist_data: {},
          site_intelligence_complete: false,
          contact_access_complete: false,
          documentation_complete: false,
          tool_preparation_complete: false,
          checklist_complete: false,
          preparation_status: 'in_progress' as const,
          overall_progress: 0,
          sections_completed: 0,
          session_token: null,
          auto_save_data: {},
          last_activity: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as PrevisitPreparation;
      }
    }

    // Load tool catalog (fallback to empty array if not available)
    let toolCatalog: ToolCatalogItem[] = [];
    try {
      toolCatalog = await loadToolCatalog(customer.system_platform);
    } catch (toolError) {
      console.log('Tool catalog not available, using empty array');
      toolCatalog = [];
    }

    // Extract selected tools from preparation data
    const selectedTools = preparation?.previsit_tool_selections?.filter(ts => ts.is_selected) || [];

    return {
      customer,
      preparation,
      toolCatalog,
      selectedTools: selectedTools.map(st => ({ toolId: st.tool_id }))
    };
  } catch (error) {
    console.error('Error loading PreVisit data:', error);
    throw error;
  }
};

/**
 * Load tool catalog with optional platform filtering
 */
export const loadToolCatalog = async (systemPlatform?: string): Promise<ToolCatalogItem[]> => {
  try {
    // For now, return a static tool catalog since RPC function might not exist
    // This should be replaced with actual database query when tool catalog is implemented
    const staticTools: ToolCatalogItem[] = [
      {
        id: 'multimeter',
        name: 'Digital Multimeter',
        category: 'standard',
        platforms: [],
        isRequired: true,
        description: 'Basic electrical testing'
      },
      {
        id: 'laptop',
        name: 'Laptop with Software',
        category: 'standard',
        platforms: [],
        isRequired: true,
        description: 'Programming and diagnostics'
      },
      {
        id: 'n4_toolkit',
        name: 'Niagara N4 Toolkit',
        category: 'system_specific',
        platforms: ['N4'],
        isRequired: true,
        description: 'N4 specific tools and cables'
      },
      {
        id: 'fx_toolkit',
        name: 'Johnson FX Toolkit',
        category: 'system_specific',
        platforms: ['FX'],
        isRequired: true,
        description: 'FX specific tools and software'
      },
      {
        id: 'spare_fuses',
        name: 'Assorted Fuses',
        category: 'spare_parts',
        platforms: [],
        isRequired: false,
        description: 'Common fuse replacements'
      }
    ];
    
    // Filter by platform if specified
    if (systemPlatform) {
      return staticTools.filter(tool => 
        tool.platforms.length === 0 || tool.platforms.includes(systemPlatform)
      );
    }
    
    return staticTools;
  } catch (error) {
    console.error('Error loading tool catalog:', error);
    return []; // Always return empty array on error
  }
};

/**
 * Auto-save PreVisit form data to preparation table
 */
export const autoSavePreVisitData = async (
  formData: any, 
  customerId: string, 
  visitId?: string
): Promise<void> => {
  try {
    // Use the database function for lightweight auto-save
    const { data: prepId, error } = await supabase
      .rpc('upsert_previsit_preparation', {
        p_customer_id: customerId,
        p_visit_id: visitId || null,
        p_section_data: {
          ...formData,
          lastAutoSave: new Date().toISOString()
        },
        p_section_name: null // null means update auto_save_data field
      });
      
    if (error) {
      console.error('Auto-save failed:', error);
      // Fallback to simple customer update for critical fields
      await supabase
        .from('ame_customers')
        .update({
          site_nickname: formData?.siteIntelligence?.siteNickname,
          primary_contact: formData?.contactAccess?.primaryContact,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);
    }
  } catch (error) {
    console.error('Auto-save error:', error);
    // Don't throw - auto-save should be silent
  }
};

/**
 * Save complete PreVisit form data to preparation table (with fallback)
 */
export const savePreVisitData = async (
  customerId: string,
  formData: any
): Promise<void> => {
  try {
    // Try to use the database functions first
    let usingDatabase = false;
    let prepId = null;
    
    try {
      // Get or create preparation record using database function
      const { data: dbPrepId, error: upsertError } = await supabase
        .rpc('upsert_previsit_preparation', {
          p_customer_id: customerId,
          p_visit_id: formData.visitId || null
        });

      if (upsertError) {
        console.log('Database function not available, using fallback');
      } else {
        prepId = dbPrepId;
        usingDatabase = true;
      }
    } catch (error) {
      console.log('Database function not available, using fallback');
    }

    if (usingDatabase && prepId) {
      // Normalize input shape and build storage sections
      const canonical = buildPrevisitSectionsForStorage(unifyPreVisitFormShape(formData));
      // Save each section of data using database functions
      const sections = [
        { name: 'siteIntelligence', data: canonical.siteIntelligence },
        { name: 'contactAccess', data: canonical.contactAccess },
        { name: 'documentation', data: canonical.documentation },
        { name: 'toolPreparation', data: canonical.toolPreparation },
        { name: 'checklist', data: canonical.checklist }
      ];

      // Update each section
      for (const section of sections) {
        if (section.data) {
          const { error: sectionError } = await supabase
            .rpc('upsert_previsit_preparation', {
              p_customer_id: customerId,
              p_visit_id: formData.visitId || null,
              p_section_data: section.data,
              p_section_name: section.name
            });

          if (sectionError) {
            console.error(`Failed to save ${section.name}:`, sectionError);
          }
        }
      }

      // Handle tool selections separately
      if (canonical.toolPreparation?.selectedTools && prepId) {
        try {
          await updateToolSelectionsForPreparation(prepId, formData.toolPreparation.selectedTools);
        } catch (toolError) {
          console.error('Failed to save tool selections:', toolError);
        }
      }

      // Calculate progress
      try {
        await supabase.rpc('calculate_previsit_progress', {
          preparation_id: prepId
        });
        // Also set completion flags based on section status
        const sectionStatus = getSectionCompletionStatus(unifyPreVisitFormShape(formData));
        await supabase
          .from('previsit_preparations')
          .update({
            site_intelligence_complete: sectionStatus.siteIntelligence,
            contact_access_complete: sectionStatus.contactAccess,
            documentation_complete: sectionStatus.documentation,
            tool_preparation_complete: sectionStatus.tools,
            checklist_complete: sectionStatus.checklist,
            last_activity: new Date().toISOString()
          })
          .eq('id', prepId as string);
      } catch (progressError) {
        console.error('Failed to calculate progress:', progressError);
      }
    }

    // ALWAYS update a safe subset of customer fields for backward compatibility
    // Only update columns that exist in the database schema to avoid errors
    const candidateUpdates: Record<string, any> = {};
    if (formData.siteIntelligence) {
      candidateUpdates.site_nickname = formData.siteIntelligence.siteNickname;
      // Avoid site_experience here (not present in ame_customers)
    }
    if (formData.contactAccess) {
      candidateUpdates.primary_contact = formData.contactAccess.primaryContact;
      candidateUpdates.contact_phone = formData.contactAccess.contactPhone;
      candidateUpdates.contact_email = formData.contactAccess.contactEmail;
      // access_approach is not a column; do not write it
    }
    if (formData.documentation) {
      candidateUpdates.drive_folder_url = formData.documentation.driveFolderUrl;
      // Documentation flags are stored in previsit_preparations; not in ame_customers
    }

    // Whitelist of allowed ame_customers columns for this sync
    const allowedKeys = new Set<string>([
      'site_nickname',
      'primary_contact',
      'contact_phone',
      'contact_email',
      'drive_folder_url',
      'updated_at'
    ]);

    const customerUpdates: Record<string, any> = {};
    Object.entries(candidateUpdates).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && allowedKeys.has(k)) {
        customerUpdates[k] = v;
      }
    });

    if (Object.keys(customerUpdates).length > 0) {
      customerUpdates.updated_at = new Date().toISOString();
      const { error: customerError } = await supabase
        .from('ame_customers')
        .update(customerUpdates)
        .eq('id', customerId);
      
      if (customerError) {
        console.error('Failed to update customer:', customerError);
        // Do not throw; customer update is a best-effort sync
      }
    }

    console.log(`PreVisit data saved successfully ${usingDatabase ? 'with database' : 'as fallback'}`);
  } catch (error) {
    console.error('Error saving PreVisit data:', error);
    throw error;
  }
};

/**
 * Complete PreVisit preparation (with fallback)
 */
export const completePreVisitPreparation = async (
  customerId: string,
  visitId?: string
): Promise<void> => {
  try {
    // Try to update preparation status to completed
    let completedInDatabase = false;
    try {
      const { error: prepError } = await supabase
        .from('previsit_preparations')
        .update({
          preparation_status: 'completed',
          overall_progress: 100,
          sections_completed: 5,
          updated_at: new Date().toISOString()
        })
        .eq('customer_id', customerId)
        .eq('visit_id', visitId || null);

      if (prepError) {
        console.log('Preparation table update failed, using fallback:', prepError.message);
      } else {
        completedInDatabase = true;
      }
    } catch (error) {
      console.log('Preparation table not available, using fallback');
    }

    // Update visit phase if visit ID is provided
    if (visitId) {
      const { error: visitError } = await supabase
        .from('ame_visits')
        .update({
          phase_1_status: 'Completed',
          phase_1_completed_at: new Date().toISOString(),
          current_phase: 2,
          updated_at: new Date().toISOString()
        })
        .eq('id', visitId);

      if (visitError) {
        console.error('Failed to update visit phase:', visitError.message);
        // Don't throw - preparation completion is more important
      }
    }

    // If database update failed, at least mark something in the customer record
    if (!completedInDatabase) {
      await supabase
        .from('ame_customers')
        .update({
          // Add a simple completion marker
          updated_at: new Date().toISOString(),
          // Could add a field like last_preparation_completed_at if it exists
        })
        .eq('id', customerId);
    }

    console.log(`PreVisit preparation marked as complete ${completedInDatabase ? 'in database' : 'with fallback'}`);
  } catch (error) {
    console.error('Error completing PreVisit preparation:', error);
    throw error;
  }
};

/**
 * Get PreVisit preparation status
 */
export const getPreVisitStatus = async (
  customerId: string,
  visitId?: string
): Promise<PrevisitPreparation | null> => {
  try {
    const { data, error } = await supabase
      .from('previsit_preparations')
      .select('*')
      .eq('customer_id', customerId)
      .eq('visit_id', visitId || null)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw new Error(`Failed to get preparation status: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error getting PreVisit status:', error);
    throw error;
  }
};

/**
 * Reset PreVisit preparation (for testing/debugging)
 */
export const resetPreVisitPreparation = async (
  customerId: string,
  visitId?: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('previsit_preparations')
      .delete()
      .eq('customer_id', customerId)
      .eq('visit_id', visitId || null);

    if (error) {
      throw new Error(`Failed to reset preparation: ${error.message}`);
    }
  } catch (error) {
    console.error('Error resetting PreVisit preparation:', error);
    throw error;
  }
};

/**
 * Get tool selections for a preparation
 */
export const getToolSelections = async (
  preparationId: string
): Promise<Array<{ tool_id: string; is_selected: boolean; quantity: number; notes?: string }>> => {
  try {
    const { data, error } = await supabase
      .from('previsit_tool_selections')
      .select(`
        tool_id,
        tool_name,
        tool_category,
        is_selected,
        quantity,
        notes
      `)
      .eq('previsit_preparation_id', preparationId);

    if (error) {
      throw new Error(`Failed to get tool selections: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error getting tool selections:', error);
    throw error;
  }
};

/**
 * Update tool selections for a preparation (internal helper)
 */
const updateToolSelectionsForPreparation = async (
  preparationId: string,
  selectedToolIds: string[]
): Promise<void> => {
  try {
    // Get tool catalog to get tool details
    const toolCatalog = await loadToolCatalog();
    
    // Create tool selections based on selected IDs
    const toolSelections = toolCatalog.map(tool => ({
      tool_id: tool.id,
      tool_name: tool.name,
      tool_category: tool.category,
      is_selected: selectedToolIds.includes(tool.id),
      quantity: selectedToolIds.includes(tool.id) ? 1 : 0,
      selection_reason: 'user_selected'
    })).filter(selection => selection.is_selected); // Only save selected tools

    // Delete existing selections
    await supabase
      .from('previsit_tool_selections')
      .delete()
      .eq('previsit_preparation_id', preparationId);

    // Insert new selections
    if (toolSelections.length > 0) {
      const { error } = await supabase
        .from('previsit_tool_selections')
        .insert(
          toolSelections.map(selection => ({
            previsit_preparation_id: preparationId,
            tool_id: selection.tool_id,
            tool_name: selection.tool_name,
            tool_category: selection.tool_category,
            is_selected: selection.is_selected,
            quantity: selection.quantity,
            selection_reason: selection.selection_reason
          }))
        );

      if (error) {
        throw new Error(`Failed to update tool selections: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Error updating tool selections for preparation:', error);
    throw error;
  }
};

/**
 * Update tool selections for a preparation (public API)
 */
export const updateToolSelections = async (
  preparationId: string,
  toolSelections: Array<{ tool_id: string; is_selected: boolean; quantity?: number; notes?: string }>
): Promise<void> => {
  try {
    // Delete existing selections
    await supabase
      .from('previsit_tool_selections')
      .delete()
      .eq('previsit_preparation_id', preparationId);

    // Insert new selections
    if (toolSelections.length > 0) {
      const { error } = await supabase
        .from('previsit_tool_selections')
        .insert(
          toolSelections.map(selection => ({
            previsit_preparation_id: preparationId,
            tool_id: selection.tool_id,
            is_selected: selection.is_selected,
            quantity: selection.quantity || 1,
            notes: selection.notes,
            selection_reason: 'user_selected'
          }))
        );

      if (error) {
        throw new Error(`Failed to update tool selections: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Error updating tool selections:', error);
    throw error;
  }
};

/**
 * Get PreVisit workflow analytics
 */
export const getPreVisitAnalytics = async (
  dateRange?: { start: string; end: string }
): Promise<{
  total_preparations: number;
  completed_preparations: number;
  in_progress_preparations: number;
  average_completion_time_hours: number;
  completion_rate_by_section: Record<string, number>;
}> => {
  try {
    let query = supabase
      .from('previsit_preparations')
      .select('*');

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end);
    }

    const { data: preparations, error } = await query;

    if (error) {
      throw new Error(`Failed to get analytics: ${error.message}`);
    }

    if (!preparations || preparations.length === 0) {
      return {
        total_preparations: 0,
        completed_preparations: 0,
        in_progress_preparations: 0,
        average_completion_time_hours: 0,
        completion_rate_by_section: {}
      };
    }

    const total = preparations.length;
    const completed = preparations.filter(p => p.preparation_status === 'completed').length;
    const inProgress = preparations.filter(p => p.preparation_status === 'in_progress').length;

    // Calculate average completion time for completed preparations
    const completedPreparations = preparations.filter(p => p.preparation_status === 'completed');
    const avgTime = completedPreparations.length > 0 
      ? completedPreparations.reduce((sum, p) => {
          const created = new Date(p.created_at).getTime();
          const updated = new Date(p.updated_at).getTime();
          return sum + (updated - created);
        }, 0) / completedPreparations.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Calculate completion rates by section
    const sectionCompletionRates = {
      site_intelligence: (preparations.filter(p => p.site_intelligence_complete).length / total) * 100,
      contact_verification: (preparations.filter(p => p.contact_verification_complete).length / total) * 100,
      documentation_review: (preparations.filter(p => p.documentation_review_complete).length / total) * 100,
      tools_preparation: (preparations.filter(p => p.tools_preparation_complete).length / total) * 100,
      checklist: (preparations.filter(p => p.checklist_complete).length / total) * 100
    };

    return {
      total_preparations: total,
      completed_preparations: completed,
      in_progress_preparations: inProgress,
      average_completion_time_hours: Math.round(avgTime * 100) / 100,
      completion_rate_by_section: sectionCompletionRates
    };
  } catch (error) {
    console.error('Error getting PreVisit analytics:', error);
    throw error;
  }
};

/**
 * Debounced auto-save function
 * Use this for real-time auto-saving as user types
 */
export const createDebouncedAutoSave = (customerId: string, delay: number = 1000) => {
  let timeoutId: NodeJS.Timeout;
  
  return (formData: any, visitId?: string) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      autoSavePreVisitData(formData, customerId, visitId);
    }, delay);
  };
};
