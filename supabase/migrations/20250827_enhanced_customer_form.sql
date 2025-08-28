-- Enhanced Customer Form Migration
-- Created: 2025-08-27
-- Description: Adds new fields to ame_customers table for enhanced customer onboarding

-- ============================================================================
-- ADD NEW COLUMNS TO AME_CUSTOMERS TABLE
-- ============================================================================

-- Building Information Enhancements
ALTER TABLE ame_customers 
ADD COLUMN IF NOT EXISTS system_architecture VARCHAR(100);

ALTER TABLE ame_customers 
ADD COLUMN IF NOT EXISTS primary_bas_platform VARCHAR(100);

-- Contact Information Enhancements
ALTER TABLE ame_customers 
ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100);

ALTER TABLE ame_customers 
ADD COLUMN IF NOT EXISTS contact_role VARCHAR(50);

-- Access Information Enhancements
ALTER TABLE ame_customers 
ADD COLUMN IF NOT EXISTS access_method VARCHAR(100);

ALTER TABLE ame_customers 
ADD COLUMN IF NOT EXISTS parking_instructions TEXT;

ALTER TABLE ame_customers 
ADD COLUMN IF NOT EXISTS special_access_notes TEXT;

-- Technician Assignment
ALTER TABLE ame_customers 
ADD COLUMN IF NOT EXISTS primary_technician_id VARCHAR(50);

ALTER TABLE ame_customers 
ADD COLUMN IF NOT EXISTS secondary_technician_id VARCHAR(50);

-- ============================================================================
-- CREATE TECHNICIAN DATA TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ame_technicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_name VARCHAR(100) NOT NULL,
    mobile_phone VARCHAR(20),
    email VARCHAR(255) UNIQUE NOT NULL,
    extension VARCHAR(10),
    direct_line VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    hire_date DATE,
    specialties TEXT[],
    region VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CREATE CUSTOMER ID SEQUENCE FUNCTION
-- ============================================================================

-- Function to generate next customer ID in AME-YYYY-XXX format
CREATE OR REPLACE FUNCTION generate_next_customer_id()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    max_sequence INTEGER;
    next_sequence INTEGER;
    new_customer_id TEXT;
BEGIN
    -- Get current year
    current_year := EXTRACT(year FROM CURRENT_DATE)::TEXT;
    
    -- Find the highest sequence number for current year
    SELECT COALESCE(MAX(CAST(SUBSTRING(customer_id FROM 10) AS INTEGER)), 0)
    INTO max_sequence
    FROM ame_customers 
    WHERE customer_id LIKE 'AME-' || current_year || '-%'
    AND customer_id ~ '^AME-\d{4}-\d{3}$';
    
    -- Increment sequence
    next_sequence := max_sequence + 1;
    
    -- Format with leading zeros (3 digits)
    new_customer_id := 'AME-' || current_year || '-' || LPAD(next_sequence::TEXT, 3, '0');
    
    RETURN new_customer_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INSERT TECHNICIAN DATA FROM PHONE DIRECTORY
-- ============================================================================

