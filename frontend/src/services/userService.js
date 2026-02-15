// import { doc, setDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
// import { db } from "@/lib/firebase";

// export const createUserProfile = async (user, additionalData) => {
//   if (!user) return;

//   try {
//     const userRef = doc(db, "users", user.uid);

//     const dataToSave = {
//       uid: user.uid,
//       email: user.email || null,
//       city: additionalData?.city || null,
//       createdAt: serverTimestamp()
//     };

//     console.log("📝 Saving user profile to Firestore:", dataToSave);

//     await setDoc(userRef, dataToSave, { merge: true });
//     console.log("✅ User profile saved successfully");
    
//     return { success: true };
//   } catch (error) {
//     console.error("❌ Error saving user profile:", error);
//     throw new Error(`Failed to save user profile: ${error.message}`);
//   }
// };

// export const saveNotificationForEmail = async (email, notificationData) => {
//   if (!email) throw new Error("Email is required");

//   try {
//     const notificationsRef = collection(db, "notifications");

//     const dataToSave = {
//       email: email.trim().toLowerCase(),
//       notificationType: notificationData.notificationType || "high-medium",
//       city: notificationData.city || "Mumbai",
//       isActive: true,
//       createdAt: serverTimestamp(),
//       timestamp: notificationData.timestamp || serverTimestamp(),
//       userAgent: notificationData.userAgent || null
//     };

//     console.log("📝 Saving notification to Firestore:", dataToSave);

//     const docRef = await addDoc(notificationsRef, dataToSave);

//     console.log("✅ Notification saved successfully. Document ID:", docRef.id);
//     return { success: true, id: docRef.id };
//   } catch (error) {
//     console.error("❌ Error saving notification:", error);
    
//     // Check for permission error
//     if (error.code === 'permission-denied' || error.message.includes('permission')) {
//       throw new Error("Firestore permission denied. Update rules to allow writes to 'notifications' collection.");
//     }
    
//     throw new Error(`Failed to save notification: ${error.message}`);
//   }
// };
// export const testConnection = async () => {
//   try {
//     console.log("Firebase Project ID:", import.meta.env.VITE_FIREBASE_PROJECT_ID);
//     console.log("Firebase DB:", db);
    
//     // Try a simple write
//     const testRef = collection(db, "test");
//     await addDoc(testRef, { test: true, timestamp: new Date().toISOString() });
//     console.log("✅ Write successful!");
//   } catch (error) {
//     console.error("❌ Connection test failed:", error);
//   }
// };
import { doc, setDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const createUserProfile = async (user, additionalData) => {
  if (!user) return;

  try {
    const userRef = doc(db, "users", user.uid);

    const dataToSave = {
      uid: user.uid,
      email: user.email || null,
      phoneNumber: additionalData?.phoneNumber || null,
      city: additionalData?.city || null,
      createdAt: serverTimestamp()
    };

    console.log("📝 Saving user profile to Firestore:", dataToSave);

    await setDoc(userRef, dataToSave, { merge: true });
    console.log("✅ User profile saved successfully");
    
    return { success: true };
  } catch (error) {
    console.error("❌ Error saving user profile:", error);
    throw new Error(`Failed to save user profile: ${error.message}`);
  }
};

export const saveNotificationForPhone = async (phoneNumber, notificationData) => {
  if (!phoneNumber) throw new Error("Phone number is required");

  try {
    // Use a separate collection for SMS notifications
    const smsNotificationsRef = collection(db, "sms_notifications");

    // Remove any non-digit characters and validate
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    
    const dataToSave = {
      phoneNumber: cleanedPhone,
      formattedPhone: phoneNumber, // Keep original format for display
      notificationType: notificationData.notificationType || "high-medium",
      city: notificationData.city || "Mumbai",
      countryCode: notificationData.countryCode || "+91",
      isActive: true,
      createdAt: serverTimestamp(),
      timestamp: notificationData.timestamp || serverTimestamp(),
      userAgent: notificationData.userAgent || null,
      // Track SMS delivery status (to be updated by Twilio later)
      smsDeliveryStatus: "pending",
      smsSentCount: 0,
      lastSMSSent: null
    };

    console.log("📝 Saving SMS notification to Firestore:", dataToSave);

    const docRef = await addDoc(smsNotificationsRef, dataToSave);

    console.log("✅ SMS notification saved successfully. Document ID:", docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("❌ Error saving SMS notification:", error);
    
    // Check for permission error
    if (error.code === 'permission-denied' || error.message.includes('permission')) {
      throw new Error("Firestore permission denied. Update rules to allow writes to 'sms_notifications' collection.");
    }
    
    throw new Error(`Failed to save SMS notification: ${error.message}`);
  }
};

// Function to get all active SMS subscribers for a city
export const getActiveSubscribersForCity = async (city, riskLevel) => {
  try {
    const subscribersRef = collection(db, "sms_notifications");
    const q = query(
      subscribersRef,
      where("city", "==", city),
      where("isActive", "==", true),
      where("notificationType", "in", riskLevel === "HIGH" ? ["high", "high-medium"] : ["high-medium"])
    );
    
    const querySnapshot = await getDocs(q);
    const subscribers = [];
    querySnapshot.forEach((doc) => {
      subscribers.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`📱 Found ${subscribers.length} SMS subscribers for ${city}`);
    return subscribers;
  } catch (error) {
    console.error("❌ Error fetching subscribers:", error);
    return [];
  }
};

export const testConnection = async () => {
  try {
    console.log("Firebase Project ID:", import.meta.env.VITE_FIREBASE_PROJECT_ID);
    console.log("Firebase DB:", db);
    
    // Try a simple write to test collection
    const testRef = collection(db, "test_sms");
    await addDoc(testRef, { 
      test: true, 
      timestamp: new Date().toISOString(),
      message: "SMS notification test"
    });
    console.log("✅ SMS test write successful!");
    return true;
  } catch (error) {
    console.error("❌ Connection test failed:", error);
    throw error;
  }
};

// Function to update SMS delivery status (to be used by Twilio webhook)
export const updateSMSDeliveryStatus = async (notificationId, status) => {
  try {
    const notificationRef = doc(db, "sms_notifications", notificationId);
    await updateDoc(notificationRef, {
      smsDeliveryStatus: status,
      lastSMSSent: serverTimestamp(),
      smsSentCount: increment(1)
    });
    console.log(`✅ SMS delivery status updated for ${notificationId}: ${status}`);
  } catch (error) {
    console.error("❌ Error updating SMS status:", error);
  }
};