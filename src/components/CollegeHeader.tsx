import { MapPin, Users, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  collegeName: string;
  isDarkMode: boolean;
}

export function CollegeHeader({ collegeName, isDarkMode }: Props) {
  const collegeData = {
    logo: '🎓',
    location: 'Stanford, CA',
    activeUsers: 3421,
    upcomingEvents: 24,
    coverImage: 'https://images.unsplash.com/photo-1603857365671-93cd96dc1df8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYWVyaWFsfGVufDF8fHx8MTc2ODkxMjY3MHww&ixlib=rb-4.1.0&q=80&w=1080'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-4 mt-4 mb-4 rounded-3xl overflow-hidden shadow-lg bg-white dark:bg-gray-800"
    >
      <div className="relative h-32 overflow-hidden">
        <img
          src={collegeData.coverImage}
          alt={collegeName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-4 left-4 text-5xl">{collegeData.logo}</div>
      </div>
      
      <div className="p-5">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{collegeName}</h2>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {collegeData.location}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
              <Users className="w-4 h-4 text-pink-600 dark:text-pink-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {collegeData.activeUsers.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Events</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {collegeData.upcomingEvents}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
