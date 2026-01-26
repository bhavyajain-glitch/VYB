import { motion } from 'motion/react';
import { Users, Briefcase } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  teamSize: number;
  currentMembers: number;
  author: {
    name: string;
    avatar: string;
  };
}

const projects: Project[] = [
  {
    id: '1',
    title: 'AI Study Companion App',
    description: 'Building an intelligent study assistant that helps students organize notes, create quizzes, and track study progress using AI.',
    requiredSkills: ['React Native', 'Python', 'ML'],
    teamSize: 5,
    currentMembers: 3,
    author: { name: 'Alex Chen', avatar: 'https://i.pravatar.cc/150?img=8' }
  },
  {
    id: '2',
    title: 'Campus Food Delivery Platform',
    description: 'A student-run food delivery service connecting campus restaurants with hungry students. Lower fees, faster delivery.',
    requiredSkills: ['Full Stack', 'Mobile Dev', 'UI/UX'],
    teamSize: 6,
    currentMembers: 4,
    author: { name: 'Sarah Martinez', avatar: 'https://i.pravatar.cc/150?img=10' }
  },
  {
    id: '3',
    title: 'Sustainable Campus Initiative',
    description: 'Creating an app to track and gamify sustainable practices on campus. Earn points for recycling, biking, and reducing waste.',
    requiredSkills: ['React', 'Node.js', 'Design'],
    teamSize: 4,
    currentMembers: 2,
    author: { name: 'Emma Wilson', avatar: 'https://i.pravatar.cc/150?img=5' }
  },
  {
    id: '4',
    title: 'Student Marketplace',
    description: 'Buy, sell, and trade textbooks, furniture, and other items within the campus community. Safe and verified transactions.',
    requiredSkills: ['Web Dev', 'Backend', 'Payment APIs'],
    teamSize: 4,
    currentMembers: 2,
    author: { name: 'Michael Kim', avatar: 'https://i.pravatar.cc/150?img=12' }
  }
];

interface Props {
  isDarkMode: boolean;
}

export function ProjectsTab({ isDarkMode }: Props) {
  return (
    <div className="p-4 space-y-4 pb-8">
      {projects.map((project, index) => (
        <motion.div
          key={project.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-5 rounded-3xl shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-start gap-3 mb-4">
            <img
              src={project.author.avatar}
              alt={project.author.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">{project.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">by {project.author.name}</p>
            </div>
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm leading-relaxed">
            {project.description}
          </p>

          <div className="mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Required Skills:</p>
            <div className="flex flex-wrap gap-2">
              {project.requiredSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>
                {project.currentMembers}/{project.teamSize} members
              </span>
            </div>
            <div className="flex -space-x-2">
              {[...Array(project.currentMembers)].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white dark:border-gray-800"
                />
              ))}
              {[...Array(project.teamSize - project.currentMembers)].map((_, i) => (
                <div
                  key={i + project.currentMembers}
                  className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center"
                >
                  <span className="text-xs text-gray-400">?</span>
                </div>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold flex items-center justify-center gap-2"
          >
            <Briefcase className="w-4 h-4" />
            Join Team
          </motion.button>
        </motion.div>
      ))}
    </div>
  );
}
