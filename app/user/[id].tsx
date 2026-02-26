import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, ImageBackground, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle, Settings, Grid, Bookmark, Heart, Play, Layers, Send, MoreHorizontal, MapPin } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authAPI } from '../../services/api';
import { getAvatarSource, getPostImageUrl, getCoverSource } from '../../utils/imageUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LIME = '#D4FF00';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'gallery'>('posts');

  useEffect(() => {
    const checkAndFetch = async () => {
      // Check if viewing own profile - redirect to profile tab
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        const currentUser = JSON.parse(userInfo);
        const currentUserId = currentUser._id || currentUser.id;
        if (id === currentUserId) {
          router.replace('/(tabs)/profile');
          return;
        }
      }
      if (id) fetchUser();
    };
    checkAndFetch();
  }, [id]);

  const fetchUser = async () => {
    try {
      // Parallel fetch for user speed
      const [res, postsRes] = await Promise.all([
        authAPI.getUser(id as string),
        authAPI.getUserPosts(id as string)
      ]);

      setUser(res.data);
      setIsFollowing(res.data.isFollowing);
      setFollowersCount(res.data.followers?.length || 0);
      setPosts(postsRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) return;
    try {
      // Optimistic Update
      const newStatus = !isFollowing;
      setIsFollowing(newStatus);
      setFollowersCount(prev => newStatus ? prev + 1 : prev - 1);

      await authAPI.followUser(user._id);
    } catch (error) {
      console.error(error);
      // Revert on failure
      setIsFollowing(!isFollowing);
    }
  };

  const goBack = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)'); // Explicitly go to tabs/feed
      }
    } catch (e) {
      router.replace('/(tabs)');
    }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator color={LIME} size="large" /></View>;
  if (!user) return <View style={styles.centered}><Text>User not found</Text></View>;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header handled inside ScrollView */}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Background */}
        <ImageBackground
          source={getCoverSource(user.coverImage)}
          style={styles.headerBg}
          imageStyle={styles.headerImage}
        >
          <LinearGradient colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.4)']} style={StyleSheet.absoluteFill}>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.actionButton} onPress={goBack}>
                <ArrowLeft size={20} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.profileSection}>
          {/* Avatar centered */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarBorder}>
              <Image source={getAvatarSource(user.profileImage)} style={styles.avatar} />
            </View>
          </View>

          {/* Info Centered */}
          <View style={styles.nameSection}>
            <Text style={styles.name}>{user.fullName}</Text>
            <Text style={styles.bio}>{user.bio || ''}</Text>
          </View>

          {/* Stats Row Redesigned */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followersCount > 1000 ? `${(followersCount / 1000).toFixed(1)} K` : followersCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.following?.length || 0}</Text>
              <Text style={styles.statLabel}>Followings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.mainActionsRow}>
            <TouchableOpacity
              style={[styles.mainActionButton, isFollowing && styles.followingButton, { flex: 1 }]}
              onPress={handleFollow}
            >
              <Text style={[styles.mainActionButtonText, isFollowing && styles.followingText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
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
              {posts.length === 0 ? (
                <View style={{ width: '100%', padding: 40, alignItems: 'center' }}>
                  <Text style={{ color: '#9CA3AF' }}>No posts yet</Text>
                </View>
              ) : (
                <>
                  {/* Left Column */}
                  <View style={styles.masonryColumn}>
                    {posts.filter((_, i) => i % 2 === 0).map((post: any, index) => (
                      <View key={post._id} style={styles.masonryItem}>
                        <TouchableOpacity onPress={() => router.push(`/post/${post._id}`)}>
                          <Image
                            source={{ uri: getPostImageUrl(post.image) }}
                            style={[styles.masonryImage, { aspectRatio: index % 3 === 0 ? 0.7 : 1 }]}
                          />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                  {/* Right Column */}
                  <View style={styles.masonryColumn}>
                    {posts.filter((_, i) => i % 2 !== 0).map((post: any, index) => (
                      <View key={post._id} style={styles.masonryItem}>
                        <TouchableOpacity onPress={() => router.push(`/post/${post._id}`)}>
                          <Image
                            source={{ uri: getPostImageUrl(post.image) }}
                            style={[styles.masonryImage, { aspectRatio: index % 2 === 0 ? 1.2 : 0.8 }]}
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
              <ScrollView
                showsVerticalScrollIndicator={false}
                pagingEnabled
                snapToInterval={580}
                decelerationRate="fast"
                style={{ height: 580 }}
                nestedScrollEnabled={true}
              >
                {posts.map((post: any) => (
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
            </View>
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const InfoItem = ({ label, value }: any) => value ? (
  <View style={{ alignItems: 'center' }}>
    <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 4 }}>{label}</Text>
    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{value}</Text>
  </View>
) : null;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBg: { height: 180, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden' },
  headerImage: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerActions: { flexDirection: 'row', justifyContent: 'flex-start', padding: 16, paddingTop: Platform.OS === 'ios' ? 50 : 20, gap: 12 },
  actionButton: { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },

  profileSection: { paddingHorizontal: 20, marginTop: -60, alignItems: 'center' },
  avatarWrapper: { alignItems: 'center', width: '100%' },
  avatarBorder: { borderWidth: 4, borderColor: 'white', borderRadius: 70, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  avatar: { width: 120, height: 120, borderRadius: 60 },

  nameSection: { marginTop: 16, alignItems: 'center' },
  name: { fontSize: 24, fontWeight: '700', color: '#111827', letterSpacing: -0.5 },
  bio: { color: '#6B7280', marginTop: 8, lineHeight: 20, fontSize: 14, textAlign: 'center', maxWidth: '80%' },

  statsRow: { flexDirection: 'row', marginTop: 24, paddingVertical: 12, width: '100%', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, height: '60%', backgroundColor: '#F3F4F6', alignSelf: 'center' },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#111827' },
  statLabel: { color: '#9CA3AF', fontSize: 13, marginTop: 4 },

  mainActionsRow: { flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' },
  mainActionButton: { flex: 1, height: 48, backgroundColor: '#F9FAFB', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
  mainActionButtonText: { color: '#111827', fontWeight: '600', fontSize: 15 },
  followingButton: { backgroundColor: '#E5E7EB' },
  followingText: { color: 'black' },

  tabsRow: { flexDirection: 'row', marginTop: 24, width: '100%', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tabButton: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  activeTabIndicator: { position: 'absolute', bottom: 0, width: 40, height: 2, backgroundColor: 'black', borderTopLeftRadius: 2, borderTopRightRadius: 2 },

  masonryContainer: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 10, gap: 12, width: '100%' },
  masonryColumn: { flex: 1, gap: 12 },
  masonryItem: { width: '100%', borderRadius: 20, overflow: 'hidden', backgroundColor: '#F3F4F6' },
  masonryImage: { width: '100%', borderRadius: 20 },

  galleryContainer: { marginTop: 15, paddingHorizontal: 20, alignItems: 'center', width: '100%' },
  galleryCard: { width: Dimensions.get('window').width - 40, height: 560, backgroundColor: 'white', borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, marginBottom: 20 },
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
});
