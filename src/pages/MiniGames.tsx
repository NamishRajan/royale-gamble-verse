
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn } from '@/utils/authUtils';
import CasinoNavbar from '@/components/CasinoNavbar';
import MiniGameCard from '@/components/MiniGameCard';
import { MINI_GAMES } from '@/utils/gameUtils';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from "lucide-react";

const MiniGames = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/');
    }
  }, [navigate]);

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
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold gold-text">Mini Games</h1>
              <p className="text-gray-400">Play mini games to earn additional coins!</p>
            </div>
          </div>
        </div>
        
        {/* Info Card */}
        <div className="bg-muted p-4 rounded-lg mb-8 border border-casino-secondary">
          <h3 className="text-lg font-medium mb-2">How It Works</h3>
          <p className="text-gray-400 mb-2">
            Select a mini game below to play and earn coins based on your performance.
            Different difficulty levels offer different rewards!
          </p>
          <ul className="list-disc pl-5 text-gray-400">
            <li>Easy games: Lower difficulty but smaller rewards</li>
            <li>Medium games: Balanced difficulty and rewards</li>
            <li>Hard games: Challenging gameplay with higher rewards</li>
          </ul>
        </div>
        
        {/* Mini Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          {MINI_GAMES.map((miniGame) => (
            <MiniGameCard key={miniGame.id} miniGame={miniGame} />
          ))}
        </div>
        
        {/* Return to Casino Button */}
        <div className="text-center mt-8">
          <Button 
            className="casino-button text-lg"
            onClick={() => navigate('/dashboard')}
          >
            Return to Casino
          </Button>
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

export default MiniGames;
