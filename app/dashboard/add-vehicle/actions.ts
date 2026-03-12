'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export async function addVehicleAction(formData: FormData) {
  const supabaseAction = await createClient();
  const { data: { user } } = await supabaseAction.auth.getUser();
  if (!user) return;

  const year = parseInt(formData.get('year') as string);
  const make = formData.get('make') as string;
  const model = formData.get('model') as string;
  const trim = formData.get('trim') as string;
  const mileage = formData.get('mileage') ? parseInt(formData.get('mileage') as string) : null;
  const customerId = formData.get('customerId') as string;
  
  // Grab the VIN from the form
  const vin = formData.get('vin') as string;

  const { error } = await supabaseAction
    .from('vehicles')
    .insert([
      {
        user_id: user.id,
        customer_id: customerId ? customerId : null,
        year: year,
        make: make,
        model: model,
        trim: trim || null,
        current_mileage: mileage,
        vin: vin || null, // Save it to the new column!
      }
    ]);

  if (!error) {
    redirect('/dashboard');
  } else {
    console.error('Error adding vehicle:', error);
  }
}