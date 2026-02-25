import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Platform, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, Edit3, MapPin, GraduationCap, Ruler, BookOpen, Heart, Eye, EyeOff, Sparkles, X, UserCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { authAPI } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const PINK = '#EC4899';
const MAX_WIDTH = 500;

// Prompt templates for display
const PROMPT_TEMPLATES = [
    { key: 'looking', question: "I'm looking for..." },
    { key: 'about', question: 'About me' },
    { key: 'interests', question: 'My interests' },
];

interface DatingProfile {
    datingGender?: string;
    datingLookingFor?: string;
    datingHeight?: string;
    datingHometown?: string;
    datingCollege?: string;
    datingCourse?: string;
    datingIntentions?: string[];
    datingBio?: string;
    datingInterests?: string[];
    datingPhotos?: string[];
    fullName?: string;
    username?: string;
    isDatingProfileVisible?: boolean;
    blockedUsers?: Array<{ _id: string; username: string; fullName: string; profileImage: string }>;
}

export default function MyDatingProfile() {
    const router = useRouter();
    const [profile, setProfile] = useState<DatingProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    const [showBlockedUsers, setShowBlockedUsers] = useState(false);
    const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
    const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const res = await authAPI.getDatingProfile();
            if (res.data) {
                // Also get user info for name
                const userRes = await authAPI.getMe();
                setProfile({ ...res.data, fullName: userRes.data?.fullName, username: userRes.data?.username });
                setBlockedUsers(userRes.data?.blockedUsers || []);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const togglePrivacy = async () => {
        if (!profile) return;
        setIsUpdatingPrivacy(true);
        try {
            const newStatus = !profile.isDatingProfileVisible;
            const res = await authAPI.updateDatingProfile({ isDatingProfileVisible: newStatus });
            if (res.data?.success) {
                setProfile(prev => prev ? { ...prev, isDatingProfileVisible: newStatus } : null);
            }
        } catch (error) {
            console.error('Error updating privacy:', error);
            Alert.alert('Error', 'Failed to update privacy settings');
        } finally {
            setIsUpdatingPrivacy(false);
        }
    };

    const handleUnblock = async (targetUserId: string) => {
        try {
            const res = await authAPI.unblockUser(targetUserId);
            if (res.data?.success) {
                setBlockedUsers(prev => prev.filter(u => u._id !== targetUserId));
                if (Platform.OS === 'web') {
                    window.alert('User unblocked');
                } else {
                    Alert.alert('Success', 'User unblocked');
                }
            }
        } catch (error) {
            console.error('Error unblocking user:', error);
            Alert.alert('Error', 'Failed to unblock user');
        }
    };

    const goBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(tabs)/dating');
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={PINK} />
                <Text style={styles.loadingText}>Loading your profile...</Text>
            </View>
        );
    }

    if (!profile || !profile.datingPhotos || profile.datingPhotos.length === 0) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={styles.emptyTitle}>Profile Not Complete</Text>
                <Text style={styles.emptySubtitle}>Complete your dating profile to see how others see you</Text>
                <TouchableOpacity style={styles.setupButton} onPress={() => router.push('/dating-profile-setup')}>
                    <Text style={styles.setupButtonText}>Complete Profile</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const photos = profile.datingPhotos || [];
    const heroPhoto = photos[0];
    const remainingPhotos = photos.slice(1);

    // Build content items (alternating photos and prompts)
    const contentItems: { type: 'photo' | 'prompt'; data: any }[] = [];

    // Add intentions prompt
    if (profile.datingIntentions && profile.datingIntentions.length > 0) {
        contentItems.push({ type: 'prompt', data: { question: "I'm looking for...", answer: profile.datingIntentions.join(', ') } });
    }

    // Interleave remaining photos with prompts
    remainingPhotos.forEach((photo, index) => {
        contentItems.push({ type: 'photo', data: photo });

        // Add bio after first photo
        if (index === 0 && profile.datingBio) {
            contentItems.push({ type: 'prompt', data: { question: 'About me', answer: profile.datingBio } });
        }
    });

    // Add interests at the end
    if (profile.datingInterests && profile.datingInterests.length > 0) {
        contentItems.push({ type: 'prompt', data: { question: 'My interests', answer: profile.datingInterests.join(' • ') } });
    }

    const ProfileContent = () => (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* Hero Photo Section */}
            <Animated.View entering={FadeIn} style={styles.heroContainer}>
                <Image source={{ uri: heroPhoto }} style={styles.heroImage} />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.heroGradient}
                />
                <View style={styles.heroInfo}>
                    <Text style={styles.heroName}>{profile.fullName || profile.username || 'You'}</Text>
                    <View style={styles.heroDetails}>
                        {profile.datingHeight && (
                            <View style={styles.heroBadge}>
                                <Ruler size={12} color="white" />
                                <Text style={styles.heroBadgeText}>{profile.datingHeight} cm</Text>
                            </View>
                        )}
                        {profile.datingGender && (
                            <View style={styles.heroBadge}>
                                <Text style={styles.heroBadgeText}>{profile.datingGender}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Animated.View>

            {/* Content Cards */}
            {contentItems.map((item, index) => (
                <Animated.View
                    key={index}
                    entering={FadeInUp.delay(100 * index)}
                    style={styles.card}
                >
                    {item.type === 'photo' ? (
                        <View style={styles.photoCard}>
                            <Image source={{ uri: item.data }} style={styles.cardImage} />
                        </View>
                    ) : (
                        <View style={styles.promptCard}>
                            <Text style={styles.promptQuestion}>{item.data.question}</Text>
                            <Text style={styles.promptAnswer}>{item.data.answer}</Text>
                        </View>
                    )}
                </Animated.View>
            ))}

            {/* Details Section */}
            <Animated.View entering={FadeInUp.delay(300)} style={styles.detailsCard}>
                <Text style={styles.detailsTitle}>Details</Text>
                <View style={styles.pillsContainer}>
                    {profile.datingHometown && (
                        <View style={styles.pill}>
                            <MapPin size={14} color="#6B7280" />
                            <Text style={styles.pillText}>{profile.datingHometown}</Text>
                        </View>
                    )}
                    {profile.datingCollege && (
                        <View style={styles.pill}>
                            <GraduationCap size={14} color="#6B7280" />
                            <Text style={styles.pillText}>{profile.datingCollege}</Text>
                        </View>
                    )}
                    {profile.datingCourse && (
                        <View style={styles.pill}>
                            <BookOpen size={14} color="#6B7280" />
                            <Text style={styles.pillText}>{profile.datingCourse}</Text>
                        </View>
                    )}
                    {profile.datingLookingFor && (
                        <View style={styles.pill}>
                            <Heart size={14} color="#6B7280" />
                            <Text style={styles.pillText}>Looking for {profile.datingLookingFor}</Text>
                        </View>
                    )}
                </View>
            </Animated.View>
        </ScrollView>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={goBack} style={styles.backButton}>
                    <ArrowLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Profile</Text>
                <TouchableOpacity onPress={() => router.push('/dating-profile-setup')} style={styles.editButton}>
                    <Edit3 size={20} color={PINK} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Privacy & Preview Actions */}
                <View style={styles.actionGrid}>
                    <TouchableOpacity style={styles.actionCard} onPress={() => setShowPreview(true)}>
                        <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
                            <Eye size={20} color="#6366F1" />
                        </View>
                        <Text style={styles.actionText}>Profile Preview</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={togglePrivacy}
                        disabled={isUpdatingPrivacy}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: profile.isDatingProfileVisible ? '#ECFDF5' : '#FEF2F2' }]}>
                            {profile.isDatingProfileVisible ? (
                                <UserCheck size={20} color="#10B981" />
                            ) : (
                                <EyeOff size={20} color="#EF4444" />
                            )}
                        </View>
                        <Text style={styles.actionText}>
                            {profile.isDatingProfileVisible ? 'Public Mode' : 'Hidden Mode'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionCard} onPress={() => setShowBlockedUsers(true)}>
                        <View style={[styles.actionIcon, { backgroundColor: '#F3F4F6' }]}>
                            <EyeOff size={20} color="#6B7280" />
                        </View>
                        <Text style={styles.actionText}>Hidden Users</Text>
                    </TouchableOpacity>
                </View>

                {/* Info Box for Privacy */}
                {!profile.isDatingProfileVisible && (
                    <View style={styles.privacyInfoBox}>
                        <EyeOff size={16} color="#B91C1C" />
                        <Text style={styles.privacyInfoText}>
                            Your profile is currently hidden and won't appear to others in the Suggest tab.
                        </Text>
                    </View>
                )}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Content Preview</Text>
                    <Sparkles size={16} color={PINK} />
                </View>

                {/* Hero Photo Section */}
                <Animated.View entering={FadeIn} style={styles.heroContainer}>
                    <Image source={{ uri: heroPhoto }} style={styles.heroImage} />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={styles.heroGradient}
                    />
                    <View style={styles.heroInfo}>
                        <Text style={styles.heroName}>{profile.fullName || profile.username || 'You'}</Text>
                        <View style={styles.heroDetails}>
                            {profile.datingHeight && (
                                <View style={styles.heroBadge}>
                                    <Ruler size={12} color="white" />
                                    <Text style={styles.heroBadgeText}>{profile.datingHeight} cm</Text>
                                </View>
                            )}
                            {profile.datingGender && (
                                <View style={styles.heroBadge}>
                                    <Text style={styles.heroBadgeText}>{profile.datingGender}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </Animated.View>

                {/* Content Cards */}
                {contentItems.map((item, index) => (
                    <Animated.View
                        key={index}
                        entering={FadeInUp.delay(100 * index)}
                        style={styles.card}
                    >
                        {item.type === 'photo' ? (
                            <View style={styles.photoCard}>
                                <Image source={{ uri: item.data }} style={styles.cardImage} />
                                <TouchableOpacity style={styles.likeButton}>
                                    <Heart size={20} color={PINK} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.promptCard}>
                                <Text style={styles.promptQuestion}>{item.data.question}</Text>
                                <Text style={styles.promptAnswer}>{item.data.answer}</Text>
                                <TouchableOpacity style={styles.likeButtonPrompt}>
                                    <Heart size={18} color={PINK} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </Animated.View>
                ))}

                {/* Details Section */}
                <Animated.View entering={FadeInUp.delay(300)} style={styles.detailsCard}>
                    <Text style={styles.detailsTitle}>Details</Text>
                    <View style={styles.pillsContainer}>
                        {profile.datingHometown && (
                            <View style={styles.pill}>
                                <MapPin size={14} color="#6B7280" />
                                <Text style={styles.pillText}>{profile.datingHometown}</Text>
                            </View>
                        )}
                        {profile.datingCollege && (
                            <View style={styles.pill}>
                                <GraduationCap size={14} color="#6B7280" />
                                <Text style={styles.pillText}>{profile.datingCollege}</Text>
                            </View>
                        )}
                        {profile.datingCourse && (
                            <View style={styles.pill}>
                                <BookOpen size={14} color="#6B7280" />
                                <Text style={styles.pillText}>{profile.datingCourse}</Text>
                            </View>
                        )}
                        {profile.datingLookingFor && (
                            <View style={styles.pill}>
                                <Heart size={14} color="#6B7280" />
                                <Text style={styles.pillText}>Looking for {profile.datingLookingFor}</Text>
                            </View>
                        )}
                    </View>
                </Animated.View>

                {/* Edit Profile Button */}
                <TouchableOpacity
                    style={styles.editProfileButton}
                    onPress={() => router.push('/dating-profile-setup')}
                >
                    <Edit3 size={18} color="white" />
                    <Text style={styles.editProfileButtonText}>Edit Profile</Text>
                </TouchableOpacity>

                {/* Delete Profile Button */}
                <TouchableOpacity
                    style={[styles.editProfileButton, { backgroundColor: '#fee2e2' }]} // Red background
                    onPress={() => {
                        const handleDelete = async () => {
                            try {
                                setIsLoading(true);
                                const res = await authAPI.resetDatingProfile();
                                if (res.data?.success) {
                                    // Clear local consent
                                    await AsyncStorage.setItem('datingTermsAccepted', 'false');

                                    if (Platform.OS === 'web') {
                                        window.alert("Your dating profile has been reset.");
                                    } else {
                                        Alert.alert("Deleted", "Your dating profile has been reset.");
                                    }
                                    router.replace('/(tabs)/dating');
                                } else {
                                    throw new Error(res.data?.message || 'Failed to reset profile');
                                }
                            } catch (error: any) {
                                console.error('Delete dating profile error:', error);
                                if (Platform.OS === 'web') {
                                    window.alert(error.message || "Failed to delete profile.");
                                } else {
                                    Alert.alert("Error", error.message || "Failed to delete profile.");
                                }
                            } finally {
                                setIsLoading(false);
                            }
                        };

                        const message = "This will delete all your dating info, photos, and preferences. You'll need to re-enter everything to use Dating Mode again.";
                        const title = "Delete Dating Profile?";

                        if (Platform.OS === 'web') {
                            if (window.confirm(`${title}\n\n${message}`)) {
                                handleDelete();
                            }
                        } else {
                            Alert.alert(title, message, [
                                { text: "Cancel", style: "cancel" },
                                { text: "Delete", style: "destructive", onPress: handleDelete }
                            ]);
                        }
                    }}
                >
                    <Edit3 size={18} color="#EF4444" />
                    <Text style={[styles.editProfileButtonText, { color: '#EF4444' }]}>Delete Dating Profile</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Profile Preview Modal */}
            {showPreview && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Discovery Preview</Text>
                            <TouchableOpacity onPress={() => setShowPreview(false)} style={styles.closeModal}>
                                <X size={24} color="#111827" />
                            </TouchableOpacity>
                        </View>
                        <ProfileContent />
                    </View>
                </View>
            )}

            {/* Blocked Users Modal */}
            {showBlockedUsers && (
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '80%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Hidden Users</Text>
                            <TouchableOpacity onPress={() => setShowBlockedUsers(false)} style={styles.closeModal}>
                                <X size={24} color="#111827" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.blockedList}>
                            {blockedUsers.length === 0 ? (
                                <View style={styles.emptyBlocked}>
                                    <Text style={styles.emptyBlockedText}>No users are currently hidden.</Text>
                                </View>
                            ) : (
                                blockedUsers.map(user => (
                                    <View key={user._id} style={styles.blockedUserItem}>
                                        <Image
                                            source={{ uri: user.profileImage || 'https://via.placeholder.com/150' }}
                                            style={styles.blockedUserAvatar}
                                        />
                                        <View style={styles.blockedUserInfo}>
                                            <Text style={styles.blockedUserName}>{user.fullName || user.username}</Text>
                                            <TouchableOpacity onPress={() => handleUnblock(user._id)}>
                                                <Text style={styles.unblockText}>Unblock</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 16,
        color: '#6B7280',
        fontSize: 14,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    setupButton: {
        backgroundColor: PINK,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    setupButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    editButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Scroll
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        maxWidth: MAX_WIDTH,
        alignSelf: 'center',
        width: '100%',
    },

    // Hero
    heroContainer: {
        width: '100%',
        aspectRatio: 0.8,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
        backgroundColor: '#E5E7EB',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
    },
    heroInfo: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    heroName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    heroDetails: {
        flexDirection: 'row',
        gap: 8,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    heroBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },

    // Cards
    card: {
        marginBottom: 16,
    },
    photoCard: {
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#E5E7EB',
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        aspectRatio: 0.85,
    },
    likeButton: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    // Prompt Card
    promptCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    promptQuestion: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '500',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    promptAnswer: {
        fontSize: 18,
        color: '#111827',
        fontWeight: '500',
        lineHeight: 26,
        paddingRight: 40,
    },
    likeButtonPrompt: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FDF2F8',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Details Card
    detailsCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    detailsTitle: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '500',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    pillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    pillText: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '500',
    },

    // Edit Profile Button
    editProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: PINK,
        paddingVertical: 16,
        borderRadius: 14,
        marginBottom: 16,
    },
    editProfileButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },

    // Action Grid
    actionGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    actionCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    },

    privacyInfoBox: {
        flexDirection: 'row',
        gap: 10,
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
    },
    privacyInfoText: {
        flex: 1,
        fontSize: 12,
        color: '#B91C1C',
        lineHeight: 18,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },

    // Modal
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 100,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FAFAFA',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        height: '90%',
        width: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    closeModal: {
        padding: 4,
    },
    blockedList: {
        padding: 20,
    },
    emptyBlocked: {
        padding: 40,
        alignItems: 'center',
    },
    emptyBlockedText: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    blockedUserItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    blockedUserAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    blockedUserInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    blockedUserName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    unblockText: {
        color: PINK,
        fontWeight: 'bold',
    },

});
