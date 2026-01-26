// User types
export type UserRole = 'admin' | 'tech';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
}

// Inventory types
export interface InventoryItem {
  id: string;
  name: string;
  unit: string; // 'bags', 'pieces', 'gallons', 'sqft', etc.
  mainQuantity: number;
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
export type JobStatus = 'assigned' | 'on_the_way' | 'in_progress' | 'pending_approval' | 'complete';

export interface Job {
  id: string;
  clientName: string;
  address: string;
  description?: string;
  assignedTechId?: string;
  status: JobStatus;
  notes?: string;
  completedAt?: string;
  denialReason?: string; // Reason if admin denies completion
  submittedForApprovalAt?: string; // When tech submitted for approval
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Photo types
export type PhotoType = 'before' | 'after';

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

// App state
export interface AppData {
  users: User[];
  inventoryItems: InventoryItem[];
  techInventory: TechInventory[];
  jobs: Job[];
  jobPhotos: JobPhoto[];
  jobInventory: JobInventory[];
}
