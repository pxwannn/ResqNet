import React, { useState, useEffect } from "react";
import { X, Send, Phone, Bell, AlertCircle, CheckCircle } from "lucide-react";
import { CitySelector } from "../../features/dashboard/CitySelector";
import { saveNotificationForPhone, testConnection } from "../../services/userService";

export function NotificationSettingsModal({ isOpen, onClose, defaultCity = "Mumbai" }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91"); // Default India
  const [notificationType, setNotificationType] = useState("high-medium");
  const [selectedCity, setSelectedCity] = useState(defaultCity);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [showTest, setShowTest] = useState(false);

  const countryCodes = [
    { code: "+1", country: "USA/Canada" },
    { code: "+44", country: "UK" },
    { code: "+91", country: "India" },
    { code: "+61", country: "Australia" },
    { code: "+86", country: "China" },
    { code: "+81", country: "Japan" },
    { code: "+49", country: "Germany" },
    { code: "+33", country: "France" },
    { code: "+55", country: "Brazil" },
    { code: "+52", country: "Mexico" },
  ];

  useEffect(() => {
    if (defaultCity) setSelectedCity(defaultCity);
  }, [defaultCity]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setPhoneNumber("");
        setCountryCode("+91");
        setSelectedCity("Mumbai");
        setNotificationType("high-medium");
        setError("");
        setIsSubscribed(false);
        setTestResult(null);
        setShowTest(false);
      }, 300);
    }
  }, [isOpen]);

  const validatePhoneNumber = (phone) => {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check length (typically 10 digits for most countries)
    if (cleaned.length < 10 || cleaned.length > 15) {
      return false;
    }
    
    return true;
  };

  const handleTestConnection = async () => {
    setTestResult(null);
    setShowTest(true);
    try {
      await testConnection();
      setTestResult({ success: true, message: "✅ Firebase connection successful! Ready to save phone numbers." });
    } catch (err) {
      setTestResult({ success: false, message: `❌ Test failed: ${err.message}` });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setTestResult(null);
    setShowTest(false);

    // Validate phone number
    if (!phoneNumber) {
      setError("Please enter phone number");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError("Invalid phone number. Please enter 10-15 digits.");
      return;
    }

    if (!selectedCity) {
      setError("Please select a city");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("🔍 STEP 1: Testing Firebase connection first...");
      await testConnection();
      
      // Format full phone number with country code
      const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
      
      console.log("✅ STEP 2: Connection test passed, now saving phone notification...");
      console.log("📱 Full phone number:", fullPhoneNumber);
      
      const result = await saveNotificationForPhone(fullPhoneNumber, {
        notificationType,
        city: selectedCity,
        countryCode,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });

      console.log("✅ STEP 3: Notification saved! Document ID:", result.id);
      setIsSubscribed(true);

      // Show success message
      setTestResult({ 
        success: true, 
        message: `✅ Phone number saved! You'll receive SMS alerts at ${fullPhoneNumber}` 
      });

      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (err) {
      console.error("❌ Firebase error:", err);
      setError(err.message || "Failed to save phone number. Check Firestore rules.");
      
      // Auto-run test on error to diagnose
      if (err.message.includes("permission")) {
        setTimeout(() => handleTestConnection(), 500);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneChange = (e) => {
    // Only allow digits
    const value = e.target.value.replace(/\D/g, '');
    setPhoneNumber(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <h2 className="font-semibold text-lg">SMS Alert Subscription</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 rounded"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success Message */}
        {isSubscribed && (
          <div className="mx-5 mt-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span>✓ Phone number saved to Firebase successfully!</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{error}</span>
            </div>
            {error.includes("permission") && (
              <div className="text-sm bg-red-200 p-2 rounded mt-2">
                <p className="font-semibold">Fix Firestore rules:</p>
                <pre className="text-xs mt-1 bg-gray-800 text-white p-2 rounded overflow-x-auto">
                  {`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /sms_notifications/{notificationId} {\n      allow create: if true;\n    }\n  }\n}`}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Test Result Display */}
        {showTest && testResult && (
          <div className={`mx-5 mt-4 p-3 rounded-lg ${
            testResult.success ? 'bg-green-100 border-green-300 text-green-700' : 'bg-yellow-100 border-yellow-300 text-yellow-700'
          }`}>
            <div className="flex items-center gap-2">
              {testResult.success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span>{testResult.message}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* City Selector */}
          <div>
            <label className="text-sm font-medium block mb-2">Alert Location</label>
            <CitySelector
              selectedCity={selectedCity}
              onCityChange={setSelectedCity}
              disabled={isSubmitting}
            />
          </div>

          {/* Phone Number Input with Country Code */}
          <div>
            <label className="text-sm font-medium flex items-center gap-1 mb-2">
              <Phone className="h-4 w-4" /> Phone Number (for SMS alerts)
            </label>
            
            <div className="flex gap-2">
              {/* Country Code Dropdown */}
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-24 border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                disabled={isSubmitting}
              >
                {countryCodes.map((cc) => (
                  <option key={cc.code} value={cc.code}>
                    {cc.code}
                  </option>
                ))}
              </select>

              {/* Phone Number Input */}
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                className="flex-1 border rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="9876543210"
                disabled={isSubmitting}
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter without country code (e.g., 9876543210)
            </p>
          </div>

          {/* Severity Selection */}
          <div>
            <label className="text-sm font-medium block mb-2">Alert Severity</label>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="high-medium"
                  checked={notificationType === "high-medium"}
                  onChange={(e) => setNotificationType(e.target.value)}
                  className="w-4 h-4"
                  disabled={isSubmitting}
                />
                <span>High + Medium 🔴 🟡</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="high"
                  checked={notificationType === "high"}
                  onChange={(e) => setNotificationType(e.target.value)}
                  className="w-4 h-4"
                  disabled={isSubmitting}
                />
                <span>High Only 🔴</span>
              </label>
            </div>
          </div>

          {/* SMS Info */}
          <div className="p-3 bg-blue-50 rounded-lg text-sm space-y-2">
            <p className="text-blue-800 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span className="font-medium">📱 SMS Alerts:</span>
            </p>
            <p className="text-blue-700 text-xs">
              You'll receive SMS alerts for disasters in {selectedCity}
            </p>
            <p className="text-blue-700 text-xs">
              ⚡ Standard SMS rates may apply
            </p>
          </div>

          {/* Test Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleTestConnection}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
              disabled={isSubmitting}
            >
              Test Firebase Connection
            </button>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 p-2.5 rounded-lg hover:bg-gray-50 transition"
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Save Phone for SMS
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}