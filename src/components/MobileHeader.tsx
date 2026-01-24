import { ArrowLeft, Heart, ShoppingBag, User, LayoutGrid, MessageCircle } from 'lucide-react';
import type { View } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

interface Props {
  currentView: View;
  onBack?: () => void;
  showBack?: boolean;
  onModeSwitch?: () => void;
  onDatingProfileClick?: () => void;
  showTooltip?: boolean;
  onTooltipDismiss?: () => void;
  onShopClick?: () => void;
  onShopBackToFeed?: () => void;
  onChatsClick?: () => void;
  onSearchClick?: () => void;
}

export function MobileHeader({ 
  currentView, 
  onBack, 
  showBack, 
  onModeSwitch, 
  onDatingProfileClick,
  showTooltip,
  onTooltipDismiss,
  onShopClick,
  onShopBackToFeed,
  onChatsClick,
  onSearchClick
}: Props) {
  const isDatingMode = currentView === 'dating';
  const isShopView = currentView === 'shop';

  if (currentView === 'profile' && showBack) {
    return (
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <div className="flex items-center gap-3">
            <button 
              onClick={onModeSwitch}
              className="p-2 hover:bg-gray-100 rounded-full relative"
            >
              <Heart className="w-6 h-6 text-gray-900" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#D4FF00] rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-lg">C</span>
          </div>
          <h1 className="text-xl font-bold text-black">CampusConnect</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Mode Switch Button - shows where you're GOING */}
          <div className="relative">
            <motion.button 
              onClick={() => {
                onModeSwitch?.();
                onTooltipDismiss?.();
              }}
              whileTap={{ scale: 0.95 }}
              className={`p-2 hover:bg-gray-100 rounded-full relative transition-all ${
                isDatingMode ? 'bg-transparent' : ''
              }`}
            >
              {isDatingMode ? (
                // In Dating Mode - show Grid icon to go back to Social
                <LayoutGrid className="w-6 h-6 text-gray-900" />
              ) : (
                // In Social Mode - show Heart icon to go to Dating
                <>
                  <Heart className="w-6 h-6 text-gray-900" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </>
              )}
            </motion.button>

            {/* Tooltip */}
            <AnimatePresence>
              {showTooltip && !isDatingMode && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full right-0 mt-2 px-3 py-2 bg-black text-white text-xs rounded-lg whitespace-nowrap shadow-lg"
                >
                  Switch to Dating
                  <div className="absolute -top-1 right-3 w-2 h-2 bg-black transform rotate-45" />
                </motion.div>
              )}
              {showTooltip && isDatingMode && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full right-0 mt-2 px-3 py-2 bg-black text-white text-xs rounded-lg whitespace-nowrap shadow-lg"
                >
                  Back to Social Feed
                  <div className="absolute -top-1 right-3 w-2 h-2 bg-black transform rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Icon - Grid in Shop Mode, Messages in Social Mode, Shop in Dating Mode */}
          {isShopView ? (
            <button 
              onClick={onShopBackToFeed}
              className="p-2 hover:bg-gray-100 rounded-full relative"
            >
              <LayoutGrid className="w-6 h-6 text-gray-900" />
            </button>
          ) : isDatingMode ? (
            <button 
              onClick={onShopClick}
              className="p-2 hover:bg-gray-100 rounded-full relative"
            >
              <ShoppingBag className="w-6 h-6 text-gray-900" />
            </button>
          ) : (
            <button 
              onClick={onChatsClick}
              className="p-2 hover:bg-gray-100 rounded-full relative"
            >
              <MessageCircle className="w-6 h-6 text-gray-900" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}