import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Heart, MessageCircle, MoreHorizontal } from 'lucide-react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming, interpolate, Extrapolation, Easing } from 'react-native-reanimated';
import { TapGestureHandler } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { authAPI } from '../app/services/api';
import { getAvatarSource, getPostImageUrl } from '../utils/imageUtils';

export default function PostItem({ item, onComment, onOptions, currentUserId }: any) {
  const router = useRouter();
  
  // Helper function to check if user liked the post (handles ObjectId vs string comparison)
  const checkIfLiked = (likes: any[], userId: string | null): boolean => {
    if (!likes || !userId) return false;
    return likes.some(id => id?.toString() === userId?.toString());
  };
  
  const [isLiked, setIsLiked] = useState<boolean>(checkIfLiked(item.likes, currentUserId));
  const [likesCount, setLikesCount] = useState(item.likes?.length || 0);
  const likeAnimation = useSharedValue(0);
  const doubleTapRef = useRef(null);

  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (currentUserId) {
      setIsLiked(checkIfLiked(item.likes, currentUserId));
      setLikesCount(item.likes?.length || 0);
    }
    if (item.user?.followers && currentUserId) {
      setIsFollowing(checkIfLiked(item.user.followers, currentUserId));
    }
  }, [item.likes, item.user, currentUserId]);

  const handleFollow = () => {
    setIsFollowing(true);
    authAPI.followUser(item.user._id).catch(() => setIsFollowing(false));
  };

  const handleLike = () => {
    const newStatus = !isLiked;
    setIsLiked(newStatus);
    setLikesCount((prev: number) => newStatus ? prev + 1 : prev - 1);
    // API Call
    authAPI.toggleLike(item._id).catch(err => {
        setIsLiked(!newStatus);
        setLikesCount((prev: number) => !newStatus ? prev + 1 : prev - 1);
    });
  };

  const onDoubleTap = useCallback(() => {
    likeAnimation.value = 0; // Reset
    likeAnimation.value = withTiming(1, { duration: 1250, easing: Easing.linear });

    // Toggle like on double tap - like if not liked, unlike if already liked
    handleLike();
  }, [isLiked, likeAnimation]);

  const rStyle = useAnimatedStyle(() => {
    const scale = interpolate(
        likeAnimation.value,
        [0, 0.25, 0.6, 1],
        [0.3, 1.2, 1, 1],
        Extrapolation.CLAMP
    );

    const opacity = interpolate(
        likeAnimation.value,
        [0, 0.25, 0.6, 1],
        [0, 1, 1, 0],
        Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity
    };
  });

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.post}>
      {/* Header */}
      <View style={styles.postHeader}>
        <View style={styles.authorContainer}>
          <TouchableOpacity onPress={() => router.push(`/user/${item.user?._id}`)}>
             <Image source={getAvatarSource(item.user?.profileImage)} style={styles.authorAvatar} />
          </TouchableOpacity>
          <View>
            <View style={styles.authorNameRow}>
              <TouchableOpacity onPress={() => router.push(`/user/${item.user?._id}`)}>
                <Text style={styles.authorUsername}>{item.user?.username || 'User'}</Text>
              </TouchableOpacity>
              {item.user?.isVerified && <View style={styles.verifiedBadge}><Text style={styles.verifiedCheck}>✓</Text></View>}
              
              {!isFollowing && currentUserId && item.user?._id !== currentUserId && (
                <TouchableOpacity onPress={handleFollow}>
                    <Text style={{ color: '#0095F6', fontSize: 14, fontWeight: 'bold', marginLeft: 8 }}>• Follow</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.location}>{item.user?.college || 'CampusConnect'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton} onPress={() => onOptions(item)}>
            <MoreHorizontal size={20} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Image with Double Tap */}
      <TapGestureHandler
        waitFor={doubleTapRef}
        onActivated={onDoubleTap}
        numberOfTaps={2}
      >
        <Animated.View style={styles.imageWrapper}>
           <Image source={{ uri: getPostImageUrl(item.image) }} style={styles.postImage} resizeMode="cover" />
           <Animated.View style={[styles.heartOverlay, rStyle]}>
              <Heart size={90} color="#FF3040" fill="#FF3040" />
           </Animated.View>
        </Animated.View>
      </TapGestureHandler>

      {/* Actions */}
      <View style={styles.postActions}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
            <Heart size={26} color={isLiked ? '#FF3040' : 'black'} fill={isLiked ? '#FF3040' : 'transparent'} />
            <Text style={styles.actionCount}>{likesCount > 0 ? likesCount : ''}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onComment(item._id)} style={styles.actionButton}>
            <MessageCircle size={26} color="black" />
            <Text style={styles.actionCount}>{item.comments?.length > 0 ? item.comments.length : ''}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Caption (Likes text removed to prefer inline count) */}
      <View style={styles.postFooter}>
        <Text style={styles.caption}>
          <Text style={styles.captionUsername}>{item.user?.username} </Text>
          {item.caption}
        </Text>
        
        <TouchableOpacity onPress={() => onComment(item._id)} activeOpacity={0.7} style={{ paddingVertical: 4 }}>
             <Text style={styles.addComment}>Add a comment...</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  post: { marginBottom: 20, width: '100%', maxWidth: 470, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 20 },
  postHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  authorContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  authorAvatar: { width: 32, height: 32, borderRadius: 16 },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  authorUsername: { fontWeight: 'bold', fontSize: 14, color: '#111827' },
  verifiedBadge: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  verifiedCheck: { color: 'white', fontSize: 8, fontWeight: 'bold' },
  location: { fontSize: 12, color: '#111827' },
  moreButton: { padding: 4 },

  imageWrapper: { borderRadius: 0, overflow: 'hidden', borderWidth: 0, borderColor: '#F3F4F6', position: 'relative' },
  postImage: { width: '100%', aspectRatio: 1 },
  heartOverlay: { position: 'absolute', top: '50%', left: '50%', marginLeft: -40, marginTop: -40, zIndex: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65 },
  
  postActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  actionsLeft: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionCount: { fontSize: 15, fontWeight: '600', color: '#111827' },
  
  postFooter: { paddingHorizontal: 16 },
  likesText: { fontWeight: 'bold', marginBottom: 8 },
  caption: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  captionUsername: { fontWeight: 'bold' },
  addComment: { color: '#9CA3AF', fontSize: 14 },
});
