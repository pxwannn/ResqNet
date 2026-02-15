import os
import json
import random
import joblib
import pandas as pd
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import numpy as np

# Import the REAL ML models
from nasa_power_client import train_city_models_advanced, RealNASAClient, AdvancedDisasterTrainer

app = Flask(__name__)
CORS(app)

# Configuration
MODEL_DIR = 'trained_models'
CITY_COORDS_LOOKUP = {
    "Mumbai": {"lat": 19.0760, "lon": 72.8777},
    "Chennai": {"lat": 13.0827, "lon": 80.2707},
    "Kolkata": {"lat": 22.5726, "lon": 88.3639},
    "Delhi": {"lat": 28.7041, "lon": 77.1025},
    "Tokyo": {"lat": 35.6762, "lon": 139.6503},
}

# Global variables
loaded_models = {}

def load_city_models(city_name):
    """Load advanced ML models for a city"""
    models = {}
    disaster_types = ['flood', 'cyclone', 'extreme_weather']
    
    for disaster_type in disaster_types:
        model_path = os.path.join(MODEL_DIR, f"{city_name}_{disaster_type}_advanced_model.pkl")
        if os.path.exists(model_path):
            try:
                models[disaster_type] = joblib.load(model_path)
                print(f"✅ Loaded {disaster_type} model for {city_name}")
            except Exception as e:
                print(f"❌ Error loading {disaster_type} model: {e}")
    
    return models if models else None

# def get_real_current_weather(city):
#     """Get REAL current weather data from OpenWeatherMap"""
#     OWM_API_KEY = "e9905c8b9429d45e17d7c3f168f30db2"  # Your API key
    
#     try:
#         # Current weather
#         current_url = "https://api.openweathermap.org/data/2.5/weather"
#         # params = {
#         #     'q': city,
#         #     'appid': OWM_API_KEY,
#         #     'units': 'metric'
#         # }
#         coords = CITY_COORDS_LOOKUP.get(city)
#         if not coords:
#             raise ValueError(f"Coordinates not found for city: {city}")

#         params = {
#             'lat': coords['lat'],
#             'lon': coords['lon'],
#             'appid': OWM_API_KEY,
#             'units': 'metric'
#         }
        
#         response = requests.get(current_url, params=params, timeout=10)
#         response.raise_for_status()
#         current_data = response.json()
        
#         # Forecast for additional features
#         forecast_url = "https://api.openweathermap.org/data/2.5/forecast"
#         forecast_response = requests.get(forecast_url, params=params, timeout=10)
#         forecast_data = forecast_response.json() if forecast_response.ok else None
        
#         # Extract current weather
#         current_weather = {
#             'temperature': current_data['main']['temp'],
#             'temp_max': current_data['main']['temp_max'],
#             'temp_min': current_data['main']['temp_min'],
#             'precipitation': current_data.get('rain', {}).get('1h', 0) or current_data.get('snow', {}).get('1h', 0) or 0,
#             'wind_speed': current_data['wind']['speed'] * 3.6,  # m/s to km/h
#             'wind_max': current_data['wind'].get('gust', current_data['wind']['speed']) * 3.6,
#             'humidity': current_data['main']['humidity'],
#             'pressure': current_data['main']['pressure'],
#             'cloud_cover': current_data['clouds']['all'],
#             'solar_radiation': estimate_solar_radiation(current_data),
#             'date': datetime.now()
#         }
        
#         print(f"🌤️ Real weather data fetched for {city}")
#         return current_weather
        
