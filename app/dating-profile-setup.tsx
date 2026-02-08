import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Platform, Image, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Check, Camera, X, Heart } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, SlideInRight, SlideInLeft } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from './services/api';

const { width } = Dimensions.get('window');
const PINK = '#EC4899';
const MAX_WIDTH = 500;

// Options for various fields
const GENDER_OPTIONS = ['Man', 'Woman', 'Non-binary'];
const LOOKING_FOR_OPTIONS = ['Women', 'Men', 'Everyone'];
const INTENTION_OPTIONS = [
  { label: 'Long-term relationship', emoji: '💍' },
  { label: 'Short-term relationship', emoji: '🌹' },
  { label: 'Casual dating', emoji: '🎉' },
  { label: 'New friends', emoji: '👋' },
  { label: 'Not sure yet', emoji: '🤷' },
];
const HEIGHT_OPTIONS = Array.from({ length: 61 }, (_, i) => `${150 + i} cm`); // 150cm to 210cm
const INTEREST_OPTIONS = [
  'Music', 'Movies', 'Travel', 'Fitness', 'Gaming', 'Photography',
  'Art', 'Reading', 'Cooking', 'Dancing', 'Sports', 'Technology',
  'Fashion', 'Nature', 'Pets', 'Anime', 'Netflix', 'Coffee',
  'Food', 'Yoga', 'Hiking', 'Swimming', 'Cricket', 'Football'
];

