import { View, Text, Image, TouchableOpacity, ScrollView, TextInput, StyleSheet, Dimensions, Platform, Alert, RefreshControl, ActivityIndicator, Modal } from 'react-native';
import {
  Heart, Sparkles, Coins, Eye, Clock, User, MessageCircle, Heart as HeartIcon,
  UserMinus, ShieldAlert, MapPin, GraduationCap, BookOpen, Ruler, ChevronRight,
  CheckCircle2, X, Calendar, Send
} from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import Animated, { FadeIn, SlideInUp, useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS, interpolate, Extrapolation } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { authAPI } from '../../services/api';
import { useRouter } from 'expo-router';
import { getAvatarSource } from '../../utils/imageUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAnalytics } from '../../hooks/useAnalytics';
import DatingTermsModal from '../../components/DatingTermsModal';
import BlindDatingModal from '../../components/BlindDatingModal';
import DatingTimerModal from '../../components/DatingTimerModal';
import RazorpayCheckout from 'react-native-razorpay';

const LIME = '#D4FF00';
const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 600;

// Target Date: Jan 31st, 2026, 5:00 PM
const TARGET_DATE = new Date('2026-01-31T17:00:00');

// Helper to load Razorpay script on Web
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web') return resolve(true);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Type definition matching Backend User Model with dating fields
interface Match {
  _id: string; // MongoDB ID
  fullName?: string;
  username?: string;
  profileImage?: string;
  bio?: string;
  college?: string;
  year?: string;
  interests?: string[];
  coins?: number;
  age?: number; // User's age from main profile
  // Dating profile fields
  datingPhotos?: string[];
  datingBio?: string;
  datingInterests?: string[];
  datingHeight?: string;
  datingHometown?: string;
  datingCollege?: string;
  datingCourse?: string;
  datingGender?: string;
  datingIntentions?: string[];
  datingAge?: number;
  likeId?: string;
}

