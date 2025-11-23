import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'warning',
      title: 'Temperature Alert',
      message: 'Baby\'s temperature is above normal range (37.8°C)',
      time: '5 minutes ago',
      read: false,
      icon: 'thermometer',
      color: '#FF9800',
    },
    {
      id: 2,
      type: 'info',
      title: 'Device Connected',
      message: 'LittleWatch Band successfully connected',
      time: '1 hour ago',
      read: false,
      icon: 'checkmark-circle',
      color: '#4CAF50',
    },
    {
      id: 3,
      type: 'critical',
      title: 'Oxygen Level Low',
      message: 'Oxygen saturation dropped to 93%',
      time: '2 hours ago',
      read: true,
      icon: 'water',
      color: '#FF5252',
    },
    {
      id: 4,
      type: 'info',
      title: 'Sleep Pattern',
      message: 'Baby has been sleeping for 2 hours',
      time: '3 hours ago',
      read: true,
      icon: 'moon',
      color: '#9C27B0',
    },
    {
      id: 5,
      type: 'warning',
      title: 'Low Battery',
      message: 'Band battery is at 15%, please charge',
      time: '5 hours ago',
      read: true,
      icon: 'battery-dead',
      color: '#FF9800',
    },
    {
      id: 6,
      type: 'info',
      title: 'Heart Rate Normal',
      message: 'Heart rate returned to normal range',
      time: 'Yesterday',
      read: true,
      icon: 'heart',
      color: '#4CAF50',
    },
  ]);

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    Alert.alert('Success', 'All notifications marked as read');
  };

  const clearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => setNotifications([]),
        },
      ]
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => Alert.alert('Options', 'Notification settings')}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#0091EA" />
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      {notifications.length > 0 && (
        <View style={styles.actionBar}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={markAllAsRead}
          >
            <Ionicons name="checkmark-done" size={18} color="#0091EA" />
            <Text style={styles.actionButtonText}>Mark all read</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={clearAll}
          >
            <Ionicons name="trash-outline" size={18} color="#FF5252" />
            <Text style={[styles.actionButtonText, { color: '#FF5252' }]}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off" size={64} color="#B3E5FC" />
            <Text style={styles.emptyStateTitle}>No Notifications</Text>
            <Text style={styles.emptyStateText}>
              You're all caught up! We'll notify you of any important updates.
            </Text>
          </View>
        ) : (
          <>
            {/* Unread Notifications */}
            {unreadCount > 0 && (
              <>
                <Text style={styles.sectionTitle}>New ({unreadCount})</Text>
                {notifications.filter(n => !n.read).map((notif) => (
                  <TouchableOpacity
                    key={notif.id}
                    style={[styles.notificationCard, styles.notificationUnread]}
                    onPress={() => markAsRead(notif.id)}
                  >
                    <View style={[styles.notificationIcon, { backgroundColor: notif.color + '20' }]}>
                      <Ionicons name={notif.icon} size={24} color={notif.color} />
                    </View>
                    <View style={styles.notificationContent}>
                      <View style={styles.notificationHeader}>
                        <Text style={styles.notificationTitle}>{notif.title}</Text>
                        <View style={styles.unreadDot} />
                      </View>
                      <Text style={styles.notificationMessage}>{notif.message}</Text>
                      <Text style={styles.notificationTime}>{notif.time}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Read Notifications */}
            {notifications.filter(n => n.read).length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Earlier</Text>
                {notifications.filter(n => n.read).map((notif) => (
                  <View
                    key={notif.id}
                    style={styles.notificationCard}
                  >
                    <View style={[styles.notificationIcon, { backgroundColor: notif.color + '15' }]}>
                      <Ionicons name={notif.icon} size={24} color={notif.color} />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={[styles.notificationTitle, { color: '#666' }]}>{notif.title}</Text>
                      <Text style={[styles.notificationMessage, { color: '#999' }]}>{notif.message}</Text>
                      <Text style={styles.notificationTime}>{notif.time}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}
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
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0091EA',
  },
  headerBadge: {
    backgroundColor: '#FF5252',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0091EA',
    marginLeft: 6,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  notificationCard: {
    flexDirection: 'row',
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
  notificationUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#0091EA',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0091EA',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});