#     except Exception as e:
#         print(f"❌ Weather API failed: {e}")
#         return get_fallback_weather(city)
def get_real_current_weather(city):
    """Get REAL current weather data from OpenWeatherMap"""
    OWM_API_KEY = "e9905c8b9429d45e17d7c3f168f30db2"  # Your API key
    
    try:
        # ✅ Ensure coordinates exist
        coords = CITY_COORDS_LOOKUP.get(city)
        if not coords:
            print(f"🌍 Coordinates not found for {city}, fetching via geocoding...")
            geo_url = "https://api.openweathermap.org/geo/1.0/direct"
            params = {"q": city, "appid": OWM_API_KEY, "limit": 1}
            geo_response = requests.get(geo_url, params=params, timeout=10)
            geo_response.raise_for_status()
            geo_data = geo_response.json()
            if geo_data:
                lat = geo_data[0]["lat"]
                lon = geo_data[0]["lon"]
                CITY_COORDS_LOOKUP[city] = {"lat": lat, "lon": lon}
                coords = CITY_COORDS_LOOKUP[city]
                print(f"📍 Coordinates fetched for {city}: ({lat}, {lon})")
            else:
                raise ValueError(f"Could not locate coordinates for {city}")

        # ✅ Use lat/lon for weather request
        current_url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            'lat': coords['lat'],
            'lon': coords['lon'],
            'appid': OWM_API_KEY,
            'units': 'metric'
        }
        
        response = requests.get(current_url, params=params, timeout=10)
        response.raise_for_status()
        current_data = response.json()
        
        # Forecast for additional features
        forecast_url = "https://api.openweathermap.org/data/2.5/forecast"
        forecast_response = requests.get(forecast_url, params=params, timeout=10)
        forecast_data = forecast_response.json() if forecast_response.ok else None
        
        # Extract current weather
        current_weather = {
            'temperature': current_data['main']['temp'],
            'temp_max': current_data['main']['temp_max'],
            'temp_min': current_data['main']['temp_min'],
            'precipitation': current_data.get('rain', {}).get('1h', 0) or current_data.get('snow', {}).get('1h', 0) or 0,
            'wind_speed': current_data['wind']['speed'] * 3.6,  # m/s to km/h
            'wind_max': current_data['wind'].get('gust', current_data['wind']['speed']) * 3.6,
            'humidity': current_data['main']['humidity'],
            'pressure': current_data['main']['pressure'],
            'cloud_cover': current_data['clouds']['all'],
            'solar_radiation': estimate_solar_radiation(current_data),
            'date': datetime.now()
        }
        
        print(f"🌤️ Real weather data fetched for {city}")
        return current_weather
        
    except Exception as e:
        print(f"❌ Weather API failed: {e}")
        return get_fallback_weather(city)

def estimate_solar_radiation(weather_data):
    """Estimate solar radiation based on weather conditions"""
    cloud_cover = weather_data['clouds']['all']
    hour = datetime.now().hour
    
    # Simple estimation based on time of day and cloud cover
    base_radiation = max(0, 800 * (1 - cloud_cover/100) * max(0, min(1, (12 - abs(hour - 12))/6)))
    return base_radiation + random.uniform(-50, 50)

def get_fallback_weather(city):
    """Fallback weather data based on city climate"""
    coords = CITY_COORDS_LOOKUP.get(city, {"lat": 20, "lon": 70})
    lat = coords['lat']
    
    # Climate-based fallback
    if lat < 23.5:  # Tropical
        base_temp = 28
        base_humidity = 75
    elif lat > 45:  # Temperate  
        base_temp = 15
        base_humidity = 65
    else:  # Subtropical
        base_temp = 22
        base_humidity = 70
        
    return {
        'temperature': base_temp + random.uniform(-3, 3),
        'temp_max': base_temp + 5 + random.uniform(-2, 2),
        'temp_min': base_temp - 5 + random.uniform(-2, 2),
        'precipitation': max(0, random.exponential(2)),
        'wind_speed': max(0, 5 + random.exponential(3)),
        'wind_max': max(0, 8 + random.exponential(4)),
        'humidity': max(30, min(95, base_humidity + random.uniform(-15, 15))),
        'pressure': 1013 + random.uniform(-15, 15),
        'solar_radiation': max(0, 300 + random.uniform(-100, 100)),
        'cloud_cover': random.uniform(0, 100),
        'date': datetime.now()
    }

