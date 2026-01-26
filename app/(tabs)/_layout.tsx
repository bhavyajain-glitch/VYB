import { Tabs, useRouter, usePathname } from 'expo-router';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Platform, Image } from 'react-native';
import { Home, Calendar, Users, User, Heart, Sparkles, Search, Bell, PlusSquare, Menu, MessageCircle, LogOut } from 'lucide-react-native';
import { useState, useEffect } from 'react';

const LIME = '#D4FF00';
const PINK = '#EC4899';
const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isDesktop = width >= 1024; // Instagram breakpoint

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [isDatingMode, setIsDatingMode] = useState(false);

  // Sync mode with current path
  useEffect(() => {
    if (pathname && pathname.includes('/dating')) {
      setIsDatingMode(true);
    } else if (pathname && !pathname.includes('/dating') && pathname !== '') {
       if (isDatingMode) setIsDatingMode(false);
    }
  }, [pathname]);

  const handleModeSwitch = () => {
    if (isDatingMode) {
      setIsDatingMode(false);
      router.push('/(tabs)');
    } else {
      setIsDatingMode(true);
      router.push('/(tabs)/dating');
    }
  };

  const accentColor = isDatingMode ? PINK : LIME;

  // Web Sidebar Component
  const WebSidebar = () => (
    <View style={styles.webSidebar}>
      <TouchableOpacity style={styles.sidebarLogo} onPress={() => router.replace('/(tabs)')}>
        <View style={[styles.logoBox, { backgroundColor: accentColor }]}>
          <Text style={styles.logoText}>V</Text>
        </View>
        <Text style={[styles.sidebarLogoText, { display: width < 1264 ? 'none' : 'flex' }]}>Vybe</Text>
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
          {isDatingMode ? <Users size={24} color="black" /> : <Heart size={24} color="black" />}
          <Text style={[styles.sidebarLinkText, { display: width < 1264 ? 'none' : 'flex' }]}>
            Switch to {isDatingMode ? 'Social' : 'Dating'}
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
      {/* Mobile Header (Hidden on Desktop) */}
      {!isDesktop && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.logoContainer} onPress={() => router.replace('/(tabs)')}>
            <View style={[styles.logoBox, { backgroundColor: accentColor }]}>
              <Text style={styles.logoText}>V</Text>
            </View>
            <Text style={styles.logoTitle}>Vybe</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleModeSwitch}
            style={[styles.modeToggle, { backgroundColor: isDatingMode ? LIME : PINK }]}
          >
            {isDatingMode ? (
              <>
                <Users size={14} color="black" />
                <Text style={styles.modeTextBlack}>Vybe</Text>
              </>
            ) : (
              <>
                <Heart size={14} color="white" fill="white" />
                <Text style={styles.modeTextWhite}>Dating</Text>
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
              // Hide tab bar on desktop OR if in dating mode on mobile
              tabBarStyle: (isDesktop || isDatingMode) ? styles.tabBarHidden : styles.tabBar,
              tabBarActiveTintColor: 'black',
              tabBarInactiveTintColor: '#9CA3AF',
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
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 14, fontWeight: 'bold', color: 'black' },
  logoTitle: { fontSize: 18, fontWeight: 'bold', color: 'black' },
  modeToggle: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  modeTextWhite: { color: 'white', fontWeight: '600', fontSize: 13 },
  modeTextBlack: { color: 'black', fontWeight: '600', fontSize: 13 },

  // Mobile Tabs
  tabBar: { 
    backgroundColor: 'white', 
    borderTopWidth: 1, 
    borderTopColor: '#F3F4F6', 
    height: 60, 
    paddingBottom: 8, 
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0
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
});
