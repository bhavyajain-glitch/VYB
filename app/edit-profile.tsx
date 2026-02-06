import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, StyleSheet, Dimensions, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, Camera, Check, User, AtSign, GraduationCap, BookOpen, FileText, Hash } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { pickImageWebCustom, processWebImage } from '../utils/imagePickerWeb';
import { authAPI } from './services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAvatarSource } from '../utils/imageUtils';

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
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  // Validation
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(true);
  const [checkingUsername, setCheckingUsername] = useState(false);

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
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    if ((Platform.OS as string) === 'web') {
        try {
            const uri = await pickImageWebCustom();
            if (uri) {
                const processed = await processWebImage(uri);
                setAvatar(processed);
            }
        } catch (e) {
            console.error("Web custom picker failed", e);
            Alert.alert('Error', 'Failed to pick image');
        }
        return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: (Platform.OS as string) !== 'web',
      aspect: [1, 1],
      quality: 0.7,
      base64: true
    });

    if (!result.canceled && result.assets[0]) {
      if (result.assets[0].base64) {
        setAvatar(`data:image/jpeg;base64,${result.assets[0].base64}`);
      } else {
        setAvatar(result.assets[0].uri);
      }
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest) 
        : [...prev, interest]
    );
  };

  const handleSave = async () => {
    if (username !== originalUsername && !usernameAvailable) {
      Alert.alert('Error', 'Please choose a different username');
      return;
    }

    setIsSaving(true);
    try {
      let profileImageUrl = avatar || '';

      // Upload new image if it's base64
      if (avatar && avatar.startsWith('data:image')) {
        try {
          const uploadRes = await authAPI.uploadImage(avatar, 'profiles');
          profileImageUrl = uploadRes.data.url;
        } catch (error) {
          Alert.alert('Error', 'Failed to upload image');
          setIsSaving(false);
          return;
        }
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

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={LIME} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="black" />
          ) : (
            <>
              <Check size={18} color="black" />
              <Text style={styles.saveButtonText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <TouchableOpacity style={styles.avatarSection} onPress={pickImage}>
          <View style={styles.avatarWrapper}>
            <Image source={getAvatarSource(avatar)} style={styles.avatar} />
            <View style={styles.cameraOverlay}>
              <Camera size={24} color="white" />
            </View>
          </View>
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>

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
    borderBottomColor: '#F3F4F6'
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  saveButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: LIME, 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20 
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontWeight: 'bold' },

  content: { flex: 1, paddingHorizontal: 20 },

  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  cameraOverlay: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white'
  },
  changePhotoText: { marginTop: 8, color: '#6B7280', fontWeight: '500' },

  formSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 16 },

  fieldContainer: { marginBottom: 16 },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  labelText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },

  input: { 
    backgroundColor: '#F9FAFB', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    padding: 14, 
    fontSize: 16,
    color: '#111827'
  },
  bioInput: { height: 80, textAlignVertical: 'top' },
  charCount: { textAlign: 'right', fontSize: 12, color: '#9CA3AF', marginTop: 4 },

  yearRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  yearButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  yearActive: { backgroundColor: LIME },
  yearText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  yearTextActive: { color: 'black', fontWeight: '600' },

  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  interestActive: { backgroundColor: LIME },
  interestText: { fontSize: 13, color: '#6B7280' },
  interestTextActive: { color: 'black', fontWeight: '600' },
});