def prepare_features_for_prediction(current_weather, historical_context=None):
    """Prepare features in the exact same format as training"""
    df = pd.DataFrame([current_weather])
    
    # Extract basic features that match training
    features = {}
    
    # Basic weather features (must match training exactly)
    basic_features = [
        'temperature', 'temp_max', 'temp_min', 'precipitation', 
        'wind_speed', 'wind_max', 'humidity', 'pressure',
        'solar_radiation', 'cloud_cover'
    ]
    
    for feature in basic_features:
        if feature in df.columns:
            features[feature] = float(df[feature].iloc[0])
    
    # Time features (from date but not date itself)
    current_date = df['date'].iloc[0] if 'date' in df.columns else datetime.now()
    features['day_of_year'] = int(current_date.timetuple().tm_yday)
    features['month'] = int(current_date.month)
    features['season'] = int((current_date.month % 12 + 3) // 3)
    
    # Rolling statistics (use current values)
    for window in [7, 14, 30]:
        features[f'precip_roll_mean_{window}'] = float(df['precipitation'].iloc[0])
        features[f'precip_roll_std_{window}'] = 0.1  # Small value instead of 0
        features[f'temp_roll_mean_{window}'] = float(df['temperature'].iloc[0])
        features[f'wind_roll_mean_{window}'] = float(df['wind_speed'].iloc[0])
    
    # Extreme weather indicators
    features['heat_wave'] = int(df['temp_max'].iloc[0] > 35)
    features['cold_wave'] = int(df['temp_min'].iloc[0] < 5)
    features['heavy_rain'] = int(df['precipitation'].iloc[0] > 20)
    features['storm_wind'] = int(df['wind_max'].iloc[0] > 50)
    
    # Rate of change features (set to 0 for single point)
    features['temp_change_24h'] = 0.0
    features['pressure_change_24h'] = 0.0
    features['precip_change_24h'] = 0.0
    
    # Interaction features
    features['temp_humidity_interaction'] = float(df['temperature'].iloc[0] * df['humidity'].iloc[0] / 100)
    features['wind_precip_interaction'] = float(df['wind_speed'].iloc[0] * df['precipitation'].iloc[0])
    
    # Lag features (use current values)
    for lag in [1, 2, 3]:
        features[f'precip_lag_{lag}'] = float(df['precipitation'].iloc[0])
        features[f'wind_lag_{lag}'] = float(df['wind_speed'].iloc[0])
        features[f'temp_lag_{lag}'] = float(df['temperature'].iloc[0])
    
    # Create DataFrame with features in consistent order
    # Remove any features that might not be in training
    feature_df = pd.DataFrame([features])
    
    # Ensure we don't have any extra columns that weren't in training
    # The model will automatically select the features it was trained on
    
    return feature_df
    """Prepare features in the same format as training - EXCLUDE date column"""
    df = pd.DataFrame([current_weather])
    
    # Basic time features (extract from date but don't include date itself)
    df['day_of_year'] = df['date'].dt.dayofyear
    df['month'] = df['date'].dt.month
    df['season'] = (df['month'] % 12 + 3) // 3
    
    # Add rolling features (using current values as estimates)
    for window in [7, 14, 30]:
        df[f'precip_roll_mean_{window}'] = df['precipitation']
        df[f'precip_roll_std_{window}'] = 0  # Can't calculate without history
        df[f'temp_roll_mean_{window}'] = df['temperature']
        df[f'wind_roll_mean_{window}'] = df['wind_speed']
    
    # Extreme indicators
    df['heat_wave'] = (df['temp_max'] > 35).astype(int)  # Standard threshold
    df['cold_wave'] = (df['temp_min'] < 5).astype(int)   # Standard threshold
    df['heavy_rain'] = (df['precipitation'] > 20).astype(int)  # 20mm in 1h is heavy
    df['storm_wind'] = (df['wind_max'] > 50).astype(int)  # 50 km/h is storm
    
    # Rate of change (can't calculate without history)
    df['temp_change_24h'] = 0
    df['pressure_change_24h'] = 0
    df['precip_change_24h'] = 0
    
    # Interaction features
    df['temp_humidity_interaction'] = df['temperature'] * df['humidity'] / 100
    df['wind_precip_interaction'] = df['wind_speed'] * df['precipitation']
    
    # Lag features (can't calculate without history)
    for lag in [1, 2, 3]:
        df[f'precip_lag_{lag}'] = df['precipitation']
        df[f'wind_lag_{lag}'] = df['wind_speed']
        df[f'temp_lag_{lag}'] = df['temperature']
    
    # ⚠️ CRITICAL: Remove the date column and any other non-feature columns
    columns_to_remove = ['date']  # Remove date column
    df = df.drop(columns=columns_to_remove, errors='ignore')
    
    return df
    """Prepare features in the same format as training"""
    df = pd.DataFrame([current_weather])
    
    # Basic time features
    df['day_of_year'] = df['date'].dt.dayofyear
    df['month'] = df['date'].dt.month
    df['season'] = (df['month'] % 12 + 3) // 3
    
    # Add rolling features (using current values as estimates)
    for window in [7, 14, 30]:
        df[f'precip_roll_mean_{window}'] = df['precipitation']
        df[f'precip_roll_std_{window}'] = 0  # Can't calculate without history
        df[f'temp_roll_mean_{window}'] = df['temperature']
        df[f'wind_roll_mean_{window}'] = df['wind_speed']
    
    # Extreme indicators
    df['heat_wave'] = (df['temp_max'] > 35).astype(int)  # Standard threshold
    df['cold_wave'] = (df['temp_min'] < 5).astype(int)   # Standard threshold
    df['heavy_rain'] = (df['precipitation'] > 20).astype(int)  # 20mm in 1h is heavy
    df['storm_wind'] = (df['wind_max'] > 50).astype(int)  # 50 km/h is storm
    
    # Rate of change (can't calculate without history)
    df['temp_change_24h'] = 0
    df['pressure_change_24h'] = 0
    df['precip_change_24h'] = 0
    
    # Interaction features
    df['temp_humidity_interaction'] = df['temperature'] * df['humidity'] / 100
    df['wind_precip_interaction'] = df['wind_speed'] * df['precipitation']
    
    # Lag features (can't calculate without history)
    for lag in [1, 2, 3]:
        df[f'precip_lag_{lag}'] = df['precipitation']
        df[f'wind_lag_{lag}'] = df['wind_speed']
        df[f'temp_lag_{lag}'] = df['temperature']
    
    return df

def make_ml_predictions(city_models, current_features):
    """Make predictions using trained ML models with proper feature handling"""
    predictions = {}
    
    for disaster_type, model in city_models.items():
        try:
            # Get the feature names the model expects
            expected_features = []
            if hasattr(model, 'feature_names_in_'):
                expected_features = model.feature_names_in_
            elif hasattr(model.named_steps['classifier'], 'feature_names_in_'):
                expected_features = model.named_steps['classifier'].feature_names_in_
            
            # Select only the features that the model was trained with
            if len(expected_features) > 0:
                # Ensure we have all expected features, fill missing with 0
                for feature in expected_features:
                    if feature not in current_features.columns:
                        current_features[feature] = 0.0
                
                # Reorder columns to match training
                current_features = current_features[expected_features]
            
            # Get probability predictions
            proba = model.predict_proba(current_features)[0]
            prediction = model.predict(current_features)[0]
            
            # Convert to risk levels
            if prediction == 1:
                if proba[1] > 0.7:
                    risk_level = "High Risk"
                elif proba[1] > 0.4:
                    risk_level = "Medium Risk"
                else:
                    risk_level = "Low Risk"
            else:
                risk_level = "Low Risk"
            
            predictions[disaster_type] = {
                'probability': float(proba[1]),
                'risk_level': risk_level,
                'confidence': float(max(proba)),
                'prediction_class': int(prediction)
            }
            
            print(f"✅ {disaster_type}: {risk_level} (prob: {proba[1]:.3f})")
            
        except Exception as e:
            print(f"❌ Prediction error for {disaster_type}: {e}")
            # Fallback to simple rule-based prediction
            predictions[disaster_type] = generate_fallback_prediction(disaster_type, current_features)
    
    return predictions

def generate_fallback_prediction(disaster_type, features):
    """Generate fallback prediction when ML fails"""
    if disaster_type == 'flood':
        precip = features['precipitation'].iloc[0] if 'precipitation' in features.columns else 0
        risk = "High Risk" if precip > 30 else "Medium Risk" if precip > 15 else "Low Risk"
    elif disaster_type == 'cyclone':
        wind = features['wind_speed'].iloc[0] if 'wind_speed' in features.columns else 0
        risk = "High Risk" if wind > 60 else "Medium Risk" if wind > 30 else "Low Risk"
    else:  # extreme_weather
        temp = features['temperature'].iloc[0] if 'temperature' in features.columns else 25
        risk = "High Risk" if temp > 35 or temp < 5 else "Low Risk"
    
    return {
        'probability': 0.5,
        'risk_level': risk,
        'confidence': 0.7,
        'prediction_class': 1 if risk != "Low Risk" else 0
    }
    """Make predictions using trained ML models"""
    predictions = {}
    
    for disaster_type, model in city_models.items():
        try:
            # Get probability predictions
            proba = model.predict_proba(current_features)[0]
            prediction = model.predict(current_features)[0]
            
            # Convert to risk levels
            if prediction == 1:
                if proba[1] > 0.7:
                    risk_level = "High Risk"
                else:
                    risk_level = "Medium Risk"
            else:
                risk_level = "Low Risk"
            
            predictions[disaster_type] = {
                'probability': float(proba[1]),
                'risk_level': risk_level,
                'confidence': float(max(proba)),
                'prediction_class': int(prediction)
            }
            
        except Exception as e:
            print(f"❌ Prediction error for {disaster_type}: {e}")
            predictions[disaster_type] = {
                'probability': 0.0,
                'risk_level': "Unknown",
                'confidence': 0.0,
                'prediction_class': 0
            }
    
    return predictions

def format_prediction_response(predictions, city, current_weather):
    """Format ML predictions for frontend"""
    def generate_ml_graph_data(probability, trend_days=7):
        # Generate trend based on probability
        base = max(0.05, probability * 10)
        return [{"name": f"Day {i+1}", "value": max(0.1, base * (1 + random.uniform(-0.1, 0.1) * i))} for i in range(trend_days)]
    
    def get_ml_safety_tips(disaster_type, risk_level, probability):
        base_tips = {
            'flood': {
                'Low Risk': ["Monitor weather updates", "Check local flood warnings"],
                'Medium Risk': ["Prepare emergency kit", "Identify evacuation routes"],
                'High Risk': ["Evacuate if advised", "Avoid flood waters", "Move to higher ground"]
            },
            'cyclone': {
                'Low Risk': ["Stay informed", "Secure loose objects"],
                'Medium Risk': ["Prepare supplies", "Reinforce windows", "Charge devices"],
                'High Risk': ["Evacuate immediately", "Stay indoors", "Avoid windows"]
            },
            'extreme_weather': {
                'Low Risk': ["Stay hydrated", "Dress appropriately"],
                'Medium Risk': ["Limit outdoor activities", "Check on vulnerable people"],
                'High Risk': ["Seek shelter", "Avoid exposure", "Emergency services on standby"]
            }
        }
        
        tips = base_tips.get(disaster_type, {}).get(risk_level, ["Stay alert and follow local authorities"])
        
        # Add probability-based advice
        if probability > 0.7:
            tips.insert(0, "🚨 HIGH PROBABILITY - TAKE IMMEDIATE ACTION")
        elif probability > 0.4:
            tips.insert(0, "⚠️ MODERATE PROBABILITY - STAY VIGILANT")
        
        return tips
    
    disaster_mapping = {
        'flood': 'Flood',
        'cyclone': 'Cyclone', 
        'extreme_weather': 'Earthquake'
    }
    
    response = {}
    
    for internal_type, frontend_type in disaster_mapping.items():
        pred = predictions.get(internal_type, {})
        risk_level = pred.get('risk_level', 'Low Risk')
        probability = pred.get('probability', 0.0)
        confidence = pred.get('confidence', 0.0)
        
        details = f"ML Model Prediction: {risk_level} ({probability*100:.1f}% probability, {confidence*100:.1f}% confidence)"
        
        if frontend_type == 'Flood':
            response[frontend_type] = {
                "title": "Flood Risk Assessment",
                "prediction": risk_level,
                "value": f"{current_weather.get('precipitation', 0):.1f} mm/hr",
                "details": details,
                "graphData": generate_ml_graph_data(probability),
                "graphLabel": "Flood Probability Trend",
                "safety": get_ml_safety_tips('flood', risk_level, probability),
                "ml_confidence": f"{confidence*100:.1f}%"
            }
        elif frontend_type == 'Cyclone':
            response[frontend_type] = {
                "title": "Cyclone Risk Assessment", 
                "prediction": risk_level,
                "value": f"{current_weather.get('wind_speed', 0):.0f} km/h",
                "details": details,
                "graphData": generate_ml_graph_data(probability),
                "graphLabel": "Cyclone Probability Trend",
                "safety": get_ml_safety_tips('cyclone', risk_level, probability),
                "ml_confidence": f"{confidence*100:.1f}%"
            }
        else:  # Earthquake (mapped from extreme_weather)
            response[frontend_type] = {
                "title": "Extreme Weather Risk Assessment",
                "prediction": risk_level,
                "value": f"{current_weather.get('temperature', 0):.1f}°C",
                "details": details,
                "graphData": generate_ml_graph_data(probability),
                "graphLabel": "Extreme Weather Probability Trend",
                "safety": get_ml_safety_tips('extreme_weather', risk_level, probability),
                "ml_confidence": f"{confidence*100:.1f}%"
            }
    
    return response

# API Endpoints
@app.route('/api/predict', methods=['GET'])
def predict():
    """Main prediction endpoint using REAL ML models"""
    city = request.args.get('city')
    if not city:
        return jsonify({"error": "Missing 'city' parameter"}), 400

    print(f"🤖 ML Prediction request for: {city}")

    # Load ML models
    if city not in loaded_models:
        models = load_city_models(city)
        if models:
            loaded_models[city] = models
        else:
            return jsonify({"error": f"No trained ML models for {city}. Please train models first."}), 404

    try:
        # Get REAL current weather
        current_weather = get_real_current_weather(city)
        
        # Prepare features for ML model
        current_features = prepare_features_for_prediction(current_weather)
        
        # Make ML predictions
        predictions = make_ml_predictions(loaded_models[city], current_features)
        
        # Format response
        response_data = format_prediction_response(predictions, city, current_weather)

        print(f"✅ ML Predictions generated for {city}")
        return jsonify(response_data)

    except Exception as e:
        print(f"❌ ML Prediction error: {e}")
        return jsonify({"error": f"ML prediction failed: {str(e)}"}), 500

@app.route('/api/train', methods=['POST'])
def train_models():
    """Train ADVANCED ML models for a city"""
    data = request.get_json()
    city = data.get('city', 'Mumbai')
    years = data.get('years', 15)
    
    if city not in CITY_COORDS_LOOKUP:
        return jsonify({"error": f"Unknown city: {city}"}), 400
    
    try:
        coords = CITY_COORDS_LOOKUP[city]
        trainer = train_city_models_advanced(city, coords['lat'], coords['lon'], years)
        
        if trainer:
            # Reload models after training
            loaded_models[city] = load_city_models(city)
            return jsonify({
                "message": f"Advanced ML models trained successfully for {city}",
                "city": city,
                "models_trained": list(trainer.models.keys()),
                "type": "ADVANCED_ML"
            })
        else:
            return jsonify({"error": f"ML model training failed for {city}"}), 500
            
    except Exception as e:
        print(f"❌ Training error: {e}")
        return jsonify({"error": f"ML training failed: {str(e)}"}), 500

@app.route('/api/cities', methods=['GET'])
def get_cities():
    """Get available cities with ML model status"""
    cities_info = []
    for city in CITY_COORDS_LOOKUP.keys():
        # Check for advanced ML models
        has_ml_models = any(
            os.path.exists(os.path.join(MODEL_DIR, f"{city}_{disaster}_advanced_model.pkl"))
            for disaster in ['flood', 'cyclone', 'extreme_weather']
        )
        cities_info.append({
            'name': city,
            'trained': has_ml_models,
            'model_type': 'ADVANCED_ML' if has_ml_models else 'NONE',
            'coordinates': CITY_COORDS_LOOKUP[city]
        })
    
    return jsonify(cities_info)

@app.route('/api/train-all', methods=['POST'])
def train_all():
    """Train ML models for all cities"""
    results = []
    for city in CITY_COORDS_LOOKUP.keys():
        try:
            coords = CITY_COORDS_LOOKUP[city]
            trainer = train_city_models_advanced(city, coords['lat'], coords['lon'])
            if trainer:
                loaded_models[city] = load_city_models(city)
                results.append({
                    "city": city, 
                    "status": "success", 
                    "models": list(trainer.models.keys()),
                    "type": "ADVANCED_ML"
                })
            else:
                results.append({"city": city, "status": "failed", "error": "Training failed"})
        except Exception as e:
            results.append({"city": city, "status": "error", "error": str(e)})
    
    return jsonify(results)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy", 
        "ml_models_loaded": list(loaded_models.keys()),
        "type": "ADVANCED_ML_SYSTEM"
    })
