import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export default async function ProfileSettings() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // 1. Fetch the user's shop profile
  const { data: profile } = await supabase
    .from('shop_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 2. Server Action to update the profile (Now using upsert!)
  const updateProfileAction = async (formData: FormData) => {
    'use server';
    const supabaseAction = await createClient();
    const { data: { user } } = await supabaseAction.auth.getUser();
    if (!user) return;

    const fullName = formData.get('fullName') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;

    // Use upsert so it creates the row if it's missing (e.g., for older accounts)
    const { error } = await supabaseAction
      .from('shop_profiles')
      .upsert({
        id: user.id, // Explicitly pass the user ID here so Supabase knows who this belongs to
        full_name: fullName,
        phone_number: phone,
        address: address,
      });

    if (!error) {
      // Instantly refresh the page to show the saved changes
      revalidatePath('/dashboard/profile');
    } else {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        
        <header className="mb-8">
          <Link href="/dashboard" className="text-emerald-700 hover:text-emerald-900 text-sm font-medium mb-4 inline-block">
            &larr; Back to Garage
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Shop Profile</h1>
          <p className="text-slate-500 mt-1">Update the business details that appear on your official invoices.</p>
        </header>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <form action={updateProfileAction} className="space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="fullName">Shop / Full Name</label>
              <input 
                type="text" id="fullName" name="fullName" required 
                defaultValue={profile?.full_name || ''}
                className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none"
                placeholder="e.g. Russell Auto Repair"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="phone">Phone Number</label>
              <input 
                type="tel" id="phone" name="phone" required 
                defaultValue={profile?.phone_number || ''}
                className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none"
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="address">Business Address</label>
              <input 
                type="text" id="address" name="address" required 
                defaultValue={profile?.address || ''}
                className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none"
                placeholder="123 Main St, Russell, ON"
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-medium px-6 py-3 rounded-md shadow-sm transition-colors">
                Save Profile Changes
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}