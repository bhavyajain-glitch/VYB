import { View, Text, ScrollView, Image, TouchableOpacity, FlatList, StyleSheet, Dimensions, Platform, TextInput, Linking } from 'react-native';
import { Calendar, MapPin, Clock, Users, Search, Filter, Trophy, Train, ExternalLink } from 'lucide-react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

const LIME = '#D4FF00';
const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 600;

// Google Form URL for URJA Matheran event registration
const URJA_MATHERAN_FORM_URL = 'https://forms.gle/mMhEsZQ6bGpPYBoA6'; // Replace with actual Google Form URL

const categories = ['All', 'Tech', 'Gaming', 'Robotics', 'Sports', 'Social', 'Trip'];

const events = [
  {
    id: 'urja-matheran',
    title: 'URJA Matheran Trip',
    description: '🚂 Escape to the hills! Join us for an unforgettable trip to Matheran on the iconic toy train. Trek through scenic trails, enjoy breathtaking views, and make memories with your campus friends. Limited seats available!',
    image: require('../../assets/urja_matheran_event.jpg'),
    date: 'Feb 08, 2026',
    time: 'Full Day',
    location: 'Matheran Hill Station',
    attendees: 50,
    category: 'Trip',
    prize: null,
    isJoined: false,
    isLocalImage: true,
    googleFormUrl: URJA_MATHERAN_FORM_URL,
    isFeatured: true
  },
  {
    id: '1',
    title: 'Hackron',
    description: '24-hour non-stop hackathon! Build, innovate, and compete for amazing prizes. Form your team and code your way to victory.',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
    date: 'Jan 30, 2026',
    time: '24 Hours',
    location: 'ADYPU Campus',
    attendees: 500,
    category: 'Tech',
    prize: '₹75,000',
    isJoined: false
  },
  {
    id: '2',
    title: 'Drone Havoc',
    description: 'High-speed FPV drone racing competition. Navigate through challenging obstacles and prove your piloting skills.',
    image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800',
    date: 'Jan 31, 2026',
    time: '10:00 AM',
    location: 'ADYPU Campus',
    attendees: 200,
    category: 'Robotics',
    prize: '₹75,000',
    isJoined: false
  },
  {
    id: '3',
    title: 'Throttle 2.X',
    description: 'RC car racing championship! Race your custom RC cars on our professional track and claim the title.',
    image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=800',
    date: 'Jan 30, 2026',
    time: '11:00 AM',
    location: 'West Oval Ground, ADYPU',
    attendees: 150,
    category: 'Robotics',
    prize: '₹60,000',
    isJoined: false
  },
  {
    id: '4',
    title: 'Robo Kick',
    description: 'Robot soccer tournament! Build and program your soccer bot to score goals and win the championship.',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
    date: 'Jan 30, 2026',
    time: '2:00 PM',
    location: 'ADYPU Campus',
    attendees: 180,
    category: 'Robotics',
    prize: '₹75,000',
    isJoined: false
  },
  {
    id: '5',
    title: 'BGMI Event',
    description: 'Battlegrounds Mobile India tournament. Squad up with your team and battle for the ultimate chicken dinner!',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
    date: 'Jan 30, 2026',
    time: '3:00 PM',
    location: 'Gaming Arena',
    attendees: 400,
    category: 'Gaming',
    prize: '₹30,000',
    isJoined: false
  },
  {
    id: '6',
    title: 'Code Wars',
    description: 'ICPC-style competitive programming contest. Solve algorithmic challenges and prove your coding prowess.',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
    date: 'Jan 30, 2026',
    time: '10:00 AM',
    location: 'Computer Lab',
    attendees: 300,
    category: 'Tech',
    prize: '₹50,000',
    isJoined: false
  },
  {
    id: '7',
    title: 'Diljale',
    description: 'Blind dating event! Meet new people, make connections, and maybe find your perfect match. Fun guaranteed!',
    image: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800',
    date: 'Jan 30, 2026',
    time: '5:00 PM',
    location: 'ADYPU Campus',
    attendees: 100,
    category: 'Social',
    prize: null,
    isJoined: false
  },
  {
    id: '8',
    title: 'Sector of Silence',
    description: 'Among Us in real life! Play the ultimate social deduction game on campus. Find the imposters before it\'s too late.',
    image: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800',
    date: 'Jan 31, 2026',
    time: '4:00 PM',
    location: 'ADYPU Campus',
    attendees: 80,
    category: 'Social',
    prize: null,
    isJoined: false
  },
  {
    id: '9',
    title: 'Sargam',
    description: 'Battle of the Bands! Showcase your musical talent and compete for the title of best campus band.',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    date: 'Jan 30, 2026',
    time: '6:00 PM',
    location: 'Open Air Theatre',
    attendees: 600,
    category: 'Social',
    prize: '₹30,000',
    isJoined: false
  },
  {
    id: '10',
    title: 'Last Goal Standing',
    description: 'FIFA FC24 tournament! Show off your virtual football skills and become the campus FIFA champion.',
    image: 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=800',
    date: 'Jan 31, 2026',
    time: '12:00 PM',
    location: 'Gaming Arena',
    attendees: 120,
    category: 'Gaming',
    prize: '₹4,000',
    isJoined: false
  },
];

