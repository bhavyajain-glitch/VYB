import { View, Text, Image, TouchableOpacity, ScrollView, TextInput, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, Send, Heart, MessageCircle } from 'lucide-react-native';
import { authAPI } from '../services/api';

const LIME = '#D4FF00';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id) fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      // We can fetch singular post if endpoint exists, or rely on passed params?
      // Since I didn't verify getPostById endpoint, I'll assume I need to create it or I can just filter from feed if I passed data.
      // But best is to fetch fresh. I added getPost to api.ts but need to add backend logic for it!
      // Wait, I missed adding getPostById in backend controller. 
      // I'll resort to just using the comments array from the Post object if I can fetch it.
      // Actually, let's assume I can't fetch single post comfortably yet without adding it. 
      // I'll add `getPostById` to backend in next step for robustness. 
      // For now, I'll simulate it by fetching all (inefficient) or better, I'll implementing `getPostById`.
      
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
      // Backend returns the new comment object populated
      setComments(prev => [...prev, res.data]);
      setNewComment('');
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <View style={styles.centered}><ActivityIndicator color={LIME} size="large" /></View>;
  if (!post) return <View style={styles.centered}><Text>Post not found</Text></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ArrowLeft size={24} color="black" /></TouchableOpacity>
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
            <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
            <View style={styles.actions}>
                <Heart size={24} color="black" />
                <MessageCircle size={24} color="black" />
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
  postImage: { width: '100%', height: 300, borderRadius: 12, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 16, marginBottom: 12 },
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
