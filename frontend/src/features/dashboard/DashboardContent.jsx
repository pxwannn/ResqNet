import React, { useState, useMemo, useEffect } from "react";
import { CitySelector } from "./CitySelector";
import { MapDisplay } from "./MapDisplay";
import { DisasterCardsPanel } from "./DisasterCardsPanel";
import { DisasterDetailsModal } from "./DisasterDetailsModal";
import { LeafletCSS } from "./LeafletCSS";
import {
  Settings,
  AlertCircle,
  Download,
  Share2,
  Train,
  TestTube,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// City coordinates for map display
const CITIES_COORDINATES = {
  Mumbai: [19.076, 72.8777],
  Chennai: [13.0827, 80.2707],
  Kolkata: [22.5726, 88.3639],
  Delhi: [28.7041, 77.1025],
  Tokyo: [35.6762, 139.6503],
};

export function DashboardContent() {
  const [selectedCity, setSelectedCity] = useState("Mumbai");
  const [selectedDisaster, setSelectedDisaster] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState(null);
  const [availableCities, setAvailableCities] = useState([]);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState("medium");
  const [disasters, setDisasters] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const navigate = useNavigate();

  const cityCoordinates = CITIES_COORDINATES[selectedCity];

  // Apply accessibility settings
  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
    document.documentElement.style.fontSize =
      fontSize === "small" ? "14px" : fontSize === "large" ? "18px" : "16px";
  }, [highContrast, fontSize]);

  // Simulate disaster data
  useEffect(() => {
    const mockDisasters = [
      {
        id: 1,
        position: [19.076, 72.8777],
        type: "Earthquake",
        intensity: 7.2,
        timestamp: new Date(),
        confirmed: true,
      },
      {
        id: 2,
        position: [28.7041, 77.1025],
        type: "Flood",
        intensity: 4.5,
        timestamp: new Date(),
        confirmed: false,
      },
      {
        id: 3,
        position: [13.0827, 80.2707],
        type: "Cyclone",
        intensity: 8.1,
        timestamp: new Date(),
        confirmed: true,
      },
    ];
    setDisasters(mockDisasters);
  }, [selectedCity]);

  // Fetch available cities on component mount
  useEffect(() => {
    const fetchAvailableCities = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/cities");
        if (response.ok) {
          const citiesData = await response.json();
          setAvailableCities(citiesData.map((city) => city.name));
        } else {
          setAvailableCities(Object.keys(CITIES_COORDINATES));
        }
      } catch (err) {
        setAvailableCities(Object.keys(CITIES_COORDINATES));
      }
    };
    fetchAvailableCities();
  }, []);

  // Fetch prediction data when selectedCity changes
  useEffect(() => {
    const fetchPredictionData = async () => {
      if (!selectedCity) return;

      setLoading(true);
      setError(null);
      setPredictionData(null);

      try {
        const response = await fetch(
          `http://localhost:5001/api/predict?city=${encodeURIComponent(selectedCity)}`,
        );

        if (!response.ok) {
          throw new Error(
            `Models not trained for ${selectedCity}. Please train models first.`,
          );
        }

        const data = await response.json();

        if (data.error) throw new Error(data.error);
        if (data && data.Flood && data.Cyclone && data.Earthquake) {
          setPredictionData(data);

          // 🔥 AUTO ALERT SYSTEM - Check each disaster type
          console.log(`\n🔍 AUTO ALERT CHECK FOR ${selectedCity}...`);

          Object.entries(data).forEach(([disasterType, disasterData]) => {
            const riskLevel = disasterData.prediction;

            console.log(`   📊 ${disasterType}: ${riskLevel}`);

            if (riskLevel === "Low Risk") {
              console.log(`   ✅ ${disasterType}: Low risk - no alerts needed`);
              return;
            }

            // Medium or High Risk - Trigger alerts
            console.log(
              `   ⚠️ ${riskLevel} detected! Fetching subscribers for ${selectedCity}...`,
            );

            // Import and trigger the alert system
            import("../../services/twilioService")
              .then(({ checkAndSendAlerts }) => {
                checkAndSendAlerts(
                  { [disasterType]: disasterData },
                  selectedCity,
                );
              })
              .catch((err) => {
                console.error(`   ❌ Failed to trigger alerts:`, err.message);
              });
          });
          console.log(`✅ Alert check completed for ${selectedCity}\n`);

          // Check for UI alerts (existing code)
          const highRiskDisasters = Object.entries(data).filter(
            ([_, disasterData]) => disasterData.prediction === "High Risk",
          );

          if (highRiskDisasters.length > 0) {
            const newAlerts = highRiskDisasters.map(([type, data]) => ({
              id: Date.now() + Math.random(),
              type,
              message: `High risk ${type.toLowerCase()} detected in ${selectedCity}`,
              timestamp: new Date(),
              severity: "high",
            }));
            setAlerts((prev) => [...newAlerts, ...prev]);
          }
        } else {
          throw new Error(`Invalid data format for ${selectedCity}`);
        }
      } catch (err) {
        setError(err.message);
        setPredictionData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictionData();
  }, [selectedCity]);

  const handleCityChange = (city) => {
    setSelectedCity(city);
    setSelectedDisaster(null);
  };

  const handleCardClick = (disasterType) => setSelectedDisaster(disasterType);
  const handleModalClose = () => setSelectedDisaster(null);

  const handleTrainModels = async (city) => {
    const cityToTrain = city || selectedCity;
    setTraining(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5001/api/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: cityToTrain, years: 15 }),
      });

      const result = await response.json();
      if (response.ok) {
        const predictResponse = await fetch(
          `http://localhost:5001/api/predict?city=${encodeURIComponent(selectedCity)}`,
        );
        if (predictResponse.ok) {
          const newData = await predictResponse.json();
          setPredictionData(newData);
        }
      } else {
        throw new Error(result.error || "Training failed");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setTraining(false);
    }
  };

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    console.log("Map clicked at:", lat, lng);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(predictionData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `disaster-predictions-${selectedCity}-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const removeAlert = (alertId) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 ${highContrast ? "high-contrast" : ""}`}
    >
      <LeafletCSS />

      {/* Skip Link for Keyboard Users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Alert Notifications */}
      {alerts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md w-[calc(100%-2rem)] sm:w-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-red-500 text-white p-3 sm:p-4 rounded-xl shadow-2xl border-l-4 border-red-700 animate-slide-in-right"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0 animate-pulse" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm sm:text-base">
                      {alert.type} ALERT
                    </p>
                    <p className="text-xs sm:text-sm opacity-90">
                      {alert.message}
                    </p>
                    <p className="text-xs opacity-75 mt-1">
                      {alert.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeAlert(alert.id)}
                  className="text-white hover:text-red-200 transition-colors p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className="container max-w-7xl mx-auto space-y-4 sm:space-y-6 p-3 sm:p-4"
        id="main-content"
      >
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 border-2 border-white/20">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Disaster Prediction Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Real-time risk assessment and emergency preparedness
              </p>
            </div>

            <div className="flex flex-wrap gap-2 items-center w-full lg:w-auto">
              {/* Navigation */}
              <button
                onClick={() => navigate("/testing")}
                className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl text-sm sm:text-base transition-all shadow-lg hover:shadow-xl flex-1 sm:flex-none"
              >
                <TestTube className="h-4 w-4" />
                <span className="sm:inline">Test</span>
              </button>

              {/* Accessibility Controls */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 flex-1 sm:flex-none">
                
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className="bg-white rounded-lg sm:rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border-0 focus:ring-2 focus:ring-blue-500"
                  aria-label="Font size"
                >
                  <option value="small">A-</option>
                  <option value="medium">A</option>
                  <option value="large">A+</option>
                </select>
              </div>

              {/* Action Buttons */}
              {predictionData && (
                <div className="flex gap-2 flex-1 sm:flex-none">
                  <button
                    onClick={exportData}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl text-sm sm:text-base transition-all shadow-lg hover:shadow-xl flex-1 sm:flex-none"
                    aria-label="Export prediction data"
                  >
                    <Download className="h-4 w-4" />
                    <span className="sm:inline">Export</span>
                  </button>
                  <button
                    onClick={() =>
                      navigator.share?.({
                        title: `Disaster Predictions for ${selectedCity}`,
                        text: `Check out disaster predictions for ${selectedCity}`,
                        url: window.location.href,
                      })
                    }
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl text-sm sm:text-base transition-all shadow-lg hover:shadow-xl flex-1 sm:flex-none"
                    aria-label="Share predictions"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="sm:inline">Share</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Control Bar */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="w-full lg:w-auto">
            <CitySelector
              selectedCity={selectedCity}
              onCityChange={handleCityChange}
              disabled={loading || training}
              cities={availableCities}
            />
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
            {!loading && !predictionData && !training && (
              <button
                onClick={() => handleTrainModels()}
                className="w-full lg:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 focus-ring text-sm sm:text-base"
              >
                <Train className="h-4 w-4" />
                <span className="truncate">
                  Train Models for {selectedCity}
                </span>
              </button>
            )}

            {training && (
              <div className="w-full lg:w-auto flex items-center justify-center gap-2 bg-blue-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-semibold shadow-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Training...</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div
            className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg animate-fade-in"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0 animate-pulse" />
                <div>
                  <h3 className="font-semibold text-red-800 text-sm sm:text-base">
                    Attention Required
                  </h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
              {error.includes("not trained") && (
                <button
                  onClick={() => handleTrainModels()}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-sm font-medium transition-colors focus-ring w-full sm:w-auto"
                >
                  Train Now
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Map Section */}
          <div className="xl:col-span-2">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl p-3 sm:p-4 lg:p-6 border-2 border-white/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Location:{" "}
                  <span className="text-blue-600">{selectedCity}</span>
                </h2>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Real-time tracking</span>
                </div>
              </div>

              {/* FIXED: Remove h-full, use exact height without flex */}
              <div
                style={{ height: "400px" }}
                className="w-full sm:h-[450px] lg:h-[500px]"
              >
                <MapDisplay
                  city={selectedCity}
                  coordinates={cityCoordinates}
                  loading={loading}
                  disasters={disasters}
                  onMapClick={handleMapClick}
                />
              </div>
            </div>
          </div>

          {/* Disaster Cards Section */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl p-3 sm:p-4 lg:p-6 border-2 border-white/20">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                Risk Assessment
              </h2>
              <DisasterCardsPanel
                loading={loading}
                error={error}
                data={predictionData}
                onCardClick={handleCardClick}
              />
            </div>
          </div>
        </div>

        {/* Quick Stats Footer */}
        {predictionData && (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 border-2 border-white/20">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
              <div className="text-center p-2">
                <div className="text-xl sm:text-2xl font-bold text-red-600 mb-1">
                  {
                    Object.values(predictionData).filter(
                      (d) => d.prediction === "High Risk",
                    ).length
                  }
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  High Risk
                </div>
              </div>
              <div className="text-center p-2">
                <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">
                  {
                    Object.values(predictionData).filter(
                      (d) => d.prediction === "Low Risk",
                    ).length
                  }
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Safe</div>
              </div>
              <div className="text-center p-2">
                <div className="text-xl sm:text-2xl font-bold text-yellow-600 mb-1">
                  {
                    Object.values(predictionData).filter(
                      (d) => d.prediction === "Medium Risk",
                    ).length
                  }
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Warnings</div>
              </div>
              <div className="text-center p-2">
                <div className="text-xl sm:text-2xl font-bold text-purple-600 mb-1">
                  {Object.keys(predictionData).length}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Monitors</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedDisaster && predictionData && (
        <DisasterDetailsModal
          disaster={selectedDisaster}
          data={predictionData[selectedDisaster]}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
