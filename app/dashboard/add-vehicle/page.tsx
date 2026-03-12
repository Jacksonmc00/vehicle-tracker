import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function AddVehicle() {
  
  // This function runs securely on the server when the form is submitted
  const addVehicleAction = async (formData: FormData) => {
    'use server';
    const supabase = await createClient();

    // 1. Verify the user is still logged in
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      redirect('/login');
    }

    // 2. Grab the data from the form
    const year = parseInt(formData.get('year') as string);
    const make = formData.get('make') as string;
    const model = formData.get('model') as string;
    const trim = formData.get('trim') as string;
    const mileage = parseInt(formData.get('mileage') as string);

    // 3. Insert the new vehicle into Supabase
    const { error } = await supabase
      .from('vehicles')
      .insert([
        {
          user_id: user.id, // Securely lock this vehicle to the logged-in user
          year: year,
          make: make,
          model: model,
          trim: trim || null, // Trim is optional
          current_mileage: mileage || null, // Mileage is optional
        }
      ]);

    if (error) {
      console.error('Error inserting vehicle:', error);
      // We can add proper error UI later, but for now we'll just log it
    }

    // 4. Send them back to the dashboard to see their new vehicle!
    redirect('/dashboard');
  };

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        
        <header className="mb-8">
          <Link href="/dashboard" className="text-emerald-700 hover:text-emerald-900 text-sm font-medium mb-4 inline-block">
            &larr; Back to Garage
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Add a Vehicle</h1>
          <p className="text-slate-500 mt-1">Enter the details of the vehicle you want to track.</p>
        </header>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <form action={addVehicleAction} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="year">Year *</label>
                <input 
                  type="number" 
                  id="year"
                  name="year" 
                  required 
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none"
                  placeholder="e.g. 2018"
                />
              </div>

              {/* Make */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="make">Make *</label>
                <input 
                  type="text" 
                  id="make"
                  name="make" 
                  required 
                  className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none"
                  placeholder="e.g. Toyota"
                />
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="model">Model *</label>
                <input 
                  type="text" 
                  id="model"
                  name="model" 
                  required 
                  className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none"
                  placeholder="e.g. Tacoma"
                />
              </div>

              {/* Trim (Optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="trim">Trim (Optional)</label>
                <input 
                  type="text" 
                  id="trim"
                  name="trim" 
                  className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none"
                  placeholder="e.g. TRD Off-Road"
                />
              </div>
            </div>

            {/* Current Mileage */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="mileage">Current Mileage (km)</label>
              <input 
                type="number" 
                id="mileage"
                name="mileage" 
                className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none"
                placeholder="e.g. 85000"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100">
              <button 
                type="submit" 
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium px-6 py-3 rounded-md shadow-sm transition-colors"
              >
                Save Vehicle
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}