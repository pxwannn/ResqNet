import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Get credentials from env
const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const twilioPhone = import.meta.env.VITE_TWILIO_PHONE_NUMBER;

/**
 * Send SMS alert using REST API (works in browser)
 */
const sendSMSViaAPI = async (phoneNumber, message) => {
  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'To': phoneNumber,
        'From': twilioPhone,
        'Body': message
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, sid: data.sid };
    } else {
      return { success: false, error: data.message };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * MAIN FUNCTION: Check risk and send alerts if needed
 */
export const checkAndSendAlerts = async (predictionData, city) => {
  console.log(`\n🔍 CHECKING ALERTS FOR ${city}...`);
  
  for (const [disasterType, disasterData] of Object.entries(predictionData)) {
    const riskLevel = disasterData.prediction;
    
    console.log(`   📊 ${disasterType}: ${riskLevel}`);
    
    if (riskLevel === 'Low Risk') {
      console.log(`   ⏭️  ${disasterType}: Low risk - no alerts`);
      continue;
    }
    
    try {
      // Get subscribers for this city
      const subscribers = await getSubscribersForCity(city, riskLevel);
      
      if (subscribers.length === 0) {
        console.log(`   📭 No subscribers for ${city}`);
        continue;
      }
      
      console.log(`   📱 Found ${subscribers.length} subscribers for ${city}`);
      
      // Format message
      const emoji = riskLevel === 'High Risk' ? '🚨' : '⚠️';
      const message = `${emoji} ${disasterData.title} ALERT for ${city}\n` +
                      `Risk: ${riskLevel}\n` +
                      `Current: ${disasterData.value}\n` +
                      `Action: ${disasterData.safety[0]}\n` +
                      `- ResqNet Disaster Prediction System`;
      
      // Send alerts using REST API
      for (const sub of subscribers) {
        const phoneNumber = sub.formattedPhone || sub.phoneNumber;
        const result = await sendSMSViaAPI(phoneNumber, message);
        
        if (result.success) {
          console.log(`   ✅ Sent to ${phoneNumber}: ${result.sid}`);
        } else {
          console.log(`   ❌ Failed for ${phoneNumber}: ${result.error}`);
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error) {
      console.error(`   ❌ Error:`, error.message);
    }
  }
};

/**
 * Get subscribers for a specific city
 */
const getSubscribersForCity = async (city, riskLevel) => {
  const subscribersRef = collection(db, "sms_notifications");
  
  let notificationTypes = [];
  if (riskLevel === 'High Risk') {
    notificationTypes = ['high', 'high-medium'];
  } else if (riskLevel === 'Medium Risk') {
    notificationTypes = ['high-medium'];
  } else {
    return [];
  }
  
  const q = query(
    subscribersRef,
    where("city", "==", city),
    where("isActive", "==", true),
    where("notificationType", "in", notificationTypes)
  );
  
  const querySnapshot = await getDocs(q);
  const subscribers = [];
  querySnapshot.forEach((doc) => {
    subscribers.push({ id: doc.id, ...doc.data() });
  });
  
  return subscribers;
};