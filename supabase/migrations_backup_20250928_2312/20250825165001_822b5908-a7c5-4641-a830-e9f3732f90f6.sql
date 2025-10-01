-- Clear existing task data first
DELETE FROM ame_tasks_normalized;

-- Insert Task Library data with proper category and service tier mappings
INSERT INTO ame_tasks_normalized (
    task_id, task_name, service_tiers, category_id, duration_minutes, 
    navigation_path, sop_steps, sop_template_sheet, tools_required, 
    quality_checks, prerequisites, skills_required, safety_notes, 
    last_updated, version, is_mandatory, task_order, phase
) VALUES 
-- CORE Tasks
('C001', 'Platform & Station Backup', '["CORE"]', '9e28f4f1-b604-4240-9ad3-99a7b38727ac', 45, 
 'Platform → Platform Administration → Backup/Restore', 
 '1. Open Backup Utility in Workbench
2. Connect to Platform of Niagara host
3. Select running Station and click "Backup Station"
4. Name backup with format: [CustomerName]_[YYYY-MM-DD]_PMBackup
5. Include History/Alarms if needed (check BackupService settings)
6. Click "Create" and monitor progress
7. Verify backup completed successfully
8. Copy backup to external drive and cloud storage
9. Test backup integrity by opening .dist file', 
 'SystemBackupSOP', 
 '["Workbench", "External storage drive", "Cloud access"]',
 'Backup file size reasonable (50-500MB)
Timestamp is current
File extension is .dist
Both local and cloud copies created',
 '', 'Level 1 Technician, Backup procedures', 
 'Ensure system stability during backup process
Verify backup storage security', 
 '2025-07-26T14:24:33.802Z', '1.2', true, 1, 1),

('C002', 'Performance Verification', '["CORE"]', '7de8f7d8-ff59-4503-9920-77069a2fcc8d', 30,
 'Diagnostics → Resource Manager (Station Summary)',
 '1. Right-click Station and select Views → Station Summary
2. Check CPU Usage (should be <80% sustained)
3. Check Heap Memory (should be <75% after garbage collection)
4. Verify License Capacities not exceeded
5. Check File Descriptors on JACE (if applicable)
6. Use Spy tool for Engine Hogs if performance issues
7. Check driver poll rates and cycle times
8. Review Application Director for errors',
 'PerformanceVerification',
 '["Workbench", "System monitoring tools"]',
 'CPU usage below 80%
Memory usage below 75%
No license limit warnings
All performance metrics documented',
 '', 'Level 1 Technician, Performance analysis',
 'Monitor system performance impact during diagnostics',
 '2025-07-26T14:24:33.802Z', '1.1', true, 2, 1),

('C003', 'Active Alarm Resolution', '["CORE"]', 'e64ca4c6-51b8-4cf6-a7ec-34caf7b57dea', 30,
 'Alarm Console → Review/Acknowledge',
 '1. Open Alarm Console in Workbench
2. Sort alarms by priority (Critical first)
3. For each critical alarm:
   a) Record alarm text and time
   b) Right-click → "Go to Source"
   c) Investigate root cause
   d) Take corrective action
   e) Acknowledge alarm
4. Review HIGH priority alarms
5. Check alarm history for patterns
6. Test alarm notification system
7. Update alarm recipient lists if needed',
 'AlarmAnalyticsReview',
 '["Workbench", "Diagnostic tools"]',
 'All critical alarms addressed
High priority alarms reviewed
Alarm patterns documented
Notification system verified',
 '', 'Level 1 Technician, Alarm troubleshooting',
 'Verify alarm acknowledgment doesn''t compromise safety systems',
 '2025-07-26T14:24:33.802Z', '1.1', true, 3, 1),

('C004', 'Schedule & Setpoint Verification', '["CORE"]', 'ad6a3e65-10f8-4433-93d1-5e3069e9e7e5', 45,
 'Config → Schedules → Weekly Calendar',
 '1. Review all active schedules
2. Verify schedule times match occupancy
3. Check holiday/exception calendars
4. Review temperature setpoints for each mode
5. Verify setback/setup temperatures
6. Check schedule priorities and overrides
7. Document any recommended changes
8. Update schedules per customer request',
 'ScheduleOptimization',
 '["Workbench", "Building occupancy schedule"]',
 'Schedules match actual occupancy
Setpoints appropriate for season
Holiday calendars current
Changes documented',
 '', 'Level 1 Technician, HVAC scheduling',
 'Ensure schedule changes don''t compromise comfort or equipment safety',
 '2025-07-26T14:24:33.802Z', '1', true, 4, 1),

