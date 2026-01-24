import { motion } from 'motion/react';
import { Mail, Grid, Tag, Users, User as UserIcon } from 'lucide-react';
import { useState } from 'react';

interface Props {
  profileId: string;
  onBack: () => void;
}

export function ProfileView({ profileId, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<'grid' | 'calendar' | 'tag' | 'user'>('calendar');

  const isCurrentUser = profileId === 'current-user';

  const profile = {
    name: 'Aditya Prasodjo',
    username: 'aditya_prasodjo',
    avatar: 'https://i.pravatar.cc/300?img=8',
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    bio: '🎬 Content creator & Filmmaker',
    location: '📍 Surabaya, Indonesia',
    posts: 200,
    followers: 97500,
    following: 121,
    likes: 3250000,
    posts_images: [
      'https://images.unsplash.com/photo-1663162551013-8bb8ab151e11?w=400',
      'https://images.unsplash.com/photo-1649451844813-3130d6f42f8a?w=400',
      'https://images.unsplash.com/photo-1618073194229-5d838801b389?w=400',
      'https://images.unsplash.com/photo-1720323650006-6dd831b7c8b3?w=400',
      'https://images.unsplash.com/photo-1565687981296-535f09db714e?w=400',
      'https://images.unsplash.com/photo-1762158007836-25d13ab34c1c?w=400'
    ]
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="bg-white pb-4">
      {/* Profile Header with Cover */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
          <img
            src={profile.coverImage}
            alt="Cover"
            className="w-full h-full object-cover opacity-60"
          />
        </div>
        
        <div className="px-4 pb-4">
          {/* Avatar */}
          <div className="relative -mt-16 mb-4">
            <div className="w-28 h-28 rounded-full border-4 border-white overflow-hidden bg-white">
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mb-4">
            {!isCurrentUser && (
              <>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                  <Mail className="w-4 h-4" />
                </button>
                <button className="flex-1 py-2 bg-[#D4FF00] text-black font-bold rounded-lg text-sm">
                  Follow
                </button>
              </>
            )}
          </div>

          {/* Profile Info */}
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-900 mb-1">{profile.name}</h1>
            <p className="text-sm text-gray-600 mb-1">{profile.bio}</p>
            <p className="text-sm text-gray-600">{profile.location}</p>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-around py-4 border-y border-gray-100">
            <div className="text-center">
              <div className="font-bold text-lg text-gray-900">{profile.posts}</div>
              <div className="text-xs text-gray-500">Posts</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-gray-900">{formatNumber(profile.followers)}</div>
              <div className="text-xs text-gray-500">Followers</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-gray-900">{profile.following}</div>
              <div className="text-xs text-gray-500">Following</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-gray-900">{formatNumber(profile.likes)}</div>
              <div className="text-xs text-gray-500">Likes</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center justify-around py-4">
            <button
              onClick={() => setActiveTab('grid')}
              className={`p-2 ${activeTab === 'grid' ? 'text-gray-900' : 'text-gray-400'}`}
            >
              <Grid className="w-6 h-6" />
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`p-2 ${activeTab === 'calendar' ? 'text-gray-900' : 'text-gray-400'}`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="6" width="18" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
                <path d="M3 10h18M8 6V4M16 6V4"/>
              </svg>
            </button>
            <button
              onClick={() => setActiveTab('tag')}
              className={`p-2 ${activeTab === 'tag' ? 'text-gray-900' : 'text-gray-400'}`}
            >
              <Tag className="w-6 h-6" />
            </button>
            <button
              onClick={() => setActiveTab('user')}
              className={`p-2 ${activeTab === 'user' ? 'text-gray-900' : 'text-gray-400'}`}
            >
              <UserIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-1">
        {profile.posts_images.map((img, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className="aspect-square bg-gray-100 relative overflow-hidden"
          >
            <img
              src={img}
              alt={`Post ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {index === 1 && (
              <div className="absolute top-2 right-2">
                <svg className="w-5 h-5 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
            )}
            {index === 2 && (
              <div className="absolute top-2 right-2 bg-black/50 rounded px-2 py-0.5 text-white text-xs font-semibold">
                1:26
              </div>
            )}
            {index === 4 && (
              <div className="absolute top-2 right-2 bg-black/50 rounded px-2 py-0.5 text-white text-xs font-semibold">
                0:15
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
