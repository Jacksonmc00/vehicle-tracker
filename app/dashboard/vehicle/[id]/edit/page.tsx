import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function EditVehicle({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // 1. Fetch the existing vehicle data
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single();

  if (vehicleError || !vehicle) notFound();

  // 2. Server Action to handle the update
  const updateVehicleAction = async (formData: FormData) => {
    'use server';
    const supabaseAction = await createClient();

    const year = parseInt(formData.get('year') as string);
    const make = formData.get('make') as string;
    const model = formData.get('model') as string;
    const trim = formData.get('trim') as string;
    const mileage = formData.get('mileage') ? parseInt(formData.get('mileage') as string) : null;

    const { error } = await supabaseAction
      .from('vehicles')
      .update({
        year: year,
        make: make,
        model: model,
        trim: trim || null,
        current_mileage: mileage,
      })
      .eq('id', id);

    if (!error) {
      redirect(`/dashboard/vehicle/${id}`);
    } else {
      console.error('Error updating vehicle:', error);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        
        <header className="mb-8">
          <Link href={`/dashboard/vehicle/${id}`} className="text-emerald-700 hover:text-emerald-900 text-sm font-medium mb-4 inline-block">
            &larr; Back to Vehicle Profile
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Edit Vehicle</h1>
          <p className="text-slate-500 mt-1">Update details or log current mileage for this vehicle.</p>
        </header>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <form action={updateVehicleAction} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="year">Year *</label>
                <input 
                  type="number" id="year" name="year" required min="1900" max={new Date().getFullYear() + 1}
                  defaultValue={vehicle.year}
                  className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="make">Make *</label>
                <input 
                  type="text" id="make" name="make" required 
                  defaultValue={vehicle.make}
                  className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="model">Model *</label>
                <input 
                  type="text" id="model" name="model" required 
                  defaultValue={vehicle.model}
                  className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="trim">Trim (Optional)</label>
                <input 
                  type="text" id="trim" name="trim" 
                  defaultValue={vehicle.trim || ''}
                  className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="mileage">Current Mileage (km)</label>
              <input 
                type="number" id="mileage" name="mileage" 
                defaultValue={vehicle.current_mileage || ''}
                className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-md shadow-sm transition-colors">
                Update Vehicle
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}