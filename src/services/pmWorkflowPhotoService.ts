import { supabase } from '@/integrations/supabase/client';

export interface PMPhoto {
  id: string;
  filename: string;
  description: string;
  altText?: string;
  category: 'Equipment' | 'Screenshot' | 'Other';
  timestamp: Date;
  url?: string;
  file?: File | Blob;
  workflowId?: string;
  phaseId?: string;
}

export class PMWorkflowPhotoService {
  /**
   * Resize image to max dimensions while maintaining aspect ratio
   */
  static async resizeImage(file: File | Blob, maxWidth: number = 1200, maxHeight: number = 900, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file instanceof File ? file.name : 'image.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            resolve(file instanceof File ? file : new File([file], 'image.jpg'));
          }
        }, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Upload a photo to Supabase storage
   */
  static async uploadPhoto(
    workflowId: string,
    phaseId: string,
    file: File | Blob,
    photoData: Partial<PMPhoto>
  ): Promise<PMPhoto> {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Resize image before upload
      const resizedFile = await this.resizeImage(file);

      // Generate unique file name
      const timestamp = Date.now();
      const fileExtension = photoData.category === 'Screenshot' ? 'png' : 'jpg';
      const fileName = `pm-workflow/${workflowId}/${phaseId}/${photoData.category?.toLowerCase()}-${timestamp}.${fileExtension}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pm-photos')
        .upload(fileName, resizedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('pm-photos')
        .getPublicUrl(fileName);

      const photoUrl = urlData.publicUrl;

      // Create photo record in database
      const photo: PMPhoto = {
        id: photoData.id || `photo-${timestamp}`,
        filename: fileName,
        description: photoData.description || '',
        altText: photoData.altText || '',
        category: photoData.category || 'Other',
        timestamp: new Date(),
        url: photoUrl,
        workflowId,
        phaseId
      };

      // Save photo metadata to database
      const { error: dbError } = await supabase
        .from('pm_workflow_photos')
        .insert({
          id: photo.id,
          workflow_id: workflowId,
          phase_id: phaseId,
          filename: photo.filename,
          description: photo.description,
          alt_text: photo.altText,
          category: photo.category,
          url: photo.url,
          uploaded_by: user.id,
          created_at: photo.timestamp.toISOString()
        });

      if (dbError) {
        console.error('Failed to save photo metadata:', dbError);
        // Continue anyway - the file is uploaded, just missing metadata
      }

      return photo;

    } catch (error) {
      console.error('Photo upload failed:', error);
      throw new Error(`Failed to upload photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload multiple photos at once
   */
  static async uploadPhotos(
    workflowId: string,
    phaseId: string,
    files: File[],
    category: PMPhoto['category'] = 'Equipment'
  ): Promise<PMPhoto[]> {
    const uploadPromises = files.map((file, index) =>
      this.uploadPhoto(workflowId, phaseId, file, {
        id: `photo-${Date.now()}-${index}`,
        description: `${category} Photo ${index + 1}`,
        category,
        filename: file.name
      })
    );

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Batch photo upload failed:', error);
      throw error;
    }
  }

  /**
   * Capture and upload screenshot
   */
  static async captureAndUploadScreenshot(
    workflowId: string,
    phaseId: string,
    description?: string
  ): Promise<PMPhoto> {
    try {
      // Check if screen capture is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen capture not supported in this browser');
      }

      // Capture screen
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' }
      });

      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;

      return new Promise((resolve, reject) => {
        video.addEventListener('loadedmetadata', async () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            ctx?.drawImage(video, 0, 0);

            // Stop the stream
            stream.getTracks().forEach(track => track.stop());

            // Convert to blob
            canvas.toBlob(async (blob) => {
              if (blob) {
                try {
                  const photo = await this.uploadPhoto(workflowId, phaseId, blob, {
                    id: `screenshot-${Date.now()}`,
                    description: description || 'System Screenshot',
                    category: 'Screenshot'
                  });
                  resolve(photo);
                } catch (uploadError) {
                  reject(uploadError);
                }
              } else {
                reject(new Error('Failed to convert canvas to blob'));
              }
            }, 'image/png');
          } catch (error) {
            reject(error);
          }
        });

        video.addEventListener('error', () => {
          reject(new Error('Failed to load video stream'));
        });

        video.play();
      });

    } catch (error) {
      console.error('Screenshot capture failed:', error);
      throw new Error(`Failed to capture screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a photo from storage and database
   */
  static async deletePhoto(photoId: string): Promise<void> {
    try {
      // Get photo metadata from database
      const { data: photo, error: fetchError } = await supabase
        .from('pm_workflow_photos')
        .select('filename')
        .eq('id', photoId)
        .single();

      if (fetchError) {
        console.error('Failed to fetch photo metadata:', fetchError);
        throw new Error(`Failed to find photo: ${fetchError.message}`);
      }

      // Delete from storage first (if file exists)
      if (photo?.filename) {
        const { error: storageError } = await supabase.storage
          .from('pm-photos')
          .remove([photo.filename]);

        if (storageError) {
          console.error('Failed to delete from storage:', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('pm_workflow_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) {
        console.error('Failed to delete from database:', dbError);
        throw new Error(`Failed to delete photo record: ${dbError.message}`);
      }

      console.log('Photo deleted successfully:', photoId);

    } catch (error) {
      console.error('Photo deletion failed:', error);
      if (error instanceof Error) {
        throw error; // Re-throw with original message
      } else {
        throw new Error(`Failed to delete photo: Unknown error`);
      }
    }
  }

  /**
   * Get all photos for a workflow phase
   */
  static async getPhasePhotos(workflowId: string, phaseId: string): Promise<PMPhoto[]> {
    try {
      const { data, error } = await supabase
        .from('pm_workflow_photos')
        .select('*')
        .eq('workflow_id', workflowId)
        .eq('phase_id', phaseId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(row => ({
        id: row.id,
        filename: row.filename,
        description: row.description || '',
        altText: row.alt_text || '',
        category: row.category as PMPhoto['category'],
        timestamp: new Date(row.created_at),
        url: row.url,
        workflowId: row.workflow_id,
        phaseId: row.phase_id
      }));

    } catch (error) {
      console.error('Failed to fetch photos:', error);
      return [];
    }
  }

  /**
   * Update photo metadata
   */
  static async updatePhoto(photoId: string, updates: Partial<Pick<PMPhoto, 'description' | 'altText'>>): Promise<void> {
    try {
      const { error } = await supabase
        .from('pm_workflow_photos')
        .update({
          description: updates.description,
          alt_text: updates.altText
        })
        .eq('id', photoId);

      if (error) throw error;

    } catch (error) {
      console.error('Failed to update photo:', error);
      throw new Error(`Failed to update photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check storage bucket availability (for setup)
   */
  static async ensureStorageBucket(): Promise<void> {
    try {
      // Check if bucket exists
      const { data, error } = await supabase.storage.getBucket('pm-photos');

      if (error || !data) {
        // Attempt to create the bucket on first run
        const { error: createError } = await supabase.storage.createBucket('pm-photos', {
          public: true,
          fileSizeLimit: 10485760,
          allowedMimeTypes: ['image/jpeg','image/jpg','image/png','image/webp']
        });

        if (createError) {
          // Creating buckets requires elevated privileges; on client anon key this may fail under RLS.
          // That's expected in many environments; proceed without interrupting the UI.
          console.info('pm-photos bucket not available and cannot be created from client (expected under RLS).');
        } else {
          console.info('Created pm-photos storage bucket.');
        }
        return;
      }

      if (data) {
        console.log('Storage bucket pm-photos is available');
      }
    } catch (error) {
      console.warn('Storage bucket check failed:', error);
      // Don't throw - this is not critical for initial setup
    }
  }

  /**
   * Test storage functionality
   */
  static async testStorageAccess(): Promise<boolean> {
    try {
      // Try to list files in the bucket (should work even if empty)
      const { data, error } = await supabase.storage
        .from('pm-photos')
        .list('', { limit: 1 });

      if (error) {
        console.error('Storage test failed:', error);
        return false;
      }

      console.log('Storage access test passed');
      return true;
    } catch (error) {
      console.error('Storage test error:', error);
      return false;
    }
  }
}