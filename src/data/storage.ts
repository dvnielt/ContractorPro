import { AppData, User, InventoryItem, TechInventory, Job, JobPhoto, JobInventory, JobStatus, PhotoType } from './types';
import { initialData } from './mockData';

const STORAGE_KEY = 'fieldflow_data';

// Load data from localStorage or use initial data
export function loadData(): AppData {
  if (typeof window === 'undefined') {
    return initialData;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return initialData;
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

// ============ INVENTORY OPERATIONS ============

export function getInventoryItems(data: AppData): InventoryItem[] {
  return data.inventoryItems;
}

export function getInventoryItemById(data: AppData, id: string): InventoryItem | undefined {
  return data.inventoryItems.find(i => i.id === id);
}

export function addInventoryItem(data: AppData, name: string, unit: string, quantity: number = 0): AppData {
  const newItem: InventoryItem = {
    id: uuid(),
    name,
    unit,
    mainQuantity: quantity,
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
    .filter(ti => ti.item); // Filter out any with missing items
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
  // Validate main inventory has enough
  const item = data.inventoryItems.find(i => i.id === itemId);
  if (!item || item.mainQuantity < quantity) {
    throw new Error('Insufficient main inventory');
  }

  // Deduct from main inventory
  const updatedItems = data.inventoryItems.map(i =>
    i.id === itemId ? { ...i, mainQuantity: i.mainQuantity - quantity, updatedAt: now() } : i
  );

  // Check if tech already has this item
  const existingTechInventory = data.techInventory.find(
    ti => ti.techId === techId && ti.itemId === itemId
  );

  let updatedTechInventory: TechInventory[];
  if (existingTechInventory) {
    // Add to existing balance
    updatedTechInventory = data.techInventory.map(ti =>
      ti.id === existingTechInventory.id
        ? { ...ti, quantity: ti.quantity + quantity, updatedAt: now() }
        : ti
    );
  } else {
    // Create new tech inventory entry
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
  description?: string,
  assignedTechId?: string
): AppData {
  const newJob: Job = {
    id: uuid(),
    clientName,
    address,
    description,
    assignedTechId,
    status: 'assigned',
    createdBy,
    createdAt: now(),
    updatedAt: now(),
  };

  // Log simulated email
  if (assignedTechId) {
    const tech = data.users.find(u => u.id === assignedTechId);
    console.log(`[EMAIL] Job assigned to ${tech?.fullName} (${tech?.email}): ${clientName} at ${address}`);
  }

  return {
    ...data,
    jobs: [...data.jobs, newJob],
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

  if (status === 'pending_approval') {
    updates.submittedForApprovalAt = now();
    updates.denialReason = undefined; // Clear any previous denial reason

    // Log simulated email to admins
    const job = data.jobs.find(j => j.id === id);
    const tech = data.users.find(u => u.id === job?.assignedTechId);
    const admins = data.users.filter(u => u.role === 'admin');

    console.log(`[EMAIL] Job submitted for approval - notification sent to admins:`);
    admins.forEach(admin => {
      console.log(`  - ${admin.email}: Job "${job?.clientName}" submitted by ${tech?.fullName} for approval`);
    });
  }

  if (status === 'complete') {
    updates.completedAt = now();
  }

  return updateJob(data, id, updates);
}

// Get jobs pending approval
export function getJobsPendingApproval(data: AppData): Job[] {
  return data.jobs.filter(j => j.status === 'pending_approval');
}

// Admin approves job completion
export function approveJobCompletion(data: AppData, jobId: string): AppData {
  const job = data.jobs.find(j => j.id === jobId);
  if (!job || job.status !== 'pending_approval') {
    throw new Error('Job not found or not pending approval');
  }

  // Log simulated email to tech
  const tech = data.users.find(u => u.id === job.assignedTechId);
  console.log(`[EMAIL] Job approved - notification sent to tech:`);
  console.log(`  - ${tech?.email}: Job "${job.clientName}" has been approved and marked complete`);

  return updateJob(data, jobId, {
    status: 'complete',
    completedAt: now(),
  });
}

// Admin denies job completion
export function denyJobCompletion(data: AppData, jobId: string, reason: string): AppData {
  const job = data.jobs.find(j => j.id === jobId);
  if (!job || job.status !== 'pending_approval') {
    throw new Error('Job not found or not pending approval');
  }

  // Log simulated email to tech
  const tech = data.users.find(u => u.id === job.assignedTechId);
  console.log(`[EMAIL] Job denied - notification sent to tech:`);
  console.log(`  - ${tech?.email}: Job "${job.clientName}" was denied. Reason: ${reason}`);

  return updateJob(data, jobId, {
    status: 'in_progress',
    denialReason: reason,
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
  // Find tech's inventory for this item
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

  // Deduct from tech inventory
  const updatedTechInventory = data.techInventory.map(ti =>
    ti.id === techInv.id
      ? { ...ti, quantity: ti.quantity - quantityUsed, updatedAt: now() }
      : ti
  );

  // Add job inventory record
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

// ============ COMPLETION GATE VALIDATION ============

export interface CompletionValidation {
  hasBeforePhoto: boolean;
  hasAfterPhoto: boolean;
  hasInventoryLogged: boolean;
  canComplete: boolean;
  missingItems: string[];
}

export function validateJobCompletion(data: AppData, jobId: string): CompletionValidation {
  const beforePhotos = getJobPhotosByType(data, jobId, 'before');
  const afterPhotos = getJobPhotosByType(data, jobId, 'after');
  const inventoryUsed = data.jobInventory.filter(ji => ji.jobId === jobId);

  const hasBeforePhoto = beforePhotos.length >= 1;
  const hasAfterPhoto = afterPhotos.length >= 1;
  const hasInventoryLogged = inventoryUsed.length >= 1;

  const missingItems: string[] = [];
  if (!hasBeforePhoto) missingItems.push('At least 1 "before" photo');
  if (!hasAfterPhoto) missingItems.push('At least 1 "after" photo');
  if (!hasInventoryLogged) missingItems.push('At least 1 inventory item logged');

  return {
    hasBeforePhoto,
    hasAfterPhoto,
    hasInventoryLogged,
    canComplete: hasBeforePhoto && hasAfterPhoto && hasInventoryLogged,
    missingItems,
  };
}
