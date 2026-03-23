// User types
export type UserRole = 'admin' | 'tech';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  color: string; // hex color for color coding
  createdAt: string;
}

// Inventory types
export interface InventoryItem {
  id: string;
  name: string;
  unit: string; // 'bags', 'pieces', 'gallons', 'sqft', etc.
  mainQuantity: number;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface TechInventory {
  id: string;
  techId: string;
  itemId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

// Job types
export type JobStatus = 'assigned' | 'on_the_way' | 'in_progress' | 'pending_review' | 'complete';
export type JobType = 'tree' | 'irrigation' | 'sod' | 'other';
export type BidStatus = 'needs_bid' | 'pending_approval' | 'approved';

export interface Job {
  id: string;
  jobNumber: string; // e.g. "JOB-0042"
  clientName: string;
  address: string;
  description?: string;
  jobType: JobType;
  color: string; // hex color
  assignedTechId?: string;
  status: JobStatus;
  bidStatus?: BidStatus;
  bidAmount?: number;
  notes?: string;
  changeRequestNotes?: string; // Admin note when requesting changes
  isLocked: boolean;
  completedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  submittedForApprovalAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Photo types
export type PhotoType = 'before' | 'after' | 'during';

export interface JobPhoto {
  id: string;
  jobId: string;
  photoUrl: string; // base64 data URL for demo
  photoType: PhotoType;
  uploadedBy: string;
  createdAt: string;
}

// Job inventory usage
export interface JobInventory {
  id: string;
  jobId: string;
  itemId: string;
  quantityUsed: number;
  loggedBy: string;
  createdAt: string;
}

// Job checklist (type-specific fields)
export interface JobChecklist {
  id: string;
  jobId: string;
  // Tree job fields
  treeSize?: 'small' | 'medium' | 'large';
  treeHeightFt?: number;
  // Irrigation job fields
  valveCount?: number;
  // Sod job fields
  hasIrrigation?: boolean;
  sodType?: string;
  // Other job fields
  customNotes?: string;
  completedAt: string;
}

// App state
export interface AppData {
  users: User[];
  inventoryItems: InventoryItem[];
  techInventory: TechInventory[];
  jobs: Job[];
  jobPhotos: JobPhoto[];
  jobInventory: JobInventory[];
  jobChecklists: JobChecklist[];
  jobNumberCounter: number; // for generating JOB-XXXX numbers
}