const EventCard = ({ event }: { event: typeof events[0] }) => {
  const [isJoined, setIsJoined] = useState(event.isJoined);

  const handleJoin = async () => {
    // If this event has a Google Form URL, open it
    if ((event as any).googleFormUrl) {
      try {
        const supported = await Linking.canOpenURL((event as any).googleFormUrl);
        if (supported) {
          await Linking.openURL((event as any).googleFormUrl);
        } else {
          console.log("Can't open URL:", (event as any).googleFormUrl);
        }
      } catch (error) {
        console.error('Error opening URL:', error);
      }
    } else {
      setIsJoined(!isJoined);
    }
  };

  // Determine image source based on whether it's a local image or URL
  const imageSource = (event as any).isLocalImage ? event.image : { uri: event.image as string };
  const isFeaturedEvent = (event as any).isFeatured;

  return (
    <Animated.View entering={FadeInDown} style={[styles.eventCard, isFeaturedEvent && styles.featuredCard]}>
      <TouchableOpacity activeOpacity={0.9}>
        <View style={[styles.imageContainer, isFeaturedEvent && styles.featuredImageContainer]}>
          <Image source={imageSource} style={styles.eventImage} resizeMode="cover" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFillObject} />
          <View style={styles.imageOverlay}>
            <View style={[styles.categoryBadge, isFeaturedEvent && styles.featuredCategoryBadge]}>
              {isFeaturedEvent && <Train size={12} color="black" style={{ marginRight: 4 }} />}
              <Text style={styles.categoryText}>{event.category}</Text>
            </View>
            <View style={styles.badgesRight}>
              {event.prize && (
                <View style={styles.prizeBadge}><Trophy size={12} color="black" /><Text style={styles.prizeText}>{event.prize}</Text></View>
              )}
              <View style={styles.attendeesBadge}><Users size={12} color="white" /><Text style={styles.attendeesText}>{event.attendees}</Text></View>
            </View>
          </View>
          {isFeaturedEvent && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>🔥 FEATURED</Text>
            </View>
          )}
        </View>
        <View style={styles.eventContent}>
          <Text style={[styles.eventTitle, isFeaturedEvent && styles.featuredTitle]}>{event.title}</Text>
          <Text style={styles.eventDescription} numberOfLines={3}>{event.description}</Text>
          <View style={styles.eventDetails}>
            <View style={styles.detailItem}><Calendar size={14} color="#8B5CF6" /><Text style={styles.detailText}>{event.date}</Text></View>
            <View style={styles.detailItem}><Clock size={14} color="#8B5CF6" /><Text style={styles.detailText}>{event.time}</Text></View>
            <View style={styles.detailItem}><MapPin size={14} color="#8B5CF6" /><Text style={styles.detailText}>{event.location}</Text></View>
          </View>
          <TouchableOpacity
            onPress={handleJoin}
            style={[
              styles.joinButton,
              isJoined && styles.joinedButton,
              isFeaturedEvent && styles.featuredJoinButton
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {(event as any).googleFormUrl && <ExternalLink size={16} color={isFeaturedEvent ? "black" : "white"} />}
              <Text style={[styles.joinButtonText, isJoined && styles.joinedButtonText, isFeaturedEvent && styles.featuredJoinButtonText]}>
                {isJoined ? 'Joined ✓' : ((event as any).googleFormUrl ? 'Register Now' : 'Join Event')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function EventsScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filteredEvents = events.filter(e => {
    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <View style={styles.centerContainer}>
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
              <TouchableOpacity key={category} onPress={() => setSelectedCategory(category)} style={[styles.categoryButton, selectedCategory === category && styles.categoryActive]}>
                <Text style={[styles.categoryButtonText, selectedCategory === category && styles.categoryActiveText]}>{category}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Events List */}
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventCard event={item} />}
          contentContainerStyle={styles.eventsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ color: '#9CA3AF' }}>No events found</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centerContainer: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', flex: 1, backgroundColor: 'white', borderRightWidth: isWeb ? 1 : 0, borderLeftWidth: isWeb ? 1 : 0, borderColor: '#E5E7EB' },

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

  eventsList: { padding: 16, paddingBottom: 24 },
  eventCard: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, borderWidth: 1, borderColor: '#F3F4F6' },
  imageContainer: { position: 'relative', height: 180 },
  eventImage: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', bottom: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  categoryBadge: { backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryText: { color: 'black', fontSize: 10, fontWeight: '700' },
  attendeesBadge: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  attendeesText: { color: 'white', fontSize: 10 },
  badgesRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  prizeBadge: { backgroundColor: '#D4FF00', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  prizeText: { color: 'black', fontSize: 10, fontWeight: '700' },

  eventContent: { padding: 16 },
  eventTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  eventDescription: { color: '#6B7280', fontSize: 13, marginBottom: 16, lineHeight: 20 },

  eventDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { color: '#4B5563', fontSize: 13 },

  joinButton: { backgroundColor: 'black', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  joinedButton: { backgroundColor: '#F3F4F6' },
  joinButtonText: { color: 'white', fontWeight: '600', fontSize: 14 },
  joinedButtonText: { color: '#6B7280' },

  // Featured event styles
  featuredCard: { borderWidth: 2, borderColor: '#D4FF00', shadowColor: '#D4FF00', shadowOpacity: 0.3, shadowRadius: 16 },
  featuredImageContainer: { height: 220 },
  featuredCategoryBadge: { backgroundColor: '#D4FF00', flexDirection: 'row', alignItems: 'center' },
  featuredBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#D4FF00', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  featuredBadgeText: { fontSize: 11, fontWeight: 'bold', color: 'black' },
  featuredTitle: { fontSize: 20, color: '#111827' },
  featuredJoinButton: { backgroundColor: '#D4FF00' },
  featuredJoinButtonText: { color: 'black' },
});
