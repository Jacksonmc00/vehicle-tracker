import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login');
  }

  // 1. Fetch the user's vehicles
  const { data: vehicles, error: dbError } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false });

  // 2. Fetch the 5 most recent service records AND join the vehicle data
  const { data: recentServices } = await supabase
    .from('service_records')
    .select(`
      *,
      vehicles (
        make,
        model
      )
    `)
    .order('service_date', { ascending: false })
    .limit(5);

  // 3. The Alert Engine: Calculate which vehicles need maintenance
  const alerts: any[] = [];
  
  if (vehicles && recentServices) {
    vehicles.forEach((vehicle) => {
      if (vehicle.current_mileage) {
        // Find the most recent service record for this specific vehicle
        const latestService = recentServices.find(record => record.vehicle_id === vehicle.id);
        
        if (latestService && latestService.mileage_at_service) {
          const distanceSinceService = vehicle.current_mileage - latestService.mileage_at_service;
          
          // If it's been more than 8,000 km since the last logged service, trigger an alert!
          if (distanceSinceService >= 8000) {
            alerts.push({
              id: vehicle.id,
              vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
              message: `Overdue for service (${distanceSinceService.toLocaleString()} km since last record)`,
              type: 'warning'
            });
          }
        } else {
          // If they have mileage tracked but no service records yet
          alerts.push({
            id: vehicle.id,
            vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            message: 'No service history logged yet.',
            type: 'info'
          });
        }
      }
    });
  }

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Updated Header with Customers Button */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Garage</h1>
            <p className="text-slate-500 mt-1">Manage your vehicles and track maintenance.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link 
              href="/dashboard/profile" 
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md shadow-sm transition-colors font-medium text-sm"
            >
              Shop Profile
            </Link>
            <Link 
              href="/dashboard/customers" 
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md shadow-sm transition-colors font-medium text-sm"
            >
              Customers
            </Link>
            <Link 
              href="/dashboard/catalog" 
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md shadow-sm transition-colors font-medium text-sm"
            >
              Service Catalog
            </Link>
            <Link 
              href="/dashboard/add-vehicle" 
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-md shadow-sm transition-colors font-medium text-sm whitespace-nowrap"
            >
              + Add Vehicle
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content: Vehicle Cards */}
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

          {/* Sidebar: Alerts & Recent Service */}
          <div className="space-y-8">
            
            {/* Dynamic Alerts Box */}
            {alerts.length > 0 && (
              <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-amber-900">Needs Attention</h2>
                <ul className="space-y-4">
                  {alerts.map((alert, index) => (
                    <li key={index} className="text-sm">
                      <p className="font-bold text-amber-900">{alert.vehicleName}</p>
                      <p className="text-amber-700">{alert.message}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Real Recent Service Box */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-slate-800">Recent Service</h2>
              
              {!recentServices || recentServices.length === 0 ? (
                <p className="text-sm text-slate-500">No service records logged yet.</p>
              ) : (
                <ul className="space-y-4">
                  {recentServices.map((record) => (
                    <li key={record.id} className="text-sm border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <p className="font-medium text-slate-800">{record.service_type}</p>
                      <p className="text-slate-500">
                        {/* TypeScript safety check for the joined vehicle data */}
                        {record.vehicles && !Array.isArray(record.vehicles) 
                          ? `${record.vehicles.make} ${record.vehicles.model}` 
                          : 'Unknown Vehicle'}
                        {' • '} 
                        {new Date(record.service_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          timeZone: 'UTC'
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}