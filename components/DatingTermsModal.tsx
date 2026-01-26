import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Dimensions, Platform } from 'react-native';
import { Shield, Heart, AlertTriangle, Check } from 'lucide-react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const PINK = '#EC4899';

interface DatingTermsModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function DatingTermsModal({ visible, onAccept, onDecline }: DatingTermsModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View entering={SlideInUp.springify()} style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconWrapper}>
              <Heart size={32} color="white" fill="white" />
            </View>
            <Text style={styles.title}>Welcome to Dating Mode</Text>
            <Text style={styles.subtitle}>Please read and accept our terms before continuing</Text>
          </View>

          {/* Terms Content */}
          <ScrollView style={styles.termsScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Shield size={20} color={PINK} />
                <Text style={styles.sectionTitle}>Safety First</Text>
              </View>
              <Text style={styles.termsText}>
                • Your safety is our priority. Never share personal information like your address, financial details, or passwords.{'\n'}
                • Always meet in public places for first dates.{'\n'}
                • Trust your instincts - if something feels wrong, report and block the user.{'\n'}
                • We use AI moderation to detect inappropriate content.
              </Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Heart size={20} color={PINK} />
                <Text style={styles.sectionTitle}>Respectful Interactions</Text>
              </View>
              <Text style={styles.termsText}>
                • Treat everyone with respect and kindness.{'\n'}
                • No harassment, hate speech, or discrimination.{'\n'}
                • Consent is mandatory - no means no.{'\n'}
                • Be honest in your profile and conversations.{'\n'}
                • No spamming or commercial activities.
              </Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AlertTriangle size={20} color={PINK} />
                <Text style={styles.sectionTitle}>Community Guidelines</Text>
              </View>
              <Text style={styles.termsText}>
                • You must be 18 years or older to use Dating Mode.{'\n'}
                • Only upload photos of yourself - no fake profiles.{'\n'}
                • Report any suspicious or inappropriate behavior.{'\n'}
                • Violation of terms may result in permanent ban.{'\n'}
                • We reserve the right to remove content that violates our policies.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Privacy & Data</Text>
              <Text style={styles.termsText}>
                • Your dating profile is separate from your social profile.{'\n'}
                • We encrypt your conversations for privacy.{'\n'}
                • You can delete your dating profile at any time.{'\n'}
                • Location data is only used for matching, never shared publicly.
              </Text>
            </View>

            <Text style={styles.agreementText}>
              By tapping "I Agree", you confirm that you are at least 18 years old and agree to abide by our Dating Mode Terms of Service and Community Guidelines.
            </Text>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
              <Text style={styles.declineText}>Not Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
              <Check size={18} color="white" />
              <Text style={styles.acceptText}>I Agree</Text>
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
    padding: 20,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: PINK,
    padding: 24,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  termsScroll: {
    padding: 20,
    maxHeight: 350,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  termsText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 22,
  },
  agreementText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  declineButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  declineText: {
    fontWeight: '600',
    color: '#6B7280',
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptText: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 15,
  },
});
