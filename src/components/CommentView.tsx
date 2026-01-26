import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Heart, MessageCircle, Send, MoreVertical } from 'lucide-react';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  likes: number;
  timestamp: string;
  isLiked?: boolean;
}

interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  location: string;
  timestamp: string;
  content: string;
  image: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
}

interface Props {
  post: Post;
  onBack: () => void;
}

const mockComments: Comment[] = [
  {
    id: '1',
    userId: '2',
    userName: 'Priya Sharma',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    text: 'This was absolutely fire! 🔥 Can\'t wait for Day 2!',
    likes: 24,
    timestamp: '2h ago',
    isLiked: true
  },
  {
    id: '2',
    userId: '3',
    userName: 'Rahul Verma',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    text: 'Lowkey the best performance of the night no cap 💯',
    likes: 18,
    timestamp: '1h ago'
  },
  {
    id: '3',
    userId: '4',
    userName: 'Ananya Joshi',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    text: 'The energy was immaculate! Main character vibes fr fr ✨',
    likes: 31,
    timestamp: '45m ago',
    isLiked: true
  },
  {
    id: '4',
    userId: '5',
    userName: 'Karan Singh',
    userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    text: 'Bet this is going viral! Everyone understood the assignment 🎭',
    likes: 12,
    timestamp: '30m ago'
  },
  {
    id: '5',
    userId: '6',
    userName: 'Diya Reddy',
    userAvatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
    text: 'Say less, I\'m attending tomorrow too! Who\'s coming? 🙋‍♀️',
    likes: 8,
    timestamp: '15m ago'
  }
];

export function CommentView({ post, onBack }: Props) {
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState('');
  const [postLiked, setPostLiked] = useState(post.isLiked || false);
  const [postLikes, setPostLikes] = useState(post.likes);

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        userId: 'current-user',
        userName: 'You',
        userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
        text: newComment,
        likes: 0,
        timestamp: 'Just now',
        isLiked: false
      };
      setComments([...comments, comment]);
      setNewComment('');
    }
  };

  const handleLikePost = () => {
    setPostLiked(!postLiked);
    setPostLikes(postLiked ? postLikes - 1 : postLikes + 1);
  };

  const handleLikeComment = (commentId: string) => {
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          isLiked: !comment.isLiked,
          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
        };
      }
      return comment;
    }));
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="font-bold text-lg">Comments</h2>
      </div>

      {/* Post */}
      <div className="border-b-8 border-gray-100">
        {/* Post Header */}
        <div className="flex items-start justify-between p-4 pb-3">
          <div className="flex items-center gap-3">
            <img
              src={post.userAvatar}
              alt={post.userName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-black">{post.userName}</h3>
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-xs text-gray-500">{post.location} • {post.timestamp}</p>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Post Image */}
        <img
          src={post.image}
          alt="Post"
          className="w-full object-cover"
          style={{ maxHeight: '400px' }}
        />

        {/* Post Actions */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleLikePost}
                className="flex items-center gap-2"
              >
                <Heart
                  className={`w-6 h-6 ${postLiked ? 'fill-red-500 text-red-500' : 'text-gray-900'}`}
                />
                <span className="font-semibold text-sm">{postLikes}</span>
              </motion.button>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-gray-900" />
                <span className="font-semibold text-sm">{comments.length}</span>
              </div>
            </div>
          </div>

          {/* Post Caption */}
          <p className="text-sm">
            <span className="font-semibold mr-2">{post.userName}</span>
            {post.content}
          </p>
        </div>
      </div>

      {/* Comments List */}
      <div className="px-4 py-4 space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No comments yet</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to drop a comment!</p>
          </div>
        ) : (
          comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex gap-3"
            >
              <img
                src={comment.userAvatar}
                alt={comment.userName}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1">
                <div className="bg-gray-100 rounded-2xl px-4 py-2.5">
                  <h4 className="font-semibold text-sm mb-1">{comment.userName}</h4>
                  <p className="text-sm text-gray-900">{comment.text}</p>
                </div>
                <div className="flex items-center gap-4 mt-2 px-2">
                  <span className="text-xs text-gray-500">{comment.timestamp}</span>
                  <button
                    onClick={() => handleLikeComment(comment.id)}
                    className={`text-xs font-semibold ${
                      comment.isLiked ? 'text-red-500' : 'text-gray-600'
                    }`}
                  >
                    {comment.likes > 0 ? `${comment.likes} likes` : 'Like'}
                  </button>
                  <button className="text-xs font-semibold text-gray-600">
                    Reply
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Comment Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400"
            alt="Your avatar"
            className="w-9 h-9 rounded-full object-cover"
          />
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddComment();
                }
              }}
              className="w-full py-2.5 pr-12 pl-4 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#D4FF00]"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 disabled:opacity-40"
            >
              <Send className="w-5 h-5 text-black" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
