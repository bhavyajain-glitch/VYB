import { View, Text, ScrollView, Image, TouchableOpacity, FlatList, StyleSheet, Dimensions, Platform, TextInput, Linking, ActivityIndicator } from 'react-native';
import { Calendar, MapPin, Clock, Users, Search, Filter, Trophy, Train, ExternalLink, Phone, Heart, Sparkles } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { authAPI } from '../../services/api';

const LIME = '#D4FF00';
const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 600;

// Google Form URL for URJA Matheran event registration (fallback)
const URJA_MATHERAN_FORM_URL = 'https://forms.gle/mMhEsZQ6bGpPYBoA6';

const categories = ['All', 'Tech', 'Gaming', 'Robotics', 'Sports', 'Social', 'Trip', 'Party'];

// Local image mapping
const localImages: { [key: string]: any } = {
  'night_wave_event': require('../../assets/night_wave_event.jpg'),
  'urja_matheran_event': require('../../assets/urja_matheran_event.jpg'),
};

// Fallback events for when server is unavailable
const fallbackEvents = [
  {
    _id: 'night-wave-2',
    title: 'Night Wave 2.0 - Rose Day Special',
    description: '✨ Only 3 Days Left! ✨\nKick off Valentine Week with a perfect evening at C-Dock Club 💖🥂\n\nCelebrate with your partner, enjoy special surprises & lock in the best vibes of the season 🎉\n\n🎟 Passes (Limited | May Increase Anytime):\n₹500 Male | ₹350 Female | ₹600 Couple\n\n🔥 450+ passes sold | Very few slots left!\n\nLet\'s make it unforgettable ✨',
    image: 'night_wave_event',
    isLocalImage: true,
    date: 'Feb 07, 2026',
    time: '4:00 PM onwards',
    location: 'C-Dock Club',
    attendees: 450,
    category: 'Party',
    isFeatured: true,
    passPrices: { male: 500, female: 350, couple: 600 },
    contactNumbers: ['9545393239', '8668952859'],
    organizer: 'EVOX Ventures',
    passesSold: 450
  },
  {
    _id: 'urja-matheran',
    title: 'URJA Matheran Trip',
    description: '🚂 Escape to the hills! Join us for an unforgettable trip to Matheran on the iconic toy train. Trek through scenic trails, enjoy breathtaking views, and make memories with your campus friends. Limited seats available!',
    image: 'urja_matheran_event',
    isLocalImage: true,
    date: 'Feb 08, 2026',
    time: 'Full Day',
    location: 'Matheran Hill Station',
    attendees: 50,
    category: 'Trip',
    isFeatured: true,
    googleFormUrl: URJA_MATHERAN_FORM_URL
  }
];

interface EventType {
  _id: string;
  title: string;
  description: string;
  image: string;
  isLocalImage?: boolean;
  date: string;
  time: string;
  location: string;
  attendees: number;
  category: string;
  prize?: string | null;
  googleFormUrl?: string;
  isFeatured?: boolean;
  passPrices?: { male?: number; female?: number; couple?: number };
  contactNumbers?: string[];
  organizer?: string;
  passesSold?: number;
}

