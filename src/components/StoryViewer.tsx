import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Send } from 'lucide-react';

interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl: string;
  timestamp: string;
  views: number;
}

interface Props {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
  onProfileClick?: (userId: string) => void;
}

export function StoryViewer({ stories, initialIndex = 0, onClose, onProfileClick }: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentStory = stories[currentIndex];
  const storyDuration = 5000; // 5 seconds per story

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Move to next story
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            // All stories viewed, close
            onClose();
            return 100;
          }
        }
        return prev + (100 / (storyDuration / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, stories.length, isPaused, onClose]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="relative w-full max-w-md h-full bg-black">
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
          {stories.map((_, index) => (
            <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{
                  width: index === currentIndex ? `${progress}%` : index < currentIndex ? '100%' : '0%'
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-20 flex items-center justify-between px-4">
          <button
            onClick={() => onProfileClick?.(currentStory.userId)}
            className="flex items-center gap-2"
          >
            <img
              src={currentStory.userAvatar}
              alt={currentStory.userName}
              className="w-10 h-10 rounded-full object-cover border-2 border-white"
            />
            <div className="text-left">
              <p className="font-semibold text-white text-sm">{currentStory.userName}</p>
              <p className="text-xs text-white/80">{currentStory.timestamp}</p>
            </div>
          </button>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Story Content */}
        <div
          className="relative w-full h-full"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <img
            src={currentStory.mediaUrl}
            alt="Story"
            className="w-full h-full object-cover"
          />

          {/* Navigation Areas */}
          <button
            onClick={handlePrevious}
            className="absolute left-0 top-0 bottom-0 w-1/3"
            aria-label="Previous story"
          />
          <button
            onClick={handleNext}
            className="absolute right-0 top-0 bottom-0 w-1/3"
            aria-label="Next story"
          />
        </div>

        {/* Story Actions */}
        <div className="absolute bottom-4 left-0 right-0 px-4 z-20">
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-3">
            <input
              type="text"
              placeholder="Reply to story..."
              className="flex-1 bg-transparent text-white placeholder-white/60 text-sm focus:outline-none"
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
            />
            <button className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
              <Heart className="w-5 h-5 text-white" />
            </button>
            <button className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
