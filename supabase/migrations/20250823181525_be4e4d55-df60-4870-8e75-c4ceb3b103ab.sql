-- Allow unauthenticated data imports for admin operations
-- This enables the CSV import functionality to work without authentication

-- Drop existing restrictive policies and create new ones that allow imports
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.ame_customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.ame_customers;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.ame_customers;

-- Customers table policies
CREATE POLICY "Anyone can insert customers" 
ON public.ame_customers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update customers" 
ON public.ame_customers 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete customers" 
ON public.ame_customers 
FOR DELETE 
USING (true);

-- Tasks table policies
DROP POLICY IF EXISTS "Authenticated users can manage tasks" ON public.ame_tasks;

CREATE POLICY "Anyone can insert tasks" 
ON public.ame_tasks 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update tasks" 
ON public.ame_tasks 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete tasks" 
ON public.ame_tasks 
FOR DELETE 
USING (true);

-- Tools table policies
DROP POLICY IF EXISTS "Authenticated users can manage tools" ON public.ame_tools;

CREATE POLICY "Anyone can insert tools" 
ON public.ame_tools 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update tools" 
ON public.ame_tools 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete tools" 
ON public.ame_tools 
FOR DELETE 
USING (true);

-- SOPs table policies
DROP POLICY IF EXISTS "Authenticated users can manage SOPs" ON public.ame_sops;

CREATE POLICY "Anyone can insert SOPs" 
ON public.ame_sops 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update SOPs" 
ON public.ame_sops 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete SOPs" 
ON public.ame_sops 
FOR DELETE 
USING (true);