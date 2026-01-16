import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function TemperatureDetailScreen({ navigation, route }) {
  const { value = 0 } = route.params || {};

  // Get status based on temperature value (matching the threshold table)
  const getTemperatureStatus = (temp) => {
    if (temp === null || temp === undefined || temp === 0) {
      return { status: 'normal', label: 'No Reading', color: '#4CAF50' };
    }
    // Critical: <35.5°C OR >=38.0°C
    if (temp < 35.5 || temp >= 38.0) {
      return { status: 'critical', label: 'Critical', color: '#FF5252' };
    }
    // Warning: 35.5-35.9°C OR 37.6-37.9°C
    if ((temp >= 35.5 && temp <= 35.9) || (temp >= 37.6 && temp <= 37.9)) {
      return { status: 'warning', label: 'Outside Ideal Range', color: '#FF9800' };
    }
    // Normal: 36.0-37.5°C
    return { status: 'normal', label: 'Normal Range', color: '#4CAF50' };
  };

  const tempStatus = getTemperatureStatus(value);

  // Get icon color based on status
  const getIconColor = () => {
    if (tempStatus.status === 'critical') return '#FF5252';
    if (tempStatus.status === 'warning') return '#FF9800';
    return '#0091EA';
  };

  // Get icon container background based on status
  const getIconContainerStyle = () => {
    if (tempStatus.status === 'critical') return styles.iconContainerCritical;
    if (tempStatus.status === 'warning') return styles.iconContainerWarning;
    return styles.iconContainerNormal;
  };

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
        <Text style={styles.headerTitle}>Temperature</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Value Card */}
        <View style={styles.currentCard}>
          <View style={[styles.iconContainer, getIconContainerStyle()]}>
            <Ionicons name="thermometer" size={48} color={getIconColor()} />
          </View>
          <Text style={[styles.currentValue, { color: getIconColor() }]}>
            {value ? Number(value).toFixed(1) : '--'}
          </Text>
          <Text style={styles.currentUnit}>°C</Text>
          <View style={[
            styles.statusBadge,
            tempStatus.status === 'critical' && styles.statusBadgeCritical,
            tempStatus.status === 'warning' && styles.statusBadgeWarning,
          ]}>
            <Text style={[styles.statusText, { color: tempStatus.color }]}>
              {tempStatus.label}
            </Text>
          </View>
        </View>

        {/* Reference Information */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Normal Temperature Range for Infants</Text>
          <Text style={styles.infoText}>
            • Normal Range: 36.0°C – 37.5°C{'\n'}
            • Borderline Low: 35.5°C – 35.9°C{'\n'}
            • Borderline High: 37.6°C – 37.9°C{'\n'}
            • Alert Low: Below 35.5°C (Hypothermia){'\n'}
            • Alert High: 38.0°C and above (Fever)
          </Text>
          <Text style={styles.infoNote}>
            Note: Body temperature varies throughout the day and with activity. Consult your pediatrician if temperature is consistently abnormal.
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
  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
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