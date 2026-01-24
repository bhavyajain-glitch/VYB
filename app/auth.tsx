import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet, ScrollView, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useState, useRef } from 'react';
import { ArrowLeft, Phone } from 'lucide-react-native';
import { authAPI } from './services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LIME = '#D4FF00';
const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const handleSendOTP = async () => {
    if (phoneNumber.length === 10) {
      setIsLoading(true);
      try {
        await authAPI.sendOtp(phoneNumber);
        setStep('otp');
      } catch (error) {
        Alert.alert('Error', 'Failed to send OTP. Please try again.');
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
        const response = await authAPI.verifyOtp(phoneNumber, otpString);
        const { token, isNewUser, user } = response.data;
        
        // Save token and user info
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(user));

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

  // ... (Rest of UI code remains same)
  // Re-pasting the full component to ensure consistency
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
                {step === 'phone' ? 'Enter your phone number to get started' : 'Enter the OTP sent to your phone'}
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

              {/* Phone Input Step */}
              {step === 'phone' && (
                <Animated.View entering={FadeInDown}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={styles.phoneInputContainer}>
                    <Phone size={20} color="#9CA3AF" />
                    <TextInput
                      placeholder="Enter 10 digit number"
                      placeholderTextColor="#9CA3AF"
                      value={phoneNumber}
                      onChangeText={(text) => { const v = text.replace(/\D/g, ''); if (v.length <= 10) setPhoneNumber(v); }}
                      keyboardType="phone-pad"
                      style={styles.phoneInput}
                      maxLength={10}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={handleSendOTP}
                    disabled={phoneNumber.length !== 10 || isLoading}
                    style={[styles.submitButton, (phoneNumber.length !== 10 || isLoading) && styles.submitButtonDisabled]}
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
                  <Text style={styles.otpLabel}>Sent to +91 {phoneNumber}</Text>
                  <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(ref) => (otpRefs.current[index] = ref)}
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
  phoneInputContainer: { 
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
  phoneInput: { 
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
});
