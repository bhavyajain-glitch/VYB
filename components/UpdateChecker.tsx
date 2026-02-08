import { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Linking, Platform, Alert, AppState, AppStateStatus } from 'react-native';
import { Download, X, AlertTriangle, Sparkles, RefreshCcw, Info } from 'lucide-react-native';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInUp, useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';

const LIME = '#D4FF00';

// API URL - same as your main API
const API_URL = 'https://campusconnect-api-nx9k.onrender.com/api';

interface UpdateInfo {
  type: 'ota' | 'apk';
  updateAvailable: boolean;
  version?: string;
  channel?: string;
  forceUpdate: boolean;
  apkUrl?: string | null;
  releaseNotes?: string | null;
}

export default function UpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const appState = useRef(AppState.currentState);

  // Animation for the refresh icon
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Initial check
    checkUpdateFlow();

    // Re-check when app comes to foreground
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        checkUpdateFlow();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (processing && updateInfo?.type === 'ota') {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotation.value = 0;
    }
  }, [processing, updateInfo]);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const checkUpdateFlow = async () => {
    // Don't check if modal is already showing or if we are already processing
    if (showModal || processing) return;

    try {
      // 1. Check for OTA Updates first (if not in development)
      if (!__DEV__) {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          setUpdateInfo({
            type: 'ota',
            updateAvailable: true,
            channel: Updates.channel || 'unknown',
            forceUpdate: true,
            releaseNotes: 'New patches and improvements are ready for your current version.'
          });
          setShowModal(true);
          return;
        }
      }

      // 2. Fallback to API check for Android APKs
      if (Platform.OS === 'android') {
        await checkForAPKUpdate();
      }
    } catch (error) {
      console.log('Update check failed (non-critical):', error);
      // Silently fail - don't block app usage
    }
  };

  const checkForAPKUpdate = async () => {
    try {
      const buildNumber = Application.nativeBuildVersion;
      const versionCode = parseInt(buildNumber || '1');

      const response = await fetch(
        `${API_URL}/update/check?platform=android&versionCode=${versionCode}`
      );

      const data = await response.json();

      if (data.updateAvailable) {
        setUpdateInfo({
          type: 'apk',
          updateAvailable: true,
          version: data.latestVersionName,
          forceUpdate: data.forceUpdate,
          apkUrl: data.apkUrl,
          releaseNotes: data.releaseNotes
        });
        setShowModal(true);
      }
    } catch (error) {
      console.error('APK update check failed:', error);
    }
  };

  const handleApplyUpdate = async () => {
    if (!updateInfo) return;

    setProcessing(true);
    try {
      if (updateInfo.type === 'ota') {
        // Fetch and reload for OTA
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      } else if (updateInfo.type === 'apk' && updateInfo.apkUrl) {
        // Open APK URL for native
        // Some Android versions return false for canOpenURL on valid https links
        // We bypass the check and try to open directly, then fallback to Alert
        try {
          await Linking.openURL(updateInfo.apkUrl);
        } catch (err) {
          Alert.alert('Error', 'Cannot open download link. Please open your browser and download manually.');
        }
      }
    } catch (error) {
      Alert.alert('Error', `Failed to process ${updateInfo.type.toUpperCase()} update. Please try again later.`);
    } finally {
      if (updateInfo.type === 'apk' || !updateInfo.forceUpdate) {
        setProcessing(false);
        setShowModal(false);
      }
      // Note: OTA success results in app reload, so no need to clear 'processing' manually here
    }
  };

  const handleLater = () => {
    if (updateInfo?.forceUpdate) {
      Alert.alert(
        'Update Required',
        'This update is essential to keep the app running smoothly and securely.',
        [{ text: 'OK' }]
      );
    } else {
      setShowModal(false);
    }
  };

  if (!showModal || !updateInfo) return null;

  const isOTA = updateInfo.type === 'ota';

  return (
    <Modal visible={showModal} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View entering={SlideInUp.springify()} style={styles.container}>
          {/* Header */}
          <LinearGradient colors={[LIME, '#A3E635']} style={styles.header}>
            <Sparkles size={32} color="black" />
            <Text style={styles.headerTitle}>
              {isOTA ? 'App Refresh Ready!' : 'New Update Available!'}
            </Text>
            {updateInfo.channel && (
              <View style={styles.channelBadge}>
                <Text style={styles.channelText}>Source: {updateInfo.channel}</Text>
              </View>
            )}
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.versionText}>
              {isOTA ? 'OTA Patch' : `v${updateInfo.version}`}
            </Text>

            {updateInfo.releaseNotes && (
              <View style={styles.notesContainer}>
                <View style={styles.notesHeader}>
                  <Info size={14} color="#374151" />
                  <Text style={styles.notesLabel}>What's New:</Text>
                </View>
                <Text style={styles.notesText}>{updateInfo.releaseNotes}</Text>
              </View>
            )}

            {updateInfo.forceUpdate && (
              <View style={styles.forceWarning}>
                <AlertTriangle size={16} color="#DC2626" />
                <Text style={styles.forceText}>This update is required</Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {!updateInfo.forceUpdate && (
              <TouchableOpacity style={styles.laterButton} onPress={handleLater} disabled={processing}>
                <Text style={styles.laterText}>Later</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, processing && styles.processingButton]}
              onPress={handleApplyUpdate}
              disabled={processing}
            >
              {isOTA ? (
                <Animated.View style={animatedStyles}>
                  <RefreshCcw size={18} color="black" />
                </Animated.View>
              ) : (
                <Download size={18} color="black" />
              )}
              <Text style={styles.actionButtonText}>
                {processing
                  ? (isOTA ? 'Applying Patch...' : 'Opening Browser...')
                  : (isOTA ? 'Update & Restart' : 'Download APK')
                }
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
  },
  channelBadge: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  channelText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.6)',
    textTransform: 'uppercase',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  notesContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  notesLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#374151',
  },
  notesText: {
    color: '#6B7280',
    lineHeight: 20,
    fontSize: 14,
  },
  forceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  forceText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  laterButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  laterText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: LIME,
    paddingVertical: 14,
    borderRadius: 12,
  },
  processingButton: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontWeight: 'bold',
    color: 'black',
  },
  rotating: {
    // Note: Reanimated rotation would be better, but keeping it simple for now
  }
});
