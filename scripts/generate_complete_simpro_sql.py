#!/usr/bin/env python3
"""
Generate complete SQL for SimPro data that matches existing database schema
"""

import csv
import json
import re
from datetime import datetime
from pathlib import Path
import uuid

# Configuration
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "docs" / "cleaned_data"
OUTPUT_DIR = BASE_DIR / "supabase" / "migrations"

CUSTOMERS_CSV = DATA_DIR / "cleaned_customers.csv"
CONTRACTS_CSV = DATA_DIR / "cleaned_contracts.csv"

def escape_sql_string(value):
    """Escape single quotes for SQL"""
    if value is None or value == '':
        return ''
    return str(value).replace("'", "''")

def format_sql_value(value, field_type='text'):
    """Format value for SQL insertion"""
    if value is None or value == '' or value == 'None':
        return 'NULL'
    
    if field_type == 'boolean':
        if isinstance(value, bool):
            return 'true' if value else 'false'
        return 'true' if str(value).lower() in ['true', 'yes', '1'] else 'false'
    
    if field_type == 'number':
        try:
            return str(float(value))
        except:
            return '0'
    
    if field_type == 'date':
        if value and value != '':
            return f"'{value}'"
        return 'NULL'
    
    # Default to text
    return f"'{escape_sql_string(value)}'"

def load_csv_data(file_path):
    """Load and parse CSV file"""
    rows = []
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows

