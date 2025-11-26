import React, { useState, useEffect, useCallback } from 'react';
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

const API_URL = 'https://little-watch-backend.onrender.com/api'; // ← UPDATE THIS TO YOUR SERVER IP
const PAGE_SIZE = 20; // Load 20 items at a time

export default function VitalsTimelineScreen({ navigation }) {
  const [selectedPeriod, setSelectedPeriod] = useState('24H');
  const [timelineData, setTimelineData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deviceSerial, setDeviceSerial] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);

  // Fetch data when screen comes into focus or period changes
  useFocusEffect(
    useCallback(() => {
      // Reset pagination when period changes
      setCurrentPage(1);
      setTimelineData([]);
      setHasMoreData(true);
      fetchVitalsHistory(true); // true = reset data
    }, [selectedPeriod])
  );

  const fetchVitalsHistory = async (reset = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setCurrentPage(1);
        setTimelineData([]);
        setHasMoreData(true);
      } else {
        setIsLoadingMore(true);
      }

      const token = await AsyncStorage.getItem('token');

      if (!token) {
        navigation.replace('Login');
        return;
      }

      // First, get user profile to get device_serial
      const profileResponse = await fetch(`${API_URL}/user/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const profileResult = await profileResponse.json();

      if (!profileResult.success || !profileResult.data.device_serial) {
        console.log('No device linked to user');
        setIsLoading(false);
        setIsLoadingMore(false);
        return;
      }

      const serial = profileResult.data.device_serial;
      setDeviceSerial(serial);

      const pageToFetch = reset ? 1 : currentPage;

      // Fetch vitals history for the device with pagination
      const historyResponse = await fetch(
        `${API_URL}/vitals/history-by-serial/${serial}?period=${selectedPeriod}&page=${pageToFetch}&limit=${PAGE_SIZE}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const historyResult = await historyResponse.json();

      console.log('📊 History Result:', historyResult);
      console.log('📊 Page:', pageToFetch, 'Items:', historyResult.data?.readings?.length);

      if (historyResult.success && historyResult.data) {
        const newReadings = historyResult.data.readings || [];
        
        if (reset) {
          // First load - replace all data
          setTimelineData(newReadings);
          setSummaryData(historyResult.data.summary || null);
        } else {
          // Load more - append to existing data
          setTimelineData(prev => [...prev, ...newReadings]);
        }

        // Check if there's more data
        if (newReadings.length < PAGE_SIZE) {
          setHasMoreData(false);
        } else {
          setHasMoreData(true);
          setCurrentPage(pageToFetch + 1);
        }
      } else {
        if (reset) {
          setTimelineData([]);
          setSummaryData(null);
        }
        setHasMoreData(false);
      }
    } catch (error) {
      console.error('Error fetching vitals history:', error);
      if (reset) {
        setTimelineData([]);
        setSummaryData(null);
      }
      setHasMoreData(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMoreData = () => {
    if (!isLoadingMore && hasMoreData && timelineData.length > 0) {
      console.log('📥 Loading more data... Page:', currentPage);
      fetchVitalsHistory(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVitalsHistory(true);
    setRefreshing(false);
  };

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    
    // Check if user scrolled to bottom
    const isCloseToBottom = 
      layoutMeasurement.height + contentOffset.y >= 
      contentSize.height - paddingToBottom;

    if (isCloseToBottom && hasMoreData && !isLoadingMore) {
      loadMoreData();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // Helper function to safely get numeric value
  const getSafeNumber = (value, decimals = 0) => {
    if (value === null || value === undefined || value === '' || isNaN(value)) {
      return '--';
    }
    const num = Number(value);
    return decimals > 0 ? num.toFixed(decimals) : Math.round(num);
  };

  const periods = ['24H', '1W', '1M'];

  const VitalItem = ({ icon, label, value, unit, color }) => (
    <View style={styles.vitalItem}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={styles.vitalItemLabel}>{label}:</Text>
      <Text style={[styles.vitalItemValue, { color }]}>
        {value}
        {unit}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#0091EA" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Vitals Timeline</Text>
          <View style={styles.filterButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0091EA" />
          <Text style={styles.loadingText}>Loading vitals history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#0091EA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vitals Timeline</Text>
        <View style={styles.filterButton} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0091EA']}
            tintColor="#0091EA"
          />
        }
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive,
                ]}
              >
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Card */}
        {summaryData && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Summary ({selectedPeriod})</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Ionicons name="heart" size={20} color="#0091EA" />
                <Text style={styles.summaryLabel}>Avg Heart Rate</Text>
                <Text style={styles.summaryValue}>
                  {getSafeNumber(
                    summaryData.avg_heart_rate || summaryData.avgHeartRate,
                    0
                  )}{' '}
                  BPM
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="thermometer" size={20} color="#FF9800" />
                <Text style={styles.summaryLabel}>Avg Temperature</Text>
                <Text style={styles.summaryValue}>
                  {getSafeNumber(
                    summaryData.avg_temperature || summaryData.avgTemperature,
                    1
                  )}
                  °C
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="water" size={20} color="#00BCD4" />
                <Text style={styles.summaryLabel}>Avg Oxygen</Text>
                <Text style={styles.summaryValue}>
                  {getSafeNumber(
                    summaryData.avg_oxygen_saturation || summaryData.avgOxygen,
                    1
                  )}
                  %
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="trending-up" size={20} color="#4CAF50" />
                <Text style={styles.summaryLabel}>Total Readings</Text>
                <Text style={styles.summaryValue}>
                  {summaryData.total_readings ||
                    summaryData.totalReadings ||
                    '...'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Timeline History</Text>
            <Text style={styles.loadedCount}>
              {timelineData.length} loaded
            </Text>
          </View>
          
          {timelineData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={64} color="#CCC" />
              <Text style={styles.emptyStateText}>No vitals data found</Text>
              <Text style={styles.emptyStateSubtext}>
                {selectedPeriod === '24H'
                  ? 'Try selecting a different time period or check if your device is syncing data'
                  : 'No readings available for this period'}
              </Text>
            </View>
          ) : (
            <>
              {timelineData.map((entry, index) => (
                <View key={entry.reading_id || index} style={styles.timelineCard}>
                  <View style={styles.timelineHeader}>
                    <View style={styles.timelineTime}>
                      <Ionicons name="time" size={16} color="#0091EA" />
                      <Text style={styles.timelineTimeText}>
                        {formatTime(entry.timestamp)}
                      </Text>
                    </View>
                    <Text style={styles.timelineDate}>
                      {formatDate(entry.timestamp)}
                    </Text>
                  </View>
                  <View style={styles.timelineVitals}>
                    <VitalItem
                      icon="heart"
                      label="HR"
                      value={getSafeNumber(entry.heart_rate, 0)}
                      unit=" BPM"
                      color="#0091EA"
                    />
                    <VitalItem
                      icon="thermometer"
                      label="Temp"
                      value={getSafeNumber(entry.temperature, 1)}
                      unit="°C"
                      color="#FF9800"
                    />
                    <VitalItem
                      icon="water"
                      label="SpO₂"
                      value={getSafeNumber(entry.oxygen_saturation, 0)}
                      unit="%"
                      color="#00BCD4"
                    />
                    <VitalItem
                      icon="body"
                      label="Move"
                      value={entry.movement_status || '--'}
                      unit=""
                      color="#9C27B0"
                    />
                    {(entry.is_alert === 1 || entry.is_alert === true) && (
                      <View style={styles.alertBadge}>
                        <Ionicons name="warning" size={14} color="#FF5252" />
                        <Text style={styles.alertText}>Alert</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}

              {/* Loading More Indicator */}
              {isLoadingMore && (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color="#0091EA" />
                  <Text style={styles.loadingMoreText}>Loading more...</Text>
                </View>
              )}

              {/* End of Data Indicator */}
              {!hasMoreData && timelineData.length > 0 && (
                <View style={styles.endOfDataContainer}>
                  <View style={styles.endOfDataLine} />
                  <Text style={styles.endOfDataText}>
                    {selectedPeriod === '24H' 
                      ? 'No more data in last 24 hours'
                      : selectedPeriod === '1W'
                      ? 'No more data in last week'
                      : 'No more data in last month'}
                  </Text>
                  <View style={styles.endOfDataLine} />
                </View>
              )}
            </>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0091EA',
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
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
  content: {
    flex: 1,
    padding: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 26,
  },
  periodButtonActive: {
    backgroundColor: '#0091EA',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
  },
  timelineSection: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  loadedCount: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#BBB',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timelineTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineTimeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  timelineDate: {
    fontSize: 13,
    color: '#999',
  },
  timelineVitals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  vitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 8,
  },
  vitalItemLabel: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  vitalItemValue: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF5252',
    marginLeft: 4,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  endOfDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  endOfDataLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  endOfDataText: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 15,
    textAlign: 'center',
  },
});