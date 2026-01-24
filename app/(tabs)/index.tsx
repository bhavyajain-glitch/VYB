import { View, Text, ScrollView, Image, TouchableOpacity, FlatList, StyleSheet, Dimensions, Platform, RefreshControl } from 'react-native';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Plus } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import CommentModal from '../../components/CommentModal';

const LIME = '#D4FF00';
const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isDesktop = width >= 1024;
const FEED_WIDTH = 630; // Instagram feed width
const RIGHT_BAR_WIDTH = 320;

const stories = [
  { id: 'me', name: 'Your story', avatar: null, isYourStory: true },
  { id: '1', name: 'riya.patel', avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: '2', name: 'aditya.k', avatar: 'https://i.pravatar.cc/150?img=2' },
  { id: '3', name: 'sneha.reddy', avatar: 'https://i.pravatar.cc/150?img=3' },
  { id: '4', name: 'vivek.shah', avatar: 'https://i.pravatar.cc/150?img=4' },
  { id: '5', name: 'neha.gupta', avatar: 'https://i.pravatar.cc/150?img=6' },
  { id: '6', name: 'arjun.m', avatar: 'https://i.pravatar.cc/150?img=7' },
  { id: '7', name: 'kavya.s', avatar: 'https://i.pravatar.cc/150?img=9' },
];

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

const StoryItem = ({ item, index }: { item: typeof stories[0], index: number }) => (
  <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
  <TouchableOpacity style={styles.storyItem}>
    {item.isYourStory ? (
      <View style={styles.addStoryCircle}>
        <Plus size={24} color="#9CA3AF" />
      </View>
    ) : (
      <View style={styles.storyRing}>
        <View style={styles.storyRingSplit} />
        <Image source={{ uri: item.avatar! }} style={styles.storyAvatar} />
      </View>
    )}
    <Text style={styles.storyName} numberOfLines={1}>{item.name}</Text>
  </TouchableOpacity>
  </Animated.View>
);

// Post Item Component
const PostItem = ({ item, onComment, currentUserId }: { item: any, onComment: (id: string) => void, currentUserId: string | null }) => {
  const router = useRouter(); 
  const isLikedInitially = item.likes?.includes(currentUserId);
  const [isLiked, setIsLiked] = useState(isLikedInitially);
  const [likesCount, setLikesCount] = useState(item.likes?.length || 0);

  const handleLike = async () => {
    // Optimistic Update
    const previousState = isLiked;
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

    try {
        await authAPI.toggleLike(item._id);
    } catch (error) {
        // Revert on error
        setIsLiked(previousState);
        setLikesCount(previousState ? likesCount : likesCount - 1);
        console.error("Like failed", error);
    }
  };

  return (
    <Animated.View entering={FadeInDown} style={styles.post}>
      {/* Header */}
      <View style={styles.postHeader}>
        <View style={styles.authorContainer}>
          <View style={styles.storyRingSmall}>
             <Image source={{ uri: item.user?.profileImage || 'https://i.pravatar.cc/150' }} style={styles.authorAvatar} />
          </View>
          <View>
            <View style={styles.authorNameRow}>
              <Text style={styles.authorUsername}>{item.user?.username || 'User'}</Text>
              {item.user?.isVerified && <View style={styles.verifiedBadge}><Text style={styles.verifiedCheck}>✓</Text></View>}
              {/* <Text style={styles.timestamp}>• {new Date(item.createdAt).getHours()}h</Text> */}
            </View>
            <Text style={styles.location}>{item.user?.college || 'CampusConnect'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}><MoreHorizontal size={20} color="#111827" /></TouchableOpacity>
      </View>

      {/* Image */}
      <View style={styles.imageWrapper}>
        <Image source={{ uri: item.image }} style={styles.postImage} resizeMode="cover" />
      </View>

      {/* Actions */}
      <View style={styles.postActions}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
            <Heart size={26} color={isLiked ? '#FF3040' : 'black'} fill={isLiked ? '#FF3040' : 'transparent'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onComment(item._id)} style={styles.actionButton}>
            <MessageCircle size={26} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Send size={26} color="black" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity><Bookmark size={26} color="black" /></TouchableOpacity>
      </View>

      {/* Likes & Caption */}
      <View style={styles.postFooter}>
        <Text style={styles.likesText}>{likesCount} likes</Text>
        <Text style={styles.caption}>
          <Text style={styles.captionUsername}>{item.user?.username} </Text>
          {item.caption}
        </Text>
        <Text style={styles.viewComments}>View all comments</Text>
        <Text style={styles.addComment}>Add a comment...</Text>
      </View>
    </Animated.View>
  );
};


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
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Comment Modal State
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    fetchPosts();
  }, []);

  const checkAuth = async () => {
    try {
        const userInfo = await AsyncStorage.getItem('userInfo');
        if (userInfo) {
            const user = JSON.parse(userInfo);
            setCurrentUserId(user._id);
        } else {
            router.replace('/onboarding');
        }
    } catch (e) {
        console.error(e);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await authAPI.getPosts();
      setPosts(res.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPosts(), checkAuth()]);
    setRefreshing(false);
  };

  const openComments = (postId: string) => {
      setSelectedPostId(postId);
      setCommentModalVisible(true);
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
          >
            {/* Stories */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.storiesContainer}
              style={styles.storiesScroll}
            >
              {stories.map((story, index) => <StoryItem key={story.id} item={story} index={index} />)}
            </ScrollView>

            {/* Posts */}
            <View style={styles.postsList}>
              {posts.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#9CA3AF' }}>No posts yet. Be the first to post!</Text>
                </View>
              ) : (
                posts.map((post: any, index: number) => (
                    <PostItem key={post._id} item={post} onComment={openComments} currentUserId={currentUserId} />
                ))
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
  addStoryCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  storyRing: { padding: 3, borderRadius: 38, borderWidth: 2, borderColor: '#D4FF00', alignItems: 'center', justifyContent: 'center' },
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
  imageWrapper: { borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
  postImage: { width: '100%', aspectRatio: 1 },
  
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