def generate_simpro_sql():
    """Generate complete SQL for SimPro data"""
    print("📖 Loading cleaned data...")
    
    customers = load_csv_data(CUSTOMERS_CSV)
    contracts = load_csv_data(CONTRACTS_CSV)
    
    print(f"✅ Loaded {len(customers)} customers and {len(contracts)} contracts")
    
    # Filter to customers with contracts
    customers_with_contracts = []
    customer_id_map = {}
    
    for customer in customers:
        # Check if this customer has any contracts
        has_contracts = any(c['matched_customer_id'] == customer['simpro_customer_id'] for c in contracts)
        if has_contracts:
            # Generate a UUID for this customer
            db_uuid = str(uuid.uuid4())
            customer_id_map[customer['simpro_customer_id']] = db_uuid
            customer['db_uuid'] = db_uuid
            customers_with_contracts.append(customer)
    
    print(f"✅ {len(customers_with_contracts)} customers have contracts")
    
    # Start building SQL
    sql_lines = []
    
    # Header
    sql_lines.append("-- Complete SimPro Data Load")
    sql_lines.append(f"-- Generated: {datetime.now().isoformat()}")
    sql_lines.append("-- This script loads all processed SimPro customer and contract data")
    sql_lines.append("")
    
    # Clear existing data
    sql_lines.append("-- Clear existing data")
    sql_lines.append("DELETE FROM simpro_customer_contracts;")
    sql_lines.append("DELETE FROM simpro_customers;")
    sql_lines.append("")
    
    # Insert customers
    sql_lines.append(f"-- Insert {len(customers_with_contracts)} customers with contracts")
    sql_lines.append("INSERT INTO simpro_customers (")
    sql_lines.append("  id, simpro_customer_id, company_name, email,")
    sql_lines.append("  mailing_address, mailing_city, mailing_state, mailing_zip,")
    sql_lines.append("  is_contract_customer, has_active_contracts,")
    sql_lines.append("  active_contract_count, total_contract_value, service_tier")
    sql_lines.append(") VALUES")
    
    customer_values = []
    for i, customer in enumerate(customers_with_contracts):
        # Determine actual boolean values
        is_contract = str(customer.get('is_contract_customer', 'False')).lower() in ['true', 'yes', '1']
        has_active = str(customer.get('has_active_contracts', 'False')).lower() in ['true', 'yes', '1']
        
        value = (
            f"  ('{customer['db_uuid']}', "
            f"{format_sql_value(customer.get('simpro_customer_id', ''))}, "
            f"{format_sql_value(customer.get('company_name', ''))}, "
            f"{format_sql_value(customer.get('email', ''))}, "
            f"{format_sql_value(customer.get('mailing_address', ''))}, "
            f"{format_sql_value(customer.get('mailing_city', ''))}, "
            f"{format_sql_value(customer.get('mailing_state', ''))}, "
            f"{format_sql_value(customer.get('mailing_zip', ''))}, "
            f"{format_sql_value(is_contract, 'boolean')}, "
            f"{format_sql_value(has_active, 'boolean')}, "
            f"{format_sql_value(customer.get('active_contract_count', 0), 'number')}, "
            f"{format_sql_value(customer.get('total_contract_value', 0), 'number')}, "
            f"{format_sql_value(customer.get('service_tier', 'CORE'))})"
        )
        
        customer_values.append(value)
    
    sql_lines.append(',\n'.join(customer_values) + ';')
    sql_lines.append("")
    
    # Insert contracts
    matched_contracts = []
    for contract in contracts:
        if contract.get('matched_customer_id') in customer_id_map:
            matched_contracts.append(contract)
    
    sql_lines.append(f"-- Insert {len(matched_contracts)} contracts")
    sql_lines.append("INSERT INTO simpro_customer_contracts (")
    sql_lines.append("  id, customer_id, contract_name, contract_number,")
    sql_lines.append("  contract_value, contract_status, start_date, end_date,")
    sql_lines.append("  contract_email, contract_notes")
    sql_lines.append(") VALUES")
    
    contract_values = []
    for contract in matched_contracts:
        customer_uuid = customer_id_map[contract['matched_customer_id']]
        contract_uuid = str(uuid.uuid4())
        
        # Map contract status to match schema constraint
        status = contract.get('contract_status', 'expired').lower()
        if status == 'active':
            status = 'Active'
        else:
            status = 'Expired'
        
        value = (
            f"  ('{contract_uuid}', "
            f"'{customer_uuid}', "
            f"{format_sql_value(contract.get('contract_name', ''))}, "
            f"{format_sql_value(contract.get('contract_number', ''))}, "
            f"{format_sql_value(contract.get('contract_value', 0), 'number')}, "
            f"'{status}', "
            f"{format_sql_value(contract.get('start_date', ''), 'date')}, "
            f"{format_sql_value(contract.get('end_date', ''), 'date')}, "
            f"{format_sql_value(contract.get('contract_email', ''))}, "
            f"{format_sql_value(contract.get('contract_notes', ''))})"
        )
        
        contract_values.append(value)
    
    sql_lines.append(',\n'.join(contract_values) + ';')
    sql_lines.append("")
    
    # Add verification
    sql_lines.append("-- Verify data load")
    sql_lines.append("DO $$")
    sql_lines.append("DECLARE")
    sql_lines.append("  cust_count INTEGER;")
    sql_lines.append("  cont_count INTEGER;")
    sql_lines.append("BEGIN")
    sql_lines.append("  SELECT COUNT(*) INTO cust_count FROM simpro_customers;")
    sql_lines.append("  SELECT COUNT(*) INTO cont_count FROM simpro_customer_contracts;")
    sql_lines.append("  RAISE NOTICE 'Loaded % customers and % contracts', cust_count, cont_count;")
    sql_lines.append("END $$;")
    
    # Write SQL file
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    sql_file = OUTPUT_DIR / f"complete_simpro_data_{timestamp}.sql"
    
    with open(sql_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))
    
    print(f"✅ Generated SQL file: {sql_file}")
    
    # Calculate statistics
    total_value = sum(float(c.get('total_contract_value', 0)) for c in customers_with_contracts)
    active_contracts = sum(1 for c in matched_contracts if c.get('contract_status', '').lower() == 'active')
    
    print("\n📊 Summary:")
    print(f"  Customers: {len(customers_with_contracts)}")
    print(f"  Contracts: {len(matched_contracts)}")
    print(f"  Active Contracts: {active_contracts}")
    print(f"  Total Contract Value: ${total_value:,.2f}")
    
    return sql_file

if __name__ == "__main__":
    generate_simpro_sql()
