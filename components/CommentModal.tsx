import { View, Text, Image, TouchableOpacity, ScrollView, TextInput, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { X, Send, Heart, MessageCircle } from 'lucide-react-native';
import { authAPI } from '../app/services/api';

const LIME = '#D4FF00';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CommentModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string | null;
}

export default function CommentModal({ visible, onClose, postId }: CommentModalProps) {
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (visible && postId) {
        fetchPost();
    } else {
        // Reset state on close
        setPost(null);
        setComments([]);
        setLoading(true);
    }
  }, [visible, postId]);

  const fetchPost = async () => {
    try {
      const res = await authAPI.getPost(postId as string);
      setPost(res.data);
      setComments(res.data.comments || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!newComment.trim() || !postId) return;
    setSending(true);
    try {
      const res = await authAPI.addComment(postId, newComment);
      setComments(prev => [...prev, res.data]);
      setNewComment('');
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
            <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
            
            <View style={styles.modalContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Comments</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} color="black" />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.centered}><ActivityIndicator color={LIME} size="large" /></View> 
                ) : (
                    <>
                        <ScrollView contentContainerStyle={styles.scrollContent}>
                             {/* Minimal Post Summary */}
                             {post && (
                                <View style={styles.postSummary}>
                                    <Image source={{ uri: post.image }} style={styles.tinyImage} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.summaryText} numberOfLines={2}>
                                            <Text style={styles.bold}>{post.user?.username}</Text> {post.caption}
                                        </Text>
                                    </View>
                                </View>
                             )}

                            {/* Comments List */}
                            <View style={styles.commentsList}>
                                {comments.length === 0 ? (
                                    <Text style={styles.emptyText}>No comments yet. Say something!</Text>
                                ) : (
                                    comments.map((c, i) => (
                                        <View key={i} style={styles.commentItem}>
                                            <Image source={{ uri: c.user?.profileImage || 'https://i.pravatar.cc/150' }} style={styles.commentAvatar} />
                                            <View style={styles.commentBubble}>
                                                <Text style={styles.commentUsername}>{c.user?.username || 'User'}</Text>
                                                <Text style={styles.commentText}>{c.text}</Text>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                        </ScrollView>

                        {/* Input */}
                        <View style={styles.inputContainer}>
                            <TextInput 
                                value={newComment}
                                onChangeText={setNewComment}
                                placeholder="Add a comment..."
                                style={styles.input}
                                placeholderTextColor="#9CA3AF"
                            />
                            <TouchableOpacity onPress={handleSend} disabled={sending || !newComment.trim()}>
                                {sending ? <ActivityIndicator size="small" color={LIME} /> : <Send size={24} color={newComment.trim() ? LIME : '#E5E7EB'} />}
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', width: '100%', maxWidth: 600, alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  closeButton: { position: 'absolute', right: 16, top: 16 },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16 },

  postSummary: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 16, marginBottom: 16, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  tinyImage: { width: 40, height: 40, borderRadius: 8 },
  summaryText: { fontSize: 12, color: '#4B5563' },
  bold: { fontWeight: 'bold', color: 'black' },

  commentsList: { gap: 16 },
  commentItem: { flexDirection: 'row', gap: 10 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  commentBubble: { flex: 1, backgroundColor: '#F9FAFB', padding: 10, borderRadius: 12, borderTopLeftRadius: 2 },
  commentUsername: { fontSize: 12, fontWeight: 'bold', marginBottom: 2, color: '#374151' },
  commentText: { fontSize: 14, color: '#111827' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 20 },

  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderColor: '#F3F4F6', backgroundColor: 'white' },
  input: { flex: 1, marginRight: 12, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#F9FAFB', borderRadius: 20, color: 'black' },
});
