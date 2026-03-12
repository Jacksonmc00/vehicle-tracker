'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect('/login?message=Could not authenticate user');
  }

  return redirect('/dashboard');
}

export async function signupAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const phone = formData.get('phone') as string;
  const address = formData.get('address') as string;
  
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // This metadata is intercepted by our SQL Trigger to create the shop_profile!
      data: {
        full_name: fullName,
        phone_number: phone,
        address: address,
      }
    }
  });

  if (error) {
    return redirect('/login?message=Could not create account');
  }

  // Supabase requires email verification by default. 
  // We send them back to login with a success message.
  return redirect('/login?message=Check email to continue sign in process');
}