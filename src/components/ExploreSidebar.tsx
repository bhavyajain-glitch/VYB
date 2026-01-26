import { UserPlus } from 'lucide-react';

interface Props {
  onProfileClick: (profileId: string) => void;
}

const suggestions = [
  { 
    id: '1', 
    name: 'Neha Gupta', 
    username: 'neha_gupta', 
    avatar: 'https://i.pravatar.cc/150?img=10',
    context: 'Followed by rahul_codes'
  },
  { 
    id: '2', 
    name: 'Karan Mehta', 
    username: 'karan_mehta', 
    avatar: 'https://i.pravatar.cc/150?img=15',
    context: 'Followed by priya_desig...'
  },
  { 
    id: '3', 
    name: 'Divya Reddy', 
    username: 'divya_reddy', 
    avatar: 'https://i.pravatar.cc/150?img=20',
    context: 'in TechFest 2026'
  },
  { 
    id: '4', 
    name: 'Rohan Kumar', 
    username: 'rohan_kumar', 
    avatar: 'https://i.pravatar.cc/150?img=25',
    context: 'Followed by sneha_ml'
  },
  { 
    id: '5', 
    name: 'Ananya Shah', 
    username: 'ananya_shah', 
    avatar: 'https://i.pravatar.cc/150?img=30',
    context: 'in Cultural Fest + 1 more'
  }
];

export function ExploreSidebar({ onProfileClick }: Props) {
  return (
    <div className="p-8 pt-8">
      {/* College Info Card */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg">
            AD
          </div>
          <div>
            <p className="font-bold text-sm text-gray-900">ADYPU</p>
            <p className="text-xs text-gray-500">Ajeenkya D Y Patil University</p>
          </div>
        </div>
        <button className="text-xs font-semibold text-blue-500 hover:text-blue-700">
          Switch
        </button>
      </div>

      {/* Suggestions */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm font-semibold text-gray-500">
            Suggested for you
          </p>
          <button className="text-xs font-semibold text-gray-900 hover:text-gray-500">
            See All
          </button>
        </div>

        <div className="space-y-3">
          {suggestions.map((user) => (
            <div key={user.id} className="flex items-center justify-between gap-3">
              <button 
                onClick={() => onProfileClick(user.id)}
                className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 flex-shrink-0">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {user.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.context}</p>
                </div>
              </button>
              <button className="text-xs font-semibold text-blue-500 hover:text-blue-700 flex-shrink-0">
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-8 text-xs text-gray-400 space-y-2">
        <div className="flex flex-wrap gap-1">
          <a href="#" className="hover:underline">About</a>
          <span>·</span>
          <a href="#" className="hover:underline">Help</a>
          <span>·</span>
          <a href="#" className="hover:underline">Privacy</a>
          <span>·</span>
          <a href="#" className="hover:underline">Terms</a>
        </div>
        <p>© 2026 CampusConnect</p>
      </div>
    </div>
  );
}