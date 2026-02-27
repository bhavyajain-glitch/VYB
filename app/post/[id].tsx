import { View, Text, Image, TouchableOpacity, ScrollView, TextInput, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, Send, Heart, MessageCircle, Download, Share2, Play } from 'lucide-react-native';
import { authAPI } from '../../services/api';
import VideoPlayer from '../../components/VideoPlayer';
import { downloadMedia, shareMedia, getFilenameFromUrl } from '../../utils/downloadMedia';

const LIME = '#D4FF00';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  useEffect(() => {
    if (id) fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const res = await authAPI.getPost(id as string);
      setPost(res.data);
      setComments(res.data.comments || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newComment.trim()) return;
    setSending(true);
    try {
      const res = await authAPI.addComment(id as string, newComment);
      setComments(prev => [...prev, res.data]);
      setNewComment('');
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const handleDownload = async () => {
    if (!post) return;
    setDownloading(true);

    try {
      const allMedia = getPostMedia();
      const currentMedia = allMedia[activeMediaIndex];

      if (!currentMedia) {
        Alert.alert('Error', 'No media to download');
        return;
      }

      const filename = getFilenameFromUrl(currentMedia.url) || `vyb_${Date.now()}`;
      const success = await downloadMedia(
        currentMedia.url,
        filename,
        currentMedia.type
      );

      if (!success) {
        console.log('Download may have failed or user cancelled');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Download Failed', 'Unable to download the file.');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!post) return;
    const allMedia = getPostMedia();
    const currentMedia = allMedia[activeMediaIndex];

    if (currentMedia) {
      await shareMedia(currentMedia.url, 'Check out this post on Vyb!');
    }
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  // Get all media from post (images + videos)
  const getPostMedia = (): Array<{ type: 'image' | 'video'; url: string; thumbnail?: string }> => {
    if (!post) return [];

    const media: Array<{ type: 'image' | 'video'; url: string; thumbnail?: string }> = [];

    // Add images
    const images = post.images || (post.image ? [post.image] : []);
    images.forEach((url: string) => {
      media.push({ type: 'image', url });
    });

    // Add videos
    if (post.videos && post.videos.length > 0) {
      post.videos.forEach((video: any) => {
        media.push({
          type: 'video',
          url: video.url,
          thumbnail: video.thumbnail
        });
      });
    }

    return media;
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator color={LIME} size="large" /></View>;
  if (!post) return <View style={styles.centered}><Text>Post not found</Text></View>;

  const allMedia = getPostMedia();
  const currentMedia = allMedia[activeMediaIndex] || allMedia[0];
  const isVideoPost = currentMedia?.type === 'video';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}><ArrowLeft size={24} color="black" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Post Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Post Content */}
        <View style={styles.postCard}>
          <View style={styles.userRow}>
            <Image source={{ uri: post.user?.profileImage || 'https://i.pravatar.cc/150' }} style={styles.avatar} />
            <Text style={styles.username}>{post.user?.username}</Text>
          </View>

          {/* Media Display */}
          {currentMedia && (
            <View style={styles.mediaContainer}>
              {isVideoPost ? (
                <VideoPlayer
                  uri={currentMedia.url}
                  thumbnail={currentMedia.thumbnail}
                  showControls={true}
                  autoPlay={false}
                  style={styles.video}
                />
              ) : (
                <Image
                  source={{ uri: currentMedia.url }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              )}

              {/* Media indicators */}
              {allMedia.length > 1 && (
                <View style={styles.mediaIndicators}>
                  {allMedia.map((_, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setActiveMediaIndex(index)}
                      style={[
                        styles.mediaIndicator,
                        index === activeMediaIndex && styles.mediaIndicatorActive
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={async () => {
              try {
                const res = await authAPI.toggleLike(id as string);
                setPost((prev: any) => ({ ...prev, likes: res.data }));
              } catch (error) {
                console.error('Like error:', error);
              }
            }}>
              <Heart size={24} color={post.likes?.includes(post.user?._id) ? '#EF4444' : 'black'} fill={post.likes?.includes(post.user?._id) ? '#EF4444' : 'transparent'} />
            </TouchableOpacity>
            <TouchableOpacity>
              <MessageCircle size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare}>
              <Share2 size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDownload} disabled={downloading} style={styles.downloadButton}>
              {downloading ? (
                <ActivityIndicator size="small" color="black" />
              ) : (
                <Download size={24} color="black" />
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.likes}>{post.likes?.length || 0} likes</Text>
          <Text style={styles.caption}><Text style={styles.bold}>{post.user?.username}</Text> {post.caption}</Text>
          <Text style={styles.date}>{new Date(post.createdAt).toLocaleDateString()}</Text>
        </View>

        {/* Comments Section */}
        <Text style={styles.commentsHeader}>Comments ({comments.length})</Text>
        <View style={styles.commentsList}>
          {comments.map((c, i) => (
            <View key={i} style={styles.commentItem}>
              <Text style={styles.commentText}>
                <Text style={styles.bold}>{c.user?.username || 'User'} </Text>
                {c.text}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Add a comment..."
          style={styles.input}
        />
        <TouchableOpacity onPress={handleSend} disabled={sending}>
          {sending ? <ActivityIndicator size="small" color={LIME} /> : <Send size={24} color={LIME} />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },

  scrollContent: { paddingBottom: 80 },

  postCard: { padding: 16, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  username: { fontWeight: 'bold' },

  mediaContainer: { position: 'relative', marginBottom: 12 },
  postImage: { width: '100%', height: 300, borderRadius: 12 },
  video: { width: '100%', height: 300, borderRadius: 12 },

  mediaIndicators: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  mediaIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  mediaIndicatorActive: {
    backgroundColor: '#D4FF00',
  },

  actions: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  downloadButton: { marginLeft: 'auto' },
  likes: { fontWeight: 'bold', marginBottom: 6 },
  caption: { lineHeight: 20 },
  bold: { fontWeight: 'bold' },
  date: { color: '#9CA3AF', fontSize: 12, marginTop: 8 },

  commentsHeader: { fontSize: 16, fontWeight: 'bold', padding: 16, paddingBottom: 8 },
  commentsList: { paddingHorizontal: 16 },
  commentItem: { marginBottom: 12 },
  commentText: { lineHeight: 20 },

  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderColor: '#F3F4F6', backgroundColor: 'white' },
  input: { flex: 1, marginRight: 12, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#F9FAFB', borderRadius: 20 },
});
