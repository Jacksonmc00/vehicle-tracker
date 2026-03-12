'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export async function logServiceAction(formData: FormData) {
  const supabaseAction = await createClient();
  const { data: { user } } = await supabaseAction.auth.getUser();
  if (!user) return;

  const vehicleId = formData.get('vehicleId') as string;
  const serviceDate = formData.get('serviceDate') as string;
  const mileage = formData.get('mileage') ? parseInt(formData.get('mileage') as string) : null;
  const totalCost = parseFloat(formData.get('totalCost') as string);
  const notes = formData.get('notes') as string;
  
  // Parse the JSON array of line items sent from our Client Component
  const lineItemsStr = formData.get('lineItems') as string;
  const lineItems = JSON.parse(lineItemsStr);

  // Combine the names of the selected SKUs
  const combinedServiceNames = lineItems.map((item: any) => item.name).join(', ');

  // Step 1: Create the base Service Record
  const { data: recordData, error: recordError } = await supabaseAction
    .from('service_records')
    .insert([{
      vehicle_id: vehicleId,
      service_date: serviceDate,
      service_type: combinedServiceNames,
      mileage_at_service: mileage,
      cost: totalCost,
      notes: notes || null,
    }])
    .select('id')
    .single();

  if (!recordError && recordData) {
    // Step 2: Loop through the multiple line items and link them
    const itemsToInsert = lineItems.map((item: any) => ({
      service_record_id: recordData.id,
      catalog_id: item.catalogId,
      user_id: user.id,
      unit_price: item.price,
    }));

    await supabaseAction
      .from('service_record_items')
      .insert(itemsToInsert);

    // --- NEW: Auto-Update Vehicle Mileage ---
    if (mileage) {
      // Fetch the vehicle's current master mileage
      const { data: vehicleData } = await supabaseAction
        .from('vehicles')
        .select('current_mileage')
        .eq('id', vehicleId)
        .single();

      // If the new service mileage is higher than the master record (or if master is blank), update it!
      if (vehicleData && (vehicleData.current_mileage === null || mileage > vehicleData.current_mileage)) {
        await supabaseAction
          .from('vehicles')
          .update({ current_mileage: mileage })
          .eq('id', vehicleId);
      }
    }
  }

  // Redirect back to the vehicle profile
  redirect(`/dashboard/vehicle/${vehicleId}`);
}