INSERT INTO ame_technicians (employee_name, mobile_phone, email, extension, direct_line, is_active) VALUES
('Aaron Melendez', '973-524-3686', 'aaron@ame-inc.com', NULL, NULL, true),
('Abdulla Siddi', '973-262-3246', 'abdulla@ame-inc.com', '500', NULL, true),
('Ajai Naicken', '908-405-5069', 'ajai@ame-inc.com', '1150', NULL, true),
('Alicia Capozzi', '561-558-6425', 'alicia@ame-inc.com', NULL, NULL, true),
('Amit Mehta', '862-355-6132', 'amitmehta@ame-inc.com', NULL, NULL, true),
('Amit Patel', '973-332-1303', 'amit@ame-inc.com', '540', '862-325-1213', true),
('Amy Miller', '973-865-9539', 'amy@ame-inc.com', '570', '862-325-4580', true),
('Anubhav Anubhav', '973-349-6779', 'anubhav@ame-inc.com', NULL, NULL, true),
('Anthony DiCroce', '973-647-9361', 'anthony@ame-inc.com', '280', '862-325-6820', true),
('Annie Wong', NULL, 'annie@ame-inc.com', '360', '862-246-1563', true),
('Ariel San Gabriel', '973-518-2356', 'ariel@ame-inc.com', NULL, NULL, true),
('Asha Padhi', '216-854-8351', 'asha@ame-inc.com', NULL, NULL, true),
('Bhavik Raithatha', '551-229-8301', 'bhavik@ame-inc.com', NULL, NULL, true),
('Bill Ivos', '973-417-5727', 'bill@ame-inc.com', '580', NULL, true),
('Bob Okafor', '973-647-8079', 'bob@ame-inc.com', NULL, NULL, true),
('Brian Donoghue', '732-524-8826', 'brian@ame-inc.com', '610', NULL, true),
('Brian Savage', '201-704-8063', 'briansavage@ame-inc.com', '620', NULL, true),
('Butch Garry', '862-774-1124', 'butch@ame-inc.com', NULL, NULL, true),
('Cheryle Nunez', '201-560-2717', 'cheryle@ame-inc.com', '270', '862-325-6636', true),
('Christian Garcia', '862-763-3955', 'christian@ame-inc.com', NULL, NULL, true),
('Craig Struble', '973-396-6086', 'craig@ame-inc.com', '600', NULL, true),
('Craig Wells', '732-877-4215', 'craigwells@ame-inc.com', NULL, NULL, true),
('Danish Shaikh', '973-369-5591', 'danish@ame-inc.com', '1160', NULL, true),
('Danny DiPrenda', '973-525-6227', 'danny@ame-inc.com', '390', '862-246-1591', true),
('Dave Cieszkiewicz', '732-397-2292', 'dave@ame-inc.com', '650', NULL, true),
('David Amin', '973-518-9868', 'david@ame-inc.com', NULL, NULL, true),
('Devindra Dilchand', '201-956-9754', 'devindra@ame-inc.com', '1170', '856-515-0978', true),
('Dinesh Nair', '973-618-8327', 'dinesh@ame-inc.com', NULL, NULL, true),
('Elliot Avidane', '917-417-6959', 'elliot@ame-inc.com', NULL, NULL, true),
('Eric Niedle', '908-581-1862', 'eric@ame-inc.com', '680', '862-325-4973', true),
('Felipe (Jose) Lopez', '973-631-0489', 'joselopez@ame-inc.com', NULL, '210-837-8883', true),
('Frank DeTullio', '862-345-0372', 'frank@ame-inc.com', NULL, NULL, true),
('Francois Machado', '631-897-4510', 'francois@ame-inc.com', NULL, NULL, true),
('Gavin Lall', '862-441-2556', 'gavin@ame-inc.com', NULL, NULL, true),
('Giresh Ramsarran', '973-647-7835', 'giresh@ame-inc.com', '1180', '862-276-8798', true),
('Giuseppe DeLuca', '973-936-3445', 'giuseppe@ame-inc.com', '1190', NULL, true),
('Glenn Craft', '201-452-3630', 'glennc@ame-inc.com', '700', NULL, true),
('Gurpreet Manda', '608-695-6740', 'gurpreet@ame-inc.com', '490', NULL, true),
('Hamyr Oliveres', '973-800-6809', 'hamyr@ame-inc.com', NULL, NULL, true),
('Henry Sanches', '973-518-4794', 'Henry@ame-inc.com', NULL, NULL, true),
('Jack Rinderknecht', '862-396-7806', 'jack@ame-inc.com', NULL, NULL, true),
('Jason Dein', '973-294-8059', 'jasondein@ame-inc.com', NULL, NULL, true),
('Jason DeJesus', '347-706-2166', 'jason@ame-inc.com', NULL, NULL, true),
('Jason Goodie', '973-946-9923', 'jasong@ame-incom', NULL, NULL, true),
('Jennifer Iovane', '516-725-0646', 'jenniferi@ame-inc.com', NULL, NULL, true),
('Jim Winship', '908-442-2140', 'james@ame-inc.com', '740', '862-325-3864', true),
('Joe Coscia', '973-897-4560', 'joecoscia@ame-inc.com', '550', NULL, true),
('John Delouisa', '908-625-3633', 'johnd@ame-inc.com', '760', NULL, true),
('John Mazurek', '732-496-9058', 'johnm@ame-inc.com', NULL, NULL, true),
('John Signori', '973-224-0551', 'john@ame-inc.com', '480', NULL, true),
('Jordan Fazio', '973-294-6214', 'jordan@ame-inc.com', NULL, NULL, true),
('Jose Hernandez', '862-396-7966', 'jose@ame-inc.com', NULL, NULL, true),
('Joshua Zottoli', '973-518-4164', 'joshua@ame-inc.com', NULL, NULL, true),
('Justin Bowen', '908-448-8404', 'justin@ame-inc.com', '510', NULL, true),
('Kathy Coviello', '973-943-3307', 'kathy@ame-inc.com', '230', '862-325-4702', true),
('Keenel Rosete', '347-865-3760', 'keenel@ame-inc.com', NULL, NULL, true),
('Keith Breiner', '973-997-2326', 'keith@ame-inc.com', '800', NULL, true),
('Kelvin Pichardo', '973-525-3126', 'kelvin@ame-inc.com', NULL, NULL, true),
('Keyur Desai', '973-224-1472', 'keyur@ame-inc.com', '810', '862-325-6568', true),
('Kevin Dowd', '862-666-0853', 'kevin@ame-inc.com', NULL, NULL, true),
('Landon Connor', '609-954-9758', 'landon@ame-inc.com', '530', NULL, true),
('Levi Altein', '845-402-6481', 'levi@ame-inc.com', NULL, NULL, true),
('Lorenzo Mastropasqua', '973-369-2304', 'lorenzo@ame-inc.com', '830', NULL, true),
('Mamshad Mohammed', '973-640-2058', 'mamshad@ame-inc.com', NULL, NULL, true),
('Manuel Molina', '973-513-0617', 'manuel@ame-inc.com', NULL, '862-246-1550', true),
('Mariela Peralta', NULL, 'mariela@ame-inc.com', '220', '862-325-3867', true),
('Mario Bolanos', '973-975-2494', 'mario@ame-inc.com', '850', NULL, true),
('Mark McLeod', '973-349-7044', 'markm@ame-inc.com', '860', NULL, true),
('Mathew Messer', '973-647-8640', 'mathew@ame-inc.com', NULL, NULL, true),
('Mercedes Gonzales', '973-934-3443', 'mercedes@ame-inc.com', NULL, NULL, true),
('Mike Borges', '973-294-2837', 'michael@ame-inc.com', NULL, NULL, true),
('Mike Newcomer', '717-572-6378', 'miken@ame-inc.com', NULL, NULL, true),
('Mike Vlacancich', '973-570-5775', 'mike@ame-inc.com', '870', NULL, true),
('Mohammad Ahmmed', '973-518-3104', 'mohammad@ame-inc.com', NULL, NULL, true),
('Nick Winship', '908-635-8706', 'nicholas@ame-inc.com', '720', NULL, true),
('Nico Delorenzo', '908-447-7010', 'nico@ame-inc.com', '780', NULL, true),
('Nicole LeBlanc', NULL, 'nicole@ame-inc.com', '240', '862-325-3167', true),
('Nikhil Vaidya', '201-704-6767', 'nikhil@ame-inc.com', '980', '732-532-9760', true),
('Paul Bruno', '732-668-1630', 'paulb@ame-inc.com', '910', NULL, true),
('Paul Yingling', '973-214-6886', 'paul@ame-inc.com', '920', NULL, true),
('Pavan Kandhala', '973-518-9904', 'pavan@ame-inc.com', NULL, NULL, true),
('Perry Condoluci', '973-561-7306', 'perry@ame-inc.com', NULL, NULL, true),
('Peter Petrenko', '732-682-7520', 'peter@ame-inc.com', '930', NULL, true),
('Raymond Nocciolo', '973-800-3505', 'raymond@ame-inc.com', '1020', NULL, true),
('Remote Support Yogesh', NULL, 'yogesh@ame-inc.com', '400', '862-325-0161', true),
('Rich Ink', '973-987-7919', 'rich@ame-inc.com', '950', NULL, true),
('Richard Bhajan', '973-629-2064', 'richb@ame-inc.com', '1130', '347-737-7729', true),
('Ricky Chotalal', '973-224-1553', 'ricky@ame-inc.com', '970', NULL, true),
('Robert Lee', '973-518-5704', 'robert@ame-inc.com', NULL, NULL, true),
('Rohan Nikhare', '302-853-7011', 'rohannikhare@ame-inc.com', NULL, NULL, true),
('Ron Jeter', '973-303-0312', 'ron@ame-inc.com', '1030', NULL, true),
('Ruben De La Cruz', '862-330-8680', 'ruben@ame-inc.com', NULL, NULL, true),
('Rupert Chandool', '973-647-2902', 'rupert@ame-inc.com', '900', '973-445-3323', true),
('Rushi Gujar', '973-525-3260', 'rushi@ame-inc.com', NULL, '862-325-0161', true),
('Saurabh Karmalkar', '973-865-9421', 'saurabh@ame-inc.com', NULL, NULL, true),
('Samer Elghoben', '973-768-1626', 'samer@ame-inc.com', NULL, NULL, true),
('Savitri Pancham', NULL, 'savitri@ame-inc.com', '430', NULL, true),
('Shashank Sartape', '862-666-0953', 'shashank@ame-inc.com', NULL, NULL, true),
('Steve Illes', '732-725-2689', 'steve@ame-inc.com', '250', '862-325-4581', true),
('Steven Mailloux', '973-557-1169', 'steven@ame-inc.com', '1050', NULL, true),
('Terry Cantwell', '908-930-7020', 'terry@ame-inc.com', NULL, NULL, true),
('Thomas Brodowski', '973-567-8723', 'thomas@ame-inc.com', NULL, NULL, true),
('Threshan Ramsarran', '973-486-5511', 'threshan@ame-inc.com', '1070', '862-276-4561', true),
('Tyler Holleran', '862-266-5983', 'tyler@ame-inc.com', NULL, NULL, true),
('Vernie Redano', '973-618-7933', 'vernie@ame-inc.com', NULL, NULL, true),
('Victor Ayoola', '973-768-1559', 'victorayoola@ame-inc.com', NULL, NULL, true),
('Victor Leon', '973-513-0616', 'victorl@ame-inc.com', NULL, NULL, true),
('Victor Toledo', '973-557-7432', 'victor@ame-inc.com', '1090', NULL, true),
('Victoria Meyer', '973-750-6987', 'victoria@ame-inc.com', '320', '862-325-3866', true),
('Vincent Daniello', '973-800-4057', 'vincent@ame-inc.com', '1060', NULL, true),
('Wilson Herrera Junior', '973-557-0095', 'wilson@ame-inc.com', '1120', '732-347-0552', true),
('Wilson Herrera Senior', '973-525-6463', 'wilsonsenior@ame-inc.com', '990', '973-525-6463', true),
('Yasir Mohammed', '862-451-0890', 'yasir@ame-inc.com', NULL, NULL, true)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_customers_system_architecture ON ame_customers(system_architecture);
CREATE INDEX IF NOT EXISTS idx_customers_primary_bas_platform ON ame_customers(primary_bas_platform);
CREATE INDEX IF NOT EXISTS idx_customers_primary_technician ON ame_customers(primary_technician_id);
CREATE INDEX IF NOT EXISTS idx_customers_secondary_technician ON ame_customers(secondary_technician_id);

