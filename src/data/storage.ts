import { AppData, User, InventoryItem, TechInventory, Job, JobPhoto, JobInventory, JobStatus, PhotoType, JobType, BidStatus, JobChecklist } from './types';
import { initialData } from './mockData';

const STORAGE_KEY = 'fieldflow_data_v2';

// Load data from localStorage or use initial data
export function loadData(): AppData {
  if (typeof window === 'undefined') {
    return initialData;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Validate it has the new schema fields
      if (parsed.jobChecklists !== undefined && parsed.jobNumberCounter !== undefined) {
        return parsed;
      }
    } catch {
      // fall through to reset
    }
  }

  // Initialize with seed data
  saveData(initialData);
  return initialData;
}

// Save data to localStorage
export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Reset to initial data
export function resetData(): AppData {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  saveData(initialData);
  return initialData;
}

// Helper to generate UUIDs
const uuid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

// Generate job number from counter
function generateJobNumber(counter: number): string {
  return `JOB-${String(counter).padStart(4, '0')}`;
}

// ============ USER OPERATIONS ============

export function getUsers(data: AppData): User[] {
  return data.users;
}

export function getUserById(data: AppData, id: string): User | undefined {
  return data.users.find(u => u.id === id);
}

export function getTechs(data: AppData): User[] {
  return data.users.filter(u => u.role === 'tech');
}

export function getAdmins(data: AppData): User[] {
  return data.users.filter(u => u.role === 'admin');
}

export function updateUser(data: AppData, id: string, updates: Partial<User>): AppData {
  return {
    ...data,
    users: data.users.map(u => u.id === id ? { ...u, ...updates } : u),
  };
}

// ============ INVENTORY OPERATIONS ============

export function getInventoryItems(data: AppData): InventoryItem[] {
  return data.inventoryItems;
}

export function getInventoryItemById(data: AppData, id: string): InventoryItem | undefined {
  return data.inventoryItems.find(i => i.id === id);
}

export function addInventoryItem(
  data: AppData,
  name: string,
  unit: string,
  quantity: number = 0,
  lowStockThreshold: number = 0
): AppData {
  const newItem: InventoryItem = {
    id: uuid(),
    name,
    unit,
    mainQuantity: quantity,
    lowStockThreshold,
    createdAt: now(),
    updatedAt: now(),
  };
  return {
    ...data,
    inventoryItems: [...data.inventoryItems, newItem],
  };
}

export function updateInventoryItem(data: AppData, id: string, updates: Partial<InventoryItem>): AppData {
  return {
    ...data,
    inventoryItems: data.inventoryItems.map(item =>
      item.id === id ? { ...item, ...updates, updatedAt: now() } : item
    ),
  };
}

// ============ TECH INVENTORY OPERATIONS ============

export function getTechInventory(data: AppData, techId: string): (TechInventory & { item: InventoryItem })[] {
  return data.techInventory
    .filter(ti => ti.techId === techId)
    .map(ti => ({
      ...ti,
      item: data.inventoryItems.find(i => i.id === ti.itemId)!,
    }))
    .filter(ti => ti.item);
}

export function getAllTechInventory(data: AppData): (TechInventory & { item: InventoryItem; tech: User })[] {
  return data.techInventory
    .map(ti => ({
      ...ti,
      item: data.inventoryItems.find(i => i.id === ti.itemId)!,
      tech: data.users.find(u => u.id === ti.techId)!,
    }))
    .filter(ti => ti.item && ti.tech);
}

export function assignInventoryToTech(
  data: AppData,
  techId: string,
  itemId: string,
  quantity: number
): AppData {
  const item = data.inventoryItems.find(i => i.id === itemId);
  if (!item || item.mainQuantity < quantity) {
    throw new Error('Insufficient main inventory');
  }

  const updatedItems = data.inventoryItems.map(i =>
    i.id === itemId ? { ...i, mainQuantity: i.mainQuantity - quantity, updatedAt: now() } : i
  );

  const existingTechInventory = data.techInventory.find(
    ti => ti.techId === techId && ti.itemId === itemId
  );

  let updatedTechInventory: TechInventory[];
  if (existingTechInventory) {
    updatedTechInventory = data.techInventory.map(ti =>
      ti.id === existingTechInventory.id
        ? { ...ti, quantity: ti.quantity + quantity, updatedAt: now() }
        : ti
    );
  } else {
    const newTechInventory: TechInventory = {
      id: uuid(),
      techId,
      itemId,
      quantity,
      createdAt: now(),
      updatedAt: now(),
    };
    updatedTechInventory = [...data.techInventory, newTechInventory];
  }

  return {
    ...data,
    inventoryItems: updatedItems,
    techInventory: updatedTechInventory,
  };
}