export default function DatingProfileSetup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state
  const [gender, setGender] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [height, setHeight] = useState('');
  const [hometown, setHometown] = useState('');
  const [college, setCollege] = useState('ADYPU');
  const [course, setCourse] = useState('');
  const [intentions, setIntentions] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);

  const totalSteps = 3;

  // Fetch existing profile data on mount
  useEffect(() => {
    const loadExistingProfile = async () => {
      try {
        const res = await authAPI.getDatingProfile();
        if (res.data) {
          const profile = res.data;
          // Check if user has existing profile data (edit mode)
          const hasExistingProfile = profile.datingProfileComplete ||
            (profile.datingPhotos && profile.datingPhotos.length > 0);
          setIsEditMode(hasExistingProfile);

          if (profile.datingGender) setGender(profile.datingGender);
          if (profile.datingLookingFor) setLookingFor(profile.datingLookingFor);
          if (profile.datingHeight) setHeight(profile.datingHeight);
          if (profile.datingHometown) setHometown(profile.datingHometown);
          if (profile.datingCollege) setCollege(profile.datingCollege);
          if (profile.datingCourse) setCourse(profile.datingCourse);
          if (profile.datingIntentions) setIntentions(profile.datingIntentions);
          if (profile.datingBio) setBio(profile.datingBio);
          if (profile.datingInterests) setInterests(profile.datingInterests);
          if (profile.datingPhotos) setPhotos(profile.datingPhotos);
        }
      } catch (error) {
        console.error('Error loading existing profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadExistingProfile();
  }, []);


  const toggleIntention = (intention: string) => {
    setIntentions(prev =>
      prev.includes(intention)
        ? prev.filter(i => i !== intention)
        : [...prev, intention]
    );
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(prev => prev.filter(i => i !== interest));
    } else if (interests.length < 6) {
      setInterests(prev => [...prev, interest]);
    }
  };

  const pickPhoto = async () => {
    if (photos.length >= 6) {
      Alert.alert('Maximum Photos', 'You can upload up to 6 photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setPhotos(prev => [...prev, base64]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    switch (step) {
      case 1: return gender && lookingFor && height;
      case 2: return hometown && college && course && intentions.length > 0;
      case 3: return bio.length >= 20 && interests.length >= 3 && photos.length >= 1;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);
    try {
      const datingProfile = {
        datingGender: gender,
        datingLookingFor: lookingFor,
        datingHeight: height,
        datingHometown: hometown,
        datingCollege: college,
        datingCourse: course,
        datingIntentions: intentions,
        datingBio: bio,
        datingInterests: interests,
        datingPhotos: photos,
        datingProfileComplete: true,
      };

      await authAPI.updateDatingProfile(datingProfile);
      await AsyncStorage.setItem('datingProfileComplete', 'true');

      router.replace('/(tabs)/dating');
    } catch (error) {
      console.error('Error saving dating profile:', error);
      Alert.alert('Error', 'Failed to save your dating profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (canProceed() && step < totalSteps) {
      setStep(step + 1);
    } else if (step === totalSteps) {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      goBack();
    }
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Prevent loop: If not complete, go HOME, not to /dating
      router.replace('/');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PINK} />
        <Text style={{ marginTop: 16, color: '#6B7280' }}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[PINK, '#DB2777']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{isEditMode ? 'Edit Dating Profile' : 'Setup Dating Profile'}</Text>
            <Text style={styles.headerSubtitle}>Step {step} of {totalSteps}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress Bar / Step Tabs */}
        {isEditMode ? (
          <View style={styles.stepTabsContainer}>
            {[
              { num: 1, label: 'Basics' },
              { num: 2, label: 'About' },
              { num: 3, label: 'Photos' }
            ].map(s => (
              <TouchableOpacity
                key={s.num}
                style={[styles.stepTab, step === s.num && styles.stepTabActive]}
                onPress={() => setStep(s.num)}
              >
                <Text style={[styles.stepTabText, step === s.num && styles.stepTabTextActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.progressContainer}>
            {[1, 2, 3].map(s => (
              <View key={s} style={[styles.progressBar, s <= step && styles.progressBarActive]} />
            ))}
          </View>
        )}
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <Animated.View entering={FadeIn} style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Let's start with the basics</Text>

            <Text style={styles.label}>I am a...</Text>
            <View style={styles.optionsRow}>
              {GENDER_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionButton, gender === option && styles.optionButtonActive]}
                  onPress={() => setGender(option)}
                >
                  <Text style={[styles.optionText, gender === option && styles.optionTextActive]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Looking for...</Text>
            <View style={styles.optionsRow}>
              {LOOKING_FOR_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionButton, lookingFor === option && styles.optionButtonActive]}
                  onPress={() => setLookingFor(option)}
                >
                  <Text style={[styles.optionText, lookingFor === option && styles.optionTextActive]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Your height</Text>
            <TextInput
              style={styles.input}
              placeholder="Height in cm (e.g. 175)"
              placeholderTextColor="#9CA3AF"
              value={height}
              onChangeText={text => setHeight(text.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              maxLength={3}
            />
          </Animated.View>
        )}

        {/* Step 2: About You */}
        {step === 2 && (
          <Animated.View entering={FadeIn} style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Tell us about yourself</Text>

            <Text style={styles.label}>Hometown</Text>
            <TextInput
              style={styles.input}
              placeholder="Where are you from?"
              placeholderTextColor="#9CA3AF"
              value={hometown}
              onChangeText={setHometown}
            />

            <Text style={styles.label}>College</Text>
            <TextInput
              style={styles.input}
              placeholder="Your college name"
              placeholderTextColor="#9CA3AF"
              value={college}
              onChangeText={setCollege}
            />

            <Text style={styles.label}>Course / Major</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Computer Science"
              placeholderTextColor="#9CA3AF"
              value={course}
              onChangeText={setCourse}
            />

            <Text style={styles.label}>What are you looking for? (Select all that apply)</Text>
            <View style={styles.intentionsGrid}>
              {INTENTION_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.label}
                  style={[styles.intentionButton, intentions.includes(option.label) && styles.intentionButtonActive]}
                  onPress={() => toggleIntention(option.label)}
                >
                  <Text style={styles.intentionEmoji}>{option.emoji}</Text>
                  <Text style={[styles.intentionText, intentions.includes(option.label) && styles.intentionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Step 3: Interests & Photos */}
        {step === 3 && (
          <Animated.View entering={FadeIn} style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Show your personality</Text>

            <Text style={styles.label}>Bio (min 20 characters)</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Write something interesting about yourself..."
              placeholderTextColor="#9CA3AF"
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={300}
            />
            <Text style={styles.charCount}>{bio.length}/300</Text>

            <Text style={styles.label}>Interests (pick 3-6)</Text>
            <View style={styles.interestsGrid}>
              {INTEREST_OPTIONS.map(interest => (
                <TouchableOpacity
                  key={interest}
                  style={[styles.interestChip, interests.includes(interest) && styles.interestChipActive]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text style={[styles.interestText, interests.includes(interest) && styles.interestTextActive]}>
                    {interest}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Photos (1-6)</Text>
            <View style={styles.photosGrid}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoWrapper}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                  <TouchableOpacity style={styles.removePhoto} onPress={() => removePhoto(index)}>
                    <X size={14} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < 6 && (
                <TouchableOpacity style={styles.addPhoto} onPress={pickPhoto}>
                  <Camera size={24} color="#9CA3AF" />
                  <Text style={styles.addPhotoText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {step > 1 && (
          <TouchableOpacity style={styles.prevButton} onPress={prevStep}>
            <ArrowLeft size={20} color="#6B7280" />
            <Text style={styles.prevButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
          onPress={nextStep}
          disabled={!canProceed() || isSubmitting}
        >
          <Text style={styles.nextButtonText}>
            {step === totalSteps ? (isSubmitting ? 'Saving...' : 'Complete') : 'Continue'}
          </Text>
          {step < totalSteps ? <ArrowRight size={20} color="white" /> : <Heart size={20} color="white" fill="white" />}
        </TouchableOpacity>
      </View>
    </View >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', marginTop: 2 },
  progressContainer: { flexDirection: 'row', gap: 8, marginTop: 20 },
  progressBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  progressBarActive: { backgroundColor: 'white' },

  // Step Tabs (for edit mode)
  stepTabsContainer: { flexDirection: 'row', gap: 8, marginTop: 16 },
  stepTab: { flex: 1, paddingVertical: 10, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center' },
  stepTabActive: { backgroundColor: 'white' },
  stepTabText: { color: 'rgba(255,255,255,0.8)', fontWeight: '600', fontSize: 13 },
  stepTabTextActive: { color: PINK },

  content: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 120, maxWidth: MAX_WIDTH, alignSelf: 'center', width: '100%' },
  stepContainer: {},
  stepTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 24 },

  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10, marginTop: 16 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 16, color: '#111827' },
  bioInput: { height: 100, textAlignVertical: 'top' },
  charCount: { textAlign: 'right', fontSize: 12, color: '#9CA3AF', marginTop: 4 },

  optionsRow: { flexDirection: 'row', gap: 10 },
  optionButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center' },
  optionButtonActive: { backgroundColor: PINK },
  optionText: { fontWeight: '600', color: '#6B7280' },
  optionTextActive: { color: 'white' },

  heightScroll: { marginBottom: 8 },
  heightRow: { flexDirection: 'row', gap: 8 },
  heightChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F3F4F6' },
  heightChipActive: { backgroundColor: PINK },
  heightText: { color: '#6B7280', fontWeight: '500' },
  heightTextActive: { color: 'white' },

  intentionsGrid: { gap: 10 },
  intentionButton: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', gap: 12 },
  intentionButtonActive: { backgroundColor: '#FDF2F8', borderColor: PINK },
  intentionEmoji: { fontSize: 20 },
  intentionText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  intentionTextActive: { color: PINK, fontWeight: '600' },

  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  interestChipActive: { backgroundColor: PINK },
  interestText: { fontSize: 13, color: '#6B7280' },
  interestTextActive: { color: 'white' },

  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  photoWrapper: { width: (width - 80) / 3, aspectRatio: 0.75, borderRadius: 12, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  removePhoto: { position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  addPhoto: { width: (width - 80) / 3, aspectRatio: 0.75, borderRadius: 12, backgroundColor: '#F9FAFB', borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addPhotoText: { color: '#9CA3AF', marginTop: 4, fontSize: 12 },

  bottomActions: { flexDirection: 'row', padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20, gap: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', backgroundColor: 'white' },
  prevButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 14 },
  prevButtonText: { color: '#6B7280', fontWeight: '600' },
  nextButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: PINK, paddingVertical: 16, borderRadius: 14 },
  nextButtonDisabled: { backgroundColor: '#E5E7EB' },
  nextButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
