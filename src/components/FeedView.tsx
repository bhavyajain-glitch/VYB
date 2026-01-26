import { motion } from 'motion/react';
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react';
import { useState } from 'react';

interface Post {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
    verified?: boolean;
  };
  image?: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
}

const posts: Post[] = [
  {
    id: '1',
    author: { 
      name: 'Arjun Mehta', 
      username: 'arjun.mehta',
      avatar: 'https://i.pravatar.cc/150?img=8',
      verified: true
    },
    image: 'https://images.unsplash.com/photo-1764176269321-6d14f4af09c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBjb2xsZWdlJTIwZmVzdCUyMHN0YWdlJTIwcGVyZm9ybWFuY2V8ZW58MXx8fHwxNzY5MTI5MTQzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    caption: '🎭✨ Unwind 2026 Day 1 was INSANE! The classical fusion performance by Delhi Waale left everyone speechless 🔥 Can\'t wait for Day 2! #UnwindFest #ADYPU',
    likes: 1247,
    comments: 342,
    timestamp: '2 hours ago'
  },
  {
    id: '2',
    author: {
      name: 'Priya Sharma',
      username: 'priya.codes',
      avatar: 'https://i.pravatar.cc/150?img=5'
    },
    image: 'https://images.unsplash.com/photo-1627556704221-6d6456d42b37?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwY3VsdHVyYWwlMjBmZXN0JTIwZGFuY2V8ZW58MXx8fHwxNzY5MTI5MTQ0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    caption: '💃 Nrityanjali dance competition vibes! Our team just nailed the semi-finals 🏆 Finals tomorrow at 5 PM, see you all there! #UnwindFest #DanceLife',
    likes: 856,
    comments: 178,
    timestamp: '4 hours ago'
  },
  {
    id: '3',
    author: {
      name: 'Rohan Desai',
      username: 'rohan_d',
      avatar: 'https://i.pravatar.cc/150?img=12',
      verified: true
    },
    image: 'https://images.unsplash.com/photo-1585346230722-6b9df46d0d54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwbXVzaWMlMjBjb25jZXJ0JTIwY3Jvd2R8ZW58MXx8fHwxNzY5MTI5MTQ0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    caption: '🎸 Pro Night with The Local Train was EPIC! Best crowd energy ever!! 🤘 Thank you Unwind committee for this amazing fest 🙌 #UnwindFest #ProNight #TheLocalTrain',
    likes: 2134,
    comments: 567,
    timestamp: '6 hours ago'
  },
  {
    id: '4',
    author: {
      name: 'Ananya Iyer',
      username: 'ananya.iyer',
      avatar: 'https://i.pravatar.cc/150?img=9'
    },
    image: 'https://images.unsplash.com/photo-1762158007836-25d13ab34c1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwZXZlbnQlMjB3b3Jrc2hvcHxlbnwxfHx8fDE3NjkxMjkxNDV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    caption: '📱 Amazing turnout at the Tech Talks session! Learned so much about AI and Web3 from industry experts. Workshop on app development starts at 3 PM today 💻 #UnwindFest #TechTalks',
    likes: 543,
    comments: 89,
    timestamp: '8 hours ago'
  },
  {
    id: '5',
    author: {
      name: 'Kabir Malhotra',
      username: 'kabir.m',
      avatar: 'https://i.pravatar.cc/150?img=13'
    },
    image: 'https://images.unsplash.com/photo-1725822221340-cf74f7224bef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBmZXN0aXZhbCUyMGRlY29yYXRpb24lMjBsaWdodHN8ZW58MXx8fHwxNzY5MTI5MTQ1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    caption: '🪔✨ The decoration team outdid themselves this year! Campus looks absolutely magical for Unwind Fest! Who else is loving these vibes? 🌟 #UnwindFest #CampusLife #ADYPU',
    likes: 1089,
    comments: 245,
    timestamp: '1 day ago'
  }
];

