import { View, Text, ScrollView, Image, TouchableOpacity, FlatList, StyleSheet, Dimensions, Platform, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Plus } from 'lucide-react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring, withSequence, withDelay, withTiming, runOnJS, interpolate, Extrapolation, Easing } from 'react-native-reanimated';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import CommentModal from '../../components/CommentModal';
import PostOptionsModal from '../../components/PostOptionsModal';
import StoryViewer from '../../components/StoryViewer';
import PostItem from '../../components/PostItem';
import { getAvatarSource, getPostImageUrl } from '../../utils/imageUtils';
import * as ImagePicker from 'expo-image-picker';
import { pickImageWebCustom, processWebImage } from '../../utils/imagePickerWeb';

const LIME = '#D4FF00';
const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isDesktop = width >= 1024;
const FEED_WIDTH = 630; // Instagram feed width
const RIGHT_BAR_WIDTH = 320;

const posts = [
  {
    id: '1',
    author: { name: 'Arjun Mehta', username: 'arjun.mehta', avatar: 'https://i.pravatar.cc/150?img=8', verified: true },
    image: 'https://images.unsplash.com/photo-1540575467063-178a50da6a3a?w=800',
    caption: '🎭✨ Unwind 2026 Day 1 was INSANE! The classical fusion performance left everyone speechless 🔥 #UnwindFest #ADYPU',
    likes: 1247, comments: 342, timestamp: '2h',
  },
  {
    id: '2',
    author: { name: 'Priya Sharma', username: 'priya.codes', avatar: 'https://i.pravatar.cc/150?img=5', verified: false },
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
    caption: '💃 Nrityanjali dance competition vibes! Our team just nailed the semi-finals 🏆 #UnwindFest #DanceLife',
    likes: 856, comments: 178, timestamp: '4h',
  },
  {
    id: '3',
    author: { name: 'Rohan Desai', username: 'rohan_d', avatar: 'https://i.pravatar.cc/150?img=12', verified: true },
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    caption: '🎸 Pro Night was EPIC! Best crowd energy ever!! 🤘 Thank you Unwind committee 🙌 #ProNight',
    likes: 2134, comments: 567, timestamp: '6h',
  },
];

const suggestions = [
  { id: '1', username: 'shivam_dev', subtitle: 'Followed by arjun.m + 2 more', avatar: 'https://i.pravatar.cc/150?img=15' },
  { id: '2', username: 'akshanshu_ui', subtitle: 'Suggested for you', avatar: 'https://i.pravatar.cc/150?img=16' },
  { id: '3', username: 'tara_design', subtitle: 'New to CampusConnect', avatar: 'https://i.pravatar.cc/150?img=17' },
  { id: '4', username: 'krishna_art', subtitle: 'Followed by neha.gupta', avatar: 'https://i.pravatar.cc/150?img=18' },
  { id: '5', username: 'rohit_gym', subtitle: 'Suggested for you', avatar: 'https://i.pravatar.cc/150?img=19' },
];

// Story Item Component (Updated for real data)
const StoryItem = ({ item, index, onPress, onAddStory, currentUserAvatar }: any) => (
  <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
  <TouchableOpacity style={styles.storyItem} onPress={item.isAddStory ? onAddStory : () => onPress(index)}>
    {item.isAddStory ? (
      <View style={styles.addStoryCircle}>
        {currentUserAvatar ? (
          <>
            <Image source={getAvatarSource(currentUserAvatar)} style={styles.storyAvatarFaded} />
            <View style={styles.addStoryPlus}><Plus size={16} color="white" /></View>
          </>
        ) : (
          <Plus size={24} color="#9CA3AF" />
        )}
      </View>
    ) : (
      <View style={[styles.storyRing, item.hasUnviewed && styles.storyRingActive]}>
        <Image source={getAvatarSource(item.user?.profileImage)} style={styles.storyAvatar} />
      </View>
    )}
    <Text style={styles.storyName} numberOfLines={1}>
      {item.isAddStory ? 'Your story' : item.user?.username}
    </Text>
  </TouchableOpacity>
  </Animated.View>
);

// Post Item Component
// Post Item Component
// Post Item Component Removed (Imported)


