import { motion } from 'motion/react';

interface Props {
  onGetStarted: () => void;
}

export function OnboardingScreen({ onGetStarted }: Props) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#D4FF00] rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-lg">C</span>
          </div>
          <h1 className="text-xl font-bold text-black">CampusConnect</h1>
        </div>
        <button className="text-sm text-gray-600">Skip</button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-20">
        {/* Creative Collage */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-80 h-80 mb-12"
        >
          {/* Background circles */}
          <div className="absolute top-10 left-10 w-24 h-24 rounded-full bg-[#D4FF00]/20" />
          <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-purple-200/30" />
          
          {/* Main photo with follow button */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl">
                <img
                  src="https://i.pravatar.cc/200?img=8"
                  alt="Student"
                  className="w-full h-full object-cover"
                />
              </div>
              <button className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-[#D4FF00] text-black text-xs font-bold rounded-full shadow-lg">
                Follow
              </button>
            </div>
          </div>

          {/* Pink geometric shapes */}
          <div className="absolute top-20 right-8 w-28 h-28 bg-pink-400 transform rotate-12 rounded-2xl" />
          <div className="absolute top-32 right-4 w-24 h-24 bg-pink-300 transform -rotate-6 rounded-2xl" />

          {/* Additional profile photos */}
          <div className="absolute bottom-20 left-8 w-20 h-20 rounded-full overflow-hidden border-3 border-white shadow-lg">
            <img src="https://i.pravatar.cc/100?img=5" alt="Student" className="w-full h-full object-cover" />
          </div>
          <div className="absolute bottom-32 right-16 w-16 h-16 rounded-full overflow-hidden border-3 border-white shadow-lg">
            <img src="https://i.pravatar.cc/100?img=12" alt="Student" className="w-full h-full object-cover" />
          </div>

          {/* Decorative elements */}
          <div className="absolute top-8 right-20 text-2xl">✨</div>
          <div className="absolute bottom-8 left-12 text-2xl">💫</div>
          <div className="absolute top-40 left-4 w-3 h-3 bg-[#D4FF00] rounded-full" />
          <div className="absolute bottom-12 right-20 w-4 h-4 bg-purple-400 rounded-full" />
        </motion.div>

        {/* Text Content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-black mb-4 leading-tight">
            Best Social App to Make<br />New Friends
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed max-w-xs mx-auto">
            With CampusConnect you will find new friends from various colleges and events at ADYPU
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full space-y-4"
        >
          <button
            onClick={onGetStarted}
            className="w-full py-4 bg-[#D4FF00] text-black font-bold rounded-2xl text-base hover:bg-[#c4ef00] transition-colors shadow-lg"
          >
            Get Started
          </button>
          <button className="w-full text-gray-600 font-medium text-base">
            Login
          </button>
        </motion.div>
      </div>

      {/* Page Indicator */}
      <div className="flex justify-center gap-2 pb-8">
        <div className="w-8 h-1 bg-black rounded-full" />
        <div className="w-1 h-1 bg-gray-300 rounded-full" />
        <div className="w-1 h-1 bg-gray-300 rounded-full" />
      </div>
    </div>
  );
}
