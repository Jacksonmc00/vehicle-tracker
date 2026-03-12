'use client';

import { useState } from 'react';
import { loginAction, signupAction } from './actions';
import { useSearchParams } from 'next/navigation';

export default function Login() {
  // A simple toggle to switch between Login and Sign Up views
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Grab URL parameters to display error or success messages
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-slate-200">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900">My Garage</h1>
          <p className="text-slate-500 mt-2">
            {isSignUp ? 'Create your shop account' : 'Welcome back'}
          </p>
        </div>

        {message && (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-md mb-6 text-sm text-center font-medium border border-emerald-200">
            {message}
          </div>
        )}

        <form action={isSignUp ? signupAction : loginAction} className="space-y-4">
          
          {/* These fields ONLY show up if the user is signing up */}
          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="fullName">Shop / Full Name *</label>
                <input type="text" id="fullName" name="fullName" required className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" placeholder="e.g. Russell Auto Repair" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="phone">Phone Number *</label>
                <input type="tel" id="phone" name="phone" required className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" placeholder="(555) 123-4567" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="address">Business Address *</label>
                <input type="text" id="address" name="address" required className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" placeholder="123 Main St, Russell, ON" />
              </div>
            </>
          )}

          {/* Standard Login Fields */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">Email Address *</label>
            <input type="email" id="email" name="email" required className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" placeholder="you@example.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">Password *</label>
            <input type="password" id="password" name="password" required className="w-full rounded-md px-4 py-2 border border-slate-300 bg-stone-50 focus:ring-2 focus:ring-emerald-600 outline-none" placeholder="••••••••" />
          </div>

          <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-medium px-4 py-3 rounded-md shadow-sm transition-colors mt-6">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500 border-t border-slate-100 pt-6">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            {isSignUp ? 'Log In' : 'Sign Up'}
          </button>
        </div>

      </div>
    </div>
  );
}