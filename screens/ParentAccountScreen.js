import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ParentAccountScreen({ navigation }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    countryCode: '+63',
    dateOfBirth: '',
    gender: '',
    country: '',
    address: ''
  });

  const [editedData, setEditedData] = useState({});

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const response = await fetch('https://little-watch-backend.onrender.com/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setUserData({
          name: data.data.full_name || '',
          email: data.data.email || '',
          phoneNumber: data.data.phone_number || '',
          countryCode: data.data.country_code || '+63',
          dateOfBirth: data.data.date_of_birth || '',
          gender: data.data.gender || '',
          country: data.data.country || '',
          address: data.data.address || ''
        });
        setEditedData({
          name: data.data.name || '',
          phoneNumber: data.data.phone_number || '',
          countryCode: data.data.country_code || '+63',
          dateOfBirth: data.data.date_of_birth || '',
          gender: data.data.gender || '',
          country: data.data.country || '',
          address: data.data.address || ''
        });
      } else {
        Alert.alert('Error', data.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('token');

      // Only send the fields that were actually edited
      const updatePayload = {};
      if (editedData.name && editedData.name !== userData.name) {
        updatePayload.name = editedData.name;
      }

      // If no changes were made
      if (Object.keys(updatePayload).length === 0) {
        Alert.alert('Info', 'No changes to save');
        setIsEditing(false);
        setSaving(false);
        return;
      }

      const response = await fetch('https://little-watch-backend.onrender.com/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      const data = await response.json();

      if (data.success) {
        setUserData({ ...userData, ...updatePayload });
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');

        // Update stored name if changed
        if (updatePayload.name) {
          await AsyncStorage.setItem('userName', updatePayload.name);
        }
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedData({
      name: userData.name,
      phoneNumber: userData.phoneNumber,
      countryCode: userData.countryCode,
      dateOfBirth: userData.dateOfBirth,
      gender: userData.gender,
      country: userData.country,
      address: userData.address
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0091EA" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0091EA" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Parent Account</Text>
          <TouchableOpacity
            onPress={() => {
              if (isEditing) {
                handleSave();
              } else {
                setIsEditing(true);
              }
            }}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#0091EA" />
            ) : (
              <Ionicons
                name={isEditing ? "checkmark" : "create-outline"}
                size={24}
                color="#0091EA"
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle-outline" size={80} color="#0091EA" />
          </View>
          <Text style={styles.name}>{userData.name}</Text>
          <Text style={styles.email}>{userData.email}</Text>
        </View>

        {/* Account Info */}
        <View style={styles.infoCard}>
          {/* Name */}
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={22} color="#0091EA" />
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={editedData.name}
                onChangeText={(text) => setEditedData({ ...editedData, name: text })}
                placeholder="Name"
                placeholderTextColor={'#ccc'}
              />
            ) : (
              <Text style={styles.infoText}>{userData.name}</Text>
            )}
          </View>

          {/* Email (read-only) */}
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={22} color="#0091EA" />
            <Text style={styles.infoText}>{userData.email}</Text>
          </View>
        </View>

        {/* Change Password Button */}
        <TouchableOpacity
          style={styles.changePasswordButton}
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <Ionicons name="lock-closed-outline" size={20} color="#fff" />
          <Text style={styles.changePasswordText}>Change Password</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E6F7FF', padding: 20 },
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#0091EA' },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 30,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  avatarContainer: { marginBottom: 10 },
  name: { fontSize: 18, fontWeight: '600', color: '#333' },
  email: { fontSize: 14, color: '#999' },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    minHeight: 40,
  },
  infoText: { fontSize: 15, color: '#333', marginLeft: 12, flex: 1 },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  phoneContainer: {
    flex: 1,
    flexDirection: 'row',
    marginLeft: 12,
  },
  countryCodeInput: {
    flex: 0.3,
    marginRight: 8,
    marginLeft: 0,
  },
  phoneInput: {
    flex: 0.7,
    marginLeft: 0,
  },
  addressInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  genderContainer: {
    flex: 1,
    flexDirection: 'row',
    marginLeft: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#0091EA',
    borderColor: '#0091EA',
  },
  genderText: {
    fontSize: 14,
    color: '#666',
  },
  genderTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FF5252',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  changePasswordButton: {
    backgroundColor: '#0091EA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 20,
  },
  changePasswordText: { color: '#fff', fontWeight: '600', fontSize: 16, marginLeft: 8 },
});