import { motion } from 'motion/react';
import { Home, Calendar, Users, MessageCircle, User } from 'lucide-react';
import type { View } from '../App';

interface Props {
  currentView: View;
  onViewChange: (view: View) => void;
}

export function MobileNav({ currentView, onViewChange }: Props) {
  const navItems = [
    { id: 'feed' as View, icon: Home },
    { id: 'events' as View, icon: Calendar },
    { id: 'people' as View, icon: Users },
    { id: 'messages' as View, icon: MessageCircle },
    { id: 'profile' as View, icon: User }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
      <div className="flex justify-around items-center px-4 py-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => onViewChange(item.id)}
              className="p-3"
            >
              <Icon
                className={`w-7 h-7 ${
                  isActive
                    ? 'text-gray-900'
                    : 'text-gray-400'
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}