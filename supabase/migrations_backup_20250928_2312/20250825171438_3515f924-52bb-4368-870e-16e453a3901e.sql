-- Insert missing task categories for SOPs
INSERT INTO ame_task_categories (category_name, description, color, is_essential) VALUES
('Documentation', 'Documentation and record keeping tasks', '#6366f1', true),
('Operations', 'Operational support and training tasks', '#10b981', true),
('IT & Infrastructure', 'IT infrastructure and server maintenance tasks', '#f59e0b', true)
ON CONFLICT (category_name) DO NOTHING;

-- Import remaining SOPs (8-13) with rich content parsing
WITH category_mappings AS (
  SELECT 
    'System Maintenance' as category_name,
    id as category_id
  FROM ame_task_categories WHERE category_name = 'System Maintenance'
  UNION ALL
  SELECT 
    'Documentation' as category_name,
    id as category_id
  FROM ame_task_categories WHERE category_name = 'Documentation'
  UNION ALL
  SELECT 
    'Operations' as category_name,
    id as category_id
  FROM ame_task_categories WHERE category_name = 'Operations'
  UNION ALL
  SELECT 
    'IT & Infrastructure' as category_name,
    id as category_id
  FROM ame_task_categories WHERE category_name = 'IT & Infrastructure'
),
sop_data AS (
  SELECT 
    '8' as sop_id,
    'Alarm & Analytics Review' as title,
    'System Maintenance' as category,
    'Review active and historical alarms and analytics to ensure critical issues are addressed, reduce nuisance alarms, and verify that fault detection logic is effective.' as goal,
    ' Active Alarm Console Review: Open the Alarm Console and sort by priority. Address all CRITICAL alarms first by investigating the source, taking corrective action, and acknowledging the alarm. Repeat for high and medium priority alarms.<br> Analyze Alarm History: Switch to the history view to identify recurring alarms. Frequent, repetitive alarms often point to underlying equipment issues or poorly configured alarm limits that need to be fixed.<br> Review Alarm Settings: Check Alarm Class configurations to ensure notifications (email, SMS) are routing to the correct, up-to-date recipient lists. Test alarm delivery if possible.<br> Review Analytics/Fault Detection: If an analytics package is installed, review its findings for any detected faults (e.g., simultaneous heating and cooling). Validate that the findings are true and tune the analytic rules or thresholds as needed.<br> Document & Clear: Summarize findings, document recommendations for preventive action, and acknowledge all alarms to clear the active console. This provides a clean slate for new alarms.' as steps,
    ' Work with facility staff to establish an "alarm philosophy" that defines what is truly alarm-worthy, focusing on actionable events.<br> Use Niagaras alarm classes consistently to categorize and prioritize alarms effectively.<br> Hold regular (e.g., monthly) meetings to review alarm logs and discuss root causes of recurring issues.<br> Keep a log or knowledge base documenting how complex alarms were resolved for future reference.<br> Ensure analytics rules are maintained and updated as building equipment or usage changes.' as best_practices,
    'TOOL_041, TOOL_029' as tools,
    'None' as hyperlinks
  UNION ALL
  SELECT 
    '9' as sop_id,
    'Field Device & Actuator Testing' as title,
    'System Maintenance' as category,
    'Physically test field devices and actuators (valves, dampers, etc.) to ensure they respond correctly to control signals from Niagara, catching mechanical issues before they lead to system failure.' as goal,
    ' Plan the Testing: Prioritize critical and problematic devices. Coordinate with on-site staff to minimize disruption. <br>  Override Outputs via Niagara: Use Workbench to override the actuator''s control point to test its range of motion (e.g., 0%, 50%, 100%) [1]. Verify that any available feedback matches the command. <br>  Physical Verification: In the field, observe the device to confirm it moves smoothly and fully [2]. Check linkages for tightness [3] and listen for unusual noises [4, 5]. For fail-safe devices, test the spring-return function [6]. <br>  Test Manual Override: If available, test the manual override lever and ensure it is disengaged afterward [7]. <br>  Return to Auto: Crucially, release all overrides in Niagara so the system returns to automatic control. <br>  Document Findings: Note any device that failed or performed sub-optimally and recommend a resolution.' as steps,
    ' Exercise actuators regularly (at least annually) to prevent them from seizing. <br>  Use a standardized checklist to ensure all mechanical aspects are inspected [8, 9]. <br>  Calibrate actuators that have adjustable stops or feedback so their physical position accurately matches the signal from Niagara. <br>  Take safety precautions and be mindful of the operational impact of your overrides. <br>  Use a team approach (one person at the workstation, one in the field) to speed up testing.' as best_practices,
    'TOOL_041, TOOL_029, TOOL_013' as tools,
    '1. https://www.getmaintainx.com/procedures/d/ZNytKP1vSts/checklist-for-valve-and-damper-actuator-inspection#:~:text=<br>2. https://www.getmaintainx.com/procedures/d/ZNytKP1vSts/checklist-for-valve-and-damper-actuator-inspection#:~:text=<br>3. https://www.getmaintainx.com/procedures/d/ZNytKP1vSts/checklist-for-valve-and-damper-actuator-inspection#:~:text=%2A%20,signs%20of%20wear%20or%20play<br>4. https://www.getmaintainx.com/procedures/d/ZNytKP1vSts/checklist-for-valve-and-damper-actuator-inspection#:~:text=very%20high%20ambient%2Foperating%20temperature%20leading,to%20premature%20failure<br>5. https://www.getmaintainx.com/procedures/d/ZNytKP1vSts/checklist-for-valve-and-damper-actuator-inspection#:~:text=very%20high%20ambient%2Foperating%20temperature%20leading,to%20premature%20failure<br>6. https://www.getmaintainx.com/procedures/d/ZNytKP1vSts/checklist-for-valve-and-damper-actuator-inspection#:~:text=<br>7. https://www.getmaintainx.com/procedures/d/ZNytKP1vSts/checklist-for-valve-and-damper-actuator-inspection#:~:text=actuator%20has%20enough%20force%20to,close<br>8. https://www.getmaintainx.com/procedures/d/ZNytKP1vSts/checklist-for-valve-and-damper-actuator-inspection#:~:text=<br>9. https://www.getmaintainx.com/procedures/d/ZNytKP1vSts/checklist-for-valve-and-damper-actuator-inspection#:~:text=%2A%20,signs%20of%20wear%20or%20play<br>10. https://www.getmaintainx.com/procedures/d/ZNytKP1vSts/checklist-for-valve-and-damper-actuator-inspection#:~:text=<br>11. https://www.getmaintainx.com/procedures/d/ZNytKP1vSts/checklist-for-valve-and-damper-actuator-inspection#:~:text=%2A%20,signs%20of%20wear%20or%20play' as hyperlinks
  UNION ALL
  SELECT 
    '10' as sop_id,
    'Documentation & Reporting' as title,
    'Documentation' as category,
    'Update all relevant documentation and provide a clear maintenance report detailing the work performed, findings, and recommendations to preserve knowledge and inform stakeholders.' as goal,
    ' Update Drawings & Schematics: "Redline" any control drawings with changes made to logic, setpoints, or hardware. This information must eventually be transferred to the official as-built documents [1]. <br>  Update Points List: If points were added or removed, update the master points list. <br>  Create Maintenance Log: Enter a brief summary of the visit and actions taken into a station log file within Niagara. <br>  Generate Service Report: Prepare a formal report for the client detailing tasks performed, issues found, corrective actions taken, and recommendations for next steps. <br>  Review and Sign-off: Briefly review the report with the client to ensure they understand the findings and get their sign-off. <br>  Organize & Archive: Save all updated documents (report, backup, redlines) to a centralized, organized repository.' as steps,
    ' Standardize reports using a consistent template for all sites. <br>  Use checklists and tables to clearly show which tasks were completed. <br>  Record key data like critical setpoints as a historical snapshot. <br>  Maintain a central document repository with a clear folder structure and version control. <br>  Establish a reliable process for transferring field redlines to the official as-built drawings [2].' as best_practices,
    'TOOL_041, TOOL_029, TOOL_035' as tools,
    '1. https://fm.unm.edu/assets/documents/utilities%20pdfs/A%2006%20UNM%20Utilities%20Guidelines%20for%20Construction_1.pdf#:~:text=18.%20Final%20as,Observation%20INTEGRATEDTESTS<br>2. https://fm.unm.edu/assets/documents/utilities%20pdfs/A%2006%20UNM%20Utilities%20Guidelines%20for%20Construction_1.pdf#:~:text=18.%20Final%20as,Observation%20INTEGRATEDTESTS<br>3. https://fm.unm.edu/assets/documents/utilities%20pdfs/A%2006%20UNM%20Utilities%20Guidelines%20for%20Construction_1.pdf#:~:text=18.%20Final%20as,Observation%20INTEGRATEDTESTS' as hyperlinks
  UNION ALL
  SELECT 
    '11' as sop_id,
    'Training & Customer Support' as title,
    'Operations' as category,
    'Provide training and support to end-users so they can effectively operate the Niagara BAS, handle minor issues, and know how to get help when needed.' as goal,
    ' Operator Training/Refreshers: During maintenance visits, review the BAS interface, alarm management, and how to adjust schedules and setpoints.<br> Provide Documentation/Guides: Create and distribute user-friendly, quick-reference guides with screenshots for common tasks.<br> Interactive Q&A: Encourage staff to ask questions and use their feedback to address pain points, which may involve system adjustments.<br> Highlight Best Practices: Teach users simple best practices, like avoiding permanent overrides and performing proper system shutdowns.<br> Establish Support Avenues: Ensure the customer has clear contact information for routine and emergency support.<br> Train New Users: When staff turnover occurs, recommend a formal training session or an official Niagara operator course [1, 2].' as steps,
    ' Customize training to the technical level of the audience, using simple language and visual aids.<br> Encourage continuous education with periodic refresher sessions.<br> Document all training provided in the service report.<br> Create a feedback loop by following up after training to see if users have further questions or if the system UI can be simplified.' as best_practices,
    'TOOL_041, TOOL_029' as tools,
    '1. https://www.niagaramarketplace.com/niagara-4-operator-end-user-training.html#:~:text=Niagara%204%20Operator%2FEnd%20User%20Training,of%20the%20system%20more%20efficiently<br>2. https://www.tridiumuniversity.com/student/page/961603-n4-op-end-amer#:~:text=Niagara%204%20Operator%2FEnd%20User%20Training,navigate%20the%20system%20more%20efficiently' as hyperlinks
  UNION ALL
  SELECT 
    '12' as sop_id,
    'Server Maintenance' as title,
    'IT & Infrastructure' as category,
    'Maintain the underlying host system (OS, hardware, network settings) for a Niagara Supervisor to ensure reliability, security, and performance.' as goal,
    ' Operating System Updates: Periodically apply OS security patches after hours, ensuring Niagara services are shut down gracefully first.<br> Monitor Hardware Resources: Check server CPU and RAM usage to ensure Niagara and other processes are not causing bottlenecks. A CPU utilization below ~80% is a common guideline [1, 2].<br> Manage Disk and File System: Ensure the server has adequate free disk space (>20%). Archive old backups and logs, and perform disk cleanup as needed.<br> Verify Niagara Service Health: Check that the Niagara service is set to auto-start on boot and that recovery options are configured to restart it automatically if it fails.<br> Review Firewall Settings: Ensure firewall rules correctly allow inbound traffic for all necessary Niagara ports (e.g., 4911, 5011, 443) [3, 4] and that these rules are appropriately scoped.<br> Backup the Server: In addition to the Niagara station backup, ensure the entire server/VM is backed up regularly.' as steps,
    ' Establish a regular maintenance window for server updates and reboots, coordinating with the client''s IT department.<br> Use monitoring tools to proactively track server health (CPU, memory, disk space).<br> Follow OS hardening guidelines by disabling unnecessary services and using strong account passwords.<br> Document the server configuration, including OS version, IP settings, and Niagara details.<br> Test fail-safes by occasionally taking the Supervisor offline to ensure JACEs and field controllers operate robustly on their own.' as best_practices,
    'TOOL_041, TOOL_029, TOOL_057' as tools,
    '1. https://support.onesight.solutions/kb/faq.php?id=46#:~:text=Support%20support,Execute%20garbage%20collection%20before<br>2. https://know.innon.com/run-basic-diagnostics-on-jace#:~:text=Image<br>3. https://know.innon.com/im-having-trouble-getting-my-niagara-network-up-and-running#:~:text=Image<br>4. https://know.innon.com/im-having-trouble-getting-my-niagara-network-up-and-running#:~:text=Image<br>5. https://know.innon.com/im-having-trouble-getting-my-niagara-network-up-and-running#:~:text=Image' as hyperlinks
  UNION ALL
  SELECT 
    '13' as sop_id,
    'BAS Documentation Management' as title,
    'Documentation' as category,
    'Maintain an organized, up-to-date set of all BAS documentation to ensure the system can be effectively understood, troubleshot, and upgraded.' as goal,
    ' Organize Document Repositories: Establish a central digital location for all control drawings, points lists, sequences of operation, network diagrams, and program documentation.<br> Manage Redlines and As-Builts: Implement a process where field changes are marked up ("redlined") and then periodically incorporated into the official "as-built" master documents [1]. Use version control with dates or revision numbers.<br> Maintain Vendor Documentation: Collect and store electronic copies of all product manuals, datasheets, and programming guides for installed controllers, sensors, and actuators.<br> Document Control Programs: Use comments and annotations within Niagara wire sheets to explain complex logic.<br> Label Devices in the Field: Ensure physical device labels match the names and IDs used in the documentation.' as steps,
    ' Adhere to documentation standards for drawings, symbols, and point naming conventions.<br> Keep a change log to document the history of system modifications.<br> Periodically audit the documentation by comparing it against the actual system to ensure it hasn''t drifted from reality.<br> Ensure documentation is backed up and accessible to those who need it.<br> Put a QR code on major equipment that links to its documentation for quick field access.' as best_practices,
    'TOOL_041, TOOL_029, TOOL_035' as tools,
    '1. https://fm.unm.edu/assets/documents/utilities%20pdfs/A%2006%20UNM%20Utilities%20Guidelines%20for%20Construction_1.pdf#:~:text=18.%20Final%20as,Observation%20INTEGRATEDTESTS<br>2. https://downloads.onesight.solutions/Tridium/Niagara%204%20Documentation/docPlatform/docPlatform.pdf#:~:text=complete%20replication%20from%20the%20one,Restoring%20a%20station%20backup<br>3. https://know.innon.com/run-basic-diagnostics-on-jace#:~:text=The%20CPU%20should%20never%20exceed,would%20be%20normal<br>4. https://know.innon.com/run-basic-diagnostics-on-jace#:~:text=,might%20be%20the%20main%20reasons<br>5. https://support.hwlbmsportal.com/help/en-gb/19-web-8000/13-managing-jace-8000-histories#:~:text=Good%20practice%20would%20be%20to,to%20short%20term%20network%20outages<br>6. https://support.hwlbmsportal.com/help/en-gb/19-web-8000/13-managing-jace-8000-histories#:~:text=Note%20that%20the%20,to%20limited%20storage%20space%20available<br>7. https://www.getmaintainx.com/procedures/d/ZNytKP1vSts/checklist-for-valve-and-damper-actuator-inspection#:~:text=<br>8. https://www.getmaintainx.com/procedures/d/ZNytKP1vSts/checklist-for-valve-and-damper-actuator-inspection#:~:text=very%20high%20ambient%2Foperating%20temperature%20leading,to%20premature%20failure<br>9. https://fm.unm.edu/assets/documents/utilities%20pdfs/A%2006%20UNM%20Utilities%20Guidelines%20for%20Construction_1.pdf#:~:text=18.%20Final%20as,Observation%20INTEGRATEDTESTS<br>10. https://downloads.onesight.solutions/Tridium/Niagara%204%20Documentation/docPlatform/docPlatform.pdf#:~:text=complete%20replication%20from%20the%20one,Restoring%20a%20station%20backup<br>11. https://downloads.onesight.solutions/Tridium/Niagara%204%20Documentation/docPlatform/docPlatform.pdf#:~:text=complete%20replication%20from%20the%20one,Restoring%20a%20station%20backup<br>12. https://www.reddit.com/r/BuildingAutomation/comments/1iclt5h/backup_supervisor_from_station/#:~:text=Note%20that%20if%20you%20need,Backup%20Service<br>13. https://www.reddit.com/r/BuildingAutomation/comments/1iclt5h/backup_supervisor_from_station/#:~:text=Note%20that%20if%20you%20need,Backup%20Service<br>14. https://downloads.onesight.solutions/Tridium/Niagara%204%20Documentation/docPlatform/docPlatform.pdf#:~:text=A%20backup%20dist%20includes%20not,your%20Workbench%20User%20Home%2C%20in<br>15. https://downloads.onesight.solutions/Tridium/Niagara%204%20Documentation/docPlatform/docPlatform.pdf#:~:text=A%20backup%20dist%20includes%20not,your%20Workbench%20User%20Home%2C%20in<br>16. https://downloads.onesight.solutions/Tridium/Niagara%204%20Documentation/docPlatform/docPlatform.pdf#:~:text=is%20running%2C%20and%20has%20the,Restoring%20a%20station%20backup<br>17. https://downloads.onesight.solutions/Tridium/Niagara%204%20Documentation/docPlatform/docPlatform.pdf#:~:text=is%20running%2C%20and%20has%20the,Restoring%20a%20station%20backup' as hyperlinks
)
INSERT INTO ame_sops_normalized (
  sop_id,
  title,
  category_id,
  goal,
  original_steps_html,
  rich_content,
  steps,
  best_practices,
  tools_required,
  hyperlinks,
  estimated_duration_minutes,
  created_at,
  last_updated
)
SELECT 
  sd.sop_id,
  sd.title,
  cm.category_id,
  sd.goal,
  sd.steps,
  sd.steps,
  -- Parse steps into structured format
  jsonb_build_array(
    jsonb_build_object(
      'step_number', 1,
      'content', TRIM(BOTH ' ' FROM REPLACE(sd.steps, '<br>', E'\n')),
      'references', COALESCE(
        ARRAY(
          SELECT DISTINCT (regexp_matches(sd.steps, '\[(\d+)\]', 'g'))[1]::int
          ORDER BY (regexp_matches(sd.steps, '\[(\d+)\]', 'g'))[1]::int
        ),
        ARRAY[]::int[]
      )
    )
  ),
  sd.best_practices,
  -- Parse tools into JSONB array
  CASE 
    WHEN sd.tools = '' OR sd.tools IS NULL THEN '[]'::jsonb
    ELSE jsonb_build_array(
      SELECT jsonb_agg(TRIM(tool_name))
      FROM unnest(string_to_array(sd.tools, ',')) AS tool_name
      WHERE TRIM(tool_name) != ''
    )
  END,
  -- Parse hyperlinks into structured format
  CASE 
    WHEN sd.hyperlinks = 'None' OR sd.hyperlinks = '' OR sd.hyperlinks IS NULL THEN '[]'::jsonb
    ELSE (
      SELECT jsonb_agg(
        jsonb_build_object(
          'ref_number', ref_num,
          'url', url_part,
          'title', url_part,
          'display_text', 'Reference ' || ref_num
        )
      )
      FROM (
        SELECT 
          ROW_NUMBER() OVER () as ref_num,
          TRIM(BOTH ' ' FROM SPLIT_PART(hyperlink, '#:~:text=', 1)) as url_part
        FROM unnest(string_to_array(sd.hyperlinks, '<br>')) AS hyperlink
        WHERE TRIM(hyperlink) != '' 
        AND hyperlink LIKE '%.%'
        AND hyperlink NOT LIKE '%:~:text=%None%'
      ) parsed_links
    )
  END,
  45, -- Default 45 minutes
  now(),
  now()
FROM sop_data sd
JOIN category_mappings cm ON sd.category = cm.category_name
ON CONFLICT (sop_id) DO UPDATE SET
  title = EXCLUDED.title,
  category_id = EXCLUDED.category_id,
  goal = EXCLUDED.goal,
  original_steps_html = EXCLUDED.original_steps_html,
  rich_content = EXCLUDED.rich_content,
  steps = EXCLUDED.steps,
  best_practices = EXCLUDED.best_practices,
  tools_required = EXCLUDED.tools_required,
  hyperlinks = EXCLUDED.hyperlinks,
  last_updated = now();