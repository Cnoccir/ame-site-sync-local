# NewCustomerWizard Field Fixes

## Issues Identified

After testing, all fields ARE saving correctly to the database. The issues are:
1. UI labels don't match requirements
2. Some fields may not be showing saved values when viewing
3. Technician dropdowns need to work properly
4. Need to ensure credentials are saved

## Database Test Results

Successfully created a test customer with ALL fields populated:
- ✅ System Architecture saves correctly
- ✅ Primary Contact Role saves correctly  
- ✅ Access Procedure saves correctly
- ✅ Parking Instructions saves correctly
- ✅ Safety & PPE Requirements save correctly
- ✅ Backup Contact saves correctly
- ✅ Original Team Contact saves correctly
- ✅ All technician fields save correctly
- ✅ All credential fields save correctly

## Required UI Updates

### Step 1 - Basic Information
Current fields are working correctly:
- Customer ID
- Company Name
- Site Name/Nickname
- Site Address
- Service Tier
- Primary BAS Platform
- System Type (Version)
- **System Architecture** ✅ (Saves correctly)
- Building Type
- Contract Status

### Step 2 - Site Contact & Access
Fields that need label updates:
- Primary Contact Name ✅
- **Primary Contact Role** ✅ (Saves as primary_contact_role)
- Contact Phone ✅
- Contact Email ✅
- **Access Procedure** ✅ (Saves as access_procedure)
- Access Hours ✅
- **Parking & Access Instructions** ✅ (Saves as parking_instructions)
- **Safety & PPE Requirements** ✅ (All checkboxes and fields save)
- **Backup Contact Details** ✅ (Saves as secondary_contact_*)

### Step 3 - System Access & Credentials
Fields are saving correctly but may need UI improvements:
- **Remote Access Credentials** ✅ (Saves via RemoteAccessCredentialsManager)
- **Primary System Credentials** ✅ (BMS credentials save)
- **Windows System Access** ✅ (Windows credentials save)
- **VPN Configuration** ✅ (VPN settings save)

### Step 4 - Service Information & Assignments
Fields that need updates:

#### Current Implementation:
```
- Primary Technician → Works, saves as primary_technician_*
- Secondary Technician → Works, saves as secondary_technician_*
- Legacy Assigned Technician → Should be "Original PM"
- Account Manager → Works, saves as account_manager_*
- Escalation Contact → Should be "Coordinated By" with tech selection
```

#### Required Changes:
1. **Rename "Legacy Assigned Technician" to "Original PM"**
   - Field: `technician_assigned` → Display as "Original PM"
   - This should be a text field for the original project manager's name

2. **Change "Escalation Contact" to "Coordinated By"**
   - Add technician dropdown selection
   - Keep escalation_contact and escalation_phone as separate fields

3. **Ensure Account Manager allows full tech selection**
   - Already works with the SearchableCombobox

## Code Updates Required

### Update Step 4 in NewCustomerWizard.tsx

