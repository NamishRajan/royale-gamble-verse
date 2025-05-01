
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, isLoggedIn } from '@/utils/authUtils';
import CasinoNavbar from '@/components/CasinoNavbar';
import GameCard from '@/components/GameCard';
import ProfileModal from '@/components/ProfileModal';
import { CASINO_GAMES } from '@/utils/gameUtils';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

const Dashboard = () => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState(getCurrentUser());
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/');
    }
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <CasinoNavbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold gold-text">Welcome, {user.profile.username}!</h1>
            <p className="text-gray-400">Try your luck today with our exciting casino games.</p>
          </div>
          
          <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
            <DialogTrigger asChild>
              <Button className="casino-button">
                <Settings className="mr-2 h-4 w-4" />
                Profile
              </Button>
            </DialogTrigger>
            <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
          </Dialog>
        </div>
        
        {/* Featured Game */}
        <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-casino-primary to-casino-dark mb-8 border-2 border-casino-secondary glow-card">
          <div className="absolute inset-0 bg-black opacity-60"></div>
          <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center md:items-start">
            <div className="w-full md:w-3/5 mb-6 md:mb-0 md:pr-8">
              <h2 className="text-2xl md:text-4xl font-bold text-casino-secondary mb-2">Lucky 777 Slots</h2>
              <p className="text-gray-300 text-lg mb-4">Hit the jackpot with our most popular slot machine game!</p>
              <p className="text-gray-400 mb-6">Play now to win up to 5,000 coins with our progressive jackpot system. Three 7's in a row and the big prize is yours!</p>
              <Button className="casino-button text-lg px-8 py-6">Play Featured Game</Button>
            </div>
            
            <div className="w-full md:w-2/5 flex justify-center">
              <div className="bg-black border-4 border-casino-secondary rounded-lg p-4 max-w-xs">
                <div className="grid grid-cols-3 gap-2 bg-gray-800 p-4 rounded">
                  <div className="aspect-square rounded bg-gray-900 flex items-center justify-center text-4xl text-casino-secondary">7</div>
                  <div className="aspect-square rounded bg-gray-900 flex items-center justify-center text-4xl text-casino-secondary">7</div>
                  <div className="aspect-square rounded bg-gray-900 flex items-center justify-center text-4xl text-casino-secondary">7</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Games Grid */}
        <h2 className="text-2xl font-bold mb-4 gold-text">Popular Games</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          {CASINO_GAMES.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
        
        <div className="text-center mb-8">
          <Button 
            className="casino-button text-lg" 
            onClick={() => navigate('/minigames')}
          >
            Need More Coins? Play Mini-Games
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

export default Dashboard;