('C005', 'Override Point Cleanup', '["CORE"]', '499c2275-21de-4d80-ac8f-3bdaf56abdd1', 25,
 'Point Manager → Overrides → Analysis',
 '1. Open Point Manager and filter for overrides
2. Document all points in override
3. Investigate reason for each override
4. Release unnecessary overrides
5. Document legitimate overrides with reason
6. Check for expired temporary overrides
7. Verify system returns to auto after override release',
 'OverrideManagement',
 '["Workbench", "Override documentation"]',
 'All overrides documented
Unnecessary overrides released
System verified in auto mode
Override log updated',
 '', 'Level 1 Technician, Point management',
 'Verify override release doesn''t impact critical systems',
 '2025-07-26T14:24:33.802Z', '1', true, 5, 1),

('C006', 'Critical Sensor Check', '["CORE"]', 'c89d60fa-b523-4103-bed3-8e2965bda1b7', 60,
 'Point Manager → Analog Inputs',
 '1. Identify critical sensors (OAT, space temps, pressures)
2. Compare sensor readings to reference
3. Check for sensor drift or stuck values
4. Verify sensor trends are reasonable
5. Calibrate sensors if needed
6. Document calibration offsets
7. Check sensor wiring and connections
8. Update sensor maintenance log',
 'SensorCalibration',
 '["Calibrated thermometer", "Multimeter", "Reference instruments"]',
 'All critical sensors verified
Calibration within tolerance
No stuck or drifting sensors
Calibration log updated',
 '', 'Level 2 Technician, Sensor calibration',
 'Use lockout/tagout procedures when working on sensor circuits',
 '2025-07-26T14:24:33.802Z', '1.1', true, 6, 1),

('C007', 'User Account Security Audit', '["CORE"]', '17811e57-7c8e-4b0f-8c95-710772134e1e', 25,
 'Config → Services → UserService',
 '1. Review all user accounts
2. Verify unique accounts (no sharing)
3. Check roles and permissions
4. Disable dormant/default accounts
5. Verify strong password policies
6. Check password expiration settings
7. Test account lockout feature
8. Update security documentation',
 'SecurityAudit',
 '["Workbench", "Security checklist"]',
 'No shared accounts
Proper role assignments
Strong passwords enforced
Security log updated',
 '', 'Level 2 Technician, Cybersecurity basics',
 'Maintain system access integrity during security changes',
 '2025-07-26T14:24:33.802Z', '1', true, 7, 1),

('C008', 'Documentation Update', '["CORE"]', '6228b243-a862-4fae-acda-83661bd0e439', 30,
 'Station → Export → File Management',
 '1. Export current point list
2. Update control drawings with changes
3. Document setpoint modifications
4. Update sequence of operations
5. Record any hardware changes
6. Update contact information
7. Save all documentation to customer folder
8. Upload to cloud storage',
 'DocumentationMaintenance',
 '["Workbench", "Documentation templates"]',
 'Point list current
Drawings updated
All changes documented
Files backed up to cloud',
 '', 'Level 1 Technician, Documentation standards',
 'Ensure documentation accurately reflects current system configuration',
 '2025-07-26T14:24:33.802Z', '1', true, 8, 1),

-- ASSURE Tasks
('A001', 'Device Communication Health', '["ASSURE"]', '195c916e-4b41-4bc1-9d3e-dcf06b97221f', 35,
 'Config → Drivers → [Protocol] → Device Manager',
 '1. Open Device Manager for each network
2. Verify all devices show "online" status
3. For offline devices:
   a) Attempt ping/refresh
   b) Check device power
   c) Verify network wiring
   d) Check addressing
4. Review communication statistics
5. Check for high error/retry counts
6. Document offline devices
7. Create work orders for repairs',
 'NetworkDiagnostics',
 '["Workbench", "Network tools", "Multimeter"]',
 'All devices status documented
Offline devices investigated
Communication stats reviewed
Repair orders created',
 'C002', 'Level 2 Technician, Network troubleshooting',
 'Use proper ESD protection when handling network devices',
 '2025-07-26T14:24:33.802Z', '1', true, 9, 2),

('A002', 'Temperature Sensor Calibration', '["ASSURE"]', '1e4b61a9-fc6f-46ac-b6ee-6e29a6eda42c', 45,
 'Point Override → Reference Comparison',
 '1. Identify sensors for calibration
2. Obtain calibrated reference instrument
3. Compare BAS reading to reference
4. Calculate offset if needed
5. Apply calibration in Niagara
6. Verify corrected reading
7. Document calibration values
8. Schedule next calibration',
 'SensorCalibration',
 '["NIST-traceable thermometer", "Calibration log"]',
 'Sensors within ±1°F tolerance
Calibration documented
Next calibration scheduled
Reference instrument certified',
 'C006', 'Level 2 Technician, Calibration procedures',
 'Follow lockout/tagout procedures
Use appropriate PPE',
 '2025-07-26T14:24:33.803Z', '1', true, 10, 2),