// ============ JOB OPERATIONS ============

export function getJobs(data: AppData): Job[] {
  return data.jobs;
}

export function getJobById(data: AppData, id: string): Job | undefined {
  return data.jobs.find(j => j.id === id);
}

export function getJobsByTech(data: AppData, techId: string): Job[] {
  return data.jobs.filter(j => j.assignedTechId === techId);
}

export function getJobsByStatus(data: AppData, status: JobStatus): Job[] {
  return data.jobs.filter(j => j.status === status);
}

export function createJob(
  data: AppData,
  clientName: string,
  address: string,
  createdBy: string,
  options: {
    description?: string;
    assignedTechId?: string;
    jobType?: JobType;
    color?: string;
    bidStatus?: BidStatus;
    bidAmount?: number;
  } = {}
): AppData {
  const counter = data.jobNumberCounter + 1;
  const tech = options.assignedTechId ? data.users.find(u => u.id === options.assignedTechId) : null;
  const defaultColor = tech?.color || '#6B7280';

  const newJob: Job = {
    id: uuid(),
    jobNumber: generateJobNumber(counter),
    clientName,
    address,
    description: options.description,
    jobType: options.jobType || 'other',
    color: options.color || defaultColor,
    assignedTechId: options.assignedTechId,
    status: 'assigned',
    bidStatus: options.bidStatus,
    bidAmount: options.bidAmount,
    isLocked: false,
    createdBy,
    createdAt: now(),
    updatedAt: now(),
  };

  return {
    ...data,
    jobs: [...data.jobs, newJob],
    jobNumberCounter: counter,
  };
}

export function updateJob(data: AppData, id: string, updates: Partial<Job>): AppData {
  return {
    ...data,
    jobs: data.jobs.map(job =>
      job.id === id ? { ...job, ...updates, updatedAt: now() } : job
    ),
  };
}

export function updateJobStatus(data: AppData, id: string, status: JobStatus): AppData {
  const updates: Partial<Job> = { status };

  if (status === 'pending_review') {
    updates.submittedForApprovalAt = now();
    updates.changeRequestNotes = undefined;
  }

  if (status === 'complete') {
    updates.completedAt = now();
  }

  return updateJob(data, id, updates);
}

// Get jobs pending review
export function getJobsPendingReview(data: AppData): Job[] {
  return data.jobs.filter(j => j.status === 'pending_review');
}

// Admin approves job
export function approveJob(data: AppData, jobId: string, approvedBy: string): AppData {
  const job = data.jobs.find(j => j.id === jobId);
  if (!job || job.status !== 'pending_review') {
    throw new Error('Job not found or not pending review');
  }

  return updateJob(data, jobId, {
    status: 'complete',
    completedAt: now(),
    approvedAt: now(),
    approvedBy,
    isLocked: true,
  });
}

// Admin requests changes
export function requestChanges(data: AppData, jobId: string, note: string): AppData {
  const job = data.jobs.find(j => j.id === jobId);
  if (!job || job.status !== 'pending_review') {
    throw new Error('Job not found or not pending review');
  }

  return updateJob(data, jobId, {
    status: 'in_progress',
    changeRequestNotes: note,
    submittedForApprovalAt: undefined,
  });
}

// ============ JOB PHOTO OPERATIONS ============

export function getJobPhotos(data: AppData, jobId: string): JobPhoto[] {
  return data.jobPhotos.filter(p => p.jobId === jobId);
}

export function getJobPhotosByType(data: AppData, jobId: string, type: PhotoType): JobPhoto[] {
  return data.jobPhotos.filter(p => p.jobId === jobId && p.photoType === type);
}

export function addJobPhoto(
  data: AppData,
  jobId: string,
  photoUrl: string,
  photoType: PhotoType,
  uploadedBy: string
): AppData {
  const newPhoto: JobPhoto = {
    id: uuid(),
    jobId,
    photoUrl,
    photoType,
    uploadedBy,
    createdAt: now(),
  };
  return {
    ...data,
    jobPhotos: [...data.jobPhotos, newPhoto],
  };
}

export function deleteJobPhoto(data: AppData, photoId: string): AppData {
  return {
    ...data,
    jobPhotos: data.jobPhotos.filter(p => p.id !== photoId),
  };
}

// ============ JOB INVENTORY OPERATIONS ============

export function getJobInventoryUsage(data: AppData, jobId: string): (JobInventory & { item: InventoryItem })[] {
  return data.jobInventory
    .filter(ji => ji.jobId === jobId)
    .map(ji => ({
      ...ji,
      item: data.inventoryItems.find(i => i.id === ji.itemId)!,
    }))
    .filter(ji => ji.item);
}