export default function DatingScreen() {
  const router = useRouter();
  const { logFeatureUse } = useAnalytics('dating');
  const [activeTab, setActiveTab] = useState<'vibe' | 'chat' | 'suggest'>('suggest');
  const [coins, setCoins] = useState(0);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [recommendations, setRecommendations] = useState<Match[]>([]);
  const [vibeMatches, setVibeMatches] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Match | null>(null);
  const [showShop, setShowShop] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showOutofLikesModal, setShowOutofLikesModal] = useState(false);
  const [vibeViewMode, setVibeViewMode] = useState<'grid' | 'list'>('grid');
  const [showBlindDating, setShowBlindDating] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);

  // Likes System State
  const [likesCount, setLikesCount] = useState(5);
  const [chatSlots, setChatSlots] = useState(2);
  const [activeChatCount, setActiveChatCount] = useState(0);
  const [receivedLikes, setReceivedLikes] = useState<any[]>([]);
  const [nextRegenTime, setNextRegenTime] = useState<Date | null>(null);
  const [unlimitedCoinsExpiry, setUnlimitedCoinsExpiry] = useState<Date | null>(null);
  const [countdownText, setCountdownText] = useState<string | null>(null);

  // Dating Setup State
  const [isLoading, setIsLoading] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [datingProfileComplete, setDatingProfileComplete] = useState(false);

  // Check dating profile status on load
  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        checkDatingStatus();
      }
    };
    init();
  }, []);

  // Unlimited Coins Timer
  useEffect(() => {
    if (!unlimitedCoinsExpiry) {
      setCountdownText(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(unlimitedCoinsExpiry).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setUnlimitedCoinsExpiry(null);
        setCountdownText(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setCountdownText(parts.join(' '));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [unlimitedCoinsExpiry]);

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
          await AsyncStorage.setItem('datingTermsAccepted', 'true'); // Sync local
          setDatingProfileComplete(true);
          setShowTermsModal(false); // Ensure modal is off
          fetchUserData();
          fetchRecommendations();
          fetchLikesStatus();
          fetchReceivedLikes();
          fetchVibeMatches();
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
      // Optimistic update
      await AsyncStorage.setItem('datingTermsAccepted', 'true');
      await authAPI.acceptDatingTerms();
      logFeatureUse('accept_terms');
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

  const fetchLikesStatus = async () => {
    try {
      const res = await authAPI.getLikesStatus();
      if (res.data) {
        setLikesCount(res.data.likes || 0);
        setChatSlots(res.data.chatSlots || 2);
        setActiveChatCount(res.data.activeChatCount || 0);
        setCoins(res.data.coins || 0);
        setNextRegenTime(res.data.nextRegenTime ? new Date(res.data.nextRegenTime) : null);
        setUnlimitedCoinsExpiry(res.data.unlimitedCoinsExpiry ? new Date(res.data.unlimitedCoinsExpiry) : null);
      }
    } catch (error) {
      console.error('Error fetching likes status:', error);
    }
  };

  const fetchReceivedLikes = async () => {
    try {
      const res = await authAPI.getReceivedLikes();
      if (res.data) setReceivedLikes(res.data);
    } catch (error) {
      console.error('Error fetching received likes:', error);
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

  const fetchVibeMatches = async () => {
    try {
      const res = await authAPI.getActiveChats();
      if (res.data) setVibeMatches(res.data);
    } catch (error) {
      console.error('Error fetching vibe matches:', error);
    }
  };

  const handlePassUser = async (targetUserId: string) => {
    try {
      await authAPI.passUser(targetUserId);
    } catch (error) {
      console.error('Error passing user:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchUserData(),
      fetchRecommendations(),
      fetchLikesStatus(),
      fetchReceivedLikes(),
      fetchVibeMatches()
    ]);
    setRefreshing(false);
  };

  const handleGoBlind = () => {
    const now = new Date();
    if (now < TARGET_DATE) {
      setShowTimerModal(true);
    } else {
      setShowBlindDating(true);
    }
  };

  const handleSwitchVibe = async (targetUser: Match) => {
    const now = new Date();
    if (now < TARGET_DATE) {
      setShowTimerModal(true);
      return;
    }

    const isUnlimited = unlimitedCoinsExpiry && new Date(unlimitedCoinsExpiry) > new Date();

    if (!isUnlimited && coins < 100) {
      Alert.alert('Low Balance', 'You need 100 coins to switch your vibe. Visit the shop!');
      setShowShop(true);
      return;
    }

    Alert.alert(
      isUnlimited ? 'Unlimited Plan' : 'Switch My Vibe',
      isUnlimited ? `You have an active unlimited plan. Switch vibe with ${targetUser.fullName || 'User'} for free?` : `Switch your vibe with ${targetUser.fullName || 'User'} for 100 coins?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: async () => {
            try {
              await authAPI.switchMatch(targetUser._id);
              if (!isUnlimited) setCoins(prev => prev - 100);
              setCurrentMatch(targetUser);
              setSelectedProfile(null);
              setActiveTab('vibe');
              Alert.alert('Success', "You've switched your vibe!");
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to switch match');
            }
          }
        }
      ]
    );
  };



  const handleBuyPacket = async (amount: number, price: number, packType: string = 'coins') => {
    try {
      // 1. Create order on backend
      const orderRes = await authAPI.createPaymentOrder(amount, price, packType);
      if (!orderRes.data || !orderRes.data.success) {
        throw new Error('Failed to initialize payment');
      }

      const { order_id } = orderRes.data;

      // 2. Get user info for prefill & sanitize phone
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      const userInfo = userInfoStr ? JSON.parse(userInfoStr) : {};

      // Clean phone number (remove +, spaces, dashes, etc.)
      const rawPhone = userInfo.phoneNumber || '9999999999';
      const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);

      // 3. Open Razorpay Checkout
      const options = {
        key: 'rzp_test_SAITcJvNVyx7nR',
        amount: Math.round(price * 100),
        currency: 'INR',
        name: 'Vyb',
        description: `Purchase ${amount} coins`,
        image: 'https://i.imgur.com/8K5y87l.png', // More reliable placeholder or Vyb logo if available
        order_id: order_id,
        prefill: {
          name: userInfo.fullName || 'Vyb User',
          email: userInfo.email || 'user@vyb.com',
          contact: cleanPhone
        },
        theme: { color: '#D4FF00' },
        retry: { enabled: true, max_count: 3 }
      };

      console.log('[Razorpay] Initializing with options:', JSON.stringify(options, null, 2));

      if (Platform.OS === 'web') {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          Alert.alert('Error', 'Failed to load payment gateway. Please check your internet connection.');
          return;
        }

        const rzp = new (window as any).Razorpay({
          ...options,
          handler: async (response: any) => {
            console.log('Razorpay Web Success:', response);
            try {
              const verifyRes = await authAPI.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });

              if (verifyRes.data && verifyRes.data.success) {
                setCoins(verifyRes.data.coins);
                Alert.alert('Purchase Successful', `Added ${amount} coins to your wallet!`);
                setShowShop(false);
              } else {
                Alert.alert('Verification Failed', 'Payment was successful but verification failed.');
              }
            } catch (error: any) {
              console.error('Web Verification Error:', error);
              Alert.alert('Error', error.message || 'Verification failed');
            }
          },
          modal: {
            ondismiss: () => {
              console.log('Payment modal closed by user');
            },
            escape: true,
            backdropclose: false
          },
          notes: {
            platform: 'web_expo'
          }
        });

        rzp.on('payment.failed', (response: any) => {
          console.error('Razorpay Web Payment Failed:', response.error);
          Alert.alert('Payment Failed', response.error.description || 'Transaction failed');
        });
        rzp.open();
      } else {
        if (!RazorpayCheckout) {
          console.error('RazorpayCheckout is null. This usually means the native module is not linked or you are running in Expo Go.');
          Alert.alert(
            'Native Module Missing',
            'Razorpay is not available in the development environment (Expo Go). Please test on the Web or use a Development Build / Standalone APK.'
          );
          return;
        }
        RazorpayCheckout.open(options).then(async (data: any) => {
          // 4. Verify payment on backend
          try {
            const verifyRes = await authAPI.verifyPayment({
              razorpay_order_id: data.razorpay_order_id,
              razorpay_payment_id: data.razorpay_payment_id,
              razorpay_signature: data.razorpay_signature
            });

            if (verifyRes.data && verifyRes.data.success) {
              setCoins(verifyRes.data.coins);
              Alert.alert('Purchase Successful', `Added ${amount} coins to your wallet!`);
              setShowShop(false);
            } else {
              Alert.alert('Verification Failed', 'Payment was successful but verification failed. Please contact support.');
            }
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Verification failed');
          }
        }).catch((error: any) => {
          // handle failure
          console.log('Razorpay Error:', error);
          if (error.code !== 2) { // 2 is user cancelled
            Alert.alert('Payment Failed', error.description || 'Transaction was not completed.');
          }
        });
      }
    } catch (error: any) {
      console.error('handleBuyPacket error:', error);
      Alert.alert('Error', error.message || 'Payment failed');
    }
  };

  const handleSendLike = async (targetUser: Match) => {
    if (likesCount < 1) {
      setShowOutofLikesModal(true);
      return;
    }

    try {
      const res = await authAPI.sendLike(targetUser._id);
      if (res.data?.success) {
        setLikesCount(res.data.likes);
        if (res.data.isMatch) {
          if (res.data.canChat === false) {
            // Match but can't chat - show cute message with Buy Slot option
            Alert.alert(
              'It\'s a Match! 💕',
              res.data.message || 'You matched, but chat slots are full!',
              [
                { text: 'Buy Slot', onPress: () => setShowShop(true) },
                { text: 'Got it!', style: 'cancel' }
              ]
            );
          } else {
            // Full match with chat available
            Alert.alert(
              'It\'s a Match! 🎉',
              `You and ${targetUser.fullName || 'User'} like each other. You can find them in your "My Vibe" tab.`,
              [{ text: 'Great!', onPress: () => fetchVibeMatches() }]
            );
          }
        } else {
          Alert.alert('Like Sent!', 'They will see your like in their Chat tab.');
        }
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to send like';
      Alert.alert('Notice', errorMsg);
    }
  };

  const handleUnmatch = async (likeId: string) => {
    try {
      const res = await authAPI.unmatchUser(likeId);
      if (res.data?.success) {
        Alert.alert('Unmatched', 'User has been unmatched and the slot is now free.');
        setCurrentMatch(null);
        fetchVibeMatches();
        fetchLikesStatus();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to unmatch');
    }
  };

  const handleBuyLikes = async () => {
    const isUnlimited = unlimitedCoinsExpiry && new Date(unlimitedCoinsExpiry) > new Date();

    if (!isUnlimited && coins < 100) {
      Alert.alert('Not Enough Coins', 'You need 100 coins to buy 5 likes.');
      setShowShop(true);
      return;
    }

    Alert.alert(
      isUnlimited ? 'Unlimited Plan' : 'Buy 5 Likes',
      isUnlimited ? 'You have an active unlimited plan. Add 5 likes for free?' : 'Spend 100 coins to get 5 more likes?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: async () => {
            try {
              const res = await authAPI.buyLikes();
              if (res.data?.success) {
                if (!isUnlimited) setCoins(res.data.coins);
                setLikesCount(res.data.likes);
                Alert.alert('Success', 'Purchased 5 likes!');
                onRefresh();
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to buy likes');
            }
          }
        }
      ]
    );
  };

  const handleBuyChatSlot = async () => {
    const isUnlimited = unlimitedCoinsExpiry && new Date(unlimitedCoinsExpiry) > new Date();

    if (!isUnlimited && coins < 150) {
      Alert.alert('Low Balance', 'Unlock a slot for 150 coins. Visit the shop!');
      setShowShop(true);
      return;
    }

    Alert.alert(
      isUnlimited ? 'Unlimited Plan' : 'Buy Chat Slot',
      isUnlimited ? 'You have an active unlimited plan. Unlock this slot for free?' : 'Unlock a permanent chat slot for 150 coins?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlock',
          onPress: async () => {
            try {
              const res = await authAPI.buyChatSlot();
              if (res.data?.success) {
                if (!isUnlimited) setCoins(res.data.coins);
                setChatSlots(res.data.chatSlots);
                Alert.alert('Success', 'Permanent chat slot unlocked!');
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to buy slot');
            }
          }
        }
      ]
    );
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

  // STRICT GATING: If profile not complete/terms not accepted, ONLY show modal/placeholder
  if (!datingProfileComplete && !isLoading) {
    return (
      <View style={styles.container}>
        <DatingTermsModal
          visible={true} // Force visible
          onAccept={handleAcceptTerms}
          onDecline={handleDeclineTerms}
        />
        <View style={[styles.centered, { flex: 1 }]}>
          <Sparkles size={48} color={LIME} />
          <Text style={{ marginTop: 16, color: '#6B7280' }}>Please accept terms to continue...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Timer Modal */}
      <DatingTimerModal
        visible={showTimerModal}
        onClose={() => setShowTimerModal(false)}
        targetDate={TARGET_DATE}
        onTimerEnd={() => setShowTimerModal(false)}
      />

      {/* Out of Likes Modal */}
      <OutofLikesModal
        visible={showOutofLikesModal}
        coins={coins}
        onClose={() => setShowOutofLikesModal(false)}
        onBuy={handleBuyLikes}
        nextRegenTime={nextRegenTime}
      />

      <View style={styles.centerWrapper}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dating Mode</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.blindButton} onPress={handleGoBlind}>
              <Sparkles size={14} color="white" />
              <Text style={styles.blindButtonText}>Go Blind</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.coinsButton, countdownText && { backgroundColor: '#8B5CF6' }]}
              onPress={() => setShowShop(true)}
            >
              {countdownText ? <Sparkles size={14} color="white" /> : <Coins size={14} color="black" />}
              <Text style={[styles.coinsText, countdownText && { color: 'white' }]}>
                {countdownText || coins}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/my-dating-profile')}>
              <User size={18} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {['suggest', 'chat', 'vibe'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                if (tab === 'vibe') {
                  const now = new Date();
                  if (now < TARGET_DATE) {
                    setShowTimerModal(true);
                    return;
                  }
                }
                setActiveTab(tab as any);
              }}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              {tab === 'suggest' && <Sparkles size={12} color={activeTab === tab ? 'white' : '#6B7280'} />}
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'vibe' ? 'My Vibe' : tab === 'chat' ? 'Chat' : 'Suggest'}
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
          {activeTab === 'vibe' && <MyVibeTab
            matches={vibeMatches}
            viewMode={vibeViewMode}
            setViewMode={setVibeViewMode}
            onSelect={(match) => {
              setCurrentMatch({
                _id: match._id,
                fullName: match.fullName,
                profileImage: match.profileImage,
                likeId: match.likeId,
                interests: []
              });
              setActiveTab('chat');
            }}
          />}
          {activeTab === 'chat' && (
            <ChatTab
              currentMatch={currentMatch}
              receivedLikes={receivedLikes}
              onRefreshLikes={fetchReceivedLikes}
              coins={coins}
              setCoins={setCoins}
              chatSlots={chatSlots}
              activeChatCount={activeChatCount}
              onUnlockSlots={handleBuyChatSlot}
              onUnmatch={handleUnmatch}
              unlimitedCoinsExpiry={unlimitedCoinsExpiry}
              countdownText={countdownText}
              logFeatureUse={logFeatureUse}
            />
          )}
          {activeTab === 'suggest' && (
            <SuggestTab
              suggestions={recommendations}
              onSelect={setSelectedProfile}
              likesCount={likesCount}
              onSendLike={handleSendLike}
              onBuyLikes={handleBuyLikes}
              onSwitchVibe={handleSwitchVibe}
              nextRegenTime={nextRegenTime}
              logFeatureUse={logFeatureUse}
            />
          )}
        </ScrollView>
      </View>


      {/* Profile Preview Modal */}
      {selectedProfile && (
        <ProfilePreviewModal
          profile={selectedProfile}
          coins={coins}
          chatSlots={chatSlots}
          activeChatCount={activeChatCount}
          onClose={() => setSelectedProfile(null)}
          onSwitch={() => handleSwitchVibe(selectedProfile)}
        />
      )}

      {/* Coin Shop Modal */}
      {showShop && (
        <CoinShopModal
          coins={coins}
          countdownText={countdownText}
          onClose={() => setShowShop(false)}
          onBuy={handleBuyPacket}
        />
      )}

      {/* Blind Dating Modal */}
      <BlindDatingModal
        visible={showBlindDating}
        onClose={() => setShowBlindDating(false)}
        coins={coins}
        onCoinsChange={setCoins}
      />


    </View>
  );
}

const MyVibeTab = ({ matches, viewMode, setViewMode, onSelect }: {
  matches: any[],
  viewMode: 'grid' | 'list',
  setViewMode: (m: 'grid' | 'list') => void,
  onSelect: (m: any) => void
}) => {
  if (!matches || matches.length === 0) return <EmptyState icon={Heart} title="No active vibes" subtitle="Suggest someone to find a match!" />;

  return (
    <Animated.View entering={FadeIn} style={styles.vibeListContainer} key={viewMode}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={styles.vibeSectionTitle}>Your Mutual Matches ({matches.length})</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]}
            onPress={() => setViewMode('grid')}
          >
            <Sparkles size={14} color={viewMode === 'grid' ? 'white' : '#6B7280'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <MessageCircle size={14} color={viewMode === 'list' ? 'white' : '#6B7280'} />
          </TouchableOpacity>
        </View>
      </View>

      {viewMode === 'grid' ? (
        <View style={styles.vibeGrid}>
          {matches.map((match) => (
            <TouchableOpacity
              key={match.likeId}
              style={styles.vibeListItem}
              onPress={() => onSelect({ _id: match.partnerId, fullName: match.partnerName, profileImage: match.partnerImage, likeId: match.likeId })}
            >
              <View style={[styles.vibeAvatarContainer, match.isBlindMatch && { borderColor: '#8B5CF6' }]}>
                <Image source={getAvatarSource(match.partnerImage)} style={styles.vibeAvatar} />
                {match.isBlindMatch && (
                  <View style={styles.blindIndicator}>
                    <Sparkles size={10} color="white" />
                  </View>
                )}
                <View style={styles.activeVibeBadge} />
              </View>
              <Text style={styles.vibePartnerName} numberOfLines={1}>{match.partnerName}</Text>
              <Text style={styles.vibeTime}>{new Date(match.lastMessageTime).toLocaleDateString()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {matches.map((match) => (
            <TouchableOpacity
              key={match.likeId}
              style={styles.vibeListRow}
              onPress={() => onSelect({ _id: match.partnerId, fullName: match.partnerName, profileImage: match.partnerImage, likeId: match.likeId })}
            >
              <View style={[styles.vibeRowAvatarContainer, match.isBlindMatch && { borderColor: '#8B5CF6' }]}>
                <Image source={getAvatarSource(match.partnerImage)} style={styles.vibeRowAvatar} />
                {match.isBlindMatch && (
                  <View style={styles.blindIndicatorRow}>
                    <Sparkles size={8} color="white" />
                  </View>
                )}
              </View>
              <View style={styles.vibeRowInfo}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.vibeRowName}>{match.partnerName}</Text>
                  <Text style={styles.vibeRowTime}>{new Date(match.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Text style={styles.vibeRowMsg} numberOfLines={1}>{match.lastMessageText}</Text>
              </View>
              {match.unreadCount > 0 && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </Animated.View>
  );
};

const ChatTab = ({
  currentMatch,
  receivedLikes,
  onRefreshLikes,
  coins,
  setCoins,
  chatSlots,
  activeChatCount,
  onUnlockSlots,
  onUnmatch,
  unlimitedCoinsExpiry,
  countdownText,
  logFeatureUse
}: {
  currentMatch: Match | null;
  receivedLikes: any[];
  onRefreshLikes: () => void | Promise<void>;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  chatSlots: number;
  activeChatCount: number;
  onUnlockSlots: () => void;
  onUnmatch: (likeId: string) => void;
  unlimitedCoinsExpiry: Date | null;
  countdownText: string | null;
  logFeatureUse: (name: string, details?: any) => void;
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedLike, setSelectedLike] = useState<any>(null);

  useEffect(() => {
    loadUser();
    if (currentMatch) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [currentMatch]);

  const loadUser = async () => {
    const userInfo = await require('@react-native-async-storage/async-storage').default.getItem('userInfo');
    if (userInfo) {
      const user = JSON.parse(userInfo);
      setCurrentUserId(user.id || user._id);
    }
  };

  const fetchMessages = async () => {
    if (!currentMatch || !currentMatch._id) return;
    try {
      const res = await authAPI.getMessages(currentMatch._id);
      setMessages(res.data);
      // Mark as read
      if (res.data.some((m: any) => !m.read && m.sender !== currentUserId)) {
        await authAPI.markMessagesRead(currentMatch._id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !currentMatch) return;
    try {
      await authAPI.sendMessage(currentMatch._id, inputText);
      setInputText('');
      fetchMessages();
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleReveal = async (like: any) => {
    const isUnlimited = unlimitedCoinsExpiry && new Date(unlimitedCoinsExpiry) > new Date();

    if (!isUnlimited && coins < 70) {
      Alert.alert('Not Enough Coins', 'You need 70 coins to reveal this profile.');
      return;
    }

    Alert.alert(
      isUnlimited ? 'Unlimited Plan' : 'Reveal Profile',
      isUnlimited ? 'You have an active unlimited plan. Reveal this profile for free?' : 'Reveal who liked you for 70 coins?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reveal',
          onPress: async () => {
            try {
              const res = await authAPI.revealProfile(like._id);
              if (res.data?.success) {
                logFeatureUse('reveal_profile', { from: 'chat_tab' });
                if (!isUnlimited) setCoins(res.data.coins);
                onRefreshLikes();
                Alert.alert('Revealed!', 'You can now see who liked you.');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reveal');
            }
          }
        }
      ]
    );
  };

  const handleStartChat = async (like: any) => {
    if (activeChatCount >= chatSlots) {
      Alert.alert(
        'No Chat Slots',
        'Buy more chat slots to continue matching.',
        [{ text: 'Buy Slot', onPress: onUnlockSlots }, { text: 'Cancel', style: 'cancel' }]
      );
      return;
    }

    const isUnlimited = unlimitedCoinsExpiry && new Date(unlimitedCoinsExpiry) > new Date();

    if (!isUnlimited && coins < 100) {
      Alert.alert('Not Enough Coins', 'You need 100 coins to start a chat.');
      return;
    }

    Alert.alert(
      isUnlimited ? 'Unlimited Plan' : 'Start Chat',
      isUnlimited ? 'You have an active unlimited plan. Start chat for free?' : 'Spend 100 coins to start this chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            try {
              const res = await authAPI.startChatFromLike(like._id);
              if (res.data?.success) {
                logFeatureUse('start_chat', { type: 'match' });
                if (!isUnlimited) setCoins(res.data.coins);
                onRefreshLikes();
                Alert.alert('Chat Started!', 'You can now message each other.');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to start chat');
            }
          }
        }
      ]
    );
  };

  const handleDirectChat = async (like: any) => {
    if (activeChatCount >= chatSlots) {
      Alert.alert(
        'No Chat Slots',
        'Buy more chat slots to start a new chat.',
        [{ text: 'Buy Slot', onPress: onUnlockSlots }, { text: 'Cancel', style: 'cancel' }]
      );
      return;
    }

    const isUnlimited = unlimitedCoinsExpiry && new Date(unlimitedCoinsExpiry) > new Date();

    if (!isUnlimited && coins < 150) {
      Alert.alert('Not Enough Coins', 'You need 150 coins for direct chat.');
      return;
    }

    Alert.alert(
      isUnlimited ? 'Unlimited Plan' : 'Direct Chat',
      isUnlimited ? 'You have an active unlimited plan. Direct chat for free?' : 'Spend 150 coins for immediate direct chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            try {
              const res = await authAPI.directChat(like._id);
              if (res.data?.success) {
                if (!isUnlimited) setCoins(res.data.coins);
                onRefreshLikes();
                Alert.alert('Success!', 'Profile revealed and chat started!');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed');
            }
          }
        }
      ]
    );
  };

  const handleSkip = async (like: any) => {
    try {
      await authAPI.declineLike(like._id);
      setSelectedLike(null);
      onRefreshLikes();
    } catch (error) {
      console.error('Error skipping like:', error);
    }
  };

  const handleDeleteChat = () => {
    if (!currentMatch) return;
    Alert.alert(
      "Delete Conversation?",
      "This will permanently delete all messages and free up your chat slot.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await authAPI.deleteConversation(currentMatch._id);
              onUnmatch(currentMatch.likeId || '');
              Alert.alert("Deleted", "Conversation deleted.");
            } catch (error) {
              Alert.alert("Error", "Failed to delete conversation");
            }
          }
        }
      ]
    );
  };

  const handleReport = () => {
    if (!currentMatch) return;
    Alert.prompt(
      "Report User",
      "Why are you reporting this user?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          onPress: async (reason?: string) => {
            if (!reason || !currentMatch) return;
            try {
              await authAPI.reportUser(currentMatch._id, reason);
              Alert.alert("Reported", "Thank you for reporting. Our team will investigate.");
            } catch (error) {
              Alert.alert("Error", "Failed to submit report");
            }
          }
        }
      ]
    );
  };

  const handleBlock = () => {
    if (!currentMatch) return;
    Alert.alert(
      "Block User?",
      "You won't see this user again and they won't be able to message you.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              await authAPI.blockUser(currentMatch._id);
              onUnmatch(currentMatch.likeId || '');
              Alert.alert("Blocked", "User blocked successfully.");
            } catch (error) {
              Alert.alert("Error", "Failed to block user");
            }
          }
        }
      ]
    );
  };

  // Show received likes section
  const pendingLikes = receivedLikes.filter(l => l.status === 'pending');
  const revealedLikes = receivedLikes.filter(l => l.status === 'revealed');

  return (
    <View style={styles.chatContainer}>
      {/* Slot Allocation Indicator */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>Messages</Text>
        <View style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#4B5563' }}>
            Slots: {activeChatCount} / {chatSlots} Used
          </Text>
        </View>
      </View>

      {/* Received Likes Section */}
      {(pendingLikes.length > 0 || revealedLikes.length > 0) && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 12 }}>
            {pendingLikes.length + revealedLikes.length} people liked you ❤️
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {pendingLikes.map((like) => (
              <TouchableOpacity
                key={like._id}
                style={{ marginRight: 12, width: 100, alignItems: 'center' }}
                onPress={() => setSelectedLike(like)}
              >
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#E5E7EB', overflow: 'hidden', borderWidth: 2, borderColor: PINK }}>
                  <Image source={getAvatarSource(like.sender?.datingPhotos?.[0])} style={{ width: 80, height: 80 }} blurRadius={30} />
                  <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                    <Heart size={24} color="white" fill="white" />
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Mystery</Text>
              </TouchableOpacity>
            ))}
            {revealedLikes.map((like) => (
              <TouchableOpacity
                key={like._id}
                style={{ marginRight: 12, width: 100, alignItems: 'center' }}
                onPress={() => setSelectedLike(like)}
              >
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#E5E7EB', overflow: 'hidden', borderWidth: 2, borderColor: '#10B981' }}>
                  <Image source={getAvatarSource(like.sender?.datingPhotos?.[0] || like.sender?.profileImage)} style={{ width: 80, height: 80 }} />
                </View>
                <Text style={{ fontSize: 12, color: '#111827', marginTop: 4 }}>{like.sender?.fullName?.split(' ')[0] || 'User'}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Like Action Modal */}
      {selectedLike && (
        <View style={styles.modalOverlay}>
          <Animated.View entering={SlideInUp} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedLike.status === 'pending' ? 'Someone Liked You!' : 'Start Chat?'}</Text>
              <TouchableOpacity onPress={() => setSelectedLike(null)}><X size={24} color="black" /></TouchableOpacity>
            </View>

            {selectedLike.status === 'pending' ? (
              <>
                <View style={{ alignItems: 'center', marginVertical: 20 }}>
                  <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: '#E5E7EB', overflow: 'hidden' }}>
                    <Image source={getAvatarSource(selectedLike.sender?.datingPhotos?.[0])} style={{ width: 120, height: 120 }} blurRadius={30} />
                    <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
                      <Heart size={32} color="white" fill="white" />
                    </View>
                  </View>
                  {selectedLike.sender?.datingInterests?.slice(0, 3).map((i: string) => (
                    <Text key={i} style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>• {i}</Text>
                  ))}
                </View>
                <TouchableOpacity style={[styles.switchButton, { marginBottom: 8 }]} onPress={() => handleReveal(selectedLike)}>
                  <Text style={styles.switchButtonText}>👁 Reveal Profile (70 coins)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.switchButton, { backgroundColor: PINK }]} onPress={() => handleDirectChat(selectedLike)}>
                  <Text style={[styles.switchButtonText, { color: 'white' }]}>💬 Direct Chat (150 coins)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ marginTop: 12, paddingVertical: 8, alignItems: 'center' }}
                  onPress={() => handleSkip(selectedLike)}
                >
                  <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>Not interested / Skip</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={{ alignItems: 'center', marginVertical: 20 }}>
                  <Image source={getAvatarSource(selectedLike.sender?.datingPhotos?.[0] || selectedLike.sender?.profileImage)} style={{ width: 120, height: 120, borderRadius: 60 }} />
                  <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 12 }}>{selectedLike.sender?.fullName || 'User'}</Text>
                </View>
                <TouchableOpacity style={[styles.switchButton, { backgroundColor: PINK }]} onPress={() => handleStartChat(selectedLike)}>
                  <Text style={[styles.switchButtonText, { color: 'white' }]}>💬 Start Chat (100 coins)</Text>
                </TouchableOpacity>
              </>
            )}
            <Text style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 12 }}>Slots: {chatSlots - activeChatCount} available</Text>
          </Animated.View>
        </View>
      )}

      {/* Current Chat */}
      {currentMatch ? (
        <>
          <View style={styles.chatHeader}>
            <Image source={getAvatarSource(currentMatch.profileImage)} style={styles.chatAvatar} />
            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatName}>{currentMatch.fullName || 'User'}</Text>
              <Text style={styles.activeStatus}>Active now</Text>
            </View>
            <TouchableOpacity
              style={{ padding: 8 }}
              onPress={() => {
                Alert.alert(
                  "Safety & Controls",
                  "What would you like to do?",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Report User", style: "default", onPress: handleReport },
                    { text: "Block User", style: "destructive", onPress: handleBlock },
                    { text: "Delete Chat", style: "destructive", onPress: handleDeleteChat },
                  ]
                )
              }}
            >
              <ShieldAlert size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.messagesScroll} contentContainerStyle={styles.messagesContainer}>
            {messages.map((msg, index) => {
              const isMe = msg.sender === currentUserId;
              return (
                <View key={index} style={{ alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                  <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                    <Text style={[styles.messageText, isMe && { color: 'white' }]}>{msg.text}</Text>
                  </View>
                  {isMe && (
                    <Text style={{ fontSize: 10, color: '#9CA3AF', marginRight: 4, marginTop: 2 }}>
                      {msg.read ? 'Read' : 'Sent'}
                    </Text>
                  )}
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
        </>
      ) : (
        !pendingLikes.length && !revealedLikes.length && (
          <EmptyState icon={MessageCircle} title="Start Chatting" subtitle="Match with someone to chat" />
        )
      )
      }
    </View >
  );
};

const SWIPE_THRESHOLD = width * 0.25;
const PINK = '#EC4899';

// Swipeable Profile Card Component
const SwipeableProfileCard = ({
  profile,
  onSwipeLeft,
  onSwipeRight,
  isTopCard
}: {
  profile: Match;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTopCard: boolean;
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);

  const handleSwipeLeft = useCallback(() => {
    onSwipeLeft();
  }, [onSwipeLeft]);

  const handleSwipeRight = useCallback(() => {
    onSwipeRight();
  }, [onSwipeRight]);

  const panGesture = Gesture.Pan()
    .enabled(isTopCard)
    .activeOffsetX([-20, 20]) // Only activate when moving horizontally by 20px
    .failOffsetY([-10, 10]) // Fail (allow scroll) when moving vertically by 10px
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.3; // Reduced vertical movement
      rotation.value = interpolate(
        event.translationX,
        [-width, 0, width],
        [-15, 0, 15],
        Extrapolation.CLAMP
      );
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        // Swipe Right - Like
        translateX.value = withTiming(width * 1.5, { duration: 300 }, () => {
          runOnJS(handleSwipeRight)();
        });
        rotation.value = withTiming(20, { duration: 300 });
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        // Swipe Left - Pass
        translateX.value = withTiming(-width * 1.5, { duration: 300 }, () => {
          runOnJS(handleSwipeLeft)();
        });
        rotation.value = withTiming(-20, { duration: 300 });
      } else {
        // Return to center
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
        rotation.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  // Get photos - use datingPhotos if available, fallback to profileImage
  const photos = profile.datingPhotos?.length ? profile.datingPhotos :
    profile.profileImage ? [profile.profileImage] : [];
  const heroPhoto = photos[0];
  // Show first initial + age in discover view (e.g., "A, 21")
  const firstName = profile.fullName?.split(' ')[0] || profile.username || 'Anonymous';
  const userAge = profile.datingAge || profile.age;
  const displayName = `${firstName.charAt(0)}${userAge ? `, ${userAge}` : ''}`;
  const bio = profile.datingBio || profile.bio || '';
  const interests = profile.datingInterests?.length ? profile.datingInterests : (profile.interests || []);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.swipeCard, cardStyle]}>
        <ScrollView
          style={styles.swipeCardScroll}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={true}
          scrollEnabled={isTopCard}
          bounces={true}
          nestedScrollEnabled={true}
          scrollEventThrottle={16}
        >
          {/* Hero Photo */}
          <View style={styles.heroPhotoContainer}>
            {heroPhoto ? (
              <Image source={{ uri: heroPhoto }} style={styles.heroPhoto} />
            ) : (
              <View style={[styles.heroPhoto, { backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }]}>
                <User size={60} color="#9CA3AF" />
              </View>
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.heroGradient}
            />

            {/* Like/Nope badges */}
            <Animated.View style={[styles.likeBadge, likeOpacity]}>
              <Text style={styles.likeBadgeText}>LIKE</Text>
            </Animated.View>
            <Animated.View style={[styles.nopeBadge, nopeOpacity]}>
              <Text style={styles.nopeBadgeText}>NOPE</Text>
            </Animated.View>

            <View style={styles.heroInfo}>
              <Text style={styles.heroNameText}>{displayName}</Text>
              <View style={styles.heroDetailsRow}>
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
          </View>

          {/* Intentions Prompt */}
          {profile.datingIntentions && profile.datingIntentions.length > 0 && (
            <View style={styles.promptCard}>
              <Text style={styles.promptQuestion}>I'M LOOKING FOR...</Text>
              <Text style={styles.promptAnswer}>{profile.datingIntentions.join(', ')}</Text>
            </View>
          )}

          {/* Additional Photos */}
          {photos.slice(1, 3).map((photo, index) => (
            <View key={index} style={styles.additionalPhotoContainer}>
              <Image source={{ uri: photo }} style={styles.additionalPhoto} />
            </View>
          ))}

          {/* Bio Prompt */}
          {bio && (
            <View style={styles.promptCard}>
              <Text style={styles.promptQuestion}>ABOUT ME</Text>
              <Text style={styles.promptAnswer}>{bio}</Text>
            </View>
          )}

          {/* Interests */}
          {interests.length > 0 && (
            <View style={styles.promptCard}>
              <Text style={styles.promptQuestion}>MY INTERESTS</Text>
              <View style={styles.interestPills}>
                {interests.map((interest, i) => (
                  <View key={i} style={styles.interestPill}>
                    <Text style={styles.interestPillText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Details Section */}
          <View style={styles.detailsSection}>
            <Text style={styles.promptQuestion}>DETAILS</Text>
            <View style={styles.detailsPillsContainer}>
              {profile.datingHometown && (
                <View style={styles.detailPill}>
                  <MapPin size={14} color="#6B7280" />
                  <Text style={styles.detailPillText}>{profile.datingHometown}</Text>
                </View>
              )}
              {(profile.datingCollege || profile.college) && (
                <View style={styles.detailPill}>
                  <GraduationCap size={14} color="#6B7280" />
                  <Text style={styles.detailPillText}>{profile.datingCollege || profile.college}</Text>
                </View>
              )}
              {profile.datingCourse && (
                <View style={styles.detailPill}>
                  <BookOpen size={14} color="#6B7280" />
                  <Text style={styles.detailPillText}>{profile.datingCourse}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </Animated.View>
    </GestureDetector>
  );
};

const SuggestTab = ({
  suggestions,
  onSelect,
  likesCount,
  onSendLike,
  onBuyLikes,
  onSwitchVibe,
  nextRegenTime,
  logFeatureUse
}: {
  suggestions: Match[],
  onSelect: (m: Match) => void,
  likesCount: number,
  onSendLike: (targetUser: Match) => void,
  onBuyLikes: () => void,
  onSwitchVibe: (m: Match) => void,
  nextRegenTime: Date | null,
  logFeatureUse: (name: string, details?: any) => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipeRight = useCallback(() => {
    const profile = suggestions[currentIndex];
    if (profile) {
      onSendLike(profile);
    }
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex, suggestions, onSendLike]);

  const handleSwipeLeft = useCallback(() => {
    const profile = suggestions[currentIndex];
    // Optional: Call backend to "pass"
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex, suggestions]);

  const handleStarAction = () => {
    const profile = suggestions[currentIndex];
    if (profile) {
      onSwitchVibe(profile);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const currentProfile = suggestions[currentIndex];
  const nextProfile = suggestions[currentIndex + 1];

  if (!currentProfile) {
    return <EmptyState icon={Sparkles} title="No more suggestions" subtitle="Check back later for more vibes!" />;
  }

  const getTimeUntilRegen = () => {
    if (!nextRegenTime) return null;
    const diff = nextRegenTime.getTime() - new Date().getTime();
    if (diff <= 0) return '0h 0m';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const regenText = getTimeUntilRegen();

  return (
    <View style={styles.suggestContainer}>
      {/* Likes Count Header */}
      <View style={styles.suggestHeader}>
        <View style={styles.likesBadgeContainer}>
          <View style={styles.likesBadge}>
            <Heart size={14} color="#F43F5E" fill="#F43F5E" />
            <Text style={styles.likesBadgeText}>{likesCount} Likes Available</Text>
          </View>
          {likesCount < 10 && regenText && (
            <Text style={styles.regenTimerText}>Next refresh in {regenText}</Text>
          )}
        </View>
        <TouchableOpacity onPress={onBuyLikes} style={styles.buyLikesBtn}>
          <Text style={styles.buyLikesBtnText}>Get More</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardsContainer}>
        {/* Next card (behind) */}
        {nextProfile && (
          <View style={[styles.swipeCard, styles.nextCard]}>
            <View style={styles.heroPhotoContainer}>
              <Image
                source={getAvatarSource(nextProfile.datingPhotos?.[0] || nextProfile.profileImage)}
                style={styles.heroPhoto}
              />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.heroGradient} />
            </View>
          </View>
        )}

        {/* Current card (top) */}
        <SwipeableProfileCard
          key={currentProfile._id}
          profile={currentProfile}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          isTopCard={true}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.rejectBtn} onPress={handleSwipeLeft}>
          <X size={28} color="#EF4444" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.starBtn} onPress={handleStarAction}>
          <Sparkles size={32} color="white" fill="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.likeBtn} onPress={handleSwipeRight}>
          <Heart size={28} color="#10B981" fill="#10B981" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const OutofLikesModal = ({ visible, coins, onClose, onBuy, nextRegenTime }: any) => {
  const isLowBalance = coins < 100;

  const getTimeUntilRegen = () => {
    if (!nextRegenTime) return "24h";
    const diff = nextRegenTime.getTime() - new Date().getTime();
    if (diff <= 0) return "0h";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Animated.View entering={SlideInUp} style={[styles.modalContent, { paddingBottom: 40 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Out of Likes!</Text>
            <TouchableOpacity onPress={onClose}><X size={24} color="black" /></TouchableOpacity>
          </View>

          <View style={{ alignItems: 'center', marginVertical: 24 }}>
            <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFF1F2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Heart size={48} color="#F43F5E" fill="#F43F5E" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', textAlign: 'center' }}>You've used all your likes</Text>
            <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 }}>
              Don't miss out on a potential match. Your daily likes will refresh in <Text style={{ color: '#F43F5E', fontWeight: 'bold' }}>{getTimeUntilRegen()}</Text>.
            </Text>
          </View>

          <TouchableOpacity
            onPress={onBuy}
            disabled={isLowBalance}
            style={[styles.switchButton, { backgroundColor: '#F43F5E' }, isLowBalance && styles.switchButtonDisabled]}
          >
            <Text style={[styles.switchButtonText, { color: 'white' }]}>Get 5 More Likes (100 Coins)</Text>
          </TouchableOpacity>

          {isLowBalance && (
            <Text style={styles.lowBalanceText}>Not enough coins! Visit the shop.</Text>
          )}

          <TouchableOpacity onPress={onClose} style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={{ color: '#6B7280', fontSize: 14, fontWeight: '500' }}>Maybe later</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const EmptyState = ({ icon: Icon, title, subtitle }: any) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIcon}><Icon size={40} color="#D1D5DB" /></View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySubtitle}>{subtitle}</Text>
  </View>
);

const ProfilePreviewModal = ({ profile, coins, chatSlots, activeChatCount, onClose, onSwitch }: any) => {
  const isSlotFull = activeChatCount >= chatSlots;
  const isLowBalance = coins < 100;

  return (
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

          <TouchableOpacity
            onPress={onSwitch}
            disabled={isLowBalance || isSlotFull}
            style={[styles.switchButton, (isLowBalance || isSlotFull) && styles.switchButtonDisabled]}
          >
            <Text style={styles.switchButtonText}>
              {isSlotFull ? 'No Chat Slots Available' : 'Switch My Vibe (100 coins)'}
            </Text>
          </TouchableOpacity>
          {isLowBalance && !isSlotFull && <Text style={styles.lowBalanceText}>Low balance! Need {100 - coins} more.</Text>}
          {isSlotFull && <Text style={styles.lowBalanceText}>Buy more chat slots to switch.</Text>}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const CoinShopModal = ({ coins, countdownText, onClose, onBuy }: any) => {
  const packages = [
    { amount: 150, price: 19, popular: false, packType: 'coins' },
    { amount: 600, price: 49, popular: true, packType: 'coins' },
    { amount: 'Unlimited', price: 299, popular: false, packType: 'unlimited', subtitle: '7 Days Access' },
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
          <Text style={styles.coinBalanceLabel}>{countdownText ? 'Unlimited Access' : 'Current Balance'}</Text>
          <Text style={[styles.coinBalanceValue, countdownText && { color: '#8B5CF6' }]}>
            {countdownText || `${coins} Coins`}
          </Text>
          {countdownText && (
            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Expiry: {countdownText}</Text>
          )}
        </View>

        <Text style={styles.shopSectionTitle}>Buy Coins</Text>

        <View style={styles.shopGrid}>
          {packages.map((pkg, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => onBuy(typeof pkg.amount === 'number' ? pkg.amount : 0, pkg.price, pkg.packType)}
              style={[styles.shopCard, pkg.popular && styles.shopCardPopular]}
            >
              {pkg.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Best Value</Text>
                </View>
              )}
              {pkg.packType === 'unlimited' ? (
                <Sparkles size={32} color="#8B5CF6" style={{ marginBottom: 12 }} />
              ) : (
                <Coins size={32} color="#F59E0B" style={{ marginBottom: 12 }} />
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.shopAmount}>{pkg.amount}{pkg.packType === 'coins' ? ' Coins' : ''}</Text>
                {pkg.subtitle && <Text style={{ fontSize: 12, color: '#6B7280' }}>{pkg.subtitle}</Text>}
              </View>
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
  blindButton: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#8B5CF6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  blindButtonText: { fontWeight: 'bold', fontSize: 12, color: 'white' },
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

  // Discover Tab - Swipe Cards
  discoverContainer: { flex: 1 },
  discoverHint: { textAlign: 'center', color: '#6B7280', fontSize: 13, marginBottom: 16 },
  cardsContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', height: width * 1.3, position: 'relative' },
  swipeCard: { position: 'absolute', width: width - 32, maxWidth: 400, backgroundColor: 'white', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8, overflow: 'hidden' },
  swipeCardScroll: { maxHeight: width * 1.3 },
  nextCard: { transform: [{ scale: 0.95 }], opacity: 0.7, zIndex: -1 },
  heroPhotoContainer: { width: '100%', aspectRatio: 0.8, position: 'relative' },
  heroPhoto: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' },
  heroInfo: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  heroNameText: { fontSize: 26, fontWeight: 'bold', color: 'white', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  heroDetailsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  heroBadgeText: { color: 'white', fontSize: 12, fontWeight: '500' },
  likeBadge: { position: 'absolute', top: 40, left: 20, borderWidth: 3, borderColor: '#10B981', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, transform: [{ rotate: '-15deg' }] },
  likeBadgeText: { color: '#10B981', fontSize: 24, fontWeight: 'bold' },
  nopeBadge: { position: 'absolute', top: 40, right: 20, borderWidth: 3, borderColor: '#EF4444', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, transform: [{ rotate: '15deg' }] },
  nopeBadgeText: { color: '#EF4444', fontSize: 24, fontWeight: 'bold' },
  promptCard: { backgroundColor: 'white', margin: 12, marginTop: 0, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  promptQuestion: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
  promptAnswer: { fontSize: 16, color: '#111827', fontWeight: '500', lineHeight: 24 },
  additionalPhotoContainer: { margin: 12, marginTop: 0, borderRadius: 16, overflow: 'hidden' },
  additionalPhoto: { width: '100%', aspectRatio: 0.85 },
  interestPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestPill: { backgroundColor: '#EC4899', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  interestPillText: { color: 'white', fontSize: 13, fontWeight: '500' },
  detailsSection: { backgroundColor: 'white', margin: 12, marginTop: 0, padding: 16, borderRadius: 16 },
  detailsPillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  detailPillText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  actionButtons: { flexDirection: 'row', justifyContent: 'center', gap: 24, paddingVertical: 16 },
  passButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, borderWidth: 2, borderColor: '#FEE2E2' },
  likeButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, borderWidth: 2, borderColor: '#D1FAE5' },
  // Old grid styles (kept for backward compatibility)
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

  // New Vibe Tab Styles
  vibeListContainer: { flex: 1, padding: 4 },
  vibeSectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
  vibeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  vibeListItem: { width: (width - 60) / 3, alignItems: 'center', marginBottom: 20 },
  vibeAvatarContainer: { width: 80, height: 80, borderRadius: 40, position: 'relative', marginBottom: 8, borderWidth: 2, borderColor: LIME },
  vibeAvatar: { width: '100%', height: '100%', borderRadius: 40 },
  activeVibeBadge: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: LIME, borderWidth: 2, borderColor: 'white' },
  vibePartnerName: { fontSize: 13, fontWeight: '600', color: '#111827', textAlign: 'center' },
  vibeTime: { fontSize: 11, color: '#9CA3AF' },

  // New Suggest Tab Styles
  suggestContainer: { flex: 1 },
  suggestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  likesBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF1F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  likesBadgeText: { color: '#F43F5E', fontSize: 12, fontWeight: '700' },
  likesBadgeContainer: { gap: 4 },
  regenTimerText: { fontSize: 10, color: '#9CA3AF', marginLeft: 4 },
  buyLikesBtn: { backgroundColor: '#F43F5E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  buyLikesBtnText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  rejectBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, borderWidth: 1, borderColor: '#FEE2E2' },
  starBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8, marginTop: -10 },
  likeBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, borderWidth: 1, borderColor: '#DCFCE7' },

  // Vibe Toggle
  viewToggle: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 10, padding: 4 },
  toggleBtn: { padding: 6, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: '#8B5CF6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },

  // Blind Indicators
  blindIndicator: { position: 'absolute', top: -4, left: -4, backgroundColor: '#8B5CF6', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' },
  blindIndicatorRow: { position: 'absolute', top: -2, left: -2, backgroundColor: '#8B5CF6', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'white' },

  // List View Styles
  vibeListRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  vibeRowAvatarContainer: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: LIME, padding: 2 },
  vibeRowAvatar: { width: '100%', height: '100%', borderRadius: 28 },
  vibeRowInfo: { flex: 1, marginLeft: 16 },
  vibeRowName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  vibeRowTime: { fontSize: 11, color: '#9CA3AF' },
  vibeRowMsg: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#8B5CF6', marginLeft: 8 },
});
