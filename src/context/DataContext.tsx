'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AppData, User, InventoryItem, TechInventory, Job, JobPhoto, JobInventory, JobStatus, PhotoType } from '@/data/types';
import * as storage from '@/data/storage';

interface DataContextType {
  data: AppData;
  isLoading: boolean;

  // User operations
  getUsers: () => User[];
  getUserById: (id: string) => User | undefined;
  getTechs: () => User[];
  getAdmins: () => User[];

  // Inventory operations
  getInventoryItems: () => InventoryItem[];
  getInventoryItemById: (id: string) => InventoryItem | undefined;
  addInventoryItem: (name: string, unit: string, quantity?: number) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;

  // Tech inventory operations
  getTechInventory: (techId: string) => (TechInventory & { item: InventoryItem })[];
  getAllTechInventory: () => (TechInventory & { item: InventoryItem; tech: User })[];
  assignInventoryToTech: (techId: string, itemId: string, quantity: number) => void;

  // Job operations
  getJobs: () => Job[];
  getJobById: (id: string) => Job | undefined;
  getJobsByTech: (techId: string) => Job[];
  getJobsByStatus: (status: JobStatus) => Job[];
  createJob: (clientName: string, address: string, createdBy: string, description?: string, assignedTechId?: string) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  updateJobStatus: (id: string, status: JobStatus) => void;

  // Photo operations
  getJobPhotos: (jobId: string) => JobPhoto[];
  getJobPhotosByType: (jobId: string, type: PhotoType) => JobPhoto[];
  addJobPhoto: (jobId: string, photoUrl: string, photoType: PhotoType, uploadedBy: string) => void;
  deleteJobPhoto: (photoId: string) => void;

  // Job inventory operations
  getJobInventoryUsage: (jobId: string) => (JobInventory & { item: InventoryItem })[];
  logJobInventory: (jobId: string, itemId: string, quantityUsed: number, loggedBy: string) => void;

  // Validation
  validateJobCompletion: (jobId: string) => storage.CompletionValidation;

  // Reset
  resetData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => storage.loadData());
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    setData(storage.loadData());
    setIsLoading(false);
  }, []);

  // Persist data whenever it changes
  useEffect(() => {
    if (!isLoading) {
      storage.saveData(data);
    }
  }, [data, isLoading]);

  // User operations
  const getUsers = useCallback(() => storage.getUsers(data), [data]);
  const getUserById = useCallback((id: string) => storage.getUserById(data, id), [data]);
  const getTechs = useCallback(() => storage.getTechs(data), [data]);
  const getAdmins = useCallback(() => storage.getAdmins(data), [data]);

  // Inventory operations
  const getInventoryItems = useCallback(() => storage.getInventoryItems(data), [data]);
  const getInventoryItemById = useCallback((id: string) => storage.getInventoryItemById(data, id), [data]);
  const addInventoryItem = useCallback((name: string, unit: string, quantity?: number) => {
    setData(prev => storage.addInventoryItem(prev, name, unit, quantity));
  }, []);
  const updateInventoryItem = useCallback((id: string, updates: Partial<InventoryItem>) => {
    setData(prev => storage.updateInventoryItem(prev, id, updates));
  }, []);

  // Tech inventory operations
  const getTechInventory = useCallback((techId: string) => storage.getTechInventory(data, techId), [data]);
  const getAllTechInventory = useCallback(() => storage.getAllTechInventory(data), [data]);
  const assignInventoryToTech = useCallback((techId: string, itemId: string, quantity: number) => {
    setData(prev => storage.assignInventoryToTech(prev, techId, itemId, quantity));
  }, []);

  // Job operations
  const getJobs = useCallback(() => storage.getJobs(data), [data]);
  const getJobById = useCallback((id: string) => storage.getJobById(data, id), [data]);
  const getJobsByTech = useCallback((techId: string) => storage.getJobsByTech(data, techId), [data]);
  const getJobsByStatus = useCallback((status: JobStatus) => storage.getJobsByStatus(data, status), [data]);
  const createJob = useCallback((clientName: string, address: string, createdBy: string, description?: string, assignedTechId?: string) => {
    setData(prev => storage.createJob(prev, clientName, address, createdBy, description, assignedTechId));
  }, []);
  const updateJob = useCallback((id: string, updates: Partial<Job>) => {
    setData(prev => storage.updateJob(prev, id, updates));
  }, []);
  const updateJobStatus = useCallback((id: string, status: JobStatus) => {
    setData(prev => storage.updateJobStatus(prev, id, status));
  }, []);

  // Photo operations
  const getJobPhotos = useCallback((jobId: string) => storage.getJobPhotos(data, jobId), [data]);
  const getJobPhotosByType = useCallback((jobId: string, type: PhotoType) => storage.getJobPhotosByType(data, jobId, type), [data]);
  const addJobPhoto = useCallback((jobId: string, photoUrl: string, photoType: PhotoType, uploadedBy: string) => {
    setData(prev => storage.addJobPhoto(prev, jobId, photoUrl, photoType, uploadedBy));
  }, []);
  const deleteJobPhoto = useCallback((photoId: string) => {
    setData(prev => storage.deleteJobPhoto(prev, photoId));
  }, []);

  // Job inventory operations
  const getJobInventoryUsage = useCallback((jobId: string) => storage.getJobInventoryUsage(data, jobId), [data]);
  const logJobInventory = useCallback((jobId: string, itemId: string, quantityUsed: number, loggedBy: string) => {
    setData(prev => storage.logJobInventory(prev, jobId, itemId, quantityUsed, loggedBy));
  }, []);

  // Validation
  const validateJobCompletion = useCallback((jobId: string) => storage.validateJobCompletion(data, jobId), [data]);

  // Reset
  const resetData = useCallback(() => {
    setData(storage.resetData());
  }, []);

  const value: DataContextType = {
    data,
    isLoading,
    getUsers,
    getUserById,
    getTechs,
    getAdmins,
    getInventoryItems,
    getInventoryItemById,
    addInventoryItem,
    updateInventoryItem,
    getTechInventory,
    getAllTechInventory,
    assignInventoryToTech,
    getJobs,
    getJobById,
    getJobsByTech,
    getJobsByStatus,
    createJob,
    updateJob,
    updateJobStatus,
    getJobPhotos,
    getJobPhotosByType,
    addJobPhoto,
    deleteJobPhoto,
    getJobInventoryUsage,
    logJobInventory,
    validateJobCompletion,
    resetData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
