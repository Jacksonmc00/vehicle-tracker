import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import DeleteButton from '@/components/DeleteButton';

export default async function VehicleProfile({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // 1. Await the dynamic URL parameter
  const { id } = await params;
  
  // 2. Initialize Supabase and check auth
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login');
  }

  // 3. Server Action to Delete a Record
  const deleteServiceAction = async (formData: FormData) => {
    'use server';
    const recordId = formData.get('recordId') as string;
    
    // We must re-initialize the client inside the server action
    const supabaseAction = await createClient();
    
    const { error } = await supabaseAction
      .from('service_records')
      .delete()
      .eq('id', recordId);

    if (!error) {
      // Instantly refresh the page to show the record is gone
      revalidatePath(`/dashboard/vehicle/${id}`);
    } else {
      console.error('Failed to delete record:', error);
    }
  };

  // 4. Fetch the specific vehicle
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single();

  if (vehicleError || !vehicle) {
    notFound();
  }

  // 5. Fetch the service records for this specific vehicle
  const { data: serviceRecords, error: recordsError } = await supabase
    .from('service_records')
    .select('*')
    .eq('vehicle_id', id)
    .order('service_date', { ascending: false });

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation & Header Section */}
        <header className="mb-8">
          <Link href="/dashboard" className="text-emerald-700 hover:text-emerald-900 text-sm font-medium mb-4 inline-block">
            &larr; Back to Garage
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <p className="text-slate-500 mt-1">
                {vehicle.trim ? `${vehicle.trim} • ` : ''} 
                Mileage: {vehicle.current_mileage ? vehicle.current_mileage.toLocaleString() : 'Not tracked'} km
              </p>
            </div>
            
            <Link 
              href={`/dashboard/vehicle/${id}/add-service`} 
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-md shadow-sm transition-colors text-center font-medium"
            >
              + Log Service
            </Link>
          </div>
        </header>

        {/* Service History Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-800">Service History</h2>
          </div>
          
          <div className="p-6">
            {!serviceRecords || serviceRecords.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>No service records found for this vehicle.</p>
                <p className="text-sm mt-1">Click "+ Log Service" to add your first entry.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {serviceRecords.map((record) => (
                  <div key={record.id} className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                    <div className="mb-2 sm:mb-0">
                      <h3 className="text-md font-bold text-slate-800">{record.service_type}</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {new Date(record.service_date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          timeZone: 'UTC' // Prevents off-by-one day errors with dates
                        })}
                        {record.mileage_at_service && ` • ${record.mileage_at_service.toLocaleString()} km`}
                      </p>
                      {record.notes && (
                        <p className="text-sm text-slate-600 mt-3 bg-stone-50 p-3 rounded-md border border-stone-200">
                          {record.notes}
                        </p>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col items-end gap-2">
                      {record.cost && (
                        <div className="text-slate-700 font-medium whitespace-nowrap">
                          ${Number(record.cost).toFixed(2)}
                        </div>
                      )}
                      
                      <div className="flex gap-4 text-sm mt-2 items-center">
                        <Link 
                          href={`/dashboard/vehicle/${id}/edit-service/${record.id}`} 
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </Link>
                        
                        {/* Interactive Client Component Delete Button */}
                        <form action={deleteServiceAction}>
                          <input type="hidden" name="recordId" value={record.id} />
                          <DeleteButton />
                        </form>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}