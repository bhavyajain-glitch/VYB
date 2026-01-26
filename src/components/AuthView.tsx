import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Phone, Lock } from 'lucide-react';

type AuthMode = 'login' | 'signup';
type AuthStep = 'phone' | 'otp';

interface Props {
  onLoginSuccess: () => void;
  onSignupSuccess: () => void;
}

export function AuthView({ onLoginSuccess, onSignupSuccess }: Props) {
  const [mode, setMode] = useState<AuthMode>('signup');
  const [step, setStep] = useState<AuthStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = () => {
    if (phoneNumber.length === 10) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        setStep('otp');
      }, 1000);
    }
  };

  const handleVerifyOTP = () => {
    const otpString = otp.join('');
    if (otpString.length === 6) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setIsLoading(false);
        if (mode === 'login') {
          onLoginSuccess();
        } else {
          onSignupSuccess();
        }
      }, 1000);
    }
  };

  const handleResendOTP = () => {
    setIsLoading(true);
    // Simulate resend
    setTimeout(() => {
      setIsLoading(false);
      alert('OTP resent successfully! 📱');
    }, 1000);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D4FF00] via-[#e8ff66] to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back Button */}
        {step === 'otp' && (
          <button
            onClick={() => {
              setStep('phone');
              setOtp(['', '', '', '', '', '']);
            }}
            className="mb-4 flex items-center gap-2 text-gray-700 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        )}

        {/* Auth Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-14 h-14 bg-[#D4FF00] rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-black text-black">C</span>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-center text-black mb-2">
            {mode === 'login' ? 'Welcome back!' : 'Join the vibe'}
          </h2>
          <p className="text-center text-gray-600 mb-8">
            {step === 'phone' 
              ? 'Enter your phone number to get started'
              : 'Enter the OTP sent to your phone'}
          </p>

          {/* Mode Tabs */}
          <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-full">
            <button
              onClick={() => {
                setMode('signup');
                setStep('phone');
                setPhoneNumber('');
                setOtp(['', '', '', '', '', '']);
              }}
              className={`flex-1 py-2.5 rounded-full font-semibold text-sm transition-all ${
                mode === 'signup'
                  ? 'bg-black text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => {
                setMode('login');
                setStep('phone');
                setPhoneNumber('');
                setOtp(['', '', '', '', '', '']);
              }}
              className={`flex-1 py-2.5 rounded-full font-semibold text-sm transition-all ${
                mode === 'login'
                  ? 'bg-black text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Log In
            </button>
          </div>

          {/* Phone Input Step */}
          {step === 'phone' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="Enter 10 digit number"
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 10) {
                        setPhoneNumber(value);
                      }
                    }}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-2 border-gray-200 focus:border-[#D4FF00] focus:outline-none text-lg font-medium"
                    maxLength={10}
                  />
                </div>
              </div>

              <button
                onClick={handleSendOTP}
                disabled={phoneNumber.length !== 10 || isLoading}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold text-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {isLoading ? 'Sending...' : 'Send OTP'}
              </button>

              {mode === 'signup' && (
                <p className="text-center text-sm text-gray-600 mt-6">
                  Already have an account?{' '}
                  <button
                    onClick={() => setMode('login')}
                    className="text-black font-semibold hover:underline"
                  >
                    Log in here
                  </button>
                </p>
              )}
              {mode === 'login' && (
                <p className="text-center text-sm text-gray-600 mt-6">
                  Don't have an account?{' '}
                  <button
                    onClick={() => setMode('signup')}
                    className="text-black font-semibold hover:underline"
                  >
                    Sign up here
                  </button>
                </p>
              )}
            </motion.div>
          )}

          {/* OTP Input Step */}
          {step === 'otp' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                  Sent to +91 {phoneNumber}
                </label>
                <div className="flex gap-2 justify-center mb-4">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold bg-gray-50 rounded-xl border-2 border-gray-200 focus:border-[#D4FF00] focus:outline-none"
                      maxLength={1}
                    />
                  ))}
                </div>
                <button
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="w-full text-center text-sm text-gray-600 hover:text-black font-medium disabled:opacity-50"
                >
                  Didn't receive? <span className="font-bold">Resend OTP</span>
                </button>
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={otp.join('').length !== 6 || isLoading}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold text-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}
