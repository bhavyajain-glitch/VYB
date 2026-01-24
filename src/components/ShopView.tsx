import { motion } from 'motion/react';
import { Coins, Sparkles, Zap, Crown, Star, Check } from 'lucide-react';
import { useState } from 'react';

interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  popular?: boolean;
  bonus?: number;
}

const coinPackages: CoinPackage[] = [
  {
    id: 'starter',
    coins: 50,
    price: 99,
  },
  {
    id: 'popular',
    coins: 150,
    price: 249,
    popular: true,
    bonus: 30
  },
  {
    id: 'premium',
    coins: 300,
    price: 449,
    bonus: 100
  },
  {
    id: 'mega',
    coins: 500,
    price: 699,
    bonus: 200
  }
];

interface Props {
  currentCoins: number;
  onPurchase: (coins: number) => void;
}

export function ShopView({ currentCoins, onPurchase }: Props) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const handlePurchase = (pkg: CoinPackage) => {
    setSelectedPackage(pkg.id);
    // Simulate purchase
    setTimeout(() => {
      const totalCoins = pkg.coins + (pkg.bonus || 0);
      onPurchase(totalCoins);
      setSelectedPackage(null);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-[#D4FF00] rounded-full flex items-center justify-center mx-auto mb-4">
            <Coins className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">Coin Shop</h1>
          <p className="text-gray-600">Get more coins to discover amazing people</p>
        </div>

        {/* Current Balance */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Your Balance</p>
              <p className="text-3xl font-bold text-black">{currentCoins} coins</p>
            </div>
            <div className="w-16 h-16 bg-[#D4FF00]/20 rounded-full flex items-center justify-center">
              <Coins className="w-8 h-8 text-black" />
            </div>
          </div>
        </div>
      </div>

      {/* Coin Packages */}
      <div className="px-4 space-y-3">
        <h2 className="text-lg font-semibold text-black mb-4">Choose a Package</h2>
        
        {coinPackages.map((pkg) => (
          <motion.div
            key={pkg.id}
            whileTap={{ scale: 0.98 }}
            className={`relative bg-white rounded-2xl p-5 border-2 transition-all ${
              pkg.popular 
                ? 'border-[#D4FF00] shadow-lg' 
                : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#D4FF00] rounded-full">
                <span className="text-xs font-bold text-black flex items-center gap-1">
                  <Star className="w-3 h-3" fill="black" />
                  MOST POPULAR
                </span>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  pkg.popular ? 'bg-[#D4FF00]' : 'bg-gray-100'
                }`}>
                  <Coins className={`w-7 h-7 ${pkg.popular ? 'text-black' : 'text-gray-600'}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-black">
                    {pkg.coins} 
                    {pkg.bonus && (
                      <span className="text-[#D4FF00] text-lg ml-1">+{pkg.bonus}</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">coins</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-black">₹{pkg.price}</p>
                {pkg.bonus && (
                  <p className="text-xs text-green-600 font-medium">Bonus included!</p>
                )}
              </div>
            </div>

            <motion.button
              onClick={() => handlePurchase(pkg)}
              disabled={selectedPackage === pkg.id}
              whileTap={{ scale: 0.95 }}
              className={`w-full py-3 rounded-full font-semibold transition-all ${
                selectedPackage === pkg.id
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : pkg.popular
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              {selectedPackage === pkg.id ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                  Processing...
                </span>
              ) : (
                'Purchase Now'
              )}
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* What can you do with coins */}
      <div className="px-4 mt-8 mb-6">
        <h3 className="text-lg font-semibold text-black mb-4">What can you do with coins?</h3>
        <div className="space-y-3">
          <FeatureItem
            icon={<Sparkles className="w-5 h-5 text-[#D4FF00]" />}
            title="Switch Your Vibe"
            description="Change your current match to someone new"
            coins="100 coins"
          />
          <FeatureItem
            icon={<Zap className="w-5 h-5 text-[#D4FF00]" />}
            title="Boost Your Profile"
            description="Get seen by more people (Coming Soon)"
            coins="50 coins"
          />
          <FeatureItem
            icon={<Crown className="w-5 h-5 text-[#D4FF00]" />}
            title="Premium Features"
            description="Unlock exclusive benefits (Coming Soon)"
            coins="200 coins/month"
          />
        </div>
      </div>

      {/* Safe & Secure */}
      <div className="px-4 mt-6">
        <div className="bg-green-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-4 h-4 text-white" strokeWidth={3} />
            </div>
            <div>
              <p className="font-semibold text-green-900 mb-1">Safe & Secure Payment</p>
              <p className="text-sm text-green-700">
                All transactions are encrypted and processed through secure payment gateways.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ 
  icon, 
  title, 
  description, 
  coins 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  coins: string;
}) {
  return (
    <div className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100">
      <div className="w-10 h-10 bg-[#D4FF00]/20 rounded-full flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-black mb-0.5">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-black">{coins}</p>
      </div>
    </div>
  );
}
