import { registerRootComponent } from 'expo';
import messaging from '@react-native-firebase/messaging';

import App from './App';

// Register background handler BEFORE registerRootComponent
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background notification received:', remoteMessage);
  console.log('Title:', remoteMessage.notification?.title);
  console.log('Body:', remoteMessage.notification?.body);
  console.log('Data:', remoteMessage.data);
  
  // You can perform any background task here
  // For example, save to AsyncStorage, update local database, etc.
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);