import { motion } from 'motion/react';
import { Home, Calendar, MessageCircle, User } from 'lucide-react';

interface Props {
  activeTab: 'home' | 'events' | 'messages' | 'profile';
  onTabChange: (tab: 'home' | 'events' | 'messages' | 'profile') => void;
  isDarkMode: boolean;
}

export function BottomNavigation({ activeTab, onTabChange, isDarkMode }: Props) {
  const tabs = [
    { id: 'home' as const, icon: Home, label: 'Home' },
    { id: 'events' as const, icon: Calendar, label: 'Events' },
    { id: 'messages' as const, icon: MessageCircle, label: 'Messages' },
    { id: 'profile' as const, icon: User, label: 'Profile' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center pb-safe">
      <div className="max-w-md w-full mx-auto px-4 pb-4">
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl px-6 py-4"
        >
          <div className="flex justify-around items-center">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onTabChange(tab.id)}
                  className="relative flex flex-col items-center gap-1 py-2 px-4 transition-colors"
                >
                  <div className={`relative ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <Icon className="w-6 h-6" />
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </div>
                  <span className={`text-xs font-medium ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {tab.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
