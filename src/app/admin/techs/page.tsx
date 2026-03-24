'use client';

import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { TECH_COLOR_PALETTE } from '@/data/mockData';
import { useToast } from '@/context/ToastContext';

export default function AdminTechsPage() {
  const { getTechs, getInventoryItems, getTechInventory, assignInventoryToTech, updateUser } = useData();

  const techs = getTechs();
  const inventoryItems = getInventoryItems();

  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignItemId, setAssignItemId] = useState('');
  const [assignQuantity, setAssignQuantity] = useState('');
  const [assignError, setAssignError] = useState('');

  const { toast } = useToast();
  const selectedTech = selectedTechId ? techs.find(t => t.id === selectedTechId) : null;
  const techInventory = selectedTechId ? getTechInventory(selectedTechId) : [];

  const availableItems = inventoryItems.filter(i => i.mainQuantity > 0);

  const handleAssign = () => {
    if (!selectedTechId || !assignItemId || !assignQuantity) return;

    const item = inventoryItems.find(i => i.id === assignItemId);
    const qty = parseInt(assignQuantity);

    if (!item || qty <= 0) {
      setAssignError('Invalid quantity');
      return;
    }

    if (qty > item.mainQuantity) {
      setAssignError(`Only ${item.mainQuantity} ${item.unit} available in main inventory`);
      return;
    }

    try {
      assignInventoryToTech(selectedTechId, assignItemId, qty);
      setShowAssignModal(false);
      setAssignItemId('');
      setAssignQuantity('');
      setAssignError('');
      toast('Inventory assigned');
    } catch (err) {
      setAssignError('Failed to assign inventory');
    }
  };

  const itemOptions = [
    { value: '', label: 'Select item...' },
    ...availableItems.map(i => ({
      value: i.id,
      label: `${i.name} (${i.mainQuantity} ${i.unit} available)`,
    })),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-100">Technicians</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Tech List */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select Tech</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {techs.map((tech) => (
                  <button
                    key={tech.id}
                    onClick={() => setSelectedTechId(tech.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedTechId === tech.id
                        ? 'bg-blue-900/20 border-2 border-blue-500'
                        : 'bg-slate-950 hover:bg-slate-800 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ backgroundColor: tech.color }}
                      >
                        {tech.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-100">{tech.fullName}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tech Inventory */}
        <div className="md:col-span-2 space-y-4">
          {selectedTech ? (
            <>
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                    style={{ backgroundColor: selectedTech.color }}
                  >
                    {selectedTech.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-lg text-slate-100">{selectedTech.fullName}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-300 mb-2">Color</div>
                  <div className="flex flex-wrap gap-2">
                    {TECH_COLOR_PALETTE.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => { updateUser(selectedTech.id, { color: c.value }); toast('Color updated'); }}
                        className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${selectedTech.color === c.value ? 'ring-2 ring-offset-2 ring-gray-700 scale-110' : ''}`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{selectedTech.fullName}&apos;s Inventory</CardTitle>
                  <Button onClick={() => setShowAssignModal(true)}>
                    Assign Inventory
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {techInventory.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">
                    No inventory assigned to this tech
                  </p>
                ) : (
                  <div className="space-y-2">
                    {techInventory.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex justify-between items-center p-4 bg-slate-950 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-slate-100">{inv.item.name}</div>
                          <div className="text-sm text-slate-400">{inv.item.unit}</div>
                        </div>
                        <div className="text-xl font-bold text-slate-100">
                          {inv.quantity}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-slate-400">
                Select a tech to view their inventory
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setAssignError('');
        }}
        title={`Assign Inventory to ${selectedTech?.fullName}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!assignItemId || !assignQuantity}>
              Assign
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Item"
            options={itemOptions}
            value={assignItemId}
            onChange={(e) => {
              setAssignItemId(e.target.value);
              setAssignError('');
            }}
          />
          <Input
            label="Quantity"
            type="number"
            placeholder="0"
            value={assignQuantity}
            onChange={(e) => {
              setAssignQuantity(e.target.value);
              setAssignError('');
            }}
          />
          {assignError && (
            <p className="text-sm text-red-500">{assignError}</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
