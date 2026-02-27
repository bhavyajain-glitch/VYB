import { View, Text, Modal, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Alert, Platform } from 'react-native';
import { Flag, Ban, X, Trash, Download } from 'lucide-react-native';
import { authAPI } from '../services/api';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

interface PostOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  post: any;
  onBlockUser: (userId: string) => void;
  currentUserId?: string | null;
  onDeletePost?: (postId: string) => void;
}

export default function PostOptionsModal({ visible, onClose, post, onBlockUser, currentUserId, onDeletePost }: PostOptionsModalProps) {
  if (!post) return null;

  const isOwner = currentUserId && post.user?._id === currentUserId;

  const handleReport = () => {
    // In a real app, this would open a report form or call an API
    if (Platform.OS === 'web') {
      window.alert('Report submitted. We will review this post.');
    } else {
      Alert.alert('Reported', 'We will review this post shortly.');
    }
    onClose();
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to delete this post?')) {
        onDeletePost?.(post._id);
        onClose();
      }
    } else {
      Alert.alert(
        'Delete Post',
        'Are you sure you want to delete this post?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete', style: 'destructive', onPress: () => {
              onDeletePost?.(post._id);
              onClose();
            }
          }
        ]
      );
    }
  };

  const handleBlock = async () => {
    const confirmBlock = () => {
      authAPI.blockUser(post.user._id)
        .then(() => {
          onBlockUser(post.user._id);
          onClose();
        })
        .catch((err) => {
          console.error(err);
          if (Platform.OS !== 'web') Alert.alert('Error', 'Failed to block user');
        });
    };

    if (Platform.OS === 'web') {
      if (confirm(`Are you sure you want to block ${post.user.username}? Their posts will no longer be visible to you.`)) {
        confirmBlock();
      }
    } else {
      Alert.alert(
        'Block User',
        `Are you sure you want to block ${post.user.username}? Their posts will no longer be visible to you.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Block', style: 'destructive', onPress: confirmBlock }
        ]
      );
    }
  };

  const handleDownload = async () => {
    try {
      const mediaUrls: string[] = [];

      // 1. Check allMedia (Unified Virtual)
      if (Array.isArray(post.allMedia)) {
        post.allMedia.forEach((m: any) => {
          const url = typeof m === 'string' ? m : m.url;
          if (url && !mediaUrls.includes(url)) mediaUrls.push(url);
        });
      }

      // 2. Check media (Unified Array)
      if (Array.isArray(post.media)) {
        post.media.forEach((m: any) => {
          const url = m.url;
          if (url && !mediaUrls.includes(url)) mediaUrls.push(url);
        });
      }

      // 3. Fallback to legacy fields if still empty or to catch missing ones
      if (post.image && !mediaUrls.includes(post.image)) mediaUrls.push(post.image);

      if (Array.isArray(post.images)) {
        post.images.forEach((u: string) => {
          if (u && !mediaUrls.includes(u)) mediaUrls.push(u);
        });
      }

      if (Array.isArray(post.videos)) {
        post.videos.forEach((v: any) => {
          const url = v.url || v;
          if (typeof url === 'string' && url && !mediaUrls.includes(url)) {
            mediaUrls.push(url);
          }
        });
      }

      console.log('🔗 Collected Media URLs:', mediaUrls);

      if (mediaUrls.length === 0) {
        throw new Error('No media found to download');
      }

      // Optional: Inform user how many items were found (for debugging)
      if (__DEV__ || Platform.OS === 'web') {
        console.log(`[Download] Found ${mediaUrls.length} media items.`);
      }

      if (mediaUrls.length > 1 && Platform.OS !== 'web') {
        // Show a quick hint on mobile for multi-download
        Alert.alert('Downloading', `Starting download for ${mediaUrls.length} items...`);
      }

      if (Platform.OS === 'web') {
        // Web: Multiple downloads are often blocked as popups.
        // We'll use a hidden iframe approach which is more robust for "attachment" downloads.
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        for (let i = 0; i < mediaUrls.length; i++) {
          const url = mediaUrls[i];
          let downloadUrl = url;
          if (url.includes('cloudinary.com') && url.includes('/upload/')) {
            downloadUrl = url.replace('/upload/', '/upload/fl_attachment/');
          }

          console.log(`[Web] Triggering download ${i + 1}/${mediaUrls.length}: ${downloadUrl}`);

          // Triggering download via iframe src change
          iframe.src = downloadUrl;

          // Delay to ensure browser registers each individual trigger
          if (i < mediaUrls.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        // Keep iframe for a bit then remove
        setTimeout(() => document.body.removeChild(iframe), 2000);

        if (mediaUrls.length > 1) {
          window.alert(`Started ${mediaUrls.length} downloads. If only one downloaded, please check your browser's "Multiple Downloads" permission at the top right of the URL bar.`);
        }
        onClose();
      } else {
        // Mobile: Request permissions
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'We need permission to save media to your gallery.');
          return;
        }

        let successCount = 0;
        const downloadedUris: string[] = [];

        console.log(`[Mobile] Step 1: Downloading ${mediaUrls.length} files to temp storage...`);

        // Phase 1: Download all to temp storage
        for (let i = 0; i < mediaUrls.length; i++) {
          const url = mediaUrls[i];
          try {
            const extension = url.split('.').pop()?.split('?')[0] || 'jpg';
            const filename = `vyb_temp_${Date.now()}_${i}.${extension}`;
            const fileUri = `${FileSystem.documentDirectory}${filename}`;

            const download = await FileSystem.downloadAsync(url, fileUri);
            if (download.status === 200) {
              downloadedUris.push(download.uri);
              console.log(`[Mobile] File ${i + 1} downloaded: ${download.uri}`);
            }
          } catch (err) {
            console.error(`[Mobile] Download failed for ${url}:`, err);
          }
        }

        if (downloadedUris.length === 0) {
          Alert.alert('Failed', 'Could not download any media items.');
          onClose();
          return;
        }

        console.log(`[Mobile] Step 2: Saving ${downloadedUris.length} assets to gallery...`);

        // Phase 2: Create assets
        const assetIds: string[] = [];
        for (const uri of downloadedUris) {
          try {
            const asset = await MediaLibrary.createAssetAsync(uri);
            assetIds.push(asset.id);
            successCount++;
          } catch (err) {
            console.error(`[Mobile] Asset creation failed for ${uri}:`, err);
          }
        }

        if (assetIds.length > 0) {
          try {
            console.log(`[Mobile] Step 3: Grouping ${assetIds.length} assets into 'vyb' album...`);
            let album = await MediaLibrary.getAlbumAsync('vyb');

            if (album === null) {
              await MediaLibrary.createAlbumAsync('vyb', assetIds[0], false);
              const remainingIds = assetIds.slice(1);
              if (remainingIds.length > 0) {
                await new Promise(res => setTimeout(res, 1200)); // Delay for OS refresh
                album = await MediaLibrary.getAlbumAsync('vyb');
                if (album) await MediaLibrary.addAssetsToAlbumAsync(remainingIds, album, false);
              }
            } else {
              await MediaLibrary.addAssetsToAlbumAsync(assetIds, album, false);
            }
            Alert.alert('Success', `Saved ${successCount} item(s) to your 'vyb' gallery album.`);
          } catch (albumErr) {
            console.error('[Mobile] Album management failed:', albumErr);
            Alert.alert('Saved', `Successfully saved ${successCount} items to your gallery.`);
          }
        } else {
          Alert.alert('Failed', 'Could not save assets to gallery.');
        }
        onClose();
      }
    } catch (error: any) {
      console.error('Download error:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to download media: ' + error.message);
      } else {
        Alert.alert('Download Failed', error.message || 'An error occurred while downloading.');
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.dragIndicator} />

              <Text style={styles.headerTitle}>Options</Text>

              {isOwner ? (
                <TouchableOpacity style={styles.optionItem} onPress={handleDelete}>
                  <Trash size={20} color="#EF4444" />
                  <Text style={[styles.optionText, { color: '#EF4444' }]}>Delete Post</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity style={styles.optionItem} onPress={handleDownload}>
                    <Download size={20} color="#111827" />
                    <Text style={styles.optionText}>Download Media</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.optionItem} onPress={handleReport}>
                    <Flag size={20} color="#EF4444" />
                    <Text style={[styles.optionText, { color: '#EF4444' }]}>Report Post</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.optionItem} onPress={handleBlock}>
                    <Ban size={20} color="#111827" />
                    <Text style={styles.optionText}>Block {post.user?.username || 'User'}</Text>
                  </TouchableOpacity>
                </>
              )}

              <View style={styles.divider} />

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#111827',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
});
