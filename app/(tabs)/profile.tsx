import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Platform, Alert, ImageBackground, ActivityIndicator as RNNativeActivityIndicator } from 'react-native';
import { Settings, Edit3, Grid, Bookmark, Heart, MapPin, GraduationCap, Link as LinkIcon, LogOut, Play, Camera, Layers, MessageCircle, Send, MoreHorizontal } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { authAPI } from '../../services/api';
import { USE_LOCAL_API } from '../../services/api';
import { RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { pickImageWebCustom, processWebImage } from '../../utils/imagePickerWeb';
import { getAvatarSource, getPostImageUrl, getCoverSource } from '../../utils/imageUtils';

const LIME = '#D4FF00';
const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 600;

interface UserData {
  _id: string;
  id?: string; // Fallback
  username?: string;
  fullName?: string;
  bio?: string;
  profileImage?: string;
  coverImage?: string;
  college?: string;
  year?: string;
  major?: string;
  age?: number;
  posts?: any[];
  followersCount?: number;
  followingCount?: number;
  isVerified?: boolean;
}


import PostViewerModal from '../../components/PostViewerModal';
import CommentModal from '../../components/CommentModal';
import PostOptionsModal from '../../components/PostOptionsModal';

export default function ProfileScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'posts' | 'gallery'>('posts');
  const [user, setUser] = useState<UserData | null>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [postViewerVisible, setPostViewerVisible] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);

  // Modals for interaction
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedPostOptions, setSelectedPostOptions] = useState<any>(null);
  const [isUpdatingImage, setIsUpdatingImage] = useState<string | null>(null); // 'avatar' or 'cover'

  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        loadCachedProfile();
        fetchProfile();
      }
    };
    init();
  }, []);

  const loadCachedProfile = async () => {
    try {
      const cached = await AsyncStorage.getItem('userInfo');
      if (cached) {
        setUser(JSON.parse(cached));
      }
    } catch (e) {
      console.error('Failed to load cached profile');
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await authAPI.getMe();
      if (res.data) {
        const userData = res.data;
        setUser(userData);
        // Update cache with fresh data
        await AsyncStorage.setItem('userInfo', JSON.stringify(userData));

        // Fetch posts after getting user ID
        const userId = userData._id || userData.id;
        if (userId) {
          const postsRes = await authAPI.getUserPosts(userId);
          if (postsRes.data) setUserPosts(postsRes.data);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback: try loading from cache if API fails
      loadCachedProfile();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    const doLogout = async () => {
      try {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userInfo');
        router.replace('/auth');
      } catch (error) {
        console.error('Error logging out:', error);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) {
        doLogout();
      }
    } else {
      Alert.alert(
        "Log Out",
        "Are you sure you want to log out?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Log Out", style: "destructive", onPress: doLogout }
        ]
      );
    }
  };

  const handleDeleteAccount = async () => {
    const doDelete = async () => {
      try {
        await authAPI.deleteAccount();
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userInfo');
        router.replace('/auth');
        Alert.alert('Success', 'Your account and data have been permanently deleted.');
      } catch (error: any) {
        console.error('Error deleting account:', error);
        Alert.alert('Error', error.message || 'Failed to delete account');
      }
    };

    Alert.alert(
      "Delete Account",
      "Are you sure? This will permanently delete your account, posts, profiles, and all associated data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete Permanently", style: "destructive", onPress: doDelete }
      ]
    );
  };

  const handleSettings = () => {
    Alert.alert(
      "Settings",
      "Manage your account",
      [
        { text: "Delete Account", style: "destructive", onPress: handleDeleteAccount },
        { text: "Log Out", onPress: handleLogout },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const openPost = (index: number) => {
    setSelectedPostIndex(index);
    setPostViewerVisible(true);
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
    // Refresh profile if user blocks someone (though unlikely to block self, kept for consistency)
    fetchProfile();
  };

  const handlePickImage = async (type: 'avatar' | 'cover') => {
    try {
      let result;
      if (Platform.OS === 'web') {
        const uri = await pickImageWebCustom();
        if (!uri) return;
        result = await processWebImage(uri);
      } else {
        const pickerRes = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: type === 'avatar' ? [1, 1] : [16, 9],
          quality: 0.7,
          base64: true,
        });

        if (pickerRes.canceled || !pickerRes.assets[0]) return;

        if (pickerRes.assets[0].base64) {
          result = `data:image/jpeg;base64,${pickerRes.assets[0].base64}`;
        } else {
          result = pickerRes.assets[0].uri;
        }
      }

      if (result) {
        uploadAndSaveImage(result, type);
      }
    } catch (error) {
      console.error('Image picking error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadAndSaveImage = async (imageData: string, type: 'avatar' | 'cover') => {
    setIsUpdatingImage(type);
    try {
      // 1. Upload to Cloudinary
      const uploadRes = await authAPI.uploadImage(imageData, type === 'avatar' ? 'profiles' : 'covers');
      const imageUrl = uploadRes.data.url;

      // 2. Update Backend Profile
      const updateData = type === 'avatar' ? { profileImage: imageUrl } : { coverImage: imageUrl };
      await authAPI.updateProfile(updateData);

      // 3. Update Local State
      if (user) {
        const updatedUser = { ...user, ...updateData };
        setUser(updatedUser);
        await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUser));
      }

      Alert.alert('Success', `${type === 'avatar' ? 'Profile' : 'Cover'} photo updated!`);
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to update image');
    } finally {
      setIsUpdatingImage(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.centerWrapper}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Header Background */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handlePickImage('cover')}
            disabled={!!isUpdatingImage}
          >
            <ImageBackground
              source={getCoverSource(user?.coverImage)}
              style={styles.headerBg}
              imageStyle={styles.headerImage}
            >
              <LinearGradient colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.4)']} style={StyleSheet.absoluteFill}>
                <View style={styles.headerActions}>
                  {isUpdatingImage === 'cover' ? (
                    <RNNativeActivityIndicator color="white" style={{ marginRight: 'auto', marginLeft: 16 }} />
                  ) : USE_LOCAL_API && (
                    <View style={styles.localBadge}>
                      <Text style={styles.localBadgeText}>🔧 LOCAL</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.actionButton} onPress={handleLogout}><LogOut size={18} color="white" /></TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={handleSettings}><Settings size={18} color="white" /></TouchableOpacity>
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>

          <View style={styles.profileSection}>
            {/* Avatar centered */}
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={() => handlePickImage('avatar')}
              disabled={!!isUpdatingImage}
            >
              <View style={styles.avatarBorder}>
                <Image source={getAvatarSource(user?.profileImage)} style={styles.avatar} />
                {isUpdatingImage === 'avatar' && (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 60, justifyContent: 'center', alignItems: 'center' }]}>
                    <RNNativeActivityIndicator color="white" />
                  </View>
                )}
                <View style={styles.avatarCameraIcon}>
                  <Camera size={14} color="white" />
                </View>
              </View>
            </TouchableOpacity>

            {/* Info Centered */}
            <View style={styles.nameSection}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{user?.fullName || 'User'}</Text>
                {user?.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedCheck}>✓</Text>
                  </View>
                )}
                {user?.age && <Text style={styles.nameAge}>, {user.age}</Text>}
              </View>

              <Text style={styles.usernameText}>@{user?.username || 'username'}</Text>

              {user?.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

              <View style={styles.detailsRow}>
                {user?.college && (
                  <View style={styles.detailBadge}>
                    <GraduationCap size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{user.college}</Text>
                  </View>
                )}
                {(user?.major || user?.year) && (
                  <View style={styles.detailBadge}>
                    <MapPin size={14} color="#6B7280" />
                    <Text style={styles.detailText}>
                      {user.major ? user.major : ''} {user.year ? `(${user.year})` : ''}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Stats Row Redesigned */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{user?.followersCount ? (user.followersCount > 1000 ? `${(user.followersCount / 1000).toFixed(1)} K` : user.followersCount) : '0'}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{user?.followingCount || 0}</Text>
                <Text style={styles.statLabel}>Followings</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userPosts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.mainActionsRow}>
              <TouchableOpacity style={[styles.mainActionButton, { flex: 2, backgroundColor: 'black' }]} onPress={() => router.push('/edit-profile')}>
                <Text style={[styles.mainActionButtonText, { color: 'white' }]}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainActionButton, { flex: 1 }]}
                onPress={async () => {
                  try {
                    const { Share } = require('react-native');
                    await Share.share({
                      message: `Check out ${user?.fullName || user?.username}'s profile on Vyb!`,
                      url: `https://vyb.app/user/${user?._id}`,
                    });
                  } catch (error) {
                    console.error('Share error:', error);
                  }
                }}
              >
                <Text style={styles.mainActionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>

            {/* Tabs Row Redesigned */}
            <View style={styles.tabsRow}>
              <TouchableOpacity onPress={() => setActiveTab('posts')} style={styles.tabButton}>
                <Grid size={24} color={activeTab === 'posts' ? "black" : "#D1D5DB"} />
                {activeTab === 'posts' && <View style={styles.activeTabIndicator} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTab('gallery')} style={styles.tabButton}>
                <Layers size={24} color={activeTab === 'gallery' ? "black" : "#D1D5DB"} />
                {activeTab === 'gallery' && <View style={styles.activeTabIndicator} />}
              </TouchableOpacity>
            </View>

            {/* Grid or Gallery */}
            {activeTab === 'posts' ? (
              <View style={styles.masonryContainer}>
                {userPosts.length === 0 ? (
                  <View style={{ width: '100%', padding: 40, alignItems: 'center' }}>
                    <Text style={{ color: '#9CA3AF' }}>No posts yet</Text>
                  </View>
                ) : (
                  <>
                    {/* Left Column */}
                    <View style={styles.masonryColumn}>
                      {Array.isArray(userPosts) && userPosts.filter((_, i) => i % 2 === 0).map((post, index) => (
                        <View key={post._id} style={styles.masonryItem}>
                          <TouchableOpacity onPress={() => openPost(userPosts.indexOf(post))}>
                            <Image
                              source={{ uri: getPostImageUrl(post.image) }}
                              style={[styles.masonryImage, { aspectRatio: index % 3 === 0 ? 0.7 : 1 }]}
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                    {/* Right Column */}
                    <View style={styles.masonryColumn}>
                      {Array.isArray(userPosts) && userPosts.filter((_, i) => i % 2 !== 0).map((post, index) => (
                        <View key={post._id} style={styles.masonryItem}>
                          <TouchableOpacity onPress={() => openPost(userPosts.indexOf(post))}>
                            <Image
                              source={{ uri: getPostImageUrl(post.image) }}
                              style={[styles.masonryImage, { aspectRatio: index % 2 === 0 ? 1.2 : 0.8 }]}
                              resizeMode="cover"
                            />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            ) : (
              <View style={styles.galleryContainer}>
                {userPosts.length === 0 ? (
                  <View style={{ width: '100%', padding: 40, alignItems: 'center' }}>
                    <Text style={{ color: '#9CA3AF' }}>No posts yet</Text>
                  </View>
                ) : (
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    pagingEnabled
                    snapToInterval={580}
                    decelerationRate="fast"
                    style={{ height: 580 }}
                    nestedScrollEnabled={true}
                  >
                    {userPosts.map((post) => (
                      <View key={post._id} style={styles.galleryCard}>
                        {/* Post Header */}
                        <View style={styles.postCardHeader}>
                          <View style={styles.postUserAvatar}>
                            <Image source={getAvatarSource(user?.profileImage)} style={styles.smallAvatar} />
                          </View>
                          <View style={styles.postHeaderText}>
                            <Text style={styles.postUserName}>{user?.fullName || 'User'}</Text>
                            <View style={styles.postLocationRow}>
                              <MapPin size={10} color="#9CA3AF" />
                              <Text style={styles.postLocationText}>{user?.college || 'NY, New York'}</Text>
                            </View>
                          </View>
                          <TouchableOpacity style={styles.moreButton}>
                            <MoreHorizontal size={20} color="#111827" />
                          </TouchableOpacity>
                        </View>

                        {/* Card Image */}
                        <View style={styles.cardImageContainer}>
                          <Image source={{ uri: getPostImageUrl(post.image) }} style={styles.galleryImage} resizeMode="cover" />
                        </View>

                        {/* Card Footer Actions */}
                        <View style={styles.cardFooter}>
                          <View style={styles.footerActionsLeft}>
                            <View style={styles.footerActionItem}>
                              <Heart size={22} color="#111827" />
                              <Text style={styles.footerActionText}>{post.likes?.length || 0}</Text>
                            </View>
                            <View style={styles.footerActionItem}>
                              <MessageCircle size={22} color="#111827" />
                              <Text style={styles.footerActionText}>{post.comments?.length || 0}</Text>
                            </View>
                            <View style={styles.footerActionItem}>
                              <Send size={22} color="#111827" />
                              <Text style={styles.footerActionText}>0</Text>
                            </View>
                          </View>
                          <TouchableOpacity>
                            <Bookmark size={22} color="#111827" />
                          </TouchableOpacity>
                        </View>

                        {/* Caption Area */}
                        <View style={styles.captionArea}>
                          <Text style={styles.captionText}>
                            <Text style={styles.captionUserName}>@{user?.username || 'user'} </Text>
                            {post.caption ? (post.caption.length > 100 ? post.caption.substring(0, 100) + '...' : post.caption) : ''}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>
          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>

      {/* Full Post Viewer */}
      <PostViewerModal
        visible={postViewerVisible}
        posts={userPosts}
        initialIndex={selectedPostIndex}
        onClose={() => setPostViewerVisible(false)}
        onComment={openComments}
        onOptions={openOptions}
        currentUserId={user?._id || null}
      />

      {/* Comment Modal Overlay */}
      <CommentModal
        visible={commentModalVisible}
        onClose={() => setCommentModalVisible(false)}
        postId={selectedPostId}
      />

      {/* Post Options Modal */}
      <PostOptionsModal
        visible={optionsModalVisible}
        onClose={() => setOptionsModalVisible(false)}
        post={selectedPostOptions}
        onBlockUser={handleBlockUser}
        currentUserId={user?._id || null}
        onDeletePost={async (postId) => {
          try {
            await authAPI.deletePost(postId);
            setUserPosts(prev => prev.filter(p => p._id !== postId));
            setPostViewerVisible(false); // Close viewer if deleted
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
  centerWrapper: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', flex: 1, borderRightWidth: isWeb ? 1 : 0, borderLeftWidth: isWeb ? 1 : 0, borderColor: '#F3F4F6' },
  headerBg: { height: 180, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden' },
  headerImage: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerActions: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, paddingTop: Platform.OS === 'ios' ? 50 : 20, gap: 12 },
  actionButton: { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },

  profileSection: { paddingHorizontal: 20, marginTop: -60, alignItems: 'center' },
  avatarWrapper: { alignItems: 'center', width: '100%' },
  avatarBorder: { borderWidth: 4, borderColor: 'white', borderRadius: 70, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarCameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 12, borderWidth: 2, borderColor: 'white' },

  nameSection: { marginTop: 16, alignItems: 'center', width: '100%', paddingHorizontal: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 24, fontWeight: '700', color: '#111827', letterSpacing: -0.5 },
  nameAge: { fontSize: 24, fontWeight: '400', color: '#6B7280' },
  usernameText: { fontSize: 15, color: '#3B82F6', fontWeight: '500', marginTop: 2 },
  verifiedBadge: { backgroundColor: '#3B82F6', width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  verifiedCheck: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  bio: { color: '#4B5563', marginTop: 10, lineHeight: 20, fontSize: 14, textAlign: 'center', maxWidth: '85%' },

  detailsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 12 },
  detailBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  detailText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },

  statsRow: { flexDirection: 'row', marginTop: 20, paddingVertical: 12, width: '100%', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, height: '60%', backgroundColor: '#F3F4F6', alignSelf: 'center' },
  statNumber: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statLabel: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },

  mainActionsRow: { flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' },
  mainActionButton: { flex: 1, height: 44, backgroundColor: '#F9FAFB', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
  mainActionButtonText: { color: '#111827', fontWeight: '600', fontSize: 15 },

  tabsRow: { flexDirection: 'row', marginTop: 24, width: '100%', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tabButton: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  tabActive: {},
  activeTabIndicator: { position: 'absolute', bottom: 0, width: 40, height: 2, backgroundColor: 'black', borderTopLeftRadius: 2, borderTopRightRadius: 2 },

  masonryContainer: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 10, gap: 12, width: '100%' },
  masonryColumn: { flex: 1, gap: 12 },
  masonryItem: { width: '100%', borderRadius: 20, overflow: 'hidden', backgroundColor: '#F3F4F6', minHeight: 100 },
  masonryImage: { width: '100%', borderRadius: 20 },

  galleryContainer: { marginTop: 15, paddingHorizontal: 20, alignItems: 'center' },
  galleryCard: { width: width - 40, height: 560, backgroundColor: 'white', borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, marginBottom: 20 },
  postCardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  postUserAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', overflow: 'hidden' },
  smallAvatar: { width: '100%', height: '100%' },
  postHeaderText: { flex: 1, marginLeft: 12 },
  postUserName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  postLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  postLocationText: { fontSize: 11, color: '#9CA3AF' },
  moreButton: { padding: 4 },
  cardImageContainer: { width: '100%', height: 350, backgroundColor: '#F9FAFB' },
  galleryImage: { width: '100%', height: '100%' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  footerActionsLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  footerActionItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerActionText: { fontSize: 13, fontWeight: '600', color: '#111827' },
  captionArea: { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 4 },
  captionText: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  captionUserName: { fontWeight: '700', color: '#111827' },

  bottomPadding: { height: 100 },

  // Local environment indicator
  localBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 'auto' },
  localBadgeText: { color: '#92400E', fontSize: 11, fontWeight: 'bold' },
});
