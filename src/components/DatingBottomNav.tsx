import { motion } from 'motion/react';
import { Heart, MessageCircle, Sparkles } from 'lucide-react';

export type DatingTab = 'vibe' | 'chat' | 'discover';

interface Props {
  activeTab: DatingTab;
  onTabChange: (tab: DatingTab) => void;
}

export function DatingBottomNav({ activeTab, onTabChange }: Props) {
  const navItems = [
    { id: 'vibe' as DatingTab, icon: Heart, label: 'My Vibe' },
    { id: 'chat' as DatingTab, icon: MessageCircle, label: 'Chat' },
    { id: 'discover' as DatingTab, icon: Sparkles, label: 'Discover' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around px-4 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => onTabChange(item.id)}
                className="flex flex-col items-center justify-center gap-1 py-2 px-6 min-w-[80px]"
              >
                <div className={`p-2 rounded-full transition-colors ${
                  isActive ? 'bg-[#D4FF00]' : 'bg-transparent'
                }`}>
                  <Icon
                    className={`w-6 h-6 ${
                      isActive ? 'text-black' : 'text-gray-400'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                    fill={isActive && item.id === 'vibe' ? 'black' : 'none'}
                  />
                </div>
                <span className={`text-xs font-medium ${
                  isActive ? 'text-black' : 'text-gray-400'
                }`}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
