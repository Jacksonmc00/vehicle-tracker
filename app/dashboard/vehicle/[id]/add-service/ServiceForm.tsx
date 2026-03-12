'use client';

import { useState } from 'react';
import { logServiceAction } from './actions';

export default function ServiceForm({ 
  vehicleId,
  catalogItems 
}: { 
  vehicleId: string,
  catalogItems: any[] 
}) {
  const today = new Date().toISOString().split('T')[0];
  
  // We use state to hold an array of line items instead of just one!
  const [items, setItems] = useState([{ catalogId: '', price: 0, name: '' }]);

  const handleItemChange = (index: number, catalogId: string) => {
    const selectedItem = catalogItems.find(item => item.id === catalogId);
    const newItems = [...items];
    
    newItems[index] = {
      catalogId: catalogId,
      price: selectedItem ? selectedItem.default_price : 0,
      name: selectedItem ? selectedItem.service_name : ''
    };
    
    setItems(newItems);
  };

  const handlePriceChange = (index: number, newPrice: string) => {
    const newItems = [...items];
    newItems[index].price = parseFloat(newPrice) || 0;
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([...items, { catalogId: '', price: 0, name: '' }]);
  };

  const removeItemRow = (index: number) => {
    // Keep at least one row active
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Automatically calculate the grand total
  const totalCost = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <form action={logServiceAction} className="space-y-6">
      <input type="hidden" name="vehicleId" value={vehicleId} />
      {/* We stringify the entire array of items to easily pass it to the Server Action */}
      <input type="hidden" name="lineItems" value={JSON.stringify(items)} />
      <input type="hidden" name="totalCost" value={totalCost} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="serviceDate">Date of Service *</label>
          <input type="date" id="serviceDate" name="serviceDate" required defaultValue={today} className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="mileage">Mileage at Service</label>
          <input type="number" id="mileage" name="mileage" placeholder="e.g. 85500" className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" />
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Services Performed</h3>
        
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-medium text-slate-500 mb-1">Select SKU</label>
                <select 
                  required 
                  value={item.catalogId}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                  className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none"
                >
                  <option value="" disabled>Choose a service...</option>
                  {catalogItems.map(catalogItem => (
                    <option key={catalogItem.id} value={catalogItem.id}>
                      {catalogItem.sku_code} - {catalogItem.service_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-32">
                <label className="block text-xs font-medium text-slate-500 mb-1">Price ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required
                  value={item.price || ''}
                  onChange={(e) => handlePriceChange(index, e.target.value)}
                  className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>

              {items.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeItemRow(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent font-medium"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-between items-center bg-slate-50 p-4 rounded-md border border-slate-200">
          <button 
            type="button" 
            onClick={addItemRow}
            className="text-emerald-700 hover:text-emerald-900 font-medium text-sm"
          >
            + Add Another Service
          </button>
          <div className="font-bold text-slate-800">
            Total: ${totalCost.toFixed(2)}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="notes">Mechanic / DIY Notes</label>
        <textarea id="notes" name="notes" rows={4} className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none resize-none" />
      </div>

      <div className="pt-4 border-t border-slate-100">
        <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium px-6 py-3 rounded-md shadow-sm transition-colors">
          Save Work Order (Record Only)
        </button>
      </div>
    </form>
  );
}