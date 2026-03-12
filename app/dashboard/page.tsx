import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function Dashboard() {
  // 1. Initialize the Supabase client WITH await
  const supabase = await createClient();

  // 2. Check if the user is logged in
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  // If they aren't logged in, kick them back to the login page
  if (authError || !user) {
    redirect('/login');
  }

  // 3. Fetch the vehicles for the logged-in user
  const { data: vehicles, error: dbError } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false });

  // Mock recent service until we build that table's UI
  const mockRecentService = [
    { id: '101', vehicle: 'Placeholder', service: 'Oil Change', date: '2026-02-15' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Garage</h1>
            <p className="text-slate-500 mt-1">Manage your vehicles and track maintenance.</p>
          </div>
          <Link href="/dashboard/add-vehicle" className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-md shadow-sm transition-colors">
            + Add Vehicle
          </Link>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold border-b pb-2 mb-4 text-slate-800">Active Vehicles</h2>
            
            {!vehicles || vehicles.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 mb-4">You don't have any vehicles in your garage yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">
                        {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim && <span className="text-slate-500 text-sm font-normal">({vehicle.trim})</span>}
                      </h3>
                      <p className="text-slate-500 text-sm mt-1">
                        Mileage: {vehicle.current_mileage ? vehicle.current_mileage.toLocaleString() : 'Not tracked'} km
                      </p>
                    </div>
                    <div className="mt-6 flex justify-between items-center">
                      <Link href={`/dashboard/vehicle/${vehicle.id}`} className="text-emerald-700 hover:text-emerald-900 text-sm font-medium">
                        View Details &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-slate-800">Recent Service</h2>
              <ul className="space-y-4">
                {mockRecentService.map((record) => (
                  <li key={record.id} className="text-sm">
                    <p className="font-medium text-slate-700">{record.service}</p>
                    <p className="text-slate-500">{record.vehicle} • {record.date}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}