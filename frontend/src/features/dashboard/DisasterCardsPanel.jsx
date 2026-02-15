import React, { useState, useEffect } from 'react';
import { AlertTriangle, CloudRain, Wind, Thermometer, Volume2, VolumeX } from 'lucide-react';

const disasterConfig = {
  Flood: { 
    icon: CloudRain, 
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-100'
  },
  Cyclone: { 
    icon: Wind, 
    color: 'green',
    gradient: 'from-green-500 to-emerald-500',
    bgGradient: 'from-green-50 to-emerald-100'
  },
  Earthquake: { 
    icon: Thermometer, 
    color: 'orange',
    gradient: 'from-orange-500 to-red-500',
    bgGradient: 'from-orange-50 to-red-100'
  }
};

export function DisasterCardsPanel({ loading, error, data, onCardClick }) {
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [announcedCards, setAnnouncedCards] = useState(new Set());

  // Text-to-speech functionality
  const speakCardContent = (disasterType, disasterData) => {
    if (!speechEnabled) return;
    
    const speech = new SpeechSynthesisUtterance();
    speech.text = `${disasterType} alert: ${disasterData.prediction}. Current value: ${disasterData.value}. ${disasterData.details}`;
    speech.rate = 0.9;
    speech.pitch = 1;
    window.speechSynthesis.speak(speech);
  };

  // Auto-announce new high-risk cards
  useEffect(() => {
    if (data && speechEnabled) {
      Object.entries(data).forEach(([disasterType, disasterData]) => {
        if (disasterData.prediction === 'High Risk' && !announcedCards.has(disasterType)) {
          speakCardContent(disasterType, disasterData);
          setAnnouncedCards(prev => new Set(prev).add(disasterType));
        }
      });
    }
  }, [data, speechEnabled, announcedCards]);

  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading disaster predictions">
        {[1, 2, 3].map(i => (
          <div 
            key={i} 
            className="bg-white rounded-xl shadow-md p-4 skeleton border border-gray-100"
          >
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 shadow-md"
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800 text-sm">Warning</h3>
            <p className="text-yellow-700 text-xs">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div 
        className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-6 text-center shadow-md"
        role="status"
      >
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-xl">📊</span>
        </div>
        <p className="text-gray-600 font-medium text-sm">No prediction data</p>
        <p className="text-xs text-gray-500 mt-1">Select a city to view</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" role="region" aria-label="Disaster predictions">
      {/* Speech Controls - Compact with colors */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 shadow-sm border border-blue-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-blue-700">🔊 Screen Reader</span>
          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`p-1.5 rounded-lg transition-all ${
              speechEnabled 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            aria-label={speechEnabled ? "Disable audio alerts" : "Enable audio alerts"}
          >
            {speechEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Disaster Cards - Compact with full colors */}
      {Object.entries(data).map(([disasterType, disasterData]) => {
        const { icon: Icon, gradient, bgGradient } = disasterConfig[disasterType] || { 
          icon: AlertTriangle, 
          gradient: 'from-gray-500 to-gray-700',
          bgGradient: 'from-gray-50 to-gray-100'
        };
        
        const riskConfig = {
          'Low Risk': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
          'Medium Risk': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
          'High Risk': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' }
        }[disasterData.prediction] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' };

        return (
          <div
            key={disasterType}
            onClick={() => {
              onCardClick(disasterType);
              speakCardContent(disasterType, disasterData);
            }}
            className={`
              bg-gradient-to-br ${bgGradient} rounded-xl shadow-md p-4 cursor-pointer 
              hover:shadow-lg border-2 ${riskConfig.border} transition-all
              focus:outline-none focus:ring-2 focus:ring-blue-500
            `}
            role="button"
            tabIndex={0}
            aria-label={`${disasterType}: ${disasterData.prediction}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onCardClick(disasterType);
                speakCardContent(disasterType, disasterData);
              }
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${gradient} shadow-md flex-shrink-0`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{disasterData.title}</h3>
                  <p className="text-xs text-gray-600">Real-time monitoring</p>
                </div>
              </div>
              {/* FIXED: Risk badge with proper centering */}
              <span className={`
                inline-flex items-center justify-center
    px-3 py-1 rounded-full text-xs font-bold shadow-sm
    whitespace-nowrap leading-none
                ${riskConfig.bg} ${riskConfig.text} border ${riskConfig.border}
                leading-none
              `}>
                {disasterData.prediction}
              </span>
            </div>
            
            <div className="flex items-end justify-between mt-3">
              <div>
                <p className="text-2xl font-bold text-gray-900">{disasterData.value}</p>
                <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">{disasterData.details}</p>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-500 font-medium">LIVE</span>
              </div>
            </div>

            {/* Colored progress bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${
                    disasterData.prediction === 'Low Risk' ? 'bg-green-500' :
                    disasterData.prediction === 'Medium Risk' ? 'bg-yellow-500' :
                    disasterData.prediction === 'High Risk' ? 'bg-red-500' : 'bg-gray-500'
                  }`}
                  style={{
                    width: `${
                      disasterData.prediction === 'Low Risk' ? '33%' :
                      disasterData.prediction === 'Medium Risk' ? '66%' : '100%'
                    }`
                  }}
                ></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}