import { motion } from 'motion/react';
import { LayoutGrid, Search, Plus, Calendar, User } from 'lucide-react';
import type { View } from '../App';

interface Props {
  currentView: View;
  onViewChange: (view: View) => void;
}

export function BottomNav({ currentView, onViewChange }: Props) {
  const navItems = [
    { id: 'feed' as View, icon: LayoutGrid, label: 'Home' },
    { id: 'people' as View, icon: Search, label: 'Search' },
    { id: 'create' as View, icon: Plus, label: 'Create', isCenter: true },
    { id: 'events' as View, icon: Calendar, label: 'Events' },
    { id: 'profile' as View, icon: User, label: 'Profile' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around px-4 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            if (item.isCenter) {
              return (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onViewChange(item.id)}
                  className="relative -mt-8"
                >
                  <div className="w-14 h-14 bg-[#D4FF00] rounded-full flex items-center justify-center shadow-lg">
                    <Plus className="w-7 h-7 text-black" strokeWidth={3} />
                  </div>
                </motion.button>
              );
            }
            
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => onViewChange(item.id)}
                className="flex flex-col items-center justify-center py-2 px-4 min-w-[60px]"
              >
                <Icon
                  className={`w-6 h-6 ${
                    isActive ? 'text-black' : 'text-gray-400'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
