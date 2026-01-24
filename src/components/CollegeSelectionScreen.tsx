import { motion } from 'motion/react';
import { Search, MapPin, Users, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

interface College {
  id: string;
  name: string;
  location: string;
  activeUsers: number;
  logo: string;
}

const colleges: College[] = [
  { id: '1', name: 'Stanford University', location: 'Stanford, CA', activeUsers: 3421, logo: '🎓' },
  { id: '2', name: 'MIT', location: 'Cambridge, MA', activeUsers: 2987, logo: '🔬' },
  { id: '3', name: 'UC Berkeley', location: 'Berkeley, CA', activeUsers: 4532, logo: '🐻' },
  { id: '4', name: 'Harvard University', location: 'Cambridge, MA', activeUsers: 3156, logo: '🏛️' },
  { id: '5', name: 'Carnegie Mellon', location: 'Pittsburgh, PA', activeUsers: 2341, logo: '🤖' },
  { id: '6', name: 'Georgia Tech', location: 'Atlanta, GA', activeUsers: 2876, logo: '🐝' },
];

interface Props {
  onSelectCollege: (collegeName: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export function CollegeSelectionScreen({ onSelectCollege, isDarkMode, onToggleTheme }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredColleges = colleges.filter(college =>
    college.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    college.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen p-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              CampusConnect
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Find your community</p>
          </div>
          <button
            onClick={onToggleTheme}
            className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:scale-110 transition-transform"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-700" />}
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search colleges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all dark:text-white"
          />
        </div>

        <div className="space-y-3">
          {filteredColleges.map((college, index) => (
            <motion.button
              key={college.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectCollege(college.name)}
              className="w-full p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">{college.logo}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{college.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{college.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{college.activeUsers.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
