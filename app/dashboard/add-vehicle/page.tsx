import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import AddVehicleForm from './AddVehicleForm';

export default async function AddVehicle() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Fetch the user's customers to populate the dropdown
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .order('last_name', { ascending: true });

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        
        <header className="mb-8">
          <Link href="/dashboard" className="text-emerald-700 hover:text-emerald-900 text-sm font-medium mb-4 inline-block">
            &larr; Back to Garage
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Add a New Vehicle</h1>
          <p className="text-slate-500 mt-1">Enter the details manually or decode the VIN to auto-fill.</p>
        </header>

        {/* The interactive client form component */}
        <AddVehicleForm customers={customers || []} />

      </div>
    </div>
  );
}