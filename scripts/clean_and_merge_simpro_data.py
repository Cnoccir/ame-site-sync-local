#!/usr/bin/env python3
"""
SimPro Data Cleaning and Merging Script
Cleans and matches customer and contract data from SimPro CSVs
Generates consolidated CSV and SQL for database insertion
"""

import csv
import json
import re
from datetime import datetime
from pathlib import Path
import uuid

# Configuration
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "docs" / "data"
OUTPUT_DIR = BASE_DIR / "supabase" / "migrations"
CLEANED_DATA_DIR = BASE_DIR / "docs" / "cleaned_data"

CUSTOMERS_CSV = DATA_DIR / "customers.csv"
CONTRACTS_CSV = DATA_DIR / "Customer_Contracts_Report_reportTable.csv"

# Create output directory if it doesn't exist
CLEANED_DATA_DIR.mkdir(exist_ok=True)

def clean_company_name(name):
    """Standardize company names for matching"""
    if not name:
        return ""
    
    # Convert to uppercase for comparison
    name = name.upper().strip()
    
    # Remove common variations
    # Keep original for display but create cleaned version for matching
    cleaned = name
    
    # Remove parenthetical content for matching (but keep original)
    cleaned = re.sub(r'\([^)]*\)', '', cleaned)
    
    # Standardize common abbreviations
    cleaned = re.sub(r'\bCORP\.?\b', 'CORPORATION', cleaned)
    cleaned = re.sub(r'\bINC\.?\b', 'INC', cleaned)
    cleaned = re.sub(r'\bLLC\.?\b', 'LLC', cleaned)
    cleaned = re.sub(r'\bCO\.?\b', 'COMPANY', cleaned)
    
    # Remove extra spaces
    cleaned = ' '.join(cleaned.split())
    
    return cleaned.strip()

def parse_contract_value(value_str):
    """Parse contract value string to float"""
    if not value_str:
        return 0.0
    
    # Remove $ and commas
    cleaned = re.sub(r'[$,]', '', value_str)
    
    try:
        return float(cleaned)
    except:
        return 0.0

def determine_service_tier(total_contract_value):
    """Determine service tier based on total contract value"""
    if total_contract_value >= 250000:
        return "GUARDIAN"
    elif total_contract_value >= 100000:
        return "ASSURE"
    else:
        return "CORE"

def parse_date(date_str):
    """Parse date string to ISO format"""
    if not date_str:
        return None
    
    try:
        # Try MM/DD/YYYY format
        dt = datetime.strptime(date_str, "%m/%d/%Y")
        return dt.strftime("%Y-%m-%d")
    except:
        try:
            # Try other formats if needed
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            return dt.strftime("%Y-%m-%d")
        except:
            return None

