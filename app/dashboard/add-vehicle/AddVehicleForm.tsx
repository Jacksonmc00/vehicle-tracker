'use client';

import { useState } from 'react';
import { addVehicleAction } from './actions';

export default function AddVehicleForm({ customers }: { customers: any[] }) {
  // State for the VIN decoder
  const [vin, setVin] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodeError, setDecodeError] = useState('');

  // State for the auto-filling form fields
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [trim, setTrim] = useState('');

  const decodeVin = async () => {
    // Basic validation to ensure it's 17 characters
    if (!vin || vin.trim().length !== 17) {
      setDecodeError('Please enter a valid 17-character VIN.');
      return;
    }

    setIsDecoding(true);
    setDecodeError('');

    try {
      // Fetch data from the free NHTSA API
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`);
      const data = await res.json();
      const results = data.Results?.[0];

      if (results && results.Make) {
        // Capitalize the first letter of Make and Model for cleaner data
        const formatName = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
        
        setYear(results.ModelYear || '');
        setMake(formatName(results.Make) || '');
        setModel(formatName(results.Model) || '');
        setTrim(results.Trim || '');
      } else {
        setDecodeError('Could not decode VIN. Please enter details manually.');
      }
    } catch (err) {
      setDecodeError('Network error connecting to VIN database.');
    } finally {
      setIsDecoding(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
      
      {/* The VIN Decoder Section */}
      <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-8">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Auto-Fill via VIN</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            placeholder="Enter 17-character VIN" 
            value={vin}
            onChange={(e) => setVin(e.target.value.toUpperCase())}
            maxLength={17}
            className="flex-1 rounded-md px-4 py-2 border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600 outline-none font-mono uppercase"
          />
          <button 
            type="button" 
            onClick={decodeVin}
            disabled={isDecoding}
            className="bg-slate-800 hover:bg-black text-white px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {isDecoding ? 'Decoding...' : 'Decode VIN'}
          </button>
        </div>
        {decodeError && <p className="text-red-600 text-sm mt-2 font-medium">{decodeError}</p>}
      </div>

      <form action={addVehicleAction} className="space-y-6">
        
        {/* NEW: Hidden input to pass the VIN securely to the server action */}
        <input type="hidden" name="vin" value={vin} />

        <div className="border-b border-slate-100 pb-6 mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="customerId">Owner / Customer (Optional)</label>
          <select 
            id="customerId" 
            name="customerId" 
            defaultValue=""
            className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none"
          >
            <option value="">-- Shop Vehicle (No Owner Assigned) --</option>
            {customers?.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.first_name} {customer.last_name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-2">Assign this vehicle to a customer to track their specific service history.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="year">Year *</label>
            <input 
              type="number" id="year" name="year" required 
              value={year} onChange={(e) => setYear(e.target.value)}
              className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" 
              placeholder="e.g. 2018"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="make">Make *</label>
            <input 
              type="text" id="make" name="make" required 
              value={make} onChange={(e) => setMake(e.target.value)}
              className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" 
              placeholder="e.g. Toyota"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="model">Model *</label>
            <input 
              type="text" id="model" name="model" required 
              value={model} onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" 
              placeholder="e.g. Tacoma"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="trim">Trim (Optional)</label>
            <input 
              type="text" id="trim" name="trim" 
              value={trim} onChange={(e) => setTrim(e.target.value)}
              className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" 
              placeholder="e.g. TRD Off-Road"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="mileage">Current Mileage (km)</label>
          <input type="number" id="mileage" name="mileage" className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" placeholder="e.g. 85000" />
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium px-6 py-3 rounded-md shadow-sm transition-colors">
            Save Vehicle
          </button>
        </div>
      </form>
    </div>
  );
}