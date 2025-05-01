
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Game } from '@/utils/gameUtils';

interface GameCardProps {
  game: Game;
}

const GameCard = ({ game }: GameCardProps) => {
  const navigate = useNavigate();
  
  const getGameRoute = (gameType: string) => {
    switch(gameType) {
      case 'slots':
        return 'slots';
      case 'blackjack':
        return 'blackjack';
      case 'roulette':
        return 'roulette';
      case 'poker':
        return 'poker';
      case 'craps':
        return 'craps';
      default:
        return 'slots';
    }
  };
  
  const handlePlayNow = () => {
    // Navigate to the appropriate game route
    navigate(`/games/${getGameRoute(game.type)}`);
  };

  return (
    <Card className="casino-card overflow-hidden group hover:transform hover:scale-105 transition-all duration-300">
      <div className="relative h-48 bg-gradient-to-r from-purple-900 to-blue-900 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        
        {game.isNew && (
          <div className="absolute top-0 right-0 bg-casino-secondary text-casino-dark font-bold text-xs py-1 px-3">
            NEW
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-300 font-bold">Min: {game.minBet}</span>
            <span className="text-gray-300">|</span>
            <span className="text-yellow-300 font-bold">Max: {game.maxBet}</span>
          </div>
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl gold-text">{game.name}</CardTitle>
      </CardHeader>
      
      <CardContent className="pb-3">
        <p className="text-gray-300 h-12">{game.description}</p>
        
        <div className="mt-4 flex items-center">
          <div className="flex-1">
            <div className="flex items-center">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-red-500 to-casino-secondary h-2 rounded-full" 
                  style={{width: `${game.popularity}%`}}
                ></div>
              </div>
              <span className="ml-2 text-sm text-gray-400">{game.popularity}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Popularity</p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          className="casino-button w-full"
          onClick={handlePlayNow}
        >
          Play Now
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GameCard;
