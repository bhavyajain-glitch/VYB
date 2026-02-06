import { View, Modal, TouchableOpacity, StyleSheet, FlatList, StatusBar, Dimensions } from 'react-native';
import { X } from 'lucide-react-native';
import PostItem from './PostItem';
import { useRef, useEffect } from 'react';

const { width } = Dimensions.get('window');

interface PostViewerModalProps {
  visible: boolean;
  posts: any[];
  initialIndex: number;
  onClose: () => void;
  onComment: (postId: string) => void;
  onOptions: (post: any) => void;
  currentUserId: string | null;
}

export default function PostViewerModal({ visible, posts, initialIndex, onClose, onComment, onOptions, currentUserId }: PostViewerModalProps) {
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible && posts.length > 0 && initialIndex >= 0) {
      // Small timeout to ensure layout is ready
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      }, 100);
    }
  }, [visible, initialIndex, posts]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        
        <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="black" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
        </View>

        <FlatList
            ref={flatListRef}
            data={posts}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
                <View style={styles.postContainer}>
                    <PostItem 
                        item={item} 
                        onComment={onComment} 
                        onOptions={onOptions} 
                        currentUserId={currentUserId} 
                    />
                </View>
            )}
            getItemLayout={(data, index) => (
                { length: 600, offset: 600 * index, index } // Approximate height, dynamic sizing might be issues but good enough for now
            )}
            initialScrollIndex={initialIndex}
            onScrollToIndexFailed={info => {
                const wait = new Promise(resolve => setTimeout(resolve, 500));
                wait.then(() => {
                    flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
                });
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeButton: {
    padding: 4,
  },
  listContent: {
      paddingBottom: 40,
  },
  postContainer: {
      marginBottom: 20,
  }
});
