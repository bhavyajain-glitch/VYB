import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Heart, MessageCircle, MoreHorizontal, MapPin, Send } from 'lucide-react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming, interpolate, Extrapolation, Easing } from 'react-native-reanimated';
import { TapGestureHandler } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { authAPI } from '../services/api';
import { getAvatarSource, getPostImageUrl } from '../utils/imageUtils';
import { LinearGradient } from 'expo-linear-gradient';


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
    <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.postCard}>
      {/* Header Info */}
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => router.push(`/user/${item.user?._id}`)}
          activeOpacity={0.7}
        >
          <Image source={getAvatarSource(item.user?.profileImage)} style={styles.userAvatar} />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.user?.username || 'User'}</Text>
            <View style={styles.locationContainer}>
              <MapPin size={10} color="#6B7280" />
              <Text style={styles.locationText}>{item.user?.college || 'Campus'}</Text>
            </View>
          </View>
          {item.user?.isVerified && <View style={styles.verifiedBadge}><Text style={styles.verifiedCheck}>✓</Text></View>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.moreBtn} onPress={() => onOptions(item)}>
          <MoreHorizontal size={20} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Main Image */}
      <TapGestureHandler
        waitFor={doubleTapRef}
        onActivated={onDoubleTap}
        numberOfTaps={2}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: getPostImageUrl(item.image) }} style={styles.postImage} resizeMode="cover" />

          {/* Heart Animation Overlay */}
          <Animated.View style={[styles.heartOverlay, rStyle]}>
            <Heart size={90} color="#FF3040" fill="#FF3040" />
          </Animated.View>
        </View>
      </TapGestureHandler>

      {/* Actions Row */}
      <View style={styles.actionsRow}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
            <Heart size={24} color={isLiked ? '#FF3040' : '#111827'} fill={isLiked ? '#FF3040' : 'transparent'} />
            <Text style={styles.actionCount}>{likesCount || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onComment(item._id)} style={styles.actionBtn}>
            <MessageCircle size={24} color="#111827" />
            <Text style={styles.actionCount}>{item.comments?.length || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Caption Section */}
      {item.caption ? (
        <View style={styles.captionSection}>
          <Text style={styles.captionText}>
            <Text style={styles.captionUserName}>{item.user?.username || 'user'} </Text>
            {item.caption}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  postCard: {
    marginBottom: 32,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  userDetails: {
    flex: 1
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827'
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1
  },
  locationText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500'
  },
  verifiedBadge: {
    backgroundColor: '#3B82F6',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center'
  },
  verifiedCheck: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold'
  },
  moreBtn: {
    padding: 4
  },
  imageContainer: {
    width: '100%',
    height: 400,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB'
  },
  postImage: {
    width: '100%',
    height: '100%'
  },
  heartOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -45,
    marginTop: -45,
    zIndex: 40
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingHorizontal: 4
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  actionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },
  captionSection: {
    marginTop: 12,
    paddingHorizontal: 4,
    paddingBottom: 4
  },
  captionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20
  },
  captionUserName: {
    fontWeight: '700',
    color: '#111827'
  }
});
