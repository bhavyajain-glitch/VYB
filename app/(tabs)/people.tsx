import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { Search, MapPin, Check } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { authAPI } from '../services/api';
import { getAvatarSource } from '../../utils/imageUtils';

const LIME = '#D4FF00';
const { width } = Dimensions.get('window');

export default function PeopleScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initial Load (Suggestions)
  useEffect(() => {
    fetchUsers('');
  }, []);

  const fetchUsers = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const res = await authAPI.searchUsers(searchQuery);
      setUsers(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setQuery(text);
    // Debounce could be added here
    if (text.length > 2 || text.length === 0) {
        fetchUsers(text);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
            <Search size={20} color="#9CA3AF" />
            <TextInput 
                placeholder="Search students, faculty..." 
                placeholderTextColor="#9CA3AF"
                value={query}
                onChangeText={handleSearch}
                style={styles.searchInput}
            />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>{query ? 'Search Results' : 'Suggested for you'}</Text>
        
        {users.length === 0 && !isLoading && (
            <Text style={styles.emptyText}>No users found.</Text>
        )}

        {users.map((user) => (
            <TouchableOpacity 
                key={user._id} 
                style={styles.userCard}
                onPress={() => router.push(`/user/${user._id}`)}
            >
                <Image source={getAvatarSource(user.profileImage)} style={styles.avatar} />
                <View style={styles.userInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.fullName}>{user.fullName || user.username}</Text>
                        {user.isVerified && <Check size={14} color="#3B82F6" strokeWidth={3} />}
                    </View>
                    <Text style={styles.username}>@{user.username}</Text>
                    {user.college && <Text style={styles.college}>{user.college}</Text>}
                </View>
                <TouchableOpacity style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
            </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: 'black' },
  content: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  emptyText: { color: '#9CA3AF', textAlign: 'center', marginTop: 20 },
  
  userCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, padding: 12, borderRadius: 12, backgroundColor: '#F9FAFB' },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  userInfo: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fullName: { fontWeight: 'bold', fontSize: 15 },
  username: { color: '#6B7280', fontSize: 13 },
  college: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  
  viewButton: { backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  viewButtonText: { fontSize: 12, fontWeight: 'bold' },
});
