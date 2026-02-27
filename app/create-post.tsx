import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Alert, ActivityIndicator, Platform, Modal, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState, useCallback, useEffect, useRef } from 'react';
import { Camera, X, Plus, Video, Image as ImageIcon, Play, ChevronDown, MapPin, Clock, Users, Globe, Lock, UserCheck, GripVertical, Calendar } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { authAPI } from '../services/api';
import { processWebImage } from '../utils/imagePickerWeb';
import { pickVideo, videoUriToBase64, pickMediaWeb, MAX_VIDEO_DURATION, MAX_VIDEO_SIZE } from '../utils/mediaPicker';
import VideoPlayer from '../components/VideoPlayer';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DateTimePicker from '@react-native-community/datetimepicker';
import ImageEditor from '../components/ImageEditor';
import VideoTrimmer from '../components/VideoTrimmer';

const LIME = '#D4FF00';
const { width } = Dimensions.get('window');
const MAX_MEDIA = 10;

type MediaItem = {
  id: string;
  type: 'image' | 'video';
  uri: string;
  base64?: string;
  duration?: number;
  thumbnail?: string;
  trimStart?: number;
  trimEnd?: number;
};

type Visibility = 'public' | 'followers' | 'private';

const VISIBILITY_OPTIONS: { value: Visibility; label: string; icon: any; description: string }[] = [
  { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can see' },
  { value: 'followers', label: 'Followers', icon: UserCheck, description: 'Only your followers' },
  { value: 'private', label: 'Private', icon: Lock, description: 'Only you' },
];

export default function CreatePostScreen() {
  const router = useRouter();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');


  // New state for enhanced features
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [location, setLocation] = useState<{ name: string; lat?: number; lng?: number } | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempScheduleDate, setTempScheduleDate] = useState(new Date());

  // Mention & Hashtag Suggestions
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestionType, setSuggestionType] = useState<'mention' | 'hashtag' | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]); // Array of User ObjectIds


  // Image Editor State
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);





  const handleCaptionChange = async (text: string) => {
    setCaption(text);

    // Detect cursor position (approximation via text length if selection isn't available)
    // For simplicity, we check the last word
    const words = text.split(/\s/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('@') && lastWord.length > 1) {
      const query = lastWord.substring(1);
      setSuggestionType('mention');
      setMentionQuery(query);
      try {
        const res = await authAPI.searchUsers(query);
        setSuggestions(res.data || []);
      } catch (err) {
        setSuggestions([]);
      }
    } else if (lastWord.startsWith('#') && lastWord.length > 1) {
      setSuggestionType('hashtag');
      try {
        // Fetch trending hashtags or basic search
        const res = await authAPI.getTrendingHashtags();
        const query = lastWord.substring(1).toLowerCase();
        const filtered = (res.data || []).filter((h: any) =>
          h.name.toLowerCase().includes(query)
        );
        setSuggestions(filtered);
      } catch (err) {
        setSuggestions([]);
      }
    } else {
      setSuggestionType(null);
      setSuggestions([]);
    }
  };

  const selectSuggestion = (item: any) => {
    const words = caption.split(/\s/);
    words.pop(); // Remove the typed part

    if (suggestionType === 'mention') {
      words.push(`@${item.username} `);
      if (!taggedUsers.includes(item._id)) {
        setTaggedUsers(prev => [...prev, item._id]);
      }
    } else if (suggestionType === 'hashtag') {
      words.push(`#${item.name} `);
    }

    setCaption(words.join(' '));
    setSuggestionType(null);
    setSuggestions([]);
  };

  // Generate unique ID for media items
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Unified media picker from gallery
  const pickMediaFromGallery = async () => {
    if (Platform.OS === 'web') {
      try {
        console.log('Starting pickMediaWeb...');
        const result = await pickMediaWeb();
        console.log('pickMediaWeb result:', result);
        if (result) {
          if (result.type === 'video') {
            if (mediaItems.length >= MAX_MEDIA) {
              Alert.alert('Limit Reached', `Maximum ${MAX_MEDIA} items per post.`);
              return;
            }
            setMediaItems(prev => [...prev, {
              id: generateId(),
              type: 'video',
              uri: result.uri,
              base64: result.base64,
              duration: result.duration,
            }]);
          } else {
            const processed = await processWebImage(result.uri);
            if (mediaItems.length < MAX_MEDIA) {
              setMediaItems(prev => [...prev, { id: generateId(), type: 'image', uri: processed, base64: processed }]);
            }
          }
        }
      } catch (e) {
        console.error("Web custom picker failed", e);
        Alert.alert('Error', 'Failed to select media.');
      }
      return;
    }

    // Native: Multi-select both images and videos
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_MEDIA - mediaItems.length,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets) {
      setUploadStatus('Processing media...');
      const newItems: MediaItem[] = [];

      for (const asset of result.assets) {
        if (asset.type === 'video') {
          const duration = asset.duration ? asset.duration / 1000 : 0;
          if (duration > MAX_VIDEO_DURATION) {
            Alert.alert('Video Skipped', `A video was skipped because it exceeds the ${MAX_VIDEO_DURATION / 60} minute limit.`);
            continue;
          }
          if (asset.fileSize && asset.fileSize > MAX_VIDEO_SIZE) {
            Alert.alert('Video Skipped', `A video was skipped because it exceeds the ${MAX_VIDEO_SIZE / (1024 * 1024)}MB limit.`);
            continue;
          }

          let base64Data = undefined;
          base64Data = await videoUriToBase64(asset.uri);
          newItems.push({
            id: generateId(),
            type: 'video',
            uri: asset.uri,
            base64: base64Data,
            duration: asset.duration ? asset.duration / 1000 : undefined,
          });
        } else {
          const base64Data = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : undefined;
          newItems.push({
            id: generateId(),
            type: 'image',
            uri: asset.uri,
            base64: base64Data,
          });
        }
      }

      setMediaItems(prev => [...prev, ...newItems].slice(0, MAX_MEDIA));
      setUploadStatus('');
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
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

      if (mediaItems.length < MAX_MEDIA) {
        setMediaItems(prev => [...prev, { id: generateId(), type: 'image', uri: imageData, base64: imageData }]);
      }
    }
  };

  // Record video with camera
  const recordVideo = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Supported', 'Video recording is not available on web.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        videoMaxDuration: 600,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const duration = asset.duration ? asset.duration / 1000 : undefined;

        setUploadStatus('Preparing video...');
        const base64Data = await videoUriToBase64(asset.uri);

        setMediaItems(prev => [...prev, {
          id: generateId(),
          type: 'video',
          uri: asset.uri,
          base64: base64Data,
          duration,
        }]);
        setUploadStatus('');
      }
    } catch (error) {
      console.error('Video record error:', error);
      Alert.alert('Error', 'Failed to record video.');
      setUploadStatus('');
    }
  };

  const removeMedia = (id: string) => {
    setMediaItems(prev => prev.filter(item => item.id !== id));
  };

  const requestSource = () => {
    if (Platform.OS === 'web') {
      pickMediaFromGallery();
    } else {
      Alert.alert(
        "Add Media",
        "Choose a source for your post",
        [
          { text: "Camera (Photo)", onPress: takePhoto },
          { text: "Camera (Video)", onPress: recordVideo },
          { text: "Gallery", onPress: pickMediaFromGallery },
          { text: "Cancel", style: "cancel" }
        ]
      );
    }
  };

  // Handle drag end for reordering
  const onDragEnd = useCallback(({ data }: { data: MediaItem[] }) => {
    setMediaItems(data);
  }, []);

  const handlePost = async () => {
    if (mediaItems.length === 0) return;

    setIsLoading(true);
    setUploadProgress(0);

    try {
      const uploadedImages: string[] = [];
      const uploadedVideos: Array<{ url: string; publicId: string; duration?: number; thumbnail?: string; trimStart?: number; trimEnd?: number }> = [];

      for (let i = 0; i < mediaItems.length; i++) {
        const item = mediaItems[i];
        setUploadStatus(`Uploading ${item.type} ${i + 1}/${mediaItems.length}...`);

        if (item.type === 'image') {
          if (item.base64?.startsWith('data:')) {
            const uploadRes = await authAPI.uploadImage(item.base64, 'posts');
            uploadedImages.push(uploadRes.data.url);
          } else {
            uploadedImages.push(item.uri);
          }
        } else if (item.type === 'video') {
          let videoData = item.base64;
          if (!videoData && Platform.OS === 'web') {
            try {
              videoData = await videoUriToBase64(item.uri);
            } catch (e) {
              console.error("Failed to generate base64 for video upload", e);
              Alert.alert('Upload Failed', 'Could not process video file.');
              setIsLoading(false);
              return;
            }
          }

          if (videoData) {
            const uploadRes = await authAPI.uploadVideo(videoData, 'posts/videos');
            console.log('Video upload response:', uploadRes);

            if (uploadRes.data && uploadRes.data.url) {
              uploadedVideos.push({
                url: uploadRes.data.url,
                publicId: uploadRes.data.publicId,
                duration: uploadRes.data.duration,
                thumbnail: uploadRes.data.thumbnail,
                trimStart: item.trimStart,
                trimEnd: item.trimEnd,
              });
            } else {
              console.error("Invalid upload response:", uploadRes);
              throw new Error("Server returned an invalid response for video upload.");
            }
          }
        }

        setUploadProgress(Math.round(((i + 1) / mediaItems.length) * 100));
      }

      setUploadStatus(scheduledFor ? 'Scheduling post...' : 'Creating post...');

      await authAPI.createPost({
        images: uploadedImages,
        videos: uploadedVideos,
        caption,
        visibility,
        location: location || undefined,
        taggedUsers: taggedUsers.length > 0 ? taggedUsers : undefined,
        scheduledFor: scheduledFor?.toISOString() || undefined,
      });

      Alert.alert(
        'Success',
        scheduledFor
          ? `Post scheduled for ${scheduledFor.toLocaleDateString()} at ${scheduledFor.toLocaleTimeString()}`
          : 'Post shared successfully!'
      );
      router.replace('/');
    } catch (error: any) {
      console.error("Post Creation Error:", error);
      Alert.alert('Error', error.message || 'Failed to share post.');
      if (error.retryable) {
        Alert.alert(
          'Upload Failed',
          error.message || 'Failed to upload media. Would you like to retry?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: handlePost },
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to share post.');
      }
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  const handleUpdateMedia = (newUri: string) => {
    if (editingMedia) {
      setMediaItems(prev => prev.map(item =>
        item.id === editingMedia.id ? { ...item, uri: newUri, base64: newUri } : item
      ));
    }
  };

  const handleTrimVideo = (startTime: number, endTime: number) => {
    if (editingMedia) {
      setMediaItems(prev => prev.map(item =>
        item.id === editingMedia.id ? { ...item, trimStart: startTime, trimEnd: endTime } : item
      ));
    }
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleSetLocation = () => {
    if (locationInput.trim()) {
      setLocation({ name: locationInput.trim() });
      setShowLocationModal(false);
      setLocationInput('');
    }
  };

  const handleScheduleConfirm = () => {
    if (tempScheduleDate > new Date()) {
      setScheduledFor(tempScheduleDate);
      setShowScheduleModal(false);
    } else {
      Alert.alert('Invalid Date', 'Please select a future date and time.');
    }
  };

  const hasMedia = mediaItems.length > 0;
  const firstMedia = mediaItems[0];
  if (firstMedia?.type === 'video') console.log('VIDEO URI:', firstMedia.uri);
  const visibilityOption = VISIBILITY_OPTIONS.find(v => v.value === visibility)!;

  // Render draggable thumbnail
  const renderDraggableItem = useCallback((params: any) => {
    const { item, drag, isActive, getIndex, index: listIndex } = params;
    const index = typeof getIndex === 'function' ? getIndex() : (listIndex ?? 0);

    const content = (
      <TouchableOpacity
        onLongPress={drag}
        disabled={isActive}
        style={[styles.thumbnailWrapper, isActive && styles.thumbnailDragging]}
      >
        {item.type === 'video' ? (
          <View style={styles.videoThumbnail}>
            <Image
              source={{ uri: item.thumbnail || item.uri }}
              style={styles.thumbnail}
              contentFit="cover"
            />
            <View style={styles.videoOverlay}>
              <Play size={16} color="white" fill="white" />
            </View>
          </View>
        ) : (
          <Image source={{ uri: item.uri }} style={styles.thumbnail} contentFit="cover" />
        )}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeMedia(item.id)}
        >
          <X size={14} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditingMedia(item)}
        >
          <Camera size={12} color="white" />
        </TouchableOpacity>
        {index === 0 && (
          <View style={styles.coverBadge}>
            <Text style={styles.coverBadgeText}>Cover</Text>
          </View>
        )}
        {item.type === 'video' && item.duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>
              {Math.floor(item.duration / 60)}:{String(Math.floor(item.duration % 60)).padStart(2, '0')}
            </Text>
          </View>
        )}
        <View style={styles.dragHandle}>
          <GripVertical size={12} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );

    if (Platform.OS === 'web') {
      return content;
    }

    return (
      <ScaleDecorator>
        {content}
      </ScaleDecorator>
    );
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.iconButton}>
            <X size={24} color="black" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerTitle}>New Post</Text>
          </View>
          <TouchableOpacity
            onPress={handlePost}
            disabled={!hasMedia || isLoading}
            style={[styles.postButton, (!hasMedia || isLoading) && styles.disabledButton]}
          >
            {isLoading ? (
              <Text style={styles.postButtonText}>{uploadProgress}%</Text>
            ) : (
              <Text style={styles.postButtonText}>{scheduledFor ? 'Schedule' : 'Share'}</Text>
            )}
          </TouchableOpacity>
        </View>



        {/* Upload Status */}
        {uploadStatus ? (
          <View style={styles.statusBar}>
            <ActivityIndicator size="small" color={LIME} />
            <Text style={styles.statusText}>{uploadStatus}</Text>
          </View>
        ) : null}

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Media Gallery */}
          {hasMedia ? (
            <View>
              {/* Main Preview */}
              <View style={styles.mainMediaContainer}>
                {firstMedia.type === 'video' ? (
                  <VideoPlayer
                    uri={firstMedia.uri}
                    thumbnail={firstMedia.thumbnail}
                    showControls={true}
                    autoPlay={false}
                    style={styles.mainVideo}
                  />
                ) : (
                  <Image
                    source={{ uri: firstMedia.uri }}
                    style={styles.mainImage}
                    contentFit="cover"
                  />
                )}
                <View style={styles.mediaCounter}>
                  <Text style={styles.mediaCounterText}>{mediaItems.length}/{MAX_MEDIA}</Text>
                </View>
              </View>

              {/* Draggable Thumbnail Strip */}
              <View style={styles.thumbnailStripContainer}>
                <Text style={styles.thumbnailHint}>Hold and drag to reorder</Text>
                {Platform.OS === 'web' ? (
                  <FlatList
                    data={mediaItems}
                    horizontal
                    keyExtractor={(item) => item.id}
                    renderItem={renderDraggableItem}
                    contentContainerStyle={styles.thumbnailContainer}
                    ListFooterComponent={
                      mediaItems.length < MAX_MEDIA ? (
                        <TouchableOpacity
                          style={styles.addMoreButton}
                          onPress={requestSource}
                        >
                          <Plus size={24} color="#6B7280" />
                        </TouchableOpacity>
                      ) : null
                    }
                  />
                ) : (
                  <DraggableFlatList
                    data={mediaItems}
                    horizontal
                    onDragEnd={onDragEnd}
                    keyExtractor={(item) => item.id}
                    renderItem={renderDraggableItem}
                    containerStyle={styles.thumbnailContainer}
                    ListFooterComponent={
                      mediaItems.length < MAX_MEDIA ? (
                        <TouchableOpacity
                          style={styles.addMoreButton}
                          onPress={requestSource}
                        >
                          <Plus size={24} color="#6B7280" />
                        </TouchableOpacity>
                      ) : null
                    }
                  />
                )}

              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={requestSource} style={styles.emptyState} activeOpacity={0.9}>
              <Plus size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>
                Tap to select photos or videos
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Up to {MAX_MEDIA} items per post
              </Text>
            </TouchableOpacity>
          )}

          {/* Suggestions List */}
          {suggestionType && suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <View style={styles.suggestionsHeader}>
                <Text style={styles.suggestionsTitle}>
                  {suggestionType === 'mention' ? 'Mention Users' : 'Hashtags'}
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsList}
                keyboardShouldPersistTaps="handled"
              >
                {suggestions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => selectSuggestion(item)}
                  >
                    {suggestionType === 'mention' ? (
                      <>
                        <Image
                          source={{ uri: item.profileImage || `https://ui-avatars.com/api/?name=${item.username}` }}
                          style={styles.suggestionAvatar}
                        />
                        <Text style={styles.suggestionText}>@{item.username}</Text>
                      </>
                    ) : (
                      <>
                        <View style={styles.hashtagIcon}>
                          <Text style={styles.hashtagIconText}>#</Text>
                        </View>
                        <Text style={styles.suggestionText}>{item.name}</Text>
                        {item.count && <Text style={styles.suggestionSubtext}>{item.count}</Text>}
                      </>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Caption Input */}
          <View style={styles.captionContainer}>
            <TextInput
              placeholder="Write a caption..."
              placeholderTextColor="#9CA3AF"
              value={caption}
              onChangeText={handleCaptionChange}
              multiline
              style={styles.captionInput}
            />
          </View>

          {/* Post Options */}
          <View style={styles.optionsContainer}>
            {/* Visibility Selector */}
            <TouchableOpacity style={styles.optionRow} onPress={() => setShowVisibilityModal(true)}>
              <View style={styles.optionLeft}>
                <visibilityOption.icon size={20} color="#374151" />
                <Text style={styles.optionLabel}>Visibility</Text>
              </View>
              <View style={styles.optionRight}>
                <Text style={styles.optionValue}>{visibilityOption.label}</Text>
                <ChevronDown size={18} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

            {/* Location */}
            <TouchableOpacity style={styles.optionRow} onPress={() => setShowLocationModal(true)}>
              <View style={styles.optionLeft}>
                <MapPin size={20} color="#374151" />
                <Text style={styles.optionLabel}>Add Location</Text>
              </View>
              <View style={styles.optionRight}>
                {location ? (
                  <>
                    <Text style={styles.optionValue} numberOfLines={1}>{location.name}</Text>
                    <TouchableOpacity onPress={() => setLocation(null)}>
                      <X size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <ChevronDown size={18} color="#9CA3AF" />
                )}
              </View>
            </TouchableOpacity>

            {/* Schedule */}
            <TouchableOpacity style={styles.optionRow} onPress={() => setShowScheduleModal(true)}>
              <View style={styles.optionLeft}>
                <Clock size={20} color="#374151" />
                <Text style={styles.optionLabel}>Schedule</Text>
              </View>
              <View style={styles.optionRight}>
                {scheduledFor ? (
                  <>
                    <Text style={styles.optionValue}>
                      {scheduledFor.toLocaleDateString()} {scheduledFor.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <TouchableOpacity onPress={() => setScheduledFor(null)}>
                      <X size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.optionValueMuted}>Post now</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Visibility Modal */}
        <Modal visible={showVisibilityModal} transparent animationType="slide">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowVisibilityModal(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Who can see this post?</Text>
              {VISIBILITY_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.visibilityOption, visibility === option.value && styles.visibilityOptionSelected]}
                  onPress={() => {
                    setVisibility(option.value);
                    setShowVisibilityModal(false);
                  }}
                >
                  <option.icon size={24} color={visibility === option.value ? 'black' : '#6B7280'} />
                  <View style={styles.visibilityOptionText}>
                    <Text style={[styles.visibilityOptionLabel, visibility === option.value && styles.visibilityOptionLabelSelected]}>
                      {option.label}
                    </Text>
                    <Text style={styles.visibilityOptionDesc}>{option.description}</Text>
                  </View>
                  {visibility === option.value && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Location Modal */}
        <Modal visible={showLocationModal} transparent animationType="slide">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowLocationModal(false)}>
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>Add Location</Text>
              <TextInput
                style={styles.locationInput}
                placeholder="Enter location name..."
                placeholderTextColor="#9CA3AF"
                value={locationInput}
                onChangeText={setLocationInput}
                autoFocus
              />
              <TouchableOpacity style={styles.modalButton} onPress={handleSetLocation}>
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Schedule Modal */}
        <Modal visible={showScheduleModal} transparent animationType="slide">
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowScheduleModal(false)}>
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>Schedule Post</Text>
              <Text style={styles.scheduleSubtitle}>Select when to publish this post</Text>

              <TouchableOpacity style={styles.dateTimeSelector} onPress={() => setShowDatePicker(true)}>
                <Calendar size={20} color="#374151" />
                <Text style={styles.dateTimeText}>{tempScheduleDate.toLocaleDateString()}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dateTimeSelector} onPress={() => setShowTimePicker(true)}>
                <Clock size={20} color="#374151" />
                <Text style={styles.dateTimeText}>
                  {tempScheduleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>

              {(showDatePicker || showTimePicker) && (
                <DateTimePicker
                  value={tempScheduleDate}
                  mode={showDatePicker ? 'date' : 'time'}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    setShowTimePicker(false);
                    if (date) setTempScheduleDate(date);
                  }}
                />
              )}

              <View style={styles.scheduleButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setShowScheduleModal(false)}
                >
                  <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButton} onPress={handleScheduleConfirm}>
                  <Text style={styles.modalButtonText}>Schedule</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {editingMedia && editingMedia.type === 'image' && (
          <ImageEditor
            visible={!!editingMedia}
            uri={editingMedia.uri}
            onClose={() => setEditingMedia(null)}
            onSave={handleUpdateMedia}
          />
        )}

        {editingMedia && editingMedia.type === 'video' && (
          <VideoTrimmer
            visible={!!editingMedia}
            uri={editingMedia.uri}
            duration={editingMedia.duration || 0}
            onClose={() => setEditingMedia(null)}
            onSave={handleTrimVideo}
            initialStartTime={editingMedia.trimStart}
            initialEndTime={editingMedia.trimEnd}
          />
        )}
      </View>
    </GestureHandlerRootView>
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

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  modeButtonActive: {
    backgroundColor: LIME,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  modeButtonTextActive: {
    color: 'black',
  },

  // Status bar
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
  },

  content: { flex: 1, maxWidth: 600, alignSelf: 'center', width: '100%' },

  // Main media preview
  mainMediaContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F9FAFB',
    position: 'relative',
    ...(Platform.OS === 'web' ? { minHeight: 400 } : {}),
  },
  mainImage: { width: '100%', height: '100%' },
  mainVideo: { width: '100%', height: '100%' },
  mediaCounter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mediaCounterText: { color: 'white', fontSize: 12, fontWeight: '600' },

  // Thumbnail strip
  thumbnailStripContainer: {
    paddingTop: 8,
  },
  thumbnailHint: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 4,
  },
  thumbnailContainer: { paddingHorizontal: 12, paddingVertical: 8 },
  thumbnailWrapper: { width: 70, height: 70, position: 'relative', marginRight: 8 },
  thumbnailDragging: { opacity: 0.9, transform: [{ scale: 1.05 }] },
  thumbnail: { width: '100%', height: '100%', borderRadius: 8 },
  videoThumbnail: { width: '100%', height: '100%', position: 'relative' },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  editButton: {
    position: 'absolute',
    top: -6,
    left: -6,
    backgroundColor: '#3B82F6',
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
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: { fontSize: 9, color: 'white', fontWeight: '500' },
  dragHandle: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 2,
    borderRadius: 4,
  },
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
  captionContainer: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  captionInput: { fontSize: 16, color: 'black', minHeight: 80, textAlignVertical: 'top' },

  // Options
  optionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionLabel: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '50%',
  },
  optionValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  optionValueMuted: {
    fontSize: 14,
    color: '#9CA3AF',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },

  // Visibility options
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  visibilityOptionSelected: {
    backgroundColor: LIME + '30',
    borderWidth: 2,
    borderColor: LIME,
  },
  visibilityOptionText: {
    flex: 1,
  },
  visibilityOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  visibilityOptionLabelSelected: {
    color: 'black',
  },
  visibilityOptionDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: LIME,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Location input
  locationInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: LIME,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalButtonSecondary: {
    backgroundColor: '#F3F4F6',
    flex: 1,
  },
  modalButtonTextSecondary: {
    fontWeight: '600',
    fontSize: 16,
    color: '#6B7280',
  },

  // Schedule
  scheduleSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  dateTimeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  scheduleButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },

  // Suggestions
  suggestionsContainer: {
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 12,
  },
  suggestionsHeader: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionsList: {
    paddingHorizontal: 12,
    gap: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  suggestionAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  suggestionSubtext: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  hashtagIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hashtagIconText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
});
