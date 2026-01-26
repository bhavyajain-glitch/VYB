import { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, User, Calendar, FileText, Sparkles } from 'lucide-react';

interface Props {
  onComplete: (profileData: ProfileData) => void;
}

export interface ProfileData {
  name: string;
  age: number;
  bio: string;
  profilePhoto: string;
  events: string[];
}

const availableEvents = [
  'Unwind 2026',
  'Tech Fest 2026',
  'Cultural Fest',
  'Sports Day',
  'Music Night',
  'Art Exhibition',
  'Dance Competition',
  'Hackathon',
  'Film Screening',
  'Food Festival'
];

export function ProfileSetupView({ onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [showEventDropdown, setShowEventDropdown] = useState(false);

  const totalSteps = 2;

  const handleEventToggle = (event: string) => {
    setSelectedEvents(prev =>
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  const handlePhotoUpload = () => {
    // In a real app, this would open file picker
    // For now, use a placeholder
    const placeholderPhotos = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
    ];
    setProfilePhoto(placeholderPhotos[Math.floor(Math.random() * placeholderPhotos.length)]);
  };

  const canProceedStep1 = name.trim() !== '' && age !== '' && parseInt(age) >= 17 && parseInt(age) <= 100;
  const canComplete = canProceedStep1; // Bio and photo are optional

  const handleContinue = () => {
    if (currentStep === 1 && canProceedStep1) {
      setCurrentStep(2);
    } else if (currentStep === 2 && canComplete) {
      onComplete({
        name,
        age: parseInt(age),
        bio,
        profilePhoto,
        events: selectedEvents
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D4FF00] via-[#e8ff66] to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm font-semibold text-gray-700">
              {Math.round((currentStep / totalSteps) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-white/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-black rounded-full"
            />
          </div>
        </div>

        {/* Setup Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#D4FF00] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-black" />
            </div>
            <h2 className="text-3xl font-bold text-black mb-2">
              {currentStep === 1 ? 'Set up your profile' : 'Almost there!'}
            </h2>
            <p className="text-gray-600">
              {currentStep === 1 
                ? 'Let\'s get to know you better' 
                : 'Tell us more about yourself (optional)'}
            </p>
          </div>

          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-[#D4FF00] focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Age <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    placeholder="Your age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min="17"
                    max="100"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-[#D4FF00] focus:outline-none font-medium"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-1">Must be 17 or older</p>
              </div>

              <button
                onClick={handleContinue}
                disabled={!canProceedStep1}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold text-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl mt-6"
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* Step 2: Additional Info */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              {/* Profile Photo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Profile Photo
                </label>
                <div className="flex items-center gap-4">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <button
                    onClick={handlePhotoUpload}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-sm transition-colors"
                  >
                    {profilePhoto ? 'Change Photo' : 'Upload Photo'}
                  </button>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bio
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <textarea
                    placeholder="Tell us something cool about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    maxLength={200}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-[#D4FF00] focus:outline-none font-medium resize-none"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-1 text-right">
                  {bio.length}/200
                </p>
              </div>

              {/* Events Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Events You're Attending
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowEventDropdown(!showEventDropdown)}
                    className="w-full px-4 py-4 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-[#D4FF00] text-left font-medium flex items-center justify-between"
                  >
                    <span className={selectedEvents.length === 0 ? 'text-gray-400' : 'text-black'}>
                      {selectedEvents.length === 0
                        ? 'Select events'
                        : `${selectedEvents.length} event${selectedEvents.length > 1 ? 's' : ''} selected`}
                    </span>
                    <motion.svg
                      animate={{ rotate: showEventDropdown ? 180 : 0 }}
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </motion.svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showEventDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute z-10 w-full mt-2 bg-white rounded-2xl border-2 border-gray-200 shadow-xl max-h-60 overflow-y-auto"
                    >
                      {availableEvents.map((event) => (
                        <button
                          key={event}
                          onClick={() => handleEventToggle(event)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between border-b border-gray-100 last:border-b-0"
                        >
                          <span className="font-medium text-gray-900">{event}</span>
                          {selectedEvents.includes(event) && (
                            <div className="w-5 h-5 bg-[#D4FF00] rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>

                {/* Selected Events Display */}
                {selectedEvents.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedEvents.map((event) => (
                      <span
                        key={event}
                        className="px-3 py-1.5 bg-[#D4FF00] rounded-full text-xs font-semibold text-black"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-lg transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleContinue}
                  disabled={!canComplete}
                  className="flex-1 py-4 bg-black text-white rounded-2xl font-bold text-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  Complete
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
