-- Create storage bucket for SOP images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sop-images', 'sop-images', true);

-- Create RLS policies for SOP images - only admins can upload/modify
CREATE POLICY "Admins can upload SOP images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sop-images' AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update SOP images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'sop-images' AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete SOP images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'sop-images' AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Everyone can view SOP images"
ON storage.objects FOR SELECT
USING (bucket_id = 'sop-images');

-- Update SOPs table to include step images
ALTER TABLE public.ame_sops_normalized 
ADD COLUMN step_images JSONB DEFAULT '{}';

-- Update structure: step_images will be {"1": "image_url", "2": "image_url", etc}