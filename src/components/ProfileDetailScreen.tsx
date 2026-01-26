import { motion } from 'motion/react';
import { ArrowLeft, MapPin, Mail, MessageCircle, UserPlus, Calendar } from 'lucide-react';

interface Props {
  profileId: string;
  onBack: () => void;
  isDarkMode: boolean;
}

const profileDetails = {
  '1': {
    name: 'Alex Chen',
    photo: 'https://images.unsplash.com/photo-1719861915316-449b8de4b0f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwc3R1ZHlpbmclMjBwb3J0cmFpdHxlbnwxfHx8fDE3Njg5MzgyMjl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    year: 'Junior',
    major: 'Computer Science',
    bio: 'Passionate about AI and building products that make a difference. Love hackathons, coffee, and late-night coding sessions. Always down to collaborate on cool projects! 🚀',
    skills: ['React', 'Python', 'Machine Learning', 'Node.js', 'TypeScript', 'AWS'],
    interests: ['Hackathons', 'Startups', 'AI Research', 'Music Production', 'Rock Climbing'],
    eventsJoined: ['HackStanford 2026', 'AI Workshop Series', 'Spring Music Festival'],
    location: 'Stanford, CA'
  }
};

export function ProfileDetailScreen({ profileId, onBack, isDarkMode }: Props) {
  const profile = profileDetails[profileId as keyof typeof profileDetails] || profileDetails['1'];

  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <span className="font-semibold text-gray-900 dark:text-white">Profile</span>
          <div className="w-10" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative">
          <div className="h-48 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500" />
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 overflow-hidden shadow-xl"
            >
              <img
                src={profile.photo}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>

        <div className="pt-20 px-6 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{profile.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {profile.year} • {profile.major}
            </p>
            <div className="flex items-center justify-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>{profile.location}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Connect
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Invite
            </motion.button>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">About</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{profile.bio}</p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, index) => (
                <motion.span
                  key={skill}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-4 py-2 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium"
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, index) => (
                <motion.span
                  key={interest}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-4 py-2 rounded-xl bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 font-medium"
                >
                  {interest}
                </motion.span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">Joined Events</h3>
            <div className="space-y-2">
              {profile.eventsJoined.map((event, index) => (
                <motion.div
                  key={event}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {event[0]}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{event}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
