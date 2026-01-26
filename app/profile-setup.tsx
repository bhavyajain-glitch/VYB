import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, StyleSheet, Dimensions, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useState, useEffect } from 'react';
import { Camera, ChevronRight, GraduationCap, BookOpen, AtSign, Check, X, User } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { authAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LIME = '#D4FF00';
const { width } = Dimensions.get('window');

const interestsList = ['Technology', 'Sports', 'Music', 'Art', 'Gaming', 'Photography', 'Travel', 'Food', 'Fashion', 'Fitness', 'Books', 'Movies', 'Dance', 'Coding', 'Design', 'Business'];

export default function ProfileSetupScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0); // Start at 0 for Username
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState(''); // Age as number
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [college, setCollege] = useState('');
  const [year, setYear] = useState('');
  const [major, setMajor] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalUsername, setOriginalUsername] = useState('');

  // Load existing profile data on mount
  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      const cached = await AsyncStorage.getItem('userInfo');
      if (cached) {
        const user = JSON.parse(cached);
        if (user.username) {
          setIsEditing(true);
          setOriginalUsername(user.username);
          setUsername(user.username || '');
          setUsername(user.username || '');
          setFullName(user.fullName || '');
          setAge(user.age ? String(user.age) : '');
          setBio(user.bio || '');
          setCollege(user.college || '');
          setYear(user.year || '');
          setMajor(user.major || '');
          // Skip blob URLs as they expire on page refresh
          const profileImg = user.profileImage;
          if (profileImg && !profileImg.startsWith('blob:')) {
            setAvatar(profileImg);
          }
          setSelectedInterests(user.interests || []);
          setUsernameAvailable(true); // Current username is valid
        }
      }
    } catch (e) {
      console.error('Failed to load existing profile');
    }
  };

  // Debounced Username Check
  useEffect(() => {
    const check = async () => {
      if (username.length < 3) {
        setUsernameAvailable(null);
        return;
      }
      // Skip check if username hasn't changed from original (editing mode)
      if (isEditing && username === originalUsername) {
        setUsernameAvailable(true);
        return;
      }
      setCheckingUsername(true);
      try {
        const res = await authAPI.checkUsername(username);
        setUsernameAvailable(res.data.available);
      } catch (error) {
        setUsernameAvailable(false);
      } finally {
        setCheckingUsername(false);
      }
    };

    const timer = setTimeout(check, 500);
    return () => clearTimeout(timer);
  }, [username, isEditing, originalUsername]);

  // Convert image to base64 for upload
  const processImage = async (uri: string): Promise<string> => {
    if (Platform.OS === 'web') {
      // Web: Create canvas and convert to base64
      return new Promise((resolve, reject) => {
        const img = new (window as any).Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 800;
          const scale = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height, 1);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
        img.src = uri;
      });
    }
    // Native: Use base64 from ImagePicker
    return uri;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true
    });
    if (!result.canceled) {
      if (result.assets[0].base64) {
        setAvatar(`data:image/jpeg;base64,${result.assets[0].base64}`);
      } else {
        const processed = await processImage(result.assets[0].uri);
        setAvatar(processed);
      }
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true
    });
    if (!result.canceled) {
      if (result.assets[0].base64) {
        setAvatar(`data:image/jpeg;base64,${result.assets[0].base64}`);
      } else {
        const processed = await processImage(result.assets[0].uri);
        setAvatar(processed);
      }
    }
  };

  const requestAvatarSource = () => {
    if (Platform.OS === 'web') {
      pickImage();
    } else {
      Alert.alert(
        "Profile Photo",
        "Choose a source",
        [
          { text: "Camera", onPress: takePhoto },
          { text: "Gallery", onPress: pickImage },
          { text: "Cancel", style: "cancel" }
        ]
      );
    }
  };

  const toggleInterest = (interest: string) => setSelectedInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);

  const handleNext = async () => {
    if (step === 0) {
      if (!usernameAvailable || !fullName || !age || parseInt(age) < 17 || parseInt(age) > 100) return;
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      let profileImageUrl = avatar || '';

      // Upload to Cloudinary if it's a new image (base64)
      if (avatar && avatar.startsWith('data:image')) {
        setIsUploading(true);
        try {
          const uploadRes = await authAPI.uploadImage(avatar, 'profiles');
          profileImageUrl = uploadRes.data.url;
          console.log('✅ Image uploaded to Cloudinary:', profileImageUrl);
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
          Alert.alert('Upload Error', 'Failed to upload profile image. Please try again.');
          setIsUploading(false);
          setIsLoading(false);
          return;
        }
        setIsUploading(false);
      }

      const profileData = {
        username,
        fullName,
        age: parseInt(age),
        bio,
        college,
        year,
        major,
        interests: selectedInterests,
        profileImage: profileImageUrl,
      };

      const res = await authAPI.updateProfile(profileData);

      // Update AsyncStorage with the latest user data
      const updatedUser = res.data;
      const userInfo = {
        ...updatedUser,
        isNewUser: false, // Ensure we mark profile as complete
      };
      await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));

      console.log('Profile Saved. Navigating to Feed...');
      router.replace('/');

    } catch (error: any) {
      console.error('Save Profile Error:', error);
      Alert.alert("Error", error.message || "Failed to save profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoBox}><Text style={styles.logoText}>C</Text></View>
        <Text style={styles.headerTitle}>Profile Setup</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressStepText, step >= 0 && styles.activeStepText]}>Username</Text>
              <Text style={[styles.progressStepText, step >= 1 && styles.activeStepText]}>About</Text>
              <Text style={[styles.progressStepText, step >= 2 && styles.activeStepText]}>Education</Text>
              <Text style={[styles.progressStepText, step >= 3 && styles.activeStepText]}>Interests</Text>
            </View>
            <View style={styles.progress}>
              {[0, 1, 2, 3].map(i => <View key={i} style={[styles.progressBar, i <= step ? styles.progressActive : styles.progressInactive]} />)}
            </View>
          </View>

          {/* Step 0: Username */}
          {step === 0 && (
            <Animated.View entering={FadeInDown} style={styles.stepContainer}>
              <Text style={styles.title}>Welcome!</Text>
              <Text style={styles.subtitle}>Let's start with your details</Text>

              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}><User size={18} color="#6B7280" /></View>
                <TextInput
                  placeholder="Full Name"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setFullName}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}><User size={18} color="#6B7280" /></View>
                <TextInput
                  placeholder="Your Age"
                  placeholderTextColor="#9CA3AF"
                  value={age}
                  onChangeText={(t) => {
                    // Only allow changes if not in edit mode or age wasn't set
                    if (!isEditing || !age) setAge(t.replace(/[^0-9]/g, ''));
                  }}
                  keyboardType="numeric"
                  maxLength={3}
                  style={[styles.textInput, isEditing && age ? styles.disabledInput : null]}
                  editable={!isEditing || !age}
                />
              </View>
              {isEditing && age && <Text style={styles.ageNote}>Age cannot be changed once set</Text>}

              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}><AtSign size={18} color="#6B7280" /></View>
                <TextInput
                  placeholder="username"
                  placeholderTextColor="#9CA3AF"
                  value={username}
                  onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                  autoCapitalize="none"
                  style={styles.textInput}
                />
                {checkingUsername ? (
                  <ActivityIndicator size="small" color="black" />
                ) : (
                  username.length >= 3 && (
                    usernameAvailable ?
                      <Check size={20} color={LIME} strokeWidth={3} /> :
                      <X size={20} color="red" />
                  )
                )}
              </View>

              {username.length > 0 && (
                <Text style={[styles.helperText, usernameAvailable ? { color: 'green' } : { color: 'red' }]}>
                  {checkingUsername ? 'Checking...' : (
                    username.length < 3 ? 'Too short' : (
                      usernameAvailable ? 'Username available!' : 'Username taken'
                    )
                  )}
                </Text>
              )}
            </Animated.View>
          )}

          {/* Step 1: Avatar & Bio */}
          {step === 1 && (
            <Animated.View entering={FadeInDown} style={styles.stepContainer}>
              <Text style={styles.title}>Let's get to know you</Text>
              <Text style={styles.subtitle}>Add a photo and tell us about yourself</Text>

              <TouchableOpacity onPress={requestAvatarSource} style={styles.avatarContainer}>
                <View style={styles.avatarWrapper}>
                  {avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : <Camera size={32} color="#9CA3AF" />}
                </View>
                <View style={styles.cameraButton}><Camera size={14} color="black" /></View>
              </TouchableOpacity>

              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Write a short bio..."
                  placeholderTextColor="#9CA3AF"
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                  style={styles.bioInput}
                />
              </View>
            </Animated.View>
          )}

          {/* Step 2: College Details */}
          {step === 2 && (
            <Animated.View entering={FadeInDown} style={styles.stepContainer}>
              <Text style={styles.title}>Your Education</Text>
              <Text style={styles.subtitle}>Where are you currently studying?</Text>

              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}><GraduationCap size={18} color="#6B7280" /></View>
                <TextInput
                  placeholder="College/University Name"
                  placeholderTextColor="#9CA3AF"
                  value={college}
                  onChangeText={setCollege}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}><BookOpen size={18} color="#6B7280" /></View>
                <TextInput
                  placeholder="Major/Field of Study"
                  placeholderTextColor="#9CA3AF"
                  value={major}
                  onChangeText={setMajor}
                  style={styles.textInput}
                />
              </View>

              <Text style={styles.label}>Year of Study</Text>
              <View style={styles.yearContainer}>
                {['1st', '2nd', '3rd', '4th', 'Grad'].map(y => (
                  <TouchableOpacity key={y} onPress={() => setYear(y)} style={[styles.yearButton, year === y && styles.yearActive]}>
                    <Text style={[styles.yearText, year === y && styles.yearTextActive]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Step 3: Interests */}
          {step === 3 && (
            <Animated.View entering={FadeInDown} style={styles.stepContainer}>
              <Text style={styles.title}>Your Interests</Text>
              <Text style={styles.subtitle}>Select at least 3 interests to help us match you</Text>

              <View style={styles.interestsContainer}>
                {interestsList.map(interest => (
                  <TouchableOpacity key={interest} onPress={() => toggleInterest(interest)} style={[styles.interestButton, selectedInterests.includes(interest) && styles.interestActive]}>
                    <Text style={[styles.interestText, selectedInterests.includes(interest) && styles.interestTextActive]}>{interest}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Navigation Buttons */}
          <View style={styles.navButtons}>
            <TouchableOpacity
              onPress={handleNext}
              style={[styles.continueButton, (step === 0 && (!usernameAvailable || !age || parseInt(age) < 17)) && styles.disabledButton]}
              activeOpacity={0.9}
              disabled={isLoading || (step === 0 && (!usernameAvailable || !age || parseInt(age) < 17))}
            >
              <Text style={styles.continueText}>{isLoading ? 'Saving...' : (step === 3 ? 'Complete Setup' : 'Continue')}</Text>
              {!isLoading && <ChevronRight size={18} color="black" />}
            </TouchableOpacity>

            {step < 3 && step > 0 && (
              <TouchableOpacity onPress={() => setStep(step + 1)} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            )}

            {step > 0 && !isLoading && (
              <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.backButtonInline}>
                <Text style={styles.backTextInline}>Back</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView >
    </View >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  logoBox: { width: 32, height: 32, backgroundColor: LIME, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  logoText: { fontSize: 16, fontWeight: 'bold', color: 'black' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: 'black' },

  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  content: { paddingHorizontal: 24, paddingTop: 24, maxWidth: 500, alignSelf: 'center', width: '100%' },

  progressContainer: { marginBottom: 32 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressStepText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  activeStepText: { color: 'black', fontWeight: '600' },
  progress: { flexDirection: 'row', gap: 6, height: 4 },
  progressBar: { flex: 1, borderRadius: 2 },
  progressActive: { backgroundColor: 'black' },
  progressInactive: { backgroundColor: '#E5E7EB' },

  stepContainer: { minHeight: 300 },
  title: { fontSize: 22, fontWeight: 'bold', color: 'black', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24 },

  avatarContainer: { alignSelf: 'center', marginBottom: 24, position: 'relative' },
  avatarWrapper: {
    width: 100,
    height: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    overflow: 'hidden'
  },
  avatar: { width: '100%', height: '100%' },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: LIME,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white'
  },

  inputContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12
  },
  bioInput: {
    color: 'black',
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top'
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    marginBottom: 8,
    height: 48
  },
  inputIcon: { width: 24, alignItems: 'center', marginRight: 8 },
  textInput: { flex: 1, color: 'black', fontSize: 15 },
  helperText: { fontSize: 12, marginLeft: 12, marginBottom: 12 },

  label: { fontSize: 14, fontWeight: '600', color: 'black', marginBottom: 12, marginTop: 8 },
  yearContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  yearButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  yearActive: { backgroundColor: LIME },
  yearText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  yearTextActive: { color: 'black', fontWeight: '600' },

  interestsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  interestActive: { backgroundColor: LIME },
  interestText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  interestTextActive: { color: 'black', fontWeight: '600' },

  navButtons: { marginTop: 32 },
  continueButton: {
    backgroundColor: LIME,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  disabledButton: { backgroundColor: '#E5E7EB', shadowOpacity: 0 },
  continueText: { color: 'black', fontWeight: 'bold', fontSize: 16, marginRight: 8 },

  skipButton: { alignItems: 'center', marginTop: 16, padding: 8 },
  skipText: { color: '#6B7280', fontWeight: '500', fontSize: 14 },

  backButtonInline: { alignItems: 'center', marginTop: 8, padding: 8 },
  backTextInline: { color: '#9CA3AF', fontWeight: '500', fontSize: 14 },
  disabledInput: { backgroundColor: '#F3F4F6', color: '#9CA3AF' },
  ageNote: { fontSize: 11, color: '#9CA3AF', marginLeft: 12, marginBottom: 8, fontStyle: 'italic' },
});
