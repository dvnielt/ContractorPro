'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function TechInventoryPage() {
  const { currentUser } = useAuth();
  const { getTechInventory, data, getJobById } = useData();

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const inventory = currentUser ? getTechInventory(currentUser.id) : [];

  const lowStock = inventory.filter(i => i.quantity > 0 && i.quantity <= 5);
  const outOfStock = inventory.filter(i => i.quantity === 0);

  // Usage history for the selected item (all jobs this tech used it on)
  const usageHistory = selectedItemId && currentUser
    ? data.jobInventory
        .filter(ji => ji.itemId === selectedItemId && ji.loggedBy === currentUser.id)
        .map(ji => {
          const job = getJobById(ji.jobId);
          return { ...ji, job };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  const selectedInv = selectedItemId ? inventory.find(i => i.itemId === selectedItemId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/tech" className="text-blue-600 hover:text-blue-400 text-sm">← Back</Link>
        <h1 className="text-2xl font-bold text-slate-100">My Inventory</h1>
      </div>

      {inventory.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-400">
            No inventory assigned to you yet.
            <br />
            <span className="text-sm">Contact your admin to get materials assigned.</span>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="text-center py-4">
                <div className="text-2xl font-bold text-slate-100">{inventory.length}</div>
                <div className="text-sm text-slate-400">Total Items</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-4">
                <div className="text-2xl font-bold text-yellow-600">{lowStock.length}</div>
                <div className="text-sm text-slate-400">Low Stock</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-4">
                <div className="text-2xl font-bold text-red-600">{outOfStock.length}</div>
                <div className="text-sm text-slate-400">Out of Stock</div>
              </CardContent>
            </Card>
          </div>

          <div className={`grid gap-6 ${selectedItemId ? 'md:grid-cols-2' : ''}`}>
            {/* Inventory List */}
            <Card>
              <CardHeader>
                <CardTitle>All Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {inventory.map((inv) => {
                    const isSelected = selectedItemId === inv.itemId;
                    let stockColor = 'text-slate-100';
                    let bgClass = isSelected ? 'bg-blue-900/20 border border-blue-300' : 'bg-slate-950 hover:bg-slate-800';
                    if (inv.quantity === 0) {
                      stockColor = 'text-red-600';
                      bgClass = isSelected ? 'bg-blue-900/20 border border-blue-300' : 'bg-red-900/20 hover:bg-red-100';
                    } else if (inv.quantity <= 5) {
                      stockColor = 'text-yellow-600';
                      bgClass = isSelected ? 'bg-blue-900/20 border border-blue-300' : 'bg-amber-900/20 hover:bg-yellow-100';
                    }

                    return (
                      <button
                        key={inv.id}
                        onClick={() => setSelectedItemId(isSelected ? null : inv.itemId)}
                        className={`w-full text-left flex justify-between items-center p-4 rounded-lg transition-colors cursor-pointer ${bgClass}`}
                      >
                        <div>
                          <div className="font-medium text-slate-100">{inv.item.name}</div>
                          <div className="text-sm text-slate-400">{inv.item.unit}</div>
                          {inv.quantity === 0 && <div className="text-xs text-red-500 mt-0.5">Out of stock</div>}
                          {inv.quantity > 0 && inv.quantity <= 5 && <div className="text-xs text-yellow-600 mt-0.5">Low stock</div>}
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-bold ${stockColor}`}>{inv.quantity}</div>
                          <div className="text-xs text-slate-500">{inv.item.unit}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Usage History Panel */}
            {selectedItemId && selectedInv && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedInv.item.name}</CardTitle>
                      <p className="text-sm text-slate-400 mt-1">Usage history</p>
                    </div>
                    <button
                      onClick={() => setSelectedItemId(null)}
                      className="text-slate-500 hover:text-slate-400 text-lg leading-none"
                    >
                      ✕
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  {usageHistory.length === 0 ? (
                    <p className="text-slate-500 text-center py-6 text-sm">
                      No usage logged for this item yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {usageHistory.map((entry) => (
                        <div key={entry.id} className="p-3 bg-slate-950 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              {entry.job ? (
                                <Link
                                  href={`/tech/jobs/${entry.job.id}`}
                                  className="font-medium text-blue-600 hover:text-blue-400 text-sm"
                                >
                                  {entry.job.clientName}
                                </Link>
                              ) : (
                                <span className="font-medium text-slate-300 text-sm">Unknown Job</span>
                              )}
                              {entry.job && (
                                <div className="text-xs text-slate-500 font-mono">{entry.job.jobNumber}</div>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-slate-100">−{entry.quantityUsed}</span>
                              <span className="text-slate-400 text-sm ml-1">{selectedInv.item.unit}</span>
                            </div>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {new Date(entry.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-medium text-slate-300">
                        <span>Total used</span>
                        <span>
                          {usageHistory.reduce((sum, e) => sum + e.quantityUsed, 0)} {selectedInv.item.unit}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
