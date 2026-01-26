import { motion } from 'motion/react';
import { Home, Calendar, Users, MessageCircle, User, PlusSquare, Search } from 'lucide-react';
import type { View } from '../App';

interface Props {
  currentView: View;
  onViewChange: (view: View) => void;
}

export function Sidebar({ currentView, onViewChange }: Props) {
  const navItems = [
    { id: 'feed' as View, icon: Home, label: 'Home' },
    { id: 'search' as View, icon: Search, label: 'Search' },
    { id: 'events' as View, icon: Calendar, label: 'Events' },
    { id: 'messages' as View, icon: MessageCircle, label: 'Messages' },
    { id: 'profile' as View, icon: User, label: 'Profile' },
    { id: 'create' as View, icon: PlusSquare, label: 'Create' }
  ];

  return (
    <div className="h-full flex flex-col p-6">
      {/* Logo */}
      <div className="mb-8 mt-4">
        <h1 className="text-2xl font-semibold text-[#8B6F47]">
          CampusConnect
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <motion.button
              key={item.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-[#E8E3D9] text-gray-900'
                  : 'text-gray-700 hover:bg-[#E8E3D9]/50'
              }`}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-base ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </nav>

      {/* More */}
      <div className="mt-4 pt-4 border-t border-gray-300">
        <motion.button
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-gray-700 hover:bg-[#E8E3D9]/50 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-base font-normal">More</span>
        </motion.button>
      </div>
    </div>
  );
}