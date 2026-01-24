import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Users, Heart, MessageCircle, Check } from 'lucide-react';

interface EventPost {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  image: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
}

interface EventDetails {
  id: string;
  title: string;
  image: string;
  date: string;
  location: string;
  attending: number;
  description: string;
  tags: string[];
  organizer: string;
  posts: EventPost[];
}

interface Props {
  event: EventDetails;
  isJoined: boolean;
  onClose: () => void;
  onJoinEvent: (eventId: string) => void;
}

const mockEventPosts: EventPost[] = [
  {
    id: '1',
    author: {
      name: 'Arjun Mehta',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
    },
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    caption: 'Getting ready for the tech summit! This is gonna be epic 🔥',
    likes: 124,
    comments: 23,
    timestamp: '2h ago'
  },
  {
    id: '2',
    author: {
      name: 'Priya Sharma',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'
    },
    image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800',
    caption: 'Last year\'s summit was absolutely bussin! Can\'t wait for this one 💯',
    likes: 89,
    comments: 15,
    timestamp: '5h ago'
  },
  {
    id: '3',
    author: {
      name: 'Rahul Verma',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
    },
    image: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800',
    caption: 'Speaker lineup is insane this year fr fr ✨ Understood the assignment!',
    likes: 156,
    comments: 31,
    timestamp: '1d ago'
  }
];

export function EventDetailModal({ event, isJoined: initialJoined, onClose, onJoinEvent }: Props) {
  const [activeTab, setActiveTab] = useState<'about' | 'posts'>('about');
  const [isJoined, setIsJoined] = useState(initialJoined);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleJoinEvent = () => {
    setIsJoined(true);
    setShowSuccess(true);
    onJoinEvent(event.id);
    
    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-md bg-white rounded-t-3xl max-h-[90vh] flex flex-col"
      >
        {/* Header with Cover Image */}
        <div className="relative">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-48 object-cover rounded-t-3xl"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-t-3xl" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-2xl font-bold text-white mb-2">{event.title}</h2>
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-4">
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 py-3 font-semibold text-sm transition-colors relative ${
              activeTab === 'about' ? 'text-black' : 'text-gray-500'
            }`}
          >
            About
            {activeTab === 'about' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4FF00]"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 font-semibold text-sm transition-colors relative ${
              activeTab === 'posts' ? 'text-black' : 'text-gray-500'
            }`}
          >
            Posts ({mockEventPosts.length})
            {activeTab === 'posts' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4FF00]"
              />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'about' ? (
            <div className="p-4 space-y-4">
              {/* Event Info */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-black">{event.date}</p>
                    <p className="text-sm text-gray-600">Mark your calendar, fam!</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-black">{event.location}</p>
                    <p className="text-sm text-gray-600">See you there ✨</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-black">{event.attending} attending</p>
                    <p className="text-sm text-gray-600">Join the vibe!</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-bold text-lg mb-2">About this event</h3>
                <p className="text-gray-700 leading-relaxed">{event.description}</p>
              </div>

              {/* Organizer */}
              <div>
                <h3 className="font-bold text-lg mb-2">Organized by</h3>
                <p className="text-gray-700">{event.organizer}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {mockEventPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
                >
                  {/* Post Header */}
                  <div className="flex items-center gap-3 p-3">
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-black">{post.author.name}</p>
                      <p className="text-xs text-gray-500">{post.timestamp}</p>
                    </div>
                  </div>

                  {/* Post Image */}
                  <img
                    src={post.image}
                    alt="Post"
                    className="w-full aspect-square object-cover"
                  />

                  {/* Post Actions */}
                  <div className="p-3">
                    <div className="flex items-center gap-4 mb-2">
                      <button className="flex items-center gap-1.5 text-gray-700 hover:text-black">
                        <Heart className="w-5 h-5" />
                        <span className="text-sm font-semibold">{post.likes}</span>
                      </button>
                      <button className="flex items-center gap-1.5 text-gray-700 hover:text-black">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm font-semibold">{post.comments}</span>
                      </button>
                    </div>
                    <p className="text-sm text-gray-900">{post.caption}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Join Button */}
        <div className="p-4 border-t border-gray-200">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleJoinEvent}
            disabled={isJoined}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              isJoined
                ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                : 'bg-[#D4FF00] text-black hover:bg-[#c4ef00] shadow-lg'
            }`}
          >
            {isJoined ? (
              <span className="flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                Joined Event
              </span>
            ) : (
              'Join Event'
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-[#D4FF00] text-black px-6 py-4 rounded-2xl font-bold shadow-2xl flex items-center gap-3"
          >
            <Check className="w-6 h-6" />
            <span>Event joined successfully! 🎉</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
