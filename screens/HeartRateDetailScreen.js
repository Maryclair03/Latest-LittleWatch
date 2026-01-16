import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

export default function HeartRateDetailScreen({ navigation, route }) {
  const { value = 0 } = route.params || {};

  // Get status based on heart rate value (matching the threshold table)
  const getHeartRateStatus = (hr) => {
    if (hr === null || hr === undefined || hr === 0) {
      return { status: 'normal', label: 'No Reading', color: '#4CAF50' };
    }
    // Critical: <80 bpm OR >170 bpm
    if (hr < 80 || hr > 170) {
      return { status: 'critical', label: 'Critical', color: '#FF5252' };
    }
    // Warning: 80-89 bpm OR 161-170 bpm
    if ((hr >= 80 && hr <= 89) || (hr >= 161 && hr <= 170)) {
      return { status: 'warning', label: 'Outside Ideal Range', color: '#FF9800' };
    }
    // Normal: 90-160 bpm
    return { status: 'normal', label: 'Normal Range', color: '#4CAF50' };
  };

  const heartStatus = getHeartRateStatus(value);

  // Get icon color based on status
  const getIconColor = () => {
    if (heartStatus.status === 'critical') return '#FF5252';
    if (heartStatus.status === 'warning') return '#FF9800';
    return '#0091EA';
  };

  // Get icon container background based on status
  const getIconContainerStyle = () => {
    if (heartStatus.status === 'critical') return styles.iconContainerCritical;
    if (heartStatus.status === 'warning') return styles.iconContainerWarning;
    return styles.iconContainerNormal;
  };

  // Sample data for chart - replace with real Firebase data
  const chartData = [
    { time: '00:00', rate: 110 },
    { time: '04:00', rate: 105 },
    { time: '08:00', rate: 120 },
    { time: '12:00', rate: 125 },
    { time: '16:00', rate: 118 },
    { time: '20:00', rate: 115 },
    { time: '24:00', rate: 120 },
  ];

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
        <Text style={styles.headerTitle}>Heart Rate</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Value Card */}
        <View style={styles.currentCard}>
          <View style={[styles.iconContainer, getIconContainerStyle()]}>
            <Ionicons name="heart" size={48} color={getIconColor()} />
          </View>
          <Text style={[styles.currentValue, { color: getIconColor() }]}>
            {value || '--'}
          </Text>
          <Text style={styles.currentUnit}>BPM</Text>
          <View style={[
            styles.statusBadge,
            heartStatus.status === 'critical' && styles.statusBadgeCritical,
            heartStatus.status === 'warning' && styles.statusBadgeWarning,
          ]}>
            <Text style={[styles.statusText, { color: heartStatus.color }]}>
              {heartStatus.label}
            </Text>
          </View>
        </View>

        {/* Reference Information */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Normal Range for Infants</Text>
          <Text style={styles.infoText}>
            • Normal Range: 90–160 BPM{'\n'}
            • Borderline: 80–89 or 161–170 BPM{'\n'}
            • Alert Low: Below 80 BPM (Bradycardia){'\n'}
            • Alert High: Above 170 BPM (Tachycardia)
          </Text>
          <Text style={styles.infoNote}>
            Note: Heart rate varies with activity, sleep, and emotion. Persistent
            readings outside normal range require medical evaluation.
          </Text>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  currentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainerNormal: {
    backgroundColor: '#E3F2FD',
  },
  iconContainerWarning: {
    backgroundColor: '#FFF3E0',
  },
  iconContainerCritical: {
    backgroundColor: '#FFEBEE',
  },
  currentValue: {
    fontSize: 56,
    fontWeight: '700',
    color: '#0091EA',
  },
  currentUnit: {
    fontSize: 18,
    color: '#999',
    marginBottom: 16,
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusBadgeWarning: {
    backgroundColor: '#FFF3E0',
  },
  statusBadgeCritical: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  statsCard: {
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
  chartCard: {
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
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0091EA',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  infoNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});