const stories = [
  { id: 'me', name: 'Your story', avatar: null, isYourStory: true },
  { id: '1', name: 'riya.patel', avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: '2', name: 'aditya.k', avatar: 'https://i.pravatar.cc/150?img=2' },
  { id: '3', name: 'sneha.reddy', avatar: 'https://i.pravatar.cc/150?img=3' },
  { id: '4', name: 'vivek.shah', avatar: 'https://i.pravatar.cc/150?img=4' },
  { id: '5', name: 'neha.gupta', avatar: 'https://i.pravatar.cc/150?img=6' }
];

interface FeedViewProps {
  onProfileClick?: (profileId: string) => void;
  onCommentClick?: (post: any) => void;
  onStoryClick?: (userId: string) => void;
  onCameraClick?: () => void;
  onSearchClick?: () => void;
}

export function FeedView({ onProfileClick, onCommentClick, onStoryClick, onCameraClick, onSearchClick }: FeedViewProps) {
  const [likedPosts, setLikedPosts] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState<'home' | 'foryou'>('home');

  const handleLike = (postId: string) => {
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <div className="bg-white">
      {/* Stories */}
      <div className="px-4 py-4 overflow-x-auto scrollbar-hide border-b border-gray-100">
        <div className="flex gap-4">
          {stories.map((story) => (
            <button
              key={story.id}
              onClick={() => {
                if (story.isYourStory) {
                  onCameraClick?.();
                } else {
                  onStoryClick?.(story.id);
                }
              }}
              className="flex flex-col items-center gap-1 min-w-[70px]"
            >
              <div className={`relative ${story.isYourStory ? '' : 'p-[2px] bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 rounded-full'}`}>
                <div className="w-16 h-16 rounded-full border-2 border-white overflow-hidden bg-gray-200 flex items-center justify-center">
                  {story.isYourStory ? (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Plus className="w-6 h-6 text-gray-400" />
                    </div>
                  ) : (
                    <img
                      src={story.avatar!}
                      alt={story.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-900 truncate w-full text-center">
                {story.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex-1 py-3 text-sm font-semibold relative ${
            activeTab === 'home' ? 'text-black' : 'text-gray-400'
          }`}
        >
          Home
          {activeTab === 'home' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('foryou')}
          className={`flex-1 py-3 text-sm font-semibold relative ${
            activeTab === 'foryou' ? 'text-black' : 'text-gray-400'
          }`}
        >
          For you
          {activeTab === 'foryou' && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"
            />
          )}
        </button>
      </div>

      {/* Posts Feed */}
      <div className="pb-4">
        {posts.map((post) => (
          <div key={post.id} className="border-b border-gray-100 pb-4">
            {/* Post Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={() => onProfileClick && onProfileClick(post.author.username)}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm text-gray-900">
                      {post.author.username}
                    </span>
                    {post.author.verified && (
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    Ankara • {post.timestamp}
                  </span>
                </div>
              </button>
              <button className="p-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="2"/>
                  <circle cx="12" cy="12" r="2"/>
                  <circle cx="12" cy="19" r="2"/>
                </svg>
              </button>
            </div>

            {/* Post Image */}
            {post.image && (
              <div className="w-full aspect-square bg-gray-100">
                <img
                  src={post.image}
                  alt="Post"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Post Actions */}
            <div className="px-4 pt-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1"
                  >
                    <Heart
                      className={`w-6 h-6 ${
                        likedPosts[post.id] ? 'fill-red-500 text-red-500' : 'text-gray-900'
                      }`}
                    />
                    <span className="text-sm font-semibold text-gray-900">
                      {post.likes + (likedPosts[post.id] ? 1 : 0)} Likes
                    </span>
                  </button>
                  <button
                    onClick={() => onCommentClick && onCommentClick(post)}
                    className="flex items-center gap-1"
                  >
                    <MessageCircle className="w-6 h-6 text-gray-900" />
                    <span className="text-sm font-semibold text-gray-900">
                      {post.comments} Comments
                    </span>
                  </button>
                  <button>
                    <Send className="w-6 h-6 text-gray-900" />
                  </button>
                </div>
                <button>
                  <Bookmark className="w-6 h-6 text-gray-900" />
                </button>
              </div>

              <p className="text-sm text-gray-900 leading-relaxed">
                {post.caption}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}