CREATE INDEX IF NOT EXISTS idx_technicians_email ON ame_technicians(email);
CREATE INDEX IF NOT EXISTS idx_technicians_is_active ON ame_technicians(is_active);
CREATE INDEX IF NOT EXISTS idx_technicians_employee_name ON ame_technicians(employee_name);

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN ame_customers.system_architecture IS 'System architecture type: Engine-Only, Supervisor-Based, Hybrid, or Legacy Standalone';
COMMENT ON COLUMN ame_customers.primary_bas_platform IS 'Primary BAS platform such as Niagara N4, Metasys, etc.';
COMMENT ON COLUMN ame_customers.contact_name IS 'Primary site contact name';
COMMENT ON COLUMN ame_customers.contact_role IS 'Role/title of primary contact (Facilities Manager, Plant Engineer, etc.)';
COMMENT ON COLUMN ame_customers.access_method IS 'Site access method (Walk-in, Front desk check-in, Security escort, etc.)';
COMMENT ON COLUMN ame_customers.parking_instructions IS 'Parking instructions for technicians';
COMMENT ON COLUMN ame_customers.special_access_notes IS 'Special access notes and requirements';
COMMENT ON COLUMN ame_customers.primary_technician_id IS 'Primary assigned technician ID';
COMMENT ON COLUMN ame_customers.secondary_technician_id IS 'Secondary/backup technician ID';

