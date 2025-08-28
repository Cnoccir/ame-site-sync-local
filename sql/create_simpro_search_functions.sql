-- Create search functions for SimPro customer lookup
-- These functions provide fuzzy search capabilities for the customer autofill feature

-- Function to search customers by name with similarity scoring
CREATE OR REPLACE FUNCTION search_simpro_customers_by_name(search_name TEXT)
RETURNS TABLE (
  id TEXT,
  company_name TEXT,
  mailing_address TEXT,
  mailing_city TEXT,
  mailing_state TEXT,
  mailing_zip TEXT,
  email TEXT,
  service_tier TEXT,
  similarity_score FLOAT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.simpro_customer_id::TEXT as id,
    sc.company_name,
    sc.mailing_address,
    sc.mailing_city,
    sc.mailing_state,
    sc.mailing_zip,
    sc.email,
    sc.service_tier,
    -- Use trigram similarity for fuzzy matching
    GREATEST(
      similarity(sc.company_name, search_name),
      similarity(COALESCE(sc.company_name, ''), search_name)
    ) as similarity_score
  FROM simpro_customers sc
  WHERE 
    -- Use both trigram similarity and ILIKE for comprehensive matching
    (
      sc.company_name % search_name 
      OR sc.company_name ILIKE '%' || search_name || '%'
      OR similarity(sc.company_name, search_name) > 0.1
    )
    AND sc.company_name IS NOT NULL
    AND LENGTH(TRIM(sc.company_name)) > 0
  ORDER BY similarity_score DESC, sc.company_name
  LIMIT 10;
END;
$$;

-- Function to search across multiple fields (company name, address, city)
CREATE OR REPLACE FUNCTION search_simpro_customers_multi(search_text TEXT)
RETURNS TABLE (
  id TEXT,
  company_name TEXT,
  mailing_address TEXT,
  mailing_city TEXT,
  mailing_state TEXT,
  mailing_zip TEXT,
  email TEXT,
  service_tier TEXT,
  similarity_score FLOAT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.simpro_customer_id::TEXT as id,
    sc.company_name,
    sc.mailing_address,
    sc.mailing_city,
    sc.mailing_state,
    sc.mailing_zip,
    sc.email,
    sc.service_tier,
    -- Calculate similarity across multiple fields
    GREATEST(
      similarity(COALESCE(sc.company_name, ''), search_text),
      similarity(COALESCE(sc.mailing_address, ''), search_text),
      similarity(COALESCE(sc.mailing_city, ''), search_text),
      -- Combine address parts for better matching
      similarity(
        COALESCE(sc.mailing_address, '') || ' ' || 
        COALESCE(sc.mailing_city, '') || ' ' || 
        COALESCE(sc.mailing_state, ''), 
        search_text
      )
    ) as similarity_score
  FROM simpro_customers sc
  WHERE 
    (
      -- Company name matching
      sc.company_name % search_text 
      OR sc.company_name ILIKE '%' || search_text || '%'
      -- Address matching
      OR sc.mailing_address % search_text
      OR sc.mailing_address ILIKE '%' || search_text || '%'
      -- City matching
      OR sc.mailing_city % search_text
      OR sc.mailing_city ILIKE '%' || search_text || '%'
      -- Combined similarity check
      OR similarity(
        COALESCE(sc.company_name, '') || ' ' || 
        COALESCE(sc.mailing_address, '') || ' ' || 
        COALESCE(sc.mailing_city, ''), 
        search_text
      ) > 0.1
    )
    AND sc.company_name IS NOT NULL
    AND LENGTH(TRIM(sc.company_name)) > 0
  ORDER BY similarity_score DESC, sc.company_name
  LIMIT 10;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_simpro_customers_by_name(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_simpro_customers_multi(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_simpro_customers_by_name(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION search_simpro_customers_multi(TEXT) TO anon;
