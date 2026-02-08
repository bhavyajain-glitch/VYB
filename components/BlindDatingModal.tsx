import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    StyleSheet,
    Modal,
    Dimensions,
    ActivityIndicator,
    Alert,
    Image,
    Platform,
} from 'react-native';
import { X, Send, Sparkles, Eye, Clock, Coins, User } from 'lucide-react-native';
import Animated, {
    FadeIn,
    SlideInUp,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { authAPI } from '../app/services/api';
import { getAvatarSource } from '../utils/imageUtils';

const { width } = Dimensions.get('window');
const LIME = '#D4FF00';
const POLL_INTERVAL = 2000; // Poll every 2 seconds

interface BlindDatingModalProps {
    visible: boolean;
    onClose: () => void;
    coins: number;
    onCoinsChange: (newCoins: number) => void;
}

interface Message {
    sender: string;
    text: string;
    createdAt: string;
}

interface PartnerProfile {
    fullName?: string;
    username?: string;
    profileImage?: string;
    datingBio?: string;
    datingInterests?: string[];
    datingAge?: number;
    datingCollege?: string;
    datingPhotos?: string[];
}

type SessionStatus = 'idle' | 'searching' | 'active' | 'extended' | 'ended' | 'matched';

export default function BlindDatingModal({ visible, onClose, coins, onCoinsChange }: BlindDatingModalProps) {
    const [status, setStatus] = useState<SessionStatus>('idle');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    // Animation for searching
    const pulseScale = useSharedValue(1);
    const rotateValue = useSharedValue(0);

    useEffect(() => {
        if (status === 'searching') {
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                false
            );
            rotateValue.value = withRepeat(
                withTiming(360, { duration: 2000, easing: Easing.linear }),
                -1,
                false
            );
        }
    }, [status]);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
    }));

    const rotateStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotateValue.value}deg` }],
    }));

    // Load current user ID
    useEffect(() => {
        const loadUser = async () => {
            const userInfo = await require('@react-native-async-storage/async-storage').default.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                setCurrentUserId(user.id || user._id);
            }
        };
        loadUser();
    }, []);

    // Poll for status updates
    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval>;

        const checkStatus = async () => {
            if (!visible) return;

            try {
                const res = await authAPI.getBlindStatus();
                if (res.data) {
                    const newStatus = res.data.status as SessionStatus;

                    if (newStatus === 'matched' || newStatus === 'active' || newStatus === 'extended') {
                        setStatus(newStatus === 'matched' ? 'active' : newStatus);
                        setSessionId(res.data.sessionId);
                        if (res.data.messages) {
                            setMessages(res.data.messages);
                        }
                    } else if (newStatus === 'ended' && status !== 'ended') {
                        setStatus('ended');
                    } else if (newStatus === 'searching') {
                        setStatus('searching');
                    }
                }
            } catch (error) {
                console.error('Error checking status:', error);
            }
        };

        if (visible && (status === 'searching' || status === 'active' || status === 'extended')) {
            intervalId = setInterval(checkStatus, POLL_INTERVAL);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [visible, status]);

    // Poll for messages when in active session
    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval>;

        const fetchMessages = async () => {
            if (!sessionId || (status !== 'active' && status !== 'extended')) return;

            try {
                const res = await authAPI.getBlindMessages(sessionId);
                if (res.data) {
                    if (res.data.status === 'ended') {
                        setStatus('ended');
                    }
                    if (res.data.messages) {
                        setMessages(res.data.messages);
                    }
                }
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        if (sessionId && (status === 'active' || status === 'extended')) {
            intervalId = setInterval(fetchMessages, POLL_INTERVAL);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [sessionId, status]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

    const handleJoinQueue = async () => {
        try {
            setStatus('searching');
            const res = await authAPI.joinBlindQueue();

            if (res.data.status === 'matched') {
                setStatus('active');
                setSessionId(res.data.sessionId);
            } else if (res.data.status === 'searching') {
                setStatus('searching');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to join queue');
            setStatus('idle');
        }
    };

    const handleLeaveQueue = async () => {
        try {
            await authAPI.leaveBlindQueue();
            setStatus('idle');
        } catch (error: any) {
            console.error('Error leaving queue:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || !sessionId || sending) return;

        setSending(true);
        try {
            const res = await authAPI.sendBlindMessage(sessionId, inputText.trim());
            if (res.data.messages) {
                setMessages(res.data.messages);
            }
            setInputText('');
        } catch (error: any) {
            if (error.message?.includes("Time's up")) {
                setStatus('ended');
            } else {
                Alert.alert('Error', error.message || 'Failed to send message');
            }
        } finally {
            setSending(false);
        }
    };

    const handleExtend = async () => {
        if (!sessionId) return;

        if (coins < 100) {
            Alert.alert('Insufficient Coins', 'You need 100 coins to extend the session.');
            return;
        }

        try {
            const res = await authAPI.extendBlindSession(sessionId);
            if (res.data.success) {
                setStatus('extended');
                setPartnerProfile(res.data.partnerProfile);
                onCoinsChange(res.data.coins);
                Alert.alert('Extended!', 'You can now see their profile and chat for 10 more minutes!');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to extend session');
        }
    };

    const handleEndSession = async () => {
        if (sessionId) {
            try {
                await authAPI.endBlindSession(sessionId);
            } catch (error) {
                console.error('Error ending session:', error);
            }
        }
        resetState();
        onClose();
    };

    const resetState = () => {
        setStatus('idle');
        setSessionId(null);
        setMessages([]);
        setInputText('');
        setPartnerProfile(null);
    };

    const handleClose = async () => {
        if (status === 'searching') {
            await handleLeaveQueue();
        }
        resetState();
        onClose();
    };

    const renderSearching = () => (
        <View style={styles.searchingContainer}>
            <Animated.View style={[styles.searchingIconOuter, pulseStyle]}>
                <LinearGradient
                    colors={['#EC4899', '#8B5CF6', '#6366F1']}
                    style={styles.searchingGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Animated.View style={rotateStyle}>
                        <Sparkles size={48} color="white" />
                    </Animated.View>
                </LinearGradient>
            </Animated.View>

            <Text style={styles.searchingTitle}>Finding Your Match...</Text>
            <Text style={styles.searchingSubtitle}>
                Looking for someone compatible based on your preferences
            </Text>

            <View style={styles.searchingHints}>
                <View style={styles.hintRow}>
                    <Eye size={16} color="#6B7280" />
                    <Text style={styles.hintText}>Identity stays hidden</Text>
                </View>
                <View style={styles.hintRow}>
                    <Clock size={16} color="#6B7280" />
                    <Text style={styles.hintText}>5 minute anonymous chat</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
        </View>
    );

    const renderChat = () => (
        <View style={styles.chatContainer}>
            {/* Chat Header */}
            <View style={styles.chatHeader}>
                {partnerProfile ? (
                    <>
                        <Image
                            source={getAvatarSource(partnerProfile.profileImage || partnerProfile.datingPhotos?.[0])}
                            style={styles.partnerAvatar}
                        />
                        <View style={styles.partnerInfo}>
                            <Text style={styles.partnerName}>{partnerProfile.fullName || 'Anonymous'}</Text>
                            {partnerProfile.datingCollege && (
                                <Text style={styles.partnerCollege}>{partnerProfile.datingCollege}</Text>
                            )}
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.anonymousAvatar}>
                            <User size={24} color="#9CA3AF" />
                        </View>
                        <View style={styles.partnerInfo}>
                            <Text style={styles.partnerName}>Anonymous User</Text>
                            <View style={styles.anonymousBadge}>
                                <Eye size={12} color="#8B5CF6" />
                                <Text style={styles.anonymousBadgeText}>Identity Hidden</Text>
                            </View>
                        </View>
                    </>
                )}
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <X size={24} color="#6B7280" />
                </TouchableOpacity>
            </View>

            {/* Partner Profile Preview (when extended) */}
            {partnerProfile && (
                <View style={styles.profileRevealCard}>
                    <LinearGradient
                        colors={['#F0FDF4', '#ECFDF5']}
                        style={styles.profileRevealGradient}
                    >
                        <Sparkles size={16} color="#10B981" />
                        <Text style={styles.profileRevealText}>Profile Revealed!</Text>
                    </LinearGradient>
                    {partnerProfile.datingBio && (
                        <Text style={styles.partnerBio}>{partnerProfile.datingBio}</Text>
                    )}
                    {partnerProfile.datingInterests && partnerProfile.datingInterests.length > 0 && (
                        <View style={styles.interestsRow}>
                            {partnerProfile.datingInterests.slice(0, 3).map((interest, i) => (
                                <View key={i} style={styles.interestBadge}>
                                    <Text style={styles.interestText}>{interest}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}

            {/* Messages */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesScroll}
                contentContainerStyle={styles.messagesContainer}
                showsVerticalScrollIndicator={false}
            >
                {messages.length === 0 && (
                    <View style={styles.emptyChat}>
                        <Sparkles size={32} color="#D1D5DB" />
                        <Text style={styles.emptyChatText}>Say hi to break the ice!</Text>
                    </View>
                )}
                {messages.map((msg, index) => {
                    const isMe = msg.sender === currentUserId;
                    return (
                        <View key={index} style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                            <Text style={[styles.messageText, isMe && { color: 'white' }]}>{msg.text}</Text>
                        </View>
                    );
                })}
            </ScrollView>

            {/* Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    placeholder="Type a message..."
                    style={styles.messageInput}
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={handleSendMessage}
                    returnKeyType="send"
                />
                <TouchableOpacity
                    style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
                    onPress={handleSendMessage}
                    disabled={!inputText.trim() || sending}
                >
                    {sending ? (
                        <ActivityIndicator size="small" color="black" />
                    ) : (
                        <Send size={18} color="black" />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderEnded = () => (
        <View style={styles.endedContainer}>
            <View style={styles.endedIconContainer}>
                <LinearGradient
                    colors={['#FEF3C7', '#FDE68A']}
                    style={styles.endedIconBg}
                >
                    <Clock size={48} color="#F59E0B" />
                </LinearGradient>
            </View>

            <Text style={styles.endedTitle}>Time's Up!</Text>
            <Text style={styles.endedSubtitle}>
                Your 5-minute session has ended. Want to continue the conversation?
            </Text>

            <TouchableOpacity style={styles.extendButton} onPress={handleExtend}>
                <LinearGradient
                    colors={['#EC4899', '#8B5CF6']}
                    style={styles.extendGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Sparkles size={20} color="white" />
                    <Text style={styles.extendButtonText}>Extend & Reveal</Text>
                    <View style={styles.coinBadge}>
                        <Coins size={14} color="#F59E0B" />
                        <Text style={styles.coinBadgeText}>100</Text>
                    </View>
                </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.extendHint}>
                Get 10 more minutes + see their profile
            </Text>

            <TouchableOpacity style={styles.endChatButton} onPress={handleEndSession}>
                <Text style={styles.endChatButtonText}>End Chat</Text>
            </TouchableOpacity>
        </View>
    );

    const renderIdle = () => (
        <View style={styles.idleContainer}>
            <View style={styles.idleIconContainer}>
                <LinearGradient
                    colors={['#EC4899', '#8B5CF6', '#6366F1']}
                    style={styles.idleIconBg}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Sparkles size={48} color="white" />
                </LinearGradient>
            </View>

            <Text style={styles.idleTitle}>Blind Dating</Text>
            <Text style={styles.idleSubtitle}>
                Get matched anonymously with someone compatible. Chat for 5 minutes to feel the vibe!
            </Text>

            <View style={styles.featureList}>
                <View style={styles.featureItem}>
                    <Eye size={20} color="#8B5CF6" />
                    <Text style={styles.featureText}>Anonymous chat - identities hidden</Text>
                </View>
                <View style={styles.featureItem}>
                    <Clock size={20} color="#8B5CF6" />
                    <Text style={styles.featureText}>5-minute trial session</Text>
                </View>
                <View style={styles.featureItem}>
                    <Sparkles size={20} color="#8B5CF6" />
                    <Text style={styles.featureText}>Pay to extend & reveal profiles</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.startButton} onPress={handleJoinQueue}>
                <LinearGradient
                    colors={['#EC4899', '#8B5CF6']}
                    style={styles.startGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Text style={styles.startButtonText}>Find My Match</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <Animated.View entering={FadeIn} style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        {status === 'searching' ? 'Searching...' :
                            status === 'active' || status === 'extended' ? 'Blind Chat' :
                                status === 'ended' ? "Time's Up" : 'Blind Dating'}
                    </Text>
                    <TouchableOpacity onPress={handleClose}>
                        <X size={24} color="#111827" />
                    </TouchableOpacity>
                </View>

                {/* Content based on status */}
                {status === 'idle' && renderIdle()}
                {status === 'searching' && renderSearching()}
                {(status === 'active' || status === 'extended') && renderChat()}
                {status === 'ended' && renderEnded()}
            </Animated.View>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },

    // Idle State
    idleContainer: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    idleIconContainer: {
        marginBottom: 24,
    },
    idleIconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    idleTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    idleSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    featureList: {
        alignSelf: 'stretch',
        marginBottom: 32,
        gap: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
    },
    featureText: {
        fontSize: 15,
        color: '#374151',
    },
    startButton: {
        alignSelf: 'stretch',
        borderRadius: 16,
        overflow: 'hidden',
    },
    startGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    startButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },

    // Searching State
    searchingContainer: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchingIconOuter: {
        marginBottom: 32,
    },
    searchingGradient: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchingTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    searchingSubtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
    },
    searchingHints: {
        gap: 12,
        marginBottom: 40,
    },
    hintRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    hintText: {
        fontSize: 14,
        color: '#6B7280',
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },

    // Chat State
    chatContainer: {
        flex: 1,
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderColor: '#F3F4F6',
        gap: 12,
    },
    partnerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    anonymousAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    partnerInfo: {
        flex: 1,
    },
    partnerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    partnerCollege: {
        fontSize: 13,
        color: '#6B7280',
    },
    anonymousBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    anonymousBadgeText: {
        fontSize: 12,
        color: '#8B5CF6',
    },
    closeButton: {
        padding: 4,
    },
    profileRevealCard: {
        margin: 16,
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    profileRevealGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    profileRevealText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10B981',
    },
    partnerBio: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 8,
    },
    interestsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    interestBadge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    interestText: {
        fontSize: 12,
        color: '#065F46',
    },
    messagesScroll: {
        flex: 1,
    },
    messagesContainer: {
        padding: 16,
        gap: 12,
    },
    emptyChat: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyChatText: {
        marginTop: 12,
        fontSize: 15,
        color: '#9CA3AF',
    },
    messageBubble: {
        padding: 12,
        borderRadius: 16,
        maxWidth: '80%',
    },
    theirMessage: {
        backgroundColor: '#F3F4F6',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    myMessage: {
        backgroundColor: '#8B5CF6',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    messageText: {
        fontSize: 15,
        color: '#111827',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderTopWidth: 1,
        borderColor: '#F3F4F6',
    },
    messageInput: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
    },
    sendButton: {
        width: 48,
        height: 48,
        backgroundColor: LIME,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#E5E7EB',
    },

    // Ended State
    endedContainer: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    endedIconContainer: {
        marginBottom: 24,
    },
    endedIconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    endedTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    endedSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    extendButton: {
        alignSelf: 'stretch',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 12,
    },
    extendGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    extendButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    coinBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    coinBadgeText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
    },
    extendHint: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 24,
    },
    endChatButton: {
        paddingVertical: 12,
        paddingHorizontal: 32,
    },
    endChatButtonText: {
        fontSize: 16,
        color: '#6B7280',
    },
});
