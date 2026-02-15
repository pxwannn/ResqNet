import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, LayersControl, Circle } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Internal component to handle map view changes
function ChangeMapView({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length === 2) {
      map.flyTo(coords, 12, { duration: 1.5 });
    }
  }, [coords, map]);
  return null;
}

// Internal map component - simplified with just city and circle
function MapComponent({ city, coordinates, onMapClick }) {
  const mapKey = coordinates ? coordinates.join(',') : 'default';

  return (
    <div 
      className="w-full h-full relative rounded-2xl shadow-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100"
      role="application"
      aria-label={`Map showing ${city} location`}
    >
      <MapContainer 
        key={mapKey} 
        center={coordinates || [20, 78]} 
        zoom={coordinates ? 12 : 4} 
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        onClick={onMapClick}
      >
        <ZoomControl position="bottomright" />
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Street">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution='&copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Dark">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        {/* City Marker with Circle */}
        {coordinates && (
          <>
            {/* City circle */}
            <Circle
              center={coordinates}
              radius={5000}
              pathOptions={{
                color: '#3B82F6',
                fillColor: '#3B82F6',
                fillOpacity: 0.1,
                weight: 2,
              }}
            />
            
            {/* City marker */}
            <Marker position={coordinates}>
              <Popup>
                <div className="text-center p-2">
                  <strong className="text-base font-semibold text-gray-900 block">{city}</strong>
                  <div className="text-xs text-gray-600 mt-1">
                    <div>Lat: {coordinates[0].toFixed(4)}</div>
                    <div>Lng: {coordinates[1].toFixed(4)}</div>
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}
        
        {coordinates && <ChangeMapView coords={coordinates} />}
      </MapContainer>

      {/* Simple Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg z-[1000] text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1.5"></div>
            <span className="text-gray-700">City Center</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 border-2 border-blue-500 rounded-full mr-1.5"></div>
            <span className="text-gray-700">City Area</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * --- MapDisplay Component ---
 * Wrapper for the map. Fetches coordinates dynamically if not available.
 */
export function MapDisplay({ city, coordinates, loading = false, onMapClick }) {
  const [coords, setCoords] = useState(coordinates);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);

  // Fetch coordinates if city changes and coordinates not provided
  useEffect(() => {
    const fetchCoordinates = async () => {
      if (!city) {
        setCoords(null);
        return;
      }

      // If coordinates are provided directly, use them
      if (coordinates) {
        setCoords(coordinates);
        return;
      }

      setFetching(true);
      setError(null);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(
          `http://localhost:5001/api/locate?city=${encodeURIComponent(city)}`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        const data = await res.json();
        
        if (res.ok && data.coordinates) {
          setCoords([data.coordinates.lat, data.coordinates.lon]);
        } else {
          setError(data.error || `Location not found for "${city}"`);
          setCoords(null);
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          setError('Request timed out');
        } else {
          setError('Failed to fetch location');
        }
        console.error("Error fetching coordinates:", err);
        setCoords(null);
      } finally {
        setFetching(false);
      }
    };

    fetchCoordinates();
  }, [city, coordinates]);

  // Show loading state
  if (fetching) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-white rounded-2xl shadow-lg">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Finding {city}...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full h-full min-h-[400px] rounded-2xl shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">📍</span>
          </div>
          <p className="text-gray-600 font-medium">{error}</p>
          <p className="text-xs text-gray-400 mt-2">Try another city name</p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!coords) {
    return (
      <div className="w-full h-full min-h-[400px] rounded-2xl shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">🗺️</span>
          </div>
          <p className="text-gray-600 font-medium">Select a city to view map</p>
          <p className="text-xs text-gray-400 mt-2">Search for any city worldwide</p>
        </div>
      </div>
    );
  }

  return (
    <MapComponent 
      city={city} 
      coordinates={coords} 
      onMapClick={onMapClick}
    />
  );
}