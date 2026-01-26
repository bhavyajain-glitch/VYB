import { motion } from 'motion/react';
import { MapPin } from 'lucide-react';

interface Person {
  id: string;
  name: string;
  photo: string;
  year: string;
  major: string;
  skills: string[];
  lookingFor: string;
}

const people: Person[] = [
  {
    id: '1',
    name: 'Alex Chen',
    photo: 'https://images.unsplash.com/photo-1719861915316-449b8de4b0f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwc3R1ZHlpbmclMjBwb3J0cmFpdHxlbnwxfHx8fDE3Njg5MzgyMjl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    year: 'Junior',
    major: 'Computer Science',
    skills: ['React', 'Python', 'ML'],
    lookingFor: 'Teammate'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    photo: 'https://i.pravatar.cc/300?img=5',
    year: 'Senior',
    major: 'Product Design',
    skills: ['Figma', 'UX Research', 'Prototyping'],
    lookingFor: 'Networking'
  },
  {
    id: '3',
    name: 'Michael Park',
    photo: 'https://i.pravatar.cc/300?img=12',
    year: 'Sophomore',
    major: 'Business',
    skills: ['Marketing', 'Strategy', 'Analytics'],
    lookingFor: 'Friends'
  },
  {
    id: '4',
    name: 'Emily Rodriguez',
    photo: 'https://i.pravatar.cc/300?img=9',
    year: 'Junior',
    major: 'Data Science',
    skills: ['Statistics', 'R', 'Visualization'],
    lookingFor: 'Teammate'
  },
  {
    id: '5',
    name: 'David Kim',
    photo: 'https://i.pravatar.cc/300?img=13',
    year: 'Senior',
    major: 'Electrical Engineering',
    skills: ['Hardware', 'Embedded', 'IoT'],
    lookingFor: 'Networking'
  },
  {
    id: '6',
    name: 'Jessica Lee',
    photo: 'https://i.pravatar.cc/300?img=45',
    year: 'Sophomore',
    major: 'Biology',
    skills: ['Research', 'Lab Work', 'Writing'],
    lookingFor: 'Friends'
  }
];

interface Props {
  onProfileClick: (profileId: string) => void;
  isDarkMode: boolean;
}

export function PeopleTab({ onProfileClick, isDarkMode }: Props) {
  return (
    <div className="p-4 pb-8">
      <div className="grid grid-cols-2 gap-4">
        {people.map((person, index) => (
          <motion.button
            key={person.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onProfileClick(person.id)}
            className="rounded-3xl overflow-hidden shadow-md bg-white dark:bg-gray-800 hover:shadow-xl transition-all text-left"
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={person.photo}
                alt={person.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="font-bold text-white text-lg mb-0.5">{person.name}</h3>
                <p className="text-xs text-white/90">{person.year} • {person.major}</p>
              </div>
            </div>
            
            <div className="p-3">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {person.skills.slice(0, 2).map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 rounded-lg text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                  >
                    {skill}
                  </span>
                ))}
                {person.skills.length > 2 && (
                  <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    +{person.skills.length - 2}
                  </span>
                )}
              </div>
              
              <div className="px-2 py-1.5 rounded-lg bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 text-xs font-medium text-center">
                {person.lookingFor}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