const EventCard = ({ event }: { event: EventType }) => {
  const [isJoined, setIsJoined] = useState(false);

  const handleJoin = async () => {
    if (event.googleFormUrl) {
      try {
        const supported = await Linking.canOpenURL(event.googleFormUrl);
        if (supported) {
          await Linking.openURL(event.googleFormUrl);
        }
      } catch (error) {
        console.error('Error opening URL:', error);
      }
    } else if (event.contactNumbers && event.contactNumbers.length > 0) {
      // For party events, open phone dialer
      try {
        const phoneUrl = `tel:${event.contactNumbers[0]}`;
        await Linking.openURL(phoneUrl);
      } catch (error) {
        console.error('Error opening phone:', error);
      }
    } else {
      setIsJoined(!isJoined);
    }
  };

  // Determine image source
  const imageSource = event.isLocalImage && localImages[event.image]
    ? localImages[event.image]
    : { uri: event.image };

  const isFeaturedEvent = event.isFeatured;
  const isValentineEvent = event.category === 'Party' || event.title.toLowerCase().includes('valentine') || event.title.toLowerCase().includes('rose');

  return (
    <Animated.View entering={FadeInDown.duration(500)} style={[styles.eventCard, isFeaturedEvent && styles.featuredCard, isValentineEvent && styles.valentineCard]}>
      <TouchableOpacity activeOpacity={0.9}>
        <View style={[styles.imageContainer, isFeaturedEvent && styles.featuredImageContainer]}>
          <Image source={imageSource} style={styles.eventImage} resizeMode="cover" />
          <LinearGradient
            colors={isValentineEvent ? ['transparent', 'rgba(139,0,60,0.9)'] : ['transparent', 'rgba(0,0,0,0.8)']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.imageOverlay}>
            <View style={[styles.categoryBadge, isFeaturedEvent && styles.featuredCategoryBadge, isValentineEvent && styles.valentineCategoryBadge]}>
              {event.category === 'Trip' && <Train size={12} color="black" style={{ marginRight: 4 }} />}
              {isValentineEvent && <Heart size={12} color="white" style={{ marginRight: 4 }} />}
              <Text style={[styles.categoryText, isValentineEvent && { color: 'white' }]}>{event.category}</Text>
            </View>
            <View style={styles.badgesRight}>
              {event.prize && (
                <View style={styles.prizeBadge}><Trophy size={12} color="black" /><Text style={styles.prizeText}>{event.prize}</Text></View>
              )}
              <View style={styles.attendeesBadge}><Users size={12} color="white" /><Text style={styles.attendeesText}>{event.attendees}</Text></View>
            </View>
          </View>
          {isFeaturedEvent && (
            <View style={[styles.featuredBadge, isValentineEvent && styles.valentineFeaturedBadge]}>
              <Text style={[styles.featuredBadgeText, isValentineEvent && { color: 'white' }]}>
                {isValentineEvent ? '💖 VALENTINE WEEK' : '🔥 FEATURED'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.eventContent}>
          <Text style={[styles.eventTitle, isFeaturedEvent && styles.featuredTitle]}>{event.title}</Text>
          <Text style={styles.eventDescription} numberOfLines={4}>{event.description}</Text>

          {/* Pass Prices for Party Events */}
          {event.passPrices && (event.passPrices.male || event.passPrices.female || event.passPrices.couple) && (
            <View style={styles.pricesContainer}>
              <Text style={styles.pricesTitle}>🎟 Passes:</Text>
              <View style={styles.pricesList}>
                {event.passPrices.male && (
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Male</Text>
                    <Text style={styles.priceValue}>₹{event.passPrices.male}</Text>
                  </View>
                )}
                {event.passPrices.female && (
                  <View style={[styles.priceItem, styles.priceItemFemale]}>
                    <Text style={styles.priceLabel}>Female</Text>
                    <Text style={styles.priceValue}>₹{event.passPrices.female}</Text>
                  </View>
                )}
                {event.passPrices.couple && (
                  <View style={[styles.priceItem, styles.priceItemCouple]}>
                    <Text style={styles.priceLabel}>Couple</Text>
                    <Text style={styles.priceValue}>₹{event.passPrices.couple}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={styles.eventDetails}>
            <View style={styles.detailItem}><Calendar size={14} color={isValentineEvent ? "#E11D48" : "#8B5CF6"} /><Text style={styles.detailText}>{event.date}</Text></View>
            <View style={styles.detailItem}><Clock size={14} color={isValentineEvent ? "#E11D48" : "#8B5CF6"} /><Text style={styles.detailText}>{event.time}</Text></View>
            <View style={styles.detailItem}><MapPin size={14} color={isValentineEvent ? "#E11D48" : "#8B5CF6"} /><Text style={styles.detailText}>{event.location}</Text></View>
          </View>

          {/* Phone Buttons for Party Events */}
          {event.contactNumbers && event.contactNumbers.length > 0 && !event.googleFormUrl && (
            <View style={styles.phoneButtonsContainer}>
              {event.contactNumbers.map((phone) => (
                <TouchableOpacity
                  key={phone}
                  onPress={async () => {
                    try {
                      await Linking.openURL(`tel:${phone}`);
                    } catch (error) {
                      console.error('Error opening phone:', error);
                    }
                  }}
                  style={[styles.phoneButton, isValentineEvent && styles.valentinePhoneButton]}
                >
                  <Phone size={18} color="white" />
                  <Text style={styles.phoneButtonNumber}>{phone}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Google Form or Join Button */}
          {(event.googleFormUrl || (!event.contactNumbers || event.contactNumbers.length === 0)) && (
            <TouchableOpacity
              onPress={handleJoin}
              style={[
                styles.joinButton,
                isJoined && styles.joinedButton,
                isFeaturedEvent && styles.featuredJoinButton,
                isValentineEvent && styles.valentineJoinButton
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {event.googleFormUrl && <ExternalLink size={16} color={isValentineEvent ? "white" : (isFeaturedEvent ? "black" : "white")} />}
                <Text style={[styles.joinButtonText, isJoined && styles.joinedButtonText, isFeaturedEvent && styles.featuredJoinButtonText, isValentineEvent && styles.valentineJoinButtonText]}>
                  {isJoined ? 'Joined ✓' : (event.googleFormUrl ? 'Register Now' : 'Join Event')}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function EventsScreen() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.getEvents();
      if (response.data?.events && response.data.events.length > 0) {
        setEvents(response.data.events);
      } else {
        // Use fallback events if server returns empty
        setEvents(fallbackEvents);
      }
    } catch (err: any) {
      console.log('Using fallback events:', err.message);
      // Use fallback events on error
      setEvents(fallbackEvents);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(e => {
    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={{ marginTop: 12, color: '#6B7280' }}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.centerContainer}>
        {/* Valentine Header Banner */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.valentineHeader}>
          <LinearGradient
            colors={['#E11D48', '#BE185D', '#9D174D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.valentineHeaderGradient}
          >
            <Sparkles size={20} color="white" />
            <Text style={styles.valentineHeaderText}>Valentine Week Special Events 💖</Text>
            <Sparkles size={20} color="white" />
          </LinearGradient>
        </Animated.View>

        {/* Search Header */}
        <View style={styles.header}>
          {showSearch ? (
            <View style={styles.searchBar}>
              <Search size={18} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search events..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(''); }}>
                <Text style={{ color: '#6B7280', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.searchBar} onPress={() => setShowSearch(true)}>
              <Search size={18} color="#9CA3AF" />
              <Text style={styles.searchText}>Search events...</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              const { Alert } = require('react-native');
              Alert.alert('Filter Events', 'Select a category to filter',
                categories.map(cat => ({ text: cat, onPress: () => setSelectedCategory(cat) }))
              );
            }}
          >
            <Filter size={18} color="black" />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.categoriesWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryActive,
                  category === 'Party' && styles.partyCategory
                ]}
              >
                <Text style={[styles.categoryButtonText, selectedCategory === category && styles.categoryActiveText]}>
                  {category === 'Party' ? '🎉 Party' : category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Events List */}
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <EventCard event={item} />}
          contentContainerStyle={styles.eventsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ color: '#9CA3AF' }}>No events found</Text>
            </View>
          }
          refreshing={loading}
          onRefresh={fetchEvents}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerContainer: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', flex: 1, backgroundColor: 'white', borderRightWidth: isWeb ? 1 : 0, borderLeftWidth: isWeb ? 1 : 0, borderColor: '#E5E7EB' },
  centered: { justifyContent: 'center', alignItems: 'center' },

  valentineHeader: { marginHorizontal: 16, marginTop: 12, borderRadius: 16, overflow: 'hidden' },
  valentineHeaderGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 8 },
  valentineHeaderText: { color: 'white', fontWeight: '700', fontSize: 15 },

  header: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', gap: 12 },
  searchBar: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  searchText: { marginLeft: 10, color: '#9CA3AF', fontSize: 14 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#111827' },
  filterButton: { width: 44, height: 44, backgroundColor: '#F3F4F6', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  categoriesWrapper: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  categoriesContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexDirection: 'row' },
  categoryButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', height: 36, justifyContent: 'center' },
  categoryActive: { backgroundColor: 'black' },
  categoryButtonText: { color: '#6B7280', fontSize: 13, fontWeight: '500' },
  categoryActiveText: { color: 'white' },
  partyCategory: { backgroundColor: '#FDF2F8' },

  eventsList: { padding: 16, paddingBottom: 24 },
  eventCard: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, borderWidth: 1, borderColor: '#F3F4F6' },
  imageContainer: { position: 'relative', height: 200 },
  eventImage: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', bottom: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  categoryBadge: { backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  categoryText: { color: 'black', fontSize: 10, fontWeight: '700' },
  attendeesBadge: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  attendeesText: { color: 'white', fontSize: 10 },
  badgesRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  prizeBadge: { backgroundColor: '#D4FF00', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  prizeText: { color: 'black', fontSize: 10, fontWeight: '700' },

  eventContent: { padding: 16 },
  eventTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  eventDescription: { color: '#6B7280', fontSize: 13, marginBottom: 16, lineHeight: 20 },

  pricesContainer: { marginBottom: 16, backgroundColor: '#FDF2F8', padding: 12, borderRadius: 12 },
  pricesTitle: { fontSize: 14, fontWeight: '600', color: '#9D174D', marginBottom: 8 },
  pricesList: { flexDirection: 'row', gap: 8 },
  priceItem: { flex: 1, backgroundColor: 'white', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#FBCFE8' },
  priceItemFemale: { borderColor: '#F9A8D4' },
  priceItemCouple: { borderColor: '#EC4899', backgroundColor: '#FCE7F3' },
  priceLabel: { fontSize: 11, color: '#6B7280', marginBottom: 2 },
  priceValue: { fontSize: 16, fontWeight: '700', color: '#9D174D' },

  contactContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F3F4F6', borderRadius: 8 },
  contactText: { color: '#4B5563', fontSize: 13, fontWeight: '500' },

  eventDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { color: '#4B5563', fontSize: 13 },

  joinButton: { backgroundColor: 'black', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  joinedButton: { backgroundColor: '#F3F4F6' },
  joinButtonText: { color: 'white', fontWeight: '600', fontSize: 15 },
  joinedButtonText: { color: '#6B7280' },

  // Featured event styles
  featuredCard: { borderWidth: 2, borderColor: '#D4FF00', shadowColor: '#D4FF00', shadowOpacity: 0.3, shadowRadius: 16 },
  featuredImageContainer: { height: 240 },
  featuredCategoryBadge: { backgroundColor: '#D4FF00', flexDirection: 'row', alignItems: 'center' },
  featuredBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#D4FF00', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  featuredBadgeText: { fontSize: 11, fontWeight: 'bold', color: 'black' },
  featuredTitle: { fontSize: 20, color: '#111827' },
  featuredJoinButton: { backgroundColor: '#D4FF00' },
  featuredJoinButtonText: { color: 'black' },

  // Valentine event styles
  valentineCard: { borderWidth: 2, borderColor: '#E11D48', shadowColor: '#E11D48', shadowOpacity: 0.25, shadowRadius: 16 },
  valentineCategoryBadge: { backgroundColor: '#E11D48' },
  valentineFeaturedBadge: { backgroundColor: '#E11D48' },
  valentineJoinButton: { backgroundColor: '#E11D48' },
  valentineJoinButtonText: { color: 'white' },

  // Phone buttons for party events
  phoneButtonsContainer: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  phoneButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#1F2937', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12 },
  valentinePhoneButton: { backgroundColor: '#E11D48' },
  phoneButtonNumber: { color: 'white', fontWeight: '600', fontSize: 15 },
});
