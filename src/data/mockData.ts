import { AppData, User, InventoryItem, TechInventory, Job, JobPhoto, JobInventory, JobChecklist } from './types';

// Preset tech colors
const TECH_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

// Seed users
const users: User[] = [
  {
    id: 'admin-1',
    email: 'cassandra@fieldflow.com',
    fullName: 'Cassandra Martinez',
    role: 'admin',
    color: '#6B7280',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'admin-2',
    email: 'devin@fieldflow.com',
    fullName: 'Devin Johnson',
    role: 'admin',
    color: '#6B7280',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tech-1',
    email: 'mike@fieldflow.com',
    fullName: 'Mike Thompson',
    role: 'tech',
    color: TECH_COLORS[0], // Blue
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'tech-2',
    email: 'sarah@fieldflow.com',
    fullName: 'Sarah Chen',
    role: 'tech',
    color: TECH_COLORS[1], // Green
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'tech-3',
    email: 'james@fieldflow.com',
    fullName: 'James Rodriguez',
    role: 'tech',
    color: TECH_COLORS[2], // Amber
    createdAt: '2024-02-01T00:00:00Z',
  },
];

// Seed inventory items
const inventoryItems: InventoryItem[] = [
  {
    id: 'inv-1',
    name: 'Mulch (Premium Brown)',
    unit: 'bags',
    mainQuantity: 150,
    lowStockThreshold: 20,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'inv-2',
    name: 'River Rock',
    unit: 'bags',
    mainQuantity: 75,
    lowStockThreshold: 10,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'inv-3',
    name: 'Weed Barrier Fabric',
    unit: 'rolls',
    mainQuantity: 4,
    lowStockThreshold: 5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'inv-4',
    name: 'Landscape Edging',
    unit: 'pieces',
    mainQuantity: 100,
    lowStockThreshold: 15,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'inv-5',
    name: 'Lawn Fertilizer',
    unit: 'bags',
    mainQuantity: 50,
    lowStockThreshold: 10,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'inv-6',
    name: 'Sprinkler Heads',
    unit: 'pieces',
    mainQuantity: 200,
    lowStockThreshold: 30,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'inv-7',
    name: 'PVC Pipe (1")',
    unit: 'feet',
    mainQuantity: 500,
    lowStockThreshold: 50,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'inv-8',
    name: 'Herbicide Concentrate',
    unit: 'gallons',
    mainQuantity: 2,
    lowStockThreshold: 5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Seed tech inventory
const techInventory: TechInventory[] = [
  // Mike's inventory
  { id: 'ti-1', techId: 'tech-1', itemId: 'inv-1', quantity: 20, createdAt: '2024-01-20T00:00:00Z', updatedAt: '2024-01-20T00:00:00Z' },
  { id: 'ti-2', techId: 'tech-1', itemId: 'inv-2', quantity: 10, createdAt: '2024-01-20T00:00:00Z', updatedAt: '2024-01-20T00:00:00Z' },
  { id: 'ti-3', techId: 'tech-1', itemId: 'inv-4', quantity: 15, createdAt: '2024-01-20T00:00:00Z', updatedAt: '2024-01-20T00:00:00Z' },
  { id: 'ti-4', techId: 'tech-1', itemId: 'inv-6', quantity: 25, createdAt: '2024-01-20T00:00:00Z', updatedAt: '2024-01-20T00:00:00Z' },
  // Sarah's inventory
  { id: 'ti-5', techId: 'tech-2', itemId: 'inv-1', quantity: 15, createdAt: '2024-01-20T00:00:00Z', updatedAt: '2024-01-20T00:00:00Z' },
  { id: 'ti-6', techId: 'tech-2', itemId: 'inv-3', quantity: 5, createdAt: '2024-01-20T00:00:00Z', updatedAt: '2024-01-20T00:00:00Z' },
  { id: 'ti-7', techId: 'tech-2', itemId: 'inv-5', quantity: 8, createdAt: '2024-01-20T00:00:00Z', updatedAt: '2024-01-20T00:00:00Z' },
  // James's inventory
  { id: 'ti-8', techId: 'tech-3', itemId: 'inv-6', quantity: 30, createdAt: '2024-02-05T00:00:00Z', updatedAt: '2024-02-05T00:00:00Z' },
  { id: 'ti-9', techId: 'tech-3', itemId: 'inv-7', quantity: 100, createdAt: '2024-02-05T00:00:00Z', updatedAt: '2024-02-05T00:00:00Z' },
  { id: 'ti-10', techId: 'tech-3', itemId: 'inv-8', quantity: 5, createdAt: '2024-02-05T00:00:00Z', updatedAt: '2024-02-05T00:00:00Z' },
];

// Seed jobs
const jobs: Job[] = [
  {
    id: 'job-1',
    jobNumber: 'JOB-0001',
    clientName: 'Johnson Residence',
    address: '123 Oak Street, Springfield, IL 62701',
    description: 'Front yard mulching and edging. Remove old mulch, install weed barrier, apply fresh mulch.',
    jobType: 'other',
    color: TECH_COLORS[0],
    assignedTechId: 'tech-1',
    status: 'assigned',
    isLocked: false,
    createdBy: 'admin-1',
    createdAt: '2024-01-22T09:00:00Z',
    updatedAt: '2024-01-22T09:00:00Z',
  },
  {
    id: 'job-2',
    jobNumber: 'JOB-0002',
    clientName: 'Greenview Office Park',
    address: '500 Commerce Drive, Springfield, IL 62702',
    description: 'Monthly lawn maintenance and fertilizer application for main entrance area.',
    jobType: 'other',
    color: TECH_COLORS[1],
    assignedTechId: 'tech-2',
    status: 'on_the_way',
    isLocked: false,
    createdBy: 'admin-1',
    createdAt: '2024-01-22T08:00:00Z',
    updatedAt: '2024-01-22T10:30:00Z',
  },
  {
    id: 'job-3',
    jobNumber: 'JOB-0003',
    clientName: 'Miller Family Home',
    address: '789 Maple Avenue, Springfield, IL 62703',
    description: 'Sprinkler system repair - 3 broken heads in backyard zone.',
    jobType: 'irrigation',
    color: TECH_COLORS[2],
    assignedTechId: 'tech-3',
    status: 'in_progress',
    notes: 'Customer mentioned dog in backyard, call before entering.',
    isLocked: false,
    createdBy: 'admin-2',
    createdAt: '2024-01-21T14:00:00Z',
    updatedAt: '2024-01-22T11:00:00Z',
  },
  {
    id: 'job-4',
    jobNumber: 'JOB-0004',
    clientName: 'Sunrise Apartments',
    address: '200 Sunset Blvd, Springfield, IL 62704',
    description: 'Common area landscaping - trim hedges and apply mulch to flower beds.',
    jobType: 'other',
    color: TECH_COLORS[0],
    assignedTechId: 'tech-1',
    status: 'in_progress',
    isLocked: false,
    createdBy: 'admin-1',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-22T09:30:00Z',
  },
  {
    id: 'job-5',
    jobNumber: 'JOB-0005',
    clientName: 'Thompson Estate',
    address: '1500 Country Club Lane, Springfield, IL 62705',
    description: 'Full backyard renovation - remove old landscaping, install river rock and new edging.',
    jobType: 'sod',
    color: TECH_COLORS[1],
    assignedTechId: 'tech-2',
    status: 'assigned',
    bidStatus: 'needs_bid',
    isLocked: false,
    createdBy: 'admin-2',
    createdAt: '2024-01-22T11:00:00Z',
    updatedAt: '2024-01-22T11:00:00Z',
  },
];

const jobPhotos: JobPhoto[] = [];
const jobInventory: JobInventory[] = [];
const jobChecklists: JobChecklist[] = [];

export const initialData: AppData = {
  users,
  inventoryItems,
  techInventory,
  jobs,
  jobPhotos,
  jobInventory,
  jobChecklists,
  jobNumberCounter: 5,
};

// Color palette for tech assignment
export const TECH_COLOR_PALETTE = [
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#F97316', label: 'Orange' },
];
