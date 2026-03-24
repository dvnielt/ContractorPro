export type UserRole = 'admin' | 'tech';
export type JobStatus = 'assigned' | 'on_the_way' | 'in_progress' | 'pending_review' | 'complete';
export type JobType = 'tree' | 'irrigation' | 'sod' | 'other';
export type PhotoType = 'before' | 'after' | 'during';
export type BidStatus = 'needs_bid' | 'pending_approval' | 'approved';
export type TransactionType = 'add_to_main' | 'assign_to_tech' | 'job_usage';

export interface Profile {
  id: string;
  email?: string;
  full_name: string;
  role: UserRole;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  main_quantity: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface TechInventory {
  id: string;
  tech_id: string;
  item_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  // joined
  item?: InventoryItem;
  tech?: Profile;
}

export interface Job {
  id: string;
  job_number: string;
  client_name: string;
  address: string;
  description: string | null;
  job_type: JobType;
  assigned_tech_id: string | null;
  color: string;
  status: JobStatus;
  bid_status: BidStatus | null;
  bid_amount: number | null;
  notes: string | null;
  change_request_notes: string | null;
  completed_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  is_locked: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  // joined
  assigned_tech?: Profile;
  creator?: Profile;
  approver?: Profile;
}

export interface JobChecklist {
  id: string;
  job_id: string;
  tree_size: 'small' | 'medium' | 'large' | null;
  tree_height_ft: number | null;
  valve_count: number | null;
  has_irrigation: boolean | null;
  sod_type: string | null;
  custom_notes: string | null;
  completed_at: string;
}

export interface JobPhoto {
  id: string;
  job_id: string;
  photo_url: string;
  photo_type: PhotoType;
  uploaded_by: string;
  created_at: string;
}

export interface JobInventory {
  id: string;
  job_id: string;
  item_id: string;
  quantity_used: number;
  logged_by: string;
  created_at: string;
  // joined
  item?: InventoryItem;
}

export interface JobStatusHistory {
  id: string;
  job_id: string;
  old_status: JobStatus | null;
  new_status: JobStatus;
  changed_by: string;
  changed_at: string;
  note: string | null;
}

export interface CompletionValidation {
  isValid: boolean;
  hasMinBeforePhotos: boolean;
  hasMinAfterPhotos: boolean;
  hasInventoryLogged: boolean;
  hasChecklistCompleted: boolean;
}
