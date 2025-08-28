#!/usr/bin/env node

/**
 * Debug SimPro Data Processing Script
 * Helps identify why contracts aren't linking to customers
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const INPUT_DIR = path.join(__dirname, '..', 'docs', 'data');
const CUSTOMERS_CSV = path.join(INPUT_DIR, 'customers.csv');
const CONTRACTS_CSV = path.join(INPUT_DIR, 'Customer_Contracts_Report_reportTable.csv');

// Helper function to parse CSV line (handles quoted values)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    // Add final field
    result.push(current.trim());
    
    return result;
}

// Main debug function
function debugData() {
    console.log('🔍 Debug: SimPro Data Analysis\n');
    
    // Read files
    const customersContent = fs.readFileSync(CUSTOMERS_CSV, 'utf8');
    const contractsContent = fs.readFileSync(CONTRACTS_CSV, 'utf8');
    
    // Parse customers
    const customerLines = customersContent.split('\n').filter(line => line.trim());
    const customerHeaders = parseCSVLine(customerLines[0]);
    console.log('Customer CSV Headers:', customerHeaders);
    
    const customerNames = new Set();
    const customerMap = new Map();
    
    for (let i = 1; i < Math.min(customerLines.length, 700); i++) {
        const values = parseCSVLine(customerLines[i]);
        if (values.length > 0) {
            const name = values[0]?.trim();
            const customerId = values[7]?.trim(); // Customer ID is at index 7
            if (name && customerId) {
                customerNames.add(name.toUpperCase());
                customerMap.set(name.toUpperCase(), customerId);
            }
        }
    }
    
    console.log(`\nFound ${customerNames.size} customers in customers.csv\n`);
    
    // Parse contracts
    const contractLines = contractsContent.split('\n').filter(line => line.trim());
    const contractHeaders = parseCSVLine(contractLines[1]); // Skip first line (criteria)
    console.log('Contract CSV Headers:', contractHeaders);
    
    const contractCustomers = new Set();
    const unmatchedContracts = [];
    
    for (let i = 2; i < contractLines.length; i++) {
        const values = parseCSVLine(contractLines[i]);
        if (values.length > 0) {
            const name = values[0]?.trim();
            if (name && !name.includes('Selected Criteria')) {
                const upperName = name.toUpperCase();
                contractCustomers.add(upperName);
                
                // Check if this customer exists in customers.csv
                if (!customerNames.has(upperName)) {
                    unmatchedContracts.push(name);
                }
            }
        }
    }
    
    console.log(`\nFound ${contractCustomers.size} unique customers in contracts CSV`);
    console.log(`Unmatched contracts: ${unmatchedContracts.length}\n`);
    
    // Find matches
    let matchCount = 0;
    for (const contractCustomer of contractCustomers) {
        if (customerNames.has(contractCustomer)) {
            matchCount++;
        }
    }
    
    console.log(`Direct name matches: ${matchCount} out of ${contractCustomers.size}\n`);
    
    // Show sample unmatched contracts
    console.log('Sample unmatched contract customers (first 10):');
    unmatchedContracts.slice(0, 10).forEach((name, i) => {
        console.log(`  ${i + 1}. "${name}"`);
    });
    
    // Show sample matched customers
    console.log('\nSample matched customers (first 10):');
    let matched = 0;
    for (const contractCustomer of contractCustomers) {
        if (customerNames.has(contractCustomer)) {
            console.log(`  ✓ "${contractCustomer}"`);
            matched++;
            if (matched >= 10) break;
        }
    }
    
    // Check for partial matches
    console.log('\nChecking for partial matches...');
    let partialMatches = 0;
    for (const contractCustomer of contractCustomers) {
        if (!customerNames.has(contractCustomer)) {
            // Try to find partial match
            const cleanedContract = contractCustomer
                .replace(/\(.*?\)/g, '') // Remove parenthetical info
                .replace(/\b(LLC|INC|CORP|CORPORATION|COMPANY|CO)\b/g, '')
                .replace(/[.,\-]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
                
            for (const customerName of customerNames) {
                const cleanedCustomer = customerName
                    .replace(/\(.*?\)/g, '')
                    .replace(/\b(LLC|INC|CORP|CORPORATION|COMPANY|CO)\b/g, '')
                    .replace(/[.,\-]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                    
                if (cleanedCustomer.includes(cleanedContract) || cleanedContract.includes(cleanedCustomer)) {
                    partialMatches++;
                    if (partialMatches <= 5) {
                        console.log(`  Partial match: "${contractCustomer}" ≈ "${customerName}"`);
                    }
                    break;
                }
            }
        }
    }
    
    console.log(`\nFound ${partialMatches} additional partial matches`);
    console.log(`Total potential matches: ${matchCount + partialMatches} out of ${contractCustomers.size}`);
}

// Run debug
debugData();
