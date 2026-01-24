import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OnboardingScreen } from './components/OnboardingScreen';
import { AuthView } from './components/AuthView';
import { ProfileSetupView, type ProfileData } from './components/ProfileSetupView';
import { FeedView } from './components/FeedView';
import { ProfileView } from './components/ProfileView';
import { EventsView } from './components/EventsView';
import { PeopleView } from './components/PeopleView';
import { DatingView } from './components/DatingView';
import { ShopView } from './components/ShopView';
import { ChatListView } from './components/ChatListView';
import { CommentView } from './components/CommentView';
import { SearchView } from './components/SearchView';
import { StoryViewer } from './components/StoryViewer';
import { CameraView } from './components/CameraView';
import { MobileHeader } from './components/MobileHeader';
import { BottomNav } from './components/BottomNav';
import type { DatingTab } from './components/DatingBottomNav';

export type View = 'onboarding' | 'auth' | 'profileSetup' | 'feed' | 'profile' | 'events' | 'people' | 'messages' | 'dating' | 'shop' | 'chats' | 'comments' | 'search' | 'stories' | 'camera';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('onboarding');
  const [previousSocialView, setPreviousSocialView] = useState<View>('feed');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showDatingSettings, setShowDatingSettings] = useState(false);
  const [datingTab, setDatingTab] = useState<DatingTab>('vibe');
  const [showTooltip, setShowTooltip] = useState(false);
  const [coins, setCoins] = useState(150); // Global coin state
  const [currentMatch, setCurrentMatch] = useState<any>(null); // Current active match
  const [isNewUser, setIsNewUser] = useState(false); // Track if user is signing up
  const [selectedPost, setSelectedPost] = useState<any>(null); // For comments view
  const [showSearch, setShowSearch] = useState(false); // For search view
  const [selectedStoryUserId, setSelectedStoryUserId] = useState<string | null>(null); // For story viewer
  const [showCamera, setShowCamera] = useState(false); // For camera view
  const [joinedEvents, setJoinedEvents] = useState<string[]>([]); // Track joined events

  // Show tooltip on first load (simulating first-time user)
  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem('hasSeenModeTooltip');
    if (!hasSeenTooltip) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
      }, 1000);

      const dismissTimer = setTimeout(() => {
        setShowTooltip(false);
        localStorage.setItem('hasSeenModeTooltip', 'true');
      }, 4000);

      return () => {
        clearTimeout(timer);
        clearTimeout(dismissTimer);
      };
    }
  }, []);

  const handleGetStarted = () => {
    setCurrentView('auth');
  };

  const handleLoginSuccess = () => {
    // User logs in, go directly to feed
    setCurrentView('feed');
  };

  const handleSignupSuccess = () => {
    // New user signup, show profile setup
    setIsNewUser(true);
    setCurrentView('profileSetup');
  };

  const handleProfileSetupComplete = (profileData: ProfileData) => {
    // Save profile data (in real app, send to backend)
    console.log('Profile setup complete:', profileData);
    setCurrentView('feed');
  };

  const handleCommentClick = (post: any) => {
    // Convert post format to match CommentView expectations
    const formattedPost = {
      id: post.id,
      userId: post.author.username,
      userName: post.author.name,
      userAvatar: post.author.avatar,
      location: 'Ankara',
      timestamp: post.timestamp,
      content: post.caption,
      image: post.image || '',
      likes: post.likes,
      comments: post.comments,
      isLiked: false
    };
    setSelectedPost(formattedPost);
    setCurrentView('comments');
  };

  const handleCommentsBack = () => {
    setCurrentView(previousSocialView);
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    if (view === 'profile') {
      setSelectedProfileId('current-user');
    }
    // Store last social view for returning from dating
    if (view !== 'dating' && view !== 'shop') {
      setPreviousSocialView(view);
    }
  };

  const handleProfileClick = (profileId: string) => {
    setSelectedProfileId(profileId);
    setCurrentView('profile');
  };

  const handleBack = () => {
    setCurrentView(previousSocialView);
  };

  const handleModeSwitch = () => {
    if (currentView === 'dating') {
      // Going back to social mode
      setCurrentView(previousSocialView);
    } else {
      // Going to dating mode
      setCurrentView('dating');
      setDatingTab('vibe'); // Reset to default tab
    }
  };

  const handleDatingProfileClick = () => {
    setShowDatingSettings(true);
  };

  const handleTooltipDismiss = () => {
    setShowTooltip(false);
    localStorage.setItem('hasSeenModeTooltip', 'true');
  };

  const handleShopClick = () => {
    setCurrentView('shop');
  };

  const handleShopBackToFeed = () => {
    setCurrentView('feed');
  };

  const handleChatsClick = () => {
    setCurrentView('chats');
  };

  const handleCoinPurchase = (purchasedCoins: number) => {
    setCoins(prev => prev + purchasedCoins);
    // Show success message (you could add a toast notification here)
    setTimeout(() => {
      setCurrentView(previousSocialView); // Return to previous view
    }, 500);
  };

  const handleMatchSwitch = (newMatch: any, cost: number) => {
    if (coins >= cost) {
      setCoins(prev => prev - cost);
      setCurrentMatch(newMatch);
      setDatingTab('vibe'); // Switch to "My Vibe" tab to show the new match
      return true;
    }
    return false;
  };

  const handleCameraClick = () => {
    setShowCamera(true);
  };

  const handleCameraClose = () => {
    setShowCamera(false);
  };

  const handleStoryCapture = (imageUrl: string) => {
    // In a real app, upload to backend
    console.log('Story captured:', imageUrl);
    setShowCamera(false);
    // Could show success message here
  };

  const handleStoryClick = (userId: string) => {
    setSelectedStoryUserId(userId);
  };

  const handleStoryClose = () => {
    setSelectedStoryUserId(null);
  };

  const handleSearchClick = () => {
    setShowSearch(true);
  };

  const handleSearchClose = () => {
    setShowSearch(false);
  };

  const handleJoinEvent = (eventId: string) => {
    setJoinedEvents(prev => [...prev, eventId]);
  };

  if (currentView === 'onboarding') {
    return <OnboardingScreen onGetStarted={handleGetStarted} />;
  }

  if (currentView === 'auth') {
    return (
      <AuthView
        onLoginSuccess={handleLoginSuccess}
        onSignupSuccess={handleSignupSuccess}
      />
    );
  }

  if (currentView === 'profileSetup') {
    return <ProfileSetupView onComplete={handleProfileSetupComplete} />;
  }

  const isDatingMode = currentView === 'dating';

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile App Container */}
      <div className="max-w-md mx-auto min-h-screen bg-white relative">
        {/* Header */}
        <MobileHeader 
          currentView={currentView}
          onBack={handleBack}
          showBack={currentView === 'profile' && selectedProfileId !== 'current-user'}
          onModeSwitch={handleModeSwitch}
          onDatingProfileClick={handleDatingProfileClick}
          showTooltip={showTooltip}
          onTooltipDismiss={handleTooltipDismiss}
          onShopClick={handleShopClick}
          onShopBackToFeed={handleShopBackToFeed}
          onChatsClick={handleChatsClick}
        />

        {/* Main Content with Transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isDatingMode ? 'dating' : 'social'}
            initial={{ opacity: 0, x: isDatingMode ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isDatingMode ? -20 : 20 }}
            transition={{ duration: 0.2 }}
            className={isDatingMode || currentView === 'shop' ? 'pb-4' : 'pb-20'}
          >
            {currentView === 'feed' && (
              <FeedView 
                onProfileClick={handleProfileClick} 
                onCommentClick={handleCommentClick}
                onStoryClick={handleStoryClick}
                onCameraClick={handleCameraClick}
                onSearchClick={handleSearchClick}
              />
            )}
            {currentView === 'profile' && <ProfileView profileId={selectedProfileId || 'current-user'} onBack={handleBack} />}
            {currentView === 'events' && (
              <EventsView 
                joinedEvents={joinedEvents}
                onJoinEvent={handleJoinEvent}
              />
            )}
            {currentView === 'people' && <PeopleView onProfileClick={handleProfileClick} />}
            {currentView === 'messages' && (
              <div className="flex items-center justify-center h-screen">
                <p className="text-gray-500">Messages coming soon...</p>
              </div>
            )}
            {currentView === 'dating' && (
              <DatingView 
                onProfileClick={handleProfileClick}
                onShowSettings={() => setShowDatingSettings(true)}
                activeTab={datingTab}
                onTabChange={setDatingTab}
                coins={coins}
                currentMatch={currentMatch}
                onMatchSwitch={handleMatchSwitch}
                onShopClick={handleShopClick}
              />
            )}
            {currentView === 'shop' && (
              <ShopView 
                currentCoins={coins}
                onPurchase={handleCoinPurchase}
              />
            )}
            {currentView === 'chats' && (
              <ChatListView />
            )}
            {currentView === 'comments' && (
              <CommentView post={selectedPost} onBack={handleCommentsBack} />
            )}
            {currentView === 'search' && (
              <SearchView />
            )}
            {currentView === 'stories' && (
              <StoryViewer />
            )}
            {currentView === 'camera' && (
              <CameraView />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Bottom Navigation - Only show in Social Mode */}
        {!isDatingMode && currentView !== 'shop' && currentView !== 'chats' && currentView !== 'comments' && (
          <BottomNav 
            currentView={currentView}
            onViewChange={handleViewChange}
          />
        )}

        {/* Overlays */}
        {showSearch && (
          <SearchView 
            onClose={handleSearchClose}
            onProfileClick={handleProfileClick}
          />
        )}

        {selectedStoryUserId && (
          <StoryViewer
            stories={[
              {
                id: '1',
                userId: '1',
                userName: 'Riya Patel',
                userAvatar: 'https://i.pravatar.cc/150?img=1',
                mediaUrl: 'https://images.unsplash.com/photo-1523438097201-512ae7d59c44?w=800',
                timestamp: '2h ago',
                views: 124
              },
              {
                id: '2',
                userId: '1',
                userName: 'Riya Patel',
                userAvatar: 'https://i.pravatar.cc/150?img=1',
                mediaUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
                timestamp: '1h ago',
                views: 89
              }
            ]}
            onClose={handleStoryClose}
            onProfileClick={handleProfileClick}
          />
        )}

        {showCamera && (
          <CameraView
            onClose={handleCameraClose}
            onCapture={handleStoryCapture}
          />
        )}
      </div>
    </div>
  );
}