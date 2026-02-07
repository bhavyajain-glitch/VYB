import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Dimensions, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Camera, X, Check, FileText } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { authAPI } from './services/api';

const LIME = '#D4FF00';
const { width } = Dimensions.get('window');



import { pickImageWebCustom, processWebImage } from '../utils/imagePickerWeb';

export default function CreatePostScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      try {
        const uri = await pickImageWebCustom();
        if (uri) {
          const processed = await processWebImage(uri);
          setImage(processed);
        }
      } catch (e) {
        console.error("Web custom picker failed", e);
        Alert.alert('Error', 'Failed to select image.');
      }
      return;
    }

    // Native Logic
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      if (result.assets[0].base64) {
        setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
      } else {
        setImage(result.assets[0].uri);
      }
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: Platform.OS !== 'web',
      aspect: [4, 5],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      if (Platform.OS === 'web') {
        try {
          const processed = await processWebImage(result.assets[0].uri);
          setImage(processed as string);
        } catch (e) {
          setImage(result.assets[0].uri);
        }
      } else {
        if (result.assets[0].base64) {
          setImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
        } else {
          setImage(result.assets[0].uri);
        }
      }
    }
  };

  const requestSource = () => {
    if (Platform.OS === 'web') {
      pickImage();
    } else {
      Alert.alert(
        "Select Image",
        "Choose a source",
        [
          { text: "Camera", onPress: takePhoto },
          { text: "Gallery", onPress: pickImage },
          { text: "Cancel", style: "cancel" }
        ]
      );
    }
  };

  const handlePost = async () => {
    if (!image) return;

    setIsLoading(true);
    try {
      let imageUrl = image;

      // Upload to Cloudinary if it's a base64/data URL
      if (image.startsWith('data:')) {
        console.log('📤 Uploading image to Cloudinary...');
        const uploadRes = await authAPI.uploadImage(image, 'posts');
        imageUrl = uploadRes.data.url;
        console.log('✅ Image uploaded:', imageUrl);
      }

      await authAPI.createPost({
        image: imageUrl,
        caption
      });

      Alert.alert('Success', 'Post shared successfully!');
      router.replace('/');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to share post.');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.iconButton}>
          <X size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity
          onPress={handlePost}
          disabled={!image || isLoading}
          style={[styles.postButton, (!image || isLoading) && styles.disabledButton]}
        >
          {isLoading ? <ActivityIndicator color="black" size="small" /> : <Text style={styles.postButtonText}>Share</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Image Picker */}
        <TouchableOpacity onPress={requestSource} style={styles.imageContainer} activeOpacity={0.9}>
          {image ? (
            image.startsWith('data:image/heic') || image.startsWith('data:image/heif') ? (
              <View style={[styles.previewImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' }]}>
                <FileText size={48} color="#6B7280" />
                <Text style={{ marginTop: 12, color: '#6B7280', fontWeight: '500' }}>HEIC Preview Unavailable</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Image will appear after upload</Text>
              </View>
            ) : (
              <Image source={{ uri: image }} style={styles.previewImage} resizeMode="cover" />
            )
          ) : (
            <View style={styles.placeholder}>
              <Camera size={48} color="#9CA3AF" />
              <Text style={styles.placeholderText}>Tap to select photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Caption Input */}
        <View style={styles.captionContainer}>
          <TextInput
            placeholder="Write a caption..."
            placeholderTextColor="#9CA3AF"
            value={caption}
            onChangeText={setCaption}
            multiline
            style={styles.captionInput}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  iconButton: { padding: 8 },
  postButton: { backgroundColor: LIME, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  disabledButton: { backgroundColor: '#F3F4F6' },
  postButtonText: { fontWeight: 'bold', fontSize: 14 },

  content: { flex: 1, maxWidth: 600, alignSelf: 'center', width: '100%' },
  imageContainer: { width: '100%', aspectRatio: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', gap: 12 },
  placeholderText: { color: '#9CA3AF', fontSize: 16, fontWeight: '500' },

  captionContainer: { padding: 20, flex: 1 },
  captionInput: { fontSize: 16, color: 'black', minHeight: 100, textAlignVertical: 'top' },
});