```typescript
const renderStep4 = () => (
  <div className="space-y-6">
    {/* Technician Assignment */}
    <div>
      <h4 className="font-semibold text-foreground mb-3">Technician Assignment</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="primary_technician_id">Primary Technician</Label>
          <SearchableCombobox
            options={technicianOptions}
            value={formData.primary_technician_id}
            onValueChange={(value) => handleTechnicianSelection(value, true)}
            placeholder="Select primary technician"
            searchPlaceholder="Search technicians by name..."
            emptyText="No technicians found. Check your connection."
            loading={isLoadingDropdowns}
          />
          {/* Display technician details */}
        </div>
        <div>
          <Label htmlFor="secondary_technician_id">Secondary Technician</Label>
          <SearchableCombobox
            options={technicianOptions}
            value={formData.secondary_technician_id}
            onValueChange={(value) => handleTechnicianSelection(value, false)}
            placeholder="Select secondary technician"
            searchPlaceholder="Search technicians by name..."
            emptyText="No technicians found. Check your connection."
            loading={isLoadingDropdowns}
          />
          {/* Display technician details */}
        </div>
      </div>
    </div>
    
    {/* Project Management */}
    <div>
      <h4 className="font-semibold text-foreground mb-3">Project Management</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="original_team_contact">Original PM</Label>
          <Input
            id="original_team_contact"
            value={formData.original_team_contact || formData.technician_assigned}
            onChange={(e) => {
              updateFormData('original_team_contact', e.target.value);
              updateFormData('technician_assigned', e.target.value); // Keep legacy field in sync
            }}
            placeholder="Original project manager name"
          />
        </div>
        <div>
          <Label htmlFor="original_team_role">PM Role</Label>
          <Input
            id="original_team_role"
            value={formData.original_team_role}
            onChange={(e) => updateFormData('original_team_role', e.target.value)}
            placeholder="Project Manager"
          />
        </div>
      </div>
    </div>

    {/* Account Management */}
    <div>
      <h4 className="font-semibold text-foreground mb-3">Account Management</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="account_manager_id">Account Manager</Label>
          <SearchableCombobox
            options={technicianOptions} // Use full technician list
            value={formData.account_manager_id}
            onValueChange={handleAccountManagerSelection}
            placeholder="Select account manager"
            searchPlaceholder="Search team members..."
            emptyText="No team members found."
            loading={isLoadingDropdowns}
          />
          {/* Display account manager details */}
        </div>
        <div>
          <Label htmlFor="escalation_contact">Coordinated By</Label>
          <SearchableCombobox
            options={technicianOptions} // Use full technician list
            value={formData.escalation_contact_id} // New field for coordinator ID
            onValueChange={(value) => {
              const selectedTech = technicianOptions.find(tech => tech.id === value);
              if (selectedTech) {
                updateFormData('escalation_contact_id', value);
                updateFormData('escalation_contact', selectedTech.name);
                updateFormData('escalation_phone', selectedTech.phone || '');
              }
            }}
            placeholder="Select coordinator"
            searchPlaceholder="Search team members..."
            emptyText="No team members found."
            loading={isLoadingDropdowns}
          />
          {formData.escalation_contact && (
            <div className="mt-2 text-sm text-muted-foreground">
              <div className="font-medium">{formData.escalation_contact}</div>
              {formData.escalation_phone && (
                <div>📱 {formData.escalation_phone}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Service Information */}
    <div>
      <h4 className="font-semibold text-foreground mb-3">Service Information</h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="service_frequency">Service Frequency</Label>
          <Select value={formData.service_frequency} onValueChange={(value) => updateFormData('service_frequency', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Monthly">Monthly</SelectItem>
              <SelectItem value="Quarterly">Quarterly</SelectItem>
              <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
              <SelectItem value="Annual">Annual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Rest of service fields */}
      </div>
    </div>

    {/* Google Drive Integration */}
    {/* ... existing Google Drive section ... */}
  </div>
);
```

## Testing Checklist

After implementing these changes:

### Form Creation Test
- [ ] Fill out ALL fields in the wizard
- [ ] Verify System Architecture dropdown saves
- [ ] Verify Primary Contact Role saves
- [ ] Verify Access Procedure saves
- [ ] Verify all Safety & PPE checkboxes save
- [ ] Verify Backup Contact fields save
- [ ] Verify Original PM field saves
- [ ] Verify Account Manager dropdown works with full tech list
- [ ] Verify Coordinated By dropdown works with full tech list
- [ ] Verify Remote Access credentials save
- [ ] Verify System Access credentials save

### View/Edit Test
- [ ] Create a customer with all fields
- [ ] View the customer - all fields should display
- [ ] Edit the customer - all fields should be editable
- [ ] Save changes - verify updates persist

### Data Consistency Test
- [ ] Create customer in NewCustomerWizard
- [ ] View in Customer Management - data matches
- [ ] Edit in CustomerDetailsModal - data matches
- [ ] View in WorkflowDashboard - data matches
- [ ] Edit in Phase 1 - data updates everywhere

## Summary

The backend is working perfectly - all fields save correctly to the database. The issues are purely UI-related:

1. **Labels need updating** (Original PM, Coordinated By)
2. **Dropdowns need to use full technician list** for Account Manager and Coordinated By
3. **Field mappings are correct** but some UI components may not be displaying saved values

The database structure is solid and the RPC function `create_customer_full` handles all fields properly. Focus on updating the UI labels and ensuring the view/edit components properly display all saved data.
