import { View, Text, Image, TouchableOpacity, ScrollView, TextInput, StyleSheet, Dimensions, Platform, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { Heart, Sparkles, Coins, User, X, Calendar, MessageCircle, Send } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { authAPI } from '../services/api';
import { useRouter } from 'expo-router';
import { getAvatarSource } from '../../utils/imageUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DatingTermsModal from '../../components/DatingTermsModal';

const LIME = '#D4FF00';
const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 600;

// Type definition matching Backend User Model
interface Match {
  _id: string; // MongoDB ID
  fullName?: string;
  username?: string;
  profileImage?: string;
  bio?: string;
  college?: string;
  year?: string;
  interests: string[];
  coins?: number;
}

export default function DatingScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'vibe' | 'chat' | 'discover'>('vibe');
  const [coins, setCoins] = useState(0);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [recommendations, setRecommendations] = useState<Match[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Match | null>(null);
  const [showShop, setShowShop] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Dating Setup State
  const [isLoading, setIsLoading] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [datingProfileComplete, setDatingProfileComplete] = useState(false);

  // Check dating profile status on load
  useEffect(() => {
    checkDatingStatus();
  }, []);

  const checkDatingStatus = async () => {
    setIsLoading(true);
    try {
      const res = await authAPI.getDatingProfile();
      if (res.data) {
        const { datingTermsAccepted, datingProfileComplete: profileComplete } = res.data;

        if (!datingTermsAccepted) {
          // First time user - show terms
          setShowTermsModal(true);
        } else if (!profileComplete) {
          // Terms accepted but profile not complete
          router.replace('/dating-profile-setup');
          return;
        } else {
          // Fully setup - load data
          setDatingProfileComplete(true);
          fetchUserData();
          fetchRecommendations();
        }
      }
    } catch (error) {
      console.error('Error checking dating status:', error);
      // On error, show terms modal as fallback
      setShowTermsModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptTerms = async () => {
    try {
      await authAPI.acceptDatingTerms();
      setShowTermsModal(false);
      // Navigate to profile setup
      router.replace('/dating-profile-setup');
    } catch (error) {
      console.error('Error accepting terms:', error);
      Alert.alert('Error', 'Failed to accept terms. Please try again.');
    }
  };

  const handleDeclineTerms = () => {
    setShowTermsModal(false);
    goBack();
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/'); // Go back to feed
    }
  };

  const fetchUserData = async () => {
    try {
      const res = await authAPI.getMe();
      if (res.data) setCoins(res.data.coins || 0);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await authAPI.getRecommendations();
      if (res.data) setRecommendations(res.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUserData(), fetchRecommendations()]);
    setRefreshing(false);
  };

  const handleSwitchVibe = async (targetUser: Match) => {
    if (coins < 100) {
      Alert.alert('Low Balance', 'You need 100 coins to switch your vibe. Visit the shop!');
      setShowShop(true);
      return;
    }

    try {
      await authAPI.switchMatch(targetUser._id);
      setCoins(prev => prev - 100);
      setCurrentMatch(targetUser);
      setSelectedProfile(null);
      setActiveTab('vibe');
      Alert.alert('Success', "You've switched your vibe!");
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to switch match');
    }
  };

  const handleBuyPacket = async (amount: number, price: number) => {
    try {
      // In real app, Trigger Payment Gateway logic here
      // On success:
      const res = await authAPI.buyCoins(amount);
      if (res.data && res.data.success) {
        setCoins(res.data.coins);
        Alert.alert('Purchase Successful', `Added ${amount} coins to your wallet!`);
        setShowShop(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Purchase failed');
    }
  };

  // Show loading while checking profile status
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#EC4899" />
        <Text style={{ marginTop: 16, color: '#6B7280' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Dating Terms Modal */}
      <DatingTermsModal
        visible={showTermsModal}
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
      />

      <View style={styles.centerWrapper}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dating Mode</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.coinsButton} onPress={() => setShowShop(true)}>
              <Coins size={14} color="black" />
              <Text style={styles.coinsText}>{coins}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/dating-profile-setup')}>
              <User size={18} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {['vibe', 'chat', 'discover'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab as any)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              {tab === 'discover' && <Sparkles size={12} color={activeTab === tab ? 'white' : '#6B7280'} />}
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'vibe' ? 'My Vibe' : tab === 'chat' ? 'Chat' : 'Discover'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {activeTab === 'vibe' && <MyVibeTab currentMatch={currentMatch} />}
          {activeTab === 'chat' && <ChatTab currentMatch={currentMatch} />}
          {activeTab === 'discover' && <DiscoverTab suggestions={recommendations} onSelect={setSelectedProfile} />}
        </ScrollView>
      </View>


      {/* Profile Preview Modal */}
      {selectedProfile && (
        <ProfilePreviewModal
          profile={selectedProfile}
          coins={coins}
          onClose={() => setSelectedProfile(null)}
          onSwitch={() => handleSwitchVibe(selectedProfile)}
        />
      )}

      {/* Coin Shop Modal */}
      {showShop && (
        <CoinShopModal
          coins={coins}
          onClose={() => setShowShop(false)}
          onBuy={handleBuyPacket}
        />
      )}
    </View>
  );
}

const MyVibeTab = ({ currentMatch }: { currentMatch: Match | null }) => {
  if (!currentMatch) return <EmptyState icon={Heart} title="No active vibe" subtitle="Go to Discover to find someone!" />;
  return (
    <Animated.View entering={FadeIn} style={styles.vibeContainer}>
      <View style={styles.matchCard}>
        <Image source={getAvatarSource(currentMatch.profileImage)} style={styles.matchImage} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>Active Vibe</Text></View>
        <View style={styles.matchInfo}>
          <Text style={styles.matchName}>{currentMatch.fullName || 'Anonymous'}, {currentMatch.year}</Text>
          <Text style={styles.matchCollege}>{currentMatch.college}</Text>
          <Text style={styles.matchBio}>{currentMatch.bio}</Text>
          <View style={styles.interestsRow}>
            {currentMatch.interests?.map(i => <View key={i} style={styles.interestBadge}><Text style={styles.interestBadgeText}>{i}</Text></View>)}
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.viewProfileButton}><Text style={styles.viewProfileText}>View Full Profile</Text></TouchableOpacity>
    </Animated.View>
  );
};

const ChatTab = ({ currentMatch }: { currentMatch: Match | null }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  if (!currentMatch) return <EmptyState icon={MessageCircle} title="Start Chatting" subtitle="Match with someone to chat" />;

  useEffect(() => {
    loadUser();
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [currentMatch]);

  const loadUser = async () => {
    const userInfo = await require('@react-native-async-storage/async-storage').default.getItem('userInfo');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      setCurrentUserId(user.id || user._id);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await authAPI.getMessages(currentMatch._id);
      setMessages(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    try {
      await authAPI.sendMessage(currentMatch._id, inputText);
      setInputText('');
      fetchMessages();
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  return (
    <View style={styles.chatContainer}>
      <View style={styles.chatHeader}>
        <Image source={getAvatarSource(currentMatch.profileImage)} style={styles.chatAvatar} />
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatName}>{currentMatch.fullName || 'User'}</Text>
          <Text style={styles.activeStatus}>Active now</Text>
        </View>
      </View>

      <ScrollView style={styles.messagesScroll} contentContainerStyle={styles.messagesContainer}>
        {messages.map((msg, index) => {
          const isMe = msg.sender === currentUserId;
          return (
            <View key={index} style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
              <Text style={[styles.messageText, isMe && { color: 'white' }]}>{msg.text}</Text>
            </View>
          );
        })}
        {messages.length === 0 && <Text style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 20 }}>No messages yet. Say hi!</Text>}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type a message..."
          style={styles.messageInput}
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Send size={18} color="black" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const DiscoverTab = ({ suggestions, onSelect }: { suggestions: Match[], onSelect: (m: Match) => void }) => {
  if (suggestions.length === 0) return <EmptyState icon={Sparkles} title="No profiles found" subtitle="Check back later for new people!" />;

  return (
    <View style={styles.discoverContainer}>
      <Text style={styles.discoverHint}>Tap a profile to reveal details</Text>
      <View style={styles.profilesGrid}>
        {suggestions.map(s => (
          <TouchableOpacity key={s._id} onPress={() => onSelect(s)} style={styles.profileCard}>
            {/* Blurring Logic: In real app, use blurRadius on Image, or overlays */}
            <Image source={getAvatarSource(s.profileImage)} style={styles.profileCardImage} blurRadius={Platform.OS === 'web' ? 10 : 25} />
            <LinearGradient colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFillObject} />
            <View style={styles.sparkleIcon}><Sparkles size={12} color="white" /></View>
            <View style={styles.profileCardContent}>
              <View style={styles.profileInterests}>
                {s.interests?.slice(0, 1).map(i => <View key={i} style={styles.smallBadge}><Text style={styles.smallBadgeText}>{i}</Text></View>)}
              </View>
              {/* <Text style={{color: 'white', fontWeight: 'bold'}}>{s.college}</Text> */}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const EmptyState = ({ icon: Icon, title, subtitle }: any) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIcon}><Icon size={40} color="#D1D5DB" /></View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySubtitle}>{subtitle}</Text>
  </View>
);

const ProfilePreviewModal = ({ profile, coins, onClose, onSwitch }: any) => (
  <View style={styles.modalOverlay}>
    <Animated.View entering={SlideInUp} style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Mystery Profile</Text>
        <TouchableOpacity onPress={onClose}><X size={24} color="black" /></TouchableOpacity>
      </View>
      <ScrollView>
        <View style={styles.blurredImageContainer}>
          <Image source={getAvatarSource(profile.profileImage)} style={styles.blurredImage} blurRadius={20} />
          <View style={styles.blurOverlay}><Sparkles size={32} color="white" /><Text style={styles.blurText}>Hidden Identity</Text></View>
        </View>
        <View style={styles.modalSection}><Text style={styles.sectionTitle}>Interests</Text><View style={styles.badgesRow}>{profile.interests?.map((i: string) => <View key={i} style={styles.sectionBadge}><Text style={styles.sectionBadgeText}>{i}</Text></View>)}</View></View>
        <View style={styles.modalSection}><Text style={styles.sectionTitle}>Bio</Text><Text style={styles.aboutText}>{profile.bio || "No bio yet"}</Text></View>

        <TouchableOpacity onPress={onSwitch} disabled={coins < 100} style={[styles.switchButton, coins < 100 && styles.switchButtonDisabled]}>
          <Text style={styles.switchButtonText}>Switch My Vibe (100 coins)</Text>
        </TouchableOpacity>
        {coins < 100 && <Text style={styles.lowBalanceText}>Low balance! Need {100 - coins} more.</Text>}
      </ScrollView>
    </Animated.View>
  </View>
);

const CoinShopModal = ({ coins, onClose, onBuy }: any) => {
  const packages = [
    { amount: 100, price: 50, popular: false },
    { amount: 500, price: 200, popular: true },
    { amount: 1200, price: 400, popular: false },
  ];

  return (
    <View style={styles.modalOverlay}>
      <Animated.View entering={SlideInUp} style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Coins size={24} color="#F59E0B" />
            <Text style={styles.modalTitle}>Coin Shop</Text>
          </View>
          <TouchableOpacity onPress={onClose}><X size={24} color="black" /></TouchableOpacity>
        </View>

        <View style={styles.coinBalanceCard}>
          <Text style={styles.coinBalanceLabel}>Current Balance</Text>
          <Text style={styles.coinBalanceValue}>{coins} Coins</Text>
        </View>

        <Text style={styles.shopSectionTitle}>Buy Coins</Text>

        <View style={styles.shopGrid}>
          {packages.map((pkg, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => onBuy(pkg.amount, pkg.price)}
              style={[styles.shopCard, pkg.popular && styles.shopCardPopular]}
            >
              {pkg.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Best Value</Text>
                </View>
              )}
              <Coins size={32} color="#F59E0B" style={{ marginBottom: 12 }} />
              <Text style={styles.shopAmount}>{pkg.amount} Coins</Text>
              <Text style={styles.shopPrice}>₹{pkg.price}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.shopNote}>Coins are used to switch matches in Dating Mode.</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  centerWrapper: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', flex: 1, borderRightWidth: isWeb ? 1 : 0, borderLeftWidth: isWeb ? 1 : 0, borderColor: '#F3F4F6' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  headerRight: { flexDirection: 'row', gap: 8 },
  coinsButton: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: LIME, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  coinsText: { fontWeight: 'bold', fontSize: 12 },
  profileButton: { padding: 4, backgroundColor: '#F3F4F6', borderRadius: 12 },
  tabsContainer: { flexDirection: 'row', padding: 12, gap: 8 },
  tab: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F9FAFB' },
  tabActive: { backgroundColor: 'black' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: 'white' },
  content: { flex: 1, paddingHorizontal: 16 },

  // Vibe Tab
  vibeContainer: { alignItems: 'center' },
  matchCard: { borderRadius: 20, overflow: 'hidden', width: '100%', aspectRatio: 0.8, position: 'relative' },
  matchImage: { width: '100%', height: '100%' },
  activeBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: LIME, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  activeBadgeText: { fontSize: 10, fontWeight: 'bold' },
  matchInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  matchName: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  matchCollege: { color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  matchBio: { color: 'white', fontSize: 13, marginBottom: 12 },
  viewProfileButton: { marginTop: 16, backgroundColor: LIME, width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  viewProfileText: { fontWeight: 'bold' },

  // Chat Tab
  chatContainer: { flex: 1 },
  chatHeader: { flexDirection: 'row', gap: 12, paddingBottom: 16, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  chatAvatar: { width: 44, height: 44, borderRadius: 22 },
  chatHeaderInfo: { justifyContent: 'center' },
  chatName: { fontWeight: 'bold', fontSize: 15 },
  activeStatus: { color: '#22C55E', fontSize: 12 },
  messagesScroll: { flex: 1 },
  messagesContainer: { paddingVertical: 20, gap: 12, paddingHorizontal: 16 },
  messageBubble: { padding: 12, borderRadius: 16, maxWidth: '80%' },
  theirMessage: { backgroundColor: '#F3F4F6', alignSelf: 'flex-start' },
  myMessage: { backgroundColor: 'black', alignSelf: 'flex-end' },
  messageText: { fontSize: 14 },
  messageInput: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 16, height: 44 },
  inputContainer: { flexDirection: 'row', gap: 8, marginTop: 'auto', marginBottom: 20 },
  sendButton: { width: 44, height: 44, backgroundColor: LIME, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  // Discover Tab
  discoverContainer: {},
  discoverHint: { textAlign: 'center', color: '#6B7280', fontSize: 13, marginBottom: 16 },
  profilesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  profileCard: { width: '48%', aspectRatio: 0.75, borderRadius: 16, overflow: 'hidden', position: 'relative' },
  profileCardImage: { width: '100%', height: '100%' },
  profileCardContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10 },
  sparkleIcon: { position: 'absolute', top: 10, right: 10 },
  smallBadge: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  smallBadgeText: { fontSize: 10, color: 'white' },
  profileInterests: { flexDirection: 'row', marginBottom: 6 },

  // Shared
  interestsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  interestBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 6 },
  interestBadgeText: { color: 'white', fontSize: 11 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 80, height: 80, backgroundColor: '#F3F4F6', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold' },
  emptySubtitle: { color: '#6B7280' },

  // Modal (Same styles)
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 100 },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%', width: '100%', maxWidth: 500, alignSelf: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  blurredImageContainer: { borderRadius: 16, overflow: 'hidden', aspectRatio: 0.8, marginBottom: 20 },
  blurredImage: { width: '100%', height: '100%' },
  blurOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  blurText: { color: 'white', fontWeight: 'bold', marginTop: 8 },
  modalSection: { marginBottom: 20 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 8 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sectionBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  sectionBadgeText: { fontSize: 13 },
  aboutText: { color: '#4B5563', lineHeight: 20 },
  switchButton: { backgroundColor: LIME, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  switchButtonDisabled: { backgroundColor: '#E5E7EB' },
  switchButtonText: { fontWeight: 'bold' },
  lowBalanceText: { color: 'red', textAlign: 'center', marginTop: 8, fontSize: 12 },

  // Coin Shop (Same styles)
  coinBalanceCard: { backgroundColor: '#F9FAFB', padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 24 },
  coinBalanceLabel: { color: '#6B7280', fontSize: 14, marginBottom: 4 },
  coinBalanceValue: { fontSize: 24, fontWeight: 'bold', color: '#F59E0B' },
  shopSectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  shopGrid: { gap: 12 },
  shopCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: 'white' },
  shopCardPopular: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
  shopAmount: { flex: 1, fontSize: 16, fontWeight: 'bold', marginLeft: 12 },
  shopPrice: { backgroundColor: 'black', color: 'white', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, fontWeight: 'bold', fontSize: 14 },
  shopNote: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 24 },
  popularBadge: { position: 'absolute', top: -10, left: 16, backgroundColor: '#F59E0B', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  popularText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
});
