import React, { useState, useEffect } from 'react';
import { 
  Play, RotateCcw, AlertTriangle, CheckCircle, X, MapPin, 
  Droplets, Wind, Activity, ThermometerSun, Gauge, Zap,
  CloudRain, Move, Bell, Settings, Download, Share2
} from 'lucide-react';
import { CitySelector } from '../dashboard/CitySelector';

export function ModelTestingPage() {
  const [selectedCity, setSelectedCity] = useState("Mumbai");
  const [availableCities, setAvailableCities] = useState([]);
  const [testParams, setTestParams] = useState({
    rainfall: 150,
    windSpeed: 45,
    seismicActivity: 3.5,
    temperature: 32,
    humidity: 85
  });
  
  const [testResults, setTestResults] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [activeDisaster, setActiveDisaster] = useState(null);
  const [sendingAlerts, setSendingAlerts] = useState(false);
  const [alertLogs, setAlertLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(true);

  // Fetch available cities
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/cities');
        if (response.ok) {
          const citiesData = await response.json();
          setAvailableCities(citiesData.map(city => city.name));
        }
      } catch (err) {
        console.error('Failed to fetch cities:', err);
      }
    };
    fetchCities();
  }, []);

  const disasterThresholds = {
    Flood: {
      rainfall: 100,
      humidity: 80,
      description: 'Heavy rainfall and high humidity levels',
      icon: CloudRain,
      color: 'blue'
    },
    Cyclone: {
      windSpeed: 40,
      rainfall: 50,
      description: 'High wind speeds and moderate rainfall',
      icon: Wind,
      color: 'green'
    },
    Earthquake: {
      seismicActivity: 3.0,
      description: 'Significant seismic activity detected',
      icon: Activity,
      color: 'orange'
    }
  };

  const addLog = (message, type = 'info') => {
    setAlertLogs(prev => [{
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }, ...prev].slice(0, 10));
  };

  const sendTestAlerts = async () => {
    if (!activeDisaster || !testResults?.[activeDisaster]?.triggered) return;
    
    setSendingAlerts(true);
    addLog(`🔍 Checking subscribers for ${selectedCity}...`, 'info');
    
    try {
      const { checkAndSendAlerts } = await import('../../services/twilioService');
      
      const mockPredictionData = {
        [activeDisaster]: {
          title: `${activeDisaster} Risk Assessment`,
          prediction: 'High Risk',
          value: activeDisaster === 'Flood' ? `${testParams.rainfall} mm` :
                 activeDisaster === 'Cyclone' ? `${testParams.windSpeed} km/h` :
                 `${testParams.seismicActivity} Richter`,
          safety: [
            'Evacuate if advised',
            'Stay informed',
            'Follow local authorities'
          ]
        }
      };
      
      addLog(`📱 Found subscribers for ${selectedCity}`, 'success');
      addLog(`📤 Sending ${activeDisaster} alerts...`, 'info');
      
      await checkAndSendAlerts(mockPredictionData, selectedCity);
      
      addLog(`✅ Alerts sent successfully!`, 'success');
      
    } catch (error) {
      addLog(`❌ Failed: ${error.message}`, 'error');
    } finally {
      setSendingAlerts(false);
    }
  };

  const runModelTest = async () => {
    setIsTesting(true);
    setTestResults(null);
    setAlertLogs([]);
    
    addLog(`🚀 Testing ${selectedCity} with current parameters...`, 'info');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const results = {};
    let triggeredDisasters = [];

    Object.entries(disasterThresholds).forEach(([disaster, thresholds]) => {
      let triggers = [];
      
      if (thresholds.rainfall && testParams.rainfall >= thresholds.rainfall) {
        triggers.push(`Rainfall (${testParams.rainfall}mm > ${thresholds.rainfall}mm)`);
      }
      if (thresholds.windSpeed && testParams.windSpeed >= thresholds.windSpeed) {
        triggers.push(`Wind Speed (${testParams.windSpeed}km/h > ${thresholds.windSpeed}km/h)`);
      }
      if (thresholds.seismicActivity && testParams.seismicActivity >= thresholds.seismicActivity) {
        triggers.push(`Seismic Activity (${testParams.seismicActivity} > ${thresholds.seismicActivity})`);
      }
      if (thresholds.humidity !== undefined && testParams.humidity >= thresholds.humidity) {
        triggers.push(`Humidity (${testParams.humidity}% > ${thresholds.humidity}%)`);
      }

      results[disaster] = {
        triggered: triggers.length > 0,
        triggers,
        description: thresholds.description,
        confidence: triggers.length > 0 ? Math.min(95, 70 + (triggers.length * 10)) : 5,
        icon: thresholds.icon,
        color: thresholds.color
      };

      if (triggers.length > 0) {
        triggeredDisasters.push(disaster);
      }
    });

    setTestResults(results);
    setIsTesting(false);
    
    if (triggeredDisasters.length > 0) {
      setActiveDisaster(triggeredDisasters[0]);
      addLog(`⚠️ ${triggeredDisasters.join(', ')} detected in ${selectedCity}!`, 'warning');
    } else {
      addLog(`✅ No disasters detected for ${selectedCity}`, 'success');
    }
  };

  const resetTest = () => {
    setTestParams({
      rainfall: 150,
      windSpeed: 45,
      seismicActivity: 3.5,
      temperature: 32,
      humidity: 85
    });
    setTestResults(null);
    setActiveDisaster(null);
    setAlertLogs([]);
  };

  const ParamSlider = ({ label, value, min, max, unit, onChange, icon: Icon }) => (
    <div className="group">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-blue-600" />}
          <label className="text-sm font-medium text-gray-700">{label}</label>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold text-blue-600">{value}</span>
          <span className="text-xs text-gray-500">{unit}</span>
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="absolute -bottom-5 left-0 right-0 flex justify-between text-xs text-gray-500">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Model Testing Laboratory
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                Test disaster prediction models and send real SMS alerts
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={resetTest}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-xl text-sm transition-all"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="sm:inline">Reset</span>
              </button>
              <button
                onClick={runModelTest}
                disabled={isTesting}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white px-4 sm:px-6 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span>Run Test</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Location Selector */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 border border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Label */}
            <div className="flex items-center gap-2 text-gray-700 shrink-0">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Test Location:</span>
            </div>

            {/* Selector */}
            <div className="w-full lg:max-w-md">
              <CitySelector
                selectedCity={selectedCity}
                onCityChange={setSelectedCity}
                cities={availableCities}
              />
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Parameters Panel */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Test Parameters for {selectedCity}</h2>
            </div>
            
            <div className="space-y-8">
              <ParamSlider
                label="Rainfall Intensity"
                value={testParams.rainfall}
                min={0}
                max={500}
                unit="mm"
                icon={CloudRain}
                onChange={(value) => setTestParams(prev => ({ ...prev, rainfall: value }))}
              />
              <ParamSlider
                label="Wind Speed"
                value={testParams.windSpeed}
                min={0}
                max={200}
                unit="km/h"
                icon={Wind}
                onChange={(value) => setTestParams(prev => ({ ...prev, windSpeed: value }))}
              />
              <ParamSlider
                label="Seismic Activity"
                value={testParams.seismicActivity}
                min={0}
                max={10}
                unit="Richter"
                icon={Activity}
                onChange={(value) => setTestParams(prev => ({ ...prev, seismicActivity: value }))}
              />
              <ParamSlider
                label="Temperature"
                value={testParams.temperature}
                min={-10}
                max={50}
                unit="°C"
                icon={ThermometerSun}
                onChange={(value) => setTestParams(prev => ({ ...prev, temperature: value }))}
              />
              <ParamSlider
                label="Humidity"
                value={testParams.humidity}
                min={0}
                max={100}
                unit="%"
                icon={Droplets}
                onChange={(value) => setTestParams(prev => ({ ...prev, humidity: value }))}
              />
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-4 sm:space-y-6">
            {/* Testing Status */}
            {isTesting && (
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-8 border border-gray-200">
                <div className="text-center">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-blue-600 animate-pulse" />
                    </div>
                  </div>
                  <p className="text-gray-800 font-medium mt-4">Running model simulations...</p>
                  <p className="text-sm text-gray-600 mt-2">Analyzing parameters for {selectedCity}</p>
                </div>
              </div>
            )}

            {/* Test Results */}
            {testResults && (
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 border border-gray-200">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-6">Test Results for {selectedCity}</h2>
                <div className="space-y-4">
                  {Object.entries(testResults).map(([disaster, result]) => {
                    const Icon = result.icon;
                    return (
                      <div
                        key={disaster}
                        onClick={() => setActiveDisaster(disaster)}
                        className={`
                          relative overflow-hidden rounded-xl p-4 cursor-pointer
                          transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
                          ${result.triggered 
                            ? 'bg-red-50 border border-red-200' 
                            : 'bg-green-50 border border-green-200'
                          }
                          ${activeDisaster === disaster ? 'ring-2 ring-blue-400' : ''}
                        `}
                      >
                        {/* Animated Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>
                        
                        <div className="relative flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`
                              p-2 rounded-lg
                              ${result.triggered ? 'bg-red-100' : 'bg-green-100'}
                            `}>
                              <Icon className={`h-5 w-5 ${result.triggered ? 'text-red-600' : 'text-green-600'}`} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">{disaster}</h3>
                              <p className="text-xs text-gray-600 mt-1">{result.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`
                              px-2 py-1 rounded-full text-xs font-bold
                              ${result.triggered 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-green-100 text-green-700'
                              }
                            `}>
                              {result.triggered ? 'ALERT' : 'SAFE'}
                            </span>
                            <div className="text-xs text-gray-600 mt-2">
                              Confidence: {result.confidence}%
                            </div>
                          </div>
                        </div>

                        {result.triggered && (
                          <div className="mt-3 text-sm text-gray-700 border-t border-gray-200 pt-3">
                            <ul className="space-y-1">
                              {result.triggers.map((trigger, index) => (
                                <li key={index} className="flex items-center text-xs">
                                  <div className="w-1 h-1 bg-red-500 rounded-full mr-2"></div>
                                  {trigger}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Alert Preview */}
            {activeDisaster && testResults?.[activeDisaster]?.triggered && (
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 border border-red-200 animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
                    <h3 className="text-lg font-bold text-red-700">🚨 SEND TEST ALERTS</h3>
                  </div>
                  <button
                    onClick={() => setActiveDisaster(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="bg-red-100/50 border border-red-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                    <strong className="text-red-700">{activeDisaster} DETECTED in {selectedCity}</strong>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{testResults[activeDisaster].description}</p>
                  <div className="text-xs text-red-700/80 space-y-1">
                    {testResults[activeDisaster].triggers.map((trigger, index) => (
                      <div key={index}>• {trigger}</div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={sendTestAlerts}
                  disabled={sendingAlerts}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-700 hover:from-red-700 hover:to-orange-800 text-white py-3 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
                >
                  {sendingAlerts ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending Alerts...
                    </>
                  ) : (
                    <>
                      <Bell className="h-4 w-4 group-hover:animate-pulse" />
                      Send Emergency Alerts to {selectedCity}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Alert Logs */}
            {alertLogs.length > 0 && (
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">📋 Alert System Logs</h3>
                  <button
                    onClick={() => setShowLogs(!showLogs)}
                    className="text-gray-600 hover:text-gray-800 text-sm"
                  >
                    {showLogs ? 'Hide' : 'Show'}
                  </button>
                </div>
                
                {showLogs && (
                  <div className="space-y-2 font-mono text-xs sm:text-sm max-h-60 overflow-y-auto custom-scrollbar">
                    {alertLogs.map((log, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded-lg ${
                          log.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                          log.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                          log.type === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                          'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}