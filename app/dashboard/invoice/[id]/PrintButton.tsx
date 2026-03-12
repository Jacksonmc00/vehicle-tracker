'use client';

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 px-4 py-2 rounded-md shadow-sm font-medium transition-colors"
    >
      Print / Save PDF
    </button>
  );
}