COMMENT ON TABLE ame_technicians IS 'Technician directory for customer assignments and contact information';
COMMENT ON COLUMN ame_technicians.employee_name IS 'Full name of the technician';
COMMENT ON COLUMN ame_technicians.specialties IS 'Array of technician specialties and certifications';
COMMENT ON COLUMN ame_technicians.region IS 'Geographic region or territory assigned to technician';

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE ame_technicians ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read technician data
CREATE POLICY "Allow authenticated users to read technicians" ON ame_technicians
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to update technician data
CREATE POLICY "Allow authenticated users to update technicians" ON ame_technicians
    FOR UPDATE TO authenticated USING (true);

-- ============================================================================
-- MIGRATION COMPLETION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '======================================';
    RAISE NOTICE 'Enhanced Customer Form Migration Complete!';
    RAISE NOTICE '======================================';
    RAISE NOTICE 'New columns added to ame_customers:';
    RAISE NOTICE '  ✓ system_architecture';
    RAISE NOTICE '  ✓ primary_bas_platform'; 
    RAISE NOTICE '  ✓ contact_name';
    RAISE NOTICE '  ✓ contact_role';
    RAISE NOTICE '  ✓ access_method';
    RAISE NOTICE '  ✓ parking_instructions';
    RAISE NOTICE '  ✓ special_access_notes';
    RAISE NOTICE '  ✓ primary_technician_id';
    RAISE NOTICE '  ✓ secondary_technician_id';
    RAISE NOTICE '======================================';
    RAISE NOTICE 'New table created:';
    RAISE NOTICE '  ✓ ame_technicians (with %s technicians)', (SELECT COUNT(*) FROM ame_technicians);
    RAISE NOTICE '======================================';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '  ✓ generate_next_customer_id()';
    RAISE NOTICE '======================================';
    RAISE NOTICE 'Migration completed at: %', NOW();
    RAISE NOTICE '======================================';
END $$;
