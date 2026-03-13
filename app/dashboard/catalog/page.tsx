import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import DeleteButton from '@/components/DeleteButton';

export default async function ServiceCatalog() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // --- Server Action: Add New Catalog Item ---
  const addCatalogItemAction = async (formData: FormData) => {
    'use server';
    const supabaseAction = await createClient();
    const { data: { user } } = await supabaseAction.auth.getUser();
    if (!user) return;

    const skuCode = formData.get('skuCode') as string;
    const serviceName = formData.get('serviceName') as string;
    const description = formData.get('description') as string;
    const defaultPrice = parseFloat(formData.get('defaultPrice') as string);
    // NEW: Grab the interval from the form
    const serviceInterval = formData.get('serviceInterval') ? parseInt(formData.get('serviceInterval') as string) : null;

    const { error } = await supabaseAction
      .from('service_catalog')
      .insert([
        {
          user_id: user.id,
          sku_code: skuCode.toUpperCase(),
          service_name: serviceName,
          description: description || null,
          default_price: defaultPrice || 0,
          service_interval_km: serviceInterval || null, // Save to DB
        }
      ]);

    if (!error) revalidatePath('/dashboard/catalog');
  };

  // --- Server Action: Delete Catalog Item ---
  const deleteCatalogItemAction = async (formData: FormData) => {
    'use server';
    const itemId = formData.get('itemId') as string;
    const supabaseAction = await createClient();
    
    await supabaseAction.from('service_catalog').delete().eq('id', itemId);
    revalidatePath('/dashboard/catalog');
  };

  // --- Fetch Existing Catalog Items ---
  const { data: catalogItems } = await supabase
    .from('service_catalog')
    .select('*')
    .order('sku_code', { ascending: true });

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-10">
          <Link href="/dashboard" className="text-emerald-700 hover:text-emerald-900 text-sm font-medium mb-4 inline-block">
            &larr; Back to Garage
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Service Catalog</h1>
          <p className="text-slate-500 mt-1">Manage your shop's standard services, pricing, and predictive intervals.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Side: Add Catalog Item Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-8">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4 text-slate-800">Add New Service SKU</h2>
              
              <form action={addCatalogItemAction} className="space-y-4">
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="skuCode">SKU Code *</label>
                  <input type="text" id="skuCode" name="skuCode" required placeholder="e.g. OIL-SYN-01" className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none font-mono uppercase" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="serviceName">Service Name *</label>
                  <input type="text" id="serviceName" name="serviceName" required placeholder="e.g. Full Synthetic Oil Change" className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="defaultPrice">Default Price ($) *</label>
                  <input type="number" step="0.01" id="defaultPrice" name="defaultPrice" required placeholder="e.g. 89.99" className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" />
                </div>

                {/* NEW: Interval Input Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="serviceInterval">Lifespan Interval (km)</label>
                  <input type="number" id="serviceInterval" name="serviceInterval" placeholder="e.g. 8000" className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" />
                  <p className="text-xs text-slate-500 mt-1">Leave blank for one-off repairs.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="description">Description</label>
                  <textarea id="description" name="description" rows={2} placeholder="Includes up to 5L of synthetic oil and standard filter." className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none resize-none" />
                </div>
                
                <div className="pt-2">
                  <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-medium px-4 py-2 rounded-md shadow-sm transition-colors">
                    Save to Catalog
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Side: Catalog List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800">Active SKUs</h2>
                <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                  {catalogItems?.length || 0} Items
                </span>
              </div>
              
              <div className="overflow-x-auto">
                {!catalogItems || catalogItems.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <p>No services added to your catalog yet.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-slate-200 text-sm text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-4 font-medium">SKU / Service</th>
                        <th className="px-6 py-4 font-medium">Interval</th>
                        <th className="px-6 py-4 font-medium text-right">Price</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {catalogItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                {item.sku_code}
                              </span>
                            </div>
                            <p className="font-bold text-slate-800">{item.service_name}</p>
                            {item.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.description}</p>}
                          </td>
                          <td className="px-6 py-4">
                            {/* NEW: Display the interval in the table */}
                            {item.service_interval_km ? (
                              <span className="text-sm text-amber-700 font-medium bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                                {item.service_interval_km.toLocaleString()} km
                              </span>
                            ) : (
                              <span className="text-sm text-slate-400 italic">One-off</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="text-slate-800 font-medium">${Number(item.default_price).toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-3 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <form action={deleteCatalogItemAction}>
                                <input type="hidden" name="itemId" value={item.id} />
                                <DeleteButton />
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}