const RightSidebar = () => (
  <View style={styles.rightSidebar}>
    {/* Current User */}
    <View style={styles.userSwitch}>
      <Image source={{ uri: 'https://i.pravatar.cc/150?img=32' }} style={styles.userAvatar} />
      <View style={styles.userInfo}>
        <Text style={styles.userUsername}>priyanshu_k</Text>
        <Text style={styles.userName}>Priyanshu Kumar</Text>
      </View>
      <TouchableOpacity><Text style={styles.switchText}>Switch</Text></TouchableOpacity>
    </View>

    {/* Suggestions Header */}
    <View style={styles.suggestionsHeader}>
      <Text style={styles.suggestionsTitle}>Suggested for you</Text>
      <TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
    </View>

    {/* Suggestions List */}
    <View style={styles.suggestionsList}>
      {suggestions.map(user => (
        <View key={user.id} style={styles.suggestionItem}>
          <Image source={{ uri: user.avatar }} style={styles.suggestionAvatar} />
          <View style={styles.suggestionInfo}>
            <Text style={styles.suggestionUsername}>{user.username}</Text>
            <Text style={styles.suggestionSubtitle} numberOfLines={1}>{user.subtitle}</Text>
          </View>
          <TouchableOpacity><Text style={styles.followText}>Follow</Text></TouchableOpacity>
        </View>
      ))}
    </View>

    {/* Footer */}
    <View style={styles.footer}>
      <Text style={styles.footerText}>About • Help • Press • API • Jobs • Privacy • Terms</Text>
      <Text style={styles.footerText}>Locations • Language • Meta Verified</Text>
      <Text style={[styles.footerText, { marginTop: 16 }]}>© 2026 CAMPUSCONNECT</Text>
    </View>
  </View>
);

