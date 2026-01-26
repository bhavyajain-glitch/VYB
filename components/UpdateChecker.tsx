import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Linking, Platform, Alert } from 'react-native';
import { Download, X, AlertTriangle, Sparkles } from 'lucide-react-native';
import * as Application from 'expo-application';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';

const LIME = '#D4FF00';

// API URL - same as your main API
const API_URL = 'https://campusconnect-api-nx9k.onrender.com/api';

interface UpdateInfo {
  updateAvailable: boolean;
  latestVersionCode: number;
  latestVersionName: string;
  forceUpdate: boolean;
  apkUrl: string | null;
  releaseNotes: string | null;
}

export default function UpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Only check on Android
    if (Platform.OS === 'android') {
      checkForUpdate();
    }
  }, []);

  const checkForUpdate = async () => {
    try {
      // Get current version code from app
      const buildNumber = Application.nativeBuildVersion;
      const versionCode = parseInt(buildNumber || '1');

      const response = await fetch(
        `${API_URL}/update/check?platform=android&versionCode=${versionCode}`
      );
      
      const data: UpdateInfo = await response.json();
      
      if (data.updateAvailable) {
        setUpdateInfo(data);
        setShowModal(true);
      }
    } catch (error) {
      console.log('Update check failed (non-critical):', error);
      // Silently fail - don't block app usage
    }
  };

  const handleDownload = async () => {
    if (!updateInfo?.apkUrl) return;

    setDownloading(true);
    try {
      // Open APK URL in browser - Android will handle the download
      const supported = await Linking.canOpenURL(updateInfo.apkUrl);
      if (supported) {
        await Linking.openURL(updateInfo.apkUrl);
      } else {
        Alert.alert('Error', 'Cannot open download link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start download');
    } finally {
      setDownloading(false);
      if (!updateInfo.forceUpdate) {
        setShowModal(false);
      }
    }
  };

  const handleLater = () => {
    if (updateInfo?.forceUpdate) {
      Alert.alert(
        'Update Required',
        'This update is required to continue using the app.',
        [{ text: 'OK' }]
      );
    } else {
      setShowModal(false);
    }
  };

  if (!showModal || !updateInfo) return null;

  return (
    <Modal visible={showModal} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View entering={SlideInUp.springify()} style={styles.container}>
          {/* Header */}
          <LinearGradient colors={[LIME, '#A3E635']} style={styles.header}>
            <Sparkles size={32} color="black" />
            <Text style={styles.headerTitle}>Update Available!</Text>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.versionText}>
              v{updateInfo.latestVersionName}
            </Text>
            
            {updateInfo.releaseNotes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>What's New:</Text>
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
              <TouchableOpacity style={styles.laterButton} onPress={handleLater}>
                <Text style={styles.laterText}>Later</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.downloadButton, downloading && styles.downloadingButton]}
              onPress={handleDownload}
              disabled={downloading}
            >
              <Download size={18} color="black" />
              <Text style={styles.downloadText}>
                {downloading ? 'Opening...' : 'Download Update'}
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
  },
  header: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'black',
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
  notesLabel: {
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  notesText: {
    color: '#6B7280',
    lineHeight: 22,
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
  },
  laterText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: LIME,
    paddingVertical: 14,
    borderRadius: 12,
  },
  downloadingButton: {
    opacity: 0.7,
  },
  downloadText: {
    fontWeight: 'bold',
    color: 'black',
  },
});
