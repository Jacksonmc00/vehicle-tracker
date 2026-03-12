import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import DeleteButton from '@/components/DeleteButton';

export default async function Catalog() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // --- Server Action: Add a New SKU ---
  const addCatalogItem = async (formData: FormData) => {
    'use server';
    const supabaseAction = await createClient();
    const { data: { user } } = await supabaseAction.auth.getUser();
    if (!user) return;

    const skuCode = formData.get('skuCode') as string;
    const serviceName = formData.get('serviceName') as string;
    const description = formData.get('description') as string;
    const defaultPrice = parseFloat(formData.get('defaultPrice') as string);

    const { error } = await supabaseAction
      .from('service_catalog')
      .insert([
        {
          user_id: user.id,
          sku_code: skuCode.toUpperCase(),
          service_name: serviceName,
          description: description || null,
          default_price: defaultPrice,
        }
      ]);

    if (!error) revalidatePath('/dashboard/catalog');
  };

  // --- Server Action: Delete a SKU ---
  const deleteCatalogItem = async (formData: FormData) => {
    'use server';
    const itemId = formData.get('itemId') as string;
    const supabaseAction = await createClient();
    
    const { error } = await supabaseAction
      .from('service_catalog')
      .delete()
      .eq('id', itemId);

    if (!error) {
      revalidatePath('/dashboard/catalog');
    } else {
      // Because of our ON DELETE RESTRICT rule, this will fail if the SKU is 
      // already used on a real invoice. This protects your financial history!
      console.error('Cannot delete: SKU is likely attached to an existing invoice record.');
    }
  };

  // --- Fetch Existing Catalog Items ---
  const { data: catalogItems } = await supabase
    .from('service_catalog')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-10">
          <Link href="/dashboard" className="text-emerald-700 hover:text-emerald-900 text-sm font-medium mb-4 inline-block">
            &larr; Back to Garage
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Service Catalog</h1>
          <p className="text-slate-500 mt-1">Manage your standard services, SKUs, and default pricing.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Side: Add New SKU Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-8">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4 text-slate-800">Add New Service</h2>
              
              <form action={addCatalogItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="skuCode">SKU Code *</label>
                  <input type="text" id="skuCode" name="skuCode" required placeholder="e.g. OIL-SYN" className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none uppercase" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="serviceName">Service Name *</label>
                  <input type="text" id="serviceName" name="serviceName" required placeholder="e.g. Synthetic Oil Change" className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="defaultPrice">Default Price ($) *</label>
                  <input type="number" step="0.01" id="defaultPrice" name="defaultPrice" required placeholder="e.g. 89.99" className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="description">Description (Optional)</label>
                  <textarea id="description" name="description" rows={3} placeholder="Includes up to 5 quarts..." className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none resize-none" />
                </div>
                <div className="pt-2">
                  <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium px-4 py-2 rounded-md shadow-sm transition-colors">
                    Add to Catalog
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Side: Catalog Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 bg-slate-50">
                <h2 className="text-lg font-semibold text-slate-800">Master List</h2>
              </div>
              
              <div className="overflow-x-auto">
                {!catalogItems || catalogItems.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <p>Your catalog is currently empty.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-slate-200 text-sm text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-4 font-medium">SKU</th>
                        <th className="px-6 py-4 font-medium">Service Name</th>
                        <th className="px-6 py-4 font-medium text-right">Price</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {catalogItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="bg-slate-100 text-slate-700 font-mono text-xs px-2 py-1 rounded border border-slate-200">
                              {item.sku_code}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-slate-800">{item.service_name}</p>
                            {item.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.description}</p>}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-slate-700">
                            ${Number(item.default_price).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-3 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link 
                                href={`/dashboard/catalog/edit/${item.id}`} 
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Edit
                              </Link>
                              <form action={deleteCatalogItem}>
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