import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Camera as CameraIcon, Image as ImageIcon, Sparkles, RotateCcw } from 'lucide-react';

interface Props {
  onClose: () => void;
  onCapture: (imageUrl: string) => void;
}

export function CameraView({ onClose, onCapture }: Props) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraMode, setCameraMode] = useState<'front' | 'back'>('front');

  const handleCapture = () => {
    // In a real app, this would capture from device camera
    // For demo, use a random Unsplash image
    const demoImages = [
      'https://images.unsplash.com/photo-1523438097201-512ae7d59c44?w=800',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
      'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800',
      'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800'
    ];
    const randomImage = demoImages[Math.floor(Math.random() * demoImages.length)];
    setCapturedImage(randomImage);
  };

  const handleGallery = () => {
    // In a real app, this would open device gallery
    const demoImages = [
      'https://images.unsplash.com/photo-1523438097201-512ae7d59c44?w=800',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
      'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800'
    ];
    const randomImage = demoImages[Math.floor(Math.random() * demoImages.length)];
    setCapturedImage(randomImage);
  };

  const handlePost = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleFlipCamera = () => {
    setCameraMode(prev => prev === 'front' ? 'back' : 'front');
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="relative w-full h-full max-w-md mx-auto">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4">
          <button
            onClick={onClose}
            className="p-2 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {!capturedImage && (
            <button
              onClick={handleFlipCamera}
              className="p-2 bg-black/50 backdrop-blur-sm hover:bg-black/70 rounded-full transition-colors"
            >
              <RotateCcw className="w-6 h-6 text-white" />
            </button>
          )}
        </div>

        {/* Camera/Preview Area */}
        <div className="relative w-full h-full bg-gray-900">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {/* Camera viewfinder simulation */}
              <div className="text-center">
                <CameraIcon className="w-24 h-24 text-white/30 mx-auto mb-4" />
                <p className="text-white/60 text-sm">Camera Preview</p>
                <p className="text-white/40 text-xs mt-1">In a real app, this would show your camera feed</p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-8 pt-4 bg-gradient-to-t from-black/80 to-transparent">
          {capturedImage ? (
            /* Post Controls */
            <div className="flex items-center justify-center gap-4 px-6">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleRetake}
                className="flex-1 py-3.5 bg-white/20 backdrop-blur-sm text-white rounded-2xl font-semibold transition-colors hover:bg-white/30"
              >
                Retake
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handlePost}
                className="flex-1 py-3.5 bg-[#D4FF00] text-black rounded-2xl font-semibold transition-colors hover:bg-[#c4ef00] flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Post Story
              </motion.button>
            </div>
          ) : (
            /* Capture Controls */
            <div className="flex items-center justify-center gap-8">
              <button
                onClick={handleGallery}
                className="p-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-2xl transition-colors"
              >
                <ImageIcon className="w-7 h-7 text-white" />
              </button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCapture}
                className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl"
              >
                <div className="w-16 h-16 bg-white border-4 border-black rounded-full" />
              </motion.button>

              <div className="w-16" /> {/* Spacer for symmetry */}
            </div>
          )}
        </div>

        {/* Story Creation Hint */}
        {!capturedImage && (
          <div className="absolute top-20 left-0 right-0 z-20 text-center px-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block bg-[#D4FF00] text-black px-4 py-2 rounded-full text-sm font-semibold"
            >
              Create your story ✨
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
