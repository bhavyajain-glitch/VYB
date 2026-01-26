import { motion } from 'motion/react';
import { ArrowLeft, Calendar, MapPin, User, MessageCircle, Users as UsersIcon, Clock } from 'lucide-react';

interface Props {
  eventId: string;
  onBack: () => void;
  onProfileClick: (profileId: string) => void;
  isDarkMode: boolean;
}

const eventDetails = {
  '1': {
    name: 'HackStanford 2026',
    banner: 'https://images.unsplash.com/photo-1565687981296-535f09db714e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWNrYXRob24lMjBjb2RpbmclMjBldmVudHxlbnwxfHx8fDE3NjkwMTY0MTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Join us for 36 hours of innovation, collaboration, and coding! Build amazing projects, meet talented students, and compete for prizes. Whether you\'re a beginner or expert, there\'s something for everyone.',
    date: 'February 15-17, 2026',
    time: '9:00 AM - 9:00 PM',
    location: 'Gates Computer Science Building',
    organizer: { name: 'Stanford CS Club', avatar: 'https://i.pravatar.cc/150?img=20' },
    attendees: 342,
    attendeeAvatars: [
      'https://i.pravatar.cc/150?img=8',
      'https://i.pravatar.cc/150?img=10',
      'https://i.pravatar.cc/150?img=12',
      'https://i.pravatar.cc/150?img=5',
      'https://i.pravatar.cc/150?img=13'
    ],
    agenda: [
      { time: '9:00 AM', title: 'Registration & Breakfast', description: 'Check-in and meet fellow hackers' },
      { time: '10:00 AM', title: 'Opening Ceremony', description: 'Kickoff and sponsor presentations' },
      { time: '11:00 AM', title: 'Hacking Begins', description: 'Start building your projects!' },
      { time: '1:00 PM', title: 'Lunch Break', description: 'Pizza and networking' },
      { time: '6:00 PM', title: 'Workshop: AI/ML Basics', description: 'Learn from industry experts' },
      { time: '9:00 PM', title: 'Midnight Snacks', description: 'Fuel for late-night coding' }
    ]
  }
};

export function EventDetailScreen({ eventId, onBack, onProfileClick, isDarkMode }: Props) {
  const event = eventDetails[eventId as keyof typeof eventDetails] || eventDetails['1'];

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
          <span className="font-semibold text-gray-900 dark:text-white">Event Details</span>
          <div className="w-10" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative h-64 overflow-hidden">
          <img
            src={event.banner}
            alt={event.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <h1 className="text-3xl font-bold text-white mb-2">{event.name}</h1>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <img
              src={event.organizer.avatar}
              alt={event.organizer.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Organized by</p>
              <p className="font-semibold text-gray-900 dark:text-white">{event.organizer.name}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800">
              <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{event.date}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{event.time}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800">
              <MapPin className="w-5 h-5 text-pink-600 dark:text-pink-400 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{event.location}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Stanford University</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">About Event</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{event.description}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 dark:text-white">Attendees ({event.attendees})</h3>
              <button className="text-sm text-purple-600 dark:text-purple-400 font-medium">See all</button>
            </div>
            <div className="flex -space-x-3">
              {event.attendeeAvatars.map((avatar, index) => (
                <motion.img
                  key={index}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  src={avatar}
                  alt="Attendee"
                  className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-900 object-cover cursor-pointer hover:scale-110 transition-transform"
                  onClick={() => onProfileClick('1')}
                />
              ))}
              <div className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-900 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                +{event.attendees - event.attendeeAvatars.length}
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-3">Agenda</h3>
            <div className="space-y-3">
              {event.agenda.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-3"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    {index < event.agenda.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-200 dark:bg-gray-700 my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-3">
                    <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">{item.time}</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{item.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="col-span-3 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold"
            >
              Join Event
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="col-span-2 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium flex items-center justify-center gap-2"
            >
              <UsersIcon className="w-4 h-4" />
              Find Teammates
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
