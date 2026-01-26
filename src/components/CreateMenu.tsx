import { motion, AnimatePresence } from 'motion/react';
import { Plus, FileText, Calendar, Briefcase, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  isDarkMode: boolean;
}

export function CreateMenu({ isOpen, onClose, onToggle, isDarkMode }: Props) {
  const menuItems = [
    { id: 'post', icon: FileText, label: 'Create Post', color: 'from-blue-500 to-blue-600' },
    { id: 'event', icon: Calendar, label: 'Create Event', color: 'from-purple-500 to-purple-600' },
    { id: 'project', icon: Briefcase, label: 'Create Project', color: 'from-pink-500 to-pink-600' }
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {isOpen && (
            <>
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, scale: 0, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0, y: 20 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-3 group"
                  >
                    <span className="px-4 py-2 rounded-full bg-white dark:bg-gray-800 shadow-lg text-sm font-medium text-gray-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.label}
                    </span>
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-r ${item.color} shadow-lg flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </motion.button>
                );
              })}
            </>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggle}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 shadow-xl flex items-center justify-center"
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus className="w-8 h-8 text-white" strokeWidth={3} />
          </motion.div>
        </motion.button>
      </div>
    </>
  );
}
