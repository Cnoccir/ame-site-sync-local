import { supabase } from '@/integrations/supabase/client';

export class SOPImageService {
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

      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${sopId}/step-${stepNumber}-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('sop-images')
        .upload(fileName, file, {
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
        const fileName = oldImageUrl.split('/').pop();
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

  static getImageUrl(sopId: string, stepNumber: number, stepImages?: any): string | null {
    if (!stepImages) return null;
    return stepImages[stepNumber.toString()] || null;
  }
}