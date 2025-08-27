import { NetworkTopology, NetworkNode, TridiumDataset, TridiumDataRow, ParsedStatus, TridiumExportFormat, TridiumDataCategory } from '@/types/tridium';
import { logger } from '@/utils/logger';

export class NetworkTopologyService {
  /**
   * Build hierarchical network topology from multiple datasets
   */
  static buildTopology(datasets: TridiumDataset[]): NetworkTopology {
    logger.info('Building network topology from datasets', { count: datasets.length });
    
    const nodes = new Map<string, NetworkNode>();
    const rootNodes: NetworkNode[] = [];
    let totalDevices = 0;
    const protocolBreakdown: Record<string, number> = {};
    const healthSummary = {
      healthy: 0,
      degraded: 0,
      offline: 0,
      unknown: 0
    };

    // Process each dataset to create nodes
    datasets.forEach(dataset => {
      this.processDatasetForTopology(dataset, nodes, protocolBreakdown);
      totalDevices += dataset.rows.length;
    });

    // Build hierarchical relationships
    this.buildHierarchicalRelationships(nodes, rootNodes);

    // Calculate health summary
    nodes.forEach(node => {
      this.updateHealthSummary(node.status, healthSummary);
    });

    // Find or create a root supervisor node
    const rootNode = this.findOrCreateRootNode(rootNodes, nodes);

    return {
      rootNode,
      totalDevices,
      protocolBreakdown,
      healthSummary
    };
  }

  /**
   * Process a dataset to extract network nodes
   */
  private static processDatasetForTopology(
    dataset: TridiumDataset,
    nodes: Map<string, NetworkNode>,
    protocolBreakdown: Record<string, number>
  ): void {
    const protocol = this.detectProtocolFromDataset(dataset);
    protocolBreakdown[protocol] = (protocolBreakdown[protocol] || 0) + dataset.rows.length;

    // Check if this dataset is associated with an existing node
    const associatedNodeId = this.getAssociatedNodeId(dataset.id);
    
    console.log('Processing dataset for topology', {
      filename: dataset.filename,
      format: dataset.format,
      associatedNodeId,
      hasNodeInMap: associatedNodeId ? nodes.has(associatedNodeId) : false,
      totalNodesInMap: nodes.size
    });
    
    if (associatedNodeId) {
      // This dataset is explicitly associated with a node
      if (nodes.has(associatedNodeId)) {
        // Node already exists - enhance it
        console.log('Enhancing existing node with dataset', { nodeId: associatedNodeId, filename: dataset.filename });
        this.enhanceExistingNode(nodes.get(associatedNodeId)!, dataset);
      } else {
        // Create a placeholder node for the association (will be filled by network topology dataset)
        console.log('Creating placeholder node for association', { nodeId: associatedNodeId, filename: dataset.filename });
        const placeholderNode = this.createPlaceholderNode(associatedNodeId, dataset);
        if (placeholderNode) {
          nodes.set(associatedNodeId, placeholderNode);
          this.enhanceExistingNode(placeholderNode, dataset);
        }
      }
      return;
    }

    // For platform, resource, and driver files without explicit associations, don't create new nodes
    if (this.shouldSkipNodeCreation(dataset)) {
      logger.info('Skipping node creation for unassociated dataset', { filename: dataset.filename, format: dataset.format });
      return;
    }

    // Only create nodes for network topology datasets (NiagaraNetExport)
    if (dataset.format === 'NiagaraNetExport') {
      dataset.rows.forEach(row => {
        const node = this.createNodeFromRow(row, dataset, protocol);
        if (node) {
          nodes.set(node.id, node);
        }
      });
    }
  }

  /**
   * Create a network node from a data row
   */
  private static createNodeFromRow(
    row: TridiumDataRow,
    dataset: TridiumDataset,
    protocol: string
  ): NetworkNode | null {
    const data = row.data;
    const name = data.Name || data.name || `Unknown_${row.id}`;
    const nodeId = this.generateNodeId(data, dataset.format);

    if (!name || !nodeId) {
      return null;
    }

    const nodeType = this.determineNodeType(data, dataset.format, dataset.category);
    const status = row.parsedStatus || this.createUnknownStatus();

    return {
      id: nodeId,
      name,
      type: nodeType,
      protocol,
      address: data.Address || data.address || data['IP Address'],
      status,
      children: [],
      metadata: {
        model: data.Model || data.model,
        version: data.Version || data.version,
        vendor: data.Vendor || data.vendor,
        deviceId: data['Device ID'] || data.device_id,
        controllerType: data['Controller Type'],
        platform: data.Platform || data.platform,
        sourceDataset: dataset.filename,
        sourceFormat: dataset.format,
        rawData: data
      }
    };
  }

