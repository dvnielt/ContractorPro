'use client';

import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';

export default function AdminInventoryPage() {
  const { getInventoryItems, addInventoryItem, updateInventoryItem } = useData();

  const items = getInventoryItems();
  const { toast } = useToast();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; name: string; unit: string; mainQuantity: number; lowStockThreshold: number } | null>(null);

  // Add form state
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newThreshold, setNewThreshold] = useState('');

  const handleAdd = () => {
    if (!newName.trim() || !newUnit.trim()) return;
    addInventoryItem(newName.trim(), newUnit.trim(), parseInt(newQuantity) || 0, parseInt(newThreshold) || 0);
    setNewName('');
    setNewUnit('');
    setNewQuantity('');
    setNewThreshold('');
    setShowAddModal(false);
    toast('Item added');
  };

  const handleEdit = () => {
    if (!editingItem) return;
    updateInventoryItem(editingItem.id, {
      name: editingItem.name,
      unit: editingItem.unit,
      mainQuantity: editingItem.mainQuantity,
      lowStockThreshold: editingItem.lowStockThreshold,
    });
    setEditingItem(null);
    setShowEditModal(false);
    toast('Item updated');
  };

  const openEdit = (item: typeof items[0]) => {
    setEditingItem({
      id: item.id,
      name: item.name,
      unit: item.unit,
      mainQuantity: item.mainQuantity,
      lowStockThreshold: item.lowStockThreshold,
    });
    setShowEditModal(true);
  };

  const lowStockItems = items.filter(i => i.mainQuantity <= i.lowStockThreshold);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-100">Inventory</h1>
        <Button onClick={() => setShowAddModal(true)}>Add Item</Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400 font-medium mb-1">
            <span className="w-2 h-2 bg-red-900/200 rounded-full inline-block" />
            {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} low on stock
          </div>
          <div className="text-sm text-red-600">{lowStockItems.map(i => i.name).join(', ')}</div>
        </div>
      )}

      {/* Inventory List */}
      <Card>
        <CardHeader>
          <CardTitle>Main Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No inventory items</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const isLow = item.mainQuantity <= item.lowStockThreshold;
                return (
                <div
                  key={item.id}
                  className={`flex justify-between items-center p-4 rounded-lg cursor-pointer ${isLow ? 'bg-red-900/20 hover:bg-red-100 border border-red-800/50' : 'bg-slate-950 hover:bg-slate-800'}`}
                  onClick={() => openEdit(item)}
                >
                  <div>
                    <div className="font-medium text-slate-100">{item.name}</div>
                    <div className="text-sm text-slate-400">{item.unit}</div>
                    {isLow && <div className="text-xs text-red-600 font-medium mt-0.5">Low stock (threshold: {item.lowStockThreshold})</div>}
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${isLow ? 'text-red-600' : 'text-slate-100'}`}>{item.mainQuantity}</div>
                    <div className="text-xs text-slate-400">in stock</div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Inventory Item"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!newName.trim() || !newUnit.trim()}>
              Add Item
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Item Name"
            placeholder="e.g., Mulch (Premium Brown)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            label="Unit"
            placeholder="e.g., bags, pieces, gallons"
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
          />
          <Input
            label="Initial Quantity"
            type="number"
            placeholder="0"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
          />
          <Input
            label="Low Stock Threshold"
            type="number"
            placeholder="0"
            value={newThreshold}
            onChange={(e) => setNewThreshold(e.target.value)}
          />
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Inventory Item"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>
              Save Changes
            </Button>
          </>
        }
      >
        {editingItem && (
          <div className="space-y-4">
            <Input
              label="Item Name"
              value={editingItem.name}
              onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
            />
            <Input
              label="Unit"
              value={editingItem.unit}
              onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
            />
            <Input
              label="Main Quantity"
              type="number"
              value={editingItem.mainQuantity.toString()}
              onChange={(e) => setEditingItem({ ...editingItem, mainQuantity: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Low Stock Threshold"
              type="number"
              value={editingItem.lowStockThreshold.toString()}
              onChange={(e) => setEditingItem({ ...editingItem, lowStockThreshold: parseInt(e.target.value) || 0 })}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
