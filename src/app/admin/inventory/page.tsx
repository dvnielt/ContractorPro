'use client';

import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

export default function AdminInventoryPage() {
  const { getInventoryItems, addInventoryItem, updateInventoryItem } = useData();

  const items = getInventoryItems();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; name: string; unit: string; mainQuantity: number } | null>(null);

  // Add form state
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newQuantity, setNewQuantity] = useState('');

  const handleAdd = () => {
    if (!newName.trim() || !newUnit.trim()) return;
    addInventoryItem(newName.trim(), newUnit.trim(), parseInt(newQuantity) || 0);
    setNewName('');
    setNewUnit('');
    setNewQuantity('');
    setShowAddModal(false);
  };

  const handleEdit = () => {
    if (!editingItem) return;
    updateInventoryItem(editingItem.id, {
      name: editingItem.name,
      unit: editingItem.unit,
      mainQuantity: editingItem.mainQuantity,
    });
    setEditingItem(null);
    setShowEditModal(false);
  };

  const openEdit = (item: typeof items[0]) => {
    setEditingItem({
      id: item.id,
      name: item.name,
      unit: item.unit,
      mainQuantity: item.mainQuantity,
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <Button onClick={() => setShowAddModal(true)}>Add Item</Button>
      </div>

      {/* Inventory List */}
      <Card>
        <CardHeader>
          <CardTitle>Main Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No inventory items</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => openEdit(item)}
                >
                  <div>
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500">{item.unit}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">{item.mainQuantity}</div>
                    <div className="text-xs text-gray-500">in stock</div>
                  </div>
                </div>
              ))}
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
          </div>
        )}
      </Modal>
    </div>
  );
}
