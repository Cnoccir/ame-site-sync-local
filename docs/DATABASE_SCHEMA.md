ame_visits v ON vs.visit_id = v.id
WHERE vs.is_active = true 
  AND vs.expires_at > NOW()
  AND v.technician_id = $1;
```

## Data Migration & Import Patterns

### CSV Import Processing
```sql
-- Batch import tracking
CREATE TABLE import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file TEXT NOT NULL,
  import_type TEXT NOT NULL,
  status TEXT DEFAULT 'processing',
  total_records INTEGER,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Error handling for imports
CREATE TABLE import_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES import_batches(id),
  row_number INTEGER,
  error_message TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Data Normalization Functions
```sql
-- Customer data standardization
CREATE OR REPLACE FUNCTION normalize_customer_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Standardize phone numbers
  NEW.phone = regexp_replace(NEW.phone, '[^0-9]', '', 'g');
  
  -- Normalize email addresses
  NEW.email = LOWER(TRIM(NEW.email));
  
  -- Standardize service tier
  NEW.service_tier = UPPER(NEW.service_tier);
  
  -- Generate customer number if not provided
  IF NEW.customer_number IS NULL THEN
    NEW.customer_number = 'AME-' || LPAD(nextval('customer_sequence')::text, 6, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Audit Trail Implementation

### Comprehensive Change Tracking
```sql
-- Audit log structure
CREATE TABLE ame_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  user_id UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  context JSONB -- Additional metadata
);

-- Trigger function for automatic audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  old_row JSONB := NULL;
  new_row JSONB := NULL;
  changed_fields TEXT[] := '{}';
BEGIN
  -- Capture old and new row data
  IF TG_OP = 'DELETE' THEN
    old_row = to_jsonb(OLD);
  ELSIF TG_OP = 'UPDATE' THEN
    old_row = to_jsonb(OLD);
    new_row = to_jsonb(NEW);
    -- Identify changed fields
    SELECT array_agg(key) INTO changed_fields
    FROM jsonb_each(old_row) old_kv
    JOIN jsonb_each(new_row) new_kv ON old_kv.key = new_kv.key
    WHERE old_kv.value != new_kv.value;
  ELSIF TG_OP = 'INSERT' THEN
    new_row = to_jsonb(NEW);
  END IF;

  -- Insert audit record
  INSERT INTO ame_audit_logs (
    table_name, record_id, operation,
    old_values, new_values, changed_fields,
    user_id
  ) VALUES (
    TG_TABLE_NAME, 
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    old_row, new_row, changed_fields,
    auth.uid()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

## Real-time Features & Subscriptions

### Supabase Real-time Configuration
```sql
-- Enable real-time for collaborative features
ALTER PUBLICATION supabase_realtime 
ADD TABLE ame_visit_sessions,
ADD TABLE ame_visit_progress,
ADD TABLE device_inventory;

-- Real-time policies
CREATE POLICY realtime_visit_sessions ON ame_visit_sessions
FOR SELECT USING (
  visit_id IN (
    SELECT id FROM ame_visits 
    WHERE technician_id = (
      SELECT id FROM ame_technicians 
      WHERE user_id = auth.uid()
    )
  )
);
```

### Session Cleanup & Maintenance
```sql
-- Automatic session cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  -- Archive expired sessions
  INSERT INTO ame_visit_sessions_archive 
  SELECT * FROM ame_visit_sessions 
  WHERE expires_at < NOW() - INTERVAL '24 hours';
  
  -- Delete expired sessions
  DELETE FROM ame_visit_sessions 
  WHERE expires_at < NOW() - INTERVAL '24 hours';
  
  -- Log cleanup activity
  INSERT INTO system_maintenance_log (
    operation, affected_rows, performed_at
  ) VALUES (
    'session_cleanup', 
    (SELECT COUNT(*) FROM ame_visit_sessions WHERE expires_at < NOW()),
    NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup via pg_cron extension
SELECT cron.schedule('session-cleanup', '0 2 * * *', 'SELECT cleanup_expired_sessions();');
```

## Business Intelligence Views

### Service Performance Analytics
```sql
-- Technician performance metrics
CREATE VIEW technician_performance AS
SELECT 
  t.name,
  COUNT(v.id) as total_visits,
  AVG(EXTRACT(EPOCH FROM (v.completed_at - v.actual_start_time))/3600) as avg_hours_per_visit,
  COUNT(CASE WHEN v.status = 'completed' THEN 1 END) as completed_visits,
  (COUNT(CASE WHEN v.status = 'completed' THEN 1 END)::float / COUNT(v.id)) * 100 as completion_rate
FROM ame_technicians t
LEFT JOIN ame_visits v ON t.id = v.technician_id
GROUP BY t.id, t.name;

-- Service tier utilization
CREATE VIEW service_tier_metrics AS
SELECT 
  c.service_tier,
  COUNT(*) as customer_count,
  COUNT(v.id) as total_visits,
  AVG(v.duration_hours) as avg_visit_duration,
  COUNT(CASE WHEN v.status = 'completed' THEN 1 END) as successful_visits
FROM ame_customers c
LEFT JOIN ame_visits v ON c.id = v.customer_id
GROUP BY c.service_tier;
```

## Data Integrity & Constraints

### Business Rule Enforcement
```sql
-- Service tier validation
ALTER TABLE ame_customers 
ADD CONSTRAINT valid_service_tier 
CHECK (service_tier IN ('CORE', 'ASSURE', 'GUARDIAN'));

-- Visit phase progression logic
ALTER TABLE ame_visits
ADD CONSTRAINT valid_phase_progression 
CHECK (current_phase BETWEEN 1 AND 4);

-- Session expiration logic
ALTER TABLE ame_visit_sessions
ADD CONSTRAINT valid_session_duration
CHECK (expires_at > created_at);

-- Task completion requirements
ALTER TABLE ame_visit_progress
ADD CONSTRAINT completion_requires_time
CHECK ((is_completed = false) OR (is_completed = true AND completed_at IS NOT NULL));
```

### Referential Integrity
```sql
-- Foreign key constraints with cascade options
ALTER TABLE ame_visits
ADD CONSTRAINT fk_visits_customer
FOREIGN KEY (customer_id) REFERENCES ame_customers(id)
ON DELETE RESTRICT; -- Prevent accidental customer deletion

ALTER TABLE ame_visit_progress  
ADD CONSTRAINT fk_progress_visit
FOREIGN KEY (visit_id) REFERENCES ame_visits(id)
ON DELETE CASCADE; -- Clean up progress when visit deleted

ALTER TABLE ame_visit_sessions
ADD CONSTRAINT fk_sessions_visit  
FOREIGN KEY (visit_id) REFERENCES ame_visits(id)
ON DELETE CASCADE; -- Clean up sessions with visits
```

This database schema provides a robust, scalable foundation that supports the complex business requirements of field service management while maintaining data integrity, performance, and auditability throughout the system lifecycle.