  /**
   * Build hierarchical relationships between nodes
   */
  private static buildHierarchicalRelationships(
    nodes: Map<string, NetworkNode>,
    rootNodes: NetworkNode[]
  ): void {
    const nodeArray = Array.from(nodes.values());

    // Sort nodes by type hierarchy: supervisor -> jace -> device
    const typeHierarchy = { 'supervisor': 0, 'jace': 1, 'device': 2, 'network': 3 };
    nodeArray.sort((a, b) => (typeHierarchy[a.type] || 999) - (typeHierarchy[b.type] || 999));

    // Build parent-child relationships
    nodeArray.forEach(node => {
      const parent = this.findParentNode(node, nodes);
      if (parent) {
        parent.children.push(node);
        node.parent = parent;
      } else {
        // Top-level node
        rootNodes.push(node);
      }
    });

    // Group devices under JACEs, JACEs under Supervisors
    this.organizeHierarchy(rootNodes, nodes);

    // Group device children under protocol grouping nodes for each JACE
    this.groupDevicesByProtocol(nodes);
  }

  /**
   * Find parent node for a given node based on hierarchy rules
   */
  private static findParentNode(
    node: NetworkNode,
    nodes: Map<string, NetworkNode>
  ): NetworkNode | null {
    // For BACnet devices, find JACE controllers
    if (node.type === 'device' && node.protocol === 'BACnet') {
      // Look for JACE nodes that might control this device
      for (const [_, potentialParent] of nodes) {
        if (potentialParent.type === 'jace' && this.isRelatedByAddress(node, potentialParent)) {
          return potentialParent;
        }
      }
    }

    // For N2 devices, find controllers by address proximity
    if (node.type === 'device' && node.protocol === 'N2') {
      for (const [_, potentialParent] of nodes) {
        if (potentialParent.type === 'jace' && this.isN2AddressRelated(node, potentialParent)) {
          return potentialParent;
        }
      }
    }

    // For JACE nodes, find Supervisor
    if (node.type === 'jace') {
      for (const [_, potentialParent] of nodes) {
        if (potentialParent.type === 'supervisor') {
          return potentialParent;
        }
      }
    }

    return null;
  }

  /**
   * Organize hierarchy by grouping similar nodes
   */
  private static organizeHierarchy(
    rootNodes: NetworkNode[],
    nodes: Map<string, NetworkNode>
  ): void {
    // Create protocol-based grouping for better organization
    const protocolGroups: Record<string, NetworkNode[]> = {};

    rootNodes.forEach(node => {
      if (!protocolGroups[node.protocol || 'Unknown']) {
        protocolGroups[node.protocol || 'Unknown'] = [];
      }
      protocolGroups[node.protocol || 'Unknown'].push(node);
    });

    // Sort children within each node by type and name
    const sortChildren = (node: NetworkNode) => {
      node.children.sort((a, b) => {
        const typeOrder = { 'supervisor': 0, 'jace': 1, 'device': 2, 'network': 3 };
        const aOrder = typeOrder[a.type] || 999;
        const bOrder = typeOrder[b.type] || 999;
        
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.name.localeCompare(b.name);
      });

      node.children.forEach(sortChildren);
    };

    rootNodes.forEach(sortChildren);
  }

