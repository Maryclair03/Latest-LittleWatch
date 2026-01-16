import { useEffect, useState, useRef } from 'react';
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

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Onboarding');
  const [isReady, setIsReady] = useState(false);
  const isAlertShowing = useRef(false);
  const messageUnsubscribeRef = useRef(null);

  // Check if user is already logged in
  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (token) {
        console.log('✅ Found existing token, user is logged in');
        setInitialRoute('Home'); // or 'BandTracker' if that's your main screen
      } else {
        console.log('ℹ️ No token found, showing onboarding');
        setInitialRoute('Onboarding');
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      setInitialRoute('Onboarding');
    }
  };

  // Request notification permissions
  async function requestUserPermission() {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('✅ Android notification permission granted');
          return true;
        } else {
          console.log('❌ Android notification permission denied');
          return false;
        }
      }

      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ iOS authorization status:', authStatus);
      }

      return enabled;
    } catch (error) {
      console.error('❌ Error requesting permission:', error);
      return false;
    }
  }

  // Get FCM token
  async function getFCMToken() {
    try {
      const token = await messaging().getToken();
      console.log('🔑 FCM Token:', token);

      const authToken = await AsyncStorage.getItem('token');
      
      if (!authToken) {
        console.log('⚠️ No auth token found, FCM token will be sent on next login');
        return token;
      }

      try {
        await userAPI.updateFCMToken(token);
        console.log('✅ FCM token saved to server successfully');
      } catch (error) {
        if (error.response?.status === 403 || error.response?.status === 401) {
          console.log('⚠️ Auth token expired, FCM token will be sent on next login');
        } else {
          console.error('❌ Failed to save FCM token to server:', error.message);
        }
      }

      return token;
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
    }
  }

  // Handle foreground notification
  const handleForegroundNotification = (remoteMessage) => {
    if (isAlertShowing.current) {
      console.log('⚠️ Alert already showing, skipping notification');
      return;
    }

    console.log('📬 Foreground notification received:', remoteMessage);

    isAlertShowing.current = true;

    const title = remoteMessage.notification?.title || 'New Notification';
    const body = remoteMessage.notification?.body || 'You have a new message';

    Alert.alert(
      title,
      body,
      [
        {
          text: 'OK',
          onPress: () => {
            console.log('✅ Alert dismissed');
            isAlertShowing.current = false;
          }
        }
      ],
      {
        cancelable: false,
        onDismiss: () => {
          isAlertShowing.current = false;
        }
      }
    );
  };

  useEffect(() => {
    const initialize = async () => {
      // Check auth status first
      await checkAuthStatus();

      // Setup Firebase messaging
      console.log('🔥 Setting up Firebase messaging...');

      const hasPermission = await requestUserPermission();
      
      if (hasPermission) {
        await getFCMToken();
      }

      messageUnsubscribeRef.current = messaging().onMessage(handleForegroundNotification);

      messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('📱 Notification opened app from background:', remoteMessage);
      });

      messaging()
        .getInitialNotification()
        .then(remoteMessage => {
          if (remoteMessage) {
            console.log('📱 Notification opened app from quit state:', remoteMessage);
          }
        });

      const unsubscribeTokenRefresh = messaging().onTokenRefresh(async token => {
        console.log('🔄 FCM token refreshed:', token);
        
        const authToken = await AsyncStorage.getItem('token');
        
        if (!authToken) {
          console.log('⚠️ No auth token, refreshed FCM token will be sent on next login');
          return;
        }

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

      // Mark as ready after auth check
      setIsReady(true);

      // Hide splash after 3 seconds
      setTimeout(async () => {
        setShowSplash(false);
        await SplashScreen.hideAsync();
      }, 3000);

      return () => {
        if (messageUnsubscribeRef.current) {
          messageUnsubscribeRef.current();
        }
        unsubscribeTokenRefresh();
      };
    };

    initialize();
  }, []);

  // Background message handler
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('📭 Background notification received:', remoteMessage);
  });

  // Show splash while checking auth or during splash delay
  if (showSplash || !isReady) {
    return (
      <LinearGradient colors={['#86d7fc', '#cffafc']} style={styles.container}>
        <Image source={require('./assets/Splash.png')} style={styles.logo} />
      </LinearGradient>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
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