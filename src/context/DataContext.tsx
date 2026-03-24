'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  AppData, User, InventoryItem, TechInventory, Job, JobPhoto,
  JobInventory, JobStatus, PhotoType, JobType, BidStatus, JobChecklist,
} from '@/data/types';
import type { CompletionValidation } from '@/data/storage';
import type {
  Profile as DbProfile,
  InventoryItem as DbInventoryItem,
  TechInventory as DbTechInventory,
  Job as DbJob,
  JobPhoto as DbJobPhoto,
  JobInventory as DbJobInventory,
  JobChecklist as DbJobChecklist,
} from '@/types/database';

// ─── Mappers: Supabase snake_case → camelCase ─────────────────────────────────

function mapUser(p: DbProfile): User {
  return {
    id: p.id,
    email: p.email,
    fullName: p.full_name,
    role: p.role,
    color: p.color ?? '#6B7280',
    createdAt: p.created_at,
  };
}

function mapInventoryItem(i: DbInventoryItem): InventoryItem {
  return {
    id: i.id,
    name: i.name,
    unit: i.unit,
    mainQuantity: i.main_quantity,
    lowStockThreshold: i.low_stock_threshold ?? 0,
    createdAt: i.created_at,
    updatedAt: i.updated_at ?? i.created_at,
  };
}

function mapTechInventory(ti: DbTechInventory): TechInventory {
  return {
    id: ti.id,
    techId: ti.tech_id,
    itemId: ti.item_id,
    quantity: ti.quantity,
    createdAt: ti.created_at,
    updatedAt: ti.updated_at ?? ti.created_at,
  };
}

function mapJob(j: DbJob): Job {
  return {
    id: j.id,
    jobNumber: j.job_number ?? '',
    clientName: j.client_name,
    address: j.address,
    description: j.description ?? undefined,
    jobType: j.job_type as JobType,
    assignedTechId: j.assigned_tech_id ?? undefined,
    color: j.color ?? '#6B7280',
    status: j.status as JobStatus,
    bidStatus: j.bid_status ?? undefined,
    bidAmount: j.bid_amount ?? undefined,
    notes: j.notes ?? undefined,
    changeRequestNotes: j.change_request_notes ?? undefined,
    completedAt: j.completed_at ?? undefined,
    approvedAt: j.approved_at ?? undefined,
    approvedBy: j.approved_by ?? undefined,
    isLocked: j.is_locked ?? false,
    createdBy: j.created_by,
    createdAt: j.created_at,
    updatedAt: j.updated_at ?? j.created_at,
  };
}

function mapJobPhoto(p: DbJobPhoto): JobPhoto {
  return {
    id: p.id,
    jobId: p.job_id,
    photoUrl: p.photo_url,
    photoType: p.photo_type as PhotoType,
    uploadedBy: p.uploaded_by,
    createdAt: p.created_at,
  };
}

function mapJobInventory(ji: DbJobInventory): JobInventory {
  return {
    id: ji.id,
    jobId: ji.job_id,
    itemId: ji.item_id,
    quantityUsed: ji.quantity_used,
    loggedBy: ji.logged_by,
    createdAt: ji.created_at,
  };
}

function mapChecklist(c: DbJobChecklist): JobChecklist {
  return {
    id: c.id,
    jobId: c.job_id,
    treeSize: c.tree_size ?? undefined,
    treeHeightFt: c.tree_height_ft ?? undefined,
    valveCount: c.valve_count ?? undefined,
    hasIrrigation: c.has_irrigation !== null ? c.has_irrigation : undefined,
    sodType: c.sod_type ?? undefined,
    customNotes: c.custom_notes ?? undefined,
    completedAt: c.completed_at ?? new Date().toISOString(),
  };
}

const emptyData: AppData = {
  users: [], inventoryItems: [], techInventory: [],
  jobs: [], jobPhotos: [], jobInventory: [], jobChecklists: [],
  jobNumberCounter: 0,
};

// ─── Completion Validation (runs against local state) ─────────────────────────

