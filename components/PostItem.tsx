import { View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MessageCircle, MoreHorizontal, MapPin, Send, Bookmark } from 'lucide-react-native';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming, interpolate, Extrapolation, Easing } from 'react-native-reanimated';
import { TapGestureHandler } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { authAPI } from '../services/api';
import { getAvatarSource, getPostImageUrl } from '../utils/imageUtils';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_WIDTH = Math.min(SCREEN_WIDTH - 24, 476); // Max width with 12px padding on each side

function PostItemComponent({ item, onComment, onOptions, currentUserId }: any) {
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
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Get images array (supports both new multi-image and legacy single image)
  // Priority: images array > allImages virtual > single image field
  const images: string[] = React.useMemo(() => {
    // Debug logging
    console.log('📸 PostItem data:', {
      postId: item._id,
      username: item.user?.username,
      hasImages: !!item.images,
      imagesLength: item.images?.length,
      hasAllImages: !!item.allImages,
      allImagesLength: item.allImages?.length,
      hasImage: !!item.image,
      image: item.image?.substring(0, 50),
    });

    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      return item.images;
    }
    if (item.allImages && Array.isArray(item.allImages) && item.allImages.length > 0) {
      return item.allImages;
    }
    if (item.image) {
      return [item.image];
    }
    return [];
  }, [item.images, item.allImages, item.image]);

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

  const handleBookmark = () => {
    const newStatus = !isBookmarked;
    setIsBookmarked(newStatus);
    authAPI.toggleBookmark(item._id).catch(() => {
      setIsBookmarked(!newStatus);
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

      {/* Main Image(s) - Carousel */}
      <TapGestureHandler
        waitFor={doubleTapRef}
        onActivated={onDoubleTap}
        numberOfTaps={2}
      >
        <View style={styles.imageContainer}>
          {images.length > 1 ? (
            /* Multi-image carousel */
            <>
              <FlatList
                data={images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / IMAGE_WIDTH);
                  setActiveImageIndex(index);
                }}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item: imageUrl }) => (
                  <Image
                    source={{ uri: getPostImageUrl(imageUrl) }}
                    style={[styles.postImage, { width: IMAGE_WIDTH }]}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                )}
              />
              {/* Pagination dots */}
              <View style={styles.paginationContainer}>
                {images.map((_: any, index: number) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === activeImageIndex && styles.paginationDotActive
                    ]}
                  />
                ))}
              </View>
              {/* Image counter badge */}
              <View style={styles.imageCountBadge}>
                <Text style={styles.imageCountText}>{activeImageIndex + 1}/{images.length}</Text>
              </View>
            </>
          ) : images.length === 1 ? (
            /* Single image */
            <Image
              source={{ uri: getPostImageUrl(images[0]) }}
              style={styles.postImage}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          ) : (
            /* No images - show placeholder */
            <View style={[styles.postImage, { backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: '#9CA3AF' }}>No image available</Text>
            </View>
          )}

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
        <TouchableOpacity onPress={handleBookmark}>
          <Bookmark size={24} color={isBookmarked ? '#8B5CF6' : '#111827'} fill={isBookmarked ? '#8B5CF6' : 'transparent'} />
        </TouchableOpacity>
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
  },
  // Carousel pagination
  paginationContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  paginationDotActive: {
    backgroundColor: '#fff',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  imageCountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

// Memoize to prevent re-renders during scroll
const PostItem = React.memo(PostItemComponent);
export default PostItem;
