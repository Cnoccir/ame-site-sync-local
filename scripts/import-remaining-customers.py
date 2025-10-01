#!/usr/bin/env python3
"""
Import remaining SimPro customers from CSV using batch SQL
This script creates SQL INSERT statements for the remaining customers
"""

import csv
import re
import os

def clean_sql_string(value):
    """Clean and escape string for SQL"""
    if not value:
        return ''
    # Remove quotes and escape single quotes
    return value.replace("'", "''").replace('"', '')

def parse_csv_file():
    """Parse the CSV file and return customer records"""
    csv_path = os.path.join(os.path.dirname(__file__), '..', 'docs', 'cleaned_data', 'final_customer_database.csv')

    customers = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                customer_id = int(row['simpro_customer_id']) if row['simpro_customer_id'] else None
                if customer_id and customer_id > 130:  # Skip already imported
                    customers.append({
                        'id': customer_id,
                        'company_name': clean_sql_string(row['company_name']),
                        'address': clean_sql_string(row['mailing_address']),
                        'city': clean_sql_string(row['mailing_city']),
                        'state': clean_sql_string(row['mailing_state']),
                        'zip': clean_sql_string(row['mailing_zip']),
                        'email': clean_sql_string(row.get('email', '') or row.get('latest_contract_email', '')),
                        'service_tier': row.get('service_tier', 'CORE'),
                        'has_contracts': row.get('has_active_contracts', 'FALSE') == 'TRUE',
                        'contract_value': float(row.get('total_contract_value', 0) or 0),
                        'contract_number': clean_sql_string(row.get('contract_number', '')),
                        'contract_status': clean_sql_string(row.get('contract_status', '')),
                        'latest_email': clean_sql_string(row.get('latest_contract_email', ''))
                    })
            except (ValueError, KeyError) as e:
                print(f"Skipping row due to error: {e}")
                continue

    return customers

def create_sql_batches(customers, batch_size=50):
    """Create SQL INSERT batches"""
    sql_batches = []

    for i in range(0, len(customers), batch_size):
        batch = customers[i:i + batch_size]

        values = []
        for customer in batch:
            value_str = f"""({customer['id']}, '{customer['company_name']}', '{customer['address']}', '{customer['city']}', '{customer['state']}', '{customer['zip']}', '{customer['email']}', '{customer['service_tier']}', {customer['has_contracts']}, {customer['contract_value']}, '{customer['company_name']}', '{customer['contract_number']}', '{customer['contract_status']}', '{customer['latest_email']}', NOW(), NOW())"""
            values.append(value_str)

        sql = f"""
INSERT INTO customers (
  legacy_customer_id,
  company_name,
  mailing_address,
  mailing_city,
  mailing_state,
  mailing_zip,
  primary_contact_email,
  service_tier,
  has_active_contracts,
  total_contract_value,
  site_nickname,
  contract_number,
  contract_status,
  latest_contract_email,
  created_at,
  updated_at
) VALUES
{','.join(values)}
ON CONFLICT (legacy_customer_id) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  mailing_address = EXCLUDED.mailing_address,
  mailing_city = EXCLUDED.mailing_city,
  mailing_state = EXCLUDED.mailing_state,
  mailing_zip = EXCLUDED.mailing_zip,
  primary_contact_email = EXCLUDED.primary_contact_email,
  service_tier = EXCLUDED.service_tier,
  has_active_contracts = EXCLUDED.has_active_contracts,
  total_contract_value = EXCLUDED.total_contract_value,
  contract_number = EXCLUDED.contract_number,
  contract_status = EXCLUDED.contract_status,
  latest_contract_email = EXCLUDED.latest_contract_email,
  updated_at = NOW();
"""
        sql_batches.append(sql)

    return sql_batches

def main():
    """Main function"""
    print("Parsing CSV file...")
    customers = parse_csv_file()
    print(f"Found {len(customers)} customers to import (after ID 130)")

    print("Creating SQL batches...")
    sql_batches = create_sql_batches(customers)

    # Write SQL files
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'sql_batches')
    os.makedirs(output_dir, exist_ok=True)

    for i, sql in enumerate(sql_batches):
        filename = f"customer_batch_{i+2:02d}.sql"
        filepath = os.path.join(output_dir, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(sql)
        print(f"Created {filename}")

    print(f"\nGenerated {len(sql_batches)} SQL batch files in sql_batches/")
    print("You can now run these through Supabase MCP migrations")

if __name__ == "__main__":
    main()