export function logJobInventory(
  data: AppData,
  jobId: string,
  itemId: string,
  quantityUsed: number,
  loggedBy: string
): AppData {
  const job = data.jobs.find(j => j.id === jobId);
  if (!job || !job.assignedTechId) {
    throw new Error('Job not found or not assigned');
  }

  const techInv = data.techInventory.find(
    ti => ti.techId === job.assignedTechId && ti.itemId === itemId
  );
  if (!techInv || techInv.quantity < quantityUsed) {
    throw new Error('Insufficient tech inventory');
  }

  const updatedTechInventory = data.techInventory.map(ti =>
    ti.id === techInv.id
      ? { ...ti, quantity: ti.quantity - quantityUsed, updatedAt: now() }
      : ti
  );

  const newJobInventory: JobInventory = {
    id: uuid(),
    jobId,
    itemId,
    quantityUsed,
    loggedBy,
    createdAt: now(),
  };

  return {
    ...data,
    techInventory: updatedTechInventory,
    jobInventory: [...data.jobInventory, newJobInventory],
  };
}

// ============ JOB CHECKLIST OPERATIONS ============

export function getJobChecklist(data: AppData, jobId: string): JobChecklist | undefined {
  return data.jobChecklists.find(c => c.jobId === jobId);
}

export function saveJobChecklist(
  data: AppData,
  jobId: string,
  checklistData: Omit<JobChecklist, 'id' | 'jobId' | 'completedAt'>
): AppData {
  const existing = data.jobChecklists.find(c => c.jobId === jobId);

  if (existing) {
    return {
      ...data,
      jobChecklists: data.jobChecklists.map(c =>
        c.jobId === jobId
          ? { ...c, ...checklistData, completedAt: now() }
          : c
      ),
    };
  }

  const newChecklist: JobChecklist = {
    id: uuid(),
    jobId,
    ...checklistData,
    completedAt: now(),
  };

  return {
    ...data,
    jobChecklists: [...data.jobChecklists, newChecklist],
  };
}

// ============ COMPLETION GATE VALIDATION ============

export interface CompletionValidation {
  hasMinBeforePhotos: boolean;   // minimum 2 before photos
  hasMinAfterPhotos: boolean;    // minimum 2 after photos
  hasInventoryLogged: boolean;   // at least 1 item logged
  hasChecklistCompleted: boolean; // job-type checklist filled out
  hasNotes: boolean;              // job notes field is not empty
  isValid: boolean;
  missingItems: string[];
}

export function validateJobCompletion(data: AppData, jobId: string): CompletionValidation {
  const job = data.jobs.find(j => j.id === jobId);
  const beforePhotos = getJobPhotosByType(data, jobId, 'before');
  const afterPhotos = getJobPhotosByType(data, jobId, 'after');
  const inventoryUsed = data.jobInventory.filter(ji => ji.jobId === jobId);
  const checklist = getJobChecklist(data, jobId);

  const hasMinBeforePhotos = beforePhotos.length >= 2;
  const hasMinAfterPhotos = afterPhotos.length >= 2;
  const hasInventoryLogged = inventoryUsed.length >= 1;
  const hasNotes = !!(job?.notes?.trim());

  // Check checklist completion based on job type
  let hasChecklistCompleted = false;
  if (checklist && job) {
    switch (job.jobType) {
      case 'tree':
        hasChecklistCompleted = !!(checklist.treeSize && checklist.treeHeightFt && checklist.treeHeightFt > 0);
        break;
      case 'irrigation':
        hasChecklistCompleted = !!(checklist.valveCount && checklist.valveCount >= 1);
        break;
      case 'sod':
        hasChecklistCompleted = !!(checklist.hasIrrigation !== undefined && checklist.sodType);
        break;
      case 'other':
        // NOTE: 'other' jobs require customNotes to be non-empty
        hasChecklistCompleted = !!(checklist.customNotes?.trim());
        break;
      default:
        hasChecklistCompleted = true;
    }
  }

  const missingItems: string[] = [];
  if (!hasMinBeforePhotos) missingItems.push(`Before photos (${beforePhotos.length}/2 uploaded)`);
  if (!hasMinAfterPhotos) missingItems.push(`After photos (${afterPhotos.length}/2 uploaded)`);
  if (!hasInventoryLogged) missingItems.push('At least 1 inventory item logged');
  if (!hasChecklistCompleted) missingItems.push('Job checklist completed');
  if (!hasNotes) missingItems.push('Job notes (cannot be empty)');

  return {
    hasMinBeforePhotos,
    hasMinAfterPhotos,
    hasInventoryLogged,
    hasChecklistCompleted,
    hasNotes,
    isValid: hasMinBeforePhotos && hasMinAfterPhotos && hasInventoryLogged && hasChecklistCompleted && hasNotes,
    missingItems,
  };
}
