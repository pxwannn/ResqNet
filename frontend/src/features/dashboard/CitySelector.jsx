import React, { useState } from 'react';
import { MapPin, Search, Navigation } from 'lucide-react';

export function CitySelector({ selectedCity, onCityChange, disabled }) {
  const [inputValue, setInputValue] = useState(selectedCity || '');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState('');

  // Update input when selectedCity prop changes
  React.useEffect(() => {
    if (selectedCity && selectedCity !== inputValue) {
      setInputValue(selectedCity);
    }
  }, [selectedCity]);

  const handleSearch = async () => {
    if (!inputValue.trim()) return;
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`http://localhost:5001/api/locate?city=${encodeURIComponent(inputValue)}`);
      const data = await response.json();

      if (response.ok && data && data.coordinates) {
        const cityName = data.city || inputValue;
        onCityChange(cityName);
        
        localStorage.setItem('selectedCity', cityName);
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'selectedCity',
          newValue: cityName
        }));
      } else {
        throw new Error(data.error || 'City not found');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUseMyLocation = () => {
    setLocationLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocoding using OpenStreetMap Nominatim API
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          
          const data = await response.json();
          
          // Extract city/town/village name
          const cityName = data.address?.city || 
                          data.address?.town || 
                          data.address?.village || 
                          data.address?.county ||
                          'Unknown Location';
          
          // Clean up city name (remove "Mumbai" from "Mumbai, Maharashtra")
          const cleanCity = cityName.split(',')[0].trim();
          
          onCityChange(cleanCity);
          setInputValue(cleanCity);
          
          localStorage.setItem('selectedCity', cleanCity);
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'selectedCity',
            newValue: cleanCity
          }));
          
          // Show success message briefly
          setError(''); // Clear any previous error
          
        } catch (err) {
          setError('Failed to get location name. Please enter manually.');
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        // Handle geolocation errors
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setError('Location permission denied. Please enter city manually.');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setError('Location request timed out.');
            break;
          default:
            setError('An unknown error occurred.');
        }
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="h-4 w-4 text-gray-500" />
        <label htmlFor="city-input" className="text-sm font-medium text-gray-700">
          Select Location
        </label>
      </div>
      
      <div className="relative flex gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            id="city-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            disabled={disabled || locationLoading}
            placeholder="Enter city name..."
            className={`w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              disabled || locationLoading ? 'cursor-not-allowed bg-gray-100 opacity-70' : ''
            }`}
          />
          <MapPin className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <button
            onClick={handleSearch}
            disabled={loading || disabled || locationLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Search className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Current Location Button */}
        <button
          onClick={handleUseMyLocation}
          disabled={disabled || loading || locationLoading}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          title="Use my current location"
        >
          {locationLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span className="hidden sm:inline">Locating...</span>
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4" />
              <span className="hidden sm:inline">Current</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
          <span className="text-red-400">⚠</span> {error}
        </p>
      )}

      <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${selectedCity ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
        Currently selected: <span className="font-medium">{selectedCity || "Mumbai (default)"}</span>
      </div>
      
      {/* Instructions for screen readers */}
      <div className="sr-only">
        <p>You can type a city name and press Enter or click the search button. 
           You can also click the current location button to use your GPS location.</p>
      </div>
    </div>
  );
}