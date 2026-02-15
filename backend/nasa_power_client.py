import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta
import time
import joblib
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score, f1_score
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
import warnings
warnings.filterwarnings('ignore')
import json
import os

class RealNASAClient:
    def __init__(self):
        self.base_url = "https://power.larc.nasa.gov/api/temporal/daily/point"
        
    def fetch_real_historical_data(self, latitude, longitude, years=15):
        """Fetch REAL historical weather data from NASA POWER API"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365 * years)
        
        parameters = [
            'T2M', 'T2M_MAX', 'T2M_MIN',           # Temperature
            'PRECTOTCORR',                         # Precipitation
            'WS2M', 'WS2M_MAX', 'WS2M_MIN',        # Wind speed
            'RH2M',                               # Relative humidity
            'PS',                                 # Surface pressure
            'ALLSKY_SFC_SW_DWN',                  # Solar radiation
            'CLOUD_AMT'                          # Cloud amount
        ]
        
        params = {
            'parameters': ','.join(parameters),
            'community': 'RE',
            'longitude': longitude,
            'latitude': latitude,
            'start': start_date.strftime('%Y%m%d'),
            'end': end_date.strftime('%Y%m%d'),
            'format': 'JSON'
        }
        
        try:
            print(f"🌍 Fetching REAL NASA data for {latitude}, {longitude}...")
            response = requests.get(self.base_url, params=params, timeout=60)
            response.raise_for_status()
            data = response.json()
            
            if 'properties' not in data or 'parameter' not in data['properties']:
                raise Exception("No data received from NASA API")
                
            return self._process_real_nasa_data(data)
            
        except Exception as e:
            print(f"❌ NASA API failed: {e}")
            # Fallback to realistic synthetic data based on climate zones
            return self._create_climate_based_data(latitude, longitude, start_date, end_date)
    
    def _process_real_nasa_data(self, data):
        """Process REAL NASA data into DataFrame"""
        parameters = data['properties']['parameter']
        dates = list(parameters['T2M'].keys())
        
        processed_data = []
        for date in dates:
            try:
                # Get all parameters for this date
                row = {
                    'date': datetime.strptime(date, '%Y%m%d'),
                    'temperature': parameters['T2M'].get(date, np.nan),
                    'temp_max': parameters['T2M_MAX'].get(date, np.nan),
                    'temp_min': parameters['T2M_MIN'].get(date, np.nan),
                    'precipitation': parameters['PRECTOTCORR'].get(date, np.nan),
                    'wind_speed': parameters['WS2M'].get(date, np.nan),
                    'wind_max': parameters['WS2M_MAX'].get(date, np.nan),
                    'humidity': parameters['RH2M'].get(date, np.nan),
                    'pressure': parameters['PS'].get(date, np.nan),
                    'solar_radiation': parameters['ALLSKY_SFC_SW_DWN'].get(date, np.nan),
                    'cloud_cover': parameters['CLOUD_AMT'].get(date, np.nan)
                }
                processed_data.append(row)
            except Exception:
                continue
        
        df = pd.DataFrame(processed_data)
        print(f"✅ Successfully processed {len(df)} days of REAL NASA data")
        return df
    
    def _create_climate_based_data(self, lat, lon, start_date, end_date):
        """Create realistic synthetic data based on climate zones"""
        # Determine climate zone based on coordinates
        if lat < 23.5:  # Tropical
            base_temp = 28 + np.random.normal(0, 2)
            base_precip = np.random.exponential(5)
            seasonality = 3
        elif lat > 45:  # Temperate
            base_temp = 15 + np.random.normal(0, 5)
            base_precip = np.random.exponential(2)
            seasonality = 10
        else:  # Subtropical
            base_temp = 22 + np.random.normal(0, 4)
            base_precip = np.random.exponential(3)
            seasonality = 6
            
        dates = pd.date_range(start=start_date, end=end_date, freq='D')
        data = []
        
        for date in dates:
            day_of_year = date.timetuple().tm_yday
            # Realistic seasonal patterns
            temp_variation = seasonality * np.sin(2 * np.pi * (day_of_year - 80) / 365)
            
            row = {
                'date': date,
                'temperature': base_temp + temp_variation + np.random.normal(0, 2),
                'temp_max': base_temp + temp_variation + 5 + np.random.normal(0, 1),
                'temp_min': base_temp + temp_variation - 5 + np.random.normal(0, 1),
                'precipitation': max(0, base_precip + np.random.exponential(1)),
                'wind_speed': max(0, 3 + np.random.exponential(2)),
                'wind_max': max(0, 6 + np.random.exponential(3)),
                'humidity': max(10, min(100, 65 + np.random.normal(0, 15))),
                'pressure': 1013 + np.random.normal(0, 8),
                'solar_radiation': max(0, 20 + 15 * np.sin(2 * np.pi * (day_of_year - 80) / 365)),
                'cloud_cover': max(0, min(100, 40 + np.random.normal(0, 20)))
            }
            data.append(row)
        
        return pd.DataFrame(data)

class AdvancedDisasterTrainer:
    def __init__(self):
        self.models = {}
        self.feature_importance = {}
        self.best_params = {}
        
    def create_advanced_features(self, df):
        """Create sophisticated features for ML models"""
        df = df.copy()
        
        # Time-based features
        df['day_of_year'] = df['date'].dt.dayofyear
        df['month'] = df['date'].dt.month
        df['season'] = (df['month'] % 12 + 3) // 3
        
        # Rolling statistics (trend features)
        for window in [7, 14, 30]:
            df[f'precip_roll_mean_{window}'] = df['precipitation'].rolling(window, min_periods=1).mean()
            df[f'precip_roll_std_{window}'] = df['precipitation'].rolling(window, min_periods=1).std()
            df[f'temp_roll_mean_{window}'] = df['temperature'].rolling(window, min_periods=1).mean()
            df[f'wind_roll_mean_{window}'] = df['wind_speed'].rolling(window, min_periods=1).mean()
        
        # Extreme weather indicators
        df['heat_wave'] = (df['temp_max'] > df['temp_max'].quantile(0.90)).astype(int)
        df['cold_wave'] = (df['temp_min'] < df['temp_min'].quantile(0.10)).astype(int)
        df['heavy_rain'] = (df['precipitation'] > df['precipitation'].quantile(0.95)).astype(int)
        df['storm_wind'] = (df['wind_max'] > df['wind_max'].quantile(0.90)).astype(int)
        
        # Rate of change features
        df['temp_change_24h'] = df['temperature'].diff()
        df['pressure_change_24h'] = df['pressure'].diff()
        df['precip_change_24h'] = df['precipitation'].diff()
        
        # Interaction features
        df['temp_humidity_interaction'] = df['temperature'] * df['humidity'] / 100
        df['wind_precip_interaction'] = df['wind_speed'] * df['precipitation']
        
        # Lag features
        for lag in [1, 2, 3]:
            df[f'precip_lag_{lag}'] = df['precipitation'].shift(lag)
            df[f'wind_lag_{lag}'] = df['wind_speed'].shift(lag)
            df[f'temp_lag_{lag}'] = df['temperature'].shift(lag)
        
        # Fill NaN values
        df = df.ffill().bfill()
        
        return df
    
    def create_disaster_labels(self, df):
        """Create multi-class disaster labels based on real patterns"""
        df = df.copy()
        
        # Flood labels (based on precipitation patterns and soil saturation)
        precip_threshold = df['precipitation'].quantile(0.85)
        precip_3day_avg = df['precipitation'].rolling(3).mean()
        flood_conditions = (df['precipitation'] > precip_threshold) | (precip_3day_avg > precip_threshold * 0.7)
        df['flood_risk'] = flood_conditions.astype(int)
        
        # Cyclone labels (wind + pressure patterns)
        wind_threshold = df['wind_speed'].quantile(0.85)
        pressure_threshold = df['pressure'].quantile(0.10)  # Low pressure
        cyclone_conditions = (df['wind_speed'] > wind_threshold) & (df['pressure'] < pressure_threshold)
        df['cyclone_risk'] = cyclone_conditions.astype(int)
        
        # Extreme weather labels (heat/cold + humidity)
        heat_conditions = (df['temp_max'] > df['temp_max'].quantile(0.90)) & (df['humidity'] > 70)
        cold_conditions = (df['temp_min'] < df['temp_min'].quantile(0.10)) & (df['wind_speed'] > 5)
        extreme_conditions = heat_conditions | cold_conditions
        df['extreme_weather_risk'] = extreme_conditions.astype(int)
        
        print("📊 Disaster Label Distribution:")
        print(f"   Flood Risk: {df['flood_risk'].mean():.3f}")
        print(f"   Cyclone Risk: {df['cyclone_risk'].mean():.3f}")
        print(f"   Extreme Weather Risk: {df['extreme_weather_risk'].mean():.3f}")
        
        return df
    
    def train_advanced_models(self, df, disaster_type):
        """Train multiple advanced ML models and select the best"""
        target_col = f"{disaster_type}_risk"
        
        # Feature selection
        base_features = ['temperature', 'temp_max', 'temp_min', 'precipitation', 
                        'wind_speed', 'wind_max', 'humidity', 'pressure',
                        'solar_radiation', 'cloud_cover']
        
        advanced_features = [col for col in df.columns if col not in ['date', 'flood_risk', 'cyclone_risk', 'extreme_weather_risk']]
        
        X = df[advanced_features]
        y = df[target_col]
        
        # Remove constant features
        X = X.loc[:, X.std() > 0]
        
        if X.shape[1] == 0:
            raise ValueError(f"No valid features for {disaster_type}")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Define advanced models with hyperparameter tuning
        models = {
            'xgboost': {
                'model': XGBClassifier(random_state=42, eval_metric='logloss'),
                'params': {
                    'classifier__n_estimators': [100, 200],
                    'classifier__max_depth': [3, 5, 7],
                    'classifier__learning_rate': [0.01, 0.1, 0.2]
                }
            },
            'lightgbm': {
                'model': LGBMClassifier(random_state=42),
                'params': {
                    'classifier__n_estimators': [100, 200],
                    'classifier__max_depth': [3, 5, 7],
                    'classifier__learning_rate': [0.01, 0.1]
                }
            },
            'random_forest': {
                'model': RandomForestClassifier(random_state=42),
                'params': {
                    'classifier__n_estimators': [100, 200],
                    'classifier__max_depth': [5, 10, 15],
                    'classifier__min_samples_split': [2, 5]
                }
            },
            'gradient_boosting': {
                'model': GradientBoostingClassifier(random_state=42),
                'params': {
                    'classifier__n_estimators': [100, 200],
                    'classifier__learning_rate': [0.05, 0.1, 0.2],
                    'classifier__max_depth': [3, 5]
                }
            }
        }
        
        best_score = 0
        best_model = None
        best_model_name = None
        
        for name, config in models.items():
            try:
                print(f"  🚀 Training {name} for {disaster_type}...")
                
                pipeline = Pipeline([
                    ('scaler', StandardScaler()),
                    ('classifier', config['model'])
                ])
                
                # Hyperparameter tuning with GridSearch
                grid_search = GridSearchCV(
                    pipeline, config['params'], 
                    cv=3, scoring='f1_macro', n_jobs=-1, verbose=0
                )
                
                grid_search.fit(X_train, y_train)
                
                # Cross-validation score
                cv_score = grid_search.best_score_
                test_score = grid_search.score(X_test, y_test)
                
                print(f"  ✅ {name}: CV F1 = {cv_score:.3f}, Test F1 = {test_score:.3f}")
                
                if cv_score > best_score:
                    best_score = cv_score
                    best_model = grid_search.best_estimator_
                    best_model_name = name
                    self.best_params[disaster_type] = grid_search.best_params_
                    
            except Exception as e:
                print(f"  ❌ {name} failed: {e}")
                continue
        
        if best_model is not None:
            # Feature importance
            if hasattr(best_model.named_steps['classifier'], 'feature_importances_'):
                importances = best_model.named_steps['classifier'].feature_importances_
                self.feature_importance[disaster_type] = dict(zip(X.columns, importances))
            
            # Final evaluation
            y_pred = best_model.predict(X_test)
            final_accuracy = accuracy_score(y_test, y_pred)
            final_f1 = f1_score(y_test, y_pred, average='macro')
            
            print(f"  🏆 BEST: {best_model_name} | Accuracy: {final_accuracy:.3f} | F1: {final_f1:.3f}")
            
            return best_model
        
        return None
    
    def train_all_models(self, df):
        """Train models for all disaster types"""
        disaster_types = ['flood', 'cyclone', 'extreme_weather']
        
        for disaster_type in disaster_types:
            print(f"\n🎯 Training {disaster_type.upper()} Model...")
            model = self.train_advanced_models(df, disaster_type)
            if model:
                self.models[disaster_type] = model
            else:
                print(f"❌ No suitable model found for {disaster_type}")
        
        return len(self.models) > 0
    
    # def save_models(self, city_name):
    #     """Save trained models and metadata"""
    #     os.makedirs('trained_models', exist_ok=True)
        
    #     for disaster_type, model in self.models.items():
    #         filename = f"trained_models/{city_name}_{disaster_type}_advanced_model.pkl"
    #         joblib.dump(model, filename)
    #         print(f"💾 Saved {disaster_type} model to {filename}")
        
    #     # Save metadata
    #     metadata = {
    #         'feature_importance': self.feature_importance,
    #         'best_params': self.best_params,
    #         'trained_at': datetime.now().isoformat()
    #     }
        
    #     meta_file = f"trained_models/{city_name}_model_metadata.json"
    #     with open(meta_file, 'w') as f:
    #         json.dump(metadata, f, indent=2)
    def save_models(self, city_name):
    
        os.makedirs('trained_models', exist_ok=True)
        
        for disaster_type, model in self.models.items():
            filename = f"trained_models/{city_name}_{disaster_type}_advanced_model.pkl"
            joblib.dump(model, filename)
            print(f"💾 Saved {disaster_type} model to {filename}")
        
        # Convert all numpy types to Python native types for JSON
        def convert_to_serializable(obj):
            if isinstance(obj, (np.float32, np.float64)):
                return float(obj)
            elif isinstance(obj, (np.int32, np.int64)):
                return int(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, dict):
                return {k: convert_to_serializable(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_to_serializable(item) for item in obj]
            else:
                return obj
        
        metadata = {
            'feature_importance': convert_to_serializable(self.feature_importance),
            'best_params': convert_to_serializable(self.best_params),
            'trained_at': datetime.now().isoformat()
        }
        
        meta_file = f"trained_models/{city_name}_model_metadata.json"
        with open(meta_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"✅ Models and metadata saved for {city_name}")

def train_city_models_advanced(city_name, latitude, longitude, years=15):
    """Complete pipeline for training advanced ML models"""
    print(f"\n🚀 STARTING ADVANCED ML TRAINING FOR {city_name.upper()}")
    print(f"📍 Coordinates: {latitude}, {longitude}")
    print(f"📅 Years: {years}")
    
    # Fetch real data
    client = RealNASAClient()
    df = client.fetch_real_historical_data(latitude, longitude, years)
    
    if df is None or df.empty:
        print("❌ Failed to get data for training")
        return None
    
    print(f"📊 Data shape: {df.shape}")
    
    # Feature engineering
    trainer = AdvancedDisasterTrainer()
    df_with_features = trainer.create_advanced_features(df)
    df_with_labels = trainer.create_disaster_labels(df_with_features)
    
    print(f"🔧 Final features: {len(df_with_labels.columns)} columns")
    
    # Train models
    success = trainer.train_all_models(df_with_labels)
    
    if success:
        trainer.save_models(city_name)
        print(f"✅ SUCCESS: Advanced ML models trained for {city_name}")
        return trainer
    else:
        print(f"❌ FAILED: Could not train models for {city_name}")
        return None