export default function FeedScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'foryou'>('home');
  const [posts, setPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Comment Modal State
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);

  // Options Modal State
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedPostOptions, setSelectedPostOptions] = useState<any>(null);

  // Stories State
  const [storyGroups, setStoryGroups] = useState<any[]>([]);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [uploadingStory, setUploadingStory] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchPosts(1, true);
    fetchStories();
  }, []);

  // Refresh feed when screen comes into focus (e.g., when tapping logo)
  useFocusEffect(
    useCallback(() => {
      fetchPosts(1, true);
      fetchStories();
    }, [])
  );

  const checkAuth = async () => {
    try {
        const userInfo = await AsyncStorage.getItem('userInfo');
        if (userInfo) {
            const user = JSON.parse(userInfo);
            // Handle both 'id' and '_id' properties for compatibility
            setCurrentUserId(user.id || user._id);
            setCurrentUserAvatar(user.profileImage);
        } else {
            router.replace('/onboarding');
        }
    } catch (e) {
        console.error(e);
    }
  };

  const fetchStories = async () => {
    try {
      const res = await authAPI.getStories();
      setStoryGroups(res.data || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const handleAddStory = async () => {
    try {
      let imageData: string | null = null;

      if (Platform.OS === 'web') {
         // Web: Use Custom Picker + Processor
         const uri = await pickImageWebCustom();
         if (uri) {
             imageData = await processWebImage(uri);
         }
      } else {
         // Native: Use Expo Image Picker
         const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, // Native only
            aspect: [9, 16],
            quality: 0.8,
            base64: true
         });

         if (!result.canceled && result.assets[0]) {
             if (result.assets[0].base64) {
                 imageData = `data:image/jpeg;base64,${result.assets[0].base64}`;
             } else {
                 imageData = result.assets[0].uri;
             }
         }
      }

      if (imageData) {
        setUploadingStory(true);
        // rest of the upload logic handles imageData...
        
        try {
           // Direct usage of imageData (it is now base64 or valid URI)
           // Logic from original file continues here but we need to verify where imageData is used
           // Original code:
           // setUploadingStory(true);
           // ... logic ...
           // const res = await authAPI.createStory(imageData);

           const res = await authAPI.createStory(imageData);
           setUploadingStory(false);
           Alert.alert('Success', 'Story added!');
           fetchStories();
        } catch (error) {
           console.error('Story upload failed:', error);
           Alert.alert('Error', 'Failed to upload story');
           setUploadingStory(false);
        }
      }
    } catch (error) {
       console.error('Pick image error:', error);
       Alert.alert('Error', 'Failed to pick image');
    }
  };


  const openStoryViewer = (index: number) => {
    setSelectedStoryIndex(index);
    setStoryViewerVisible(true);
  };

  const fetchPosts = async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      const res = await authAPI.getPosts(pageNum, 10);
      
      if (isRefresh) {
        setPosts(res.data.posts);
        setPage(1);
      } else {
        setPosts(prev => [...prev, ...res.data.posts]);
      }
      
      setHasMore(res.data.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const loadMorePosts = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchPosts(page + 1, false);
  };

  const onRefresh = async () => {
    await Promise.all([fetchPosts(1, true), fetchStories()]);
    await checkAuth();
  };

  // Handle scroll to detect when near bottom
  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 100; // Load more when 100px from bottom
    
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      loadMorePosts();
    }
  };

  const openComments = (postId: string) => {
      setSelectedPostId(postId);
      setCommentModalVisible(true);
  };

  const openOptions = (post: any) => {
    setSelectedPostOptions(post);
    setOptionsModalVisible(true);
  };

  const handleBlockUser = (userId: string) => {
    // Remove all posts by this user from the current feed locally
    setPosts(prevPosts => prevPosts.filter(p => p.user._id !== userId));
    Alert.alert('Blocked', 'This user has been blocked. You will no longer see their posts.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainLayout}>
        {/* Center Feed */}
        <View style={styles.feedColumn}>
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            onScroll={handleScroll}
            scrollEventThrottle={400}
          >
            {/* Stories */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.storiesContainer}
              style={styles.storiesScroll}
            >
              {/* Add Story Button */}
              <StoryItem 
                item={{ isAddStory: true }} 
                index={0} 
                onAddStory={handleAddStory}
                currentUserAvatar={currentUserAvatar}
                onPress={() => {}}
              />
              {/* Other Stories */}
              {storyGroups.map((group: any, index: number) => (
                <StoryItem 
                  key={group.user._id} 
                  item={group} 
                  index={index + 1}
                  onPress={() => openStoryViewer(index)}
                  onAddStory={handleAddStory}
                  currentUserAvatar={currentUserAvatar}
                />
              ))}
              {uploadingStory && (
                <View style={styles.storyItem}>
                  <View style={styles.addStoryCircle}>
                    <ActivityIndicator color="#8B5CF6" />
                  </View>
                  <Text style={styles.storyName}>Uploading...</Text>
                </View>
              )}
            </ScrollView>

            {/* Posts */}
            <View style={styles.postsList}>
              {posts.length === 0 && !refreshing ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#9CA3AF' }}>No posts yet. Be the first to post!</Text>
                </View>
              ) : (
                posts.map((post: any, index: number) => (
                    <PostItem 
                        key={post._id} 
                        item={post} 
                        onComment={openComments} 
                        onOptions={openOptions}
                        currentUserId={currentUserId} 
                    />
                ))
              )}
              
              {/* Loading More Indicator */}
              {loadingMore && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#8B5CF6" />
                  <Text style={{ color: '#9CA3AF', marginTop: 8, fontSize: 12 }}>Loading more posts...</Text>
                </View>
              )}
              
              {/* End of Feed Indicator */}
              {!hasMore && posts.length > 0 && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#9CA3AF', fontSize: 12 }}>✨ You're all caught up!</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Right Sidebar (Desktop only) */}
        {isDesktop && <RightSidebar />}
      </View>
      
      {/* Floating Action Button for Mobile */}
      {!isDesktop && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => router.push('/create-post')}
          activeOpacity={0.9}
        >
          <Plus size={28} color="black" />
        </TouchableOpacity>
      )}
      
      {/* Comment Modal Overlay */}
      <CommentModal 
        visible={commentModalVisible} 
        onClose={() => setCommentModalVisible(false)} 
        postId={selectedPostId} 
      />

      {/* Story Viewer */}
      <StoryViewer
        visible={storyViewerVisible}
        storyGroups={storyGroups}
        initialGroupIndex={selectedStoryIndex}
        onClose={async (action, payload) => {
            if (action === 'delete' && payload) {
                // Confirm delete
                if (Platform.OS === 'web') {
                    if (confirm('Are you sure you want to delete this story?')) {
                        try {
                            await authAPI.archiveStory(payload);
                            setStoryViewerVisible(false);
                            fetchStories(); // Refresh stories
                        } catch (error) {
                            console.error(error);
                            alert('Failed to delete story');
                        }
                    }
                } else {
                    Alert.alert('Delete Story', 'Are you sure?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: async () => {
                            try {
                                await authAPI.archiveStory(payload);
                                setStoryViewerVisible(false);
                                fetchStories();
                            } catch (error) {
                                Alert.alert('Error', 'Failed to delete story');
                            }
                        }}
                    ]);
                }
            } else {
                setStoryViewerVisible(false);
            }
        }}
      />

      {/* Post Options Modal */}
      <PostOptionsModal 
        visible={optionsModalVisible}
        onClose={() => setOptionsModalVisible(false)}
        post={selectedPostOptions}
        onBlockUser={handleBlockUser}
        currentUserId={currentUserId}
        onDeletePost={async (postId) => {
            try {
                await authAPI.deletePost(postId);
                setPosts(prev => prev.filter(p => p._id !== postId));
                Alert.alert('Success', 'Post deleted successfully');
            } catch (error) {
                console.error(error);
                Alert.alert('Error', 'Failed to delete post');
            }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  mainLayout: { flex: 1, flexDirection: 'row', justifyContent: 'center', backgroundColor: isDesktop ? 'white' : 'white' },
  
  // Feed Layout
  feedColumn: { flex: 1, maxWidth: FEED_WIDTH, marginRight: isDesktop ? 32 : 0 },
  scrollContent: { paddingVertical: 24, alignItems: isDesktop ? 'center' : 'stretch' },

  // Stories
  storiesScroll: { marginBottom: 24, width: '100%', paddingLeft: isDesktop ? 0 : 0 },
  storiesContainer: { paddingHorizontal: 16, gap: 16 },
  storyItem: { alignItems: 'center', width: 72 },
  addStoryCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  addStoryPlus: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#3B82F6', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' },
  storyAvatarFaded: { width: 64, height: 64, borderRadius: 32, opacity: 0.7 },
  storyRing: { padding: 3, borderRadius: 38, borderWidth: 2, borderColor: '#9CA3AF', alignItems: 'center', justifyContent: 'center' },
  storyRingActive: { borderColor: '#D4FF00' },
  storyRingSmall: { padding: 2, borderRadius: 24, borderWidth: 2, borderColor: '#D4FF00' },
  storyAvatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: 'white' },
  storyName: { fontSize: 11, color: '#111827', marginTop: 4, textAlign: 'center' },
  storyRingSplit: { position: 'absolute', width: 66, height: 66, borderRadius: 33, borderWidth: 2, borderColor: '#D4FF00' },

  // Post
  post: { marginBottom: 20, width: '100%', maxWidth: 470, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 20 },
  postHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 12 },
  authorContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorAvatar: { width: 32, height: 32, borderRadius: 16 },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  authorUsername: { fontWeight: 'bold', fontSize: 14, color: '#111827' },
  verifiedBadge: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  verifiedCheck: { color: 'white', fontSize: 8, fontWeight: 'bold' },
  timestamp: { fontSize: 14, color: '#6B7280' },
  location: { fontSize: 12, color: '#111827' },
  moreButton: { padding: 4 },

  imageWrapper: { borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6', position: 'relative' },
  postImage: { width: '100%', aspectRatio: 1 },
  heartOverlay: { position: 'absolute', top: '50%', left: '50%', marginLeft: -40, marginTop: -40, zIndex: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65 },
  
  postActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  actionsLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center' },
  
  postFooter: { paddingHorizontal: 4 },
  likesText: { fontWeight: 'bold', marginBottom: 8 },
  caption: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  captionUsername: { fontWeight: 'bold' },
  viewComments: { color: '#6B7280', fontSize: 14, marginBottom: 8 },
  addComment: { color: '#9CA3AF', fontSize: 14 },
  postsList: { width: '100%', alignItems: 'center' },

  // Right Sidebar
  rightSidebar: { width: RIGHT_BAR_WIDTH, paddingTop: 32, paddingRight: 16 },
  userSwitch: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  userAvatar: { width: 44, height: 44, borderRadius: 22 },
  userInfo: { flex: 1, marginLeft: 12 },
  userUsername: { fontWeight: 'bold', fontSize: 14 },
  userName: { color: '#6B7280', fontSize: 14 },
  switchText: { color: '#0095F6', fontSize: 12, fontWeight: 'bold' },

  suggestionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  suggestionsTitle: { color: '#6B7280', fontWeight: 'bold', fontSize: 14 },
  seeAllText: { color: '#111827', fontSize: 12, fontWeight: 'bold' },
  
  suggestionsList: { gap: 16 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center' },
  suggestionAvatar: { width: 32, height: 32, borderRadius: 16 },
  suggestionInfo: { flex: 1, marginLeft: 12 },
  suggestionUsername: { fontWeight: 'bold', fontSize: 14 },
  suggestionSubtitle: { color: '#6B7280', fontSize: 12 },
  followText: { color: '#0095F6', fontSize: 12, fontWeight: 'bold' },

  footer: { marginTop: 32 },
  footerText: { color: '#D1D5DB', fontSize: 12, lineHeight: 16 },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: LIME,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 50,
  },
});