function validateCompletion(data: AppData, jobId: string): CompletionValidation {
  const job = data.jobs.find(j => j.id === jobId);
  if (!job) return { isValid: false, hasMinBeforePhotos: false, hasMinAfterPhotos: false, hasInventoryLogged: false, hasChecklistCompleted: false, hasNotes: false, missingItems: ['Job not found'] };

  const photos = data.jobPhotos.filter(p => p.jobId === jobId);
  const beforeCount = photos.filter(p => p.photoType === 'before').length;
  const afterCount = photos.filter(p => p.photoType === 'after').length;
  const hasInventory = data.jobInventory.some(ji => ji.jobId === jobId);
  const hasNotes = !!(job.notes?.trim());
  const checklist = data.jobChecklists.find(c => c.jobId === jobId);

  let checklistOk = false;
  if (job.jobType === 'tree') {
    checklistOk = !!(checklist?.treeSize && checklist?.treeHeightFt && checklist.treeHeightFt > 0);
  } else if (job.jobType === 'irrigation') {
    checklistOk = !!(checklist?.valveCount);
  } else if (job.jobType === 'sod') {
    checklistOk = checklist?.hasIrrigation !== undefined && !!(checklist?.sodType);
  } else {
    // 'other' jobs require customNotes to be non-empty
    checklistOk = !!(checklist?.customNotes?.trim());
  }

  const hasMinBefore = beforeCount >= 2;
  const hasMinAfter = afterCount >= 2;
  const missingItems: string[] = [];
  if (!hasMinBefore) missingItems.push(`Before photos (${photos.filter(p => p.photoType === 'before').length}/2)`);
  if (!hasMinAfter) missingItems.push(`After photos (${photos.filter(p => p.photoType === 'after').length}/2)`);
  if (!hasInventory) missingItems.push('At least 1 inventory item logged');
  if (!checklistOk) missingItems.push('Job checklist completed');
  if (!hasNotes) missingItems.push('Job notes (cannot be empty)');

  return {
    isValid: hasMinBefore && hasMinAfter && hasInventory && checklistOk && hasNotes,
    hasMinBeforePhotos: hasMinBefore,
    hasMinAfterPhotos: hasMinAfter,
    hasInventoryLogged: hasInventory,
    hasChecklistCompleted: checklistOk,
    hasNotes,
    missingItems,
  };
}

// ─── Context interface ─────────────────────────────────────────────────────────

interface DataContextType {
  data: AppData;
  isLoading: boolean;
  getUsers: () => User[];
  getUserById: (id: string) => User | undefined;
  getTechs: () => User[];
  getAdmins: () => User[];
  updateUser: (id: string, updates: Partial<User>) => void;
  getInventoryItems: () => InventoryItem[];
  getInventoryItemById: (id: string) => InventoryItem | undefined;
  addInventoryItem: (name: string, unit: string, quantity?: number, lowStockThreshold?: number) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  getTechInventory: (techId: string) => (TechInventory & { item: InventoryItem })[];
  getAllTechInventory: () => (TechInventory & { item: InventoryItem; tech: User })[];
  assignInventoryToTech: (techId: string, itemId: string, quantity: number) => void;
  getJobs: () => Job[];
  getJobById: (id: string) => Job | undefined;
  getJobsByTech: (techId: string) => Job[];
  getJobsByStatus: (status: JobStatus) => Job[];
  getJobsPendingReview: () => Job[];
  createJob: (
    clientName: string, address: string, createdBy: string,
    options?: { description?: string; assignedTechId?: string; jobType?: JobType; color?: string; bidStatus?: BidStatus; bidAmount?: number }
  ) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  updateJobStatus: (id: string, status: JobStatus) => void;
  approveJob: (jobId: string, approvedBy: string) => void;
  requestChanges: (jobId: string, note: string) => void;
  getJobPhotos: (jobId: string) => JobPhoto[];
  getJobPhotosByType: (jobId: string, type: PhotoType) => JobPhoto[];
  addJobPhoto: (jobId: string, photoUrl: string, photoType: PhotoType, uploadedBy: string) => void;
  deleteJobPhoto: (photoId: string) => void;
  getJobInventoryUsage: (jobId: string) => (JobInventory & { item: InventoryItem })[];
  logJobInventory: (jobId: string, itemId: string, quantityUsed: number, loggedBy: string) => void;
  getJobChecklist: (jobId: string) => JobChecklist | undefined;
  saveJobChecklist: (jobId: string, checklistData: Omit<JobChecklist, 'id' | 'jobId' | 'completedAt'>) => void;
  validateJobCompletion: (jobId: string) => CompletionValidation;
  resetData: () => void;
  refresh: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const loadAll = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    const [
      { data: users },
      { data: items },
      { data: techInv },
      { data: jobs },
      { data: photos },
      { data: jobInv },
      { data: checklists },
    ] = await Promise.all([
      supabase.from('profiles').select('id, full_name, role, color, created_at, updated_at'),
      supabase.from('inventory_items').select('id, name, unit, main_quantity, low_stock_threshold, created_at, updated_at'),
      supabase.from('tech_inventory').select('id, tech_id, item_id, quantity, created_at, updated_at'),
      supabase.from('jobs').select('id, job_number, client_name, address, description, job_type, assigned_tech_id, color, status, bid_status, bid_amount, notes, change_request_notes, completed_at, approved_at, approved_by, is_locked, created_by, created_at, updated_at').order('created_at', { ascending: false }),
      supabase.from('job_photos').select('id, job_id, photo_url, photo_type, uploaded_by, created_at'),
      supabase.from('job_inventory').select('id, job_id, item_id, quantity_used, logged_by, created_at'),
      supabase.from('job_checklists').select('id, job_id, tree_size, tree_height_ft, valve_count, has_irrigation, sod_type, custom_notes, completed_at'),
    ]);

