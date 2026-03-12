'use client';

export default function DeleteButton() {
  return (
    <button 
      type="submit" 
      className="text-red-600 hover:text-red-800 font-medium"
      onClick={(e) => {
        if (!window.confirm('Are you sure you want to delete this record?')) {
          e.preventDefault(); // Stops the form from submitting if they click "Cancel"
        }
      }}
    >
      Delete
    </button>
  );
}