def load_customers():
    """Load and clean customer data"""
    customers = {}
    customer_name_map = {}  # Map cleaned names to customer IDs
    
    print("📖 Loading customers from CSV...")
    
    with open(CUSTOMERS_CSV, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            customer_id = row.get('Customer ID', '').strip()
            company_name = row.get('Customer', '').strip()
            
            if not customer_id or not company_name:
                continue
            
            # Create customer record
            customer = {
                'simpro_customer_id': customer_id,
                'company_name': company_name,
                'company_name_cleaned': clean_company_name(company_name),
                'email': row.get('Email', '').strip().lower(),
                'mailing_address': row.get('Mailing Address', '').strip(),
                'mailing_city': row.get('Mailing City', '').strip(),
                'mailing_state': row.get('Mailing State', '').strip(),
                'mailing_zip': row.get('Mailing ZIP Code', '').strip(),
                'labor_tax_code': row.get('Labor Tax Code', '').strip(),
                'part_tax_code': row.get('Part Tax Code', '').strip(),
                'is_contract_customer': row.get('Contract Customer', '').strip().lower() == 'yes',
                'contracts': [],
                'total_contract_value': 0.0,
                'active_contract_count': 0,
                'has_active_contracts': False,
                'service_tier': 'CORE',
                'latest_contract_email': ''
            }
            
            customers[customer_id] = customer
            
            # Add to name map for matching
            cleaned_name = clean_company_name(company_name)
            customer_name_map[cleaned_name] = customer_id
    
    print(f"✅ Loaded {len(customers)} customers")
    return customers, customer_name_map

def load_and_match_contracts(customers, customer_name_map):
    """Load contracts and match them to customers"""
    contracts = []
    unmatched_contracts = []
    matched_count = 0
    
    print("\n📖 Loading contracts from CSV...")
    
    with open(CONTRACTS_CSV, 'r', encoding='utf-8-sig') as f:
        lines = f.readlines()
    
    # Skip the first line (report criteria) and parse from line 2
    reader = csv.DictReader(lines[1:])
    
    for row_num, row in enumerate(reader, start=3):  # Start at line 3 of original file
        customer_name = row.get('Customer', '').strip()
        contract_name = row.get('Contract Name', '').strip()
        
        # Skip invalid rows (like continuation lines)
        if not customer_name or not contract_name:
            continue
        
        # Skip rows that are clearly not customer data
        if customer_name in ['SMA Included', 'UNL RS', 'Monthly', 'Quarterly', 'Weekly'] or customer_name.isdigit():
            continue
        
        if 'Selected Criteria' in customer_name:
            continue
        
        # Try to match customer
        cleaned_name = clean_company_name(customer_name)
        matched_customer_id = None
        
        # Try exact match first
        if cleaned_name in customer_name_map:
            matched_customer_id = customer_name_map[cleaned_name]
        else:
            # Try fuzzy matching
            for stored_name, cust_id in customer_name_map.items():
                # Check if one contains the other (for subsidiaries, etc.)
                if len(cleaned_name) > 10 and len(stored_name) > 10:
                    if cleaned_name in stored_name or stored_name in cleaned_name:
                        matched_customer_id = cust_id
                        break
                
                # Check for very similar names (remove common suffixes and compare)
                cleaned_stripped = re.sub(r'\b(LLC|INC|CORPORATION|COMPANY|CORP)\b', '', cleaned_name).strip()
                stored_stripped = re.sub(r'\b(LLC|INC|CORPORATION|COMPANY|CORP)\b', '', stored_name).strip()
                
                if cleaned_stripped and stored_stripped:
                    if cleaned_stripped == stored_stripped:
                        matched_customer_id = cust_id
                        break
        
        # Create contract record
        contract_value = parse_contract_value(row.get('Value', '0'))
        contract_status = row.get('Status', '').strip()
        
        contract = {
            'id': str(uuid.uuid4()),
            'customer_name_in_contract': customer_name,
            'contract_name': contract_name,
            'contract_number': row.get('Contract No.', '').strip(),
            'contract_value': contract_value,
            'contract_status': 'active' if contract_status.lower() == 'active' else 'expired',
            'start_date': parse_date(row.get('Start Date', '')),
            'end_date': parse_date(row.get('End Date', '')),
            'contract_email': row.get('Email', '').strip().lower(),
            'contract_notes': row.get('Notes', '').strip(),
            'matched_customer_id': matched_customer_id
        }
        
        contracts.append(contract)
        
        if matched_customer_id:
            matched_count += 1
            # Add contract to customer
            customer = customers[matched_customer_id]
            customer['contracts'].append(contract)
            
            # Update customer statistics
            if contract['contract_status'] == 'active':
                customer['has_active_contracts'] = True
                customer['active_contract_count'] += 1
                customer['total_contract_value'] += contract_value
                
                if contract['contract_email']:
                    customer['latest_contract_email'] = contract['contract_email']
        else:
            unmatched_contracts.append((customer_name, contract_name, contract_value))
    
    print(f"✅ Loaded {len(contracts)} contracts")
    print(f"✅ Matched {matched_count} contracts to customers")
    print(f"⚠️  Unmatched contracts: {len(unmatched_contracts)}")
    
    if unmatched_contracts:
        print("\n🔍 Sample unmatched contracts (first 10):")
        for i, (name, contract, value) in enumerate(unmatched_contracts[:10], 1):
            print(f"   {i}. {name} - {contract} (${value:,.2f})")
    
    # Update service tiers based on total contract values
    for customer in customers.values():
        customer['service_tier'] = determine_service_tier(customer['total_contract_value'])
    
    return contracts

def export_cleaned_data(customers, contracts):
    """Export cleaned and merged data to CSV files"""
    print("\n💾 Exporting cleaned data...")
    
    # Export customers with contract summaries
    customers_output = CLEANED_DATA_DIR / "cleaned_customers.csv"
    with open(customers_output, 'w', newline='', encoding='utf-8') as f:
        fieldnames = [
            'simpro_customer_id', 'company_name', 'email', 
            'mailing_address', 'mailing_city', 'mailing_state', 'mailing_zip',
            'labor_tax_code', 'part_tax_code', 'is_contract_customer',
            'has_active_contracts', 'active_contract_count', 'total_contract_value',
            'service_tier', 'latest_contract_email'
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for customer in customers.values():
            row = {k: customer[k] for k in fieldnames}
            writer.writerow(row)
    
    print(f"✅ Exported {len(customers)} customers to {customers_output}")
    
    # Export contracts with customer links
    contracts_output = CLEANED_DATA_DIR / "cleaned_contracts.csv"
    with open(contracts_output, 'w', newline='', encoding='utf-8') as f:
        fieldnames = [
            'matched_customer_id', 'customer_name_in_contract', 'contract_name',
            'contract_number', 'contract_value', 'contract_status',
            'start_date', 'end_date', 'contract_email', 'contract_notes'
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for contract in contracts:
            row = {k: contract[k] for k in fieldnames}
            writer.writerow(row)
    
    print(f"✅ Exported {len(contracts)} contracts to {contracts_output}")
    
    # Export summary statistics
    stats = {
        'total_customers': len(customers),
        'customers_with_contracts': len([c for c in customers.values() if c['contracts']]),
        'total_contracts': len(contracts),
        'active_contracts': len([c for c in contracts if c['contract_status'] == 'active']),
        'total_contract_value': sum(c['total_contract_value'] for c in customers.values()),
        'service_tiers': {
            'CORE': len([c for c in customers.values() if c['service_tier'] == 'CORE']),
            'ASSURE': len([c for c in customers.values() if c['service_tier'] == 'ASSURE']),
            'GUARDIAN': len([c for c in customers.values() if c['service_tier'] == 'GUARDIAN'])
        }
    }
    
    stats_output = CLEANED_DATA_DIR / "data_summary.json"
    with open(stats_output, 'w', encoding='utf-8') as f:
        json.dump(stats, f, indent=2)
    
    print(f"✅ Exported statistics to {stats_output}")
    
    return stats

def generate_sql(customers, contracts):
    """Generate SQL insert statements for Supabase"""
    print("\n📝 Generating SQL statements...")
    
    sql_lines = []
    
    # Header
    sql_lines.append("-- SimPro Data Population")
    sql_lines.append(f"-- Generated: {datetime.now().isoformat()}")
    sql_lines.append("")
    sql_lines.append("-- Clear existing data")
    sql_lines.append("DELETE FROM simpro_customer_contracts;")
    sql_lines.append("DELETE FROM simpro_customers;")
    sql_lines.append("")
    
    # Insert customers (only those with contracts)
    customers_with_contracts = {k: v for k, v in customers.items() if v['contracts']}
    
    sql_lines.append(f"-- Insert {len(customers_with_contracts)} customers with contracts")
    sql_lines.append("INSERT INTO simpro_customers (")
    sql_lines.append("  id, simpro_customer_id, company_name, email,")
    sql_lines.append("  mailing_address, mailing_city, mailing_state, mailing_zip,")
    sql_lines.append("  is_contract_customer, has_active_contracts,")
    sql_lines.append("  active_contract_count, total_contract_value, service_tier")
    sql_lines.append(") VALUES")
    
    customer_values = []
    for customer in customers_with_contracts.values():
        cust_id = str(uuid.uuid4())
        customer['db_id'] = cust_id  # Store for contract references
        
        value = (
            f"  ('{cust_id}', "
            f"'{customer['simpro_customer_id']}', "
            f"'{customer['company_name'].replace("'", "''")}', "
            f"'{customer['email'].replace("'", "''")}', "
            f"'{customer['mailing_address'].replace("'", "''")}', "
            f"'{customer['mailing_city'].replace("'", "''")}', "
            f"'{customer['mailing_state']}', "
            f"'{customer['mailing_zip']}', "
            f"{'true' if customer['is_contract_customer'] else 'false'}, "
            f"{'true' if customer['has_active_contracts'] else 'false'}, "
            f"{customer['active_contract_count']}, "
            f"{customer['total_contract_value']}, "
            f"'{customer['service_tier']}')"
        )
        customer_values.append(value)
    
    sql_lines.append(',\n'.join(customer_values) + ';')
    sql_lines.append("")
    
    # Insert contracts
    matched_contracts = [c for c in contracts if c['matched_customer_id']]
    
    if matched_contracts:
        sql_lines.append(f"-- Insert {len(matched_contracts)} matched contracts")
        sql_lines.append("INSERT INTO simpro_customer_contracts (")
        sql_lines.append("  id, customer_id, contract_name, contract_number,")
        sql_lines.append("  contract_value, contract_status, start_date, end_date")
        sql_lines.append(") VALUES")
        
        contract_values = []
        for contract in matched_contracts:
            customer = customers[contract['matched_customer_id']]
            if 'db_id' in customer:  # Only if customer was inserted
                start_date = f"'{contract['start_date']}'" if contract['start_date'] else "NULL"
                end_date = f"'{contract['end_date']}'" if contract['end_date'] else "NULL"
                
                value = (
                    f"  ('{contract['id']}', "
                    f"'{customer['db_id']}', "
                    f"'{contract['contract_name'].replace("'", "''")}', "
                    f"'{contract['contract_number'].replace("'", "''")}', "
                    f"{contract['contract_value']}, "
                    f"'{contract['contract_status']}', "
                    f"{start_date}, "
                    f"{end_date})"
                )
                contract_values.append(value)
        
        sql_lines.append(',\n'.join(contract_values) + ';')
    
    # Write SQL file
    sql_output = OUTPUT_DIR / f"simpro_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
    with open(sql_output, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))
    
    print(f"✅ Generated SQL file: {sql_output}")
    
    return sql_output

def main():
    """Main processing function"""
    print("🚀 Starting SimPro Data Cleaning and Merging")
    print("=" * 50)
    
    # Load and clean data
    customers, customer_name_map = load_customers()
    contracts = load_and_match_contracts(customers, customer_name_map)
    
    # Export cleaned data
    stats = export_cleaned_data(customers, contracts)
    
    # Generate SQL
    sql_file = generate_sql(customers, contracts)
    
    # Print summary
    print("\n" + "=" * 50)
    print("✅ Processing Complete!")
    print("\n📊 Summary Statistics:")
    print(f"  Total Customers: {stats['total_customers']}")
    print(f"  Customers with Contracts: {stats['customers_with_contracts']}")
    print(f"  Total Contracts: {stats['total_contracts']}")
    print(f"  Active Contracts: {stats['active_contracts']}")
    print(f"  Total Contract Value: ${stats['total_contract_value']:,.2f}")
    print(f"\n  Service Tiers:")
    print(f"    CORE: {stats['service_tiers']['CORE']}")
    print(f"    ASSURE: {stats['service_tiers']['ASSURE']}")
    print(f"    GUARDIAN: {stats['service_tiers']['GUARDIAN']}")
    
    print("\n📁 Output Files:")
    print(f"  - Cleaned customers: {CLEANED_DATA_DIR / 'cleaned_customers.csv'}")
    print(f"  - Cleaned contracts: {CLEANED_DATA_DIR / 'cleaned_contracts.csv'}")
    print(f"  - Summary stats: {CLEANED_DATA_DIR / 'data_summary.json'}")
    print(f"  - SQL file: {sql_file}")

if __name__ == "__main__":
    main()
