import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import PrintButton from './PrintButton';

export default async function InvoiceView({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) redirect('/login');

  // --- Server Action to update the invoice status ---
  const markAsPaidAction = async () => {
    'use server';
    const supabaseAction = await createClient();
    
    const { error } = await supabaseAction
      .from('invoices')
      .update({ status: 'Paid' })
      .eq('id', id);

    if (!error) {
      revalidatePath(`/dashboard/invoice/${id}`);
    } else {
      console.error('Failed to mark as paid:', error);
    }
  };

  // 1. Fetch the invoice, linking back up the chain to get vehicle AND customer info
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select(`
      *,
      service_records (
        service_date,
        mileage_at_service,
        vehicles ( 
          id, make, model, year, trim, vin,
          customers ( first_name, last_name, phone, email )
        )
      )
    `)
    .eq('id', id)
    .single();

  if (invoiceError || !invoice) notFound();

  // 2. Fetch the Shop Profile of the user who owns this invoice
  const { data: shopProfile } = await supabase
    .from('shop_profiles')
    .select('*')
    .eq('id', invoice.user_id)
    .single();

  // 3. Fetch the line items, joining the catalog to get the SKU codes and names
  const { data: lineItems } = await supabase
    .from('invoice_line_items')
    .select(`
      *,
      service_catalog ( sku_code, service_name, description )
    `)
    .eq('invoice_id', id);

  const vehicle = invoice.service_records?.vehicles;
  const customer = vehicle?.customers;

  return (
    <div className="min-h-screen bg-stone-200 p-8 flex flex-col items-center">
      
      {/* Action Bar (Hidden when printing) */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-6 print:hidden">
        <Link 
          href={`/dashboard/vehicle/${vehicle?.id}`} 
          className="text-stone-600 hover:text-stone-900 font-medium"
        >
          &larr; Back to Vehicle
        </Link>
        <div className="flex gap-3">
          {/* Only show the button if the invoice IS NOT paid yet */}
          {invoice.status !== 'Paid' && (
            <form action={markAsPaidAction}>
              <button 
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-md shadow-sm font-medium transition-colors"
              >
                Mark as Paid
              </button>
            </form>
          )}
          {/* Using our new Client Component Button! */}
          <PrintButton />
        </div>
      </div>

      {/* The Paper Invoice UI */}
      <div className="bg-white relative w-full max-w-3xl shadow-lg border border-stone-300 rounded-sm p-12 print:shadow-none print:border-none print:p-0 overflow-hidden">
        
        {/* Dynamic PAID Stamp */}
        {invoice.status === 'Paid' && (
          <div className="absolute top-16 right-12 border-4 border-emerald-500 text-emerald-500 text-5xl font-black uppercase tracking-widest px-6 py-2 rotate-12 opacity-80 print:opacity-100 pointer-events-none">
            PAID
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-start border-b border-stone-200 pb-8 mb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">INVOICE</h1>
            <p className="text-slate-500 mt-2 font-mono text-sm">#{invoice.id.split('-')[0].toUpperCase()}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-slate-800">
              {shopProfile?.full_name || 'My Garage Services'}
            </h2>
            <p className="text-slate-500 text-sm mt-1 whitespace-pre-wrap">
              {shopProfile?.address || '123 Mechanic Lane, Ottawa, ON K1A 0B1'}
              <br />
              {shopProfile?.phone_number || '(555) 123-4567'}
            </p>
          </div>
        </div>

        {/* Customer & Vehicle Info */}
        <div className="flex justify-between mb-12">
          
          {/* Dedicated Billed To and Vehicle Sections */}
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</h3>
              {customer ? (
                <>
                  <p className="text-lg font-bold text-slate-800">{customer.first_name} {customer.last_name}</p>
                  <p className="text-slate-600 text-sm mt-1">
                    {customer.phone && <span>{customer.phone} <br/></span>}
                    {customer.email && <span>{customer.email}</span>}
                  </p>
                </>
              ) : (
                <p className="text-lg font-bold text-slate-800">Shop Vehicle (Internal)</p>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vehicle</h3>
              <p className="text-md font-bold text-slate-800">
                {vehicle?.year} {vehicle?.make} {vehicle?.model} {vehicle?.trim}
              </p>
              <p className="text-slate-600 text-sm mt-1">
                <span className="font-medium">VIN:</span> {vehicle?.vin || 'N/A'} <br />
                <span className="font-medium">Mileage:</span> {invoice.service_records?.mileage_at_service?.toLocaleString() || 'N/A'} km
              </p>
            </div>
          </div>

          <div className="text-right">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Date of Service</h3>
            <p className="text-lg text-slate-800 font-medium">
              {new Date(invoice.service_records?.service_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <table className="w-full text-left mb-12">
          <thead>
            <tr className="border-b-2 border-slate-800 text-sm text-slate-800">
              <th className="py-3 font-bold uppercase tracking-wider">Item / Description</th>
              <th className="py-3 font-bold uppercase tracking-wider text-center">Qty</th>
              <th className="py-3 font-bold uppercase tracking-wider text-right">Unit Price</th>
              <th className="py-3 font-bold uppercase tracking-wider text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {lineItems?.map((item) => (
              <tr key={item.id}>
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                      {item.service_catalog?.sku_code}
                    </span>
                    <span className="font-bold text-slate-800">{item.service_catalog?.service_name}</span>
                  </div>
                </td>
                <td className="py-4 text-center text-slate-600">{item.quantity}</td>
                <td className="py-4 text-right text-slate-600">${Number(item.unit_price).toFixed(2)}</td>
                <td className="py-4 text-right font-bold text-slate-800">${(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total Section with Tax Breakdown */}
        <div className="flex justify-end">
          <div className="w-1/2 border-t-2 border-slate-800 pt-4">
            
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-600 font-medium">Subtotal</span>
              <span className="text-slate-800">${Number(invoice.subtotal || invoice.total_amount).toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-600 font-medium">
                HST ({Number(invoice.tax_rate || 13).toFixed(0)}%)
              </span>
              <span className="text-slate-800">${Number(invoice.tax_amount || 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-xl font-black text-slate-900 mt-4 border-t border-slate-200 pt-4">
              <span>Total Due</span>
              <span>${Number(invoice.total_amount).toFixed(2)}</span>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}