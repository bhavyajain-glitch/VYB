import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Dimensions, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Camera, X, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { authAPI } from './services/api';

const LIME = '#D4FF00';
const { width } = Dimensions.get('window');

// Enhanced Web Image Compressor (Resize + Compress)
const processImageWeb = async (uri: string) => {
  if (Platform.OS !== 'web') return uri; // Fallback for native (ImagePicker handles it)
  
  return new Promise((resolve, reject) => {
    const img = new (window as any).Image();
    img.src = uri;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1024; // Safe max width
      const scale = MAX_WIDTH / img.width;
      
      // Only resize if too big
      if (scale < 1) {
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Compress to JPEG 0.5
      const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
      resolve(dataUrl);
    };
    img.onerror = (e: any) => reject(e);
  });
};

export default function CreatePostScreen() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.5, // Native quality
      base64: true, 
    });

    if (!result.canceled) {
      if (Platform.OS === 'web') {
        try {
          const processed = await processImageWeb(result.assets[0].uri);
          setImage(processed as string);
        } catch (e) {
          console.error("Web image processing failed", e);
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

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      if (Platform.OS === 'web') {
        try {
          const processed = await processImageWeb(result.assets[0].uri);
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
      await authAPI.createPost({
        image, // This is now a safe Data URL
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
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
            <Image source={{ uri: image }} style={styles.previewImage} resizeMode="cover" />
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