  /**
   * Create protocol grouping nodes under each JACE (e.g., BACnet, N2)
   */
  private static groupDevicesByProtocol(nodes: Map<string, NetworkNode>): void {
    nodes.forEach(node => {
      if (node.type !== 'jace') return;

      const deviceChildren = node.children.filter(c => c.type === 'device');
      if (deviceChildren.length === 0) return;

      // Group by protocol
      const groups: Record<string, NetworkNode[]> = {};
      deviceChildren.forEach(child => {
        const proto = (child.protocol || 'Unknown');
        if (!groups[proto]) groups[proto] = [];
        groups[proto].push(child);
      });

      // Remove original device children
      node.children = node.children.filter(c => c.type !== 'device');

      // Create grouping nodes per protocol
      Object.entries(groups).forEach(([proto, children]) => {
        // Compute alarm/degraded counts
        const alarms = children.reduce((acc, c) => {
          const s = c.status?.status;
          return acc + ((s === 'alarm' || s === 'down' || s === 'fault') ? 1 : 0);
        }, 0);

        const groupNode: NetworkNode = {
          id: `group_${node.id}_${proto}`,
          name: `${proto} Devices`,
          type: 'network',
          protocol: proto,
          status: this.calculateAggregateStatus(children),
          children: children,
          parent: node,
          metadata: {
            grouping: true,
            protocol: proto,
            count: children.length,
            alarms
          }
        };
        // Attach parent to grouped children
        children.forEach(c => { c.parent = groupNode; });
        node.children.push(groupNode);
      });
    });
  }

  /**
   * Find or create a root node for the topology
   */
  private static findOrCreateRootNode(
    rootNodes: NetworkNode[],
    nodes: Map<string, NetworkNode>
  ): NetworkNode {
    // Look for existing supervisor node
    const supervisor = rootNodes.find(node => node.type === 'supervisor');
    if (supervisor) {
      return supervisor;
    }

    // Create virtual root node if no supervisor found
    const virtualRoot: NetworkNode = {
      id: 'virtual-root',
      name: 'Building Automation System',
      type: 'supervisor',
      status: this.calculateAggregateStatus(rootNodes),
      children: rootNodes,
      metadata: {
        virtual: true,
        nodeCount: nodes.size
      }
    };

    // Set parent references
    rootNodes.forEach(node => {
      node.parent = virtualRoot;
    });

    return virtualRoot;
  }

