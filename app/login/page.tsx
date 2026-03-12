import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  // Await the search parameters (Next.js 15 requirement)
  const { message } = await searchParams;

  const signIn = async (formData: FormData) => {
    'use server'
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return redirect('/login?message=Could not authenticate user')
    }
    return redirect('/dashboard')
  }

  const signUp = async (formData: FormData) => {
    'use server'
    const headersList = await headers()
    const origin = headersList.get('origin')
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) {
      return redirect('/login?message=Could not sign up user')
    }
    return redirect('/login?message=Check email to continue sign in process')
  }

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mt-20 mx-auto">
      <form className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
        
        {/* If there is a message in the URL, display it here! */}
        {message && (
          <div className="bg-stone-100 text-stone-800 p-4 rounded-md mb-6 text-center text-sm border border-stone-300">
            {message}
          </div>
        )}

        <label className="text-md" htmlFor="email">Email</label>
        <input 
          className="rounded-md px-4 py-2 bg-inherit border mb-6" 
          name="email" 
          placeholder="you@example.com" 
          required 
          autoComplete="email" 
        />
        
        <label className="text-md" htmlFor="password">Password</label>
        <input 
          className="rounded-md px-4 py-2 bg-inherit border mb-6" 
          type="password" 
          name="password" 
          placeholder="••••••••" 
          required 
          autoComplete="current-password" 
        />
        
        <button formAction={signIn} className="bg-emerald-700 text-white rounded-md px-4 py-2 mb-2 hover:bg-emerald-800 transition-colors">
          Sign In
        </button>
        <button formAction={signUp} className="border border-stone-300 rounded-md px-4 py-2 mb-2 hover:bg-stone-50 transition-colors">
          Sign Up
        </button>
      </form>
    </div>
  )
}