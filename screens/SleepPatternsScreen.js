import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

export default function SleepPatternsScreen() {
  const [sleepData] = useState([
    { date: 'Nov 5', hours: 6.5 },
    { date: 'Nov 6', hours: 7.2 },
    { date: 'Nov 7', hours: 8.1 },
    { date: 'Nov 8', hours: 5.9 },
    { date: 'Nov 9', hours: 7.4 },
  ]);

  const navigation = useNavigation();

  const averageSleep = (
    sleepData.reduce((sum, d) => sum + d.hours, 0) / sleepData.length
  ).toFixed(1);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          {/* Header */}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#0091EA" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sleep Patterns</Text>
        </View>

        {/* Average Sleep Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Average Sleep Duration</Text>
          <Text style={styles.value}>{averageSleep} hrs/night</Text>
          <Text style={styles.infoText}>
            Good sleep helps maintain your baby’s healthy growth.
          </Text>
        </View>

        {/* Sleep Data Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sleep Data (Past 5 Days)</Text>
          <LineChart
            data={{
              labels: sleepData.map(d => d.date),
              datasets: [{ data: sleepData.map(d => d.hours) }],
            }}
            width={screenWidth - 60}
            height={220}
            yAxisSuffix="h"
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
            }}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Sleep Tips */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sleep Tips</Text>
          <Text style={styles.tipText}>
            💤 Keep a consistent bedtime routine.
          </Text>
          <Text style={styles.tipText}>
            🌙 Ensure a quiet, comfortable sleeping environment.
          </Text>
          <Text style={styles.tipText}>
            ☀️ Monitor nap times to maintain a healthy sleep cycle.
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
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerContainer: {
    flexDirection: 'row',
    marginVertical: 20
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0091EA',
    textAlign: 'center',
    paddingLeft: 20
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
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#777',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  tipText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
  },
});
