export interface TridiumDataTypes {
  networkDevices: {
    requiredColumns: ['Name', 'Status', 'Address'];
    optionalColumns: ['Controller Type', 'Type', 'Device ID'];
    statusParser: (value: string) => ParsedStatus;
  };
  resourceMetrics: {
    requiredColumns: ['Name', 'Value'];
    valueParser: (value: string) => ParsedValue;
  };
  bacnetDevices: {
    requiredColumns: ['Name', 'Type', 'Device ID', 'Status'];
    optionalColumns: ['Health', 'Enabled', 'Vendor', 'Model', 'IP Address'];
  };
  niagaraStations: {
    requiredColumns: ['Name', 'Type', 'Address', 'Status'];
    optionalColumns: ['Platform Status', 'Version', 'Client Conn', 'Server Conn'];
  };
}

export interface ParsedStatus {
  status: 'ok' | 'down' | 'alarm' | 'fault' | 'unknown';
  severity: 'normal' | 'warning' | 'critical';
  details: string[];
  badge: {
    text: string;
    variant: 'default' | 'success' | 'warning' | 'destructive';
  };
}

export interface ParsedValue {
  value: number | string;
  unit?: string;
  formatted: string;
  type: 'percentage' | 'memory' | 'count' | 'timestamp' | 'duration' | 'text';
}

export interface CSVColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'status' | 'value' | 'date';
  visible: boolean;
  sortable: boolean;
  width?: number;
}

export interface TridiumDataRow {
  id: string;
  selected: boolean;
  data: Record<string, any>;
  parsedStatus?: ParsedStatus;
  parsedValues?: Record<string, ParsedValue>;
}

export interface TridiumDataset {
  id: string;
  filename: string;
  type: keyof TridiumDataTypes;
  columns: CSVColumn[];
  rows: TridiumDataRow[];
  summary: DatasetSummary;
  metadata: {
    totalRows: number;
    parseErrors: string[];
    uploadedAt: Date;
    fileSize: number;
  };
}

export interface DatasetSummary {
  totalDevices: number;
  statusBreakdown: {
    ok: number;
    down: number;
    alarm: number;
    fault: number;
    unknown: number;
  };
  typeBreakdown: Record<string, number>;
  criticalFindings: string[];
  recommendations: string[];
}

export interface SelectionState {
  selectedRows: Set<string>;
  selectedColumns: Set<string>;
  filters: {
    status: string[];
    type: string[];
    custom: string;
  };
  presets: {
    name: string;
    rowFilter: (row: TridiumDataRow) => boolean;
    columnFilter: (column: CSVColumn) => boolean;
  }[];
}

export interface GeneratedSummary {
  title: string;
  overview: string;
  deviceBreakdown: string;
  criticalFindings: string[];
  recommendations: string[];
  detailedData: {
    headers: string[];
    rows: string[][];
  };
}

export interface TridiumAnalysisResult {
  datasets: TridiumDataset[];
  combinedSummary: GeneratedSummary;
  selection: SelectionState;
  exportData: {
    csvData: string;
    reportSection: string;
    charts: any[];
  };
}