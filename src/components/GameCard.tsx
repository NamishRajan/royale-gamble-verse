
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Game } from "@/utils/gameUtils";
import { useToast } from "@/components/ui/use-toast";
import { getCurrentUser, updateCoins } from "@/utils/authUtils";
import { addGameHistory } from "@/utils/gameUtils";

interface GameCardProps {
  game: Game;
}

const GameCard = ({ game }: GameCardProps) => {
  const { toast } = useToast();
  
  const handlePlayGame = () => {
    const user = getCurrentUser();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to play.",
        variant: "destructive",
      });
      return;
    }
    
    if (user.profile.coins < game.minBet) {
      toast({
        title: "Insufficient Funds",
        description: `You need at least ${game.minBet} coins to play this game.`,
        variant: "destructive",
      });
      return;
    }
    
    // Simple game simulation
    const bet = game.minBet;
    const randomOutcome = Math.random();
    
    let winnings = 0;
    let resultMessage = "";
    
    if (randomOutcome > 0.6) {
      // Win
      winnings = Math.floor(bet * (1 + Math.random() * 2)); // 1x to 3x
      updateCoins(winnings);
      resultMessage = `You won ${winnings} coins!`;
    } else {
      // Lose
      updateCoins(-bet);
      resultMessage = `You lost ${bet} coins. Better luck next time!`;
    }
    
    // Record game history
    if (user) {
      addGameHistory(user.username, {
        gameId: game.id,
        gameName: game.name,
        bet: bet,
        outcome: winnings - bet,
        timestamp: Date.now()
      });
    }
    
    toast({
      title: `Playing ${game.name}`,
      description: resultMessage
    });
  };
  
  return (
    <Card className="casino-card h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg gold-text">{game.name}</CardTitle>
          {game.isNew && <Badge className="bg-green-600">NEW</Badge>}
        </div>
        <CardDescription>{game.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow pb-2">
        <div className="relative h-40 mb-3 overflow-hidden rounded-md bg-gradient-to-br from-casino-primary to-black">
          <img
            src={game.image}
            alt={game.name}
            className="object-cover w-full h-full opacity-60"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold text-casino-secondary drop-shadow-lg">
              {game.type.charAt(0).toUpperCase() + game.type.slice(1)}
            </span>
          </div>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span>Min Bet: <span className="font-bold">{game.minBet}</span></span>
          <span>Max Bet: <span className="font-bold">{game.maxBet}</span></span>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button onClick={handlePlayGame} className="casino-button w-full">
          Play Now
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GameCard;
