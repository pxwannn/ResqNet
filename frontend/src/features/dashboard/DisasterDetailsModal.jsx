import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { X, ShieldCheck } from 'lucide-react';

/**
 * --- TabButton Component (Internal) ---
 * Button used for switching tabs within the modal.
 */
const TabButton = ({ id, label, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`px-4 py-2 font-medium text-sm rounded-md ${
      activeTab === id ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {label}
  </button>
);

/**
 * --- DisasterDetailsModal Component ---
 * Modal window for displaying detailed disaster information, including graphs and safety tips.
 */
export function DisasterDetailsModal({ disaster, data, onClose }) {
  const [activeTab, setActiveTab] = useState('forecast'); // Default to forecast tab

  // Return null if no data is provided (safety check)
  if (!data) return null;
  
  // Define styles based on risk prediction
  const riskColors = { "Low Risk": "bg-green-100 text-green-800", "Medium Risk": "bg-yellow-100 text-yellow-800", "High Risk": "bg-red-100 text-red-800", "No Threat": "bg-blue-100 text-blue-800" };
  const riskFill = { "Low Risk": "#86efac", "Medium Risk": "#fde047", "High Risk": "#fca5a5", "No Threat": "#93c5fd" };
  const riskStroke = { "Low Risk": "#22c55e", "Medium Risk": "#eab308", "High Risk": "#ef4444", "No Threat": "#3b82f6" };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity animate-fade-in">
      {/* Modal Container */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-2xl font-bold text-gray-900">{data.title} Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-100">
            <X className="h-6 w-6" /> {/* Close button */}
          </button>
        </div>
        
        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto">
          {/* Current Status Section */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Current Status</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${riskColors[data.prediction] || 'bg-gray-100 text-gray-800'}`}>
              {data.prediction}
            </span>
          </div>
          <p className="text-gray-600 mb-6">{data.details}</p>

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="flex space-x-2">
              <TabButton id="forecast" label="7-Day Forecast" activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton id="safety" label="Safety Measures" activeTab={activeTab} setActiveTab={setActiveTab} />
            </nav>
          </div>

          {/* Tab Content Area */}
          <div className="min-h-[350px]">
            {/* Forecast Tab Content */}
            {activeTab === 'forecast' && (
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">{data.graphLabel} Forecast</h4>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <AreaChart data={data.graphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name={data.graphLabel}
                        stroke={riskStroke[data.prediction] || '#8884d8'}
                        fill={riskFill[data.prediction] || '#8884d8'}
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            
            {/* Safety Measures Tab Content */}
            {activeTab === 'safety' && (
              <div>
                 <h4 className="text-lg font-semibold text-gray-800 mb-4">Recommended Actions</h4>
                 <ul className="space-y-3">
                  {data.safety && data.safety.map((measure, index) => ( // Check if safety exists
                    <li key={index} className="flex items-start">
                      <ShieldCheck className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{measure}</span>
                    </li>
                  ))}
                 </ul>
                 {!data.safety || data.safety.length === 0 && (
                    <p className="text-gray-500">No specific safety measures provided.</p>
                 )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}