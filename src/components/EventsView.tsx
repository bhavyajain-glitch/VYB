import { motion } from 'motion/react';
import { Calendar, MapPin, Users } from 'lucide-react';
import { useState } from 'react';
import { EventDetailModal } from './EventDetailModal';

const events = [
  {
    id: '1',
    title: 'ADYPU Tech Summit 2026',
    name: 'ADYPU Tech Summit 2026',
    banner: 'https://images.unsplash.com/photo-1649451844813-3130d6f42f8a?w=800',
    image: 'https://images.unsplash.com/photo-1649451844813-3130d6f42f8a?w=800',
    date: 'February 25, 2026',
    time: '9:00 AM - 6:00 PM',
    location: 'Main Auditorium',
    attendees: 234,
    attending: 234,
    tags: ['Tech', 'Conference'],
    description: 'Join us for the biggest tech event of the year! Network with industry leaders, attend workshops on cutting-edge technology, and participate in exciting hackathons. This is where innovation meets opportunity, fam! No cap, this event is gonna be bussin with amazing speakers and hands-on sessions.',
    organizer: 'ADYPU Tech Club & Innovation Cell',
    posts: []
  },
  {
    id: '2',
    title: 'Coding Bootcamp',
    name: 'Coding Bootcamp',
    banner: 'https://images.unsplash.com/photo-1565687981296-535f09db714e?w=800',
    image: 'https://images.unsplash.com/photo-1565687981296-535f09db714e?w=800',
    date: 'February 28, 2026',
    time: '2:00 PM - 8:00 PM',
    location: 'CS Lab Building',
    attendees: 156,
    attending: 156,
    tags: ['Workshop', 'Coding'],
    description: 'Level up your coding game with our intensive bootcamp! Learn advanced algorithms, data structures, and real-world problem solving. Perfect for anyone trying to understood the assignment when it comes to competitive programming. Bring your laptop and get ready to code like a pro! ✨',
    organizer: 'Department of Computer Science',
    posts: []
  },
  {
    id: '3',
    title: 'Cultural Night 2026',
    name: 'Cultural Night 2026',
    banner: 'https://images.unsplash.com/photo-1672841821756-fc04525771c2?w=800',
    image: 'https://images.unsplash.com/photo-1672841821756-fc04525771c2?w=800',
    date: 'March 2, 2026',
    time: '6:00 PM - 11:00 PM',
    location: 'Open Air Theatre',
    attendees: 389,
    attending: 389,
    tags: ['Cultural', 'Music'],
    description: 'Experience the ultimate cultural extravaganza! Dance performances, live music, fashion shows, and more. This is THE event where campus vibes hit different. Come through and catch the energy - it\'s gonna be lit! Main character energy only 🎭🎵',
    organizer: 'Cultural Committee & Student Council',
    posts: []
  },
  {
    id: '4',
    title: 'Hackathon 2026',
    name: 'Hackathon 2026',
    banner: 'https://images.unsplash.com/photo-1618073194229-5d838801b389?w=800',
    image: 'https://images.unsplash.com/photo-1618073194229-5d838801b389?w=800',
    date: 'March 5-6, 2026',
    time: '12:00 PM (24 hrs)',
    location: 'Innovation Center',
    attendees: 178,
    attending: 178,
    tags: ['Hackathon', 'Competition'],
    description: '24 hours of pure coding adrenaline! Build innovative solutions, compete for amazing prizes, and network with fellow developers. Free food, workshops, and mentorship sessions throughout. Lowkey the best way to flex your tech skills. Say less and sign up now! 💻🔥',
    organizer: 'ADYPU Innovation Hub',
    posts: []
  }
];

interface Props {
  joinedEvents?: string[];
  onJoinEvent?: (eventId: string) => void;
}

export function EventsView({ joinedEvents = [], onJoinEvent }: Props) {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const handleJoinClick = (event: any) => {
    setSelectedEvent(event);
  };

  const handleModalClose = () => {
    setSelectedEvent(null);
  };

  const handleJoinEvent = (eventId: string) => {
    onJoinEvent?.(eventId);
  };

  return (
    <div className="py-6 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Upcoming Events at ADYPU
      </h1>

      <div className="grid grid-cols-1 gap-4">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={event.banner}
                alt={event.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-lg font-bold text-white mb-2">{event.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 rounded-lg text-xs font-medium bg-white/20 backdrop-blur-sm text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{event.attendees} attending</span>
              </div>

              <button
                className="w-full py-3 rounded-xl bg-[#D4FF00] text-black font-bold hover:bg-[#c4ef00] transition-colors"
                onClick={() => handleJoinClick(event)}
              >
                Join Event
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isJoined={joinedEvents.includes(selectedEvent.id)}
          onClose={handleModalClose}
          onJoinEvent={handleJoinEvent}
        />
      )}
    </div>
  );
}