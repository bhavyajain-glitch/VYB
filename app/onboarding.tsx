import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isSmallScreen = width < 380;

// Scaling helper
const scale = (size: number) => {
  if (isWeb) return Math.min(size, size * (width / 1440) * 1.5); // Cap scaling on web
  return size * (width / 375);
};

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>V</Text>
            </View>
            <Text style={styles.logoTitle}>Vyb</Text>
          </View>
          <TouchableOpacity onPress={() => router.replace('/auth')}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Creative Collage */}
          <Animated.View entering={FadeIn.delay(200)} style={styles.collageContainer}>
            {/* Background circles */}
            <View style={[styles.bgCircle, styles.bgCircle1]} />
            <View style={[styles.bgCircle, styles.bgCircle2]} />

            {/* Main profile with follow button */}
            <View style={styles.mainProfileContainer}>
              <View style={styles.mainProfile}>
                <Image source={{ uri: 'https://i.pravatar.cc/200?img=8' }} style={styles.mainAvatar} resizeMode="cover" />
              </View>
              <View style={styles.followBadge}>
                <Text style={styles.followBadgeText}>Follow</Text>
              </View>
            </View>

            {/* Pink geometric shapes */}
            <View style={[styles.pinkShape, styles.pinkShape1]} />
            <View style={[styles.pinkShape, styles.pinkShape2]} />

            {/* Additional profile photos */}
            <View style={[styles.smallProfile, styles.smallProfile1]}>
              <Image source={{ uri: 'https://i.pravatar.cc/100?img=5' }} style={styles.smallAvatar} />
            </View>
            <View style={[styles.smallProfile, styles.smallProfile2]}>
              <Image source={{ uri: 'https://i.pravatar.cc/100?img=12' }} style={styles.smallAvatar} />
            </View>

            {/* Decorative elements */}
            <Text style={[styles.emoji, styles.emoji1]}>✨</Text>
            <Text style={[styles.emoji, styles.emoji2]}>💫</Text>
            <View style={[styles.decorDot, styles.decorDot1]} />
            <View style={[styles.decorDot, styles.decorDot2]} />
          </Animated.View>

          {/* Text Content */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.textContent}>
            <Text style={styles.title}>Best Social App to Make{'\n'}New Friends</Text>
            <Text style={styles.subtitle}>
              With Vyb you will find new friends from various colleges and events at ADYPU
            </Text>
          </Animated.View>

          {/* CTA Buttons */}
          <Animated.View entering={FadeInUp.delay(600)} style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace('/auth')}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.replace('/auth')}
            >
              <Text style={styles.secondaryButtonText}>Login</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Page Indicator */}
        <View style={styles.pageIndicator}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </ScrollView>
    </View>
  );
}

const LIME = '#D4FF00';
const COLLAGE_SIZE = Math.min(width * 0.8, 300); // Responsive max size

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  scrollContent: { flexGrow: 1, minHeight: height },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center'
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { width: 32, height: 32, backgroundColor: LIME, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 18, fontWeight: 'bold', color: 'black' },
  logoTitle: { fontSize: 20, fontWeight: 'bold', color: 'black' },
  skipText: { fontSize: 14, color: '#6B7280' },

  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center'
  },

  collageContainer: {
    width: COLLAGE_SIZE,
    height: COLLAGE_SIZE,
    marginBottom: isSmallScreen ? 24 : 48,
    position: 'relative'
  },

  bgCircle: { position: 'absolute', borderRadius: 100 },
  bgCircle1: { top: '12%', left: '12%', width: '30%', height: '30%', backgroundColor: 'rgba(212, 255, 0, 0.2)' },
  bgCircle2: { bottom: '12%', right: '12%', width: '40%', height: '40%', backgroundColor: 'rgba(168, 85, 247, 0.2)' },

  mainProfileContainer: {
    position: 'absolute',
    top: '15%',
    left: '50%',
    transform: [{ translateX: -(COLLAGE_SIZE * 0.4) / 2 }],
    alignItems: 'center',
    zIndex: 10
  },
  mainProfile: {
    width: COLLAGE_SIZE * 0.4,
    height: COLLAGE_SIZE * 0.4,
    borderRadius: COLLAGE_SIZE * 0.2,
    borderWidth: 4,
    borderColor: 'white',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    backgroundColor: '#f0f0f0'
  },
  mainAvatar: { width: '100%', height: '100%' },

  followBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: LIME,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4
  },
  followBadgeText: { fontSize: 10, fontWeight: 'bold', color: 'black' },

  pinkShape: { position: 'absolute', backgroundColor: '#F472B6', borderRadius: 16 },
  pinkShape1: { top: '25%', right: '10%', width: '35%', height: '35%', transform: [{ rotate: '12deg' }] },
  pinkShape2: { top: '40%', right: '5%', width: '30%', height: '30%', backgroundColor: '#F9A8D4', transform: [{ rotate: '-6deg' }] },

  smallProfile: {
    position: 'absolute',
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'white',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: '#f0f0f0'
  },
  smallProfile1: { bottom: '25%', left: '10%', width: '25%', height: '25%' },
  smallProfile2: { bottom: '40%', right: '20%', width: '20%', height: '20%' },
  smallAvatar: { width: '100%', height: '100%' },

  emoji: { position: 'absolute', fontSize: 24 },
  emoji1: { top: '10%', right: '25%' },
  emoji2: { bottom: '10%', left: '15%' },

  decorDot: { position: 'absolute', borderRadius: 10 },
  decorDot1: { top: '50%', left: '5%', width: 12, height: 12, backgroundColor: LIME },
  decorDot2: { bottom: '15%', right: '25%', width: 16, height: 16, backgroundColor: '#A855F7' },

  textContent: { alignItems: 'center', marginBottom: 32 },
  title: {
    fontSize: isSmallScreen ? 24 : 28,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: isSmallScreen ? 32 : 36
  },
  subtitle: {
    fontSize: isSmallScreen ? 13 : 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    maxWidth: 300
  },

  buttonContainer: { width: '100%', gap: 12, maxWidth: 350 },
  primaryButton: {
    width: '100%',
    paddingVertical: 14,
    backgroundColor: LIME,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  primaryButtonText: { fontSize: 16, fontWeight: 'bold', color: 'black' },
  secondaryButton: { width: '100%', paddingVertical: 14, alignItems: 'center' },
  secondaryButtonText: { fontSize: 16, fontWeight: '500', color: '#6B7280' },

  pageIndicator: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingBottom: 32 },
  dot: { width: 4, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2 },
  dotActive: { width: 32, backgroundColor: 'black' },
});
