import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function EditService({
  params,
}: {
  params: Promise<{ id: string; recordId: string }>
}) {
  // 1. Await BOTH dynamic URL parameters
  const { id, recordId } = await params;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login');
  }

  // 2. Fetch the existing record to pre-fill the form
  const { data: record, error: recordError } = await supabase
    .from('service_records')
    .select('*')
    .eq('id', recordId)
    .single();

  if (recordError || !record) {
    notFound(); // If the record doesn't exist, show a 404
  }

  // 3. Server Action to handle the update
  const updateServiceAction = async (formData: FormData) => {
    'use server';
    const supabaseAction = await createClient();

    const serviceDate = formData.get('serviceDate') as string;
    const serviceType = formData.get('serviceType') as string;
    const mileage = formData.get('mileage') ? parseInt(formData.get('mileage') as string) : null;
    const cost = formData.get('cost') ? parseFloat(formData.get('cost') as string) : null;
    const notes = formData.get('notes') as string;

    // Use .update() instead of .insert(), and target the specific recordId
    const { error } = await supabaseAction
      .from('service_records')
      .update({
        service_date: serviceDate,
        service_type: serviceType,
        mileage_at_service: mileage,
        cost: cost,
        notes: notes || null,
      })
      .eq('id', recordId);

    if (!error) {
      // Send them back to the vehicle profile after a successful update
      redirect(`/dashboard/vehicle/${id}`);
    } else {
      console.error('Error updating record:', error);
    }
  };

  // Format the date so the HTML <input type="date"> can read it properly
  const formattedDate = record.service_date ? record.service_date.split('T')[0] : '';

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        
        <header className="mb-8">
          <Link href={`/dashboard/vehicle/${id}`} className="text-emerald-700 hover:text-emerald-900 text-sm font-medium mb-4 inline-block">
            &larr; Back to Vehicle Profile
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Edit Service Record</h1>
          <p className="text-slate-500 mt-1">Update the details for this maintenance entry.</p>
        </header>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <form action={updateServiceAction} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="serviceDate">Date of Service *</label>
                <input 
                  type="date" 
                  id="serviceDate"
                  name="serviceDate" 
                  required 
                  defaultValue={formattedDate}
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
                  defaultValue={record.mileage_at_service || ''}
                  className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none"
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
                defaultValue={record.service_type}
                className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none"
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
                defaultValue={record.cost || ''}
                className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="notes">Mechanic / DIY Notes</label>
              <textarea 
                id="notes"
                name="notes" 
                rows={4}
                defaultValue={record.notes || ''}
                className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100">
              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-md shadow-sm transition-colors"
              >
                Update Record
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}