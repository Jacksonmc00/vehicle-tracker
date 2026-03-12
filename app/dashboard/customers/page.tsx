import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import DeleteButton from '@/components/DeleteButton';

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // --- Server Action: Add New Customer ---
  const addCustomerAction = async (formData: FormData) => {
    'use server';
    const supabaseAction = await createClient();
    const { data: { user } } = await supabaseAction.auth.getUser();
    if (!user) return;

    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const notes = formData.get('notes') as string;

    const { error } = await supabaseAction
      .from('customers')
      .insert([
        {
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          email: email || null,
          phone: phone || null,
          notes: notes || null,
        }
      ]);

    if (!error) revalidatePath('/dashboard/customers');
  };

  // --- Server Action: Delete Customer ---
  const deleteCustomerAction = async (formData: FormData) => {
    'use server';
    const customerId = formData.get('customerId') as string;
    const supabaseAction = await createClient();
    
    await supabaseAction.from('customers').delete().eq('id', customerId);
    revalidatePath('/dashboard/customers');
  };

  // --- Fetch Existing Customers ---
  // We also ask Supabase to count how many vehicles are attached to each customer
  const { data: customers } = await supabase
    .from('customers')
    .select(`
      *,
      vehicles ( count )
    `)
    .order('last_name', { ascending: true });

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        
        <header className="mb-10">
          <Link href="/dashboard" className="text-emerald-700 hover:text-emerald-900 text-sm font-medium mb-4 inline-block">
            &larr; Back to Garage
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1">Manage your clients and their contact information.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Side: Add Customer Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-8">
              <h2 className="text-lg font-semibold border-b pb-2 mb-4 text-slate-800">Add New Customer</h2>
              
              <form action={addCustomerAction} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="firstName">First Name *</label>
                    <input type="text" id="firstName" name="firstName" required className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="lastName">Last Name *</label>
                    <input type="text" id="lastName" name="lastName" required className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="phone">Phone Number</label>
                  <input type="tel" id="phone" name="phone" placeholder="(555) 123-4567" className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">Email Address</label>
                  <input type="email" id="email" name="email" placeholder="client@example.com" className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="notes">Notes</label>
                  <textarea id="notes" name="notes" rows={3} placeholder="Prefers text messages..." className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none resize-none" />
                </div>
                
                <div className="pt-2">
                  <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-medium px-4 py-2 rounded-md shadow-sm transition-colors">
                    Save Customer
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Side: Customers List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800">Client Roster</h2>
                <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                  {customers?.length || 0} Total
                </span>
              </div>
              
              <div className="overflow-x-auto">
                {!customers || customers.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <p>No customers added yet.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 border-b border-slate-200 text-sm text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-4 font-medium">Name</th>
                        <th className="px-6 py-4 font-medium">Contact</th>
                        <th className="px-6 py-4 font-medium text-center">Vehicles</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">{customer.first_name} {customer.last_name}</p>
                            {customer.notes && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{customer.notes}</p>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-600">
                              {customer.phone && <div>{customer.phone}</div>}
                              {customer.email && <div className="text-slate-500">{customer.email}</div>}
                              {!customer.phone && !customer.email && <span className="text-slate-400 italic">No contact info</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center bg-emerald-100 text-emerald-800 font-bold h-8 w-8 rounded-full text-xs">
                              {customer.vehicles[0]?.count || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-3 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <form action={deleteCustomerAction}>
                                <input type="hidden" name="customerId" value={customer.id} />
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