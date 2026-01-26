import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet, ScrollView, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Phone, Mail } from 'lucide-react-native';
import { authAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DataPolicyModal } from '../components/DataPolicyModal';
if (Platform.OS === 'web') {
  // Web specific setup if needed
}

const LIME = '#D4FF00';
const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;


export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('email');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [hasAcceptedPolicy, setHasAcceptedPolicy] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);


  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSendOTP = async () => {
    const isPhoneValid = loginMethod === 'phone' && phoneNumber.length === 10;
    const isEmailValid = loginMethod === 'email' && validateEmail(email);

    if (isPhoneValid || isEmailValid) {
      if (!hasAcceptedPolicy && mode === 'signup') {
        setShowPolicyModal(true);
        return;
      }
      setIsLoading(true);
      try {
        await authAPI.sendOtp(
          loginMethod === 'phone' ? phoneNumber : undefined,
          loginMethod === 'email' ? email : undefined
        );
        setStep('otp');
      } catch (error) {
        Alert.alert('Error', 'Server is starting up. Please wait a moment.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length === 6) {
      setIsLoading(true);
      try {
        const response = await authAPI.verifyOtp(
          loginMethod === 'phone' ? phoneNumber : undefined,
          loginMethod === 'email' ? email : undefined,
          otpString
        );
        const { token, isNewUser, user } = response.data;

        // Save token and user info
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userInfo', JSON.stringify({ ...user, isNewUser }));

        if (isNewUser) {
          router.replace('/profile-setup');
        } else {
          router.replace('/(tabs)');
        }
      } catch (error: any) {
        Alert.alert('Error', error.response?.data?.message || 'Invalid OTP');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    }
  };

  // ... (Rest remains same)
  // I will now update the UI part as well in a separate block for clarity or use multi_replace
  return (
    <LinearGradient colors={[LIME, '#e8ff66', 'white']} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          {step === 'otp' && (
            <TouchableOpacity onPress={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); }} style={styles.backButton}>
              <ArrowLeft size={20} color="#374151" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          )}

          <View style={styles.centerContainer}>
            {/* Auth Card */}
            <Animated.View entering={FadeIn} style={styles.card}>
              {/* Logo */}
              <View style={styles.logoContainer}>
                <View style={styles.logoBox}>
                  <Text style={styles.logoText}>C</Text>
                </View>
              </View>

              <Text style={styles.title}>{mode === 'login' ? 'Welcome back!' : 'Join the vibe'}</Text>
              <Text style={styles.subtitle}>
                {step === 'phone' ? 'Choose your login method' : 'Enter the OTP sent to your phone'}
              </Text>

              {/* Mode Tabs */}
              <View style={styles.tabsContainer}>
                <TouchableOpacity
                  onPress={() => { setMode('signup'); setStep('phone'); setPhoneNumber(''); setOtp(['', '', '', '', '', '']); }}
                  style={[styles.tab, mode === 'signup' && styles.tabActive]}
                >
                  <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>Sign Up</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setMode('login'); setStep('phone'); setPhoneNumber(''); setOtp(['', '', '', '', '', '']); }}
                  style={[styles.tab, mode === 'login' && styles.tabActive]}
                >
                  <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Log In</Text>
                </TouchableOpacity>
              </View>

              {/* Phone/Email Toggle - REMOVED: Email Only */}

              {/* Input Step */}
              {step === 'phone' && (
                <Animated.View entering={FadeInDown}>
                  {loginMethod === 'phone' ? (
                    <>
                      <Text style={styles.label}>Phone Number</Text>
                      <View style={styles.inputContainer}>
                        <Phone size={20} color="#9CA3AF" />
                        <TextInput
                          placeholder="Enter 10 digit number"
                          placeholderTextColor="#9CA3AF"
                          value={phoneNumber}
                          onChangeText={(text) => { const v = text.replace(/\D/g, ''); if (v.length <= 10) setPhoneNumber(v); }}
                          keyboardType="phone-pad"
                          style={styles.input}
                          maxLength={10}
                        />
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={styles.label}>Email Address</Text>
                      <View style={styles.inputContainer}>
                        <Mail size={20} color="#9CA3AF" />
                        <TextInput
                          placeholder="yourname@example.com"
                          placeholderTextColor="#9CA3AF"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          style={styles.input}
                        />
                      </View>
                    </>
                  )}

                  <TouchableOpacity
                    onPress={handleSendOTP}
                    disabled={
                      (loginMethod === 'phone' && phoneNumber.length !== 10) ||
                      (loginMethod === 'email' && !validateEmail(email)) ||
                      isLoading
                    }
                    style={[
                      styles.submitButton,
                      ((loginMethod === 'phone' && phoneNumber.length !== 10) ||
                        (loginMethod === 'email' && !validateEmail(email)) ||
                        isLoading) && styles.submitButtonDisabled
                    ]}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.submitButtonText}>{isLoading ? 'Sending...' : 'Send OTP'}</Text>
                  </TouchableOpacity>
                  <Text style={styles.toggleText}>
                    {mode === 'signup' ? "Already have an account? " : "Don't have an account? "}
                    <Text style={styles.toggleLink} onPress={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
                      {mode === 'signup' ? 'Log in here' : 'Sign up here'}
                    </Text>
                  </Text>
                </Animated.View>
              )}

              {/* OTP Input Step */}
              {step === 'otp' && (
                <Animated.View entering={FadeInDown}>
                  <Text style={styles.otpLabel}>
                    Sent to {loginMethod === 'phone' ? `+91 ${phoneNumber}` : email}
                  </Text>
                  <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => { otpRefs.current[index] = ref; }}
                        value={digit}
                        onChangeText={(value) => handleOtpChange(index, value)}
                        keyboardType="number-pad"
                        maxLength={1}
                        style={styles.otpInput}
                        selectTextOnFocus
                      />
                    ))}
                  </View>
                  <TouchableOpacity style={styles.resendButton}>
                    <Text style={styles.resendText}>Didn't receive? <Text style={styles.resendBold}>Resend OTP</Text></Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleVerifyOTP}
                    disabled={otp.join('').length !== 6 || isLoading}
                    style={[styles.submitButton, (otp.join('').length !== 6 || isLoading) && styles.submitButtonDisabled]}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.submitButtonText}>{isLoading ? 'Verifying...' : 'Verify & Continue'}</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </Animated.View>

            <Text style={styles.footerText}>By continuing, you agree to our Terms & Privacy Policy</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <DataPolicyModal
        visible={showPolicyModal}
        onAccept={() => {
          setHasAcceptedPolicy(true);
          setShowPolicyModal(false);
          // Auto-trigger send OTP after acceptance
          handleSendOTP();
        }}
        onDecline={() => setShowPolicyModal(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16, justifyContent: 'center' },
  centerContainer: { width: '100%', maxWidth: 450, alignSelf: 'center' },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10
  },
  backText: { fontWeight: '500', color: '#374151' },

  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: isSmallScreen ? 20 : 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8
  },

  logoContainer: { alignItems: 'center', marginBottom: 20 },
  logoBox: { width: 48, height: 48, backgroundColor: LIME, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 22, fontWeight: '900', color: 'black' },

  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: 'black', marginBottom: 8 },
  subtitle: { textAlign: 'center', color: '#6B7280', marginBottom: 24, fontSize: 14 },

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabActive: {
    backgroundColor: 'black',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  tabText: { fontWeight: '600', fontSize: 13, color: '#6B7280' },
  tabTextActive: { color: 'white' },

  label: { fontWeight: '600', fontSize: 13, color: '#374151', marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    marginBottom: 20,
    height: 50
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: 'black',
    marginLeft: 10,
    height: '100%'
  },

  submitButton: {
    backgroundColor: 'black',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  submitButtonDisabled: { backgroundColor: '#D1D5DB', shadowOpacity: 0, elevation: 0 },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  toggleText: { textAlign: 'center', fontSize: 13, color: '#6B7280', marginTop: 20 },
  toggleLink: { color: 'black', fontWeight: '600' },

  methodTabsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  methodTabActive: {
    backgroundColor: LIME,
    borderColor: LIME,
  },
  methodTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  methodTabTextActive: {
    color: 'black',
  },

  otpLabel: { textAlign: 'center', fontWeight: '600', fontSize: 14, color: '#374151', marginBottom: 16 },
  otpContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  otpInput: {
    width: 44,
    height: 50,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },

  resendButton: { alignItems: 'center', marginBottom: 20 },
  resendText: { fontSize: 13, color: '#6B7280' },
  resendBold: { fontWeight: 'bold', color: 'black' },

  footerText: { textAlign: 'center', fontSize: 12, color: '#6B7280', marginTop: 20 },

  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    marginTop: -12,
    borderLeftWidth: 3,
    borderLeftColor: 'black',
  },
  helperIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  helperIconText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  helperText: {
    fontSize: 12,
    color: '#4B5563',
    flex: 1,
  },
  helperHighlight: {
    fontWeight: '700',
    color: 'black',
  },

});
