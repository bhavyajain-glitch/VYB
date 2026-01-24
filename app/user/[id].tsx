import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authAPI } from '../services/api';

const LIME = '#D4FF00';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (id) fetchUser();
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
      if (router.canGoBack()) {
          router.back();
      } else {
          router.replace('/'); // Fallback to home/feed if deep linked
      }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator color={LIME} size="large" /></View>;
  if (!user) return <View style={styles.centered}><Text>User not found</Text></View>;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView>
        {/* Header (Same simplified style as Profile) */}
        <LinearGradient colors={['#A855F7', '#7C3AED']} style={styles.headerBg}>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
                <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
        </LinearGradient>

        <View style={styles.profileSection}>
            <View style={styles.avatarBorder}>
                <Image source={{ uri: user.profileImage || 'https://i.pravatar.cc/150' }} style={styles.avatar} />
            </View>

            <Text style={styles.name}>{user.fullName}</Text>
            <Text style={styles.username}>@{user.username}</Text>
            
            <View style={styles.actionRow}>
                <TouchableOpacity 
                    style={[styles.primaryButton, isFollowing && styles.followingButton]} 
                    onPress={handleFollow}
                >
                    <Text style={[styles.primaryButtonText, isFollowing && styles.followingText]}>
                        {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton}>
                    <MessageCircle size={20} color="black" />
                </TouchableOpacity>
            </View>

            <Text style={styles.bio}>{user.bio || 'No bio available.'}</Text>
            
            <View style={styles.infoGrid}>
                <InfoItem label="College" value={user.college} />
                <InfoItem label="Major" value={user.major} />
                <InfoItem label="Year" value={user.year} />
            </View>

            {user.interests && user.interests.length > 0 && (
                <View style={styles.interestsContainer}>
                     {user.interests.map((int: string) => (
                        <View key={int} style={styles.interestBadge}><Text style={styles.interestText}>{int}</Text></View>
                     ))}
                </View>
            )}

            {/* Profile Stats */}
            <View style={{ flexDirection: 'row', gap: 32, marginTop: 24, paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F3F4F6', width: '100%', justifyContent: 'center' }}>
                <View style={{ alignItems: 'center' }}><Text style={{ fontWeight: 'bold', fontSize: 18 }}>{posts.length}</Text><Text style={{ color: '#6B7280', fontSize: 12 }}>Posts</Text></View>
                <View style={{ alignItems: 'center' }}><Text style={{ fontWeight: 'bold', fontSize: 18 }}>{followersCount}</Text><Text style={{ color: '#6B7280', fontSize: 12 }}>Followers</Text></View>
                <View style={{ alignItems: 'center' }}><Text style={{ fontWeight: 'bold', fontSize: 18 }}>{user.following?.length || 0}</Text><Text style={{ color: '#6B7280', fontSize: 12 }}>Following</Text></View>
            </View>

            {/* Posts Grid */}
            <View style={styles.postsGrid}>
                {posts.map((post: any) => (
                    <View key={post._id} style={styles.postItem}>
                        <Image source={{ uri: post.image }} style={styles.postImage} />
                    </View>
                ))}
            </View>
        </View>
      </ScrollView>
    </View>
  );
}

const InfoItem = ({ label, value }: any) => value ? (
    <View style={styles.infoItem}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
) : null;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBg: { height: 120, padding: 20, paddingTop: 60 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  
  profileSection: { paddingHorizontal: 24, marginTop: -50, alignItems: 'center' },
  avatarBorder: { padding: 4, backgroundColor: 'white', borderRadius: 60 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  
  name: { fontSize: 24, fontWeight: 'bold', marginTop: 12 },
  username: { color: '#6B7280', fontSize: 16, marginBottom: 16 },
  
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  primaryButton: { backgroundColor: LIME, paddingHorizontal: 32, paddingVertical: 10, borderRadius: 12 },
  followingButton: { backgroundColor: '#E5E7EB' },
  primaryButtonText: { fontWeight: 'bold' },
  followingText: { color: 'black' },
  secondaryButton: { padding: 10, backgroundColor: '#F3F4F6', borderRadius: 12 },
  
  bio: { textAlign: 'center', color: '#374151', lineHeight: 22, marginBottom: 24 },
  
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24, justifyContent: 'center', marginBottom: 24 },
  infoItem: { alignItems: 'center' },
  infoLabel: { color: '#9CA3AF', fontSize: 12, marginBottom: 4 },
  infoValue: { fontWeight: 'bold', fontSize: 16 },

  interestsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  interestBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  interestText: { color: '#4B5563', fontSize: 12 },
  /* New styles for Post Grid */
  profileTabs: { flexDirection: 'row', marginTop: 24, borderTopWidth: 1, borderTopColor: '#F3F4F6', width: '100%', maxWidth: 500, alignSelf:'center' },
  profileTab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  activeProfileTab: { borderBottomWidth: 1, borderBottomColor: 'black', marginTop: -1 },
  
  postsGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', maxWidth: 500, alignSelf: 'center' },
  postItem: { width: '33.33%', aspectRatio: 1, padding: 1 },
  postImage: { width: '100%', height: '100%' },
});
