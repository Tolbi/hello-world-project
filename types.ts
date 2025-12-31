
export type ModuleType = 'crop-view' | 'source' | 'analytics' | 'traceability';
export type UnionName = 'UNION SECTEUR 1&2' | 'UNION SECTEUR 5' | 'UNION SECTEUR G' | 'UNION SECTEUR 3&4' | 'UNION SECTEUR 6';

export interface Producer {
  id: string;
  name: string;
  union: UnionName;
  parcelId: string;
  location: [number, number];
  geometry?: {
    type: string;
    coordinates: any;
  };
  bbox?: number[];
  areaHectares: number;
  areaM2: number;
  yieldExpected: number;
  yieldActual: number;
  productionTonnes: number;
  density: number;
  fertilityIndex: number;
  lastUpdate: string;
  village: string;
  phone: string;
  rasters?: string[];
}

export type LayerType = 'yield' | 'density' | 'fertility';

export interface RasterFile {
  name: string;
  producerId: string;
  producerName: string;
  type: LayerType | 'unknown';
  status: 'linked' | 'orphan';
  size: number;
}

export type ViewType = 'dashboard' | 'admin' | 'sig' | 'inventory' | 'orders' | 'providers' | 'workflow' | 'lots' | 'viz' | 'simulator' | 'audit';

export interface InputStock {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  status: 'En Stock' | 'Critique' | 'Rupture';
}

export interface PurchaseOrder {
  id: string;
  provider: string;
  date: string;
  amount: number;
  status: 'Livré' | 'En cours' | 'Annulé';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface KnowledgeFile {
  name: string;
  data: string; // Base64
  mimeType: string;
}

// --- TRACEABILITY TYPES ---
export type FieldType = 'text' | 'number' | 'date' | 'producer_select' | 'qr_scan' | 'qr_bulk_scan' | 'gps' | 'photo';

export interface WorkflowField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
}

export interface WorkflowStep {
  id: string;
  name: string;
  fields: WorkflowField[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  status: 'active' | 'draft';
  steps: WorkflowStep[];
  updatedAt: string;
}

export type AssigneeType = 'producer' | 'entity';
export type QRStatus = 'free' | 'assigned';
export type AssignmentMethod = 'manual' | 'import' | 'mobile';

export interface QRCodeObj {
  id: string;
  code: string;
  batchId: string;
  status: QRStatus;
  assigneeId?: string;
  assigneeType?: AssigneeType;
  assigneeName?: string;
  assignmentMethod?: AssignmentMethod;
  assignedBy?: string;
  assignedAt?: string;
  date: string;
  history?: Array<{
    step: string;
    date: string;
    agent: string;
    details: any;
  }>;
}

export interface Entity {
  id: string;
  name: string;
  type: string;
}

export interface Batch {
  id: string;
  prefix: string;
  qty: number;
  date: string;
  status: 'Libre' | 'Assigné';
}
