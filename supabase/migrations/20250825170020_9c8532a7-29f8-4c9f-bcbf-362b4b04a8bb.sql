-- Clear existing SOP data
DELETE FROM public.ame_sops_normalized;

-- Insert the 7 new SOPs with rich content
INSERT INTO public.ame_sops_normalized (
  sop_id, title, category, goal, steps, best_practices, tools_required, hyperlinks, 
  original_steps_html, rich_content, estimated_duration_minutes, version
) VALUES 
(
  '1',
  'Platform & Station Backup',
  'Maintenance',
  'Ensure you have a complete, restorable backup of the Niagara station and platform in case of failure or data loss. This is critical as backups may be the only way to recover the system after hardware failure or corruption.',
  '[
    {
      "step_number": 1,
      "content": "Open Backup Utility: In Workbench, connect to the Platform of the Niagara host (JACE or Supervisor PC). Navigate to Platform Administration → Backup/Restore. This opens the backup dialog for the host device [1].",
      "references": [1]
    },
    {
      "step_number": 2, 
      "content": "Create Station Backup: Select the running Station in the backup dialog and click \"Backup Station\". You will be prompted to choose a save location for the backup file (.dist extension) [2]. The station will continue running while it packages the backup. Ensure you include all necessary data: Name the Backup: Use a clear naming convention (e.g. SchoolABuilding_2025-07-22_PMBackup). Include History/Alarms: Check the BackupService settings to ensure history/alarm data folders are not excluded [3]. Note: Large histories can make backups big; you may omit very large history databases and rely on separate archiving. Start Backup: Click \"Create\" to begin. A full station backup (.dist file) will be created [4].",
      "references": [2, 3, 4]
    },
    {
      "step_number": 3,
      "content": "Verify & Store Backup: Confirm successful completion. The .dist file is typically saved in your Workbench backups folder [5]. Verify the files timestamp and size. Store a copy externally (drive, network, cloud).",
      "references": [5]
    },
    {
      "step_number": 4,
      "content": "Test the Backup (Optional): Occasionally, test restoring a backup on a test station to verify its integrity.",
      "references": []
    },
    {
      "step_number": 5,
      "content": "Why Its Important: A current backup allows fast recovery. A JACE failure at a school, for example, can be fixed in hours with a backup instead of days rebuilding. The backup enables \"complete replication from one backup file\" [6].",
      "references": [6]
    }
  ]'::jsonb,
  'Perform backups regularly (at least quarterly) and maintain multiple historical copies. Keep backups secure and use password protection if available, as they contain sensitive system credentials. Monitor backup file size to ensure completeness and manage history data growth. If a backup fails, check disk space and JACE status. Always resolve backup issues before leaving the site.',
  '["TOOL_041", "TOOL_029", "TOOL_035"]'::jsonb,
  '[
    {"ref_number": 1, "url": "https://downloads.onesight.solutions/Tridium/Niagara%204%20Documentation/docPlatform/docPlatform.pdf#:~:text=complete%20replication%20from%20the%20one,Restoring%20a%20station%20backup", "title": "Platform Documentation - Station Backup"},
    {"ref_number": 2, "url": "https://downloads.onesight.solutions/Tridium/Niagara%204%20Documentation/docPlatform/docPlatform.pdf#:~:text=complete%20replication%20from%20the%20one,Restoring%20a%20station%20backup", "title": "Platform Documentation - Backup Process"},
    {"ref_number": 3, "url": "https://www.reddit.com/r/BuildingAutomation/comments/1iclt5h/backup_supervisor_from_station/#:~:text=Note%20that%20if%20you%20need,Backup%20Service", "title": "Reddit - Backup Service Settings"},
    {"ref_number": 4, "url": "https://downloads.onesight.solutions/Tridium/Niagara%204%20Documentation/docPlatform/docPlatform.pdf#:~:text=A%20backup%20dist%20includes%20not,your%20Workbench%20User%20Home%2C%20in", "title": "Platform Documentation - Backup File Creation"},
    {"ref_number": 5, "url": "https://downloads.onesight.solutions/Tridium/Niagara%204%20Documentation/docPlatform/docPlatform.pdf#:~:text=is%20running%2C%20and%20has%20the,Restoring%20a%20station%20backup", "title": "Platform Documentation - Backup Storage"},
    {"ref_number": 6, "url": "https://downloads.onesight.solutions/Tridium/Niagara%204%20Documentation/docPlatform/docPlatform.pdf#:~:text=A%20backup%20dist%20includes%20not,your%20Workbench%20User%20Home%2C%20in", "title": "Platform Documentation - Backup Benefits"}
  ]'::jsonb,
  ' Open Backup Utility: In Workbench, connect to the Platform of the Niagara host (JACE or Supervisor PC). Navigate to Platform Administration ? Backup/Restore. This opens the backup dialog for the host device [1].<br> Create Station Backup: Select the running Station in the backup dialog and click "Backup Station". You will be prompted to choose a save location for the backup file (.dist extension) [2]. The station will continue running while it packages the backup. Ensure you include all necessary data:<br> - Name the Backup: Use a clear naming convention (e.g. SchoolABuilding_2025-07-22_PMBackup).<br> - Include History/Alarms: Check the BackupService settings to ensure history/alarm data folders are not excluded [3]. Note: Large histories can make backups big; you may omit very large history databases and rely on separate archiving.<br> - Start Backup: Click "Create" to begin. A full station backup (.dist file) will be created [4].<br> Verify & Store Backup: Confirm successful completion. The .dist file is typically saved in your Workbench backups folder [5]. Verify the files timestamp and size. Store a copy externally (drive, network, cloud).<br> Test the Backup (Optional): Occasionally, test restoring a backup on a test station to verify its integrity.<br> Why Its Important: A current backup allows fast recovery. A JACE failure at a school, for example, can be fixed in hours with a backup instead of days rebuilding. The backup enables "complete replication from one backup file" [6].',
  ' Open Backup Utility: In Workbench, connect to the Platform of the Niagara host (JACE or Supervisor PC). Navigate to Platform Administration ? Backup/Restore. This opens the backup dialog for the host device [1].<br> Create Station Backup: Select the running Station in the backup dialog and click "Backup Station". You will be prompted to choose a save location for the backup file (.dist extension) [2]. The station will continue running while it packages the backup. Ensure you include all necessary data:<br> - Name the Backup: Use a clear naming convention (e.g. SchoolABuilding_2025-07-22_PMBackup).<br> - Include History/Alarms: Check the BackupService settings to ensure history/alarm data folders are not excluded [3]. Note: Large histories can make backups big; you may omit very large history databases and rely on separate archiving.<br> - Start Backup: Click "Create" to begin. A full station backup (.dist file) will be created [4].<br> Verify & Store Backup: Confirm successful completion. The .dist file is typically saved in your Workbench backups folder [5]. Verify the files timestamp and size. Store a copy externally (drive, network, cloud).<br> Test the Backup (Optional): Occasionally, test restoring a backup on a test station to verify its integrity.<br> Why Its Important: A current backup allows fast recovery. A JACE failure at a school, for example, can be fixed in hours with a backup instead of days rebuilding. The backup enables "complete replication from one backup file" [6].',
  45,
  '1.0'
),
(
  '2',
  'Performance Verification & Diagnostics',
  'Maintenance',
  'Verify the Niagara system is running efficiently and identify any performance issues (CPU overload, memory leaks, slow control logic, etc.) before they affect building operations. This involves using Niagaras diagnostic tools to check resource utilization and health of the station.',
  '[
    {
      "step_number": 1,
      "content": "Station Summary (Resource Manager): In Workbench, right-click the Station and select Views → Station Summary [1]. Examine: CPU Usage: Should stay below ~80% continuously [2, 3]. Heap Memory: Used heap should be under ~75% of max [4, 5]. If >80-90% and climbing, it may indicate a memory leak. License Capacities: Ensure device/point counts are within license limits [6]. File Descriptors (JACE): Keep active histories reasonable (<5000) to avoid exhausting file handles [7].",
      "references": [1, 2, 3, 4, 5, 6, 7]
    },
    {
      "step_number": 2,
      "content": "Investigate Slow Components (Engine Hogs): Use Spy → sys.sysMgr → engineManager → engineHogs [8] to find tasks with abnormally high execution times [9].",
      "references": [8, 9]
    },
    {
      "step_number": 3,
      "content": "Driver Performance (Poll Rates): Check polling cycle times in the network properties. If actual times exceed configured intervals, the network may be saturated [10, 11].",
      "references": [10, 11]
    },
    {
      "step_number": 4,
      "content": "Application Director (System Log): Open Platform → Application Director to view live logs. Look for errors or warnings. Use log filters for detailed debugging [12, 13, 14] and remember to reset them. You can save the log by streaming to a file [15].",
      "references": [12, 13, 14, 15]
    },
    {
      "step_number": 5,
      "content": "Verify Normal Operations: Ensure all diagnostic settings are returned to normal after testing.",
      "references": []
    }
  ]'::jsonb,
  'Document baseline performance metrics (CPU%, heap%) during each visit to track trends. Keep JACE configurations lean by removing unused components. Offload heavy tasks like long-term data handling from JACEs to a Supervisor. Plan for capacity upgrades if resource metrics show the system is nearing its limits. Keep Niagara updated to the latest stable release for security and performance improvements.',
  '["TOOL_041", "TOOL_029"]'::jsonb,
  '[
    {"ref_number": 1, "url": "https://know.innon.com/run-basic-diagnostics-on-jace#:~:text=Right%20click%20on%20the%20station,Station%20Summary", "title": "Innon - Station Summary"},
    {"ref_number": 2, "url": "https://know.innon.com/run-basic-diagnostics-on-jace#:~:text=Image", "title": "Innon - Diagnostics Image"},
    {"ref_number": 3, "url": "https://know.innon.com/run-basic-diagnostics-on-jace#:~:text=The%20CPU%20should%20never%20exceed,would%20be%20normal", "title": "Innon - CPU Usage Guidelines"},
    {"ref_number": 4, "url": "https://know.innon.com/run-basic-diagnostics-on-jace#:~:text=,might%20be%20the%20main%20reasons", "title": "Innon - Memory Issues"},
    {"ref_number": 5, "url": "https://know.innon.com/run-basic-diagnostics-on-jace#:~:text=You%20should%20never%20use%20more,might%20be%20the%20main%20reasons", "title": "Innon - Memory Usage Guidelines"},
    {"ref_number": 6, "url": "https://downloads.onesight.solutions/Tridium/Niagara%204%20Documentation/docPlatform/docPlatform.pdf#:~:text=Manager%20view,01%22%20point.limit%3D%221250%22%20device.limit%3D%2250", "title": "Platform Documentation - License Limits"},
    {"ref_number": 7, "url": "https://support.hwlbmsportal.com/help/en-gb/19-web-8000/13-managing-jace-8000-histories#:~:text=File%20Descriptors%20The%20JACE%208000,be%20viewed%20in%C2%A0%C2%A0spy%3A%2Fplatform%20diagnostics%2Fpidin%20fds", "title": "HWL BMS - File Descriptors"},
    {"ref_number": 8, "url": "https://know.innon.com/run-basic-diagnostics-on-jace#:~:text=Right%20click%20on%20the%20station,Engine%20Hogs", "title": "Innon - Engine Hogs"},
    {"ref_number": 9, "url": "https://know.innon.com/run-basic-diagnostics-on-jace#:~:text=Clicking%20that%2C%20a%20list%20of,000us%20%28micro%20seconds", "title": "Innon - Engine Performance"},
    {"ref_number": 10, "url": "https://know.innon.com/run-basic-diagnostics-on-jace#:~:text=Looking%20at%20the%20property%20sheet,check%20the%20Resource%20Monitor", "title": "Innon - Poll Rates"},
    {"ref_number": 11, "url": "https://know.innon.com/run-basic-diagnostics-on-jace#:~:text=,check%20the%20Resource%20Monitor", "title": "Innon - Resource Monitor"},
    {"ref_number": 12, "url": "https://know.innon.com/run-basic-diagnostics-on-jace#:~:text=,or%20component", "title": "Innon - Log Filtering"},
    {"ref_number": 13, "url": "https://know.innon.com/run-basic-diagnostics-on-jace#:~:text=Right%20click%20on%20the%20station%2C,on%20the%20main%20view", "title": "Innon - Application Director"},
    {"ref_number": 14, "url": "https://know.innon.com/run-basic-diagnostics-on-jace#:~:text=Let%20say%20I%20wanted%20to,all%20the%20Modbus%20traffic%20generated", "title": "Innon - Log Examples"},
    {"ref_number": 15, "url": "https://know.innon.com/run-basic-diagnostics-on-jace#:~:text=The%20,add%20more%20information%20to%20it", "title": "Innon - Log Streaming"}
  ]'::jsonb,
  ' Station Summary (Resource Manager): In Workbench, right-click the Station and select Views ? Station Summary [1]. Examine:<br> - CPU Usage: Should stay below ~80% continuously [2, 3].<br> - Heap Memory: Used heap should be under ~75% of max [4, 5]. If >80-90% and climbing, it may indicate a memory leak.<br> - License Capacities: Ensure device/point counts are within license limits [6].<br> - File Descriptors (JACE): Keep active histories reasonable (<5000) to avoid exhausting file handles [7].<br> Investigate Slow Components (Engine Hogs): Use Spy ? sys.sysMgr ? engineManager ? engineHogs [8] to find tasks with abnormally high execution times [9].<br> Driver Performance (Poll Rates): Check polling cycle times in the network properties. If actual times exceed configured intervals, the network may be saturated [10, 11].<br> Application Director (System Log): Open Platform ? Application Director to view live logs. Look for errors or warnings. Use log filters for detailed debugging [12, 13, 14] and remember to reset them. You can save the log by streaming to a file [15].<br> Verify Normal Operations: Ensure all diagnostic settings are returned to normal after testing.',
  ' Station Summary (Resource Manager): In Workbench, right-click the Station and select Views ? Station Summary [1]. Examine:<br> - CPU Usage: Should stay below ~80% continuously [2, 3].<br> - Heap Memory: Used heap should be under ~75% of max [4, 5]. If >80-90% and climbing, it may indicate a memory leak.<br> - License Capacities: Ensure device/point counts are within license limits [6].<br> - File Descriptors (JACE): Keep active histories reasonable (<5000) to avoid exhausting file handles [7].<br> Investigate Slow Components (Engine Hogs): Use Spy ? sys.sysMgr ? engineManager ? engineHogs [8] to find tasks with abnormally high execution times [9].<br> Driver Performance (Poll Rates): Check polling cycle times in the network properties. If actual times exceed configured intervals, the network may be saturated [10, 11].<br> Application Director (System Log): Open Platform ? Application Director to view live logs. Look for errors or warnings. Use log filters for detailed debugging [12, 13, 14] and remember to reset them. You can save the log by streaming to a file [15].<br> Verify Normal Operations: Ensure all diagnostic settings are returned to normal after testing.',
  30,
  '1.0'
),
(
  '3',
  'History Database Backup & Purge',
  'Maintenance',
  'Manage the stations historical trend data – backing up important history logs and purging older records – to ensure the history database does not consume excessive space or slow down the system. This keeps the Niagara station efficient and retains only useful data.',
  '[
    {
      "step_number": 1,
      "content": "Backup History Data: If long-term retention is needed, archive histories outside the JACE. Use Niagara''s Archive History Provider [1] or export to CSV. It''s common for JACEs to send daily data to a central Supervisor, keeping only a small local buffer [2, 3].",
      "references": [1, 2, 3]
    },
    {
      "step_number": 2,
      "content": "History Database Maintenance View: Navigate to the History service, right-click, and select Views → Database Maintenance [4]. Select Histories: Choose specific histories to manage. Choose Maintenance Action: Use Clear Old Records [5] and set a cutoff date [6] to remove old data. Clear All Records will wipe the entire history [7]. Execute Purge: Click \"Run Maintenance\" to perform the action [8]. Verify Space: Check free space on the JACE file system after purging. A JACE-8000 has a 384 MB RAM disk for histories [9].",
      "references": [4, 5, 6, 7, 8, 9]
    },
    {
      "step_number": 3,
      "content": "Set History Retention Limits: Configure each history''s capacity to a specific record count or duration instead of \"Unlimited\" [10].",
      "references": [10]
    },
    {
      "step_number": 4,
      "content": "Archiving Strategy: Use a Supervisor to pull histories from JACEs daily [11]. Ensure the Supervisor has adequate disk space and is backed up regularly.",
      "references": [11]
    },
    {
      "step_number": 5,
      "content": "Alarm Database Maintenance: Periodically purge old, acknowledged alarms from the Alarm Service if retention policies allow.",
      "references": []
    }
  ]'::jsonb,
  'Define a data retention policy for different data types and implement it via scheduled purges or capacity limits. Automate purges using Niagaras scheduling features. Monitor JACE storage space as part of your regular maintenance checklist. Verify that data offloads to a Supervisor or external storage are running correctly. Document when data is purged and how much was removed to identify trends in data growth.',
  '["TOOL_041", "TOOL_029"]'::jsonb,
  '[
    {"ref_number": 1, "url": "https://www.tridium.com/content/dam/tridium/en/documents/events/2021-10-21-TridiumTalk-ArchiveHistoryProvider-QA.pdf#:~:text=,is%20exported%20to%20a", "title": "Tridium - Archive History Provider"},
    {"ref_number": 2, "url": "https://support.hwlbmsportal.com/help/en-gb/19-web-8000/13-managing-jace-8000-histories#:~:text=have%20advanced%20functions%20like%20trending%2C,controller%20in%20the%20Niagara%20architecture", "title": "HWL BMS - JACE History Management"},
    {"ref_number": 3, "url": "https://support.hwlbmsportal.com/help/en-gb/19-web-8000/13-managing-jace-8000-histories#:~:text=Good%20practice%20would%20be%20to,to%20short%20term%20network%20outages", "title": "HWL BMS - History Best Practices"},
    {"ref_number": 4, "url": "https://docs-be.distech-controls.com/bundle/Histories-EC-Net4_UG/raw/resource/enus/Histories%20EC-Net4_UG.pdf#:~:text=Database%20Maintenance%20view%20This%20view,contains%20the%20available%20histories%20window", "title": "Distech - Database Maintenance View"},
    {"ref_number": 5, "url": "https://docs-be.distech-controls.com/bundle/Histories-EC-Net4_UG/raw/resource/enus/Histories%20EC-Net4_UG.pdf#:~:text=%E2%80%A2%20Clear%20Old%20Records%20option,%E2%80%A2%20Clear%20all%20records", "title": "Distech - Clear Old Records"},
    {"ref_number": 6, "url": "https://docs-be.distech-controls.com/bundle/Histories-EC-Net4_UG/raw/resource/enus/Histories%20EC-Net4_UG.pdf#:~:text=%E2%80%A2%20Clear%20Old%20Records%20option,%E2%80%A2%20Clear%20all%20records", "title": "Distech - Clear Old Records Options"},
    {"ref_number": 7, "url": "https://docs-be.distech-controls.com/bundle/Histories-EC-Net4_UG/raw/resource/enus/Histories%20EC-Net4_UG.pdf#:~:text=%E2%80%A2%20Clear%20all%20records%20Select,in%20the%20targeted%20histories%20window", "title": "Distech - Clear All Records"},
    {"ref_number": 8, "url": "https://docs-be.distech-controls.com/bundle/Histories-EC-Net4_UG/raw/resource/enus/Histories%20EC-Net4_UG.pdf#:~:text=window,Device%20Histories%20View", "title": "Distech - Run Maintenance"},
    {"ref_number": 9, "url": "https://support.hwlbmsportal.com/help/en-gb/19-web-8000/13-managing-jace-8000-histories#:~:text=Ram%20disk%20is%20a%20virtual,on%20adjusting%20the%20memory%20pools", "title": "HWL BMS - JACE RAM Disk"},
    {"ref_number": 10, "url": "https://support.hwlbmsportal.com/help/en-gb/19-web-8000/13-managing-jace-8000-histories#:~:text=Note%20that%20the%20,to%20limited%20storage%20space%20available", "title": "HWL BMS - History Retention Limits"},
    {"ref_number": 11, "url": "https://support.hwlbmsportal.com/help/en-gb/19-web-8000/13-managing-jace-8000-histories#:~:text=Good%20practice%20would%20be%20to,to%20short%20term%20network%20outages", "title": "HWL BMS - Supervisor Archiving"}
  ]'::jsonb,
  ' Backup History Data: If long-term retention is needed, archive histories outside the JACE. Use Niagara''s Archive History Provider [1] or export to CSV. It''s common for JACEs to send daily data to a central Supervisor, keeping only a small local buffer [2, 3].<br> History Database Maintenance View: Navigate to the History service, right-click, and select Views ? Database Maintenance [4].<br> - Select Histories: Choose specific histories to manage.<br> - Choose Maintenance Action: Use Clear Old Records [5] and set a cutoff date [6] to remove old data. Clear All Records will wipe the entire history [7].<br> - Execute Purge: Click "Run Maintenance" to perform the action [8].<br> - Verify Space: Check free space on the JACE file system after purging. A JACE-8000 has a 384 MB RAM disk for histories [9].<br> Set History Retention Limits: Configure each history''s capacity to a specific record count or duration instead of "Unlimited" [10].<br> Archiving Strategy: Use a Supervisor to pull histories from JACEs daily [11]. Ensure the Supervisor has adequate disk space and is backed up regularly.<br> Alarm Database Maintenance: Periodically purge old, acknowledged alarms from the Alarm Service if retention policies allow.',
  ' Backup History Data: If long-term retention is needed, archive histories outside the JACE. Use Niagara''s Archive History Provider [1] or export to CSV. It''s common for JACEs to send daily data to a central Supervisor, keeping only a small local buffer [2, 3].<br> History Database Maintenance View: Navigate to the History service, right-click, and select Views ? Database Maintenance [4].<br> - Select Histories: Choose specific histories to manage.<br> - Choose Maintenance Action: Use Clear Old Records [5] and set a cutoff date [6] to remove old data. Clear All Records will wipe the entire history [7].<br> - Execute Purge: Click "Run Maintenance" to perform the action [8].<br> - Verify Space: Check free space on the JACE file system after purging. A JACE-8000 has a 384 MB RAM disk for histories [9].<br> Set History Retention Limits: Configure each history''s capacity to a specific record count or duration instead of "Unlimited" [10].<br> Archiving Strategy: Use a Supervisor to pull histories from JACEs daily [11]. Ensure the Supervisor has adequate disk space and is backed up regularly.<br> Alarm Database Maintenance: Periodically purge old, acknowledged alarms from the Alarm Service if retention policies allow.',
  35,
  '1.0'
),
(
  '4',
  'Device Communication Health',
  'Maintenance',
  'Ensure all field controllers/devices integrated with Niagara (BACnet, Modbus, Lon, etc.) are online and communicating properly. Identify any offline devices or communication errors and address them to maintain system integrity.',
  '[
    {
      "step_number": 1,
      "content": "Device Manager Check: In Workbench, open the Device Manager for each driver network. Verify each device shows a status of {ok} or online [1, 2]. If a device is \"down,\" note it. Attempt a manual \"Ping\" or \"Refresh\" action to re-establish communication [3]. If it remains offline, troubleshoot power, wiring, or addressing.",
      "references": [1, 2, 3]
    },
    {
      "step_number": 2,
      "content": "Review Communication Stats: Check diagnostic fields for high error counts, retries, or timeouts. Use ICMP ping for IP devices.",
      "references": []
    },
    {
      "step_number": 3,
      "content": "Investigate Offline Devices: On-Site Check: Physically inspect the device for issues like tripped breakers or unplugged cables. Loop/Chain Impact: On a daisy-chain bus, check if multiple devices in sequence are down. License Limits: Ensure you havent exceeded Niagaras device license count [4].",
      "references": [4]
    },
    {
      "step_number": 4,
      "content": "Document & Resolve: List all offline devices, likely causes, and corrective actions. Notify facility staff if critical systems are affected.",
      "references": []
    },
    {
      "step_number": 5,
      "content": "Alarm on Offline: Verify that the system is configured to generate an alarm on device communication failures.",
      "references": []
    }
  ]'::jsonb,
  'Keep an up-to-date inventory of all managed devices with their physical locations. Trend uptime for critical devices to identify intermittent communication issues. For IP networks, coordinate with IT to ensure required ports are open and consider using a separate VLAN for BAS devices. Have spare hardware on hand for older systems to minimize downtime. After any device change, update the configuration in Niagara and remove ghost devices.',
  '["TOOL_041", "TOOL_029", "TOOL_057"]'::jsonb,
  '[
    {"ref_number": 1, "url": "https://downloads.onesight.solutions/Tridium/Niagara%204%20Documentation/docModbus/docModbus.pdf#:~:text=match%20at%20L800%20You%20should,of%20the%20network%20and%2For%20the", "title": "Modbus Documentation - Device Status"},
    {"ref_number": 2, "url": "https://downloads.onesight.solutions/Tridium/Niagara%204%20Documentation/docModbus/docModbus.pdf#:~:text=You%20should%20see%20the%20device,in%20a%20Modbus%20slave%20device", "title": "Modbus Documentation - Device Manager"},
    {"ref_number": 3, "url": "https://github.com/JoelBender/bacpypes/issues/239#:~:text=Niagara%20by%20default%20uses%20polling,might%20bring%20it%20back%20up", "title": "BACpypes - Device Recovery"},
    {"ref_number": 4, "url": "https://downloads.onesight.solutions/Tridium/Niagara%204%20Documentation/docPlatform/docPlatform.pdf#:~:text=when%20the%20global%20capacity%20recount,being%20excluded%20from%20any%20limits", "title": "Platform Documentation - License Limits"}
  ]'::jsonb,
  ' Device Manager Check: In Workbench, open the Device Manager for each driver network. Verify each device shows a status of {ok} or online [1, 2].<br> - If a device is "down," note it. Attempt a manual "Ping" or "Refresh" action to re-establish communication [3].<br> - If it remains offline, troubleshoot power, wiring, or addressing.<br> Review Communication Stats: Check diagnostic fields for high error counts, retries, or timeouts. Use ICMP ping for IP devices.<br> Investigate Offline Devices:<br> - On-Site Check: Physically inspect the device for issues like tripped breakers or unplugged cables.<br> - Loop/Chain Impact: On a daisy-chain bus, check if multiple devices in sequence are down.<br> - License Limits: Ensure you havent exceeded Niagaras device license count [4].<br> Document & Resolve: List all offline devices, likely causes, and corrective actions. Notify facility staff if critical systems are affected.<br> Alarm on Offline: Verify that the system is configured to generate an alarm on device communication failures.',
  ' Device Manager Check: In Workbench, open the Device Manager for each driver network. Verify each device shows a status of {ok} or online [1, 2].<br> - If a device is "down," note it. Attempt a manual "Ping" or "Refresh" action to re-establish communication [3].<br> - If it remains offline, troubleshoot power, wiring, or addressing.<br> Review Communication Stats: Check diagnostic fields for high error counts, retries, or timeouts. Use ICMP ping for IP devices.<br> Investigate Offline Devices:<br> - On-Site Check: Physically inspect the device for issues like tripped breakers or unplugged cables.<br> - Loop/Chain Impact: On a daisy-chain bus, check if multiple devices in sequence are down.<br> - License Limits: Ensure you havent exceeded Niagaras device license count [4].<br> Document & Resolve: List all offline devices, likely causes, and corrective actions. Notify facility staff if critical systems are affected.<br> Alarm on Offline: Verify that the system is configured to generate an alarm on device communication failures.',
  25,
  '1.0'
),
(
  '5',
  'Sensor Calibration & Verification',
  'Maintenance',
  'Validate that critical sensors (temperature, pressure, humidity, etc.) are reading accurately, and calibrate them if necessary. Accurate sensors are fundamental for correct control.',
  '[
    {
      "step_number": 1,
      "content": "Identify Key Sensors: Focus on those impacting control or prone to drift (OAT, supply air pressure, critical room sensors).",
      "references": []
    },
    {
      "step_number": 2,
      "content": "Field Measurement: Use a calibrated, trusted reference tool (e.g., NIST-traceable thermometer) to get a reliable reading at the sensor''s location. Compare the reference reading to the value shown in Niagara.",
      "references": []
    },
    {
      "step_number": 3,
      "content": "Apply Calibration/Offset: If a sensor is out of tolerance, adjust it. This can be done via physical potentiometers or, more commonly, through a software offset in the controller''s configuration within Niagara [1, 2, 3]. If the sensor reads low, apply a positive offset; if it reads high, apply a negative one.",
      "references": [1, 2, 3]
    },
    {
      "step_number": 4,
      "content": "Record Calibration: Document all changes: which sensor was adjusted, the offset value, and the date. Tagging the sensor physically or in Niagara''s notes is a good practice.",
      "references": []
    },
    {
      "step_number": 5,
      "content": "Verify Other Sensors: Spot-check a sample of other sensors to ensure general system accuracy.",
      "references": []
    }
  ]'::jsonb,
  'Schedule regular calibration checks (at least annually) for critical sensors. Use certified calibration standards or services for important reference sensors. If multiple sensors of the same type are drifting, investigate for a systemic issue. Update BAS setpoints and educate operators after a significant calibration change. Keep a detailed calibration log within the BAS for future reference. Use Niagara Analytics to create alarms that flag potential sensor drift proactively.',
  '["TOOL_015", "TOOL_017", "TOOL_019", "TOOL_041"]'::jsonb,
  '[
    {"ref_number": 1, "url": "https://www.kmccontrols.com/wp-content/uploads/kmc_documents/KMC%20BACnet%20Module%20Rev%20E.pdf#:~:text=output%20is%20calibrated%20for%20degrees,Table%20index", "title": "KMC Controls - Output Calibration"},
    {"ref_number": 2, "url": "https://www.kmccontrols.com/wp-content/uploads/kmc_documents/KMC%20BACnet%20Module%20Rev%20E.pdf#:~:text=Calibration%20Enter%20a%20calibration%20factor,on%20the%20input%20of%20an", "title": "KMC Controls - Calibration Factor"},
    {"ref_number": 3, "url": "https://www.kmccontrols.com/wp-content/uploads/kmc_documents/KMC%20BACnet%20Module%20Rev%20E.pdf#:~:text=Calibration%20Enter%20a%20calibration%20factor,on%20the%20input%20of%20an", "title": "KMC Controls - Input Calibration"}
  ]'::jsonb,
  ' Identify Key Sensors: Focus on those impacting control or prone to drift (OAT, supply air pressure, critical room sensors).<br> Field Measurement: Use a calibrated, trusted reference tool (e.g., NIST-traceable thermometer) to get a reliable reading at the sensor''s location. Compare the reference reading to the value shown in Niagara.<br> Apply Calibration/Offset: If a sensor is out of tolerance, adjust it. This can be done via physical potentiometers or, more commonly, through a software offset in the controller''s configuration within Niagara [1, 2, 3]. If the sensor reads low, apply a positive offset; if it reads high, apply a negative one.<br> Record Calibration: Document all changes: which sensor was adjusted, the offset value, and the date. Tagging the sensor physically or in Niagara''s notes is a good practice.<br> Verify Other Sensors: Spot-check a sample of other sensors to ensure general system accuracy.',
  ' Identify Key Sensors: Focus on those impacting control or prone to drift (OAT, supply air pressure, critical room sensors).<br> Field Measurement: Use a calibrated, trusted reference tool (e.g., NIST-traceable thermometer) to get a reliable reading at the sensor''s location. Compare the reference reading to the value shown in Niagara.<br> Apply Calibration/Offset: If a sensor is out of tolerance, adjust it. This can be done via physical potentiometers or, more commonly, through a software offset in the controller''s configuration within Niagara [1, 2, 3]. If the sensor reads low, apply a positive offset; if it reads high, apply a negative one.<br> Record Calibration: Document all changes: which sensor was adjusted, the offset value, and the date. Tagging the sensor physically or in Niagara''s notes is a good practice.<br> Verify Other Sensors: Spot-check a sample of other sensors to ensure general system accuracy.',
  20,
  '1.0'
),
(
  '6',
  'Control Loop Tuning & Testing',
  'Maintenance',
  'Examine and optimize the performance of control loops (e.g., PID loops) to ensure stable, efficient operation by adjusting parameters to eliminate oscillations or steady-state errors.',
  '[
    {
      "step_number": 1,
      "content": "Identify Critical Loops: Focus on loops with a major impact on operations (supply air temp, chilled water pressure) or those known to have issues like hunting or slow response.",
      "references": []
    },
    {
      "step_number": 2,
      "content": "Review Current Settings: In Niagara Workbench, inspect the PID control block parameters (Proportional Gain, Integral Time, etc.). Note the existing values.",
      "references": []
    },
    {
      "step_number": 3,
      "content": "Test the Loop Response: During off-peak times, introduce a setpoint change and observe the loop''s reaction using real-time charts. Note any overshoot, undershoot, or oscillation. Tune P, I, and D: Adjust the Proportional (P) gain first to get a decent response, then add Integral (I) action to eliminate steady-state error, and only use Derivative (D) if necessary to dampen overshoot in fast-acting systems [1, 2, 3].",
      "references": [1, 2, 3]
    },
    {
      "step_number": 4,
      "content": "Fine-tune: Make iterative adjustments, allowing the loop to settle after each change. Use trend logs for detailed analysis.",
      "references": []
    },
    {
      "step_number": 5,
      "content": "Validate in All Modes: Ensure the loop performs well under all operating conditions (e.g., heating vs. cooling, high vs. low load).",
      "references": []
    },
    {
      "step_number": 6,
      "content": "Document Changes: Record the original and newly tuned PID values along with observations for future reference.",
      "references": []
    }
  ]'::jsonb,
  'Tune one loop at a time to avoid unpredictable interactions. Use Niagara''s trending tools to analyze loop performance systematically. Consult experienced engineers or manufacturer guides if you are unsure. Avoid over-tuning; for most building systems, a slightly slower, stable response is better than a fast, unstable one. Verify that mechanical components (valves, dampers) are functioning correctly and are not the root cause of the tuning issue. Consider seasonal re-tuning for loops affected by changing environmental conditions.',
  '["TOOL_041"]'::jsonb,
  '[
    {"ref_number": 1, "url": "https://blog.smartbuildingsacademy.com/learnseries002#:~:text=You%20should%20see%20a%20spike,value%20should%20start%20off%20at", "title": "Smart Buildings Academy - PID Tuning Basics"},
    {"ref_number": 2, "url": "https://blog.smartbuildingsacademy.com/learnseries002#:~:text=So%2C%20now%20you%20need%20to,realize%20hunting%20with%20your%20valve", "title": "Smart Buildings Academy - PID Optimization"},
    {"ref_number": 3, "url": "https://blog.smartbuildingsacademy.com/learnseries002#:~:text=When%20it%20comes%20to%20tuning,to%20be%20confusing%20as%20crap", "title": "Smart Buildings Academy - Tuning Guidelines"}
  ]'::jsonb,
  ' Identify Critical Loops: Focus on loops with a major impact on operations (supply air temp, chilled water pressure) or those known to have issues like hunting or slow response.<br> Review Current Settings: In Niagara Workbench, inspect the PID control block parameters (Proportional Gain, Integral Time, etc.). Note the existing values.<br> Test the Loop Response: During off-peak times, introduce a setpoint change and observe the loop''s reaction using real-time charts. Note any overshoot, undershoot, or oscillation.<br> - Tune P, I, and D: Adjust the Proportional (P) gain first to get a decent response, then add Integral (I) action to eliminate steady-state error, and only use Derivative (D) if necessary to dampen overshoot in fast-acting systems [1, 2, 3].<br> Fine-tune: Make iterative adjustments, allowing the loop to settle after each change. Use trend logs for detailed analysis.<br> Validate in All Modes: Ensure the loop performs well under all operating conditions (e.g., heating vs. cooling, high vs. low load).<br> Document Changes: Record the original and newly tuned PID values along with observations for future reference.',
  ' Identify Critical Loops: Focus on loops with a major impact on operations (supply air temp, chilled water pressure) or those known to have issues like hunting or slow response.<br> Review Current Settings: In Niagara Workbench, inspect the PID control block parameters (Proportional Gain, Integral Time, etc.). Note the existing values.<br> Test the Loop Response: During off-peak times, introduce a setpoint change and observe the loop''s reaction using real-time charts. Note any overshoot, undershoot, or oscillation.<br> - Tune P, I, and D: Adjust the Proportional (P) gain first to get a decent response, then add Integral (I) action to eliminate steady-state error, and only use Derivative (D) if necessary to dampen overshoot in fast-acting systems [1, 2, 3].<br> Fine-tune: Make iterative adjustments, allowing the loop to settle after each change. Use trend logs for detailed analysis.<br> Validate in All Modes: Ensure the loop performs well under all operating conditions (e.g., heating vs. cooling, high vs. low load).<br> Document Changes: Record the original and newly tuned PID values along with observations for future reference.',
  30,
  '1.0'
),
(
  '7',
  'Security & User Management',
  'Security',
  'Review and maintain the security of the Niagara station and platform, including user accounts, roles, authentication, and system settings to protect against unauthorized access.',
  '[
    {
      "step_number": 1,
      "content": "User Account Audit: In the UserService, ensure each user has a unique account [1, 2]. Assign roles based on the principle of least privilege [3]. Disable or delete all dormant, default, or former employee accounts [4, 5].",
      "references": [1, 2, 3, 4, 5]
    },
    {
      "step_number": 2,
      "content": "Enforce Strong Policies: Configure and enforce strong password policies (complexity, length) [6, 7] and consider enabling password expiration [8, 9]. Ensure account lockout is active after several failed login attempts [10, 11].",
      "references": [6, 7, 8, 9, 10, 11]
    },
    {
      "step_number": 3,
      "content": "Secure Platform Account: Ensure the main platform account password is not left as the default (\"niagara/niagara\") and is changed to something complex.",
      "references": []
    },
    {
      "step_number": 4,
      "content": "Review Security Settings: Require Secure Connections: Verify that the station requires secure protocols like HTTPS and FOXS, and that unencrypted ports are disabled or redirected [12]. Manage Certificates: In the Certificate Manager, check for expiring certificates and approve any pending certificates needed for Niagara Network trust [13, 14]. Review Audit Logs: Check the AuditService log for any unusual activity.",
      "references": [12, 13, 14]
    },
    {
      "step_number": 5,
      "content": "Verify Network Security: Confirm the host firewall is configured to allow necessary Niagara ports while blocking others [15]. Ensure the system is not directly exposed to the internet.",
      "references": [15]
    },
    {
      "step_number": 6,
      "content": "Apply Updates: Keep the Niagara software and the underlying OS updated to the latest stable versions to protect against known vulnerabilities [16].",
      "references": [16]
    }
  ]'::jsonb,
  'Immediately disable accounts and change shared credentials when personnel with access leave the organization. Use multi-factor authentication (MFA) through directory services (LDAP/AD) if possible. Ensure Niagara Network connections between stations are encrypted. Limit access methods by disabling unused services like FTP or the standard Fox port if FoxS is used. Ensure JACEs and controllers are physically secured in locked panels. Annually review the official Niagara Hardening Guide and align system settings accordingly.',
  '[]'::jsonb,
  '[]'::jsonb,
  ' User Account Audit: In the UserService, ensure each user has a unique account [1, 2]. Assign roles based on the principle of least privilege [3]. Disable or delete all dormant, default, or former employee accounts [4, 5].<br> Enforce Strong Policies: Configure and enforce strong password policies (complexity, length) [6, 7] and consider enabling password expiration [8, 9]. Ensure account lockout is active after several failed login attempts [10, 11].<br> Secure Platform Account: Ensure the main platform account password is not left as the default ("niagara/niagara") and is changed to something complex.<br> Review Security Settings:<br> - Require Secure Connections: Verify that the station requires secure protocols like HTTPS and FOXS, and that unencrypted ports are disabled or redirected [12].<br> - Manage Certificates: In the Certificate Manager, check for expiring certificates and approve any pending certificates needed for Niagara Network trust [13, 14].<br> - Review Audit Logs: Check the AuditService log for any unusual activity.<br> Verify Network Security: Confirm the host firewall is configured to allow necessary Niagara ports while blocking others [15]. Ensure the system is not directly exposed to the internet.<br> Apply Updates: Keep the Niagara software and the underlying OS updated to the latest stable versions to protect against known vulnerabilities [16].',
  ' User Account Audit: In the UserService, ensure each user has a unique account [1, 2]. Assign roles based on the principle of least privilege [3]. Disable or delete all dormant, default, or former employee accounts [4, 5].<br> Enforce Strong Policies: Configure and enforce strong password policies (complexity, length) [6, 7] and consider enabling password expiration [8, 9]. Ensure account lockout is active after several failed login attempts [10, 11].<br> Secure Platform Account: Ensure the main platform account password is not left as the default ("niagara/niagara") and is changed to something complex.<br> Review Security Settings:<br> - Require Secure Connections: Verify that the station requires secure protocols like HTTPS and FOXS, and that unencrypted ports are disabled or redirected [12].<br> - Manage Certificates: In the Certificate Manager, check for expiring certificates and approve any pending certificates needed for Niagara Network trust [13, 14].<br> - Review Audit Logs: Check the AuditService log for any unusual activity.<br> Verify Network Security: Confirm the host firewall is configured to allow necessary Niagara ports while blocking others [15]. Ensure the system is not directly exposed to the internet.<br> Apply Updates: Keep the Niagara software and the underlying OS updated to the latest stable versions to protect against known vulnerabilities [16].',
  40,
  '1.0'
);