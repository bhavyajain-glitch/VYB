import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Coins, User, Heart, Settings, Music, Calendar, Coffee, Moon, Utensils, BookOpen } from 'lucide-react';
import type { DatingTab } from './DatingBottomNav';

interface Match {
  id: string;
  name: string;
  age: number;
  college: string;
  bio: string;
  interests: string[];
  events: string[];
  personalityTags: string[];
  image: string;
  matchedDate?: string;
}

// Current active match
const mockCurrentMatch: Match | null = {
  id: '1',
  name: 'Priya Sharma',
  age: 20,
  college: 'ADYPU',
  bio: 'Art enthusiast | Coffee lover | Looking for genuine connections',
  interests: ['Art', 'Music', 'Photography'],
  events: ['Tech Fest 2026', 'Art Exhibition'],
  personalityTags: ['Night Owl', 'Creative Soul'],
  image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
  matchedDate: '2 days ago'
};

// Blurred suggestions for discovery
const mockSuggestions: Match[] = [
  {
    id: '3',
    name: 'Anonymous',
    age: 19,
    college: 'ADYPU',
    bio: 'Love deep conversations and spontaneous adventures. Big on indie music and late-night philosophy.',
    interests: ['Music', 'Books', 'Art'],
    events: ['Music Night', 'Cultural Fest'],
    personalityTags: ['Night Owl', 'Deep Thinker', 'Music Lover'],
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'
  },
  {
    id: '4',
    name: 'Anonymous',
    age: 22,
    college: 'ADYPU',
    bio: 'Fitness enthusiast who loves trying new food spots. Always up for a spontaneous road trip.',
    interests: ['Sports', 'Food', 'Travel'],
    events: ['Sports Day', 'Food Festival'],
    personalityTags: ['Morning Person', 'Foodie', 'Adventure Seeker'],
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
  },
  {
    id: '5',
    name: 'Anonymous',
    age: 20,
    college: 'ADYPU',
    bio: 'Aspiring filmmaker with a passion for storytelling. Coffee addict and bookworm.',
    interests: ['Film', 'Photography', 'Writing'],
    events: ['Film Screening', 'Writers Workshop'],
    personalityTags: ['Creative Soul', 'Introvert-ish', 'Coffee Addict'],
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400'
  },
  {
    id: '6',
    name: 'Anonymous',
    age: 21,
    college: 'ADYPU',
    bio: 'Tech geek who loves building things. Looking for someone to explore the city with.',
    interests: ['Tech', 'Gaming', 'Food'],
    events: ['Hackathon', 'Tech Summit'],
    personalityTags: ['Night Owl', 'Tech Nerd', 'Problem Solver'],
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
  },
  {
    id: '7',
    name: 'Anonymous',
    age: 19,
    college: 'ADYPU',
    bio: 'Dance lover and psychology enthusiast. Believe in meaningful connections over small talk.',
    interests: ['Dance', 'Psychology', 'Travel'],
    events: ['Dance Competition', 'Mental Health Workshop'],
    personalityTags: ['Empathetic', 'Energetic', 'Deep Thinker'],
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400'
  },
  {
    id: '8',
    name: 'Anonymous',
    age: 20,
    college: 'ADYPU',
    bio: 'Fashion student with an eye for aesthetics. Love photography and exploring new cafes.',
    interests: ['Fashion', 'Photography', 'Art'],
    events: ['Fashion Show', 'Art Gallery Opening'],
    personalityTags: ['Creative Soul', 'Aesthetic Lover', 'Social Butterfly'],
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400'
  }
];

interface Props {
  onProfileClick?: (profileId: string) => void;
  onShowSettings?: () => void;
  activeTab: DatingTab;
  onTabChange: (tab: DatingTab) => void;
  coins: number;
  currentMatch: Match | null;
  onMatchSwitch: (match: Match, cost: number) => boolean;
  onShopClick: () => void;
}

