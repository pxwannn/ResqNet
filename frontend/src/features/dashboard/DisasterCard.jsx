import React from 'react';

/**
 * --- DisasterCard Component ---
 * A summary card for a single disaster type.
 */
export function DisasterCard({ title, icon, prediction, value, onMoreInfoClick, riskLevel }) {
  // Define risk colors and border styles based on the prediction text
  const riskColors = {
    "Low Risk": "text-green-600",
    "Medium Risk": "text-yellow-600",
    "High Risk": "text-red-600",
    "No Threat": "text-blue-600",
  };
  const riskBorder = {
    "Low Risk": "border-l-4 border-green-600",
    "Medium Risk": "border-l-4 border-yellow-600",
    "High Risk": "border-l-4 border-red-600",
    "No Threat": "border-l-4 border-blue-600",
  };
  
  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden transition-all hover:shadow-xl ${riskBorder[prediction] || 'border-l-4 border-gray-400'}`}>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          {icon} {/* Render the icon passed as a prop */}
        </div>
        <p className={`text-2xl font-bold mt-2 ${riskColors[prediction] || 'text-gray-700'}`}>
          {prediction}
        </p>
        <p className="text-sm text-gray-500 font-medium">{value}</p>
        <button
          onClick={onMoreInfoClick}
          className="mt-4 w-full bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          More Info
        </button>
      </div>
    </div>
  );
}