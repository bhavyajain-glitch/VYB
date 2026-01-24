import { View, Text, ScrollView, Image, TouchableOpacity, FlatList, StyleSheet, Dimensions, Platform } from 'react-native';
import { Calendar, MapPin, Clock, Users, Search, Filter } from 'lucide-react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

const LIME = '#D4FF00';
const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 600;

const categories = ['All', 'Tech', 'Cultural', 'Sports', 'Academic', 'Social'];

const events = [
  { id: '1', title: 'Tech Fest 2026', description: 'Annual technology festival featuring hackathons and workshops.', image: 'https://images.unsplash.com/photo-1540575467063-178a50da6a3a?w=800', date: 'Jan 25-27', time: '9:00 AM', location: 'Main Auditorium', attendees: 1250, category: 'Tech', isJoined: false },
  { id: '2', title: 'Cultural Night', description: 'Celebrating diversity through music, dance, and art performances.', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800', date: 'Jan 30', time: '6:00 PM', location: 'Open Air Theatre', attendees: 850, category: 'Cultural', isJoined: true },
  { id: '3', title: 'Inter-College Cricket', description: 'Annual cricket tournament between colleges. Come cheer for your team!', image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800', date: 'Feb 5-10', time: '8:00 AM', location: 'Sports Ground', attendees: 2400, category: 'Sports', isJoined: false },
];

const EventCard = ({ event }: { event: typeof events[0] }) => {
  const [isJoined, setIsJoined] = useState(event.isJoined);
  return (
    <Animated.View entering={FadeInDown} style={styles.eventCard}>
      <TouchableOpacity activeOpacity={0.9}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: event.image }} style={styles.eventImage} resizeMode="cover" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFillObject} />
          <View style={styles.imageOverlay}>
            <View style={styles.categoryBadge}><Text style={styles.categoryText}>{event.category}</Text></View>
            <View style={styles.attendeesBadge}><Users size={12} color="white" /><Text style={styles.attendeesText}>{event.attendees}</Text></View>
          </View>
        </View>
        <View style={styles.eventContent}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventDescription} numberOfLines={2}>{event.description}</Text>
          <View style={styles.eventDetails}>
            <View style={styles.detailItem}><Calendar size={14} color="#8B5CF6" /><Text style={styles.detailText}>{event.date}</Text></View>
            <View style={styles.detailItem}><Clock size={14} color="#8B5CF6" /><Text style={styles.detailText}>{event.time}</Text></View>
            <View style={styles.detailItem}><MapPin size={14} color="#8B5CF6" /><Text style={styles.detailText}>{event.location}</Text></View>
          </View>
          <TouchableOpacity onPress={() => setIsJoined(!isJoined)} style={[styles.joinButton, isJoined && styles.joinedButton]}>
            <Text style={[styles.joinButtonText, isJoined && styles.joinedButtonText]}>{isJoined ? 'Joined ✓' : 'Join Event'}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function EventsScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const filteredEvents = selectedCategory === 'All' ? events : events.filter(e => e.category === selectedCategory);

  return (
    <View style={styles.container}>
      <View style={styles.centerContainer}>
        {/* Search Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.searchBar}>
            <Search size={18} color="#9CA3AF" />
            <Text style={styles.searchText}>Search events...</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
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
});
