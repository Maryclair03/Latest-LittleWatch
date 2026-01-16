import { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Platform, PermissionsAndroid, Alert } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import OnboardingScreen from './screens/OnboardingScreen';
import SignupScreen from './screens/SignupScreen';
import AdditionalInfoScreen from './screens/AdditionalInfoScreen';
import SuccessModalScreen from './screens/SuccessModalScreen';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import HeartRateDetailScreen from './screens/HeartRateDetailScreen';
import TemperatureDetailScreen from './screens/TemperatureDetailScreen';
import OxygenDetailScreen from './screens/OxygenDetailScreen';
import VitalsTimelineScreen from './screens/VitalsTimelineScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import SettingsScreen from './screens/SettingsScreen';
import SleepPatternsScreen from './screens/SleepPatternsScreen';
import ParentAccountScreen from './screens/ParentAccountScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import BandTrackingScreen from './screens/BandTrackerScreen';
import { userAPI } from './services/api';

// Prevent auto-hiding right away
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  // Request notification permissions
  async function requestUserPermission() {
    try {
      // For Android 13+ (API 33+)
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Android notification permission granted');
          return true;
        } else {
          console.log('Android notification permission denied');
          return false;
        }
      }

      // For iOS and older Android versions
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('iOS authorization status:', authStatus);
      }

      return enabled;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  }

  // Get FCM token
  async function getFCMToken() {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);

      // Check if user is logged in before sending FCM token
      const authToken = await AsyncStorage.getItem('token');
      
      if (!authToken) {
        console.log('⚠️ No auth token found, FCM token will be sent on next login');
        return token;
      }

      // Send token to backend
      try {
        await userAPI.updateFCMToken(token);
        console.log('✅ FCM token saved to server successfully');
      } catch (error) {
        // Check if error is due to expired/invalid token
        if (error.response?.status === 403 || error.response?.status === 401) {
          console.log('⚠️ Auth token expired, FCM token will be sent on next login');
        } else {
          console.error('❌ Failed to save FCM token to server:', error.message);
        }
      }

      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
    }
  }

  useEffect(() => {
    // Setup Firebase messaging
    const setupFirebaseMessaging = async () => {
      // Request permission
      const hasPermission = await requestUserPermission();
      
      if (hasPermission) {
        // Get FCM token
        await getFCMToken();
      }

      // Handle foreground notifications
      const unsubscribe = messaging().onMessage(async remoteMessage => {
        console.log('Foreground notification received:', remoteMessage);
        
        Alert.alert(
          remoteMessage.notification?.title || 'New Notification',
          remoteMessage.notification?.body || 'You have a new message',
          [{ text: 'OK' }]
        );
      });

      messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('Notification opened app from background:', remoteMessage);
      });

      messaging()
        .getInitialNotification()
        .then(remoteMessage => {
          if (remoteMessage) {
            console.log('Notification opened app from quit state:', remoteMessage);
          }
        });

      // Listen for token refresh
      const unsubscribeTokenRefresh = messaging().onTokenRefresh(async token => {
        console.log('FCM token refreshed:', token);
        
        // Check if user is logged in
        const authToken = await AsyncStorage.getItem('token');
        
        if (!authToken) {
          console.log('⚠️ No auth token, refreshed FCM token will be sent on next login');
          return;
        }

        // Send updated token to backend
        try {
          await userAPI.updateFCMToken(token);
          console.log('✅ Refreshed FCM token saved to server');
        } catch (error) {
          if (error.response?.status === 403 || error.response?.status === 401) {
            console.log('⚠️ Auth token expired, refreshed FCM token will be sent on next login');
          } else {
            console.error('❌ Failed to save refreshed FCM token:', error.message);
          }
        }
      });

      return () => {
        unsubscribe();
        unsubscribeTokenRefresh();
      };
    };

    setupFirebaseMessaging();

    // Splash screen timer
    const timer = setTimeout(async () => {
      setShowSplash(false);
      await SplashScreen.hideAsync();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Background message handler
  useEffect(() => {
    const unsubscribe = messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background notification received:', remoteMessage);
    });

    return unsubscribe;
  }, []);

  if (showSplash) {
    return (
      <LinearGradient colors={['#86d7fc', '#cffafc']} style={styles.container}>
        <Image source={require('./assets/Splash.png')} style={styles.logo} />
      </LinearGradient>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Onboarding"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {/* Auth Flow */}
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="AdditionalInfo" component={AdditionalInfoScreen} />
        <Stack.Screen
          name="SuccessModal"
          component={SuccessModalScreen}
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
          }}
        />
        <Stack.Screen name="Login" component={LoginScreen} />

        {/* Main App */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="BandTracker" component={BandTrackingScreen} />

        {/* Vital Details */}
        <Stack.Screen name="HeartRateDetail" component={HeartRateDetailScreen} />
        <Stack.Screen name="TemperatureDetail" component={TemperatureDetailScreen} />
        <Stack.Screen name="OxygenDetail" component={OxygenDetailScreen} />

        {/* Sleep Pattern */}
        <Stack.Screen name="SleepPatterns" component={SleepPatternsScreen} options={{ title: 'Sleep Patterns' }} />

        <Stack.Screen name="ParentAccount" component={ParentAccountScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />

        <Stack.Screen name="VitalsTimeline" component={VitalsTimelineScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
  },
});