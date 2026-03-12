import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-8 text-stone-800 font-sans">
      <main className="max-w-2xl text-center space-y-8">
        
        {/* Hero Section */}
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-stone-900">
          Welcome to the Garage
        </h1>
        
        <p className="text-lg text-stone-600 leading-relaxed">
          A simple, reliable place to keep track of maintenance for your cars, trucks, and family vehicles. 
          Whether you are logging a quick oil change or keeping detailed records for the whole driveway, 
          everything you need is right here.
        </p>
        
        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <Link 
            href="/login" 
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-sm"
          >
            Log In
          </Link>
          <Link 
            href="/dashboard" 
            className="bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 px-8 py-3 rounded-lg font-medium transition-colors shadow-sm"
          >
            Preview Dashboard
          </Link>
        </div>

      </main>
    </div>
  );
}