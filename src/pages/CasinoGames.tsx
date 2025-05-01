
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CasinoNavbar from '@/components/CasinoNavbar';
import { Button } from "@/components/ui/button";
import { getCurrentUser, isLoggedIn } from '@/utils/authUtils';
import { ArrowLeft } from 'lucide-react';
import SlotsGame from '@/components/games/SlotsGame';
import RouletteGame from '@/components/games/RouletteGame';
import BlackjackGame from '@/components/games/BlackjackGame';

const CasinoGames = () => {
  const navigate = useNavigate();
  const { gameType } = useParams<{ gameType: string }>();
  const [user, setUser] = useState(getCurrentUser());
  
  // Ensure user is logged in
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/');
    }
    
    // Update user data when page loads
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    
    // Set interval to periodically update user data (for coin balance)
    const interval = setInterval(() => {
      const updatedUser = getCurrentUser();
      if (updatedUser) {
        setUser(updatedUser);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [navigate]);

  // Render game component based on gameType
  const renderGame = () => {
    switch(gameType) {
      case 'slots':
        return <SlotsGame />;
      case 'roulette':
        return <RouletteGame />;
      case 'blackjack':
        return <BlackjackGame />;
      default:
        return (
          <div className="text-center p-10">
            <h2 className="text-2xl font-bold mb-4 gold-text">Game Not Found</h2>
            <p className="mb-6">The selected game could not be found.</p>
            <Button 
              className="casino-button"
              onClick={() => navigate('/dashboard')}
            >
              Return to Dashboard
            </Button>
          </div>
        );
    }
  };

  const getGameTitle = () => {
    switch(gameType) {
      case 'slots':
        return 'Slot Machine';
      case 'roulette':
        return 'Roulette';
      case 'blackjack':
        return 'Blackjack';
      default:
        return 'Unknown Game';
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <CasinoNavbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button 
              variant="outline"
              className="mr-4"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft size={16} className="mr-1" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold gold-text">{getGameTitle()}</h1>
              <p className="text-gray-400">Test your luck and win big!</p>
            </div>
          </div>
        </div>
        
        {/* Game content */}
        <div className="mb-12">
          {renderGame()}
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-casino-dark py-4 border-t border-casino-secondary mt-8">
        <div className="container mx-auto text-center text-sm text-gray-400">
          <p>&copy; 2025 ROYALE CASINO - All Rights Reserved</p>
          <p className="mt-1">For entertainment purposes only. No real money involved.</p>
        </div>
      </div>
    </div>
  );
};

export default CasinoGames;
