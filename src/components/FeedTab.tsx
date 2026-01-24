import { motion } from 'motion/react';
import { ArrowBigUp, ArrowBigDown, MessageCircle, Share2, Image as ImageIcon, BarChart3 } from 'lucide-react';
import { useState } from 'react';

interface Post {
  id: string;
  type: 'text' | 'image' | 'poll' | 'project';
  author: {
    name: string;
    avatar: string;
    college: string;
  };
  content: string;
  image?: string;
  tags: string[];
  upvotes: number;
  comments: number;
  timestamp: string;
}

const posts: Post[] = [
  {
    id: '1',
    type: 'project',
    author: { name: 'Alex Chen', avatar: 'https://i.pravatar.cc/150?img=8', college: 'Stanford' },
    content: 'Looking for 2 more developers to build an AI-powered study buddy app! We already have a designer and PM. DM if interested! 🚀',
    tags: ['Project Idea', 'AI', 'Mobile'],
    upvotes: 47,
    comments: 12,
    timestamp: '2h ago'
  },
  {
    id: '2',
    type: 'image',
    author: { name: 'Sarah Martinez', avatar: 'https://i.pravatar.cc/150?img=10', college: 'Stanford' },
    content: 'Amazing turnout at today\'s AI workshop! Thanks to everyone who came 🎉',
    image: 'https://images.unsplash.com/photo-1762158007836-25d13ab34c1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b3Jrc2hvcCUyMHByZXNlbnRhdGlvbnxlbnwxfHx8fDE3Njg5MjI4Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    tags: ['Workshop', 'AI'],
    upvotes: 134,
    comments: 23,
    timestamp: '4h ago'
  },
  {
    id: '3',
    type: 'poll',
    author: { name: 'Michael Kim', avatar: 'https://i.pravatar.cc/150?img=12', college: 'Stanford' },
    content: 'Which tech stack should we use for the hackathon project?',
    tags: ['Question', 'Hackathon'],
    upvotes: 28,
    comments: 45,
    timestamp: '6h ago'
  },
  {
    id: '4',
    type: 'text',
    author: { name: 'Emma Wilson', avatar: 'https://i.pravatar.cc/150?img=5', college: 'Stanford' },
    content: 'Pro tip: The library gets super crowded after 2pm. Get there early if you need a quiet study spot!',
    tags: ['Campus Life', 'Study Tips'],
    upvotes: 89,
    comments: 15,
    timestamp: '1d ago'
  }
];

interface Props {
  isDarkMode: boolean;
}

export function FeedTab({ isDarkMode }: Props) {
  const [votes, setVotes] = useState<{ [key: string]: number }>({});

  const handleVote = (postId: string, value: number) => {
    setVotes(prev => ({
      ...prev,
      [postId]: prev[postId] === value ? 0 : value
    }));
  };

  return (
    <div className="pb-8">
      {posts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
        >
          <div className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">{post.author.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    {post.author.college}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{post.timestamp}</span>
              </div>
            </div>

            <p className="text-gray-800 dark:text-gray-200 mb-3">{post.content}</p>

            {post.image && (
              <div className="mb-3 rounded-2xl overflow-hidden">
                <img
                  src={post.image}
                  alt="Post content"
                  className="w-full h-64 object-cover"
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-6 text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleVote(post.id, 1)}
                  className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                    votes[post.id] === 1 ? 'text-purple-600 dark:text-purple-400' : ''
                  }`}
                >
                  <ArrowBigUp className="w-5 h-5" fill={votes[post.id] === 1 ? 'currentColor' : 'none'} />
                </motion.button>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {post.upvotes + (votes[post.id] || 0)}
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleVote(post.id, -1)}
                  className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                    votes[post.id] === -1 ? 'text-pink-600 dark:text-pink-400' : ''
                  }`}
                >
                  <ArrowBigDown className="w-5 h-5" fill={votes[post.id] === -1 ? 'currentColor' : 'none'} />
                </motion.button>
              </div>

              <motion.button
                whileTap={{ scale: 0.9 }}
                className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{post.comments}</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
