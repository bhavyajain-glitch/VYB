import { View, Text, ScrollView, Image, TouchableOpacity, FlatList, StyleSheet, Dimensions, Platform, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { LayoutGrid, Repeat, Heart, MessageCircle, Bookmark, MoreHorizontal, Plus, Send } from 'lucide-react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import Animated, { FadeInDown, FadeIn, useAnimatedStyle, useSharedValue, withSpring, withSequence, withDelay, withTiming, runOnJS, interpolate, Extrapolation, Easing } from 'react-native-reanimated';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../../services/api';
import CommentModal from '../../components/CommentModal';
import PostOptionsModal from '../../components/PostOptionsModal';
import StoryViewer from '../../components/StoryViewer';
import PostItem from '../../components/PostItem';
import PostViewerModal from '../../components/PostViewerModal';
import { getAvatarSource, getPostImageUrl } from '../../utils/imageUtils';
import * as ImagePicker from 'expo-image-picker';
import { pickImageWebCustom, processWebImage } from '../../utils/imagePickerWeb';
import { useAnalytics } from '../../hooks/useAnalytics';

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
  <Animated.View entering={FadeInDown.delay(index * 100).springify()} style={styles.storyWrapper}>
    <TouchableOpacity style={styles.storyCircleContainer} onPress={item.isAddStory ? onAddStory : () => onPress(index)}>
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
    </TouchableOpacity>
    <Text style={styles.storyName} numberOfLines={1}>
      {item.isAddStory ? 'Your story' : item.user?.fullName?.split(' ')[0] || item.user?.username}
    </Text>
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
  const { logFeatureUse } = useAnalytics('feed');
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
  const [isGridView, setIsGridView] = useState(false);
  const [uploadingStory, setUploadingStory] = useState(false);

  // Post Viewer (for Grid)
  const [postViewerVisible, setPostViewerVisible] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);

  useEffect(() => {
    const init = async () => {
      // Just check if we have data to fetch, AuthGuard handles the redirect if not
      const token = await AsyncStorage.getItem('userToken');
      const userInfo = await AsyncStorage.getItem('userInfo');

      if (token && userInfo) {
        try {
          const user = JSON.parse(userInfo);
          setCurrentUserId(user.id || user._id);
          setCurrentUserAvatar(user.profileImage);

          // Initial data fetch
          fetchPosts(1, true);
          fetchStories();
        } catch (e) {
          console.error('[Feed] Init parse failed:', e);
        }
      }
    };
    init();
  }, []);

  // Refresh feed when screen comes into focus (e.g., when tapping logo)
  useFocusEffect(
    useCallback(() => {
      const refresh = async () => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          fetchPosts(1, true);
          fetchStories();
        }
      };
      refresh();
    }, [])
  );


  const fetchStories = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) return;
    try {
      const res = await authAPI.getStories();
      setStoryGroups(res.data || []);
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const uploadStoryData = async (imageData: string) => {
    setUploadingStory(true);
    try {
      await authAPI.createStory(imageData);
      Alert.alert('Success', 'Story added!');
      fetchStories();
    } catch (error) {
      console.error('Story upload failed:', error);
      Alert.alert('Error', 'Failed to upload story');
    } finally {
      setUploadingStory(false);
    }
  };

  const takePhotoStory = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
        base64: true
      });

      if (!result.canceled && result.assets[0]) {
        let imageData = result.assets[0].base64
          ? `data:image/jpeg;base64,${result.assets[0].base64}`
          : result.assets[0].uri;
        await uploadStoryData(imageData);
      }
    } catch (error) {
      console.error('Take photo error:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickImageStory = async () => {
    try {
      let imageData: string | null = null;
      if (Platform.OS === 'web') {
        const uri = await pickImageWebCustom();
        if (uri) imageData = await processWebImage(uri);
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [9, 16],
          quality: 0.8,
          base64: true
        });
        if (!result.canceled && result.assets[0]) {
          imageData = result.assets[0].base64
            ? `data:image/jpeg;base64,${result.assets[0].base64}`
            : result.assets[0].uri;
        }
      }
      if (imageData) await uploadStoryData(imageData);
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleAddStory = async () => {
    if (Platform.OS === 'web') {
      await pickImageStory();
    } else {
      Alert.alert("Add Story", "Choose a source", [
        { text: "Camera", onPress: takePhotoStory },
        { text: "Gallery", onPress: pickImageStory },
        { text: "Cancel", style: "cancel" }
      ]);
    }
  };

  const fetchPosts = async (pageNum: number = 1, isRefresh: boolean = false) => {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) return;
    try {
      if (isRefresh) setRefreshing(true);
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
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 100) {
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

  const openStoryViewer = (index: number) => {
    setSelectedStoryIndex(index);
    setStoryViewerVisible(true);
  };

  const openPostFromGrid = (index: number) => {
    setSelectedPostIndex(index);
    setPostViewerVisible(true);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.headerRow}>
        <View style={styles.headerSideContainer}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => setIsGridView(!isGridView)}>
            <LayoutGrid size={22} color={isGridView ? '#8B5CF6' : '#111827'} />
          </TouchableOpacity>
        </View>

        <View style={styles.logoWrapper}>
          <Text style={styles.vybText}>Vyb</Text>
        </View>

        <View style={[styles.headerSideContainer, { alignItems: 'flex-end' }]}>
          <TouchableOpacity style={styles.swapButton} onPress={() => router.push('/(tabs)/dating')}>
            <Repeat size={16} color="#EC4899" />
            <Text style={styles.swapText}>Swap Vyb</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainLayout}>
        <View style={styles.feedColumn}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            onScroll={handleScroll}
            scrollEventThrottle={400}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesContainer}
              style={styles.storiesScroll}
            >
              <StoryItem
                item={{ isAddStory: true }}
                index={0}
                onAddStory={handleAddStory}
                currentUserAvatar={currentUserAvatar}
                onPress={() => { }}
              />
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
                <View style={styles.storyWrapper}>
                  <View style={styles.addStoryCircle}><ActivityIndicator color="#8B5CF6" /></View>
                  <Text style={styles.storyName}>Uploading...</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.postsList}>
              {posts.length === 0 && !refreshing ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#9CA3AF' }}>No posts yet. Be the first to post!</Text>
                </View>
              ) : isGridView ? (
                <View style={styles.masonryContainer}>
                  <View style={styles.masonryColumn}>
                    {posts.filter((_, i) => i % 2 === 0).map((post, index) => (
                      <Animated.View key={post._id} entering={FadeIn.delay(index * 100)} style={styles.masonryItem}>
                        <TouchableOpacity onPress={() => openPostFromGrid(posts.indexOf(post))}>
                          <Image
                            source={{ uri: getPostImageUrl(post.image) }}
                            style={[styles.masonryImage, { aspectRatio: index % 3 === 0 ? 0.7 : 1 }]}
                          />
                          <View style={styles.gridOverlay}>
                            <View style={styles.gridUser}>
                              <Image source={getAvatarSource(post.user?.profileImage)} style={styles.gridAvatar} />
                              <Text style={styles.gridUsername} numberOfLines={1}>{post.user?.username}</Text>
                            </View>
                            <View style={styles.gridLikes}>
                              <Heart size={10} color="white" fill="white" />
                              <Text style={styles.gridLikesText}>{post.likes?.length || 0}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </View>
                  <View style={styles.masonryColumn}>
                    {posts.filter((_, i) => i % 2 !== 0).map((post, index) => (
                      <Animated.View key={post._id} entering={FadeIn.delay(index * 150)} style={styles.masonryItem}>
                        <TouchableOpacity onPress={() => openPostFromGrid(posts.indexOf(post))}>
                          <Image
                            source={{ uri: getPostImageUrl(post.image) }}
                            style={[styles.masonryImage, { aspectRatio: index % 2 === 0 ? 1.2 : 0.8 }]}
                          />
                          <View style={styles.gridOverlay}>
                            <View style={styles.gridUser}>
                              <Image source={getAvatarSource(post.user?.profileImage)} style={styles.gridAvatar} />
                              <Text style={styles.gridUsername} numberOfLines={1}>{post.user?.username}</Text>
                            </View>
                            <View style={styles.gridLikes}>
                              <Heart size={10} color="white" fill="white" />
                              <Text style={styles.gridLikesText}>{post.likes?.length || 0}</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </View>
                </View>
              ) : (
                posts.map((post: any) => (
                  <PostItem
                    key={post._id}
                    item={post}
                    onComment={openComments}
                    onOptions={openOptions}
                    currentUserId={currentUserId}
                  />
                ))
              )}

              {loadingMore && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#8B5CF6" />
                  <Text style={{ color: '#9CA3AF', marginTop: 8, fontSize: 12 }}>Loading more posts...</Text>
                </View>
              )}

              {!hasMore && posts.length > 0 && (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#9CA3AF', fontSize: 12 }}>✨ You're all caught up!</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
        {isDesktop && <RightSidebar />}
      </View>

      {!isDesktop && (
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/create-post')} activeOpacity={0.9}>
          <Plus size={28} color="black" />
        </TouchableOpacity>
      )}

      <CommentModal visible={commentModalVisible} onClose={() => setCommentModalVisible(false)} postId={selectedPostId} />
      <StoryViewer visible={storyViewerVisible} storyGroups={storyGroups} initialGroupIndex={selectedStoryIndex} onClose={() => setStoryViewerVisible(false)} />
      <PostViewerModal visible={postViewerVisible} onClose={() => setPostViewerVisible(false)} posts={posts} initialIndex={selectedPostIndex} onComment={openComments} onOptions={openOptions} currentUserId={currentUserId} />
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
  // Feed Header Redesign
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 15,
    backgroundColor: 'white'
  },
  headerSideContainer: {
    width: 100, // Fixed width to ensure center logo is balanced
    justifyContent: 'center'
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  vybText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
    textAlign: 'center',
    flex: 1
  },
  swapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F9A8D4'
  },
  swapText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EC4899',
  },

  // Feed Layout
  feedColumn: { flex: 1, maxWidth: FEED_WIDTH },
  scrollContent: { paddingBottom: 100 },

  // Stories
  storiesScroll: { marginVertical: 10, width: '100%' },
  storiesContainer: { paddingHorizontal: 20, gap: 15 },
  storyWrapper: { alignItems: 'center', gap: 8 },
  storyCircleContainer: { width: 75, height: 75, alignItems: 'center', justifyContent: 'center' },
  addStoryCircle: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  addStoryPlus: { position: 'absolute', bottom: 2, right: 2, backgroundColor: '#3B82F6', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' },
  storyAvatarFaded: { width: 70, height: 70, borderRadius: 35, opacity: 0.7 },
  storyRing: { width: 74, height: 74, padding: 3, borderRadius: 37, borderWidth: 2, borderColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  storyRingActive: { borderColor: '#D4FF00' },
  storyAvatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, borderColor: 'white' },
  storyName: { fontSize: 12, color: '#111827', fontWeight: '500', textAlign: 'center' },

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
  // Masonry Grid
  masonryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    width: '100%',
    justifyContent: 'space-between'
  },
  masonryColumn: {
    width: '48.5%',
  },
  masonryItem: {
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  masonryImage: {
    width: '100%',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  gridUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1
  },
  gridAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'white'
  },
  gridUsername: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  gridLikes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10
  },
  gridLikesText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: 'white'
  }
});
