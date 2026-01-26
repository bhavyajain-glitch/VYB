import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Platform, Alert } from 'react-native';
import { Settings, Edit3, Grid, Bookmark, Heart, MapPin, GraduationCap, Link as LinkIcon, LogOut } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { authAPI } from '../services/api';
import { USE_LOCAL_API } from '../services/api';
import { RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAvatarSource, getPostImageUrl } from '../../utils/imageUtils';

const LIME = '#D4FF00';
const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 600;

interface UserData {
  username?: string;
  fullName?: string;
  bio?: string;
  profileImage?: string;
  college?: string;
  posts?: any[];
  followersCount?: number;
  followingCount?: number;
}


export default function ProfileScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'posts'>('posts');
  const [user, setUser] = useState<UserData | null>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCachedProfile();
    fetchProfile();
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
        setUser(res.data);
        // Update cache with fresh data
        await AsyncStorage.setItem('userInfo', JSON.stringify(res.data));
        
        // Fetch posts after getting user ID
        const postsRes = await authAPI.getUserPosts(res.data._id);
        setUserPosts(postsRes.data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
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

  return (
    <View style={styles.container}>
      <View style={styles.centerWrapper}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Header Background */}
          <LinearGradient colors={['#A855F7', '#7C3AED']} style={styles.headerBg}>
            <View style={styles.headerActions}>
              {USE_LOCAL_API && (
                <View style={styles.localBadge}>
                  <Text style={styles.localBadgeText}>🔧 LOCAL</Text>
                </View>
              )}
              <TouchableOpacity style={styles.actionButton} onPress={handleLogout}><LogOut size={18} color="white" /></TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}><Settings size={18} color="white" /></TouchableOpacity>
            </View>
          </LinearGradient>

          <View style={styles.profileSection}>
            {/* Avatar & Edit */}
            <View style={styles.avatarRow}>
              <View style={styles.avatarBorder}>
                <Image source={getAvatarSource(user?.profileImage)} style={styles.avatar} />
              </View>
              <TouchableOpacity style={styles.editButton} onPress={() => router.push('/profile-setup')}>
                <Edit3 size={14} color="black" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Info */}
            <View style={styles.nameSection}>
              <Text style={styles.name}>{user?.fullName || 'Campus User'}</Text>
              <Text style={styles.username}>@{user?.username || 'username'}</Text>
              <Text style={styles.bio}>{user?.bio || 'No bio yet.'}</Text>
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}><GraduationCap size={14} color="#8B5CF6" /><Text style={styles.detailText}>{user?.college || 'ADYPU'}</Text></View>
                <View style={styles.detailItem}><MapPin size={14} color="#8B5CF6" /><Text style={styles.detailText}>Pune, India</Text></View>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}><Text style={styles.statNumber}>{userPosts.length}</Text><Text style={styles.statLabel}>Posts</Text></View>
              <View style={[styles.statItem, styles.statBorder]}><Text style={styles.statNumber}>{user?.followersCount || 0}</Text><Text style={styles.statLabel}>Followers</Text></View>
              <View style={styles.statItem}><Text style={styles.statNumber}>{user?.followingCount || 0}</Text><Text style={styles.statLabel}>Following</Text></View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsRow}>
              <TouchableOpacity onPress={() => setActiveTab('posts')} style={[styles.tabButton, styles.tabActive]}>
                <Grid size={20} color="black" />
              </TouchableOpacity>
            </View>

            {/* Grid */}
            <View style={styles.postsGrid}>
              {userPosts.length === 0 ? (
                <View style={{ width: '100%', padding: 20, alignItems: 'center' }}>
                   <Text style={{ color: '#9CA3AF' }}>No posts yet</Text>
                </View>
              ) : (
                userPosts.map((post, index) => (
                  <Animated.View key={post._id} entering={FadeIn.delay(index * 100)} style={styles.postItem}>
                    <TouchableOpacity>
                      <Image source={{ uri: getPostImageUrl(post.image) }} style={styles.postImage} />
                      {/* <View style={styles.postLikes}><Heart size={12} color="white" fill="white" /><Text style={styles.postLikesText}>{post.likes.length}</Text></View> */}
                    </TouchableOpacity>
                  </Animated.View>
                ))
              )}
            </View>
          </View>
          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  centerWrapper: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', flex: 1, borderRightWidth: isWeb ? 1 : 0, borderLeftWidth: isWeb ? 1 : 0, borderColor: '#F3F4F6' },
  headerBg: { height: 120 },
  headerActions: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, paddingTop: 10, gap: 12 },
  actionButton: { width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  
  profileSection: { paddingHorizontal: 20, marginTop: -50 },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  avatarBorder: { borderWidth: 4, borderColor: 'white', borderRadius: 60, backgroundColor: 'white' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  editButton: { backgroundColor: LIME, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  editButtonText: { color: 'black', fontWeight: 'bold', fontSize: 13 },
  
  nameSection: { marginTop: 12 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  username: { color: '#6B7280', fontSize: 14 },
  bio: { color: '#374151', marginTop: 12, lineHeight: 20, fontSize: 14 },
  detailsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { color: '#6B7280', fontSize: 13 },
  linkText: { color: '#8B5CF6', fontSize: 13 },
  
  statsRow: { flexDirection: 'row', marginTop: 24, paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  statItem: { flex: 1, alignItems: 'center' },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#F3F4F6' },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  statLabel: { color: '#6B7280', fontSize: 12 },
  
  tabsRow: { flexDirection: 'row', marginTop: 4 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: 'black' },
  
  postsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, marginHorizontal: -2 },
  postItem: { width: '33.33%', padding: 2 },
  postImage: { width: '100%', aspectRatio: 1, borderRadius: 4 },
  postLikes: { position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  postLikesText: { color: 'white', fontSize: 12, fontWeight: '600' },
  
  bottomPadding: { height: 40 },

  // Local environment indicator
  localBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 'auto' },
  localBadgeText: { color: '#92400E', fontSize: 11, fontWeight: 'bold' },
});