    // Resolve storage paths to signed URLs (batch call)
    const storagePaths = (photos ?? [])
      .map(p => p.photo_url)
      .filter(url => !url.startsWith('http') && !url.startsWith('data:'));

    const urlMap = new Map<string, string>();
    if (storagePaths.length > 0) {
      const { data: signedUrls } = await supabase.storage
        .from('job-photos')
        .createSignedUrls(storagePaths, 3600);
      signedUrls?.forEach(s => { if (s.signedUrl && s.path) urlMap.set(s.path, s.signedUrl); });
    }

    const resolvePhotoUrl = (url: string): string =>
      url.startsWith('http') || url.startsWith('data:') ? url : (urlMap.get(url) ?? url);

    setData({
      users: (users ?? []).map(mapUser),
      inventoryItems: (items ?? []).map(mapInventoryItem),
      techInventory: (techInv ?? []).map(mapTechInventory),
      jobs: (jobs ?? []).map(mapJob),
      jobPhotos: (photos ?? []).map(p => mapJobPhoto({ ...p, photo_url: resolvePhotoUrl(p.photo_url) })),
      jobInventory: (jobInv ?? []).map(mapJobInventory),
      jobChecklists: (checklists ?? []).map(mapChecklist),
      jobNumberCounter: 0,
    });
    setIsLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadAll(); }, [loadAll]);

  // ─── Real-time subscriptions ──────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('fieldflow-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => loadAll(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_photos' }, () => loadAll(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_inventory' }, () => loadAll(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_checklists' }, () => loadAll(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tech_inventory' }, () => loadAll(true))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase, loadAll]);

  // ─── User operations ───────────────────────────────────────────────────────

  const getUsers = useCallback(() => data.users, [data.users]);
  const getUserById = useCallback((id: string) => data.users.find(u => u.id === id), [data.users]);
  const getTechs = useCallback(() => data.users.filter(u => u.role === 'tech'), [data.users]);
  const getAdmins = useCallback(() => data.users.filter(u => u.role === 'admin'), [data.users]);

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.role !== undefined) dbUpdates.role = updates.role;

    // Optimistic update
    setData(prev => ({ ...prev, users: prev.users.map(u => u.id === id ? { ...u, ...updates } : u) }));
    supabase.from('profiles').update(dbUpdates).eq('id', id).then(({ error }) => {
      if (error) console.error('updateUser:', error);
    });
  }, [supabase]);

  // ─── Inventory operations ──────────────────────────────────────────────────

  const getInventoryItems = useCallback(() => data.inventoryItems, [data.inventoryItems]);
  const getInventoryItemById = useCallback((id: string) => data.inventoryItems.find(i => i.id === id), [data.inventoryItems]);

  const addInventoryItem = useCallback((name: string, unit: string, quantity = 0, lowStockThreshold = 0) => {
    supabase.from('inventory_items').insert({
      name, unit, main_quantity: quantity, low_stock_threshold: lowStockThreshold,
    }).select().single().then(({ data: row, error }) => {
      if (!error && row) setData(prev => ({ ...prev, inventoryItems: [...prev.inventoryItems, mapInventoryItem(row)] }));
    });
  }, [supabase]);

  const updateInventoryItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
    if (updates.mainQuantity !== undefined) dbUpdates.main_quantity = updates.mainQuantity;
    if (updates.lowStockThreshold !== undefined) dbUpdates.low_stock_threshold = updates.lowStockThreshold;

    setData(prev => ({ ...prev, inventoryItems: prev.inventoryItems.map(i => i.id === id ? { ...i, ...updates } : i) }));
    supabase.from('inventory_items').update(dbUpdates).eq('id', id).then(({ error }) => {
      if (error) console.error('updateInventoryItem:', error);
    });
  }, [supabase]);

  // ─── Tech inventory operations ─────────────────────────────────────────────

  const getTechInventory = useCallback((techId: string) =>
    data.techInventory
      .filter(ti => ti.techId === techId)
      .map(ti => ({ ...ti, item: data.inventoryItems.find(i => i.id === ti.itemId)! }))
      .filter(ti => ti.item),
    [data.techInventory, data.inventoryItems]);

  const getAllTechInventory = useCallback(() =>
    data.techInventory.map(ti => ({
      ...ti,
      item: data.inventoryItems.find(i => i.id === ti.itemId)!,
      tech: data.users.find(u => u.id === ti.techId)!,
    })).filter(ti => ti.item && ti.tech),
    [data.techInventory, data.inventoryItems, data.users]);

  const assignInventoryToTech = useCallback((techId: string, itemId: string, quantity: number) => {
    const existing = data.techInventory.find(ti => ti.techId === techId && ti.itemId === itemId);
    const mainItem = data.inventoryItems.find(i => i.id === itemId);
    if (!mainItem) return;

    const newMainQty = mainItem.mainQuantity - quantity;

    // Optimistic update for both tech inventory and main stock
    setData(prev => ({
      ...prev,
      techInventory: existing
        ? prev.techInventory.map(ti =>
            ti.id === existing.id ? { ...ti, quantity: ti.quantity + quantity } : ti)
        : prev.techInventory,
      inventoryItems: prev.inventoryItems.map(i =>
        i.id === itemId ? { ...i, mainQuantity: newMainQty } : i),
    }));

    // Persist — use already-validated newMainQty to avoid race condition
    supabase.from('inventory_items')
      .update({ main_quantity: newMainQty }).eq('id', itemId)
      .then(({ error }) => { if (error) console.error('assignInventory deduct:', error); });

    if (existing) {
      supabase.from('tech_inventory')
        .update({ quantity: existing.quantity + quantity }).eq('id', existing.id)
        .then(({ error }) => { if (error) console.error('assignInventoryToTech update:', error); });
    } else {
      supabase.from('tech_inventory').insert({ tech_id: techId, item_id: itemId, quantity })
        .select().single().then(({ data: row, error }) => {
          if (!error && row) setData(prev => ({ ...prev, techInventory: [...prev.techInventory, mapTechInventory(row)] }));
          else if (error) console.error('assignInventoryToTech insert:', error);
        });
    }
  }, [data.techInventory, data.inventoryItems, supabase]);

  // ─── Job operations ────────────────────────────────────────────────────────

  const getJobs = useCallback(() => data.jobs, [data.jobs]);
  const getJobById = useCallback((id: string) => data.jobs.find(j => j.id === id), [data.jobs]);
  const getJobsByTech = useCallback((techId: string) => data.jobs.filter(j => j.assignedTechId === techId), [data.jobs]);
  const getJobsByStatus = useCallback((status: JobStatus) => data.jobs.filter(j => j.status === status), [data.jobs]);
  const getJobsPendingReview = useCallback(() => data.jobs.filter(j => j.status === 'pending_review'), [data.jobs]);

  const createJob = useCallback((
    clientName: string, address: string, createdBy: string,
    options?: { description?: string; assignedTechId?: string; jobType?: JobType; color?: string; bidStatus?: BidStatus; bidAmount?: number }
  ) => {
    supabase.from('jobs').insert({
      client_name: clientName,
      address,
      created_by: createdBy,
      description: options?.description,
      assigned_tech_id: options?.assignedTechId,
      job_type: options?.jobType ?? 'other',
      color: options?.color ?? '#6B7280',
      bid_status: options?.bidStatus ?? null,
      bid_amount: options?.bidAmount ?? null,
      status: 'assigned',
      is_locked: false,
    }).select().single().then(({ data: row, error }) => {
      if (!error && row) setData(prev => ({ ...prev, jobs: [mapJob(row), ...prev.jobs] }));
      else if (error) console.error('createJob:', error);
    });
  }, [supabase]);

  const updateJob = useCallback((id: string, updates: Partial<Job>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.clientName !== undefined) dbUpdates.client_name = updates.clientName;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.jobType !== undefined) dbUpdates.job_type = updates.jobType;
    if (updates.assignedTechId !== undefined) dbUpdates.assigned_tech_id = updates.assignedTechId;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.bidStatus !== undefined) dbUpdates.bid_status = updates.bidStatus;
    if (updates.bidAmount !== undefined) dbUpdates.bid_amount = updates.bidAmount;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.isLocked !== undefined) dbUpdates.is_locked = updates.isLocked;
    if (updates.changeRequestNotes !== undefined) dbUpdates.change_request_notes = updates.changeRequestNotes;
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
    if (updates.approvedAt !== undefined) dbUpdates.approved_at = updates.approvedAt;
    if (updates.approvedBy !== undefined) dbUpdates.approved_by = updates.approvedBy;

    setData(prev => ({ ...prev, jobs: prev.jobs.map(j => j.id === id ? { ...j, ...updates } : j) }));
    supabase.from('jobs').update(dbUpdates).eq('id', id)
      .then(({ error }) => { if (error) console.error('updateJob:', error); });
  }, [supabase]);

  const updateJobStatus = useCallback((id: string, status: JobStatus) => {
    const now = new Date().toISOString();
    const extra: Partial<Job> = {};
    if (status === 'pending_review') {
      extra.completedAt = now;
      extra.changeRequestNotes = undefined;
    }
    updateJob(id, { status, ...extra });
  }, [updateJob]);

  const approveJob = useCallback((jobId: string, approvedBy: string) => {
    updateJob(jobId, {
      status: 'complete',
      isLocked: true,
      approvedAt: new Date().toISOString(),
      approvedBy,
    });
  }, [updateJob]);

  const requestChanges = useCallback((jobId: string, note: string) => {
    updateJob(jobId, {
      status: 'in_progress',
      changeRequestNotes: note,
      completedAt: undefined,
    });
  }, [updateJob]);

  // ─── Photo operations ──────────────────────────────────────────────────────

  const getJobPhotos = useCallback((jobId: string) => data.jobPhotos.filter(p => p.jobId === jobId), [data.jobPhotos]);
  const getJobPhotosByType = useCallback((jobId: string, type: PhotoType) => data.jobPhotos.filter(p => p.jobId === jobId && p.photoType === type), [data.jobPhotos]);

  const addJobPhoto = useCallback((jobId: string, photoUrl: string, photoType: PhotoType, uploadedBy: string) => {
    supabase.from('job_photos').insert({
      job_id: jobId,
      photo_url: photoUrl,
      photo_type: photoType,
      uploaded_by: uploadedBy,
    }).select().single().then(({ data: row, error }) => {
      if (!error && row) setData(prev => ({ ...prev, jobPhotos: [...prev.jobPhotos, mapJobPhoto(row)] }));
      else if (error) console.error('addJobPhoto:', error);
    });
  }, [supabase]);

  const deleteJobPhoto = useCallback((photoId: string) => {
    const photo = data.jobPhotos.find(p => p.id === photoId);
    if (!photo) return;

    // Optimistic update
    setData(prev => ({ ...prev, jobPhotos: prev.jobPhotos.filter(p => p.id !== photoId) }));

    // Call the API route — it removes the file from Storage AND the DB row
    fetch(`/api/jobs/${photo.jobId}/photos?photoId=${photoId}`, { method: 'DELETE' })
      .then(async (res) => {
        if (!res.ok) {
          // Rollback on failure
          setData(prev => ({
            ...prev,
            jobPhotos: [...prev.jobPhotos, photo].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
          }));
          console.error('deleteJobPhoto failed:', await res.text());
        }
      })
      .catch((err) => {
        setData(prev => ({
          ...prev,
          jobPhotos: [...prev.jobPhotos, photo].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
        }));
        console.error('deleteJobPhoto error:', err);
      });
  }, [data.jobPhotos]);

  // ─── Job inventory operations ──────────────────────────────────────────────

  const getJobInventoryUsage = useCallback((jobId: string) =>
    data.jobInventory
      .filter(ji => ji.jobId === jobId)
      .map(ji => ({ ...ji, item: data.inventoryItems.find(i => i.id === ji.itemId)! }))
      .filter(ji => ji.item),
    [data.jobInventory, data.inventoryItems]);

  const logJobInventory = useCallback((jobId: string, itemId: string, quantityUsed: number, loggedBy: string) => {
    // Capture current tech inventory entry BEFORE the async insert to avoid stale closure
    const techInvEntry = data.techInventory.find(t => t.techId === loggedBy && t.itemId === itemId);
    const newTechQty = techInvEntry ? Math.max(0, techInvEntry.quantity - quantityUsed) : 0;

    supabase.from('job_inventory').insert({
      job_id: jobId, item_id: itemId, quantity_used: quantityUsed, logged_by: loggedBy,
    }).select('id, job_id, item_id, quantity_used, logged_by, created_at').single().then(({ data: row, error }) => {
      if (!error && row) {
        setData(prev => ({
          ...prev,
          jobInventory: [...prev.jobInventory, mapJobInventory(row)],
          techInventory: prev.techInventory.map(ti =>
            ti.techId === loggedBy && ti.itemId === itemId
              ? { ...ti, quantity: newTechQty }
              : ti
          ),
        }));
        // Persist using the pre-computed quantity — no second setData needed
        if (techInvEntry) {
          supabase.from('tech_inventory')
            .update({ quantity: newTechQty })
            .eq('id', techInvEntry.id)
            .then(({ error: tiError }) => { if (tiError) console.error('logJobInventory tech_inventory update:', tiError); });
        }
      } else if (error) console.error('logJobInventory:', error);
    });
  }, [supabase, data.techInventory]);

  // ─── Checklist operations ──────────────────────────────────────────────────

  const getJobChecklist = useCallback((jobId: string) => data.jobChecklists.find(c => c.jobId === jobId), [data.jobChecklists]);

  const saveJobChecklist = useCallback((jobId: string, checklistData: Omit<JobChecklist, 'id' | 'jobId' | 'completedAt'>) => {
    const existing = data.jobChecklists.find(c => c.jobId === jobId);
    const row = {
      job_id: jobId,
      tree_size: checklistData.treeSize ?? null,
      tree_height_ft: checklistData.treeHeightFt ?? null,
      valve_count: checklistData.valveCount ?? null,
      has_irrigation: checklistData.hasIrrigation !== undefined ? checklistData.hasIrrigation : null,
      sod_type: checklistData.sodType ?? null,
      custom_notes: checklistData.customNotes ?? null,
    };

    if (existing) {
      setData(prev => ({
        ...prev,
        jobChecklists: prev.jobChecklists.map(c => c.jobId === jobId ? { ...c, ...checklistData } : c),
      }));
      supabase.from('job_checklists').update(row).eq('job_id', jobId)
        .then(({ error }) => { if (error) console.error('saveJobChecklist update:', error); });
    } else {
      supabase.from('job_checklists').insert(row).select().single().then(({ data: inserted, error }) => {
        if (!error && inserted) setData(prev => ({ ...prev, jobChecklists: [...prev.jobChecklists, mapChecklist(inserted)] }));
        else if (error) console.error('saveJobChecklist insert:', error);
      });
    }
  }, [supabase, data.jobChecklists]);

  // ─── Validation ───────────────────────────────────────────────────────────

  const validateJobCompletion = useCallback((jobId: string) => validateCompletion(data, jobId), [data]);

  // ─── Reset (no-op for Supabase) ───────────────────────────────────────────

  const resetData = useCallback(() => { /* no-op with Supabase */ }, []);
  const refresh = useCallback(() => loadAll(), [loadAll]);

  const value: DataContextType = {
    data, isLoading,
    getUsers, getUserById, getTechs, getAdmins, updateUser,
    getInventoryItems, getInventoryItemById, addInventoryItem, updateInventoryItem,
    getTechInventory, getAllTechInventory, assignInventoryToTech,
    getJobs, getJobById, getJobsByTech, getJobsByStatus, getJobsPendingReview,
    createJob, updateJob, updateJobStatus, approveJob, requestChanges,
    getJobPhotos, getJobPhotosByType, addJobPhoto, deleteJobPhoto,
    getJobInventoryUsage, logJobInventory,
    getJobChecklist, saveJobChecklist,
    validateJobCompletion, resetData, refresh,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
}
