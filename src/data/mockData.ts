import { AppData, User, InventoryItem, TechInventory, Job, JobPhoto, JobInventory } from './types';

// Helper to generate UUIDs
const uuid = () => crypto.randomUUID();

// Seed users
const users: User[] = [
  {
    id: 'admin-1',
    email: 'cassandra@fieldflow.com',
    fullName: 'Cassandra Martinez',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'admin-2',
    email: 'devin@fieldflow.com',
    fullName: 'Devin Johnson',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'tech-1',
    email: 'mike@fieldflow.com',
    fullName: 'Mike Thompson',
    role: 'tech',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'tech-2',
    email: 'sarah@fieldflow.com',
    fullName: 'Sarah Chen',
    role: 'tech',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'tech-3',
    email: 'james@fieldflow.com',
    fullName: 'James Rodriguez',
    role: 'tech',
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
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'inv-2',
    name: 'River Rock',
    unit: 'bags',
    mainQuantity: 75,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'inv-3',
    name: 'Weed Barrier Fabric',
    unit: 'rolls',
    mainQuantity: 20,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'inv-4',
    name: 'Landscape Edging',
    unit: 'pieces',
    mainQuantity: 100,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'inv-5',
    name: 'Lawn Fertilizer',
    unit: 'bags',
    mainQuantity: 50,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'inv-6',
    name: 'Sprinkler Heads',
    unit: 'pieces',
    mainQuantity: 200,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'inv-7',
    name: 'PVC Pipe (1")',
    unit: 'feet',
    mainQuantity: 500,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'inv-8',
    name: 'Herbicide Concentrate',
    unit: 'gallons',
    mainQuantity: 30,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Seed tech inventory (items assigned to techs)
const techInventory: TechInventory[] = [
  // Mike's inventory
  { id: uuid(), techId: 'tech-1', itemId: 'inv-1', quantity: 20, createdAt: '2024-01-20T00:00:00Z', updatedAt: '2024-01-20T00:00:00Z' },
  { id: uuid(), techId: 'tech-1', itemId: 'inv-2', quantity: 10, createdAt: '2024-01-20T00:00:00Z', updatedAt: '2024-01-20T00:00:00Z' },
  { id: uuid(), techId: 'tech-1', itemId: 'inv-4', quantity: 15, createdAt: '2024-01-20T00:00:00Z', updatedAt: '2024-01-20T00:00:00Z' },
  { id: uuid(), techId: 'tech-1', itemId: 'inv-6', quantity: 25, createdAt: '2024-01-20T00:00:00Z', updatedAt: '2024-01-20T00:00:00Z' },
  // Sarah's inventory
  { id: uuid(), techId: 'tech-2', itemId: 'inv-1', quantity: 15, createdAt: '2024-01-20T00:00:00Z', updatedAt: '2024-01-20T00:00:00Z' },
  { id: uuid(), techId: 'tech-2', itemId: 'inv-3', quantity: 5, createdAt: '2024-01-20T00:00:00Z', updatedAt: '2024-01-20T00:00:00Z' },
  { id: uuid(), techId: 'tech-2', itemId: 'inv-5', quantity: 8, createdAt: '2024-01-20T00:00:00Z', updatedAt: '2024-01-20T00:00:00Z' },
  // James's inventory
  { id: uuid(), techId: 'tech-3', itemId: 'inv-6', quantity: 30, createdAt: '2024-02-05T00:00:00Z', updatedAt: '2024-02-05T00:00:00Z' },
  { id: uuid(), techId: 'tech-3', itemId: 'inv-7', quantity: 100, createdAt: '2024-02-05T00:00:00Z', updatedAt: '2024-02-05T00:00:00Z' },
  { id: uuid(), techId: 'tech-3', itemId: 'inv-8', quantity: 5, createdAt: '2024-02-05T00:00:00Z', updatedAt: '2024-02-05T00:00:00Z' },
];

// Seed jobs with various statuses
const jobs: Job[] = [
  {
    id: 'job-1',
    clientName: 'Johnson Residence',
    address: '123 Oak Street, Springfield, IL 62701',
    description: 'Front yard mulching and edging. Remove old mulch, install weed barrier, apply fresh mulch.',
    assignedTechId: 'tech-1',
    status: 'assigned',
    createdBy: 'admin-1',
    createdAt: '2024-01-22T09:00:00Z',
    updatedAt: '2024-01-22T09:00:00Z',
  },
  {
    id: 'job-2',
    clientName: 'Greenview Office Park',
    address: '500 Commerce Drive, Springfield, IL 62702',
    description: 'Monthly lawn maintenance and fertilizer application for main entrance area.',
    assignedTechId: 'tech-2',
    status: 'on_the_way',
    createdBy: 'admin-1',
    createdAt: '2024-01-22T08:00:00Z',
    updatedAt: '2024-01-22T10:30:00Z',
  },
  {
    id: 'job-3',
    clientName: 'Miller Family Home',
    address: '789 Maple Avenue, Springfield, IL 62703',
    description: 'Sprinkler system repair - 3 broken heads in backyard zone.',
    assignedTechId: 'tech-3',
    status: 'in_progress',
    notes: 'Customer mentioned dog in backyard, call before entering.',
    createdBy: 'admin-2',
    createdAt: '2024-01-21T14:00:00Z',
    updatedAt: '2024-01-22T11:00:00Z',
  },
  {
    id: 'job-4',
    clientName: 'Sunrise Apartments',
    address: '200 Sunset Blvd, Springfield, IL 62704',
    description: 'Common area landscaping - trim hedges and apply mulch to flower beds.',
    assignedTechId: 'tech-1',
    status: 'in_progress',
    createdBy: 'admin-1',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-22T09:30:00Z',
  },
  {
    id: 'job-5',
    clientName: 'Thompson Estate',
    address: '1500 Country Club Lane, Springfield, IL 62705',
    description: 'Full backyard renovation - remove old landscaping, install river rock and new edging.',
    assignedTechId: 'tech-2',
    status: 'assigned',
    createdBy: 'admin-2',
    createdAt: '2024-01-22T11:00:00Z',
    updatedAt: '2024-01-22T11:00:00Z',
  },
];

// Empty arrays for photos and job inventory (will be populated during demo)
const jobPhotos: JobPhoto[] = [];
const jobInventory: JobInventory[] = [];

export const initialData: AppData = {
  users,
  inventoryItems,
  techInventory,
  jobs,
  jobPhotos,
  jobInventory,
};

export function getAdminUsers(): User[] {
  return users.filter(u => u.role === 'admin');
}

export function getTechUsers(): User[] {
  return users.filter(u => u.role === 'tech');
}
