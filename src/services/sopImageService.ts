import { supabase } from '@/integrations/supabase/client';

export class SOPImageService {
  // Resize image to max dimensions while maintaining aspect ratio
  static async resizeImage(file: File, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.8): Promise<File> {
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
            const resizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  static async uploadStepImage(
    sopId: string, 
    stepNumber: number, 
    file: File
  ): Promise<string> {
    try {
      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (userRole?.role !== 'admin') {
        throw new Error('Only admins can upload SOP images');
      }

      // Resize image before upload
      const resizedFile = await this.resizeImage(file);

      // Generate unique file name
      const timestamp = Date.now();
      const fileName = `${sopId}/step-${stepNumber}-${timestamp}.jpg`;

      // Remove old image if it exists
      await this.removeOldStepImage(sopId, stepNumber);

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('sop-images')
        .upload(fileName, resizedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('sop-images')
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;

      // Update SOP with new image URL
      await this.updateSOPStepImage(sopId, stepNumber, imageUrl);

      return imageUrl;
    } catch (error) {
      console.error('Error uploading SOP image:', error);
      throw error;
    }
  }

  static async removeOldStepImage(sopId: string, stepNumber: number): Promise<void> {
    try {
      // Get current step_images to find old file
      const { data: sop } = await supabase
        .from('ame_sops_normalized')
        .select('step_images')
        .eq('sop_id', sopId)
        .single();

      if (sop?.step_images?.[stepNumber.toString()]) {
        const oldImageUrl = sop.step_images[stepNumber.toString()];
        const urlParts = oldImageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        if (fileName) {
          await supabase.storage
            .from('sop-images')
            .remove([`${sopId}/${fileName}`]);
        }
      }
    } catch (error) {
      console.error('Error removing old step image:', error);
      // Don't throw here as this is cleanup - continue with upload
    }
  }

  static async updateSOPStepImage(
    sopId: string, 
    stepNumber: number, 
    imageUrl: string
  ): Promise<void> {
    try {
      // Get current step_images
      const { data: sop, error: fetchError } = await supabase
        .from('ame_sops_normalized')
        .select('step_images')
        .eq('sop_id', sopId)
        .single();

      if (fetchError) throw fetchError;

      const stepImages = sop.step_images || {};
      stepImages[stepNumber.toString()] = imageUrl;

      // Update the SOP
      const { error: updateError } = await supabase
        .from('ame_sops_normalized')
        .update({ step_images: stepImages })
        .eq('sop_id', sopId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating SOP step image:', error);
      throw error;
    }
  }

  static async removeStepImage(
    sopId: string, 
    stepNumber: number
  ): Promise<void> {
    try {
      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (userRole?.role !== 'admin') {
        throw new Error('Only admins can remove SOP images');
      }

      // Get current step_images
      const { data: sop, error: fetchError } = await supabase
        .from('ame_sops_normalized')
        .select('step_images')
        .eq('sop_id', sopId)
        .single();

      if (fetchError) throw fetchError;

      const stepImages = sop.step_images || {};
      const oldImageUrl = stepImages[stepNumber.toString()];

      // Remove from step_images
      delete stepImages[stepNumber.toString()];

      // Update the SOP
      const { error: updateError } = await supabase
        .from('ame_sops_normalized')
        .update({ step_images: stepImages })
        .eq('sop_id', sopId);

      if (updateError) throw updateError;

      // Remove from storage if it exists
      if (oldImageUrl) {
        const urlParts = oldImageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) {
          await supabase.storage
            .from('sop-images')
            .remove([`${sopId}/${fileName}`]);
        }
      }
    } catch (error) {
      console.error('Error removing SOP step image:', error);
      throw error;
    }
  }

  // Get all images for a SOP for report generation
  static async getSOPImages(sopId: string): Promise<Record<number, string>> {
    try {
      const { data: sop, error } = await supabase
        .from('ame_sops_normalized')
        .select('step_images')
        .eq('sop_id', sopId)
        .single();

      if (error) throw error;

      const stepImages = sop.step_images || {};
      const imageMap: Record<number, string> = {};

      // Convert string keys to numbers
      Object.entries(stepImages).forEach(([step, url]) => {
        imageMap[parseInt(step)] = url as string;
      });

      return imageMap;
    } catch (error) {
      console.error('Error getting SOP images:', error);
      return {};
    }
  }

  static getImageUrl(sopId: string, stepNumber: number, stepImages?: any): string | null {
    if (!stepImages) return null;
    return stepImages[stepNumber.toString()] || null;
  }
}