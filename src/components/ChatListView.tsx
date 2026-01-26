import { useState } from 'react';
import { motion } from 'motion/react';
import { MessageCircle, UserPlus, Search, Clock } from 'lucide-react';

interface ChatPreview {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread?: number;
  isOnline?: boolean;
}

interface ChatRequest {
  id: string;
  name: string;
  avatar: string;
  mutualFriends: number;
  message: string;
}

const mockChats: ChatPreview[] = [
  {
    id: '1',
    name: 'Arjun Mehta',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    lastMessage: 'Yo, that concert was bussin fr fr! 🔥',
    timestamp: '2m ago',
    unread: 2,
    isOnline: true
  },
  {
    id: '2',
    name: 'Priya Sharma',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    lastMessage: 'bet, see you at Unwind 2026! ✨',
    timestamp: '15m ago',
    isOnline: true
  },
  {
    id: '3',
    name: 'Rahul Verma',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    lastMessage: 'lowkey the best fest ever no cap',
    timestamp: '1h ago',
    unread: 1
  },
  {
    id: '4',
    name: 'Ananya Joshi',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    lastMessage: 'Say less, I\'m down for it!',
    timestamp: '3h ago'
  },
  {
    id: '5',
    name: 'Karan Singh',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    lastMessage: 'This event hits different 💯',
    timestamp: 'Yesterday'
  }
];

const mockRequests: ChatRequest[] = [
  {
    id: '1',
    name: 'Neha Gupta',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    mutualFriends: 8,
    message: 'Hey! Saw you at the tech fest, would love to connect! Main character energy fr ✨'
  },
  {
    id: '2',
    name: 'Vikram Patel',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400',
    mutualFriends: 12,
    message: 'Yo! Your art exhibition was fire 🔥 Understood the assignment!'
  },
  {
    id: '3',
    name: 'Diya Reddy',
    avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
    mutualFriends: 5,
    message: 'Hi! We\'re both going to Unwind 2026, let\'s vibe!'
  }
];

interface Props {
  onBack?: () => void;
}

export function ChatListView({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<'chats' | 'requests'>('chats');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-100">
        <div className="px-4 pt-4 pb-3">
          <h2 className="text-2xl font-bold text-black mb-4">Chats</h2>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search your vibes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#D4FF00]"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <TabButton
              active={activeTab === 'chats'}
              onClick={() => setActiveTab('chats')}
              label="All Chats"
              count={mockChats.length}
            />
            <TabButton
              active={activeTab === 'requests'}
              onClick={() => setActiveTab('requests')}
              label="Requests"
              count={mockRequests.length}
              icon={<UserPlus className="w-4 h-4" />}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        {activeTab === 'chats' ? (
          <ChatsTab chats={mockChats} searchQuery={searchQuery} />
        ) : (
          <RequestsTab requests={mockRequests} />
        )}
      </div>
    </div>
  );
}

function TabButton({ 
  active, 
  onClick, 
  label, 
  count,
  icon 
}: { 
  active: boolean; 
  onClick: () => void; 
  label: string; 
  count?: number;
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
      <div className="flex items-center justify-center gap-2">
        {icon}
        <span>{label}</span>
        {count !== undefined && (
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            active ? 'bg-[#D4FF00] text-black' : 'bg-gray-200 text-gray-700'
          }`}>
            {count}
          </span>
        )}
      </div>
    </button>
  );
}

function ChatsTab({ chats, searchQuery }: { chats: ChatPreview[]; searchQuery: string }) {
  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredChats.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No chats yet, fam
        </h3>
        <p className="text-gray-600 text-sm">
          Connect with people and start catching vibes! 💬
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredChats.map((chat, index) => (
        <motion.div
          key={chat.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <ChatItem chat={chat} />
        </motion.div>
      ))}
    </div>
  );
}

function ChatItem({ chat }: { chat: ChatPreview }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-start gap-3 p-3 hover:bg-gray-50 rounded-2xl transition-colors text-left"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={chat.avatar}
          alt={chat.name}
          className="w-14 h-14 rounded-full object-cover"
        />
        {chat.isOnline && (
          <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="font-semibold text-black truncate">{chat.name}</h3>
          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{chat.timestamp}</span>
        </div>
        <p className={`text-sm truncate ${
          chat.unread ? 'text-black font-medium' : 'text-gray-600'
        }`}>
          {chat.lastMessage}
        </p>
      </div>

      {/* Unread Badge */}
      {chat.unread && (
        <div className="flex-shrink-0 w-6 h-6 bg-[#D4FF00] rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-black">{chat.unread}</span>
        </div>
      )}
    </motion.button>
  );
}

function RequestsTab({ requests }: { requests: ChatRequest[] }) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No requests rn
        </h3>
        <p className="text-gray-600 text-sm">
          When someone wants to chat, they'll show up here! 📩
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request, index) => (
        <motion.div
          key={request.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <RequestItem request={request} />
        </motion.div>
      ))}
    </div>
  );
}

function RequestItem({ request }: { request: ChatRequest }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-[#D4FF00] transition-colors">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <img
          src={request.avatar}
          alt={request.name}
          className="w-14 h-14 rounded-full object-cover"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-black">{request.name}</h3>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <UserPlus className="w-3 h-3" />
            {request.mutualFriends} mutual friends
          </p>
        </div>
      </div>

      {/* Message */}
      <p className="text-sm text-gray-700 mb-4 pl-0">
        {request.message}
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="flex-1 py-2.5 bg-[#D4FF00] hover:bg-[#c4ef00] rounded-full font-semibold text-black text-sm transition-colors"
        >
          Accept
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-full font-semibold text-gray-700 text-sm transition-colors"
        >
          Decline
        </motion.button>
      </div>
    </div>
  );
}
