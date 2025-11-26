import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.18.180:3000/api';

export default function SettingsScreen({ navigation }) {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingNotification, setIsUpdatingNotification] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        navigation.replace('Login');
        return;
      }

      const response = await fetch(`${API_URL}/user/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setProfile(data.data);
        // Set notification state from profile
        setPushNotifications(data.data.notification_enabled !== false);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePushNotifications = async (value) => {
    try {
      setIsUpdatingNotification(true);
      setPushNotifications(value);

      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/user/notification-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notificationEnabled: value,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Notification settings updated:', value ? 'Enabled' : 'Disabled');
      } else {
        // Revert on failure
        setPushNotifications(!value);
        Alert.alert('Error', data.message || 'Failed to update notification settings');
      }
    } catch (error) {
      console.error('Toggle notifications error:', error);
      // Revert on error
      setPushNotifications(!value);
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setIsUpdatingNotification(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');

            if (token) {
              await fetch(`${API_URL}/user/logout`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              });
            }

            await AsyncStorage.removeItem('token');
            navigation.replace('Onboarding');
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to logout. Try again.');
          }
        },
      },
    ]);
  };

  const SettingItem = ({ icon, title, subtitle, onPress, showChevron = true }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={22} color="#0091EA" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showChevron && <Ionicons name="chevron-forward" size={20} color="#999" />}
    </TouchableOpacity>
  );

  const SettingToggleItem = ({ icon, title, subtitle, value, onValueChange, disabled }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={22} color="#0091EA" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#D1D5DB', true: '#0091EA' }}
        thumbColor={value ? '#FFFFFF' : '#F3F4F6'}
        ios_backgroundColor="#D1D5DB"
      />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0091EA" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0091EA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Ionicons name="person" size={40} color="#0091EA" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.full_name || profile?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{profile?.email || 'email@example.com'}</Text>
          </View>
        </View>

        {/* Notifications Settings */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingsGroup}>
          <SettingToggleItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle={pushNotifications 
              ? "Receive vital alerts from your device" 
              : "You will not receive vital alerts"}
            value={pushNotifications}
            onValueChange={togglePushNotifications}
            disabled={isUpdatingNotification}
          />
        </View>

        {/* Account Settings */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.settingsGroup}>
          <SettingItem
            icon="person-outline"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => navigation.navigate('ParentAccount')}
          />
        </View>

        {/* Logout */}
        <Text style={styles.sectionTitle}>Logout</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity
            style={[styles.settingItem, styles.dangerItem]}
            onPress={handleLogout}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, styles.dangerIcon]}>
                <Ionicons name="log-out-outline" size={22} color="#FF5252" />
              </View>
              <Text style={[styles.settingTitle, styles.dangerText]}>Logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FF5252" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            LittleWatch © 2025{'\n'}USTP Cagayan de Oro
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E6F7FF' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#0091EA' },
  placeholder: { width: 40 },
  content: { flex: 1, padding: 20 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileName: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 4 },
  profileEmail: { fontSize: 14, color: '#999' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#666', marginBottom: 12, marginTop: 8 },
  settingsGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 2 },
  settingSubtitle: { fontSize: 13, color: '#999' },
  dangerItem: { backgroundColor: '#FFF5F5' },
  dangerIcon: { backgroundColor: '#FFEBEE' },
  dangerText: { color: '#FF5252' },
  footer: { alignItems: 'center', paddingVertical: 30 },
  footerText: { fontSize: 12, color: '#999', textAlign: 'center', lineHeight: 18 },
});