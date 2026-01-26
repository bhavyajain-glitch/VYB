import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Moon, Sun } from 'lucide-react';
import { CollegeHeader } from './CollegeHeader';
import { EventsTab } from './EventsTab';
import { PeopleTab } from './PeopleTab';
import { FeedTab } from './FeedTab';
import { ProjectsTab } from './ProjectsTab';

interface Props {
  collegeName: string;
  onEventClick: (eventId: string) => void;
  onProfileClick: (profileId: string) => void;
  onBack: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

type Tab = 'events' | 'people' | 'feed' | 'projects';

export function CollegeHub({ collegeName, onEventClick, onProfileClick, onBack, isDarkMode, onToggleTheme }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('events');

  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-700" />}
          </button>
        </div>
      </div>

      <CollegeHeader collegeName={collegeName} isDarkMode={isDarkMode} />

      <div className="sticky top-[73px] z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex justify-around px-4">
          {(['events', 'people', 'feed', 'projects'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative py-4 px-4 capitalize transition-colors"
            >
              <span className={`${
                activeTab === tab
                  ? 'text-purple-600 dark:text-purple-400 font-semibold'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {tab}
              </span>
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'events' && <EventsTab onEventClick={onEventClick} isDarkMode={isDarkMode} />}
          {activeTab === 'people' && <PeopleTab onProfileClick={onProfileClick} isDarkMode={isDarkMode} />}
          {activeTab === 'feed' && <FeedTab isDarkMode={isDarkMode} />}
          {activeTab === 'projects' && <ProjectsTab isDarkMode={isDarkMode} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
