import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    Modal,
    ActivityIndicator,
    BackHandler
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://little-watch-backend.onrender.com/api';

export default function BandTrackerScreen({ navigation }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [isScanning, setIsScanning] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [connectedDevice, setConnectedDevice] = useState(null);


    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            return true; // Prevent default back action
        });

        return () => backHandler.remove();
    }, []);
    
    useEffect(() => {
        checkConnectedDevice();
    }, []);

    const checkConnectedDevice = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_URL}/user/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await response.json();
            if (result.success && result.data.device_serial) {
                setConnectedDevice({
                    device_serial: result.data.device_serial,
                });
            }
        } catch (error) {
            console.error('Error checking connected device:', error);
        }
    };

    const handleOpenScanner = async () => {
        if (!permission?.granted) {
            const result = await requestPermission();
            if (!result.granted) {
                Alert.alert(
                    'Camera Permission Required',
                    'Please allow camera access to scan QR codes.',
                    [{ text: 'OK' }]
                );
                return;
            }
        }
        setScanned(false);
        setIsScanning(true);
    };

    const handleBarCodeScanned = async ({ type, data }) => {
        if (scanned) return;
        setScanned(true);
        setIsScanning(false);
        setIsLoading(true);

        try {
            const device_serial = data.trim();
            console.log('Scanned Device Serial:', device_serial);

            const token = await AsyncStorage.getItem('token');

            if (!token) {
                Alert.alert('Error', 'Please login first');
                navigation.replace('Login');
                return;
            }

            const response = await fetch(`${API_URL}/devices/link`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    device_serial: device_serial,
                }),
            });

            const result = await response.json();

            if (result.success) {
                setConnectedDevice({
                    device_serial: device_serial,
                });

                Alert.alert(
                    'Success!',
                    'Band tracker connected successfully.',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert('Error', result.message || 'Failed to link device');
            }
        } catch (error) {
            console.error('Error processing QR code:', error);
            Alert.alert('Error', 'Failed to process QR code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisconnect = async () => {
        Alert.alert(
            'Disconnect Device',
            'Are you sure you want to disconnect this band tracker?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Disconnect',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');

                            if (token) {
                                const response = await fetch(`${API_URL}/devices/unlink`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${token}`,
                                    },
                                });

                                const result = await response.json();

                                if (result.success) {
                                    setConnectedDevice(null);
                                    Alert.alert('Success', 'Device disconnected');
                                } else {
                                    Alert.alert('Error', result.message || 'Failed to disconnect');
                                }
                            }
                        } catch (error) {
                            console.error('Disconnect error:', error);
                            Alert.alert('Error', 'Failed to disconnect device');
                        }
                    },
                },
            ]
        );
    };

    const handleProceedToTracking = () => {
        navigation.navigate('Home');
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
                <Text style={styles.headerTitle}>Band Tracker</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.content}>
                {/* Device Status */}
                {connectedDevice ? (
                    <View style={styles.connectedCard}>
                        <View style={styles.connectedHeader}>
                            <View style={styles.connectedIcon}>
                                <Ionicons name="watch" size={40} color="#0091EA" />
                            </View>
                            <View style={styles.connectedInfo}>
                                <Text style={styles.connectedTitle}>LittleWatch Band</Text>
                                <View style={styles.statusRow}>
                                    <View style={styles.statusDot} />
                                    <Text style={styles.statusText}>Connected</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.deviceDetails}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Device Serial</Text>
                                <Text style={styles.detailValue}>{connectedDevice.device_serial}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Status</Text>
                                <Text style={styles.detailValue}>Active</Text>
                            </View>
                        </View>

                        {/* Proceed to Tracking Button */}
                        <TouchableOpacity
                            style={styles.proceedButton}
                            onPress={handleProceedToTracking}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="pulse-outline" size={24} color="#FFFFFF" />
                            <Text style={styles.proceedButtonText}>Proceed to Tracking</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.disconnectButton}
                            onPress={handleDisconnect}
                        >
                            <Ionicons name="close-circle-outline" size={20} color="#FF5252" />
                            <Text style={styles.disconnectText}>Disconnect Device</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.noDeviceCard}>
                        <View style={styles.noDeviceIcon}>
                            <Ionicons name="watch-outline" size={60} color="#B0BEC5" />
                        </View>
                        <Text style={styles.noDeviceTitle}>No Device Connected</Text>
                        <Text style={styles.noDeviceSubtitle}>
                            Scan the QR code on your LittleWatch band to connect
                        </Text>
                    </View>
                )}

                {/* Scan Button - Only show if no device connected */}
                {!connectedDevice && (
                    <TouchableOpacity
                        style={styles.scanButton}
                        onPress={handleOpenScanner}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="qr-code-outline" size={24} color="#FFFFFF" />
                        <Text style={styles.scanButtonText}>Scan QR Code</Text>
                    </TouchableOpacity>
                )}

                {/* Instructions */}
                <View style={styles.instructionsCard}>
                    <Text style={styles.instructionsTitle}>How to Connect</Text>
                    <View style={styles.instructionStep}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <Text style={styles.stepText}>
                            Turn on your LittleWatch band
                        </Text>
                    </View>
                    <View style={styles.instructionStep}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <Text style={styles.stepText}>
                            Find the QR code on the band or in the box
                        </Text>
                    </View>
                    <View style={styles.instructionStep}>
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <Text style={styles.stepText}>
                            Tap "Scan QR Code" and point your camera at it
                        </Text>
                    </View>
                </View>
            </View>

            {/* QR Scanner Modal */}
            <Modal
                visible={isScanning}
                animationType="slide"
                onRequestClose={() => setIsScanning(false)}
            >
                <SafeAreaView style={styles.scannerContainer}>
                    <View style={styles.scannerHeader}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setIsScanning(false)}
                        >
                            <Ionicons name="close" size={28} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.scannerTitle}>Scan QR Code</Text>
                        <View style={styles.placeholder} />
                    </View>

                    <CameraView
                        style={styles.camera}
                        facing="back"
                        barcodeScannerSettings={{
                            barcodeTypes: ['qr'],
                        }}
                        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    >
                        <View style={styles.scannerOverlay}>
                            <View style={styles.scannerFrame}>
                                <View style={[styles.corner, styles.topLeft]} />
                                <View style={[styles.corner, styles.topRight]} />
                                <View style={[styles.corner, styles.bottomLeft]} />
                                <View style={[styles.corner, styles.bottomRight]} />
                            </View>
                            <Text style={styles.scannerHint}>
                                Position the QR code within the frame
                            </Text>
                        </View>
                    </CameraView>
                </SafeAreaView>
            </Modal>

            {/* Loading Overlay */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingCard}>
                        <ActivityIndicator size="large" color="#0091EA" />
                        <Text style={styles.loadingText}>Connecting device...</Text>
                    </View>
                </View>
            )}
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
    connectedCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    connectedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    connectedIcon: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    connectedInfo: {
        marginLeft: 16,
        flex: 1,
    },
    connectedTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 6,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4CAF50',
        marginRight: 8,
    },
    statusText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '500',
    },
    deviceDetails: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    proceedButton: {
        flexDirection: 'row',
        backgroundColor: '#4CAF50',
        borderRadius: 30,
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    proceedButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    disconnectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    disconnectText: {
        fontSize: 14,
        color: '#FF5252',
        fontWeight: '600',
        marginLeft: 8,
    },
    noDeviceCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 40,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    noDeviceIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#ECEFF1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    noDeviceTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    noDeviceSubtitle: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        lineHeight: 20,
    },
    scanButton: {
        flexDirection: 'row',
        backgroundColor: '#0091EA',
        borderRadius: 30,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#0091EA',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    scanButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    instructionsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    instructionStep: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    stepNumberText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0091EA',
    },
    stepText: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    scannerContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    scannerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    camera: {
        flex: 1,
    },
    scannerOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerFrame: {
        width: 250,
        height: 250,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#0091EA',
    },
    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 8,
    },
    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 8,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 8,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 8,
    },
    scannerHint: {
        color: '#FFFFFF',
        fontSize: 14,
        marginTop: 30,
        textAlign: 'center',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 30,
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#333',
        marginTop: 16,
    },
});