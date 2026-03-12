import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import ServiceForm from './ServiceForm';

export default async function AddService({
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

  // Fetch the user's catalog to pass to the dropdown
  const { data: catalogItems } = await supabase
    .from('service_catalog')
    .select('*')
    .order('service_name', { ascending: true });

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <Link href={`/dashboard/vehicle/${id}`} className="text-emerald-700 hover:text-emerald-900 text-sm font-medium mb-4 inline-block">
            &larr; Back to Vehicle Profile
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Log Service</h1>
          <p className="text-slate-500 mt-1">Select a service from your catalog to log maintenance and generate an invoice.</p>
        </header>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          {/* We pass the vehicle ID and the SKUs down to the interactive client form */}
          <ServiceForm vehicleId={id} catalogItems={catalogItems || []} />
        </div>
      </div>
    </div>
  );
}