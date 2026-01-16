import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SocketService from '../services/socket';

const screenWidth = Dimensions.get('window').width;

// Update this to your backend URL
const API_BASE_URL = 'https://little-watch-backend.onrender.com/api';

export default function SleepPatternsScreen() {
  const [sleepData, setSleepData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [currentSleep, setCurrentSleep] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [deviceSerial, setDeviceSerial] = useState(null);
  const [userId, setUserId] = useState(null);

  const navigation = useNavigation();
  const route = useRoute();
  const socketRef = useRef(null);
  const autoRefreshIntervalRef = useRef(null);

  // Get auth token from AsyncStorage
  const getAuthToken = async () => {
    try {
      // Your app stores it as 'token'
      const token = await AsyncStorage.getItem('token');
      return token;
    } catch (err) {
      console.error('Error getting auth token:', err);
      return null;
    }
  };

  // Get user ID from AsyncStorage
  const getUserId = async () => {
    try {
      const id = await AsyncStorage.getItem('userId');
      return id;
    } catch (err) {
      console.error('Error getting user ID:', err);
      return null;
    }
  };

  // Fetch user profile from backend to get device_serial
  const fetchUserDeviceSerial = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.log('No token found');
        return null;
      }

      // Call your backend to get user profile (which includes device_serial)
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log('User profile response:', result);

      if (result.success && result.data) {
        const serial = result.data.device_serial || result.data.deviceSerial;
        if (serial) {
          // Cache it for future use
          await AsyncStorage.setItem('deviceSerial', serial);
          console.log('Found and cached device_serial:', serial);
          return serial;
        }
      }

      // If profile endpoint doesn't exist, try /users/me or /auth/me
      const altEndpoints = ['/users/me', '/auth/me', '/auth/profile'];
      for (const endpoint of altEndpoints) {
        try {
          const altResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (altResponse.ok) {
            const altResult = await altResponse.json();
            console.log(`Response from ${endpoint}:`, altResult);

            const data = altResult.data || altResult.user || altResult;
            const serial = data.device_serial || data.deviceSerial;

            if (serial) {
              await AsyncStorage.setItem('deviceSerial', serial);
              console.log('Found and cached device_serial from', endpoint, ':', serial);
              return serial;
            }
          }
        } catch (e) {
          console.log(`Endpoint ${endpoint} failed:`, e.message);
        }
      }

      return null;
    } catch (err) {
      console.error('Error fetching user device serial:', err);
      return null;
    }
  };

  // Get device serial - checks route params, AsyncStorage, then fetches from backend
  const getDeviceSerial = async () => {
    try {
      // Option 1: Check if passed via route params
      if (route.params?.deviceSerial) {
        console.log('Got deviceSerial from route params:', route.params.deviceSerial);
        setDeviceSerial(route.params.deviceSerial);
        return route.params.deviceSerial;
      }

      // Option 2: Check AsyncStorage (might be cached)
      let serial = await AsyncStorage.getItem('deviceSerial');
      if (serial) {
        console.log('Got deviceSerial from AsyncStorage:', serial);
        setDeviceSerial(serial);
        return serial;
      }

      // Option 3: Fetch from backend using token
      console.log('Fetching device_serial from backend...');
      serial = await fetchUserDeviceSerial();
      if (serial) {
        setDeviceSerial(serial);
        return serial;
      }

      return null;
    } catch (err) {
      console.error('Error getting device serial:', err);
      return null;
    }
  };

  // Fetch sleep data from backend
  const fetchSleepData = async (serial) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        console.log('No auth token found');
        return [];
      }

      console.log('Fetching sleep data for serial:', serial);
      const response = await fetch(`${API_BASE_URL}/vitals/sleep/data/${serial}?days=7`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log('Sleep data response:', result);

      if (result.success && result.data) {
        return result.data;
      }
      return [];
    } catch (err) {
      console.error('Error fetching sleep data:', err);
      return [];
    }
  };

  // Fetch sleep statistics
  const fetchSleepStatistics = async (serial) => {
    try {
      const token = await getAuthToken();
      if (!token) return null;

      const response = await fetch(`${API_BASE_URL}/vitals/sleep/statistics/${serial}?days=7`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (err) {
      console.error('Error fetching sleep statistics:', err);
      return null;
    }
  };

  // Fetch current sleep status
  const fetchCurrentSleepStatus = async (serial) => {
    try {
      const token = await getAuthToken();
      if (!token) return null;

      const response = await fetch(`${API_BASE_URL}/vitals/sleep/current/${serial}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        return {
          isSleeping: result.isSleeping,
          ...result.data
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching current sleep status:', err);
      return null;
    }
  };

  // Load all data
  const loadData = async () => {
    try {
      setError(null);

      let serial = deviceSerial;
      if (!serial) {
        serial = await getDeviceSerial();
      }

      console.log('Final device serial:', serial);

      if (!serial) {
        setError('No device linked to your account. Please link a device in Settings.');
        setLoading(false);
        return;
      }

      // Fetch all data in parallel
      const [sleepDataResult, statsResult, currentSleepResult] = await Promise.all([
        fetchSleepData(serial),
        fetchSleepStatistics(serial),
        fetchCurrentSleepStatus(serial)
      ]);

      setSleepData(sleepDataResult);
      setStatistics(statsResult);
      setCurrentSleep(currentSleepResult);

    } catch (err) {
      console.error('Error loading sleep data:', err);
      setError('Failed to load sleep data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Setup Socket.IO listeners for real-time updates
  const setupSocketListeners = useCallback(async () => {
    try {
      const id = await getUserId();
      if (!id) {
        console.log('No user ID found for Socket.IO');
        return;
      }

      // Connect to socket if not already connected
      if (!socketRef.current || !socketRef.current.connected) {
        console.log('Connecting to Socket.IO...');
        SocketService.connect(id);
        socketRef.current = SocketService.socket;
      }

      // Listen for sleep data updates
      if (socketRef.current) {
        // Real-time sleep session updates
        socketRef.current.on('sleep_session_update', (data) => {
          console.log('📊 Real-time sleep session update:', data);
          setCurrentSleep({
            isSleeping: data.is_sleeping,
            currentDurationMinutes: data.current_duration_minutes,
            startTime: data.start_time,
            ...data
          });
        });

        // Real-time sleep data updates for charts
        socketRef.current.on('sleep_data_updated', (data) => {
          console.log('📈 Sleep data updated:', data);
          // Refresh sleep data
          if (deviceSerial) {
            fetchSleepData(deviceSerial).then(setSleepData);
          }
        });

        // Real-time statistics updates
        socketRef.current.on('sleep_stats_updated', (data) => {
          console.log('📊 Sleep statistics updated:', data);
          setStatistics(data);
        });

        // Device went to sleep
        // In your setupSocketListeners function:
        socketRef.current.on('sleep_started', (data) => {
          console.log('😴 Sleep started:', data);
          setCurrentSleep({
            isSleeping: true,
            currentDurationMinutes: 0,
            startTime: new Date().toISOString(),
            ...data
          });
        });

        socketRef.current.on('sleep_ended', (data) => {
          console.log('⏰ Sleep ended:', data);
          setCurrentSleep({
            isSleeping: false,
            totalDurationMinutes: data.total_duration_minutes,
            endTime: new Date().toISOString(),
            ...data
          });
          loadData(); // Refresh all data
        });

        socketRef.current.on('sleep_duration_update', (data) => {
          console.log('⏱️ Sleep duration update:', data);
          setCurrentSleep(prev => ({
            ...prev,
            currentDurationMinutes: data.current_duration_minutes
          }));
        });

        socketRef.current.on('movement_status_update', (data) => {
          console.log('🏃 Movement status:', data);
          if (data.movement_status === 'sleeping') {
            setCurrentSleep({
              isSleeping: true,
              currentDurationMinutes: 0,
              startTime: new Date().toISOString()
            });
          } else {
            setCurrentSleep({ isSleeping: false });
            loadData();
          }
        });

        console.log('✅ Real-time socket listeners setup complete');
      }
    } catch (err) {
      console.error('Error setting up socket listeners:', err);
    }
  }, [deviceSerial]);

  // Setup auto-refresh interval (every 30 seconds) as fallback
  const setupAutoRefresh = useCallback(() => {
    // Clear existing interval if any
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
    }

    // Set up new interval for auto-refresh
    autoRefreshIntervalRef.current = setInterval(async () => {
      if (deviceSerial) {
        console.log('🔄 Auto-refreshing sleep data...');
        try {
          const [sleepDataResult, statsResult, currentSleepResult] = await Promise.all([
            fetchSleepData(deviceSerial),
            fetchSleepStatistics(deviceSerial),
            fetchCurrentSleepStatus(deviceSerial)
          ]);

          setSleepData(sleepDataResult);
          setStatistics(statsResult);
          setCurrentSleep(currentSleepResult);
        } catch (err) {
          console.error('Auto-refresh error:', err);
        }
      }
    }, 30000); // Refresh every 30 seconds

    console.log('✅ Auto-refresh interval setup complete');
  }, [deviceSerial]);

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Reload when route params change
  useEffect(() => {
    if (route.params?.deviceSerial) {
      setDeviceSerial(route.params.deviceSerial);
      loadData();
    }
  }, [route.params?.deviceSerial]);

  // Setup Socket.IO listeners when device serial is available
  useEffect(() => {
    if (deviceSerial && userId) {
      setupSocketListeners();
      setupAutoRefresh();
    }

    // Cleanup on unmount
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
      // Note: Don't disconnect socket here as other screens might be using it
    };
  }, [deviceSerial, userId, setupSocketListeners, setupAutoRefresh]);

  // Get user ID on component mount
  useEffect(() => {
    const initializeUserId = async () => {
      const id = await getUserId();
      setUserId(id);
    };
    initializeUserId();
  }, []);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [deviceSerial]);

  // Calculate average sleep
  const averageSleep = sleepData.length > 0
    ? (sleepData.reduce((sum, d) => sum + (d.hours || 0), 0) / sleepData.length).toFixed(1)
    : '0.0';

  // Prepare chart data
  const chartData = {
    labels: sleepData.length > 0
      ? sleepData.map(d => d.date)
      : ['No Data'],
    datasets: [{
      data: sleepData.length > 0
        ? sleepData.map(d => d.hours || 0)
        : [0]
    }]
  };

  // Format duration for display
  const formatDuration = (minutes) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  useEffect(() => {
    if (userId) {
      SocketService.connect(userId, (data) => {
        // Update state with real-time data
        setSleepData((prevData) => [...prevData, data]);
      });
    }

    return () => {
      SocketService.disconnect();
    };
  }, [userId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0091EA" />
          <Text style={styles.loadingText}>Loading sleep data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0091EA']}
            tintColor="#0091EA"
          />
        }
      >
        <View style={styles.headerContainer}>
          {/* Header */}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#0091EA" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sleep Patterns</Text>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={24} color="#FF5252" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Current Sleep Status */}
        {currentSleep && currentSleep.isSleeping && (
          <View style={styles.currentSleepCard}>
            <View style={styles.currentSleepHeader}>
              <Ionicons name="moon" size={28} color="#0091EA" />
              <Text style={styles.currentSleepTitle}>Currently Sleeping</Text>
            </View>
            <Text style={styles.currentSleepDuration}>
              {formatDuration(currentSleep.currentDurationMinutes)} ago
            </Text>
            {/* <Text style={styles.currentSleepSubtext}>
              Started at {new Date(currentSleep.startTime).toLocaleTimeString()}
            </Text> */}
          </View>
        )}

        {/* Average Sleep Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Average Sleep Duration</Text>
          <Text style={styles.value}>{averageSleep} hours</Text>
          <Text style={styles.infoText}>
            {sleepData.length > 0
              ? `Based on ${sleepData.length} days of data`
              : 'No sleep data recorded yet'}
          </Text>
        </View>

        {/* Sleep Data Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sleep Data (Past 7 Days)</Text>
          <View style={styles.chartContainer}>
            {sleepData.length > 0 ? (
              <LineChart
                data={chartData}
                width={screenWidth - 60}
                height={220}
                yAxisSuffix="h"
                yAxisInterval={1}
                chartConfig={{
                  backgroundGradientFrom: '#E6F7FF',
                  backgroundGradientTo: '#E6F7FF',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(0, 145, 234, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  propsForDots: {
                    r: '5',
                    strokeWidth: '2',
                    stroke: '#0091EA',
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                    stroke: '#E0E0E0',
                    strokeWidth: 1,
                  },
                }}
                bezier
                style={styles.chart}
                fromZero={true}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="bed-outline" size={48} color="#BDBDBD" />
                <Text style={styles.noDataText}>No sleep data available yet</Text>
                <Text style={styles.noDataSubtext}>
                  Sleep tracking will begin when the device detects sleep patterns
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sleep Tips</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>💤</Text>
            <Text style={styles.tipText}>
              Keep a consistent bedtime routine for your baby.
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>🌙</Text>
            <Text style={styles.tipText}>
              Ensure a quiet, comfortable sleeping environment.
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>☀️</Text>
            <Text style={styles.tipText}>
              Monitor nap times to maintain a healthy sleep cycle.
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>🍼</Text>
            <Text style={styles.tipText}>
              Feed baby before sleep to help them rest longer.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F7FF',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0091EA',
    textAlign: 'center',
    paddingLeft: 20,
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#D32F2F',
    marginLeft: 10,
    flex: 1,
  },
  currentSleepCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0091EA',
  },
  currentSleepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  currentSleepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0091EA',
    marginLeft: 10,
  },
  currentSleepDuration: {
    fontSize: 36,
    fontWeight: '700',
    color: '#0091EA',
  },
  currentSleepSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0091EA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0091EA',
    marginBottom: 10,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#777',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statItem: {
    width: '48%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0091EA',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  dailyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dailyLeft: {
    flex: 1,
  },
  dailyDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  dailySessions: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  dailyRight: {
    alignItems: 'flex-end',
  },
  dailyHours: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0091EA',
  },
  dailyMinutes: {
    fontSize: 12,
    color: '#999',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    lineHeight: 20,
  },
  chartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  chart: {
    borderRadius: 16,
  },
});