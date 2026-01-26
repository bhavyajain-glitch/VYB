import { motion } from 'motion/react';
import { MessageCircle, UserPlus } from 'lucide-react';

const people = [
  {
    id: '1',
    name: 'Priya Sharma',
    username: 'priya.sharma',
    avatar: 'https://i.pravatar.cc/300?img=5',
    year: 'Junior',
    major: 'Computer Science',
    bio: 'Tech enthusiast | Event organizer',
    tags: ['React', 'Python', 'AI'],
    lookingFor: 'Teammate'
  },
  {
    id: '2',
    name: 'Rahul Desai',
    username: 'rahul.desai',
    avatar: 'https://i.pravatar.cc/300?img=12',
    year: 'Senior',
    major: 'Software Engineering',
    bio: 'Building cool stuff | Hackathon lover',
    tags: ['JavaScript', 'Node.js', 'AWS'],
    lookingFor: 'Networking'
  },
  {
    id: '3',
    name: 'Ananya Patel',
    username: 'ananya.p',
    avatar: 'https://i.pravatar.cc/300?img=9',
    year: 'Sophomore',
    major: 'Design',
    bio: 'UI/UX Designer | Creative mind',
    tags: ['Figma', 'Design', 'UX'],
    lookingFor: 'Friends'
  },
  {
    id: '4',
    name: 'Arjun Mehta',
    username: 'arjun.m',
    avatar: 'https://i.pravatar.cc/300?img=13',
    year: 'Junior',
    major: 'Data Science',
    bio: 'Data lover | ML enthusiast',
    tags: ['Python', 'ML', 'Data'],
    lookingFor: 'Teammate'
  },
  {
    id: '5',
    name: 'Neha Kulkarni',
    username: 'neha.k',
    avatar: 'https://i.pravatar.cc/300?img=10',
    year: 'Senior',
    major: 'Business',
    bio: 'Entrepreneur | Startup enthusiast',
    tags: ['Marketing', 'Strategy', 'Business'],
    lookingFor: 'Networking'
  },
  {
    id: '6',
    name: 'Vikram Singh',
    username: 'vikram.s',
    avatar: 'https://i.pravatar.cc/300?img=15',
    year: 'Sophomore',
    major: 'Electronics',
    bio: 'Hardware hacker | IoT projects',
    tags: ['Arduino', 'IoT', 'Hardware'],
    lookingFor: 'Teammate'
  }
];

interface Props {
  onProfileClick: (profileId: string) => void;
}

export function PeopleView({ onProfileClick }: Props) {
  return (
    <div className="py-6 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        People at ADYPU
      </h1>

      <div className="grid grid-cols-1 gap-4">
        {people.map((person, index) => (
          <motion.div
            key={person.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <button
                onClick={() => onProfileClick(person.id)}
                className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0"
              >
                <img
                  src={person.avatar}
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              </button>
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => onProfileClick(person.id)}
                  className="text-left"
                >
                  <h3 className="font-bold text-gray-900 text-lg">
                    {person.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    @{person.username}
                  </p>
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  {person.year} • {person.major}
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-3">
              {person.bio}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {person.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button className="flex-1 py-2 rounded-lg bg-[#D4FF00] text-black font-bold text-sm hover:bg-[#c4ef00] transition-colors">
                Follow
              </button>
              <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                <MessageCircle className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}