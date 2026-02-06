import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Modal, StatusBar, Platform } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { authAPI } from '../app/services/api';
import { getAvatarUrl } from '../utils/imageUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story

interface Story {
  _id: string;
  image: string;
  createdAt: string;
  viewersCount: number;
  hasViewed: boolean;
}

interface StoryGroup {
  user: {
    _id: string;
    username: string;
    fullName: string;
    profileImage: string;
  };
  stories: Story[];
  isOwnStory: boolean;
}

interface StoryViewerProps {
  visible: boolean;
  storyGroups: StoryGroup[];
  initialGroupIndex: number;
  onClose: (action?: 'close' | 'delete', payload?: string) => void;
}

export default function StoryViewer({ visible, storyGroups, initialGroupIndex, onClose }: StoryViewerProps) {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const progress = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentGroup = storyGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];

  useEffect(() => {
    if (visible) {
      setCurrentGroupIndex(initialGroupIndex);
      setCurrentStoryIndex(0);
    }
  }, [visible, initialGroupIndex]);

  useEffect(() => {
    if (!visible || !currentStory) return;

    // Mark as viewed
    if (!currentStory.hasViewed && !currentGroup.isOwnStory) {
      authAPI.viewStory(currentStory._id).catch(console.error);
    }

    // Start progress animation
    progress.value = 0;
    progress.value = withTiming(1, { duration: STORY_DURATION });

    // Auto-advance timer
    timerRef.current = setTimeout(() => {
      goNext();
    }, STORY_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentGroupIndex, currentStoryIndex, visible]);

  const goNext = () => {
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      // Next story in same group
      setCurrentStoryIndex(prev => prev + 1);
    } else if (currentGroupIndex < storyGroups.length - 1) {
      // Next group
      setCurrentGroupIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      // End of all stories
      onClose();
    }
  };

  const goPrev = () => {
    if (currentStoryIndex > 0) {
      // Previous story in same group
      setCurrentStoryIndex(prev => prev - 1);
    } else if (currentGroupIndex > 0) {
      // Previous group (last story)
      const prevGroup = storyGroups[currentGroupIndex - 1];
      setCurrentGroupIndex(prev => prev - 1);
      setCurrentStoryIndex(prevGroup.stories.length - 1);
    }
  };

  const handleTap = (side: 'left' | 'right') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (side === 'left') {
      goPrev();
    } else {
      goNext();
    }
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`
  }));

  if (!visible || !currentGroup || !currentStory) return null;

  const timeAgo = getTimeAgo(currentStory.createdAt);

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        {/* Story Image */}
        <Image source={{ uri: currentStory.image }} style={styles.storyImage} resizeMode="cover" />

        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Progress Bars */}
          <View style={styles.progressContainer}>
            {currentGroup.stories.map((_, index) => (
              <View key={index} style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    index < currentStoryIndex ? { width: '100%' } : 
                    index === currentStoryIndex ? progressStyle : 
                    { width: '0%' }
                  ]} 
                />
              </View>
            ))}
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Image source={{ uri: getAvatarUrl(currentGroup.user.profileImage) }} style={styles.avatar} />
              <View>
                <Text style={styles.username}>{currentGroup.user.username}</Text>
                <Text style={styles.timestamp}>{timeAgo}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                {currentGroup.isOwnStory && (
                    <TouchableOpacity onPress={() => onClose && onClose('delete', currentStory._id)}>
                        <Trash2 size={24} color="white" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => onClose && onClose('close')} style={styles.closeButton}>
                    <X size={28} color="white" />
                </TouchableOpacity>
            </View>
          </View>

          {/* Tap Zones */}
          <View style={styles.tapZones}>
            <TouchableOpacity style={styles.tapZoneLeft} onPress={() => handleTap('left')} activeOpacity={1} />
            <TouchableOpacity style={styles.tapZoneRight} onPress={() => handleTap('right')} activeOpacity={1} />
          </View>

          {/* Navigation Arrows (Desktop) */}
          {Platform.OS === 'web' && (
            <>
              {currentGroupIndex > 0 || currentStoryIndex > 0 ? (
                <TouchableOpacity style={styles.navArrowLeft} onPress={() => handleTap('left')}>
                  <ChevronLeft size={32} color="white" />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.navArrowRight} onPress={() => handleTap('right')}>
                <ChevronRight size={32} color="white" />
              </TouchableOpacity>
            </>
          )}

          {/* Viewers Count (for own stories) */}
          {currentGroup.isOwnStory && (
            <View style={styles.viewersInfo}>
              <Text style={styles.viewersText}>{currentStory.viewersCount} viewers</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const getTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  return '1d ago';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  storyImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    gap: 4,
  },
  progressBar: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  username: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  timestamp: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  closeButton: {
    padding: 8,
  },
  tapZones: {
    flex: 1,
    flexDirection: 'row',
  },
  tapZoneLeft: {
    flex: 1,
  },
  tapZoneRight: {
    flex: 2,
  },
  navArrowLeft: {
    position: 'absolute',
    left: 16,
    top: '50%',
    marginTop: -16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  navArrowRight: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  viewersInfo: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  viewersText: {
    color: 'white',
    fontSize: 14,
  },
});
