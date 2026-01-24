import { motion } from 'motion/react';
import { Calendar, MapPin, Users, Tag } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  banner: string;
  date: string;
  time: string;
  location: string;
  tags: string[];
  attendees: number;
}

const events: Event[] = [
  {
    id: '1',
    name: 'HackStanford 2026',
    banner: 'https://images.unsplash.com/photo-1565687981296-535f09db714e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWNrYXRob24lMjBjb2RpbmclMjBldmVudHxlbnwxfHx8fDE3NjkwMTY0MTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    date: 'Feb 15-17',
    time: '9:00 AM',
    location: 'Gates Computer Science',
    tags: ['Hackathon', 'Tech'],
    attendees: 342
  },
  {
    id: '2',
    name: 'Spring Music Festival',
    banner: 'https://images.unsplash.com/photo-1672841821756-fc04525771c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMGZlc3RpdmFsJTIwY29uY2VydHxlbnwxfHx8fDE3Njg5MzI1NTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    date: 'Feb 22',
    time: '6:00 PM',
    location: 'Memorial Auditorium',
    tags: ['Cultural', 'Music'],
    attendees: 567
  },
  {
    id: '3',
    name: 'AI Workshop Series',
    banner: 'https://images.unsplash.com/photo-1762158007836-25d13ab34c1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b3Jrc2hvcCUyMHByZXNlbnRhdGlvbnxlbnwxfHx8fDE3Njg5MjI4Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    date: 'Feb 20',
    time: '2:00 PM',
    location: 'Huang Engineering',
    tags: ['Workshop', 'AI'],
    attendees: 145
  },
  {
    id: '4',
    name: 'Basketball Championship',
    banner: 'https://images.unsplash.com/photo-1736752085964-3ece9fede726?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBiYXNrZXRiYWxsJTIwZ2FtZXxlbnwxfHx8fDE3Njg5NjkyMjR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    date: 'Feb 25',
    time: '7:30 PM',
    location: 'Maples Pavilion',
    tags: ['Sports', 'Basketball'],
    attendees: 892
  }
];

interface Props {
  onEventClick: (eventId: string) => void;
  isDarkMode: boolean;
}

export function EventsTab({ onEventClick, isDarkMode }: Props) {
  return (
    <div className="p-4 space-y-4 pb-8">
      {events.map((event, index) => (
        <motion.button
          key={event.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onEventClick(event.id)}
          className="w-full rounded-3xl overflow-hidden shadow-md bg-white dark:bg-gray-800 hover:shadow-xl transition-all"
        >
          <div className="relative h-48 overflow-hidden">
            <img
              src={event.banner}
              alt={event.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-xl font-bold text-white mb-1">{event.name}</h3>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-4 text-left">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4" />
                <span>{event.attendees} attending</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <MapPin className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-center"
            >
              Join Event
            </motion.div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