('A003', 'Valve & Actuator Testing', '["ASSURE"]', '869fb753-2145-4ec0-a3cc-0d76d4e42a2f', 50,
 'Output Override → Physical Verification',
 '1. Plan testing to minimize disruption
2. Override output to 0% (closed)
3. Verify physical closure
4. Override to 50% and verify
5. Override to 100% (open) and verify
6. Check for smooth operation
7. Listen for unusual noises
8. Test fail-safe operation
9. Return all points to auto',
 'ActuatorTesting',
 '["Workbench", "Radio/phone for coordination"]',
 'All actuators tested
Smooth operation verified
Fail-safe confirmed
All points returned to auto',
 'C005', 'Level 2 Technician, Mechanical systems',
 'Coordinate with facility personnel
Verify fail-safe operation',
 '2025-07-26T14:24:33.803Z', '1', true, 11, 2),

('A004', 'Control Loop Performance', '["ASSURE"]', 'ad6a3e65-10f8-4433-93d1-5e3069e9e7e5', 40,
 'Control Logic → Loops → Analysis',
 '1. Identify critical control loops
2. Review current PID settings
3. Trend setpoint, PV, and output
4. Check for oscillation or offset
5. Adjust tuning if needed:
   a) P-gain for response
   b) I-time for offset
   c) D-time if required
6. Test response to setpoint change
7. Document original and new values',
 'ControlLoopTuning',
 '["Workbench", "Trending tools", "Tuning guide"]',
 'Loops respond smoothly
No sustained oscillation
Minimal steady-state error
Tuning documented',
 'C004', 'Level 3 Technician, Control theory',
 'Monitor system stability during tuning changes',
 '2025-07-26T14:24:33.803Z', '1.1', true, 12, 2),

('A005', 'History Database Maintenance', '["ASSURE"]', 'd14c86c2-b530-46f0-a6e1-2345d3bc5702', 30,
 'Station → Config → History → Database Maintenance',
 '1. Check history database size
2. Review retention policies
3. Export critical history data
4. Clear old records per policy
5. Verify space recovered
6. Check history collection rates
7. Optimize history intervals
8. Document purge activities',
 'DatabaseMaintenance',
 '["Workbench", "External storage"]',
 'Database size optimized
Old data archived
Retention policy followed
Purge documented',
 'C001', 'Level 2 Technician, Database management',
 'Verify critical history data is backed up before purging',
 '2025-07-26T14:24:33.803Z', '1', true, 13, 2),

('A006', 'Security Certificate Check', '["ASSURE"]', '17811e57-7c8e-4b0f-8c95-710772134e1e', 30,
 'Platform Admin → Certificate Manager',
 '1. Open Certificate Manager
2. Check certificate expiration dates
3. Renew expiring certificates
4. Verify certificate trust chain
5. Check allowed hosts list
6. Remove obsolete certificates
7. Test secure connections
8. Document certificate status',
 'CertificateManagement',
 '["Workbench", "Certificate documentation"]',
 'No expired certificates
Trust chain valid
Secure connections work
Documentation updated',
 'C007', 'Level 2 Technician, Certificate management',
 'Maintain secure communications during certificate updates',
 '2025-07-26T14:24:33.803Z', '1', true, 14, 2),

('A007', 'Energy Trend Analysis', '["ASSURE"]', '819dd6e7-0e2e-488b-8538-303ca691fec4', 40,
 'History → Trend Charts → Analysis',
 '1. Generate energy consumption trends
2. Compare to previous periods
3. Identify unusual patterns
4. Check equipment runtime trends
5. Analyze simultaneous heating/cooling
6. Review setback effectiveness
7. Calculate efficiency metrics
8. Prepare recommendations',
 'EnergyAnalysis',
 '["Workbench", "Spreadsheet software"]',
 'Trends analyzed
Patterns identified
Efficiency calculated
Recommendations documented',
 'A005', 'Level 2 Technician, Energy analysis',
 'Consider building occupancy when analyzing energy patterns',
 '2025-07-26T14:24:33.803Z', '1', true, 15, 2),

-- GUARDIAN Tasks
('G001', 'PID Loop Tuning & Optimization', '["GUARDIAN"]', 'ce553bc8-c881-4cfb-95dd-e9f5dbbb0a50', 60,
 'WireSheet → PID Parameters → Tuning',
 '1. Identify loops for optimization
2. Document current parameters
3. Implement systematic tuning:
   a) Set I and D to minimum
   b) Increase P until oscillation
   c) Back off P by 50%
   d) Increase I to remove offset
   e) Add D only if needed
