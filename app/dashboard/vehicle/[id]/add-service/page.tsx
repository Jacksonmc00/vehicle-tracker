import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function AddService({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) redirect('/login');

  // Fetch the service catalog for the dropdown menu
  const { data: catalog } = await supabase
    .from('service_catalog')
    .select('*')
    .order('service_name', { ascending: true });

  const logServiceAction = async (formData: FormData) => {
    'use server';
    const supabaseAction = await createClient();
    
    // 1. THE FIX: Grab the logged-in user inside the server action so we can pass the ID to the DB
    const { data: { user } } = await supabaseAction.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    const serviceDate = formData.get('serviceDate') as string;
    const currentMileage = parseInt(formData.get('mileage') as string);
    const catalogId = formData.get('catalogId') as string;
    const cost = parseFloat(formData.get('cost') as string);
    const notes = formData.get('notes') as string;

    // Grab the name of the service to save as plain text on the main record
    const { data: catalogItem } = await supabaseAction
      .from('service_catalog')
      .select('service_name')
      .eq('id', catalogId)
      .single();

    // --- THE PREDICTIVE ADM ENGINE ---
    // Grab the most recent service record to compare against
    const { data: lastService } = await supabaseAction
      .from('service_records')
      .select('service_date, mileage_at_service')
      .eq('vehicle_id', id)
      .order('service_date', { ascending: false })
      .limit(1)
      .single();

    let newAdm = 40; 
    let shouldUpdateAdm = false;

    if (lastService && lastService.mileage_at_service && currentMileage > lastService.mileage_at_service) {
      const oldDate = new Date(lastService.service_date);
      const newDate = new Date(serviceDate);
      
      const diffTime = Math.abs(newDate.getTime() - oldDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        const milesDriven = currentMileage - lastService.mileage_at_service;
        newAdm = Math.round(milesDriven / diffDays);
        
        if (newAdm > 0 && newAdm <= 500) {
          shouldUpdateAdm = true;
        }
      }
    }

    // 2. Insert the main Service Record
    const { data: newRecord, error: recordError } = await supabaseAction
      .from('service_records')
      .insert([{
        vehicle_id: id,
        service_date: serviceDate,
        mileage_at_service: currentMileage,
        service_type: catalogItem?.service_name || 'General Maintenance',
        cost: cost || 0,
        notes: notes || null
      }])
      .select()
      .single();

    if (newRecord && !recordError) {
      // 3. Insert the Line Item (This links it to the Catalog for interval tracking)
      const { error: lineItemError } = await supabaseAction
        .from('service_record_items')
        .insert([{
          service_record_id: newRecord.id,
          catalog_id: catalogId || null, // Fallback to null if empty string to avoid DB crash
          quantity: 1,
          unit_price: cost || 0,
          user_id: user.id // <--- THE FINAL SECURITY FIX
        }]);

      // --- DEBUG CATCHER ---
      if (lineItemError) {
        console.error('FAILED TO SAVE LINE ITEM:', lineItemError);
      }

      // 4. Update the Vehicle profile with the new mileage AND the new ADM
      const vehicleUpdateData: any = { current_mileage: currentMileage };
      if (shouldUpdateAdm) {
        vehicleUpdateData.avg_daily_mileage = newAdm;
      }

      await supabaseAction.from('vehicles').update(vehicleUpdateData).eq('id', id);
      redirect(`/dashboard/vehicle/${id}`);
    } else if (recordError) {
       console.error('FAILED TO SAVE MAIN RECORD:', recordError);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <Link href={`/dashboard/vehicle/${id}`} className="text-emerald-700 hover:text-emerald-900 text-sm font-medium mb-4 inline-block">
            &larr; Back to Vehicle Profile
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Log Service</h1>
          <p className="text-slate-500 mt-1">Record completed maintenance and attach catalog items.</p>
        </header>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <form action={logServiceAction} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 pb-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="serviceDate">Date of Service *</label>
                <input type="date" id="serviceDate" name="serviceDate" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="mileage">Current Mileage (km) *</label>
                <input type="number" id="mileage" name="mileage" required className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" placeholder="e.g. 85000" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="catalogId">Service Performed *</label>
              <select id="catalogId" name="catalogId" required className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none">
                <option value="">-- Select from Catalog --</option>
                {catalog?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.sku_code} - {item.service_name} (${item.default_price})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="cost">Total Cost ($) *</label>
              <input type="number" step="0.01" id="cost" name="cost" required className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" placeholder="e.g. 150.00" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="notes">Mechanic Notes</label>
              <textarea id="notes" name="notes" rows={3} className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none resize-none" placeholder="Noticed brake pads are getting low..."></textarea>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium px-6 py-3 rounded-md shadow-sm transition-colors">
                Save Service Record
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}