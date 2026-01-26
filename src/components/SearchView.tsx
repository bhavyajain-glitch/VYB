import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, X, UserPlus, UserCheck } from 'lucide-react';

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  followers: number;
  isFollowing: boolean;
  verified?: boolean;
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Arjun Mehta',
    username: '@arjun.mehta',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    bio: 'Tech enthusiast | ADYPU CS | Vibing at Unwind 2026 🔥',
    followers: 342,
    isFollowing: false,
    verified: true
  },
  {
    id: '2',
    name: 'Priya Sharma',
    username: '@priya.sharma',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    bio: 'Art major ✨ | Photography | Main character energy fr',
    followers: 589,
    isFollowing: true
  },
  {
    id: '3',
    name: 'Rahul Verma',
    username: '@rahul.v',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    bio: 'Musician 🎸 | Rock band member | No cap just vibes',
    followers: 421,
    isFollowing: false,
    verified: true
  },
  {
    id: '4',
    name: 'Ananya Joshi',
    username: '@ananya.j',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    bio: 'Dance squad captain 💃 | Unwind performer | Living my best life',
    followers: 756,
    isFollowing: false
  },
  {
    id: '5',
    name: 'Karan Singh',
    username: '@karan.singh',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    bio: 'Sports fanatic ⚽ | Fitness junkie | Understood the assignment',
    followers: 298,
    isFollowing: true
  },
  {
    id: '6',
    name: 'Diya Reddy',
    username: '@diya.reddy',
    avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
    bio: 'Fashion & lifestyle | ADYPU MBA | Slaying every day 💅',
    followers: 923,
    isFollowing: false,
    verified: true
  }
];

interface Props {
  onClose: () => void;
  onProfileClick: (userId: string) => void;
}

export function SearchView({ onClose, onProfileClick }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>(mockUsers);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.bio.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFollowToggle = (userId: string) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          isFollowing: !user.isFollowing,
          followers: user.isFollowing ? user.followers - 1 : user.followers + 1
        };
      }
      return user;
    }));
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search people, events, vibes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#D4FF00]"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {searchQuery === '' ? (
          <div className="px-4 pt-6">
            <h3 className="font-bold text-lg mb-4">Discover People</h3>
            <div className="space-y-3">
              {users.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <UserCard
                    user={user}
                    onProfileClick={onProfileClick}
                    onFollowToggle={handleFollowToggle}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="px-4 pt-4">
            <p className="text-sm text-gray-500 mb-4">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'result' : 'results'} found
            </p>
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onProfileClick={onProfileClick}
                  onFollowToggle={handleFollowToggle}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <Search className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No results found
            </h3>
            <p className="text-gray-600 text-sm">
              Try searching with different keywords, fam
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function UserCard({
  user,
  onProfileClick,
  onFollowToggle
}: {
  user: User;
  onProfileClick: (userId: string) => void;
  onFollowToggle: (userId: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl transition-colors">
      <button
        onClick={() => onProfileClick(user.id)}
        className="flex-shrink-0"
      >
        <img
          src={user.avatar}
          alt={user.name}
          className="w-12 h-12 rounded-full object-cover"
        />
      </button>

      <button
        onClick={() => onProfileClick(user.id)}
        className="flex-1 min-w-0 text-left"
      >
        <div className="flex items-center gap-1.5 mb-0.5">
          <h3 className="font-semibold text-black truncate">{user.name}</h3>
          {user.verified && (
            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-1">{user.username}</p>
        <p className="text-sm text-gray-700 truncate">{user.bio}</p>
        <p className="text-xs text-gray-500 mt-1">{user.followers} followers</p>
      </button>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onFollowToggle(user.id)}
        className={`flex-shrink-0 px-4 py-2 rounded-full font-semibold text-sm transition-all ${
          user.isFollowing
            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            : 'bg-[#D4FF00] text-black hover:bg-[#c4ef00]'
        }`}
      >
        {user.isFollowing ? (
          <div className="flex items-center gap-1">
            <UserCheck className="w-4 h-4" />
            <span>Following</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <UserPlus className="w-4 h-4" />
            <span>Follow</span>
          </div>
        )}
      </motion.button>
    </div>
  );
}
