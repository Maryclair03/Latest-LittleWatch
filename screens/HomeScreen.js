import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import io from 'socket.io-client';

const API_URL = 'http://192.168.18.180:3000/api';
const SOCKET_URL = 'http://192.168.18.180:3000';

export default function HomeScreen({ navigation }) {
  const [heartRate, setHeartRate] = useState(0);
  const [temperature, setTemperature] = useState(0);
  const [oxygenSaturation, setOxygenSaturation] = useState(0);
  const [movement, setMovement] = useState('--');
  const [batteryLevel, setBatteryLevel] = useState(0);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [hasAlerts, setHasAlerts] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deviceSerial, setDeviceSerial] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [userId, setUserId] = useState(null);

  const socket = useRef(null);

  useFocusEffect(
    useCallback(() => {
      fetchUserAndVitals();

      return () => {
        // Disconnect socket when leaving screen
        if (socket.current) {
          console.log('Disconnecting socket...');
          socket.current.disconnect();
        }
      };
    }, [])
  );

  const connectSocket = useCallback(async (userIdParam, deviceSerialParam) => {
    try {
      console.log('Connecting to Socket.IO...', SOCKET_URL);
      
      // Create socket connection
      socket.current = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socket.current.on('connect', () => {
        console.log('✅ Socket connected:', socket.current.id);
        setSocketStatus('connected');

        // Register device for real-time vitals
        socket.current.emit('register_device', {
          userId: userIdParam,
          deviceSerial: deviceSerialParam,
        });

        // Join user room for notifications
        socket.current.emit('join_user_room', userIdParam);
      });

      socket.current.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        setSocketStatus('disconnected');
      });

      socket.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setSocketStatus('error');
      });

      // Listen for vitals updates
      socket.current.on('vitals_update', (response) => {
        console.log('📊 Received vitals update');
        if (response.success && response.data) {
          updateVitalsFromSocket(response.data);
        }
      });

      // Listen for notifications
      socket.current.on('new_notification', (notification) => {
        console.log('🔔 New notification:', notification);
        setHasAlerts(true);
      });

    } catch (error) {
      console.error('Error connecting socket:', error);
      setSocketStatus('error');
    }
  }, []);

  const updateVitalsFromSocket = (data) => {
    const { vitals, device } = data;
    
    setHeartRate(vitals.heart_rate || 0);
    setTemperature(vitals.temperature || 0);
    setOxygenSaturation(vitals.oxygen_saturation || 0);
    setMovement(vitals.movement_status || '--');
    setBatteryLevel(device?.battery_level || 0);
    setDeviceConnected(device?.is_connected || false);
    setLastUpdate(vitals.timestamp);
    setHasAlerts(vitals.is_alert || false);
  };

  const fetchUserAndVitals = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('token');

      if (!token) {
        navigation.replace('Login');
        return;
      }

      // Get user profile
      const profileResponse = await fetch(`${API_URL}/user/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const profileResult = await profileResponse.json();

      if (profileResult.success) {
        const userIdFromProfile = profileResult.data.user_id;
        setUserId(userIdFromProfile);

        if (profileResult.data.device_serial) {
          const serial = profileResult.data.device_serial;
          setDeviceSerial(serial);
          setDeviceConnected(true);

          // Fetch initial vitals via REST
          await fetchLatestVitals(serial);

          // Connect to Socket.IO for real-time updates
          await connectSocket(userIdFromProfile, serial);
        } else {
          setDeviceConnected(false);
          setDeviceSerial(null);
        }
      }
    } catch (error) {
      console.error('Error fetching user and vitals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLatestVitals = async (serial = deviceSerial) => {
    if (!serial) return;

    try {
      const token = await AsyncStorage.getItem('token');

      const response = await fetch(`${API_URL}/vitals/latest-by-serial/${serial}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success && result.data) {
        const { vitals, device } = result.data;

        setHeartRate(vitals.heart_rate || 0);
        setTemperature(vitals.temperature || 0);
        setOxygenSaturation(vitals.oxygen_saturation || 0);
        setMovement(vitals.movement_status || '--');
        setBatteryLevel(device?.battery_level || 0);
        setDeviceConnected(device?.is_connected || false);
        setLastUpdate(vitals.timestamp);
        setHasAlerts(vitals.is_alert || false);
      }
    } catch (error) {
      console.error('Error fetching vitals:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserAndVitals();
    setRefreshing(false);
  };

  const getVitalStatus = (type, value) => {
    if (value === null || value === undefined || value === 0) {
      return 'normal';
    }

    switch (type) {
      case 'heart':
        return value >= 100 && value <= 160 ? 'normal' : 'warning';
      case 'temp':
        return value >= 36.5 && value <= 37.5 ? 'normal' : 'warning';
      case 'oxygen':
        return value >= 95 ? 'normal' : 'warning';
      default:
        return 'normal';
    }
  };

  const VitalCard = ({ icon, title, value, unit, type, onPress }) => {
    const status = getVitalStatus(type, value);

    let displayValue = '--';
    if (value !== null && value !== undefined && value !== 0) {
      if (type === 'temp') {
        displayValue = Number(value).toFixed(1);
      } else if (type === 'movement') {
        displayValue = value;
      } else {
        displayValue = value;
      }
    }

    return (
      <TouchableOpacity
        style={[styles.vitalCard, status === 'warning' && value !== 0 && styles.vitalCardWarning]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.vitalIconContainer, status === 'warning' && value !== 0 && styles.vitalIconWarning]}>
          <Ionicons name={icon} size={28} color={status === 'warning' && value !== 0 ? '#FF5252' : '#0091EA'} />
        </View>
        <Text style={styles.vitalTitle}>{title}</Text>
        <Text style={[styles.vitalValue, status === 'warning' && value !== 0 && styles.vitalValueWarning]}>
          {displayValue}
        </Text>
        <Text style={styles.vitalUnit}>{unit}</Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0091EA" />
          <Text style={styles.loadingText}>Loading vitals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerSubtitle}>Dashboard</Text>
          {/* Real-time status indicator */}
          {/*<View style={styles.statusContainer}>
            <View style={[
              styles.realtimeIndicator,
              socketStatus === 'connected' ? styles.realtimeConnected : styles.realtimeDisconnected
            ]} />
            <Text style={styles.realtimeText}>
              {socketStatus === 'connected' ? '🔴 Live' : 'Connecting...'}
            </Text>
          </View>*/}
        </View>

        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={26} color="#0091EA" />
          {hasAlerts && <View style={styles.notificationBadge} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0091EA']}
            tintColor="#0091EA"
          />
        }
      >
        {/* Device Status Card */}
        <TouchableOpacity
          style={styles.deviceCard}
          onPress={() => navigation.navigate('BandTracker')}
          activeOpacity={0.7}
        >
          <View style={styles.deviceCardHeader}>
            <Ionicons name="watch" size={24} color="#0091EA" />
            <Text style={styles.deviceCardTitle}>Band Tracker</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>
          <View style={styles.deviceStatus}>
            <View style={styles.deviceStatusItem}>
              <View style={[styles.statusDot, deviceConnected ? styles.statusDotConnected : styles.statusDotDisconnected]} />
              <Text style={styles.deviceStatusText}>
                {deviceConnected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
            {deviceConnected && (
              <View style={styles.deviceStatusItem}>
                <Ionicons name="battery-half" size={16} color="#666" />
                <Text style={styles.deviceStatusText}>{batteryLevel}%</Text>
              </View>
            )}
          </View>
          {deviceSerial && (
            <Text style={styles.deviceSerialText}>Device: {deviceSerial}</Text>
          )}
          {lastUpdate && (
            <Text style={styles.lastUpdateText}>
              Last update: {new Date(lastUpdate).toLocaleTimeString()}
            </Text>
          )}
        </TouchableOpacity>

        {/* No Device Warning */}
        {!deviceConnected && (
          <TouchableOpacity
            style={styles.warningCard}
            onPress={() => navigation.navigate('BandTracker')}
          >
            <Ionicons name="warning" size={24} color="#FF9800" />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>No Device Connected</Text>
              <Text style={styles.warningText}>Tap here to connect your LittleWatch band</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FF9800" />
          </TouchableOpacity>
        )}

        {/* Real-Time Vitals Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Real-Time Vitals</Text>
          <TouchableOpacity onPress={() => navigation.navigate('VitalsTimeline')}>
            <Text style={styles.seeAllText}>View Timeline →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.vitalsGrid}>
          <VitalCard
            icon="heart"
            title="Heart Rate"
            value={heartRate}
            unit="BPM"
            type="heart"
            onPress={() => navigation.navigate('HeartRateDetail', { value: heartRate })}
          />
          <VitalCard
            icon="thermometer"
            title="Temperature"
            value={temperature}
            unit="°C"
            type="temp"
            onPress={() => navigation.navigate('TemperatureDetail', { value: temperature })}
          />
          <VitalCard
            icon="water"
            title="Oxygen"
            value={oxygenSaturation}
            unit="%"
            type="oxygen"
            onPress={() => navigation.navigate('OxygenDetail', { value: oxygenSaturation })}
          />
          <VitalCard
            icon="body"
            title="Movement"
            value={movement}
            unit=""
            type="movement"
          />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('VitalsTimeline')}
          >
            <Ionicons name="time" size={24} color="#0091EA" />
            <Text style={styles.actionText}>View History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings" size={24} color="#0091EA" />
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('SleepPatterns')}
          >
            <Ionicons name="moon-outline" size={24} color="#0091EA" />
            <Text style={styles.actionText}>Sleep Patterns</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('BandTracker')}
          >
            <Ionicons name="watch-outline" size={24} color="#0091EA" />
            <Text style={styles.actionText}>Band Tracker</Text>
          </TouchableOpacity>
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
  headerLeft: { flex: 1 },
  headerSubtitle: { fontSize: 20, fontWeight: '800', color: '#0091EA', marginTop: 2 },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  realtimeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  realtimeConnected: {
    backgroundColor: '#4CAF50',
  },
  realtimeDisconnected: {
    backgroundColor: '#FF9800',
  },
  realtimeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5252',
  },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  deviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deviceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceCardTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginLeft: 8, flex: 1 },
  deviceStatus: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deviceStatusItem: { flexDirection: 'row', alignItems: 'center' },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusDotConnected: {
    backgroundColor: '#4CAF50',
  },
  statusDotDisconnected: {
    backgroundColor: '#FF5252',
  },
  deviceStatusText: { fontSize: 14, color: '#666', marginLeft: 4 },
  deviceSerialText: { fontSize: 12, color: '#999', marginTop: 8 },
  lastUpdateText: { fontSize: 12, color: '#999', marginTop: 4 },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
  },
  warningText: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  seeAllText: { fontSize: 14, color: '#0091EA', fontWeight: '600' },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
  vitalCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  vitalCardWarning: { borderWidth: 2, borderColor: '#FF5252' },
  vitalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  vitalIconWarning: {
    backgroundColor: '#FFEBEE',
  },
  vitalTitle: { fontSize: 12, color: '#999', marginBottom: 4 },
  vitalValue: { fontSize: 24, fontWeight: '700', color: '#333' },
  vitalValueWarning: { color: '#FF5252' },
  vitalUnit: { fontSize: 12, color: '#999', marginTop: 2 },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: { fontSize: 13, fontWeight: '600', color: '#333', marginTop: 8, textAlign: 'center' },
});