export function DatingView({ 
  onProfileClick, 
  onShowSettings, 
  activeTab, 
  onTabChange,
  coins,
  currentMatch,
  onMatchSwitch,
  onShopClick
}: Props) {
  const [selectedSuggestion, setSelectedSuggestion] = useState<Match | null>(null);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);

  const handleSwitchVibe = (suggestion: Match) => {
    const switchCost = 100;
    const success = onMatchSwitch(suggestion, switchCost);
    if (success) {
      setSelectedSuggestion(null);
      // Show match animation
      setShowMatchAnimation(true);
      setTimeout(() => {
        setShowMatchAnimation(false);
      }, 2000);
      // Auto switch to vibe tab happens in parent (App.tsx)
    } else {
      // Show "not enough coins" message - could use toast here
      alert('Not enough coins! Visit the shop to buy more.');
    }
  };

  return (
    <div className="pb-4 min-h-screen bg-white">
      {/* Header with Tabs */}
      <div className="sticky top-16 z-40 bg-white px-4 pt-4 pb-3 border-b border-gray-100">
        {/* Top row with Dating Mode title, Coins, and Profile */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-black">Dating Mode</h2>
          
          <div className="flex items-center gap-2">
            {/* Coin Display - Clickable to open shop */}
            <button
              onClick={onShopClick}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4FF00] hover:bg-[#c4ef00] rounded-full transition-colors"
            >
              <Coins className="w-4 h-4 text-black" />
              <span className="text-sm font-bold text-black">{coins}</span>
            </button>
            
            {/* Profile Button */}
            <button
              onClick={() => setShowProfileSettings(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <User className="w-5 h-5 text-gray-900" />
            </button>
          </div>
        </div>

        {/* Tabs - Now controlled by parent */}
        <div className="flex gap-2">
          <TabButton
            active={activeTab === 'vibe'}
            onClick={() => onTabChange('vibe')}
            label="My Vibe"
          />
          <TabButton
            active={activeTab === 'chat'}
            onClick={() => onTabChange('chat')}
            label="Chat"
          />
          <TabButton
            active={activeTab === 'discover'}
            onClick={() => onTabChange('discover')}
            label="Discover"
            icon={<Sparkles className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-6">
        {activeTab === 'vibe' && (
          <MyVibeTab 
            currentMatch={currentMatch} 
            onProfileClick={onProfileClick}
          />
        )}

        {activeTab === 'chat' && (
          <ChatTab currentMatch={currentMatch} />
        )}

        {activeTab === 'discover' && (
          <DiscoverTab
            suggestions={mockSuggestions}
            onSuggestionClick={setSelectedSuggestion}
          />
        )}
      </div>

      {/* Profile Preview Sheet */}
      <AnimatePresence>
        {selectedSuggestion && (
          <ProfilePreviewSheet
            suggestion={selectedSuggestion}
            coins={coins}
            onClose={() => setSelectedSuggestion(null)}
            onSwitchVibe={handleSwitchVibe}
          />
        )}
      </AnimatePresence>

      {/* Dating Profile Settings Modal */}
      <AnimatePresence>
        {showProfileSettings && (
          <DatingProfileSettings onClose={() => setShowProfileSettings(false)} />
        )}
      </AnimatePresence>

      {/* Match Animation */}
      <AnimatePresence>
        {showMatchAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              className="bg-white rounded-3xl p-8 text-center max-w-xs mx-4 shadow-2xl"
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 10, 0],
                  scale: [1, 1.1, 1.1, 1.1, 1]
                }}
                transition={{ duration: 0.6, repeat: 2 }}
              >
                <Sparkles className="w-20 h-20 mx-auto mb-4 text-[#D4FF00]" />
              </motion.div>
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-black mb-2"
              >
                It's a Match! 🎉
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600"
              >
                Your vibe has been switched successfully!
              </motion.p>
              
              {/* Floating sparkles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 0,
                    x: 0,
                    y: 0,
                    scale: 0
                  }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    x: Math.cos(i * Math.PI / 4) * 100,
                    y: Math.sin(i * Math.PI / 4) * 100,
                    scale: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 1.5,
                    delay: 0.3 + i * 0.1,
                    ease: 'easeOut'
                  }}
                  className="absolute top-1/2 left-1/2"
                >
                  <Sparkles className="w-4 h-4 text-[#D4FF00]" />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ 
  active, 
  onClick, 
  label, 
  icon 
}: { 
  active: boolean; 
  onClick: () => void; 
  label: string; 
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-4 py-2.5 rounded-full font-semibold text-sm transition-all ${
        active
          ? 'bg-black text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <div className="flex items-center justify-center gap-1.5">
        {icon}
        <span>{label}</span>
      </div>
    </button>
  );
}

function MyVibeTab({ 
  currentMatch, 
  onProfileClick 
}: { 
  currentMatch: Match | null; 
  onProfileClick?: (id: string) => void;
}) {
  if (!currentMatch) {
    return (
      <div className="text-center py-16 px-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Heart className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900">
          Your fest vibe will appear here
        </h3>
        <p className="text-gray-600">
          Discover someone special in the Discover tab
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden shadow-lg"
      >
        <div className="aspect-[3/4] relative">
          <img
            src={currentMatch.image}
            alt={currentMatch.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          <div className="absolute top-4 right-4 px-3 py-1.5 bg-[#D4FF00] rounded-full">
            <span className="text-xs font-semibold text-black">Active Vibe</span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="text-white font-bold text-2xl mb-1">
              {currentMatch.name}, {currentMatch.age}
            </h2>
            <p className="text-white/90 text-sm mb-1">{currentMatch.college}</p>
            <p className="text-white/80 text-xs mb-3">Matched {currentMatch.matchedDate}</p>
            <p className="text-white/90 text-sm mb-4">{currentMatch.bio}</p>
            <div className="flex flex-wrap gap-2">
              {currentMatch.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.button
        whileTap={{ scale: 0.98 }}
        className="w-full mt-4 py-4 bg-[#D4FF00] hover:bg-[#c4ef00] rounded-full font-semibold text-black transition-colors"
      >
        View Full Profile
      </motion.button>
    </div>
  );
}

function ChatTab({ currentMatch }: { currentMatch: Match | null }) {
  if (!currentMatch) {
    return (
      <div className="text-center py-16 px-6">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900">
          No active vibe yet
        </h3>
        <p className="text-gray-600">
          Find one to start chatting
        </p>
      </div>
    );
  }

  // Mock chat messages
  const messages = [
    { id: 1, text: "Hey! Thanks for connecting 😊", sender: 'them', time: '10:30 AM' },
    { id: 2, text: "Hi! Great to match with you!", sender: 'me', time: '10:32 AM' },
    { id: 3, text: "I saw you're into art too. Going to the Art Exhibition?", sender: 'them', time: '10:35 AM' },
    { id: 4, text: "Yes! I'm so excited about it. Are you?", sender: 'me', time: '10:37 AM' },
  ];

  return (
    <div className="max-w-sm mx-auto">
      {/* Chat Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
        <img
          src={currentMatch.image}
          alt={currentMatch.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-black">{currentMatch.name}</h3>
          <p className="text-sm text-green-600 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-600 rounded-full"></span>
            Active now
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4 mb-20">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                message.sender === 'me'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className={`text-xs mt-1 ${
                message.sender === 'me' ? 'text-white/60' : 'text-gray-500'
              }`}>
                {message.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3">
        <div className="max-w-sm mx-auto flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#D4FF00]"
          />
          <button className="w-11 h-11 bg-[#D4FF00] hover:bg-[#c4ef00] rounded-full flex items-center justify-center transition-colors">
            <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function DiscoverTab({ 
  suggestions, 
  onSuggestionClick 
}: { 
  suggestions: Match[]; 
  onSuggestionClick: (suggestion: Match) => void;
}) {
  return (
    <div className="max-w-sm mx-auto">
      <div className="mb-4 text-center">
        <p className="text-sm text-gray-600">
          Tap a profile to learn more and switch your vibe
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {suggestions.map((suggestion) => (
          <BlurredProfileCard
            key={suggestion.id}
            suggestion={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
          />
        ))}
      </div>
    </div>
  );
}

function BlurredProfileCard({ 
  suggestion, 
  onClick 
}: { 
  suggestion: Match; 
  onClick: () => void;
}) {
  const getIconForInterest = (interest: string) => {
    const icons: Record<string, any> = {
      'Music': Music,
      'Art': BookOpen,
      'Food': Utensils,
      'Coffee': Coffee,
      'Books': BookOpen,
    };
    const Icon = icons[interest] || Sparkles;
    return <Icon className="w-3.5 h-3.5" />;
  };

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden cursor-pointer aspect-[3/4] shadow-md"
    >
      {/* Heavily Blurred Image */}
      <div className="absolute inset-0">
        <img
          src={suggestion.image}
          alt="Profile"
          className="w-full h-full object-cover"
          style={{ filter: 'blur(40px)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
      </div>

      {/* Content Overlay */}
      <div className="relative h-full flex flex-col justify-end p-3">
        {/* Interests */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {suggestion.interests.slice(0, 3).map((interest) => (
            <span
              key={interest}
              className="flex items-center gap-1 px-2 py-1 bg-white/25 backdrop-blur-md rounded-full text-white text-xs font-medium"
            >
              {getIconForInterest(interest)}
              {interest}
            </span>
          ))}
        </div>

        {/* Event Badge */}
        {suggestion.events[0] && (
          <div className="flex items-center gap-1 mb-2">
            <Calendar className="w-3 h-3 text-[#D4FF00]" />
            <span className="text-[#D4FF00] text-xs font-medium">
              {suggestion.events[0]}
            </span>
          </div>
        )}

        {/* Personality Tags */}
        <div className="flex flex-wrap gap-1">
          {suggestion.personalityTags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-[#D4FF00]/90 backdrop-blur-sm rounded-full text-black text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Tap indicator */}
      <div className="absolute top-3 right-3 w-8 h-8 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
    </motion.div>
  );
}

function ProfilePreviewSheet({ 
  suggestion, 
  coins,
  onClose, 
  onSwitchVibe 
}: { 
  suggestion: Match; 
  coins: number;
  onClose: () => void;
  onSwitchVibe: (suggestion: Match) => void;
}) {
  const switchCost = 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl w-full max-w-md max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Profile Preview</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Blurred Image */}
          <div className="relative rounded-2xl overflow-hidden aspect-[3/4] mb-6">
            <img
              src={suggestion.image}
              alt="Profile"
              className="w-full h-full object-cover"
              style={{ filter: 'blur(30px)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-medium">Identity hidden until match</p>
              </div>
            </div>
          </div>

          {/* Interests */}
          <div className="mb-6">
            <h4 className="font-semibold text-black mb-3">Interests</h4>
            <div className="flex flex-wrap gap-2">
              {suggestion.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1.5 bg-gray-100 rounded-full text-sm font-medium text-gray-900"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {/* Events */}
          <div className="mb-6">
            <h4 className="font-semibold text-black mb-3">Attending Events</h4>
            <div className="space-y-2">
              {suggestion.events.map((event) => (
                <div key={event} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-[#D4FF00]" />
                  <span className="text-sm text-gray-900">{event}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Personality Tags */}
          <div className="mb-6">
            <h4 className="font-semibold text-black mb-3">Vibe</h4>
            <div className="flex flex-wrap gap-2">
              {suggestion.personalityTags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-[#D4FF00]/20 rounded-full text-sm font-medium text-black border border-[#D4FF00]/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Anonymous Bio */}
          <div className="mb-6">
            <h4 className="font-semibold text-black mb-3">About</h4>
            <p className="text-gray-700 text-sm leading-relaxed">
              {suggestion.bio}
            </p>
          </div>

          {/* CTA Button */}
          <div className="space-y-3">
            <button
              onClick={() => onSwitchVibe(suggestion)}
              disabled={coins < switchCost}
              className={`w-full py-4 rounded-full font-semibold transition-colors ${
                coins >= switchCost
                  ? 'bg-[#D4FF00] hover:bg-[#c4ef00] text-black'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Switch My Vibe ({switchCost} coins)
            </button>
            <p className="text-center text-xs text-gray-500">
              You can only have one active match at a time
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DatingProfileSettings({ onClose }: { onClose: () => void }) {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Dating Profile</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Photos */}
          <div>
            <h4 className="font-semibold text-black mb-3">Profile Photos</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                <span className="text-2xl text-gray-400">+</span>
              </div>
              <div className="aspect-square bg-gray-200 rounded-xl"></div>
              <div className="aspect-square bg-gray-200 rounded-xl"></div>
            </div>
          </div>

          {/* Dating Bio */}
          <div>
            <h4 className="font-semibold text-black mb-3">Dating Bio</h4>
            <textarea
              placeholder="Tell people about yourself..."
              className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-[#D4FF00]"
              defaultValue="Art enthusiast | Coffee lover | Looking for genuine connections"
            />
          </div>

          {/* Interests */}
          <div>
            <h4 className="font-semibold text-black mb-3">Interests</h4>
            <div className="flex flex-wrap gap-2">
              {['Art', 'Music', 'Photography', 'Travel', 'Food', 'Tech'].map((interest) => (
                <button
                  key={interest}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-[#D4FF00] rounded-full text-sm font-medium transition-colors"
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Pause Dating */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-black">Pause Dating</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Hide your profile temporarily
                </p>
              </div>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`w-12 h-7 rounded-full transition-colors ${
                  isPaused ? 'bg-[#D4FF00]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    isPaused ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button className="w-full py-4 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-colors">
            Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}