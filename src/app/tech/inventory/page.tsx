'use client';

import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function TechInventoryPage() {
  const { currentUser } = useAuth();
  const { getTechInventory } = useData();

  const inventory = currentUser ? getTechInventory(currentUser.id) : [];

  // Group by quantity levels
  const lowStock = inventory.filter(i => i.quantity > 0 && i.quantity <= 5);
  const normalStock = inventory.filter(i => i.quantity > 5);
  const outOfStock = inventory.filter(i => i.quantity === 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Inventory</h1>

      {inventory.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
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
                <div className="text-2xl font-bold text-gray-900">{inventory.length}</div>
                <div className="text-sm text-gray-500">Total Items</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-4">
                <div className="text-2xl font-bold text-yellow-600">{lowStock.length}</div>
                <div className="text-sm text-gray-500">Low Stock</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center py-4">
                <div className="text-2xl font-bold text-red-600">{outOfStock.length}</div>
                <div className="text-sm text-gray-500">Out of Stock</div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory List */}
          <Card>
            <CardHeader>
              <CardTitle>All Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {inventory.map((inv) => {
                  let stockClass = 'text-gray-900';
                  let bgClass = 'bg-gray-50';
                  if (inv.quantity === 0) {
                    stockClass = 'text-red-600';
                    bgClass = 'bg-red-50';
                  } else if (inv.quantity <= 5) {
                    stockClass = 'text-yellow-600';
                    bgClass = 'bg-yellow-50';
                  }

                  return (
                    <div
                      key={inv.id}
                      className={`flex justify-between items-center p-4 rounded-lg ${bgClass}`}
                    >
                      <div>
                        <div className="font-medium text-gray-900">{inv.item.name}</div>
                        <div className="text-sm text-gray-500">{inv.item.unit}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${stockClass}`}>
                          {inv.quantity}
                        </div>
                        {inv.quantity === 0 && (
                          <div className="text-xs text-red-500">Out of stock</div>
                        )}
                        {inv.quantity > 0 && inv.quantity <= 5 && (
                          <div className="text-xs text-yellow-600">Low stock</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
