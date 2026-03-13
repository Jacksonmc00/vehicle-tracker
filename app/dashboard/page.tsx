import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) redirect('/login');

  // 1. Grab the search query from the URL if it exists
  const resolvedParams = await searchParams;
  const searchQuery = resolvedParams?.search?.toLowerCase() || '';

  // 2. Fetch all vehicles AND their linked customers
  const { data: vehicles, error: vehiclesError } = await supabase
    .from('vehicles')
    .select('*, customers(*)')
    .order('created_at', { ascending: false });

  if (vehiclesError) console.error("VEHICLE FETCH ERROR:", vehiclesError);

  const { data: recentServices } = await supabase
    .from('service_records')
    .select(`*, vehicles ( make, model )`)
    .order('service_date', { ascending: false })
    .limit(5);

  const { data: fullServiceHistory } = await supabase
    .from('service_records')
    .select(`
      vehicle_id,
      service_date,
      mileage_at_service,
      service_record_items (
        service_catalog (
          service_name,
          service_interval_km
        )
      )
    `)
    .order('service_date', { ascending: false });

  // 3. Filter the vehicles array before we render it
  let displayVehicles = vehicles || [];
  if (searchQuery) {
    displayVehicles = displayVehicles.filter(v => {
      // Explicitly pull out the exact text we want to be searchable
      const ownerFirstName = v.customers?.first_name || v.customers?.name || '';
      const ownerLastName = v.customers?.last_name || '';
      const ownerEmail = v.customers?.email || '';
      const ownerPhone = v.customers?.phone || '';
      
      // Combine the truck data and the owner data into one clean string
      const targetString = `${v.year} ${v.make} ${v.model} ${v.trim || ''} ${v.license_plate || ''} ${v.vin || ''} ${ownerFirstName} ${ownerLastName} ${ownerEmail} ${ownerPhone}`.toLowerCase();
      
      return targetString.includes(searchQuery);
    });
  }

  const alerts: any[] = [];
  const vehicleDiagnostics = new Map();
  const today = new Date();
  const vehicleAdms = new Map();
  
  if (displayVehicles && fullServiceHistory) {
    displayVehicles.forEach((vehicle) => {
      const vehicleHistory = fullServiceHistory.filter(r => r.vehicle_id === vehicle.id);
      
      if (vehicleHistory.length === 0) {
        alerts.push({
          id: vehicle.id,
          vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          message: 'No service history logged yet.',
          type: 'info'
        });
        vehicleAdms.set(vehicle.id, 40); // Default
        return; 
      }

      const latestShopVisitDate = new Date(vehicleHistory[0].service_date);
      
      // --- THE SELF-HEALING ADM CALCULATOR ---
      let dynamicAdm = 40; 

      if (vehicleHistory.length >= 2) {
        const newestRecord = vehicleHistory[0];
        const oldestRecord = vehicleHistory[vehicleHistory.length - 1];

        const newestDate = new Date(newestRecord.service_date);
        const oldestDate = new Date(oldestRecord.service_date);
        
        const daysPassed = Math.ceil((newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
        const distanceDriven = (Number(newestRecord.mileage_at_service) || 0) - (Number(oldestRecord.mileage_at_service) || 0);

        if (daysPassed > 0 && distanceDriven > 0) {
          dynamicAdm = Math.round(distanceDriven / daysPassed);
          if (dynamicAdm > 500) dynamicAdm = 40; 
        }
      }
      
      vehicleAdms.set(vehicle.id, dynamicAdm);

      const trackedServices = new Map();
      
      vehicleHistory.forEach(record => {
        record.service_record_items?.forEach((item: any) => {
          let catalogData = item.service_catalog;
          if (Array.isArray(catalogData)) {
            catalogData = catalogData[0];
          }
          
          if (catalogData && catalogData.service_interval_km) {
            const serviceName = catalogData.service_name;
            if (!trackedServices.has(serviceName)) {
              trackedServices.set(serviceName, {
                date: new Date(record.service_date),
                mileageAtService: Number(record.mileage_at_service) || 0,
                interval: Number(catalogData.service_interval_km)
              });
            }
          }
        });
      });

      const diagnosticList: any[] = [];

      trackedServices.forEach((data, serviceName) => {
        const knownDistanceDriven = Math.max(0, (Number(vehicle.current_mileage) || 0) - data.mileageAtService);
        const daysSinceLastShopVisit = Math.max(0, Math.ceil((today.getTime() - latestShopVisitDate.getTime()) / (1000 * 60 * 60 * 24)));
        const estimatedGhostMiles = daysSinceLastShopVisit * dynamicAdm;
        const totalDistance = knownDistanceDriven + estimatedGhostMiles;

        diagnosticList.push({
          name: serviceName,
          distance: totalDistance,
          interval: data.interval
        });

        if (totalDistance >= data.interval) {
          alerts.push({
            id: vehicle.id,
            vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            message: `Due for ${serviceName}. (Distance since job: ${Math.round(totalDistance).toLocaleString()} km / Interval: ${data.interval.toLocaleString()} km)`,
            type: 'warning'
          });
        }
      });

      vehicleDiagnostics.set(vehicle.id, diagnosticList);
    });
  }

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Garage</h1>
            <p className="text-slate-500 mt-1">Manage your vehicles and track maintenance.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/profile" className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md shadow-sm transition-colors font-medium text-sm">Shop Profile</Link>
            <Link href="/dashboard/customers" className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md shadow-sm transition-colors font-medium text-sm">Customers</Link>
            <Link href="/dashboard/catalog" className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md shadow-sm transition-colors font-medium text-sm">Service Catalog</Link>
            <Link href="/dashboard/add-vehicle" className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-md shadow-sm transition-colors font-medium text-sm whitespace-nowrap">+ Add Vehicle</Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-end pb-2 border-b border-slate-200 gap-4">
              <h2 className="text-xl font-semibold text-slate-800">Active Vehicles</h2>
              
              <form method="GET" action="/dashboard" className="flex w-full sm:w-auto gap-2">
                <input
                  type="search"
                  name="search"
                  defaultValue={searchQuery}
                  placeholder="Search make, model, or owner..."
                  className="w-full sm:w-64 rounded-md px-3 py-1.5 border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-600 outline-none text-sm"
                />
                <button type="submit" className="bg-slate-900 hover:bg-black text-white px-4 py-1.5 rounded-md font-medium text-sm transition-colors shadow-sm">
                  Search
                </button>
                {searchQuery && (
                  <Link href="/dashboard" className="bg-stone-200 hover:bg-stone-300 text-slate-700 px-3 py-1.5 rounded-md font-medium text-sm transition-colors flex items-center shadow-sm">
                    Clear
                  </Link>
                )}
              </form>
            </div>
            
            {!displayVehicles || displayVehicles.length === 0 ? (
              <div className="bg-white p-8 text-center rounded-xl border border-slate-200 shadow-sm">
                <p className="text-slate-500 mb-4">
                  {searchQuery ? `No vehicles found matching "${searchQuery}".` : "You don't have any vehicles in your garage yet."}
                </p>
                {searchQuery && (
                  <Link href="/dashboard" className="text-emerald-700 font-medium text-sm hover:underline">
                    Clear Search
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayVehicles.map((vehicle) => {
                  const calculatedAdm = vehicleAdms.get(vehicle.id) || 40;
                  const historyCount = fullServiceHistory?.filter(r => r.vehicle_id === vehicle.id).length || 0;
                  
                  return (
                  <div key={vehicle.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">
                        {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim && <span className="text-slate-500 text-sm font-normal">({vehicle.trim})</span>}
                      </h3>
                      
                      <div className="mt-3 space-y-1">
                        {vehicle.customers && (
                          <p className="text-slate-600 text-sm">
                            <span className="font-medium text-slate-500">Owner:</span> {vehicle.customers.first_name || vehicle.customers.name || ''} {vehicle.customers.last_name || ''}
                          </p>
                        )}
                        <p className="text-slate-600 text-sm"><span className="font-medium text-slate-500">Current Mileage:</span> {vehicle.current_mileage ? vehicle.current_mileage.toLocaleString() : 'Not tracked'} km</p>
                        <p className="text-slate-600 text-sm">
                          <span className="font-medium text-slate-500">Driving Velocity:</span> {historyCount >= 2 ? `${calculatedAdm} km/day` : '40 km/day (Default)'}
                        </p>
                      </div>

                      <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-md">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tracking HUD</p>
                        {vehicleDiagnostics.get(vehicle.id)?.length > 0 ? (
                          <ul className="space-y-1">
                            {vehicleDiagnostics.get(vehicle.id).map((diag: any, i: number) => (
                              <li key={i} className="text-xs flex justify-between">
                                <span className="text-slate-600 truncate mr-2">{diag.name}</span>
                                <span className={`whitespace-nowrap ${diag.distance >= diag.interval ? 'text-red-600 font-bold' : 'text-emerald-600 font-medium'}`}>
                                  {Math.round(diag.distance).toLocaleString()} / {diag.interval.toLocaleString()}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No intervals tracked yet.</p>
                        )}
                      </div>

                    </div>
                    <div className="mt-6 flex justify-between items-center border-t border-slate-100 pt-4">
                      <Link href={`/dashboard/vehicle/${vehicle.id}`} className="text-emerald-700 hover:text-emerald-900 text-sm font-medium">View Details &rarr;</Link>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>

          <div className="space-y-8">
            
            {alerts.length > 0 && (
              <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 text-amber-900">Needs Attention</h2>
                <ul className="space-y-4">
                  {alerts.map((alert, index) => (
                    <li key={index} className="text-sm border-b border-amber-200/50 pb-3 last:border-0 last:pb-0">
                      <p className="font-bold text-amber-900">{alert.vehicleName}</p>
                      <p className="text-amber-800 mt-1">{alert.message}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

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
                        {record.vehicles && !Array.isArray(record.vehicles) ? `${record.vehicles.make} ${record.vehicles.model}` : 'Unknown Vehicle'}
                        {' • '} 
                        {new Date(record.service_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
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