  /**
   * Generate unique node ID
   */
  private static generateNodeId(data: Record<string, any>, datasetType: string): string {
    // Use different ID strategies based on data type
    if (data['Device ID'] && data.Address) {
      return `${datasetType}_${data['Device ID']}_${data.Address}`;
    }
    if (data.Name && data.Address) {
      return `${datasetType}_${data.Name}_${data.Address}`.replace(/[^a-zA-Z0-9_]/g, '_');
    }
    if (data.Path) {
      return `${datasetType}_${data.Path}`.replace(/[^a-zA-Z0-9_]/g, '_');
    }
    return `${datasetType}_${data.Name || 'unknown'}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Determine node type from data
   */
  private static determineNodeType(
    data: Record<string, any>, 
    datasetFormat: TridiumExportFormat,
    datasetCategory: TridiumDataCategory
  ): 'supervisor' | 'jace' | 'device' | 'network' {
    // Check explicit type information
    const typeField = (data.Type || data.type || '').toLowerCase();
    const name = (data.Name || data.name || '').toLowerCase();

    // Niagara stations
    if (datasetFormat === 'NiagaraNetExport' || typeField.includes('niagara station')) {
      if (name.includes('supervisor') || typeField.includes('supervisor')) {
        return 'supervisor';
      }
      return 'jace'; // Most Niagara stations are JACEs
    }

    // Platform details usually represent the local system
    if (datasetFormat === 'PlatformDetails' || datasetCategory === 'platformInfo') {
      const model = (data.Model || '').toLowerCase();
      if (model.includes('workstation') || model.includes('supervisor')) {
        return 'supervisor';
      }
      return 'jace';
    }

    // BACnet and N2 devices
    if (datasetFormat === 'BACnetExport' || datasetFormat === 'N2Export') {
      const controllerType = (data['Controller Type'] || '').toLowerCase();
      
      if (controllerType.includes('supervisor') || name.includes('supervisor')) {
        return 'supervisor';
      }
      if (controllerType.includes('jace') || name.includes('jace')) {
        return 'jace';
      }
      return 'device';
    }

    return 'device'; // Default fallback
  }

  /**
   * Detect protocol from dataset
   */
  private static detectProtocolFromDataset(dataset: TridiumDataset): string {
    const format = dataset.format;
    const filename = dataset.filename.toLowerCase();

    if (format === 'BACnetExport' || filename.includes('bacnet')) return 'BACnet';
    if (format === 'NiagaraNetExport' || filename.includes('niagara')) return 'Niagara';
    if (format === 'N2Export' || filename.includes('n2')) return 'N2';
    if (format === 'ResourceExport' || filename.includes('resource')) return 'System';

    return 'Unknown';
  }

  /**
   * Check if two nodes are related by address
   */
  private static isRelatedByAddress(node1: NetworkNode, node2: NetworkNode): boolean {
    const addr1 = node1.address;
    const addr2 = node2.address;

    if (!addr1 || !addr2) return false;

    // IP address subnet matching
    const ip1 = this.extractIP(addr1);
    const ip2 = this.extractIP(addr2);

    if (ip1 && ip2) {
      const subnet1 = ip1.split('.').slice(0, 3).join('.');
      const subnet2 = ip2.split('.').slice(0, 3).join('.');
      return subnet1 === subnet2;
    }

    return false;
  }

  /**
   * Check if N2 addresses are related (same bus)
   */
  private static isN2AddressRelated(device: NetworkNode, controller: NetworkNode): boolean {
    // N2 devices on the same bus would have related addresses
    const deviceAddr = parseInt(device.address || '0');
    const controllerAddr = parseInt(controller.address || '0');

    // Simple heuristic: if controller address is lower and within reasonable range
    return controllerAddr < deviceAddr && (deviceAddr - controllerAddr) < 100;
  }

  /**
   * Extract IP address from address string
   */
  private static extractIP(address: string): string | null {
    const ipMatch = address.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
    return ipMatch ? ipMatch[0] : null;
  }

  /**
   * Create unknown status for nodes without status info
   */
  private static createUnknownStatus(): ParsedStatus {
    return {
      status: 'unknown',
      severity: 'normal',
      details: ['No status information available'],
      badge: { text: 'UNKNOWN', variant: 'default' }
    };
  }

  /**
   * Update health summary based on node status
   */
  private static updateHealthSummary(
    status: ParsedStatus,
    healthSummary: NetworkTopology['healthSummary']
  ): void {
    switch (status.status) {
      case 'ok':
        healthSummary.healthy++;
        break;
      case 'alarm':
        healthSummary.degraded++;
        break;
      case 'down':
      case 'fault':
        healthSummary.offline++;
        break;
      default:
        healthSummary.unknown++;
        break;
    }
  }

  /**
   * Calculate aggregate status from child nodes
   */
  private static calculateAggregateStatus(nodes: NetworkNode[]): ParsedStatus {
    if (nodes.length === 0) {
      return this.createUnknownStatus();
    }

    const statusCounts = { ok: 0, down: 0, alarm: 0, fault: 0, unknown: 0 };
    nodes.forEach(node => {
      statusCounts[node.status.status]++;
    });

    // Determine overall status
    if (statusCounts.down > 0 || statusCounts.fault > 0) {
      return {
        status: 'fault',
        severity: 'critical',
        details: [`${statusCounts.down + statusCounts.fault} nodes offline or faulted`],
        badge: { text: 'DEGRADED', variant: 'destructive' }
      };
    }

    if (statusCounts.alarm > 0) {
      return {
        status: 'alarm',
        severity: 'warning',
        details: [`${statusCounts.alarm} nodes with alarms`],
        badge: { text: 'ALARMS', variant: 'warning' }
      };
    }

    if (statusCounts.ok > 0) {
      return {
        status: 'ok',
        severity: 'normal',
        details: [`${statusCounts.ok} nodes operational`],
        badge: { text: 'HEALTHY', variant: 'success' }
      };
    }

    return this.createUnknownStatus();
  }

  /**
   * Get node path from root to specified node
   */
  static getNodePath(node: NetworkNode): NetworkNode[] {
    const path: NetworkNode[] = [];
    let current: NetworkNode | undefined = node;

    while (current) {
      path.unshift(current);
      current = current.parent;
    }

    return path;
  }

  /**
   * Find node by ID in topology
   */
  static findNodeById(topology: NetworkTopology, nodeId: string): NetworkNode | null {
    const search = (node: NetworkNode): NetworkNode | null => {
      if (node.id === nodeId) return node;

      for (const child of node.children) {
        const found = search(child);
        if (found) return found;
      }

      return null;
    };

    return search(topology.rootNode);
  }

  /**
   * Get all nodes of a specific type
   */
  static getNodesByType(
    topology: NetworkTopology, 
    type: 'supervisor' | 'jace' | 'device' | 'network'
  ): NetworkNode[] {
    const nodes: NetworkNode[] = [];

    const collect = (node: NetworkNode) => {
      if (node.type === type) {
        nodes.push(node);
      }
      node.children.forEach(collect);
    };

    collect(topology.rootNode);
    return nodes;
  }

  /**
   * Get topology statistics
   */
  static getTopologyStats(topology: NetworkTopology): {
    totalNodes: number;
    nodesByType: Record<string, number>;
    nodesByProtocol: Record<string, number>;
    maxDepth: number;
    healthSummary: NetworkTopology['healthSummary'];
  } {
    const nodesByType: Record<string, number> = {};
    const nodesByProtocol: Record<string, number> = {};
    let totalNodes = 0;
    let maxDepth = 0;

    const traverse = (node: NetworkNode, depth: number) => {
      totalNodes++;
      maxDepth = Math.max(maxDepth, depth);

      // Count by type
      nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;

      // Count by protocol
      const protocol = node.protocol || 'Unknown';
      nodesByProtocol[protocol] = (nodesByProtocol[protocol] || 0) + 1;

      // Traverse children
      node.children.forEach(child => traverse(child, depth + 1));
    };

    traverse(topology.rootNode, 0);

    return {
      totalNodes,
      nodesByType,
      nodesByProtocol,
      maxDepth,
      healthSummary: topology.healthSummary
    };
  }

  /**
   * Check if dataset has associated node ID
   */
  private static getAssociatedNodeId(datasetId: string): string | undefined {
    try {
      // Dynamically import to avoid circular dependencies
      const { TridiumAssociationService } = require('@/services/tridiumAssociationService');
      return TridiumAssociationService.getNodeIdForDataset(datasetId);
    } catch {
      return undefined;
    }
  }

  /**
   * Enhance existing node with additional dataset information
   */
  private static enhanceExistingNode(node: NetworkNode, dataset: TridiumDataset): void {
    logger.info('Enhancing existing node with dataset', { nodeId: node.id, filename: dataset.filename, format: dataset.format });
    
    // Add dataset information to node metadata
    if (!node.metadata.associatedDatasets) {
      node.metadata.associatedDatasets = [];
    }
    
    // Check if this dataset is already in the list to avoid duplicates
    const existingIndex = node.metadata.associatedDatasets.findIndex(ds => ds.id === dataset.id);
    const datasetInfo = {
      id: dataset.id,
      filename: dataset.filename,
      format: dataset.format,
      category: dataset.category,
      rowCount: dataset.rows.length
    };
    
    if (existingIndex >= 0) {
      // Update existing entry
      node.metadata.associatedDatasets[existingIndex] = datasetInfo;
    } else {
      // Add new entry
      node.metadata.associatedDatasets.push(datasetInfo);
    }

    // Update node with platform/resource specific information
    if (dataset.format === 'PlatformDetails' && dataset.rows.length > 0) {
      const platformData = dataset.rows[0].data;
      node.metadata.version = platformData.Version || node.metadata.version;
      node.metadata.model = platformData.Model || node.metadata.model;
      node.metadata.platform = platformData.Platform || node.metadata.platform;
      
      // Update node name and type if it was a placeholder
      if (node.metadata.placeholder) {
        node.name = platformData['Station Name'] || platformData.Name || node.name;
        // Remove placeholder flag
        delete node.metadata.placeholder;
      }
    }

    if (dataset.format === 'ResourceExport' && dataset.rows.length > 0) {
      const resourceData = this.parseResourceData(dataset.rows);
      node.metadata.resources = resourceData;
    }
    
    // Handle driver files (N2Export, BACnetExport)
    if ((dataset.format === 'N2Export' || dataset.format === 'BACnetExport') && dataset.rows.length > 0) {
      // Count devices by status for this driver dataset
      const deviceStats = {
        total: dataset.rows.length,
        online: 0,
        offline: 0,
        alarm: 0
      };
      
      dataset.rows.forEach(row => {
        const status = row.parsedStatus?.status || 'unknown';
        if (status === 'ok') deviceStats.online++;
        else if (status === 'down' || status === 'fault') deviceStats.offline++;
        else if (status === 'alarm') deviceStats.alarm++;
      });
      
      // Add driver information to node metadata
      if (!node.metadata.driverInfo) {
        node.metadata.driverInfo = {};
      }
      
      node.metadata.driverInfo[dataset.format] = {
        filename: dataset.filename,
        deviceCount: dataset.rows.length,
        deviceStats
      };
      
      // Update node protocol if it was unknown
      if (node.protocol === 'Unknown' || !node.protocol) {
        node.protocol = dataset.format === 'BACnetExport' ? 'BACnet' : 'N2';
      }
    }
  }

  /**
   * Create placeholder node for association before the actual topology dataset is processed
   */
  private static createPlaceholderNode(nodeId: string, dataset: TridiumDataset): NetworkNode | null {
    // Extract node information from association ID or dataset filename
    const parts = nodeId.split('_');
    let nodeName = 'Unknown Node';
    let nodeType: 'supervisor' | 'jace' | 'device' | 'network' = 'device';
    
    // Try to extract meaningful name and type from nodeId or dataset filename
    if (parts.length >= 2) {
      nodeName = parts.slice(1).join('_').replace(/_/g, ' ');
    }
    
    // Guess node type based on filename patterns
    const filename = dataset.filename.toLowerCase();
    if (filename.includes('supervisor')) {
      nodeType = 'supervisor';
      nodeName = nodeName.includes('supervisor') ? nodeName : `${nodeName} Supervisor`;
    } else if (filename.includes('jace')) {
      nodeType = 'jace';
      nodeName = nodeName.includes('jace') ? nodeName : `${nodeName} JACE`;
    }
    
    logger.info('Creating placeholder node', { nodeId, nodeName, nodeType, filename: dataset.filename });
    
    return {
      id: nodeId,
      name: nodeName,
      type: nodeType,
      protocol: 'Unknown',
      status: this.createUnknownStatus(),
      children: [],
      metadata: {
        placeholder: true,
        sourceDataset: dataset.filename,
        sourceFormat: dataset.format
      }
    };
  }

  /**
   * Determine if we should skip creating nodes for this dataset
   */
  private static shouldSkipNodeCreation(dataset: TridiumDataset): boolean {
    // Skip creating nodes for platform, resource, and driver files that should be associated with existing nodes
    if (dataset.format === 'PlatformDetails' || 
        dataset.format === 'ResourceExport' ||
        dataset.format === 'N2Export' ||
        dataset.format === 'BACnetExport') {
      return true; // These should enhance existing nodes, not create new ones
    }
    
    return false;
  }

  /**
   * Parse resource export data for node enhancement
   */
  private static parseResourceData(rows: TridiumDataRow[]): Record<string, any> {
    const resourceData: Record<string, any> = {};
    
    rows.forEach(row => {
      const name = row.data.Name || row.data.name;
      const value = row.data.Value || row.data.value;
      
      if (name && value !== undefined) {
        resourceData[name] = value;
      }
    });

    return {
      cpuUsage: this.parseResourceValue(resourceData['cpu.usage']),
      memoryUsed: this.parseResourceValue(resourceData['mem.used']),
      memoryTotal: this.parseResourceValue(resourceData['mem.total']),
      heapUsed: this.parseResourceValue(resourceData['heap.used']),
      heapMax: this.parseResourceValue(resourceData['heap.max']),
      uptime: resourceData['time.uptime'],
      deviceCount: this.parseResourceValue(resourceData['globalCapacity.devices']),
      pointCount: this.parseResourceValue(resourceData['globalCapacity.points']),
      historyCount: this.parseResourceValue(resourceData['globalCapacity.histories']),
      rawData: resourceData
    };
  }

  /**
   * Parse resource value (handle percentages, memory units, etc.)
   */
  private static parseResourceValue(value: string): any {
    if (!value) return undefined;
    
    const str = value.toString();
    
    // Handle percentages
    if (str.includes('%')) {
      const match = str.match(/([\d.]+)%/);
      return match ? parseFloat(match[1]) : str;
    }
    
    // Handle memory units (MB)
    if (str.includes('MB')) {
      const match = str.match(/([\d.,]+)\s*MB/);
      return match ? parseFloat(match[1].replace(/,/g, '')) : str;
    }
    
    // Handle capacity values with limits
    if (str.includes('Limit:')) {
      const match = str.match(/([\d,]+).*Limit:\s*([\d,]+)/);
      if (match) {
        return {
          current: parseInt(match[1].replace(/,/g, '')),
          limit: parseInt(match[2].replace(/,/g, ''))
        };
      }
    }
    
    // Try to parse as number
    const num = parseFloat(str.replace(/,/g, ''));
    if (!isNaN(num)) return num;
    
    return str;
  }
}
