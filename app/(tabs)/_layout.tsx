import { Tabs, useRouter, usePathname } from 'expo-router';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Platform, Image, Alert, Modal, Pressable } from 'react-native';
import { Home, Calendar, Users, User, Heart, Search, PlusCircle, MessageSquare, Repeat, LayoutGrid, PlusSquare, Menu, X, MessageCircle, LogOut, Clock, Sparkles } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RELEASE_TIME = new Date('2026-01-31T10:00:00+05:30').getTime();

const LIME = '#D4FF00';
const PINK = '#EC4899';
const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isDesktop = width >= 1024; // Instagram breakpoint

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [isDatingMode, setIsDatingMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [showComingSoon, setShowComingSoon] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const info = await AsyncStorage.getItem('userInfo');
        if (info) {
          const user = JSON.parse(info);
          setIsAdmin(!!user.isAdmin);
        }
      } catch (e) {
        console.error('Error checking admin status');
      }
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const diff = RELEASE_TIME - now;

      if (diff <= 0) {
        setCountdown('');
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(`${h}h ${m}m ${s}s`);
    };

    updateCountdown();
    timerRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Sync mode with current path
  useEffect(() => {
    if (pathname && pathname.includes('/dating')) {
      setIsDatingMode(true);
    } else if (pathname && !pathname.includes('/dating') && pathname !== '') {
      if (isDatingMode) setIsDatingMode(false);
    }
  }, [pathname]);

  const handleModeSwitch = () => {
    const now = Date.now();
    const isReleased = now >= RELEASE_TIME;

    if (isDatingMode) {
      setIsDatingMode(false);
      router.push('/(tabs)');
      return;
    }

    if (isAdmin || isReleased) {
      setIsDatingMode(true);
      router.push('/(tabs)/dating');
    } else {
      setShowComingSoon(true);
    }
  };

  const accentColor = isDatingMode ? PINK : LIME;

  // Web Sidebar Component
  const WebSidebar = () => (
    <View style={styles.webSidebar}>
      <TouchableOpacity style={styles.sidebarLogo} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.sidebarVybText}>Vyb</Text>
      </TouchableOpacity>

      <View style={styles.sidebarMenu}>
        <SidebarLink icon={Home} label="Home" path="/(tabs)" active={pathname === '/' || pathname === '/index'} colors={accentColor} />
        <SidebarLink icon={Search} label="Search" path="/(tabs)/people" active={pathname === '/people'} colors={accentColor} />
        <SidebarLink icon={PlusSquare} label="Create" path="/create-post" active={pathname === '/create-post'} colors={accentColor} />
        <SidebarLink icon={Calendar} label="Events" path="/(tabs)/events" active={pathname === '/events'} colors={accentColor} />
        {/* Dating removed from here, handled by switch */}
        <SidebarLink icon={User} label="Profile" path="/(tabs)/profile" active={pathname === '/profile'} colors={accentColor} />
      </View>

      <View style={styles.sidebarFooter}>
        <TouchableOpacity style={styles.sidebarItem} onPress={handleModeSwitch}>
          {isDatingMode ? <Users size={24} color="black" /> : <Repeat size={24} color="black" />}
          <Text style={[styles.sidebarLinkText, { display: width < 1264 ? 'none' : 'flex' }]}>
            {isDatingMode ? 'Social Mode' : 'Swap Vyb'}
          </Text>
        </TouchableOpacity>
        {/* More button removed to match mobile */}
      </View>
    </View>
  );

  const SidebarLink = ({ icon: Icon, label, path, active, colors }: any) => (
    <TouchableOpacity
      style={styles.sidebarItem}
      onPress={() => path && router.push(path)}
    >
      <Icon
        size={28}
        color={active ? 'black' : 'black'}
        strokeWidth={active ? 3 : 2}
      />
      <Text style={[
        styles.sidebarLinkText,
        active && styles.sidebarLinkActive,
        { display: width < 1264 ? 'none' : 'flex' } // Hide labels on smaller desktop screens (tablet-like)
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {!isDesktop && pathname !== '/' && pathname !== '/(tabs)' && pathname !== '/(tabs)/index' && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.logoContainer} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.headerVybText}>Vyb</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleModeSwitch}
            style={[styles.modeToggle, { backgroundColor: isDatingMode ? LIME : PINK }]}
          >
            {isDatingMode ? (
              <>
                <Users size={14} color="black" />
                <Text style={styles.modeTextBlack}>Social</Text>
              </>
            ) : (
              <>
                <Repeat size={14} color="white" />
                <Text style={styles.modeTextWhite}>Swap Vyb</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Main Layout Container */}
      <View style={styles.mainLayout}>
        {/* Left Sidebar (Desktop Only) */}
        {isDesktop && <WebSidebar />}

        {/* Content Area */}
        <View style={styles.contentArea}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: isDesktop ? styles.tabBarHidden : styles.tabBar,
              tabBarActiveTintColor: 'black',
              tabBarInactiveTintColor: '#D1D5DB',
              tabBarLabelStyle: styles.tabBarLabel,
              tabBarShowLabel: false,
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: 'Home',
                tabBarIcon: ({ color, size, focused }) => <Home size={24} color={color} strokeWidth={focused ? 3 : 2} />,
                href: isDatingMode ? null : '/(tabs)',
              }}
            />

            <Tabs.Screen
              name="events"
              options={{
                title: 'Events',
                tabBarIcon: ({ color, size, focused }) => <Calendar size={24} color={color} strokeWidth={focused ? 3 : 2} />,
                href: isDatingMode ? null : '/(tabs)/events',
              }}
            />

            <Tabs.Screen
              name="people"
              options={{
                title: 'People',
                tabBarIcon: ({ color, size, focused }) => <Search size={24} color={color} strokeWidth={focused ? 3 : 2} />,
                href: isDatingMode ? null : '/(tabs)/people',
              }}
            />

            <Tabs.Screen
              name="profile"
              options={{
                title: 'Profile',
                tabBarIcon: ({ color, size, focused }) => <User size={24} color={color} strokeWidth={focused ? 3 : 2} />,
                href: isDatingMode ? null : '/(tabs)/profile',
              }}
            />

            {/* Hidden screens */}
            <Tabs.Screen
              name="dating"
              options={{
                title: 'Dating',
                href: null,
                tabBarStyle: { display: 'none' }
              }}
            />
          </Tabs>
        </View>
      </View>

      {/* Coming Soon Modal */}
      <Modal
        visible={showComingSoon}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowComingSoon(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowComingSoon(false)}
        >
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, { backgroundColor: PINK }]}>
              <Heart size={32} color="white" fill="white" />
            </View>
            <Text style={styles.modalTitle}>Dating Mode Opening Soon!</Text>
            <Text style={styles.modalSubtitle}>
              We're putting the finishing touches on the dating experience. It will be available for everyone at 10:00 AM.
            </Text>

            <View style={styles.timerContainer}>
              <Text style={styles.timerLabel}>OPENING IN</Text>
              <Text style={styles.timerValue}>{countdown || '00h 00m 00s'}</Text>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: PINK }]}
              onPress={() => setShowComingSoon(false)}
            >
              <Text style={styles.modalButtonText}>Got it!</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowComingSoon(false)}
            >
              <X size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  mainLayout: { flex: 1, flexDirection: 'row' },

  // Mobile Header
  header: {
    backgroundColor: 'white',
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    zIndex: 10
  },
  sidebarVybText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -1.5,
    marginBottom: 20,
    paddingHorizontal: 16
  },
  logoContainer: {
    flex: 1,
  },
  logoBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 14, fontWeight: 'bold', color: 'black' },
  logoTitle: { fontSize: 18, fontWeight: 'bold', color: 'black' },
  headerVybText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -1
  },
  modeToggle: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  modeTextWhite: { color: 'white', fontWeight: '600', fontSize: 13 },
  modeTextBlack: { color: 'black', fontWeight: '600', fontSize: 13 },

  // Mobile Tabs
  tabBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 0,
    height: 64,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    paddingTop: 12,
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  tabBarHidden: { display: 'none' },
  tabBarLabel: { fontSize: 11, fontWeight: '600' },

  // Web Sidebar
  webSidebar: {
    width: width < 1264 ? 80 : 250,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    paddingVertical: 32,
    paddingHorizontal: 16,
    justifyContent: 'space-between'
  },
  sidebarLogo: { marginBottom: 40, paddingLeft: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sidebarLogoText: { fontSize: 24, fontWeight: 'bold', fontFamily: Platform.select({ web: 'System, -apple-system, sans-serif' }) },
  sidebarMenu: { gap: 8 },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 16,
    marginBottom: 4,
  },
  sidebarLinkText: { fontSize: 16, color: 'black' },
  sidebarLinkActive: { fontWeight: 'bold' },
  sidebarFooter: { gap: 8 },

  // Web Content
  contentArea: { flex: 1, height: '100%' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    transform: [{ rotate: '-10deg' }]
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24
  },
  timerContainer: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  timerLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 8
  },
  timerValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111827',
    fontVariant: ['tabular-nums']
  },
  modalButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8
  }
});
