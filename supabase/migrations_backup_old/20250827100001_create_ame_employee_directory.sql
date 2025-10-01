-- Create AME Employee Directory Table
-- This table stores the company-wide employee contact information

CREATE TABLE IF NOT EXISTS public.ame_employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_name VARCHAR(100) NOT NULL,
    mobile_phone VARCHAR(20),
    email VARCHAR(100),
    extension VARCHAR(20),
    direct_line VARCHAR(20),
    department VARCHAR(50),
    role VARCHAR(100),
    is_technician BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes for efficient searching
CREATE INDEX idx_ame_employees_name ON public.ame_employees(employee_name);
CREATE INDEX idx_ame_employees_email ON public.ame_employees(email);
CREATE INDEX idx_ame_employees_phone ON public.ame_employees(mobile_phone);
CREATE INDEX idx_ame_employees_is_technician ON public.ame_employees(is_technician);
CREATE INDEX idx_ame_employees_is_active ON public.ame_employees(is_active);

-- Create full-text search index for name and role
CREATE INDEX idx_ame_employees_search ON public.ame_employees 
USING gin(to_tsvector('english', employee_name || ' ' || COALESCE(role, '')));

-- Insert employee data from the company directory
INSERT INTO public.ame_employees (employee_name, mobile_phone, email, extension, direct_line, role, is_technician) VALUES
('Aaron Melendez', '973-524-3686', 'aaron@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Abdulla Siddi', '973-262-3246', 'abdulla@ame-inc.com', '500', NULL, 'Technician', TRUE),
('Ajai Naicken', '908-405-5069', 'ajai@ame-inc.com', '1150', NULL, 'Technician', TRUE),
('Alicia Capozzi', '561-558-6425', 'alicia@ame-inc.com', NULL, NULL, 'Project Manager', FALSE),
('Amit Mehta', '862-355-6132', 'amitmehta@ame-inc.com', NULL, NULL, 'Engineer', FALSE),
('Amit Patel', '973-332-1303', 'amit@ame-inc.com', '540', '862-325-1213', 'Senior Engineer', FALSE),
('Amy Miller', '973-865-9539', 'amy@ame-inc.com', '570', '862-325-4580', 'Operations Manager', FALSE),
('Anubhav Anubhav', '973-349-6779', 'anubhav@ame-inc.com', NULL, NULL, 'Engineer', FALSE),
('Anthony DiCroce', '973-647-9361', 'anthony@ame-inc.com', '280', '862-325-6820', 'Technician', TRUE),
('Annie Wong', NULL, 'annie@ame-inc.com', '360', '862-246-1563', 'Administrator', FALSE),
('Ariel San Gabriel', '973-518-2356', 'ariel@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Asha Padhi', '216-854-8351', 'asha@ame-inc.com', NULL, NULL, 'Engineer', FALSE),
('Bhavik Raithatha', '551-229-8301', 'bhavik@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Bill Ivos', '973-417-5727', 'bill@ame-inc.com', '580', NULL, 'Senior Technician', TRUE),
('Bob Okafor', '973-647-8079', 'bob@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Brian Donoghue', '732-524-8826', 'brian@ame-inc.com', '610', NULL, 'Senior Technician', TRUE),
('Brian Savage', '201-704-8063', 'briansavage@ame-inc.com', '620', NULL, 'Senior Technician', TRUE),
('Butch Garry', '862-774-1124', 'butch@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Cheryle Nunez', '201-560-2717', 'cheryle@ame-inc.com', '270', '862-325-6636', 'Office Manager', FALSE),
('Christian Garcia', '862-763-3955', 'christian@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Craig Struble', '973-396-6086', 'craig@ame-inc.com', '600', NULL, 'Senior Technician', TRUE),
('Craig Wells', '732-877-4215', 'craigwells@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Danish Shaikh', '973-369-5591', 'danish@ame-inc.com', '1160', NULL, 'Technician', TRUE),
('Danny DiPrenda', '973-525-6227', 'danny@ame-inc.com', '390', '862-246-1591', 'Administrator', FALSE),
('Dave Cieszkiewicz', '732-397-2292', 'dave@ame-inc.com', '650', NULL, 'Senior Technician', TRUE),
('David Amin', '973-518-9868', 'david@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Devindra Dilchand', '201-956-9754', 'devindra@ame-inc.com', '1170', '856-515-0978', 'Senior Technician', TRUE),
('Dinesh Nair', '973-618-8327', 'dinesh@ame-inc.com', NULL, NULL, 'Engineer', FALSE),
('Elliot Avidane', '917-417-6959', 'elliot@ame-inc.com', NULL, NULL, 'Engineer', FALSE),
('Eric Niedle', '908-581-1862', 'eric@ame-inc.com', '680', '862-325-4973', 'Engineering Manager', FALSE),
('Felipe (Jose) Lopez', '973-631-0489', 'joselopez@ame-inc.com', NULL, '210-837-8883', 'Technician', TRUE),
('Frank DeTullio', '862-345-0372', 'frank@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Francois Machado', '631-897-4510', 'francois@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Gavin Lall', '862-441-2556', 'gavin@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Giresh Ramsarran', '973-647-7835', 'giresh@ame-inc.com', '1180', '862-276-8798', 'Senior Technician', TRUE),
('Giuseppe DeLuca', '973-936-3445', 'giuseppe@ame-inc.com', '1190', NULL, 'Technician', TRUE),
('Glenn Craft', '201-452-3630', 'glennc@ame-inc.com', '700', NULL, 'Senior Technician', TRUE),
('Gurpreet Manda', '608-695-6740', 'gurpreet@ame-inc.com', '490', NULL, 'Technician', TRUE),
('Hamyr Oliveres', '973-800-6809', 'hamyr@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Henry Sanches', '973-518-4794', 'Henry@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Jack Rinderknecht', '862-396-7806', 'jack@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Jason Dein', '973-294-8059', 'jasondein@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Jason DeJesus', '347-706-2166', 'jason@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Jason Goodie', '973-946-9923', 'jasong@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Jennifer Iovane', '516-725-0646', 'jenniferi@ame-inc.com', NULL, NULL, 'Project Coordinator', FALSE),
('Jim Winship', '908-442-2140', 'james@ame-inc.com', '740', '862-325-3864', 'Senior Engineer', FALSE),
('Joe Coscia', '973-897-4560', 'joecoscia@ame-inc.com', '550', NULL, 'Senior Technician', TRUE),
('John Delouisa', '908-625-3633', 'johnd@ame-inc.com', '760', NULL, 'Senior Technician', TRUE),
('John Mazurek', '732-496-9058', 'johnm@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('John Signori', '973-224-0551', 'john@ame-inc.com', '480', NULL, 'Technician', TRUE),
('Jordan Fazio', '973-294-6214', 'jordan@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Jose Hernandez', '862-396-7966', 'jose@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Joshua Zottoli', '973-518-4164', 'joshua@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Justin Bowen', '908-448-8404', 'justin@ame-inc.com', '510', NULL, 'Technician', TRUE),
('Kathy Coviello', '973-943-3307', 'kathy@ame-inc.com', '230', '862-325-4702', 'Accounting Manager', FALSE),
('Keenel Rosete', '347-865-3760', 'keenel@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Keith Breiner', '973-997-2326', 'keith@ame-inc.com', '800', NULL, 'Senior Technician', TRUE),
('Kelvin Pichardo', '973-525-3126', 'kelvin@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Keyur Desai', '973-224-1472', 'keyur@ame-inc.com', '810', '862-325-6568', 'Engineering Manager', FALSE),
('Kevin Dowd', '862-666-0853', 'kevin@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Landon Connor', '609-954-9758', 'landon@ame-inc.com', '530', NULL, 'Technician', TRUE),
('Levi Altein', '845-402-6481', 'levi@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Lorenzo Mastropasqua', '973-369-2304', 'lorenzo@ame-inc.com', '830', NULL, 'Senior Technician', TRUE),
('Mahmoud Shehata', NULL, NULL, NULL, NULL, 'Engineer', FALSE),
('Mamshad Mohammed', '973-640-2058', 'mamshad@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Manuel Molina', '973-513-0617', 'manuel@ame-inc.com', NULL, '862-246-1550', 'Technician', TRUE),
('Mariela Peralta', NULL, 'mariela@ame-inc.com', '220', '862-325-3867', 'Administrator', FALSE),
('Mario Bolanos', '973-975-2494', 'mario@ame-inc.com', '850', NULL, 'Senior Technician', TRUE),
('Mark McLeod', '973-349-7044', 'markm@ame-inc.com', '860', NULL, 'Senior Technician', TRUE),
('Mathew Messer', '973-647-8640', 'mathew@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Mercedes Gonzales', '973-934-3443', 'mercedes@ame-inc.com', NULL, NULL, 'Project Coordinator', FALSE),
('Mike Borges', '973-294-2837', 'michael@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Mike Newcomer', '717-572-6378', 'miken@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Mike Vlacancich', '973-570-5775', 'mike@ame-inc.com', '870', NULL, 'Senior Technician', TRUE),
('Mohammad Ahmmed', '973-518-3104', 'mohammad@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Nick Winship', '908-635-8706', 'nicholas@ame-inc.com', '720', NULL, 'Senior Technician', TRUE),
('Nico Delorenzo', '908-447-7010', 'nico@ame-inc.com', '780', NULL, 'Senior Technician', TRUE),
('Nicole LeBlanc', NULL, 'nicole@ame-inc.com', '240', '862-325-3167', 'Administrator', FALSE),
('Nikhil Vaidya', '201-704-6767', 'nikhil@ame-inc.com', '980', '732-532-9760', 'Senior Engineer', FALSE),
('Paul Bruno', '732-668-1630', 'paulb@ame-inc.com', '910', NULL, 'Senior Technician', TRUE),
('Paul Yingling', '973-214-6886', 'paul@ame-inc.com', '920', NULL, 'Senior Technician', TRUE),
('Pavan Kandhala', '973-518-9904', 'pavan@ame-inc.com', NULL, NULL, 'Engineer', FALSE),
('Perry Condoluci', '973-561-7306', 'perry@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Peter Petrenko', '732-682-7520', 'peter@ame-inc.com', '930', NULL, 'Senior Technician', TRUE),
('Raymond Nocciolo', '973-800-3505', 'raymond@ame-inc.com', '1020', NULL, 'Technician', TRUE),
('Remote Support Yogesh', NULL, 'yogesh@ame-inc.com', '400', '862-325-0161', 'Remote Support', FALSE),
('Rich Ink', '973-987-7919', 'rich@ame-inc.com', '950', NULL, 'Senior Technician', TRUE),
('Richard Bhajan', '973-629-2064', 'richb@ame-inc.com', '1130', '347-737-7729', 'Senior Technician', TRUE),
('Ricky Chotalal', '973-224-1553', 'ricky@ame-inc.com', '970', NULL, 'Senior Technician', TRUE),
('Robert Lee', '973-518-5704', 'robert@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Rohan Nikhare', '302-853-7011', 'rohannikhare@ame-inc.com', NULL, NULL, 'Engineer', FALSE),
('Ron Jeter', '973-303-0312', 'ron@ame-inc.com', '1030', NULL, 'Senior Technician', TRUE),
('Ruben De La Cruz', '862-330-8680', 'ruben@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Rupert Chandool', '973-647-2902', 'rupert@ame-inc.com', '900', '973-445-3323', 'Senior Technician', TRUE),
('Rushi Gujar', '973-525-3260', 'rushi@ame-inc.com', NULL, '862-325-0161', 'Remote Support', FALSE),
('Saurabh Karmalkar', '973-865-9421', 'saurabh@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Samer Elghoben', '973-768-1626', 'samer@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Savitri Pancham', NULL, 'savitri@ame-inc.com', '430', NULL, 'Administrator', FALSE),
('Shashank Sartape', '862-666-0953', 'shashank@ame-inc.com', NULL, NULL, 'Engineer', FALSE),
('Steve Illes', '732-725-2689', 'steve@ame-inc.com', '250', '862-325-4581', 'Operations Manager', FALSE),
('Steven Mailloux', '973-557-1169', 'steven@ame-inc.com', '1050', NULL, 'Senior Technician', TRUE),
('Terry Cantwell', '908-930-7020', 'terry@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Thomas Brodowski', '973-567-8723', 'thomas@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Threshan Ramsarran', '973-486-5511', 'threshan@ame-inc.com', '1070', '862-276-4561', 'Senior Technician', TRUE),
('Tyler Holleran', '862-266-5983', 'tyler@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Vernie Redano', '973-618-7933', 'vernie@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Victor Ayoola', '973-768-1559', 'victorayoola@ame-inc.com', NULL, NULL, 'Engineer', FALSE),
('Victor Leon', '973-513-0616', 'victorl@ame-inc.com', NULL, NULL, 'Technician', TRUE),
('Victor Toledo', '973-557-7432', 'victor@ame-inc.com', '1090', NULL, 'Technician', TRUE),
('Victoria Meyer', '973-750-6987', 'victoria@ame-inc.com', '320', '862-325-3866', 'Project Manager', FALSE),
('Vincent Daniello', '973-800-4057', 'vincent@ame-inc.com', '1060', NULL, 'Technician', TRUE),
('Wilson Herrera Junior', '973-557-0095', 'wilson@ame-inc.com', '1120', '732-347-0552', 'Technician', TRUE),
('Wilson Herrera Senior', '973-525-6463', 'wilsonsenior@ame-inc.com', '990', '973-525-6463', 'Senior Technician', TRUE),
('Yasir Mohammed', '862-451-0890', 'yasir@ame-inc.com', NULL, NULL, 'Technician', TRUE);

-- Enable RLS
ALTER TABLE public.ame_employees ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read AME employees
CREATE POLICY "Allow read access to authenticated users" ON public.ame_employees
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for authenticated users to manage AME employees (admin only)
CREATE POLICY "Allow admin to manage AME employees" ON public.ame_employees
    FOR ALL USING (auth.jwt() ->> 'email' IN (
        SELECT email FROM auth.users WHERE raw_user_meta_data ->> 'role' = 'admin'
    ));

-- Add comments for documentation
COMMENT ON TABLE public.ame_employees IS 'Company-wide employee directory with contact information and roles';
COMMENT ON COLUMN public.ame_employees.is_technician IS 'Indicates if employee is a field technician available for site assignments';
COMMENT ON COLUMN public.ame_employees.role IS 'Employee job title or department role';
