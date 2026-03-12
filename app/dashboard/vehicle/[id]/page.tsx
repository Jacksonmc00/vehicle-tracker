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
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login');
  }

  // --- Delete Vehicle Action ---
  const deleteVehicleAction = async () => {
    'use server';
    const supabaseAction = await createClient();
    
    // Deleting the vehicle will cascade and delete all attached service records and invoices!
    const { error } = await supabaseAction.from('vehicles').delete().eq('id', id);
    
    if (!error) {
      redirect('/dashboard');
    } else {
      console.error('Failed to delete vehicle:', error);
    }
  };

  // --- Delete Service Record Action ---
  const deleteServiceAction = async (formData: FormData) => {
    'use server';
    const recordId = formData.get('recordId') as string;
    const supabaseAction = await createClient();
    await supabaseAction.from('service_records').delete().eq('id', recordId);
    revalidatePath(`/dashboard/vehicle/${id}`);
  };

  // --- Generate Invoice Action (Now with Sales Tax Calculation) ---
  const generateInvoiceAction = async (formData: FormData) => {
    'use server';
    const recordId = formData.get('recordId') as string;
    const supabaseAction = await createClient();
    const { data: { user } } = await supabaseAction.auth.getUser();
    if (!user) return;

    // 1. Fetch the physical work order and its SKUs
    const { data: record } = await supabaseAction.from('service_records').select('*').eq('id', recordId).single();
    const { data: recordItems } = await supabaseAction.from('service_record_items').select('*').eq('service_record_id', recordId);

    if (record && recordItems) {
      // 2. Calculate the financials
      const subtotal = Number(record.cost);
      const taxRate = 13.00; // 13% HST
      const taxAmount = Number((subtotal * (taxRate / 100)).toFixed(2));
      const grandTotal = Number((subtotal + taxAmount).toFixed(2));

      // 3. Create the Financial Invoice Wrapper
      const { data: invoice, error: invError } = await supabaseAction
        .from('invoices')
        .insert([{
          service_record_id: recordId,
          user_id: user.id,
          status: 'Draft',
          subtotal: subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total_amount: grandTotal,
        }])
        .select('id')
        .single();

      if (!invError && invoice) {
        // 4. Copy the operational SKUs into financial line items
        const lineItems = recordItems.map(item => ({
          invoice_id: invoice.id,
          catalog_id: item.catalog_id,
          quantity: 1,
          unit_price: item.unit_price,
        }));
        
        await supabaseAction.from('invoice_line_items').insert(lineItems);
        
        // 5. Redirect straight to the brand new invoice
        redirect(`/dashboard/invoice/${invoice.id}`);
      }
    }
  };

  // Fetch the vehicle
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single();

  if (vehicleError || !vehicle) notFound();

  // Fetch records AND check if they have attached invoices
  const { data: serviceRecords } = await supabase
    .from('service_records')
    .select(`
      *,
      invoices ( id, status )
    `)
    .eq('vehicle_id', id)
    .order('service_date', { ascending: false });

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <Link href="/dashboard" className="text-emerald-700 hover:text-emerald-900 text-sm font-medium mb-4 inline-block">
            &larr; Back to Garage
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mt-2">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{vehicle.year} {vehicle.make} {vehicle.model}</h1>
              <p className="text-slate-500 mt-1">Mileage: {vehicle.current_mileage ? vehicle.current_mileage.toLocaleString() : 'Not tracked'} km</p>
              
              <div className="flex items-center gap-4 mt-3 text-sm">
                <Link href={`/dashboard/vehicle/${id}/edit`} className="text-blue-600 hover:text-blue-800 font-medium">
                  Edit Vehicle Details
                </Link>
                <form action={deleteVehicleAction}>
                  <DeleteButton />
                </form>
              </div>
            </div>
            
            <Link href={`/dashboard/vehicle/${id}/add-service`} className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-md shadow-sm transition-colors text-center font-medium whitespace-nowrap">
              + Log Service
            </Link>
          </div>
        </header>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-800">Service History & Invoices</h2>
          </div>
          <div className="p-6">
            {!serviceRecords || serviceRecords.length === 0 ? (
              <div className="text-center py-8 text-slate-500"><p>No service records found.</p></div>
            ) : (
              <div className="space-y-6">
                {serviceRecords.map((record) => {
                  const existingInvoice = record.invoices && record.invoices.length > 0 ? record.invoices[0] : null;

                  return (
                    <div key={record.id} className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                      <div className="mb-2 sm:mb-0">
                        <h3 className="text-md font-bold text-slate-800">{record.service_type || 'General Maintenance'}</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          {new Date(record.service_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                          {record.mileage_at_service && ` • ${record.mileage_at_service.toLocaleString()} km`}
                        </p>
                        {record.notes && <p className="text-sm text-slate-600 mt-3 bg-stone-50 p-3 rounded-md border border-stone-200">{record.notes}</p>}
                      </div>
                      
                      <div className="flex flex-col items-end gap-3">
                        {record.cost !== null && (
                          <div className="text-slate-700 font-medium whitespace-nowrap">
                            ${Number(record.cost).toFixed(2)}
                          </div>
                        )}
                        
                        {/* Invoice Generation / View Buttons */}
                        {existingInvoice ? (
                          <Link href={`/dashboard/invoice/${existingInvoice.id}`} className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded text-sm font-medium transition-colors">
                            View Invoice
                          </Link>
                        ) : (
                          <form action={generateInvoiceAction}>
                            <input type="hidden" name="recordId" value={record.id} />
                            <button type="submit" className="bg-stone-800 text-white hover:bg-stone-900 px-3 py-1.5 rounded text-sm font-medium transition-colors shadow-sm">
                              Generate Invoice
                            </button>
                          </form>
                        )}
                        
                        <div className="flex gap-4 text-sm mt-1 items-center">
                          <Link href={`/dashboard/vehicle/${id}/edit-service/${record.id}`} className="text-blue-600 hover:text-blue-800 font-medium">Edit</Link>
                          <form action={deleteServiceAction}>
                            <input type="hidden" name="recordId" value={record.id} />
                            <DeleteButton />
                          </form>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}