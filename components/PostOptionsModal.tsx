import { View, Text, Modal, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, Alert, Platform } from 'react-native';
import { Flag, Ban, X } from 'lucide-react-native';
import { authAPI } from '../app/services/api';

interface PostOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  post: any;
  onBlockUser: (userId: string) => void;
}

export default function PostOptionsModal({ visible, onClose, post, onBlockUser }: PostOptionsModalProps) {
  if (!post) return null;

  const handleReport = () => {
    // In a real app, this would open a report form or call an API
    if (Platform.OS === 'web') {
        window.alert('Report submitted. We will review this post.');
    } else {
        Alert.alert('Reported', 'We will review this post shortly.');
    }
    onClose();
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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
            <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                    <View style={styles.dragIndicator} />
                    
                    <Text style={styles.headerTitle}>Options</Text>

                    <TouchableOpacity style={styles.optionItem} onPress={handleReport}>
                        <Flag size={20} color="#EF4444" />
                        <Text style={[styles.optionText, { color: '#EF4444' }]}>Report Post</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.optionItem} onPress={handleBlock}>
                        <Ban size={20} color="#111827" />
                        <Text style={styles.optionText}>Block {post.user?.username || 'User'}</Text>
                    </TouchableOpacity>

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
