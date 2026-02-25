import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, StyleSheet, Dimensions, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, Camera, Check, User, AtSign, GraduationCap, BookOpen, FileText, Hash, ShieldCheck, Mail } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { pickImageWebCustom, processWebImage } from '../utils/imagePickerWeb';
import { authAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAvatarSource, getCoverSource } from '../utils/imageUtils';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal } from 'react-native';

const LIME = '#D4FF00';
const { width } = Dimensions.get('window');

const interestsList = ['Technology', 'Sports', 'Music', 'Art', 'Gaming', 'Photography', 'Travel', 'Food', 'Fashion', 'Fitness', 'Books', 'Movies', 'Dance', 'Coding', 'Design', 'Business'];

export default function EditProfileScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [college, setCollege] = useState('');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Validation
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(true);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Student Verification State
  const [isStudentVerified, setIsStudentVerified] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verifyOtp, setVerifyOtp] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  // Username check with debounce
  useEffect(() => {
    if (username === originalUsername) {
      setUsernameAvailable(true);
      return;
    }
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const res = await authAPI.checkUsername(username);
        setUsernameAvailable(res.data.available);
      } catch {
        setUsernameAvailable(false);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, originalUsername]);

  const loadProfile = async () => {
    try {
      const res = await authAPI.getMe();
      if (res.data) {
        const user = res.data;
        setUsername(user.username || '');
        setOriginalUsername(user.username || '');
        setFullName(user.fullName || '');
        setBio(user.bio || '');
        setCollege(user.college || '');
        setMajor(user.major || '');
        setYear(user.year || '');
        setSelectedInterests(user.interests || []);
        if (user.profileImage && !user.profileImage.startsWith('blob:')) {
          setAvatar(user.profileImage);
        }
        if (user.coverImage && !user.coverImage.startsWith('blob:')) {
          setCoverPhoto(user.coverImage);
        }
        setIsStudentVerified(user.isStudentVerified || false);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };


  const pickImage = async (type: 'avatar' | 'cover') => {
    if ((Platform.OS as string) === 'web') {
      try {
        const uri = await pickImageWebCustom();
        if (uri) {
          const processed = await processWebImage(uri);
          if (type === 'avatar') setAvatar(processed);
          else setCoverPhoto(processed);
        }
      } catch (e) {
        console.error("Web custom picker failed", e);
        Alert.alert('Error', 'Failed to pick image');
      }
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'avatar' ? [1, 1] : [16, 9],
      quality: 0.7,
      base64: true
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].base64
        ? `data:image/jpeg;base64,${result.assets[0].base64}`
        : result.assets[0].uri;

      if (type === 'avatar') setAvatar(uri);
      else setCoverPhoto(uri);
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSendVerification = async () => {
    if (!verifyEmail.toLowerCase().endsWith('@adypu.edu.in')) {
      Alert.alert('Invalid Email', 'Please enter a valid @adypu.edu.in email address.');
      return;
    }
    setVerifying(true);
    try {
      const res = await authAPI.sendCollegeVerify(verifyEmail);
      if (res.data?.success) {
        setOtpSent(true);
        Alert.alert('Code Sent', `We sent a code to ${verifyEmail}`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send code');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verifyOtp || verifyOtp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }
    setVerifying(true);
    try {
      const res = await authAPI.verifyCollegeEmail(verifyEmail, verifyOtp);
      if (res.data?.success) {
        setIsStudentVerified(true);
        setShowVerifyModal(false);
        Alert.alert('Success!', 'You are now a verified student! +200 coins added.');
      }
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message || 'Invalid code');
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    if (username !== originalUsername && !usernameAvailable) {
      Alert.alert('Error', 'Please choose a different username');
      return;
    }

    setIsSaving(true);
    try {
      let profileImageUrl = avatar || '';
      let coverImageUrl = coverPhoto || '';

      // Upload profile image if new
      if (avatar && avatar.startsWith('data:image')) {
        const uploadRes = await authAPI.uploadImage(avatar, 'profiles');
        profileImageUrl = uploadRes.data.url;
      }

      // Upload cover image if new
      if (coverPhoto && coverPhoto.startsWith('data:image')) {
        const uploadRes = await authAPI.uploadImage(coverPhoto, 'covers');
        coverImageUrl = uploadRes.data.url;
      }

      const profileData = {
        username,
        fullName,
        bio,
        college,
        major,
        year,
        interests: selectedInterests,
        profileImage: profileImageUrl,
        coverImage: coverImageUrl,
      };

      await authAPI.updateProfile(profileData);

      // Update local cache
      const cached = await AsyncStorage.getItem('userInfo');
      if (cached) {
        const updated = { ...JSON.parse(cached), ...profileData };
        await AsyncStorage.setItem('userInfo', JSON.stringify(updated));
      }

      Alert.alert('Success', 'Profile updated!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <ArrowLeft size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header/Cover Photo Section */}
        <View style={styles.coverSection}>
          <TouchableOpacity onPress={() => pickImage('cover')} activeOpacity={0.9}>
            <View style={styles.coverWrapper}>
              <Image source={getCoverSource(coverPhoto)} style={styles.coverImage} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={StyleSheet.absoluteFill} />
              <View style={styles.coverCameraOverlay}>
                <Camera size={20} color="white" />
                <Text style={styles.coverLabel}>Change Cover</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Avatar centered on cover edge */}
          <TouchableOpacity style={styles.avatarWrapper} onPress={() => pickImage('avatar')}>
            <View style={styles.avatarBorder}>
              <Image source={getAvatarSource(avatar)} style={styles.avatar} />
              <View style={styles.avatarCameraOverlay}>
                <Camera size={16} color="white" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />

        {/* Form Fields */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Basic Info</Text>

          {/* Full Name */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabel}>
              <User size={16} color="#6B7280" />
              <Text style={styles.labelText}>Full Name</Text>
            </View>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Username */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabel}>
              <AtSign size={16} color="#6B7280" />
              <Text style={styles.labelText}>Username</Text>
              {checkingUsername && <ActivityIndicator size="small" color="#6B7280" style={{ marginLeft: 8 }} />}
              {!checkingUsername && username.length >= 3 && username !== originalUsername && (
                usernameAvailable ?
                  <Check size={16} color="green" style={{ marginLeft: 8 }} /> :
                  <Text style={{ color: 'red', marginLeft: 8, fontSize: 12 }}>Taken</Text>
              )}
            </View>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
              placeholder="username"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
            />
          </View>

          {/* Bio */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabel}>
              <FileText size={16} color="#6B7280" />
              <Text style={styles.labelText}>Bio</Text>
            </View>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={150}
            />
            <Text style={styles.charCount}>{bio.length}/150</Text>
          </View>
        </View>

        {/* Education Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Education</Text>

          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabel}>
              <GraduationCap size={16} color="#6B7280" />
              <Text style={styles.labelText}>College</Text>
            </View>
            <TextInput
              style={styles.input}
              value={college}
              onChangeText={setCollege}
              placeholder="Your college"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabel}>
              <BookOpen size={16} color="#6B7280" />
              <Text style={styles.labelText}>Major</Text>
            </View>
            <TextInput
              style={styles.input}
              value={major}
              onChangeText={setMajor}
              placeholder="Your major"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.labelText}>Year</Text>
            <View style={styles.yearRow}>
              {['1st', '2nd', '3rd', '4th', 'Grad'].map(y => (
                <TouchableOpacity
                  key={y}
                  onPress={() => setYear(y)}
                  style={[styles.yearButton, year === y && styles.yearActive]}
                >
                  <Text style={[styles.yearText, year === y && styles.yearTextActive]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* College Verification Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Verification</Text>
          <View style={styles.fieldContainer}>
            <View style={styles.fieldLabel}>
              <ShieldCheck size={16} color={isStudentVerified ? "green" : "#6B7280"} />
              <Text style={styles.labelText}>Student Status</Text>
            </View>

            {isStudentVerified ? (
              <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={20} color="green" fill="#dcfce7" />
                  <Text style={{ fontSize: 15, fontWeight: '600', color: 'green' }}>Verified Student</Text>
                </View>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>@adypu.edu.in</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                onPress={() => setShowVerifyModal(true)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={20} color="#6B7280" />
                  <Text style={{ fontSize: 15, color: '#111827' }}>Verify College Email</Text>
                </View>
                <View style={{ backgroundColor: LIME, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: 'bold' }}>+200 Coins</Text>
                </View>
              </TouchableOpacity>
            )}
            {!isStudentVerified && (
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8, marginLeft: 4 }}>
                Verify your @adypu.edu.in email to get a badge and 200 coins.
              </Text>
            )}
          </View>
        </View>

        {/* Interests Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.interestsGrid}>
            {interestsList.map(interest => (
              <TouchableOpacity
                key={interest}
                onPress={() => toggleInterest(interest)}
                style={[styles.interestChip, selectedInterests.includes(interest) && styles.interestActive]}
              >
                <Text style={[styles.interestText, selectedInterests.includes(interest) && styles.interestTextActive]}>
                  {interest}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Verification Modal */}
      <Modal visible={showVerifyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}
              onPress={() => { setShowVerifyModal(false); setOtpSent(false); setVerifyEmail(''); setVerifyOtp(''); }}
            >
              <Text style={{ fontSize: 24, color: '#9CA3AF' }}>×</Text>
            </TouchableOpacity>

            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <GraduationCap size={32} color="#3B82F6" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>Student Verification</Text>
              <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8 }}>
                {otpSent ? `Enter the code sent to ${verifyEmail}` : "Enter your college email address to verify your student status."}
              </Text>
            </View>

            {!otpSent ? (
              <>
                <View style={styles.modalInputContainer}>
                  <Mail size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="yourname@adypu.edu.in"
                    value={verifyEmail}
                    onChangeText={(t) => setVerifyEmail(t.toLowerCase())}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.modalButton, verifyEmail.length < 5 && { opacity: 0.5 }]}
                  onPress={handleSendVerification}
                  disabled={verifying || verifyEmail.length < 5}
                >
                  {verifying ? <ActivityIndicator color="white" /> : <Text style={styles.modalButtonText}>Send Code</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.modalInputContainer}>
                  <Hash size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="123456"
                    value={verifyOtp}
                    onChangeText={setVerifyOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.modalButton, verifyOtp.length !== 6 && { opacity: 0.5 }]}
                  onPress={handleVerifyCode}
                  disabled={verifying || verifyOtp.length !== 6}
                >
                  {verifying ? <ActivityIndicator color="white" /> : <Text style={styles.modalButtonText}>Verify & Claim Reward</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setOtpSent(false)} style={{ marginTop: 16, alignSelf: 'center' }}>
                  <Text style={{ color: '#6B7280', fontSize: 14 }}>Change Email</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  centered: { justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: 'white',
    zIndex: 10
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  saveButton: { backgroundColor: 'black', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25 },
  saveButtonText: { color: 'white', fontWeight: '700', fontSize: 14 },
  saveButtonDisabled: { opacity: 0.5 },

  content: { flex: 1 },

  coverSection: { position: 'relative', marginBottom: 20 },
  coverWrapper: { height: 160, backgroundColor: '#F3F4F6', overflow: 'hidden' },
  coverImage: { width: '100%', height: '100%' },
  coverCameraOverlay: { position: 'absolute', bottom: 15, right: 15, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  coverLabel: { color: 'white', fontSize: 12, fontWeight: '600' },

  avatarWrapper: { position: 'absolute', bottom: -50, alignSelf: 'center' },
  avatarBorder: { borderWidth: 4, borderColor: 'white', borderRadius: 60, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarCameraOverlay: { position: 'absolute', bottom: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' },

  formSection: { paddingHorizontal: 20, marginBottom: 32 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },

  fieldContainer: { marginBottom: 20 },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  labelText: { fontSize: 14, color: '#4B5563', fontWeight: '600' },

  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 16,
    fontSize: 15,
    color: '#111827'
  },
  bioInput: { height: 100, textAlignVertical: 'top' },
  charCount: { textAlign: 'right', fontSize: 11, color: '#9CA3AF', marginTop: 6 },

  yearRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  yearButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' },
  yearActive: { backgroundColor: 'black' },
  yearText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  yearTextActive: { color: 'white' },

  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: 'transparent' },
  interestActive: { backgroundColor: 'white', borderColor: 'black' },
  interestText: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
  interestTextActive: { color: 'black', fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 24, padding: 24 },
  modalInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, gap: 12 },
  modalInput: { flex: 1, fontSize: 16, color: '#111827' },
  modalButton: { backgroundColor: '#111827', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
