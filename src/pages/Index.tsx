
import { useEffect } from 'react';
import AuthForm from '@/components/AuthForm';
import { isLoggedIn } from '@/utils/authUtils';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (isLoggedIn()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-casino-dark bg-opacity-70 z-10"></div>
        
        <div className="absolute inset-0 bg-casino-pattern opacity-10 z-0"></div>
        
        <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center h-full relative z-20">
          {/* Logo & Intro */}
          <div className="text-center mb-10 animate-fade-in">
            <h1 className="text-6xl font-bold mb-4 neon-text tracking-tight">
              ROYALE CASINO
            </h1>
            <p className="text-xl mb-6 max-w-2xl mx-auto text-gray-300">
              Experience the thrill of Las Vegas from anywhere. Play exclusive games, win big, and cash out your winnings instantly.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center bg-black bg-opacity-50 px-4 py-2 rounded-full">
                <span className="text-casino-secondary mr-2">✓</span>
                <span className="text-sm">Exclusive Games</span>
              </div>
              <div className="flex items-center bg-black bg-opacity-50 px-4 py-2 rounded-full">
                <span className="text-casino-secondary mr-2">✓</span>
                <span className="text-sm">Free Daily Credits</span>
              </div>
              <div className="flex items-center bg-black bg-opacity-50 px-4 py-2 rounded-full">
                <span className="text-casino-secondary mr-2">✓</span>
                <span className="text-sm">Big Jackpots</span>
              </div>
            </div>
          </div>
          
          {/* Auth Form */}
          <div className="w-full max-w-md">
            <AuthForm />
          </div>
        </div>
        
        {/* Animated chips background */}
        <div className="hidden md:block absolute bottom-0 left-0 w-full pointer-events-none z-0">
          <div className="relative h-20">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="absolute w-10 h-10 rounded-full border-2 border-casino-secondary animate-bounce"
                style={{
                  left: `${10 + i * 15}%`,
                  bottom: `${10 + (i % 3) * 5}px`,
                  backgroundColor: i % 2 === 0 ? '#FF0000' : '#000000',
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: `${0.8 + (i % 3) * 0.2}s`,
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-casino-dark py-4 border-t border-casino-secondary">
        <div className="container mx-auto text-center text-sm text-gray-400">
          <p>&copy; 2025 ROYALE CASINO - All Rights Reserved</p>
          <p className="mt-1">For entertainment purposes only. No real money involved.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
