import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function EditCatalogItem({
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

  // Fetch the specific catalog item to pre-fill the form
  const { data: item, error: itemError } = await supabase
    .from('service_catalog')
    .select('*')
    .eq('id', id)
    .single();

  if (itemError || !item) {
    notFound();
  }

  // --- Server Action: Update the SKU ---
  const updateCatalogItemAction = async (formData: FormData) => {
    'use server';
    const supabaseAction = await createClient();

    const skuCode = formData.get('skuCode') as string;
    const serviceName = formData.get('serviceName') as string;
    const description = formData.get('description') as string;
    const defaultPrice = parseFloat(formData.get('defaultPrice') as string);

    const { error } = await supabaseAction
      .from('service_catalog')
      .update({
        sku_code: skuCode.toUpperCase(),
        service_name: serviceName,
        description: description || null,
        default_price: defaultPrice,
      })
      .eq('id', id);

    if (!error) {
      redirect('/dashboard/catalog');
    } else {
      console.error('Error updating catalog item:', error);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 p-8">
      <div className="max-w-xl mx-auto">
        
        <header className="mb-8">
          <Link href="/dashboard/catalog" className="text-emerald-700 hover:text-emerald-900 text-sm font-medium mb-4 inline-block">
            &larr; Back to Catalog
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Edit SKU: {item.sku_code}</h1>
          <p className="text-slate-500 mt-1">Update the default details and pricing for this service.</p>
        </header>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <form action={updateCatalogItemAction} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="skuCode">SKU Code *</label>
                <input 
                  type="text" 
                  id="skuCode"
                  name="skuCode" 
                  required 
                  defaultValue={item.sku_code}
                  className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="defaultPrice">Default Price ($) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  id="defaultPrice"
                  name="defaultPrice" 
                  required 
                  defaultValue={item.default_price}
                  className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="serviceName">Service Name *</label>
              <input 
                type="text" 
                id="serviceName"
                name="serviceName" 
                required 
                defaultValue={item.service_name}
                className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="description">Description (Optional)</label>
              <textarea 
                id="description"
                name="description" 
                rows={4}
                defaultValue={item.description || ''}
                className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none resize-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-md shadow-sm transition-colors"
              >
                Update Catalog Item
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}