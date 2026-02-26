import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Alert, ActivityIndicator, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Camera, X, Plus, FileText } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { authAPI } from '../services/api';
import { pickImageWebCustom, processWebImage } from '../utils/imagePickerWeb';

const LIME = '#D4FF00';
const { width } = Dimensions.get('window');
const MAX_IMAGES = 10;

export default function CreatePostScreen() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const pickImages = async () => {
    if (Platform.OS === 'web') {
      try {
        const uri = await pickImageWebCustom();
        if (uri) {
          const processed = await processWebImage(uri);
          if (images.length < MAX_IMAGES) {
            setImages(prev => [...prev, processed]);
          }
        }
      } catch (e) {
        console.error("Web custom picker failed", e);
        Alert.alert('Error', 'Failed to select image.');
      }
      return;
    }

    // Native: Multi-select
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => {
        if (asset.base64) {
          return `data:image/jpeg;base64,${asset.base64}`;
        }
        return asset.uri;
      });
      setImages(prev => [...prev, ...newImages].slice(0, MAX_IMAGES));
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: Platform.OS !== 'web',
      aspect: [4, 5],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      let imageData: string;
      if (Platform.OS === 'web') {
        try {
          imageData = await processWebImage(result.assets[0].uri);
        } catch (e) {
          imageData = result.assets[0].uri;
        }
      } else {
        imageData = result.assets[0].base64
          ? `data:image/jpeg;base64,${result.assets[0].base64}`
          : result.assets[0].uri;
      }

      if (images.length < MAX_IMAGES) {
        setImages(prev => [...prev, imageData]);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const requestSource = () => {
    if (Platform.OS === 'web') {
      pickImages();
    } else {
      Alert.alert(
        "Add Photos",
        `Select up to ${MAX_IMAGES - images.length} more photos`,
        [
          { text: "Camera", onPress: takePhoto },
          { text: "Gallery", onPress: pickImages },
          { text: "Cancel", style: "cancel" }
        ]
      );
    }
  };

  const handlePost = async () => {
    if (images.length === 0) return;

    setIsLoading(true);
    setUploadProgress(0);

    try {
      // Upload all images to Cloudinary
      const uploadedUrls: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        let imageUrl = img;

        if (img.startsWith('data:')) {
          console.log(`📤 Uploading image ${i + 1}/${images.length}...`);
          const uploadRes = await authAPI.uploadImage(img, 'posts');
          imageUrl = uploadRes.data.url;
        }

        uploadedUrls.push(imageUrl);
        setUploadProgress(Math.round(((i + 1) / images.length) * 100));
      }

      console.log('✅ All images uploaded, creating post...');

      await authAPI.createPost({
        images: uploadedUrls,
        caption
      });

      Alert.alert('Success', 'Post shared successfully!');
      router.replace('/');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to share post.');
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
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
          disabled={images.length === 0 || isLoading}
          style={[styles.postButton, (images.length === 0 || isLoading) && styles.disabledButton]}
        >
          {isLoading ? (
            <Text style={styles.postButtonText}>{uploadProgress}%</Text>
          ) : (
            <Text style={styles.postButtonText}>Share</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        {images.length > 0 ? (
          <View>
            {/* Main Preview - First Image */}
            <View style={styles.mainImageContainer}>
              <Image
                source={{ uri: images[0] }}
                style={styles.mainImage}
                contentFit="cover"
              />
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>{images.length}/{MAX_IMAGES}</Text>
              </View>
            </View>

            {/* Thumbnail Strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailContainer}
            >
              {images.map((img, index) => (
                <View key={index} style={styles.thumbnailWrapper}>
                  <Image source={{ uri: img }} style={styles.thumbnail} contentFit="cover" />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage(index)}
                  >
                    <X size={14} color="white" />
                  </TouchableOpacity>
                  {index === 0 && (
                    <View style={styles.coverBadge}>
                      <Text style={styles.coverBadgeText}>Cover</Text>
                    </View>
                  )}
                </View>
              ))}

              {images.length < MAX_IMAGES && (
                <TouchableOpacity style={styles.addMoreButton} onPress={requestSource}>
                  <Plus size={24} color="#6B7280" />
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        ) : (
          <TouchableOpacity onPress={requestSource} style={styles.emptyState} activeOpacity={0.9}>
            <Camera size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>Tap to select photos</Text>
            <Text style={styles.emptyStateSubtext}>Up to {MAX_IMAGES} photos per post</Text>
          </TouchableOpacity>
        )}

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
      </ScrollView>
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

  // Main image preview
  mainImageContainer: { width: '100%', aspectRatio: 1, backgroundColor: '#F9FAFB', position: 'relative' },
  mainImage: { width: '100%', height: '100%' },
  imageCounter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: { color: 'white', fontSize: 12, fontWeight: '600' },

  // Thumbnail strip
  thumbnailContainer: { padding: 12, gap: 8 },
  thumbnailWrapper: { width: 70, height: 70, position: 'relative' },
  thumbnail: { width: '100%', height: '100%', borderRadius: 8 },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: LIME,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coverBadgeText: { fontSize: 9, fontWeight: 'bold', color: 'black' },
  addMoreButton: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },

  // Empty state
  emptyState: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyStateText: { color: '#6B7280', fontSize: 16, fontWeight: '500' },
  emptyStateSubtext: { color: '#9CA3AF', fontSize: 14 },

  // Caption
  captionContainer: { padding: 20 },
  captionInput: { fontSize: 16, color: 'black', minHeight: 100, textAlignVertical: 'top' },
});
