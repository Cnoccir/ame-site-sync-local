import React from 'react';
import { PMReportGenerator } from '@/services/pdf';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { logger } from '@/utils/logger';

// Simple test component to verify PDF generation is working
export const PDFTestComponent: React.FC = () => {
  const handleTestPDF = async () => {
    // Create mock workflow data for testing
    const mockWorkflowData = {
      session: {
        id: 'TEST-001',
        customerId: 'CUSTOMER-001',
        customerName: 'Test Customer',
        serviceTier: 'CORE' as const,
        currentPhase: 4,
        startTime: new Date(),
        lastSaved: new Date(),
        status: 'In Progress',
        technicianName: 'Test Technician',
        technicianId: 'TECH-001'
      },
      phase1: {
        customer: {
          companyName: 'Test Company',
          siteName: 'Test Site',
          address: '123 Test St, Test City, TS 12345',
          serviceTier: 'CORE' as const,
          contractNumber: 'TEST-CONTRACT-001',
          accountManager: 'Test Manager'
        },
        contacts: [{
          id: '1',
          name: 'John Test',
          phone: '555-0123',
          email: 'john@testcompany.com',
          role: 'Facilities Manager',
          isPrimary: true
        }],
        access: {
          method: 'Front desk check-in',
          parkingInstructions: 'Visitor parking',
          badgeRequired: false,
          escortRequired: false,
          bestArrivalTime: '9:00 AM',
          specialInstructions: 'None'
        },
        safety: {
          requiredPPE: ['Safety glasses'],
          knownHazards: [],
          safetyContact: 'John Test',
          safetyPhone: '555-0123',
          specialNotes: ''
        },
        projectHandoff: {
          hasSubmittals: true,
          hasAsBuilts: true,
          hasFloorPlans: true,
          hasSOO: true,
          completenessScore: 8,
          notes: 'Documentation complete'
        }
      },
      phase2: {
        bmsSystem: {
          platform: 'Niagara 4',
          softwareVersion: '4.11',
          supervisorLocation: 'Server Room',
          supervisorIP: '192.168.1.100',
          networkMethod: 'Ethernet',
          credentialsLocation: 'Password Manager',
          notes: ''
        },
        tridiumExports: {
          processed: false
        },
        manualInventory: {
          totalDeviceCount: 25,
          majorEquipment: ['AHU-1', 'AHU-2'],
          controllerTypes: ['JACE-8000'],
          networkSegments: ['Main Network'],
          notes: ''
        },
        photos: []
      },
      phase3: {
        customerPriorities: {
          primaryConcerns: ['Temperature control', 'Energy efficiency'],
          energyGoals: ['Reduce energy costs by 10%'],
          operationalChallenges: ['Staff complaints about comfort'],
          timeline: 'End of quarter',
          budgetConstraints: 'Budget available'
        },
        tasks: [{
          id: 'C001',
          sopId: 'C001',
          name: 'Platform & Station Backup',
          phase: 'Prep',
          serviceTier: 'CORE',
          estimatedDuration: 15,
          status: 'Completed' as const,
          findings: 'Backup completed successfully',
          actions: 'Created backup file',
          issues: [],
          recommendations: [],
          photos: [],
          dataCollected: {},
          reportSection: 'system' as const,
          reportImpact: 'foundation' as const,
          actualDuration: 12
        }],
        issues: [{
          id: 'ISS-001',
          severity: 'Medium' as const,
          category: 'Performance' as const,
          title: 'AHU-1 Filter Needs Replacement',
          description: 'Filter is approaching end of life',
          location: 'Mechanical Room',
          affectedSystems: ['AHU-1'],
          impact: 'Reduced air quality',
          immediateAction: 'Scheduled filter replacement',
          photos: [],
          discoveryTime: new Date(),
          status: 'Resolved' as const
        }],
        recommendations: [{
          id: 'REC-001',
          type: 'Short Term' as const,
          priority: 'Medium' as const,
          category: 'Performance' as const,
          title: 'Optimize Temperature Setpoints',
          description: 'Adjust setpoints for improved comfort and efficiency',
          justification: 'Current setpoints causing comfort issues',
          timeline: 'Within 30 days',
          benefits: ['Improved comfort', 'Energy savings'],
          requiredActions: ['Update BMS programming'],
          relatedIssues: []
        }],
        serviceMetrics: {
          systemHealthScore: 85,
          performanceImprovement: 10,
          energyOptimization: 5,
          reliabilityEnhancement: 8,
          issuesResolved: 1,
          tasksCompleted: 1,
          timeOnSite: 120
        }
      },
      phase4: {
        serviceSummary: {
          executiveSummary: 'Completed CORE tier preventive maintenance. System is operating within normal parameters.',
          keyFindings: ['System backup completed', 'One minor issue resolved', 'Performance within specifications'],
          valueDelivered: ['System reliability maintained', 'Minor issue resolved', 'Preventive maintenance completed'],
          systemImprovements: ['Filter replacement scheduled'],
          nextSteps: ['Continue regular maintenance schedule'],
          followupRequired: false,
          followupActions: []
        },
        reportConfig: {
          template: 'Customer' as const,
          includeSections: {
            executiveSummary: true,
            systemOverview: true,
            workPerformed: true,
            issues: true,
            recommendations: true,
            appendix: false
          },
          includePhotos: false,
          includeCharts: true,
          includeDataTables: true,
          brandingLevel: 'Full' as const,
          confidentiality: 'Confidential' as const
        },
        deliveryInfo: {
          method: 'Email' as const,
          primaryRecipient: 'john@testcompany.com',
          ccRecipients: [],
          deliveryNotes: 'Test report delivery',
          signatureRequired: false
        }
      }
    };

    try {
      logger.info('Testing PDF generation...');
      
      const result = await PMReportGenerator.generateReport(mockWorkflowData, mockWorkflowData.phase4.reportConfig);
      
      if (result.success && result.blob) {
        PMReportGenerator.downloadReport(result.blob, 'TEST_PM_Report.pdf', mockWorkflowData);
        logger.info('Test PDF generated and downloaded successfully!');
      } else {
        logger.error('Test PDF generation failed:', result.error);
      }
    } catch (error) {
      logger.error('Test PDF generation error:', error);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-blue-50">
      <h3 className="font-medium mb-2">PDF Generation Test</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Click to test the new PDF generation system with mock data.
      </p>
      <Button onClick={handleTestPDF} className="gap-2">
        <Download className="h-4 w-4" />
        Test PDF Generation
      </Button>
    </div>
  );
};