4. Test across operating range
5. Verify stability
6. Document final parameters',
 'AdvancedControlTuning',
 '["Workbench", "Tuning software", "Reference guides"]',
 'Optimal response achieved
No sustained oscillation
Parameters documented
Stability verified',
 'A004', 'Level 3 Technician, Advanced control theory',
 'Monitor critical parameters during tuning process',
 '2025-07-26T14:24:33.803Z', '1', true, 16, 3),

('G002', 'Advanced Analytics Configuration', '["GUARDIAN"]', '3f2da30a-a2af-4421-9183-e862e89123c7', 40,
 'Analytics → FDD Rules → Setup',
 '1. Review existing analytics rules
2. Check rule performance/accuracy
3. Adjust thresholds as needed
4. Add new FDD rules:
   a) Simultaneous heating/cooling
   b) Equipment cycling
   c) Sensor drift detection
5. Configure notifications
6. Test rule triggers
7. Document configuration',
 'AnalyticsConfiguration',
 '["Workbench", "Analytics module"]',
 'Rules properly configured
Thresholds appropriate
Notifications working
Documentation complete',
 'A007', 'Level 3 Technician, Analytics expertise',
 'Verify analytics rules don''t create false alarms',
 '2025-07-26T14:24:33.803Z', '1', true, 17, 3),

('G003', 'Security Vulnerability Assessment', '["GUARDIAN"]', '3864dd35-b5c1-4c16-aab3-e795f5a2b801', 45,
 'Platform Admin → Security Dashboard',
 '1. Run security assessment tool
2. Review vulnerability report
3. Check for default passwords
4. Verify encryption settings
5. Review firewall rules
6. Check for unnecessary services
7. Test penetration resistance
8. Create remediation plan',
 'SecurityAssessment',
 '["Security scanner", "Vulnerability checklist"]',
 'Assessment complete
Vulnerabilities identified
Remediation planned
Security hardened',
 'A006', 'Level 3 Technician, Cybersecurity specialist',
 'Maintain system integrity during security assessment',
 '2025-07-26T14:24:33.803Z', '1', true, 18, 3),

('G004', 'Network Performance Optimization', '["GUARDIAN"]', 'e585eade-9224-4673-a232-c6a0d615c4bf', 40,
 'Diagnostics → Network Statistics → Analysis',
 '1. Analyze network traffic patterns
2. Check bandwidth utilization
3. Identify bottlenecks
4. Optimize polling rates
5. Implement COV where possible
6. Balance network loads
7. Test optimizations
8. Document improvements',
 'NetworkOptimization',
 '["Network analyzer", "Performance monitor"]',
 'Network optimized
Bottlenecks resolved
Performance improved
Changes documented',
 'A001', 'Level 3 Technician, Network specialist',
 'Maintain network stability during optimization',
 '2025-07-26T14:24:33.803Z', '1', true, 19, 3),

('G005', 'Graphics & HMI Enhancement', '["GUARDIAN"]', '015cbca7-c365-48c0-9761-876eb4fefd79', 45,
 'Graphics → Px Views → User Training',
 '1. Review existing graphics
2. Identify enhancement needs
3. Update graphics for clarity
4. Add navigation improvements
5. Implement mobile compatibility
6. Create custom dashboards
7. Train users on new features
8. Document changes',
 'HMIEnhancement',
 '["Px Editor", "Graphics tools"]',
 'Graphics enhanced
Navigation improved
Users trained
Documentation updated',
 'G002', 'Level 3 Technician, HMI design',
 'Ensure critical system information remains easily accessible',
 '2025-07-26T14:24:33.803Z', '1', true, 20, 3),

('G006', 'Preventive Maintenance Scheduling', '["GUARDIAN"]', '78b63222-4130-4184-bca0-37c211e4b319', 30,
 'Programs → Maintenance Scheduler',
 '1. Review equipment maintenance needs
2. Create PM schedules in BAS
3. Configure maintenance alarms
4. Set up runtime tracking
5. Create maintenance reports
6. Integrate with CMMS if available
7. Train staff on system
8. Document procedures',
 'MaintenanceScheduling',
 '["Workbench", "Maintenance templates"]',
 'PM schedules created
Alarms configured
Staff trained
Procedures documented',
 'G001', 'Level 3 Technician, Maintenance planning',
 'Ensure maintenance schedules don''t compromise system reliability',
 '2025-07-26T14:24:33.803Z', '1', true, 21, 3);