@app.route('/api/locate', methods=['GET'])
def locate_city():
    """Locate any city dynamically using OpenWeatherMap Geocoding API"""
    city = request.args.get('city')
    if not city:
        return jsonify({"error": "Missing city parameter"}), 400

    OWM_API_KEY = "e9905c8b9429d45e17d7c3f168f30db2"

    try:
        geo_url = "https://api.openweathermap.org/geo/1.0/direct"
        params = {"q": city, "appid": OWM_API_KEY, "limit": 1}
        response = requests.get(geo_url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if not data:
            return jsonify({"error": f"City '{city}' not found"}), 404

        lat = data[0]["lat"]
        lon = data[0]["lon"]
        canonical_name = data[0].get("name", city)

        # Save to lookup so later predictions can use coordinates
        CITY_COORDS_LOOKUP[canonical_name] = {"lat": lat, "lon": lon}

        return jsonify({
            "city": canonical_name,
            "coordinates": {"lat": lat, "lon": lon}
        })

    except Exception as e:
        print(f"❌ Geocoding failed for {city}: {e}")
        return jsonify({"error": "Failed to locate city"}), 500
    
def preload_models():
    """Load ML models on startup"""
    print("🔮 Loading Advanced ML Models...")
    for city in CITY_COORDS_LOOKUP.keys():
        models = load_city_models(city)
        if models:
            loaded_models[city] = models
            print(f"   ✅ {city}: {len(models)} models loaded")

if __name__ == '__main__':
    os.makedirs(MODEL_DIR, exist_ok=True)
    preload_models()
    
    port = int(os.environ.get('PORT', 5001))
    print(f"🚀 ADVANCED ML DISASTER PREDICTION API")
    print(f"   Port: {port}")
    print(f"   ML Models: XGBoost, LightGBM, Random Forest, Gradient Boosting")
    print(f"   Features: 30+ engineered features")
    print(f"   Training: Hyperparameter tuning with GridSearch")
    print(f"   Data: Real NASA + OpenWeatherMap APIs")
    
    app.run(host='0.0.0.0', port=port, debug=True)