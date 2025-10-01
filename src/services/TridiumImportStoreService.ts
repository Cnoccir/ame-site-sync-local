import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { isValidUUID } from '@/utils/uuid';

export interface StoreUploadedDatasetParams {
  sessionId: string;
  customerId?: string;
  siteName?: string;
  nodeId: string;
  dataType: 'platform' | 'resources' | 'niagara_network' | 'bacnet' | 'n2' | 'modbus' | 'lon' | 'custom';
  file?: File;
  rawText?: string;
  parsedData?: any;
  targetLocation?: { type: 'supervisor' | 'jace'; name?: string };
}

async function computeSha256Hex(text: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export class TridiumImportStoreService {
  static async storeUploadedDataset(params: StoreUploadedDatasetParams): Promise<{ success: boolean; id?: string; error?: string }> {
    const { sessionId, customerId, siteName, nodeId, dataType, file, rawText, parsedData, targetLocation } = params;

    // If sessionId is not a valid UUID, skip DB persistence (local-only mode)
    if (!isValidUUID(sessionId)) {
      logger.info('Skipping tridium_imports persistence in local-only mode (non-UUID sessionId)');
      return { success: true };
    }

    const bucket = 'tridium-uploads';
    const safeFileName = file?.name ? file.name.replace(/[^A-Za-z0-9._-]/g, '_') : `dataset_${dataType}.txt`;
    const storagePath = `sessions/${sessionId}/${dataType}/${Date.now()}_${safeFileName}`;

    let uploadedPath: string | null = null;

    try {
      // Compute content hash for idempotency (prefer rawText; fallback to reading file text)
      let contentForHash = rawText || '';
      if (!contentForHash && file) {
        contentForHash = await file.text();
      }
      const fileHash = contentForHash ? await computeSha256Hex(contentForHash) : undefined;

      // Idempotency check: avoid inserting exact duplicates for same session/type/hash
      if (fileHash) {
        try {
          const { data: existing, error: existingErr } = await supabase
            .from('tridium_imports')
            .select('id, metadata')
            .eq('session_id', sessionId)
            .eq('dataset_type', dataType)
            .order('uploaded_at', { ascending: false })
            .limit(50);

          if (!existingErr && Array.isArray(existing)) {
            const dup = existing.find(r => (r as any).metadata?.file_hash === fileHash);
            if (dup) {
              logger.info('Duplicate upload detected by hash; skipping insert', { sessionId, dataType });
              return { success: true, id: (dup as any).id };
            }
          }
        } catch (dupErr) {
          logger.warn('Duplicate check failed, proceeding with insert', dupErr);
        }
      }

      if (file) {
        const { error: uploadError } = await supabase
          .storage
          .from(bucket)
          .upload(storagePath, file, {
            upsert: true,
            cacheControl: '3600',
            contentType: (file as any).type || 'text/plain'
          });

        if (uploadError) {
          logger.warn('Storage upload failed, falling back to raw_text only', uploadError);
        } else {
          uploadedPath = storagePath;
        }
      }

      const { data, error } = await supabase
        .from('tridium_imports')
        .insert({
          session_id: sessionId,
          customer_id: customerId || null,
          site_name: siteName || null,
          node_id: nodeId,
          location_type: targetLocation?.type || 'supervisor',
          location_name: targetLocation?.name || null,
          dataset_type: dataType,
          original_filename: file?.name || safeFileName,
          storage_bucket: bucket,
          storage_path: uploadedPath,
          raw_text: rawText || null,
          parsed_json: parsedData || null,
          metadata: {
            size: file?.size || (rawText ? rawText.length : null),
            mime: (file as any)?.type || 'text/plain',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
            file_hash: fileHash || null
          }
        })
        .select('id')
        .single();

      if (error) {
        logger.error('DB insert failed for tridium_imports', error);
        return { success: false, error: error.message };
      }

      return { success: true, id: data?.id };
    } catch (e) {
      logger.error('Unexpected error in storeUploadedDataset', e);
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  }
}
