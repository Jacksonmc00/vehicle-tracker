import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function AddService({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // 1. Await the dynamic URL parameter to get the vehicle ID
  const { id } = await params;

  // This function securely handles the form submission on the server
  const addServiceAction = async (formData: FormData) => {
    'use server';
    const supabase = await createClient();

    // Verify user is logged in
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      redirect('/login');
    }

    // Grab the data from the form
    const serviceDate = formData.get('serviceDate') as string;
    const serviceType = formData.get('serviceType') as string;
    const mileage = formData.get('mileage') ? parseInt(formData.get('mileage') as string) : null;
    const cost = formData.get('cost') ? parseFloat(formData.get('cost') as string) : null;
    const notes = formData.get('notes') as string;

    // Insert the record into Supabase, securely tying it to this specific vehicle ID
    const { error } = await supabase
      .from('service_records')
      .insert([
        {
          vehicle_id: id,
          service_date: serviceDate,
          service_type: serviceType,
          mileage_at_service: mileage,
          cost: cost,
          notes: notes || null,
        }
      ]);

    if (error) {
      console.error('Error inserting service record:', error);
      // We can add error handling UI later
    }

    // Redirect straight back to the vehicle's profile to see the new record!
    redirect(`/dashboard/vehicle/${id}`);
  };

  // Get today's date formatted as YYYY-MM-DD for the default input value
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        
        <header className="mb-8">
          <Link href={`/dashboard/vehicle/${id}`} className="text-emerald-700 hover:text-emerald-900 text-sm font-medium mb-4 inline-block">
            &larr; Back to Vehicle Profile
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Log Service</h1>
          <p className="text-slate-500 mt-1">Add a new maintenance record to this vehicle's history.</p>
        </header>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <form action={addServiceAction} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="serviceDate">Date of Service *</label>
                <input 
                  type="date" 
                  id="serviceDate"
                  name="serviceDate" 
                  required 
                  defaultValue={today}
                  className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none"
                />
              </div>

              {/* Mileage at Service */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="mileage">Mileage at Service</label>
                <input 
                  type="number" 
                  id="mileage"
                  name="mileage" 
                  className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none"
                  placeholder="e.g. 85500"
                />
              </div>
            </div>

            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="serviceType">Service Type *</label>
              <input 
                type="text" 
                id="serviceType"
                name="serviceType" 
                required 
                className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none"
                placeholder="e.g. Oil Change & Tire Rotation"
              />
            </div>

            {/* Cost */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="cost">Total Cost ($)</label>
              <input 
                type="number" 
                step="0.01"
                id="cost"
                name="cost" 
                className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none"
                placeholder="e.g. 120.50"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="notes">Mechanic / DIY Notes</label>
              <textarea 
                id="notes"
                name="notes" 
                rows={4}
                className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none resize-none"
                placeholder="e.g. Swapped to synthetic blend, front brake pads have about 30% life left."
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100">
              <button 
                type="submit" 
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium px-6 py-3 rounded-md shadow-sm transition-colors"
              >
                Save Record
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}